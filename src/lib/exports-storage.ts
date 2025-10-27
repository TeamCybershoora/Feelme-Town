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
    console.log(`📖 Reading ${fileName} from storage...`);
    
    // 1) Try FS first
    try {
      const filePath = path.join(DATA_DIR, fileName);
      const raw = await fs.readFile(filePath, 'utf8').catch(() => '');
      const trimmed = (raw || '').trim();
      if (trimmed) {
        console.log(`✅ Successfully read ${fileName} from file system: ${filePath}`);
        return JSON.parse(trimmed);
      }
    } catch (error) {
      console.log(`⚠️ Failed to read ${fileName} from file system:`, error instanceof Error ? error.message : String(error));
    }

    // 2) Try Blob (currently disabled)
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
      console.log(`ℹ️ Blob storage disabled, using file system only`);
    }

    console.log(`❌ ${fileName} not found in any storage`);
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

  // Generic write raw JSON (replaces)
  async writeRaw(fileName: string, data: any): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    console.log(`📝 Writing ${fileName} to file system...`);

    // FS write (dev/local)
    try {
      await ensureDir();
      const filePath = path.join(DATA_DIR, fileName);
      await fs.writeFile(filePath, json, 'utf8');
      console.log(`✅ Successfully wrote ${fileName} to ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to write ${fileName} to file system:`, error instanceof Error ? error.message : String(error));
    }

    // Blob mirror (prod) - currently disabled
    if (isBlobEnabled()) {
      try {
        const blobApi = await dynamicBlob();
        if (blobApi && blobApi.put) {
          const key = `data/exports/${fileName}`;
          await blobApi.put(key, json, {
            access: 'public',
            contentType: 'application/json',
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          console.log(`✅ Successfully wrote ${fileName} to blob storage`);
        }
      } catch (error) {
        console.error(`❌ Failed to write ${fileName} to blob storage:`, error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log(`ℹ️ Blob storage disabled, using file system only`);
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
    const arr = await this.readArray(fileName);
    arr.push(record);
    await this.writeArray(fileName, arr);
  },

  async removeManualByBookingId(bookingId: string, fileName = 'manual-bookings.json'): Promise<void> {
    const manual = await this.readManual(fileName);
    manual.records = manual.records.filter((r: any) => (r.bookingId || r.id) !== bookingId);
    manual.total = manual.records.length;
    manual.generatedAt = new Date().toISOString();
    await this.writeManual(fileName, manual);
  }
};
