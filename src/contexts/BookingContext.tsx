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

interface BookingContextType {
  isBookingPopupOpen: boolean;
  selectedTheater: TheaterData | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  openBookingPopup: (theater?: TheaterData, date?: string, timeSlot?: string) => void;
  closeBookingPopup: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState<TheaterData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const openBookingPopup = (theater?: TheaterData, date?: string, timeSlot?: string) => {
    if (theater) {
      setSelectedTheater(theater);
    }
    if (date) {
      setSelectedDate(date);
    }
    if (timeSlot) {
      setSelectedTimeSlot(timeSlot);
    }
    setIsBookingPopupOpen(true);
  };

  const closeBookingPopup = () => {
    setIsBookingPopupOpen(false);
    setSelectedTheater(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  return (
    <BookingContext.Provider value={{
      isBookingPopupOpen,
      selectedTheater,
      selectedDate,
      selectedTimeSlot,
      openBookingPopup,
      closeBookingPopup
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
