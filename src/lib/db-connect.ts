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
  // Manual booking specific fields
  isManualBooking?: boolean;
  bookingType?: string;
  createdBy?: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
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
  extraGuestsCount?: number;
  extraGuestCharges?: number;
  pricingData?: any;
}

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
const DB_NAME = 'feelmetown';
const COLLECTION_NAME = 'booking';
const INCOMPLETE_COLLECTION_NAME = 'incomplete_booking';
const CANCELLED_COLLECTION_NAME = 'cancelled_booking';
const MANUAL_BOOKING_COLLECTION_NAME = 'manual_booking';
const THEATER_COLLECTION_NAME = 'theaters';
const GALLERY_COLLECTION_NAME = 'gallery';
const COUPON_COLLECTION_NAME = 'coupons';
const OCCASION_COLLECTION_NAME = 'occasions';
const SERVICE_COLLECTION_NAME = 'services';
const USER_COLLECTION_NAME = 'staff';
const ADMIN_COLLECTION_NAME = 'admin';
const REQUESTS_COLLECTION_NAME = 'password_change_requests';
const SETTINGS_COLLECTION_NAME = 'settings';
const COUNTERS_COLLECTION_NAME = 'counters';
const TIME_SLOTS_COLLECTION_NAME = 'time_slots';
const FAQ_COLLECTION_NAME = 'faqs';

let client: MongoClient | null = null;
let db: Db | null = null;

// Database connection status
let isConnected = false;

// Compression utilities
const compressData = async (data: unknown): Promise<Buffer> => {
  try {
    const jsonString = JSON.stringify(data);
    const inputBuffer = Buffer.from(jsonString, 'utf8');
    
    // Use Zlib compression (gzip is a zlib format)
    const compressed = await gzipAsync(inputBuffer);
    
    // Removed excessive logging for performance
    return compressed;
  } catch (error) {
    console.error('❌ Error compressing data:', error);
    throw error;
  }
};

