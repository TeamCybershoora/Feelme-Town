import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';

const INTERNAL_INVOICE_SECRET = process.env.INTERNAL_INVOICE_SECRET || 'feelmetown-internal-secret';

interface LoadedBooking {
  booking: any | null;
  isManual: boolean;
}

const resolveBookingId = (value: unknown): string => {
  if (!value) return '';
  return String(value).trim();
};

const loadBooking = async (rawBookingId: string): Promise<LoadedBooking> => {
  let isManual = false;
  const resolvedId = resolveBookingId(rawBookingId);
  if (!resolvedId) {
    return { booking: null, isManual };
  }

  try {
    const bookingResult = await database.getBookingById(resolvedId);
    if (bookingResult?.booking) {
      const booking = bookingResult.booking;
      if (
        booking.isManualBooking ||
        (typeof booking.status === 'string' && booking.status.toLowerCase() === 'manual') ||
        (typeof booking.bookingType === 'string' && booking.bookingType.toLowerCase() === 'manual')
      ) {
        isManual = true;
      }
      return { booking, isManual };
    }
  } catch (error) {
    console.warn('⚠️ [send-invoice] Failed to load booking from primary collection:', error);
  }

  try {
    const manualBookings = await database.getAllManualBookings();
    const manualBooking = manualBookings?.manualBookings?.find(
      (entry: any) => resolveBookingId(entry?.bookingId || entry?.id) === resolvedId,
    );
    if (manualBooking) {
      isManual = true;
      return { booking: manualBooking, isManual };
    }
  } catch (error) {
    console.warn('⚠️ [send-invoice] Failed to load booking from manual collection:', error);
  }

  return { booking: null, isManual };
};

const buildMailPayload = (booking: any) => {
  const primaryId =
    booking.bookingId || booking.id || (booking._id ? String(booking._id) : undefined);

  if (!primaryId) {
    return null;
  }

  return {
    id: primaryId,
    name: booking.name || booking.customerName || 'Customer',
    email: booking.email,
    phone: booking.phone,
    theaterName: booking.theaterName || booking.theater,
    date: booking.date,
    time: booking.time,
    numberOfPeople: booking.numberOfPeople,
    totalAmount: booking.totalAmount,
    invoiceDriveUrl: booking.invoiceDriveUrl,
  } as any;
};

const ensureInvoicePdf = async (
  mailData: any,
  baseUrl: string,
): Promise<{ mailData: any; attachment?: { filename: string; content: Buffer } }> => {
  try {
    const { GET: generateInvoiceHandler } = await import('@/app/api/generate-invoice/route');

    const requestUrl = new URL(
      `${baseUrl}/api/generate-invoice?bookingId=${encodeURIComponent(mailData.id)}&format=pdf&forceInternal=true`,
    );

    const headers = new Headers();
    if (INTERNAL_INVOICE_SECRET) {
      headers.set('x-internal-invoice-secret', INTERNAL_INVOICE_SECRET);
    }

    const invoiceRequest = new Request(requestUrl.toString(), {
      method: 'GET',
      headers,
    });

    const pdfResponse = await generateInvoiceHandler(invoiceRequest as any);
    if (!pdfResponse.ok) {
      console.warn('⚠️ [send-invoice] Failed to generate invoice PDF:', pdfResponse.status);
      return { mailData };
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    return {
      mailData,
      attachment: {
        filename: `Invoice-${mailData.id}.pdf`,
        content: pdfBuffer,
      },
    };
  } catch (error) {
    console.error('❌ [send-invoice] Invoice PDF generation error:', error);
    return { mailData };
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawBookingId = resolveBookingId(body?.bookingId);

    if (!rawBookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 },
      );
    }

    const { booking, isManual } = await loadBooking(rawBookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    const mailData = buildMailPayload(booking);
    if (!mailData?.email) {
      return NextResponse.json(
        { success: false, error: 'No email available for this booking' },
        { status: 400 },
      );
    }

    // Resolve base URL prioritizing database settings
    let resolvedBaseUrl: string;
    try {
      const settings = await database.getSettings();
      const websiteUrl = settings?.websiteUrl || null;

      const requestOrigin = request.nextUrl?.origin ?? '';
      const headerHost = request.headers.get('host');
      const headerProto = request.headers.get('x-forwarded-proto') ?? (headerHost?.startsWith('localhost') ? 'http' : 'https');
      const headerOrigin = headerHost ? `${headerProto}://${headerHost}` : '';

      resolvedBaseUrl = websiteUrl ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.BASE_URL ||
        requestOrigin ||
        headerOrigin ||
        'http://localhost:3000';
    } catch {
      resolvedBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    }

    const { mailData: enrichedMailData, attachment } = await ensureInvoicePdf(mailData, resolvedBaseUrl);

    if (!attachment?.content || attachment.content.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate invoice PDF attachment' },
        { status: 500 },
      );
    }

    const emailResult = await emailService.sendBookingInvoiceReady(enrichedMailData, {
      attachment,
    });

    if (!emailResult?.success) {
      return NextResponse.json(
        { success: false, error: emailResult?.error || 'Failed to send invoice email' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully',
      invoiceUrl: enrichedMailData.invoiceDriveUrl || null,
    });
  } catch (error) {
    console.error('❌ [send-invoice] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice email' },
      { status: 500 },
    );
  }
}
