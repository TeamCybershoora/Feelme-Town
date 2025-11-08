import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';
import { ExportsStorage } from '@/lib/exports-storage'; // Dummy - no longer used

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
      paymentStatus,
      venuePaymentMethod,
      paidBy,
      staffName,
      userId,
      paidAt,
      sendInvoice = true,
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
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    const normalizedVenuePaymentMethod = typeof venuePaymentMethod === 'string' ? venuePaymentMethod.toLowerCase() : undefined;
    if (normalizedVenuePaymentMethod) {
      updateData.venuePaymentMethod = normalizedVenuePaymentMethod;
      updateData.paymentMethod = normalizedVenuePaymentMethod;
    }
    
    // Add payment tracking fields
    console.log('🔍 [API] Payment tracking fields received:', { paidBy, staffName, userId, paidAt });
    
    if (paidBy !== undefined) {
      updateData.paidBy = paidBy;
      console.log('✅ [API] Added paidBy:', paidBy);
    }
    if (staffName !== undefined) {
      updateData.staffName = staffName;
      console.log('✅ [API] Added staffName:', staffName);
    }
    if (userId !== undefined) {
      updateData.userId = userId;
      console.log('✅ [API] Added userId:', userId);
    }
    if (paidAt !== undefined) {
      updateData.paidAt = paidAt;
      console.log('✅ [API] Added paidAt:', paidAt);
    }
    
    console.log('📦 [API] Final updateData for database:', updateData);

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
    const oldPaymentStatus = (currentBooking as any)?.paymentStatus || (currentBooking as any)?.payment_status;

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
        // Determine who cancelled (admin or staff)
        const cancelledBy = body.cancelledBy || 'Administrator';
        const staffName = body.staffName || null;
        const staffId = body.staffId || body.userId || null; // Use staffId or userId from staff database
        
        // Calculate refund (same logic as customer cancellation)
        const bookingDate = new Date(bookingData.date);
        const now = new Date();
        const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        let refundAmount = 0;
        let refundStatus = 'non-refundable';
        if (hoursUntilBooking > 72) {
          refundAmount = Math.round((bookingData.totalAmount || 0) * 0.25);
          refundStatus = 'refundable';
        }
        
        // Prepare cancelled booking record with ALL MongoDB fields
        const record = {
          // Basic booking info
          bookingId: bookingData.bookingId || bookingData.id,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          theaterName: bookingData.theaterName,
          date: bookingData.date,
          time: bookingData.time,
          occasion: bookingData.occasion,
          numberOfPeople: bookingData.numberOfPeople,
          
          // Payment info
          advancePayment: bookingData.advancePayment,
          venuePayment: bookingData.venuePayment,
          totalAmount: bookingData.totalAmount,
          
          // Cancellation info
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelReason: (typeof body.cancelReason === 'string' && body.cancelReason.trim()) 
            ? body.cancelReason.trim() 
            : (cancelledBy === 'Staff' && staffName && staffId)
              ? `Cancelled by ${staffName} (${staffId})`
              : `Cancelled by ${cancelledBy}`,
          cancelledBy: cancelledBy, // 'Administrator' or 'Staff'
          staffName: staffName, // Staff name if cancelled by staff
          staffId: staffId, // Staff ID if cancelled by staff
          refundAmount: refundAmount,
          refundStatus: refundStatus,
          
          // Additional MongoDB fields - Pass everything to SQL
          occasionPersonName: bookingData.occasionPersonName,
          bookingType: bookingData.bookingType,
          createdBy: bookingData.createdBy,
          isManualBooking: bookingData.isManualBooking,
          notes: bookingData.notes,
          createdAt: bookingData.createdAt,
          
          // Custom fields (Your Nickname, Partner Name, etc.)
          ...(bookingData['Your Nickname'] && { 'Your Nickname': bookingData['Your Nickname'] }),
          ...(bookingData['Your Nickname_label'] && { 'Your Nickname_label': bookingData['Your Nickname_label'] }),
          ...(bookingData['Your Nickname_value'] && { 'Your Nickname_value': bookingData['Your Nickname_value'] }),
          ...(bookingData["Your Partner's Name"] && { "Your Partner's Name": bookingData["Your Partner's Name"] }),
          ...(bookingData["Your Partner's Name_label"] && { "Your Partner's Name_label": bookingData["Your Partner's Name_label"] }),
          ...(bookingData["Your Partner's Name_value"] && { "Your Partner's Name_value": bookingData["Your Partner's Name_value"] }),
          
          // Arrays (movies, cakes, decor, gifts)
          selectedMovies: bookingData.selectedMovies || [],
          selectedCakes: bookingData.selectedCakes || [],
          selectedDecorItems: bookingData.selectedDecorItems || [],
          selectedGifts: bookingData.selectedGifts || [],
          
          // Complete original booking data (everything from MongoDB)
          _originalBooking: bookingData
        };
        
        console.log(`📝 Cancelled booking record:`, JSON.stringify(record, null, 2));
        
        // Sync to GoDaddy SQL database (PRIORITY - Always run this first)
        try {
          console.log(`🔄 [GODADDY SQL] Syncing admin-cancelled booking to GoDaddy SQL...`);
          const { syncCancelledBookingToSQL } = await import('@/lib/godaddy-sql');
          const sqlResult = await syncCancelledBookingToSQL(record);
          if (sqlResult.success) {
            console.log(`✅ [GODADDY SQL] Successfully synced admin-cancelled booking to GoDaddy SQL: ${record.bookingId}`);
          } else {
            console.error(`❌ [GODADDY SQL] Sync failed:`, sqlResult.error);
          }
        } catch (sqlError) {
          console.error('❌ [GODADDY SQL] Exception during sync:', sqlError);
        }
        
        // Save to blob storage JSON (optional backup)
        try {
          await ExportsStorage.appendToArray('cancelled-bookings.json', record);
          console.log(`✅ Cancelled booking saved to JSON (Blob-backed)`);
        } catch (err) {
          console.error('❌ Failed to save to JSON (Blob-backed):', err);
        }

        // Manual bookings are now only in database, no JSON cleanup needed
        if (isManual) {
          console.log(`✅ Manual booking ${bookingId} cancelled (database only)`);
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
        // Import the new counter system
        const { incrementCounter } = await import('@/lib/counter-system');
        await incrementCounter('cancelled');
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
        const record = {
          // Basic booking info
          bookingId: bookingData.bookingId || bookingData.id,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          theaterName: bookingData.theaterName,
          date: bookingData.date,
          time: bookingData.time,
          occasion: bookingData.occasion,
          numberOfPeople: bookingData.numberOfPeople,
          
          // Payment info
          advancePayment: bookingData.advancePayment,
          venuePayment: bookingData.venuePayment,
          totalAmount: bookingData.totalAmount,
          
          // Completion info
          status: 'completed',
          completedAt: new Date().toISOString(),
          
          // Additional MongoDB fields - Pass everything to SQL
          occasionPersonName: bookingData.occasionPersonName,
          bookingType: bookingData.bookingType,
          createdBy: bookingData.createdBy,
          isManualBooking: bookingData.isManualBooking,
          staffId: bookingData.staffId,
          staffName: bookingData.staffName,
          notes: bookingData.notes,
          createdAt: bookingData.createdAt,
          
          // Custom fields (Your Nickname, Partner Name, etc.)
          ...(bookingData['Your Nickname'] && { 'Your Nickname': bookingData['Your Nickname'] }),
          ...(bookingData['Your Nickname_label'] && { 'Your Nickname_label': bookingData['Your Nickname_label'] }),
          ...(bookingData['Your Nickname_value'] && { 'Your Nickname_value': bookingData['Your Nickname_value'] }),
          ...(bookingData["Your Partner's Name"] && { "Your Partner's Name": bookingData["Your Partner's Name"] }),
          ...(bookingData["Your Partner's Name_label"] && { "Your Partner's Name_label": bookingData["Your Partner's Name_label"] }),
          ...(bookingData["Your Partner's Name_value"] && { "Your Partner's Name_value": bookingData["Your Partner's Name_value"] }),
          
          // Arrays (movies, cakes, decor, gifts)
          selectedMovies: bookingData.selectedMovies || [],
          selectedCakes: bookingData.selectedCakes || [],
          selectedDecorItems: bookingData.selectedDecorItems || [],
          selectedGifts: bookingData.selectedGifts || [],
          
          // Complete original booking data (everything from MongoDB)
          _originalBooking: bookingData
        };
        
        console.log(`📝 Completed booking record:`, JSON.stringify(record, null, 2));
        
        // Sync to GoDaddy SQL database (PRIORITY - Always run this first)
        try {
          console.log(`🔄 Syncing completed booking to GoDaddy SQL...`);
          const { syncCompletedBookingToSQL } = await import('@/lib/godaddy-sql');
          await syncCompletedBookingToSQL(record);
          console.log(`✅ Successfully synced completed booking to GoDaddy SQL`);
        } catch (sqlError) {
          console.error('❌ Failed to sync completed booking to GoDaddy SQL:', sqlError);
        }
        
        // Save to blob storage JSON (optional backup)
        try {
          await ExportsStorage.appendToArray('completed-bookings.json', record);
          console.log(`✅ Completed booking archived to JSON (Blob-backed)`);
        } catch (err) {
          console.error('❌ Failed to archive completed booking to JSON (Blob-backed):', err);
        }

        // Manual bookings are now only in database, no JSON cleanup needed
        if (isManual) {
          console.log(`✅ Manual booking ${bookingId} completed (database only)`);
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
        // Import the new counter system
        const { incrementCounter } = await import('@/lib/counter-system');
        await incrementCounter('completed');
        // Notify customer their invoice is ready
        // Invoice email is triggered explicitly when payment is marked as paid
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
          // Import the new counter system
          const { incrementCounter } = await import('@/lib/counter-system');
          await incrementCounter('completed');
          
        }
        }

        if (paymentStatus !== undefined && paymentStatus !== oldPaymentStatus) {
          const normalizedPaymentStatus = String(paymentStatus).toLowerCase();
          if (normalizedPaymentStatus === 'paid' && sendInvoice) {
            let updatedBookingData: any = null;
            try {
              if (isManual) {
                const manualBookings = await database.getAllManualBookings();
                updatedBookingData = manualBookings.manualBookings?.find((b: any) => (b.bookingId || b.id) === bookingId) || null;
              } else {
                const updatedBookingResult = await database.getBookingById(bookingId);
                updatedBookingData = updatedBookingResult.booking;
              }
            } catch (fetchError) {
              console.error('❌ Failed to fetch updated booking for payment email:', fetchError);
            }

            const bookingForEmail = updatedBookingData || currentBooking;
            if (bookingForEmail) {
              try {
                const mailData: any = {
                  id: bookingForEmail.bookingId || bookingForEmail.id || bookingId,
                  name: bookingForEmail.name,
                  email: bookingForEmail.email,
                  phone: bookingForEmail.phone,
                  theaterName: bookingForEmail.theaterName || bookingForEmail.theater,
                  date: bookingForEmail.date,
                  time: bookingForEmail.time,
                  numberOfPeople: bookingForEmail.numberOfPeople,
                  totalAmount: bookingForEmail.totalAmount
                };

                emailService.sendBookingInvoiceReady(mailData).catch(() => {});
              } catch (mailError) {
                console.error('❌ Failed to send payment invoice email:', mailError);
              }
            }
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

