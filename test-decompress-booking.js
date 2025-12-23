const { MongoClient, Binary } = require('mongodb');
const zlib = require('zlib');
const { promisify } = require('util');

const gunzip = promisify(zlib.gunzip);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown';

async function decompressBooking() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('feelmetown');
    const collection = db.collection('booking');
    
    // Find the most recent paid booking
    console.log('🔍 Searching for most recent paid booking...');
    const booking = await collection.findOne(
      { paymentStatus: 'paid' },
      { sort: { updatedAt: -1 } }
    );
    
    if (!booking) {
      console.log('❌ No paid bookings found');
      return;
    }
    
    console.log('\n📋 Booking found:', booking.bookingId);
    console.log('Updated at:', booking.updatedAt);
    console.log('=' .repeat(80));
    
    // Show uncompressed fields
    console.log('\n🔓 UNCOMPRESSED FIELDS (Direct from database):');
    console.log('─'.repeat(80));
    console.log('paymentStatus:', booking.paymentStatus);
    console.log('venuePaymentMethod:', booking.venuePaymentMethod);
    console.log('paymentMethod:', booking.paymentMethod);
    console.log('paidBy:', booking.paidBy || '❌ MISSING');
    console.log('staffName:', booking.staffName || '❌ MISSING');
    console.log('userId:', booking.userId || '❌ MISSING');
    console.log('staffId:', booking.staffId || '❌ MISSING');
    console.log('paidAt:', booking.paidAt || '❌ MISSING');
    
    // Decompress the compressed data
    if (booking.compressedData) {
      console.log('\n📦 COMPRESSED DATA FOUND - Decompressing...');
      console.log('─'.repeat(80));
      
      let bufferData;
      if (booking.compressedData instanceof Binary) {
        bufferData = booking.compressedData.buffer;
      } else if (Buffer.isBuffer(booking.compressedData)) {
        bufferData = booking.compressedData;
      } else {
        bufferData = Buffer.from(booking.compressedData);
      }
      
      const decompressed = await gunzip(bufferData);
      const decompressedString = decompressed.toString('utf8');
      const decompressedData = JSON.parse(decompressedString);
      
      console.log('\n🔍 DECOMPRESSED DATA (Inside compressed field):');
      console.log('─'.repeat(80));
      console.log('paymentStatus:', decompressedData.paymentStatus);
      console.log('venuePaymentMethod:', decompressedData.venuePaymentMethod);
      console.log('paymentMethod:', decompressedData.paymentMethod);
      console.log('paidBy:', decompressedData.paidBy || '❌ MISSING');
      console.log('staffName:', decompressedData.staffName || '❌ MISSING');
      console.log('userId:', decompressedData.userId || '❌ MISSING');
      console.log('staffId:', decompressedData.staffId || '❌ MISSING');
      console.log('paidAt:', decompressedData.paidAt || '❌ MISSING');
      
      console.log('\n📊 COMPARISON:');
      console.log('─'.repeat(80));
      console.log('Field                  | Uncompressed | Compressed Data');
      console.log('─'.repeat(80));
      console.log(`paymentStatus          | ${booking.paymentStatus || 'N/A'} | ${decompressedData.paymentStatus || 'N/A'}`);
      console.log(`venuePaymentMethod     | ${booking.venuePaymentMethod || 'N/A'} | ${decompressedData.venuePaymentMethod || 'N/A'}`);
      console.log(`paidBy                 | ${booking.paidBy || '❌ MISSING'} | ${decompressedData.paidBy || '❌ MISSING'}`);
      console.log(`staffName              | ${booking.staffName || '❌ MISSING'} | ${decompressedData.staffName || '❌ MISSING'}`);
      console.log(`userId                 | ${booking.userId || '❌ MISSING'} | ${decompressedData.userId || '❌ MISSING'}`);
      console.log(`paidAt                 | ${booking.paidAt || '❌ MISSING'} | ${decompressedData.paidAt || '❌ MISSING'}`);
      
      console.log('\n✅ VERDICT:');
      console.log('─'.repeat(80));
      
      const hasUncompressedPaidBy = !!booking.paidBy;
      const hasCompressedPaidBy = !!decompressedData.paidBy;
      const hasUncompressedStaffName = !!booking.staffName;
      const hasCompressedStaffName = !!decompressedData.staffName;
      
      if (hasUncompressedPaidBy && hasUncompressedStaffName) {
        console.log('✅ Payment tracking fields are in UNCOMPRESSED format (Good!)');
      } else if (hasCompressedPaidBy && hasCompressedStaffName) {
        console.log('⚠️  Payment tracking fields are ONLY in compressed data');
        console.log('    They need to be saved as uncompressed fields too!');
      } else {
        console.log('❌ Payment tracking fields are MISSING from both!');
        console.log('    The payment was marked before the tracking feature was added.');
      }
      
      // Show full decompressed data
      console.log('\n📄 FULL DECOMPRESSED BOOKING DATA:');
      console.log('─'.repeat(80));
      console.log(JSON.stringify(decompressedData, null, 2));
      
    } else {
      console.log('\n⚠️  No compressed data found in this booking');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

decompressBooking();