// Delete manual booking from manual_booking collection
const deleteManualBooking = async (bookingId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(MANUAL_BOOKING_COLLECTION_NAME);
    let result;
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      result = await collection.deleteOne({ _id: new ObjectId(bookingId) });
    } else {
      result = await collection.deleteOne({ bookingId });
    }
    if (result.deletedCount === 0) {
      return { success: false, error: 'Manual booking not found or already deleted' };
    }
    console.log(`✅ [DELETE] Manual booking deleted: ${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [DELETE] Error deleting manual booking:', error);
    return { success: false, error: 'Failed to delete manual booking' };
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
    
    console.log(`📦 Data decompressed: ${bufferData.length} bytes → ${decompressed.length} bytes`);
    
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
    
    // Generate unique booking ID with multiple components to prevent duplication
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentDate = new Date().getDate().toString().padStart(2, '0');
    
    // Get timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    
    // Generate random 2-digit number for extra uniqueness
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    // Get the count of existing bookings for sequential component
    const count = await collection.countDocuments();
    const sequentialNumber = (count + 1).toString().padStart(3, '0');
    
    // Format: FMT-YYYY-MMDD-SEQ-TS-RN
    // Example: FMT-2025-1003-001-123456-42
    const bookingId = `FMT-${currentYear}-${currentMonth}${currentDate}-${sequentialNumber}-${timestamp}-${randomNum}`;
    
    console.log('🎫 Generated unique booking ID:', bookingId);
    return bookingId;
    
  } catch (error) {
    console.error('❌ Error generating booking ID:', error);
    // Fallback to timestamp-based ID with extra uniqueness
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentDate = new Date().getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FMT-${currentYear}-${currentMonth}${currentDate}-FALLBACK-${timestamp}-${randomNum}`;
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

// Helper function to get occasion person name dynamically
const getOccasionPersonName = async (bookingData: any) => {
  try {
    // Fetch occasions from database to get required fields
    const occasions = await getAllOccasions();
    const occasion = occasions.find((occ: any) => occ.name === bookingData.occasion);
    
    if (!occasion || !occasion.requiredFields || occasion.requiredFields.length === 0) {
      return '';
    }
    
    // Find the first name field from required fields
    const nameField = occasion.requiredFields.find((field: string) => 
      field.toLowerCase().includes('name') && !field.toLowerCase().includes('partner2')
    );
    
    if (nameField && bookingData[nameField]) {
      return bookingData[nameField];
    }
    
    // Fallback: try to find any name field in booking data
    for (const field of occasion.requiredFields) {
      if (bookingData[field]) {
        return bookingData[field];
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error getting occasion person name:', error);
    return '';
  }
};

// Helper function to get dynamic occasion fields
const getDynamicOccasionFields = async (bookingData: any) => {
  try {
    // Fetch occasions from database to get required fields
    const occasions = await getAllOccasions();
    const occasion = occasions.find((occ: any) => occ.name === bookingData.occasion);
    
    if (!occasion) {
      console.log('⚠️ No occasion found for:', bookingData.occasion);
    }
    
    console.log('🎯 Dynamic occasion fields for', bookingData.occasion, ':', occasion?.requiredFields);
    console.log('🎯 Available booking data keys:', Object.keys(bookingData));
    
    const dynamicFields: any = {};
    
    // Check for occasion data in multiple places
    if (occasion?.requiredFields && occasion.requiredFields.length > 0) {
      occasion.requiredFields.forEach((fieldName: string) => {
        let fieldValue = null;
        
        // Method 1: Check direct field in booking data
        if (bookingData[fieldName]) {
          fieldValue = bookingData[fieldName];
          console.log(`  ✅ Method 1 - Direct field: ${fieldName} = "${fieldValue}"`);
        }
        
        // Method 2: Check in occasionData object (new dynamic system)
        if (!fieldValue && bookingData.occasionData && bookingData.occasionData[fieldName]) {
          fieldValue = bookingData.occasionData[fieldName];
          console.log(`  ✅ Method 2 - OccasionData field: ${fieldName} = "${fieldValue}"`);
        }
        
        // Method 3: Check for fields with _label suffix (from API processing)
        if (!fieldValue && bookingData[`${fieldName}_label`]) {
          // If we have a label, the value should be in the base field or _value field
          fieldValue = bookingData[fieldName] || bookingData[`${fieldName}_value`];
          if (fieldValue) {
            console.log(`  ✅ Method 3 - Label field: ${fieldName} = "${fieldValue}"`);
          }
        }
        
        if (fieldValue && fieldValue.toString().trim()) {
          const trimmedValue = fieldValue.toString().trim();
          const fieldLabel = occasion?.fieldLabels?.[fieldName] || fieldName;
          
          // Save with exact database field name and label
          dynamicFields[fieldName] = trimmedValue;
          dynamicFields[`${fieldName}_label`] = fieldLabel;
          dynamicFields[`${fieldName}_value`] = trimmedValue;
          
          console.log(`  📝 Saved dynamic field: ${fieldName} = "${trimmedValue}" (Label: "${fieldLabel}")`);
        } else {
          console.log(`  ❌ Missing field: ${fieldName}`);
        }
      });
    }

    // Resilience fallback: include ANY keys present in occasionData
    if (bookingData.occasionData && typeof bookingData.occasionData === 'object') {
      Object.keys(bookingData.occasionData).forEach((key) => {
        const rawValue = bookingData.occasionData[key];
        if (rawValue !== undefined && rawValue !== null && rawValue.toString().trim() !== '') {
          const trimmedValue = rawValue.toString().trim();
          const fieldLabel = occasion?.fieldLabels?.[key] || key;
          if (!dynamicFields[key]) {
            dynamicFields[key] = trimmedValue;
            dynamicFields[`${key}_label`] = fieldLabel;
            dynamicFields[`${key}_value`] = trimmedValue;
            console.log(`  📝 Fallback saved field: ${key} = "${trimmedValue}" (Label: "${fieldLabel}")`);
          }
        }
      });
    }
    
    console.log('🎉 Final dynamic fields to save:', Object.keys(dynamicFields));
    return dynamicFields;
  } catch (error) {
    console.error('❌ Error getting dynamic occasion fields:', error);
    return {};
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
    
    // Generate booking ID, but preserve provided one if present
    const customBookingId = (bookingData as any)?.bookingId && String((bookingData as any).bookingId).trim()
      ? String((bookingData as any).bookingId).trim()
      : await generateBookingId();
    
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
      // Dynamic occasion-specific names for easy querying
      occasionPersonName: await getOccasionPersonName(bookingData),
      // Dynamic occasion-specific fields based on database configuration
      ...(await getDynamicOccasionFields(bookingData)),
      // Keep some key items for easy querying
      selectedMovies: bookingData.selectedMovies || [],
      selectedCakes: bookingData.selectedCakes || [],
      selectedDecorItems: bookingData.selectedDecorItems || [],
      selectedGifts: bookingData.selectedGifts || [],
      // Manual booking specific fields
      isManualBooking: bookingData.isManualBooking || false,
      bookingType: bookingData.bookingType || 'Online',
      createdBy: bookingData.createdBy || 'Customer',
      staffId: bookingData.staffId || null,
      staffName: bookingData.staffName || null,
      notes: bookingData.notes || ''
    };
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    
    // Insert compressed booking into MongoDB
    const result = await collection.insertOne(compressedBooking);
    
    // Log occasion fields that were saved
    const savedOccasionFields = await getDynamicOccasionFields(bookingData);
    
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
      occasion: booking.occasion,
      totalAmount: booking.totalAmount,
      occasionFieldsCount: Object.keys(savedOccasionFields).length
    });
    
    // Log specific occasion fields that were saved
    if (Object.keys(savedOccasionFields).length > 0) {
      console.log('🎪 Occasion-specific fields saved to database:');
      Object.keys(savedOccasionFields).forEach(key => {
        if (key.endsWith('_label')) {
          const baseKey = key.replace('_label', '');
          const label = savedOccasionFields[key];
          const value = savedOccasionFields[baseKey];
          if (value) {
            console.log(`  🏷️ ${label}: "${value}"`);
          }
        } else if (!key.endsWith('_value') && !key.endsWith('_label')) {
          console.log(`  📝 ${key}: "${savedOccasionFields[key]}"`);
        }
      });
    } else {
      console.log('⚠️ No occasion-specific fields were saved to database');
    }
    
    // Increment appropriate counter based on booking status
    if (booking.status === 'confirmed') {
      await incrementCounter('confirmed');
    } else if (booking.status === 'completed') {
      await incrementCounter('completed');
    } else if (booking.status === 'manual') {
      await incrementCounter('manual');
      
      // Also increment staff-specific counter if staffId is provided
      if (bookingData.staffId) {
        await incrementStaffCounter(bookingData.staffId);
      }
    }
    
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
      status: booking.status,
      // Keep some basic fields uncompressed for quick queries (parity with saveBooking)
      name: booking.name,
      email: booking.email,
      theaterName: booking.theaterName,
      date: booking.date,
      time: booking.time,
      occasion: booking.occasion,
      totalAmount: booking.totalAmount,
      // Dynamic occasion-specific name for easy querying
      occasionPersonName: await getOccasionPersonName(booking),
      // Dynamic occasion-specific fields based on database configuration
      ...(await getDynamicOccasionFields(booking)),
      // Keep selected items for quick queries
      selectedMovies: booking.selectedMovies || [],
      selectedCakes: booking.selectedCakes || [],
      selectedDecorItems: booking.selectedDecorItems || [],
      selectedGifts: booking.selectedGifts || [],
      // Manual booking specific fields
      isManualBooking: true,
      bookingType: 'Manual',
      createdBy: 'Admin',
      staffId: booking.staffId || null,
      staffName: booking.staffName || null,
      notes: booking.notes || ''
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
    
    // Log occasion fields that were saved for manual bookings
    const savedOccasionFields = await getDynamicOccasionFields(booking);
    if (Object.keys(savedOccasionFields).length > 0) {
      console.log('🎪 Occasion-specific fields saved (manual booking):');
      Object.keys(savedOccasionFields).forEach(key => {
        if (key.endsWith('_label')) {
          const baseKey = key.replace('_label', '');
          const label = savedOccasionFields[key];
          const value = savedOccasionFields[baseKey];
          if (value) {
            console.log(`  🏷️ ${label}: "${value}"`);
          }
        } else if (!key.endsWith('_value') && !key.endsWith('_label')) {
          console.log(`  📝 ${key}: "${savedOccasionFields[key]}"`);
        }
      });
    } else {
      console.log('⚠️ No occasion-specific fields were saved for manual booking');
    }
    
    // Increment manual booking counter
    await incrementCounter('manual');
    
    // Also increment staff-specific counter if staffId is provided
    if (bookingData.staffId) {
      await incrementStaffCounter(bookingData.staffId);
    }
    
    // Auto-save to Excel database
    try {
      const excelCollection = db.collection('excel_staff_bookings');
      
      const excelEntry = {
        bookingId: customBookingId,
        staffId: bookingData.staffId || 'UNKNOWN',
        staffName: bookingData.staffName || bookingData.createdBy || 'Unknown Staff',
        customerName: booking.name,
        email: booking.email,
        phone: booking.phone,
        theaterName: booking.theaterName,
        date: booking.date,
        time: booking.time,
        occasion: booking.occasion,
        numberOfPeople: booking.numberOfPeople,
        totalAmount: booking.totalAmount,
        status: booking.status,
        bookingType: 'Manual Booking',
        originalBookingData: booking,
        excelCreatedAt: new Date(),
        excelUpdatedAt: new Date(),
        isExported: true,
        autoSaved: true
      };
      
      await excelCollection.insertOne(excelEntry);
      console.log(`📊 Auto-saved to Excel database: ${customBookingId}`);
    } catch (excelError) {
      console.error('⚠️ Failed to auto-save to Excel database:', excelError);
      // Don't fail the main booking if Excel save fails
    }
    
    return {
      success: true,
      message: 'Manual booking saved to FeelME Town MongoDB database and Excel system',
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
    
    // Set expiry time to 12 hours from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (12 * 60 * 60 * 1000));
    
    // Add timestamp, status, custom booking ID, and expiry
    const incompleteBooking = {
      ...bookingData,
      bookingId: customBookingId,
      createdAt: bookingData.createdAt || now, // Use booking date if provided, otherwise current time
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
    
    // Increment incomplete booking counter
    await incrementCounter('incomplete');
    
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

// Increment staff-specific counter in counters collection
const incrementStaffCounter = async (staffId: string) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection<any>(COUNTERS_COLLECTION_NAME);
    const staffCounterId = `staff_${staffId}`;
    
    // Get current IST date for reset logic
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentDay = istNow.getDate();
    const currentMonth = istNow.getMonth();
    const currentYear = istNow.getFullYear();
    
    // Calculate week start
    const currentWeekStart = new Date(istNow);
    currentWeekStart.setDate(istNow.getDate() - istNow.getDay());
    const currentWeekStartDay = currentWeekStart.getDate();
    const currentWeekStartMonth = currentWeekStart.getMonth();
    const currentWeekStartYear = currentWeekStart.getFullYear();
    
    // Check if staff counter exists
    const existingCounter = await collection.findOne({ _id: staffCounterId as any });
    
    if (!existingCounter) {
      // Create new staff counter
      const newStaffCounter = {
        _id: staffCounterId,
        staffId: staffId,
        type: 'staff_manual',
        dailyCount: 1,
        weeklyCount: 1,
        monthlyCount: 1,
        yearlyCount: 1,
        totalCount: 1,
        count: 1, // Legacy support
        lastResetDay: currentDay,
        lastResetWeekDay: currentWeekStartDay,
        lastResetWeekMonth: currentWeekStartMonth,
        lastResetWeekYear: currentWeekStartYear,
        lastResetMonth: currentMonth,
        lastResetYear: currentYear,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      await collection.insertOne(newStaffCounter);
      console.log(`✅ Created new staff counter for ${staffId}: 1 booking`);
      return { success: true, message: 'Staff counter created and incremented' };
    }
    
    // Check if counters need reset (same logic as main counters)
    let resetDaily = false, resetWeekly = false, resetMonthly = false, resetYearly = false;
    
    if (existingCounter.lastResetDay !== currentDay || 
        existingCounter.lastResetMonth !== currentMonth || 
        existingCounter.lastResetYear !== currentYear) {
      resetDaily = true;
    }
    
    if (existingCounter.lastResetWeekDay !== currentWeekStartDay ||
        existingCounter.lastResetWeekMonth !== currentWeekStartMonth ||
        existingCounter.lastResetWeekYear !== currentWeekStartYear) {
      resetWeekly = true;
    }
    
    if (existingCounter.lastResetMonth !== currentMonth || 
        existingCounter.lastResetYear !== currentYear) {
      resetMonthly = true;
    }
    
    if (existingCounter.lastResetYear !== currentYear) {
      resetYearly = true;
    }
    
    // Update counter with reset logic
    const updateDoc: any = {
      $inc: {
        totalCount: 1,
        count: 1 // Legacy support
      },
      $set: {
        lastUpdated: new Date()
      }
    };
    
    if (resetDaily) {
      updateDoc.$set.dailyCount = 1;
      updateDoc.$set.lastResetDay = currentDay;
    } else {
      updateDoc.$inc.dailyCount = 1;
    }
    
    if (resetWeekly) {
      updateDoc.$set.weeklyCount = 1;
      updateDoc.$set.lastResetWeekDay = currentWeekStartDay;
      updateDoc.$set.lastResetWeekMonth = currentWeekStartMonth;
      updateDoc.$set.lastResetWeekYear = currentWeekStartYear;
    } else {
      updateDoc.$inc.weeklyCount = 1;
    }
    
    if (resetMonthly) {
      updateDoc.$set.monthlyCount = 1;
      updateDoc.$set.lastResetMonth = currentMonth;
    } else {
      updateDoc.$inc.monthlyCount = 1;
    }
    
    if (resetYearly) {
      updateDoc.$set.yearlyCount = 1;
      updateDoc.$set.lastResetYear = currentYear;
    } else {
      updateDoc.$inc.yearlyCount = 1;
    }
    
    await collection.updateOne({ _id: staffCounterId }, updateDoc);
    
    console.log(`✅ Incremented staff counter for ${staffId}`);
    return { success: true, message: 'Staff counter incremented' };
    
  } catch (error) {
    console.error(`❌ Error incrementing staff counter for ${staffId}:`, error);
    return { success: false, error: 'Failed to increment staff counter' };
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
          const decompressed: any = await decompressData(booking.compressedData);
          // Merge decompressed data with database fields
          const mergedBooking = {
            ...decompressed,
            _id: booking._id,
            bookingId: booking.bookingId || decompressed.bookingId,
            createdAt: booking.createdAt || decompressed.createdAt,
            status: booking.status || decompressed.status,
            expiredAt: booking.expiredAt || decompressed.expiredAt,
            updatedAt: booking.updatedAt || decompressed.updatedAt,
            // Override with database fields if they exist
            name: booking.name || decompressed.name || decompressed.customerName,
            email: booking.email || decompressed.email,
            phone: decompressed.phone,
            theaterName: booking.theaterName || decompressed.theaterName || decompressed.theater,
            date: booking.date || decompressed.date,
            time: booking.time || decompressed.time,
            occasion: booking.occasion || decompressed.occasion,
            totalAmount: booking.totalAmount || decompressed.totalAmount || decompressed.amount,
            // Guest-related fields
            numberOfPeople: booking.numberOfPeople || decompressed.numberOfPeople,
            extraGuestsCount: booking.extraGuestsCount || decompressed.extraGuestsCount,
            extraGuestCharges: booking.extraGuestCharges || decompressed.extraGuestCharges,
            pricingData: booking.pricingData || decompressed.pricingData
          };
          decompressedBookings.push(mergedBooking);
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
        // Prioritize uncompressed fields over compressed data (for updated fields)
        decompressedBooking = { ...decompressedData, ...booking } as typeof booking;
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
    
    // Get the original booking data first to preserve existing fields
    console.log(`🔍 Getting original booking data for ID: ${bookingId}`);
    const originalBookingResult = await getBookingById(bookingId);
    const originalBooking = originalBookingResult.booking;
    
    console.log(`🔍 Original booking result:`, {
      success: originalBookingResult.success,
      hasBooking: !!originalBooking,
      bookingId: originalBooking?.bookingId,
      mongoId: originalBooking?._id
    });
    
    if (!originalBooking) {
      console.error(`❌ Original booking not found for ID: ${bookingId}`);
      return {
        success: false,
        error: 'Original booking not found'
      };
    }
    
    // Merge the new data with the original booking data
    const mergedBookingData = {
      ...originalBooking,
      ...bookingData,
      // Ensure we preserve the original booking ID and creation date
      bookingId: originalBooking.bookingId || originalBooking.id,
      createdAt: originalBooking.createdAt
    };
    
    console.log('🔍 Merged booking data for compression:', {
      originalTime: (originalBooking as any).time,
      newTime: bookingData.time,
      originalDate: (originalBooking as any).date,
      newDate: bookingData.date,
      originalTheater: (originalBooking as any).theaterName,
      newTheater: bookingData.theaterName,
      mergedTime: (mergedBookingData as any).time,
      mergedDate: (mergedBookingData as any).date,
      mergedTheater: (mergedBookingData as any).theaterName
    });
    
    // Compress the merged booking data
    const compressedData = await compressData(mergedBookingData);
    
    // Log the compressed data to verify time slot is included
    console.log('🔍 Compressed data verification:', {
      originalTime: (originalBooking as any).time,
      newTime: bookingData.time,
      mergedTime: (mergedBookingData as any).time,
      compressedDataSize: compressedData.length,
      hasTimeInMerged: !!(mergedBookingData as any).time,
      hasDateInMerged: !!(mergedBookingData as any).date,
      hasTheaterInMerged: !!(mergedBookingData as any).theaterName
    });
    
    // Create update object with compressed data
    const updateData: any = {
      compressedData: compressedData,
      updatedAt: new Date()
    };
    
    // Only update uncompressed fields if they are provided, otherwise preserve original values
    if (bookingData.customerName !== undefined || bookingData.name !== undefined) {
      updateData.name = bookingData.customerName || bookingData.name;
    } else {
      updateData.name = originalBooking.name;
    }
    if (bookingData.email !== undefined) {
      updateData.email = bookingData.email;
    } else {
      updateData.email = originalBooking.email;
    }
    if (bookingData.phone !== undefined) {
      updateData.phone = bookingData.phone;
    } else {
      updateData.phone = originalBooking.phone;
    }
    if (bookingData.theater !== undefined || bookingData.theaterName !== undefined) {
      updateData.theaterName = bookingData.theater || bookingData.theaterName;
    } else {
      updateData.theaterName = originalBooking.theaterName;
    }
    if (bookingData.date !== undefined) {
      updateData.date = bookingData.date;
    } else {
      updateData.date = originalBooking.date;
    }
    if (bookingData.time !== undefined) {
      updateData.time = bookingData.time;
    } else {
      updateData.time = originalBooking.time;
    }
    if (bookingData.occasion !== undefined) {
      updateData.occasion = bookingData.occasion;
    } else {
      updateData.occasion = originalBooking.occasion;
    }
    if (bookingData.amount !== undefined || bookingData.totalAmount !== undefined) {
      updateData.totalAmount = bookingData.amount || bookingData.totalAmount;
    } else {
      updateData.totalAmount = originalBooking.totalAmount;
    }
    if (bookingData.status !== undefined) {
      updateData.status = bookingData.status;
    } else {
      updateData.status = originalBooking.status;
    }
    if (bookingData.numberOfPeople !== undefined) {
      updateData.numberOfPeople = bookingData.numberOfPeople;
    } else {
      updateData.numberOfPeople = originalBooking.numberOfPeople;
    }
    
    // Try to update by ObjectId first, then by custom bookingId
    let updateResult;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      console.log(`🔍 Trying to update by ObjectId: ${bookingId}`);
      updateResult = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: updateData
        }
      );
      console.log(`🔍 ObjectId update result:`, {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });
    } else {
      // Try as custom ID field
      console.log(`🔍 Trying to update by bookingId: ${bookingId}`);
      updateResult = await collection.updateOne(
        { bookingId: bookingId },
        { 
          $set: updateData
        }
      );
      console.log(`🔍 bookingId update result:`, {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });
    }
    
    // If no documents matched, the booking doesn't exist
    if (updateResult.matchedCount === 0) {
      console.error(`❌ No booking found with ID: ${bookingId}`);
      return {
        success: false,
        error: 'Booking not found'
      };
    }
    
    // Log the update result for debugging
    console.log(`📝 Update result for booking ${bookingId}:`, {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });
    
    // It's possible that no fields actually changed (modifiedCount === 0).
    // Treat this as success and return the current booking state.
    
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
    
    // Decompress the booking data to get the full booking information
    let fullBookingData: any;
    if (updatedBooking.compressedData) {
      try {
        const decompressedData = await decompressData(updatedBooking.compressedData);
        // Prioritize uncompressed fields over compressed data (for updated fields)
        fullBookingData = { ...(decompressedData as any), ...updatedBooking };
        
        // Verify that the time slot was correctly updated in compressed data
        console.log('🔍 Compressed data verification after update:', {
          bookingId: bookingId,
          originalTime: (originalBooking as any).time,
          newTime: bookingData.time,
          decompressedTime: (decompressedData as any).time,
          finalTime: fullBookingData.time,
          decompressedDate: (decompressedData as any).date,
          finalDate: fullBookingData.date,
          decompressedTheater: (decompressedData as any).theaterName,
          finalTheater: fullBookingData.theaterName,
          timeSlotUpdated: (decompressedData as any).time === bookingData.time
        });
      } catch (error) {
        console.error('❌ Error decompressing booking data:', error);
        fullBookingData = updatedBooking; // Fallback to uncompressed data
      }
    } else {
      fullBookingData = updatedBooking;
    }
    
    console.log(`✅ Booking updated in MongoDB:`, bookingId);
    
    // Increment appropriate counter if status changed
    if (bookingData.status === 'completed') {
      await incrementCounter('completed');
      // Decrement incomplete counter when a booking is completed
      await decrementCounter('incomplete');
      console.log('📉 Decremented incomplete counter after booking completion');
    }
    
    return {
      success: true,
      booking: {
        id: fullBookingData.bookingId || fullBookingData._id,
        name: fullBookingData.name,
        email: fullBookingData.email,
        phone: fullBookingData.phone,
        theaterName: fullBookingData.theaterName,
        date: fullBookingData.date,
        time: fullBookingData.time,
        occasion: fullBookingData.occasion,
        numberOfPeople: fullBookingData.numberOfPeople,
        totalAmount: fullBookingData.totalAmount,
        createdAt: fullBookingData.createdAt,
        updatedAt: fullBookingData.updatedAt,
        // Include all other fields from the decompressed data
        ...fullBookingData
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

// Update manual booking in MongoDB
const updateManualBooking = async (bookingId: string, bookingData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(MANUAL_BOOKING_COLLECTION_NAME);
    
    // Get the original manual booking data first to preserve existing fields
    const manualBookings = await getAllManualBookings();
    const originalBooking = manualBookings.manualBookings?.find((b: any) => b.bookingId === bookingId);
    
    if (!originalBooking) {
      return {
        success: false,
        error: 'Original manual booking not found'
      };
    }
    
    // Merge the new data with the original booking data
    const mergedBookingData = {
      ...originalBooking,
      ...bookingData,
      // Ensure we preserve the original booking ID and creation date
      bookingId: originalBooking.bookingId,
      createdAt: originalBooking.createdAt
    };
    
    // Compress the merged booking data
    const compressedData = await compressData(mergedBookingData);
    
    // Log the compressed data to verify time slot is included (manual booking)
    console.log('🔍 Manual booking compressed data verification:', {
      originalTime: (originalBooking as any).time,
      newTime: bookingData.time,
      mergedTime: (mergedBookingData as any).time,
      compressedDataSize: compressedData.length,
      hasTimeInMerged: !!(mergedBookingData as any).time,
      hasDateInMerged: !!(mergedBookingData as any).date,
      hasTheaterInMerged: !!(mergedBookingData as any).theaterName
    });
    
    // Create update object with compressed data
    const updateData = {
      compressedData: compressedData,
      updatedAt: new Date(),
      // Keep some basic fields uncompressed for quick queries
      name: bookingData.customerName || bookingData.name || (originalBooking as any).name,
      email: bookingData.email || (originalBooking as any).email,
      phone: bookingData.phone || (originalBooking as any).phone,
      theaterName: bookingData.theater || (originalBooking as any).theaterName,
      date: bookingData.date || (originalBooking as any).date,
      time: bookingData.time || (originalBooking as any).time,
      occasion: bookingData.occasion || (originalBooking as any).occasion,
      totalAmount: bookingData.amount || bookingData.totalAmount || (originalBooking as any).totalAmount
    };
    
    // Try to update by ObjectId first, then by custom bookingId
    let updateResult;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      updateResult = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData }
      );
    } else {
      // Try as custom ID field
      updateResult = await collection.updateOne(
        { bookingId: bookingId },
        { $set: updateData }
      );
    }
    
    if (updateResult.matchedCount === 0) {
      return {
        success: false,
        error: 'Manual booking not found'
      };
    }
    
    if (updateResult.modifiedCount === 0) {
      return {
        success: false,
        error: 'Manual booking not found or no changes made'
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
        error: 'Updated manual booking not found'
      };
    }
    
    // Decompress the booking data to get the full booking information
    let fullBookingData: any;
    if (updatedBooking.compressedData) {
      try {
        const decompressedData = await decompressData(updatedBooking.compressedData);
        // Prioritize uncompressed fields over compressed data (for updated fields)
        fullBookingData = { ...(decompressedData as any), ...updatedBooking };
        
        // Verify that the time slot was correctly updated in compressed data (manual booking)
        console.log('🔍 Manual booking compressed data verification after update:', {
          bookingId: bookingId,
          originalTime: (originalBooking as any).time,
          newTime: bookingData.time,
          decompressedTime: (decompressedData as any).time,
          finalTime: fullBookingData.time,
          decompressedDate: (decompressedData as any).date,
          finalDate: fullBookingData.date,
          decompressedTheater: (decompressedData as any).theaterName,
          finalTheater: fullBookingData.theaterName,
          timeSlotUpdated: (decompressedData as any).time === bookingData.time
        });
      } catch (error) {
        console.error('❌ Error decompressing manual booking data:', error);
        fullBookingData = updatedBooking; // Fallback to uncompressed data
      }
    } else {
      fullBookingData = updatedBooking;
    }
    
    console.log(`✅ Manual booking updated in MongoDB:`, bookingId);
    
    return {
      success: true,
      booking: {
        id: fullBookingData.bookingId || fullBookingData._id,
        customerName: fullBookingData.name,
        email: fullBookingData.email,
        phone: fullBookingData.phone,
        theater: fullBookingData.theaterName,
        date: fullBookingData.date,
        time: fullBookingData.time,
        occasion: fullBookingData.occasion,
        totalAmount: fullBookingData.totalAmount,
        status: fullBookingData.status,
        createdAt: fullBookingData.createdAt,
        updatedAt: fullBookingData.updatedAt,
        // Include all other fields from the decompressed data
        ...fullBookingData
      }
    };
    
  } catch (error) {
    console.error('❌ Error updating manual booking in MongoDB:', error);
    return {
      success: false,
      error: 'Failed to update manual booking'
    };
  }
};

