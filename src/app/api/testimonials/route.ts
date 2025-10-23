import { NextResponse } from 'next/server';
import database from '@/lib/db-connect';

export async function GET() {
  try {
    console.log('📝 Fetching testimonials from database...');
    
    // Fetch feedback from database
    const result = await (database as any).getFeedbackList();
    
    if (result.success && result.feedback && result.feedback.length > 0) {
      console.log('✅ Loaded', result.feedback.length, 'testimonials from database');
      
      // Transform feedback data to testimonial format
      const testimonials = result.feedback.map((feedback: any) => ({
        id: feedback.feedbackId || feedback._id,
        name: feedback.name,
        text: feedback.message, // Map message to text for testimonials
        rating: feedback.rating,
        image: feedback.avatar, // Map avatar to image for testimonials
        position: feedback.socialPlatform ? `${feedback.socialPlatform} User` : 'Customer', // Map social platform to position
        email: feedback.email,
        socialHandle: feedback.socialHandle,
        submittedAt: feedback.submittedAt,
        // Additional fields for compatibility
        message: feedback.message,
        feedback: feedback.message,
        avatar: feedback.avatar,
        date: feedback.submittedAt ? new Date(feedback.submittedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      
      return NextResponse.json({
        success: true,
        testimonials: testimonials,
        count: testimonials.length
      });
    } else {
      console.warn('⚠️ No testimonials found in database');
      
      return NextResponse.json({
        success: false,
        testimonials: [],
        count: 0,
        error: 'No testimonials found in database'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching testimonials:', error);
    
    return NextResponse.json({
      success: false,
      testimonials: [],
      count: 0,
      error: 'Failed to fetch testimonials from database'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, message, rating, avatar, email, phone, socialHandle, socialPlatform } = body;
    
    // Validate required fields
    if (!name || !message || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, message, rating' },
        { status: 400 }
      );
    }
    
    // Prepare feedback data for database
    const feedbackData = {
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : `${name.toLowerCase().replace(/\s+/g, '')}@feelmetown.com`,
      phone: phone ? phone.trim() : null,
      avatar: avatar || '/images/Avatars/FMT.svg',
      avatarType: 'random',
      socialHandle: socialHandle ? socialHandle.trim() : null,
      socialPlatform: socialPlatform || null,
      message: message.trim(),
      rating: parseInt(rating),
      submittedAt: new Date(),
      status: 'active',
      isTestimonial: true, // Mark as testimonial
      feedbackId: Date.now()
    };
    
    // Save to feedback database
    const result = await (database as any).saveFeedbackWithLimit(feedbackData);
    
    if (result.success) {
      console.log('✅ Testimonial saved to feedback database:', result.feedbackId);
      
      return NextResponse.json({
        success: true,
        testimonial: {
          id: result.feedbackId,
          name: feedbackData.name,
          avatar: feedbackData.avatar,
          rating: feedbackData.rating,
          message: feedbackData.message,
          feedback: feedbackData.message,
          date: new Date().toISOString().split('T')[0]
        },
        message: 'Testimonial added successfully to database'
      });
    } else {
      console.error('❌ Failed to save testimonial:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error adding testimonial:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add testimonial' 
      },
      { status: 500 }
    );
  }
}
