import { NextResponse } from 'next/server';

// GET /api/test-auto-complete - Manually trigger auto-complete check
export async function GET() {
  try {
    console.log('🧪 TEST: Manually triggering auto-complete check...');
    
    // Call the auto-complete-expired API
    const response = await fetch('http://localhost:3000/api/admin/auto-complete-expired', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log('🧪 TEST: Auto-complete result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Auto-complete check triggered',
      result
    });
  } catch (error) {
    console.error('❌ TEST: Error triggering auto-complete:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
