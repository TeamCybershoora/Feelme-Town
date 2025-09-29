// MongoDB TTL Index Setup Script for FeelME Town
// This script creates TTL indexes for automatic deletion of expired entries

const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
const DB_NAME = 'feelmetown';

async function setupTTLIndexes() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log(`📊 Connected to database: ${DB_NAME}`);
    
    // 1. TTL Index for regular bookings (expiredAt field)
    console.log('\n📅 Setting up TTL index for regular bookings...');
    const bookingCollection = db.collection('booking');
    
    try {
      await bookingCollection.createIndex(
        { "expiredAt": 1 },
        { 
          expireAfterSeconds: 0, // Delete immediately when expiredAt time is reached
          name: "expiredAt_ttl",
          background: true
        }
      );
      console.log('✅ TTL index created for regular bookings (expiredAt field)');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ TTL index for regular bookings already exists');
      } else {
        console.error('❌ Error creating TTL index for regular bookings:', error.message);
      }
    }
    
    // 2. TTL Index for incomplete bookings (expiresAt field)
    console.log('\n📅 Setting up TTL index for incomplete bookings...');
    const incompleteBookingCollection = db.collection('incomplete_booking');
    
    try {
      await incompleteBookingCollection.createIndex(
        { "expiresAt": 1 },
        { 
          expireAfterSeconds: 0, // Delete immediately when expiresAt time is reached
          name: "expiresAt_ttl",
          background: true
        }
      );
      console.log('✅ TTL index created for incomplete bookings (expiresAt field)');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ TTL index for incomplete bookings already exists');
      } else {
        console.error('❌ Error creating TTL index for incomplete bookings:', error.message);
      }
    }
    
    // 3. List all indexes to verify
    console.log('\n📋 Current indexes in booking collection:');
    const bookingIndexes = await bookingCollection.indexes();
    bookingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.expireAfterSeconds !== undefined) {
        console.log(`    TTL: ${index.expireAfterSeconds} seconds`);
      }
    });
    
    console.log('\n📋 Current indexes in incomplete_booking collection:');
    const incompleteIndexes = await incompleteBookingCollection.indexes();
    incompleteIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.expireAfterSeconds !== undefined) {
        console.log(`    TTL: ${index.expireAfterSeconds} seconds`);
      }
    });
    
    console.log('\n🎉 TTL indexes setup completed successfully!');
    console.log('\n📝 How TTL works:');
    console.log('  - MongoDB automatically deletes documents when the TTL field time is reached');
    console.log('  - Regular bookings: Deleted when expiredAt time is reached');
    console.log('  - Incomplete bookings: Deleted when expiresAt time is reached');
    console.log('  - TTL runs every 60 seconds by default');
    console.log('  - No need for manual cleanup scripts anymore!');
    
  } catch (error) {
    console.error('❌ Error setting up TTL indexes:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
setupTTLIndexes().catch(console.error);
