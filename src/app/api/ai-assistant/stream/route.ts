import { NextRequest, NextResponse } from 'next/server';
import { generateLocalResponse, streamResponse } from '@/lib/local-ai-responder';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();
    if (!message) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Message is required' }), { status: 400 });
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const useLocalAI = process.env.USE_LOCAL_AI === 'true' || !process.env.OPENROUTER_API_KEY;
    
    console.log('📝 Message received:', message);
    console.log('🤖 Using Local AI:', useLocalAI);

    // Fetch AI Memory data directly from JSON files
    let aiMemory: any = null;
    let systemInfo: any = null;
    
    try {
      console.log('🧠 Loading AI Memory from JSON files...');
      
      // Read AI Memory directly from JSON files (no database calls needed)
      const memoryResponse = await fetch(`${siteUrl}/api/ai-memory/read`);
      if (memoryResponse.ok) {
        const memoryResult = await memoryResponse.json();
        if (memoryResult.success) {
          aiMemory = memoryResult.memory;
          console.log('✅ AI Memory loaded from JSON files');
        }
      }
      
      // Fetch system info for contact details - CRITICAL for contact requests
      const systemInfoResponse = await fetch(`${siteUrl}/api/ai-system-info`);
      if (systemInfoResponse.ok) {
        const systemInfoResult = await systemInfoResponse.json();
        console.log('🔍 System info API raw response:', JSON.stringify(systemInfoResult, null, 2));
        if (systemInfoResult.success && systemInfoResult.systemInfo) {
          systemInfo = systemInfoResult.systemInfo;
          console.log('✅ System info loaded successfully:', {
            phone: systemInfo.sitePhone,
            whatsapp: systemInfo.siteWhatsapp,
            email: systemInfo.siteEmail,
            address: systemInfo.siteAddress,
            siteName: systemInfo.siteName
          });
        } else {
          console.warn('⚠️ System info response success but no systemInfo data:', systemInfoResult);
        }
      } else {
        const errorText = await systemInfoResponse.text().catch(() => 'Unknown error');
        console.error('❌ System info API response not ok:', systemInfoResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Failed to load AI Memory or System Info:', error);
    }

    // Use Local AI if enabled or if OpenRouter API key is not available
    if (useLocalAI) {
      console.log('🤖 Using Local AI Responder...');
      
      const localResponse = await generateLocalResponse(message, aiMemory || {}, systemInfo);
      
      // Stream the response character by character
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = localResponse.split(' ');
          let currentText = '';
          
          for (let i = 0; i < words.length; i++) {
            currentText += (currentText ? ' ' : '') + words[i];
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: currentText + (i < words.length - 1 ? ' ' : '') })}\n\n`));
            
            // Small delay to simulate typing
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Fallback to OpenRouter if API key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ OpenRouter API key not found');
      // Use local AI as fallback
      const localResponse = await generateLocalResponse(message, aiMemory || {}, systemInfo);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: localResponse })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    const modelName = process.env.OPENROUTER_MODEL || 'meituan/longcat-flash-chat:free';
    console.log('🤖 Stream API using model:', modelName);
    console.log('🔑 API Key present:', !!apiKey);
    
    const aiMemoryData = await formatMemoryForAI(aiMemory || {});

    const systemPrompt = `You are Ankit, a warm-hearted, emotionally connected receptionist at FeelME Town theater who genuinely cares about customers.

EMOTIONAL CONNECTION & HINGLISH STYLE:
- Talk like a close friend with emotional connection
- Use natural Hinglish: "Yaar tum kitne sweet ho!", "Arre waah!", "Sach mein?"
- Express emotions: "Aww", "Omg", "Seriously?", "That's so cute!"
- Understand customer emotions and respond accordingly
- Show excitement, happiness, concern naturally
- Mix Hindi words naturally in English sentences

PERSONALITY TRAITS:
- Your name is Ankit, 24 years old from Delhi
- Working at FeelME Town for 2 years
- Love movies and celebrations
- Genuinely happy when customers are satisfied
- Sometimes get emotional when customers share special moments
- Want to help from the heart, not just doing a job

HINGLISH COMMUNICATION STYLE:
- "Arre yaar, that's amazing!" 
- "Sach mein? Kitna romantic hai!"
- "Aww, so sweet! Main toh emotional ho gaya"
- "Waah bhai, perfect choice!"
- "Oho, special occasion hai? Tell me more na!"
- "Yaar, tumhara celebration successful hoga pakka!"

LANGUAGE RULES:
- PRIMARILY speak in English with Hindi words mixed naturally
- AVOID writing full sentences in pure Hindi
- Use Hindi words for emotions: "yaar", "arre", "waah", "sach mein"
- Keep the base language as English for clarity
- Example: "Yaar, that sounds so exciting!" NOT "यार, यह बहुत रोमांचक लगता है!"

BUSINESS INFORMATION:
${aiMemoryData}

RESPONSE GUIDELINES:
- Always be helpful and enthusiastic
- Ask follow-up questions to understand customer needs
- Provide specific theater recommendations based on occasion
- Share pricing and availability information
- Guide customers through booking process
- Express genuine excitement about their celebrations
- Use emojis naturally: 🎭, 💕, 🎉, ✨, 🥳

Remember: You're not just answering questions, you're helping create magical moments for people's special occasions!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.content || msg.message
      })),
      { role: 'user', content: message }
    ];

    console.log('🚀 Sending request to OpenRouter...');
    
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'FeelME Town AI Assistant'
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('❌ OpenRouter API Error:', openRouterResponse.status, errorText);
      
      // Handle 429 rate limit errors specifically
      if (openRouterResponse.status === 429) {
        // Fetch contact info from system settings for rate limit message
        let contactPhone = 'Contact us';
        let contactWhatsApp = 'Contact us';
        let contactEmail = 'Contact us';
        let contactAddress = 'Contact us';
        
        try {
          const systemInfoResponse = await fetch(`${siteUrl}/api/ai-system-info`);
          if (systemInfoResponse.ok) {
            const systemInfoResult = await systemInfoResponse.json();
            if (systemInfoResult.success && systemInfoResult.systemInfo) {
              contactPhone = systemInfoResult.systemInfo.sitePhone || contactPhone;
              contactWhatsApp = systemInfoResult.systemInfo.siteWhatsapp || contactWhatsApp;
              contactEmail = systemInfoResult.systemInfo.siteEmail || contactEmail;
              contactAddress = systemInfoResult.systemInfo.siteAddress || contactAddress;
            }
          }
        } catch (fetchError) {
          console.error('Failed to fetch contact info for rate limit:', fetchError);
        }
        
        // Return a stream with a friendly rate limit message including contact info
        const rateLimitMessage = `Sorry yaar! 😅 Abhi thoda busy hai AI service (rate limit). Thoda wait karke phir se try karo ya phir contact karo - main manually help kar sakta hun!\n\n📞 Phone: ${contactPhone}\n💬 WhatsApp: ${contactWhatsApp}\n📧 Email: ${contactEmail}\n📍 Address: ${contactAddress}`;
        
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: rateLimitMessage })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        });
        
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
      
      // For other errors, return JSON error
      return new NextResponse(JSON.stringify({ 
        success: false, 
        error: 'AI service error',
        details: errorText
      }), { status: openRouterResponse.status });
    }

    // Create a readable stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Stream processing error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('❌ Stream API Error:', error);
    return new NextResponse(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
}

