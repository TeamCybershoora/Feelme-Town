import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';

// GET /api/booking/[id] - Get booking by ID with email verification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const email = request.nextUrl.searchParams.get('email');

    if (!bookingId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing booking ID' 
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing email parameter' 
        },
        { status: 400 }
      );
    }

    // Get booking from database
    const result = await database.getBookingById(bookingId);

    if (!result.success || !result.booking) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking not found' 
        },
        { status: 404 }
      );
    }

    const booking = result.booking;

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

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking is already cancelled' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.bookingId || booking._id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        theaterName: booking.theaterName,
        date: booking.date,
        time: booking.time,
        occasion: booking.occasion,
        numberOfPeople: booking.numberOfPeople,
        totalAmount: booking.totalAmount,
        advancePayment: booking.advancePayment,
        venuePayment: booking.venuePayment,
        status: booking.status || 'completed',
        createdAt: booking.createdAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error getting booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get booking. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/booking/[id] - Update existing booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    
    if (!bookingId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing booking ID' 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'theaterName', 'date', 'time', 'occasion'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    
    // Add theater base price based on theater name
    let theaterBasePrice = 1399; // Default theater price
    
    // Extract price from theater name or set based on theater type
    if (body.theaterName) {
      if (body.theaterName.includes('PHILIA') || body.theaterName.includes('FRIENDS') || body.theaterName.includes('FMT-Hall-2')) {
        theaterBasePrice = 1999;
      } else if (body.theaterName.includes('PRAGMA') || body.theaterName.includes('LOVE') || body.theaterName.includes('FMT-Hall-3')) {
        theaterBasePrice = 2999;
      } else if (body.theaterName.includes('STORGE') || body.theaterName.includes('FAMILY') || body.theaterName.includes('FMT-Hall-4')) {
        theaterBasePrice = 3999;
      } else if (body.theaterName.includes('EROS') || body.theaterName.includes('COUPLES') || body.theaterName.includes('FMT-Hall-1')) {
        theaterBasePrice = 1399;
      }
    }
    
    totalAmount += theaterBasePrice;
    
    // Add extra guest charges (₹400 per guest beyond 2)
    const numberOfPeople = body.numberOfPeople || 2;
    const extraGuests = Math.max(0, numberOfPeople - 2);
    const extraGuestCharges = extraGuests * 400;
    totalAmount += extraGuestCharges;
    
    // Add cake costs
    if (body.selectedCakes && Array.isArray(body.selectedCakes)) {
      body.selectedCakes.forEach((cake: { price?: number; quantity?: number }) => {
        totalAmount += (cake.price || 0) * (cake.quantity || 1);
      });
    }
    
    // Add decor item costs
    if (body.selectedDecorItems && Array.isArray(body.selectedDecorItems)) {
      body.selectedDecorItems.forEach((item: { price?: number; quantity?: number }) => {
        totalAmount += (item.price || 0) * (item.quantity || 1);
      });
    }
    
    // Add gift costs
    if (body.selectedGifts && Array.isArray(body.selectedGifts)) {
      body.selectedGifts.forEach((gift: { price?: number; quantity?: number }) => {
        totalAmount += (gift.price || 0) * (gift.quantity || 1);
      });
    }
    
    // Add movie costs
    if (body.selectedMovies && Array.isArray(body.selectedMovies)) {
      body.selectedMovies.forEach((movie: { price?: number; quantity?: number }) => {
        totalAmount += (movie.price || 0) * (movie.quantity || 1);
      });
    }

    // Calculate payment breakdown
    const advancePayment = 600; // Fixed advance payment
    const venuePayment = totalAmount - advancePayment; // Remaining amount to be paid at venue

    // Create updated booking data
    const bookingData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      theaterName: body.theaterName.trim(),
      date: body.date,
      time: body.time,
      occasion: body.occasion.trim(),
      numberOfPeople: body.numberOfPeople || 2,
      selectedCakes: body.selectedCakes || [],
      selectedDecorItems: body.selectedDecorItems || [],
      selectedGifts: body.selectedGifts || [],
      selectedMovies: body.selectedMovies || [],
      totalAmount: totalAmount,
      advancePayment: advancePayment, // Amount paid now (25%)
      venuePayment: venuePayment, // Amount to be paid at venue
      status: 'completed', // Booking status
      // Occasion-specific data (only save relevant fields based on occasion)
      occasionPersonName: body.occasionPersonName || '',
      // Only save the relevant name field based on the selected occasion
      ...(body.occasion === 'Birthday Party' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Anniversary' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Baby Shower' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Bride to be' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Congratulations' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Farewell' && { birthdayName: body.birthdayName }),
      ...(body.occasion === 'Marriage Proposal' && { 
        proposerName: body.proposerName,
        proposalPartnerName: body.proposalPartnerName 
      }),
      ...(body.occasion === 'Romantic Date' && { 
        partner1Name: body.partner1Name,
        partner2Name: body.partner2Name 
      }),
      ...(body.occasion === "Valentine's Day" && { valentineName: body.valentineName }),
      ...(body.occasion === 'Date Night' && { dateNightName: body.dateNightName })
    };

    // Update booking in database
    const result = await database.updateBooking(bookingId, bookingData);

    if (result.success && result.booking) {
      console.log('✅ Booking updated in FeelME Town database:', {
        id: result.booking.id,
        name: result.booking.name,
        theater: result.booking.theaterName,
        date: result.booking.date,
        time: result.booking.time,
        total: result.booking.totalAmount
      });

      // Send email in background (non-blocking for faster response)
      emailService.sendBookingComplete(result.booking).catch(error => {
        console.log('⚠️ Email service error (background):', error);
      });

      return NextResponse.json({
        success: true,
        message: 'Booking updated successfully!',
        bookingId: result.booking.id,
        booking: result.booking,
        database: 'FeelME Town',
        collection: 'booking'
      }, { status: 200 });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error updating booking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update booking data. Please try again.' 
      },
      { status: 500 }
    );
  }
}