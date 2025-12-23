// Test cancel booking API directly
const http = require('http');

async function testCancelAPI() {
  console.log('🧪 Testing Cancel Booking API...\n');
  
  // You need to replace this with a real booking ID from your MongoDB
  const testData = {
    bookingId: 'YOUR_BOOKING_ID_HERE', // Replace with real booking ID
    reason: 'Testing GoDaddy SQL sync'
  };
  
  console.log('⚠️  IMPORTANT: Replace YOUR_BOOKING_ID_HERE with a real booking ID from MongoDB');
  console.log('');
  console.log('To test:');
  console.log('1. Create a booking on website');
  console.log('2. Get the booking ID from MongoDB');
  console.log('3. Replace YOUR_BOOKING_ID_HERE in this file');
  console.log('4. Run this script again');
  console.log('');
  console.log('OR');
  console.log('');
  console.log('Better way: Cancel a booking directly from website and check console logs');
  console.log('');
  console.log('Expected logs in server console:');
  console.log('─'.repeat(80));
  console.log('🔄 [GODADDY SQL] Starting sync for cancelled booking: BK123456');
  console.log('🔄 [SQL INSERT] Getting connection pool...');
  console.log('✅ [SQL INSERT] Connection acquired');
  console.log('🔄 [SQL INSERT] Compressing booking data...');
  console.log('🔄 [SQL INSERT] Executing INSERT query...');
  console.log('✅ [SQL INSERT] Query executed successfully');
  console.log('✅ Cancelled booking inserted into GoDaddy SQL: BK123456');
  console.log('💾 Storage saved: 35% (1500 → 975 bytes)');
  console.log('✅ [GODADDY SQL] Successfully synced cancelled booking to GoDaddy SQL');
  console.log('─'.repeat(80));
  console.log('');
  console.log('Then verify with:');
  console.log('node verify-sql-sync.js');
}

testCancelAPI();
