import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';

// POST /api/booking - Save booking data to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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

    // Create booking data
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
      totalAmount: totalAmount
    };

    // Save to database using db-connect (optimized for speed)
    const result = await database.saveBooking(bookingData);

    if (result.success && result.booking) {
      console.log('✅ Booking data saved to FeelME Town database:', {
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
            message: 'Booking completed successfully!',
            bookingId: result.booking.id,
            booking: result.booking,
            database: 'FeelME Town',
            collection: 'booking'
          }, { status: 201 });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error saving booking data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save booking data. Please try again.' 
      },
      { status: 500 }
    );
  }
}