import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db-connect';

// GET /api/cancel-reasons - Get cancel reasons from database
export async function GET() {
  try {
    console.log('📋 Fetching cancel reasons from database...');
    const database = await connectToDatabase();
    
    // Get cancel reasons from database
    const cancelReasons = await (database as any).getAllCancelReasons();
    
    if (!cancelReasons || cancelReasons.length === 0) {
      console.log('⚠️ No cancel reasons found in database, returning defaults...');
      
      const defaultReasons = [
        "Personal Emergency",
        "Transportation Issue",
        "Weather Conditions",
        "Health Issue", 
        "Work Commitment",
        "Family Emergency",
        "Other"
      ];
      
      return NextResponse.json({ 
        success: true, 
        reasons: defaultReasons,
        source: 'defaults'
      });
    }

    // Convert database format to simple array for backward compatibility
    const reasonsList = cancelReasons.map((item: any) => item.reason);
    
    console.log('✅ Cancel reasons loaded from database:', reasonsList.length);
    return NextResponse.json({ 
      success: true, 
      reasons: reasonsList,
      source: 'database'
    });
  } catch (error) {
    console.error('❌ GET Cancel Reasons API Error:', error);
    
    // Emergency fallback
    const fallbackReasons = [
      "Personal Emergency",
      "Transportation Issue", 
      "Weather Conditions",
      "Health Issue",
      "Work Commitment",
      "Family Emergency",
      "Other"
    ];
    
    return NextResponse.json({ 
      success: true, 
      reasons: fallbackReasons,
      source: 'fallback'
    });
  }
}

// POST /api/cancel-reasons - Add new cancel reason (Admin only) - Database only
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
    console.log('📝 Adding new cancel reason to database:', trimmedReason);

    const database = await connectToDatabase();
    
    // Check if reason already exists
    const existingReasons = await (database as any).getAllCancelReasons();
    const reasonExists = existingReasons.some(
      (item: any) => item.reason.toLowerCase() === trimmedReason.toLowerCase()
    );

    if (reasonExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'This cancel reason already exists' 
      }, { status: 409 });
    }

    // Save to database
    const result = await (database as any).saveCancelReason({
      reason: trimmedReason,
      category: 'General',
      description: '',
      isActive: true
    });
    
    console.log(`✅ New cancel reason added to database: "${trimmedReason}"`);
    return NextResponse.json({ 
      success: true, 
      message: 'Cancel reason added successfully',
      reason: trimmedReason,
      source: 'database'
    });
  } catch (error) {
    console.error('❌ POST Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add cancel reason' 
    }, { status: 500 });
  }
}

// DELETE /api/cancel-reasons - Remove cancel reason (Admin only) - Database only
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');

    if (!id && !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either id or reason is required' 
      }, { status: 400 });
    }

    // Protect "Other" reason from deletion
    if (reason && reason.toLowerCase() === 'other') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot remove "Other" reason as it is required for the system' 
      }, { status: 403 });
    }

    console.log('🗑️ Deleting cancel reason from database:', { id, reason });
    const database = await connectToDatabase();
    
    // Delete from database
    const result = await (database as any).deleteCancelReason(id || reason);
    
    if (result.success) {
      console.log(`✅ Cancel reason deleted from database: "${reason || id}"`);
      return NextResponse.json({ 
        success: true, 
        message: 'Cancel reason removed successfully',
        removedReason: reason || id,
        source: 'database'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Cancel reason not found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ DELETE Cancel Reasons API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove cancel reason' 
    }, { status: 500 });
  }
}
