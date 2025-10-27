// Test admin cancel reasons page and functionality
const testAdminCancelReasons = async () => {
  try {
    console.log('🔄 Testing admin cancel reasons functionality...');
    
    // Test 1: Get current cancel reasons
    console.log('\n📊 Step 1: Getting current cancel reasons...');
    const getResponse = await fetch('http://localhost:3000/api/cancel-reasons');
    const getResult = await getResponse.json();
    console.log('Current cancel reasons:', getResult);
    
    // Test 2: Add a new cancel reason from admin
    console.log('\n📊 Step 2: Adding new cancel reason (Admin)...');
    const addResponse = await fetch('http://localhost:3000/api/cancel-reasons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Admin Test - Medical Emergency' })
    });
    
    const addResult = await addResponse.json();
    console.log('Add result:', addResult);
    
    // Test 3: Try to add duplicate reason
    console.log('\n📊 Step 3: Testing duplicate prevention...');
    const duplicateResponse = await fetch('http://localhost:3000/api/cancel-reasons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Admin Test - Medical Emergency' })
    });
    
    const duplicateResult = await duplicateResponse.json();
    console.log('Duplicate test result:', duplicateResult);
    
    // Test 4: Get updated list
    console.log('\n📊 Step 4: Getting updated list...');
    const updatedResponse = await fetch('http://localhost:3000/api/cancel-reasons');
    const updatedResult = await updatedResponse.json();
    console.log('Updated list:', updatedResult);
    
    // Test 5: Remove the test reason
    console.log('\n📊 Step 5: Removing test reason...');
    const removeResponse = await fetch('http://localhost:3000/api/cancel-reasons', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Admin Test - Medical Emergency' })
    });
    
    const removeResult = await removeResponse.json();
    console.log('Remove result:', removeResult);
    
    // Test 6: Try to remove "Other" (should fail)
    console.log('\n📊 Step 6: Testing "Other" protection...');
    const protectedResponse = await fetch('http://localhost:3000/api/cancel-reasons', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Other' })
    });
    
    const protectedResult = await protectedResponse.json();
    console.log('Protected removal test:', protectedResult);
    
    console.log('\n✅ All admin cancel reasons tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testAdminCancelReasons();
