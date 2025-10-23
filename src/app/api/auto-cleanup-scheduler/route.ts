import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import emailService from '@/lib/email-service';

// Global variable to track if cleanup is already running
let isCleanupRunning = false;
let cleanupInterval: NodeJS.Timeout | null = null;

// Auto-start the scheduler when the API route is first loaded
if (!isCleanupRunning) {
  console.log('🚀 Auto-starting cleanup scheduler...');
  isCleanupRunning = true;
  
  // Run cleanup immediately on start
  performCleanup().then(() => {
    console.log('✅ Initial cleanup completed');
  }).catch(err => {
    console.error('❌ Initial cleanup failed:', err);
  });
  
  // Then run every 1 minute
  cleanupInterval = setInterval(async () => {
    console.log('⏰ Running scheduled cleanup...');
    await performCleanup();
  }, 60000); // 1 minute = 60000ms
  
  console.log('✅ Auto-cleanup scheduler started (runs every 1 minute)');
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
      
      // Run cleanup every 1 minute
      cleanupInterval = setInterval(async () => {
        await performCleanup();
      }, 60000); // 1 minute interval
      
      return NextResponse.json({
        success: true,
        message: 'Automatic cleanup scheduler started (runs every 1 minute)'
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
    
    
    // Get current time in IST (proper way)
    const currentTime = new Date();
    // Get IST offset (+5:30 = 330 minutes)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const currentTimeIST = new Date(currentTime.getTime() + istOffset);
    
    
    

    let totalDeleted = 0;
    const deletedBookings = [];

    // Helper function to calculate expiry time (1 minute after time slot ends)
    const calculateExpiryTime = (date: string, time: string) => {
      try {
        // Parse the end time from time slot (e.g., "9:00 AM - 12:00 PM")
        let endHour24 = 21; // Default to 9 PM
        let endMinutes = 0;
        
        if (time && time.includes(' - ')) {
          const endTime = time.split(' - ')[1].trim(); // "12:00 PM"
          
          const timeMatch = endTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minuteStr = timeMatch[2];
            const period = timeMatch[3].toUpperCase();
            
            
            
            if (period === 'PM' && hour !== 12) {
              hour += 12;
            } else if (period === 'AM' && hour === 12) {
              hour = 0;
            }
            
            endHour24 = hour;
            endMinutes = parseInt(minuteStr);
            
          } else {
            
          }
        }
        
        // No additional hour offset; we'll add a 1-minute grace after building the Date
        
        // Create expiry date (same as booking date)
        let bookingDate: Date;
        
        if (date.includes(',')) {
          const dateParts = date.split(', ');
          if (dateParts.length >= 2) {
            const dateStr = dateParts[1]; // "October 2, 2025"
            
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            const parts = dateStr.split(' ');
            if (parts.length >= 2) {
              const monthName = parts[0];
              const dayStr = parts[1].replace(',', '');
              const yearStr = parts[2] || new Date().getFullYear();
              
              const monthIndex = monthNames.indexOf(monthName);
              const day = parseInt(dayStr);
              const year = parseInt(String(yearStr));
              
              if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
                bookingDate = new Date(year, monthIndex, day);
              } else {
                throw new Error('Invalid date format');
              }
            } else {
              throw new Error('Invalid date format');
            }
          } else {
            bookingDate = new Date(date);
          }
        } else {
          bookingDate = new Date(date);
        }
        
        // Create expiry time in IST
        const expiryDateTime = new Date(bookingDate);
        expiryDateTime.setHours(endHour24, endMinutes, 0, 0);
        // Add 1 minute grace window after slot end
        expiryDateTime.setMinutes(expiryDateTime.getMinutes() + 1);
        
        // Since we're working with IST times, we need to ensure proper comparison
        // The booking date/time is assumed to be in IST, so we keep it as is
        
        
        return expiryDateTime;
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
      
      
      
      
      
      
      if (expiryTime && currentTimeIST > expiryTime && String(booking.status || '').toLowerCase() === 'confirmed') {
        
        
        
        // Save to completed JSON file before deleting
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const jsonFilePath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');
          // Ensure directory exists
          await fs.mkdir(path.dirname(jsonFilePath), { recursive: true }).catch(() => {});
          
          let completedBookings = [];
          try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf8');
            completedBookings = JSON.parse(fileContent);
          } catch (err) {
            completedBookings = [];
          }
          
          completedBookings.push({
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
            status: 'completed',
            completedAt: new Date().toISOString()
          });
          
          await fs.writeFile(jsonFilePath, JSON.stringify(completedBookings, null, 2), 'utf8');
        } catch (err) {
          console.error('❌ Failed to save to JSON file:', err);
        }
        
        // Delete booking from database
        const deleteResult = await database.deleteBooking(booking.bookingId || booking.id);
        
        if (deleteResult.success) {
          console.log(`✅ Booking ${booking.bookingId} saved to JSON and deleted`);
          
          deletedBookings.push({
            name: booking.name,
            theaterName: booking.theaterName,
            date: booking.date,
            time: booking.time,
            expiredAt: expiryTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            action: 'saved to JSON and deleted'
          });
          
          totalDeleted++;
          try {
            await database.incrementCounter('completed');
          } catch {}
          // Send invoice ready email (best-effort)
          try {
            const mailData: any = {
              id: booking.bookingId || booking.id,
              name: booking.name,
              email: booking.email,
              phone: booking.phone,
              theaterName: booking.theaterName,
              date: booking.date,
              time: booking.time,
              numberOfPeople: booking.numberOfPeople,
              totalAmount: booking.totalAmount
            };
            emailService.sendBookingInvoiceReady(mailData).catch(() => {});
          } catch {}
        }
      }
    }

    // Get all incomplete bookings
    const allIncompleteBookingsResult = await database.getAllIncompleteBookings();
    const allIncompleteBookings = allIncompleteBookingsResult.incompleteBookings || [];
    

    // Check each incomplete booking for 12-hour expiry (from creation time)
    for (const booking of allIncompleteBookings) {
      if (booking.createdAt) {
        const createdTime = new Date(booking.createdAt);
        const twelveHoursAfterCreation = new Date(createdTime.getTime() + (12 * 60 * 60 * 1000));
        
        
        
        
        
        
        if (currentTimeIST > twelveHoursAfterCreation) {
          
          
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
      currentTime: currentTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
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

// Export for manual testing
export { performCleanup };

