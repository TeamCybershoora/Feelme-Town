'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, Users, MapPin, User, Mail, Phone, Gift, Cake, Sparkles, Play, Star, Check, CheckCircle } from 'lucide-react';
import GlobalDatePicker from './GlobalDatePicker';
import MoviesModal from './MoviesModal';

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
  wantDecorItems: 'Yes' | 'No';
  totalAmount: number;
  advancePayment: number;
  venuePayment: number;
  status: string;
  notes: string;
  // Occasion-specific name fields
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
}

interface AdminManualBookingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminManualBookingPopup({ isOpen, onClose }: AdminManualBookingPopupProps) {
  // Handle confirmation popup actions
  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    setIsClosing(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
    setIsClosing(false);
  };

  const handleCloseWithConfirmation = () => {
    // Prevent multiple confirmation popups
    if (isClosing || showCloseConfirmation) {
      return;
    }
    
    // Set closing state and show confirmation popup
    setIsClosing(true);
    setShowCloseConfirmation(true);
  };

  const handleCloseButtonClick = () => {
    // Prevent multiple confirmation popups
    if (isClosing || showCloseConfirmation) {
      return;
    }
    
    // Set closing state and show confirmation popup
    setIsClosing(true);
    setShowCloseConfirmation(true);
  };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Customer' | 'Booking' | 'Items' | 'Review'>('Customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimeSelectionOpen, setIsTimeSelectionOpen] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isMoviesModalOpen, setIsMoviesModalOpen] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationErrorName, setValidationErrorName] = useState('');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [formData, setFormData] = useState<AdminManualBookingForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    theater: 'theater1',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: '',
    numberOfPeople: 2,
    occasion: '',
    selectedCakes: [],
    selectedDecorItems: [],
    selectedGifts: [],
    selectedMovies: [],
    wantMovies: 'No',
    wantDecorItems: 'No',
    totalAmount: 0,
    advancePayment: 0,
    venuePayment: 0,
    status: 'Confirmed',
    notes: '',
    // Occasion-specific name fields
    occasionPersonName: '',
    birthdayName: '',
    birthdayGender: '',
    partner1Name: '',
    partner1Gender: '',
    partner2Name: '',
    partner2Gender: '',
    dateNightName: '',
    proposerName: '',
    proposalPartnerName: '',
    valentineName: '',
    customCelebration: ''
  });

  const theaters = [
    {
      id: 'theater1',
      name: 'EROS (COUPLES) (FMT-Hall-1)',
      image: '/images/theater1.webp',
      capacity: '2 People',
      price: '₹1,399',
      features: ['Premium Sound', '4K Display', 'Comfortable Seating']
    },
    {
      id: 'theater2', 
      name: 'PHILIA (FRIENDS) (FMT-Hall-2)',
      image: '/images/theater2.webp',
      capacity: '2-4 People',
      price: '₹1,999',
      features: ['Dolby Atmos', '8K Display', 'Recliner Seats']
    },
    {
      id: 'theater3',
      name: 'PRAGMA (LOVE) (FMT-Hall-3)', 
      image: '/images/theater3.webp',
      capacity: '2-6 People',
      price: '₹2,999',
      features: ['Premium Audio', 'Ultra HD', 'VIP Experience']
    },
    {
      id: 'theater4',
      name: 'STORGE (FAMILY) (FMT-Hall-4)',
      image: '/images/theater4.webp',
      capacity: '2-8 People',
      price: '₹3,999',
      features: ['Family Package', 'Large Screen', 'Group Seating']
    }
  ];
  const timeSlots = ['9:00 am - 12:00 pm', '12:30 PM - 03:30 PM', '04:00 PM - 07:00 PM', '07:30 PM - 10:30 PM'];
  const occasions = ['Birthday Party', 'Anniversary', 'Baby Shower', 'Bride to be', 'Congratulations', 'Farewell', 'Marriage Proposal', 'Proposal', 'Romantic Date', "Valentine's Day", 'Custom Celebration'];

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

  // No need for session storage logic with modal approach

  // Auto-update occasionPersonName based on occasion-specific fields
  useEffect(() => {
    if (formData.occasion) {
      let personName = '';

      // Get the name from the specific field for the selected occasion
      switch (formData.occasion) {
        case 'Birthday Party':
        case 'Baby Shower':
        case 'Bride to be':
        case 'Congratulations':
        case 'Farewell':
          personName = formData.birthdayName || '';
          break;
        case 'Anniversary':
          personName = formData.partner1Name || formData.partner2Name || '';
          break;
        case 'Romantic Date':
          personName = formData.partner1Name || '';
          break;
        case 'Marriage Proposal':
          personName = formData.proposerName || '';
          break;
        case 'Proposal':
          personName = formData.proposerName || '';
          break;
        case "Valentine's Day":
          personName = formData.valentineName || '';
          break;
        case 'Custom Celebration':
          personName = formData.customCelebration || '';
          break;
      }

      // Only update occasionPersonName if the specific field has a value
      if (personName) {
        setFormData(prev => ({ ...prev, occasionPersonName: personName }));
      }
    }
  }, [
    formData.occasion,
    formData.birthdayName,
    formData.partner1Name,
    formData.partner2Name,
    formData.proposerName,
    formData.valentineName,
    formData.customCelebration
  ]);

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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear selected items when "No" is selected
      if (field === 'wantMovies' && value === 'No') {
        newData.selectedMovies = [];
      }
      if (field === 'wantDecorItems' && value === 'No') {
        newData.selectedDecorItems = [];
        // If currently on Items tab and decorations set to No, switch to Review tab
        if (activeTab === 'Items') {
          setActiveTab('Review');
        }
      }
      
      return newData;
    });
  };

  // Fetch booked slots for the selected date and theater
  const fetchBookedSlots = async () => {
    if (!formData.date || !formData.theater) {
      console.log('⚠️ Manual booking: Cannot fetch booked slots - missing date or theater:', {
        date: formData.date,
        theater: formData.theater
      });
      return;
    }
    
    try {
      // Get the theater name from the theater ID
      const selectedTheater = theaters.find(t => t.id === formData.theater);
      const theaterName = selectedTheater?.name || formData.theater;
      
      console.log('🔍 Manual booking: Fetching booked slots with:', {
        date: formData.date,
        theaterName: theaterName,
        theaterId: formData.theater,
        selectedTheater: selectedTheater
      });
      
      const apiUrl = `/api/booked-slots?date=${encodeURIComponent(formData.date)}&theater=${encodeURIComponent(theaterName)}`;
      console.log('🌐 Manual booking: API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('📡 Manual booking: API Response:', {
        success: data.success,
        bookedTimeSlots: data.bookedTimeSlots,
        totalBookings: data.totalBookings,
        error: data.error
      });
      
      if (data.success && data.bookedTimeSlots) {
        setBookedTimeSlots(data.bookedTimeSlots);
        console.log('✅ Manual booking: Successfully fetched booked slots:', {
          date: formData.date,
          theater: theaterName,
          bookedSlots: data.bookedTimeSlots,
          totalBookedSlots: data.bookedTimeSlots.length
        });
      } else {
        console.log('⚠️ Manual booking: No booked slots found or API error:', data);
        setBookedTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Manual booking: Error fetching booked slots:', error);
      setBookedTimeSlots([]);
    }
  };

  // Fetch booked slots when date or theater changes
  useEffect(() => {
    if (formData.date && formData.theater) {
      console.log('🔄 Manual booking: Date or theater changed, fetching booked slots...', {
        date: formData.date,
        theater: formData.theater
      });
      fetchBookedSlots();
    }
  }, [formData.date, formData.theater]);

  // Fetch booked slots on component mount with default date
  useEffect(() => {
    if (formData.date && formData.theater) {
      console.log('🚀 Manual booking: Initial load, fetching booked slots for default date...', {
        date: formData.date,
        theater: formData.theater
      });
      fetchBookedSlots();
    }
  }, []); // Run only once on mount

  // Handle movie selection - open movies modal
  const handleSelectMovies = () => {
    setIsMoviesModalOpen(true);
  };

  // Handle movie selection from modal - only allow single movie
  const handleMovieSelect = (movieTitle: string) => {
    console.log('🎬 Movie selected in manual booking:', movieTitle);
    console.log('🎬 Current selected movies:', formData.selectedMovies);
    setFormData(prev => {
      // Replace the current selection with the new movie (single selection only)
      const newSelectedMovies = [movieTitle];
      console.log('🎬 Updated selected movies (single selection):', newSelectedMovies);
      return {
        ...prev,
        selectedMovies: newSelectedMovies
      };
    });
    setIsMoviesModalOpen(false);
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

  // Validation function to check form completeness
  const validateForm = () => {
    // Check basic required fields
    if (!formData.customerName.trim()) {
      setValidationErrorName('Missing Customer Name');
      setValidationMessage('Please enter customer name to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.customerEmail.trim()) {
      setValidationErrorName('Missing Email');
      setValidationMessage('Please enter customer email to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.customerPhone.trim()) {
      setValidationErrorName('Missing Phone');
      setValidationMessage('Please enter customer phone number to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.occasion) {
      setValidationErrorName('Missing Occasion');
      setValidationMessage('Please select an occasion to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.theater) {
      setValidationErrorName('Missing Theater');
      setValidationMessage('Please select a theater to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.date) {
      setValidationErrorName('Missing Date');
      setValidationMessage('Please select a date to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.time) {
      setValidationErrorName('Missing Time');
      setValidationMessage('Please select a time slot to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      setValidationErrorName('Missing Number of People');
      setValidationMessage('Please enter the number of people (minimum 1).');
      setShowValidationPopup(true);
      return false;
    }

    // Check occasion-specific name fields
    if (formData.occasion === 'Birthday Party' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Birthday Name');
      setValidationMessage('Please enter the birthday person\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Anniversary' && (!formData.partner1Name || !formData.partner1Name.trim() || !formData.partner2Name || !formData.partner2Name.trim())) {
      setValidationErrorName('Missing Partner Names');
      setValidationMessage('Please enter both partner names for anniversary.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Romantic Date' && (!formData.partner1Name || !formData.partner1Name.trim() || !formData.partner2Name || !formData.partner2Name.trim())) {
      setValidationErrorName('Missing Names');
      setValidationMessage('Please enter both your name and partner name.');
      setShowValidationPopup(true);
      return false;
    }

    if ((formData.occasion === 'Marriage Proposal' || formData.occasion === 'Proposal') && (!formData.proposerName || !formData.proposerName.trim() || !formData.proposalPartnerName || !formData.proposalPartnerName.trim())) {
      setValidationErrorName('Missing Names');
      setValidationMessage('Please enter both proposer name and partner name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Valentine\'s Day' && (!formData.valentineName || !formData.valentineName.trim())) {
      setValidationErrorName('Missing Valentine Name');
      setValidationMessage('Please enter your valentine\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Custom Celebration' && (!formData.customCelebration || !formData.customCelebration.trim())) {
      setValidationErrorName('Missing Celebration Details');
      setValidationMessage('Please enter custom celebration details.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Baby Shower' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Mom Name');
      setValidationMessage('Please enter the nick name of mom to be.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Bride to be' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Bride Name');
      setValidationMessage('Please enter the nickname of bride to be.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Farewell' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Person Name');
      setValidationMessage('Please enter the person\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return; // Validation failed, popup is already shown
    }
    
    setIsSubmitting(true);
    
    const totalAmount = calculateTotal();
    const advancePayment = 600; // Fixed ₹600 advance payment
    const venuePayment = totalAmount - advancePayment;
    
    // Get theater name from theater ID
    const selectedTheater = theaters.find(t => t.id === formData.theater);
    const theaterName = selectedTheater?.name || formData.theater;

    const bookingData = {
      // Map form fields to API expected fields
      name: formData.customerName,
      email: formData.customerEmail,
      phone: formData.customerPhone,
      theaterName: theaterName, // Convert theater ID to theater name
      date: formData.date,
      time: formData.time,
      occasion: formData.occasion,
      numberOfPeople: formData.numberOfPeople,
      selectedCakes: formData.selectedCakes,
      selectedDecorItems: formData.selectedDecorItems,
      selectedGifts: formData.selectedGifts,
      selectedMovies: formData.selectedMovies,
      totalAmount,
      advancePayment,
      venuePayment,
      status: formData.status,
      isManualBooking: true,
      bookingType: 'Manual',
      createdBy: 'Admin',
      notes: formData.notes,
      // Occasion-specific fields
      occasionPersonName: formData.occasionPersonName,
      birthdayName: formData.birthdayName,
      birthdayGender: formData.birthdayGender,
      partner1Name: formData.partner1Name,
      partner1Gender: formData.partner1Gender,
      partner2Name: formData.partner2Name,
      partner2Gender: formData.partner2Gender,
      dateNightName: formData.dateNightName,
      proposerName: formData.proposerName,
      proposalPartnerName: formData.proposalPartnerName,
      valentineName: formData.valentineName,
      customCelebration: formData.customCelebration
    };

    console.log('📤 Sending booking data:', bookingData);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      console.log('📥 API Response:', result);

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
            wantDecorItems: 'No',
            totalAmount: 0,
            advancePayment: 0,
            venuePayment: 0,
            status: 'Confirmed',
            notes: '',
            // Reset occasion-specific fields
            occasionPersonName: '',
            birthdayName: '',
            birthdayGender: '',
            partner1Name: '',
            partner1Gender: '',
            partner2Name: '',
            partner2Gender: '',
            dateNightName: '',
            proposerName: '',
            proposalPartnerName: '',
            valentineName: '',
            customCelebration: ''
          });
        }, 2000);
      } else {
        console.error('Booking API Error:', result);
        alert('Error creating booking: ' + (result.message || result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating booking: ' + (error instanceof Error ? error.message : 'Network error'));
    }
    
    setIsSubmitting(false);
  };

  // Get available tabs based on decoration selection
  const getAvailableTabs = () => {
    const baseTabs = ['Customer', 'Booking'];
    if (formData.wantDecorItems === 'Yes') {
      baseTabs.push('Items');
    }
    baseTabs.push('Review');
    return baseTabs;
  };

  // Tab-specific validation functions
  const validateCustomerTab = () => {
    if (!formData.customerName.trim()) {
      setValidationErrorName('Missing Customer Name');
      setValidationMessage('Please enter customer name to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.customerEmail.trim()) {
      setValidationErrorName('Missing Email');
      setValidationMessage('Please enter customer email to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.customerPhone.trim()) {
      setValidationErrorName('Missing Phone');
      setValidationMessage('Please enter customer phone number to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.occasion) {
      setValidationErrorName('Missing Occasion');
      setValidationMessage('Please select an occasion to continue.');
      setShowValidationPopup(true);
      return false;
    }

    // Check occasion-specific name fields
    if (formData.occasion === 'Birthday Party' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Birthday Name');
      setValidationMessage('Please enter the birthday person\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Anniversary' && (!formData.partner1Name || !formData.partner1Name.trim() || !formData.partner2Name || !formData.partner2Name.trim())) {
      setValidationErrorName('Missing Partner Names');
      setValidationMessage('Please enter both partner names for anniversary.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Romantic Date' && (!formData.partner1Name || !formData.partner1Name.trim() || !formData.partner2Name || !formData.partner2Name.trim())) {
      setValidationErrorName('Missing Names');
      setValidationMessage('Please enter both your name and partner name.');
      setShowValidationPopup(true);
      return false;
    }

    if ((formData.occasion === 'Marriage Proposal' || formData.occasion === 'Proposal') && (!formData.proposerName || !formData.proposerName.trim() || !formData.proposalPartnerName || !formData.proposalPartnerName.trim())) {
      setValidationErrorName('Missing Names');
      setValidationMessage('Please enter both proposer name and partner name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Valentine\'s Day' && (!formData.valentineName || !formData.valentineName.trim())) {
      setValidationErrorName('Missing Valentine Name');
      setValidationMessage('Please enter your valentine\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Custom Celebration' && (!formData.customCelebration || !formData.customCelebration.trim())) {
      setValidationErrorName('Missing Celebration Details');
      setValidationMessage('Please enter custom celebration details.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Baby Shower' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Mom Name');
      setValidationMessage('Please enter the nick name of mom to be.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Bride to be' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Bride Name');
      setValidationMessage('Please enter the nickname of bride to be.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.occasion === 'Farewell' && (!formData.birthdayName || !formData.birthdayName.trim())) {
      setValidationErrorName('Missing Person Name');
      setValidationMessage('Please enter the person\'s name.');
      setShowValidationPopup(true);
      return false;
    }

    return true;
  };

  const validateBookingTab = () => {
    if (!formData.theater) {
      setValidationErrorName('Missing Theater');
      setValidationMessage('Please select a theater to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.date) {
      setValidationErrorName('Missing Date');
      setValidationMessage('Please select a date to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.time) {
      setValidationErrorName('Missing Time');
      setValidationMessage('Please select a time slot to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      setValidationErrorName('Missing Number of People');
      setValidationMessage('Please enter the number of people (minimum 1).');
      setShowValidationPopup(true);
      return false;
    }

    return true;
  };

  const validateItemsTab = () => {
    console.log('🔍 Validating Items tab...');
    console.log('📊 Form data:', {
      wantMovies: formData.wantMovies,
      selectedMovies: formData.selectedMovies,
      wantDecorItems: formData.wantDecorItems,
      selectedDecorItems: formData.selectedDecorItems
    });

    // Check if movies are required but not selected
    if (formData.wantMovies === 'Yes' && (!formData.selectedMovies || formData.selectedMovies.length === 0)) {
      console.log('❌ Movie validation failed: wantMovies=Yes but no movies selected');
      setValidationErrorName('Missing Movie Selection');
      setValidationMessage('Please select at least one movie since you chose "Yes" for movies.');
      setShowValidationPopup(true);
      return false;
    }

    // Check if decorations are required but not selected
    if (formData.wantDecorItems === 'Yes' && (!formData.selectedDecorItems || formData.selectedDecorItems.length === 0)) {
      console.log('❌ Decoration validation failed: wantDecorItems=Yes but no decorations selected');
      setValidationErrorName('Missing Decoration Items');
      setValidationMessage('Please select at least one decoration item since you chose "Yes" for decorations.');
      setShowValidationPopup(true);
      return false;
    }

    console.log('✅ Items tab validation passed');
    return true;
  };

  const nextTab = () => {
    console.log('🔄 Next button clicked, current tab:', activeTab);
    
    // Validate current tab before proceeding
    let isValid = true;
    
    if (activeTab === 'Customer') {
      console.log('🔍 Validating Customer tab...');
      isValid = validateCustomerTab();
    } else if (activeTab === 'Booking') {
      console.log('🔍 Validating Booking tab...');
      isValid = validateBookingTab();
    } else if (activeTab === 'Items') {
      console.log('🔍 Validating Items tab...');
      isValid = validateItemsTab();
    }

    console.log('📋 Validation result:', isValid);

    // Only proceed to next tab if validation passes
    if (isValid) {
      const tabs = getAvailableTabs();
      const currentIndex = tabs.indexOf(activeTab);
      console.log('📋 Available tabs:', tabs, 'Current index:', currentIndex);
      if (currentIndex < tabs.length - 1) {
        const nextTabName = tabs[currentIndex + 1];
        console.log('➡️ Moving to next tab:', nextTabName);
        setActiveTab(nextTabName as 'Customer' | 'Booking' | 'Items' | 'Review');
      }
    } else {
      console.log('❌ Validation failed, staying on current tab');
    }
  };

  const prevTab = () => {
    const tabs = getAvailableTabs();
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1] as 'Customer' | 'Booking' | 'Items' | 'Review');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-manual-booking-overlay">
      <div className="admin-manual-booking-popup">
        <div className="popup-header">
          <h2>Manual Booking - Admin Panel</h2>
          <button className="close-btn" onClick={handleCloseButtonClick}>
            <X size={24} />
          </button>
        </div>

        <div className="popup-tabs">
          {getAvailableTabs().map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                // Validate current tab before switching
                let canSwitch = true;
                
                if (activeTab === 'Customer') {
                  canSwitch = validateCustomerTab();
                } else if (activeTab === 'Booking') {
                  canSwitch = validateBookingTab();
                } else if (activeTab === 'Items') {
                  canSwitch = validateItemsTab();
                }
                
                // Only switch if validation passes or if going to a previous tab
                const tabs = getAvailableTabs();
                const currentIndex = tabs.indexOf(activeTab);
                const targetIndex = tabs.indexOf(tab);
                
                if (canSwitch || targetIndex < currentIndex) {
                  setActiveTab(tab as 'Customer' | 'Booking' | 'Items' | 'Review');
                }
              }}
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

                {/* Occasion-specific name fields */}
                {formData.occasion === 'Birthday Party' && (
                  <div className="form-group">
                    <label>Birthday Person Name *</label>
                    <div className="input-label">Enter the name of the birthday person</div>
                    <input
                      type="text"
                      value={formData.birthdayName || ''}
                      onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                      placeholder="Enter birthday person name"
                      title="Enter the name of the birthday person"
                      required
                    />
                  </div>
                )}

                {formData.occasion === 'Anniversary' && (
                  <>
                    <div className="form-group">
                      <label>Partner 1 Name *</label>
                      <div className="input-label">Enter the name of the first partner</div>
                      <input
                        type="text"
                        value={formData.partner1Name || ''}
                        onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                        placeholder="Enter partner 1 name"
                        title="Enter the name of the first partner"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Partner 2 Name *</label>
                      <div className="input-label">Enter the name of the second partner</div>
                      <input
                        type="text"
                        value={formData.partner2Name || ''}
                        onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                        placeholder="Enter partner 2 name"
                        title="Enter the name of the second partner"
                        required
                      />
                    </div>
                  </>
                )}


                {formData.occasion === 'Romantic Date' && (
                  <>
                    <div className="form-group">
                      <label>Your name *</label>
                      <div className="input-label">Enter your name</div>
                      <input
                        type="text"
                        value={formData.partner1Name || ''}
                        onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                        placeholder="Enter your name"
                        title="Enter your name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Partner name *</label>
                      <div className="input-label">Enter your partner&apos;s name</div>
                      <input
                        type="text"
                        value={formData.partner2Name || ''}
                        onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                        placeholder="Enter partner name"
                        title="Enter your partner's name"
                        required
                      />
                    </div>
                  </>
                )}

                {formData.occasion === 'Marriage Proposal' && (
                  <>
                    <div className="form-group">
                      <label>Proposer Name *</label>
                      <div className="input-label">Enter the name of the person proposing</div>
                      <input
                        type="text"
                        value={formData.proposerName || ''}
                        onChange={(e) => handleInputChange('proposerName', e.target.value)}
                        placeholder="Enter proposer name"
                        title="Enter the name of the person proposing"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Proposal Partner Name *</label>
                      <div className="input-label">Enter the name of the person being proposed to</div>
                      <input
                        type="text"
                        value={formData.proposalPartnerName || ''}
                        onChange={(e) => handleInputChange('proposalPartnerName', e.target.value)}
                        placeholder="Enter proposal partner name"
                        title="Enter the name of the person being proposed to"
                        required
                      />
                    </div>
                  </>
                )}

                {formData.occasion === 'Proposal' && (
                  <>
                    <div className="form-group">
                      <label>Proposer Name *</label>
                      <div className="input-label">Enter the name of the person proposing</div>
                      <input
                        type="text"
                        value={formData.proposerName || ''}
                        onChange={(e) => handleInputChange('proposerName', e.target.value)}
                        placeholder="Enter proposer name"
                        title="Enter the name of the person proposing"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Proposal Partner Name *</label>
                      <div className="input-label">Enter the name of the person being proposed to</div>
                      <input
                        type="text"
                        value={formData.proposalPartnerName || ''}
                        onChange={(e) => handleInputChange('proposalPartnerName', e.target.value)}
                        placeholder="Enter proposal partner name"
                        title="Enter the name of the person being proposed to"
                        required
                      />
                    </div>
                  </>
                )}

                {formData.occasion === "Valentine's Day" && (
                  <div className="form-group">
                    <label>Valentine Name *</label>
                    <div className="input-label">Enter the name of your valentine</div>
                    <input
                      type="text"
                      value={formData.valentineName || ''}
                      onChange={(e) => handleInputChange('valentineName', e.target.value)}
                      placeholder="Enter valentine name"
                      title="Enter the name of your valentine"
                      required
                    />
                  </div>
                )}

                {formData.occasion === 'Custom Celebration' && (
                  <div className="form-group">
                    <label>Custom Celebration Details *</label>
                    <div className="input-label">Enter details about the custom celebration</div>
                    <input
                      type="text"
                      value={formData.customCelebration || ''}
                      onChange={(e) => handleInputChange('customCelebration', e.target.value)}
                      placeholder="Enter custom celebration details"
                      title="Enter details about the custom celebration"
                      required
                    />
                  </div>
                )}

                {formData.occasion === 'Baby Shower' && (
                  <div className="form-group">
                    <label>Nick name of Mom to be *</label>
                    <div className="input-label">Enter the nick name of the mom to be</div>
                    <input
                      type="text"
                      value={formData.birthdayName || ''}
                      onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                      placeholder="Enter nick name of mom to be"
                      title="Enter the nick name of the mom to be"
                      required
                    />
                  </div>
                )}

                {formData.occasion === 'Bride to be' && (
                  <div className="form-group">
                    <label>Nickname of Bride to be *</label>
                    <div className="input-label">Enter the nickname of the bride to be</div>
                    <input
                      type="text"
                      value={formData.birthdayName || ''}
                      onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                      placeholder="Enter nickname of bride to be"
                      title="Enter the nickname of the bride to be"
                      required
                    />
                  </div>
                )}

                {(formData.occasion === 'Congratulations' || formData.occasion === 'Farewell') && (
                  <div className="form-group">
                    <label>Person Name *</label>
                    <div className="input-label">Enter the name of the person</div>
                    <input
                      type="text"
                      value={formData.birthdayName || ''}
                      onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                      placeholder="Enter person name"
                      title="Enter the name of the person"
                      required
                    />
                  </div>
                )}
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
                  <div className="date-input-container">
                    <input
                      type="text"
                      value={formData.date}
                      onClick={() => setIsDatePickerOpen(true)}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      title="Click to select date"
                      placeholder="Click to select date"
                      readOnly
                      required
                    />
                    <button
                      type="button"
                      className="calendar-btn"
                      onClick={() => setIsDatePickerOpen(true)}
                      title="Open calendar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22 10H2v9a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3zM7 8a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1m10 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1" opacity="0.5"/>
                        <path fill="currentColor" d="M19 4h-1v3a1 1 0 0 1-2 0V4H8v3a1 1 0 0 1-2 0V4H5a3 3 0 0 0-3 3v3h20V7a3 3 0 0 0-3-3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Time Slot *</label>
                  <div className="input-label">Select the time slot for the booking</div>
          <div className="time-slot-selector" onClick={() => {
            console.log('🕐 Opening time selection popup with booked slots:', {
              bookedSlots: bookedTimeSlots,
              date: formData.date,
              theater: formData.theater,
              totalBookedSlots: bookedTimeSlots.length
            });
            setIsTimeSelectionOpen(true);
          }}>
                    <span className="time-slot-display">
                      {formData.time || 'Select time'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="time-slot-arrow">
                      <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </div>
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
                      className={`select-movies-btn-inline ${formData.selectedMovies.length > 0 ? 'has-movies' : ''}`}
                      onClick={handleSelectMovies}
                    >
                      <Play className="w-4 h-4" />
                      {formData.selectedMovies.length > 0 
                        ? formData.selectedMovies[0]
                        : 'Select Movies'
                      }
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label>Want Decorations?</label>
                  <div className="input-label">Select if you want to include decoration items in this booking</div>
                  <select
                    value={formData.wantDecorItems}
                    onChange={(e) => handleInputChange('wantDecorItems', e.target.value)}
                    title="Select if you want to include decoration items in this booking"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
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

              {formData.wantDecorItems === 'Yes' && (
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
              )}

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
                    <p>Click the button below to select a movie from our movie collection.</p>
                    <button 
                      className={`select-movies-btn ${formData.selectedMovies.length > 0 ? 'has-movies' : ''}`}
                      onClick={handleSelectMovies}
                    >
                      <Play className="w-4 h-4" />
                      {formData.selectedMovies.length > 0 
                        ? formData.selectedMovies[0]
                        : 'Select Movies'
                      }
                    </button>
                  </div>
                  {formData.selectedMovies.length > 0 && (
                    <div className="selected-movies">
                      <h5>Selected Movie:</h5>
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


          {activeTab === 'Review' && (
            <div className="tab-content">
              <h3>Review & Confirm</h3>
              
              <div className="review-section" style={{border: '2px solid #28a745', background: '#d4edda', padding: '1rem'}}>
                <h4>Customer Information</h4>
                <div style={{background: 'white',color: '#28a745', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem'}}>
                  <p><strong>Name:</strong> {formData.customerName || 'Not provided'}</p>
                  <p><strong>Email:</strong> {formData.customerEmail || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {formData.customerPhone || 'Not provided'}</p>
                  <p><strong>Occasion:</strong> {formData.occasion || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="review-section" style={{border: '2px solid #007bff', background: '#cce7ff', padding: '1rem'}}>
                <h4>Booking Details</h4>
                <div style={{background: 'white',color: '#007bff', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem'}}>
                  <p><strong>Theater:</strong> {theaters.find(t => t.id === formData.theater)?.name || formData.theater || 'Not selected'}</p>
                  <p><strong>Date:</strong> {formData.date || 'Not selected'}</p>
                  <p><strong>Time:</strong> {formData.time || 'Not selected'}</p>
                  <p><strong>People:</strong> {formData.numberOfPeople || 'Not specified'}</p>
                  <p><strong>Want Movies:</strong> {formData.wantMovies}</p>
                  {formData.wantMovies === 'Yes' && formData.selectedMovies.length > 0 && (
                    <p><strong>Selected Movies:</strong> {formData.selectedMovies.join(', ')}</p>
                  )}
                  <p><strong>Want Decorations:</strong> {formData.wantDecorItems}</p>
                  {formData.wantDecorItems === 'Yes' && formData.selectedDecorItems.length > 0 && (
                    <p><strong>Selected Decorations:</strong> {formData.selectedDecorItems.map(id => decorItems.find(d => d.id === id)?.name).join(', ')}</p>
                  )}
                  <p><strong>Status:</strong> {formData.status}</p>
                  {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
                </div>
              </div>
              
              {(formData.selectedCakes.length > 0 || 
                formData.selectedDecorItems.length > 0 || 
                formData.selectedGifts.length > 0 || 
                formData.selectedMovies.length > 0) && (
                <div className="review-section" style={{border: '2px solid #ff8c00', background: '#fff3cd', padding: '1rem'}}>
                  <h4>Selected Items</h4>
                  <div style={{background: 'white',color: '#ff8c00', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem'}}>
                    {formData.selectedCakes.length > 0 && (
                      <p><strong>Cakes:</strong> {formData.selectedCakes.map(id => cakes.find(c => c.id === id)?.name).join(', ')}</p>
                    )}
                    {formData.selectedDecorItems.length > 0 && (
                      <p><strong>Decorations:</strong> {formData.selectedDecorItems.map(id => decorItems.find(d => d.id === id)?.name).join(', ')}</p>
                    )}
                    {formData.selectedGifts.length > 0 && (
                      <p><strong>Gifts:</strong> {formData.selectedGifts.map(id => gifts.find(g => g.id === id)?.name).join(', ')}</p>
                    )}
                    {formData.selectedMovies.length > 0 && (
                      <p><strong>Movies:</strong> {formData.selectedMovies.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="review-section" style={{border: '2px solid #dc3545', background: '#f8d7da', padding: '1rem'}}>
                <h4>Payment Summary</h4>
                <div className="payment-summary" style={{background: 'white',color: '#dc3545', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem'}}>
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
                    <span>Advance Payment:</span>
                    <span>₹600</span>
                  </div>
                  <div className="summary-row">
                    <span>Venue Payment:</span>
                    <span>₹{calculateTotal() - 600}</span>
                  </div>
                </div>
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

        .date-input-container {
          position: relative;
          display: inline-block;
          width: 100%;
        }

        .date-input-container input {
          width: 100%;
          padding-right: 3rem;
        }

        .calendar-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          color: #666;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s ease;
        }

        .calendar-btn:hover {
          color: #ff0000;
        }

        .time-slot-selector {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.3s ease;
        }

        .time-slot-selector:hover {
          border-color: #ff0000;
        }

        .time-slot-display {
          color: #000;
          font-size: 0.9rem;
        }

        .time-slot-arrow {
          width: 16px;
          height: 16px;
          color: #666;
          transition: transform 0.3s ease;
        }

        .time-slot-selector:hover .time-slot-arrow {
          transform: rotate(180deg);
        }

        .time-selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .time-selection-modal {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .time-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .time-selection-header h3 {
          margin: 0;
          color: #333;
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
        }

        .time-selection-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
        }

        .time-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .time-slot-option {
          position: relative;
          padding: 1rem;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
        }

        .time-slot-option:hover:not(.booked) {
          border-color: #ff0000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .time-slot-option.selected {
          border-color: #ff0000;
          background: rgba(255, 0, 0, 0.05);
        }

        .time-slot-option.booked {
          background: rgba(255, 0, 0, 0.15);
          border-color: rgba(255, 0, 0, 0.4);
          cursor: not-allowed;
          opacity: 0.8;
        }

        .time-slot-option.booked:hover {
          transform: none;
          border-color: rgba(255, 0, 0, 0.4);
          background: rgba(255, 0, 0, 0.15);
        }

        .time-slot-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-direction: column;
        }

        .time-slot-option.booked .time-slot-content {
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .time-slot-text {
          font-weight: 500;
          color: #333;
        }

        .time-slot-booked-time {
          color: rgba(255, 0, 0, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-slot-booked-text {
          color: #ff4444;
          font-weight: 700;
          font-size: 1rem;
        }

        .time-slot-checkmark {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: #ff0000;
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
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .select-movies-btn:hover {
          background: #cc0000;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
        }

        .select-movies-btn.has-movies {
          background: #28a745;
          border: 2px solid #20c997;
        }

        .select-movies-btn.has-movies:hover {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
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
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .select-movies-btn-inline:hover {
          background: #cc0000;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
        }

        .select-movies-btn-inline.has-movies {
          background: #28a745;
          border: 2px solid #20c997;
        }

        .select-movies-btn-inline.has-movies:hover {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
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

        /* Validation Popup Styles */
        .booking-popup-validation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in-out;
        }

        .booking-popup-validation-content {
          text-align: center;
          padding: 2rem;
          max-width: 350px;
          background: #1a1a1a;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .booking-popup-validation-icon {
          color: #ff4444;
          margin-bottom: 1rem;
          animation: bounceIn 0.4s ease-out;
        }

        .booking-popup-validation-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
          animation: slideUp 0.4s ease-out 0.2s both;
        }

        .booking-popup-validation-message {
          color: #cccccc;
          margin-bottom: 1.5rem;
          line-height: 1.5;
          animation: slideUp 0.4s ease-out 0.3s both;
        }

        .booking-popup-validation-btn {
          background: #FF0005;
          color: #ffffff;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease-out 0.4s both;
        }

        .booking-popup-validation-btn:hover {
          background: #e60004;
          transform: translateY(-2px);
        }

        /* Mobile Responsive for Validation */
        @media (max-width: 768px) {
          .booking-popup-validation-content {
            padding: 1.5rem;
            margin: 1rem;
          }

          .booking-popup-validation-title {
            font-size: 1.1rem;
          }

          .booking-popup-validation-message {
            font-size: 0.9rem;
          }
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

        /* Close Confirmation Popup Styles */
        .admin-manual-booking-close-confirmation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999999;
          backdrop-filter: blur(5px);
          animation: fadeIn 0.3s ease;
        }

        .admin-manual-booking-close-confirmation-content {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.4s ease;
          position: relative;
          z-index: 10000000;
        }

        .admin-manual-booking-close-confirmation-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          border-radius: 16px 16px 0 0;
        }

        .admin-manual-booking-close-confirmation-icon {
          color: #f59e0b;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
          animation: bounce 0.6s ease;
        }

        .admin-manual-booking-close-confirmation-icon svg {
          filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3));
        }

        .admin-manual-booking-close-confirmation-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .admin-manual-booking-close-confirmation-message {
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
          font-size: 1rem;
        }

        .admin-manual-booking-close-confirmation-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .admin-manual-booking-close-confirmation-btn {
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
          font-size: 0.9rem;
        }

        .admin-manual-booking-close-confirmation-btn.cancel {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .admin-manual-booking-close-confirmation-btn.cancel:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .admin-manual-booking-close-confirmation-btn.confirm {
          background: #ef4444;
          color: white;
          border: 1px solid #dc2626;
        }

        .admin-manual-booking-close-confirmation-btn.confirm:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 640px) {
          .admin-manual-booking-close-confirmation-content {
            padding: 1.5rem;
            margin: 1rem;
          }

          .admin-manual-booking-close-confirmation-title {
            font-size: 1.125rem;
          }

          .admin-manual-booking-close-confirmation-message {
            font-size: 0.875rem;
          }

          .admin-manual-booking-close-confirmation-btn {
            padding: 0.625rem 1.25rem;
            font-size: 0.875rem;
          }

          .admin-manual-booking-close-confirmation-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .admin-manual-booking-close-confirmation-btn {
            width: 100%;
          }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          0% { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { 
            transform: translateY(0); 
          }
          40% { 
            transform: translateY(-10px); 
          }
          60% { 
            transform: translateY(-5px); 
          }
        }
      `}</style>

      {/* Date Picker Popup */}
      <GlobalDatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={(date) => {
          // The date is already in the correct format from GlobalDatePicker
          handleInputChange('date', date);
          setIsDatePickerOpen(false);
        }}
        selectedDate={formData.date || new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      />

      {/* Time Selection Popup */}
      {isTimeSelectionOpen && (
        <div className="time-selection-overlay" onClick={() => setIsTimeSelectionOpen(false)}>
          <div className="time-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="time-selection-header">
              <h3>Select Time Slot</h3>
              <button 
                className="time-selection-close"
                onClick={() => setIsTimeSelectionOpen(false)}
              >
                ✕
              </button>
            </div>
            {/* Debug: Log booked slots when time popup opens */}
            {(() => {
              console.log('🕐 Time selection popup opened with booked slots:', {
                bookedSlots: bookedTimeSlots,
                date: formData.date,
                theater: formData.theater,
                totalBookedSlots: bookedTimeSlots.length
              });
              return null;
            })()}
            <div className="time-selection-grid">
              {timeSlots.map((timeSlot) => {
                const isBooked = bookedTimeSlots.includes(timeSlot);
                const isSelected = formData.time === timeSlot;
                
                // Debug log for each time slot
                if (isBooked) {
                  console.log('🔴 Booked slot detected:', timeSlot, 'Booked slots:', bookedTimeSlots);
                }
                
                return (
                  <button
                    key={timeSlot}
                    onClick={() => {
                      if (!isBooked) {
                        handleInputChange('time', timeSlot);
                        setIsTimeSelectionOpen(false);
                      }
                    }}
                    disabled={isBooked}
                    className={`time-slot-option ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                  >
                    {!isBooked ? (
                      <div className="time-slot-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5" style={{ color: 'black' }}>
                          <path fill="currentColor" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34M12 6a1 1 0 0 0-.993.883L11 7v5l.009.131a1 1 0 0 0 .197.477l.087.1l3 3l.094.082a1 1 0 0 0 1.226 0l.094-.083l.083-.094a1 1 0 0 0 0-1.226l-.083-.094L13 11.585V7l-.007-.117A1 1 0 0 0 12 6"/>
                        </svg>
                        <span className="time-slot-text">{timeSlot}</span>
                      </div>
                    ) : (
                      <div className="time-slot-content">
                        <div className="time-slot-booked-time">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5" style={{ color: 'red' }}>
                            <path fill="currentColor" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34M12 6a1 1 0 0 0-.993.883L11 7v5l.009.131a1 1 0 0 0 .197.477l.087.1l3 3l.094.082a1 1 0 0 0 1.226 0l.094-.083l.083-.094a1 1 0 0 0 0-1.226l-.083-.094L13 11.585V7l-.007-.117A1 1 0 0 0 12 6"/>
                          </svg>
                          <span>{timeSlot}</span>
                        </div>
                        <div className="time-slot-booked-text">Slot Booked</div>
                      </div>
                    )}
                    {isSelected && !isBooked && (
                      <div className="time-slot-checkmark">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Movies Modal */}
      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="booking-popup-validation">
          <div className="booking-popup-validation-content">
            <div className="booking-popup-validation-icon">
              <X className="w-12 h-12" />
            </div>

            <h3 className="booking-popup-validation-title">
              {validationErrorName || 'Incomplete Form'}
            </h3>

            <p className="booking-popup-validation-message">
              {validationMessage}
            </p>

            <button
              onClick={() => setShowValidationPopup(false)}
              className="booking-popup-validation-btn"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Close Confirmation Popup */}
      {showCloseConfirmation && (
        <div className="admin-manual-booking-close-confirmation">
          <div className="admin-manual-booking-close-confirmation-content">
            <div className="admin-manual-booking-close-confirmation-icon">
              <X className="w-12 h-12" />
            </div>

            <h3 className="admin-manual-booking-close-confirmation-title">
              Close Manual Booking?
            </h3>

            <p className="admin-manual-booking-close-confirmation-message">
              Are you sure you want to close? Your booking progress will be lost.
            </p>

            <div className="admin-manual-booking-close-confirmation-actions">
              <button
                onClick={handleCancelClose}
                className="admin-manual-booking-close-confirmation-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="admin-manual-booking-close-confirmation-btn confirm"
              >
                Close Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <MoviesModal
        isOpen={isMoviesModalOpen}
        onClose={() => setIsMoviesModalOpen(false)}
        onMovieSelect={handleMovieSelect}
        selectedMovies={formData.selectedMovies}
      />
    </div>,
    document.body
  );
}
