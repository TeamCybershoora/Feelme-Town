// Database Connection for FeelME Town
// This file connects to the real MongoDB database

import { MongoClient, Db, ObjectId } from 'mongodb';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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
  selectedMovies?: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalAmount?: number;
  advancePayment?: number;
  venuePayment?: number;
  status?: string;
  // Timestamps
  createdAt?: Date;
  expiredAt?: Date;
  // Occasion specific fields
  birthdayName?: string;
  birthdayGender?: string;
  partner1Name?: string;
  partner1Gender?: string;
  partner2Name?: string;
  partner2Gender?: string;
  dateNightName?: string;
  proposerName?: string;
  proposalPartnerName?: string;
  valentineName?: string;
  customCelebration?: string;
}

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
const DB_NAME = 'feelmetown';
const COLLECTION_NAME = 'booking';
const INCOMPLETE_COLLECTION_NAME = 'incomplete_booking';
const CANCELLED_COLLECTION_NAME = 'cancelled_booking';
const MANUAL_BOOKING_COLLECTION_NAME = 'manual_booking';

let client: MongoClient | null = null;
let db: Db | null = null;

// Database connection status
let isConnected = false;

// Compression utilities
const compressData = async (data: unknown): Promise<Buffer> => {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = await gzipAsync(Buffer.from(jsonString, 'utf8'));
    return compressed;
  } catch (error) {
    console.error('❌ Error compressing data:', error);
    throw error;
  }
};

