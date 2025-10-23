// Test script to check database connection
const database = require('./src/lib/db-connect.ts');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test theaters
    console.log('🏛️ Testing getAllTheaters...');
    const theaters = await database.default.getAllTheaters();
    console.log('Theaters result:', theaters);
    
    // Test occasions
    console.log('🎉 Testing getAllOccasions...');
    const occasions = await database.default.getAllOccasions();
    console.log('Occasions result:', occasions);
    
    // Test services
    console.log('⚙️ Testing getAllServices...');
    const services = await database.default.getAllServices();
    console.log('Services result:', services);
    
    // Test FAQs
    console.log('❓ Testing getAllFAQs...');
    const faqs = await database.default.getAllFAQs();
    console.log('FAQs result:', faqs);
    
  } catch (error) {
    console.error('❌ Database test error:', error);
  }
}

testDatabase();
