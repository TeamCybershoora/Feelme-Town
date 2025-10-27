import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';
import { ExportsStorage } from '@/lib/exports-storage';

import emailService from '@/lib/email-service';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Step 1: Get occasion details from database
    console.log('OccasionData:', body.occasionData);
    
    const occasions = await database.getAllOccasions();
    console.log('All occasions from DB:', occasions.map(o => ({ name: o.name, requiredFields: o.requiredFields })));
    
    const selectedOccasion = occasions.find(occ => occ.name === body.occasion);
    console.log('Found occasion:', selectedOccasion);
    
    if (!selectedOccasion) {
      console.log('Occasion not found in database');
      return NextResponse.json({
        success: false,
        error: 'Occasion not found in database'
      });
    }

    
    
    

    // Step 2: Process occasion-specific fields
    
    
    
    const dynamicOccasionFields: any = {};
    
    if (body.occasionData && selectedOccasion.requiredFields) {
      console.log('Processing occasionData:', body.occasionData);
      console.log('Required fields:', selectedOccasion.requiredFields);
      
      selectedOccasion.requiredFields.forEach((dbFieldName: string) => {
        
        
        // Try multiple ways to find the field in frontend data
        let fieldValue = null;
        let foundKey = null;
        
        // Method 1: Direct match
        if (body.occasionData[dbFieldName]) {
          fieldValue = body.occasionData[dbFieldName];
          foundKey = dbFieldName;
          
        }
        
        // Method 2: Check all keys in occasionData for partial matches
        if (!fieldValue) {
          const frontendKeys = Object.keys(body.occasionData);
          
          
          for (const frontendKey of frontendKeys) {
            // Method 2a: Exact match (case insensitive, space insensitive)
            if (frontendKey.toLowerCase().replace(/\s+/g, '') === dbFieldName.toLowerCase().replace(/\s+/g, '')) {
              fieldValue = body.occasionData[frontendKey];
              foundKey = frontendKey;
              
              break;
            }
            
            // Method 2b: Check if frontend key contains database field name words
            const dbWords = dbFieldName.toLowerCase().split(/\s+/);
            const frontendWords = frontendKey.toLowerCase().split(/\s+/);
            
            if (dbWords.every(word => frontendWords.some(fWord => fWord.includes(word) || word.includes(fWord)))) {
              fieldValue = body.occasionData[frontendKey];
              foundKey = frontendKey;
              
              break;
            }
          }
        }
        
        // Method 3: Use the frontend key as database field name if no match found
        if (!fieldValue && body.occasionData) {
          const frontendKeys = Object.keys(body.occasionData);
          if (frontendKeys.length > 0) {
            // Map frontend keys to database field names based on position
            const dbFieldIndex = selectedOccasion.requiredFields.indexOf(dbFieldName);
            if (dbFieldIndex >= 0 && dbFieldIndex < frontendKeys.length) {
              const frontendKey = frontendKeys[dbFieldIndex];
              fieldValue = body.occasionData[frontendKey];
              foundKey = frontendKey;
              
            }
          }
        }
        
        if (fieldValue && fieldValue.toString().trim()) {
          const trimmedValue = fieldValue.toString().trim();
          const fieldLabel = selectedOccasion.fieldLabels?.[dbFieldName] || dbFieldName;
          
          // Save with exact database field name
          dynamicOccasionFields[dbFieldName] = trimmedValue;
          dynamicOccasionFields[`${dbFieldName}_label`] = fieldLabel;
          dynamicOccasionFields[`${dbFieldName}_value`] = trimmedValue;
          
          console.log(`Added field ${dbFieldName} with value:`, trimmedValue);
        } else {
          console.log(`No value found for field ${dbFieldName}`);
        }
      });
    }

    

    // Step 3: Use pricing from frontend (includes all services and calculations)
    
    // Use the totalAmount calculated by frontend (includes theater + services + extra guests + discounts)
    const totalAmount = body.totalAmount || 0;
    
    // Use advance payment and venue payment from frontend if provided, otherwise calculate
    const advancePayment = body.advancePayment || Math.round(totalAmount * 0.30); // 30% advance
    const venuePayment = body.venuePayment || (totalAmount - advancePayment);

    

    // Step 4: Generate booking ID
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    const bookingId = `FMT-${year}-${month}${day}-003-${randomNum}-${Math.floor(Math.random() * 90) + 10}`;

    

    // Step 5: Create complete booking data
    
    
    const completeBookingData = {
      // Basic booking info
      bookingId: bookingId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      theaterName: body.theaterName.trim(),
      date: body.date,
      time: body.time,
      occasion: body.occasion.trim(),
      
      // Guest information
      numberOfPeople: body.numberOfPeople || 2,
      extraGuestsCount: body.extraGuestsCount || 0,
      extraGuestCharges: body.extraGuestCharges || 0,
      
      // Pricing
      totalAmount: totalAmount,
      advancePayment: advancePayment,
      venuePayment: venuePayment,
      appliedCouponCode: body.appliedCouponCode,
      couponDiscount: body.couponDiscount || 0,
      
      // Store pricing data used at time of booking
      pricingData: body.pricingData || {
        slotBookingFee: 1000,
        extraGuestFee: 400,
        convenienceFee: 50
      },
      
      // Status and metadata
      status: body.status || 'confirmed',
      bookingType: body.bookingType || 'online',
      paymentMode: body.paymentMode || 'pay_at_venue',
      createdBy: body.createdBy || 'Customer',
      isManualBooking: body.isManualBooking || false,
      createdAt: new Date(),
      
      // Selected items
      selectedMovies: body.selectedMovies || [],
      selectedCakes: body.selectedCakes || [],
      selectedDecorItems: body.selectedDecorItems || [],
      selectedGifts: body.selectedGifts || [],
      
      // Dynamic occasion fields (this is the key part!)
      ...dynamicOccasionFields
    };

    console.log('Final booking data to save:', JSON.stringify(completeBookingData, null, 2));
    console.log('Dynamic occasion fields:', dynamicOccasionFields);

    // Step 6: Save to database
    
    const result = await database.saveBooking(completeBookingData);

    if (result.success) {
      
      // If this is a manual booking, write it to manual-bookings.json file
      if (completeBookingData.isManualBooking || completeBookingData.status === 'manual') {
        try {
          // Add new manual booking (only essential fields for Excel/PDF export)
          const manualBookingRecord = {
            bookingId: completeBookingData.bookingId || completeBookingData.id,
            name: completeBookingData.name,
            email: completeBookingData.email,
            phone: completeBookingData.phone,
            theaterName: completeBookingData.theaterName,
            date: completeBookingData.date,
            time: completeBookingData.time,
            occasion: completeBookingData.occasion,
            numberOfPeople: completeBookingData.numberOfPeople,
            totalAmount: completeBookingData.totalAmount,
            advancePayment: completeBookingData.advancePayment,
            venuePayment: completeBookingData.venuePayment,
            slotBookingFee: completeBookingData.pricingData?.slotBookingFee,
            extraGuestFee: completeBookingData.pricingData?.extraGuestFee,
            extraGuestsCount: completeBookingData.extraGuestsCount,
            extraGuestCharges: completeBookingData.extraGuestCharges,
            theaterBasePrice: completeBookingData.pricingData?.theaterBasePrice,
            convenienceFee: completeBookingData.pricingData?.convenienceFee,
            status: completeBookingData.status,
            bookingType: completeBookingData.bookingType,
            paymentMode: completeBookingData.paymentMode,
            createdBy: {
              type: completeBookingData.createdBy?.type,
              staffId: completeBookingData.createdBy?.staffId,
              staffName: completeBookingData.createdBy?.staffName,
              adminName: completeBookingData.createdBy?.adminName
            },
            createdAt: completeBookingData.createdAt,
            isManualBooking: true
          };
          const manual = await ExportsStorage.readManual('manual-bookings.json');
          manual.records.push(manualBookingRecord);
          manual.total = manual.records.length;
          manual.generatedAt = new Date().toISOString();
          await ExportsStorage.writeManual('manual-bookings.json', manual);
          console.log('✅ Manual booking written to manual-bookings.json:', completeBookingData.bookingId);
        } catch (jsonError) {
          console.error('❌ Failed to write manual booking to JSON file:', jsonError);
        }
      }
      
      // Sync Excel records after new booking
      try {
        await fetch(`${request.nextUrl.origin}/api/admin/sync-excel-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingId,
            oldStatus: null,
            newStatus: completeBookingData.status,
            action: 'create'
          })
        });
        console.log('✅ Excel records synced after new booking');
      } catch (syncError) {
        console.error('⚠️ Failed to sync Excel records:', syncError);
      }

      const bookingForEmail = (result as any).booking || { id: bookingId, ...completeBookingData };
      emailService.sendBookingConfirmed(bookingForEmail as any).catch(() => {});

      // Best-effort: ensure auto-cleanup scheduler is started (non-blocking)
      try {
        fetch(`${request.nextUrl.origin}/api/auto-cleanup-scheduler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Booking completed successfully with dynamic fields!',
        bookingId: bookingId,
        booking: completeBookingData,
        dynamicFields: dynamicOccasionFields,
        database: (result as any).database || 'FeelME Town',
        collection: (result as any).collection || 'booking'
      });
    } else {
      
      return NextResponse.json({
        success: false,
        error: 'Failed to save booking to database'
      });
    }

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    });
  }
}