// Update incomplete booking in MongoDB
const updateIncompleteBooking = async (bookingId: string, bookingData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(INCOMPLETE_COLLECTION_NAME);
    
    // Compress the updated booking data
    const compressedData = await compressData(bookingData);
    
    // Create update object with compressed data
    const updateData: any = {
      compressedData: compressedData,
      updatedAt: new Date()
    };
    
    // Only update uncompressed fields if they are provided
    if (bookingData.customerName !== undefined || bookingData.name !== undefined) {
      updateData.name = bookingData.customerName || bookingData.name;
    }
    if (bookingData.email !== undefined) {
      updateData.email = bookingData.email;
    }
    if (bookingData.theater !== undefined || bookingData.theaterName !== undefined) {
      updateData.theaterName = bookingData.theater || bookingData.theaterName;
    }
    if (bookingData.date !== undefined) {
      updateData.date = bookingData.date;
    }
    if (bookingData.time !== undefined) {
      updateData.time = bookingData.time;
    }
    if (bookingData.occasion !== undefined) {
      updateData.occasion = bookingData.occasion;
    }
    if (bookingData.amount !== undefined || bookingData.totalAmount !== undefined) {
      updateData.totalAmount = bookingData.amount || bookingData.totalAmount;
    }
    if (bookingData.status !== undefined) {
      updateData.status = bookingData.status;
    }
    
    // Try to update by ObjectId first, then by custom bookingId
    let updateResult;
    
    // First try as ObjectId if it's a valid format
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      updateResult = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData }
      );
    } else {
      // Try as custom ID field
      updateResult = await collection.updateOne(
        { bookingId: bookingId },
        { $set: updateData }
      );
    }
    
    if (updateResult.matchedCount === 0) {
      return {
        success: false,
        error: 'Incomplete booking not found'
      };
    }
    
    // Get the updated booking
    let updatedBooking;
    if (ObjectId.isValid(bookingId) && bookingId.length === 24) {
      updatedBooking = await collection.findOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      updatedBooking = await collection.findOne({ bookingId: bookingId });
    }
    
    if (!updatedBooking) {
      return {
        success: false,
        error: 'Updated incomplete booking not found'
      };
    }
    
    console.log(`✅ Incomplete booking updated in MongoDB:`, bookingId);
    
    return {
      success: true,
      booking: {
        id: updatedBooking.bookingId || updatedBooking._id,
        name: updatedBooking.name,
        email: updatedBooking.email,
        phone: updatedBooking.phone,
        theater: updatedBooking.theaterName,
        date: updatedBooking.date,
        time: updatedBooking.time,
        occasion: updatedBooking.occasion,
        totalAmount: updatedBooking.totalAmount,
        status: updatedBooking.status,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      }
    };
    
  } catch (error) {
    console.error('❌ Error updating incomplete booking in MongoDB:', error);
    return {
      success: false,
      error: 'Failed to update incomplete booking'
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
    
    // Decompress booking data to extract important fields
    let decompressedData: any = {};
    if (booking.compressedData) {
      try {
        decompressedData = await decompressData(booking.compressedData);
        console.log(`📋 Moving booking ${bookingId} to cancelled - fields present in compressed data:`, {
          phone: decompressedData.phone,
          numberOfPeople: decompressedData.numberOfPeople,
          advancePayment: decompressedData.advancePayment,
          venuePayment: decompressedData.venuePayment,
          totalAmount: decompressedData.totalAmount
        });
      } catch (err) {
        console.error(`⚠️ Could not decompress booking ${bookingId}`, err);
      }
    }
    
    // Add cancellation data to the booking AND explicitly preserve key fields from decompressed data
    // This ensures phone, payment fields etc are available at database level for querying
    const cancelledBooking = {
      ...booking,
      status: 'cancelled',
      cancelledAt: cancellationData.cancelledAt,
      refundAmount: cancellationData.refundAmount,
      refundStatus: cancellationData.refundStatus,
      cancellationReason: cancellationData.cancellationReason || 'Customer requested cancellation',
      originalCollection: COLLECTION_NAME,
      // Explicitly copy key fields from decompressed data to database level for easy access
      name: booking.name || decompressedData.name || decompressedData.customerName,
      email: booking.email || decompressedData.email,
      phone: booking.phone || decompressedData.phone,
      theaterName: booking.theaterName || decompressedData.theaterName || decompressedData.theater,
      date: booking.date || decompressedData.date,
      time: booking.time || decompressedData.time,
      occasion: booking.occasion || decompressedData.occasion,
      numberOfPeople: booking.numberOfPeople || decompressedData.numberOfPeople,
      advancePayment: booking.advancePayment || decompressedData.advancePayment,
      venuePayment: booking.venuePayment || decompressedData.venuePayment,
      totalAmount: booking.totalAmount || decompressedData.totalAmount || decompressedData.amount
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
    
    // Increment cancelled counter
    await incrementCounter('cancelled');
    
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
    console.log(`🗑️ [DELETE] Attempting to delete booking with ID: ${bookingId}`);
    
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
      console.log(`🔍 [DELETE] Trying to delete by ObjectId: ${bookingId}`);
      result = await collection.deleteOne({ _id: new ObjectId(bookingId) });
    } else {
      // Try as custom ID field
      console.log(`🔍 [DELETE] Trying to delete by bookingId field: ${bookingId}`);
      result = await collection.deleteOne({ bookingId: bookingId });
    }
    
    console.log(`📊 [DELETE] Delete result:`, result);
    
    if (result.deletedCount === 0) {
      console.log(`⚠️ [DELETE] No booking found with ID: ${bookingId}`);
      return {
        success: false,
        error: 'Booking not found or already deleted'
      };
    }
    
    console.log(`✅ [DELETE] Booking deleted from MongoDB:`, bookingId);
    
    return {
      success: true,
      message: 'Booking deleted successfully',
      database: DB_NAME,
      collection: COLLECTION_NAME
    };
    
  } catch (error) {
    console.error('❌ [DELETE] Error deleting booking from MongoDB:', error);
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
              mongoId: booking._id,
              name: booking.name,
              date: booking.date,
              time: booking.time,
              status: booking.status,
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
    
    console.log(`🗑️ Found ${expiredBookings.length} expired bookings to process`);
    
    let completedCount = 0;
    let deletedCount = 0;
    
    // First, change status to completed for confirmed bookings, then delete
    for (const expiredBooking of expiredBookings) {
      try {
        // If booking is still confirmed, change to completed first
        if (expiredBooking.status === 'confirmed') {
          await collection.updateOne(
            { _id: expiredBooking.mongoId },
            { 
              $set: { 
                status: 'completed',
                autoCompleted: true,
                autoCompletedAt: currentDateTime,
                updatedAt: currentDateTime
              } 
            }
          );
          
          // Increment completed counter
          await incrementCounter('completed');
          completedCount++;
          
          console.log(`✅ Auto-completed expired booking: ${expiredBooking.bookingId}`);
          
          // Wait a moment to let the completed status be visible
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Then delete the booking
        await collection.deleteOne({ _id: expiredBooking.mongoId });
        deletedCount++;
        
        console.log(`🗑️ Deleted expired booking: ${expiredBooking.bookingId}`);
        
      } catch (error) {
        console.error(`❌ Error processing expired booking ${expiredBooking.bookingId}:`, error);
      }
    }
    
    console.log(`✅ Processed ${expiredBookings.length} expired bookings: ${completedCount} completed, ${deletedCount} deleted`);
    
    return {
      success: true,
      deletedCount: deletedCount,
      completedCount: completedCount,
      processedBookings: expiredBookings,
      message: `Successfully processed ${expiredBookings.length} expired bookings: ${completedCount} completed, ${deletedCount} deleted`
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

// Move booking to completed collection (for archiving completed bookings)
const moveBookingToCompleted = async (bookingId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collections
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(COLLECTION_NAME);
    const completedCollection = db.collection('completed_booking');
    
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
    
    // Decompress booking data to extract important fields
    let decompressedData: any = {};
    if (booking.compressedData) {
      try {
        decompressedData = await decompressData(booking.compressedData);
        console.log(`📋 Moving booking ${bookingId} to completed - fields present:`, {
          phone: decompressedData.phone,
          numberOfPeople: decompressedData.numberOfPeople,
          advancePayment: decompressedData.advancePayment,
          venuePayment: decompressedData.venuePayment,
          totalAmount: decompressedData.totalAmount
        });
      } catch (err) {
        console.error(`⚠️ Could not decompress booking ${bookingId}`, err);
      }
    }
    
    // Add completion data to the booking AND explicitly preserve key fields
    const completedBooking = {
      ...booking,
      status: 'completed',
      completedAt: new Date(),
      originalCollection: COLLECTION_NAME,
      // Explicitly copy key fields from decompressed data to database level
      name: booking.name || decompressedData.name || decompressedData.customerName,
      email: booking.email || decompressedData.email,
      phone: booking.phone || decompressedData.phone,
      theaterName: booking.theaterName || decompressedData.theaterName || decompressedData.theater,
      date: booking.date || decompressedData.date,
      time: booking.time || decompressedData.time,
      occasion: booking.occasion || decompressedData.occasion,
      numberOfPeople: booking.numberOfPeople || decompressedData.numberOfPeople,
      advancePayment: booking.advancePayment || decompressedData.advancePayment,
      venuePayment: booking.venuePayment || decompressedData.venuePayment,
      totalAmount: booking.totalAmount || decompressedData.totalAmount || decompressedData.amount
    };
    
    // Insert into completed collection
    const insertResult = await completedCollection.insertOne(completedBooking);
    
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
    
    console.log(`✅ Booking moved to completed collection:`, bookingId);
    
    // Increment completed counter
    await incrementCounter('completed');
    
    return {
      success: true,
      message: 'Booking moved to completed collection successfully',
      completedBooking: {
        id: (completedBooking as Record<string, unknown>).bookingId,
        mongoId: insertResult.insertedId,
        ...completedBooking
      },
      database: DB_NAME,
      originalCollection: COLLECTION_NAME,
      completedCollection: 'completed_booking'
    };
    
  } catch (error) {
    console.error('❌ Error moving booking to completed collection:', error);
    return {
      success: false,
      error: 'Failed to move booking to completed collection'
    };
  }
};

// Get all completed bookings from completed_booking collection
const getAllCompletedBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection('completed_booking');
    
    const rawCompleted = await collection.find({}).toArray();
    
    // Decompress and merge like getAllBookings
    const completedBookings = [] as any[];
    for (const booking of rawCompleted) {
      if (booking.compressedData) {
        try {
          const decompressed: any = await decompressData(booking.compressedData);
          const merged = {
            ...decompressed,
            _id: booking._id,
            bookingId: booking.bookingId || decompressed.bookingId,
            createdAt: booking.createdAt || decompressed.createdAt,
            completedAt: booking.completedAt || decompressed.completedAt,
            status: 'completed',
            name: booking.name || decompressed.name || decompressed.customerName,
            email: booking.email || decompressed.email,
            phone: booking.phone || decompressed.phone || decompressed.whatsappNumber,
            theaterName: booking.theaterName || decompressed.theaterName || decompressed.theater,
            date: booking.date || decompressed.date,
            time: booking.time || decompressed.time,
            occasion: booking.occasion || decompressed.occasion,
            numberOfPeople: booking.numberOfPeople || decompressed.numberOfPeople || decompressed.peopleCount,
            advancePayment: booking.advancePayment || decompressed.advancePayment || 0,
            venuePayment: booking.venuePayment || decompressed.venuePayment || 0,
            totalAmount: booking.totalAmount || decompressed.totalAmount || decompressed.amount || 0
          };
          completedBookings.push(merged);
        } catch (err) {
          console.error(`❌ Failed to decompress completed booking`, err);
          completedBookings.push({ ...booking, status: 'completed' });
        }
      } else {
        completedBookings.push({ ...booking, status: 'completed' });
      }
    }
    
    return {
      success: true,
      completedBookings,
      total: completedBookings.length,
      database: DB_NAME,
      collection: 'completed_booking'
    };
    
  } catch (error) {
    console.error('❌ Error getting completed bookings from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get completed bookings from MongoDB'
    };
  }
};

// Get all cancelled bookings from MongoDB database (decompressed + merged fields)
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
    const rawCancelled = await collection.find({}).toArray();
    
    // Decompress and merge like getAllBookings to expose important fields
    const cancelledBookings = [] as any[];
    for (const booking of rawCancelled) {
      if (booking.compressedData) {
        try {
          const decompressed: any = await decompressData(booking.compressedData);
          const merged = {
            ...decompressed,
            _id: booking._id,
            bookingId: booking.bookingId || decompressed.bookingId,
            createdAt: booking.createdAt || decompressed.createdAt,
            updatedAt: booking.updatedAt || decompressed.updatedAt,
            status: 'cancelled',
            // cancellation specific
            cancelledAt: booking.cancelledAt || decompressed.cancelledAt,
            refundAmount: booking.refundAmount || decompressed.refundAmount,
            refundStatus: booking.refundStatus || decompressed.refundStatus,
            cancellationReason: booking.cancellationReason || decompressed.cancellationReason,
            // key visible fields
            name: booking.name || decompressed.name || decompressed.customerName,
            email: booking.email || decompressed.email,
            phone: booking.phone || decompressed.phone || decompressed.whatsappNumber,
            theaterName: booking.theaterName || decompressed.theaterName || decompressed.theater,
            date: booking.date || decompressed.date,
            time: booking.time || decompressed.time,
            occasion: booking.occasion || decompressed.occasion,
            numberOfPeople: booking.numberOfPeople || decompressed.numberOfPeople || decompressed.peopleCount,
            advancePayment: booking.advancePayment || decompressed.advancePayment || 0,
            venuePayment: booking.venuePayment || decompressed.venuePayment || 0,
            totalAmount: booking.totalAmount || decompressed.totalAmount || decompressed.amount || 0
          };
          console.log(`📦 Cancelled booking ${merged.bookingId} decompressed:`, {
            phone: merged.phone,
            numberOfPeople: merged.numberOfPeople,
            advancePayment: merged.advancePayment,
            venuePayment: merged.venuePayment,
            totalAmount: merged.totalAmount
          });
          cancelledBookings.push(merged);
        } catch (err) {
          console.error(`❌ Failed to decompress cancelled booking`, err);
          // Fallback to raw booking if decompression fails
          cancelledBookings.push({ ...booking, status: 'cancelled' });
        }
      } else {
        console.log(`⚠️ Cancelled booking has no compressedData, using raw:`, booking.bookingId);
        cancelledBookings.push({ ...booking, status: 'cancelled' });
      }
    }
    
    return {
      success: true,
      cancelledBookings,
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

// Delete cancelled bookings older than 12 hours
const deleteOldCancelledBookings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    // Get collection
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(CANCELLED_COLLECTION_NAME);
    
    // Calculate 12 hours ago from current time
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
    
    console.log(`🗑️ [CLEANUP] Deleting cancelled bookings older than: ${twelveHoursAgo.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    // Find and delete cancelled bookings older than 12 hours
    const result = await collection.deleteMany({
      cancelledAt: { $lt: twelveHoursAgo }
    });
    
    console.log(`🗑️ [CLEANUP] Deleted ${result.deletedCount} old cancelled bookings from MongoDB`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} cancelled bookings older than 12 hours`,
      cutoffTime: twelveHoursAgo.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    
  } catch (error) {
    console.error('❌ Error deleting old cancelled bookings:', error);
    return {
      success: false,
      error: 'Failed to delete old cancelled bookings'
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
// Theater Management Functions
const saveTheater = async (theaterData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(THEATER_COLLECTION_NAME);
    const compressedData = await compressData(theaterData);

    // Determine default display order (append to end)
    const activeCount = await collection.countDocuments({ isActive: { $ne: false } });
    const defaultOrder = (activeCount || 0) + 1;
    
    const theater = {
      theaterId: `THEATER-${Date.now()}`,
      compressedData: compressedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store key fields for easy querying
      name: theaterData.name,
      price: theaterData.price,
      capacity: theaterData.capacity,
      isActive: theaterData.isActive !== false,
      displayOrder: typeof theaterData.displayOrder === 'number' ? theaterData.displayOrder : defaultOrder
      // No expiredAt field - theaters are manually deleted only
    };
    
    const result = await collection.insertOne(theater);
    console.log(`✅ Theater saved to MongoDB:`, theater.theaterId);
    
    return {
      success: true,
      theaterId: theater.theaterId,
      insertedId: result.insertedId
    };
  } catch (error) {
    console.error('❌ Error saving theater to MongoDB:', error);
    return { success: false, error: 'Failed to save theater' };
  }
};

const getAllTheaters = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(THEATER_COLLECTION_NAME);
    const theaters = await collection.find({ isActive: true }).toArray();
    
    const decompressedTheaters = [];
    for (const theater of theaters) {
      if (theater.compressedData) {
        try {
          const decompressed: any = await decompressData(theater.compressedData);
          const mergedTheater = {
            ...decompressed,
            _id: theater._id,
            theaterId: theater.theaterId || decompressed.theaterId,
            createdAt: theater.createdAt || decompressed.createdAt,
            updatedAt: theater.updatedAt || decompressed.updatedAt,
            isActive: theater.isActive !== false,
            displayOrder: theater.displayOrder ?? decompressed.displayOrder ?? 9999
          };
          decompressedTheaters.push(mergedTheater);
        } catch (error) {
          console.error('❌ Error decompressing theater:', theater.theaterId, error);
          decompressedTheaters.push(theater);
        }
      } else {
        decompressedTheaters.push({
          ...theater,
          displayOrder: theater.displayOrder ?? 9999
        });
      }
    }
    // Sort by displayOrder ascending
    decompressedTheaters.sort((a: any, b: any) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
    return {
      success: true,
      theaters: decompressedTheaters,
      total: decompressedTheaters.length
    };
  } catch (error) {
    console.error('❌ Error fetching theaters from MongoDB:', error);
    return { success: false, error: 'Failed to fetch theaters' };
  }
};

const updateTheater = async (theaterId: string, theaterData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(THEATER_COLLECTION_NAME);
    
    // First, get the existing theater data to preserve existing images
    const existingTheater = await collection.findOne({ theaterId: theaterId });
    
    if (!existingTheater) {
      return { success: false, error: 'Theater not found' };
    }
    
    // Decompress existing data to get current images
    let existingData: any = {};
    if (existingTheater.compressedData) {
      try {
        const decompressed = await decompressData(existingTheater.compressedData);
        existingData = decompressed || {};
      } catch (error) {
        console.log('⚠️ Could not decompress existing data, using empty object');
        existingData = {};
      }
    }
    
    // Merge images: keep existing images and add new ones (avoid duplicates)
    const existingImages = existingData?.images || [];
    const newImages = theaterData.images || [];
    
    // Create a Set to avoid duplicate images
    const allImagesSet = new Set([...existingImages, ...newImages]);
    const mergedImages = Array.from(allImagesSet);
    
    console.log(`🖼️ Image merge for theater ${theaterId} (Max: 6):`);
    console.log(`   Existing images: ${existingImages.length}`, existingImages);
    console.log(`   New images: ${newImages.length}`, newImages);
    console.log(`   Merged images: ${mergedImages.length}`, mergedImages);
    
    // Create updated theater data with merged images
    const updatedTheaterData = {
      ...theaterData,
      images: mergedImages
    };
    
    const compressedData = await compressData(updatedTheaterData);
    
    const updateData: any = {
      compressedData: compressedData,
      updatedAt: new Date(),
      name: theaterData.name,
      price: theaterData.price,
      capacity: theaterData.capacity,
      isActive: theaterData.isActive !== false
    };
    if (typeof theaterData.displayOrder === 'number') {
      updateData.displayOrder = theaterData.displayOrder;
    }
    
    const result = await collection.updateOne(
      { theaterId: theaterId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Theater not found' };
    }
    
    console.log(`✅ Theater updated in MongoDB with merged images:`, theaterId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating theater in MongoDB:', error);
    return { success: false, error: 'Failed to update theater' };
  }
};

// Reorder theaters by updating displayOrder in bulk
const reorderTheaters = async (orderUpdates: Array<{ theaterId: string; displayOrder: number }>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection(THEATER_COLLECTION_NAME);

    const ops = orderUpdates.map(u => ({
      updateOne: {
        filter: { theaterId: u.theaterId },
        update: { $set: { displayOrder: u.displayOrder, updatedAt: new Date() } }
      }
    }));

    const result = await collection.bulkWrite(ops, { ordered: false });
    return { success: true, updatedCount: result.modifiedCount };
  } catch (error) {
    console.error('❌ Error reordering theaters:', error);
    return { success: false, error: 'Failed to reorder theaters' };
  }
};

const deleteTheater = async (theaterId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(THEATER_COLLECTION_NAME);
    
    // First get the theater to extract all image URLs for Cloudinary deletion
    const theater = await collection.findOne({ theaterId: theaterId });
    if (!theater) {
      return { success: false, error: 'Theater not found' };
    }
    
    // Collect all image URLs for deletion
    let imageUrls: string[] = [];
    
    if (theater.compressedData) {
      try {
        const decompressed: any = await decompressData(theater.compressedData);
        
        // Check single image field
        if (decompressed.image && decompressed.image.includes('cloudinary.com')) {
          imageUrls.push(decompressed.image);
        }
        
        // Check images array field
        if (decompressed.images) {
          let imagesArray = [];
          
          if (Array.isArray(decompressed.images)) {
            imagesArray = decompressed.images;
          } else if (typeof decompressed.images === 'string') {
            try {
              const parsed = JSON.parse(decompressed.images);
              imagesArray = Array.isArray(parsed) ? parsed : [decompressed.images];
            } catch {
              imagesArray = [decompressed.images];
            }
          }
          
          // Add all Cloudinary images to deletion list
          imagesArray.forEach((img: string) => {
            if (img && typeof img === 'string' && img.includes('cloudinary.com')) {
              if (!imageUrls.includes(img)) { // Avoid duplicates
                imageUrls.push(img);
              }
            }
          });
        }
        
        console.log(`🗑️ Found ${imageUrls.length} Cloudinary images to delete for theater ${theaterId}:`, imageUrls);
        
      } catch (decompressError) {
        console.warn('⚠️ Could not decompress theater data for images:', decompressError);
      }
    } else {
      // Handle non-compressed data
      if (theater.image && theater.image.includes('cloudinary.com')) {
        imageUrls.push(theater.image);
      }
      
      if (theater.images) {
        let imagesArray = [];
        
        if (Array.isArray(theater.images)) {
          imagesArray = theater.images;
        } else if (typeof theater.images === 'string') {
          try {
            const parsed = JSON.parse(theater.images);
            imagesArray = Array.isArray(parsed) ? parsed : [theater.images];
          } catch {
            imagesArray = [theater.images];
          }
        }
        
        imagesArray.forEach((img: string) => {
          if (img && typeof img === 'string' && img.includes('cloudinary.com')) {
            if (!imageUrls.includes(img)) {
              imageUrls.push(img);
            }
          }
        });
      }
    }
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne({ theaterId: theaterId });
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Theater not found' };
    }
    
    console.log(`✅ Theater completely deleted from MongoDB:`, theaterId);
    return { success: true, imageUrls };
  } catch (error) {
    console.error('❌ Error deleting theater from MongoDB:', error);
    return { success: false, error: 'Failed to delete theater' };
  }
};

