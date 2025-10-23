import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// POST /api/admin/auto-complete-bookings
// Marks bookings as completed if their slot ends within next 30 minutes (or already passed)
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const thresholdMs = 30 * 60 * 1000; // 30 minutes

    // Fetch all bookings
    const result = await database.getAllBookings();
    if (!result.success || !result.bookings) {
      return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }

    const bookings = result.bookings as any[];

    let updatedCount = 0;
    const updatedIds: string[] = [];

    // Helper: compute slot end time from booking date/time string
    const getSlotEndDate = (dateStr: string, timeStr: string): Date | null => {
      try {
        // Examples: date "Sunday, October 19, 2025"; time "2:00 PM - 5:00 PM"
        // Fallbacks: join date + end time
        const endPart = timeStr?.includes(' - ') ? timeStr.split(' - ')[1].trim() : timeStr;
        if (!dateStr || !endPart) return null;

        // Build a single string to parse in en-IN locale
        const composed = `${dateStr} ${endPart}`; // "Sunday, October 19, 2025 5:00 PM"
        const d = new Date(composed);
        if (!isNaN(d.getTime())) return d;

        // Fallback: remove weekday
        const parts = dateStr.split(', ');
        const justDate = parts.length >= 2 ? parts.slice(1).join(', ') : dateStr;
        const d2 = new Date(`${justDate} ${endPart}`);
        return isNaN(d2.getTime()) ? null : d2;
      } catch {
        return null;
      }
    };

    // Iterate through bookings with status confirmed, pending, etc. and mark completed when due
    for (const b of bookings) {
      const status = (b.status || '').toLowerCase();
      if (status === 'completed' || status === 'cancelled') continue;

      const endAt = getSlotEndDate(b.date, b.time);
      if (!endAt) continue;

      const msUntilEnd = endAt.getTime() - now.getTime();
      // If slot already ended or will end within next 30 minutes → mark completed
      if (msUntilEnd <= thresholdMs) {
        const updateRes = await database.updateBooking(b.bookingId || b.id, { status: 'completed' });
        if (updateRes.success) {
          updatedCount += 1;
          updatedIds.push(b.bookingId || b.id);
        }
      }
    }

    // Refresh Excel counts for completed after updates
    try {
      await fetch(`${request.nextUrl.origin}/api/admin/refresh-excel-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'completed' })
      });
    } catch {}

    return NextResponse.json({ success: true, updatedCount, updatedIds });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to auto-complete bookings' }, { status: 500 });
  }
}


