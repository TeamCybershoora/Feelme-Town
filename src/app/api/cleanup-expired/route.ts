import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/cleanup-expired - Simple cleanup of expired bookings
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of expired bookings...');
    
    // Get current date and time
    const now = new Date();
    const currentDateTime = now.toISOString();
    
    console.log('⏰ Current date/time:', currentDateTime);
    
    // Call database cleanup function
    const result = await database.deleteExpiredBookings(now);
    
    if (result.success) {
      console.log(`✅ Cleanup completed: ${result.deletedCount} expired bookings deleted`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} expired bookings`,
        deletedCount: result.deletedCount,
        currentDateTime: currentDateTime,
        deletedBookings: result.deletedBookings || []
      }, { status: 200 });
    } else {
      console.error('❌ Cleanup failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to cleanup expired bookings' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup expired bookings. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// GET /api/cleanup-expired - Check how many bookings would be deleted
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking for expired bookings...');
    
    const now = new Date();
    const currentDateTime = now.toISOString();
    
    // Get expired bookings without deleting
    const result = await database.getExpiredBookings(now);
    
    if (result.success) {
      console.log(`📊 Found ${result.expiredCount} expired bookings`);
      
      return NextResponse.json({
        success: true,
        message: `Found ${result.expiredCount} expired bookings`,
        expiredCount: result.expiredCount,
        expiredBookings: result.expiredBookings || [],
        currentDateTime: currentDateTime
      }, { status: 200 });
    } else {
      console.error('❌ Failed to check expired bookings:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to check expired bookings' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error checking expired bookings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check expired bookings. Please try again.' 
      },
      { status: 500 }
    );
  }
}