// Gallery Management Functions
const getNextGalleryImageId = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(GALLERY_COLLECTION_NAME);
    
    // Find the latest image ID
    const latestImage = await collection
      .find({ imageId: { $regex: /^IMG\d{4}$/ } })
      .sort({ imageId: -1 })
      .limit(1)
      .toArray();
    
    if (latestImage.length === 0) {
      return 'IMG0001';
    }
    
    // Extract number and increment
    const lastId = latestImage[0].imageId;
    const lastNumber = parseInt(lastId.replace('IMG', ''));
    const nextNumber = lastNumber + 1;
    
    // Format as IMG0001, IMG0002, etc.
    return `IMG${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('❌ Error getting next gallery image ID:', error);
    return `IMG${Date.now().toString().slice(-4)}`;
  }
};

const saveGalleryImage = async (imageData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(GALLERY_COLLECTION_NAME);
    
    // Get next sequential ID
    const imageId = await getNextGalleryImageId();
    
    const galleryImage = {
      imageId: imageId,
      imageUrl: imageData.imageUrl,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(galleryImage);
    console.log(`✅ Gallery image saved to MongoDB:`, galleryImage.imageId);
    
    return {
      success: true,
      imageId: galleryImage.imageId,
      insertedId: result.insertedId
    };
  } catch (error) {
    console.error('❌ Error saving gallery image to MongoDB:', error);
    return { success: false, error: 'Failed to save gallery image' };
  }
};

const getAllGalleryImages = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(GALLERY_COLLECTION_NAME);
    const images = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    return {
      success: true,
      images: images,
      total: images.length
    };
  } catch (error) {
    console.error('❌ Error fetching gallery images from MongoDB:', error);
    return { success: false, error: 'Failed to fetch gallery images' };
  }
};

const deleteGalleryImage = async (imageId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(GALLERY_COLLECTION_NAME);
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne({ imageId: imageId });
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Gallery image not found' };
    }
    
    console.log(`✅ Gallery image permanently deleted from MongoDB:`, imageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting gallery image in MongoDB:', error);
    return { success: false, error: 'Failed to delete gallery image' };
  }
};

// Coupon Management Functions
const saveCoupon = async (couponData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(COUPON_COLLECTION_NAME);
    
    const coupon = {
      couponCode: couponData.couponCode.toUpperCase(),
      discountType: couponData.discountType, // 'percentage' or 'fixed'
      discountValue: couponData.discountValue,
      usageLimit: couponData.usageLimit || null,
      validDate: couponData.validDate ? new Date(couponData.validDate) : new Date(),
      expireDate: couponData.expireDate ? new Date(couponData.expireDate) : null,
      isActive: couponData.isActive !== false,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(coupon);
    console.log(`✅ Coupon saved to MongoDB:`, coupon.couponCode);
    
    return {
      success: true,
      couponCode: coupon.couponCode,
      insertedId: result.insertedId
    };
  } catch (error) {
    console.error('❌ Error saving coupon to MongoDB:', error);
    return { success: false, error: 'Failed to save coupon' };
  }
};

const getAllCoupons = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(COUPON_COLLECTION_NAME);
    const coupons = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    return {
      success: true,
      coupons: coupons,
      total: coupons.length
    };
  } catch (error) {
    console.error('❌ Error fetching coupons from MongoDB:', error);
    return { success: false, error: 'Failed to fetch coupons' };
  }
};

const updateCoupon = async (couponCode: string, couponData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(COUPON_COLLECTION_NAME);
    
    const result = await collection.updateOne(
      { couponCode: couponCode },
      { $set: couponData }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Coupon not found' };
    }
    
    console.log(`✅ Coupon updated in MongoDB:`, couponCode);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating coupon in MongoDB:', error);
    return { success: false, error: 'Failed to update coupon' };
  }
};

const deleteCoupon = async (couponCode: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(COUPON_COLLECTION_NAME);
    
    // Soft delete - mark as inactive (coupons are not deleted from database)
    const result = await collection.updateOne(
      { couponCode: couponCode },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Coupon not found' };
    }
    
    console.log(`✅ Coupon deactivated in MongoDB:`, couponCode);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deactivating coupon in MongoDB:', error);
    return { success: false, error: 'Failed to deactivate coupon' };
  }
};

// ============================================
// OCCASION MANAGEMENT FUNCTIONS
// ============================================

const getNextOccasionId = async (): Promise<string> => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(OCCASION_COLLECTION_NAME);
    const lastOccasion = await collection
      .find()
      .sort({ occasionId: -1 })
      .limit(1)
      .toArray();

    if (lastOccasion.length === 0) {
      return 'OCC0001';
    }

    const lastId = lastOccasion[0].occasionId;
    const numPart = parseInt(lastId.replace('OCC', ''));
    const nextNum = numPart + 1;
    return `OCC${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('❌ Error generating occasion ID:', error);
    return 'OCC0001';
  }
};

