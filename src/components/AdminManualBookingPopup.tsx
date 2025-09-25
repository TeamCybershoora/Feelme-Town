'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, Users, MapPin, User, Mail, Phone, Gift, Cake, Sparkles, Play, Star, Check, CheckCircle } from 'lucide-react';

interface AdminManualBookingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  theater: string;
  date: string;
  time: string;
  numberOfPeople: number;
  occasion: string;
  selectedCakes: string[];
  selectedDecorItems: string[];
  selectedGifts: string[];
  selectedMovies: string[];
  wantMovies: 'Yes' | 'No';
  totalAmount: number;
  advancePayment: number;
  venuePayment: number;
  status: string;
  notes: string;
}

interface AdminManualBookingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminManualBookingPopup({ isOpen, onClose }: AdminManualBookingPopupProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Customer' | 'Booking' | 'Items' | 'Payment' | 'Review'>('Customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState<AdminManualBookingForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    theater: 'theater1',
    date: '',
    time: '',
    numberOfPeople: 2,
    occasion: '',
    selectedCakes: [],
    selectedDecorItems: [],
    selectedGifts: [],
    selectedMovies: [],
    wantMovies: 'No',
    totalAmount: 0,
    advancePayment: 0,
    venuePayment: 0,
    status: 'Confirmed',
    notes: ''
  });

  const theaters = [
    {
      id: 'theater1',
      name: 'Theater 1',
      image: '/images/theater1.webp',
      capacity: '2-4 People',
      price: '₹1,399',
      features: ['Premium Sound', '4K Display', 'Comfortable Seating']
    },
    {
      id: 'theater2', 
      name: 'Theater 2',
      image: '/images/theater2.webp',
      capacity: '2-6 People',
      price: '₹1,599',
      features: ['Dolby Atmos', '8K Display', 'Recliner Seats']
    },
    {
      id: 'theater3',
      name: 'Theater 3', 
      image: '/images/theater3.webp',
      capacity: '2-8 People',
      price: '₹1,799',
      features: ['Premium Audio', 'Ultra HD', 'VIP Experience']
    }
  ];
  const timeSlots = ['6:00 PM', '8:00 PM', '10:00 PM'];
  const occasions = ['Birthday', 'Anniversary', 'Date Night', 'Family Time', 'Corporate Event', 'Other'];

  const cakes = [
    { id: 'cake1', name: 'Chocolate Cake', price: 299, rating: 4.8, image: '🍫', bestseller: true },
    { id: 'cake2', name: 'Vanilla Cake', price: 249, rating: 4.6, image: '🍰', bestseller: false },
    { id: 'cake3', name: 'Red Velvet Cake', price: 349, rating: 4.9, image: '❤️', bestseller: true },
    { id: 'cake4', name: 'Strawberry Cake', price: 299, rating: 4.7, image: '🍓', bestseller: false },
    { id: 'cake5', name: 'Black Forest Cake', price: 399, rating: 4.8, image: '🍒', bestseller: true },
    { id: 'cake6', name: 'Cheesecake', price: 449, rating: 4.9, image: '🧀', bestseller: false }
  ];

  const decorItems = [
    { id: 'decor1', name: 'Balloons', price: 150, rating: 4.5, image: '🎈', category: 'Essential' },
    { id: 'decor2', name: 'Flowers', price: 200, rating: 4.8, image: '🌹', category: 'Premium' },
    { id: 'decor3', name: 'Candles', price: 100, rating: 4.3, image: '🕯️', category: 'Essential' },
    { id: 'decor4', name: 'Banner', price: 120, rating: 4.4, image: '🎯', category: 'Essential' },
    { id: 'decor5', name: 'Photo Booth', price: 500, rating: 4.9, image: '📸', category: 'Premium' },
    { id: 'decor6', name: 'LED Lights', price: 180, rating: 4.6, image: '💡', category: 'Premium' }
  ];

  const gifts = [
    { id: 'gift1', name: 'Chocolate Box', price: 199, rating: 4.7, image: '🍫', category: 'Sweet' },
    { id: 'gift2', name: 'Flower Bouquet', price: 299, rating: 4.8, image: '💐', category: 'Romantic' },
    { id: 'gift3', name: 'Teddy Bear', price: 149, rating: 4.5, image: '🧸', category: 'Cute' },
    { id: 'gift4', name: 'Photo Frame', price: 99, rating: 4.2, image: '🖼️', category: 'Memory' },
    { id: 'gift5', name: 'Perfume', price: 599, rating: 4.6, image: '🌸', category: 'Luxury' },
    { id: 'gift6', name: 'Jewelry', price: 899, rating: 4.9, image: '💎', category: 'Luxury' }
  ];

  const movies = [
    'Action Movie',
    'Romance Movie',
    'Comedy Movie',
    'Horror Movie',
    'Sci-Fi Movie'
  ];

  // Restore form data when component mounts
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('adminBookingFormData');
    const isFromMoviesPage = sessionStorage.getItem('adminBookingFromPopup') === 'true';
    
    if (savedFormData && isFromMoviesPage) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        
        // Check if a movie was selected from movies page
        const selectedMovie = sessionStorage.getItem('selectedMovie');
        if (selectedMovie && !parsedData.selectedMovies.includes(selectedMovie)) {
          setFormData(prev => ({
            ...prev,
            selectedMovies: [...prev.selectedMovies, selectedMovie]
          }));
        }
        
        // Clear the session storage flags
        sessionStorage.removeItem('adminBookingFormData');
        sessionStorage.removeItem('adminBookingFromPopup');
        sessionStorage.removeItem('selectedMovie');
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Check if we need to reopen the popup when returning from movies page
  useEffect(() => {
    const shouldReopen = sessionStorage.getItem('reopenAdminBookingPopup') === 'true';
    if (shouldReopen && !isOpen) {
      // Force reopen the popup by calling the parent's open function
      // This will be handled by the parent component
      sessionStorage.removeItem('reopenAdminBookingPopup');
    }
  }, [isOpen]);

  const calculateTotal = () => {
    let total = 1399; // Base theater price
    
    // Extra guest charges (₹400 per guest beyond 2)
    const extraGuests = Math.max(0, formData.numberOfPeople - 2);
    total += extraGuests * 400;
    
    // Add selected items (with safety checks)
    (formData.selectedCakes || []).forEach(cakeId => {
      const cake = cakes.find(c => c.id === cakeId);
      if (cake) total += cake.price;
    });
    
    (formData.selectedDecorItems || []).forEach(itemId => {
      const item = decorItems.find(d => d.id === itemId);
      if (item) total += item.price;
    });
    
    (formData.selectedGifts || []).forEach(giftId => {
      const gift = gifts.find(g => g.id === giftId);
      if (gift) total += gift.price;
    });
    
    (formData.selectedMovies || []).forEach(() => {
      total += 100; // ₹100 per movie
    });
    
    return total;
  };

  const handleInputChange = (field: keyof AdminManualBookingForm, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle movie selection - navigate to movies page and keep popup open
  const handleSelectMovies = () => {
    // Store current form data in sessionStorage before navigating
    sessionStorage.setItem('adminBookingFormData', JSON.stringify(formData));
    sessionStorage.setItem('adminBookingFromPopup', 'true');
    sessionStorage.setItem('adminBookingPopupOpen', 'true');
    
    // Navigate to movies page immediately (don't close popup)
    router.push('/movies?from=admin-booking');
  };

  const handleItemToggle = (type: 'cakes' | 'decorItems' | 'gifts' | 'movies', itemId: string) => {
    setFormData(prev => {
      const fieldMap = {
        'cakes': 'selectedCakes',
        'decorItems': 'selectedDecorItems', 
        'gifts': 'selectedGifts',
        'movies': 'selectedMovies'
      };
      
      const fieldName = fieldMap[type] as keyof AdminManualBookingForm;
      const currentArray = prev[fieldName] as string[] || [];
      
      return {
        ...prev,
        [fieldName]: currentArray.includes(itemId)
          ? currentArray.filter(id => id !== itemId)
          : [...currentArray, itemId]
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const totalAmount = calculateTotal();
    const advancePayment = Math.round(totalAmount * 0.25); // 25% advance
    const venuePayment = totalAmount - advancePayment;
    
    const bookingData = {
      ...formData,
      totalAmount,
      advancePayment,
      venuePayment,
      isManualBooking: true,
      bookingType: 'Manual',
      createdBy: 'Admin'
    };

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          // Reset form
          setFormData({
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            theater: 'Theater 1',
            date: '',
            time: '',
            numberOfPeople: 2,
            occasion: '',
            selectedCakes: [],
            selectedDecorItems: [],
            selectedGifts: [],
            selectedMovies: [],
            wantMovies: 'No',
            totalAmount: 0,
            advancePayment: 0,
            venuePayment: 0,
            status: 'Confirmed',
            notes: ''
          });
        }, 2000);
      } else {
        alert('Error creating booking: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating booking');
    }
    
    setIsSubmitting(false);
  };

  const nextTab = () => {
    const tabs = ['Customer', 'Booking', 'Items', 'Payment', 'Review'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as 'Customer' | 'Booking' | 'Items' | 'Payment' | 'Review');
    }
  };

  const prevTab = () => {
    const tabs = ['Customer', 'Booking', 'Items', 'Payment', 'Review'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1] as 'Customer' | 'Booking' | 'Items' | 'Payment' | 'Review');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-manual-booking-overlay">
      <div className="admin-manual-booking-popup">
        <div className="popup-header">
          <h2>Manual Booking - Admin Panel</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="popup-tabs">
          {['Customer', 'Booking', 'Items', 'Payment', 'Review'].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as 'Customer' | 'Booking' | 'Items' | 'Payment' | 'Review')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="popup-content">
          {activeTab === 'Customer' && (
            <div className="tab-content">
              <h3>Customer Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <div className="input-label">Enter the customer&apos;s full name</div>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer full name"
                    title="Enter the customer's full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <div className="input-label">Enter the customer&apos;s email address for booking confirmation</div>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter customer email address"
                    title="Enter the customer's email address for booking confirmation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <div className="input-label">Enter the customer&apos;s phone number for contact</div>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Enter customer phone number"
                    title="Enter the customer's phone number for contact"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Occasion</label>
                  <div className="input-label">Select the occasion for this booking</div>
                  <select
                    value={formData.occasion}
                    onChange={(e) => handleInputChange('occasion', e.target.value)}
                    title="Select the occasion for this booking"
                  >
                    <option value="">Select occasion</option>
                    {occasions.map(occasion => (
                      <option key={occasion} value={occasion}>{occasion}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Booking' && (
            <div className="tab-content">
              <h3>Booking Details</h3>
              
              <div className="theater-selection">
                <h4>Select Theater *</h4>
                <div className="theaters-grid">
                  {theaters.map(theater => (
                    <div
                      key={theater.id}
                      className={`theater-card ${formData.theater === theater.id ? 'selected' : ''}`}
                      onClick={() => handleInputChange('theater', theater.id)}
                    >
                      <div className="theater-image">
                        <img src={theater.image} alt={theater.name} />
                      </div>
                      <div className="theater-info">
                        <h5>{theater.name}</h5>
                        <p className="capacity">{theater.capacity}</p>
                        <p className="price">{theater.price}</p>
                        <div className="features">
                          {theater.features.map((feature, index) => (
                            <span key={index} className="feature-tag">{feature}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Booking Date *</label>
                  <div className="input-label">Select the date for the booking</div>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    title="Select the date for the booking"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time Slot *</label>
                  <div className="input-label">Select the time slot for the booking</div>
                  <select
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    title="Select the time slot for the booking"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of People *</label>
                  <div className="input-label">Enter the number of people for this booking</div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.numberOfPeople}
                    onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value))}
                    title="Enter the number of people for this booking"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Want Movies?</label>
                  <div className="input-label">Select if you want to include movies in this booking</div>
                  <select
                    value={formData.wantMovies}
                    onChange={(e) => handleInputChange('wantMovies', e.target.value)}
                    title="Select if you want to include movies in this booking"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  {formData.wantMovies === 'Yes' && (
                    <button 
                      className="select-movies-btn-inline"
                      onClick={handleSelectMovies}
                    >
                      <Play className="w-4 h-4" />
                      Select Movies
                    </button>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Additional Notes</label>
                  <div className="input-label">Enter any additional notes or special requirements for this booking</div>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes or special requirements..."
                    title="Enter any additional notes or special requirements for this booking"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Items' && (
            <div className="tab-content">
              <h3>Select Items</h3>
              
              <div className="items-section">
                <h4>
                  <Cake className="w-5 h-5" />
                  Delicious Cakes
                </h4>
                <div className="items-grid">
                  {cakes.map(cake => (
                    <div
                      key={cake.id}
                      className={`item-card ${formData.selectedCakes.includes(cake.id) ? 'selected' : ''}`}
                      title={`Click to select ${cake.name} for ₹${cake.price}`}
                      onClick={() => handleItemToggle('cakes', cake.id)}
                    >
                      {cake.bestseller && <div className="item-badge">Bestseller</div>}
                      <div className="item-image">{cake.image}</div>
                      <div className="item-content">
                        <h5>{cake.name}</h5>
                        <div className="item-rating">
                          <Star className="w-4 h-4" />
                          <span>{cake.rating}</span>
                        </div>
                        <div className="item-price">₹{cake.price}</div>
                      </div>
                      {formData.selectedCakes.includes(cake.id) && <Check className="w-5 h-5" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="items-section">
                <h4>
                  <Sparkles className="w-5 h-5" />
                  Decoration Items
                </h4>
                <div className="items-grid">
                  {decorItems.map(item => (
                    <div
                      key={item.id}
                      className={`item-card ${formData.selectedDecorItems.includes(item.id) ? 'selected' : ''}`}
                      title={`Click to select ${item.name} for ₹${item.price}`}
                      onClick={() => handleItemToggle('decorItems', item.id)}
                    >
                      <div className="item-category">{item.category}</div>
                      <div className="item-image">{item.image}</div>
                      <div className="item-content">
                        <h5>{item.name}</h5>
                        <div className="item-rating">
                          <Star className="w-4 h-4" />
                          <span>{item.rating}</span>
                        </div>
                        <div className="item-price">₹{item.price}</div>
                      </div>
                      {formData.selectedDecorItems.includes(item.id) && <Check className="w-5 h-5" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="items-section">
                <h4>
                  <Gift className="w-5 h-5" />
                  Special Gifts
                </h4>
                <div className="items-grid">
                  {gifts.map(gift => (
                    <div
                      key={gift.id}
                      className={`item-card ${formData.selectedGifts.includes(gift.id) ? 'selected' : ''}`}
                      title={`Click to select ${gift.name} for ₹${gift.price}`}
                      onClick={() => handleItemToggle('gifts', gift.id)}
                    >
                      <div className="item-category">{gift.category}</div>
                      <div className="item-image">{gift.image}</div>
                      <div className="item-content">
                        <h5>{gift.name}</h5>
                        <div className="item-rating">
                          <Star className="w-4 h-4" />
                          <span>{gift.rating}</span>
                        </div>
                        <div className="item-price">₹{gift.price}</div>
                      </div>
                      {formData.selectedGifts.includes(gift.id) && <Check className="w-5 h-5" />}
                    </div>
                  ))}
                </div>
              </div>

              {formData.wantMovies === 'Yes' && (
                <div className="items-section">
                  <h4>
                    <Play className="w-5 h-5" />
                    Movie Selection
                  </h4>
                  <div className="movie-selection-info">
                    <p>Click the button below to select movies from our movie collection.</p>
                    <button 
                      className="select-movies-btn"
                      onClick={handleSelectMovies}
                    >
                      <Play className="w-4 h-4" />
                      Select Movies
                    </button>
                  </div>
                  {formData.selectedMovies.length > 0 && (
                    <div className="selected-movies">
                      <h5>Selected Movies:</h5>
                      <div className="selected-movies-list">
                        {formData.selectedMovies.map(movie => (
                          <div key={movie} className="selected-movie-item">
                            <span>{movie}</span>
                            <button 
                              onClick={() => handleItemToggle('movies', movie)}
                              className="remove-movie-btn"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Payment' && (
            <div className="tab-content">
              <h3>Payment Details</h3>
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Base Theater Price:</span>
                  <span>₹1,399</span>
                </div>
                {formData.numberOfPeople > 2 && (
                  <div className="summary-row">
                    <span>Extra Guests ({(formData.numberOfPeople - 2)} × ₹400):</span>
                    <span>₹{(formData.numberOfPeople - 2) * 400}</span>
                  </div>
                )}
                {formData.selectedCakes.length > 0 && (
                  <div className="summary-row">
                    <span>Cakes:</span>
                    <span>₹{formData.selectedCakes.reduce((total, cakeId) => {
                      const cake = cakes.find(c => c.id === cakeId);
                      return total + (cake?.price || 0);
                    }, 0)}</span>
                  </div>
                )}
                {formData.selectedDecorItems.length > 0 && (
                  <div className="summary-row">
                    <span>Decor Items:</span>
                    <span>₹{formData.selectedDecorItems.reduce((total, itemId) => {
                      const item = decorItems.find(d => d.id === itemId);
                      return total + (item?.price || 0);
                    }, 0)}</span>
                  </div>
                )}
                {formData.selectedGifts.length > 0 && (
                  <div className="summary-row">
                    <span>Gifts:</span>
                    <span>₹{formData.selectedGifts.reduce((total, giftId) => {
                      const gift = gifts.find(g => g.id === giftId);
                      return total + (gift?.price || 0);
                    }, 0)}</span>
                  </div>
                )}
                {formData.selectedMovies.length > 0 && (
                  <div className="summary-row">
                    <span>Movies:</span>
                    <span>₹{formData.selectedMovies.length * 100}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
                <div className="summary-row">
                  <span>Advance Payment (25%):</span>
                  <span>₹{Math.round(calculateTotal() * 0.25)}</span>
                </div>
                <div className="summary-row">
                  <span>Venue Payment (75%):</span>
                  <span>₹{Math.round(calculateTotal() * 0.75)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Review' && (
            <div className="tab-content">
              <h3>Review & Confirm</h3>
              <div className="review-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {formData.customerName}</p>
                <p><strong>Email:</strong> {formData.customerEmail}</p>
                <p><strong>Phone:</strong> {formData.customerPhone}</p>
                <p><strong>Occasion:</strong> {formData.occasion || 'Not specified'}</p>
              </div>
              
              <div className="review-section">
                <h4>Booking Details</h4>
                <p><strong>Theater:</strong> {theaters.find(t => t.id === formData.theater)?.name || formData.theater}</p>
                <p><strong>Date:</strong> {formData.date}</p>
                <p><strong>Time:</strong> {formData.time}</p>
                <p><strong>People:</strong> {formData.numberOfPeople}</p>
                <p><strong>Want Movies:</strong> {formData.wantMovies}</p>
                {formData.wantMovies === 'Yes' && formData.selectedMovies.length > 0 && (
                  <p><strong>Selected Movies:</strong> {formData.selectedMovies.join(', ')}</p>
                )}
                <p><strong>Status:</strong> {formData.status}</p>
                {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
              </div>
              
              <div className="review-section">
                <h4>Selected Items</h4>
                {formData.selectedCakes.length > 0 && (
                  <p><strong>Cakes:</strong> {formData.selectedCakes.map(id => cakes.find(c => c.id === id)?.name).join(', ')}</p>
                )}
                {formData.selectedDecorItems.length > 0 && (
                  <p><strong>Decor:</strong> {formData.selectedDecorItems.map(id => decorItems.find(d => d.id === id)?.name).join(', ')}</p>
                )}
                {formData.selectedGifts.length > 0 && (
                  <p><strong>Gifts:</strong> {formData.selectedGifts.map(id => gifts.find(g => g.id === id)?.name).join(', ')}</p>
                )}
                {formData.selectedMovies.length > 0 && (
                  <p><strong>Movies:</strong> {formData.selectedMovies.join(', ')}</p>
                )}
              </div>
              
              <div className="review-section">
                <h4>Payment Summary</h4>
                <p><strong>Total Amount:</strong> ₹{calculateTotal()}</p>
                <p><strong>Advance Payment:</strong> ₹{Math.round(calculateTotal() * 0.25)}</p>
                <p><strong>Venue Payment:</strong> ₹{Math.round(calculateTotal() * 0.75)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="popup-footer">
          {activeTab !== 'Customer' && (
            <button className="btn-secondary" onClick={prevTab}>
              Previous
            </button>
          )}
          {activeTab !== 'Review' ? (
            <button className="btn-primary" onClick={nextTab}>
              Next
            </button>
          ) : (
            <button 
              className="btn-success" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Create Manual Booking'}
            </button>
          )}
        </div>

        {isSuccess && (
          <div className="success-overlay">
            <div className="success-message">
              <CheckCircle size={48} />
              <h3>Booking Created Successfully!</h3>
              <p>Manual booking has been created and saved to the database.</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-manual-booking-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(5px);
        }

        .admin-manual-booking-popup {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .popup-header {
          background: #ff0000;
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .popup-header h2 {
          margin: 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .popup-tabs {
          display: flex;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .tab {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #666;
          transition: all 0.3s ease;
        }

        .tab.active {
          background: white;
          color: #ff0000;
          border-bottom: 2px solid #ff0000;
        }

        .popup-content {
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .tab-content h3 {
          margin: 0 0 1.5rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #333;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-weight: 500;
          color: #000000;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
          color: #333333;
          font-style: italic;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #000000;
          background: white;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #666666;
        }

        .form-group select option {
          color: #000000;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #ff0000;
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }

        .theater-selection {
          margin-bottom: 2rem;
        }

        .theater-selection h4 {
          margin: 0 0 1rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #ffffff;
        }

        .theaters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .theater-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .theater-card:hover {
          border-color: #ff0000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .theater-card.selected {
          border-color: #ff0000;
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }

        .theater-image {
          width: 100%;
          height: 150px;
          overflow: hidden;
        }

        .theater-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .theater-info {
          padding: 1rem;
        }

        .theater-info h5 {
          margin: 0 0 0.5rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #333;
          font-size: 1.1rem;
        }

        .theater-info .capacity {
          margin: 0 0 0.25rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .theater-info .price {
          margin: 0 0 0.75rem 0;
          color: #ff0000;
          font-weight: 600;
          font-size: 1rem;
        }

        .features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .feature-tag {
          background: #f8f9fa;
          color: #666;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .items-section {
          margin-bottom: 2rem;
        }

        .items-section h4 {
          margin: 0 0 1rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .item-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 200px;
        }

        .item-card:hover {
          border-color: #ff0000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .item-card.selected {
          border-color: #ff0000;
          background: #fff5f5;
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }

        .item-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #ff0000;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          z-index: 2;
        }

        .item-category {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
          z-index: 2;
        }

        .item-image {
          font-size: 2rem;
          text-align: center;
          margin: 1rem 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .item-content h5 {
          margin: 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #333;
          font-size: 1rem;
          text-align: center;
        }

        .item-rating {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          color: #666;
          font-size: 0.8rem;
        }

        .item-rating svg {
          color: #ffc107;
        }

        .item-price {
          color: #ff0000;
          font-weight: 600;
          font-size: 1.1rem;
          text-align: center;
          margin-top: auto;
        }

        .item-card .w-5 {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: #ff0000;
          background: white;
          border-radius: 50%;
          padding: 0.25rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .movie-selection-info {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .movie-selection-info p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
        }

        .select-movies-btn {
          background: #ff0000;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .select-movies-btn:hover {
          background: #cc0000;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
        }

        .selected-movies {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .selected-movies h5 {
          color: #ffffff;
          margin: 0 0 0.75rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
        }

        .selected-movies-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .selected-movie-item {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #ffffff;
        }

        .selected-movie-item span {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .remove-movie-btn {
          background: none;
          border: none;
          color: #ff0000;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-movie-btn:hover {
          background: rgba(255, 0, 0, 0.1);
        }

        .select-movies-btn-inline {
          background: #ff0000;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          width: 100%;
          justify-content: center;
        }

        .select-movies-btn-inline:hover {
          background: #cc0000;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
        }

        .payment-summary {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #dee2e6;
        }

        .summary-row.total {
          font-weight: 600;
          font-size: 1.1rem;
          color: #ff0000;
          border-bottom: 2px solid #ff0000;
        }

        .review-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .review-section h4 {
          margin: 0 0 1rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          color: #333;
        }

        .review-section p {
          margin: 0.5rem 0;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .popup-footer {
          padding: 1.5rem;
          background: #f8f9fa;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .btn-primary,
        .btn-secondary,
        .btn-success {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #ff0000;
          color: white;
        }

        .btn-primary:hover {
          background: #e60000;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-success:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .success-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .success-message {
          text-align: center;
          color: #28a745;
        }

        .success-message h3 {
          margin: 1rem 0;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
        }

        .success-message p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          color: #666;
        }

        @media (max-width: 768px) {
          .admin-manual-booking-popup {
            width: 95%;
            max-height: 95vh;
          }

          .popup-content {
            padding: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .popup-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
