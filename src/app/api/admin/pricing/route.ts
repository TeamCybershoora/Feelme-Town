import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/admin/pricing - Get current pricing settings
export async function GET() {
  try {
    const pricingPath = path.join(process.cwd(), 'public', 'pricing.json');
    
    if (!fs.existsSync(pricingPath)) {
      // Create default pricing file if it doesn't exist
      const defaultPricing = {
        slotBookingFee: 1000,
        extraGuestFee: 400,
        convenienceFee: 50
      };
      fs.writeFileSync(pricingPath, JSON.stringify(defaultPricing, null, 2));
      return NextResponse.json({ success: true, pricing: defaultPricing });
    }

    const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    return NextResponse.json({ success: true, pricing: pricingData });
  } catch (error) {
    console.error('GET Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// PUT /api/admin/pricing - Update pricing settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slotBookingFee, extraGuestFee, convenienceFee } = body;

    if (slotBookingFee === undefined && extraGuestFee === undefined && convenienceFee === undefined) {
      return NextResponse.json({ success: false, error: 'At least one pricing field is required' }, { status: 400 });
    }

    const pricingPath = path.join(process.cwd(), 'public', 'pricing.json');
    
    // Read current pricing data
    let currentPricing = {
      slotBookingFee: 1000,
      extraGuestFee: 400,
      convenienceFee: 50
    };

    if (fs.existsSync(pricingPath)) {
      currentPricing = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    }

    // Update only the provided fields
    const updatedPricing = {
      ...currentPricing,
      ...(slotBookingFee !== undefined && { slotBookingFee: Number(slotBookingFee) }),
      ...(extraGuestFee !== undefined && { extraGuestFee: Number(extraGuestFee) }),
      ...(convenienceFee !== undefined && { convenienceFee: Number(convenienceFee) })
    };

    // Write updated pricing to JSON file
    fs.writeFileSync(pricingPath, JSON.stringify(updatedPricing, null, 2));

    return NextResponse.json({ success: true, message: 'Pricing updated successfully!', pricing: updatedPricing });
  } catch (error) {
    console.error('PUT Pricing API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pricing' }, { status: 500 });
  }
}
