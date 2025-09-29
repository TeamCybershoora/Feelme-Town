'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TheaterData {
  id: number;
  name: string;
  image: string;
  capacity: string;
  capacityNumber: number;
  type: string;
  price: string;
  features: string[];
}

interface IncompleteBookingData {
  bookingId: string;
  name?: string;
  email: string;
  phone?: string;
  theaterName?: string;
  date?: string;
  time?: string;
  occasion?: string;
  numberOfPeople?: number;
  selectedCakes?: Array<{ id: string; name: string; price: number; quantity: number }>;
  selectedDecorItems?: Array<{ id: string; name: string; price: number; quantity: number }>;
  selectedGifts?: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalAmount?: number;
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface BookingContextType {
  isBookingPopupOpen: boolean;
  selectedTheater: TheaterData | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  incompleteBookingData: IncompleteBookingData | null;
  openBookingPopup: (theater?: TheaterData, date?: string, timeSlot?: string, incompleteData?: IncompleteBookingData) => void;
  closeBookingPopup: () => void;
  setIncompleteBookingData: (data: IncompleteBookingData | null) => void;
  setSelectedTimeSlot: (timeSlot: string | null) => void;
  setSelectedTheater: (theater: TheaterData | null) => void;
  // Cancel booking popup
  isCancelBookingPopupOpen: boolean;
  cancelBookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null;
  openCancelBookingPopup: (bookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null) => void;
  closeCancelBookingPopup: () => void;
  // Real-time slot updates
  refreshBookedSlots: () => void;
  // Popup control
  isPopupClosed: boolean;
  resetPopupState: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState<TheaterData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [incompleteBookingData, setIncompleteBookingData] = useState<IncompleteBookingData | null>(null);
  
  // Cancel booking popup state
  const [isCancelBookingPopupOpen, setIsCancelBookingPopupOpen] = useState(false);
  const [cancelBookingData, setCancelBookingData] = useState<{ id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null>(null);
  
  // Popup control state
  const [isPopupClosed, setIsPopupClosed] = useState(false);

  const openBookingPopup = (theater?: TheaterData, date?: string, timeSlot?: string, incompleteData?: IncompleteBookingData) => {
    console.log('🎯 openBookingPopup called with:', { theater: theater?.name, date, timeSlot, isPopupClosed, isBookingPopupOpen });
    
    // Don't open if popup was manually closed
    if (isPopupClosed) {
      console.log('🚫 Popup was manually closed, not opening');
      return;
    }
    
    // Don't open if popup is already open
    if (isBookingPopupOpen) {
      console.log('🚫 Popup is already open, not opening');
      return;
    }
    
    console.log('✅ Opening booking popup...');
    
    if (theater) {
      setSelectedTheater(theater);
    }
    if (date) {
      setSelectedDate(date);
    }
    if (timeSlot) {
      setSelectedTimeSlot(timeSlot);
    }
    if (incompleteData) {
      setIncompleteBookingData(incompleteData);
    }
    setIsBookingPopupOpen(true);
    
    console.log('✅ Booking popup state set to true');
  };

  const closeBookingPopup = () => {
    setIsBookingPopupOpen(false);
    setSelectedTheater(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setIncompleteBookingData(null);
    // Mark popup as manually closed
    setIsPopupClosed(true);
    
    // Dispatch event to reset booking button state
    window.dispatchEvent(new CustomEvent('bookingPopupClosed'));
  };

  const openCancelBookingPopup = (bookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null) => {
    setCancelBookingData(bookingData);
    setIsCancelBookingPopupOpen(true);
  };

  const closeCancelBookingPopup = () => {
    setIsCancelBookingPopupOpen(false);
    setCancelBookingData(null);
  };

  const refreshBookedSlots = () => {
    // Dispatch a custom event to notify components to refresh their booked slots
    window.dispatchEvent(new CustomEvent('refreshBookedSlots'));
  };

  const resetPopupState = () => {
    setIsPopupClosed(false);
  };

  return (
    <BookingContext.Provider value={{
      isBookingPopupOpen,
      selectedTheater,
      selectedDate,
      selectedTimeSlot,
      incompleteBookingData,
      openBookingPopup,
      closeBookingPopup,
      setIncompleteBookingData,
      setSelectedTimeSlot,
      setSelectedTheater,
      isCancelBookingPopupOpen,
      cancelBookingData,
      openCancelBookingPopup,
      closeCancelBookingPopup,
      refreshBookedSlots,
      isPopupClosed,
      resetPopupState
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
