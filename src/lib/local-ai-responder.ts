// Local AI Responder - Uses AI Memory to respond like Ankit without external AI models

interface AIMemory {
  theaters?: { theaters: any[] };
  occasions?: { occasions: any[] };
  services?: { services: any[] };
  faq?: { faq: any[] };
  gifts?: { gifts: any[] };
}

interface SystemInfo {
  sitePhone?: string;
  siteWhatsapp?: string;
  siteEmail?: string;
  siteAddress?: string;
}

// Hinglish response templates
const hinglishGreetings = [
  "Arre yaar",
  "Waah bhai",
  "Oho",
  "Sach mein",
  "Yaar",
  "Arre waah"
];

const hinglishExpressions = [
  "kitna amazing hai",
  "so sweet",
  "that's so exciting",
  "perfect choice",
  "main toh emotional ho gaya",
  "tumhara celebration successful hoga pakka"
];

// Generate Hinglish response
function generateHinglishResponse(baseMessage: string): string {
  const randomGreeting = hinglishGreetings[Math.floor(Math.random() * hinglishGreetings.length)];
  const randomExpression = hinglishExpressions[Math.floor(Math.random() * hinglishExpressions.length)];
  
  // Sometimes add Hinglish flavor
  if (Math.random() > 0.5) {
    return `${randomGreeting}, ${baseMessage.toLowerCase()}! ${randomExpression}! 😊`;
  }
  return baseMessage;
}

// Find relevant FAQ
function findRelevantFAQ(message: string, faqList: any[]): any | null {
  if (!faqList || faqList.length === 0) return null;
  
  const lowerMessage = message.toLowerCase();
  
  // Check for keywords
  const keywords: { [key: string]: string[] } = {
    'booking': ['book', 'booking', 'reserve', 'reservation', 'how to book'],
    'cancellation': ['cancel', 'cancellation', 'refund', 'cancel booking'],
    'capacity': ['capacity', 'people', 'persons', 'how many', 'accommodate'],
    'timing': ['time', 'timing', 'slot', 'when', 'hours', 'available'],
    'payment': ['payment', 'pay', 'price', 'cost', 'fee', 'charges'],
    'food': ['food', 'eat', 'bring food', 'outside food'],
    'decorations': ['decoration', 'decor', 'decoration package'],
    'location': ['location', 'where', 'address', 'place']
  };
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => lowerMessage.includes(word))) {
      const relevantFAQ = faqList.find((faq: any) => 
        faq.category === category || 
        faq.question.toLowerCase().includes(category) ||
        faq.answer.toLowerCase().includes(category)
      );
      if (relevantFAQ) return relevantFAQ;
    }
  }
  
  // Try to find by question similarity
  for (const faq of faqList) {
    const questionWords = faq.question.toLowerCase().split(' ');
    if (
      questionWords.some(
        (word: string) => lowerMessage.includes(word) && word.length > 3,
      )
    ) {
      return faq;
    }
  }
  
  return null;
}

// Find theaters by query
function findTheaters(message: string, theaters: any[]): any[] {
  if (!theaters || theaters.length === 0) return [];
  
  const lowerMessage = message.toLowerCase();
  const matched: any[] = [];
  
  // Check for theater names
  for (const theater of theaters) {
    const theaterName = theater.name?.toLowerCase() || '';
    const theaterType = theater.type?.toLowerCase() || '';
    
    if (
      lowerMessage.includes(theaterName.split(' ')[0]) ||
      lowerMessage.includes(theaterType) ||
      theaterName
        .split(' ')
        .some((word: string) => lowerMessage.includes(word))
    ) {
      matched.push(theater);
    }
  }
  
  // Check for capacity requirements
  const capacityMatch = lowerMessage.match(/(\d+)\s*(people|persons|guests|members)/i);
  if (capacityMatch) {
    const requiredCapacity = parseInt(capacityMatch[1]);
    const suitable = theaters.filter((theater: any) => 
      theater.capacity?.min <= requiredCapacity && 
      theater.capacity?.max >= requiredCapacity
    );
    if (suitable.length > 0) {
      return suitable;
    }
  }
  
  // Check for occasion type
  const occasionTypes = ['couple', 'couples', 'romantic', 'date', 'friends', 'family', 'birthday', 'anniversary', 'proposal'];
  for (const type of occasionTypes) {
    if (lowerMessage.includes(type)) {
      const suitable = theaters.filter((theater: any) => 
        theater.type?.toLowerCase().includes(type) ||
        theater.description?.toLowerCase().includes(type)
      );
      if (suitable.length > 0) {
        return suitable;
      }
    }
  }
  
  return matched.length > 0 ? matched : theaters.slice(0, 3); // Return top 3 if no match
}

