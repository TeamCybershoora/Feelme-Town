import mysql from 'mysql2/promise';

// GoDaddy SQL Database Configuration
const GODADDY_DB_CONFIG = {
  host: process.env.GODADDY_DB_HOST || 'localhost',
  user: process.env.GODADDY_DB_USER || 'root',
  password: process.env.GODADDY_DB_PASSWORD || '',
  database: process.env.GODADDY_DB_NAME || 'feelme_town',
  port: parseInt(process.env.GODADDY_DB_PORT || '3306'),
  // Remove SSL for GoDaddy shared hosting - it doesn't support secure connections
  // ssl: false
};

// Create connection pool for better performance
let connectionPool: mysql.Pool | null = null;

const getConnectionPool = () => {
  if (!connectionPool) {
    connectionPool = mysql.createPool({
      ...GODADDY_DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return connectionPool;
};

// Export for use in API routes
export { getConnectionPool };

// Test database connection
export const testGoDaddyConnection = async () => {
  try {
    const pool = getConnectionPool();
    const connection = await pool.getConnection();
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();
    
    console.log('✅ GoDaddy SQL Database connected successfully');
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('❌ GoDaddy SQL Database connection failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Create tables if they don't exist
export const createGoDaddyTables = async () => {
  try {
    const pool = getConnectionPool();
    const connection = await pool.getConnection();
    
    // Create cancelled_bookings table
    const cancelledBookingsTable = `
      CREATE TABLE IF NOT EXISTS cancelled_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        theater_name VARCHAR(255),
        booking_date DATE,
        booking_time VARCHAR(50),
        occasion VARCHAR(255),
        number_of_people INT,
        total_amount DECIMAL(10,2),
        cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cancellation_reason TEXT,
        refund_amount DECIMAL(10,2),
        refund_status VARCHAR(50),
        original_booking_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_booking_id (booking_id),
        INDEX idx_email (email),
        INDEX idx_booking_date (booking_date),
        INDEX idx_cancelled_at (cancelled_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    // Create completed_bookings table
    const completedBookingsTable = `
      CREATE TABLE IF NOT EXISTS completed_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        theater_name VARCHAR(255),
        booking_date DATE,
        booking_time VARCHAR(50),
        occasion VARCHAR(255),
        number_of_people INT,
        total_amount DECIMAL(10,2),
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        booking_status VARCHAR(50) DEFAULT 'completed',
        payment_status VARCHAR(50),
        original_booking_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_booking_id (booking_id),
        INDEX idx_email (email),
        INDEX idx_booking_date (booking_date),
        INDEX idx_completed_at (completed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(cancelledBookingsTable);
    await connection.execute(completedBookingsTable);
    
    connection.release();
    
    console.log('✅ GoDaddy SQL tables created successfully');
    return { success: true, message: 'Tables created successfully' };
  } catch (error) {
    console.error('❌ Failed to create GoDaddy SQL tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Helper function to compress JSON data
const compressJSON = (data: any): string => {
  try {
    // Remove unnecessary whitespace and compress JSON
    const jsonString = JSON.stringify(data);
    // Convert to base64 to reduce size further
    const compressed = Buffer.from(jsonString).toString('base64');
    return compressed;
  } catch (error) {
    console.error('Failed to compress JSON:', error);
    return JSON.stringify(data);
  }
};

// Helper function to decompress JSON data
const decompressJSON = (compressedData: string): any => {
  try {
    // Decode from base64
    const jsonString = Buffer.from(compressedData, 'base64').toString('utf-8');
    // Parse JSON
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decompress JSON:', error);
    // Try to parse as regular JSON (fallback for non-compressed data)
    try {
      return JSON.parse(compressedData);
    } catch {
      return null;
    }
  }
};

// Insert cancelled booking into GoDaddy SQL
export const insertCancelledBooking = async (bookingData: any) => {
  try {
    console.log(`🔄 [SQL INSERT] Getting connection pool...`);
    const pool = getConnectionPool();
    const connection = await pool.getConnection();
    console.log(`✅ [SQL INSERT] Connection acquired`);
    
    const insertQuery = `
      INSERT INTO cancelled_bookings (
        booking_id, name, email, phone, theater_name, booking_date, booking_time,
        occasion, number_of_people, total_amount, cancelled_at, cancellation_reason,
        refund_amount, refund_status, original_booking_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        theater_name = VALUES(theater_name),
        booking_date = VALUES(booking_date),
        booking_time = VALUES(booking_time),
        occasion = VALUES(occasion),
        number_of_people = VALUES(number_of_people),
        total_amount = VALUES(total_amount),
        cancelled_at = VALUES(cancelled_at),
        cancellation_reason = VALUES(cancellation_reason),
        refund_amount = VALUES(refund_amount),
        refund_status = VALUES(refund_status),
        original_booking_data = VALUES(original_booking_data),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    // Compress the original booking data to save storage
    console.log(`🔄 [SQL INSERT] Compressing booking data...`);
    const compressedData = compressJSON(bookingData);
    
    const values = [
      bookingData.bookingId || bookingData.id,
      bookingData.name,
      bookingData.email,
      bookingData.phone,
      bookingData.theaterName,
      bookingData.date ? new Date(bookingData.date) : null,
      bookingData.time,
      bookingData.occasion,
      bookingData.numberOfPeople,
      bookingData.totalAmount,
      bookingData.cancelledAt ? new Date(bookingData.cancelledAt) : new Date(),
      bookingData.cancellationReason || bookingData.cancelReason,
      bookingData.refundAmount,
      bookingData.refundStatus,
      compressedData // Store compressed data
    ];
    
    console.log(`🔄 [SQL INSERT] Executing INSERT query...`);
    console.log(`🔄 [SQL INSERT] Booking ID: ${values[0]}`);
    console.log(`🔄 [SQL INSERT] Name: ${values[1]}`);
    console.log(`🔄 [SQL INSERT] Email: ${values[2]}`);
    
    const [result] = await connection.execute(insertQuery, values);
    connection.release();
    console.log(`✅ [SQL INSERT] Query executed successfully`);
    
    const originalSize = JSON.stringify(bookingData).length;
    const compressedSize = compressedData.length;
    const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Cancelled booking inserted into GoDaddy SQL: ${bookingData.bookingId}`);
    console.log(`💾 Storage saved: ${savedPercent}% (${originalSize} → ${compressedSize} bytes)`);
    console.log(`📊 Insert ID: ${(result as any).insertId}, Affected Rows: ${(result as any).affectedRows}`);
    
    return { success: true, result };
  } catch (error) {
    console.error('❌ [SQL INSERT] Failed to insert cancelled booking into GoDaddy SQL:', error);
    console.error('❌ [SQL INSERT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      errno: (error as any).errno,
      sqlState: (error as any).sqlState
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Insert completed booking into GoDaddy SQL
export const insertCompletedBooking = async (bookingData: any) => {
  try {
    const pool = getConnectionPool();
    const connection = await pool.getConnection();
    
    const insertQuery = `
      INSERT INTO completed_bookings (
        booking_id, name, email, phone, theater_name, booking_date, booking_time,
        occasion, number_of_people, total_amount, completed_at, booking_status,
        payment_status, original_booking_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        theater_name = VALUES(theater_name),
        booking_date = VALUES(booking_date),
        booking_time = VALUES(booking_time),
        occasion = VALUES(occasion),
        number_of_people = VALUES(number_of_people),
        total_amount = VALUES(total_amount),
        completed_at = VALUES(completed_at),
        booking_status = VALUES(booking_status),
        payment_status = VALUES(payment_status),
        original_booking_data = VALUES(original_booking_data),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    // Compress the original booking data to save storage
    const compressedData = compressJSON(bookingData);
    
    const values = [
      bookingData.bookingId || bookingData.id,
      bookingData.name,
      bookingData.email,
      bookingData.phone,
      bookingData.theaterName,
      bookingData.date ? new Date(bookingData.date) : null,
      bookingData.time,
      bookingData.occasion,
      bookingData.numberOfPeople,
      bookingData.totalAmount,
      bookingData.completedAt ? new Date(bookingData.completedAt) : new Date(),
      bookingData.status || 'completed',
      bookingData.paymentStatus || 'paid',
      compressedData // Store compressed data
    ];
    
    const [result] = await connection.execute(insertQuery, values);
    connection.release();
    
    const originalSize = JSON.stringify(bookingData).length;
    const compressedSize = compressedData.length;
    const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Completed booking inserted into GoDaddy SQL: ${bookingData.bookingId}`);
    console.log(`💾 Storage saved: ${savedPercent}% (${originalSize} → ${compressedSize} bytes)`);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to insert completed booking into GoDaddy SQL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Sync JSON data to GoDaddy SQL
// DISABLED: No longer needed - data syncs directly from MongoDB to SQL
export const syncJSONToGoDaddySQL = async () => {
  console.log('⚠️ syncJSONToGoDaddySQL called but JSON sync is disabled - data syncs directly from MongoDB to SQL');
  
  return {
    success: true,
    message: 'JSON sync disabled - data syncs directly from MongoDB to SQL',
    results: {
      cancelledBookings: { synced: 0, errors: 0 },
      completedBookings: { synced: 0, errors: 0 }
    }
  };
  
  /* DISABLED CODE - keeping for reference
  try {
    const { ExportsStorage } = await import('./exports-storage');
    
    const results = {
      cancelledBookings: { synced: 0, errors: 0 },
      completedBookings: { synced: 0, errors: 0 }
    };
    
    // Sync cancelled bookings
    try {
      const cancelledBookingsData = await ExportsStorage.readArray('cancelled-bookings.json');
      console.log(`📄 Found ${cancelledBookingsData.length} cancelled bookings in JSON`);
      
      for (const booking of cancelledBookingsData) {
        const result = await insertCancelledBooking(booking);
        if (result.success) {
          results.cancelledBookings.synced++;
        } else {
          results.cancelledBookings.errors++;
          console.error(`❌ Failed to sync cancelled booking ${booking.bookingId}:`, result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error reading cancelled-bookings.json:', error);
    }
    
    // Sync completed bookings
    try {
      const completedBookingsData = await ExportsStorage.readArray('completed-bookings.json');
      console.log(`📄 Found ${completedBookingsData.length} completed bookings in JSON`);
      
      for (const booking of completedBookingsData) {
        const result = await insertCompletedBooking(booking);
        if (result.success) {
          results.completedBookings.synced++;
        } else {
          results.completedBookings.errors++;
          console.error(`❌ Failed to sync completed booking ${booking.bookingId}:`, result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error reading completed-bookings.json:', error);
    }
    
    console.log('✅ JSON to GoDaddy SQL sync completed:', results);
    return { success: true, results };
  } catch (error) {
    console.error('❌ JSON to GoDaddy SQL sync failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
  */
};

// Get booking statistics from GoDaddy SQL
export const getGoDaddyBookingStats = async () => {
  try {
    const pool = getConnectionPool();
    const connection = await pool.getConnection();
    
    // Get cancelled bookings stats
    const [cancelledStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(cancelled_at) = CURDATE() THEN 1 END) as today,
        COUNT(CASE WHEN YEARWEEK(cancelled_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as this_week,
        COUNT(CASE WHEN YEAR(cancelled_at) = YEAR(CURDATE()) AND MONTH(cancelled_at) = MONTH(CURDATE()) THEN 1 END) as this_month,
        COUNT(CASE WHEN YEAR(cancelled_at) = YEAR(CURDATE()) THEN 1 END) as this_year
      FROM cancelled_bookings
    `);
    
    // Get completed bookings stats
    const [completedStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(completed_at) = CURDATE() THEN 1 END) as today,
        COUNT(CASE WHEN YEARWEEK(completed_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as this_week,
        COUNT(CASE WHEN YEAR(completed_at) = YEAR(CURDATE()) AND MONTH(completed_at) = MONTH(CURDATE()) THEN 1 END) as this_month,
        COUNT(CASE WHEN YEAR(completed_at) = YEAR(CURDATE()) THEN 1 END) as this_year
      FROM completed_bookings
    `);
    
    connection.release();
    
    return {
      success: true,
      stats: {
        cancelled: (cancelledStats as any)[0],
        completed: (completedStats as any)[0]
      }
    };
  } catch (error) {
    console.error('❌ Failed to get GoDaddy booking stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Sync MongoDB booking to GoDaddy SQL when completed
export const syncCompletedBookingToSQL = async (bookingData: any) => {
  try {
    console.log(`🔄 Syncing completed booking to GoDaddy SQL: ${bookingData.bookingId}`);
    
    // Insert into GoDaddy SQL
    const result = await insertCompletedBooking(bookingData);
    
    if (result.success) {
      console.log(`✅ Completed booking synced to GoDaddy SQL: ${bookingData.bookingId}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to sync completed booking to GoDaddy SQL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Sync manual booking (status: manual) into completed_bookings table for parity
export const syncManualBookingToSQL = async (bookingData: any) => {
  try {
    const normalizedRecord = {
      ...bookingData,
      status: bookingData.status || 'manual',
      completedAt: bookingData.completedAt || bookingData.createdAt || new Date().toISOString(),
      paymentStatus: bookingData.paymentStatus || 'unpaid'
    };

    console.log(`🔄 Syncing manual booking to GoDaddy SQL (completed table): ${normalizedRecord.bookingId}`);
    return await insertCompletedBooking(normalizedRecord);
  } catch (error) {
    console.error('❌ Failed to sync manual booking to GoDaddy SQL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Sync MongoDB cancelled booking to GoDaddy SQL
export const syncCancelledBookingToSQL = async (bookingData: any) => {
  try {
    console.log(`🔄 Syncing cancelled booking to GoDaddy SQL: ${bookingData.bookingId}`);
    
    // Insert into GoDaddy SQL
    const result = await insertCancelledBooking(bookingData);
    
    if (result.success) {
      console.log(`✅ Cancelled booking synced to GoDaddy SQL: ${bookingData.bookingId}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to sync cancelled booking to GoDaddy SQL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export default {
  testConnection: testGoDaddyConnection,
  createTables: createGoDaddyTables,
  insertCancelledBooking,
  insertCompletedBooking,
  syncJSONToSQL: syncJSONToGoDaddySQL,
  getBookingStats: getGoDaddyBookingStats,
  syncCompletedBookingToSQL,
  syncCancelledBookingToSQL
};
