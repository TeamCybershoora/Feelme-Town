// FeelME Town Database Collections
export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  theaterName: string;
  date: string;
  time: string;
  occasion: string;
  selectedCakes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  selectedDecorItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  selectedGifts: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// FeelME Town Database Collections
const feelmeTownDatabase = {
  // Collection: booking
  booking: [] as Booking[],
  
  // Collection: theaters (for future use)
  theaters: [] as object[],
  
  // Collection: items (for future use)
  items: [] as object[]
};

let nextBookingId = 1;

// Database functions
export const db = {
  // Create new booking in 'booking' collection
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking => {
    const booking: Booking = {
      ...bookingData,
      id: `booking_${nextBookingId++}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save to 'booking' collection in FeelME Town database
    feelmeTownDatabase.booking.push(booking);
    
    console.log('📝 New booking saved to FeelME Town database - booking collection:', {
      database: 'FeelME Town',
      collection: 'booking',
      bookingId: booking.id,
      customerName: booking.name,
      theater: booking.theaterName,
      date: booking.date,
      time: booking.time,
      totalAmount: booking.totalAmount
    });
    
    return booking;
  },

  // Get all bookings from 'booking' collection
  getBookings: (): Booking[] => {
    return [...feelmeTownDatabase.booking];
  },

  // Get theaters
  getTheaters: () => {
    return [
      { id: 'theater1', name: 'EROS (Couples) (FMT-Hall-1)', price: '₹1399', capacity: 2, type: 'Couples' },
      { id: 'theater2', name: 'FAMILY (FMT-Hall-2)', price: '₹1999', capacity: 4, type: 'Family' },
      { id: 'theater3', name: 'PREMIUM (FMT-Hall-3)', price: '₹2999', capacity: 6, type: 'Premium' }
    ];
  },

  // Get items (cakes, decor, gifts)
  getItems: (category?: string) => {
    // Mock items data
    const allItems = [
      // Cakes
      { id: 'cake1', name: 'Chocolate Cake', price: 1500, category: 'cakes', image: '🎂' },
      { id: 'cake2', name: 'Vanilla Cake', price: 1200, category: 'cakes', image: '🧁' },
      { id: 'cake3', name: 'Strawberry Cake', price: 1800, category: 'cakes', image: '🍰' },
      
      // Decor Items
      { id: 'decor1', name: 'Balloons', price: 500, category: 'decor', image: '🎈' },
      { id: 'decor2', name: 'Flowers', price: 800, category: 'decor', image: '🌸' },
      { id: 'decor3', name: 'Banner', price: 300, category: 'decor', image: '🎊' },
      
      // Gifts
      { id: 'gift1', name: 'Photo Frame', price: 99, category: 'gifts', image: '🖼️' },
      { id: 'gift2', name: 'Perfume', price: 599, category: 'gifts', image: '🌸' },
      { id: 'gift3', name: 'Jewelry', price: 899, category: 'gifts', image: '💎' }
    ];
    
    if (category) {
      return allItems.filter(item => item.category === category);
    }
    
    return allItems;
  },

  // Get database info
  getDatabaseInfo: () => {
    return {
      databaseName: 'FeelME Town',
      collections: {
        booking: feelmeTownDatabase.booking.length,
        theaters: feelmeTownDatabase.theaters.length,
        items: feelmeTownDatabase.items.length
      },
      totalBookings: feelmeTownDatabase.booking.length
    };
  }
};

export default db;