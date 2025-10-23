// Test Enhanced AI Assistant with Theater Recommendations and Internet Search
const http = require('http');

const testQueries = [
  "Theater booking karna hai anniversary ke liye",
  "Friends ke saath movie dekhna hai, kya recommend karoge?", 
  "Latest popular movies kya chal rahi hain?",
  "Birthday celebration karna hai, kya ideas hain?",
  "Couples ke liye best theater konsa hai?",
  "Budget mein kya options hain theater ke?"
];

function testAIQuery(query, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n${index + 1}️⃣ Testing Query: "${query}"`);
    console.log('=' .repeat(50));
    
    const postData = JSON.stringify({
      message: query,
      conversationHistory: []
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai-assistant/stream',
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
        console.log('🤖 AI Response:');
        console.log(response);
        console.log('\n' + '─'.repeat(50));
        resolve(response);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('🧠 Testing Enhanced AI Assistant');
  console.log('🎯 Features: Theater Recommendations + Internet Search + Human-like Responses');
  console.log('🕐 Time:', new Date().toLocaleString());
  
  for (let i = 0; i < testQueries.length; i++) {
    try {
      await testAIQuery(testQueries[i], i);
      
      // Wait 2 seconds between queries to avoid overwhelming
      if (i < testQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
    }
  }
  
  console.log('\n✅ All tests completed!');
  console.log('📊 Check the responses above to see:');
  console.log('   - Proper theater recommendations with pricing');
  console.log('   - Human-like conversational style');
  console.log('   - Internet search integration for latest info');
  console.log('   - Complete booking assistance');
}

runAllTests();
