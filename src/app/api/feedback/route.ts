import { NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

// POST /api/feedback - Submit feedback to database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, avatar, socialHandle, socialPlatform, message, rating } = body;

    console.log('📝 Feedback submission received:', { name, email, phone, socialPlatform, socialHandle, rating });

    // Validate required fields
    if (!name || !email || !message || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, message, rating' },
        { status: 400 }
      );
    }

    let cloudinaryImageUrl = null;

    // Handle Cloudinary image upload if avatar is a file/blob
    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:')) {
      try {
        console.log('📸 Uploading avatar to Cloudinary...');
        
        // Upload to Cloudinary
        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/duscymcfc/image/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: avatar,
            upload_preset: 'Feelme-Town',
            folder: 'feelmetown/testimonials'
          })
        });

        if (cloudinaryResponse.ok) {
          const cloudinaryData = await cloudinaryResponse.json();
          cloudinaryImageUrl = cloudinaryData.secure_url;
          console.log('✅ Avatar uploaded to Cloudinary:', cloudinaryImageUrl);
        } else {
          console.error('❌ Cloudinary upload failed:', await cloudinaryResponse.text());
        }
      } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
      }
    }

    // Determine avatar type and path
    let finalAvatarPath = avatar;
    let avatarType = 'random'; // default for random avatars
    
    if (cloudinaryImageUrl) {
      finalAvatarPath = cloudinaryImageUrl;
      avatarType = 'uploaded';
    } else if (avatar && avatar.includes('/images/Avatars/')) {
      // Random avatar from male/female folders
      finalAvatarPath = avatar;
      avatarType = avatar.includes('/male/') ? 'random_male' : 'random_female';
    }

    console.log(`📸 Avatar details:`, { 
      originalAvatar: avatar, 
      cloudinaryUrl: cloudinaryImageUrl, 
      finalPath: finalAvatarPath, 
      type: avatarType 
    });

    // Prepare feedback data
    const feedbackData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      avatar: finalAvatarPath, // Either Cloudinary URL or /images/Avatars/male|female/avatarX.svg
      avatarType: avatarType, // 'uploaded', 'random_male', or 'random_female'
      socialHandle: socialHandle ? socialHandle.trim() : null,
      socialPlatform: socialPlatform || null,
      message: message.trim(),
      rating: parseInt(rating),
      submittedAt: new Date(),
      status: 'active', // Active feedback
      isTestimonial: cloudinaryImageUrl ? true : false, // Auto-promote if has custom image
      feedbackId: Date.now() // Unique ID
    };

    // Save to Feedback collection with maximum 20 limit
    const result = await database.saveFeedbackWithLimit(feedbackData);

    if (result.success) {
      console.log('✅ Feedback saved successfully:', result.feedbackId);
      
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully! Thank you for your valuable feedback.',
        feedbackId: result.feedbackId,
        cloudinaryUrl: cloudinaryImageUrl
      });
    } else {
      console.error('❌ Failed to save feedback:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get all feedback (for admin)
export async function GET() {
  try {
    const result = await database.getFeedbackList();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        feedback: result.feedback,
        total: result.total
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get Feedback API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
