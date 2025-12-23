import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// GET /api/admin/auto-complete-expired - Check for expired bookings (read-only)
// POST /api/admin/auto-complete-expired - Auto-complete expired bookings
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await database.connect();
    
    const db = database.db();
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('booking');
    const now = new Date();
    
    console.log(`🔍 Checking for expired bookings at: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    
    // Get all confirmed bookings
    const confirmedBookings = await collection.find({
      status: { $in: ['confirmed', 'manual'] }
    }).toArray();
    
    const expiredBookingsList: any[] = [];
    const debugEntries: any[] = [];
    
    // Check each booking
    for (const booking of confirmedBookings) {
      try {
        let bookingData = booking;
        if (booking.compressedData) {
          const decompressed = await database.decompressData(booking.compressedData) as Record<string, unknown>;
          // Give priority to top-level fields (latest data) by spreading decompressed first
          bookingData = { ...decompressed, ...booking };
        }
        
        if (bookingData.date && bookingData.time) {
          const dateStr = bookingData.date;
          let bookingDate: Date | null = null;
          
          if (dateStr.includes(',')) {
            const dateParts = dateStr.split(', ');
            if (dateParts.length >= 2) {
              const dateStrPart = dateParts[1];
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
              const parts = dateStrPart.split(' ');
              
              if (parts.length >= 2) {
                const monthName = parts[0];
                const dayStr = parts[1].replace(',', '');
                const yearStr = parts[2] || new Date().getFullYear();
                
                const monthIndex = monthNames.indexOf(monthName);
                const day = parseInt(dayStr);
                const year = parseInt(String(yearStr));
                
                if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
                  bookingDate = new Date(year, monthIndex, day);
                }
              }
            }
          } else {
            bookingDate = new Date(dateStr);
          }
          
          if (bookingDate && !isNaN(bookingDate.getTime())) {
            const timeStr = bookingData.time;
            const timeParts = timeStr.split(' - ');
            
            if (timeParts.length === 2) {
              const endTimeStr = timeParts[1].trim();
              const timeMatch = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              
              if (timeMatch) {
                const [, hoursStr, minutesStr, period] = timeMatch;
                let hour24 = parseInt(hoursStr);
                const minutes = parseInt(minutesStr);
                
                if (period.toUpperCase() === 'PM' && hour24 !== 12) {
                  hour24 += 12;
                } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
                  hour24 = 0;
                }
                
                const bookingYear = bookingDate.getFullYear();
                const bookingMonth = bookingDate.getMonth();
                const bookingDay = bookingDate.getDate();
                
                const endTimeISTString = `${bookingYear}-${String(bookingMonth + 1).padStart(2, '0')}-${String(bookingDay).padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
                const endDateTimeIST = new Date(endTimeISTString);
                const expiryDateTimeIST = new Date(endDateTimeIST.getTime() + 5 * 60 * 1000);
                
                const currentTimeISTString = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                const expiryTimeISTString = expiryDateTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

                debugEntries.push({
                  bookingId: bookingData.bookingId || booking._id,
                  currentTimeIST: currentTimeISTString,
                  expiryTimeIST: expiryTimeISTString,
                  nowMs: now.getTime(),
                  expiryMs: expiryDateTimeIST.getTime(),
                  extractedEndTime: {
                    raw: endTimeStr,
                    hour24,
                    minutes,
                    endTimeISTString
                  }
                });

                if (now.getTime() > expiryDateTimeIST.getTime()) {
                  const minutesAgo = Math.floor((now.getTime() - expiryDateTimeIST.getTime()) / (60 * 1000));
                  expiredBookingsList.push({
                    bookingId: bookingData.bookingId || booking._id,
                    name: bookingData.name,
                    email: bookingData.email,
                    date: bookingData.date,
                    time: bookingData.time,
                    expiredMinutesAgo: minutesAgo,
                    endTimeIST: endDateTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking booking:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Found ${expiredBookingsList.length} expired bookings`,
      expiredCount: expiredBookingsList.length,
      expiredBookings: expiredBookingsList,
      totalConfirmedBookings: confirmedBookings.length,
      debugEntries,
      currentTimeIST: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check expired bookings' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await database.connect();
    
    const db = database.db();
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('booking');
    
    // Get current time in IST (Asia/Kolkata timezone) - IMPORTANT: All comparisons must be in IST
    const now = new Date();
    
    // Helper function to get IST time components
    const getISTTime = (date: Date) => {
      // Get IST time string and parse it
      const istString = date.toLocaleString('en-US', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      // Format: "MM/DD/YYYY, HH:MM:SS"
      const [datePart, timePart] = istString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      return {
        year: parseInt(year),
        month: parseInt(month) - 1, // 0-indexed
        day: parseInt(day),
        hour: parseInt(hour),
        minute: parseInt(minute),
        second: parseInt(second)
      };
    };
    
    const nowIST = getISTTime(now);
    const currentIST = new Date(Date.UTC(
      nowIST.year, 
      nowIST.month, 
      nowIST.day, 
      nowIST.hour, 
      nowIST.minute, 
      nowIST.second
    ));
    
    console.log(`🕐 Auto-cleanup check started at: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    
    // Get all confirmed + manual bookings (not completed or cancelled)
    const confirmedBookings = await collection.find({
      status: { $in: ['confirmed', 'manual'] }
    }).toArray();
    
    console.log(`📋 Found ${confirmedBookings.length} confirmed bookings to check`);
    
    const expiredBookings: Array<{
      mongoId: any;
      fullBookingData: any;
      endDateTime: Date;
    }> = [];
    
    // Check each booking to see if it's expired
    for (const booking of confirmedBookings) {
      try {
        // Decompress booking data to get full booking information
        let bookingData = booking;
        if (booking.compressedData) {
          const decompressed = await database.decompressData(booking.compressedData) as Record<string, unknown>;
          // Merge decompressed data with booking metadata (like _id, bookingId from top level)
          bookingData = {
            ...decompressed,
            ...booking,
            // Preserve MongoDB _id
            _id: booking._id,
            // Preserve bookingId from top level if it exists
            bookingId: booking.bookingId || (decompressed as any).bookingId || booking._id
          };
        }
        
        if (bookingData.date && bookingData.time) {
          // Parse date (e.g., "Friday, October 31, 2025" or "Thursday, October 2, 2025")
          const dateStr = bookingData.date;
          let bookingDate: Date | null = null;
          
          if (dateStr.includes(',')) {
            // Format: "Friday, October 31, 2025" - parse manually for accuracy
            const dateParts = dateStr.split(', ');
            if (dateParts.length >= 2) {
              const dateStrPart = dateParts[1]; // "October 31, 2025"
              
              // Manual parsing to avoid JavaScript date parsing issues
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
              
              const parts = dateStrPart.split(' '); // ["October", "31", "2025"]
              
              if (parts.length >= 2) {
                const monthName = parts[0]; // "October"
                const dayStr = parts[1].replace(',', ''); // "31"
                const yearStr = parts[2] || new Date().getFullYear(); // "2025" or current year
                
                const monthIndex = monthNames.indexOf(monthName);
                const day = parseInt(dayStr);
                const year = parseInt(String(yearStr));
                
                if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
                  bookingDate = new Date(year, monthIndex, day);
                }
              }
            }
          } else {
            // Format: "2025-09-27" or similar
            bookingDate = new Date(dateStr);
          }
          
          if (bookingDate && !isNaN(bookingDate.getTime())) {
            // Parse time (e.g., "7:27 AM - 10:27 AM")
            const timeStr = bookingData.time;
            const timeParts = timeStr.split(' - ');
            
            if (timeParts.length === 2) {
              const endTimeStr = timeParts[1].trim(); // "10:27 AM"
              
              // Parse end time: "10:27 AM" or "7:27 AM"
              const timeMatch = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              
              if (timeMatch) {
                const [, hoursStr, minutesStr, period] = timeMatch;
                let hour24 = parseInt(hoursStr);
                const minutes = parseInt(minutesStr);
                
                // Convert to 24-hour format
                if (period.toUpperCase() === 'PM' && hour24 !== 12) {
                  hour24 += 12;
                } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
                  hour24 = 0;
                }
                
                // Create end date time in IST
                // Booking times are stored in IST format (theater page uses IST)
                const bookingYear = bookingDate.getFullYear();
                const bookingMonth = bookingDate.getMonth();
                const bookingDay = bookingDate.getDate();
                
                // Create end date/time as IST by using a format that JavaScript can parse as IST
                // We'll create it using Intl.DateTimeFormat to ensure IST interpretation
                const endTimeISTString = `${bookingYear}-${String(bookingMonth + 1).padStart(2, '0')}-${String(bookingDay).padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
                
                // Parse as IST time (the +05:30 explicitly sets IST timezone)
                const endDateTimeIST = new Date(endTimeISTString);
                
                // Add 5 minute grace period after end time
                const expiryDateTimeIST = new Date(endDateTimeIST.getTime() + 5 * 60 * 1000);
                
                // Get current time and compare
                // Since both are Date objects, we can compare directly
                // JavaScript Date internally stores as UTC, so comparison is accurate
                if (now.getTime() > expiryDateTimeIST.getTime()) {
                  const minutesAgo = Math.floor((now.getTime() - expiryDateTimeIST.getTime()) / (60 * 1000));
                  
                  // Format times in IST for logging
                  const endTimeDisplay = endDateTimeIST.toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const currentDisplay = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                  
                  console.log(`⏰ Found expired booking: ${bookingData.bookingId || booking._id}`);
                  console.log(`   Booking: ${bookingData.date} ${bookingData.time}`);
                  console.log(`   End time (IST): ${endTimeDisplay}`);
                  console.log(`   Current time (IST): ${currentDisplay}`);
                  console.log(`   Expired ${Math.abs(minutesAgo)} minutes ago`);
                  
                  expiredBookings.push({
                    mongoId: booking._id,
                    fullBookingData: bookingData,
                    endDateTime: endDateTimeIST
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error processing booking for expiry check:', error);
      }
    }
    
    if (expiredBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired bookings found to auto-complete',
        completedCount: 0,
        expiredBookings: []
      });
    }
    
    // Process expired bookings: Sync to SQL and delete from MongoDB
    let completedCount = 0;
    
    for (const expiredBooking of expiredBookings) {
      try {
        const bookingData = expiredBooking.fullBookingData;
        
        // Create completed record with ALL booking data
        const completedRecord = {
          // Basic booking info
          bookingId: bookingData.bookingId || bookingData.id || bookingData._id?.toString(),
          name: bookingData.name || '',
          email: bookingData.email || '',
          phone: bookingData.phone || '',
          theaterName: bookingData.theaterName || '',
          date: bookingData.date || '',
          time: bookingData.time || '',
          occasion: bookingData.occasion || '',
          numberOfPeople: bookingData.numberOfPeople || 2,
          
          // Payment info
          totalAmount: bookingData.totalAmount || 0,
          advancePayment: bookingData.advancePayment || 0,
          venuePayment: bookingData.venuePayment || 0,
          
          // Completion info
          status: bookingData.status || 'completed',
          createdAt: bookingData.createdAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          
          // Additional MongoDB fields - Include ALL fields from booking data
          occasionPersonName: bookingData.occasionPersonName,
          bookingType: bookingData.bookingType,
          createdBy: bookingData.createdBy,
          isManualBooking: bookingData.isManualBooking,
          staffId: bookingData.staffId,
          staffName: bookingData.staffName,
          notes: bookingData.notes,
          
          // Arrays (movies, cakes, decor, gifts)
          selectedMovies: bookingData.selectedMovies || [],
          selectedCakes: bookingData.selectedCakes || [],
          selectedDecorItems: bookingData.selectedDecorItems || [],
          selectedGifts: bookingData.selectedGifts || [],
          
          // Include ALL dynamic occasion fields (Your Nickname, Partner Name, etc.)
          // Copy all properties from bookingData that are not already included
          ...Object.keys(bookingData).reduce((acc: any, key: string) => {
            // Skip internal MongoDB fields and fields we've already set
            if (
              ![
                '_id',
                'compressedData',
                'bookingId',
                'id',
                'name',
                'email',
                'phone',
                'theaterName',
                'date',
                'time',
                'occasion',
                'numberOfPeople',
                'totalAmount',
                'advancePayment',
                'venuePayment',
                'status',
                'createdAt',
                'occasionPersonName',
                'bookingType',
                'createdBy',
                'isManualBooking',
                'staffId',
                'staffName',
                'notes',
                'selectedMovies',
                'selectedCakes',
                'selectedDecorItems',
                'selectedGifts'
              ].includes(key)
            ) {
              acc[key] = bookingData[key];
            }
            return acc;
          }, {})
        };
        
        // Sync to GoDaddy SQL database (PRIORITY - Always run this first)
        try {
          console.log(`🔄 Syncing expired booking to GoDaddy SQL: ${completedRecord.bookingId}`);
          const { syncCompletedBookingToSQL } = await import('@/lib/godaddy-sql');
          const syncResult = await syncCompletedBookingToSQL(completedRecord);
          
          if (syncResult.success) {
            console.log(`✅ Successfully synced booking to GoDaddy SQL: ${completedRecord.bookingId}`);
            
            // Only delete from MongoDB after successful SQL sync
            try {
              const deleteResult = await collection.deleteOne({ _id: expiredBooking.mongoId });
              if (deleteResult.deletedCount > 0) {
                console.log(`✅ Auto-completed booking deleted from MongoDB: ${completedRecord.bookingId}`);
                
                try {
                  const orderCleanup = await (database as any).deleteOrdersByBookingReference?.({
                    bookingId: completedRecord.bookingId,
                    mongoBookingId: expiredBooking.mongoId?.toString?.(),
                    ticketNumber: bookingData.ticketNumber
                  });
                  if (orderCleanup?.success) {
                    console.log(`🧹 Removed ${orderCleanup.deletedCount} order records for booking ${completedRecord.bookingId}`);
                  }
                } catch (orderCleanupErr) {
                  console.warn('⚠️ Failed to cleanup order records for expired booking:', completedRecord.bookingId, orderCleanupErr);
                }
                
                // Increment completed counter
                try {
                  const { incrementCounter } = await import('@/lib/counter-system');
                  await incrementCounter('completed');
                } catch (counterError) {
                  console.error('❌ Failed to increment completed counter:', counterError);
                }
                
                completedCount++;
              } else {
                console.warn(`⚠️ Booking not found in MongoDB for deletion: ${completedRecord.bookingId}`);
              }
            } catch (deleteError) {
              console.error(`❌ Failed to delete booking from MongoDB: ${completedRecord.bookingId}`, deleteError);
            }
          } else {
            console.error(`❌ Failed to sync booking to SQL (not deleting from MongoDB): ${completedRecord.bookingId}`, syncResult.error);
          }
        } catch (sqlError) {
          console.error(`❌ Error syncing booking to GoDaddy SQL: ${completedRecord.bookingId}`, sqlError);
        }
      } catch (error) {
        console.error('❌ Error processing expired booking:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto-completed ${completedCount} expired bookings`,
      completedCount,
      expiredBookings: expiredBookings.map((b) => ({
        bookingId: b.fullBookingData.bookingId || b.fullBookingData.id || b.fullBookingData._id?.toString(),
        name: b.fullBookingData.name,
        date: b.fullBookingData.date,
        time: b.fullBookingData.time,
        endDateTime: b.endDateTime.toISOString()
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to auto-complete expired bookings'
      },
      { status: 500 }
    );
  }
}
