import { NextRequest, NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';

// GET /api/admin/cancel-reasons - Get all cancel reasons
export async function GET() {
  try {
    console.log('📖 GET /api/admin/cancel-reasons - Reading from blob storage');
    
    const rawReasons = await ExportsStorage.readArray('cancel-reasons.json');
    // Normalize to simple strings
    const toText = (r: any) => (typeof r === 'string' ? r : (r?.reason ?? ''));
    const cancelReasons = (rawReasons || [])
      .map(toText)
      .filter((s: string) => !!(s || '').trim());
    
    return NextResponse.json({
      success: true,
      cancelReasons,
      count: cancelReasons.length,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ GET Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch cancel reasons' 
    }, { status: 500 });
  }
}

// POST /api/admin/cancel-reasons - Add new cancel reason
export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST /api/admin/cancel-reasons - Adding new cancel reason');
    const body = await request.json();
    const { reason, category = 'General', isActive = true } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Cancel reason is required'
      }, { status: 400 });
    }

    const trimmed = reason.trim();
    // Read current reasons and normalize to strings
    const rawReasons = await ExportsStorage.readArray('cancel-reasons.json');
    const toText = (r: any) => (typeof r === 'string' ? r : (r?.reason ?? ''));
    let currentReasons: string[] = (rawReasons || []).map(toText).filter((s: string) => !!(s || '').trim());

    // Prevent duplicates (case-insensitive)
    const exists = currentReasons.some(r => r.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return NextResponse.json({ success: false, error: 'This cancel reason already exists' }, { status: 409 });
    }

    // Insert before 'Other' if present, else push
    const otherIdx = currentReasons.findIndex(r => r.trim().toLowerCase() === 'other');
    if (otherIdx !== -1) {
      currentReasons.splice(otherIdx, 0, trimmed);
    } else {
      currentReasons.push(trimmed);
    }

    // Persist as array of strings
    await ExportsStorage.writeArray('cancel-reasons.json', currentReasons);

    console.log(`✅ New cancel reason added (string): "${trimmed}"`);
    return NextResponse.json({ 
      success: true, 
      message: 'Cancel reason added successfully',
      reason: trimmed,
      cancelReasons: currentReasons
    });
  } catch (error) {
    console.error('❌ POST Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add cancel reason' 
    }, { status: 500 });
  }
}

// PUT /api/admin/cancel-reasons - Update cancel reason
export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ PUT /api/admin/cancel-reasons - Updating cancel reason');
    const body = await request.json();
    const { id, reason, category, isActive } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Cancel reason ID is required'
      }, { status: 400 });
    }

    // Read existing reasons
    const cancelReasons = await ExportsStorage.readArray('cancel-reasons.json');
    
    // Find and update the reason
    const reasonIndex = cancelReasons.findIndex((r: any) => r.id === id);
    if (reasonIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Cancel reason not found'
      }, { status: 404 });
    }

    // Update the reason
    cancelReasons[reasonIndex] = {
      ...cancelReasons[reasonIndex],
      ...(reason && { reason: reason.trim() }),
      ...(category && { category: category.trim() }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Administrator'
    };

    console.log('📝 Updated cancel reason:', JSON.stringify(cancelReasons[reasonIndex], null, 2));

    // Write back to blob storage
    await ExportsStorage.writeArray('cancel-reasons.json', cancelReasons);

    return NextResponse.json({
      success: true,
      message: 'Cancel reason updated successfully',
      cancelReason: cancelReasons[reasonIndex]
    });
  } catch (error) {
    console.error('❌ PUT Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update cancel reason' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/cancel-reasons - Delete cancel reason
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/admin/cancel-reasons - Deleting cancel reason');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reasonParam = searchParams.get('reason');

    if (!id && !reasonParam) {
      return NextResponse.json({
        success: false,
        error: 'Cancel reason id or reason is required'
      }, { status: 400 });
    }

    const normalize = (s?: string) => (s ?? '').trim().toLowerCase();
    // Protect "Other" from deletion
    if (reasonParam && normalize(reasonParam) === 'other') {
      return NextResponse.json({ success: false, error: 'Cannot remove "Other" reason' }, { status: 403 });
    }

    // Read existing reasons
    const cancelReasons = await ExportsStorage.readArray('cancel-reasons.json');
    
    // Filter out the reason to delete (match by id or text, supports both string and object entries)
    const filteredReasons = cancelReasons.filter((r: any) => {
      const text = typeof r === 'string' ? r : (r?.reason ?? '');
      const matchesId = !!id && r && typeof r === 'object' && 'id' in r && r.id === id;
      const matchesText = !!reasonParam && normalize(text) === normalize(reasonParam);
      return !(matchesId || matchesText);
    });
    
    if (filteredReasons.length === cancelReasons.length) {
      return NextResponse.json({
        success: false,
        error: 'Cancel reason not found'
      }, { status: 404 });
    }

    console.log(`🗑️ Deleting cancel reason with ID: ${id}`);

    // Persist as array of strings (normalize remaining)
    const toText = (r: any) => (typeof r === 'string' ? r : (r?.reason ?? ''));
    const asStrings: string[] = filteredReasons.map(toText).filter((s: string) => !!(s || '').trim());
    await ExportsStorage.writeArray('cancel-reasons.json', asStrings);

    return NextResponse.json({
      success: true,
      message: 'Cancel reason deleted successfully'
    });
  } catch (error) {
    console.error('❌ DELETE Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete cancel reason' 
    }, { status: 500 });
  }
}
