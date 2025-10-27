import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';
import { ExportsStorage } from '@/lib/exports-storage';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 PUT /api/admin/update-booking - Received:', { bookingId: body.bookingId, body });
    
    const { 
      bookingId, 
      customerName, 
      email, 
      phone, 
      theater, 
      date, 
      time, 
      status, 
      amount,
      numberOfPeople,
      isManualBooking = false 
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required'
        },
        { status: 400 }
      );
    }

    // Update booking data - only include fields that are provided
    const updateData: any = {};
    
    if (customerName !== undefined) updateData.customerName = customerName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (theater !== undefined) {
      updateData.theater = theater;
      updateData.theaterName = theater; // Also update theaterName for database compatibility
    }
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = amount;
    if (numberOfPeople !== undefined) updateData.numberOfPeople = numberOfPeople;

    // Get current booking to check status change
    let currentBooking;
    let isManual = !!isManualBooking;
    if (isManual) {
      const manualBookings = await database.getAllManualBookings();
      currentBooking = manualBookings.manualBookings?.find((b: any) => (b.bookingId || b.id) === bookingId);
    } else {
      const bookingResult = await database.getBookingById(bookingId);
      currentBooking = bookingResult.booking;
      if (!currentBooking) {
        const manualBookings = await database.getAllManualBookings();
        const manual = manualBookings.manualBookings?.find((b: any) => (b.bookingId || b.id) === bookingId);
        if (manual) {
          currentBooking = manual;
          isManual = true;
        }
      } else if (currentBooking.isManualBooking || currentBooking.bookingType === 'Manual' || currentBooking.status === 'manual') {
        isManual = true;
      }
    }

    const oldStatus = currentBooking?.status;
    const newStatus = status;

    let result;
    
    // Special handling for cancellation - save to JSON file then delete
    if (newStatus === 'cancelled') {
      console.log(`🗑️ Admin cancelling booking ${bookingId} - saving to JSON then deleting`);
      
      // Get full booking data before deleting
      let bookingData: any = null;
      if (isManual) {
        const manualBookings = await database.getAllManualBookings();
        bookingData = manualBookings.manualBookings?.find((b: any) => (b.bookingId || b.id) === bookingId) || null;
      } else {
        const bookingResult = await database.getBookingById(bookingId);
        bookingData = bookingResult.booking;
      }
      // If not found in DB, try manual-bookings.json (JSON-only manual bookings)
      let jsonManualRecordFound = false;
      if (!bookingData) {
        try {
          const manual = await ExportsStorage.readManual('manual-bookings.json');
          const found = (manual.records || []).find((r: any) => (r.bookingId || r.id) === bookingId);
          if (found) {
            bookingData = found;
            isManual = true;
            jsonManualRecordFound = true;
          }
        } catch {}
      }
      
      // Save to cancelled JSON file before deleting
      if (bookingData) {
        try {
          // Add new cancelled booking with timestamp
          const record = {
            bookingId: bookingData.bookingId || bookingData.id,
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
            theaterName: bookingData.theaterName,
            date: bookingData.date,
            time: bookingData.time,
            occasion: bookingData.occasion,
            numberOfPeople: bookingData.numberOfPeople,
            advancePayment: bookingData.advancePayment,
            venuePayment: bookingData.venuePayment,
            totalAmount: bookingData.totalAmount,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelReason: (typeof body.cancelReason === 'string' && body.cancelReason.trim()) ? body.cancelReason.trim() : 'Cancelled by Administrator'
          };
          await ExportsStorage.appendToArray('cancelled-bookings.json', record);
          console.log(`✅ Cancelled booking saved to JSON (Blob-backed)`);

          // If manual, also remove from manual-bookings.json
          if (isManual) {
            try {
              await ExportsStorage.removeManualByBookingId(bookingId);
              console.log(`🧹 Removed manual booking ${bookingId} from manual-bookings.json`);
            } catch {}
          }
        } catch (err) {
          console.error('❌ Failed to save to JSON (Blob-backed):', err);
        }
      }
      
      // Delete booking from appropriate collection
      if (isManual) {
        result = await (database as any).deleteManualBooking?.(bookingId);
        if (!result || !result.success) {
          result = await database.deleteBooking(bookingId);
        }
      } else {
        result = await database.deleteBooking(bookingId);
      }
      // If this was a JSON-only manual booking (no DB row), treat as success
      if ((!result || !result.success) && isManual && jsonManualRecordFound) {
        result = { success: true } as any;
      }
      
      if (result.success) {
        console.log(`✅ Booking ${bookingId} deleted from database`);
        await database.incrementCounter('cancelled');
      }
    } else if (newStatus === 'completed') {
      // Archive to completed JSON then delete from DB
      console.log(`✅ Completing booking ${bookingId} - archiving to JSON then deleting from DB`);

      // Get full booking data before deleting (similar to cancel branch)
      let bookingData: any = null;
      if (isManual) {
        const manualBookings = await database.getAllManualBookings();
        bookingData = manualBookings.manualBookings?.find((b: any) => (b.bookingId || b.id) === bookingId) || null;
      } else {
        const bookingResult = await database.getBookingById(bookingId);
        bookingData = bookingResult.booking;
      }

      // If not found in DB, try manual-bookings.json (JSON-only manual bookings)
      let jsonManualRecordFound = false;
      if (!bookingData) {
        try {
          const manual = await ExportsStorage.readManual('manual-bookings.json');
          const found = (manual.records || []).find((r: any) => (r.bookingId || r.id) === bookingId);
          if (found) {
            bookingData = found;
            isManual = true;
            jsonManualRecordFound = true;
          }
        } catch {}
      }

      // Save to completed JSON file before deleting
      if (bookingData) {
        try {
          const record = {
            bookingId: bookingData.bookingId || bookingData.id,
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
            theaterName: bookingData.theaterName,
            date: bookingData.date,
            time: bookingData.time,
            occasion: bookingData.occasion,
            numberOfPeople: bookingData.numberOfPeople,
            advancePayment: bookingData.advancePayment,
            venuePayment: bookingData.venuePayment,
            totalAmount: bookingData.totalAmount,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
          await ExportsStorage.appendToArray('completed-bookings.json', record);
          console.log(`✅ Completed booking archived to JSON (Blob-backed)`);

          // If manual, also remove from manual-bookings.json so it doesn't appear in manual list anymore
          if (isManual) {
            try {
              await ExportsStorage.removeManualByBookingId(bookingId);
              console.log(`🧹 Removed manual booking ${bookingId} from manual-bookings.json after completion`);
            } catch {}
          }
        } catch (err) {
          console.error('❌ Failed to archive completed booking to JSON (Blob-backed):', err);
        }
      }

      // Delete from appropriate collection
      if (isManual) {
        result = await (database as any).deleteManualBooking?.(bookingId);
        if (!result || !result.success) {
          result = await database.deleteBooking(bookingId);
        }
      } else {
        result = await database.deleteBooking(bookingId);
      }
      // If this was a JSON-only manual booking (no DB row), treat as success
      if ((!result || !result.success) && isManual && jsonManualRecordFound) {
        result = { success: true } as any;
      }

      if (result.success) {
        console.log(`🗑️ Booking ${bookingId} deleted from database after archiving`);
        await database.incrementCounter('completed');
        // Notify customer their invoice is ready
        try {
          const mailData: any = {
            id: bookingData?.bookingId || bookingData?.id || bookingId,
            name: bookingData?.name,
            email: bookingData?.email,
            phone: bookingData?.phone,
            theaterName: bookingData?.theaterName,
            date: bookingData?.date,
            time: bookingData?.time,
            numberOfPeople: bookingData?.numberOfPeople,
            totalAmount: bookingData?.totalAmount
          };
          emailService.sendBookingInvoiceReady(mailData).catch(() => {});
        } catch {}
      }
    } else {
      // Normal update for other status changes
      console.log('📝 About to update booking with data:', updateData);
      if (isManualBooking) {
        // Update manual booking
        console.log('📝 Updating manual booking...');
        result = await database.updateManualBooking(bookingId, updateData);
      } else {
        // Update regular booking
        console.log('📝 Updating regular booking...');
        result = await database.updateBooking(bookingId, updateData);
      }
      console.log('📝 Database update result:', result);

      // Handle counter updates for status changes
      if (result.success) {
        // Trigger slot refresh for theater page if time slot or date changed
        if (updateData.time || updateData.date || updateData.theaterName) {
          console.log('🔄 Time slot/date/theater changed, triggering slot refresh');
          // Note: This will be handled by the frontend after receiving the response
        }
        // If booking was pending due to edit request, confirm puts it back and clears flag
        if (newStatus === 'confirmed') {
          try {
            await database.updateBooking(bookingId, { isEditRequested: false });
          } catch (e) {
            
          }
        }
        if (oldStatus !== newStatus && newStatus) {
        
        
        // Decrement old status counter (if it was a counted status)
        if (oldStatus === 'confirmed') {
          // Note: We don't decrement counters as they represent cumulative counts
          
        }
        
        // Increment new status counter
        if (newStatus === 'completed') {
          await database.incrementCounter('completed');
          
        }
        }
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: newStatus === 'cancelled' ? 'Booking cancelled successfully' : 'Booking updated successfully',
        booking: (result as any).booking || null
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update booking'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking'
      },
      { status: 500 }
    );
  }
}

