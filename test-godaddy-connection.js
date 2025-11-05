// Simple test script to check GoDaddy SQL connection
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing GoDaddy SQL Connection...\n');
  
  const config = {
    host: '72.167.70.199',
    user: 'feelme-town-cybershoora',
    password: 'feelmetown@123',
    database: 'feelme-town-by-cybershooora',
    port: 3306,
    connectTimeout: 10000
  };
  
  console.log('📋 Connection Config:');
  console.log('   Host:', config.host);
  console.log('   User:', config.user);
  console.log('   Database:', config.database);
  console.log('   Port:', config.port);
  console.log('   Password:', config.password ? '***SET***' : 'NOT SET');
  console.log('\n⏳ Connecting...\n');
  
  try {
    // Create connection
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!\n');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time');
    console.log('✅ Test query executed successfully!');
    console.log('📊 Query Result:', rows[0]);
    
    // Get database info
    const [dbInfo] = await connection.execute('SELECT DATABASE() as db_name, VERSION() as mysql_version');
    console.log('📊 Database Info:', dbInfo[0]);
    console.log('\n');
    
    // Get tables list
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Existing Tables in Database:');
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found - database is empty');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
      });
    }
    console.log('\n');
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    console.log('\n🎉 GoDaddy SQL Database is working perfectly!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error Code:', error.code);
    console.error('Error Number:', error.errno);
    console.error('Error Message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.log('\n');
    
    console.log('🔧 Troubleshooting Steps:');
    console.log('1. Check if Remote MySQL is enabled in cPanel');
    console.log('2. Add your IP to Remote MySQL Access Hosts in cPanel');
    console.log('3. Verify database credentials are correct');
    console.log('4. Check if database user has proper permissions');
    console.log('5. Ensure MySQL port 3306 is accessible');
    console.log('\n');
    
    return false;
  }
}

// Run test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
