import { ExportsStorage } from './exports-storage';
import database from './db-connect';

// Counter types
export interface TimeBasedCounters {
  today: number;
  week: number;
  month: number;
  year: number;
  lastResetDate: string;
  lastResetWeek: string;
  lastResetMonth: string;
  lastResetYear: string;
}

export interface TotalCounters {
  confirmed: number;
  manual: number;
  completed: number;
  cancelled: number;
  incomplete: number;
}

export interface CounterData {
  confirmed: TimeBasedCounters;
  manual: TimeBasedCounters;
  completed: TimeBasedCounters;
  cancelled: TimeBasedCounters;
  incomplete: TimeBasedCounters;
}

// Get current IST date info
const getISTDateInfo = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);
  
  const today = istDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const year = istDate.getFullYear();
  const month = istDate.getMonth() + 1; // 1-12
  
  // Get week start (Sunday)
  const dayOfWeek = istDate.getDay(); // 0 = Sunday
  const weekStart = new Date(istDate);
  weekStart.setDate(istDate.getDate() - dayOfWeek);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  // Get month start
  const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  // Get year start
  const yearStart = `${year}-01-01`;
  
  return {
    today,
    weekStart: weekStartStr,
    monthStart,
    yearStart,
    year,
    month
  };
};

// Initialize default time-based counters
const getDefaultTimeBasedCounter = (): TimeBasedCounters => {
  const dateInfo = getISTDateInfo();
  
  return {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    lastResetDate: dateInfo.today,
    lastResetWeek: dateInfo.weekStart,
    lastResetMonth: dateInfo.monthStart,
    lastResetYear: dateInfo.yearStart
  };
};

// Get time-based counters from JSON (blob storage)
export const getTimeBasedCounters = async (): Promise<CounterData> => {
  try {
    const counters = await ExportsStorage.readRaw('counters.json');
    
    if (!counters) {
      console.log('🔄 No time-based counters found, initializing...');
      const defaultCounters: CounterData = {
        confirmed: getDefaultTimeBasedCounter(),
        manual: getDefaultTimeBasedCounter(),
        completed: getDefaultTimeBasedCounter(),
        cancelled: getDefaultTimeBasedCounter(),
        incomplete: getDefaultTimeBasedCounter()
      };
      
      await ExportsStorage.writeRaw('counters.json', defaultCounters);
      return defaultCounters;
    }
    
    return counters as CounterData;
  } catch (error) {
    console.error('❌ Error getting time-based counters:', error);
    return {
      confirmed: getDefaultTimeBasedCounter(),
      manual: getDefaultTimeBasedCounter(),
      completed: getDefaultTimeBasedCounter(),
      cancelled: getDefaultTimeBasedCounter(),
      incomplete: getDefaultTimeBasedCounter()
    };
  }
};

// Get total counters from database
export const getTotalCounters = async (): Promise<TotalCounters> => {
  try {
    const settings = await database.getSystemSettings();
    
    if (settings.success && settings.settings) {
      const s = settings.settings;
      return {
        confirmed: s.totalConfirmedBookings || 0,
        manual: s.totalManualBookings || 0,
        completed: s.totalCompletedBookings || 0,
        cancelled: s.totalCancelledBookings || 0,
        incomplete: s.totalIncompleteBookings || 0
      };
    }
    
    // Initialize if not found
    const defaultTotals: TotalCounters = {
      confirmed: 0,
      manual: 0,
      completed: 0,
      cancelled: 0,
      incomplete: 0
    };
    
    await saveTotalCounters(defaultTotals);
    return defaultTotals;
  } catch (error) {
    console.error('❌ Error getting total counters:', error);
    return {
      confirmed: 0,
      manual: 0,
      completed: 0,
      cancelled: 0,
      incomplete: 0
    };
  }
};

// Save total counters to database
export const saveTotalCounters = async (totals: TotalCounters): Promise<void> => {
  try {
    await database.saveSettings({
      totalConfirmedBookings: totals.confirmed,
      totalManualBookings: totals.manual,
      totalCompletedBookings: totals.completed,
      totalCancelledBookings: totals.cancelled,
      totalIncompleteBookings: totals.incomplete
    });
    
    console.log('✅ Total counters saved to database');
  } catch (error) {
    console.error('❌ Error saving total counters:', error);
  }
};

