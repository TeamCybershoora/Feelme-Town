import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/cleanup-old-json-data
// Cleans up JSON data older than 1 month from cancelled and completed bookings
export async function POST(request: NextRequest) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    
    let totalDeleted = 0;
    let warnings: any[] = [];
    
    // Process cancelled bookings
    const cancelledPath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
    try {
      const cancelledData = await fs.readFile(cancelledPath, 'utf8');
      let cancelledBookings = JSON.parse(cancelledData);
      
      // Find bookings that will be deleted in 5 days
      cancelledBookings.forEach((booking: any) => {
        const cancelledDate = new Date(booking.cancelledAt);
        const deleteDate = new Date(cancelledDate);
        deleteDate.setMonth(deleteDate.getMonth() + 1);
        
        if (deleteDate <= fiveDaysFromNow && deleteDate > new Date()) {
          const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          warnings.push({
            type: 'cancelled',
            bookingId: booking.bookingId,
            name: booking.name,
            date: booking.date,
            deleteDate: deleteDate.toISOString(),
            daysLeft: daysLeft
          });
        }
      });
      
      // Filter out bookings older than 1 month
      const beforeCount = cancelledBookings.length;
      cancelledBookings = cancelledBookings.filter((booking: any) => {
        const cancelledDate = new Date(booking.cancelledAt);
        return cancelledDate > oneMonthAgo;
      });
      
      const deletedCount = beforeCount - cancelledBookings.length;
      totalDeleted += deletedCount;
      
      // Write back filtered data
      await fs.writeFile(cancelledPath, JSON.stringify(cancelledBookings, null, 2), 'utf8');
      console.log(`✅ Deleted ${deletedCount} cancelled bookings older than 1 month`);
    } catch (err) {
      console.error('❌ Failed to cleanup cancelled bookings:', err);
    }
    
    // Process completed bookings
    const completedPath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');
    try {
      const completedData = await fs.readFile(completedPath, 'utf8');
      let completedBookings = JSON.parse(completedData);
      
      // Find bookings that will be deleted in 5 days
      completedBookings.forEach((booking: any) => {
        const completedDate = new Date(booking.completedAt);
        const deleteDate = new Date(completedDate);
        deleteDate.setMonth(deleteDate.getMonth() + 1);
        
        if (deleteDate <= fiveDaysFromNow && deleteDate > new Date()) {
          const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          warnings.push({
            type: 'completed',
            bookingId: booking.bookingId,
            name: booking.name,
            date: booking.date,
            deleteDate: deleteDate.toISOString(),
            daysLeft: daysLeft
          });
        }
      });
      
      // Filter out bookings older than 1 month
      const beforeCount = completedBookings.length;
      completedBookings = completedBookings.filter((booking: any) => {
        const completedDate = new Date(booking.completedAt);
        return completedDate > oneMonthAgo;
      });
      
      const deletedCount = beforeCount - completedBookings.length;
      totalDeleted += deletedCount;
      
      // Write back filtered data
      await fs.writeFile(completedPath, JSON.stringify(completedBookings, null, 2), 'utf8');
      console.log(`✅ Deleted ${deletedCount} completed bookings older than 1 month`);
    } catch (err) {
      console.error('❌ Failed to cleanup completed bookings:', err);
    }
    
    return NextResponse.json({
      success: true,
      totalDeleted,
      warnings,
      message: `Cleaned up ${totalDeleted} old records. ${warnings.length} bookings will be deleted in next 5 days.`
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up old JSON data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup old JSON data'
    }, { status: 500 });
  }
}

// GET /api/admin/cleanup-old-json-data - Get warnings only (no cleanup)
export async function GET(request: NextRequest) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    
    let warnings: any[] = [];
    
    // Check cancelled bookings for upcoming deletions
    const cancelledPath = path.join(process.cwd(), 'data', 'exports', 'cancelled-bookings.json');
    try {
      const cancelledData = await fs.readFile(cancelledPath, 'utf8');
      const cancelledBookings = JSON.parse(cancelledData);
      
      cancelledBookings.forEach((booking: any) => {
        const cancelledDate = new Date(booking.cancelledAt);
        const deleteDate = new Date(cancelledDate);
        deleteDate.setMonth(deleteDate.getMonth() + 1);
        
        if (deleteDate <= fiveDaysFromNow && deleteDate > new Date()) {
          const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          warnings.push({
            type: 'cancelled',
            bookingId: booking.bookingId,
            name: booking.name,
            date: booking.date,
            deleteDate: deleteDate.toISOString(),
            daysLeft: daysLeft
          });
        }
      });
    } catch (err) {
      // Ignore
    }
    
    // Check completed bookings for upcoming deletions
    const completedPath = path.join(process.cwd(), 'data', 'exports', 'completed-bookings.json');
    try {
      const completedData = await fs.readFile(completedPath, 'utf8');
      const completedBookings = JSON.parse(completedData);
      
      completedBookings.forEach((booking: any) => {
        const completedDate = new Date(booking.completedAt);
        const deleteDate = new Date(completedDate);
        deleteDate.setMonth(deleteDate.getMonth() + 1);
        
        if (deleteDate <= fiveDaysFromNow && deleteDate > new Date()) {
          const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          warnings.push({
            type: 'completed',
            bookingId: booking.bookingId,
            name: booking.name,
            date: booking.date,
            deleteDate: deleteDate.toISOString(),
            daysLeft: daysLeft
          });
        }
      });
    } catch (err) {
      // Ignore
    }
    
    return NextResponse.json({
      success: true,
      warnings,
      hasWarnings: warnings.length > 0
    });
    
  } catch (error) {
    console.error('❌ Error checking warnings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check warnings'
    }, { status: 500 });
  }
}

