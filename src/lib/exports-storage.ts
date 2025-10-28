// Exports storage adapter: uses Vercel Blob in production, filesystem in dev/local
// Avoids static import of '@vercel/blob' to prevent local type resolution issues.

import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'exports');

const isBlobEnabled = () => {
  // Enable blob storage if token is available
  return !!process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL === '1' || process.env.VERCEL === 'true';
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function dynamicBlob() {
  try {
    // Use dynamic import via Function constructor to avoid bundler static analysis
    const mod = await (Function('return import("@vercel/blob")'))();
    return mod as any;
  } catch {
    return null;
  }
}

function asArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

export const ExportsStorage = {
  // Generic read raw JSON from storage
  async readRaw(fileName: string): Promise<any | null> {
    console.log(`📖 Reading ${fileName} from blob storage...`);
    
    // Only use Blob Storage (no file system fallback)
    if (isBlobEnabled()) {
      try {
        const blobApi = await dynamicBlob();
        if (blobApi && blobApi.list) {
          const key = `data/exports/${fileName}`;
          const token = process.env.BLOB_READ_WRITE_TOKEN;
          const listRes = await blobApi.list({ prefix: key, token });
          const blob = listRes?.blobs?.find((b: any) => b.pathname === key || b.key === key || b.name === key) || listRes?.blobs?.[0];
          const url = blob?.url;
          if (url) {
            const r = await fetch(url);
            if (r.ok) {
              const txt = await r.text();
              const trimmed = (txt || '').trim();
              if (trimmed) {
                console.log(`✅ Successfully read ${fileName} from blob storage`);
                return JSON.parse(trimmed);
              }
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Failed to read ${fileName} from blob storage:`, error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log(`❌ Blob storage not enabled - cannot read ${fileName}`);
    }
    try {
      await ensureDir();
      const fullPath = path.join(DATA_DIR, fileName);
      const txt = await fs.readFile(fullPath, 'utf8');
      const trimmed = (txt || '').trim();
      if (trimmed) {
        console.log(`✅ Successfully read ${fileName} from filesystem`);
        return JSON.parse(trimmed);
      }
    } catch {}

    console.log(`❌ ${fileName} not found in blob storage`);
    return null;
  },

  // Read array-oriented JSON ([] or {records: []})
  async readArray(fileName: string): Promise<any[]> {
    const raw = await this.readRaw(fileName);
    return asArray(raw);
  },

  // Read manual JSON object (with records array)
  async readManual(fileName = 'manual-bookings.json'): Promise<{ type: string; generatedAt: string; total: number; records: any[] }> {
    const raw = await this.readRaw(fileName);
    if (raw && typeof raw === 'object') {
      const records = Array.isArray((raw as any).records) ? (raw as any).records : asArray(raw);
      return {
        type: (raw as any).type || 'manual',
        generatedAt: (raw as any).generatedAt || new Date().toISOString(),
        total: Number((raw as any).total ?? records.length),
        records
      };
    }
    return { type: 'manual', generatedAt: new Date().toISOString(), total: 0, records: [] };
  },

  // Generic write raw JSON (replaces) - with overwrite to prevent multiple files
  async writeRaw(fileName: string, data: any): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    console.log(`📝 Writing ${fileName} to blob storage (overwrite mode)...`);

    // Only use Blob Storage (no file system backup)
    if (isBlobEnabled()) {
      try {
        const blobApi = await dynamicBlob();
        if (blobApi && blobApi.put) {
          const key = `data/exports/${fileName}`;
          
          // First, try to delete existing file to prevent duplicates
          try {
            const listRes = await blobApi.list({ prefix: key, token: process.env.BLOB_READ_WRITE_TOKEN });
            const existingBlob = listRes?.blobs?.find((b: any) => b.pathname === key || b.key === key || b.name === key);
            if (existingBlob && existingBlob.url && blobApi.del) {
              await blobApi.del(existingBlob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
              console.log(`🗑️ Deleted existing ${fileName} to prevent duplicates`);
            }
          } catch (deleteError) {
            console.log(`⚠️ Could not delete existing ${fileName} (may not exist):`, deleteError instanceof Error ? deleteError.message : String(deleteError));
          }
          
          // Now write the new file
          await blobApi.put(key, json, {
            access: 'public',
            contentType: 'application/json',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false // Prevent random suffix to maintain same filename
          });
          console.log(`✅ Successfully wrote ${fileName} to blob storage (single file)`);
        }
      } catch (error) {
        console.error(`❌ Failed to write ${fileName} to blob storage:`, error instanceof Error ? error.message : String(error));
        throw error; // Re-throw to handle the error properly
      }
    } else {
      await ensureDir();
      const fullPath = path.join(DATA_DIR, fileName);
      await fs.writeFile(fullPath, json, 'utf8');
      console.log(`✅ Successfully wrote ${fileName} to filesystem`);
      return;
    }
  },

  async writeArray(fileName: string, records: any[]): Promise<void> {
    await this.writeRaw(fileName, records);
  },

  async writeManual(fileName: string, manualObj: { type: string; generatedAt: string; total: number; records: any[] }): Promise<void> {
    const payload = {
      type: manualObj.type || 'manual',
      generatedAt: manualObj.generatedAt || new Date().toISOString(),
      total: Number(manualObj.total ?? (manualObj.records?.length || 0)),
      records: Array.isArray(manualObj.records) ? manualObj.records : []
    };
    await this.writeRaw(fileName, payload);
  },

  async appendToArray(fileName: string, record: any): Promise<void> {
    console.log(`🔄 Appending to ${fileName}:`, JSON.stringify(record, null, 2));
    
    // First cleanup any duplicate files to ensure single file
    await this.cleanupDuplicateFiles(fileName);
    
    // Read existing array
    const arr = await this.readArray(fileName);
    console.log(`📊 Current ${fileName} has ${arr.length} records`);
    
    // Add new record with unique ID to prevent duplicates
    const recordWithId = {
      ...record,
      _appendId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      _appendedAt: new Date().toISOString()
    };
    
    arr.push(recordWithId);
    console.log(`📊 After append, ${fileName} will have ${arr.length} records`);
    
    // Write back with overwrite to ensure single file
    console.log(`📝 Writing updated ${fileName} (single file mode with cleanup)`);
    await this.writeArray(fileName, arr);
    console.log(`✅ Successfully appended to ${fileName} - Entry #${arr.length} added to single file`);
  },

  async removeManualByBookingId(bookingId: string, fileName = 'manual-bookings.json'): Promise<void> {
    const manual = await this.readManual(fileName);
    manual.records = manual.records.filter((r: any) => (r.bookingId || r.id) !== bookingId);
    manual.total = manual.records.length;
    manual.generatedAt = new Date().toISOString();
    await this.writeManual(fileName, manual);
  },

  // Special function for pricing.json - ensures single file with updates
  async updatePricing(pricingData: any): Promise<void> {
    const fileName = 'pricing.json';
    console.log(`💰 Updating pricing.json with new data`);
    
    try {
      // Always write the complete pricing data (replace, don't append)
      const pricingPayload = {
        type: 'pricing',
        lastUpdated: new Date().toISOString(),
        version: Date.now(), // Version for tracking updates
        data: pricingData
      };
      
      await this.writeRaw(fileName, pricingPayload);
      console.log(`✅ Pricing.json updated successfully`);
    } catch (error) {
      console.error(`❌ Failed to update pricing.json:`, error);
      throw error;
    }
  },

  // Read pricing data
  async readPricing(): Promise<any> {
    const fileName = 'pricing.json';
    console.log(`💰 Reading pricing.json`);
    
    try {
      const raw = await this.readRaw(fileName);
      console.log(`💰 Raw pricing JSON:`, raw);
      
      if (raw && raw.data) {
        console.log(`✅ Pricing data loaded successfully from data field`);
        return raw.data;
      } else if (raw && (raw.slotBookingFee !== undefined || raw.extraGuestFee !== undefined)) {
        // Handle direct pricing format (legacy)
        console.log(`✅ Pricing data loaded successfully from direct format`);
        return raw;
      }
      
      // Return null if file doesn't exist - no static defaults
      console.log(`⚠️ Pricing.json not found, returning null`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to read pricing.json:`, error);
      return null;
    }
  },

  // Cleanup duplicate files - removes all files with same prefix except the latest
  async cleanupDuplicateFiles(fileName: string): Promise<void> {
    if (!isBlobEnabled()) {
      console.log(`❌ Blob storage not enabled - cannot cleanup ${fileName}`);
      return;
    }

    try {
      const blobApi = await dynamicBlob();
      if (!blobApi || !blobApi.list) return;

      const key = `data/exports/${fileName}`;
      const listRes = await blobApi.list({ prefix: key, token: process.env.BLOB_READ_WRITE_TOKEN });
      const blobs = listRes?.blobs || [];
      
      if (blobs.length <= 1) {
        console.log(`✅ No duplicate files found for ${fileName}`);
        return;
      }

      // Sort by uploadedAt to keep the latest
      const sortedBlobs = blobs.sort((a: any, b: any) => 
        new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      );

      // Keep the first (latest) and delete the rest
      const toDelete = sortedBlobs.slice(1);
      console.log(`🧹 Found ${toDelete.length} duplicate files for ${fileName}, cleaning up...`);

      for (const blob of toDelete) {
        try {
          if (blob.url && blobApi.del) {
            await blobApi.del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            console.log(`🗑️ Deleted duplicate: ${blob.pathname || blob.key || blob.name}`);
          }
        } catch (deleteError) {
          console.error(`❌ Failed to delete duplicate:`, deleteError);
        }
      }

      console.log(`✅ Cleanup completed for ${fileName}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup duplicates for ${fileName}:`, error);
    }
  }
};