// Check and reset time-based counters
export const checkAndResetTimeBasedCounters = async (): Promise<CounterData> => {
  try {
    const counters = await getTimeBasedCounters();
    const dateInfo = getISTDateInfo();
    let hasChanges = false;
    
    // Check and reset each counter type
    const counterTypes: (keyof CounterData)[] = ['confirmed', 'manual', 'completed', 'cancelled', 'incomplete'];
    
    for (const type of counterTypes) {
      const counter = counters[type];
      
      // Reset daily counter
      if (counter.lastResetDate !== dateInfo.today) {
        console.log(`🔄 Resetting daily ${type} counter (${counter.lastResetDate} → ${dateInfo.today})`);
        counter.today = 0;
        counter.lastResetDate = dateInfo.today;
        hasChanges = true;
      }
      
      // Reset weekly counter (Sunday reset)
      if (counter.lastResetWeek !== dateInfo.weekStart) {
        console.log(`🔄 Resetting weekly ${type} counter (${counter.lastResetWeek} → ${dateInfo.weekStart})`);
        counter.week = 0;
        counter.lastResetWeek = dateInfo.weekStart;
        hasChanges = true;
      }
      
      // Reset monthly counter
      if (counter.lastResetMonth !== dateInfo.monthStart) {
        console.log(`🔄 Resetting monthly ${type} counter (${counter.lastResetMonth} → ${dateInfo.monthStart})`);
        counter.month = 0;
        counter.lastResetMonth = dateInfo.monthStart;
        hasChanges = true;
      }
      
      // Reset yearly counter
      if (counter.lastResetYear !== dateInfo.yearStart) {
        console.log(`🔄 Resetting yearly ${type} counter (${counter.lastResetYear} → ${dateInfo.yearStart})`);
        counter.year = 0;
        counter.lastResetYear = dateInfo.yearStart;
        hasChanges = true;
      }
    }
    
    // Save changes if any
    if (hasChanges) {
      await ExportsStorage.writeRaw('counters.json', counters);
      console.log('✅ Time-based counters reset and saved');
    }
    
    return counters;
  } catch (error) {
    console.error('❌ Error checking/resetting time-based counters:', error);
    return await getTimeBasedCounters();
  }
};

// Increment counter
export const incrementCounter = async (
  type: keyof CounterData,
  incrementTotal: boolean = true
): Promise<void> => {
  try {
    // First check and reset if needed
    const counters = await checkAndResetTimeBasedCounters();
    
    // Increment time-based counters
    counters[type].today += 1;
    counters[type].week += 1;
    counters[type].month += 1;
    counters[type].year += 1;
    
    // Save time-based counters
    await ExportsStorage.writeRaw('counters.json', counters);
    
    // Increment total counter in database if requested
    if (incrementTotal) {
      const totals = await getTotalCounters();
      totals[type] += 1;
      await saveTotalCounters(totals);
    }
    
    console.log(`✅ ${type} counter incremented (total: ${incrementTotal})`);
  } catch (error) {
    console.error(`❌ Error incrementing ${type} counter:`, error);
  }
};

// Get all counters (combined)
export const getAllCounters = async () => {
  try {
    const timeBasedCounters = await checkAndResetTimeBasedCounters();
    const totalCounters = await getTotalCounters();
    
    return {
      success: true,
      counters: {
        confirmed: {
          today: timeBasedCounters.confirmed.today,
          week: timeBasedCounters.confirmed.week,
          month: timeBasedCounters.confirmed.month,
          year: timeBasedCounters.confirmed.year,
          total: totalCounters.confirmed
        },
        manual: {
          today: timeBasedCounters.manual.today,
          week: timeBasedCounters.manual.week,
          month: timeBasedCounters.manual.month,
          year: timeBasedCounters.manual.year,
          total: totalCounters.manual
        },
        completed: {
          today: timeBasedCounters.completed.today,
          week: timeBasedCounters.completed.week,
          month: timeBasedCounters.completed.month,
          year: timeBasedCounters.completed.year,
          total: totalCounters.completed
        },
        cancelled: {
          today: timeBasedCounters.cancelled.today,
          week: timeBasedCounters.cancelled.week,
          month: timeBasedCounters.cancelled.month,
          year: timeBasedCounters.cancelled.year,
          total: totalCounters.cancelled
        },
        incomplete: {
          today: timeBasedCounters.incomplete.today,
          week: timeBasedCounters.incomplete.week,
          month: timeBasedCounters.incomplete.month,
          year: timeBasedCounters.incomplete.year,
          total: totalCounters.incomplete
        }
      }
    };
  } catch (error) {
    console.error('❌ Error getting all counters:', error);
    return {
      success: false,
      error: 'Failed to get counters'
    };
  }
};

// Reset time-based counters manually (admin function)
export const resetTimeBasedCounters = async (): Promise<void> => {
  try {
    const defaultCounters: CounterData = {
      confirmed: getDefaultTimeBasedCounter(),
      manual: getDefaultTimeBasedCounter(),
      completed: getDefaultTimeBasedCounter(),
      cancelled: getDefaultTimeBasedCounter(),
      incomplete: getDefaultTimeBasedCounter()
    };
    
    await ExportsStorage.writeRaw('counters.json', defaultCounters);
    console.log('✅ Time-based counters manually reset');
  } catch (error) {
    console.error('❌ Error manually resetting time-based counters:', error);
  }
};

// Reset ALL counters (both time-based and database totals)
export const resetAllCounters = async (): Promise<void> => {
  try {
    // Reset time-based counters
    await resetTimeBasedCounters();
    
    // Reset database totals
    const defaultTotals: TotalCounters = {
      confirmed: 0,
      manual: 0,
      completed: 0,
      cancelled: 0,
      incomplete: 0
    };
    
    await saveTotalCounters(defaultTotals);
    console.log('✅ ALL counters reset (time-based + database totals)');
  } catch (error) {
    console.error('❌ Error resetting all counters:', error);
  }
};
