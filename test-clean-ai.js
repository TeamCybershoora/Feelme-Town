// Test Clean AI System (No Static Data)
const http = require('http');

const testQueries = [
  "Theater booking karna hai couples ke liye",
  "Anniversary celebration karna hai, kya options hain?",
  "Friends ke saath movie dekhna hai, pricing kya hai?",
  "Contact details kya hain FeelMe Town ke?"
];

function testAIQuery(query, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n${index + 1}️⃣ Testing: "${query}"`);
    console.log('=' .repeat(60));
    
    const postData = JSON.stringify({
      message: query,
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
    
    const req = http.request(options, (res) => {
      let response = '';
      
      res.on('data', (chunk) => {
        response += chunk.toString();
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(response);
          console.log('🤖 AI Response:');
          console.log(result.message);
          
          // Check for dynamic data usage
          console.log('\n🔍 Analysis:');
          const message = result.message.toLowerCase();
          
          if (message.includes('₹1399') || message.includes('₹1500') || message.includes('₹1499')) {
            console.log('✅ Uses REAL database pricing');
          } else {
            console.log('❌ No real pricing mentioned');
          }
          
          if (message.includes('eros') || message.includes('philia') || message.includes('lovbe')) {
            console.log('✅ Uses REAL theater names from database');
          } else {
            console.log('❌ No real theater names mentioned');
          }
          
          if (message.includes('+91 9870691784') || message.includes('+91 9520936655')) {
            console.log('✅ Uses REAL contact details from database');
          } else if (message.includes('+91 87006 71099')) {
            console.log('❌ Still using OLD hardcoded contact');
          } else {
            console.log('⚠️ No contact details mentioned');
          }
          
          console.log('\n' + '─'.repeat(60));
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

async function runCleanAITest() {
  console.log('🧹 Testing CLEAN AI System (No Static Data)');
  console.log('🎯 Checking: Database-only responses, no hardcoded info');
  console.log('🕐 Time:', new Date().toLocaleString());
  
  for (let i = 0; i < testQueries.length; i++) {
    try {
      await testAIQuery(testQueries[i], i);
      
      // Wait 2 seconds between queries
      if (i < testQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
    }
  }
  
  console.log('\n✅ Clean AI Test completed!');
  console.log('📊 Expected Results:');
  console.log('   ✅ Real theater names: EROS, PHILIA, Lovbe');
  console.log('   ✅ Real pricing: ₹1399, ₹1500, ₹1499');
  console.log('   ✅ Real contact: +91 9870691784, +91 9520936655');
  console.log('   ❌ No hardcoded data should appear');
}

runCleanAITest();
