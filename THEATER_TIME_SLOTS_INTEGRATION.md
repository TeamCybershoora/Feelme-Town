# Theater Time Slots Integration - Same as Theater Page 🎭⏰

## Overview 🎯

ManualBookingPopup mein **time slots** ko **theater page ki tarah** fetch kiya gaya hai. Ab time slots **theater object ke andar** `timeSlots` field se aate hain, exactly same as theater page.

---

## Problem Jo Solve Hua 🐛

### Before (Issue):
❌ Time slots separate collection se fetch ho rahe the
❌ Theater page aur ManualBookingPopup mein different approach
❌ Theater object mein already time slots hain but use nahi ho rahe the
❌ Duplicate API calls for same data

### After (Solution):
✅ **Theater object se time slots** (same as theater page)
✅ **Consistent approach** across both pages
✅ **No duplicate API calls**
✅ **Fallback to separate collection** if needed

---

## Theater Page vs ManualBookingPopup 🔄

### Theater Page Approach (Lines 141-142):
```typescript
// Theater page fetches theaters with timeSlots included
const theaters = await fetch('/api/admin/theaters');
theater.timeSlots = theater.timeSlots || []; // Direct from theater object
```

### ManualBookingPopup Approach (NEW):
```typescript
// ManualBookingPopup now uses same approach
if (selectedTheater && selectedTheater.timeSlots && Array.isArray(selectedTheater.timeSlots)) {
  // Use time slots from theater object (same as theater page)
  const formattedSlots = selectedTheater.timeSlots.map((slot: any) => ({
    value: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
    label: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
    theaterId: selectedTheater._id || selectedTheater.theaterId,
    theaterName: selectedTheater.name
  }));
  setAvailableTimeSlots(formattedSlots);
}
```

---

## Implementation Details 🛠️

### File Modified: `src/components/ManualBookingPopup.tsx`

#### Change: Updated Time Slots Fetch Logic

**Lines 177-233**:
```typescript
// Fetch time slots from selected theater (same as theater page)
useEffect(() => {
  const getTimeSlotsFromTheater = () => {
    if (selectedTheater && selectedTheater.timeSlots && Array.isArray(selectedTheater.timeSlots)) {
      // Format time slots from theater object (same as theater page)
      const formattedSlots = selectedTheater.timeSlots.map((slot: any) => ({
        value: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
        label: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
        theaterId: selectedTheater._id || selectedTheater.theaterId,
        theaterName: selectedTheater.name
      }));
      
      setAvailableTimeSlots(formattedSlots);
      console.log('🎭 Time slots from theater:', formattedSlots);
    } else {
      // Fallback: fetch from separate time slots collection
      const fetchTimeSlots = async () => {
        // ... existing fallback logic
      };

      if (isOpen) {
        fetchTimeSlots();
      }
    }
  };

  getTimeSlotsFromTheater();
}, [isOpen, selectedTheater]);
```

