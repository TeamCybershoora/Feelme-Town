import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/pricing - Get current pricing settings for public use
export async function GET() {
  try {
    const pricingPath = path.join(process.cwd(), 'public', 'pricing.json');
    
    if (!fs.existsSync(pricingPath)) {
      // Return default pricing if file doesn't exist
      const defaultPricing = {
        slotBookingFee: 1000,
        extraGuestFee: 400,
        convenienceFee: 50
      };
      return NextResponse.json({ success: true, pricing: defaultPricing });
    }

    const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    return NextResponse.json({ success: true, pricing: pricingData });
  } catch (error) {
    console.error('GET Public Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 });
  }
}
