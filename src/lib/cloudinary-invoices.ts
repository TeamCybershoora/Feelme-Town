import crypto from 'crypto';
import FormData from 'form-data';
import database from '@/lib/db-connect';

/**
 * Upload an invoice PDF buffer to Cloudinary as a raw file with signed parameters.
 */
interface CloudinaryInvoiceUpload {
  secureUrl?: string;
  inlineUrl?: string;
}

export async function uploadInvoiceToCloudinary(
  filename: string,
  pdfBuffer: Buffer
): Promise<CloudinaryInvoiceUpload> {
  try {
    // Basic buffer + PDF sanity checks
    if (!pdfBuffer?.length) {
      console.warn('[Cloudinary] Empty PDF buffer, skipping upload');
      return {};
    }

    const pdfHeader = pdfBuffer.subarray(0, 4).toString('ascii');
    if (pdfHeader !== '%PDF') {
      console.error('[Cloudinary] Invoice buffer is not a PDF, aborting upload');
      return {};
    }

    // Use node-fetch explicitly in Node runtime
    const fetch = (await import('node-fetch')).default as unknown as typeof globalThis.fetch;

    // Load Cloudinary settings from DB (preferred) and fall back to env vars
    const settings = await database.getSettings().catch(() => null as any);

    const cloudName =
      settings?.cloudinaryCloudName ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      '';

    const apiKey =
      settings?.cloudinaryApiKey ||
      process.env.CLOUDINARY_API_KEY ||
      '';

    const apiSecret =
      settings?.cloudinaryApiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      '';

    const baseFolder =
      settings?.cloudinaryFolder ||
      process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ||
      'feelmetown';

    console.log('[Cloudinary] Resolved credentials source:', {
      fromSettings: {
        hasCloudName: !!settings?.cloudinaryCloudName,
        hasApiKey: !!settings?.cloudinaryApiKey,
        hasApiSecret: !!settings?.cloudinaryApiSecret,
        folder: settings?.cloudinaryFolder,
      },
      fromEnv: {
        nextPublicCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'set' : undefined,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : undefined,
        apiKey: process.env.CLOUDINARY_API_KEY ? 'set' : undefined,
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'set' : undefined,
        folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER,
      },
      resolved: {
        cloudName,
        apiKey: apiKey ? 'set' : undefined,
        apiSecret: apiSecret ? 'set' : undefined,
        baseFolder,
      },
    });
    const folder = `${baseFolder.replace(/\/$/, '')}/invoices`;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('[Cloudinary] Cloudinary credentials not fully configured, skipping upload', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      });
      return {};
    }

    const publicId = filename.replace(/\.pdf$/i, '');
    const timestamp = Math.round(Date.now() / 1000);

    // Signed params for raw upload
    const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename,
      contentType: 'application/pdf',
    });
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData as any,
      headers: (formData as any).getHeaders?.() || undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Cloudinary] Invoice upload failed', { status: res.status, data });
      return {};
    }

    if (data.secure_url) {
      const secureUrl = data.secure_url as string;
      const inlineUrl = secureUrl; // Use direct URL for both inline preview and download

      console.log('[Cloudinary] Uploaded invoice PDF', {
        secureUrl,
        inlineUrl,
        publicId: data.public_id,
      });
      return { secureUrl, inlineUrl };
    }

    console.warn('[Cloudinary] Upload response did not contain secure_url', data);
    return {};
  } catch (error) {
    console.error('[Cloudinary] Error while uploading invoice PDF', error);
    return {};
  }
}
