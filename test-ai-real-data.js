// Test AI Assistant with Real Data from AI Memory
const http = require('http');

async function testAIWithRealData() {
  console.log('🤖 Testing AI Assistant with Real Database Data');
  console.log('🎯 Checking: Real theater names, pricing, contact details');
  console.log('=' .repeat(60));
  
  const testQuery = "Theater booking karna hai couples ke liye, pricing aur contact details bhi batao";
  
  console.log(`\n📝 Query: "${testQuery}"`);
  console.log('⏳ Sending request to AI...\n');
  
  const postData = JSON.stringify({
    message: testQuery,
    conversationHistory: []
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai-chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let response = '';
      
      res.on('data', (chunk) => {
        response += chunk.toString();
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          
          console.log('🤖 AI Response:');
          console.log('─'.repeat(60));
          console.log(result.message);
          console.log('─'.repeat(60));
          
          // Check for real data usage
          console.log('\n🔍 Data Analysis:');
          const message = result.message.toLowerCase();
          
          // Check for real theater names
          if (message.includes('eros') && message.includes('couples')) {
            console.log('✅ Uses REAL theater name: EROS (COUPLES)');
          } else {
            console.log('❌ Missing real theater name');
          }
          
          // Check for real pricing
          if (message.includes('₹1399') || message.includes('1399')) {
            console.log('✅ Uses REAL pricing: ₹1399');
          } else {
            console.log('❌ Missing real pricing');
          }
          
          // Check for real contact details
          if (message.includes('9870691784')) {
            console.log('✅ Uses REAL phone: +91 9870691784');
          } else {
            console.log('❌ Missing real phone number');
          }
          
          if (message.includes('9520936655')) {
            console.log('✅ Uses REAL WhatsApp: +91 9520936655');
          } else {
            console.log('❌ Missing real WhatsApp number');
          }
          
          // Check for real time slots
          if (message.includes('09:00') || message.includes('12:30') || message.includes('16:00') || message.includes('19:30')) {
            console.log('✅ Uses REAL time slots from database');
          } else {
            console.log('❌ Missing real time slots');
          }
          
          // Check for old hardcoded data
          if (message.includes('87006 71099') || message.includes('88826 69755')) {
            console.log('❌ Still using OLD hardcoded contact numbers');
          }
          
          console.log('\n✅ Test completed!');
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.log('Raw response:', response);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

testAIWithRealData().catch(console.error);
