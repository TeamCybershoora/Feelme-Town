// Test script to verify database update functionality
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
const DB_NAME = 'feelmetown';
const COLLECTION_NAME = 'booking';

async function testDatabaseUpdate() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('✅ Connected to database successfully');
    
    // Get a sample booking to test with
    const sampleBooking = await collection.findOne({});
    
    if (!sampleBooking) {
      console.log('❌ No bookings found in database');
      return;
    }
    
    console.log('📝 Found sample booking:', {
      id: sampleBooking.bookingId || sampleBooking._id,
      name: sampleBooking.name,
      email: sampleBooking.email,
      phone: sampleBooking.phone
    });
    
    // Test update
    const testUpdateData = {
      updatedAt: new Date(),
      testField: 'test_value_' + Date.now()
    };
    
    console.log('🔄 Testing update with data:', testUpdateData);
    
    const updateResult = await collection.updateOne(
      { bookingId: sampleBooking.bookingId },
      { $set: testUpdateData }
    );
    
    console.log('📊 Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });
    
    if (updateResult.matchedCount > 0) {
      console.log('✅ Update successful!');
      
      // Verify the update
      const updatedBooking = await collection.findOne({ bookingId: sampleBooking.bookingId });
      console.log('✅ Verified update - testField:', updatedBooking.testField);
    } else {
      console.log('❌ No booking matched for update');
    }
    
  } catch (error) {
    console.error('❌ Error testing database update:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

testDatabaseUpdate();
