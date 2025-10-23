// AI Memory Scheduler Control Panel
const http = require('http');

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
          resolve(JSON.parse(responseData));
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

async function controlScheduler() {
  console.log('🎛️ AI Memory Scheduler Control Panel\n');
  
  try {
    // 1. Initialize the system
    console.log('1️⃣ Initializing AI Memory System...');
    const startup = await makeRequest('/api/ai-memory/startup');
    console.log('   Result:', startup.success ? '✅ Success' : '❌ Failed');
    if (startup.message) console.log('   Message:', startup.message);
    
    // 2. Check scheduler status
    console.log('\n2️⃣ Checking Scheduler Status...');
    const status = await makeRequest('/api/ai-memory/scheduler', 'POST', { action: 'status' });
    console.log('   Status:', status.status);
    console.log('   Interval:', status.interval);
    if (status.nextUpdate) {
      console.log('   Next Update:', new Date(status.nextUpdate).toLocaleString());
    }
    
    // 3. Show manual controls
    console.log('\n🎮 Manual Controls Available:');
    console.log('   Start Scheduler: node test-scheduler.js start');
    console.log('   Stop Scheduler:  node test-scheduler.js stop');
    console.log('   Check Status:    node test-scheduler.js status');
    console.log('   Manual Update:   node test-scheduler.js update');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function handleCommand(command) {
  try {
    switch (command) {
      case 'start':
        console.log('🚀 Starting Scheduler...');
        const startResult = await makeRequest('/api/ai-memory/scheduler', 'POST', { action: 'start' });
        console.log('Result:', startResult);
        break;
        
      case 'stop':
        console.log('🛑 Stopping Scheduler...');
        const stopResult = await makeRequest('/api/ai-memory/scheduler', 'POST', { action: 'stop' });
        console.log('Result:', stopResult);
        break;
        
      case 'status':
        console.log('📊 Checking Status...');
        const statusResult = await makeRequest('/api/ai-memory/scheduler', 'POST', { action: 'status' });
        console.log('Result:', statusResult);
        break;
        
      case 'update':
        console.log('🔄 Manual Update...');
        const updateResult = await makeRequest('/api/ai-memory/update', 'POST');
        console.log('Result:', updateResult);
        break;
        
      default:
        await controlScheduler();
    }
  } catch (error) {
    console.error('❌ Command Error:', error.message);
  }
}

// Handle command line arguments
const command = process.argv[2];
handleCommand(command);
