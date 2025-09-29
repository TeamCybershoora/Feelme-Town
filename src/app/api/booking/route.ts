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

    // Calculate expiredAt time (2 hours after the booking END time)
    const calculateExpiredAt = (date: string, time: string) => {
      try {
        // Parse the booking date
        let bookingDate: Date;
        if (date.includes(',')) {
          // Format: "Saturday, September 27, 2025"
          bookingDate = new Date(date);
        } else {
          // Format: "2025-09-27" or similar
          bookingDate = new Date(date);
        }
        
        // Parse the booking time - use END time for expiration
        let bookingEndDateTime: Date;
        if (time.includes(' - ')) {
          // Format: "9:00 am - 12:00 pm" - use the END time (12:00 pm)
          const endTime = time.split(' - ')[1].trim();
          const [timeStr, period] = endTime.split(' ');
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          // Convert to 24-hour format
          let hour24 = hours;
          if (period && period.toLowerCase() === 'pm' && hours !== 12) {
            hour24 = hours + 12;
          } else if (period && period.toLowerCase() === 'am' && hours === 12) {
            hour24 = 0;
          }
          
          bookingEndDateTime = new Date(bookingDate);
          bookingEndDateTime.setHours(hour24, minutes, 0, 0);
        } else {
          // Format: "12:00 PM" or "12:00" - assume it's a single time slot
          const [timeStr] = time.split(' '); // Extract time part
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          // Convert to 24-hour format if needed
          let hour24 = hours;
          if (time.includes('PM') && hours !== 12) {
            hour24 = hours + 12;
          } else if (time.includes('AM') && hours === 12) {
            hour24 = 0;
          }
          
          bookingEndDateTime = new Date(bookingDate);
          bookingEndDateTime.setHours(hour24, minutes, 0, 0);
        }
        
        // Add 2 hours to the booking END time for expiredAt
        const expiredAt = new Date(bookingEndDateTime);
        expiredAt.setHours(expiredAt.getHours() + 2);
        
        console.log(`📅 Booking: ${date} ${time}`);
        console.log(`📅 End time: ${bookingEndDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`📅 Expires at: ${expiredAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`📅 Current time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        
        return expiredAt;
      } catch (error) {
        console.error('Error calculating expiredAt:', error);
        // Fallback: set expiredAt to 2 hours from now
        const fallback = new Date();
        fallback.setHours(fallback.getHours() + 2);
        return fallback;
      }
    };

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
      selectedMovies: body.selectedMovies || [],
      totalAmount: totalAmount,
      advancePayment: advancePayment, // Amount paid now (25%)
      venuePayment: venuePayment, // Amount to be paid at venue
      status: body.isManualBooking ? 'manual' : 'completed', // Booking status
      // Timestamps
      createdAt: new Date(), // When booking was created
      // Auto-expiration: 2 hours after booking END time
      expiredAt: calculateExpiredAt(body.date, body.time),
      // Manual booking specific fields
      isManualBooking: body.isManualBooking || false,
      bookingType: body.bookingType || 'Online',
      createdBy: body.createdBy || 'Customer',
      notes: body.notes || '',
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

    // Check if this is completing an incomplete booking
    const incompleteBookingId = body.incompleteBookingId;
    let deletedIncompleteBooking = null;

    // Save to database using db-connect (optimized for speed)
    // All bookings go to regular booking collection, but manual bookings have status 'manual'
    const result = await database.saveBooking(bookingData);

    if (result.success && result.booking) {
      const bookingType = body.isManualBooking ? 'Manual' : 'Online';
      const createdBy = body.createdBy || 'Customer';
      
      console.log(`✅ ${bookingType} booking data saved to FeelME Town database:`, {
        id: result.booking.id,
        name: result.booking.name,
        theater: result.booking.theaterName,
        date: result.booking.date,
        time: result.booking.time,
        total: result.booking.totalAmount,
        type: bookingType,
        createdBy: createdBy
      });

      // If this was completing an incomplete booking, delete the incomplete one
      if (incompleteBookingId) {
        console.log('🔄 Completing incomplete booking:', incompleteBookingId);
        
        const deleteResult = await database.deleteIncompleteBooking(incompleteBookingId);
        if (deleteResult.success) {
          console.log('🗑️ Deleted incomplete booking:', incompleteBookingId);
          deletedIncompleteBooking = {
            id: incompleteBookingId,
            deleted: true
          };
        } else {
          console.log('⚠️ Failed to delete incomplete booking:', deleteResult.message);
        }
      }

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
        collection: 'booking',
        incompleteBookingDeleted: deletedIncompleteBooking
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