// Script to set up admin credentials in the database
// Run this script once to create your admin account

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feelme-town';
const DB_NAME = process.env.DB_NAME || 'feelme-town';

async function setupAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Admin credentials - CHANGE THESE!
    const adminCredentials = {
      username: 'admin',
      password: 'FeelMeTown2024!', // Change this to your desired password
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admin').findOne({});
    
    if (existingAdmin) {
      console.log('Admin already exists. Updating credentials...');
      await db.collection('admin').updateOne(
        { _id: existingAdmin._id },
        { 
          $set: { 
            username: adminCredentials.username,
            password: adminCredentials.password,
            updatedAt: new Date()
          } 
        }
      );
      console.log('Admin credentials updated successfully!');
    } else {
      console.log('Creating new admin account...');
      await db.collection('admin').insertOne(adminCredentials);
      console.log('Admin account created successfully!');
    }
    
    console.log('Admin setup completed!');
    console.log('Username:', adminCredentials.username);
    console.log('Password:', adminCredentials.password);
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await client.close();
  }
}

// Run the setup
setupAdmin();
