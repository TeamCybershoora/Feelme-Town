'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, X, Check, Star, Calendar, Clock, Users, MapPin, Gift, Cake, Sparkles, Play } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useDatePicker } from '@/contexts/DatePickerContext';
import TimeSelectionPopup from './TimeSelectionPopup';
import GlobalDatePicker from './GlobalDatePicker';
import MoviesModal from './MoviesModal';


interface BookingForm {
  bookingName: string;
  numberOfPeople: number;
  whatsappNumber: string;
  emailAddress: string;
  occasion: string;
  selectedCakes: string[];
  selectedDecorItems: string[];
  selectedGifts: string[];
  selectedMovies: string[];
  // Overview section options
  wantCakes: 'Yes' | 'No';
  wantDecorItems: 'Yes' | 'No';
  wantGifts: 'Yes' | 'No';
  wantMovies: 'Yes' | 'No';
  promoCode: string;
  agreeToTerms: boolean;
  // Occasion specific details
  occasionPersonName?: string;
  birthdayName?: string;
  birthdayGender?: string;
  partner1Name?: string;
  partner1Gender?: string;
  partner2Name?: string;
  partner2Gender?: string;
  proposerName?: string;
  proposalPartnerName?: string;
  valentineName?: string;
  customCelebration?: string;
}

interface BookingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}


