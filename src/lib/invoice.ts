// Invoice Generator for FeelME Town
// Generates HTML invoice matching the provided design for PDF generation

interface InvoiceData {
  id: string;
  name: string;
  email: string;
  phone: string;
  theaterName: string;
  date: string;
  time: string;
  occasion: string;
  numberOfPeople: number;
  totalAmount: number;
  slotBookingFee?: number;
  venuePaymentMethod?: string;
  pricingData?: {
    theaterBasePrice?: number;
    extraGuestFee?: number;
    slotBookingFee?: number;
  };
  extraGuestsCount?: number;
  extraGuestCharges?: number;
  advancePayment?: number;
  venuePayment?: number;
}

// Helper function to render occasion details from dynamic fields
const renderOccasionDetails = (bookingData: any) => {
  try {
    if (!bookingData) return '';
    const keys = Object.keys(bookingData);
    const labelKeys = keys.filter(k => k.endsWith('_label'));
    if (labelKeys.length === 0) return '';

    const itemsHtml = labelKeys
      .map(labelKey => {
        const baseKey = labelKey.replace(/_label$/, '');
        const label = bookingData[labelKey];
        const value = bookingData[baseKey] ?? bookingData[`${baseKey}_value`] ?? '';
        const safeLabel = String(label || '').trim();
        const safeValue = String(value || '').trim();
        if (!safeLabel || !safeValue) return '';
        return `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <span style="font-weight: 600; color: #333;">${safeLabel}:</span>
            <span style="color: #666;">${safeValue}</span>
          </div>
        `;
      })
      .filter(Boolean)
      .join('');

    if (!itemsHtml) return '';

    return `
      <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #F2B365;">
        <h3 style="margin-bottom: 16px; color: #333; font-size: 16px; font-weight: 700;">Occasion Details</h3>
        ${itemsHtml}
      </div>
    `;
  } catch (e) {
    return '';
  }
};

