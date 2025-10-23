import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import { ObjectId } from 'mongodb';

// POST /api/admin/reset-counters - Reset counters (daily/weekly/monthly or ALL)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetAll = false } = body;
    
    // Connect to database
    await database.connect();
    
    // Get all counters
    const countersResult = await database.getAllCounters();
    const counters = countersResult.counters || {};
    
    // Reset each counter type
    const resetPromises = Object.keys(counters).map(async (counterType) => {
      const db = database.db();
      if (db) {
        const collection = db.collection('counters');
        
        // Get current counter values to preserve what shouldn't be reset
        const currentCounter = await collection.findOne({ _id: `${counterType}Counter` as any });
        const currentTotal = currentCounter?.totalCount || 0;
        const currentWeekly = currentCounter?.weeklyCount || 0;
        const currentMonthly = currentCounter?.monthlyCount || 0;
        const currentYearly = currentCounter?.yearlyCount || 0;
        
        if (resetAll) {
          // Manual reset: Reset Today/Week/Month/Year but PRESERVE Total
          await collection.updateOne(
            { _id: `${counterType}Counter` as any },
            {
              $set: {
                dailyCount: 0,        // Reset daily (Today)
                weeklyCount: 0,       // Reset weekly (This Week)  
                monthlyCount: 0,      // Reset monthly (This Month)
                yearlyCount: 0,       // Reset yearly (This Year)
                totalCount: currentTotal, // PRESERVE total count (never reset)
                count: currentTotal,      // Keep legacy count same as total
                // Update reset dates to current date
                lastResetDay: new Date().getDate(),
                lastResetMonth: new Date().getMonth(),
                lastResetYear: new Date().getFullYear(),
                lastResetWeekDay: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).getDate(),
                lastResetWeekMonth: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).getMonth(),
                lastResetWeekYear: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).getFullYear()
              }
            }
          );
          
        } else {
          // Auto reset: Only reset what should naturally reset based on time
          const updateData: any = {};
          let resetMessage = '';
          
          // Check what needs to be reset based on time
          const now = new Date();
          const currentDay = now.getDate();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          // Daily reset check
          if (currentCounter?.lastResetDay !== currentDay || 
              currentCounter?.lastResetMonth !== currentMonth || 
              currentCounter?.lastResetYear !== currentYear) {
            updateData.dailyCount = 0;
            updateData.lastResetDay = currentDay;
            updateData.lastResetMonth = currentMonth;
            updateData.lastResetYear = currentYear;
            resetMessage += 'Daily ';
          }
          
          // Weekly reset check (Sunday)
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekStartDay = weekStart.getDate();
          const weekStartMonth = weekStart.getMonth();
          const weekStartYear = weekStart.getFullYear();
          
          if (currentCounter?.lastResetWeekDay !== weekStartDay || 
              currentCounter?.lastResetWeekMonth !== weekStartMonth || 
              currentCounter?.lastResetWeekYear !== weekStartYear) {
            updateData.weeklyCount = 0;
            updateData.lastResetWeekDay = weekStartDay;
            updateData.lastResetWeekMonth = weekStartMonth;
            updateData.lastResetWeekYear = weekStartYear;
            resetMessage += 'Weekly ';
          }
          
          // Monthly reset check
          if (currentCounter?.lastResetMonth !== currentMonth || 
              currentCounter?.lastResetYear !== currentYear) {
            updateData.monthlyCount = 0;
            resetMessage += 'Monthly ';
          }
          
          // Yearly reset check
          if (currentCounter?.lastResetYear !== currentYear) {
            updateData.yearlyCount = 0;
            resetMessage += 'Yearly ';
          }
          
          // Always preserve total
          updateData.totalCount = currentTotal;
          updateData.count = currentTotal;
          
          if (Object.keys(updateData).length > 2) { // More than just total preservation
            await collection.updateOne(
              { _id: `${counterType}Counter` as any },
              { $set: updateData }
            );
            
          }
        }
      }
    });
    
    await Promise.all(resetPromises);
    
    // Get updated counters
    const updatedCountersResult = await database.getAllCounters();
    
    return NextResponse.json({
      success: true,
      message: resetAll 
        ? 'Daily, Weekly, Monthly, Yearly counters reset to 0. Total counters preserved!' 
        : 'Daily, Weekly, Monthly, Yearly counters reset successfully. Total counters preserved.',
      counters: updatedCountersResult.counters
    });
    
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset counters' 
      },
      { status: 500 }
    );
  }
}

