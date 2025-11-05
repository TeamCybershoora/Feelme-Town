import { NextRequest, NextResponse } from 'next/server';
import godaddySQL from '@/lib/godaddy-sql';

// GET /api/admin/export-godaddy-bookings - Export bookings from GoDaddy SQL to Excel format
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'completed', 'cancelled', or 'all'
    
    console.log(`📊 Exporting GoDaddy SQL bookings: ${type}`);
    
    // Test connection first
    const connectionTest = await godaddySQL.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to GoDaddy SQL database',
          details: connectionTest.error
        },
        { status: 500 }
      );
    }
    
    // Get booking data from GoDaddy SQL
    const { getConnectionPool } = await import('@/lib/godaddy-sql');
    const pool = getConnectionPool();
    
    const connection = await pool.getConnection();
    
    let completedBookings: any[] = [];
    let cancelledBookings: any[] = [];
    
    // Fetch completed bookings
    if (type === 'completed' || type === 'all') {
      const [rows] = await connection.execute(`
        SELECT 
          booking_id, name, email, phone, theater_name, 
          DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
          booking_time, occasion, number_of_people, total_amount,
          DATE_FORMAT(completed_at, '%Y-%m-%d %H:%i:%s') as completed_at,
          booking_status, payment_status
        FROM completed_bookings
        ORDER BY completed_at DESC
      `);
      completedBookings = rows as any[];
    }
    
    // Fetch cancelled bookings
    if (type === 'cancelled' || type === 'all') {
      const [rows] = await connection.execute(`
        SELECT 
          booking_id, name, email, phone, theater_name,
          DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
          booking_time, occasion, number_of_people, total_amount,
          DATE_FORMAT(cancelled_at, '%Y-%m-%d %H:%i:%s') as cancelled_at,
          cancellation_reason, refund_amount, refund_status
        FROM cancelled_bookings
        ORDER BY cancelled_at DESC
      `);
      cancelledBookings = rows as any[];
    }
    
    connection.release();
    
    console.log(`✅ Fetched ${completedBookings.length} completed and ${cancelledBookings.length} cancelled bookings`);
    
    return NextResponse.json({
      success: true,
      data: {
        completed: completedBookings,
        cancelled: cancelledBookings,
        summary: {
          totalCompleted: completedBookings.length,
          totalCancelled: cancelledBookings.length,
          total: completedBookings.length + cancelledBookings.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to export GoDaddy SQL bookings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/export-godaddy-bookings - Initialize GoDaddy SQL tables
export async function POST() {
  try {
    console.log('🔧 Initializing GoDaddy SQL database...');
    
    // Test connection
    const connectionTest = await godaddySQL.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to GoDaddy SQL database',
          details: connectionTest.error
        },
        { status: 500 }
      );
    }
    
    // Create tables
    const tablesResult = await godaddySQL.createTables();
    if (!tablesResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create GoDaddy SQL tables',
          details: tablesResult.error
        },
        { status: 500 }
      );
    }
    
    console.log('✅ GoDaddy SQL database initialized successfully');
    
    return NextResponse.json({
      success: true,
      message: 'GoDaddy SQL database initialized successfully',
      connection: connectionTest,
      tables: tablesResult
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize GoDaddy SQL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