const decompressData = async (compressedData: Buffer | unknown): Promise<unknown> => {
  try {
    // Handle MongoDB Binary objects by converting to Buffer
    let bufferData: Buffer;
    
    // Check if it's a MongoDB Binary object with buffer property
    if (compressedData && typeof compressedData === 'object' && 'buffer' in compressedData) {
      // This is a MongoDB Binary object
      const binaryData = compressedData as { buffer: ArrayBuffer };
      bufferData = Buffer.from(binaryData.buffer);
    } else if (Buffer.isBuffer(compressedData)) {
      // This is already a Buffer
      bufferData = compressedData;
    } else {
      // Try to convert to Buffer - handle the unknown type properly
      if (typeof compressedData === 'string') {
        bufferData = Buffer.from(compressedData, 'utf8');
      } else if (compressedData instanceof ArrayBuffer) {
        bufferData = Buffer.from(compressedData);
      } else if (Array.isArray(compressedData)) {
        bufferData = Buffer.from(compressedData);
      } else {
        // Fallback: convert to string first, then to buffer
        bufferData = Buffer.from(String(compressedData), 'utf8');
      }
    }
    
    const decompressed = await gunzipAsync(bufferData);
    const jsonString = decompressed.toString('utf8');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error decompressing data:', error);
    throw error;
  }
};

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
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000, // Added connection timeout
      retryWrites: true,
      retryReads: true,
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
        collections: [COLLECTION_NAME, INCOMPLETE_COLLECTION_NAME, CANCELLED_COLLECTION_NAME]
      };
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing client:', closeError);
      }
      client = null;
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to MongoDB database'
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
          booking: 0,
          incomplete_booking: 0
        }
      };
    }
    
    // Get collection count
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    const incompleteCollection = db.collection(INCOMPLETE_COLLECTION_NAME);
    const cancelledCollection = db.collection(CANCELLED_COLLECTION_NAME);
    
    const bookingCount = await collection.countDocuments();
    const incompleteBookingCount = await incompleteCollection.countDocuments();
    const cancelledBookingCount = await cancelledCollection.countDocuments();
    
    return {
      connected: isConnected,
      database: DB_NAME,
      collections: {
        booking: bookingCount,
        incomplete_booking: incompleteBookingCount,
        cancelled_booking: cancelledBookingCount
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

// Generate custom incomplete booking ID (INC0001, INC0002, etc.)
const generateIncompleteBookingId = async () => {
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
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Get the count of existing incomplete bookings
    const count = await collection.countDocuments();
    
    // Generate incomplete booking ID with INC prefix and 4-digit number
    const bookingNumber = (count + 1).toString().padStart(4, '0');
    const bookingId = `INC${bookingNumber}`;
    
    console.log('🎫 Generated incomplete booking ID:', bookingId);
    return bookingId;
    
  } catch (error) {
    console.error('❌ Error generating incomplete booking ID:', error);
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `INC${timestamp}`;
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
      status: bookingData.status || 'completed' // Use provided status or default to completed
    };
    
    // Compress the booking data to save storage space
    const compressedData = await compressData(booking);
    
    // Create compressed document
    const compressedBooking = {
      _id: new ObjectId(),
      bookingId: customBookingId,
      compressedData: compressedData,
      createdAt: new Date(),
      status: bookingData.status || 'completed',
      // Add expiredAt field for auto-cleanup
      expiredAt: bookingData.expiredAt,
      // Keep some basic fields uncompressed for quick queries
      name: bookingData.name,
      email: bookingData.email,
      theaterName: bookingData.theaterName,
      date: bookingData.date,
      time: bookingData.time,
      occasion: bookingData.occasion,
      totalAmount: bookingData.totalAmount,
      // Keep occasion-specific names for easy querying
      occasionPersonName: bookingData.occasion === 'Birthday Party' ? (bookingData.birthdayName || '') :
                         bookingData.occasion === 'Anniversary' ? (bookingData.partner1Name || bookingData.partner2Name || '') :
                         bookingData.occasion === 'Date Night' ? (bookingData.dateNightName || '') :
                         bookingData.occasion === 'Marriage Proposal' ? (bookingData.proposerName || bookingData.proposalPartnerName || '') :
                         bookingData.occasion === 'Romantic Date' ? (bookingData.partner1Name || bookingData.partner2Name || '') :
                         bookingData.occasion === "Valentine's Day" ? (bookingData.valentineName || '') :
                         bookingData.occasion === 'Baby Shower' || bookingData.occasion === 'Bride to be' || bookingData.occasion === 'Congratulations' || bookingData.occasion === 'Farewell' ? (bookingData.birthdayName || '') :
                         bookingData.occasion === 'Custom Celebration' ? (bookingData.customCelebration || '') : '',
      // Keep only relevant occasion-specific fields based on selected occasion
      ...(bookingData.occasion === 'Birthday Party' && {
        birthdayName: bookingData.birthdayName || ''
      }),
      ...(bookingData.occasion === 'Anniversary' && {
        partner1Name: bookingData.partner1Name || '',
        partner2Name: bookingData.partner2Name || ''
      }),
      ...(bookingData.occasion === 'Baby Shower' && {
        birthdayName: bookingData.birthdayName || ''
      }),
      ...(bookingData.occasion === 'Bride to be' && {
        birthdayName: bookingData.birthdayName || ''
      }),
      ...(bookingData.occasion === 'Congratulations' && {
        birthdayName: bookingData.birthdayName || ''
      }),
      ...(bookingData.occasion === 'Farewell' && {
        birthdayName: bookingData.birthdayName || ''
      }),
      ...(bookingData.occasion === 'Marriage Proposal' && {
        proposerName: bookingData.proposerName || '',
        proposalPartnerName: bookingData.proposalPartnerName || ''
      }),
      ...(bookingData.occasion === 'Romantic Date' && {
        partner1Name: bookingData.partner1Name || '',
        partner2Name: bookingData.partner2Name || ''
      }),
      ...(bookingData.occasion === "Valentine's Day" && {
        valentineName: bookingData.valentineName || ''
      }),
      ...(bookingData.occasion === 'Date Night' && {
        dateNightName: bookingData.dateNightName || ''
      }),
      ...(bookingData.occasion === 'Custom Celebration' && {
        customCelebration: bookingData.customCelebration || ''
      }),
      // Keep some key items for easy querying
      selectedMovies: bookingData.selectedMovies || [],
      selectedCakes: bookingData.selectedCakes || [],
      selectedDecorItems: bookingData.selectedDecorItems || [],
      selectedGifts: bookingData.selectedGifts || []
    };
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Insert compressed booking into MongoDB
    const result = await collection.insertOne(compressedBooking);
    
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

// Save manual booking to manual_booking collection
const saveManualBooking = async (bookingData: BookingData) => {
  try {
    // Ensure database connection
    if (!isConnected || !db) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    console.log('💾 Saving manual booking to FeelME Town MongoDB database...');
    
    // Generate custom booking ID
    const customBookingId = await generateBookingId();
    
    // Add timestamp, status, and custom booking ID
    const booking = {
      ...bookingData,
      bookingId: customBookingId,
      createdAt: new Date(),
      status: bookingData.status || 'completed',
      isManualBooking: true,
      bookingType: 'Manual',
      createdBy: 'Admin'
    };
    
    // Compress the booking data to save storage space
    const compressedData = await compressData(booking);
    
    // Create compressed document
    const compressedBooking = {
      _id: new ObjectId(),
      bookingId: customBookingId,
      compressedData: compressedData,
      createdAt: booking.createdAt,
      status: booking.status
    };
    
    // Save to manual_booking collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(MANUAL_BOOKING_COLLECTION_NAME);
    const result = await collection.insertOne(compressedBooking);
    
    console.log('✅ Manual booking saved to FeelME Town database:', {
      id: customBookingId,
      mongoId: result.insertedId,
      name: booking.name,
      theater: booking.theaterName,
      date: booking.date,
      time: booking.time,
      total: booking.totalAmount
    });
    
    return {
      success: true,
      message: 'Manual booking saved to FeelME Town MongoDB database',
      booking: {
        id: customBookingId,
        mongoId: result.insertedId,
        ...booking
      }
    };
    
  } catch (error) {
    console.error('❌ Error saving manual booking to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to save manual booking to MongoDB database'
    };
  }
};

// Save incomplete booking to MongoDB database
const saveIncompleteBooking = async (bookingData: Partial<BookingData> & { email: string }) => {
  try {
    // Ensure database connection
    if (!isConnected || !db) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    console.log('💾 Saving incomplete booking to FeelME Town MongoDB database...');
    
    // Generate custom incomplete booking ID
    const customBookingId = await generateIncompleteBookingId();
    
    // Set expiry time to 1 hour from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (1 * 60 * 60 * 1000));
    
    // Add timestamp, status, custom booking ID, and expiry
    const incompleteBooking = {
      ...bookingData,
      bookingId: customBookingId,
      createdAt: now,
      expiresAt: expiresAt,
      status: 'incomplete'
    };
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Insert incomplete booking into MongoDB
    const result = await collection.insertOne(incompleteBooking);
    
    console.log('📝 New incomplete booking saved to FeelME Town MongoDB database:', {
      database: DB_NAME,
      collection: INCOMPLETE_COLLECTION_NAME,
      bookingId: customBookingId,
      mongoId: result.insertedId,
      customerEmail: incompleteBooking.email,
      expiresAt: incompleteBooking.expiresAt,
      status: incompleteBooking.status
    });
    
    return {
      success: true,
      message: 'Incomplete booking saved to FeelME Town MongoDB database',
      booking: {
        id: customBookingId,
        mongoId: result.insertedId,
        ...incompleteBooking
      }
    };
    
  } catch (error) {
    console.error('❌ Error saving incomplete booking to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to save incomplete booking to MongoDB database'
    };
  }
};

// Get all incomplete bookings from MongoDB database
const getAllIncompleteBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Find all incomplete bookings
    const incompleteBookings = await collection.find({}).toArray();
    
    return {
      success: true,
      incompleteBookings: incompleteBookings,
      total: incompleteBookings.length,
      database: DB_NAME,
      collection: INCOMPLETE_COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error getting incomplete bookings from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get incomplete bookings from MongoDB'
    };
  }
};

