// Test script to fetch data from database and populate AI Memory
const https = require('https');
const http = require('http');

function testAIMemoryUpdate() {
  console.log('🧠 Testing AI Memory update from database...');
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai-memory/update',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Success:', JSON.parse(data));
      } else {
        console.log('❌ Error:', res.statusCode, data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Network Error:', error.message);
  });
  
  req.write(postData);
  req.end();
}

// Run the test
testAIMemoryUpdate();