// Find occasions by query
function findOccasions(message: string, occasions: any[]): any[] {
  if (!occasions || occasions.length === 0) return [];
  
  const lowerMessage = message.toLowerCase();
  const matched: any[] = [];
  
  for (const occasion of occasions) {
    const occasionName = occasion.name?.toLowerCase() || '';
    const occasionDesc = occasion.description?.toLowerCase() || '';
    
    if (
      lowerMessage.includes(occasionName) ||
      occasionName.split(' ').some((word: string) => lowerMessage.includes(word)) ||
      lowerMessage.includes(occasionDesc.split(' ')[0])
    ) {
      matched.push(occasion);
    }
  }
  
  return matched.length > 0 ? matched : occasions.slice(0, 2);
}

// Generate response based on message and memory
export async function generateLocalResponse(
  message: string, 
  memory: AIMemory,
  systemInfo?: SystemInfo
): Promise<string> {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|namaste|namaskar|hii|hlo)/)) {
    return generateHinglishResponse(`Heyy! 👋 Main Ankit hun, FeelME Town ka receptionist! Yaar, aaj kya plan hai? Theater booking karna hai kya? I'm super excited to help you! 😊✨`);
  }
  
  // Contact info requests
  if (lowerMessage.match(/(contact|phone|number|call|whatsapp|email|address|location|where)/)) {
    // Fetch contact info - use provided systemInfo or fetch from API
    let phone = systemInfo?.sitePhone || '';
    let whatsapp = systemInfo?.siteWhatsapp || '';
    let email = systemInfo?.siteEmail || '';
    let address = systemInfo?.siteAddress || '';
    
    console.log('📞 Contact request - systemInfo provided:', {
      hasSystemInfo: !!systemInfo,
      systemInfoKeys: systemInfo ? Object.keys(systemInfo) : [],
      phone: phone,
      whatsapp: whatsapp,
      email: email,
      address: address,
      fullSystemInfo: systemInfo
    });
    
    // If systemInfo is empty or missing values, try to fetch from API (for server-side calls)
    // Check for both empty string and falsy values
    if ((!phone || phone.trim() === '' || !whatsapp || whatsapp.trim() === '') && typeof fetch !== 'undefined') {
      try {
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        console.log('🔄 Fetching contact info from API...');
        const response = await fetch(`${siteUrl}/api/ai-system-info`);
        if (response.ok) {
          const data = await response.json();
          console.log('📥 System info API response:', data);
          if (data.success && data.systemInfo) {
            phone = data.systemInfo.sitePhone || phone || '';
            whatsapp = data.systemInfo.siteWhatsapp || whatsapp || '';
            email = data.systemInfo.siteEmail || email || '';
            address = data.systemInfo.siteAddress || address || '';
            console.log('✅ Contact info fetched:', { phone, whatsapp, email, address });
          }
        } else {
          console.error('❌ System info API response not ok:', response.status);
        }
      } catch (error) {
        console.error('❌ Failed to fetch contact info:', error);
      }
    }
    
    // Trim and check for empty strings
    phone = (phone || '').trim();
    whatsapp = (whatsapp || '').trim();
    email = (email || '').trim();
    address = (address || '').trim();
    
    // If still empty, show message to contact
    if (!phone && !whatsapp) {
      console.warn('⚠️ No contact info available after all attempts');
      console.warn('⚠️ Final values:', { phone, whatsapp, email, address });
      return `Arre yaar, contact info abhi available nahi hai! 😅 Please check our website ya phir admin se contact karo for contact details.`;
    }
    
    // Ensure we have values - if empty string, show N/A
    const displayPhone = phone || 'N/A';
    const displayWhatsapp = whatsapp || 'N/A';
    const displayEmail = email || 'N/A';
    const displayAddress = address || 'N/A';
    
    console.log('📞 Returning contact info:', { 
      phone: displayPhone, 
      whatsapp: displayWhatsapp, 
      email: displayEmail, 
      address: displayAddress 
    });
    
    return `Arre yaar, toh bahut asaan hai 😊 Tumhare contact karne ke best tarike hain:\n\n📞 Phone: ${displayPhone}\n💬 WhatsApp: ${displayWhatsapp}\n📧 Email: ${displayEmail}\n📍 Address: ${displayAddress}\n\nTumhe kis tarah se help chahiye?`;
  }
  
  // FAQ matching
  if (memory.faq?.faq) {
    const relevantFAQ = findRelevantFAQ(message, memory.faq.faq);
    if (relevantFAQ) {
      return generateHinglishResponse(relevantFAQ.answer);
    }
  }
  
  // Theater queries
  if (lowerMessage.match(/(theater|hall|cinema|movie|screen|booking|book)/)) {
    const theaters = memory.theaters?.theaters || [];
    if (theaters.length > 0) {
      const matchedTheaters = findTheaters(message, theaters);
      
      if (matchedTheaters.length > 0) {
        let response = `Waah bhai, perfect! 😊 Humare paas ${matchedTheaters.length} amazing theater${matchedTheaters.length > 1 ? 's' : ''} hain:\n\n`;
        
        matchedTheaters.forEach((theater: any, index: number) => {
          response += `${index + 1}. ${theater.name} (${theater.type})\n`;
          response += `   💰 Price: ₹${theater.price}\n`;
          response += `   👥 Capacity: ${theater.capacity?.min}-${theater.capacity?.max} people\n`;
          if (theater.timeSlots && theater.timeSlots.length > 0) {
            response += `   ⏰ Time Slots: ${theater.timeSlots.slice(0, 3).join(', ')}\n`;
          }
          response += `\n`;
        });
        
        response += `Konsa theater pasand aaya? Ya phir koi specific occasion hai? 🎉`;
        return response;
      }
    }
  }
  
  // Occasion queries
  if (lowerMessage.match(/(occasion|celebration|birthday|anniversary|proposal|date|romantic)/)) {
    const occasions = memory.occasions?.occasions || [];
    if (occasions.length > 0) {
      const matchedOccasions = findOccasions(message, occasions);
      
      if (matchedOccasions.length > 0) {
        let response = `Arre waah! 🎉 Special occasion hai na? Humare paas perfect options hain:\n\n`;
        
        matchedOccasions.forEach((occasion: any, index: number) => {
          response += `${index + 1}. ${occasion.name}\n`;
          response += `   ${occasion.description}\n`;
          if (occasion.requiredFields && occasion.requiredFields.length > 0) {
            response += `   Required: ${occasion.requiredFields.join(', ')}\n`;
          }
          response += `\n`;
        });
        
        response += `Konsa occasion celebrate kar rahe ho? Tell me more na! 😊`;
        return response;
      }
    }
  }
  
  // Pricing queries
  if (lowerMessage.match(/(price|cost|fee|charges|how much|pricing|rate)/)) {
    const theaters = memory.theaters?.theaters || [];
    if (theaters.length > 0) {
      let response = `Yaar, pricing depends on theater! 😊 Here's what we have:\n\n`;
      theaters.slice(0, 4).forEach((theater: any) => {
        response += `• ${theater.name}: ₹${theater.price}\n`;
      });
      response += `\nPlus decoration, food, and other services extra hai. Konse theater mein interest hai?`;
      return response;
    }
  }
  
  // Services queries
  if (lowerMessage.match(/(service|food|decoration|gift|cake|add.on|extra)/)) {
    const services = memory.services?.services || [];
    const gifts = memory.gifts?.gifts || [];
    
    if (services.length > 0 || gifts.length > 0) {
      let response = `Arre yaar, humare paas bohot saare services hain! 😊\n\n`;
      
      if (services.length > 0) {
        response += `Services:\n`;
        services.slice(0, 3).forEach((service: any) => {
          response += `• ${service.name}: ${service.description}\n`;
        });
      }
      
      if (gifts.length > 0) {
        response += `\nGifts & Add-ons:\n`;
        gifts.slice(0, 3).forEach((gift: any) => {
          response += `• ${gift.name}: ₹${gift.price}\n`;
        });
      }
      
      response += `\nKya chahiye tumhe? Tell me! 🎁`;
      return response;
    }
  }
  
  // Default friendly response
  const defaultResponses = [
    "Hmm, interesting! 😊 Kya aap thoda aur detail de sakte ho? Main better help kar sakunga!",
    "Arre yaar, mujhe samajh nahi aaya! 😅 Kya aap theater booking, pricing, ya kisi aur cheez ke baare mein puch rahe ho?",
    "Waah, tell me more na! 😊 Main theater booking, occasions, ya services ke baare mein help kar sakta hun!",
    "Oho, interesting! 😄 Kya aap booking karna chahte ho? Ya phir koi question hai?",
    "Yaar, main help karne ke liye ready hun! 😊 Theater booking, pricing, occasions - kuch bhi pucho!"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Stream response character by character (simulates typing)
export function* streamResponse(response: string): Generator<string, void, unknown> {
  const words = response.split(' ');
  let currentText = '';
  
  for (const word of words) {
    currentText += (currentText ? ' ' : '') + word;
    yield currentText;
    
    // Small delay simulation (can be adjusted)
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      // Longer pause after sentences
    }
  }
}