export default function BookingPopup({ isOpen, onClose }: BookingPopupProps) {
  const { selectedTheater, selectedDate, selectedTimeSlot, setSelectedTimeSlot, setSelectedTheater, openBookingPopup, closeBookingPopup, refreshBookedSlots } = useBooking();
  const { isDatePickerOpen, openDatePicker, closeDatePicker, setSelectedDate } = useDatePicker();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items' | 'Terms & Conditions'>('Overview');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBookingSuccessful, setIsBookingSuccessful] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string; bookingId?: string } | null>(null);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<BookingForm | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationErrorName, setValidationErrorName] = useState('');
  const [isTimeSelectionOpen, setIsTimeSelectionOpen] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isMoviesModalOpen, setIsMoviesModalOpen] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [formData, setFormData] = useState<BookingForm>({
    bookingName: '',
    numberOfPeople: 2,
    whatsappNumber: '',
    emailAddress: '',
    occasion: '',
    selectedCakes: [],
    selectedDecorItems: [],
    selectedGifts: [],
    selectedMovies: [],
    wantCakes: 'No',
    wantDecorItems: 'No',
    wantGifts: 'No',
    wantMovies: 'No',
    promoCode: '',
    agreeToTerms: false
  });

  // Debug: Watch for changes in selectedMovies
  useEffect(() => {
    console.log('🎬 selectedMovies changed:', formData.selectedMovies);
  }, [formData.selectedMovies]);


  // Validation function to check form completeness
  const validateForm = () => {
    // Check basic required fields
    if (!formData.bookingName.trim()) {
      setValidationErrorName('Missing Name');
      setValidationMessage('Please enter your name to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.whatsappNumber.trim()) {
      setValidationErrorName('Missing WhatsApp Number');
      setValidationMessage('Please enter your WhatsApp number to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.emailAddress.trim()) {
      setValidationErrorName('Missing Email Address');
      setValidationMessage('Please enter your email address to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!selectedTimeSlot) {
      setValidationErrorName('Missing Time Slot');
      setValidationMessage('Please select a time slot by clicking on the time area in the header to continue.');
      setShowValidationPopup(true);
      return false;
    }

    if (!formData.occasion) {
      setValidationErrorName('Missing Occasion');
      setValidationMessage('Please select an occasion to continue.');
      setShowValidationPopup(true);
      return false;
    }

    // Check if user selected "Yes" for items but didn&apos;t select any
    // Cakes validation is now handled by decoration dropdown
    if ((formData.wantDecorItems === 'Yes' || formData.wantGifts === 'Yes') && formData.selectedCakes.length === 0) {
      setValidationErrorName('Cake Selection Required');
      setValidationMessage('Cakes are automatically included with decoration & gifts. Please select cake items.');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.wantDecorItems === 'Yes' && formData.selectedDecorItems.length === 0) {
      setValidationErrorName('Decoration Items Selection Required');
      setValidationMessage('You selected "Yes" for decoration items but didn&apos;t choose any decoration items. Please select decoration items or change to "No".');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.wantGifts === 'Yes' && formData.selectedGifts.length === 0) {
      setValidationErrorName('Gift Items Selection Required');
      setValidationMessage('You selected "Yes" for gift items but didn&apos;t choose any gift items. Please select gift items or change to "No".');
      setShowValidationPopup(true);
      return false;
    }

    if (formData.wantMovies === 'Yes' && formData.selectedMovies.length === 0) {
      setValidationErrorName('Movie Selection Required');
      setValidationMessage('You selected "Yes" for movies but didn&apos;t choose any movies. Please select movies or change to "No".');
      setShowValidationPopup(true);
      return false;
    }

    // Check terms agreement
    if (!formData.agreeToTerms) {
      setValidationErrorName('Terms & Conditions Required');
      setValidationMessage('Please agree to the terms & conditions to continue.');
      setShowValidationPopup(true);
      return false;
    }

    return true;
  };

  // Check if form data has changed during editing
  const hasFormDataChanged = () => {
    if (!isEditingBooking || !originalFormData) return false;

    // Compare current form data with original
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  };


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
      selectedMovies: [],
      wantCakes: 'No',
      wantDecorItems: 'No',
      wantGifts: 'No',
      wantMovies: 'No',
      promoCode: '',
      agreeToTerms: false
    });
    setActiveTab('Overview');
    setIsLoaded(false);
    setIsEditingBooking(false); // Reset editing state
    setOriginalFormData(null); // Reset original form data
    setEditingBookingId(null); // Reset editing booking ID
  };

  useEffect(() => {
    if (isOpen) {
      // Check if returning from movies page and restore form data
      const bookingFromPopup = sessionStorage.getItem('bookingFromPopup');
      const storedFormData = sessionStorage.getItem('bookingFormData');

      if (bookingFromPopup === 'true' && storedFormData) {
        try {
          const parsedFormData = JSON.parse(storedFormData);

          // Check if there's a new selected movie to add
          const selectedMovie = sessionStorage.getItem('selectedMovie');
          if (selectedMovie) {
            console.log('🎬 Found selected movie in sessionStorage:', selectedMovie);
            // Replace existing movie with new selection (only one movie allowed)
            parsedFormData.selectedMovies = [selectedMovie];
            parsedFormData.wantMovies = 'Yes';
            // Clear the selected movie from sessionStorage
            sessionStorage.removeItem('selectedMovie');
          }

          // Extract theater from form data and restore it
          const { selectedTheater: storedTheater, ...formDataWithoutTheater } = parsedFormData;
          
          setFormData(formDataWithoutTheater);

          // Restore selected theater if it was stored in form data
          if (storedTheater) {
            console.log('🎭 Restoring theater from form data:', storedTheater.name);
            setSelectedTheater(storedTheater);
          }

          // Restore selected time slot if it was stored
          const storedTimeSlot = sessionStorage.getItem('selectedTimeSlot');
          if (storedTimeSlot) {
            console.log('⏰ Restoring selected time slot:', storedTimeSlot);
            setSelectedTimeSlot(storedTimeSlot);
            // Clear the stored time slot
            sessionStorage.removeItem('selectedTimeSlot');
          }

          // Clear the stored data
          sessionStorage.removeItem('bookingFromPopup');
          sessionStorage.removeItem('bookingFormData');
        } catch (error) {
          console.error('Error parsing stored form data:', error);
          // If error, reset form
          resetForm();
        }
      } else {
        // Check if returning from movies page with selected movies (legacy support)
        const selectedMovies = sessionStorage.getItem('selectedMovies');
        if (selectedMovies) {
          try {
            const parsedMovies = JSON.parse(selectedMovies);
            setFormData(prev => ({
              ...prev,
              selectedMovies: parsedMovies
            }));
            // Clear the stored movies
            sessionStorage.removeItem('selectedMovies');
          } catch (error) {
            console.error('Error parsing selected movies:', error);
          }
        }
        // Reset form when popup opens to ensure fresh start
        resetForm();
      }

      setIsLoaded(true);
      setIsBookingSuccessful(false);
      setBookingResult(null);
      setShowValidationPopup(false);
      setValidationMessage('');

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
    const availableTabs: ('Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items' | 'Terms & Conditions')[] = ['Overview', 'Occasion'];

    // Cakes tab is now controlled by decoration dropdown
    if (formData.wantDecorItems === 'Yes' || formData.wantGifts === 'Yes') {
      availableTabs.push('Cakes');
    }
    if (formData.wantDecorItems === 'Yes') {
      availableTabs.push('Decor Items');
    }
    if (formData.wantGifts === 'Yes') {
      availableTabs.push('Gifts Items');
    }

    // Always add Terms & Conditions as the last tab
    availableTabs.push('Terms & Conditions');

    return availableTabs;
  };

  const tabs = getAvailableTabs();

  const occasionOptions = [
    { name: 'Birthday Party', icon: '/images/occasion/Birthday.jpg', popular: true },
    { name: 'Anniversary', icon: '/images/occasion/Anniversary.jpg', popular: true },
    { name: 'Baby Shower', icon: '/images/occasion/Baby%20Shower.jpg', popular: true },
    { name: 'Bride to be', icon: '/images/occasion/Bride.jpg', popular: true },
    { name: 'Congratulations', icon: '/images/occasion/Congratulations.jpg', popular: true },
    { name: 'Farewell', icon: '/images/occasion/Farewell.jpg', popular: false },
    { name: 'Marriage Proposal', icon: '/images/occasion/Marrige%20Proposal.jpg', popular: true },
    { name: 'Proposal', icon: '/images/occasion/Proposal.jpg', popular: true },
    { name: 'Romantic Date', icon: '/images/occasion/Romatic%20Date.jpg', popular: true },
    { name: "Valentine's Day", icon: '/images/occasion/Valentine.jpg', popular: false },
    { name: 'Custom Celebration', icon: '/images/occasion/Custom%20Celebration.jpg', popular: false }
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

  const handleInputChange = async (field: keyof BookingForm, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // If changing wantCakes, wantDecorItems, wantGifts, or wantMovies, reset to Overview if current tab is no longer available
    if (field === 'wantCakes' || field === 'wantDecorItems' || field === 'wantGifts' || field === 'wantMovies') {
      const newTabs = getAvailableTabs();
      if (!newTabs.includes(activeTab)) {
        setActiveTab('Overview');
      }
    }

  };

  // Fetch booked slots when popup opens
  const fetchBookedSlots = async () => {
    if (!selectedTheater || !selectedDate) return;
    
    try {
      const response = await fetch(`/api/booked-slots?date=${encodeURIComponent(selectedDate)}&theater=${encodeURIComponent(selectedTheater.name)}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📅 Fetched booked slots:', data.bookedTimeSlots);
        setBookedTimeSlots(data.bookedTimeSlots || []);
      } else {
        console.error('Failed to fetch booked slots:', data.error);
        setBookedTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedTimeSlots([]);
    }
  };

  // Fetch booked slots when popup opens
  useEffect(() => {
    if (isOpen && selectedTheater && selectedDate) {
      fetchBookedSlots();
    }
  }, [isOpen, selectedTheater, selectedDate]);

  // Auto-update occasionPersonName only for the specific occasion field
  useEffect(() => {
    if (formData.occasion) {
      let personName = '';
      
      // Only get the name from the specific field for the selected occasion
      switch (formData.occasion) {
        case 'Birthday Party':
        case 'Baby Shower':
        case 'Bride to be':
        case 'Congratulations':
        case 'Farewell':
          personName = formData.birthdayName || '';
          break;
        case 'Anniversary':
        case 'Romantic Date':
          personName = formData.partner1Name || '';
          break;
        case 'Marriage Proposal':
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
    formData.proposerName,
    formData.valentineName,
    formData.customCelebration
  ]);

  const handleNumberChange = (field: 'numberOfPeople', action: 'increment' | 'decrement') => {
    setFormData(prev => {
      const newValue = action === 'increment' ? prev[field] + 1 : Math.max(1, prev[field] - 1);

      // Get theater capacity limit
      let maxCapacity = 2; // Default for couples
      if (selectedTheater?.name) {
        if (selectedTheater.name.includes('PHILIA') || selectedTheater.name.includes('FRIENDS') || selectedTheater.name.includes('FMT-Hall-2')) {
          maxCapacity = 4;
        } else if (selectedTheater.name.includes('PRAGMA') || selectedTheater.name.includes('LOVE') || selectedTheater.name.includes('FMT-Hall-3')) {
          maxCapacity = 8;
        } else if (selectedTheater.name.includes('STORGE') || selectedTheater.name.includes('FAMILY') || selectedTheater.name.includes('FMT-Hall-4')) {
          maxCapacity = 12;
        } else if (selectedTheater.name.includes('EROS') || selectedTheater.name.includes('COUPLES') || selectedTheater.name.includes('FMT-Hall-1')) {
          maxCapacity = 2;
        }
      }

      // Don't allow more people than theater capacity
      const finalValue = Math.min(newValue, maxCapacity);

      return {
        ...prev,
        [field]: finalValue
      };
    });
  };

  const handleItemSelection = (field: 'selectedCakes' | 'selectedDecorItems' | 'selectedGifts' | 'selectedMovies', itemName: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(itemName)
        ? prev[field].filter(item => item !== itemName)
        : [...prev[field], itemName]
    }));
  };

  // Handle movie selection - open movies modal
  const handleSelectMovies = () => {
    console.log('🎬 Opening movies modal from booking popup');
    console.log('🎬 Current isMoviesModalOpen state:', isMoviesModalOpen);
    setIsMoviesModalOpen(true);
    console.log('🎬 Set isMoviesModalOpen to true');
  };

  // Handle movie selection from modal
  const handleMovieSelect = (movieTitle: string) => {
    console.log('🎬 Movie selected from modal:', movieTitle);
    console.log('🎬 Current formData before update:', formData);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        selectedMovies: [movieTitle], // Only one movie allowed
        wantMovies: 'Yes' as 'Yes' | 'No'
      };
      console.log('🎬 New formData after update:', newFormData);
      return newFormData;
    });
    
    console.log('🎬 Closing movies modal');
    setIsMoviesModalOpen(false);
  };

  const calculateTotal = () => {
    // Extract price from selected theater or use default
    const basePrice = selectedTheater
      ? parseFloat(selectedTheater.price.replace(/[₹,\s]/g, ''))
      : 1399.00;

    let total = basePrice;

    // Add extra guest charges (₹400 per guest beyond 2)
    const extraGuests = Math.max(0, formData.numberOfPeople - 2);
    const extraGuestCharges = extraGuests * 400;
    total += extraGuestCharges;

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

    // Movies are free - no cost added

    return total;
  };

  const getPayableAmount = () => {
    return 600; // Fixed amount
  };

  const getBalanceAmount = () => {
    const total = calculateTotal();
    const payable = getPayableAmount();
    return total - payable;
  };

  const handleNextStep = async () => {
    // Check if this is the last tab (Complete Booking)
    const isLastTab = activeTab === tabs[tabs.length - 1];

    if (isLastTab) {
      // Check if booking time is within 1 hour
      const isBookingTimeNear = () => {
        if (!selectedDate || !selectedTimeSlot) return false;
        
        try {
          const now = new Date();
          const selectedDateObj = new Date(selectedDate);
          
          // If selected date is not today, booking is allowed
          if (selectedDateObj.toDateString() !== now.toDateString()) {
            return false;
          }
          
          // Parse the time slot to get start time
          const timeMatch = selectedTimeSlot.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
          if (!timeMatch) return false;
          
          const [, hours, minutes, period] = timeMatch;
          let hour24 = parseInt(hours);
          
          // Convert to 24-hour format
          if (period.toLowerCase() === 'pm' && hour24 !== 12) {
            hour24 += 12;
          } else if (period.toLowerCase() === 'am' && hour24 === 12) {
            hour24 = 0;
          }
          
          const slotStartTime = new Date(now);
          slotStartTime.setHours(hour24, parseInt(minutes), 0, 0);
          
          // Check if current time is within 1 hour of slot start time
          const oneHourBefore = new Date(slotStartTime.getTime() - (60 * 60 * 1000));
          return now.getTime() >= oneHourBefore.getTime();
        } catch (error) {
          console.error('Error checking booking time:', error);
          return false;
        }
      };
      
      // Check if booking time is near
      if (isBookingTimeNear()) {
        setValidationMessage('Booking is not allowed within 1 hour of the selected time slot. Please select a different time.');
        setShowValidationPopup(true);
        return;
      }
      
      // Final step - validate entire form before saving
      if (!validateForm()) {
        return; // Validation failed, popup is already shown
      }
    } else {
      // For intermediate steps, do basic validation
      if (activeTab === 'Overview') {
        // Validate Overview section fields
        if (!formData.bookingName.trim()) {
          setValidationMessage('Please enter your name to continue.');
          setShowValidationPopup(true);
          return;
        }

        if (!formData.whatsappNumber.trim()) {
          setValidationMessage('Please enter your WhatsApp number to continue.');
          setShowValidationPopup(true);
          return;
        }

        if (!formData.emailAddress.trim()) {
          setValidationMessage('Please enter your email address to continue.');
          setShowValidationPopup(true);
          return;
        }

        if (!selectedTimeSlot) {
          setValidationMessage('Please select a time slot by clicking on the time area in the header to continue.');
          setShowValidationPopup(true);
          return;
        }

        // Validate theater capacity
        let maxCapacity = 2; // Default for couples
        if (selectedTheater?.name) {
          if (selectedTheater.name.includes('PHILIA') || selectedTheater.name.includes('FRIENDS') || selectedTheater.name.includes('FMT-Hall-2')) {
            maxCapacity = 4;
          } else if (selectedTheater.name.includes('PRAGMA') || selectedTheater.name.includes('LOVE') || selectedTheater.name.includes('FMT-Hall-3')) {
            maxCapacity = 8;
          } else if (selectedTheater.name.includes('STORGE') || selectedTheater.name.includes('FAMILY') || selectedTheater.name.includes('FMT-Hall-4')) {
            maxCapacity = 12;
          } else if (selectedTheater.name.includes('EROS') || selectedTheater.name.includes('COUPLES') || selectedTheater.name.includes('FMT-Hall-1')) {
            maxCapacity = 2;
          }
        }

        if (formData.numberOfPeople > maxCapacity) {
          setValidationMessage(`This theater allows maximum ${maxCapacity} people. Please reduce the number of people to continue.`);
          setShowValidationPopup(true);
          return;
        }
      }

      if (activeTab === 'Occasion' && !formData.occasion.trim()) {
        setValidationMessage('Please select an occasion to continue.');
        setShowValidationPopup(true);
        return;
      }

      if (activeTab === 'Terms & Conditions' && !formData.agreeToTerms) {
        setValidationMessage('Please agree to terms and conditions to continue.');
        setShowValidationPopup(true);
        return;
      }
    }

    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items' | 'Terms & Conditions');
    } else {
      // Final step - save booking to database
      try {
        // Calculate payment amounts
        const totalAmount = calculateTotal();
        const advancePayment = Math.round(totalAmount * 0.25); // 25% advance payment
        const venuePayment = totalAmount - advancePayment; // Remaining amount to be paid at venue

        // Map form data to API format
        const bookingData = {
          name: formData.bookingName,
          email: formData.emailAddress,
          phone: formData.whatsappNumber,
          theaterName: selectedTheater?.name || 'FeelME Town Theater',
          date: selectedDate || new Date().toISOString().split('T')[0],
          time: selectedTimeSlot || '6:00 PM',
          occasion: formData.occasion,
          occasionPersonName: formData.birthdayName || formData.partner1Name || formData.partner2Name || formData.proposerName || formData.proposalPartnerName || formData.valentineName || '',
          // Debug Anniversary data
          ...(formData.occasion === 'Anniversary' && {
            debugPartner1: formData.partner1Name,
            debugPartner2: formData.partner2Name
          }),
          // Only send relevant occasion-specific names based on selected occasion
          ...(formData.occasion === 'Birthday Party' && { 
            birthdayName: formData.birthdayName
          }),
          ...(formData.occasion === 'Anniversary' && { 
            partner1Name: formData.partner1Name,
            partner2Name: formData.partner2Name
          }),
          ...(formData.occasion === 'Baby Shower' && { birthdayName: formData.birthdayName }),
          ...(formData.occasion === 'Bride to be' && { birthdayName: formData.birthdayName }),
          ...(formData.occasion === 'Congratulations' && { birthdayName: formData.birthdayName }),
          ...(formData.occasion === 'Farewell' && { birthdayName: formData.birthdayName }),
          ...(formData.occasion === 'Marriage Proposal' && { 
            proposerName: formData.proposerName,
            proposalPartnerName: formData.proposalPartnerName 
          }),
          ...(formData.occasion === 'Romantic Date' && { 
            partner1Name: formData.partner1Name,
            partner2Name: formData.partner2Name 
          }),
          ...(formData.occasion === "Valentine's Day" && { valentineName: formData.valentineName }),
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
          })),
          selectedMovies: formData.selectedMovies.map(movieTitle => ({
            id: movieTitle.toLowerCase().replace(/\s+/g, '_'),
            name: movieTitle,
            price: 0,
            quantity: 1
          })),
          // Payment breakdown
          totalAmount: totalAmount,
          advancePayment: advancePayment, // Amount paid now (₹600)
          venuePayment: venuePayment, // Amount to be paid at venue
          status: 'completed' // Booking status
        };

        console.log(isEditingBooking ? 'Updating booking data:' : 'Saving booking data to database:', bookingData);
        
        // Debug Anniversary data specifically
        if (formData.occasion === 'Anniversary') {
          console.log('🔍 Anniversary Debug - Form Data:', {
            partner1Name: formData.partner1Name,
            partner2Name: formData.partner2Name,
            occasion: formData.occasion
          });
          console.log('🔍 Anniversary Debug - Booking Data:', {
            partner1Name: bookingData.partner1Name,
            partner2Name: bookingData.partner2Name,
            occasion: bookingData.occasion
          });
        }

        // Use PUT for editing existing booking, POST for new booking
        const url = isEditingBooking && editingBookingId
          ? `/api/booking/${editingBookingId}`
          : '/api/booking';
        const method = isEditingBooking && editingBookingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Booking saved successfully:', result);
          console.log('🎯 Showing success animation...');
          console.log(`${isEditingBooking ? 'Booking Updated' : 'Booking Complete'} ${formData.bookingName} - Check your mail`);

          // Show success animation instead of closing
          setBookingResult({
            ...result,
            wasEditing: isEditingBooking // Store editing state in result
          });
          setIsBookingSuccessful(true);
          setIsEditingBooking(false); // Reset editing state

          // Refresh booked slots in real-time
          refreshBookedSlots();
          // Also refresh booked slots in this popup
          fetchBookedSlots();
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
  };

  const handleSkip = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items' | 'Terms & Conditions');
    }
  };

  // Handle confirmation popup actions
  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false);
    setIsClosing(false);
    // Proceed with actual closing logic
    await performClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
    setIsClosing(false);
  };

  const handleClose = async (e?: React.MouseEvent) => {
    // Only close if clicking on the overlay itself, not on child elements
    if (e && e.target !== e.currentTarget) {
      return;
    }
    
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

  const performClose = async () => {
    // Check if we're in editing mode and if changes were made
    if (isEditingBooking) {
      if (hasFormDataChanged()) {
        // Changes were made during editing - treat as incomplete booking
        const hasData = formData.bookingName || formData.emailAddress || formData.whatsappNumber || formData.occasion;

        if (hasData && formData.emailAddress) {
          // Send incomplete booking email for edited data
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
                occasion: formData.occasion,
                occasionPersonName: formData.birthdayName || formData.partner1Name || formData.partner2Name || formData.proposerName || formData.proposalPartnerName || formData.valentineName || '',
                // Only send relevant occasion-specific names based on selected occasion
                ...(formData.occasion === 'Birthday Party' && { 
                  birthdayName: formData.birthdayName,
                  birthdayGender: formData.birthdayGender
                }),
                ...(formData.occasion === 'Anniversary' && { 
                  partner1Name: formData.partner1Name,
                  partner2Name: formData.partner2Name
                }),
                ...(formData.occasion === 'Baby Shower' && { birthdayName: formData.birthdayName }),
                ...(formData.occasion === 'Bride to be' && { birthdayName: formData.birthdayName }),
                ...(formData.occasion === 'Congratulations' && { birthdayName: formData.birthdayName }),
                ...(formData.occasion === 'Farewell' && { birthdayName: formData.birthdayName }),
                ...(formData.occasion === 'Marriage Proposal' && { 
                  proposerName: formData.proposerName,
                  proposalPartnerName: formData.proposalPartnerName 
                }),
                ...(formData.occasion === 'Romantic Date' && { 
                  partner1Name: formData.partner1Name,
                  partner2Name: formData.partner2Name 
                }),
                ...(formData.occasion === "Valentine's Day" && { valentineName: formData.valentineName }),
              })
            });

            const result = await response.json();
            if (result.success) {
              console.log('📧 Incomplete booking email sent for edited data');
              console.log('🎯 Showing info toast...');
              console.log('📧 Reminder email sent!');
            }
          } catch (error) {
            console.log('⚠️ Failed to send incomplete booking email:', error);
          }
        }
      } else {
        // No changes made during editing - booking remains completed
        console.log('📝 No changes made during editing - booking remains completed');
      }
    } else {
      // Not in editing mode - check if user has entered data but not completed booking
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
              occasion: formData.occasion,
              occasionPersonName: formData.birthdayName || formData.partner1Name || formData.partner2Name || formData.proposerName || formData.proposalPartnerName || formData.valentineName || '',
              // Only send relevant occasion-specific names based on selected occasion
              ...(formData.occasion === 'Birthday Party' && { 
                birthdayName: formData.birthdayName,
                birthdayGender: formData.birthdayGender
              }),
              ...(formData.occasion === 'Anniversary' && { 
                partner1Name: formData.partner1Name,
                partner2Name: formData.partner2Name
              }),
              ...(formData.occasion === 'Baby Shower' && { birthdayName: formData.birthdayName }),
              ...(formData.occasion === 'Bride to be' && { birthdayName: formData.birthdayName }),
              ...(formData.occasion === 'Congratulations' && { birthdayName: formData.birthdayName }),
              ...(formData.occasion === 'Farewell' && { birthdayName: formData.birthdayName }),
              ...(formData.occasion === 'Marriage Proposal' && { 
                proposerName: formData.proposerName,
                proposalPartnerName: formData.proposalPartnerName 
              }),
              ...(formData.occasion === 'Romantic Date' && { 
                partner1Name: formData.partner1Name,
                partner2Name: formData.partner2Name 
              }),
              ...(formData.occasion === "Valentine's Day" && { valentineName: formData.valentineName }),
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
    // Navigate to theater page when popup is closed
    router.push('/theater');
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
              <span className="booking-popup-back-text">Back</span>
            </button>
            <div className="booking-popup-brand">
              <div className="booking-popup-logo">
                <Play className="w-6 h-6" />
              </div>
              <div className="booking-popup-title-section">
                <h1 className="booking-popup-title">Book Your Show</h1>
                
              </div>
            </div>
            <button className="booking-popup-close-btn" onClick={handleCloseButtonClick}>
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
              <div 
                className="booking-popup-meta-item booking-popup-date-selector-meta"
                onClick={openDatePicker}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="booking-popup-meta-icon">
                  <path fill="currentColor" d="M22 10H2v9a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3zM7 8a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1m10 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1" opacity="0.5" />
                  <path fill="currentColor" d="M19 4h-1v3a1 1 0 0 1-2 0V4H8v3a1 1 0 0 1-2 0V4H5a3 3 0 0 0-3 3v3h20V7a3 3 0 0 0-3-3" />
                </svg>
                <span>{selectedDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="booking-popup-date-arrow-small">
                  <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
              </div>
              <div
                className="booking-popup-meta-item booking-popup-time-selector-meta"
                onClick={() => setIsTimeSelectionOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="booking-popup-meta-icon">
                  <g fill="none">
                    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                    <path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 4a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1" />
                  </g>
                </svg>
                <span className="booking-popup-time-text">
                  {selectedTimeSlot || 'Choose Time'}
                </span>
                <div className="booking-popup-time-arrow-small">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
              <div className="booking-popup-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" className="booking-popup-meta-icon">
                  <path fill="currentColor" d="M6.153 7.008A1.5 1.5 0 0 1 7.5 8.5c0 .771-.47 1.409-1.102 1.83c-.635.424-1.485.67-2.398.67s-1.763-.246-2.398-.67C.969 9.91.5 9.271.5 8.5A1.5 1.5 0 0 1 2 7h4zM10.003 7a1.5 1.5 0 0 1 1.5 1.5c0 .695-.432 1.211-.983 1.528c-.548.315-1.265.472-2.017.472q-.38-.001-.741-.056c.433-.512.739-1.166.739-1.944A2.5 2.5 0 0 0 7.997 7zM4.002 1.496A2.253 2.253 0 1 1 4 6.001a2.253 2.253 0 0 1 0-4.505m4.75 1.001a1.75 1.75 0 1 1 0 3.5a1.75 1.75 0 0 1 0-3.5" />
                </svg>
                <span>{formData.numberOfPeople} People</span>
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
                onClick={() => setActiveTab(tab as 'Overview' | 'Occasion' | 'Cakes' | 'Decor Items' | 'Gifts Items' | 'Terms & Conditions')}
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
                          <button
                            onClick={() => handleNumberChange('numberOfPeople', 'increment')}
                            disabled={(() => {
                              let maxCapacity = 2; // Default for couples
                              if (selectedTheater?.name) {
                                if (selectedTheater.name.includes('PHILIA') || selectedTheater.name.includes('FRIENDS') || selectedTheater.name.includes('FMT-Hall-2')) {
                                  maxCapacity = 4;
                                } else if (selectedTheater.name.includes('PRAGMA') || selectedTheater.name.includes('LOVE') || selectedTheater.name.includes('FMT-Hall-3')) {
                                  maxCapacity = 8;
                                } else if (selectedTheater.name.includes('STORGE') || selectedTheater.name.includes('FAMILY') || selectedTheater.name.includes('FMT-Hall-4')) {
                                  maxCapacity = 12;
                                } else if (selectedTheater.name.includes('EROS') || selectedTheater.name.includes('COUPLES') || selectedTheater.name.includes('FMT-Hall-1')) {
                                  maxCapacity = 2;
                                }
                              }
                              return formData.numberOfPeople >= maxCapacity;
                            })()}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {(() => {
                          let maxCapacity = 2; // Default for couples
                          if (selectedTheater?.name) {
                            if (selectedTheater.name.includes('PHILIA') || selectedTheater.name.includes('FRIENDS') || selectedTheater.name.includes('FMT-Hall-2')) {
                              maxCapacity = 4;
                            } else if (selectedTheater.name.includes('PRAGMA') || selectedTheater.name.includes('LOVE') || selectedTheater.name.includes('FMT-Hall-3')) {
                              maxCapacity = 8;
                            } else if (selectedTheater.name.includes('STORGE') || selectedTheater.name.includes('FAMILY') || selectedTheater.name.includes('FMT-Hall-4')) {
                              maxCapacity = 12;
                            } else if (selectedTheater.name.includes('EROS') || selectedTheater.name.includes('COUPLES') || selectedTheater.name.includes('FMT-Hall-1')) {
                              maxCapacity = 2;
                            }
                          }
                          return formData.numberOfPeople >= maxCapacity ? (
                            <div className="booking-popup-capacity-warning">
                              <span>Maximum capacity reached for this theater ({maxCapacity} people)</span>
                            </div>
                          ) : null;
                        })()}
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
                          <label>Want Movies?</label>
                          <div className="booking-popup-movie-selection">
                            <select
                              value={formData.wantMovies}
                              onChange={(e) => handleInputChange('wantMovies', e.target.value as 'Yes' | 'No')}
                              className="booking-popup-select"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                            {formData.wantMovies === 'Yes' && (
                              <div className="booking-popup-movie-selection-info">
                                <button
                                  type="button"
                                  onClick={handleSelectMovies}
                                  className="booking-popup-select-movies-btn"
                                >
                                  <Play className="w-4 h-4" />
                                  {formData.selectedMovies.length > 0 ? (
                                    <>
                                      {(() => {
                                        const movieName = formData.selectedMovies[0];
                                        const words = movieName.split(' ');
                                        if (words.length > 2) {
                                          return words.slice(0, 2).join(' ') + '...';
                                        }
                                        return movieName;
                                      })()}
                                      <span className="booking-popup-movie-change-text">
                                        (Change Movie)
                                      </span>
                                    </>
                                  ) : (
                                    'Select Movie'
                                  )}
                                </button>
                                <div className="booking-popup-movie-price-info">
                                  <span className="booking-popup-movie-price-text">
                                    Free
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="booking-popup-field">
                          <label>Want Decoration & Gifts?</label>
                          <select
                            value={formData.wantDecorItems === 'Yes' || formData.wantGifts === 'Yes' ? 'Yes' : 'No'}
                            onChange={(e) => {
                              const value = e.target.value as 'Yes' | 'No';
                              setFormData(prev => ({
                                ...prev,
                                wantDecorItems: value,
                                wantGifts: value,
                                wantCakes: value // Also control cakes selection
                              }));
                            }}
                            className="booking-popup-select"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>


                      </div>

                      {/* Booking Summary inside Overview */}
                      <div className="booking-popup-overview-summary">
                        <div className="booking-popup-overview-summary-header">
                          <h4 className="booking-popup-overview-summary-title">Booking Summary</h4>
                          <div className="booking-popup-overview-summary-badge">Live Pricing</div>
                        </div>
                        <div className="booking-popup-overview-summary-content">
                          {/* Theatre Booking Section */}
                          <div className="booking-popup-overview-summary-section">
                            <h5 className="booking-popup-overview-summary-section-title">Theatre Booking</h5>
                            <div className="booking-popup-overview-summary-item">
                              <span>{selectedTheater ? selectedTheater.name : 'EROS Theatre'}</span>
                              <span>{selectedTheater ? selectedTheater.price : '₹1,399.00'}</span>
                            </div>
                            <div className="booking-popup-overview-summary-item">
                              <span>Base Guests (2)</span>
                              <span>Included</span>
                            </div>
                            {formData.numberOfPeople > 2 && (
                              <div className="booking-popup-overview-summary-item">
                                <span>Extra Guests ({formData.numberOfPeople - 2} × ₹400)</span>
                                <span>₹{(formData.numberOfPeople - 2) * 400}</span>
                              </div>
                            )}
                          </div>

                          {/* Divider Line - Only when movies are selected */}
                          {formData.wantMovies === 'Yes' && formData.selectedMovies.length > 0 && (
                            <div className="booking-popup-overview-summary-divider-line"></div>
                          )}

                          {/* Movies Section */}
                          {formData.wantMovies === 'Yes' && formData.selectedMovies.length > 0 && (
                            <div className="booking-popup-overview-summary-section">
                              <h5 className="booking-popup-overview-summary-section-title">Movies</h5>
                              <div className="booking-popup-overview-summary-item">
                                <span>{formData.selectedMovies[0]}</span>
                                <span>Free</span>
                              </div>
                            </div>
                          )}


                          {/* Cakes Section */}
                          {(formData.wantDecorItems === 'Yes' || formData.wantGifts === 'Yes') && formData.selectedCakes.length > 0 && (
                            <div className="booking-popup-overview-summary-section">
                              <h5 className="booking-popup-overview-summary-section-title">Cakes</h5>
                              {formData.selectedCakes.map((cakeName) => {
                                const cake = cakeOptions.find(c => c.name === cakeName);
                                return cake ? (
                                  <div key={cakeName} className="booking-popup-overview-summary-item">
                                    <span>{cake.name}</span>
                                    <span>₹{cake.price}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Decorations Section */}
                          {formData.wantDecorItems === 'Yes' && formData.selectedDecorItems.length > 0 && (
                            <div className="booking-popup-overview-summary-section">
                              <h5 className="booking-popup-overview-summary-section-title">Decorations</h5>
                              {formData.selectedDecorItems.map((decorName) => {
                                const decor = decorOptions.find(d => d.name === decorName);
                                return decor ? (
                                  <div key={decorName} className="booking-popup-overview-summary-item">
                                    <span>{decor.name}</span>
                                    <span>₹{decor.price}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Gifts Section */}
                          {formData.wantGifts === 'Yes' && formData.selectedGifts.length > 0 && (
                            <div className="booking-popup-overview-summary-section">
                              <h5 className="booking-popup-overview-summary-section-title">Gifts</h5>
                              {formData.selectedGifts.map((giftName) => {
                                const gift = giftOptions.find(g => g.name === giftName);
                                return gift ? (
                                  <div key={giftName} className="booking-popup-overview-summary-item">
                                    <span>{gift.name}</span>
                                    <span>₹{gift.price}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Totals Section */}
                          <div className="booking-popup-overview-summary-totals">
                            {/* Upper Section - Subtotal & Total Amount */}
                            <div className="booking-popup-overview-summary-upper">
                              <div className="booking-popup-overview-summary-item">
                                <span>Subtotal</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                              </div>
                              <div className="booking-popup-overview-summary-item booking-popup-overview-summary-total">
                                <span>Total Amount</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Divider Line */}
                            <div className="booking-popup-overview-summary-divider-line"></div>

                            {/* Lower Section - Pay Now & At Venue */}
                            <div className="booking-popup-overview-summary-lower">
                              <div className="booking-popup-overview-summary-item booking-popup-overview-summary-advance">
                                <span>Slot Booking Fee</span>
                                <span>₹{getPayableAmount()}</span>
                              </div>
                              <div className="booking-popup-overview-summary-item booking-popup-overview-summary-balance">
                                <span>At Venue</span>
                                <span>₹{getBalanceAmount().toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
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


                    {!formData.occasion ? (
                      <div className="booking-popup-occasions">
                        {occasionOptions.map((occasion) => (
                          <div
                            key={occasion.name}
                            onClick={() => handleInputChange('occasion', occasion.name)}
                            className="booking-popup-occasion"
                            style={{
                              backgroundImage: `url(${occasion.icon})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          >
                            {occasion.popular && <div className="booking-popup-badge">Popular</div>}
                            <div className="booking-popup-occasion-overlay">
                              <h4>{occasion.name}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="booking-popup-selected-occasion">
                        <div className="booking-popup-occasion-header">
                            <div className="booking-popup-occasion-selected">
                              <h4>{formData.occasion}</h4>
                            </div>
                          <button
                            onClick={() => handleInputChange('occasion', '')}
                            className="booking-popup-change-occasion-btn"
                          >
                            Change
                          </button>
                        </div>

                        <div className="booking-popup-occasion-details">
                          {formData.occasion === 'Birthday Party' && (
                            <div className="booking-popup-field">
                              <label>Birthday Person Name</label>
                              <input
                                type="text"
                                value={formData.birthdayName || ''}
                                onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                                placeholder="Enter birthday person&apos;s name"
                              />
                            </div>
                          )}

                          {formData.occasion === 'Anniversary' && (
                            <div className="booking-popup-field-row">
                              <div className="booking-popup-field">
                                <label>Partner 1 Name</label>
                                <input
                                  type="text"
                                  value={formData.partner1Name || ''}
                                  onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                                  placeholder="Enter partner&apos;s name"
                                />
                              </div>
                              <div className="booking-popup-field">
                                <label>Partner 2 Name</label>
                                <input
                                  type="text"
                                  value={formData.partner2Name || ''}
                                  onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                                  placeholder="Enter partner&apos;s name"
                                />
                              </div>
                            </div>
                          )}


                          {formData.occasion === 'Proposal' && (
                            <div className="booking-popup-field-row">
                              <div className="booking-popup-field">
                                <label>Proposer Name</label>
                                <input
                                  type="text"
                                  value={formData.proposerName || ''}
                                  onChange={(e) => handleInputChange('proposerName', e.target.value)}
                                  placeholder="Enter proposer's name"
                                />
                              </div>
                              <div className="booking-popup-field">
                                <label>Partner Name</label>
                                <input
                                  type="text"
                                  value={formData.proposalPartnerName || ''}
                                  onChange={(e) => handleInputChange('proposalPartnerName', e.target.value)}
                                  placeholder="Enter partner's name"
                                />
                              </div>
                            </div>
                          )}

                          {formData.occasion === "Valentine's Day" && (
                            <div className="booking-popup-field-row">
                              <div className="booking-popup-field">
                                <label>Partner Name</label>
                                <input
                                  type="text"
                                  value={formData.valentineName || ''}
                                  onChange={(e) => handleInputChange('valentineName', e.target.value)}
                                  placeholder="Enter partner's name"
                                />
                              </div>
                            </div>
                          )}

                          {formData.occasion === 'Baby Shower' && (
                            <div className="booking-popup-field">
                              <label>Mother&apos;s Name</label>
                              <input
                                type="text"
                                value={formData.birthdayName || ''}
                                onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                                  placeholder="Enter mother&apos;s name"
                              />
                            </div>
                          )}


                          {formData.occasion === 'Bride to be' && (
                            <div className="booking-popup-field">
                              <label>Bride&apos;s Name</label>
                              <input
                                type="text"
                                value={formData.birthdayName || ''}
                                onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                                placeholder="Enter bride's name"
                              />
                            </div>
                          )}

                          {formData.occasion === 'Congratulations' && (
                            <div className="booking-popup-field">
                              <label>Person&apos;s Name</label>
                              <input
                                type="text"
                                value={formData.birthdayName || ''}
                                onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                                placeholder="Enter person&apos;s name"
                              />
                            </div>
                          )}

                          {formData.occasion === 'Farewell' && (
                            <div className="booking-popup-field">
                              <label>Person&apos;s Name</label>
                              <input
                                type="text"
                                value={formData.birthdayName || ''}
                                onChange={(e) => handleInputChange('birthdayName', e.target.value)}
                                placeholder="Enter person&apos;s name"
                              />
                            </div>
                          )}

                          {formData.occasion === 'Marriage Proposal' && (
                            <div className="booking-popup-field-row">
                              <div className="booking-popup-field">
                                <label>Proposer Name</label>
                                <input
                                  type="text"
                                  value={formData.proposerName || ''}
                                  onChange={(e) => handleInputChange('proposerName', e.target.value)}
                                  placeholder="Enter proposer's name"
                                />
                              </div>
                              <div className="booking-popup-field">
                                <label>Partner Name</label>
                                <input
                                  type="text"
                                  value={formData.proposalPartnerName || ''}
                                  onChange={(e) => handleInputChange('proposalPartnerName', e.target.value)}
                                  placeholder="Enter partner's name"
                                />
                              </div>
                            </div>
                          )}

                          {formData.occasion === 'Romantic Date' && (
                            <div className="booking-popup-field-row">
                              <div className="booking-popup-field">
                                <label>Partner 1 Name</label>
                                <input
                                  type="text"
                                  value={formData.partner1Name || ''}
                                  onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                                  placeholder="Enter first partner's name"
                                />
                              </div>
                              <div className="booking-popup-field">
                                <label>Partner 2 Name</label>
                                <input
                                  type="text"
                                  value={formData.partner2Name || ''}
                                  onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                                  placeholder="Enter second partner's name"
                                />
                              </div>
                            </div>
                          )}

                          {formData.occasion === 'Custom Celebration' && (
                            <div className="booking-popup-field">
                              <label>Celebration Details</label>
                              <textarea
                                value={formData.customCelebration || ''}
                                onChange={(e) => handleInputChange('customCelebration', e.target.value)}
                                placeholder="Describe your custom celebration..."
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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


                {activeTab === 'Terms & Conditions' && (
                  <div className="booking-popup-section">
                    <h3 className="booking-popup-section-title">
                      <Check className="w-5 h-5" />
                      Terms & Conditions
                    </h3>

                    <div className="booking-popup-terms-container">
                      <div className="booking-popup-terms-section">
                        <h4 className="booking-popup-terms-title">Terms & Conditions</h4>
                        <div className="booking-popup-terms-content">
                          <ul className="booking-popup-terms-list">
                            <li>No movie/OTT accounts provided; setups use user&apos;s accounts/downloaded content.</li>
                            <li>Smoking/Drinking is NOT allowed.</li>
                            <li>Damage to the theater (including decorative materials like balloons, lights) must be reimbursed.</li>
                            <li>Guests must maintain cleanliness.</li>
                            <li>Party poppers, snow sprays, cold fire, and similar items are strictly prohibited.</li>
                            <li>Carrying an AADHAAR CARD is mandatory for entry scanning.</li>
                            <li>Couples under 18 years are not allowed to book.</li>
                            <li>Pets are strictly not allowed.</li>
                            <li>An advance amount of RS. {getPayableAmount()} plus a convenience fee is collected to book the slot.</li>
                          </ul>
                        </div>
                      </div>

                      <div className="booking-popup-terms-section">
                        <h4 className="booking-popup-terms-title">Refund Policy</h4>
                        <div className="booking-popup-terms-content">
                          <p>Advance amount is fully refundable if slot is cancelled at least 72 hrs before the slot time. If your slot is less than 72 hrs away from time of payment then advance is non-refundable.</p>
                        </div>
                      </div>

                      <div className="booking-popup-agreement">
                        <label className="booking-popup-checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.agreeToTerms}
                            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                            className="booking-popup-checkbox"
                          />
                          <span className="booking-popup-checkbox-text">
                            Click here to Agree to the above terms & conditions.
                          </span>
                        </label>
                      </div>
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
                      <span>{activeTab === tabs[tabs.length - 1] ? 'Pay Now' : 'Continue'}</span>
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={handleNextStep} className="booking-popup-btn">
                    <span>{activeTab === tabs[tabs.length - 1] ? 'Pay Now' : 'Continue'}</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Success Animation */}
        {isBookingSuccessful && bookingResult && (
          <div className="booking-popup-success">
            <div className="booking-popup-success-content">
              <div className="booking-popup-success-animation">
                <div className="booking-popup-success-checkmark">
                  <div className="booking-popup-success-checkmark-circle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 16 16"
                      className="booking-popup-success-checkmark-svg"
                    >
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        points="2.75 8.75 6.25 12.25 13.25 4.75"
                        className="booking-popup-success-checkmark-path"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="booking-popup-success-title">
                {(bookingResult as { wasEditing?: boolean })?.wasEditing ? 'Booking Updated!' : 'Booking Successful!'}
              </h2>

              <div className="booking-popup-success-message">
                <p>{(bookingResult as { wasEditing?: boolean })?.wasEditing ? 'Your booking has been updated and saved to our system.' : 'Your booking has been confirmed and saved to our system.'}</p>
                <div className="booking-popup-success-email">
                  <p>📧 Check your email for booking confirmation and details.</p>
                </div>
              </div>

              <div className="booking-popup-success-actions">
                <button
                  onClick={() => {
                    // Keep current form data and go back to booking for editing
                    setIsBookingSuccessful(false);
                    setBookingResult(null);
                    setIsEditingBooking(true);
                    setOriginalFormData({ ...formData }); // Store original data for comparison
                    setEditingBookingId(bookingResult?.bookingId || null); // Store booking ID for updating
                    setActiveTab('Overview');
                  }}
                  className="booking-popup-success-btn secondary"
                >
                  Edit Booking
                </button>
                <button
                  onClick={() => {
                    onClose();
                    // Open new booking popup
                    setTimeout(() => {
                      openBookingPopup();
                    }, 100);
                  }}
                  className="booking-popup-success-btn primary"
                >
                  New Booking
                </button>
                <button
                  onClick={() => {
                    // Reset all booking states and close popup completely
                    setIsBookingSuccessful(false);
                    setBookingResult(null);
                    resetForm();

                    // Close booking popup completely
                    onClose();

                    // Navigate to theater page
                    router.push('/theater');
                  }}
                  className="booking-popup-success-btn secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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


        {/* Time Selection Popup */}
        <TimeSelectionPopup
          isOpen={isTimeSelectionOpen}
          onClose={() => setIsTimeSelectionOpen(false)}
          selectedTime={selectedTimeSlot}
          onTimeSelected={(time) => {
            setSelectedTimeSlot(time);
            setIsTimeSelectionOpen(false);
          }}
          bookedSlots={bookedTimeSlots}
          selectedDate={selectedDate || undefined}
        />
        {/* Debug: Log booked slots when time popup opens */}
        {isTimeSelectionOpen && (() => {
          console.log('🕐 Time popup opened with booked slots:', bookedTimeSlots);
          return null;
        })()}

        {/* Date Selection Popup */}
        <GlobalDatePicker
          isOpen={isDatePickerOpen}
          onClose={closeDatePicker}
          onDateSelect={(date) => {
            setSelectedDate(date);
            closeDatePicker();
            // Refresh booked slots when date changes
            fetchBookedSlots();
          }}
          selectedDate={selectedDate || new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        />


        {/* Styles */}
        <style jsx global>{`
          body.popup-open {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
          }
        
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
            padding: 1.5rem !important;
            margin: 0 !important;
            overflow: hidden !important;
            overscroll-behavior: contain !important;
          }

          .booking-popup {
            width: 100% !important;
            max-width: 1200px !important;
            max-height: calc(100vh - 3rem) !important;
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
            margin: 0 !important;
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

          .booking-popup-title-section {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .booking-popup-time-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .booking-popup-time-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
          }

          .booking-popup-time-value {
            font-size: 0.75rem;
            color: #fff;
            font-weight: 600;
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

          .booking-popup-meta-item svg {
            width: 1rem;
            height: 1rem;
          }

          .booking-popup-time-selector-meta {
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            pointer-events: auto;
          }

          .booking-popup-time-selector-meta:hover {
            background: rgba(255, 0, 5, 0.3);
            border: 1px solid rgba(255, 0, 5, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 0, 5, 0.2);
          }

          .booking-popup-time-arrow-small {
            color: rgba(255, 255, 255, 0.8);
            transition: all 0.3s ease;
            margin-left: 0.5rem;
          }

          .booking-popup-time-selector-meta:hover .booking-popup-time-arrow-small {
            color: #ffffff;
            transform: translateY(1px) scale(1.1);
          }

          .booking-popup-date-selector-meta {
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            pointer-events: auto;
          }

          .booking-popup-date-selector-meta:hover {
            background: rgba(255, 0, 5, 0.3);
            border: 1px solid rgba(255, 0, 5, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 0, 5, 0.2);
          }

          .booking-popup-date-arrow-small {
            width: 0.75rem;
            height: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            transition: all 0.3s ease;
            margin-left: 0.5rem;
          }

          .booking-popup-date-selector-meta:hover .booking-popup-date-arrow-small {
            color: #ffffff;
            transform: translateY(1px) scale(1.1);
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
            display: block;
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
            grid-template-columns: 1fr 1fr 1fr 1fr;
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

          .booking-popup-number button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #374151;
            color: #9CA3AF;
            border-color: #4B5563;
          }

          .booking-popup-number button:disabled:hover {
            border-color: #4B5563;
            background-color: #374151;
          }

          .booking-popup-number span {
            font-size: 1.5rem;
            font-weight: 700;
            color: #FF0005;
            min-width: 2rem;
            text-align: center;
          }

          .booking-popup-capacity-warning {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #92400E;
            text-align: center;
          }

          .booking-popup-capacity-warning span {
            font-weight: 500;
            font-size: 0.875rem;
          }

          .booking-popup-decoration-items {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-decoration-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #FF0005;
            margin-bottom: 1rem;
            text-align: center;
          }

          .booking-popup-decoration-category {
            margin-bottom: 1.5rem;
          }

          .booking-popup-decoration-category:last-child {
            margin-bottom: 0;
          }

          .booking-popup-decoration-category-title {
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.75rem;
            text-align: center;
          }

          .booking-popup-decoration-items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .booking-popup-decoration-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
          }

          .booking-popup-decoration-item:hover {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.1);
            transform: translateY(-2px);
          }

          .booking-popup-decoration-item.selected {
            border-color: #FF0005;
            background: rgba(255, 0, 5, 0.2);
          }

          .booking-popup-decoration-item-image {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }

          .booking-popup-decoration-item-content h4 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.5rem;
          }

          .booking-popup-decoration-item-price {
            font-size: 0.875rem;
            font-weight: 600;
            color: #FF0005;
          }

          @media (max-width: 480px) {
            .booking-popup-decoration-items-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 0.75rem;
            }

            .booking-popup-decoration-item {
              padding: 0.75rem;
            }

            .booking-popup-decoration-item-image {
              font-size: 1.5rem;
            }

            .booking-popup-decoration-item-content h4 {
              font-size: 0.75rem;
            }

            .booking-popup-decoration-item-price {
              font-size: 0.75rem;
            }
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
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, 1fr);
            gap: 0.5rem;
          }

          .booking-popup-occasion {
            position: relative;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            overflow: hidden;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .booking-popup-selected-occasion {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            padding: 1rem;
          }

          .booking-popup-occasion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-occasion-selected {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .booking-popup-occasion-selected h4 {
            margin: 0;
            font-size: 1.1rem;
            color: #FF0005;
            font-weight: 600;
          }

          .booking-popup-change-occasion-btn {
            background: rgba(255, 0, 5, 0.1);
            border: 1px solid #FF0005;
            color: #FF0005;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .booking-popup-change-occasion-btn:hover {
            background: #FF0005;
            color: white;
          }

          .booking-popup-occasion-details {
            margin-top: 1rem;
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
            font-size: 0.5rem;
            font-weight: 600;
            padding: 0.2rem 0.4rem;
            border-radius: 1rem;
            text-transform: uppercase;
            z-index: 3;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .booking-popup-occasion-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 2;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .booking-popup-occasion-overlay h4 {
            color: #ffffff;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0;
            background: rgba(0, 0, 0, 0.8);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            text-align: center;
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

          .booking-popup-duration {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 0.5rem;
            font-weight: 500;
          }


          .booking-popup-action {
            padding: 1rem 1.5rem;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: center;
            position: sticky;
            bottom: 0;
            z-index: 100;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
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
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            color: #ffffff;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .booking-popup-select:focus {
            border-color: #FF0005;
            box-shadow: 0 0 0 3px rgba(255, 0, 5, 0.1);
          }

          .booking-popup-select option {
            background: #1a1a1a;
            color: white;
            padding: 0.5rem;
          }

          .booking-popup-select:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: rgba(255, 255, 255, 0.02);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .booking-popup-field-note {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: rgba(255, 0, 5, 0.1);
            border: 1px solid rgba(255, 0, 5, 0.3);
            border-radius: 0.375rem;
            font-size: 0.75rem;
            color: #FF0005;
            text-align: center;
          }

          .booking-popup-field-note span {
            font-weight: 500;
          }


          .booking-popup-movie-selection {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .booking-popup-movie-selection-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .booking-popup-movie-price-info {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .booking-popup-movie-price-text {
            font-size: 0.75rem;
            color: #FF0005;
            font-weight: 600;
            background: rgba(255, 0, 5, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            border: 1px solid rgba(255, 0, 5, 0.2);
          }

          .booking-popup-movie-change-text {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 400;
            margin-left: 0.5rem;
            font-style: italic;
          }

          .booking-popup-select-movies-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #FF0005 0%, #ff3366 100%);
            color: #ffffff;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            justify-content: center;
          }

          .booking-popup-select-movies-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 0, 5, 0.3);
          }

          .booking-popup-movie-count {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.5rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 700;
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

          /* Booking Overview Summary Styles */
          .booking-popup-overview-summary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-top: 1.5rem;
          }

          .booking-popup-overview-summary-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .booking-popup-overview-summary-title {
            font-size: 1rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .booking-popup-overview-summary-badge {
            background: linear-gradient(135deg, #FF0005, #CC0000);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .booking-popup-overview-summary-content {
            display: flex;
            flex-direction: column;
            gap: 0;
          }

          .booking-popup-overview-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0;
            border-bottom: none;
            flex-wrap: nowrap;
            min-height: auto;
            line-height: 1;
            height: 1.2rem;
            max-height: 1.2rem;
          }

          .booking-popup-overview-summary-item:last-child {
            border-bottom: none;
            padding-top: 0;
            border-top: none;
            margin-top: 0;
          }

          .booking-popup-overview-summary-item span:first-child {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 0.5rem;
            line-height: 1;
            height: 1.2rem;
            max-height: 1.2rem;
            display: flex;
            align-items: center;
          }

          .booking-popup-overview-summary-item span:last-child {
            color: #ffffff;
            font-weight: 600;
            font-size: 0.875rem;
            flex-shrink: 0;
            white-space: nowrap;
            line-height: 1;
            height: 1.2rem;
            max-height: 1.2rem;
            display: flex;
            align-items: center;
          }

          .booking-popup-overview-summary-item:last-child span:last-child {
            color: #FF0005;
            font-weight: 700;
            font-size: 1rem;
          }

          /* Booking Overview Summary Section Styles */
          .booking-popup-overview-summary-section {
            margin-bottom: 0;
          }

          .booking-popup-overview-summary-section-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #FF0005;
            margin: 0 0 0.25rem 0;
            text-transform: uppercase;
          }

          .booking-popup-overview-summary-divider {
            height: 0;
            background: transparent;
            margin: 0;
          }

          .booking-popup-overview-summary-totals {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 0.75rem;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 1rem;
            margin-bottom: 1rem;
          }

          .booking-popup-overview-summary-upper {
            margin-bottom: 0.5rem;
          }

          .booking-popup-overview-summary-lower {
            margin-top: 0.5rem;
          }

          .booking-popup-overview-summary-divider-line {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            margin: 0.5rem 0;
          }

        

          .booking-popup-overview-summary-total span {
            font-size: 1rem;
            font-weight: 700;
            color: #ffffff;
          }

          .booking-popup-overview-summary-advance span:last-child {
            color: #FF0005;
            font-weight: 700;
          }

          .booking-popup-overview-summary-balance span:last-child {
            color: #ffd700;
            font-weight: 700;
          }


          /* Terms & Conditions Styles */
          .booking-popup-terms-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 1rem;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .booking-popup-terms-section {
            margin-bottom: 2rem;
          }

          .booking-popup-terms-section:last-of-type {
            margin-bottom: 1rem;
          }

          .booking-popup-terms-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FF0005;
            margin: 0 0 1rem 0;
            font-family: 'Paralucent-Medium', sans-serif;
          }

          .booking-popup-terms-content {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 0.75rem;
            padding: 1.25rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }

          .booking-popup-terms-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .booking-popup-terms-list li {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
            position: relative;
            font-family: 'Paralucent-Medium', sans-serif;
          }

          .booking-popup-terms-list li:before {
            content: '•';
            color: #FF0005;
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
          }

          .booking-popup-terms-list li:last-child {
            margin-bottom: 0;
          }

          .booking-popup-terms-content p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            line-height: 1.6;
            margin: 0;
            font-family: 'Paralucent-Medium', sans-serif;
          }

          .booking-popup-agreement {
            background: rgba(255, 0, 5, 0.1);
            border-radius: 0.75rem;
            padding: 1.25rem;
            border: 1px solid rgba(255, 0, 5, 0.2);
            margin-top: 1.5rem;
          }

          .booking-popup-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            line-height: 1.5;
            font-family: 'Paralucent-Medium', sans-serif;
          }

          .booking-popup-checkbox {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 0.25rem;
            background: transparent;
            cursor: pointer;
            flex-shrink: 0;
            margin-top: 0.125rem;
            transition: all 0.3s ease;
          }

          .booking-popup-checkbox:checked {
            background: #FF0005;
            border-color: #FF0005;
            position: relative;
          }

          .booking-popup-checkbox:checked:after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 0.75rem;
            font-weight: bold;
          }

          .booking-popup-checkbox-text {
            flex: 1;
            font-weight: 500;
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
              padding: 0.5rem 0.8rem;
            }

            .booking-popup-field-row {
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
            }

            .booking-popup-title {
              font-size: 0.7rem;
            }

            .booking-popup-title-section {
              gap: 0.125rem;
            }

            .booking-popup-time-display {
              padding: 0.125rem 0.25rem;
              gap: 0.25rem;
            }

            .booking-popup-time-label,
            .booking-popup-time-value {
              font-size: 0.6rem;
            }

            .booking-popup-close-btn {
              padding: 0.3rem;
            }

            .booking-popup-close-btn svg {
              width: 1rem;
              height: 1rem;
            }

            .booking-popup-back-btn {
              padding: 0.3rem;
              font-size: 0.5rem;
            }

            .booking-popup-back-btn svg {
              width: 1rem;
              height: 1rem;
            }

            .booking-popup-back-text {
              display: none;
            }

            .booking-popup-logo {
              width: 1.5rem;
              height: 1.5rem;
            }

            .booking-popup-logo svg {
              width: 0.8rem;
              height: 0.8rem;
            }

            .booking-popup-hero {
              padding: 0.6rem 0.8rem;
            }

            .booking-popup-theater-title {
              font-size: 0.7rem;
              margin: 0 0 0.5rem 0;
            }

            .booking-popup-meta {
              flex-direction: row;
              gap: 0.2rem;
              flex-wrap: wrap;
              justify-content: center;
            }

            .booking-popup-meta-item {
              font-size: 0.55rem;
              padding: 0.2rem 0.4rem;
            }

            .booking-popup-meta-item svg {
              width: 0.6rem;
              height: 0.6rem;
            }

            .booking-popup-time-selector-meta {
              justify-content: center;
            }

            .booking-popup-date-selector-meta {
              justify-content: center;
            }

            .booking-popup-date-arrow-small {
              margin-left: 0.25rem;
            }

            .booking-popup-time-arrow-small {
              margin-left: 0.25rem;
            }

            .booking-popup-content {
              padding: 0.75rem 1rem;
              max-height: 70vh;
            }

            .booking-popup-tabs {
              gap: 0.1rem;
              padding: 0.1rem;
              margin-bottom: 1rem;
            }

            .booking-popup-tab {
              min-width: 60px;
              padding: 0.25rem 0.3rem;
              gap: 0.15rem;
            }

            .booking-popup-tab-number {
              width: 1rem;
              height: 1rem;
              font-size: 0.6rem;
            }

            .booking-popup-tab-text {
              font-size: 0.5rem;
            }

            .booking-popup-layout {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .booking-popup-cart {
              order: -1;
              max-height: 40vh;
            }

            .booking-popup-occasions {
              grid-template-columns: 1fr 1fr;
              grid-template-rows: repeat(3, 1fr);
              gap: 0.4rem;
            }

            .booking-popup-items {
              grid-template-columns: 1fr;
              gap: 0.4rem;
            }

            .booking-popup-occasion,
            .booking-popup-item {
              padding: 0.5rem;
            }

            .booking-popup-occasion h4 {
              font-size: 0.7rem;
            }

            .booking-popup-occasion-overlay {
              padding: 0.3rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .booking-popup-occasion-overlay h4 {
              font-size: 0.7rem;
              color: #ffffff;
              background: rgba(0, 0, 0, 0.9);
              padding: 0.3rem 0.8rem;
              border-radius: 0.3rem;
              text-align: center;
            }

            .booking-popup-selected-occasion {
              padding: 0.75rem;
            }

            .booking-popup-occasion-header {
              margin-bottom: 0.75rem;
              padding-bottom: 0.5rem;
            }

            .booking-popup-occasion-selected h4 {
              font-size: 0.9rem;
            }

            .booking-popup-change-occasion-btn {
              padding: 0.4rem 0.8rem;
              font-size: 0.7rem;
            }

            .booking-popup-item-image {
              padding: 0.75rem;
              font-size: 2rem;
            }

            .booking-popup-item-content {
              padding: 0.5rem;
            }

            .booking-popup-item-content h4 {
              font-size: 0.7rem;
            }

            .booking-popup-action {
              padding: 0.75rem 1rem;
              background: rgba(0, 0, 0, 0.95);
              backdrop-filter: blur(15px);
              box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.4);
            }

            .booking-popup-btn {
              padding: 0.5rem 0.8rem;
              font-size: 0.7rem;
            }

            .booking-popup-terms-container {
              padding: 0.8rem;
            }

            .booking-popup-terms-section {
              margin-bottom: 1rem;
            }

            .booking-popup-terms-title {
              font-size: 0.8rem;
            }

            .booking-popup-terms-content {
              padding: 0.6rem;
            }

            .booking-popup-terms-list li {
              font-size: 0.65rem;
              margin-bottom: 0.3rem;
            }

            .booking-popup-terms-content p {
              font-size: 0.65rem;
            }

            .booking-popup-agreement {
              padding: 0.6rem;
            }

            .booking-popup-checkbox-label {
              font-size: 0.65rem;
            }

            /* Booking Summary Mobile Styles */
            .booking-popup-overview-summary {
              padding: 0.6rem;
              margin-top: 1rem;
            }

            .booking-popup-overview-summary-content {
              gap: 0;
            }

            .booking-popup-overview-summary-section {
              margin-bottom: 0;
            }

            .booking-popup-overview-summary-section-title {
              margin: 0 0 0.15rem 0;
            }

            .booking-popup-overview-summary-divider {
              margin: 0;
            }

            .booking-popup-overview-summary-title {
              font-size: 0.7rem;
            }

            .booking-popup-overview-summary-badge {
              font-size: 0.6rem;
              padding: 0.2rem 0.4rem;
            }

            .booking-popup-overview-summary-item {
              padding: 0;
              line-height: 1;
              height: 1rem;
              max-height: 1rem;
            }

            .booking-popup-overview-summary-item span:first-child {
              font-size: 0.65rem;
              line-height: 1;
              height: 1rem;
              max-height: 1rem;
              display: flex;
              align-items: center;
            }

            .booking-popup-overview-summary-item span:last-child {
              font-size: 0.65rem;
              line-height: 1;
              height: 1rem;
              max-height: 1rem;
              display: flex;
              align-items: center;
            }

            .booking-popup-overview-summary-section-title {
              font-size: 0.65rem;
            }

            .booking-popup-overview-summary-item:last-child span:last-child {
              font-size: 0.7rem;
            }

            /* Booking Overview Form Mobile Styles */
            .booking-popup-section-title {
              font-size: 0.8rem;
            }

            .booking-popup-field label {
              font-size: 0.7rem;
            }

            .booking-popup-field input {
              font-size: 0.7rem;
              padding: 0.5rem 0.8rem;
            }

            .booking-popup-field input::placeholder {
              font-size: 0.65rem;
            }

            .booking-popup-select {
              font-size: 0.7rem;
              padding: 0.5rem 0.8rem;
            }

            .booking-popup-number span {
              font-size: 0.8rem;
            }

            .booking-popup-movie-price-text {
              font-size: 0.6rem;
            }

            .booking-popup-movie-change-text {
              font-size: 0.6rem;
            }

            .booking-popup-select-movies-btn {
              font-size: 0.7rem;
              padding: 0.5rem 0.8rem;
            }
          }

          @media (min-width: 481px) and (max-width: 768px) {
            .booking-popup {
              margin: 0.5rem !important;
              max-height: 95vh !important;
            }

            .booking-popup-layout {
              display: block;
            }

            .booking-popup-tabs {
              overflow-x: auto;
            }

            .booking-popup-field-row {
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
            }

            .booking-popup-tab {
              min-width: 80px;
              font-size: 0.65rem;
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

          /* Success Animation Styles */
          .booking-popup-success {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.5s ease-in-out;
          }

          .booking-popup-success-content {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
          }

          .booking-popup-success-animation {
            position: relative;
            margin-bottom: 2rem;
          }

          .booking-popup-success-checkmark {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto;
          }

          .booking-popup-success-checkmark-circle {
            position: relative;
            width: 80px;
            height: 80px;
            border: 4px solid #00ff00;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: scaleIn 0.4s ease-out;
            background: rgba(0, 255, 0, 0.1);
          }

          .booking-popup-success-checkmark-svg {
            color: #00ff00;
            width: 40px;
            height: 40px;
          }

          .booking-popup-success-checkmark-path {
            stroke-dasharray: 20;
            stroke-dashoffset: 20;
            animation: drawCheckmark 0.6s ease-out 0.4s forwards;
          }

          .booking-popup-success-title {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            animation: slideUp 0.5s ease-out 0.8s both;
          }

          .booking-popup-success-message {
            color: #cccccc;
            margin-bottom: 2rem;
            animation: slideUp 0.5s ease-out 1s both;
          }

          .booking-popup-success-message p {
            margin-bottom: 0.5rem;
          }

          .booking-popup-success-email {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
          }

          .booking-popup-success-email p {
            color: #00ff00;
            font-weight: 500;
          }

          .booking-popup-success-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            animation: slideUp 0.5s ease-out 1.2s both;
            flex-wrap: wrap;
          }

          .booking-popup-success-btn {
            padding: 0.75rem 1.25rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 100px;
            font-size: 0.9rem;
          }

          .booking-popup-success-btn.primary {
            background: #FF0005;
            color: #ffffff;
          }

          .booking-popup-success-btn.primary:hover {
            background: #e60004;
            transform: translateY(-2px);
          }

          .booking-popup-success-btn.secondary {
            background: transparent;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .booking-popup-success-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
          }

          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes drawCheckmark {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }

          @keyframes slideUp {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .booking-popup-success-content {
              padding: 1.5rem;
            }

            .booking-popup-success-title {
              font-size: 1.25rem;
            }

            .booking-popup-success-actions {
              flex-direction: column;
              gap: 0.75rem;
            }

            .booking-popup-success-btn {
              width: 100%;
            }
          }

          /* Validation Popup Styles */
          .booking-popup-validation {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
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
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
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
            border-radius: 0.5rem;
            padding: 0.75rem 2rem;
            font-weight: 600;
            cursor: pointer;
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

          /* Close Confirmation Popup Styles */
          .booking-popup-close-confirmation {
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

          .booking-popup-close-confirmation-content {
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

          .booking-popup-close-confirmation-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #f59e0b, #ef4444);
            border-radius: 16px 16px 0 0;
          }

          .booking-popup-close-confirmation-icon {
            color: #f59e0b;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: center;
            animation: bounce 0.6s ease;
          }

          .booking-popup-close-confirmation-icon svg {
            filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3));
          }

          .booking-popup-close-confirmation-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
          }

          .booking-popup-close-confirmation-message {
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.6;
            font-size: 1rem;
          }

          .booking-popup-close-confirmation-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .booking-popup-close-confirmation-btn {
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            font-size: 0.9rem;
          }

          .booking-popup-close-confirmation-btn.cancel {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .booking-popup-close-confirmation-btn.cancel:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .booking-popup-close-confirmation-btn.confirm {
            background: #ef4444;
            color: white;
            border: 1px solid #dc2626;
          }

          .booking-popup-close-confirmation-btn.confirm:hover {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
          }

          @media (max-width: 640px) {
            .booking-popup-close-confirmation-content {
              padding: 1.5rem;
              margin: 1rem;
            }

            .booking-popup-close-confirmation-title {
              font-size: 1.125rem;
            }

            .booking-popup-close-confirmation-message {
              font-size: 0.875rem;
            }

            .booking-popup-close-confirmation-btn {
              padding: 0.625rem 1.25rem;
              font-size: 0.875rem;
            }

            .booking-popup-close-confirmation-actions {
              flex-direction: column;
              gap: 0.5rem;
            }

            .booking-popup-close-confirmation-btn {
              width: 100%;
            }
          }

          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
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
      </div>

      {/* Close Confirmation Popup */}
      {showCloseConfirmation && (
        <div className="booking-popup-close-confirmation">
          <div className="booking-popup-close-confirmation-content">
            <div className="booking-popup-close-confirmation-icon">
              <X className="w-12 h-12" />
            </div>

            <h3 className="booking-popup-close-confirmation-title">
              Close Booking?
            </h3>

            <p className="booking-popup-close-confirmation-message">
              Are you sure you want to close? Your booking progress will be lost.
            </p>

            <div className="booking-popup-close-confirmation-actions">
              <button
                onClick={handleCancelClose}
                className="booking-popup-close-confirmation-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="booking-popup-close-confirmation-btn confirm"
              >
                Close Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movies Modal */}
      {(() => {
        console.log('🎬 Rendering MoviesModal with props:', {
          isOpen: isMoviesModalOpen,
          selectedMovies: formData.selectedMovies
        });
        return null;
      })()}
      <MoviesModal
        isOpen={isMoviesModalOpen}
        onClose={() => {
          console.log('🎬 Closing movies modal');
          setIsMoviesModalOpen(false);
        }}
        onMovieSelect={handleMovieSelect}
        selectedMovies={formData.selectedMovies}
      />
    </div>
  );

  // Use portal to render popup at the root level
  if (typeof window !== 'undefined') {
    return createPortal(popupContent, document.body);
  }

  return popupContent;
}