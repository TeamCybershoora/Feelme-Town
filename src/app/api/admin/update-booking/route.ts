import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';

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
          const fs = require('fs').promises;
          const path = require('path');
          const manualJsonPath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
          const manualContent = await fs.readFile(manualJsonPath, 'utf8').catch(() => '');
          const trimmed = (manualContent || '').trim();
          if (trimmed) {
            const data = JSON.parse(trimmed);
            const records = Array.isArray(data) ? data : (Array.isArray((data as any)?.records) ? (data as any).records : []);
            const found = records.find((r: any) => (r.bookingId || r.id) === bookingId);
            if (found) {
              bookingData = found;
              isManual = true;
              jsonManualRecordFound = true;
            }
          }
        } catch {}
      }
      
      // Save to cancelled JSON file before deleting
      if (bookingData) {
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
          
          // Read existing cancelled bookings
          let cancelledBookings = [] as any[];
          try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf8');
            const trimmed = (fileContent || '').trim();
            cancelledBookings = trimmed ? JSON.parse(trimmed) : [];
          } catch (err) {
            // File doesn't exist yet, start with empty array
            cancelledBookings = [];
          }
          
          // Add new cancelled booking with timestamp
          cancelledBookings.push({
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
          });
          
          // Write back to file
          await fs.writeFile(jsonFilePath, JSON.stringify(cancelledBookings, null, 2), 'utf8');
          console.log(`✅ Cancelled booking saved to JSON file`);

          // If manual, also remove from manual-bookings.json
          if (isManual) {
            try {
              const manualJsonPath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
              const manualContent = await fs.readFile(manualJsonPath, 'utf8').catch(() => '');
              let manualData: any = { type: 'manual', generatedAt: new Date().toISOString(), total: 0, records: [] };
              const mtrim = (manualContent || '').trim();
              if (mtrim) {
                try { manualData = JSON.parse(mtrim); } catch {}
              }
              if (Array.isArray(manualData.records)) {
                manualData.records = manualData.records.filter((r: any) => (r.bookingId || r.id) !== (bookingData.bookingId || bookingData.id));
                manualData.total = manualData.records.length;
                manualData.generatedAt = new Date().toISOString();
                await fs.writeFile(manualJsonPath, JSON.stringify(manualData, null, 2), 'utf8');
                console.log(`🧹 Removed manual booking ${bookingId} from manual-bookings.json`);
              }
            } catch {}
          }
        } catch (err) {
          console.error('❌ Failed to save to JSON file:', err);
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
          const fs = require('fs').promises;
          const path = require('path');
          const manualJsonPath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
          const manualContent = await fs.readFile(manualJsonPath, 'utf8').catch(() => '');
          const trimmed = (manualContent || '').trim();
          if (trimmed) {
            const data = JSON.parse(trimmed);
            const records = Array.isArray(data) ? data : (Array.isArray((data as any)?.records) ? (data as any).records : []);
            const found = records.find((r: any) => (r.bookingId || r.id) === bookingId);
            if (found) {
              bookingData = found;
              isManual = true;
              jsonManualRecordFound = true;
            }
          }
        } catch {}
      }

      // Save to completed JSON file before deleting
      if (bookingData) {
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');

          // Ensure directory exists
          await fs.mkdir(path.dirname(jsonFilePath), { recursive: true }).catch(() => {});

          // Read existing completed bookings
          let completedBookings = [] as any[];
          try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf8');
            const trimmed = (fileContent || '').trim();
            completedBookings = trimmed ? JSON.parse(trimmed) : [];
          } catch (err) {
            // File doesn't exist yet, start with empty array
            completedBookings = [];
          }

          // Push record
          completedBookings.push({
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
          });

          // Write back
          await fs.writeFile(jsonFilePath, JSON.stringify(completedBookings, null, 2), 'utf8');
          console.log(`✅ Completed booking archived to JSON`);

          // If manual, also remove from manual-bookings.json so it doesn't appear in manual list anymore
          if (isManual) {
            try {
              const manualJsonPath = path.join(process.cwd(), 'data', 'exports', 'manual-bookings.json');
              const manualContent = await fs.readFile(manualJsonPath, 'utf8').catch(() => '');
              let manualData: any = { type: 'manual', generatedAt: new Date().toISOString(), total: 0, records: [] };
              const mtrim = (manualContent || '').trim();
              if (mtrim) {
                try { manualData = JSON.parse(mtrim); } catch {}
              }
              if (Array.isArray(manualData.records)) {
                manualData.records = manualData.records.filter((r: any) => (r.bookingId || r.id) !== (bookingData.bookingId || bookingData.id));
                manualData.total = manualData.records.length;
                manualData.generatedAt = new Date().toISOString();
                await fs.writeFile(manualJsonPath, JSON.stringify(manualData, null, 2), 'utf8');
                console.log(`🧹 Removed manual booking ${bookingId} from manual-bookings.json after completion`);
              }
            } catch {}
          }
        } catch (err) {
          console.error('❌ Failed to archive completed booking to JSON:', err);
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

