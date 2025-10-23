import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'completed';
    
    let bookings: any[] = [];
    
    // Fetch data based on type
    const allBookings = (await database.getAllBookings()).bookings || [];
    
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

    // Return JSON data for client-side PDF generation
    return NextResponse.json({
      success: true,
      bookings,
      type,
      total: bookings.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching bookings for PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings data' },
      { status: 500 }
    );
  }
}
