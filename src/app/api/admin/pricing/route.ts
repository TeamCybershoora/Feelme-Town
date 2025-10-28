import { NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';
import database from '@/lib/db-connect';

// GET /api/admin/pricing - Get current pricing settings (Blob-backed only)
export async function GET() {
  try {
    // Use the new readPricing function
    let pricingData = await ExportsStorage.readPricing();
    
    // If no pricing data exists, fetch from database and save
    if (!pricingData || Object.keys(pricingData).length === 0) {
      
      try {
        // Try to get pricing from database (system settings)
        const systemSettings = await database.getSystemSettings();
        
        if (systemSettings.success && systemSettings.settings) {
          const settings = systemSettings.settings;
          pricingData = {
            slotBookingFee: settings.slotBookingFee || 0,
            extraGuestFee: settings.extraGuestFee || 0,
            convenienceFee: settings.convenienceFee || 0,
            decorationFees: settings.decorationFees || 0
          };
          
          // Save to blob storage using new function
          await ExportsStorage.updatePricing(pricingData);
        } else {
          // No default pricing - return empty if no data exists
          pricingData = null;
        }
      } catch (dbError) {
        console.error('❌ Database fetch failed, no pricing available:', dbError);
        // No fallback - return null if database fails
        pricingData = null;
      }
    }

    return NextResponse.json({ 
      success: true, 
      pricing: pricingData,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ GET Admin Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// PUT /api/admin/pricing - Update pricing settings (Blob-backed)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slotBookingFee, extraGuestFee, convenienceFee, decorationFees } = body;

    if (slotBookingFee === undefined && extraGuestFee === undefined && convenienceFee === undefined && decorationFees === undefined) {
      return NextResponse.json({ success: false, error: 'At least one pricing field is required' }, { status: 400 });
    }

    // Read current pricing data using new function
    let currentPricing = await ExportsStorage.readPricing();
    
    if (!currentPricing || Object.keys(currentPricing).length === 0) {
      // If no pricing exists, start with empty object
      currentPricing = {};
    }

    // Update only the provided fields
    const updatedPricing = {
      ...currentPricing,
      ...(slotBookingFee !== undefined && { slotBookingFee: Number(slotBookingFee) }),
      ...(extraGuestFee !== undefined && { extraGuestFee: Number(extraGuestFee) }),
      ...(convenienceFee !== undefined && { convenienceFee: Number(convenienceFee) }),
      ...(decorationFees !== undefined && { decorationFees: Number(decorationFees) })
    };

    // Save updated pricing using new function (ensures single file)
    await ExportsStorage.updatePricing(updatedPricing);
    
    // Also save to database for backup/persistence
    try {
      await database.saveSettings({
        slotBookingFee: updatedPricing.slotBookingFee,
        extraGuestFee: updatedPricing.extraGuestFee,
        convenienceFee: updatedPricing.convenienceFee,
        decorationFees: updatedPricing.decorationFees
      });
    } catch (dbError) {
      // Don't fail the request if database save fails
    }
    return NextResponse.json({ 
      success: true, 
      message: 'Pricing updated successfully!', 
      pricing: updatedPricing,
      source: 'blob-storage',
      singleFile: true
    });
  } catch (error) {
    console.error('❌ PUT Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pricing' }, { status: 500 });
  }
}
