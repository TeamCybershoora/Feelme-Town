// Test database to blob pricing sync
const testDBSync = async () => {
  try {
    console.log('🔄 Testing database to blob sync...');
    
    // First check current state
    console.log('\n📊 Step 1: Checking current pricing state...');
    const checkResponse = await fetch('http://localhost:3000/api/admin/sync-pricing-from-db');
    const checkResult = await checkResponse.json();
    console.log('Current state:', checkResult);
    
    // Force sync from database
    console.log('\n🔄 Step 2: Force syncing from database...');
    const syncResponse = await fetch('http://localhost:3000/api/admin/sync-pricing-from-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const syncResult = await syncResponse.json();
    console.log('Sync result:', syncResult);
    
    // Verify by getting pricing
    console.log('\n✅ Step 3: Verifying pricing after sync...');
    const verifyResponse = await fetch('http://localhost:3000/api/pricing');
    const verifyResult = await verifyResponse.json();
    console.log('Final pricing:', verifyResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testDBSync();
