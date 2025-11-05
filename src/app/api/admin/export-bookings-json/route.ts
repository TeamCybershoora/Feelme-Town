import { NextRequest, NextResponse } from 'next/server';
import { getConnectionPool } from '@/lib/godaddy-sql';

// GET /api/admin/export-bookings-json?type=completed|manual|cancelled
// Now fetches from GoDaddy SQL database instead of blob storage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get('type') || 'completed').toLowerCase();
    const type = (['completed', 'manual', 'cancelled'] as const).includes(typeParam as any)
      ? (typeParam as 'completed' | 'manual' | 'cancelled')
      : 'completed';

    let bookings: any[] = [];

    // Fetch from GoDaddy SQL database
    try {
      const pool = getConnectionPool();
      const connection = await pool.getConnection();
      
      if (type === 'completed') {
        const [rows] = await connection.execute(`
          SELECT 
            booking_id, name, email, phone, theater_name,
            DATE_FORMAT(booking_date, '%Y-%m-%d') as date,
            booking_time as time, occasion, number_of_people as numberOfPeople,
            total_amount as totalAmount,
            DATE_FORMAT(completed_at, '%Y-%m-%d %H:%i:%s') as completedAt,
            booking_status as status, payment_status as paymentStatus
          FROM completed_bookings
          ORDER BY completed_at DESC
        `);
        bookings = rows as any[];
        console.log(`📊 Fetched ${bookings.length} completed bookings from GoDaddy SQL`);
        
      } else if (type === 'cancelled') {
        const [rows] = await connection.execute(`
          SELECT 
            booking_id, name, email, phone, theater_name,
            DATE_FORMAT(booking_date, '%Y-%m-%d') as date,
            booking_time as time, occasion, number_of_people as numberOfPeople,
            total_amount as totalAmount,
            DATE_FORMAT(cancelled_at, '%Y-%m-%d %H:%i:%s') as cancelledAt,
            cancellation_reason as cancelReason,
            refund_amount as refundAmount, refund_status as refundStatus
          FROM cancelled_bookings
          ORDER BY cancelled_at DESC
        `);
        bookings = rows as any[];
        console.log(`📊 Fetched ${bookings.length} cancelled bookings from GoDaddy SQL`);
        
      } else if (type === 'manual') {
        // Manual bookings are not stored in SQL, return empty array
        console.log(`⚠️ Manual bookings are not stored in GoDaddy SQL`);
        bookings = [];
      }
      
      connection.release();
      
    } catch (sqlError) {
      console.error('❌ Failed to fetch from GoDaddy SQL:', sqlError);
      // Return empty array if SQL fails
      bookings = [];
    }

    return NextResponse.json({
      success: true,
      bookings: bookings,
      type: type,
      count: bookings.length,
      source: 'godaddy-sql'
    });

  } catch (error) {
    console.error('❌ Error in export-bookings-json API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings',
      bookings: []
    }, { status: 500 });
  }
}
