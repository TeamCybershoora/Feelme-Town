import { NextResponse } from 'next/server';

// GET /api/cron/cleanup - Cron job endpoint for auto-cleanup
// Call this endpoint every 5 minutes using a cron service or scheduler
export async function GET() {
  try {
    console.log('🔄 CRON: Auto-cleanup triggered');
    
    // Call the auto-complete-expired API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/auto-complete-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ CRON: Completed ${result.completedCount} expired bookings`);
      if (result.completedCount > 0) {
        console.log('📋 CRON: Expired bookings:', result.expiredBookings);
      }
    } else {
      console.error('❌ CRON: Failed:', result.error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup cron executed',
      result
    });
  } catch (error) {
    console.error('❌ CRON: Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST method
export async function POST() {
  return GET();
}
