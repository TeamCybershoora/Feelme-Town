import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// GET /api/time-slots-with-bookings - Get time slots with booking status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const theater = searchParams.get('theater');
    
    // Get theater-specific time slots from database (EXACT SAME LOGIC AS THEATER PAGE)
    let theaterTimeSlots = [];
    
    // Helper function to format time to 12-hour format (same as theater page)
    const formatTime12Hour = (time24: string): string => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // 0 becomes 12
        return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    };
    
    if (theater) {
      try {
        // Fetch theater details from database (same API as theater page)
        const theaterResult = await database.getAllTheaters();
        
        if (theaterResult.success && theaterResult.theaters) {
          // Find the selected theater (same matching logic as theater page)
          const selectedTheater = theaterResult.theaters.find((t: any) => 
            t.name === theater || 
            t.name.includes(theater.split(' ')[0]) ||
            theater.includes(t.name.split(' ')[0])
          );
          
          if (selectedTheater) {
            
            
            // Get time slots from database - ONLY use database time slots (exact same logic as theater page)
            if (selectedTheater.timeSlots && Array.isArray(selectedTheater.timeSlots) && selectedTheater.timeSlots.length > 0) {
              theaterTimeSlots = selectedTheater.timeSlots
                .filter((slot: any) => slot.isActive)
                .map((slot: any) => {
                  // Format time slots for display (same as theater page)
                  const startTime = formatTime12Hour(slot.startTime);
                  const endTime = formatTime12Hour(slot.endTime);
                  const timeRange = `${startTime} - ${endTime}`;
                  
                  return {
                    slotId: slot.slotId || `SLOT-${slot.startTime}`,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    timeRange: timeRange,
                    duration: slot.duration || 180,
                    isActive: slot.isActive
                  };
                });
              
              
            } else {
              // No time slots in database - use default time slots for admin manual booking
              
              theaterTimeSlots = [
                {
                  slotId: 'SLOT-09:00',
                  startTime: '09:00',
                  endTime: '12:00',
                  timeRange: '9:00 AM - 12:00 PM',
                  duration: 180,
                  isActive: true
                },
                {
                  slotId: 'SLOT-12:30',
                  startTime: '12:30',
                  endTime: '15:30',
                  timeRange: '12:30 PM - 3:30 PM',
                  duration: 180,
                  isActive: true
                },
                {
                  slotId: 'SLOT-16:00',
                  startTime: '16:00',
                  endTime: '19:00',
                  timeRange: '4:00 PM - 7:00 PM',
                  duration: 180,
                  isActive: true
                },
                {
                  slotId: 'SLOT-19:30',
                  startTime: '19:30',
                  endTime: '22:30',
                  timeRange: '7:30 PM - 10:30 PM',
                  duration: 180,
                  isActive: true
                }
              ];
            }
          } else {
            
            // Use default time slots when theater is not found
            theaterTimeSlots = [
              {
                slotId: 'SLOT-09:00',
                startTime: '09:00',
                endTime: '12:00',
                timeRange: '9:00 AM - 12:00 PM',
                duration: 180,
                isActive: true
              },
              {
                slotId: 'SLOT-12:30',
                startTime: '12:30',
                endTime: '15:30',
                timeRange: '12:30 PM - 3:30 PM',
                duration: 180,
                isActive: true
              },
              {
                slotId: 'SLOT-16:00',
                startTime: '16:00',
                endTime: '19:00',
                timeRange: '4:00 PM - 7:00 PM',
                duration: 180,
                isActive: true
              },
              {
                slotId: 'SLOT-19:30',
                startTime: '19:30',
                endTime: '22:30',
                timeRange: '7:30 PM - 10:30 PM',
                duration: 180,
                isActive: true
              }
            ];
          }
        }
      } catch (error) {
        
        // Use default time slots on error
        theaterTimeSlots = [
          {
            slotId: 'SLOT-09:00',
            startTime: '09:00',
            endTime: '12:00',
            timeRange: '9:00 AM - 12:00 PM',
            duration: 180,
            isActive: true
          },
          {
            slotId: 'SLOT-12:30',
            startTime: '12:30',
            endTime: '15:30',
            timeRange: '12:30 PM - 3:30 PM',
            duration: 180,
            isActive: true
          },
          {
            slotId: 'SLOT-16:00',
            startTime: '16:00',
            endTime: '19:00',
            timeRange: '4:00 PM - 7:00 PM',
            duration: 180,
            isActive: true
          },
          {
            slotId: 'SLOT-19:30',
            startTime: '19:30',
            endTime: '22:30',
            timeRange: '7:30 PM - 10:30 PM',
            duration: 180,
            isActive: true
          }
        ];
      }
    } else {
      // No theater specified, use default time slots
      
      theaterTimeSlots = [
        {
          slotId: 'SLOT-09:00',
          startTime: '09:00',
          endTime: '12:00',
          timeRange: '9:00 AM - 12:00 PM',
          duration: 180,
          isActive: true
        },
        {
          slotId: 'SLOT-12:30',
          startTime: '12:30',
          endTime: '15:30',
          timeRange: '12:30 PM - 3:30 PM',
          duration: 180,
          isActive: true
        },
        {
          slotId: 'SLOT-16:00',
          startTime: '16:00',
          endTime: '19:00',
          timeRange: '4:00 PM - 7:00 PM',
          duration: 180,
          isActive: true
        },
        {
          slotId: 'SLOT-19:30',
          startTime: '19:30',
          endTime: '22:30',
          timeRange: '7:30 PM - 10:30 PM',
          duration: 180,
          isActive: true
        }
      ];
    }
    
    // Get all bookings for the specified date and theater
    const bookingsResult = await database.getAllBookings();
    let bookedSlots: string[] = [];
    
    if (bookingsResult.success && date && theater) {
      const bookings = bookingsResult.bookings || [];
      
      
      
      
      // Filter bookings for the specific date and theater
      bookedSlots = bookings
        .filter((booking: any) => {
          // Check if booking matches date and theater
          const bookingDate = booking.date;
          const bookingTheater = booking.theater || booking.theaterName;
          
          
          
          const dateMatch = bookingDate === date;
          const theaterMatch = bookingTheater === theater || 
                              (bookingTheater && bookingTheater.includes(theater.split(' ')[0])) ||
                              (theater && theater.includes(bookingTheater));
          const statusMatch = booking.status === 'confirmed' || booking.status === 'completed';
          
          
          
          return dateMatch && theaterMatch && statusMatch;
        })
        .map((booking: any) => booking.time)
        .filter(Boolean);
        
      
    }
    
    // Function to check if time slot is within 1 hour (Time is going) - EXACT SAME LOGIC AS THEATER PAGE
    const isTimeSlotGoing = (timeSlot: string) => {
      if (!date) return false;
      
      try {
        const now = new Date();
        const selectedDateObj = new Date(date);
        
        // If selected date is not today, no slots are "going" (same as theater page)
        if (selectedDateObj.toDateString() !== now.toDateString()) {
          return false;
        }
        
        // Parse the time slot to get start time (same regex as theater page)
        const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (!timeMatch) return false;
        
        const [, hours, minutes, period] = timeMatch;
        let hour24 = parseInt(hours);
        
        // Convert to 24-hour format (same logic as theater page)
        if (period.toLowerCase() === 'pm' && hour24 !== 12) {
          hour24 += 12;
        } else if (period.toLowerCase() === 'am' && hour24 === 12) {
          hour24 = 0;
        }
        
        const slotStartTime = new Date(now);
        slotStartTime.setHours(hour24, parseInt(minutes), 0, 0);
        
        // Check if current time is within 1 hour of slot start time (same as theater page)
        const oneHourBefore = new Date(slotStartTime.getTime() - (60 * 60 * 1000));
        return now.getTime() >= oneHourBefore.getTime() && now.getTime() < slotStartTime.getTime();
      } catch (error) {
        
        return false;
      }
    };

    // Combine time slots with booking status and "going" status
    const timeSlotsWithStatus = theaterTimeSlots.map((slot: any) => {
      const isBooked = bookedSlots.includes(slot.timeRange || `${slot.startTime} - ${slot.endTime}`);
      const isGoing = isTimeSlotGoing(slot.timeRange); // Pass timeRange string to function
      
      let bookingStatus = 'available';
      if (isBooked) bookingStatus = 'booked';
      else if (isGoing) bookingStatus = 'going';
      
      return {
        ...slot,
        isBooked,
        isGoing,
        bookingStatus
      };
    });
    
    return NextResponse.json({
      success: true,
      timeSlots: timeSlotsWithStatus,
      total: timeSlotsWithStatus.length,
      bookedCount: bookedSlots.length,
      availableCount: timeSlotsWithStatus.length - bookedSlots.length,
      filters: {
        date,
        theater
      }
    });
    
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time slots with booking status' },
      { status: 500 }
    );
  }
}