export const generateInvoiceHtml = (bookingData: InvoiceData): string => {
  const bd: any = bookingData as any;
  const people = Number(bd.numberOfPeople || 2);
  const pricing = (bd.pricingData || {}) as any;
  const theaterName = String(bd.theaterName || '');

 

  const theaterBasePrice = Number(pricing.theaterBasePrice ?? 0);
  const extraGuestFee = Number(pricing.extraGuestFee ?? 400);
  const extraGuestsCount = Number(bd.extraGuestsCount ?? Math.max(0, people - 2));
  const extraGuestCharges = Number(bd.extraGuestCharges ?? (extraGuestsCount * extraGuestFee));
  const totalAmount = Number(bd.totalAmount ?? (theaterBasePrice + extraGuestCharges));
  const slotBookingFee = Number(bd.slotBookingFee ?? pricing.slotBookingFee ?? bd.advancePayment ?? 0);
  const fallbackAdvance = Number(bd.advancePayment ?? 0);
  const invoiceTotal = slotBookingFee > 0 ? slotBookingFee : (fallbackAdvance > 0 ? fallbackAdvance : totalAmount);
  const venuePayment = Number(bd.venuePayment ?? Math.max(0, totalAmount - invoiceTotal));
  const venuePaymentMethodRaw = String(bd.venuePaymentMethod || bd.paymentMethod || '').toLowerCase();
  const venuePaymentMethodLabel = venuePaymentMethodRaw === 'cash'
    ? 'Paid in Cash'
    : venuePaymentMethodRaw === 'online'
      ? 'Paid Online'
      : '';
  const venuePaymentRowLabel = venuePaymentMethodLabel
    ? `At Venue Payment (${venuePaymentMethodLabel})`
    : 'At Venue Payment';

  // Format numbers with Indian number format
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(Number(n || 0)));

  const invoiceNo = String(bd.id || 'FMT-2025-89');
  const invoiceDate = String(bd.date || new Date().toLocaleDateString('en-GB'));

  return `
    <!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - FeelME Town</title>
  <style>
    @font-face {
      font-family: 'Paralucent-DemiBold';
      src: url('https://ik.imagekit.io/cybershoora/fonts/Paralucent-DemiBold.ttf?updatedAt=1758320830457') format('truetype');
    }

    @font-face {
      font-family: 'Paralucent-Medium';
      src: url('https://ik.imagekit.io/cybershoora/fonts/Paralucent-Medium.ttf?updatedAt=1758320830457') format('truetype');
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Paralucent-Medium', Arial, sans-serif;
       backgroundImage: 'url(/bg7.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        overflowY: 'auto',
        overflowX: 'hidden'
      padding: 20px;
      min-height: 100vh;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(135deg, #F5ECCF 0%, #F9F2D9 100%);
      
      overflow: visible;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      height: auto;
      min-height: auto;
    }

   

    /* Top Header - Black */
    .invoice-header {
      background: #0f0f0f;
      color: #fff;
      padding: 1rem 2rem 5rem 2rem;
      height: 16rem;
      display: flex;
      border-radius:  0  0 2rem 2rem;
      align-items: center;
      justify-content: space-between;
    }

    .invoice-title {
      font-size: 48px;
      font-weight: 800;
      font-family: 'Paralucent-DemiBold', sans-serif;
      color: #fff;
    }

    .company-badge {
      border: 2px solid #E8DDB6;
      color: #E8DDB6;
      padding: 12px 20px;
      border-radius: 999px;
      font-weight: 600;
      font-family: 'Paralucent-Medium', sans-serif;
      font-size: 16px;
    }

    .invoice-subtitle {
      color: #E8DDB6;
      font-size: 14px;
      margin-top: 8px;
      opacity: 0.9;
    }

    /* Bill To Section - Orange */
    .bill-to-section {
      background: #F07E4B;
      color: #fff;
      padding: 24px 28px;
      margin: -5rem 2rem 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 0.6rem 2rem 2rem 2rem;
    }

    .bill-to-left h2 {
      font-size: 28px;
      font-weight: 800;
      margin: 6px 0 12px;
      font-family: 'Paralucent-DemiBold', sans-serif;
    }

    .bill-to-left .contact-row {
      display: flex;
      gap: 12px;
      align-items: center;
      color: #ffe;
      font-size: 15px;
      margin: 6px 0;
    }

    .bill-to-left .label {
      opacity: 0.95;
      font-size: 13px;
      font-family: 'Paralucent-Medium', sans-serif;
    }

    .amount-chip {
      background: #F2B365;
      color: #0b0b0b;
      padding: 8px 18px;
      border-radius: 999px;
      font-weight: 800;
      font-family: 'Paralucent-DemiBold', sans-serif;
      font-size: 16px;
    }

    .bill-to-right {
      text-align: right;
      font-family: 'Paralucent-Medium', sans-serif;
    }

    .bill-to-right .label {
      color: #fff;
      opacity: 0.9;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .bill-to-right .value {
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 12px;
    }

     .occasion-section {
      background: #F07E4B;
      color: #fff;
      padding: 20px 28px;
      margin: 1rem 2rem 1rem 2rem;
      border-radius:  2rem 0.6rem 2rem  2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Paralucent-Medium', sans-serif;
    }

    .occasion-section .label {
      opacity: 0.95;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .occasion-section .value {
      font-size: 16px;
      font-weight: 700;
      font-family: 'Paralucent-DemiBold', sans-serif;
    }

    .occasion-names {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }

    .occasion-names .divider {
      color: rgba(255, 255, 255, 0.6);
      font-weight: 400;
    }

    /* Table Section */
    .table-section {
      margin: 0 2rem 2rem 2rem;
    }

    .invoice-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 16px;
      table-layout: fixed;
    }

    .table-header {
      background: #101010;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Paralucent-DemiBold', sans-serif;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Ensure table header doesn't repeat on new pages */
    .invoice-table {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Keep table rows together when possible */
    .table-row {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Additional PDF page break control */
    .table-section {
      break-inside: auto;
      page-break-inside: auto;
    }
    
    /* Prevent orphaned table headers */
    .table-header + .table-row {
      break-before: avoid;
      page-break-before: avoid;
    }

    .table-header th {
      padding: 16px 18px;
      text-align: left;
    }

    .table-header th:first-child {
      border-radius: 12px 0 0 12px;
    }

    .table-header th:last-child {
      border-radius: 0 12px 12px 0;
    }

    .table-row {
      background: transparent;
    }

    .table-row:nth-child(odd) {
      background: #EFE8C9;
    }

    .table-row td {
      padding: 16px 18px;
      font-size: 15px;
      color: #1a1a1a;
      font-weight: 500;
    }

    .table-row td:first-child {
      border-radius: 12px 0 0 12px;
      font-weight: 600;
    }

    .table-row td:last-child {
      border-radius: 0 12px 12px 0;
      font-weight: 700;
    }

    /* Footer Section */
    .invoice-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 28px;
    }

    .decorative-stars {
      font-size: 3rem;
      color: #0f0f0f;
      margin-left: 1rem;
    }

    .decorative-stars img {
      width: 2rem;
      height: 2rem;
      object-fit: contain;
    }

    .payable-amount {
      background-color: #F07E4B;
      padding: 16px 24px;
      border-radius: 24px;
      font-weight: 700;
      font-family: 'Paralucent-DemiBold', sans-serif;
      font-size: 18px;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0.5px;
    }

    /* Bottom Section */
    .bottom-section {
      display: flex;
      gap: 20px;
      padding: 0 20px 28px;
    }

    .terms-box {
      background: #F07E4B;
      border-radius: 2rem 0.5rem 2rem 2rem;
      padding: 24px;
      flex: 1;
      color: #fff;
    }

    .terms-title {
      font-size: 18px;
      font-weight: 700;
      font-family: 'Paralucent-DemiBold', sans-serif;
      margin-bottom: 16px;
    }

    .terms-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .terms-point {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .terms-dot {
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .contact-box {
      background: #F2B365;
      border-radius: 0.5rem 2rem  2rem 2rem;
      padding: 24px;
      flex: 1;
      color: #0b0b0b;
      text-align: center;
    }

    .contact-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .contact-subtitle {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 14px;
    }

    .brand-section {
      background: #E8DDB6;
      border-radius: 20px;
      padding: 24px;
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .brand-logo {
      width: 60px;
      height: 60px;
      background: #0f0f0f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      font-size: 24px;
      color: #E8DDB6;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 800;
      font-family: 'Paralucent-DemiBold', sans-serif;
      color: #0f0f0f;
      margin-bottom: 4px;
    }

    .brand-tagline {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>

<body>

  <div class="invoice-container">
    <!-- Header Section -->
    <div class="top">
      <div class="invoice-header">
        <div>
          <div class="invoice-title">Invoice</div>
          <div class="invoice-subtitle">This invoice is issued for services provided by<br>FeelMe Town Private Theater
          </div>
        </div>
        <div class="company-badge">
          FeelMe town 🌐
        </div>
      </div>

     
    </div>
     <!-- Bill To Section -->
      <div class="bill-to-section">
        <div class="bill-to-left">
          <div class="label">Invoice to</div>
          <h2>${bookingData.name}</h2>
          <div class="contact-row">
            <span>📞</span>
            <span>${bookingData.phone || '+91 9520936655'}</span>
          </div>
          <div class="contact-row">
            <span>✉️</span>
            <span>${bookingData.email || 'feelmetowm@gmail.com'}</span>
          </div>
        </div>
        <div class="bill-to-right">
          <div class="label">Invoice No.</div>
          <div class="value">${invoiceNo}</div>
          <div class="label">Date</div>
          <div class="value">${invoiceDate}</div>
          <div style="margin-top: 16px;">
            <span class="amount-chip">Slot Booking Fee ₹${fmt(slotBookingFee)}</span>
          </div>
        </div>
      </div>

   <!-- Occasion & Date Section -->
      <div class="occasion-section">
        <div>
          <div class="label">Occasion</div>
          <div class="value">${bookingData.occasion || 'Couple'}</div>
          ${(() => {
            const occasionData = bd.occasionData || {};
            const candidates = [
              bd.occasionPersonName,
              bd.occasionPerson,
              bd['Your Nickname_value'],
              bd['Your Nickname'],
              bd["Your Partner's Name_value"],
              bd["Your Partner's Name"],
              bd.birthdayName,
              bd.birthdayPersonName,
              bd.proposalPartnerName,
              bd.proposerName,
              occasionData.personName,
              occasionData.partnerName,
              occasionData.honoreeName,
              occasionData.celebrantName,
              occasionData.brideName,
              occasionData.groomName
            ];
            const names = candidates
              .map((val: any) => (typeof val === 'string' ? val.trim() : ''))
              .filter((val: string) => val.length > 0);
            if (names.length === 0) {
              return '';
            }
            const uniqueNames = Array.from(new Set(names));
            return `<div class="occasion-names">${uniqueNames.map(name => `<span>${name}</span>`).join('<span class="divider">•</span>')}</div>`;
          })()}
        </div>
        <div>
          <div class="label">Date & Time</div>
          <div class="value">${bookingData.date || 'TBD'}, ${bookingData.time || ''}</div>
        </div>
      </div>

    <!-- Table Section -->
    <div class="table-section">
      <table class="invoice-table">
        <tbody>
          <tr class="table-header">
            <th>Item Description</th>
            <th>Base Price</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
          <tr class="table-row">
            <td>${bookingData.theaterName || 'Theater'}</td>
            <td>${fmt(theaterBasePrice)}</td>
            <td>1</td>
            <td>${fmt(theaterBasePrice)}</td>
          </tr>
          
          ${extraGuestsCount > 0 ? `
          <tr class="table-row">
            <td>Extra Guests (${extraGuestsCount} guests)</td>
            <td>${fmt(extraGuestFee)}</td>
            <td>${extraGuestsCount}</td>
            <td>${fmt(extraGuestCharges)}</td>
          </tr>
          ` : ''}
          
          ${(() => {
      let itemsHtml = '';

      // Add decoration items if they exist
      const decorItems = bd.selectedDecorItems || bd.decorationItems || [];
      if (Array.isArray(decorItems) && decorItems.length > 0) {
        itemsHtml += decorItems.map(item => `
                <tr class="table-row">
                  <td>Decoration - ${item.name || item.title || 'Item'}</td>
                  <td>${fmt(item.price || 0)}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${fmt((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              `).join('');
      }

      // Add cake items if they exist
      const cakeItems = bd.selectedCakes || bd.cakeItems || [];
      if (Array.isArray(cakeItems) && cakeItems.length > 0) {
        itemsHtml += cakeItems.map(item => `
                <tr class="table-row">
                  <td>Cake - ${item.name || item.title || 'Item'}</td>
                  <td>${fmt(item.price || 0)}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${fmt((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              `).join('');
      }

      // Add gift items if they exist
      const giftItems = bd.selectedGifts || bd.giftItems || [];
      if (Array.isArray(giftItems) && giftItems.length > 0) {
        itemsHtml += giftItems.map(item => `
                <tr class="table-row">
                  <td>Gift - ${item.name || item.title || 'Item'}</td>
                  <td>${fmt(item.price || 0)}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${fmt((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              `).join('');
      }

      return itemsHtml;
    })()}
          
          <tr class="table-row">
            <td>Slot Booking Fee (Paid Online)</td>
           
            <td>${fmt((slotBookingFee))}</td>
            <td>-</td>
            <td>${fmt((slotBookingFee))}</td>
          </tr>
          
          ${(venuePayment > 0 || venuePaymentMethodLabel) ? `
          <tr class="table-row">
            <td>${venuePaymentRowLabel}</td>
            <td>-</td>
            <td>-</td>
            <td>${fmt(totalAmount - slotBookingFee)}</td>
          </tr>
          ` : ''}
          
          <tr class="table-row" style="background: #F2B365; font-weight: bold; color: #0f0f0f;">
            <td><strong>Total Amount </strong></td>
            <td>-</td>
            <td>-</td>
            <td><strong>${fmt(totalAmount)}</strong></td>
          </tr>
         
        </tbody>
      </table>
    </div>

    <!-- Footer Section -->
    <div class="invoice-footer">
      <div class="decorative-stars">✱ ✱ ✱</div>
      <div class="payable-amount">Thank you for visiting! See you again soon.</div>
    </div>

    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="terms-box">
        <div class="terms-title">Terms & Condition</div>
        <div class="terms-content">
          <div class="terms-point">
            <div class="terms-dot"></div>
            <span>Payment due within 24 hours</span>
          </div>
          <div class="terms-point">
            <div class="terms-dot"></div>
            <span>Cancellation policy applies</span>
          </div>
        </div>
      </div>

      <div class="contact-box">
        <div class="contact-title">Find us for</div>
        <div class="contact-subtitle">More Information</div>
        <div class="contact-info">
          <div>📞 +91 8006756453</div>
          <div>💬 +91 8006756453</div>
          <div>✉️ feelmetowm@gmail.com</div>
        </div>
      </div>

      <div class="brand-section">
        <div class="brand-logo">🎭</div>
        <div class="brand-name">FeelME Town</div>
        <div class="brand-tagline">Your Private theater</div>
      </div>
    </div>
  </div>
</body>

</html>
  `;
};

// Export default for easy import
export default { generateInvoiceHtml };
