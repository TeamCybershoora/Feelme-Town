import { NextResponse } from 'next/server';
import { ExportsStorage } from '@/lib/exports-storage';
import database from '@/lib/db-connect';

// GET /api/pricing - Get current pricing settings for public use (Blob-backed)
export async function GET() {
  try {
    // First try to read from blob storage
    let pricingData = await ExportsStorage.readRaw('pricing.json');
    
    if (!pricingData) {
      // If not found in blob, fetch from database and save to blob
      console.log('🔄 Pricing not found in blob, fetching from database...');
      
      try {
        // Try to get pricing from database (system settings)
        const systemSettings = await database.getSystemSettings();
        
        if (systemSettings.success && systemSettings.settings) {
          const settings = systemSettings.settings;
          pricingData = {
            slotBookingFee: settings.slotBookingFee || 400,
            extraGuestFee: settings.extraGuestFee || 600,
            convenienceFee: settings.convenienceFee || 0,
            decorationFees: settings.decorationFees || 750
          };
          
          // Save to blob storage for future use
          await ExportsStorage.writeRaw('pricing.json', pricingData);
          console.log('✅ Pricing fetched from database and saved to blob');
        } else {
          // Use default pricing if database is empty
          pricingData = {
            slotBookingFee: 400,
            extraGuestFee: 600,
            convenienceFee: 0,
            decorationFees: 750
          };
          
          // Save default to blob
          await ExportsStorage.writeRaw('pricing.json', pricingData);
          console.log('✅ Default pricing saved to blob');
        }
      } catch (dbError) {
        console.error('❌ Database fetch failed, using default pricing:', dbError);
        
        // Fallback to default pricing
        pricingData = {
          slotBookingFee: 400,
          extraGuestFee: 600,
          convenienceFee: 0,
          decorationFees: 750
        };
        
        // Save fallback to blob
        await ExportsStorage.writeRaw('pricing.json', pricingData);
      }
    } else {
      console.log('✅ Pricing loaded from blob storage');
    }

    return NextResponse.json({ 
      success: true, 
      pricing: pricingData,
      source: 'blob-storage'
    });
  } catch (error) {
    console.error('❌ GET Public Pricing API Error:', error);
    
    // Emergency fallback
    const fallbackPricing = {
      slotBookingFee: 400,
      extraGuestFee: 600,
      convenienceFee: 0,
      decorationFees: 750
    };
    
    return NextResponse.json({ 
      success: true, 
      pricing: fallbackPricing,
      source: 'fallback'
    });
  }
}
