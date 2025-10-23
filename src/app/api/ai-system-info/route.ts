import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feelme-town';

export async function GET(request: NextRequest) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('feelme-town');
    const collection = db.collection('systemSettings');
    
    // Fetch system settings
    const systemSettings = await collection.findOne({ type: 'system' });
    
    if (!systemSettings) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'System settings not found'
      });
    }

    // Extract important info for AI assistant
    const aiSystemInfo: any = {
      siteName: systemSettings.siteName || 'FeelME Town',
      siteAddress: systemSettings.siteAddress || 'Delhi, Dwarka',
      siteEmail: systemSettings.siteEmail || 'feelmetown@gmail.com',
      sitePhone: systemSettings.sitePhone || '+91 9870691784',
      siteWhatsapp: systemSettings.siteWhatsapp || '+91 9520936655',
      bookingExpiryHours: systemSettings.bookingExpiryHours || 24,
      cancellationHours: systemSettings.cancellationHours || 72,
      refundPercentage: systemSettings.refundPercentage || 80,
      currentDate: new Date().toLocaleDateString('en-IN'),
      currentTime: new Date().toLocaleTimeString('en-IN'),
      dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
      isWeekend: [0, 6].includes(new Date().getDay())
    };

    // Decompress additional data if available
    if (systemSettings.compressedData) {
      try {
        const zlib = require('zlib');
        const compressed = Buffer.from(systemSettings.compressedData.buffer);
        const decompressed = zlib.gunzipSync(compressed);
        const additionalData = JSON.parse(decompressed.toString());
        
        // Add any additional business info
        if (additionalData.businessHours) {
          aiSystemInfo.businessHours = additionalData.businessHours;
        }
        if (additionalData.specialOffers) {
          aiSystemInfo.specialOffers = additionalData.specialOffers;
        }
      } catch (error) {
        console.error('Error decompressing data:', error);
      }
    }

    await client.close();

    return NextResponse.json({
      success: true,
      systemInfo: aiSystemInfo
    });

  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system information'
    });
  }
}
