import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/cancel-booking - Cancel booking and process refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { bookingId, email } = body;
    
    if (!bookingId || !email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: bookingId and email' 
        },
        { status: 400 }
      );
    }

    // Get booking details from database
    const bookingResult = await database.getBookingById(bookingId);
    
    if (!bookingResult.success || !bookingResult.booking) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking not found' 
        },
        { status: 404 }
      );
    }

    const booking = bookingResult.booking;

    // Verify email matches
    if (booking.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email does not match booking' 
        },
        { status: 403 }
      );
    }

    // Check if booking is already cancelled (optional check since we're deleting)
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking is already cancelled' 
        },
        { status: 400 }
      );
    }

    // Calculate refund amount based on 72-hour policy
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    let refundStatus = 'non-refundable';
    
    if (hoursUntilBooking > 72) {
      // Full refund of advance payment (25% of total)
      refundAmount = Math.round(booking.totalAmount * 0.25);
      refundStatus = 'refundable';
    }

    // Delete booking from database
    const deleteResult = await database.deleteBooking(bookingId);
    
    if (!deleteResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: deleteResult.error || 'Failed to delete booking' 
        },
        { status: 500 }
      );
    }

    // Log deletion
    console.log('✅ Booking deleted successfully:', {
      bookingId: booking.id,
      customerName: booking.name,
      theater: booking.theaterName,
      date: booking.date,
      time: booking.time,
      totalAmount: booking.totalAmount,
      refundAmount: refundAmount,
      refundStatus: refundStatus,
      hoursUntilBooking: Math.round(hoursUntilBooking)
    });

    // TODO: Integrate with payment gateway for actual refund processing
    // For now, we'll just log the refund details
    if (refundAmount > 0) {
      console.log('💰 Refund to be processed:', {
        bookingId: booking.id,
        customerEmail: booking.email,
        refundAmount: refundAmount,
        refundMethod: 'Original payment method',
        processingTime: '5-7 business days'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      bookingId: booking.id,
      refundAmount: refundAmount,
      refundStatus: refundStatus,
      refundMessage: refundAmount > 0 
        ? `Refund of ₹${refundAmount} will be processed within 5-7 business days`
        : 'No refund applicable as per cancellation policy',
      hoursUntilBooking: Math.round(hoursUntilBooking)
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel booking. Please try again.' 
      },
      { status: 500 }
    );
  }
}