// Delete specific incomplete booking by ID
const deleteIncompleteBooking = async (bookingId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Delete specific incomplete booking
    const result = await collection.deleteOne({
      bookingId: bookingId
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted incomplete booking ${bookingId} from MongoDB`);
      
      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `Deleted incomplete booking ${bookingId}`
      };
    } else {
      return {
        success: false,
        message: `Incomplete booking ${bookingId} not found`
      };
    }
    
  } catch (error) {
    console.error('❌ Error deleting incomplete booking:', error);
    return {
      success: false,
      error: 'Failed to delete incomplete booking'
    };
  }
};

// Delete expired incomplete bookings (24+ hours old)
const deleteExpiredIncompleteBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Find and delete expired bookings
    const now = new Date();
    const result = await collection.deleteMany({
      expiresAt: { $lt: now }
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} expired incomplete bookings from MongoDB`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} expired incomplete bookings`
    };
    
  } catch (error) {
    console.error('❌ Error deleting expired incomplete bookings:', error);
    return {
      success: false,
      error: 'Failed to delete expired incomplete bookings'
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
    
    // Decompress all booking data
    const decompressedBookings = [];
    for (const booking of bookings) {
      if (booking.compressedData) {
        try {
          const decompressed = await decompressData(booking.compressedData);
          decompressedBookings.push(decompressed);
        } catch (error) {
          console.error('❌ Error decompressing booking:', booking.bookingId, error);
          // Fall back to uncompressed data
          decompressedBookings.push(booking);
        }
      } else {
        // Already uncompressed
        decompressedBookings.push(booking);
      }
    }
    
    return {
      success: true,
      bookings: decompressedBookings,
      total: decompressedBookings.length,
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

// Get booking by ID from MongoDB database
const getBookingById = async (bookingId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Try to find booking by ID (handle both ObjectId and custom ID formats)
    let booking;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      booking = await collection.findOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      booking = await collection.findOne({ bookingId: bookingId });
    }
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }
    
    // Check if booking data is compressed
    let decompressedBooking = booking;
    if (booking.compressedData) {
      try {
        // Decompress the booking data
        const decompressedData = await decompressData(booking.compressedData) as Record<string, unknown>;
        decompressedBooking = { ...booking, ...decompressedData } as typeof booking;
        console.log('📦 Decompressed booking data for:', booking.bookingId);
      } catch (error) {
        console.error('❌ Error decompressing booking data:', error);
        // Fall back to uncompressed data if decompression fails
        decompressedBooking = booking;
      }
    }
    
    return {
      success: true,
      booking: decompressedBooking,
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error getting booking by ID from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get booking from MongoDB'
    };
  }
};

// Update booking status in MongoDB database
const updateBookingStatus = async (bookingId: string, status: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Update booking status (handle both ObjectId and custom ID formats)
    let result;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      // Try as custom ID field
      result = await collection.updateOne(
        { bookingId: bookingId },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          } 
        }
      );
    }
    
    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }
    
    if (result.modifiedCount === 0) {
      return {
        success: false,
        error: 'Booking status not updated'
      };
    }
    
    console.log(`✅ Booking status updated to ${status} in MongoDB:`, bookingId);
    
    return {
      success: true,
      message: `Booking status updated to ${status}`,
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error updating booking status in MongoDB:', error);
    return {
      success: false,
      error: 'Failed to update booking status in MongoDB'
    };
  }
};

// Update booking in MongoDB database
const updateBooking = async (bookingId: string, bookingData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Compress the updated booking data
    const compressedData = await compressData(bookingData);
    
    // Create update object with compressed data
    const updateData = {
      compressedData: compressedData,
      updatedAt: new Date(),
      // Keep some basic fields uncompressed for quick queries
      name: bookingData.name,
      email: bookingData.email,
      theaterName: bookingData.theaterName,
      date: bookingData.date,
      time: bookingData.time,
      occasion: bookingData.occasion,
      totalAmount: bookingData.totalAmount
    };
    
    // Try to update by ObjectId first, then by custom bookingId
    let updateResult;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      updateResult = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: updateData
        }
      );
    } else {
      // Try as custom ID field
      updateResult = await collection.updateOne(
        { bookingId: bookingId },
        { 
          $set: updateData
        }
      );
    }
    
    if (updateResult.modifiedCount === 0) {
      return {
        success: false,
        error: 'Booking not found or no changes made'
      };
    }
    
    // Get the updated booking
    let updatedBooking;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      updatedBooking = await collection.findOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      updatedBooking = await collection.findOne({ bookingId: bookingId });
    }
    
    if (!updatedBooking) {
      return {
        success: false,
        error: 'Updated booking not found'
      };
    }
    
    console.log(`✅ Booking updated in MongoDB:`, bookingId);
    
    return {
      success: true,
      booking: {
        id: updatedBooking.bookingId || updatedBooking._id,
        name: updatedBooking.name,
        email: updatedBooking.email,
        phone: updatedBooking.phone,
        theaterName: updatedBooking.theaterName,
        date: updatedBooking.date,
        time: updatedBooking.time,
        occasion: updatedBooking.occasion,
        numberOfPeople: updatedBooking.numberOfPeople,
        totalAmount: updatedBooking.totalAmount,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      }
    };
    
  } catch (error) {
    console.error('❌ Error updating booking in MongoDB:', error);
    return {
      success: false,
      error: 'Failed to update booking in MongoDB'
    };
  }
};

// Move booking to cancelled collection instead of deleting
const moveBookingToCancelled = async (bookingId: string, cancellationData: { cancelledAt: Date; refundAmount: number; refundStatus: string; cancellationReason?: string }) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collections
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    const cancelledCollection = db.collection(CANCELLED_COLLECTION_NAME);
    
    // First, get the booking to move
    let booking;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      booking = await collection.findOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      booking = await collection.findOne({ bookingId: bookingId });
    }
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }
    
    // Add cancellation data to the booking
    const cancelledBooking = {
      ...booking,
      status: 'cancelled',
      cancelledAt: cancellationData.cancelledAt,
      refundAmount: cancellationData.refundAmount,
      refundStatus: cancellationData.refundStatus,
      cancellationReason: cancellationData.cancellationReason || 'Customer requested cancellation',
      originalCollection: COLLECTION_NAME
    };
    
    // Insert into cancelled collection
    const insertResult = await cancelledCollection.insertOne(cancelledBooking);
    
    // Delete from original collection
    let deleteResult;
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      deleteResult = await collection.deleteOne({ _id: new ObjectId(bookingId) });
    } else {
      deleteResult = await collection.deleteOne({ bookingId: bookingId });
    }
    
    if (deleteResult.deletedCount === 0) {
      return {
        success: false,
        error: 'Failed to remove booking from original collection'
      };
    }
    
    console.log(`✅ Booking moved to cancelled collection:`, bookingId);
    
    return {
      success: true,
      message: 'Booking moved to cancelled collection successfully',
      cancelledBooking: {
        id: (cancelledBooking as Record<string, unknown>).bookingId,
        mongoId: insertResult.insertedId,
        ...cancelledBooking
      },
      database: DB_NAME,
      originalCollection: COLLECTION_NAME,
      cancelledCollection: CANCELLED_COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error moving booking to cancelled collection:', error);
    return {
      success: false,
      error: 'Failed to move booking to cancelled collection'
    };
  }
};

// Delete booking from MongoDB database (legacy function - now moves to cancelled)
const deleteBooking = async (bookingId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Delete booking (handle both ObjectId and custom ID formats)
    let result;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      result = await collection.deleteOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      result = await collection.deleteOne({ bookingId: bookingId });
    }
    
    if (result.deletedCount === 0) {
      return {
        success: false,
        error: 'Booking not found or already deleted'
      };
    }
    
    console.log(`✅ Booking deleted from MongoDB:`, bookingId);
    
    return {
      success: true,
      message: 'Booking deleted successfully',
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error deleting booking from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to delete booking from MongoDB'
    };
  }
};

// Delete expired bookings (bookings past their date/time)
const deleteExpiredBookings = async (currentDateTime: Date) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('🔍 Finding expired bookings...');
    
    // Get all bookings
    const allBookings = await collection.find({}).toArray();
    const expiredBookings = [];
    
    // Check each booking to see if it's expired
    for (const booking of allBookings) {
      try {
        // Parse the booking date and time
        const bookingDate = new Date(booking.date);
        const timeSlot = booking.time;
        
        // Extract end time from time slot (e.g., "04:00 PM - 07:00 PM" -> "07:00 PM")
        const timeMatch = timeSlot.match(/(\d{1,2}:\d{2}\s*(AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(AM|PM))/);
        if (timeMatch) {
          const endTimeStr = timeMatch[3] + ' ' + timeMatch[4];
          
          // Create end datetime
          const endDateTime = new Date(bookingDate);
          const [time, period] = endTimeStr.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          endDateTime.setHours(hour24, parseInt(minutes), 0, 0);
          
          // Check if booking has expired (current time > end time)
          if (currentDateTime > endDateTime) {
            expiredBookings.push({
              bookingId: booking.bookingId,
              name: booking.name,
              date: booking.date,
              time: booking.time,
              endDateTime: endDateTime.toISOString()
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Error parsing booking date/time:', booking.bookingId, error);
      }
    }
    
    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings found');
      return {
        success: true,
        deletedCount: 0,
        message: 'No expired bookings found'
      };
    }
    
    console.log(`🗑️ Found ${expiredBookings.length} expired bookings to delete`);
    
    // Delete expired bookings
    const bookingIds = expiredBookings.map(b => b.bookingId);
    const deleteResult = await collection.deleteMany({
      bookingId: { $in: bookingIds }
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} expired bookings`);
    
    return {
      success: true,
      deletedCount: deleteResult.deletedCount,
      deletedBookings: expiredBookings,
      message: `Successfully deleted ${deleteResult.deletedCount} expired bookings`
    };
    
  } catch (error) {
    console.error('❌ Error deleting expired bookings:', error);
    return {
      success: false,
      error: 'Failed to delete expired bookings'
    };
  }
};

