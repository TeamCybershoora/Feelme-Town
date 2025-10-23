import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { bookingData } = await request.json();
    
    if (!bookingData || !bookingData.email) {
      return NextResponse.json(
        { success: false, error: 'Booking data with email is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Test Email with Attachment - Sending booking confirmation email to:', bookingData.email);
    console.log('📧 Test booking data:', JSON.stringify(bookingData, null, 2));

    // Send the booking confirmation email with PDF attachment
    const emailResult = await emailService.sendBookingComplete(bookingData);

    if (emailResult.success) {
      console.log('✅ Test email with PDF attachment sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Test booking confirmation email with PDF attachment sent successfully!',
        emailSentTo: bookingData.email,
        bookingId: bookingData.id,
        messageId: emailResult.messageId
      });
    } else {
      console.error('❌ Failed to send test email with attachment:', emailResult.error);
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send test email with attachment'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test Email with Attachment API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error while sending test email with attachment'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test Email with Attachment API - Use POST method to send test booking confirmation email with PDF attachment',
    usage: {
      method: 'POST',
      endpoint: '/api/test-email-with-attachment',
      body: {
        bookingData: {
          email: 'your-email@example.com (required)',
          name: 'Customer Name',
          id: 'Booking ID',
          theaterName: 'Theater Name',
          date: 'Booking Date',
          time: 'Booking Time',
          occasion: 'Occasion',
          numberOfPeople: 'Number'
        }
      }
    }
  });
}
