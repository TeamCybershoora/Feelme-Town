import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email-service';

// POST /api/email/incomplete - Send incomplete booking email
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

    // Send incomplete booking email
    const emailResult = await emailService.sendBookingIncomplete(body);

    if (emailResult.success) {
      console.log('📧 Incomplete booking email sent successfully to:', body.email);
      
      return NextResponse.json({
        success: true,
        message: 'Incomplete booking email sent successfully!',
        messageId: emailResult.messageId
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error sending incomplete booking email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send incomplete booking email' 
      },
      { status: 500 }
    );
  }
}
