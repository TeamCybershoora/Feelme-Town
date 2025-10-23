import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch AI Memory data instead of database calls
    console.log('🧠 Context API: Loading AI Memory from JSON files...');
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    
    let aiMemoryData: any = {};
    try {
      const memoryResponse = await fetch(`${siteUrl}/api/ai-memory/read`);
      if (memoryResponse.ok) {
        const memoryResult = await memoryResponse.json();
        if (memoryResult.success) {
          aiMemoryData = memoryResult.memory;
          console.log('✅ Context API: AI Memory loaded successfully');
        }
      }
    } catch (error) {
      console.error('❌ Context API: Failed to load AI Memory:', error);
    }

    // Extract contact details from FAQ
    let contactPhone = '+91 9870691784';
    let contactWhatsApp = '+91 9520936655';
    
    if (aiMemoryData.faq?.faq?.length > 0) {
      const bookingFAQ = aiMemoryData.faq.faq.find((faq: any) => faq.id === 'booking-process');
      if (bookingFAQ && bookingFAQ.answer) {
        const phoneMatch = bookingFAQ.answer.match(/\+91\s?9870691784/);
        const whatsappMatch = bookingFAQ.answer.match(/\+91\s?9520936655/);
        if (phoneMatch) contactPhone = phoneMatch[0];
        if (whatsappMatch) contactWhatsApp = whatsappMatch[0];
      }
    }

    // Format context data from AI Memory
    const contextData = {
      // System settings from AI Memory
      systemSettings: {
        siteName: 'FeelME Town',
        siteAddress: 'Delhi, Dwarka',
        sitePhone: contactPhone,
        siteWhatsapp: contactWhatsApp,
        siteEmail: 'feelmetown@gmail.com',
        operatingHours: '10 AM - 12 AM (7 days a week)',
        bookingExpiryHours: 24,
        cancellationHours: 72,
        refundPercentage: 80
      },
      
      // Theaters from AI Memory
      theaters: aiMemoryData.theaters?.theaters || [],
      
      // Occasions from AI Memory
      occasions: aiMemoryData.occasions?.occasions || [],
      
      // Services from AI Memory
      services: aiMemoryData.services?.services || [],
      
      // FAQ from AI Memory
      faq: aiMemoryData.faq?.faq || [],
      
      // Gifts from AI Memory
      gifts: aiMemoryData.gifts?.gifts || [],
      
      // Current date info
      dateInfo: {
        currentDate: new Date().toISOString(),
        currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        timezone: 'Asia/Kolkata',
        dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
        isWeekend: [0, 6].includes(new Date().getDay())
      },
      
      // Business status
      businessStatus: {
        isOpen: true,
        operatingHours: '10 AM - 12 AM (7 days a week)',
        location: 'FeelME Town, Dwarka, Delhi',
        phone: contactPhone,
        whatsapp: contactWhatsApp,
        email: 'feelmetown@gmail.com'
      },
      
      // Special events (can be enhanced later)
      specialEvents: [],
      
      // Default theater (first available theater)
      defaultTheater: aiMemoryData.theaters?.theaters?.[0] || null
    };

    return NextResponse.json({
      success: true,
      context: contextData,
      timestamp: new Date().toISOString(),
      source: 'ai-memory',
      totalItems: {
        theaters: contextData.theaters.length,
        occasions: contextData.occasions.length,
        services: contextData.services.length,
        faq: contextData.faq.length,
        gifts: contextData.gifts.length
      }
    });

  } catch (error) {
    console.error('AI Context API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch context data',
      context: getEmergencyContext()
    }, { status: 500 });
  }
}

function getEmergencyContext() {
  return {
    systemSettings: {
      siteName: 'FeelME Town',
      siteAddress: 'Delhi, Dwarka',
      sitePhone: '+91 9870691784',
      siteWhatsapp: '+91 9520936655',
      siteEmail: 'feelmetown@gmail.com',
      operatingHours: '10 AM - 12 AM (7 days a week)'
    },
    theaters: [],
    occasions: [],
    services: [],
    faq: [],
    gifts: [],
    dateInfo: {
      currentDate: new Date().toISOString(),
      currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      timezone: 'Asia/Kolkata'
    },
    businessStatus: {
      isOpen: true,
      operatingHours: '10 AM - 12 AM (7 days a week)',
      location: 'FeelME Town, Dwarka, Delhi',
      phone: '+91 9870691784',
      whatsapp: '+91 9520936655',
      email: 'feelmetown@gmail.com'
    },
    specialEvents: [],
    defaultTheater: null
  };
}
