import { NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';

// GET /api/cancel-reasons - Get cancel reasons (Blob-backed)
export async function GET() {
  try {
    // First try to read from blob storage
    let cancelReasons = await ExportsStorage.readArray('cancel-reasons.json');
    
    if (!cancelReasons || cancelReasons.length === 0) {
      // If not found in blob, use default reasons and save to blob
      console.log('🔄 Cancel reasons not found in blob, using defaults...');
      
      cancelReasons = [
        "Change of plans",
        "Booked wrong date/time", 
        "Found a better price",
        "Personal emergency",
        "Weather concerns",
        "Transportation issues",
        "Other"
      ];
      
      // Save default to blob storage for future use
      await ExportsStorage.writeArray('cancel-reasons.json', cancelReasons);
      console.log('✅ Default cancel reasons saved to blob');
    } else {
      console.log('✅ Cancel reasons loaded from blob storage');
    }

    return NextResponse.json({ 
      success: true, 
      reasons: cancelReasons,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ GET Cancel Reasons API Error:', error);
    
    // Emergency fallback
    const fallbackReasons = [
      "Change of plans",
      "Booked wrong date/time",
      "Found a better price", 
      "Personal emergency",
      "Weather concerns",
      "Transportation issues",
      "Other"
    ];
    
    return NextResponse.json({ 
      success: true, 
      reasons: fallbackReasons,
      source: 'fallback'
    });
  }
}

// POST /api/cancel-reasons - Add new cancel reason (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reason is required and must be a non-empty string' 
      }, { status: 400 });
    }

    const trimmedReason = reason.trim();

    // Get current reasons from blob storage
    let currentReasons = await ExportsStorage.readArray('cancel-reasons.json');
    
    if (!currentReasons || currentReasons.length === 0) {
      // Initialize with defaults if empty
      currentReasons = [
        "Change of plans",
        "Booked wrong date/time",
        "Found a better price",
        "Personal emergency", 
        "Weather concerns",
        "Transportation issues",
        "Other"
      ];
    }

    // Check if reason already exists (case-insensitive)
    const reasonExists = currentReasons.some(
      existingReason => existingReason.toLowerCase() === trimmedReason.toLowerCase()
    );

    if (reasonExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'This cancel reason already exists' 
      }, { status: 409 });
    }

    // Add new reason (insert before "Other" if it exists, otherwise append)
    const otherIndex = currentReasons.findIndex(r => r.toLowerCase() === 'other');
    if (otherIndex !== -1) {
      currentReasons.splice(otherIndex, 0, trimmedReason);
    } else {
      currentReasons.push(trimmedReason);
    }

    // Save updated reasons to blob storage
    await ExportsStorage.writeArray('cancel-reasons.json', currentReasons);
    
    console.log(`✅ New cancel reason added: "${trimmedReason}"`);
    return NextResponse.json({ 
      success: true, 
      message: 'Cancel reason added successfully',
      reason: trimmedReason,
      reasons: currentReasons,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ POST Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add cancel reason' 
    }, { status: 500 });
  }
}

// DELETE /api/cancel-reasons - Remove cancel reason (Admin only)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Reason is required' 
      }, { status: 400 });
    }

    // Protect "Other" reason from deletion
    if (reason.toLowerCase() === 'other') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot remove "Other" reason as it is required for the system' 
      }, { status: 403 });
    }

    // Get current reasons from blob storage
    let currentReasons = await ExportsStorage.readArray('cancel-reasons.json');
    
    if (!currentReasons || currentReasons.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No cancel reasons found' 
      }, { status: 404 });
    }

    // Find and remove the reason (case-insensitive)
    const initialLength = currentReasons.length;
    currentReasons = currentReasons.filter(
      existingReason => existingReason.toLowerCase() !== reason.toLowerCase()
    );

    if (currentReasons.length === initialLength) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cancel reason not found' 
      }, { status: 404 });
    }

    // Save updated reasons to blob storage
    await ExportsStorage.writeArray('cancel-reasons.json', currentReasons);
    
    console.log(`✅ Cancel reason removed: "${reason}"`);
    return NextResponse.json({ 
      success: true, 
      message: 'Cancel reason removed successfully',
      removedReason: reason,
      reasons: currentReasons,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ DELETE Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove cancel reason' 
    }, { status: 500 });
  }
}
