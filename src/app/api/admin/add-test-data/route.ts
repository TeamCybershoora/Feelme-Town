import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/admin/add-test-data - Add test bookings to populate counters
export async function POST() {
  try {
    
    
    // Initialize counters first
    await database.initializeCounters();
    
    const testBookings = [
      // Online bookings (confirmed status)
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '9876543210',
        theaterName: 'FMT-Hall-1 (EROS)',
        date: 'Friday, October 3, 2025',
        time: '07:30 PM - 10:30 PM',
        occasion: 'Birthday Party',
        numberOfPeople: 4,
        totalAmount: 2500,
        status: 'confirmed',
        birthdayName: 'Rahul'
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        phone: '9876543211',
        theaterName: 'FMT-Hall-2 (PHILIA)',
        date: 'Friday, October 3, 2025',
        time: '04:00 PM - 07:00 PM',
        occasion: 'Anniversary',
        numberOfPeople: 2,
        totalAmount: 3200,
        status: 'confirmed',
        partner1Name: 'Priya',
        partner2Name: 'Amit'
      },
      // Completed bookings
      {
        name: 'Amit Kumar',
        email: 'amit@example.com',
        phone: '9876543212',
        theaterName: 'FMT-Hall-3 (PRAGMA)',
        date: 'Thursday, October 2, 2025',
        time: '12:30 PM - 03:30 PM',
        occasion: 'Date Night',
        numberOfPeople: 2,
        totalAmount: 4500,
        status: 'completed',
        dateNightName: 'Amit & Sneha'
      }
    ];

    const manualBookings = [
      // Manual bookings
      {
        name: 'Sneha Gupta',
        email: 'sneha@example.com',
        phone: '9876543213',
        theaterName: 'FMT-Hall-4 (STORGE)',
        date: 'Friday, October 3, 2025',
        time: '09:00 AM - 12:00 PM',
        occasion: 'Marriage Proposal',
        numberOfPeople: 2,
        totalAmount: 5500,
        status: 'confirmed',
        proposerName: 'Vikash',
        proposalPartnerName: 'Sneha'
      }
    ];

    const results = [];

    // Add regular bookings
    for (const booking of testBookings) {
      const result = await database.saveBooking(booking);
      results.push({ type: 'regular', success: result.success, id: result.booking?.id });
    }

    // Add manual bookings
    for (const booking of manualBookings) {
      const result = await database.saveManualBooking(booking);
      results.push({ type: 'manual', success: result.success, id: result.booking?.id });
    }

    // Get updated counter values
    const countersResult = await database.getAllCounters();

    return NextResponse.json({
      success: true,
      message: 'Test data added successfully',
      results,
      counters: countersResult.counters || {}
    });
    
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add test data' 
      },
      { status: 500 }
    );
  }
}

