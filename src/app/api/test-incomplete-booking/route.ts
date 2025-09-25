import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

// POST /api/test-incomplete-booking - Test incomplete booking creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 Testing incomplete booking creation with data:', body);
    
    // Create test incomplete booking
    const incompleteBooking = db.createIncompleteBooking({
      name: body.name || 'Test User',
      email: body.email || 'test@example.com',
      phone: body.phone || '1234567890',
      theaterName: body.theaterName || 'Test Theater',
      date: body.date || '2024-01-01',
      time: body.time || '10:00 AM',
      occasion: body.occasion || 'Test Occasion',
      selectedCakes: body.selectedCakes || [],
      selectedDecorItems: body.selectedDecorItems || [],
      selectedGifts: body.selectedGifts || [],
      totalAmount: body.totalAmount || 1000
    });

    console.log('✅ Test incomplete booking created:', incompleteBooking.id);

    // Get all incomplete bookings to verify
    const allIncompleteBookings = db.getIncompleteBookings();
    
    // Get database info
    const dbInfo = db.getDatabaseInfo();

    return NextResponse.json({
      success: true,
      message: 'Test incomplete booking created successfully!',
      testBooking: incompleteBooking,
      allIncompleteBookings,
      databaseInfo: dbInfo,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error creating test incomplete booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test incomplete booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/test-incomplete-booking - Get test data
export async function GET() {
  try {
    const allIncompleteBookings = db.getIncompleteBookings();
    const dbInfo = db.getDatabaseInfo();
    
    console.log('📊 Test data retrieved:', {
      incompleteBookings: allIncompleteBookings.length,
      dbInfo
    });

    return NextResponse.json({
      success: true,
      incompleteBookings: allIncompleteBookings,
      databaseInfo: dbInfo,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error retrieving test data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve test data'
      },
      { status: 500 }
    );
  }
}
