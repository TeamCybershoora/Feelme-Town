import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/admin/edit-booking - Update booking from Edit Booking popup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingId: string | undefined = body.bookingId;
    const data: any = body.data || body.updates || body.bookingData || {};

    console.log('📝 POST /api/admin/edit-booking - Received:', { bookingId, dataKeys: Object.keys(data).slice(0, 10) });

    if (!bookingId) {
      console.error('❌ Missing booking ID');
      return NextResponse.json({ success: false, error: 'Missing booking ID' }, { status: 400 });
    }

    // Validate required fields (gracefully backfill from existing booking if missing)
    const requiredFields = ['name', 'email', 'phone', 'theaterName', 'date', 'time', 'occasion'];
    const missing = requiredFields.filter((f) => !data[f]);
    if (missing.length) {
      // Try to load existing booking and backfill
      console.log('⚠️ Missing fields:', missing, '. Attempting to load existing booking...');
      const existing = await database.getBookingById(bookingId);
      console.log('📥 Existing booking lookup result:', { success: existing.success, hasBooking: !!(existing as any).booking });
      if (existing.success && (existing as any).booking) {
        const existingBooking: any = (existing as any).booking;
        for (const f of missing) {
          if (!data[f] && existingBooking[f]) {
            console.log(`  → Backfilling ${f} from existing booking`);
            data[f] = existingBooking[f];
          }
        }
      }
    }

    // Compute total if needed
    let totalAmount = Number(data.totalAmount) || 0;
    let theaterBasePrice = 1399;
    if (data.pricingData?.theaterBasePrice) {
      theaterBasePrice = Number(data.pricingData.theaterBasePrice) || theaterBasePrice;
    } else if (data.theaterName) {
      const name: string = data.theaterName;
      if (name.includes('PHILIA') || name.includes('FRIENDS') || name.includes('FMT-Hall-2')) theaterBasePrice = 1999;
      else if (name.includes('PRAGMA') || name.includes('LOVE') || name.includes('FMT-Hall-3')) theaterBasePrice = 2999;
      else if (name.includes('STORGE') || name.includes('FAMILY') || name.includes('FMT-Hall-4')) theaterBasePrice = 3999;
      else if (name.includes('EROS') || name.includes('COUPLES') || name.includes('FMT-Hall-1')) theaterBasePrice = 1399;
    }

    if (!totalAmount) {
      totalAmount += theaterBasePrice;
      const numPeople = Number(data.numberOfPeople) || 2;
      const extraGuests = Math.max(0, numPeople - 2);
      const extraGuestCharges = extraGuests * (data.pricingData?.extraGuestFee || 400);
      totalAmount += extraGuestCharges;

      const addItems = (items?: Array<{ price?: number; quantity?: number }>) => {
        if (!items || !Array.isArray(items)) return;
        for (const it of items) totalAmount += (Number(it.price) || 0) * (Number(it.quantity) || 1);
      };
      addItems(data.selectedCakes);
      addItems(data.selectedDecorItems);
      addItems(data.selectedGifts);
      addItems(data.selectedMovies);
    }

    // Payment breakdown
    const slotBookingFee = Number(data.pricingData?.slotBookingFee) || 600;
    const advancePayment = slotBookingFee;
    const venuePayment = totalAmount - advancePayment;

    // Build update payload (accept dynamic occasion fields)
    // Ensure selected arrays are arrays of objects with price/quantity
    const normalizeItems = (arr: any) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map((it: any) => {
        if (typeof it === 'string') return { id: it.toLowerCase().replace(/\s+/g, '-'), name: it, price: 0, quantity: 1 };
        if (it && typeof it === 'object') return { id: it.id || it.name, name: it.name, price: Number(it.price) || 0, quantity: Number(it.quantity) || 1 };
        return { id: String(it), name: String(it), price: 0, quantity: 1 };
      });
    };

    const bookingData: any = {
      name: String(data.name).trim(),
      email: String(data.email).trim().toLowerCase(),
      phone: String(data.phone).trim(),
      theaterName: String(data.theaterName).trim(),
      date: data.date,
      time: data.time,
      occasion: String(data.occasion).trim(),
      numberOfPeople: Number(data.numberOfPeople) || 2,
      selectedCakes: normalizeItems(data.selectedCakes),
      selectedDecorItems: normalizeItems(data.selectedDecorItems),
      selectedGifts: normalizeItems(data.selectedGifts),
      selectedMovies: normalizeItems(data.selectedMovies),
      totalAmount,
      advancePayment,
      venuePayment,
      status: data.status || 'confirmed',
      occasionData: data.occasionData || {},
      pricingData: data.pricingData || {
        slotBookingFee,
        extraGuestFee: 400,
        convenienceFee: 0,
        theaterBasePrice,
      },
      extraGuestCharges: Math.max(0, (Number(data.numberOfPeople) || 2) - 2) * (data.pricingData?.extraGuestFee || 400),
      extraGuestsCount: Math.max(0, (Number(data.numberOfPeople) || 2) - 2),
      appliedCouponCode: data.appliedCouponCode || undefined,
      couponDiscount: Number(data.couponDiscount) || 0,
    };

    if (data.occasionData && typeof data.occasionData === 'object') {
      for (const k of Object.keys(data.occasionData)) {
        if (data.occasionData[k]) bookingData[k] = data.occasionData[k];
      }
    }

    // Aliases for manual collection
    bookingData.customerName = bookingData.name;
    bookingData.theater = bookingData.theaterName;
    bookingData.amount = bookingData.totalAmount;

    // Try regular bookings first
    let result = await database.updateBooking(bookingId, bookingData);
    console.log('📊 Regular booking update result:', { success: result.success, error: result.error, hasBooking: !!(result as any).booking });
    
    if (!result.success && /not found/i.test(result.error || '')) {
      // Fallback to manual bookings
      console.log('↩️ Falling back to manual booking collection...');
      // @ts-ignore - available in module
      const manualResult = await database.updateManualBooking(bookingId, bookingData);
      console.log('📊 Manual booking update result:', { success: manualResult.success, error: manualResult.error, hasBooking: !!(manualResult as any).booking });
      if (manualResult.success) {
        result = manualResult as any;
      } else {
        console.error('❌ Both regular and manual booking updates failed');
        return NextResponse.json({ success: false, error: manualResult.error || 'Booking not found' }, { status: 404 });
      }
    }

    if (result.success && result.booking) {
      console.log('✅ Booking updated successfully!');
      return NextResponse.json({ success: true, message: 'Booking updated successfully!', bookingId, booking: result.booking }, { status: 200 });
    }

    console.error('❌ Final error:', result.error);
    return NextResponse.json({ success: false, error: result.error || 'Failed to update booking' }, { status: 500 });
  } catch (error) {
    console.error('❌ POST /api/admin/edit-booking Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update booking' },
      { status: 500 }
    );
  }
}


