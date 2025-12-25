import { NextResponse } from 'next/server';

// GET /api/cron/cleanup - Cron job endpoint for auto-cleanup
// Call this endpoint every 5 minutes using a cron service or scheduler
export async function GET() {
  try {
    console.log('🔄 CRON: Auto-cleanup triggered');

    const autoCompleteModule = await import('@/app/api/bookings/auto-complete-expired/route');
    const mockRequest = {
      json: async () => ({}),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'POST',
      url: 'http://localhost/api/bookings/auto-complete-expired',
    } as any;

    const response = await autoCompleteModule.POST(mockRequest);
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
