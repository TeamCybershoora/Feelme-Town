'use client';

import React from 'react';

interface Booking {
  id: number;
  customerName: string;
  email?: string;
  phone?: string;
  theater: string;
  theaterName?: string;
  date: string;
  time: string;
  status: string;
  amount: number;
  totalAmount?: number;
  advancePayment?: number;
  venuePayment?: number;
  pricingData?: {
    slotBookingFee?: number;
    convenienceFee?: number;
    theaterBasePrice?: number;
    extraGuestFee?: number;
  };
  extraGuestCharges?: number;
  extraGuestsCount?: number;
  numberOfPeople?: number;
  occasion?: string;
  occasionPersonName?: string;
  birthdayName?: string;
  birthdayGender?: string;
  partner1Name?: string;
  partner1Gender?: string;
  partner2Name?: string;
  partner2Gender?: string;
  dateNightName?: string;
  proposerName?: string;
  proposalPartnerName?: string;
  valentineName?: string;
  customCelebration?: string;
  selectedMovies?: string[];
  // Dynamic service items (can be any service name)
  [key: string]: any;
  occasionData?: { [key: string]: any };
  createdBy?: {
    type: 'admin' | 'staff' | 'customer';
    adminName?: string;
    staffName?: string;
    staffId?: string;
  };
  bookingDate?: string;
  createdAtIST?: string;
}

interface BookingDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  occasions?: any[];
  onEdit?: (booking: Booking) => void;
  showEditButton?: boolean;
  hidePaymentSummary?: boolean;
}

