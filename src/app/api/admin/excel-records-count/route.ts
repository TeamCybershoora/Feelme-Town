import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/excel-records-count
// Fetch record counts from JSON files
export async function GET(request: NextRequest) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const records = [];
    
    // Completed bookings count
    try {
      const completedPath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');
      const completedData = await fs.readFile(completedPath, 'utf8');
      const completedBookings = JSON.parse(completedData);
      records.push({
        _id: 'completed',
        type: 'completed',
        filename: 'completed_bookings.xlsx',
        totalRecords: completedBookings.length,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      records.push({
        _id: 'completed',
        type: 'completed',
        filename: 'completed_bookings.xlsx',
        totalRecords: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Manual bookings count (from JSON file)
    try {
      const manualPath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
      const manualData = await fs.readFile(manualPath, 'utf8');
      const manualBookings = JSON.parse(manualData);
      const manualCount = manualBookings.records?.length || 0;
      records.push({
        _id: 'manual',
        type: 'manual',
        filename: 'manual_bookings.xlsx',
        totalRecords: manualCount,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      records.push({
        _id: 'manual',
        type: 'manual',
        filename: 'manual_bookings.xlsx',
        totalRecords: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Cancelled bookings count
    try {
      const cancelledPath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
      const cancelledData = await fs.readFile(cancelledPath, 'utf8');
      const cancelledBookings = JSON.parse(cancelledData);
      records.push({
        _id: 'cancelled',
        type: 'cancelled',
        filename: 'cancelled_bookings.xlsx',
        totalRecords: cancelledBookings.length,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      records.push({
        _id: 'cancelled',
        type: 'cancelled',
        filename: 'cancelled_bookings.xlsx',
        totalRecords: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({
      success: true,
      records
    });
    
  } catch (error) {
    console.error('❌ Error fetching excel records count:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch records count'
    }, { status: 500 });
  }
}

