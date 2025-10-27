import { NextRequest, NextResponse } from 'next/server';
import { generateInvoiceHtml } from '@/lib/invoice';
import puppeteer from 'puppeteer';
import database from '@/lib/db-connect';
import { ExportsStorage } from '@/lib/exports-storage';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    if (!bookingData || !bookingData.id) {
      return NextResponse.json(
        { success: false, error: 'Booking data is required' },
        { status: 400 }
      );
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(bookingData);
    
    // Launch puppeteer to generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for fonts to load
    await page.setContent(invoiceHtml, { 
      waitUntil: 'networkidle0' 
    });
    
    // Generate PDF with custom settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Create custom filename with customer name
    const cleanCustomerName = (bookingData.name || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const filename = `Invoice-FMT-${cleanCustomerName}.pdf`;
    
    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// GET method to preview invoice HTML (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const format = (searchParams.get('format') || 'html').toLowerCase();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Helper to build invoice HTML from normalized data
    const buildHtml = async (invoiceData: any) => generateInvoiceHtml(invoiceData);

    // Try to fetch booking from database first
    const result = await database.getBookingById(bookingId);
    if (result.success && result.booking) {
      const b: any = result.booking || {};
      const status = String(b.status || '').toLowerCase();

      // If not completed, gate the invoice with friendly HTML
      if (status !== 'completed') {
        const customerName = b.name || 'Valued Customer';
        const gatingHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invoice Pending</title><style>body{margin:0;padding:0;background:#0b0b0b;color:#fff;font-family:Arial,Helvetica,sans-serif}.wrap{max-width:720px;margin:6rem auto;background:#141414;border-radius:20px;border:1px solid #222;box-shadow:0 10px 30px rgba(0,0,0,.4);padding:32px;text-align:center}.title{font-size:28px;font-weight:800;margin-bottom:10px}.note{background:#1a1a1a;border-left:4px solid #eab308;color:#fef08a;padding:14px;border-radius:10px;margin-top:12px;display:inline-block}</style></head><body><div class="wrap"><div class="title">Invoice will be available after completion</div><div class="note">Your invoice will generate automatically once your booking is marked as <b>Completed</b>. We'll email you a link to download it.</div></div><!-- INVOICE_PENDING --><script type="application/json" id="booking-data">{"name":"${customerName}","bookingId":"${bookingId}"}</script></body></html>`;

        // If PDF requested while pending, block
        if (format === 'pdf') {
          return NextResponse.json({ success: false, error: 'Invoice not available until booking is completed' }, { status: 403 });
        }

        return new NextResponse(gatingHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
      }

      // Completed in DB → build invoice
      const invoiceData: any = {
        id: b.bookingId || b.id || (b._id ? String(b._id) : bookingId),
        name: b.name || b.customerName || '',
        email: b.email || '',
        phone: b.phone || '',
        theaterName: b.theaterName || b.theater || '',
        date: b.date || '',
        time: b.time || '',
        occasion: b.occasion || '',
        numberOfPeople: Number(b.numberOfPeople || 2),
        totalAmount: Number(b.totalAmount || 0),
        pricingData: b.pricingData || {},
        extraGuestsCount: Number(b.extraGuestsCount ?? Math.max(0, Number(b.numberOfPeople || 2) - 2)),
        extraGuestCharges: Number(b.extraGuestCharges || 0),
        advancePayment: b.advancePayment !== undefined ? Number(b.advancePayment) : undefined,
        venuePayment: b.venuePayment !== undefined ? Number(b.venuePayment) : undefined,
        ...b
      };

      const invoiceHtml = await buildHtml(invoiceData);

      if (format === 'pdf') {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();

        const cleanCustomerName = (invoiceData.name || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        const filename = `Invoice-FMT-${cleanCustomerName}.pdf`;
        return new NextResponse(pdfBuffer as any, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` } });
      }

      return new NextResponse(invoiceHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Not found in DB → try completed-bookings.json (archived after completion)
    try {
      let record: any = null;
      const arr = await ExportsStorage.readArray('completed-bookings.json');
      if (Array.isArray(arr)) {
        record = arr.find((r: any) => (r.bookingId || r.id) === bookingId) || null;
      }
      if (!record) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const invoiceData: any = {
        id: record.bookingId || record.id || bookingId,
        name: record.name || '',
        email: record.email || '',
        phone: record.phone || '',
        theaterName: record.theaterName || '',
        date: record.date || '',
        time: record.time || '',
        occasion: record.occasion || '',
        numberOfPeople: Number(record.numberOfPeople || 2),
        totalAmount: Number(record.totalAmount || 0),
        advancePayment: record.advancePayment !== undefined ? Number(record.advancePayment) : undefined,
        venuePayment: record.venuePayment !== undefined ? Number(record.venuePayment) : undefined,
        ...record
      };

      const invoiceHtml = await buildHtml(invoiceData);

      if (format === 'pdf') {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();
        const cleanCustomerName = (invoiceData.name || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        const filename = `Invoice-FMT-${cleanCustomerName}.pdf`;
        return new NextResponse(pdfBuffer as any, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` } });
      }

      return new NextResponse(invoiceHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
    } catch (jsonErr) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Invoice preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