const saveOccasion = async (occasionData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(OCCASION_COLLECTION_NAME);
    
    const occasionId = await getNextOccasionId();
    const compressedData = await compressData(occasionData);
    
    const occasion = {
      occasionId: occasionId,
      compressedData: compressedData,
      name: occasionData.name,
      imageUrl: occasionData.imageUrl,
      requiredFields: occasionData.requiredFields || [],
      isActive: occasionData.isActive !== undefined ? occasionData.isActive : true,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(occasion);
    
    console.log(`✅ Occasion saved to MongoDB with ID:`, occasionId);
    return { 
      success: true, 
      occasion: {
        _id: result.insertedId,
        occasionId: occasionId,
        name: occasion.name,
        imageUrl: occasion.imageUrl,
        requiredFields: occasion.requiredFields,
        isActive: occasion.isActive,
        createdAt: occasion.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error saving occasion to MongoDB:', error);
    return { success: false, error: 'Failed to save occasion' };
  }
};

const getAllOccasions = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(OCCASION_COLLECTION_NAME);
    const occasions = await collection.find({ isActive: true }).toArray();
    
    const decompressedOccasions = await Promise.all(
      occasions.map(async (occasion) => {
        let decompressedData: any = {};
        
        if (occasion.compressedData) {
          try {
            decompressedData = await decompressData(occasion.compressedData);
          } catch (error) {
            console.error('❌ Error decompressing occasion data:', error);
          }
        }
        
        return {
          _id: occasion._id,
          occasionId: occasion.occasionId,
          name: occasion.name,
          imageUrl: occasion.imageUrl,
          requiredFields: occasion.requiredFields || [],
          isActive: occasion.isActive,
          createdAt: occasion.createdAt,
          ...decompressedData
        };
      })
    );
    
    console.log(`✅ Fetched ${decompressedOccasions.length} occasions from MongoDB`);
    return decompressedOccasions;
  } catch (error) {
    console.error('❌ Error fetching occasions from MongoDB:', error);
    return [];
  }
};

const updateOccasion = async (id: string, occasionData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(OCCASION_COLLECTION_NAME);
    const compressedData = await compressData(occasionData);
    
    const updateData = {
      compressedData: compressedData,
      name: occasionData.name,
      imageUrl: occasionData.imageUrl,
      requiredFields: occasionData.requiredFields || [],
      isActive: occasionData.isActive !== undefined ? occasionData.isActive : true,
      updatedAt: new Date()
    };
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Occasion not found' };
    }
    
    const updatedOccasion = await collection.findOne({ _id: new ObjectId(id) });
    
    console.log(`✅ Occasion updated in MongoDB:`, id);
    return {
      success: true,
      occasion: {
        _id: updatedOccasion?._id,
        occasionId: updatedOccasion?.occasionId,
        name: updatedOccasion?.name,
        imageUrl: updatedOccasion?.imageUrl,
        requiredFields: updatedOccasion?.requiredFields,
        isActive: updatedOccasion?.isActive,
        createdAt: updatedOccasion?.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error updating occasion in MongoDB:', error);
    return { success: false, error: 'Failed to update occasion' };
  }
};

const deleteOccasion = async (id: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(OCCASION_COLLECTION_NAME);
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) }
    );
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Occasion not found' };
    }
    
    console.log(`✅ Occasion deleted from MongoDB:`, id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting occasion from MongoDB:', error);
    return { success: false, error: 'Failed to delete occasion' };
  }
};

// ============================================
// SERVICE MANAGEMENT FUNCTIONS
// ============================================

const getNextServiceId = async (): Promise<string> => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SERVICE_COLLECTION_NAME);
    const lastService = await collection
      .find()
      .sort({ serviceId: -1 })
      .limit(1)
      .toArray();

    if (lastService.length === 0) {
      return 'SRV0001';
    }

    const lastId = lastService[0].serviceId;
    const numPart = parseInt(lastId.replace('SRV', ''));
    const nextNum = numPart + 1;
    return `SRV${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('❌ Error generating service ID:', error);
    return 'SRV0001';
  }
};

const saveService = async (serviceData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SERVICE_COLLECTION_NAME);
    
    const serviceId = await getNextServiceId();
    const compressedData = await compressData(serviceData);
    
    const service = {
      serviceId: serviceId,
      compressedData: compressedData,
      name: serviceData.name,
      items: serviceData.items || [],
      isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(service);
    
    console.log(`✅ Service saved to MongoDB with ID:`, serviceId);
    return { 
      success: true, 
      service: {
        _id: result.insertedId,
        serviceId: serviceId,
        name: service.name,
        items: service.items,
        isActive: service.isActive,
        createdAt: service.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error saving service to MongoDB:', error);
    return { success: false, error: 'Failed to save service' };
  }
};

const getAllServices = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SERVICE_COLLECTION_NAME);
    const services = await collection.find({ isActive: true }).toArray();
    
    const decompressedServices = await Promise.all(
      services.map(async (service) => {
        let decompressedData: any = {};
        
        if (service.compressedData) {
          try {
            decompressedData = await decompressData(service.compressedData);
          } catch (error) {
            console.error('❌ Error decompressing service data:', error);
          }
        }
        
        return {
          _id: service._id,
          serviceId: service.serviceId,
          name: service.name,
          items: service.items || [],
          isActive: service.isActive,
          createdAt: service.createdAt,
          ...decompressedData
        };
      })
    );
    
    console.log(`✅ Fetched ${decompressedServices.length} services from MongoDB`);
    return decompressedServices;
  } catch (error) {
    console.error('❌ Error fetching services from MongoDB:', error);
    return [];
  }
};

const updateService = async (id: string, serviceData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SERVICE_COLLECTION_NAME);
    const compressedData = await compressData(serviceData);
    
    const updateData: Record<string, unknown> = {
      compressedData: compressedData,
      updatedAt: new Date()
    };
    
    if (serviceData.name !== undefined) updateData.name = serviceData.name;
    if (serviceData.items !== undefined) updateData.items = serviceData.items;
    if (serviceData.isActive !== undefined) updateData.isActive = serviceData.isActive;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Service not found' };
    }
    
    const updatedService = await collection.findOne({ _id: new ObjectId(id) });
    
    console.log(`✅ Service updated in MongoDB:`, id);
    return {
      success: true,
      service: {
        _id: updatedService?._id,
        serviceId: updatedService?.serviceId,
        name: updatedService?.name,
        items: updatedService?.items,
        isActive: updatedService?.isActive,
        createdAt: updatedService?.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error updating service in MongoDB:', error);
    return { success: false, error: 'Failed to update service' };
  }
};

const deleteService = async (id: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SERVICE_COLLECTION_NAME);
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) }
    );
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Service not found' };
    }
    
    console.log(`✅ Service deleted from MongoDB:`, id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting service from MongoDB:', error);
    return { success: false, error: 'Failed to delete service' };
  }
};

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

const getNextStaffId = async (): Promise<string> => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    const lastUser = await collection
      .find()
      .sort({ userId: -1 })
      .limit(1)
      .toArray();

    if (lastUser.length === 0) {
      return 'FMT0001';
    }

    const lastId = lastUser[0].userId;
    // Handle both USR and FMT prefixes for backward compatibility
    const numPart = parseInt(lastId.replace(/^(USR|FMT)/, ''));
    const nextNum = numPart + 1;
    return `FMT${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('❌ Error generating staff ID:', error);
    return 'FMT0001';
  }
};

const saveStaff = async (staffData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    
    const staffId = await getNextStaffId();
    const compressedData = await compressData(staffData);
    
    const staff = {
      userId: staffId,
      compressedData: compressedData,
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      gender: staffData.gender,
      profilePhoto: staffData.profilePhoto,
      photoType: staffData.photoType || 'upload',
      role: staffData.role || 'staff',
      password: staffData.password, // Store password for staff login
      isActive: staffData.isActive !== undefined ? staffData.isActive : true,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(staff);
    
    console.log(`✅ Staff saved to MongoDB with ID:`, staffId);
    return { 
      success: true, 
      user: {
        _id: result.insertedId,
        userId: staffId,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        gender: staff.gender,
        profilePhoto: staff.profilePhoto,
        photoType: staff.photoType,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error saving staff to MongoDB:', error);
    return { success: false, error: 'Failed to save staff' };
  }
};

const getAllUsers = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    const users = await collection.find({}).toArray();
    
    const decompressedUsers = await Promise.all(
      users.map(async (user) => {
        let decompressedData: any = {};
        
        if (user.compressedData) {
          try {
            decompressedData = await decompressData(user.compressedData);
          } catch (error) {
            console.error('❌ Error decompressing user data:', error);
          }
        }
        
        return {
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          profilePhoto: user.profilePhoto,
          photoType: user.photoType,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          password: user.password, // Include password for staff login authentication
          ...decompressedData
        };
      })
    );
    
    console.log(`✅ Fetched ${decompressedUsers.length} users from MongoDB`);
    return decompressedUsers;
  } catch (error) {
    console.error('❌ Error fetching users from MongoDB:', error);
    return [];
  }
};

