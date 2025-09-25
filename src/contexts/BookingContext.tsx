'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TheaterData {
  id: number;
  name: string;
  image: string;
  description: string;
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
  // Cancel booking popup
  isCancelBookingPopupOpen: boolean;
  cancelBookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null;
  openCancelBookingPopup: (bookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null) => void;
  closeCancelBookingPopup: () => void;
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

  const openBookingPopup = (theater?: TheaterData, date?: string, timeSlot?: string, incompleteData?: IncompleteBookingData) => {
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
  };

  const closeBookingPopup = () => {
    setIsBookingPopupOpen(false);
    setSelectedTheater(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setIncompleteBookingData(null);
  };

  const openCancelBookingPopup = (bookingData: { id: string; name: string; email: string; phone: string; theaterName: string; date: string; time: string; occasion: string; numberOfPeople: number; totalAmount: number; createdAt: string; } | null) => {
    setCancelBookingData(bookingData);
    setIsCancelBookingPopupOpen(true);
  };

  const closeCancelBookingPopup = () => {
    setIsCancelBookingPopupOpen(false);
    setCancelBookingData(null);
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
      isCancelBookingPopupOpen,
      cancelBookingData,
      openCancelBookingPopup,
      closeCancelBookingPopup
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