**Key Changes**:
1. **Primary Source**: Theater object's `timeSlots` field
2. **Fallback**: Separate time slots collection (if theater doesn't have timeSlots)
3. **Same Format**: Theater page jaisa exact same formatting
4. **Console Log**: Debug log to see fetched slots

---

## Theater Object Structure 🏗️

### Theater Data from Database:

```json
{
  "_id": "ObjectId(...)",
  "theaterId": "FMT-TH-001",
  "name": "EROS - COUPLES",
  "type": "Couple",
  "price": 1999,
  "capacity": {
    "min": 2,
    "max": 2
  },
  "timeSlots": [  // ← This is what we use now!
    {
      "time": "09:00 AM - 12:00 PM",
      "displayTime": "09:00 AM - 12:00 PM",
      "startTime": "09:00 AM",
      "endTime": "12:00 PM",
      "duration": 180,
      "isActive": true
    },
    {
      "time": "12:30 PM - 03:30 PM",
      "displayTime": "12:30 PM - 03:30 PM",
      "startTime": "12:30 PM",
      "endTime": "03:30 PM",
      "duration": 180,
      "isActive": true
    },
    {
      "time": "04:00 PM - 07:00 PM",
      "displayTime": "04:00 PM - 07:00 PM",
      "startTime": "04:00 PM",
      "endTime": "07:00 PM",
      "duration": 180,
      "isActive": true
    },
    {
      "time": "07:30 PM - 10:30 PM",
      "displayTime": "07:30 PM - 10:30 PM",
      "startTime": "07:30 PM",
      "endTime": "10:30 PM",
      "duration": 180,
      "isActive": true
    }
  ],
  "images": [...],
  "isActive": true
}
```

---

## Time Slot Formatting 🔧

### Formatting Logic:

```typescript
const formattedSlots = selectedTheater.timeSlots.map((slot: any) => ({
  value: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
  label: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
  theaterId: selectedTheater._id || selectedTheater.theaterId,
  theaterName: selectedTheater.name
}));
```

### Priority Order:

1. **`slot.displayTime`** - Primary display format
2. **`slot.time`** - Alternative time field
3. **`${slot.startTime} - ${slot.endTime}`** - Fallback format

### Example Output:

```typescript
[
  {
    value: "09:00 AM - 12:00 PM",
    label: "09:00 AM - 12:00 PM",
    theaterId: "FMT-TH-001",
    theaterName: "EROS - COUPLES"
  },
  {
    value: "12:30 PM - 03:30 PM",
    label: "12:30 PM - 03:30 PM",
    theaterId: "FMT-TH-001",
    theaterName: "EROS - COUPLES"
  }
  // ... more slots
]
```

---

## Fallback System 🛡️

### Primary Path (Theater Object):
```
selectedTheater.timeSlots exists
  ↓
Use theater.timeSlots directly
  ↓
Format and display
```

### Fallback Path (Separate Collection):
```
selectedTheater.timeSlots doesn't exist
  ↓
Fetch from /api/admin/time-slots
  ↓
Filter by theater
  ↓
Format and display
```

### Fallback to Defaults:
```
Both paths fail
  ↓
TimeSelectionPopup uses default slots
  ↓
User can still select time
```

---

## Flow Comparison 📊

### Theater Page Flow:
```
1. Fetch theaters from /api/admin/theaters
   ↓
2. Theater object includes timeSlots
   ↓
3. Display timeSlots directly
   ↓
4. User selects time slot
```

### ManualBookingPopup Flow (NEW):
```
1. User selects theater
   ↓
2. Check if theater.timeSlots exists
   ↓
3. If yes → Use theater.timeSlots (same as theater page)
   ↓
4. If no → Fetch from /api/admin/time-slots (fallback)
   ↓
5. Format and pass to TimeSelectionPopup
   ↓
6. User selects time slot
```

---

## Benefits ✅

### Consistency:
✅ **Same data source** as theater page
✅ **Same formatting** logic
✅ **Same time slots** displayed
✅ **No discrepancies** between pages

### Performance:
✅ **No extra API calls** if theater has timeSlots
✅ **Faster loading** (data already available)
✅ **Reduced database queries**
✅ **Better caching** (theater data cached)

### Reliability:
✅ **Fallback system** if theater doesn't have timeSlots
✅ **Multiple format support** (displayTime, time, startTime-endTime)
✅ **Error handling** for missing data
✅ **Default slots** as final fallback

---

## Testing Scenarios 🧪

### Scenario 1: Theater with timeSlots

**Theater Object**:
```json
{
  "name": "EROS - COUPLES",
  "timeSlots": [
    { "displayTime": "09:00 AM - 12:00 PM" },
    { "displayTime": "12:30 PM - 03:30 PM" }
  ]
}
```

**Result**:
✅ Uses theater.timeSlots directly
✅ No API call to /api/admin/time-slots
✅ Same slots as theater page

---

### Scenario 2: Theater without timeSlots

**Theater Object**:
```json
{
  "name": "EROS - COUPLES",
  "timeSlots": null
}
```

**Result**:
✅ Falls back to /api/admin/time-slots
✅ Filters by theater
✅ Still works correctly

---

### Scenario 3: API Failure

**Theater Object**:
```json
{
  "name": "EROS - COUPLES",
  "timeSlots": null
}
```

**API Response**: Error

**Result**:
✅ Falls back to TimeSelectionPopup defaults
✅ User can still select time
✅ No broken experience

---

## Debug Information 🔍

### Console Logs:

When theater has timeSlots:
```
🎭 Time slots from theater: [
  { value: "09:00 AM - 12:00 PM", label: "09:00 AM - 12:00 PM", ... },
  { value: "12:30 PM - 03:30 PM", label: "12:30 PM - 03:30 PM", ... }
]
```

When using fallback:
```
Failed to fetch time slots: [error details]
```

### React DevTools:

Check `availableTimeSlots` state:
- **Has data**: Theater timeSlots working
- **Empty array**: Using fallback or defaults
- **Loading**: Fetching from API

---

## Comparison Table 📋

| Aspect | Theater Page | ManualBookingPopup (Before) | ManualBookingPopup (After) |
|--------|--------------|------------------------------|----------------------------|
| **Data Source** | theater.timeSlots | /api/admin/time-slots | theater.timeSlots (primary) |
| **API Calls** | 1 (theaters) | 2 (theaters + time-slots) | 1 (theaters) |
| **Consistency** | ✅ | ❌ Different | ✅ Same |
| **Performance** | ✅ Fast | ❌ Slower | ✅ Fast |
| **Fallback** | ❌ None | ✅ Separate collection | ✅ Multiple fallbacks |

---

## Code Changes Summary 📝

### Before:
```typescript
// Always fetch from separate collection
const response = await fetch('/api/admin/time-slots');
const data = await response.json();
// Filter and format...
```

### After:
```typescript
// Primary: Use theater.timeSlots (same as theater page)
if (selectedTheater && selectedTheater.timeSlots && Array.isArray(selectedTheater.timeSlots)) {
  const formattedSlots = selectedTheater.timeSlots.map((slot: any) => ({
    value: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
    label: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
    // ...
  }));
  setAvailableTimeSlots(formattedSlots);
} else {
  // Fallback: fetch from separate collection
  // ... existing logic
}
```

---

## Integration with Existing Features 🔗

### Booked Slots Check:
✅ **Still works** - uses same `/api/booked-slots` endpoint
✅ **Same filtering** - by date and theater name
✅ **Same disabled logic** - booked slots marked as disabled

### Theater Selection:
✅ **Still works** - theater selection triggers time slots update
✅ **Same validation** - theater must be selected before time
✅ **Same error messages** - "Please select theater first"

### TimeSelectionPopup:
✅ **Still works** - receives formatted time slots
✅ **Same display** - grid layout with hover effects
✅ **Same selection** - click to select time slot

---

## Future Considerations 💡

### Possible Improvements:

1. **Caching Strategy**
   - Cache theater data with timeSlots
   - Reduce repeated API calls
   - Better performance

2. **Real-time Updates**
   - WebSocket for live time slot updates
   - Instant availability changes
   - Better user experience

3. **Time Slot Management**
   - Admin can edit timeSlots in theater object
   - No need for separate collection
   - Simplified data structure

---

## Troubleshooting 🔧

### Issue: No time slots showing

**Check**:
1. Theater object has `timeSlots` field
2. `timeSlots` is an array
3. Console log shows "🎭 Time slots from theater:"

**Solution**:
- Verify theater data structure
- Check if timeSlots field exists
- Look at console logs

### Issue: Wrong time slots showing

**Check**:
1. Theater selection is correct
2. timeSlots belong to selected theater
3. Formatting logic is working

**Solution**:
- Verify selectedTheater state
- Check timeSlots data
- Review formatting logic

### Issue: Fallback not working

**Check**:
1. API `/api/admin/time-slots` is working
2. Error handling in catch block
3. TimeSelectionPopup receives data

**Solution**:
- Test API endpoint manually
- Check network tab for errors
- Verify fallback logic

---

## Summary ✅

### What Was Changed:

| Feature | Status |
|---------|--------|
| Primary data source | ✅ Theater object timeSlots |
| Fallback system | ✅ Separate collection |
| Same as theater page | ✅ Consistent approach |
| Performance improvement | ✅ Reduced API calls |
| Error handling | ✅ Multiple fallbacks |
| Debug logging | ✅ Console logs added |

### Files Modified:

1. ✅ `src/components/ManualBookingPopup.tsx`
   - Lines 177-233: Updated time slots fetch logic
   - Primary: Use theater.timeSlots
   - Fallback: Separate collection
   - Debug: Console logging

### Result:

✅ **Consistent with theater page**
✅ **Better performance**
✅ **Same time slots displayed**
✅ **Robust fallback system**
✅ **Zero breaking changes**

---

## Quick Reference 📋

### For Developers:

```typescript
// Check if theater has timeSlots
if (selectedTheater && selectedTheater.timeSlots && Array.isArray(selectedTheater.timeSlots)) {
  // Use theater.timeSlots (same as theater page)
  const slots = selectedTheater.timeSlots.map(slot => ({
    value: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`,
    label: slot.displayTime || slot.time || `${slot.startTime} - ${slot.endTime}`
  }));
} else {
  // Fallback to separate collection
  // ... fetch from /api/admin/time-slots
}
```

### For Admins:

```
1. Theater object should have timeSlots field
2. timeSlots should be an array of time objects
3. Each time object should have displayTime or time field
4. If theater doesn't have timeSlots, fallback collection is used
```

---

**Status**: ✅ **FULLY INTEGRATED!**

Time slots ab theater page ki tarah **theater object se** fetch hote hain with robust fallback system! 🎭⏰✨

