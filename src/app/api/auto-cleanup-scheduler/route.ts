import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import { ExportsStorage } from '@/lib/exports-storage'; // Dummy - no longer used
import emailService from '@/lib/email-service';
import { incrementCounter } from '@/lib/counter-system';

// Global variable to track if cleanup is already running
let isCleanupRunning = false;
let cleanupInterval: NodeJS.Timeout | null = null;

// Auto-start the scheduler when the API route is first loaded (no ENV flag required)
const shouldAutoStart = process.env.NEXT_PHASE !== 'phase-production-build';
if (shouldAutoStart && !isCleanupRunning) {
  console.log('🚀 Auto-starting cleanup scheduler...');
  isCleanupRunning = true;
  
  // Run cleanup immediately on start
  performCleanup().then(() => {
    console.log('✅ Initial cleanup completed');
  }).catch(err => {
    console.error('❌ Initial cleanup failed:', err);
  });
  
  // Then run every 5 minutes
  cleanupInterval = setInterval(async () => {
    console.log('⏰ Running scheduled cleanup...');
    await performCleanup();
  }, 300000); // 5 minutes = 300000ms
  
  console.log('✅ Auto-cleanup scheduler started (runs every 5 minutes)');
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      if (isCleanupRunning) {
        return NextResponse.json({
          success: false,
          message: 'Automatic cleanup is already running'
        });
      }
      
      
      isCleanupRunning = true;
      
      // Run cleanup every 5 minutes
      cleanupInterval = setInterval(async () => {
        await performCleanup();
      }, 300000); // 5 minutes interval
      
      return NextResponse.json({
        success: true,
        message: 'Automatic cleanup scheduler started (runs every 5 minutes)'
      });
      
    } else if (action === 'stop') {
      if (!isCleanupRunning) {
        return NextResponse.json({
          success: false,
          message: 'Automatic cleanup is not running'
        });
      }
      
      
      isCleanupRunning = false;
      
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Automatic cleanup scheduler stopped'
      });
      
    } else if (action === 'status') {
      return NextResponse.json({
        success: true,
        isRunning: isCleanupRunning,
        message: isCleanupRunning ? 'Automatic cleanup is running' : 'Automatic cleanup is stopped'
      });
      
    } else if (action === 'run') {
      // Manual run
      const result = await performCleanup();
      return NextResponse.json({
        success: true,
        message: 'Manual cleanup completed',
        result: result
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use: start, stop, status, or run'
    });
    
  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Function to perform the actual cleanup
async function performCleanup() {
  try {
    console.log('🔄 Auto-cleanup: Checking for expired bookings...');
    
    // Call the auto-complete-expired logic directly
    const autoCompleteModule = await import('../bookings/auto-complete-expired/route');
    
    // Create a mock NextRequest
    const mockRequest = {
      json: async () => ({}),
      headers: new Headers(),
      method: 'POST',
      url: 'http://localhost/api/bookings/auto-complete-expired'
    } as any;
    
    const response = await autoCompleteModule.POST(mockRequest);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Auto-cleanup: Completed ${result.completedCount} expired bookings`);
      if (result.completedCount > 0) {
        console.log('📋 Expired bookings:', result.expiredBookings);
      }
    } else {
      console.error('❌ Auto-cleanup: Failed to complete expired bookings:', result.error);
    }
  } catch (error) {
    console.error('❌ Auto-cleanup: Error in performCleanup:', error);
  }
}

/* LEGACY CLEANUP CODE - DISABLED
// Old cleanup logic replaced by auto-complete-expired API call
async function performCleanupLegacy() {
  try { 
    const nowUtcMs = Date.now();
    const IST_OFFSET_MINUTES = 330;
    
    
    

    let totalDeleted = 0;
    const deletedBookings = [];

    // Helper function to calculate expiry time (1 minute after time slot ends)
    const calculateExpiryTime = (date: string, time: string) => {
      try {
        let startHour24 = 0;
        let startMinutes = 0;
        let endHour24 = 21;
        let endMinutes = 0;
        let addOneDay = false;
        if (time && time.includes(' - ')) {
          const [startStrRaw, endStrRaw] = time.split(' - ');
          const startStr = startStrRaw.trim();
          const endStr = endStrRaw.trim();
          const tRe = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
          const s = startStr.match(tRe);
          const e = endStr.match(tRe);
          if (s) {
            let h = parseInt(s[1]);
            const m = parseInt(s[2]);
            const p = s[3].toUpperCase();
            if (p === 'PM' && h !== 12) h += 12; else if (p === 'AM' && h === 12) h = 0;
            startHour24 = h; startMinutes = m;
          }
          if (e) {
            let h = parseInt(e[1]);
            const m = parseInt(e[2]);
            const p = e[3].toUpperCase();
            if (p === 'PM' && h !== 12) h += 12; else if (p === 'AM' && h === 12) h = 0;
            endHour24 = h; endMinutes = m;
          }
          const startTotal = startHour24 * 60 + startMinutes;
          const endTotal = endHour24 * 60 + endMinutes;
          if (endTotal < startTotal) addOneDay = true;
        }
        let year = NaN, monthIndex = NaN, day = NaN;
        if (date && date.includes(',')) {
          const dateParts = date.split(', ');
          if (dateParts.length >= 2) {
            const dateStr = dateParts[1];
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const parts = dateStr.split(' ');
            if (parts.length >= 2) {
              const monthName = parts[0];
              const dayStr = parts[1].replace(',', '');
              const yearStr = parts[2] || String(new Date().getFullYear());
              monthIndex = monthNames.indexOf(monthName);
              day = parseInt(dayStr);
              year = parseInt(yearStr);
            }
          }
        }
        if (isNaN(year) || isNaN(monthIndex) || isNaN(day)) {
          const d = new Date(date);
          year = d.getFullYear();
          monthIndex = d.getMonth();
          day = d.getDate();
        }
        if (addOneDay) day += 1;
        const istMs = Date.UTC(year, monthIndex, day, endHour24, endMinutes);
        const expiryUtcMs = istMs - IST_OFFSET_MINUTES * 60 * 1000 + 5 * 60 * 1000;
        return new Date(expiryUtcMs);
      } catch (error) {
        
        return null;
      }
    };

    // Get all bookings using database functions
    const allBookingsResult = await database.getAllBookings();
    const allBookings = allBookingsResult.bookings || [];
    

    // Check each booking for expiry
    for (const booking of allBookings) {
      const expiryTime = calculateExpiryTime(booking.date, booking.time);
      const expiredBySlot = !!(expiryTime && nowUtcMs > expiryTime.getTime());
      let expiredByField = false;
      try {
        if (booking && (booking as any).expiredAt) {
          const t = new Date((booking as any).expiredAt).getTime();
          if (!Number.isNaN(t) && nowUtcMs > t) {
            expiredByField = true;
          }
        }
      } catch {}
      
      
      
      
      
      
      const bookingStatus = String(booking.status || '').trim().toLowerCase();
      if ((bookingStatus === 'confirmed' || bookingStatus === 'manual') && (expiredBySlot || expiredByField)) {
        
        
        
        // Sync to GoDaddy SQL database (PRIORITY)
        try {
          const completedRecord = {
            bookingId: booking.bookingId || booking.id,
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            theaterName: booking.theaterName,
            date: booking.date,
            time: booking.time,
            occasion: booking.occasion,
            numberOfPeople: booking.numberOfPeople,
            advancePayment: booking.advancePayment,
            venuePayment: booking.venuePayment,
            totalAmount: booking.totalAmount,
            // Add decoration items
            selectedDecorItems: booking.selectedDecorItems || [],
            selectedCakes: booking.selectedCakes || [],
            selectedGifts: booking.selectedGifts || [],
            selectedMovies: booking.selectedMovies || [],
            // Add theater price details
            theaterPrice: booking.theaterPrice || 0,
            extraGuestCharges: booking.extraGuestCharges || 0,
            // Add all occasion-specific fields
            ...booking,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
          
          console.log('🔄 Syncing auto-completed booking to GoDaddy SQL...');
          const { syncCompletedBookingToSQL } = await import('@/lib/godaddy-sql');
          await syncCompletedBookingToSQL(completedRecord);
          console.log('✅ Successfully synced auto-completed booking to GoDaddy SQL:', booking.bookingId);
        } catch (sqlError) {
          console.error('❌ Failed to sync completed booking to GoDaddy SQL:', sqlError);
        }
        
        // Delete booking from database (and manual collection if it's a manual booking)
        const deleteResult = await database.deleteBooking(booking.bookingId || booking.id);
        
        // If this was originally a manual booking, also delete from manual collection
        if (booking.sourceCollection === 'manual_booking' || booking.isManualBooking) {
          try {
            await (database as any).deleteManualBooking?.(booking.bookingId || booking.id);
            console.log(`🗑️ Also deleted manual booking ${booking.bookingId} from manual collection`);
          } catch (err) {
            console.log(`⚠️ Could not delete from manual collection: ${err}`);
          }
        }
        
        if (deleteResult.success) {
          console.log(`✅ Booking ${booking.bookingId} saved to JSON and deleted`);
          
          const expiredLocal = (() => {
            const baseMs = expiryTime ? (expiryTime.getTime() + IST_OFFSET_MINUTES * 60 * 1000) : (nowUtcMs + IST_OFFSET_MINUTES * 60 * 1000);
            return new Date(baseMs).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          })();
          deletedBookings.push({
            name: booking.name,
            theaterName: booking.theaterName,
            date: booking.date,
            time: booking.time,
            expiredAt: expiredLocal,
            action: 'saved to JSON and deleted'
          });
          
          totalDeleted++;
          try {
            // Import the new counter system
            const { incrementCounter: incrementNewCounter } = await import('@/lib/counter-system');
            await incrementNewCounter('completed');
            console.log('✅ Completed counter incremented for:', booking.bookingId);
          } catch (counterError) {
            console.error('❌ Failed to increment completed counter:', counterError);
          }
          // Invoice emails are now triggered only when payment is marked as paid by staff
        }
      }
    }

    // Also process manual bookings
    try {
      const manualResult = await (database as any).getAllManualBookings?.();
      const manualList = manualResult?.manualBookings || [];

      for (const booking of manualList) {
        const expiryTime = calculateExpiryTime(booking.date, booking.time);
        const expiredBySlot = !!(expiryTime && nowUtcMs > expiryTime.getTime());
        let expiredByField = false;
        try {
          if (booking && (booking as any).expiredAt) {
            const t = new Date((booking as any).expiredAt).getTime();
            if (!Number.isNaN(t) && nowUtcMs > t) {
              expiredByField = true;
            }
          }
        } catch {}

        const manualBookingStatus = String(booking.status || '').trim().toLowerCase();
        if ((manualBookingStatus === 'confirmed' || manualBookingStatus === 'manual') && (expiredBySlot || expiredByField)) {
          // Archive to completed JSON
          try {
            const record = {
              bookingId: booking.bookingId || booking.id,
              name: booking.name,
              email: booking.email,
              phone: booking.phone,
              theaterName: booking.theaterName,
              date: booking.date,
              time: booking.time,
              occasion: booking.occasion,
              numberOfPeople: booking.numberOfPeople,
              advancePayment: booking.advancePayment,
              venuePayment: booking.venuePayment,
              totalAmount: booking.totalAmount,
              selectedDecorItems: booking.selectedDecorItems || [],
              selectedCakes: booking.selectedCakes || [],
              selectedGifts: booking.selectedGifts || [],
              selectedMovies: booking.selectedMovies || [],
              theaterPrice: booking.theaterPrice || 0,
              extraGuestCharges: booking.extraGuestCharges || 0,
              ...booking,
              status: 'completed',
              completedAt: new Date().toISOString()
            };
            await ExportsStorage.appendToArray('completed-bookings.json', record);
          } catch {}

          // Manual bookings are now only in database, no JSON cleanup needed

          // Delete from manual collection (fallback to main delete)
          let delRes: any = null;
          try { delRes = await (database as any).deleteManualBooking?.(booking.bookingId || booking.id); } catch {}
          if (!delRes || !delRes.success) {
            try { delRes = await database.deleteBooking(booking.bookingId || booking.id); } catch {}
          }
          if (delRes && delRes.success) {
            totalDeleted++;
            try { 
              // Import the new counter system
              const { incrementCounter: incrementNewCounter } = await import('@/lib/counter-system');
              await incrementNewCounter('completed');
              
              // Update completed-bookings.json
              const completedRecord = {
                id: booking._id || booking.id,
                bookingId: booking.bookingId,
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
                status: 'completed',
                createdAt: booking.createdAt,
                completedAt: new Date().toISOString()
              };
              
              await ExportsStorage.appendToArray('completed-bookings.json', completedRecord);
              console.log('✅ Cleanup completed booking written to completed-bookings.json:', booking.bookingId);
            } catch {}
            // Invoice emails are now triggered only when payment is marked as paid by staff
          }
        }
      }
    } catch {}

    // Get all incomplete bookings
    const allIncompleteBookingsResult = await database.getAllIncompleteBookings();
    const allIncompleteBookings = allIncompleteBookingsResult.incompleteBookings || [];
    

    // Check each incomplete booking for 12-hour expiry (from creation time)
    for (const booking of allIncompleteBookings) {
      if (booking.createdAt) {
        const createdTime = new Date(booking.createdAt);
        const twelveHoursAfterCreation = new Date(createdTime.getTime() + (12 * 60 * 60 * 1000));
        
        
        
        
        
        
        if (nowUtcMs > twelveHoursAfterCreation.getTime()) {
          
          
          // Delete the incomplete booking permanently
          const deleteResult = await database.deleteIncompleteBooking(booking.bookingId || booking.id);
          
          
          deletedBookings.push({
            name: booking.name || 'Unknown',
            theaterName: booking.theaterName || 'Unknown',
            date: booking.date || 'Unknown',
            time: booking.time || 'Unknown',
            createdAt: createdTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            expiredAt: twelveHoursAfterCreation.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            action: 'deleted (incomplete booking - 12 hours expired)'
          });
          
          totalDeleted++;
        }
      }
    }

    // Clean up cancelled bookings older than 12 hours - DISABLED
    // Cancelled bookings should be kept permanently for records and Excel exports
    // const cancelledCleanupResult = await database.deleteOldCancelledBookings();
    
    let cancelledDeleted = 0;
    // if (cancelledCleanupResult.success) {
    //   cancelledDeleted = cancelledCleanupResult.deletedCount || 0;
    //   
    // } else {
    //   
    // }

    const totalProcessed = totalDeleted + cancelledDeleted;
    if (totalProcessed > 0) {
      
    } else {
      
    }

    // ✅ Auto-cleanup old JSON data (1 month old)
    let jsonCleanupResult = { totalDeleted: 0 };
    try {
      const cleanupResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/cleanup-old-json-data`, {
        method: 'POST'
      });
      if (cleanupResponse.ok) {
        jsonCleanupResult = await cleanupResponse.json();
        console.log(`🧹 JSON cleanup: ${jsonCleanupResult.totalDeleted} old records deleted`);
      }
    } catch (err) {
      console.error('❌ JSON cleanup failed:', err);
    }

    return {
      totalDeleted,
      cancelledDeleted,
      totalProcessed,
      deletedBookings,
      jsonDeleted: jsonCleanupResult.totalDeleted,
      currentTime: new Date(nowUtcMs + IST_OFFSET_MINUTES * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      message: totalProcessed > 0 ? 
        `${totalDeleted} expired bookings marked as completed, ${cancelledDeleted} old cancelled bookings deleted, ${jsonCleanupResult.totalDeleted} old JSON records cleaned` : 
        'No expired or old cancelled bookings found'
    };

  } catch (error) {
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
*/
