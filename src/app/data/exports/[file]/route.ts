import { NextRequest, NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';

// GET /data/exports/[file]
export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  try {
    const resolvedParams = await params;
    const rawName = resolvedParams.file || '';
    // Only allow *.json files
    const safeName = rawName.endsWith('.json') ? rawName : `${rawName}.json`;

    // Limit to simple filenames to avoid path traversal
    if (safeName.includes('/') || safeName.includes('..')) {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 });
    }

    const data = await ExportsStorage.readRaw(safeName);
    if (!data) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read export JSON' }, { status: 500 });
  }
}
