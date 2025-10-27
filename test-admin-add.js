// Test admin cancel reason add functionality
const testAdminAdd = async () => {
  try {
    console.log('🔄 Testing admin cancel reason add...');
    
    // Get current list
    console.log('\n📊 Step 1: Current cancel reasons...');
    const getResponse = await fetch('http://localhost:3000/api/cancel-reasons');
    const getResult = await getResponse.json();
    console.log('Current reasons:', getResult.reasons);
    
    // Add new reason from admin
    console.log('\n📊 Step 2: Adding new reason from admin...');
    const addResponse = await fetch('http://localhost:3000/api/cancel-reasons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Admin Test - Server Issue' })
    });
    
    const addResult = await addResponse.json();
    console.log('Add result:', addResult);
    
    // Verify in blob storage
    console.log('\n📊 Step 3: Verifying updated list...');
    const verifyResponse = await fetch('http://localhost:3000/api/cancel-reasons');
    const verifyResult = await verifyResponse.json();
    console.log('Updated reasons:', verifyResult.reasons);
    
    // Check if it's in the right position (before "Other")
    const otherIndex = verifyResult.reasons.indexOf('Other');
    const newReasonIndex = verifyResult.reasons.indexOf('Admin Test - Server Issue');
    console.log(`\n✅ "Other" is at position: ${otherIndex}`);
    console.log(`✅ New reason is at position: ${newReasonIndex}`);
    console.log(`✅ Correctly inserted before "Other": ${newReasonIndex < otherIndex}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testAdminAdd();
