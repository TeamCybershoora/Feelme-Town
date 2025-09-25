import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
      incompleteBookingId,
    } = await request.json();

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified successfully, now save booking
    const result = await database.saveBooking(bookingData);

    if (result.success && result.booking) {
      // If this was completing an incomplete booking, delete the incomplete one
      if (incompleteBookingId) {
        console.log('🔄 Completing incomplete booking:', incompleteBookingId);
        const deleteResult = await database.deleteIncompleteBooking(incompleteBookingId);
        if (deleteResult.success) {
          console.log('🗑️ Deleted incomplete booking:', incompleteBookingId);
        } else {
          console.log('⚠️ Failed to delete incomplete booking:', deleteResult.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and booking confirmed successfully!',
        bookingId: result.booking.id,
        booking: result.booking,
        paymentId: razorpay_payment_id,
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
