import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
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
    
    // Fetch admin credentials from admin collection
    const admin = await db.collection('admin').findOne({});
    
    await client.close();
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    // Verify password
    if (admin.password === password) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        admin: {
          id: admin._id,
          username: admin.username || 'admin'
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
