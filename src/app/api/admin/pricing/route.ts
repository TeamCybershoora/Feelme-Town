import { NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';
import database from '@/lib/db-connect';

// GET /api/admin/pricing - Get current pricing settings (Blob-backed)
export async function GET() {
  try {
    // First try to read from blob storage
    let pricingData = await ExportsStorage.readRaw('pricing.json');
    
    if (!pricingData) {
      // If not found in blob, fetch from database and save to blob
      console.log('🔄 Admin pricing not found in blob, fetching from database...');
      
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
          
          // Save to blob storage for future use
          await ExportsStorage.writeRaw('pricing.json', pricingData);
          console.log('✅ Admin pricing fetched from database and saved to blob');
        } else {
          // Use default pricing if database is empty
          pricingData = {
            slotBookingFee: 0,
            extraGuestFee: 0,
            convenienceFee: 0,
            decorationFees: 0
          };
          
          // Save default to blob
          await ExportsStorage.writeRaw('pricing.json', pricingData);
          console.log('✅ Default admin pricing saved to blob');
        }
      } catch (dbError) {
        console.error('❌ Database fetch failed, using default pricing:', dbError);
        
        // Fallback to default pricing
        pricingData = {
          slotBookingFee: 0,
          extraGuestFee: 0,
          convenienceFee: 0,
          decorationFees: 0
        };
        
        // Save fallback to blob
        await ExportsStorage.writeRaw('pricing.json', pricingData);
      }
    } else {
      console.log('✅ Admin pricing loaded from blob storage');
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

    // Read current pricing data from blob storage
    let currentPricing = await ExportsStorage.readRaw('pricing.json');
    
    if (!currentPricing) {
      // If no pricing exists, create default
      currentPricing = {
        slotBookingFee: 0,
        extraGuestFee: 0,
        convenienceFee: 0,
        decorationFees: 0
      };
    }

    // Update only the provided fields
    const updatedPricing = {
      ...currentPricing,
      ...(slotBookingFee !== undefined && { slotBookingFee: Number(slotBookingFee) }),
      ...(extraGuestFee !== undefined && { extraGuestFee: Number(extraGuestFee) }),
      ...(convenienceFee !== undefined && { convenienceFee: Number(convenienceFee) }),
      ...(decorationFees !== undefined && { decorationFees: Number(decorationFees) })
    };

    // Save updated pricing to blob storage
    await ExportsStorage.writeRaw('pricing.json', updatedPricing);
    
    // Also try to save to database (system settings) for persistence
    try {
      await database.saveSettings({
        slotBookingFee: updatedPricing.slotBookingFee,
        extraGuestFee: updatedPricing.extraGuestFee,
        convenienceFee: updatedPricing.convenienceFee,
        decorationFees: updatedPricing.decorationFees
      });
      console.log('✅ Pricing also saved to database');
    } catch (dbError) {
      console.error('⚠️ Failed to save pricing to database:', dbError);
      // Don't fail the request if database save fails
    }

    console.log('✅ Pricing updated successfully in blob storage');
    return NextResponse.json({ 
      success: true, 
      message: 'Pricing updated successfully!', 
      pricing: updatedPricing,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ PUT Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pricing' }, { status: 500 });
  }
}
