import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

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
    
    // Fetch admin profile from database
    const admin = await db.collection('admin').findOne({});
    
    await client.close();
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    // Return admin profile without password
    const { password, ...adminProfile } = admin;

    return NextResponse.json({
      success: true,
      admin: adminProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
