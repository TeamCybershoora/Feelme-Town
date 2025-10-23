// Test AI Memory Integration in AI Assistant
const http = require('http');

async function testAIMemoryIntegration() {
  console.log('🧠 Testing AI Memory Integration in AI Assistant\n');
  
  try {
    // 1. First check AI Memory data
    console.log('1️⃣ Checking AI Memory Data...');
    const memoryResponse = await makeRequest('/api/ai-memory/read');
    
    if (memoryResponse.success) {
      console.log('✅ AI Memory Status: Working');
      console.log('📊 Data Summary:');
      console.log(`   - Theaters: ${memoryResponse.totalItems?.theaters || 0}`);
      console.log(`   - Occasions: ${memoryResponse.totalItems?.occasions || 0}`);
      console.log(`   - Services: ${memoryResponse.totalItems?.services || 0}`);
      console.log(`   - FAQ: ${memoryResponse.totalItems?.faq || 0}`);
      
      // Show sample theater data
      if (memoryResponse.memory?.theaters?.theaters?.length > 0) {
        const firstTheater = memoryResponse.memory.theaters.theaters[0];
        console.log(`\n📋 Sample Theater Data:`);
        console.log(`   - Name: ${firstTheater.name}`);
        console.log(`   - Price: ₹${firstTheater.price}`);
        console.log(`   - Capacity: ${firstTheater.capacity.min}-${firstTheater.capacity.max}`);
        console.log(`   - Time Slots: ${firstTheater.timeSlots.slice(0, 2).join(', ')}...`);
      }
    } else {
      console.log('❌ AI Memory Status: Failed');
    }
    
    // 2. Test AI Assistant with theater query
    console.log('\n2️⃣ Testing AI Assistant Response...');
    const aiResponse = await makeRequest('/api/ai-assistant/stream', 'POST', {
      message: 'Theater booking karna hai couples ke liye, kya options hain?',
      conversationHistory: []
    });
    
    console.log('🤖 AI Response Preview:');
    if (aiResponse) {
      // For streaming response, we'll get chunks
      console.log('   Response received (streaming format)');
      console.log('   Check if it mentions real theater names and prices');
    }
    
    // 3. Test if AI mentions real data
    console.log('\n3️⃣ Testing Data Usage...');
    console.log('Expected AI to mention:');
    console.log('   - EROS (COUPLES) theater with ₹1399 price');
    console.log('   - Real time slots from database');
    console.log('   - Actual capacity information');
    console.log('   - Contact: +91 9870691784');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          if (path.includes('stream')) {
            // For streaming endpoints, return raw response
            resolve(responseData);
          } else {
            resolve(JSON.parse(responseData));
          }
        } catch (error) {
          resolve({ error: 'Failed to parse response', raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

testAIMemoryIntegration();