// Get expired bookings without deleting
const getExpiredBookings = async (currentDateTime: Date) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all bookings
    const allBookings = await collection.find({}).toArray();
    const expiredBookings = [];
    
    // Check each booking to see if it's expired
    for (const booking of allBookings) {
      try {
        // Parse the booking date and time
        const bookingDate = new Date(booking.date);
        const timeSlot = booking.time;
        
        // Extract end time from time slot
        const timeMatch = timeSlot.match(/(\d{1,2}:\d{2}\s*(AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(AM|PM))/);
        if (timeMatch) {
          const endTimeStr = timeMatch[3] + ' ' + timeMatch[4];
          
          // Create end datetime
          const endDateTime = new Date(bookingDate);
          const [time, period] = endTimeStr.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          endDateTime.setHours(hour24, parseInt(minutes), 0, 0);
          
          // Check if booking has expired
          if (currentDateTime > endDateTime) {
            expiredBookings.push({
              bookingId: booking.bookingId,
              name: booking.name,
              email: booking.email,
              date: booking.date,
              time: booking.time,
              endDateTime: endDateTime.toISOString(),
              theaterName: booking.theaterName,
              totalAmount: booking.totalAmount
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Error parsing booking date/time:', booking.bookingId, error);
      }
    }
    
    return {
      success: true,
      expiredCount: expiredBookings.length,
      expiredBookings: expiredBookings,
      message: `Found ${expiredBookings.length} expired bookings`
    };
    
  } catch (error) {
    console.error('❌ Error getting expired bookings:', error);
    return {
      success: false,
      error: 'Failed to get expired bookings'
    };
  }
};

// Get all cancelled bookings from MongoDB database
const getAllCancelledBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(CANCELLED_COLLECTION_NAME);
    
    // Find all cancelled bookings
    const cancelledBookings = await collection.find({}).toArray();
    
    return {
      success: true,
      cancelledBookings: cancelledBookings,
      total: cancelledBookings.length,
      database: DB_NAME,
      collection: CANCELLED_COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error getting cancelled bookings from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get cancelled bookings from MongoDB'
    };
  }
};

// Get all manual bookings from manual_booking collection
const getAllManualBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }

    if (!db) {
      throw new Error('Database not connected');
    }

    const collection = db.collection(MANUAL_BOOKING_COLLECTION_NAME);
    const bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Decompress all bookings
    const decompressedBookings = [];
    for (const booking of bookings) {
      try {
        const decompressedData = await decompressData(booking.compressedData);
        decompressedBookings.push({
          ...(decompressedData as Record<string, unknown>),
          _id: booking._id,
          bookingId: booking.bookingId,
          createdAt: booking.createdAt,
          status: booking.status
        });
      } catch (error) {
        console.error('❌ Error decompressing manual booking:', booking.bookingId, error);
      }
    }

    return {
      success: true,
      manualBookings: decompressedBookings,
      total: decompressedBookings.length,
      database: DB_NAME,
      collection: MANUAL_BOOKING_COLLECTION_NAME
    };

  } catch (error) {
    console.error('❌ Error getting manual bookings from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get manual bookings from MongoDB'
    };
  }
};

