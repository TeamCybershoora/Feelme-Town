// Email Service for FeelME Town
// Professional email templates like Netflix

import nodemailer from 'nodemailer';

interface BookingData {
  id: string;
  name: string;
  email: string;
  phone: string;
  theaterName: string;
  date: string;
  time: string;
  occasion: string;
  numberOfPeople: number;
  totalAmount?: number;
}

// Email configuration
const EMAIL_CONFIG = {
  // Using Gmail SMTP (you can change this to your email provider)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'feelmetown@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Email templates
const emailTemplates = {
  // Booking completed successfully
  bookingComplete: (bookingData: BookingData) => ({
    subject: '🎬 Booking Confirmed - FeelME Town | Premium Entertainment',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed - FeelME Town</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .email-wrapper { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 40px 20px; 
            min-height: 100vh;
          }
          .container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); 
            padding: 50px 30px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo { 
            color: white; 
            font-size: 36px; 
            font-weight: 800; 
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
          }
          .tagline { 
            color: rgba(255,255,255,0.9); 
            font-size: 18px; 
            font-weight: 300;
            position: relative;
            z-index: 1;
          }

          /* Brand logo above heading */
          .brand-logo {
            width: 120px;
            height: auto;
            display: block;
            margin: 0 auto 12px;
            position: relative; /* ensure it sits above overlay */
            z-index: 1;
          }

          @media (max-width: 600px) {
            .brand-logo { width: 7rem; }
          }
          .success-badge {
            background: linear-gradient(45deg, #00d4aa, #00b894);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin: 20px auto;
            box-shadow: 0 4px 15px rgba(0,212,170,0.3);
          }
          .content { 
            padding: 50px 40px; 
            background: white;
          }
          .greeting {
            text-align: center;
            margin-bottom: 40px;
          }
          .greeting h1 {
            color: #1a1a2e;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .greeting p {
            color: #666;
            font-size: 18px;
            line-height: 1.6;
          }
          .booking-card { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 35px; 
            border-radius: 20px; 
            margin: 30px 0;
            border: 1px solid #e9ecef;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          .booking-header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
          }
          .booking-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 24px;
          }
          .booking-title {
            color: #1a1a2e;
            font-size: 24px;
            font-weight: 700;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 25px;
          }
          .detail-item {
            background: white;
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #e9ecef; /* subtle card border */
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          }
          .detail-label {
            display: inline-block;
            font-weight: 700;
            color: #fff;
            font-size: 14px;
            text-transform: none; /* match Title Case from reference */
            letter-spacing: 0.3px;
            margin-bottom: 10px;
            padding: 8px 18px;
            border-radius: 9999px; /* full pill */
            background: linear-gradient(135deg, #4b00cc, #5b3df4);
            box-shadow: 0 6px 18px rgba(91,61,244,0.35);
          }
          .detail-value {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.2;
            background: linear-gradient(135deg, #6a5ae0, #7a56ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent; /* gradient text */
          }
          .total-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 15px 40px rgba(102,126,234,0.3);
          }
          .total-label {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .total-amount {
            font-size: 36px;
            font-weight: 800;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          .cta-section {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 18px 40px; 
            text-decoration: none; 
            border-radius: 50px; 
            display: inline-block; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(102,126,234,0.3);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(102,126,234,0.4);
          }
          .footer { 
            background: #1a1a2e; 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .footer-logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .footer-tagline {
            color: rgba(255,255,255,0.8);
            margin-bottom: 30px;
          }
          .social-links { 
            margin: 30px 0; 
          }
          .social-links a { 
            color: white; 
            text-decoration: none; 
            margin: 0 15px;
            padding: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: inline-block;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            line-height: 20px;
            transition: all 0.3s ease;
          }
          .social-links a svg {
            width: 20px;
            height: 20px;
            fill: white;
          }
          .social-links a:hover {
            background: #667eea;
            transform: translateY(-2px);
          }
          .footer-bottom {
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 20px;
            margin-top: 20px;
          }
          .footer-bottom p {
            font-size: 12px; 
            color: rgba(255,255,255,0.6);
          }
          .booking-id {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
            border: 2px dashed #667eea;
          }
          .booking-id-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .booking-id-value {
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }

          /* Animated Images (Responsive) */
          .animated-images {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            border-radius: 20px;
          }
          .image-stage {
            position: relative;
            width: 100%;
            max-width: 960px; /* cap width for large screens */
            margin: 0 auto;
            aspect-ratio: 16 / 9; /* responsive height */
            overflow: hidden;
            border-radius: 15px;
            
          }
          .animated-image {
            position: absolute;
            inset: 0; /* top:0; right:0; bottom:0; left:0 */
            width: 100%;
            height: 100%;
            object-fit: contain; /* show entire image on all screens */
            transition: opacity 1.8s ease-in-out;
            border-radius: 15px;
            opacity: 0; /* hidden by default */
          }
          /* Show the first image initially so animation starts from state */
          #image1.animated-image { opacity: 1; }

          @media (max-width: 600px) {
            .container { border-radius: 14px; margin: 0 8px; }
            .header { padding: 28px 16px; }
            .logo { font-size: 26px; }
            .tagline { font-size: 14px; }
            .content { padding: 24px 16px; }

            .detail-grid { grid-template-columns: 1fr; gap: 14px; }
            .detail-item { padding: 16px; border-radius: 12px; }
            .detail-label { font-size: 12px; padding: 6px 12px; }
            .detail-value { font-size: 22px; line-height: 1.25; word-break: break-word; }

            .booking-card { padding: 20px; }

            .total-section { padding: 20px; border-radius: 14px; margin: 20px 0; }
            .total-amount { font-size: 28px; }
            .total-label { font-size: 14px; }

            .cta-button { padding: 14px 24px; font-size: 15px; }

            .booking-id { padding: 12px; }
            .booking-id-value { font-size: 16px; }

            .footer { padding: 24px 16px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <img
              class="brand-logo"
              src="https://res.cloudinary.com/dr8razrcd/image/upload/v1758321248/FMT_logo_irtnlr.svg"
              alt="FeelME Town logo"
              loading="lazy"
              decoding="async"
            />
            <div class="logo">🎬 FeelME Town</div>
            <div class="tagline">Premium Entertainment Experience</div>
          </div>
          
          <div class="content">
              <div class="success-badge">✅ Booking Confirmed</div>
              
              <div class="greeting">
                <h1>Congratulations, ${bookingData.name}! 🎉</h1>
                <p>Your booking has been successfully confirmed. We're excited to make your special occasion absolutely memorable!</p>
              </div>
              
              <div class="booking-id">
                <div class="booking-id-label">Booking Reference</div>
                <div class="booking-id-value">${bookingData.id}</div>
              </div>
              
              <div class="booking-card">
                <div class="booking-header">
                  <div class="booking-icon">🎭</div>
                  <div class="booking-title">Booking Details</div>
                </div>
                
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Customer Name</div>
                    <div class="detail-value">${bookingData.name}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Number of People</div>
                    <div class="detail-value">${bookingData.numberOfPeople || 2} Guests</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Theater Venue</div>
                    <div class="detail-value">${bookingData.theaterName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Booking Date</div>
                    <div class="detail-value">${bookingData.date}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Show Time</div>
                    <div class="detail-value">${bookingData.time}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Special Occasion</div>
                    <div class="detail-value">${bookingData.occasion}</div>
                  </div>
                </div>
              </div>
              
              <div class="total-section">
                <div class="total-label">Total Amount</div>
                <div class="total-amount">₹${bookingData.totalAmount}</div>
              </div>
              
              <div class="cta-section">
                <a href="#" class="cta-button">View Complete Details</a>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 15px;">
                <p style="color: #666; font-size: 16px; margin: 0;">
                  <strong>🎯 Pro Tip:</strong> Arrive 15 minutes early for the best experience. 
                  Our team will ensure everything is perfectly set up for your special occasion!
                </p>
              </div>
              
              <!-- Animated Images Section -->
              <div class="animated-images">
                <div class="image-stage">
                  <img id="image1" class="animated-image" src="https://res.cloudinary.com/dr8razrcd/image/upload/v1758319404/Mackup1_svsg64.png"
                       alt="Premium Theater Experience" loading="lazy" decoding="async" />
                  <img id="image2" class="animated-image" src="https://res.cloudinary.com/dr8razrcd/image/upload/v1758319383/Mackup2_lheb7l.png"
                       alt="Luxury Cinema Amenities" loading="lazy" decoding="async" />
                </div>
              </div>
              
              <script>
                // Image fade animation
                let currentImage = 1;
                const image1 = document.getElementById('image1');
                const image2 = document.getElementById('image2');
                
                function fadeImages() {
                  if (currentImage === 1) {
                    image1.style.opacity = '0';
                    image2.style.opacity = '1';
                    currentImage = 2;
                  } else {
                    image1.style.opacity = '1';
                    image2.style.opacity = '0';
                    currentImage = 1;
                  }
                }
                
                // Start animation after page load
                setTimeout(() => {
                  setInterval(fadeImages, 5000); // Fade every 5 seconds
                }, 1000);
              </script>
            </div>
            
            <div class="footer">
              <div class="footer-logo">FeelME Town</div>
              <div class="footer-tagline">Creating Unforgettable Memories</div>
              
              <div class="social-links">

                <a href="#" title="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"/></svg></svg></a>
                <a href="#" title="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="17" cy="7" r="1.5" fill="currentColor" fill-opacity="0"><animate fill="freeze" attributeName="fill-opacity" begin="1.3s" dur="0.15s" values="0;1"/></circle><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="72" stroke-dashoffset="72" d="M16 3c2.76 0 5 2.24 5 5v8c0 2.76 -2.24 5 -5 5h-8c-2.76 0 -5 -2.24 -5 -5v-8c0 -2.76 2.24 -5 5 -5h4Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="72;0"/></path><path stroke-dasharray="28" stroke-dashoffset="28" d="M12 8c2.21 0 4 1.79 4 4c0 2.21 -1.79 4 -4 4c-2.21 0 -4 -1.79 -4 -4c0 -2.21 1.79 -4 4 -4"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.6s" values="28;0"/></path></g></svg></a>
                <a href="#" title="Twitter"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><g fill="none"><g clip-path="url(#SVGG1Ot4cAD)"><path fill="currentColor" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"/></g><defs><clipPath id="SVGG1Ot4cAD"><path fill="#fff" d="M0 0h14v14H0z"/></clipPath></defs></g></svg></a>
                <a href="#" title="YouTube"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73"/></svg></a>
          </div>
          
              <div class="footer-bottom">
                <p>© 2024 FeelME Town. All rights reserved.</p>
                <p>Premium Entertainment • Luxury Experience • Unforgettable Moments</p>
                <p>Designed and Developed by <a href="https://www.cybershoora.com/" target="_blank" rel="noopener noreferrer"><span style="font-weight: 600; color: #ffffff;">CYBERSHOORA</span></a></p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking interrupted/incomplete
  bookingIncomplete: (bookingData: Partial<BookingData> & { email?: string }) => ({
    subject: '⏸️ Complete Your Booking - FeelME Town | Don\'t Miss Out!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Booking - FeelME Town</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; padding: 0; 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
          }
          .email-wrapper { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
            padding: 40px 20px; 
            min-height: 100vh;
          }
          .container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #ff3838 100%); 
            padding: 50px 30px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo { 
            color: white; 
            font-size: 36px; 
            font-weight: 800; 
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
          }
          .tagline { 
            color: rgba(255,255,255,0.9); 
            font-size: 18px; 
            font-weight: 300;
            position: relative;
            z-index: 1;
          }
          .urgent-badge {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin: 20px auto;
            box-shadow: 0 4px 15px rgba(255,107,107,0.3);
          }
          .content { 
            padding: 50px 40px; 
            background: white;
          }
          .greeting {
            text-align: center;
            margin-bottom: 40px;
          }
          .greeting h1 {
            color: #1a1a2e;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .greeting p {
            color: #666;
            font-size: 18px;
            line-height: 1.6;
          }
          .offer-card { 
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            padding: 30px; 
            border-radius: 20px; 
            margin: 30px 0;
            border: 2px solid #ffc107;
            box-shadow: 0 10px 30px rgba(255,193,7,0.2);
            text-align: center;
          }
          .offer-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          .offer-title {
            color: #856404;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .offer-text {
            color: #856404;
            font-size: 18px;
            font-weight: 600;
          }
          .countdown {
            background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
          }
          .countdown-text {
            font-size: 16px;
            margin-bottom: 10px;
          }
          .countdown-time {
            font-size: 24px;
            font-weight: 800;
            font-family: 'Courier New', monospace;
          }
          .booking-details { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 35px; 
            border-radius: 20px; 
            margin: 30px 0;
            border: 1px solid #e9ecef;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 15px 0; 
            padding: 15px 0; 
            border-bottom: 1px solid #dee2e6; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .detail-value { 
            color: #1a1a2e; 
            font-size: 16px;
            font-weight: 600;
          }
          .cta-section {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white; 
            padding: 20px 50px; 
            text-decoration: none; 
            border-radius: 50px; 
            display: inline-block; 
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 15px 40px rgba(255,107,107,0.4);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 50px rgba(255,107,107,0.5);
          }
          .footer { 
            background: #1a1a2e; 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .footer-logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .footer-tagline {
            color: rgba(255,255,255,0.8);
            margin-bottom: 30px;
          }
          .contact-info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
          }
          .contact-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer-bottom {
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 20px;
            margin-top: 20px;
          }
          .footer-bottom p {
            font-size: 12px; 
            color: rgba(255,255,255,0.6);
          }
          @media (max-width: 600px) {
            .content { padding: 30px 20px; }
            .header { padding: 40px 20px; }
            .detail-row { flex-direction: column; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">🎬 FeelME Town</div>
              <div class="tagline">Premium Entertainment Experience</div>
          </div>
          
          <div class="content">
              <div class="urgent-badge">⚠️ Booking Incomplete</div>
              
              <div class="greeting">
                <h1>Don't Miss Out, ${bookingData.name || 'Valued Customer'}! 🎯</h1>
                <p>We noticed you started booking your special occasion but didn't complete it. Let's finish what we started!</p>
              </div>
              
              <div class="offer-card">
                <div class="offer-icon">🎁</div>
                <div class="offer-title">Limited Time Offer!</div>
                <div class="offer-text">Complete your booking within 24 hours and get 15% OFF on your total bill!</div>
              </div>
              
              <div class="countdown">
                <div class="countdown-text">⏰ Offer expires in:</div>
                <div class="countdown-time">23:59:59</div>
            </div>
            
              <div class="booking-details">
                <h3 style="color: #1a1a2e; margin-bottom: 20px; text-align: center;">Your Started Booking:</h3>
                <div class="detail-row">
                  <span class="detail-label">Name</span>
                  <span class="detail-value">${bookingData.name || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${bookingData.email || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${bookingData.phone || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Occasion</span>
                  <span class="detail-value">${bookingData.occasion || 'Not specified'}</span>
                </div>
              </div>
              
              <div class="cta-section">
              <a href="#" class="cta-button">Complete Booking Now</a>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 15px;">
                <p style="color: #666; font-size: 16px; margin: 0;">
                  <strong>🎬 Why FeelME Town?</strong><br>
                  Premium theaters • Luxury amenities • Unforgettable experiences • 5-star service
                </p>
              </div>
              
              <!-- Animated Images Section -->
              <div style="text-align: center; margin-top: 30px; padding: 30px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h3 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin-bottom: 20px;">🎬 See What You're Missing!</h3>
                <div style="position: relative; height: 300px; overflow: hidden; border-radius: 15px; background: #000;">
                  <img id="image1-incomplete" src="https://res.cloudinary.com/feelmetown/image/upload/v1/theater-premium-experience.jpg" 
                       alt="Premium Theater Experience" 
                       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 1; transition: opacity 2s ease-in-out; border-radius: 15px;">
                  <img id="image2-incomplete" src="https://res.cloudinary.com/feelmetown/image/upload/v1/luxury-cinema-amenities.jpg" 
                       alt="Luxury Cinema Amenities" 
                       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 2s ease-in-out; border-radius: 15px;">
                </div>
                <p style="color: #666; font-size: 16px; margin-top: 15px;">
                  Don't miss out on this incredible experience - complete your booking now!
                </p>
              </div>
              
              <script>
                // Image fade animation for incomplete booking email
                let currentImageIncomplete = 1;
                const image1Incomplete = document.getElementById('image1-incomplete');
                const image2Incomplete = document.getElementById('image2-incomplete');
                
                function fadeImagesIncomplete() {
                  if (currentImageIncomplete === 1) {
                    image1Incomplete.style.opacity = '0';
                    image2Incomplete.style.opacity = '1';
                    currentImageIncomplete = 2;
                  } else {
                    image1Incomplete.style.opacity = '1';
                    image2Incomplete.style.opacity = '0';
                    currentImageIncomplete = 1;
                  }
                }
                
                // Start animation after page load
                setTimeout(() => {
                  setInterval(fadeImagesIncomplete, 5000); // Fade every 5 seconds
                }, 1000);
              </script>
            </div>
            
            <div class="footer">
              <div class="footer-logo">FeelME Town</div>
              <div class="footer-tagline">Creating Unforgettable Memories</div>
              
              <div class="contact-info">
                <p><strong>📞 Need Help?</strong></p>
                <p>Call us: +91 98765 43210</p>
                <p>Email: support@feelmetown.com</p>
                <p>WhatsApp: +91 98765 43210</p>
          </div>
          
              <div class="footer-bottom">
                <p>© 2024 FeelME Town. All rights reserved.</p>
                <p>Premium Entertainment • Luxury Experience • Unforgettable Moments</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to: string, templateType: 'bookingComplete' | 'bookingIncomplete', bookingData: BookingData | (Partial<BookingData> & { email?: string })) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_PASS === 'your-app-password') {
      console.log('⚠️ Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email credentials not configured'
      };
    }

    const template = emailTemplates[templateType](bookingData as BookingData & Partial<BookingData>);
    
    const mailOptions = {
      from: `"FeelME Town" <${EMAIL_CONFIG.auth.user}>`,
      to: to,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      to: to,
      type: templateType,
      messageId: result.messageId
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Email service functions
const emailService = {
  // Send booking completion email
  sendBookingComplete: async (bookingData: BookingData) => {
    if (!bookingData.email) {
      console.log('⚠️ No email provided for booking completion notification');
      return { success: false, error: 'No email provided' };
    }
    
    return await sendEmail(bookingData.email, 'bookingComplete', bookingData);
  },

  // Send booking incomplete email
  sendBookingIncomplete: async (bookingData: Partial<BookingData> & { email?: string }) => {
    if (!bookingData.email) {
      console.log('⚠️ No email provided for booking incomplete notification');
      return { success: false, error: 'No email provided' };
    }
    
    return await sendEmail(bookingData.email, 'bookingIncomplete', bookingData);
  },

  // Test email configuration
  testConnection: async () => {
    try {
      await transporter.verify();
      console.log('✅ Email service connection verified');
      return { success: true, message: 'Email service ready' };
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export default emailService;
