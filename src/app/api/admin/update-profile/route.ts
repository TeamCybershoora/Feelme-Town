import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, email, phone } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
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
    
    // Find admin
    const admin = await db.collection('admin').findOne({});
    
    if (!admin) {
      await client.close();
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update admin profile
    await db.collection('admin').updateOne(
      { _id: admin._id },
      { 
        $set: { 
          username,
          fullName: fullName || '',
          email: email || '',
          phone: phone || '',
          updatedAt: new Date()
        } 
      }
    );
    
    // Get updated admin profile
    const updatedAdmin = await db.collection('admin').findOne({ _id: admin._id });
    
    await client.close();

    // Return updated profile without password
    const { password, ...adminProfile } = updatedAdmin as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      admin: adminProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
