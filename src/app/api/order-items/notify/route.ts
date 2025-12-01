import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email-service';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ticketNumberRaw = body.ticketNumber;
    const statusRaw = body.status?.toString().trim().toLowerCase();
    const ticketNumber = ticketNumberRaw?.toString().trim();

    if (!ticketNumber) {
      return NextResponse.json({ success: false, error: 'Ticket number is required' }, { status: 400 });
    }

    const result = await (database as any).getBookingByTicketNumber?.(ticketNumber);

    if (!result || !result.success || !result.booking) {
      return NextResponse.json({ success: false, error: 'Booking not found for this ticket number' }, { status: 404 });
    }

    const booking: any = result.booking;

    if (!booking.email) {
      return NextResponse.json({ success: false, error: 'Booking does not have an email on file.' }, { status: 400 });
    }

    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackUrl = `${origin.replace(/\/$/, '')}/order-items?ticket=${encodeURIComponent(ticketNumber)}`;

    const payload = {
      ...booking,
      trackUrl,
    };

    const newStatus = statusRaw === 'ready' ? 'ready' : 'received';
    if (newStatus === 'ready') {
      await emailService.sendOrderReadyNotification(payload as any);
    } else {
      await emailService.sendOrderReceivedNotification(payload as any);
    }

    await (database as any).updateOrderStatusByTicket?.(ticketNumber, newStatus);

    let autoDeleteResult: any = null;
    if (newStatus === 'ready') {
      try {
        autoDeleteResult = await (database as any).markOrderReadyForAutoDeletion?.(ticketNumber);
      } catch (autoDeleteError) {
        console.error('❌ Failed to schedule auto-delete for ready order:', autoDeleteError);
      }
    }

    return NextResponse.json({
      success: true,
      message: newStatus === 'ready' ? 'Customer notified that order is ready.' : 'Customer notified that order is received.',
      status: newStatus,
      autoDeleteAt: autoDeleteResult?.autoDeleteAt || null,
    });
  } catch (error: any) {
    console.error('❌ [order-items][notify] Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to notify customer' }, { status: 500 });
  }
}
