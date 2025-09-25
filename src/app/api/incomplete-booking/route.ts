import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/incomplete-booking - Save incomplete booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required' 
        },
        { status: 400 }
      );
    }

    // Save incomplete booking to MongoDB
    const result = await database.saveIncompleteBooking({
      name: body.name,
      email: body.email,
      phone: body.phone,
      theaterName: body.theaterName,
      date: body.date,
      time: body.time,
      occasion: body.occasion,
      numberOfPeople: body.numberOfPeople || 2,
      selectedCakes: body.selectedCakes,
      selectedDecorItems: body.selectedDecorItems,
      selectedGifts: body.selectedGifts,
      totalAmount: body.totalAmount
    });

    if (result.success && result.booking) {
      console.log('📝 Incomplete booking created:', result.booking.id);

      return NextResponse.json({
        success: true,
        message: 'Incomplete booking saved successfully!',
        bookingId: result.booking.id,
        expiresAt: result.booking.expiresAt,
        database: 'FeelME Town MongoDB',
        collection: 'incomplete_booking'
      }, { status: 200 });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error creating incomplete booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save incomplete booking' 
      },
      { status: 500 }
    );
  }
}

// GET /api/incomplete-booking - Get all incomplete bookings (with automatic cleanup)
export async function GET() {
  try {
    // Always clean up expired bookings first
    const cleanupResult = await database.deleteExpiredIncompleteBookings();
    const deletedCount = cleanupResult.deletedCount || 0;
    
    // Get all remaining incomplete bookings
    const result = await database.getAllIncompleteBookings();
    
    if (result.success) {
      console.log(`📊 Retrieved ${result.total} incomplete bookings, deleted ${deletedCount} expired`);

      return NextResponse.json({
        success: true,
        incompleteBookings: result.incompleteBookings,
        deletedExpiredCount: deletedCount,
        totalCount: result.total,
        database: 'FeelME Town MongoDB',
        collection: 'incomplete_booking',
        message: deletedCount > 0 ? `Cleaned up ${deletedCount} expired bookings` : 'No expired bookings to clean'
      }, { status: 200 });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error retrieving incomplete bookings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve incomplete bookings' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/incomplete-booking - Clean up expired bookings manually
export async function DELETE() {
  try {
    const result = await database.deleteExpiredIncompleteBookings();
    const deletedCount = result.deletedCount || 0;
    
    console.log(`🗑️ Manual cleanup: Deleted ${deletedCount} expired incomplete bookings`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} expired incomplete bookings`,
      deletedCount,
      database: 'FeelME Town MongoDB',
      collection: 'incomplete_booking',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error cleaning up expired bookings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clean up expired bookings' 
      },
      { status: 500 }
    );
  }
}
