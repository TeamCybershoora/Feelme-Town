const { ExportsStorage } = require('./src/lib/exports-storage.ts');

async function testCounters() {
  try {
    console.log('🧪 Testing counter system...');
    
    // Check if counters.json exists
    console.log('📄 Checking counters.json...');
    try {
      const countersJson = await ExportsStorage.readRaw('counters.json');
      console.log('✅ counters.json exists:', !!countersJson);
      console.log('📊 counters.json content:', JSON.stringify(countersJson, null, 2));
    } catch (error) {
      console.log('❌ counters.json error:', error.message);
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/dashboard-stats');
      const data = await response.json();
      console.log('📊 Dashboard stats response:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('❌ Dashboard stats API error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCounters();
