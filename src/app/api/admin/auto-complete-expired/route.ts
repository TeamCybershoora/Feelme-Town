import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/admin/auto-complete-expired - Auto-complete expired bookings
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await database.connect();
    
    const db = database.db();
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('bookings');
    const currentDateTime = new Date();
    
    
    
    // Get all confirmed bookings (not completed or cancelled)
    const confirmedBookings = await collection.find({ 
      status: 'confirmed' 
    }).toArray();
    
    const expiredBookings = [];
    
    // Check each booking to see if it's expired
    for (const booking of confirmedBookings) {
      try {
        // Decompress booking data to get date and time
        let bookingData = booking;
        if (booking.compressedData) {
          const decompressed = await database.decompressData(booking.compressedData) as Record<string, unknown>;
          bookingData = { ...booking, ...decompressed };
        }
        
        if (bookingData.date && bookingData.time) {
          // Parse date (e.g., "Friday, October 3, 2025")
          const dateStr = bookingData.date;
          let bookingDate;
          
          if (dateStr.includes(',')) {
            const parts = dateStr.split(', ');
            if (parts.length >= 3) {
              const monthDay = parts[1];
              const year = parts[2];
              bookingDate = new Date(`${monthDay}, ${year}`);
            }
          } else {
            bookingDate = new Date(dateStr);
          }
          
          if (bookingDate && !isNaN(bookingDate.getTime())) {
            // Parse time (e.g., "8:00 PM - 11:00 PM")
            const timeStr = bookingData.time;
            const timeParts = timeStr.split(' - ');
            
            if (timeParts.length === 2) {
              const endTimeStr = timeParts[1].trim();
              const [time, period] = endTimeStr.split(' ');
              const [hours, minutes] = time.split(':');
              
              let hour24 = parseInt(hours);
              if (period === 'PM' && hour24 !== 12) hour24 += 12;
              if (period === 'AM' && hour24 === 12) hour24 = 0;
              
              const endDateTime = new Date(bookingDate);
              endDateTime.setHours(hour24, parseInt(minutes), 0, 0);
              
              // Check if booking has expired (current time > end time)
              if (currentDateTime > endDateTime) {
                expiredBookings.push({
                  bookingId: bookingData.bookingId,
                  mongoId: booking._id,
                  name: bookingData.name,
                  date: bookingData.date,
                  time: bookingData.time,
                  endDateTime: endDateTime.toISOString()
                });
              }
            }
          }
        }
      } catch (error) {
        
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
    
    
    
    // Update expired bookings to completed status
    let completedCount = 0;
    
    for (const expiredBooking of expiredBookings) {
      try {
        // Update booking status to completed
        const updateResult = await collection.updateOne(
          { _id: expiredBooking.mongoId },
          { 
            $set: { 
              status: 'completed',
              autoCompleted: true,
              autoCompletedAt: currentDateTime,
              updatedAt: currentDateTime
            } 
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          // Increment completed counter
          await database.incrementCounter('completed');
          completedCount++;
          
          
        }
      } catch (error) {
        
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto-completed ${completedCount} expired bookings`,
      completedCount,
      expiredBookings: expiredBookings.map(b => ({
        bookingId: b.bookingId,
        name: b.name,
        date: b.date,
        time: b.time,
        endDateTime: b.endDateTime
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

