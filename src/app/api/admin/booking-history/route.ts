import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

// GET /api/admin/booking-history
// Returns bookings for last 3 months by status with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status'); // 'completed,cancelled,manual'
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Default range: last 3 months
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMonth(defaultStart.getMonth() - 3);

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : now;

    // Normalize to range bounds
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch data from collections
    const [bookingsRes, manualRes, cancelledRes] = await Promise.all([
      database.getAllBookings(),
      database.getAllManualBookings(),
      database.getAllCancelledBookings()
    ]);

    if (!bookingsRes.success || !manualRes.success || !cancelledRes.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    const toDate = (val: any) => {
      try { return new Date(val); } catch { return new Date(); }
    };

    const inRange = (dt: any) => {
      const d = toDate(dt);
      return d >= startDate && d <= endDate;
    };

    // Completed bookings come from main bookings collection filtered by status
    const completed = (bookingsRes.bookings || []).filter((b: any) => {
      const st = (b.status || '').toLowerCase();
      return st === 'completed' && inRange(b.createdAt);
    });

    // Cancelled bookings are stored in cancelled collection
    const cancelled = (cancelledRes.cancelledBookings || []).filter((b: any) => inRange(b.createdAt));

    // Manual bookings: from manual collection
    const manual = (manualRes.manualBookings || []).filter((b: any) => inRange(b.createdAt));

    // Optional status filter
    const requestedStatuses = (statusParam || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const payload: Record<string, any[]> = {
      completed,
      cancelled,
      manual
    };

    let filteredPayload = payload;
    if (requestedStatuses.length > 0) {
      filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => requestedStatuses.includes(key))
      );
    }

    // Flatten combined list if requested
    const combine = searchParams.get('combine') === 'true';
    const combined = combine
      ? [
          ...((filteredPayload.completed || []).map((b: any) => ({ ...b, __type: 'completed' }))),
          ...((filteredPayload.cancelled || []).map((b: any) => ({ ...b, __type: 'cancelled' }))),
          ...((filteredPayload.manual || []).map((b: any) => ({ ...b, __type: 'manual' })))
        ]
      : [];

    return NextResponse.json({
      success: true,
      range: { start: startDate.toISOString(), end: endDate.toISOString() },
      counts: {
        completed: completed.length,
        cancelled: cancelled.length,
        manual: manual.length
      },
      data: combine ? combined : filteredPayload
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Failed to get booking history' },
      { status: 500 }
    );
  }
}
