// Email Configuration for FeelME Town
// Professional email setup like Netflix

module.exports = {
  // Email service configuration
  service: 'gmail', // You can change to 'outlook', 'yahoo', etc.
  
  // Email credentials (set these in your environment variables)
  auth: {
    user: process.env.EMAIL_USER || 'feelmetown@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  
  // Email templates configuration
  templates: {
    from: '"FeelME Town" <feelmetown@gmail.com>',
    replyTo: 'support@feelmetown.com',
    
    // Email subjects
    subjects: {
      bookingComplete: '🎬 Booking Confirmed - FeelME Town',
      bookingIncomplete: '⏸️ Complete Your Booking - FeelME Town',
      welcome: '🎉 Welcome to FeelME Town',
      reminder: '⏰ Booking Reminder - FeelME Town'
    }
  },
  
  // Email sending settings
  settings: {
    // Retry failed emails
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    
    // Email validation
    validateEmail: true,
    
    // Rate limiting
    maxEmailsPerMinute: 10,
    maxEmailsPerHour: 100
  }
};
