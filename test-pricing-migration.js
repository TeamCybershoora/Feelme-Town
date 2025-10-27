// Test pricing migration to blob storage
const testPricingMigration = async () => {
  try {
    console.log('🔄 Testing pricing migration...');
    
    const response = await fetch('http://localhost:3000/api/admin/migrate-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('📊 Migration result:', result);
    
    // Test GET pricing after migration
    const getResponse = await fetch('http://localhost:3000/api/pricing');
    const getPricing = await getResponse.json();
    console.log('📊 GET pricing result:', getPricing);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testPricingMigration();
