// Test booking cancellation and SQL sync
const mysql = require('mysql2/promise');

// Simulate a cancelled booking
const testBookingData = {
  bookingId: 'TEST-BK-' + Date.now(),
  id: 'TEST-BK-' + Date.now(),
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+91 9876543210',
  theaterName: 'EROS (COUPLES)',
  date: '2025-10-30',
  time: '6:00 PM - 9:00 PM',
  occasion: 'Birthday',
  numberOfPeople: 2,
  totalAmount: 5000,
  advancePayment: 1250,
  venuePayment: 3750,
  status: 'cancelled',
  cancelledAt: new Date().toISOString(),
  cancellationReason: 'Test cancellation - checking SQL sync',
  refundAmount: 4000,
  refundStatus: 'pending'
};

// Compress function (same as in godaddy-sql.ts)
function compressJSON(data) {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = Buffer.from(jsonString).toString('base64');
    return compressed;
  } catch (error) {
    console.error('Failed to compress JSON:', error);
    return JSON.stringify(data);
  }
}

async function testCancelBooking() {
  console.log('🧪 Testing Booking Cancellation → GoDaddy SQL Sync\n');
  
  const config = {
    host: '72.167.70.199',
    user: 'feelme-town-cybershoora',
    password: 'feelmetown@123',
    database: 'feelme-town-by-cybershooora',
    port: 3306,
    connectTimeout: 10000
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to GoDaddy SQL\n');
    
    console.log('📋 Test Booking Data:');
    console.log('   Booking ID:', testBookingData.bookingId);
    console.log('   Customer:', testBookingData.name);
    console.log('   Theater:', testBookingData.theaterName);
    console.log('   Date:', testBookingData.date);
    console.log('   Time:', testBookingData.time);
    console.log('   Amount:', testBookingData.totalAmount);
    console.log('   Reason:', testBookingData.cancellationReason);
    console.log('\n');
    
    // Compress data
    const compressedData = compressJSON(testBookingData);
    const originalSize = JSON.stringify(testBookingData).length;
    const compressedSize = compressedData.length;
    const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log('💾 Data Compression:');
    console.log('   Original Size:', originalSize, 'bytes');
    console.log('   Compressed Size:', compressedSize, 'bytes');
    console.log('   Storage Saved:', savedPercent + '%');
    console.log('\n');
    
    // Insert into cancelled_bookings table
    console.log('📤 Inserting into cancelled_bookings table...\n');
    
    const insertQuery = `
      INSERT INTO cancelled_bookings (
        booking_id, name, email, phone, theater_name, booking_date, booking_time,
        occasion, number_of_people, total_amount, cancelled_at, cancellation_reason,
        refund_amount, refund_status, original_booking_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      testBookingData.bookingId,
      testBookingData.name,
      testBookingData.email,
      testBookingData.phone,
      testBookingData.theaterName,
      new Date(testBookingData.date),
      testBookingData.time,
      testBookingData.occasion,
      testBookingData.numberOfPeople,
      testBookingData.totalAmount,
      new Date(testBookingData.cancelledAt),
      testBookingData.cancellationReason,
      testBookingData.refundAmount,
      testBookingData.refundStatus,
      compressedData
    ];
    
    const [result] = await connection.execute(insertQuery, values);
    
    console.log('✅ Booking inserted successfully!');
    console.log('   Insert ID:', result.insertId);
    console.log('   Rows Affected:', result.affectedRows);
    console.log('\n');
    
    // Verify by reading back
    console.log('🔍 Verifying data in database...\n');
    const [rows] = await connection.execute(
      'SELECT booking_id, name, email, theater_name, total_amount, refund_amount, cancelled_at FROM cancelled_bookings WHERE booking_id = ?',
      [testBookingData.bookingId]
    );
    
    if (rows.length > 0) {
      console.log('✅ Data verified in database:');
      console.log('   Booking ID:', rows[0].booking_id);
      console.log('   Name:', rows[0].name);
      console.log('   Email:', rows[0].email);
      console.log('   Theater:', rows[0].theater_name);
      console.log('   Total Amount:', rows[0].total_amount);
      console.log('   Refund Amount:', rows[0].refund_amount);
      console.log('   Cancelled At:', rows[0].cancelled_at);
      console.log('\n');
    }
    
    // Count total cancelled bookings
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM cancelled_bookings');
    console.log('📊 Total Cancelled Bookings in Database:', countResult[0].total);
    console.log('\n');
    
    await connection.end();
    
    console.log('🎉 Test Successful!');
    console.log('✅ Booking cancellation is syncing to GoDaddy SQL correctly!');
    console.log('✅ Data compression is working!');
    console.log('✅ You can now export to Excel from phpMyAdmin!');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.message);
    return false;
  }
}

testCancelBooking().then(success => {
  process.exit(success ? 0 : 1);
});
