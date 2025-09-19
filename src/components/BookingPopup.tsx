'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, Minus, X, Check, Star, Calendar, Clock, Users, MapPin, Gift, Cake, Sparkles, Play } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';


interface BookingForm {
  bookingName: string;
  numberOfPeople: number;
  whatsappNumber: string;
  emailAddress: string;
  occasion: string;
  selectedCakes: string[];
  selectedDecorItems: string[];
  selectedGifts: string[];
  // Overview section options
  wantCakes: 'Yes' | 'No';
  wantDecorItems: 'Yes' | 'No';
  wantGifts: 'Yes' | 'No';
  promoCode: string;
}

interface BookingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingPopup({ isOpen, onClose }: BookingPopupProps) {
  const { selectedTheater, selectedDate, selectedTimeSlot } = useBooking();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items'>('Overview');
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState<BookingForm>({
    bookingName: '',
    numberOfPeople: 2,
    whatsappNumber: '',
    emailAddress: '',
    occasion: '',
    selectedCakes: [],
    selectedDecorItems: [],
    selectedGifts: [],
    wantCakes: 'No',
    wantDecorItems: 'No',
    wantGifts: 'No',
    promoCode: ''
  });

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      bookingName: '',
      numberOfPeople: 2,
      whatsappNumber: '',
      emailAddress: '',
      occasion: '',
      selectedCakes: [],
      selectedDecorItems: [],
      selectedGifts: [],
      wantCakes: 'No',
      wantDecorItems: 'No',
      wantGifts: 'No',
      promoCode: ''
    });
    setActiveTab('Overview');
    setIsLoaded(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form when popup opens to ensure fresh start
      resetForm();
      setIsLoaded(true);
      
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Disable body scroll when popup is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Add class to body for additional CSS control
      document.body.classList.add('popup-open');
      
      // Store cleanup function
      const cleanup = () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        document.body.classList.remove('popup-open');
        window.scrollTo(0, scrollY);
      };
      
      return cleanup;
    } else {
      // Enable body scroll when popup is closed
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.classList.remove('popup-open');
    }
  }, [isOpen]);

  // Dynamic tabs based on selections
  const getAvailableTabs = () => {
    const availableTabs: ('Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items')[] = ['Overview', 'Occasion'];
    
    if (formData.wantCakes === 'Yes') {
      availableTabs.push('Cakes');
    }
    if (formData.wantDecorItems === 'Yes') {
      availableTabs.push('Decor Items');
    }
    if (formData.wantGifts === 'Yes') {
      availableTabs.push('Gifts Items');
    }
    
    return availableTabs;
  };

  const tabs = getAvailableTabs();

  const occasionOptions = [
    { name: 'Birthday Party', icon: '🎂', popular: true },
    { name: 'Anniversary', icon: '💕', popular: true },
    { name: 'Date Night', icon: '🌹', popular: false },
    { name: 'Proposal', icon: '💍', popular: true },
    { name: "Valentine's Day", icon: '❤️', popular: false },
    { name: 'Custom Celebration', icon: '🎉', popular: false }
  ];

  const cakeOptions = [
    { name: 'Chocolate Cake', price: 299, rating: 4.8, image: '🍫', bestseller: true },
    { name: 'Vanilla Cake', price: 249, rating: 4.6, image: '🍰', bestseller: false },
    { name: 'Red Velvet Cake', price: 349, rating: 4.9, image: '❤️', bestseller: true },
    { name: 'Strawberry Cake', price: 299, rating: 4.7, image: '🍓', bestseller: false },
    { name: 'Black Forest Cake', price: 399, rating: 4.8, image: '🍒', bestseller: true },
    { name: 'Cheesecake', price: 449, rating: 4.9, image: '🧀', bestseller: false }
  ];

  const decorOptions = [
    { name: 'Balloons', price: 150, rating: 4.5, image: '🎈', category: 'Essential' },
    { name: 'Flowers', price: 200, rating: 4.8, image: '🌹', category: 'Premium' },
    { name: 'Candles', price: 100, rating: 4.3, image: '🕯️', category: 'Essential' },
    { name: 'Banner', price: 120, rating: 4.4, image: '🎯', category: 'Essential' },
    { name: 'Photo Booth', price: 500, rating: 4.9, image: '📸', category: 'Premium' },
    { name: 'LED Lights', price: 180, rating: 4.6, image: '💡', category: 'Premium' }
  ];

  const giftOptions = [
    { name: 'Chocolate Box', price: 199, rating: 4.7, image: '🍫', category: 'Sweet' },
    { name: 'Flower Bouquet', price: 299, rating: 4.8, image: '💐', category: 'Romantic' },
    { name: 'Teddy Bear', price: 149, rating: 4.5, image: '🧸', category: 'Cute' },
    { name: 'Photo Frame', price: 99, rating: 4.2, image: '🖼️', category: 'Memory' },
    { name: 'Perfume', price: 599, rating: 4.6, image: '🌸', category: 'Luxury' },
    { name: 'Jewelry', price: 899, rating: 4.9, image: '💎', category: 'Luxury' }
  ];

  const handleInputChange = (field: keyof BookingForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If changing wantCakes, wantDecorItems, or wantGifts, reset to Overview if current tab is no longer available
    if (field === 'wantCakes' || field === 'wantDecorItems' || field === 'wantGifts') {
      const newTabs = getAvailableTabs();
      if (!newTabs.includes(activeTab)) {
        setActiveTab('Overview');
      }
    }
  };

  const handleNumberChange = (field: 'numberOfPeople', action: 'increment' | 'decrement') => {
    setFormData(prev => ({
      ...prev,
      [field]: action === 'increment' ? prev[field] + 1 : Math.max(1, prev[field] - 1)
    }));
  };

  const handleItemSelection = (field: 'selectedCakes' | 'selectedDecorItems' | 'selectedGifts', itemName: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(itemName)
        ? prev[field].filter(item => item !== itemName)
        : [...prev[field], itemName]
    }));
  };

  const calculateTotal = () => {
    // Extract price from selected theater or use default
    const basePrice = selectedTheater 
      ? parseFloat(selectedTheater.price.replace(/[₹,\s]/g, ''))
      : 1399.00;
    
    let total = basePrice;
    
    formData.selectedCakes.forEach(cakeName => {
      const cake = cakeOptions.find(c => c.name === cakeName);
      if (cake) total += cake.price;
    });
    
    formData.selectedDecorItems.forEach(decorName => {
      const decor = decorOptions.find(d => d.name === decorName);
      if (decor) total += decor.price;
    });
    
    formData.selectedGifts.forEach(giftName => {
      const gift = giftOptions.find(g => g.name === giftName);
      if (gift) total += gift.price;
    });
    
    return total;
  };

  const getPayableAmount = () => {
    const total = calculateTotal();
    return Math.round(total * 0.28);
  };

  const getBalanceAmount = () => {
    const total = calculateTotal();
    const payable = getPayableAmount();
    return total - payable;
  };

  const handleNextStep = async () => {
    // Validation for occasion
    if (activeTab === 'Occasion' && !formData.occasion.trim()) {
      console.log('Please select an occasion to continue');
      return;
    }

    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items');
    } else {
      // Check if this is the last tab (Complete Booking)
      const isLastTab = activeTab === tabs[tabs.length - 1];
      if (isLastTab) {
        // Final step - save booking to database
      try {
        // Map form data to API format
        const bookingData = {
          name: formData.bookingName,
          email: formData.emailAddress,
          phone: formData.whatsappNumber,
          theaterName: selectedTheater?.name || 'FeelME Town Theater',
          date: selectedDate || new Date().toISOString().split('T')[0],
          time: selectedTimeSlot || '6:00 PM',
          occasion: formData.occasion,
          numberOfPeople: formData.numberOfPeople,
          selectedCakes: formData.selectedCakes.map(cakeId => ({
            id: cakeId,
            name: `Cake ${cakeId}`,
            price: 1500,
            quantity: 1
          })),
          selectedDecorItems: formData.selectedDecorItems.map(itemId => ({
            id: itemId,
            name: `Decor ${itemId}`,
            price: 800,
            quantity: 1
          })),
          selectedGifts: formData.selectedGifts.map(giftId => ({
            id: giftId,
            name: `Gift ${giftId}`,
            price: 500,
            quantity: 1
          }))
        };
        
        console.log('Saving booking data to database:', bookingData);
        
        const response = await fetch('/api/booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Booking saved successfully:', result);
          console.log('🎯 Showing success toast...');
          console.log(`Booking Complete ${formData.bookingName} - Check your mail`);
          console.log('🎯 Toast called, should auto-close in 3 seconds');
          
          // Reset form after successful booking
          resetForm();
          onClose();
        } else {
          console.error('❌ Booking failed:', result.error);
          console.log('🎯 Showing error toast...');
          console.log(`❌ ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Error saving booking:', error);
        console.log('🎯 Showing network error toast...');
        console.log('❌ Network error. Please try again.');
      }
      }
    }
  };

  const handleSkip = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items');
    }
  };

  const handleClose = async () => {
    // Check if user has entered data but not completed booking
    const hasData = formData.bookingName || formData.emailAddress || formData.whatsappNumber || formData.occasion;
    
    if (hasData && formData.emailAddress) {
      // Send incomplete booking email
      try {
        const response = await fetch('/api/email/incomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.bookingName,
            email: formData.emailAddress,
            phone: formData.whatsappNumber,
            occasion: formData.occasion
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log('📧 Incomplete booking email sent');
          console.log('🎯 Showing info toast...');
          console.log('📧 Reminder email sent!');
        }
      } catch (error) {
        console.log('⚠️ Failed to send incomplete booking email:', error);
      }
    }

    // Restore body scroll when closing popup
    document.body.style.overflow = 'unset';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.classList.remove('popup-open');
    // Reset form when closing popup
    resetForm();
    onClose();
  };

  // Prevent scroll events from bubbling to background
  const handleOverlayScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const handleOverlayTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) {
    return null;
  }

  const popupContent = (
    <div 
      className="booking-popup-overlay" 
      onClick={handleClose}
      onWheel={handleOverlayScroll}
      onTouchMove={handleOverlayTouchMove}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 999999,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'auto'
      }}
    >
      <div 
        className={`booking-popup ${isLoaded ? 'booking-popup-loaded' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={{
        position: 'relative',
        zIndex: 1000000,
        backgroundColor: '#000000',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        overflowY: 'auto',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 0.3s ease',
        pointerEvents: 'auto'
      }}>
        {/* Header */}
        <div className="booking-popup-header">
          <div className="booking-popup-nav">
            <button className="booking-popup-back-btn" onClick={handleClose}>
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="booking-popup-brand">
              <div className="booking-popup-logo">
                <Play className="w-6 h-6" />
              </div>
              <h1 className="booking-popup-title">Book Your Show</h1>
            </div>
            <button className="booking-popup-close-btn" onClick={handleClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="booking-popup-hero">
          <div className="booking-popup-theater-info">
            <h2 className="booking-popup-theater-title">
              {selectedTheater ? selectedTheater.name : 'EROS (COUPLES) Theatre'}
            </h2>
            <div className="booking-popup-meta">
              <div className="booking-popup-meta-item">
                <Calendar className="w-4 h-4" />
                <span>{selectedDate || '18 Sep 2025'}</span>
              </div>
              <div className="booking-popup-meta-item">
                <Clock className="w-4 h-4" />
                <span>{selectedTimeSlot || '9:00 AM - 12:00 PM'}</span>
              </div>
              <div className="booking-popup-meta-item">
                <MapPin className="w-4 h-4" />
                <span>{selectedTheater ? selectedTheater.capacity : 'Slot 1'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="booking-popup-content">
          {/* Tab Navigation */}
          <nav className="booking-popup-tabs">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items')}
                className={`booking-popup-tab ${activeTab === tab ? 'booking-popup-tab-active' : ''}`}
              >
                <span className="booking-popup-tab-number">{index + 1}</span>
                <span className="booking-popup-tab-text">{tab}</span>
              </button>
            ))}
          </nav>

          <div className="booking-popup-layout">
            {/* Main Panel */}
            <div className="booking-popup-main">
              <div className="booking-popup-tab-content">
                {activeTab === 'Overview' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Users className="w-5 h-5" />
                      Booking Overview
                    </h3>
                    <div className="booking-popup-form">
                      <div className="booking-popup-field">
                        <label>Booking Name *</label>
                        <input
                          type="text"
                          value={formData.bookingName}
                          onChange={(e) => handleInputChange('bookingName', e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="booking-popup-field">
                        <label>Number of People *</label>
                        <div className="booking-popup-number">
                          <button onClick={() => handleNumberChange('numberOfPeople', 'decrement')}>
                            <Minus className="w-4 h-4" />
                          </button>
                          <span>{formData.numberOfPeople}</span>
                          <button onClick={() => handleNumberChange('numberOfPeople', 'increment')}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="booking-popup-field">
                        <label>WhatsApp Number *</label>
                        <input
                          type="tel"
                          value={formData.whatsappNumber}
                          onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div className="booking-popup-field">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.emailAddress}
                          onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>
                      
                      <div className="booking-popup-field-row">
                        <div className="booking-popup-field">
                          <label>Want Cakes?</label>
                          <select
                            value={formData.wantCakes}
                            onChange={(e) => handleInputChange('wantCakes', e.target.value as 'Yes' | 'No')}
                            className="booking-popup-select"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                        
                        <div className="booking-popup-field">
                          <label>Want Decor Items?</label>
                          <select
                            value={formData.wantDecorItems}
                            onChange={(e) => handleInputChange('wantDecorItems', e.target.value as 'Yes' | 'No')}
                            className="booking-popup-select"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                        
                        <div className="booking-popup-field">
                          <label>Want Gift Items?</label>
                          <select
                            value={formData.wantGifts}
                            onChange={(e) => handleInputChange('wantGifts', e.target.value as 'Yes' | 'No')}
                            className="booking-popup-select"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Occasion' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Calendar className="w-5 h-5" />
                      Choose Your Occasion
                    </h3>
                    <div className="booking-popup-occasions">
                      {occasionOptions.map((occasion) => (
                        <div
                          key={occasion.name}
                          onClick={() => handleInputChange('occasion', occasion.name)}
                          className={`booking-popup-occasion ${formData.occasion === occasion.name ? 'selected' : ''}`}
                        >
                          {occasion.popular && <div className="booking-popup-badge">Popular</div>}
                          <div className="booking-popup-occasion-icon">{occasion.icon}</div>
                          <h4>{occasion.name}</h4>
                          {formData.occasion === occasion.name && <Check className="w-5 h-5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Cakes' && formData.wantCakes === 'Yes' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Cake className="w-5 h-5" />
                      Delicious Cakes
                    </h3>
                    <div className="booking-popup-items">
                      {cakeOptions.map((cake) => (
                        <div
                          key={cake.name}
                          onClick={() => handleItemSelection('selectedCakes', cake.name)}
                          className={`booking-popup-item ${formData.selectedCakes.includes(cake.name) ? 'selected' : ''}`}
                        >
                          {cake.bestseller && <div className="booking-popup-badge">Bestseller</div>}
                          <div className="booking-popup-item-image">{cake.image}</div>
                          <div className="booking-popup-item-content">
                            <h4>{cake.name}</h4>
                            <div className="booking-popup-rating">
                              <Star className="w-4 h-4" />
                              <span>{cake.rating}</span>
                            </div>
                            <div className="booking-popup-price">₹{cake.price}</div>
                          </div>
                          {formData.selectedCakes.includes(cake.name) && <Check className="w-5 h-5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Decor Items' && formData.wantDecorItems === 'Yes' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Sparkles className="w-5 h-5" />
                      Decoration Items
                    </h3>
                    <div className="booking-popup-items">
                      {decorOptions.map((decor) => (
                        <div
                          key={decor.name}
                          onClick={() => handleItemSelection('selectedDecorItems', decor.name)}
                          className={`booking-popup-item ${formData.selectedDecorItems.includes(decor.name) ? 'selected' : ''}`}
                        >
                          <div className="booking-popup-category">{decor.category}</div>
                          <div className="booking-popup-item-image">{decor.image}</div>
                          <div className="booking-popup-item-content">
                            <h4>{decor.name}</h4>
                            <div className="booking-popup-rating">
                              <Star className="w-4 h-4" />
                              <span>{decor.rating}</span>
                            </div>
                            <div className="booking-popup-price">₹{decor.price}</div>
                          </div>
                          {formData.selectedDecorItems.includes(decor.name) && <Check className="w-5 h-5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Gifts Items' && formData.wantGifts === 'Yes' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Gift className="w-5 h-5" />
                      Special Gifts
                    </h3>
                    <div className="booking-popup-items">
                      {giftOptions.map((gift) => (
                        <div
                          key={gift.name}
                          onClick={() => handleItemSelection('selectedGifts', gift.name)}
                          className={`booking-popup-item ${formData.selectedGifts.includes(gift.name) ? 'selected' : ''}`}
                        >
                          <div className="booking-popup-category">{gift.category}</div>
                          <div className="booking-popup-item-image">{gift.image}</div>
                          <div className="booking-popup-item-content">
                            <h4>{gift.name}</h4>
                            <div className="booking-popup-rating">
                              <Star className="w-4 h-4" />
                              <span>{gift.rating}</span>
                            </div>
                            <div className="booking-popup-price">₹{gift.price}</div>
                          </div>
                          {formData.selectedGifts.includes(gift.name) && <Check className="w-5 h-5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="booking-popup-action">
                {/* Show skip button for optional sections when no items selected */}
                {((activeTab === 'Cakes' && formData.selectedCakes.length === 0) ||
                 (activeTab === 'Decor Items' && formData.selectedDecorItems.length === 0) ||
                 (activeTab === 'Gifts Items' && formData.selectedGifts.length === 0)) &&
                 activeTab !== tabs[tabs.length - 1] ? (
                  <div className="booking-popup-buttons">
                    <button onClick={handleSkip} className="booking-popup-btn skip">
                      <span>Skip</span>
                    </button>
                    <button onClick={handleNextStep} className="booking-popup-btn">
                      <span>{activeTab === tabs[tabs.length - 1] ? 'Complete Booking' : 'Continue'}</span>
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={handleNextStep} className="booking-popup-btn">
                    <span>{activeTab === tabs[tabs.length - 1] ? 'Complete Booking' : 'Continue'}</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="booking-popup-cart">
              <div className="booking-popup-cart-header">
                <h3>Booking Summary</h3>
                <div className="booking-popup-cart-badge">Live Pricing</div>
              </div>

              <div className="booking-popup-cart-content">
                <div className="booking-popup-cart-section">
                  <h4>Theatre Booking</h4>
                  <div className="booking-popup-cart-item">
                    <span>{selectedTheater ? selectedTheater.name : 'EROS Theatre'}</span>
                    <span>{selectedTheater ? selectedTheater.price : '₹1,399.00'}</span>
                  </div>
                  <div className="booking-popup-cart-item">
                    <span>Guests ({formData.numberOfPeople})</span>
                    <span>Included</span>
                  </div>
                </div>

                {formData.wantCakes === 'Yes' && formData.selectedCakes.length > 0 && (
                  <div className="booking-popup-cart-section">
                    <h4>Cakes</h4>
                    {formData.selectedCakes.map((cakeName) => {
                      const cake = cakeOptions.find(c => c.name === cakeName);
                      return cake ? (
                        <div key={cakeName} className="booking-popup-cart-item">
                          <span>{cake.name}</span>
                          <span>₹{cake.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.wantDecorItems === 'Yes' && formData.selectedDecorItems.length > 0 && (
                  <div className="booking-popup-cart-section">
                    <h4>Decorations</h4>
                    {formData.selectedDecorItems.map((decorName) => {
                      const decor = decorOptions.find(d => d.name === decorName);
                      return decor ? (
                        <div key={decorName} className="booking-popup-cart-item">
                          <span>{decor.name}</span>
                          <span>₹{decor.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.wantGifts === 'Yes' && formData.selectedGifts.length > 0 && (
                  <div className="booking-popup-cart-section">
                    <h4>Gifts</h4>
                    {formData.selectedGifts.map((giftName) => {
                      const gift = giftOptions.find(g => g.name === giftName);
                      return gift ? (
                        <div key={giftName} className="booking-popup-cart-item">
                          <span>{gift.name}</span>
                          <span>₹{gift.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="booking-popup-cart-divider"></div>

                <div className="booking-popup-cart-totals">
                  <div className="booking-popup-cart-item">
                    <span>Subtotal</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="booking-popup-cart-item booking-popup-cart-total">
                    <span>Total Amount</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="booking-popup-cart-item booking-popup-cart-advance">
                    <span>Pay Now (28%)</span>
                    <span>₹{getPayableAmount()}</span>
                  </div>
                  <div className="booking-popup-cart-item booking-popup-cart-balance">
                    <span>At Venue</span>
                    <span>₹{getBalanceAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx global>{`
          body.popup-open {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>
        <style jsx>{`
          .booking-popup-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1rem !important;
            margin: 0 !important;
            overflow: hidden !important;
            overscroll-behavior: contain !important;
          }

          .booking-popup {
            width: 100% !important;
            max-width: 1200px !important;
            max-height: 95vh !important;
            background: #000000 !important;
            border-radius: 1rem !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            overflow: hidden !important;
            overflow-y: auto !important;
            opacity: 0 !important;
            transform: scale(0.9) !important;
            transition: all 0.3s ease !important;
            position: relative !important;
            z-index: 1000000 !important;
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
            margin: 0.5rem !important;
          }

          .booking-popup-loaded {
            opacity: 1 !important;
            transform: scale(1) !important;
          }

          .booking-popup-header {
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 1.5rem;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .booking-popup-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .booking-popup-back-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: transparent;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
          }

          .booking-popup-back-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #FF0005;
          }

          .booking-popup-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .booking-popup-logo {
            width: 2.5rem;
            height: 2.5rem;
            background: linear-gradient(135deg, #FF0005, #CC0000);
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
          }

          .booking-popup-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }

          .booking-popup-close-btn {
            background: transparent;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.3s ease;
          }

          .booking-popup-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #FF0005;
          }

          .booking-popup-hero {
            background: linear-gradient(135deg, #FF0005, #CC0000, #000000);
            padding: 1.5rem 2rem;
            text-align: center;
          }

          .booking-popup-theater-title {
            font-size: 1.5rem;
            font-weight: 900;
            color: #ffffff;
            margin: 0 0 1rem 0;
            line-height: 1.2;
          }

          .booking-popup-meta {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .booking-popup-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 2rem;
            color: #ffffff;
          }

          .booking-popup-content {
            padding: 1rem 1.5rem;
            max-height: 65vh;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }

          .booking-popup-tabs {
            display: flex;
            gap: 0.25rem;
            margin-bottom: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0.75rem;
            padding: 0.25rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .booking-popup-tabs::-webkit-scrollbar {
            display: none;
          }

          .booking-popup-tab {
            flex: 1;
            min-width: 100px;
            padding: 0.5rem 0.75rem;
            background: transparent;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            white-space: nowrap;
          }

          .booking-popup-tab-number {
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
          }

          .booking-popup-tab-text {
            font-size: 0.7rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            text-align: center;
          }

          .booking-popup-tab-active {
            background: rgba(255, 0, 5, 0.15);
          }

          .booking-popup-tab-active .booking-popup-tab-number {
            background: #FF0005;
            color: #ffffff;
          }

          .booking-popup-tab-active .booking-popup-tab-text {
            color: #FF0005;
            font-weight: 600;
          }

          .booking-popup-layout {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 1.5rem;
          }

          .booking-popup-main {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
          }

          .booking-popup-tab-content {
            padding: 1rem 1.5rem;
          }

          .booking-popup-section-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.25rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 1rem 0;
          }

          .booking-popup-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .booking-popup-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .booking-popup-field-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .booking-popup-field label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
          }

          .booking-popup-field input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            color: #ffffff;
            font-size: 0.875rem;
            transition: all 0.3s ease;
          }

          .booking-popup-field input:focus {
            outline: none;
            border-color: #FF0005;
            box-shadow: 0 0 0 3px rgba(255, 0, 5, 0.1);
          }

          .booking-popup-field input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .booking-popup-number {
            display: flex;
            align-items: center;
            gap: 1rem;
            justify-content: center;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-number button {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .booking-popup-number button:hover {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.2);
          }

          .booking-popup-number span {
            font-size: 1.5rem;
            font-weight: 700;
            color: #FF0005;
            min-width: 2rem;
            text-align: center;
          }

          .booking-popup-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .booking-popup-toggle button {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
            color: #ffffff;
          }

          .booking-popup-toggle button:hover {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.1);
          }

          .booking-popup-toggle button.active {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.15);
            color: #FF0005;
          }

          .booking-popup-occasions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.75rem;
          }

          .booking-popup-occasion {
            position: relative;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
          }

          .booking-popup-occasion:hover {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .booking-popup-occasion.selected {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.15);
          }

          .booking-popup-badge {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: linear-gradient(135deg, #FF0005, #CC0000);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 1rem;
            text-transform: uppercase;
          }

          .booking-popup-occasion-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }

          .booking-popup-occasion h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
          }

          .booking-popup-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 0.75rem;
          }

          .booking-popup-item {
            position: relative;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
          }

          .booking-popup-item:hover {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .booking-popup-item.selected {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.15);
          }

          .booking-popup-category {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: linear-gradient(135deg, #FF0005, #CC0000);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 1rem;
            text-transform: uppercase;
            z-index: 2;
          }

          .booking-popup-item-image {
            padding: 1rem;
            text-align: center;
            font-size: 2.5rem;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-item-content {
            padding: 0.75rem;
          }

          .booking-popup-item-content h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 0.5rem 0;
          }

          .booking-popup-rating {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-bottom: 0.5rem;
          }

          .booking-popup-rating svg {
            color: #ffd700;
            fill: #ffd700;
          }

          .booking-popup-rating span {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.7);
          }

          .booking-popup-price {
            font-size: 1.125rem;
            font-weight: 700;
            color: #FF0005;
          }

          .booking-popup-action {
            padding: 1rem 1.5rem;
            background: rgba(255, 255, 255, 0.02);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: center;
            position: sticky;
            bottom: 0;
            z-index: 10;
          }

          .booking-popup-buttons {
            display: flex;
            gap: 1rem;
            width: 100%;
            max-width: 300px;
          }

          .booking-popup-btn.skip {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .booking-popup-btn.skip:hover {
            background: rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.9);
          }

          .booking-popup-select {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem;
            color: white;
            font-size: 0.9rem;
            outline: none;
            transition: all 0.3s ease;
          }

          .booking-popup-select:focus {
            border-color: #FF0005;
            box-shadow: 0 0 0 2px rgba(255, 0, 5, 0.2);
          }

          .booking-popup-select option {
            background: #1a1a1a;
            color: white;
          }

          .booking-popup-btn {
            background: linear-gradient(135deg, #FF0005, #CC0000);
            color: #ffffff;
            border: none;
            padding: 0.875rem 1.5rem;
            border-radius: 2rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 15px rgba(255, 0, 5, 0.4);
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }

          .booking-popup-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 0, 5, 0.6);
          }

          .booking-popup-cart {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            height: fit-content;
            max-height: 60vh;
            overflow-y: auto;
          }

          .booking-popup-cart-header {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 5;
          }

          .booking-popup-cart-header h3 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }

          .booking-popup-cart-badge {
            background: linear-gradient(135deg, #FF0005, #CC0000);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 1rem;
            text-transform: uppercase;
          }

          .booking-popup-cart-content {
            padding: 1rem;
          }

          .booking-popup-cart-section {
            margin-bottom: 1.5rem;
          }

          .booking-popup-cart-section h4 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #FF0005;
            margin: 0 0 0.75rem 0;
            text-transform: uppercase;
          }

          .booking-popup-cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.875rem;
          }

          .booking-popup-cart-item:last-child {
            border-bottom: none;
          }

          .booking-popup-cart-item span:first-child {
            color: rgba(255, 255, 255, 0.8);
          }

          .booking-popup-cart-item span:last-child {
            color: #ffffff;
            font-weight: 600;
          }

          .booking-popup-cart-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            margin: 1.5rem 0;
          }

          .booking-popup-cart-totals {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 0.75rem;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-cart-total {
            padding: 0.75rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            margin: 0.5rem 0;
          }

          .booking-popup-cart-total span {
            font-size: 1rem;
            font-weight: 700;
            color: #ffffff;
          }

          .booking-popup-cart-advance span:last-child {
            color: #FF0005;
            font-weight: 700;
          }

          .booking-popup-cart-balance span:last-child {
            color: #ffd700;
            font-weight: 700;
          }

          /* Mobile First Responsive Design */
          @media (max-width: 480px) {
            .booking-popup {
              margin: 0.25rem !important;
              max-height: 98vh !important;
              border-radius: 0.75rem !important;
            }

            .booking-popup-overlay {
              padding: 0.25rem !important;
            }

            .booking-popup-header {
              padding: 0.75rem 1rem;
            }

            .booking-popup-field-row {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }

            .booking-popup-title {
              font-size: 1.25rem;
            }

            .booking-popup-hero {
              padding: 1rem 1.5rem;
            }

            .booking-popup-theater-title {
              font-size: 1.25rem;
            }

            .booking-popup-meta {
              flex-direction: column;
              gap: 0.5rem;
            }

            .booking-popup-meta-item {
              font-size: 0.8rem;
              padding: 0.4rem 0.8rem;
            }

            .booking-popup-content {
              padding: 0.75rem 1rem;
              max-height: 70vh;
            }

            .booking-popup-tabs {
              gap: 0.125rem;
              padding: 0.125rem;
            }

            .booking-popup-tab {
              min-width: 80px;
              padding: 0.4rem 0.5rem;
            }

            .booking-popup-tab-text {
              font-size: 0.65rem;
            }

            .booking-popup-layout {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .booking-popup-cart {
              order: -1;
              max-height: 40vh;
            }

            .booking-popup-occasions,
            .booking-popup-items {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }

            .booking-popup-occasion,
            .booking-popup-item {
              padding: 0.75rem;
            }

            .booking-popup-item-image {
              padding: 0.75rem;
              font-size: 2rem;
            }

            .booking-popup-item-content {
              padding: 0.5rem;
            }

            .booking-popup-item-content h4 {
              font-size: 0.9rem;
            }

            .booking-popup-action {
              padding: 0.75rem 1rem;
            }

            .booking-popup-btn {
              padding: 0.75rem 1.25rem;
              font-size: 0.85rem;
            }
          }

          @media (min-width: 481px) and (max-width: 768px) {
            .booking-popup {
              margin: 0.5rem !important;
              max-height: 95vh !important;
            }

            .booking-popup-layout {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }

            .booking-popup-cart {
              order: -1;
              max-height: 45vh;
            }

            .booking-popup-tabs {
              overflow-x: auto;
            }

            .booking-popup-field-row {
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
            }

            .booking-popup-tab {
              min-width: 100px;
            }

            .booking-popup-occasions {
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            }

            .booking-popup-items {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .booking-popup-layout {
              grid-template-columns: 1fr 280px;
              gap: 1.5rem;
            }

            .booking-popup-occasions {
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            }

            .booking-popup-items {
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            }
          }

          @media (min-width: 1025px) {
            .booking-popup-layout {
              grid-template-columns: 1fr 300px;
              gap: 2rem;
            }

            .booking-popup-occasions {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }

            .booking-popup-items {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
          }
        `}</style>
      </div>
    </div>
  );

  // Use portal to render popup at the root level
  if (typeof window !== 'undefined') {
    return createPortal(popupContent, document.body);
  }
  
  return popupContent;
}