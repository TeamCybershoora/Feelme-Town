import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
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
    
    // Find admin and verify current password
    const admin = await db.collection('admin').findOne({});
    
    if (!admin) {
      await client.close();
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (admin.password !== currentPassword) {
      await client.close();
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    await db.collection('admin').updateOne(
      { _id: admin._id },
      { 
        $set: { 
          password: newPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