const updateUser = async (id: string, userData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    const compressedData = await compressData(userData);
    
    const updateData: Record<string, unknown> = {
      compressedData: compressedData,
      updatedAt: new Date()
    };
    
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.gender !== undefined) updateData.gender = userData.gender;
    if (userData.profilePhoto !== undefined) updateData.profilePhoto = userData.profilePhoto;
    if (userData.photoType !== undefined) updateData.photoType = userData.photoType;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
    if (userData.password !== undefined) updateData.password = userData.password;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const updatedUser = await collection.findOne({ _id: new ObjectId(id) });
    
    console.log(`✅ User updated in MongoDB:`, id);
    return {
      success: true,
      user: {
        _id: updatedUser?._id,
        userId: updatedUser?.userId,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        gender: updatedUser?.gender,
        profilePhoto: updatedUser?.profilePhoto,
        photoType: updatedUser?.photoType,
        role: updatedUser?.role,
        isActive: updatedUser?.isActive,
        createdAt: updatedUser?.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error updating user in MongoDB:', error);
    return { success: false, error: 'Failed to update user' };
  }
};

const deleteUser = async (id: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) }
    );
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'User not found' };
    }
    
    console.log(`✅ User deleted from MongoDB:`, id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting user from MongoDB:', error);
    return { success: false, error: 'Failed to delete user' };
  }
};

// ============================================
// SETTINGS MANAGEMENT FUNCTIONS
// ============================================

const getSettings = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SETTINGS_COLLECTION_NAME);
    const settings = await collection.findOne({ type: 'system' });
    
    if (!settings) {
      return null;
    }

    let decompressedData: any = {};
    if (settings.compressedData) {
      try {
        decompressedData = await decompressData(settings.compressedData);
      } catch (error) {
        console.error('❌ Error decompressing settings data:', error);
      }
    }
    
    return { ...settings, ...decompressedData };
  } catch (error) {
    console.error('❌ Error fetching settings from MongoDB:', error);
    return null;
  }
};

const getSystemSettings = async () => {
  try {
    const settings = await getSettings();
    
    if (!settings) {
      return { 
        success: false, 
        error: 'No system settings found in database',
        settings: null 
      };
    }
    
    return { 
      success: true, 
      settings: settings 
    };
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      settings: null 
    };
  }
};

const saveSettings = async (settingsData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(SETTINGS_COLLECTION_NAME);
    const compressedData = await compressData(settingsData);
    
    const settings = {
      type: 'system',
      compressedData: compressedData,
      ...settingsData,
      updatedAt: new Date()
    };
    
    await collection.updateOne(
      { type: 'system' },
      { $set: settings },
      { upsert: true }
    );
    
    console.log(`✅ Settings saved to MongoDB`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving settings to MongoDB:', error);
    return { success: false, error: 'Failed to save settings' };
  }
};

// Get admin by password from admin collection
const getAdminByPassword = async (password: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(ADMIN_COLLECTION_NAME);
    
    // Find admin by password
    const admin = await collection.findOne({ 
      password: password,
      isActive: true 
    });
    
    if (admin) {
      console.log('✅ Admin found in database');
      return admin;
    } else {
      console.log('❌ No admin found with that password');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting admin by password:', error);
    return null;
  }
};

// Update admin profile in admin collection
const updateAdminProfile = async (adminId: string, updateData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(ADMIN_COLLECTION_NAME);
    
    // Update admin profile
    const result = await collection.updateOne(
      { adminId: adminId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Admin profile updated successfully');
      return { success: true };
    } else {
      console.log('❌ No admin found or no changes made');
      return { success: false, error: 'No changes made' };
    }
    
  } catch (error) {
    console.error('❌ Error updating admin profile:', error);
    return { success: false, error: 'Failed to update admin profile' };
  }
};

// Update admin password in admin collection
const updateAdminPassword = async (adminId: string, currentPassword: string, newPassword: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(ADMIN_COLLECTION_NAME);
    
    // First verify current password
    const admin = await collection.findOne({ 
      adminId: adminId,
      password: currentPassword 
    });
    
    if (!admin) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Update password
    const result = await collection.updateOne(
      { adminId: adminId },
      { 
        $set: {
          password: newPassword,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Admin password updated successfully');
      return { success: true };
    } else {
      return { success: false, error: 'Failed to update password' };
    }
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    return { success: false, error: 'Failed to update password' };
  }
};

// Get admin profile by ID
const getAdminById = async (adminId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(ADMIN_COLLECTION_NAME);
    
    const admin = await collection.findOne({ adminId: adminId });
    
    if (admin) {
      console.log('✅ Admin profile found');
      return admin;
    } else {
      console.log('❌ Admin not found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting admin profile:', error);
    return null;
  }
};

// Get staff by ID (ObjectId or userId)
const getStaffById = async (staffId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    
    // Try to find by userId first (FMT0001, etc.)
    let staff = await collection.findOne({ userId: staffId });
    
    // If not found by userId, try by ObjectId
    if (!staff && ObjectId.isValid(staffId)) {
      staff = await collection.findOne({ _id: new ObjectId(staffId) });
    }
    
    if (!staff) {
      return {
        success: false,
        error: 'Staff member not found'
      };
    }
    
    // Decompress data if needed
    let decompressedData: any = {};
    if (staff.compressedData) {
      try {
        decompressedData = await decompressData(staff.compressedData);
      } catch (error) {
        console.error('❌ Error decompressing staff data:', error);
      }
    }
    
    const staffData = {
      _id: staff._id,
      userId: staff.userId,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender,
      profilePhoto: staff.profilePhoto,
      photoType: staff.photoType,
      password: staff.password,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      ...decompressedData
    };
    
    return {
      success: true,
      staff: staffData
    };
  } catch (error) {
    console.error('❌ Error fetching staff by ID:', error);
    return {
      success: false,
      error: 'Failed to fetch staff'
    };
  }
};

// Save password change request
const savePasswordChangeRequest = async (requestData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(REQUESTS_COLLECTION_NAME);
    const result = await collection.insertOne(requestData);
    
    console.log('✅ Password change request saved:', result.insertedId);
    return result.insertedId;
  } catch (error) {
    console.error('❌ Error saving password change request:', error);
    throw error;
  }
};

// Get all password change requests
const getAllPasswordChangeRequests = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(REQUESTS_COLLECTION_NAME);
    const requests = await collection.find({}).sort({ requestedAt: -1 }).toArray();
    
    console.log(`✅ Fetched ${requests.length} password change requests`);
    return requests;
  } catch (error) {
    console.error('❌ Error fetching password change requests:', error);
    return [];
  }
};

// Get password change requests by staff ID
const getPasswordChangeRequestsByStaffId = async (staffId: string) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(REQUESTS_COLLECTION_NAME);
    const requests = await collection.find({ staffId: staffId }).sort({ requestedAt: -1 }).toArray();
    
    console.log(`✅ Fetched ${requests.length} password change requests for staff ${staffId}`);
    return requests;
  } catch (error) {
    console.error('❌ Error fetching password change requests by staff ID:', error);
    return [];
  }
};

// Update password change request status
const updatePasswordChangeRequest = async (requestId: string, updateData: any) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(REQUESTS_COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      console.error('❌ No password change request found with ID:', requestId);
      return false;
    }
    
    console.log('✅ Password change request updated:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error updating password change request:', error);
    return false;
  }
};

// Update user by userId (FMT0001, etc.)
const updateUserByUserId = async (userId: string, userData: Record<string, unknown>) => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(USER_COLLECTION_NAME);
    
    // Update by userId field
    const result = await collection.updateOne(
      { userId: userId },
      { $set: userData }
    );
    
    if (result.matchedCount === 0) {
      console.error('❌ No user found with userId:', userId);
      return { success: false, error: 'User not found' };
    }
    
    console.log('✅ User updated by userId:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user by userId:', error);
    return { success: false, error: 'Failed to update user' };
  }
};

// Time Slots Management
const saveTimeSlot = async (timeSlotData: any) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(TIME_SLOTS_COLLECTION_NAME);
    
    // Generate unique slot ID
    const slotId = `SLOT-${Date.now()}`;
    
    const timeSlot = {
      slotId,
      ...timeSlotData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(timeSlot);
    
    return {
      success: true,
      timeSlot,
      slotId
    };
  } catch (error) {
    console.error('❌ Error saving time slot:', error);
    return { success: false, error: 'Failed to save time slot' };
  }
};

const getAllTimeSlots = async () => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(TIME_SLOTS_COLLECTION_NAME);
    const timeSlots = await collection.find({}).sort({ startTime: 1 }).toArray();
    
    console.log('🎰 Fetched time slots from database:', timeSlots.length);
    
    return {
      success: true,
      timeSlots,
      total: timeSlots.length
    };
  } catch (error) {
    console.error('❌ Error fetching time slots:', error);
    return { success: false, error: 'Failed to fetch time slots' };
  }
};

const updateTimeSlot = async (slotId: string, updateData: any) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(TIME_SLOTS_COLLECTION_NAME);
    
    const result = await collection.updateOne(
      { slotId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Time slot not found' };
    }
    
    const updatedSlot = await collection.findOne({ slotId });
    
    return {
      success: true,
      timeSlot: updatedSlot
    };
  } catch (error) {
    console.error('❌ Error updating time slot:', error);
    return { success: false, error: 'Failed to update time slot' };
  }
};

const deleteTimeSlot = async (slotId: string) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(TIME_SLOTS_COLLECTION_NAME);
    
    const result = await collection.deleteOne({ slotId });
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Time slot not found' };
    }
    
    return {
      success: true,
      message: 'Time slot deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting time slot:', error);
    return { success: false, error: 'Failed to delete time slot' };
  }
};

// Counter Management Functions
const initializeCounters = async () => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection<any>(COUNTERS_COLLECTION_NAME);
    
    // Check if counters already exist
    const existingCounters = await collection.find({}).toArray();
    
        if (existingCounters.length === 0) {
          // Initialize all booking counters with daily, weekly, monthly, total structure
          const currentDate = new Date();
          const currentDay = currentDate.getDate();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          // Calculate week start for initial counters
          const currentWeekStart = new Date(currentDate);
          currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
          const currentWeekStartDay = currentWeekStart.getDate();
          const currentWeekStartMonth = currentWeekStart.getMonth();
          const currentWeekStartYear = currentWeekStart.getFullYear();
          
          const initialCounters = [
            { 
              _id: 'confirmedCounter' as any, 
              dailyCount: 0,
              weeklyCount: 0,
              monthlyCount: 0,
              yearlyCount: 0,
              totalCount: 0,
              count: 0, // Legacy support
              lastResetDay: currentDay,
              lastResetWeekDay: currentWeekStartDay,
              lastResetWeekMonth: currentWeekStartMonth,
              lastResetWeekYear: currentWeekStartYear,
              lastResetMonth: currentMonth, 
              lastResetYear: currentYear 
            },
            { 
              _id: 'manualCounter' as any, 
              dailyCount: 0,
              weeklyCount: 0,
              monthlyCount: 0,
              yearlyCount: 0,
              totalCount: 0,
              count: 0, // Legacy support
              lastResetDay: currentDay,
              lastResetWeekDay: currentWeekStartDay,
              lastResetWeekMonth: currentWeekStartMonth,
              lastResetWeekYear: currentWeekStartYear,
              lastResetMonth: currentMonth, 
              lastResetYear: currentYear 
            },
            { 
              _id: 'completedCounter' as any, 
              dailyCount: 0,
              weeklyCount: 0,
              monthlyCount: 0,
              yearlyCount: 0,
              totalCount: 0,
              count: 0, // Legacy support
              lastResetDay: currentDay,
              lastResetWeekDay: currentWeekStartDay,
              lastResetWeekMonth: currentWeekStartMonth,
              lastResetWeekYear: currentWeekStartYear,
              lastResetMonth: currentMonth, 
              lastResetYear: currentYear 
            },
            { 
              _id: 'cancelledCounter' as any, 
              dailyCount: 0,
              weeklyCount: 0,
              monthlyCount: 0,
              yearlyCount: 0,
              totalCount: 0,
              count: 0, // Legacy support
              lastResetDay: currentDay,
              lastResetWeekDay: currentWeekStartDay,
              lastResetWeekMonth: currentWeekStartMonth,
              lastResetWeekYear: currentWeekStartYear,
              lastResetMonth: currentMonth, 
              lastResetYear: currentYear 
            },
            { 
              _id: 'incompleteCounter' as any, 
              dailyCount: 0,
              weeklyCount: 0,
              monthlyCount: 0,
              yearlyCount: 0,
              totalCount: 0,
              count: 0, // Legacy support
              lastResetDay: currentDay,
              lastResetWeekDay: currentWeekStartDay,
              lastResetWeekMonth: currentWeekStartMonth,
              lastResetWeekYear: currentWeekStartYear,
              lastResetMonth: currentMonth, 
              lastResetYear: currentYear 
            }
          ];
          
          await collection.insertMany(initialCounters);
          console.log('✅ Initialized booking counters with daily/weekly/monthly/total structure in database');
        }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
    return { success: false, error: 'Failed to initialize counters' };
  }
};

