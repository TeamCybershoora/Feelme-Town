// Database Connection for FeelME Town
// This file connects to the real MongoDB database

import { MongoClient, Db } from 'mongodb';

interface BookingData {
  name: string;
  email: string;
  phone: string;
  theaterName: string;
  date: string;
  time: string;
  occasion: string;
  numberOfPeople: number;
  selectedCakes?: Array<{ id: string; name: string; price: number; quantity: number }>;
  selectedDecorItems?: Array<{ id: string; name: string; price: number; quantity: number }>;
  selectedGifts?: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalAmount?: number;
}

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
const DB_NAME = 'feelmetown';
const COLLECTION_NAME = 'booking';

let client: MongoClient | null = null;
let db: Db | null = null;

// Database connection status
let isConnected = false;

// Connect to FeelME Town MongoDB database (optimized for speed)
const connectToDatabase = async () => {
  try {
    if (isConnected && client) {
      return {
        success: true,
        message: 'Already connected to FeelME Town MongoDB database',
        database: DB_NAME,
        collections: [COLLECTION_NAME]
      };
    }

    console.log('🔄 Connecting to FeelME Town MongoDB database...');
    
    // Create MongoDB client with optimized settings
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    // Connect to MongoDB
    await client.connect();
    
    // Get database
    db = client.db(DB_NAME);
    
    isConnected = true;
    
    console.log('✅ Connected to FeelME Town MongoDB database successfully!');
    
    return {
      success: true,
      message: 'Connected to FeelME Town MongoDB database',
      database: DB_NAME,
      collections: [COLLECTION_NAME]
    };
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    if (client) {
      await client.close();
      client = null;
    }
    return {
      success: false,
      error: 'Failed to connect to MongoDB database'
    };
  }
};

// Check database connection
const checkConnection = async () => {
  try {
    if (!isConnected) {
      return {
        connected: false,
        database: DB_NAME,
        collections: {
          booking: 0
        }
      };
    }
    
    // Get collection count
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    const bookingCount = await collection.countDocuments();
    
    return {
      connected: isConnected,
      database: DB_NAME,
      collections: {
        booking: bookingCount
      }
    };
  } catch (error) {
    return {
      connected: false,
      database: DB_NAME,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Generate custom booking ID (FMT0001, FMT0002, etc.)
const generateBookingId = async () => {
  try {
    if (!isConnected || !db) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Get the count of existing bookings
    const count = await collection.countDocuments();
    
    // Generate booking ID with FMT prefix and 4-digit number
    const bookingNumber = (count + 1).toString().padStart(4, '0');
    const bookingId = `FMT${bookingNumber}`;
    
    console.log('🎫 Generated booking ID:', bookingId);
    return bookingId;
    
  } catch (error) {
    console.error('❌ Error generating booking ID:', error);
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `FMT${timestamp}`;
  }
};

// Save booking to MongoDB database
const saveBooking = async (bookingData: BookingData) => {
  try {
    // Ensure database connection
    if (!isConnected || !db) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    console.log('💾 Saving booking to FeelME Town MongoDB database...');
    
    // Generate custom booking ID
    const customBookingId = await generateBookingId();
    
    // Add timestamp, status, and custom booking ID
    const booking = {
      ...bookingData,
      bookingId: customBookingId,
      createdAt: new Date(),
      status: 'pending'
    };
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Insert booking into MongoDB
    const result = await collection.insertOne(booking);
    
    console.log('📝 New booking saved to FeelME Town MongoDB database:', {
      database: DB_NAME,
      collection: COLLECTION_NAME,
      bookingId: customBookingId,
      mongoId: result.insertedId,
      customerName: booking.name,
      numberOfPeople: booking.numberOfPeople,
      theater: booking.theaterName,
      date: booking.date,
      time: booking.time,
      totalAmount: booking.totalAmount
    });
    
    return {
      success: true,
      message: 'Booking saved to FeelME Town MongoDB database',
      booking: {
        id: customBookingId,
        mongoId: result.insertedId,
        ...booking
      }
    };
    
  } catch (error) {
    console.error('❌ Error saving booking to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to save booking to MongoDB database'
    };
  }
};

// Get all bookings from MongoDB database
const getAllBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Find all bookings
    const bookings = await collection.find({}).toArray();
    
    return {
      success: true,
      bookings: bookings,
      total: bookings.length,
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error getting bookings from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get bookings from MongoDB'
    };
  }
};

// Database operations
const database = {
  connect: connectToDatabase,
  checkConnection: checkConnection,
  saveBooking: saveBooking,
  getAllBookings: getAllBookings,
  isConnected: () => isConnected
};

// Auto-connect when module loads
connectToDatabase();

export default database;
