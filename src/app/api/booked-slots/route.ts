import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const theaterName = searchParams.get('theater');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get all bookings from main booking collection
    const result = await database.getAllBookings();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    const allBookings = result.bookings || [];
    
    // Also get incomplete bookings (they might be temporarily blocking slots)
    const incompleteResult = await database.getAllIncompleteBookings();
    const incompleteBookings = incompleteResult.success ? incompleteResult.incompleteBookings || [] : [];

    // Combine all bookings (main + incomplete)
    const combinedBookings = [...allBookings, ...incompleteBookings];

    // Filter bookings for the specific date and theater
    const bookedSlots = combinedBookings.filter((booking) => {
      const bookingData = booking as Record<string, unknown>;
      const matchesDate = bookingData.date === date;
      const matchesStatus = ['completed', 'pending', 'incomplete', 'manual', 'confirmed'].includes(bookingData.status as string);
      const matchesTheater = !theaterName || bookingData.theaterName === theaterName;
      
      // Debug log for each booking being checked
      if (matchesDate && matchesTheater) {
        
      }
      
      return matchesDate && matchesStatus && matchesTheater;
    });

    // Extract time slots from booked slots
    const bookedTimeSlots = bookedSlots.map((booking) => (booking as Record<string, unknown>).time);

    

    // Debug: Show exact time format from database
    if (bookedTimeSlots.length > 0) {
      
    }

    return NextResponse.json({
      success: true,
      bookedTimeSlots,
      totalBookings: bookedSlots.length
    });

  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booked slots' },
      { status: 500 }
    );
  }
}