// Check and reset counters based on time
const checkAndResetCounters = async () => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(COUNTERS_COLLECTION_NAME);
    
    // Get current IST time
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    console.log('🔄 [AUTO-RESET] Checking counters for reset...');
    
    const counters = await collection.findOne({ _id: 'confirmedCounter' as any });
    
    if (!counters) {
      console.log('🔄 [AUTO-RESET] No counters found, initializing...');
      await initializeCounters();
      return { success: true, message: 'Counters initialized' };
    }
    
    // Reset logic is handled in incrementCounter function
    return { success: true, message: 'Counters checked' };
    
  } catch (error) {
    console.error('❌ Error checking counters:', error);
    return { success: false, error: 'Failed to check counters' };
  }
};


const incrementCounter = async (counterType: string) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    // First check and reset counters if needed
    await checkAndResetCounters();
    
    const collection = db!.collection(COUNTERS_COLLECTION_NAME);
    const counterId = `${counterType}Counter`;
    
    // Increment all counter types (daily, weekly, monthly, yearly, total)
    const result = await collection.findOneAndUpdate(
      { _id: counterId as any },
      { 
        $inc: { 
          dailyCount: 1,
          weeklyCount: 1,
          monthlyCount: 1,
          yearlyCount: 1,
          totalCount: 1,
          count: 1 // Keep legacy count for backward compatibility
        } 
      },
      { returnDocument: 'after', upsert: true }
    );
    
    if (result) {
      console.log(`📊 Incremented ${counterType} counter - Daily: ${result.value?.dailyCount || 0}, Weekly: ${result.value?.weeklyCount || 0}, Monthly: ${result.value?.monthlyCount || 0}, Yearly: ${result.value?.yearlyCount || 0}, Total: ${result.value?.totalCount || 0}`);
      return { 
        success: true, 
        dailyCount: result.value?.dailyCount || 0,
        weeklyCount: result.value?.weeklyCount || 0,
        monthlyCount: result.value?.monthlyCount || 0,
        yearlyCount: result.value?.yearlyCount || 0,
        totalCount: result.value?.totalCount || 0
      };
    }
    
    return { success: false, error: 'Failed to increment counter' };
  } catch (error) {
    console.error(`❌ Error incrementing ${counterType} counter:`, error);
    return { success: false, error: 'Failed to increment counter' };
  }
};

