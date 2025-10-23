import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/export-bookings-json?type=completed|manual|cancelled
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get('type') || 'completed').toLowerCase();
    const type = (['completed', 'manual', 'cancelled'] as const).includes(typeParam as any)
      ? (typeParam as 'completed' | 'manual' | 'cancelled')
      : 'completed';

    let bookings: any[] = [];

    // Safe JSON reader that tolerates empty/missing files and supports both array and { records: [] } shapes
    const fs = require('fs').promises;
    const path = require('path');
    const safeReadJsonArray = async (fileName: string): Promise<any[]> => {
      try {
        const jsonFilePath = path.join(process.cwd(), 'data', 'exports', fileName);
        const fileContent = await fs.readFile(jsonFilePath, 'utf8').catch((err: any) => {
          if (err && err.code === 'ENOENT') return '';
          throw err;
        });
        const trimmed = (fileContent || '').trim();
        if (!trimmed) return [];
        const data = JSON.parse(trimmed);
        return Array.isArray(data) ? data : (Array.isArray((data as any)?.records) ? (data as any).records : []);
      } catch (err: any) {
        console.error('❌ Failed to read JSON file:', fileName, err);
        return [];
      }
    };
    
    if (type === 'completed') {
      bookings = await safeReadJsonArray('completed-bookings.json');
      console.log(`📊 Fetched ${bookings.length} completed bookings from JSON`);
    } else if (type === 'manual') {
      bookings = await safeReadJsonArray('manual-bookings.json');
      console.log(`📊 Fetched ${bookings.length} manual bookings from JSON`);
    } else if (type === 'cancelled') {
      bookings = await safeReadJsonArray('cancelled-bookings.json');
      console.log(`📊 Fetched ${bookings.length} cancelled bookings from JSON`);
    }

    return NextResponse.json({
      success: true,
      bookings: bookings,
      type: type,
      count: bookings.length
    });

  } catch (error) {
    console.error('❌ Error in export-bookings-json API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings from JSON files',
      bookings: []
    }, { status: 500 });
  }
}