export default function BookingDetailsPopup({ 
  isOpen, 
  onClose, 
  booking, 
  occasions = [], 
  onEdit,
  showEditButton = true,
  hidePaymentSummary = false
}: BookingDetailsPopupProps) {
  if (!isOpen || !booking) return null;

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(booking);
    } else {
      // Default edit behavior - store in sessionStorage
      sessionStorage.setItem('editingBooking', JSON.stringify({
        bookingId: booking.id || booking.bookingId || booking._id,
        isEditing: true,
        isAdminEdit: true,
        ...booking
      }));
    }
    onClose();
  };

  return (
    <>
      <div className="booking-detail-popup">
        <div className="popup-overlay" onClick={onClose}></div>
        <div className="popup-content">
          <div className="popup-header">
            <h3>Booking Details</h3>
            <div className="header-actions">
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>
          <div className="popup-body">
            <div className="detail-section">
              <h4>Customer Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{booking.customerName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{booking.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone:</span>
                  <span className="value">{booking.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Booking Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Theater:</span>
                  <span className="value">{booking.theater}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{booking.date}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Time:</span>
                  <span className="value">{booking.time}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value">₹{(booking.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Occasion:</span>
                  <span className="value">{booking.occasion || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Number of People:</span>
                  <span className="value">
                    {booking.numberOfPeople}
                    {(() => {
                      // Show theater base capacity if available
                      const baseCapacity = booking.baseCapacity || booking.theaterCapacity?.min;
                      if (baseCapacity) {
                        return ` (Base Capacity: ${baseCapacity})`;
                      }
                      return '';
                    })()}
                  </span>
                </div>
                {/* Show Created By information for manual bookings */}
                {booking.status === 'manual' && booking.createdBy && (
                  <div className="detail-item">
                    <span className="label">Created By:</span>
                    <span className="value">
                      {booking.createdBy.type === 'admin' 
                        ? `Admin: ${booking.createdBy.adminName || 'Administrator'}`
                        : booking.createdBy.type === 'staff'
                        ? `Staff: ${booking.createdBy.staffName || 'Staff Member'} (${booking.createdBy.staffId || 'N/A'})`
                        : 'Customer'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Occasion-Specific Information */}
            {booking.occasion && (
              <div className="detail-section">
                <h4>Occasion Details</h4>
                <div className="detail-grid">
                  {/* Dynamic Occasion Fields - Show all fields with labels */}
                  {Object.keys(booking).map((key) => {
                    // Check if this is a dynamic occasion field with label
                    if (key.endsWith('_label') && booking[key]) {
                      const fieldKey = key.replace('_label', '');
                      const fieldValue = booking[fieldKey];
                      const fieldLabel = booking[key];
                      
                      // Only show if field has a value
                      if (fieldValue && fieldValue.toString().trim()) {
                        return (
                          <div key={key} className="detail-item">
                            <span className="label">{fieldLabel}:</span>
                            <span className="value">{fieldValue}</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}

                  {/* Fallback: Render fields from occasionData if label-style fields are absent */}
                  {!Object.keys(booking).some(key => key.endsWith('_label')) &&
                   booking.occasionData &&
                   Object.keys(booking.occasionData).length > 0 && (
                     Object.keys(booking.occasionData).map((fieldKey) => {
                        const fieldValue = booking.occasionData?.[fieldKey];
                       if (!fieldValue || fieldValue.toString().trim() === '') return null;

                       // Prefer human-friendly label from occasions metadata when available
                       const bookingOccasion = occasions.find(occ => occ.name === booking.occasion);
                       const fieldLabel = bookingOccasion?.fieldLabels?.[fieldKey] || fieldKey;

                       return (
                         <div key={`occasionData_${fieldKey}`} className="detail-item">
                           <span className="label">{fieldLabel}:</span>
                           <span className="value">{fieldValue}</span>
                         </div>
                       );
                     })
                  )}
                  
                  {/* Show occasion-specific fields based on database occasions */}
                  {!Object.keys(booking).some(key => key.endsWith('_label')) && (() => {
                    // Find the occasion in our occasions list
                    const bookingOccasion = occasions.find(occ => occ.name === booking.occasion);
                    
                    if (bookingOccasion && bookingOccasion.requiredFields) {
                      // Get all non-basic fields that might be occasion fields
                      const basicFields = [
                        'id', 'customerName', 'email', 'phone', 'theater', 'theaterName', 
                        'date', 'time', 'status', 'amount', 'occasion', 'selectedMovies', 
                        'bookingDate', 'bookingType', 'createdAt', 'updatedAt', '_id', 'bookingId', 'name',
                        'totalAmount', 'createdBy', 'staffId', 'staffName', 'notes', 
                        'isManualBooking', 'expiredAt'
                      ];
                      
                      const possibleOccasionFields = Object.keys(booking).filter(key => 
                        !basicFields.includes(key) && 
                        !key.endsWith('_label') && 
                        !key.endsWith('_value') &&
                        booking[key] && 
                        booking[key].toString().trim() !== ''
                      );
                      
                      return possibleOccasionFields.map((fieldKey, index) => {
                        const fieldValue = booking[fieldKey];
                        
                        // Try to match with database field for proper label
                        let fieldLabel = fieldKey;
                        
                        // Method 1: Direct match with database field
                        if (bookingOccasion.requiredFields.includes(fieldKey)) {
                          fieldLabel = bookingOccasion.fieldLabels?.[fieldKey] || fieldKey;
                        }
                        // Method 2: Position-based match (first found field -> first expected field)
                        else if (index < bookingOccasion.requiredFields.length) {
                          const expectedField = bookingOccasion.requiredFields[index];
                          fieldLabel = bookingOccasion.fieldLabels?.[expectedField] || expectedField;
                        }
                        
                        return (
                          <div key={fieldKey} className="detail-item">
                            <span className="label">{fieldLabel}:</span>
                            <span className="value">{fieldValue}</span>
                          </div>
                        );
                      });
                    }
                    
                    // Fallback: Show any other fields that might contain occasion data
                    return Object.keys(booking).map((key) => {
                      const basicFields = [
                        'id', 'customerName', 'email', 'phone', 'theater', 'theaterName', 
                        'date', 'time', 'status', 'amount', 'occasion', 'selectedMovies', 
                        'bookingDate', 'bookingType', 'createdAt', 'updatedAt', '_id'
                      ];
                      
                      if (basicFields.includes(key) || key.endsWith('_label') || key.endsWith('_value')) {
                        return null;
                      }
                      
                      const fieldValue = booking[key];
                      
                      if (fieldValue && 
                          fieldValue !== '' && 
                          fieldValue !== null && 
                          fieldValue !== undefined &&
                          fieldValue.toString().trim() !== '') {
                        
                        const fieldLabel = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())
                          .replace(/Name$/, ' Name')
                          .replace(/Id$/, ' ID');
                        
                        return (
                          <div key={key} className="detail-item">
                            <span className="label">{fieldLabel}:</span>
                            <span className="value">
                              {Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue.toString()}
                            </span>
                          </div>
                        );
                      }
                      
                      return null;
                    });
                  })()}
                  
                  {/* Show a message if no occasion details found */}
                  {(() => {
                    // Check if we have any dynamic fields
                    const hasDynamicFields = Object.keys(booking).some(key => key.endsWith('_label'));
                    
                    if (hasDynamicFields) {
                      return null; // Dynamic fields are already shown above
                    }
                    
                    // Check if we have any occasion-related fields at all
                    const basicFields = [
                      'id', 'customerName', 'email', 'phone', 'theater', 'theaterName', 
                      'date', 'time', 'status', 'amount', 'occasion', 'selectedMovies', 
                      'bookingDate', 'bookingType', 'createdAt', 'updatedAt', '_id', 'bookingId', 'name',
                      'totalAmount', 'createdBy', 'staffId', 'staffName', 'notes', 
                      'isManualBooking', 'expiredAt', 'occasionData'
                    ];
                    
                    const hasOccasionData = (
                      // Top-level non-basic fields that carry occasion info
                      Object.keys(booking).some(key => {
                        if (basicFields.includes(key) || key.endsWith('_label') || key.endsWith('_value')) {
                          return false;
                        }
                        const value = booking[key];
                        return value && value !== '' && value !== null && value !== undefined && value.toString().trim() !== '';
                      })
                      // Or fields present inside occasionData map
                      || (
                        booking.occasionData &&
                        Object.values(booking.occasionData).some(val => val && val.toString().trim() !== '')
                      )
                    );
                    
                    if (!hasOccasionData) {
                      return (
                        <div className="detail-item">
                          <span className="label">Details:</span>
                          <span className="value">
                            No additional occasion details available 
                            <br />
                            <small style={{ color: '#666', fontSize: '0.85em' }}>
                              (booking created before dynamic fields were implemented)
                            </small>
                          </span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
            )}

            {/* Selected Items (conditional) - Dynamic check for any service items */}
            {(() => {
              // Check for movies
              const hasMovies = Array.isArray(booking.selectedMovies) && booking.selectedMovies.length > 0;
              
              // Check for any dynamic service items (fields starting with "selected")
              const hasDynamicItems = Object.keys(booking).some(key => 
                key.startsWith('selected') && 
                key !== 'selectedMovies' && 
                Array.isArray(booking[key]) && 
                booking[key].length > 0
              );
              
              return hasMovies || hasDynamicItems;
            })() && (
              <div className="detail-section">
                <h4>Selected Items</h4>
                <div className="items-container">
                  {/* Movies Section */}
                  {Array.isArray(booking.selectedMovies) && booking.selectedMovies.length > 0 && (
                    <div className="items-category">
                      <h5 className="category-title">Movies</h5>
                      <div className="items-list">
                        {booking.selectedMovies.map((movie: any, index: number) => {
                          // Extract full movie name from different possible formats
                          let movieName = 'Unknown Movie';
                          if (typeof movie === 'string') {
                            movieName = movie;
                          } else if (typeof movie === 'object') {
                            // Try different name fields and clean up the name
                            movieName = movie?.name || movie?.title || movie?.movieName || movie?.id || 'Unknown Movie';
                            
                            // Clean up movie name if it contains ID prefixes
                            if (movieName && typeof movieName === 'string') {
                              // Remove common ID patterns like "questions_and..." -> "Questions And..."
                              if (movieName.includes('_')) {
                                movieName = movieName
                                  .split('_')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
                              }
                              // Remove "..." at the end and replace with full name
                              if (movieName.endsWith('...')) {
                                movieName = movieName.replace('...', '');
                              }
                            }
                          }
                          
                          const moviePrice = typeof movie === 'object' ? movie?.price : 0;
                          const movieQuantity = typeof movie === 'object' ? movie?.quantity : 1;
                          
                          return (
                            <div key={index} className="item-card">
                              <div className="item-info">
                                <span className="item-name">{movieName}</span>
                                {typeof movie === 'object' && (
                                  <div className="item-details">
                                    <span className="item-quantity">Qty: {movieQuantity}</span>
                                    <span className="item-price">₹{moviePrice?.toLocaleString() || 0}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Service Items Sections */}
                  {Object.keys(booking)
                    .filter(key => 
                      key.startsWith('selected') && 
                      key !== 'selectedMovies' && 
                      Array.isArray(booking[key]) && 
                      booking[key].length > 0
                    )
                    .map(serviceKey => {
                      const serviceName = serviceKey.replace('selected', '');
                      const serviceItems = booking[serviceKey];
                      
                      return (
                        <div key={serviceKey} className="items-category">
                          <h5 className="category-title">{serviceName}</h5>
                          <div className="items-list">
                            {serviceItems.map((item: any, index: number) => {
                              const itemName = typeof item === 'string' ? item : (item?.name ?? item?.title ?? item?.id ?? `Unknown ${serviceName}`);
                              const itemPrice = typeof item === 'object' ? item?.price : 0;
                              const itemQuantity = typeof item === 'object' ? item?.quantity : 1;
                              
                              return (
                                <div key={index} className="item-card">
                                  <div className="item-info">
                                    <span className="item-name">{itemName}</span>
                                    {typeof item === 'object' && (
                                      <div className="item-details">
                                        <span className="item-quantity">Qty: {itemQuantity}</span>
                                        <span className="item-price">₹{itemPrice?.toLocaleString() || 0}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  }

                  {/* Items Total */}
                  {(() => {
                    let totalItemsPrice = 0;
                    
                    // Calculate total from all items dynamically
                    Object.keys(booking).forEach(key => {
                      if (key.startsWith('selected') && Array.isArray(booking[key])) {
                        booking[key].forEach((item: any) => {
                          if (typeof item === 'object' && item?.price && item?.quantity) {
                            totalItemsPrice += item.price * item.quantity;
                          }
                        });
                      }
                    });
                    
                    if (totalItemsPrice > 0) {
                      return (
                        <div className="items-total">
                          <div className="total-line">
                            <span className="total-label">Total Items Cost:</span>
                            <span className="total-amount">₹{totalItemsPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
            )}

            {!hidePaymentSummary && (
            <div className="detail-section">
              <h4>Payment Summary</h4>
              <div className="detail-grid">
                {/* 1. Booking ID */}
                <div className="detail-item">
                  <span className="label">Booking ID:</span>
                  <span className="value">{booking.originalBookingId || booking.id}</span>
                </div>
                
                {/* 2. Theater Base Price */}
                <div className="detail-item">
                  <span className="label">Theater Base Price:</span>
                  <span className="value">₹{(booking.pricingData?.theaterBasePrice || 1399).toLocaleString()}</span>
                </div>
                
                {/* 3. Extra Guest Fee (per guest rate) */}
                {booking.pricingData?.extraGuestFee && (
                  <div className="detail-item">
                    <span className="label">Extra Guest Fee:</span>
                    <span className="value">₹{booking.pricingData.extraGuestFee.toLocaleString()} per guest</span>
                  </div>
                )}
                
                {/* 4. Price of Guests (total extra guest charges) */}
                {(() => {
                  const numberOfPeople = booking.numberOfPeople || 2;
                  const extraGuestFee = booking.pricingData?.extraGuestFee || 299;
                  const storedExtraGuestCharges = booking.extraGuestCharges;
                  const storedExtraGuestsCount = booking.extraGuestsCount;
                  
                  const getTheaterCapacity = (theaterName: string) => {
                    if (theaterName?.includes('EROS') || theaterName?.includes('FMT-Hall-1')) return { min: 2, max: 4 };
                    if (theaterName?.includes('PHILIA') || theaterName?.includes('FMT-Hall-2')) return { min: 2, max: 6 };
                    if (theaterName?.includes('PRAGMA') || theaterName?.includes('FMT-Hall-3')) return { min: 2, max: 8 };
                    if (theaterName?.includes('STORGE') || theaterName?.includes('FMT-Hall-4')) return { min: 2, max: 10 };
                    return { min: 2, max: 10 };
                  };
                  
                  const capacity = getTheaterCapacity(booking.theater || booking.theaterName || '');
                  // Use stored baseCapacity if available, otherwise calculate
                  const baseCapacity = booking.baseCapacity || booking.theaterCapacity?.min || capacity.min;
                  const extraGuests = storedExtraGuestsCount !== undefined ? storedExtraGuestsCount : Math.max(0, numberOfPeople - baseCapacity);
                  const extraGuestCharges = storedExtraGuestCharges || (extraGuests * extraGuestFee);
                  
                  if (extraGuests > 0) {
                    return (
                      <div className="detail-item">
                        <span className="label">Price of Guests:</span>
                        <span className="value">
                          {extraGuests} guest{extraGuests > 1 ? 's' : ''} × ₹{extraGuestFee.toLocaleString()} = ₹{extraGuestCharges.toLocaleString()}
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="detail-item">
                        <span className="label">Price of Guests:</span>
                        <span className="value">No extra guests (Base capacity: {booking.baseCapacity || booking.theaterCapacity?.min || capacity.min})</span>
                      </div>
                    );
                  }
                })()}
                
                {/* 5. Slot Booking Fee */}
                <div className="detail-item">
                  <span className="label">Slot Booking Fee:</span>
                  <span className="value">₹{(booking.advancePayment || booking.pricingData?.slotBookingFee || 499).toLocaleString()}</span>
                </div>
                
                {/* 6. Venue Payment */}
                <div className="detail-item">
                  <span className="label">Venue Payment:</span>
                  <span className="value">₹{(booking.venuePayment || (((booking.totalAmount ?? booking.amount) as number || 0) - (booking.pricingData?.slotBookingFee || 499))).toLocaleString()}</span>
                </div>
                
                {/* 7. Total Amount */}
                <div className="detail-item">
                  <span className="label">Total Amount:</span>
                  <span className="value" style={{ fontWeight: 'bold', color: '#28a745' }}>
                    ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Booking Detail Popup */
        .booking-detail-popup {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }

        .popup-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .popup-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .edit-btn-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-btn-header:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .edit-btn-header span {
          font-size: 16px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .popup-body {
          padding: 1.5rem;
        }

        .detail-section {
          margin-bottom: 2rem;
        }

        .detail-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item .label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
        }

        .detail-item .value {
          color: #333;
          font-size: 0.95rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.confirmed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.cancelled {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.completed {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-badge.manual {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.incomplete {
          background: #e2e3e5;
          color: #383d41;
        }

        /* Items Container Styles */
        .items-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .items-category {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid #007bff;
        }

        .category-title {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .item-card {
          background: white;
          border-radius: 6px;
          padding: 0.75rem;
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;
        }

        .item-card:hover {
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
          border-color: #007bff;
        }

        .item-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .item-name {
          font-weight: 500;
          color: #333;
          flex: 1;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          max-width: 100%;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          min-width: fit-content;
        }

        .item-quantity {
          font-size: 0.85rem;
          color: #666;
          background: #e9ecef;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
        }

        .item-price {
          font-weight: 600;
          color: #28a745;
          font-size: 0.9rem;
        }

        .items-total {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #007bff;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
        }

        .total-label {
          font-weight: 600;
          color: #333;
        }

        .total-amount {
          font-weight: 700;
          color: #28a745;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .popup-content {
            width: 95%;
            margin: 1rem;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .popup-header {
            padding: 1rem;
          }

          .popup-body {
            padding: 1rem;
          }

          .item-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .item-details {
            align-items: flex-start;
            flex-direction: row;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .popup-content {
            width: 100%;
            height: 100vh;
            border-radius: 0;
            max-height: none;
          }

          .popup-header h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
}
