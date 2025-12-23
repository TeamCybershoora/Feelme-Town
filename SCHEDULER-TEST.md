# SCHEDULER TEST - MANUAL STEPS

## Step 1: Test API Manually

Open browser and go to:
```
http://localhost:3000/api/test-auto-complete
```

This will:
1. Check all confirmed bookings
2. Find expired ones (End time + 5 min)
3. Sync to SQL
4. Delete from MongoDB
5. Show results

## Step 2: Check Console Logs

Look for these logs in terminal:
```
🔄 Auto-cleanup: Checking for expired bookings...
✅ Auto-cleanup: Completed X expired bookings
```

## Step 3: Verify Results

### Check MongoDB:
```javascript
// Booking should be deleted
db.bookings.find({ bookingId: "FMT-2025-1030-003-516605-95" })
// Should return: []
```

### Check SQL:
```sql
-- Booking should be in completed_bookings
SELECT * FROM completed_bookings 
WHERE booking_id = 'FMT-2025-1030-003-516605-95';
```

## Your Current Booking:

```
bookingId: "FMT-2025-1030-003-516605-95"
date: "Thursday, October 30, 2025"
time: "9:50 PM - 12:50 AM"
status: "confirmed"

End Time: Tomorrow 12:50 AM
Expiry Time: Tomorrow 12:55 AM (End + 5 min)

Current Time: 1:25 AM (today)
Status: NOT EXPIRED YET (booking is for tomorrow night)
```

## To Test Now:

Create a booking with PAST time:
```
Date: Today (October 30, 2025)
Time: 12:50 AM - 12:55 AM (already passed)

Then call:
http://localhost:3000/api/test-auto-complete
```

This will immediately mark it as expired and move to SQL!
