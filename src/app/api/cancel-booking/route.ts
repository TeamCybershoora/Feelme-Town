import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/cancel-booking - Cancel booking and process refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { bookingId, email, reason } = body;
    
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

    // Update status in booking collection, then delete the booking
    const statusResult = await database.updateBookingStatus(bookingId, 'cancelled');
    if (!statusResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: statusResult.error || 'Failed to update booking status'
        },
        { status: 500 }
      );
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
      let records: any[] = [];
      try {
        const raw = await fs.readFile(jsonFilePath, 'utf8');
        const trimmed = (raw || '').trim();
        if (trimmed) {
          const parsed = JSON.parse(trimmed);
          records = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.records) ? parsed.records : []);
        }
      } catch {}
      const record = {
        bookingId: booking.bookingId || booking.id || booking._id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        theaterName: booking.theaterName,
        date: booking.date,
        time: booking.time,
        occasion: booking.occasion,
        numberOfPeople: booking.numberOfPeople,
        advancePayment: Math.round((booking.totalAmount || 0) * 0.25),
        venuePayment: Math.round((booking.totalAmount || 0) * 0.75),
        totalAmount: booking.totalAmount,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: (typeof reason === 'string' && reason.trim()) ? reason.trim() : 'Cancelled by Customer'
      };
      await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
      records.push(record);
      await fs.writeFile(jsonFilePath, JSON.stringify(records, null, 2), 'utf8');
    } catch {}

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


    // Send cancellation email
    try {
      const emailService = await import('@/lib/email-service');
      await emailService.default.sendBookingCancelled({
        id: booking.bookingId || '',
        name: booking.name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        theaterName: booking.theaterName || '',
        date: booking.date || '',
        time: booking.time || '',
        occasion: booking.occasion || '',
        numberOfPeople: booking.numberOfPeople || 0,
        totalAmount: booking.totalAmount || 0,
        refundAmount: refundAmount,
        refundStatus: refundStatus,
        cancelledAt: new Date()
      });
      
    } catch (emailError) {
      
    }

    // TODO: Integrate with payment gateway for actual refund processing
    // For now, we'll just log the refund details
    if (refundAmount > 0) {
      
    }

    // Refresh excelRecords metadata for cancelled type
    try {
      await fetch(`${request.nextUrl.origin}/api/admin/refresh-excel-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cancelled' })
      });
      console.log('✅ Excel records refreshed for cancelled bookings');
    } catch (syncError) {
      console.error('⚠️ Failed to refresh Excel records:', syncError);
      // Don't fail the cancellation if refresh fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      bookingId: booking.bookingId || booking._id || booking.id,
      refundAmount: refundAmount,
      refundStatus: refundStatus,
      refundMessage: refundAmount > 0 
        ? `Refund of ₹${refundAmount} will be processed within 5-7 business days`
        : 'No refund applicable as per cancellation policy',
      hoursUntilBooking: Math.round(hoursUntilBooking),
      cancelledAt: new Date().toISOString(),
      database: 'FeelME Town',
      collection: 'booking'
    }, { status: 200 });

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel booking. Please try again.' 
      },
      { status: 500 }
    );
  }
}