// Database operations
const database = {
  connect: connectToDatabase,
  checkConnection: checkConnection,
  saveBooking: saveBooking,
  saveManualBooking: saveManualBooking,
  getAllManualBookings: getAllManualBookings,
  saveIncompleteBooking: saveIncompleteBooking,
  getAllBookings: getAllBookings,
  getAllIncompleteBookings: getAllIncompleteBookings,
  deleteIncompleteBooking: deleteIncompleteBooking,
  deleteExpiredIncompleteBookings: deleteExpiredIncompleteBookings,
  getBookingById: getBookingById,
  updateBooking: updateBooking,
  updateBookingStatus: updateBookingStatus,
  deleteBooking: deleteBooking,
  moveBookingToCancelled: moveBookingToCancelled,
  getAllCancelledBookings: getAllCancelledBookings,
  deleteExpiredBookings: deleteExpiredBookings,
  getExpiredBookings: getExpiredBookings,
  isConnected: () => isConnected
};

// Get bookings by occasion from MongoDB database
const getBookingsByOccasion = async (occasion: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Find bookings by occasion (limit to recent 50 for performance)
    const bookings = await collection.find({ 
      occasion: occasion 
    }).sort({ createdAt: -1 }).limit(50).toArray();
    
    return {
      success: true,
      bookings: bookings,
      total: bookings.length,
      occasion: occasion,
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ Error getting bookings by occasion from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get bookings by occasion from MongoDB'
    };
  }
};

// Auto-connect when module loads
connectToDatabase();

export { connectToDatabase, getBookingsByOccasion };
export default database;