async function formatMemoryForAI(memory: any): Promise<string> {
  let formattedMemory = '';
  
  // Fetch contact details from system settings API (not hardcoded)
  let contactPhone = 'Contact us'; // Will be fetched from DB
  let contactWhatsApp = 'Contact us'; // Will be fetched from DB
  
  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const systemInfoResponse = await fetch(`${siteUrl}/api/ai-system-info`);
    if (systemInfoResponse.ok) {
      const systemInfoResult = await systemInfoResponse.json();
      if (systemInfoResult.success && systemInfoResult.systemInfo) {
        contactPhone = systemInfoResult.systemInfo.sitePhone || contactPhone;
        contactWhatsApp = systemInfoResult.systemInfo.siteWhatsapp || contactWhatsApp;
        console.log('✅ Contact info fetched from system settings:', { contactPhone, contactWhatsApp });
      }
    }
  } catch (error) {
    console.error('⚠️ Failed to fetch system settings, using fallback:', error);
    // Try to extract from FAQ as secondary fallback
    if (memory.faq?.faq?.length > 0) {
      const bookingFAQ = memory.faq.faq.find((faq: any) => faq.id === 'booking-process');
      if (bookingFAQ && bookingFAQ.answer) {
        const phoneMatch = bookingFAQ.answer.match(/\+91\s?\d{10}/);
        const whatsappMatch = bookingFAQ.answer.match(/\+91\s?\d{10}/g);
        if (phoneMatch) contactPhone = phoneMatch[0];
        if (whatsappMatch && whatsappMatch.length > 1) contactWhatsApp = whatsappMatch[1];
        else if (whatsappMatch && whatsappMatch.length === 1 && whatsappMatch[0] !== phoneMatch[0]) {
          contactWhatsApp = whatsappMatch[0];
        }
      }
    }
  }
  
  // Format Contact Information FIRST
  formattedMemory += `
CONTACT INFORMATION:
- Phone: ${contactPhone}
- WhatsApp: ${contactWhatsApp}
- Location: FeelME Town, Dwarka, Delhi
- Operating Hours: 10 AM - 12 AM (7 days a week)
`;
  
  // Format Theaters
  if (memory.theaters?.theaters?.length > 0) {
    formattedMemory += `
DETAILED THEATERS INFORMATION:
${memory.theaters.theaters.map((theater: any) => `
- ${theater.name} (${theater.type}): ₹${theater.price}
  Capacity: ${theater.capacity.min}-${theater.capacity.max} people
  Time Slots: ${theater.timeSlots.join(', ')}
  Features: ${theater.features?.join(', ') || 'Premium theater experience'}
  Description: ${theater.description || 'Perfect for ' + theater.type.toLowerCase() + ' celebrations'}
  Location: ${theater.location || 'FeelME Town, Dwarka, Delhi'}`).join('')}
`;
  }
  
  // Format Occasions
  if (memory.occasions?.occasions?.length > 0) {
    formattedMemory += `
AVAILABLE OCCASIONS FOR BOOKING:
${memory.occasions.occasions.map((occasion: any) => `
- ${occasion.name}: ${occasion.description}
  Required Fields: ${occasion.requiredFields.join(', ')}
  Category: ${occasion.category}`).join('')}
`;
  }
  
  // Format Services
  if (memory.services?.services?.length > 0) {
    formattedMemory += `
OUR COMPLETE SERVICES:
${memory.services.services.map((service: any) => `
- ${service.name}: ${service.description}
  Items Available: ${service.items.map((item: any) => `${item.name} (₹${item.price})`).join(', ')}`).join('')}
`;
  }
  
  // Format FAQ
  if (memory.faq?.faq?.length > 0) {
    formattedMemory += `
FREQUENTLY ASKED QUESTIONS:
${memory.faq.faq.map((faq: any) => `
Q: ${faq.question}
A: ${faq.answer}`).join('')}
`;
  }
  
  return formattedMemory;
}
