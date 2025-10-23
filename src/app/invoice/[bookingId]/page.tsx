'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

export default function InvoicePage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const { toasts, removeToast, showSuccess, showError } = useToast();

  useEffect(() => {
    if (bookingId) {
      fetchInvoice();
    }
  }, [bookingId]);

  const fetchInvoice = async () => {
    try {
      // Remove setIsLoading(true) - no loading state needed
      console.log('📄 Fetching invoice for booking:', bookingId);
      
      // First, try to get booking data directly to extract customer name
      try {
        const bookingResponse = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`);
        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          if (bookingData.success && bookingData.booking && bookingData.booking.name) {
            setCustomerName(bookingData.booking.name);
            console.log('✅ Customer name fetched from booking API:', bookingData.booking.name);
          }
        }
      } catch (bookingErr) {
        console.log('⚠️ Could not fetch booking data, will try to extract from HTML');
      }
      
      // Fetch invoice HTML
      const response = await fetch(`/api/generate-invoice?bookingId=${encodeURIComponent(bookingId)}&format=html`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      
      const html = await response.text();
      setInvoiceHtml(html);
      // Detect pending state from API HTML marker
      if (html.includes('INVOICE_PENDING')) {
        setIsPending(true);
      } else {
        setIsPending(false);
      }
      
      // Debug: Log part of HTML to see structure
      console.log('📄 Invoice HTML preview:', html.substring(0, 1000) + '...');
      
      // If customer name not found from booking API, try to extract from HTML
      if (!customerName || customerName === 'Valued Customer') {
        let extractedName = 'Valued Customer';
        
        // Try multiple patterns to extract customer name
        const patterns = [
          // Look for the specific h2 tag in bill-to section (most likely match)
          /<div class="bill-to-left"[^>]*>[\s\S]*?<h2>([^<]+)<\/h2>/,
          /<h2>([^<]+)<\/h2>/,
          
          // Look for Invoice to section
          /Invoice to[^<]*<[^>]*>([^<]+)/,
          /Invoice to[\s\S]*?<h2>([^<]+)<\/h2>/,
          
          // Look for Bill To section
          /Bill To[^<]*<[^>]*>([^<]+)</,
          /Bill To[^<]*:\s*([^<\n]+)/,
          
          // Look for specific customer name patterns
          /<div class="customer-name"[^>]*>([^<]+)<\/div>/,
          /<div[^>]*class="[^"]*customer-name[^"]*"[^>]*>([^<]+)<\/div>/,
          
          // Look for any strong tags that might contain name
          /<strong[^>]*>([A-Z][a-zA-Z\s]+)<\/strong>/,
          
          // Look for name patterns in divs
          /<div[^>]*>([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)<\/div>/,
          
          // Look for name labels
          /Name[^<]*<[^>]*>([^<]+)/,
          /Customer[^<]*<[^>]*>([^<]+)/,
          
          // Look in JSON-like structures
          /"name"[^>]*>([^<]+)/,
          /"name":\s*"([^"]+)"/,
          
          // Look for any capitalized name pattern
          />([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)</
        ];
        
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const match = html.match(pattern);
          if (match && match[1] && match[1].trim() && match[1].trim() !== 'Customer') {
            extractedName = match[1].trim();
            console.log(`✅ Customer name extracted from HTML using pattern ${i + 1}:`, extractedName);
            break;
          }
        }
        
        if (extractedName === 'Valued Customer') {
          console.log('⚠️ Could not extract customer name from HTML, using fallback');
        }
        
        setCustomerName(extractedName);
      }
      
      console.log('✅ Invoice loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setError('Failed to load invoice. Please try again.');
    } finally {
      // Remove setIsLoading(false) - no loading state needed
    }
  };

  const downloadPDF = async () => {
    try {
      console.log('📥 Downloading PDF for booking:', bookingId);
      
      // Create custom filename with customer name
      const cleanCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      const filename = `Invoice-FMT-${cleanCustomerName}.pdf`;
      
      // Fetch PDF as blob for custom filename download
      const response = await fetch(`/api/generate-invoice?bookingId=${encodeURIComponent(bookingId)}&format=pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      
      // Create download link with custom filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded with filename:', filename);
      
      // Show success toast
      showSuccess('✅ Invoice Downloaded Successfully!', 3000);
      
      // Close the invoice page after successful download
      setTimeout(() => {
        window.close();
        // Fallback: redirect to previous page if window.close() doesn't work
        if (!window.closed) {
          window.history.back();
        }
      }, 2000); // Wait 2 seconds to show message and ensure download started
      
    } catch (err) {
      console.error('❌ Error downloading PDF:', err);
      showError('❌ Failed to download PDF. Please try again.');
    }
  };

  const printInvoice = () => {
    window.print();
  };

  // Remove loading state - main app loading handles this

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(/bg7.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="modern-error">
          <div className="text-red-400 text-8xl mb-6">❌</div>
          <h1>Invoice Not Found</h1>
          <p>{error}</p>
          <button onClick={() => window.history.back()}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen invoice-page-container"
      style={{
        backgroundImage: 'url(/bg7.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Modern Header - Centered */}
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-full max-w-4xl px-4">
          <h1 className="modern-heading text-4xl md:text-6xl mb-8" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            Invoice of {customerName || 'Valued Customer'}
          </h1>
         
          {!isPending ? (
            <div className="flex justify-center mb-12">
              <div className="wrapper">
                <a href="#" onClick={(e) => { e.preventDefault(); downloadPDF(); }} className="c-btn">
                  <span className="c-btn__label">Download Your Invoice 
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-12">
              <div className="modern-thank-you" style={{ maxWidth: 720 }}>
                <h2>Invoice will be available after completion</h2>
                <p>Your invoice will generate automatically once your booking is marked as <strong>Completed</strong>. We'll email you a link to download it.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview - Centered */}
      <div className="flex justify-center pb-16 px-4">
        <div 
          className="modern-invoice-container"
          dangerouslySetInnerHTML={{ __html: invoiceHtml }}
          style={{
            maxWidth: '800px',
            width: '100%',
            minHeight: 'auto',
            height: 'auto'
          }}
        />
      </div>

      {/* Mobile Download Button - Animated */}
      {!isPending && (
        <div className="md:hidden fixed bottom-6 right-6 z-30">
          <div className="wrapper">
            <a href="#" onClick={(e) => { e.preventDefault(); downloadPDF(); }} className="c-btn">
              <span className="c-btn__label">Download 
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Back Button - Mobile */}
      <div className="absolute top-12 left-6 z-20">
        <button
          onClick={() => window.location.href = '/theater'}
          className="back-button"
        >
          ← Back to Theater
        </button>
      </div>

      {/* Thank You Section */}
      <div className="text-center pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="modern-thank-you">
            <h2>Thank You for Choosing Us! 🎬</h2>
            <p>We appreciate your trust in FeelME Town for your special moments.</p>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Modern Invoice Page Styles */}
      <style jsx global>{`
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        /* Modern styling for invoice page */
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Ensure proper scrolling and background */
        html, body {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          scroll-behavior: smooth;
          background-image: url('/bg7.png') !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
        }
        
        /* Modern heading styles */
        .modern-heading {
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          font-size: 2rem;
          margin-top: 3rem;
          margin-bottom: 3rem;

          text-align: center;
          display: block;
          width: 100%;
        }
        
        /* Animated Download Button Styles - Global */
        :root {
          --color-dark: #110d1a;
          --color-primary:rgb(255, 0, 0);
        }
        
        .wrapper {
          display: grid;
          place-content: center;
        }
        
        .c-btn {
          position: relative;
          overflow: hidden;
          padding: 0.85rem 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Paralucent-DemiBold', sans-serif;
          text-decoration: none;
          border-radius: 8px;
          background-color: transparent;
          backface-visibility: hidden;
          box-shadow: inset 0 0 0 1px var(--color-primary);
          transform: translateZ(0);
        }
        
        .c-btn::after {
          content: "";
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          height: 120%;
          width: 120%;
          border-radius: 20%;
          background-color: var(--color-primary);
          scale: 0 0;
          translate: 0 140%;
          transition: scale 0.6s cubic-bezier(0.215, 0.61, 0.355, 1), translate 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        
        .c-btn__label {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          z-index: 2;
          font-size: 1.2rem;
          letter-spacing: 0.025em;
          transition: color 0.32s ease-in-out;
          font-family: 'Paralucent-DemiBold', sans-serif;
          color: rgb(255, 0, 0);
        }
        
        .c-btn__label svg {
          fill: currentColor;
        }
        
        .c-btn:hover .c-btn__label {
          color: var(--color-dark);
        }
        
        .c-btn:hover::after {
          scale: 1.5 1.5;
          translate: 0 0;
          border-radius: 50%;
        }
        
        /* Removed duplicate back button styles - using global styles below */
        
        /* Mobile download button */
        .mobile-download-btn {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-download-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 25px rgba(255, 107, 107, 0.5);
        }
        
        .modern-download-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 20px 40px rgba(255, 107, 107, 0.4);
        }
        
        .modern-download-btn:active {
          transform: translateY(-1px) scale(1.02);
        }
        
        /* Modern invoice container */
        .modern-invoice-container {
          background: white;
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          overflow: visible;
          transition: all 0.3s ease;
          margin: 2rem auto;
          display: block;
          position: relative;
        }
        
        /* Ensure background image is properly applied */
        .invoice-page-container {
          background-image: url('/bg7.png') !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
        }
        
        body {
          background-image: url('/bg7.png') !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
        }
        
        .modern-invoice-container:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 35px 70px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.15);
        }
        
        /* Modern thank you section */
        .modern-thank-you {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        
        .modern-thank-you h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        
        .modern-thank-you p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
          line-height: 1.6;
        }
        
        /* Loading state styles removed - using main app loading */
        
        /* Error state styles */
        .modern-error {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 500px;
        }
        
        .modern-error h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }
        
        .modern-error p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 32px;
        }
        
        .modern-error button {
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
          border: none;
          border-radius: 50px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
        }
        
        .modern-error button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 30px rgba(108, 117, 125, 0.4);
        }
        
        /* Back button styles for all devices */
        .back-button {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 12px 20px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
        }
        
        /* Simple Mobile Invoice View */
        @media (max-width: 768px) {
          /* Force background on mobile */
          body, html, .invoice-layout, .min-h-screen {
            background: url('/bg7.png') center/cover fixed no-repeat !important;
          }
          
          /* Hide all decorative elements */
          .modern-heading,
          .modern-download-btn,
          .modern-thank-you,
          .mobile-pdf-title {
            display: none !important;
          }
          
          /* Mobile back button adjustments */
          
          /* Setup container with background for mobile */
          .min-h-screen.invoice-page-container {
            background: url('/bg7.png') center/cover fixed no-repeat !important;
            padding: 0 !important;
            height: 100vh !important;
            width: 100vw !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* Position back button below download button - order second */
          .absolute.top-12.left-6 {
            display: block !important;
            position: static !important;
            top: auto !important;
            left: auto !important;
            z-index: 100 !important;
            margin-top: 20px !important;
            order: 2 !important;
          }
          
          /* Remove header section completely */
          .flex.flex-col.items-center.justify-center.text-center.py-16 {
            display: none !important;
          }
          
          /* Hide invoice preview completely on mobile */
          .pb-16.px-4,
          .modern-invoice-container {
            display: none !important;
          }
          
          /* Proper mobile layout with background */
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            background-image: url('/bg7.png') !important;
            background-size: cover !important;
            background-position: center !important;
            background-attachment: fixed !important;
            background-repeat: no-repeat !important;
          }
          
          /* Center download button using flexbox - order first */
          .md\\:hidden.fixed.bottom-6.right-6 {
            position: static !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            z-index: 50 !important;
            order: 1 !important;
          }
          
          /* Ensure proper centering */
          
          /* Mobile specific adjustments for animated button */
        }
        
        /* Print styles */
        @media print {
          .modern-download-btn,
          .modern-thank-you,
          .back-button {
            display: none !important;
          }
          
          .modern-invoice-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            transform: none !important;
          }
          
          body {
            background: white !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
