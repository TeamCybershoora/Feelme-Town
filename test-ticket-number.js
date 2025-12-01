// Test script to verify ticket number generation
// This script tests the ticket number generation function

import database from './src/lib/db-connect';

async function testTicketNumberGeneration() {
    console.log('🧪 Testing Ticket Number Generation System...\n');

    try {
        // Test 1: Create a test booking to verify ticket number generation
        console.log('Test 1: Creating a test booking with ticket number...');

        const testBooking = {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '1234567890',
            theaterName: 'Premium Theater 1',
            date: '2025-12-01',
            time: '7:00 PM',
            occasion: 'Birthday',
            numberOfPeople: 5,
            totalAmount: 5000,
            status: 'confirmed'
        };

        const result = await database.saveBooking(testBooking);

        if (result.success) {
            console.log('✅ Test booking created successfully!');
            console.log('📋 Booking ID:', result.booking.bookingId);
            console.log('🎟️ Ticket Number:', result.booking.ticketNumber);
            console.log('\nTicket Number Format Check:');
            console.log('- Starts with FMT:', result.booking.ticketNumber?.startsWith('FMT'));
            console.log('- Has minimum 4 digits:', result.booking.ticketNumber?.length >= 7); // FMT + 4 digits
            console.log('- Format example: FMT0001, FMT0002, etc.');
        } else {
            console.log('❌ Failed to create test booking');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testTicketNumberGeneration()
    .then(() => {
        console.log('\n✅ Ticket number generation test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed with error:', error);
        process.exit(1);
    });
