// Test script to check only theaters API
const http = require('http');

function testTheatersAPI() {
  console.log('🏛️ Testing theaters API specifically...');
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/theaters',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('✅ Theaters API Response:', result);
        console.log('📊 Number of theaters:', result.theaters?.length || 0);
      } else {
        console.log('❌ Error:', res.statusCode, data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Network Error:', error.message);
  });
  
  req.end();
}

testTheatersAPI();
