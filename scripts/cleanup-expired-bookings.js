#!/usr/bin/env node

/**
 * Cleanup Expired Bookings Script
 * This script automatically deletes bookings where the date and time have already passed
 * 
 * Usage:
 * node scripts/cleanup-expired-bookings.js
 * 
 * Or add to cron job:
 * 0 */6 * * * node /path/to/scripts/cleanup-expired-bookings.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function cleanupExpiredBookings() {
  try {
    console.log('🧹 Starting automatic cleanup of expired bookings...');
    console.log(`📅 Current time: ${new Date().toISOString()}`);
    
    // Call the cleanup API
    const response = await fetch(`${BASE_URL}/api/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cleanup completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   - Total bookings checked: ${result.totalBookings}`);
      console.log(`   - Expired bookings deleted: ${result.deletedCount}`);
      console.log(`   - Remaining valid bookings: ${result.remainingBookings}`);
      
      if (result.expiredBookings && result.expiredBookings.length > 0) {
        console.log(`🗑️ Deleted expired bookings:`);
        result.expiredBookings.forEach(booking => {
          console.log(`   - ${booking.name} (${booking.theaterName}) - ${booking.date} ${booking.time}`);
        });
      }
    } else {
      console.error('❌ Cleanup failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupExpiredBookings();