// Decrement counter function - used to decrease counters when needed
const decrementCounter = async (counterType: string) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    const collection = db!.collection(COUNTERS_COLLECTION_NAME);
    const counterId = `${counterType}Counter`;
    
    // Get current counter values
    const currentCounter = await collection.findOne({ _id: counterId as any });
    
    if (!currentCounter) {
      console.log(`⚠️ No ${counterType} counter found to decrement`);
      return { success: false, error: `${counterType} counter not found` };
    }
    
    // Ensure we don't go below zero for any counter
    const dailyCount = Math.max(0, (currentCounter.dailyCount || 0) - 1);
    const weeklyCount = Math.max(0, (currentCounter.weeklyCount || 0) - 1);
    const monthlyCount = Math.max(0, (currentCounter.monthlyCount || 0) - 1);
    const yearlyCount = Math.max(0, (currentCounter.yearlyCount || 0) - 1);
    const totalCount = Math.max(0, (currentCounter.totalCount || currentCounter.count || 0) - 1);
    
    // Update counter with decremented values
    const result = await collection.findOneAndUpdate(
      { _id: counterId as any },
      { 
        $set: { 
          dailyCount: dailyCount,
          weeklyCount: weeklyCount,
          monthlyCount: monthlyCount,
          yearlyCount: yearlyCount,
          totalCount: totalCount,
          count: totalCount // Keep legacy count for backward compatibility
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (result) {
      console.log(`📊 Decremented ${counterType} counter - Daily: ${result.value?.dailyCount || 0}, Weekly: ${result.value?.weeklyCount || 0}, Monthly: ${result.value?.monthlyCount || 0}, Yearly: ${result.value?.yearlyCount || 0}, Total: ${result.value?.totalCount || 0}`);
      return { 
        success: true, 
        dailyCount: result.value?.dailyCount || 0,
        weeklyCount: result.value?.weeklyCount || 0,
        monthlyCount: result.value?.monthlyCount || 0,
        yearlyCount: result.value?.yearlyCount || 0,
        totalCount: result.value?.totalCount || 0
      };
    }
    
    return { success: false, error: 'Failed to decrement counter' };
  } catch (error) {
    console.error(`❌ Error decrementing ${counterType} counter:`, error);
    return { success: false, error: 'Failed to decrement counter' };
  }
};

const getCounterValue = async (counterType: string) => {
  try {
    if (!isConnected || !db) {
      await connectToDatabase();
    }
    
    // First check and reset if needed
    await checkAndResetCounters();
    
    const collection = db!.collection(COUNTERS_COLLECTION_NAME);
    const counterId = `${counterType}Counter`;
    
    const counter = await collection.findOne({ _id: counterId as any });
    
    if (counter) {
      return { success: true, count: counter.count };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error(`❌ Error getting ${counterType} counter:`, error);
    return { success: false, error: 'Failed to get counter value' };
  }
};

const database = {
  connect: connectToDatabase,
  connectToDatabase: connectToDatabase,
  checkConnection: checkConnection,
  db: () => db,
  // Expose compression helpers for API routes that need them
  decompressData: decompressData,
  compressData: compressData,
  saveBooking: saveBooking,
  saveManualBooking: saveManualBooking,
  getAllManualBookings: getAllManualBookings,
  saveIncompleteBooking: saveIncompleteBooking,
  getAllBookings: getAllBookings,
  getLatestBookings: async (limit: number = 5) => {
    try {
      if (!isConnected || !db) {
        await connectToDatabase();
      }
      
      if (!db) {
        throw new Error('Database not connected');
      }
      
      const collection = db.collection(COLLECTION_NAME);
      const bookings = await collection
        .find({})
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
      
      return bookings;
    } catch (error) {
      console.error('❌ Error getting latest bookings:', error);
      return [];
    }
  },
  getAllIncompleteBookings: getAllIncompleteBookings,
  deleteIncompleteBooking: deleteIncompleteBooking,
  deleteExpiredIncompleteBookings: deleteExpiredIncompleteBookings,
  getBookingById: getBookingById,
  updateBooking: updateBooking,
  updateManualBooking: updateManualBooking,
  updateIncompleteBooking: updateIncompleteBooking,
  updateBookingStatus: updateBookingStatus,
  deleteBooking: deleteBooking,
  deleteManualBooking: deleteManualBooking,
  moveBookingToCancelled: moveBookingToCancelled,
  moveBookingToCompleted: moveBookingToCompleted,
  getAllCompletedBookings: getAllCompletedBookings,
  getAllCancelledBookings: getAllCancelledBookings,
  deleteOldCancelledBookings: deleteOldCancelledBookings,
  deleteExpiredBookings: deleteExpiredBookings,
  getExpiredBookings: getExpiredBookings,
  saveTheater: saveTheater,
  getAllTheaters: getAllTheaters,
  updateTheater: updateTheater,
  reorderTheaters: reorderTheaters,
  deleteTheater: deleteTheater,
  saveGalleryImage: saveGalleryImage,
  getAllGalleryImages: getAllGalleryImages,
  deleteGalleryImage: deleteGalleryImage,
  saveCoupon: saveCoupon,
  getAllCoupons: getAllCoupons,
  updateCoupon: updateCoupon,
  deleteCoupon: deleteCoupon,
  saveOccasion: saveOccasion,
  getAllOccasions: getAllOccasions,
  updateOccasion: updateOccasion,
  deleteOccasion: deleteOccasion,
  saveService: saveService,
  getAllServices: getAllServices,
  updateService: updateService,
  deleteService: deleteService,
  saveStaff: saveStaff,
  getAllStaff: getAllUsers, // getAllUsers returns staff data
  updateStaff: updateUser, // updateUser updates staff data
  deleteStaff: deleteUser, // deleteUser deletes staff data
  getAllUsers: getAllUsers, // Keep for backward compatibility
  updateUser: updateUser, // Keep for backward compatibility
  deleteUser: deleteUser, // Keep for backward compatibility
  getSettings: getSettings,
  getSystemSettings: getSystemSettings,
  saveSettings: saveSettings,
  getAdminByPassword: getAdminByPassword,
  updateAdminProfile: updateAdminProfile,
  updateAdminPassword: updateAdminPassword,
  getAdminById: getAdminById,
  savePasswordChangeRequest: savePasswordChangeRequest,
  getAllPasswordChangeRequests: getAllPasswordChangeRequests,
  getPasswordChangeRequestsByStaffId: getPasswordChangeRequestsByStaffId,
  updatePasswordChangeRequest: updatePasswordChangeRequest,
  updateUserByUserId: updateUserByUserId,
  getStaffById: getStaffById,
  isConnected: () => isConnected,
  saveTimeSlot: saveTimeSlot,
  getAllTimeSlots: getAllTimeSlots,
  updateTimeSlot: updateTimeSlot,
  deleteTimeSlot: deleteTimeSlot,
  initializeCounters: initializeCounters,
  checkAndResetCounters: checkAndResetCounters,
  getAllCounters: async () => {
    try {
      if (!isConnected || !db) {
        await connectToDatabase();
      }
      
      const collection = db!.collection(COUNTERS_COLLECTION_NAME);
      const counters = await collection.find({}).toArray();
      
      const result: any = {};
      counters.forEach(counter => {
        const counterType = counter._id.toString().replace('Counter', '');
        result[counterType] = {
          daily: counter.dailyCount || 0,
          weekly: counter.weeklyCount || 0,
          monthly: counter.monthlyCount || 0,
          yearly: counter.yearlyCount || 0,
          total: counter.totalCount || counter.count || 0
        };
      });
      
      return { success: true, counters: result };
    } catch (error) {
      console.error('❌ Error getting all counters:', error);
      return { success: false, error: 'Failed to get counters' };
    }
  },
  getCounterValue: getCounterValue,
  incrementStaffCounter: incrementStaffCounter,
  incrementCounter: incrementCounter,
  autoResetCounters: async () => {
    try {
      if (!isConnected) {
        await connectToDatabase();
      }
      if (!db) {
        throw new Error('Database not connected');
      }
      
      // Get current IST time (same method used throughout the app)
      const now = new Date();
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      
      const currentDate = istNow.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentDay = istNow.getDay(); // 0 = Sunday
      const currentDayOfMonth = istNow.getDate();
      const currentMonth = istNow.getMonth() + 1; // 1-12
      const currentYear = istNow.getFullYear();
      
      console.log(`🔄 [AUTO-RESET] Checking counters - IST: ${istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      
      const countersCollection = db.collection<any>('counters');
      
      // Get all individual counters
      const confirmedCounter = await countersCollection.findOne({ _id: 'confirmedCounter' as any });
      const manualCounter = await countersCollection.findOne({ _id: 'manualCounter' as any });
      const cancelledCounter = await countersCollection.findOne({ _id: 'cancelledCounter' as any });
      const completedCounter = await countersCollection.findOne({ _id: 'completedCounter' as any });
      
      if (!confirmedCounter || !manualCounter || !cancelledCounter || !completedCounter) {
        console.log('🔄 [AUTO-RESET] Some counters missing, initializing...');
        await initializeCounters();
        return { success: true, message: 'Counters initialized' };
      }
      
      const counters = {
        confirmed: confirmedCounter,
        manual: manualCounter,
        cancelled: cancelledCounter,
        completed: completedCounter
      };
      
const resetActions: string[] = [];
      let needsUpdate = false;
      
      // Check daily reset (every day at midnight IST)
      if (counters.confirmed.lastResetDay !== currentDayOfMonth) {
        console.log(`🔄 [AUTO-RESET] Daily reset needed - Last: ${counters.confirmed.lastResetDay}, Current: ${currentDayOfMonth}`);
        
        // Reset daily counters for all types
        await countersCollection.updateOne(
          { _id: 'confirmedCounter' as any },
          { $set: { dailyCount: 0, lastResetDay: currentDayOfMonth } }
        );
        await countersCollection.updateOne(
          { _id: 'manualCounter' as any },
          { $set: { dailyCount: 0, lastResetDay: currentDayOfMonth } }
        );
        await countersCollection.updateOne(
          { _id: 'cancelledCounter' as any },
          { $set: { dailyCount: 0, lastResetDay: currentDayOfMonth } }
        );
        await countersCollection.updateOne(
          { _id: 'completedCounter' as any },
          { $set: { dailyCount: 0, lastResetDay: currentDayOfMonth } }
        );
        
        resetActions.push('Daily counters reset');
        needsUpdate = true;
      }
      
      // Check weekly reset (every Sunday at midnight IST)
      if (currentDay === 0 && counters.confirmed.lastResetWeekDay !== currentDayOfMonth) {
        console.log(`🔄 [AUTO-RESET] Weekly reset needed - Last: ${counters.confirmed.lastResetWeekDay}, Current: ${currentDayOfMonth}`);
        
        // Reset weekly counters for all types
        await countersCollection.updateOne(
          { _id: 'confirmedCounter' as any },
          { $set: { weeklyCount: 0, lastResetWeekDay: currentDayOfMonth, lastResetWeekMonth: currentMonth, lastResetWeekYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'manualCounter' as any },
          { $set: { weeklyCount: 0, lastResetWeekDay: currentDayOfMonth, lastResetWeekMonth: currentMonth, lastResetWeekYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'cancelledCounter' as any },
          { $set: { weeklyCount: 0, lastResetWeekDay: currentDayOfMonth, lastResetWeekMonth: currentMonth, lastResetWeekYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'completedCounter' as any },
          { $set: { weeklyCount: 0, lastResetWeekDay: currentDayOfMonth, lastResetWeekMonth: currentMonth, lastResetWeekYear: currentYear } }
        );
        
        resetActions.push('Weekly counters reset');
        needsUpdate = true;
      }
      
      // Check monthly reset (1st day of month at midnight IST)
      if (currentDayOfMonth === 1 && counters.confirmed.lastResetMonth !== (currentMonth - 1)) {
        console.log(`🔄 [AUTO-RESET] Monthly reset needed - Last: ${counters.confirmed.lastResetMonth}, Current: ${currentMonth - 1}`);
        
        // Reset monthly counters for all types
        await countersCollection.updateOne(
          { _id: 'confirmedCounter' as any },
          { $set: { monthlyCount: 0, lastResetMonth: currentMonth - 1 } }
        );
        await countersCollection.updateOne(
          { _id: 'manualCounter' as any },
          { $set: { monthlyCount: 0, lastResetMonth: currentMonth - 1 } }
        );
        await countersCollection.updateOne(
          { _id: 'cancelledCounter' as any },
          { $set: { monthlyCount: 0, lastResetMonth: currentMonth - 1 } }
        );
        await countersCollection.updateOne(
          { _id: 'completedCounter' as any },
          { $set: { monthlyCount: 0, lastResetMonth: currentMonth - 1 } }
        );
        
        resetActions.push('Monthly counters reset');
        needsUpdate = true;
      }
      
      // Check yearly reset (January 1st at midnight IST)
      if (currentMonth === 1 && currentDayOfMonth === 1 && counters.confirmed.lastResetYear !== currentYear) {
        console.log(`🔄 [AUTO-RESET] Yearly reset needed - Last: ${counters.confirmed.lastResetYear}, Current: ${currentYear}`);
        
        // Reset yearly counters for all types
        await countersCollection.updateOne(
          { _id: 'confirmedCounter' as any },
          { $set: { yearlyCount: 0, lastResetYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'manualCounter' as any },
          { $set: { yearlyCount: 0, lastResetYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'cancelledCounter' as any },
          { $set: { yearlyCount: 0, lastResetYear: currentYear } }
        );
        await countersCollection.updateOne(
          { _id: 'completedCounter' as any },
          { $set: { yearlyCount: 0, lastResetYear: currentYear } }
        );
        
        resetActions.push('Yearly counters reset');
        needsUpdate = true;
      }
      
      // Update counters if any reset was needed
      if (needsUpdate) {
        console.log(`✅ [AUTO-RESET] Counters updated: ${resetActions.join(', ')}`);
        
        return {
          success: true,
          message: 'Counters automatically reset',
          resetActions: resetActions,
          timestamp: istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
      } else {
        console.log(`✅ [AUTO-RESET] No reset needed - all counters current`);
        
        return {
          success: true,
          message: 'No reset needed',
          resetActions: [],
          timestamp: istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
      }
      
    } catch (error) {
      console.error('❌ [AUTO-RESET] Error in automatic counter reset:', error);
      return {
        success: false,
        error: 'Failed to auto-reset counters',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  saveFeedbackWithLimit: async (feedbackData: any) => {
    return await saveFeedbackWithLimit(feedbackData);
  },
  getFeedbackList: async () => {
    return await getFeedbackList();
  },
  addTestimonial: async (testimonialData: any) => {
    return await addTestimonial(testimonialData);
  },
  addFAQ: async (faqData: any) => {
    return await addFAQ(faqData);
  },
  getAllFAQs: async () => {
    return await getAllFAQs();
  },
  updateFAQ: async (faqId: string, faqData: any) => {
    return await updateFAQ(faqId, faqData);
  },
  deleteFAQ: async (faqId: string) => {
    return await deleteFAQ(faqId);
  }
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



// Save Feedback with Maximum 20 Limit (FIFO - First In, First Out)
const saveFeedbackWithLimit = async (feedbackData: any) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('feedback');
    
    // Check current count
    const currentCount = await collection.countDocuments();
    console.log(`📊 Current feedback count: ${currentCount}`);
    
    // If we have 20 or more, delete the oldest one(s)
    if (currentCount >= 20) {
      const oldestFeedback = await collection.find({}).sort({ submittedAt: 1 }).limit(currentCount - 19).toArray();
      
      if (oldestFeedback.length > 0) {
        const idsToDelete = oldestFeedback.map(f => f._id);
        await collection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`🗑️ Deleted ${oldestFeedback.length} oldest feedback entries`);
      }
    }
    
    // Add new feedback
    const result = await collection.insertOne({
      ...feedbackData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get updated count
    const newCount = await collection.countDocuments();
    console.log(`✅ Feedback saved. New count: ${newCount}`);
    
    return {
      success: true,
      feedbackId: result.insertedId.toString(),
      message: 'Feedback saved successfully',
      totalCount: newCount
    };
  } catch (error) {
    console.error('❌ Error saving feedback to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to save feedback to MongoDB'
    };
  }
};

// Get Feedback List (Latest 20)
const getFeedbackList = async () => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('feedback');
    const feedback = await collection.find({}).sort({ submittedAt: -1 }).limit(20).toArray();
    
    console.log(`📋 Retrieved ${feedback.length} feedback entries`);
    
    return {
      success: true,
      feedback: feedback,
      total: feedback.length
    };
  } catch (error) {
    console.error('❌ Error getting feedback from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get feedback from MongoDB'
    };
  }
};

// Add Testimonial to Database
const addTestimonial = async (testimonialData: any) => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection('testimonials');
    const result = await collection.insertOne({
      ...testimonialData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      success: true,
      testimonialId: result.insertedId.toString(),
      message: 'Testimonial added successfully'
    };
  } catch (error) {
    console.error('❌ Error adding testimonial to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to add testimonial to MongoDB'
    };
  }
};

// FAQ Management Functions
const addFAQ = async (faqData: any) => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(FAQ_COLLECTION_NAME);
    
    // Prepare FAQ data for compression
    const faqToStore = {
      ...faqData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      order: await collection.countDocuments() + 1
    };
    
    // Compress the FAQ data before storing
    const compressedData = await compressData(faqToStore);
    
    const result = await collection.insertOne({
      compressedData: compressedData,
      _compressed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      order: await collection.countDocuments() + 1
    });
    
    return {
      success: true,
      faqId: result.insertedId.toString(),
      message: 'FAQ added successfully'
    };
  } catch (error) {
    console.error('❌ Error adding FAQ to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to add FAQ to MongoDB'
    };
  }
};

const getAllFAQs = async () => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(FAQ_COLLECTION_NAME);
    
    // First, let's check all documents without filtering
    const allRawFaqs = await collection.find({}).sort({ order: 1 }).toArray();
    console.log('📊 getAllFAQs: Found', allRawFaqs.length, 'total documents in FAQ collection');
    console.log('📋 All FAQ documents:', allRawFaqs);
    
    // Now filter for active ones
    const rawFaqs = allRawFaqs.filter(faq => faq.isActive !== false); // Include docs where isActive is true or undefined
    console.log('📊 getAllFAQs: Found', rawFaqs.length, 'active FAQs in database');
    
    // Decompress FAQ data
    const faqs = await Promise.all(rawFaqs.map(async (faq, index) => {
      console.log(`🔍 Processing FAQ ${index + 1}:`, {
        _id: faq._id,
        hasCompressedData: !!faq._compressed,
        hasCompressedField: !!faq.compressedData
      });
      
      if (faq._compressed && faq.compressedData) {
        try {
          // Decompress the data
          console.log(`🔄 Decompressing FAQ ${index + 1}...`);
          const decompressedData = await decompressData(faq.compressedData) as any;
          console.log(`✅ FAQ ${index + 1} decompressed successfully:`, decompressedData);
          
          // Ensure we have the required fields
          const finalFAQ = {
            _id: faq._id,
            ...(typeof decompressedData === 'object' && decompressedData !== null ? decompressedData : {}),
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt,
            isActive: faq.isActive !== false, // Default to true if not set
            order: faq.order || 1 // Default order if not set
          };
          
          console.log(`📋 Final FAQ ${index + 1}:`, finalFAQ);
          return finalFAQ;
        } catch (decompressError) {
          console.error(`❌ FAQ ${index + 1} decompression failed:`, decompressError);
          console.error('Compressed data type:', typeof faq.compressedData);
          console.error('Compressed data:', faq.compressedData);
          
          // Try to return a fallback FAQ with basic info
          return {
            _id: faq._id,
            question: 'FAQ data could not be loaded',
            answer: 'There was an issue loading this FAQ. Please try again later.',
            category: 'General',
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt,
            isActive: faq.isActive !== false,
            order: faq.order || 1
          };
        }
      } else {
        // Legacy FAQ without compression
        console.log(`📄 FAQ ${index + 1} is legacy (no compression):`, faq);
        return {
          ...faq,
          isActive: faq.isActive !== false,
          order: faq.order || 1
        };
      }
    }));
    
    return {
      success: true,
      faqs: faqs,
      total: faqs.length
    };
  } catch (error) {
    console.error('❌ Error getting FAQs from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to get FAQs from MongoDB'
    };
  }
};

const updateFAQ = async (faqId: string, faqData: any) => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(FAQ_COLLECTION_NAME);
    
    // Prepare FAQ data for compression
    const faqToStore = {
      ...faqData,
      updatedAt: new Date()
    };
    
    // Compress the FAQ data before storing
    const compressedData = await compressData(faqToStore);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(faqId) },
      { 
        $set: {
          compressedData: compressedData,
          _compressed: true,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'FAQ not found'
      };
    }
    
    return {
      success: true,
      message: 'FAQ updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating FAQ in MongoDB:', error);
    return {
      success: false,
      error: 'Failed to update FAQ in MongoDB'
    };
  }
};

const deleteFAQ = async (faqId: string) => {
  try {
    // Ensure database connection
    if (!isConnected) {
      const connectionResult = await connectToDatabase();
      if (!connectionResult.success) {
        throw new Error('Failed to connect to database');
      }
    }
    
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const collection = db.collection(FAQ_COLLECTION_NAME);
    const result = await collection.deleteOne({ _id: new ObjectId(faqId) });
    
    if (result.deletedCount === 0) {
      return {
        success: false,
        error: 'FAQ not found'
      };
    }
    
    return {
      success: true,
      message: 'FAQ deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting FAQ from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to delete FAQ from MongoDB'
    };
  }
};

// Excel Records Management Functions
const getAllExcelRecords = async function() {
  try {
    if (!client) {
      await connectToDatabase();
    }
    const db = client?.db(DB_NAME);
    if (!db) {
      return { success: false, error: 'Database connection not established' };
    }

    const excelRecordsCollection = db.collection('excelRecords');
    const records = await excelRecordsCollection.find({}).sort({ updatedAt: -1 }).toArray();

    return {
      success: true,
      records: records || []
    };
  } catch (error) {
    console.error('❌ Error fetching Excel records from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to fetch Excel records from MongoDB'
    };
  }
};

const saveExcelRecord = async function(recordData: any) {
  try {
    if (!client) {
      await connectToDatabase();
    }
    const db = client?.db(DB_NAME);
    if (!db) {
      return { success: false, error: 'Database connection not established' };
    }

    const excelRecordsCollection = db.collection('excelRecords');
    
    // Check if record exists for this type
    const existingRecord = await excelRecordsCollection.findOne({ type: recordData.type });

    if (existingRecord) {
      // Update existing record
      await excelRecordsCollection.updateOne(
        { type: recordData.type },
        { 
          $set: {
            filename: recordData.filename,
            totalRecords: recordData.totalRecords,
            updatedAt: new Date()
          }
        }
      );

      return {
        success: true,
        recordId: existingRecord._id,
        message: 'Excel record updated successfully'
      };
    } else {
      // Create new record
      const result = await excelRecordsCollection.insertOne({
        type: recordData.type,
        filename: recordData.filename,
        totalRecords: recordData.totalRecords,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        recordId: result.insertedId,
        message: 'Excel record created successfully'
      };
    }
  } catch (error) {
    console.error('❌ Error saving Excel record to MongoDB:', error);
    return {
      success: false,
      error: 'Failed to save Excel record to MongoDB'
    };
  }
};

const deleteExcelRecord = async function(recordId: string) {
  try {
    if (!client) {
      await connectToDatabase();
    }
    const db = client?.db(DB_NAME);
    if (!db) {
      return { success: false, error: 'Database connection not established' };
    }

    const excelRecordsCollection = db.collection('excelRecords');
    const result = await excelRecordsCollection.deleteOne({ _id: new ObjectId(recordId) });

    if (result.deletedCount === 0) {
      return {
        success: false,
        error: 'Excel record not found'
      };
    }

    return {
      success: true,
      message: 'Excel record deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting Excel record from MongoDB:', error);
    return {
      success: false,
      error: 'Failed to delete Excel record from MongoDB'
    };
  }
};

// Add Excel Records functions to database object
(database as any).getAllExcelRecords = getAllExcelRecords;
(database as any).saveExcelRecord = saveExcelRecord;
(database as any).deleteExcelRecord = deleteExcelRecord;

// Functions are now part of database object definition above

// Auto-connect when module loads
connectToDatabase();

export { connectToDatabase, getBookingsByOccasion };
export default database;
