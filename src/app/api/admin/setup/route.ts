import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const connectionResult = await database.connect();
    
    if (!connectionResult.success) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get MongoDB client and database
    const { MongoClient } = await import('mongodb');
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
    const DB_NAME = 'feelmetown';
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admin').findOne({});
    
    if (existingAdmin) {
      // Update existing admin
      await db.collection('admin').updateOne(
        { _id: existingAdmin._id },
        { 
          $set: { 
            username, 
            password,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      // Create new admin
      await db.collection('admin').insertOne({
        username,
        password,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully'
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if admin exists
export async function GET() {
  try {
    // Connect to database
    const connectionResult = await database.connect();
    
    if (!connectionResult.success) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get MongoDB client and database
    const { MongoClient } = await import('mongodb');
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://teamcybershoora_db_user:zO9NCrGjjQG2MsVv@feelmetown.e1vu4ht.mongodb.net/?retryWrites=true&w=majority&appName=feelmetown";
    const DB_NAME = 'feelmetown';
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    const admin = await db.collection('admin').findOne({});
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      exists: !!admin,
      admin: admin ? { username: admin.username } : null
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
