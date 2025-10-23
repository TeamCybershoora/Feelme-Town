import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import { ExcelExportService } from '@/lib/excel-export';

// GET /api/admin/export-bookings?type=completed|manual|cancelled
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get('type') || 'completed').toLowerCase();
    const type = (['completed', 'manual', 'cancelled'] as const).includes(typeParam as any)
      ? (typeParam as 'completed' | 'manual' | 'cancelled')
      : 'completed';

    // Fetch bookings based on type
    const allBookingsResult = await database.getAllBookings();
    const allBookings = allBookingsResult.bookings || [];

    let bookings: any[] = [];
    if (type === 'completed') {
      // Fetch completed bookings from JSON file
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');
        
        const fileContent = await fs.readFile(jsonFilePath, 'utf8');
        bookings = JSON.parse(fileContent);
        console.log(`📊 Fetched ${bookings.length} completed bookings from JSON`);
      } catch (err) {
        console.error('❌ Failed to read completed JSON file:', err);
        bookings = [];
      }
    } else if (type === 'manual') {
      // Fetch manual bookings from JSON file
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
        
        const fileContent = await fs.readFile(jsonFilePath, 'utf8');
        const manualBookingsData = JSON.parse(fileContent);
        bookings = manualBookingsData.records || [];
        console.log(`📊 Fetched ${bookings.length} manual bookings from JSON`);
      } catch (err) {
        console.error('❌ Failed to read manual JSON file:', err);
        bookings = [];
      }
    } else if (type === 'cancelled') {
      // Fetch cancelled bookings from JSON file
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
        
        const fileContent = await fs.readFile(jsonFilePath, 'utf8');
        bookings = JSON.parse(fileContent);
        console.log(`📊 Fetched ${bookings.length} cancelled bookings from JSON`);
      } catch (err) {
        console.error('❌ Failed to read cancelled JSON file:', err);
        bookings = [];
      }
    }

    // Generate Excel buffer
    let buffer: Buffer;
    if (type === 'completed') {
      buffer = await ExcelExportService.exportCompletedBookings(bookings);
    } else if (type === 'manual') {
      buffer = await ExcelExportService.exportManualBookings(bookings);
    } else {
      buffer = await ExcelExportService.exportCancelledBookings(bookings);
    }

    // Save/update excelRecords metadata (best-effort)
    try {
      const filename = `${type}_bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
      await (database as any).saveExcelRecord?.({
        type,
        filename,
        totalRecords: bookings.length,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch {}

    // Return file response
    const filename = `${type}_bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to export bookings' },
      { status: 500 }
    );
  }
}


