'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDatePicker } from '@/contexts/DatePickerContext';
import { useBooking } from '@/contexts/BookingContext';

export default function Theater() {
    const { openBookingPopup, setIncompleteBookingData, openCancelBookingPopup } = useBooking();
    const searchParams = useSearchParams();
    const [selectedTheater, setSelectedTheater] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [memberCount, setMemberCount] = useState(1);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const theaterDetailsRef = useRef<HTMLDivElement>(null);
    const [isFetchingIncompleteBooking, setIsFetchingIncompleteBooking] = useState(false);
    const [fetchedBookingIds, setFetchedBookingIds] = useState<Set<string>>(new Set());
    const [fetchedCancelBookingIds, setFetchedCancelBookingIds] = useState<Set<string>>(new Set());
    
    // Use global date picker
    const { selectedDate, openDatePicker, setSelectedDate } = useDatePicker();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const fetchIncompleteBooking = useCallback(async (bookingId: string, email: string) => {
        // Prevent multiple simultaneous fetches for the same booking
        if (isFetchingIncompleteBooking || fetchedBookingIds.has(bookingId)) {
            console.log('⏸️ Fetch already in progress or already fetched for booking:', bookingId);
            return;
        }
        
        setIsFetchingIncompleteBooking(true);
        setFetchedBookingIds(prev => new Set(prev).add(bookingId));
        
        const maxRetries = 3;
        let lastError: Error | null = null;
        
        try {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📞 Fetching incomplete booking data (attempt ${attempt}/${maxRetries}):`, { bookingId, email });
                
                // Get all incomplete bookings with retry mechanism
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const response = await fetch(`${baseUrl}/api/incomplete-booking`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                console.log('📋 API Response:', result);
                
                if (result.success) {
                    console.log('📝 Available incomplete bookings:', result.incompleteBookings);
                    
                    // Find the specific incomplete booking
                    const incompleteBooking = result.incompleteBookings.find((booking: { bookingId: string; email: string }) => 
                        booking.bookingId === bookingId && booking.email === email
                    );
                    
                    if (incompleteBooking) {
                        console.log('✅ Found incomplete booking:', incompleteBooking);
                        
                        // Set incomplete booking data in context
                        setIncompleteBookingData(incompleteBooking);
                        
                        // Pre-fill the form data
                        preFillBookingData(incompleteBooking);
                        
                        // Open booking popup automatically with incomplete data
                        setTimeout(() => {
                            console.log('🎯 Opening booking popup with incomplete data...');
                            openBookingPopup(undefined, undefined, undefined, incompleteBooking);
                        }, 1000);
                        
                        return; // Success, exit retry loop
                    } else {
                        console.log('❌ Incomplete booking not found or expired');
                        console.log('🔍 Searched for:', { bookingId, email });
                        console.log('📋 Available bookings:', result.incompleteBookings.map((b: { bookingId: string; email: string }) => ({ 
                            id: b.bookingId, 
                            email: b.email 
                        })));
                        return; // Not found, but no need to retry
                    }
                } else {
                    console.log('❌ API request failed:', result.error);
                    return; // API error, no need to retry
                }
                
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
                
                if (attempt < maxRetries) {
                    console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            }
        }
        
            // All retries failed
            console.error('❌ All retry attempts failed for incomplete booking fetch');
            if (lastError) {
                if (lastError.message.includes('Failed to fetch')) {
                    console.log('🌐 Network error - server might be down or unreachable');
                } else if (lastError.message.includes('HTTP error')) {
                    console.log('🔧 Server error - API endpoint issue');
                } else {
                    console.log('⚠️ Unexpected error:', lastError.message);
                }
            }
        } finally {
            // Always cleanup loading state
            setIsFetchingIncompleteBooking(false);
        }
    }, [setIncompleteBookingData, openBookingPopup, isFetchingIncompleteBooking, fetchedBookingIds]);

    // Handle incomplete booking from email link
    useEffect(() => {
        const bookingId = searchParams.get('bookingId');
        const email = searchParams.get('email');
        const newBooking = searchParams.get('newBooking');
        const cancelBookingId = searchParams.get('cancelBookingId');
        const reopenBooking = searchParams.get('reopenBooking');
        
        console.log('🔍 URL Parameters check:', { 
            bookingId, 
            email, 
            newBooking,
            cancelBookingId,
            reopenBooking,
            currentUrl: typeof window !== 'undefined' ? window.location.href : 'server-side',
            allParams: Object.fromEntries(searchParams.entries()),
            isFetching: isFetchingIncompleteBooking,
            alreadyFetched: fetchedBookingIds.has(bookingId || '')
        });
        
        if (reopenBooking === 'true') {
            console.log('🎬 Reopening booking popup after movie selection');
            // Get selected movie from sessionStorage (don't clear it yet)
            const selectedMovie = sessionStorage.getItem('selectedMovie');
            if (selectedMovie) {
                console.log('🎬 Selected movie found:', selectedMovie);
                // Don't clear sessionStorage here - let the booking popup handle it
            }
            
            // Open booking popup with the selected theater, date, and time
            setTimeout(() => {
                openBookingPopup(theaters[selectedTheater], selectedDate, selectedTimeSlot);
            }, 500);
        } else if (bookingId && email && !isFetchingIncompleteBooking && !fetchedBookingIds.has(bookingId)) {
            console.log('🔗 Incomplete booking link detected:', { bookingId, email });
            // Add small delay to ensure page is fully loaded
            setTimeout(() => {
                fetchIncompleteBooking(bookingId, email);
            }, 100);
        } else if (newBooking === 'true') {
            console.log('🆕 Fresh booking request detected - opening booking popup');
            // Open fresh booking popup without any pre-filled data
            setTimeout(() => {
                openBookingPopup();
            }, 500);
        } else if (cancelBookingId && email && !fetchedCancelBookingIds.has(cancelBookingId)) {
            console.log('❌ Cancel booking link detected:', { cancelBookingId, email });
            // Mark as fetched to prevent duplicate requests
            setFetchedCancelBookingIds(prev => new Set(prev).add(cancelBookingId));
            // Fetch booking data and open cancel popup
            setTimeout(async () => {
                try {
                    console.log('📞 Fetching cancel booking data:', { bookingId: cancelBookingId, email });
                    
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                    const response = await fetch(`${baseUrl}/api/booking/${cancelBookingId}?email=${encodeURIComponent(email)}`);
                    const result = await response.json();

                    if (result.success && result.booking) {
                        console.log('✅ Cancel booking data fetched successfully:', result.booking);
                        // Open cancel booking popup with the fetched data
                        openCancelBookingPopup(result.booking);
                    } else {
                        console.log('ℹ️ Booking not found - may have been already cancelled:', result.error);
                        // Open cancel booking popup with null data to show "booking not found" message
                        openCancelBookingPopup(null);
                    }
                } catch (error) {
                    console.error('❌ Error fetching cancel booking data:', error);
                    // Open cancel booking popup with null data to show "booking not found" message
                    openCancelBookingPopup(null);
                }
            }, 100);
        } else if (cancelBookingId && email) {
            console.log('⏸️ Skipping cancel booking fetch - already processed for booking:', cancelBookingId);
        } else if (bookingId && email) {
            console.log('⏸️ Skipping fetch - already in progress or completed for booking:', bookingId);
        } else {
            console.log('❌ No special parameters detected');
        }
    }, [searchParams, fetchIncompleteBooking, openBookingPopup, openCancelBookingPopup, isFetchingIncompleteBooking, fetchedBookingIds, fetchedCancelBookingIds, selectedTheater, selectedDate, selectedTimeSlot]);

    const handleTheaterSelection = (index: number) => {
        setSelectedTheater(index);
        
        // Auto-scroll to theater details section
        setTimeout(() => {
            if (theaterDetailsRef.current) {
                theaterDetailsRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    };


    
    const theaters = useMemo(() => [
        {
            id: 1,
            name: "EROS (Couples ) (FMT-Hall-1)",
            image: "/images/theater1.webp",
            description: "Luxury private theater with anniversary celebration setup, featuring premium seating and state-of-the-art projection system.",
            capacity: "For 2 or Less People",
            capacityNumber: 2,
            type: "couples",
            price: "₹ 1399.00",
            features: [
                "Conferrable & Luxurious Recliners",
                "Experience 152 inch Full HD Screen",
                "Experience 5.1 Surround Sound System",
                "Add cakes and gifts in next step",
                "Food can be ordered at theater",
                "₹ 750 Additional for Decoration",
                "Free cancellation up to 72 hrs before slot"
            ]
        },
        {
            id: 2,
            name: "PHILIA (FRIENDS) (FMT-Hall-2)", 
            image: "/images/theater2.webp",
            description: "Elegant private cinema with neon decorations and romantic ambiance, perfect for special celebrations and intimate gatherings.",
            capacity: "For 4 or Less People",
            capacityNumber: 4,
            type: "friends",
            price: "₹ 1899.00",
            features: [
                "Comfortable & Luxurious Recliners",
                "Experience 152 inch Full HD Screen",
                "Experience 5.1 Surround Sound System",
                "Add cakes and gifts in next step",
                "Food can be ordered at theater",
                "₹ 750 Additional for Decoration",
                "Free cancellation up to 72 hrs before slot"
            ]
        },
        {
            id: 3,
            name: "PRAGMA (LOVE) (FMT-Hall-3)",
            image: "/images/theater3.webp", 
            description: "Modern private theater experience with contemporary design and cutting-edge technology for the ultimate entertainment.",
            capacity: "For 4 or Less People, Expandable upto 8 People",
            capacityNumber: 8,
            type: "love",
            price: "₹ 2299.00",
            features: [
                "Comfortable & Luxurious Recliners",
                "Experience 152 inch Full HD Screen",
                "Experience 5.1 Surround Sound System",
                "Add cakes and gifts in next step",
                "Food can be ordered at theater",
                "₹ 750 Additional for Decoration",
                "Free cancellation up to 72 hrs before slot"
            ]
        },
        {
            id: 4,
            name: "STORGE (FAMILY) (FMT-Hall-4)",
            image: "/images/theater4.webp",
            description: "Sophisticated private cinema setup with elegant furnishings and professional-grade equipment for corporate events.",
            capacity: "For 4 or Less People, Expandable upto 12 People",
            capacityNumber: 12,
            type: "family",
            price: "₹ 2799.00",
            features: [
                "Comfortable & Luxurious Recliners",
                "Experience 152 inch Full HD Screen",
                "Experience 5.1 Surround Sound System",
                "Add cakes and gifts in next step",
                "Food can be ordered at theater",
                "₹ 750 Additional for Decoration",
                "Free cancellation up to 72 hrs before slot"
            ]
        }
    ], []);

    const preFillBookingData = useCallback((bookingData: { date?: string; numberOfPeople?: number; time?: string; theaterName?: string }) => {
        // Set date if available
        if (bookingData.date) {
            setSelectedDate(bookingData.date);
        }
        
        // Set member count if available
        if (bookingData.numberOfPeople) {
            setMemberCount(bookingData.numberOfPeople);
        }
        
        // Set time slot if available
        if (bookingData.time) {
            setSelectedTimeSlot(bookingData.time);
        }
        
        // Set theater if available
        if (bookingData.theaterName) {
            const theaterIndex = theaters.findIndex(theater => 
                theater.name === bookingData.theaterName
            );
            if (theaterIndex !== -1) {
                setSelectedTheater(theaterIndex);
            }
        }
        
        console.log('📝 Pre-filled booking data:', {
            date: bookingData.date,
            memberCount: bookingData.numberOfPeople,
            timeSlot: bookingData.time,
            theaterName: bookingData.theaterName
        });
    }, [setSelectedDate, setMemberCount, setSelectedTimeSlot, setSelectedTheater, theaters]);

    // Filter theaters based on search term, type, and member count
    const filteredTheaters = theaters.filter(theater => {
        const matchesSearch = theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            theater.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || theater.type === filterType;
        
        const matchesMemberCount = theater.capacityNumber >= memberCount;
        
        return matchesSearch && matchesType && matchesMemberCount;
    });

    return (
        <div className="theater-page">
            {/* Hero Section */}
            <section className="theater-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Our <span className="highlight">Premium Theaters</span>
                        </h1>
                        <p className="hero-subtitle">
                            Experience luxury and comfort in our state-of-the-art private theaters
                        </p>
                        <div className="divider"></div>
                    </div>
                </div>
            </section>

            {/* Date and Day Section */}
            <section className="date-section">
                <div className="container">
                    <div className="date-card">
                        <div className="date-info">
                            <div className="current-date">
                                <span className="date-label">Today&apos;s Date:</span>
                                <span className="date-value">{currentTime.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</span>
                            </div>
                            <div className="current-time">
                                <span className="time-label">Current Time:</span>
                                <span className="time-value animated-time">{currentTime.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true 
                                })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <section className="filter-section">
                <div className="container">
                    <div className="filter-container">
                        <div className="search-box">
                            <div className="search-input-wrapper">
                                <svg 
                                    className="search-icon" 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                >
                                    <path 
                                        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search theaters..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        
                        <div className="filter-dropdowns">
                            <div className="dropdown-group">
                                <label className="dropdown-label">Theater Type:</label>
                                <select 
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        setIsTypeDropdownOpen(false);
                                    }}
                                    onMouseDown={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                    className={`filter-dropdown ${isTypeDropdownOpen ? 'open' : ''}`}
                                >
                                    <option value="all">All Theaters</option>
                                    <option value="couples">Couples</option>
                                    <option value="friends">Friends</option>
                                    <option value="love">Love</option>
                                    <option value="family">Family</option>
                                </select>
                            </div>
                            
                            <div className="dropdown-group">
                                <label className="dropdown-label">Members:</label>
                                <select 
                                    value={memberCount}
                                    onChange={(e) => {
                                        setMemberCount(parseInt(e.target.value));
                                        setIsMemberDropdownOpen(false);
                                    }}
                                    onMouseDown={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                                    className={`filter-dropdown ${isMemberDropdownOpen ? 'open' : ''}`}
                                >
                                    <option value={1}>1 Member</option>
                                    <option value={2}>2 Members</option>
                                    <option value={3}>3 Members</option>
                                    <option value={4}>4 Members</option>
                                    <option value={5}>5 Members</option>
                                    <option value={6}>6 Members</option>
                                    <option value={7}>7 Members</option>
                                    <option value={8}>8 Members</option>
                                    <option value={9}>9 Members</option>
                                    <option value={10}>10 Members</option>
                                    <option value={11}>11 Members</option>
                                    <option value={12}>12 Members</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Theater Grid Section */}
            <section className="theater-grid-section">
                <div className="container">
                    <div className="theater-grid">
                        {filteredTheaters.map((theater, index) => (
                            <div 
                                key={theater.id}
                                className={`theater-card ${selectedTheater === index ? 'active' : ''}`}
                                onClick={() => handleTheaterSelection(index)}
                            >
                                {selectedTheater === index && (
                                    <div className="selected-tag">
                                        <span>Selected</span>
                                    </div>
                                )}
                                <div className="theater-image-container">
                                    <div className="theater-glow"></div>
                                    <Image
                                        src={theater.image}
                                        alt={theater.name}
                                        width={400}
                                        height={300}
                                        className="theater-image"
                                    />
                                    <div className="theater-overlay">
                                        <div className="theater-info">
                                            <h3 className="theater-name">{theater.name}</h3>
                                            <p className="theater-capacity">{theater.capacity}</p>
                                        </div>
                                        <div className="theater-instructions">
                                            <p className="select-text">Select Your Theater</p>
                                            <p className="scroll-text">Scroll Down to Next</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Selected Theater Details */}
            <section className="theater-details-section" ref={theaterDetailsRef}>
                <div className="container">
                    <div className="theater-details">
                        {/* Left Panel - Theater Information */}
                        <div className="theater-info-panel">
                            <div className="theater-info-content">
                                <h2 className="detail-title">{filteredTheaters[selectedTheater]?.name || theaters[0].name}</h2>
                                <div className="detail-price">
                                    <span className="price-amount">{filteredTheaters[selectedTheater]?.price || theaters[0].price}</span>
                                </div>
                                <div className="detail-specs">
                                    <span className="spec-label">Capacity:</span>
                                    <span className="spec-value">{filteredTheaters[selectedTheater]?.capacity || theaters[0].capacity}</span>
                                </div>

                                <div className="booking-features">
                                    <h3 className="features-title">What&apos;s Included</h3>
                                    <div className="features-list">
                                        {(filteredTheaters[selectedTheater]?.features || theaters[0].features).map((feature, index) => (
                                            <div key={index} className="feature-item">
                                                <div className="feature-checkmark">✓</div>
                                                <span className="feature-text">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Theater Image and Booking Controls */}
                        <div className="theater-booking-panel">
                            <div className="theater-detail-image">
                                <div className="detail-glow"></div>
                                <Image
                                    src={filteredTheaters[selectedTheater]?.image || theaters[0].image}
                                    alt={filteredTheaters[selectedTheater]?.name || theaters[0].name}
                                    width={600}
                                    height={400}
                                    className="detail-image"
                                />
                            </div>
                            
                            <div className="booking-controls">
                                <div className="date-selection">
                                    <label className="booking-label">Select Date</label>
                                    <button 
                                        className="date-button"
                                        onClick={openDatePicker}
                                    >
                                        <span className="calendar-icon">📅</span>
                                        {selectedDate}
                                    </button>
                                </div>
                                
                                <div className="time-slots">
                                    <label className="booking-label">Available Time Slots</label>
                                    <div className="time-slots-grid">
                                        <button 
                                            className={`time-slot ${selectedTimeSlot === '9:00 am - 12:00 pm' ? 'selected' : ''}`}
                                            onClick={() => setSelectedTimeSlot('9:00 am - 12:00 pm')}
                                        >
                                            9:00 am - 12:00 pm
                                        </button>
                                        <button 
                                            className={`time-slot ${selectedTimeSlot === '12:30 PM - 03:30 PM' ? 'selected' : ''}`}
                                            onClick={() => setSelectedTimeSlot('12:30 PM - 03:30 PM')}
                                        >
                                            12:30 PM - 03:30 PM
                                        </button>
                                        <button 
                                            className={`time-slot ${selectedTimeSlot === '04:00 PM - 07:00 PM' ? 'selected' : ''}`}
                                            onClick={() => setSelectedTimeSlot('04:00 PM - 07:00 PM')}
                                        >
                                            04:00 PM - 07:00 PM
                                        </button>
                                        <button 
                                            className={`time-slot ${selectedTimeSlot === '07:30 PM - 10:30 PM' ? 'selected' : ''}`}
                                            onClick={() => setSelectedTimeSlot('07:30 PM - 10:30 PM')}
                                        >
                                            07:30 PM - 10:30 PM
                                        </button>
                                    </div>
                                </div>
                                
                                <button className="book-button" onClick={() => openBookingPopup(theaters[selectedTheater], selectedDate, selectedTimeSlot)}>
                                    Book This Theater
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="theater-features-section">
                <div className="container">
                    <div className="features-header">
                        <h2 className="features-title">Why Choose Our Theaters?</h2>
                        <p className="features-subtitle">Premium amenities and services for the ultimate entertainment experience</p>
                    </div>
                    <div className="features-grid-main">
                        <div className="feature-card">
                            <div className="feature-icon-large">
                                <svg xmlns="http://www.w3.org/2000/svg" width="44" height="33" viewBox="0 0 444 334" fill="none">
                                    <path d="M388.5 0.5C403.22 0.5 417.336 6.34759 427.744 16.7559C438.152 27.1641 444 41.2805 444 56V278C444 292.72 438.152 306.836 427.744 317.244C417.336 327.652 403.22 333.5 388.5 333.5H55.5C40.7805 333.5 26.6641 327.652 16.2559 317.244C5.84759 306.836 0 292.72 0 278V56C0 41.2805 5.84759 27.1641 16.2559 16.7559C26.6641 6.34759 40.7805 0.5 55.5 0.5H388.5ZM133.395 83.7773L121.323 103.591C103.369 133.006 85.3035 162.56 69.375 192.446V219.392H149.988V250.25H180.847V219.392H201.188V192.835H180.847V83.7773H133.395ZM238.372 83.7773V250.25H271.34V196.859L288.405 177.434L334.998 250.25H374.625L312.687 155.483L372.072 83.7773H335.83L272.894 158.314H271.312V83.7773H238.372ZM149.988 108.67V192.808H99.2617V191.975C114.563 163.62 130.91 135.814 148.269 108.67H149.988Z" fill="white"/>
                                </svg>
                            </div>
                            <h3 className="feature-title">4K Projection</h3>
                            <p className="feature-description">Crystal clear 4K resolution for the ultimate viewing experience</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-large">
                                <svg xmlns="http://www.w3.org/2000/svg" width="55" height="36" viewBox="0 0 550 360" fill="none" className="sound-bars-svg">
                                    <path d="M529.04 156.13H549.922V203.87H529.04V156.13Z" fill="white" className="sound-bar" style={{animationDelay: '0s'}}/>
                                    <path d="M487.89 217.848H508.772V142.152H487.89V217.848Z" fill="white" className="sound-bar" style={{animationDelay: '0.1s'}}/>
                                    <path d="M447.431 257.002H468.313V102.998H447.431V257.002Z" fill="white" className="sound-bar" style={{animationDelay: '0.2s'}}/>
                                    <path d="M408.969 287.215H429.852V74.1946H408.969V287.163V287.215Z" fill="white" className="sound-bar" style={{animationDelay: '0.3s'}}/>
                                    <path d="M367.793 235.194H388.675V124.807H367.793V235.194Z" fill="white" className="sound-bar" style={{animationDelay: '0.4s'}}/>
                                    <path d="M325.965 318.721H346.847V36.5554H325.899V318.721H325.965Z" fill="white" className="sound-bar" style={{animationDelay: '0.5s'}}/>
                                    <path d="M284.802 359.177H305.684V0.822754H284.802V359.177Z" fill="white" className="sound-bar" style={{animationDelay: '0.6s'}}/>
                                    <path d="M244.343 303.854H265.225V56.1454H244.343V303.855V303.854Z" fill="white" className="sound-bar" style={{animationDelay: '0.7s'}}/>
                                    <path d="M202.488 233.509H223.37V129.099H202.488V233.509Z" fill="white" className="sound-bar" style={{animationDelay: '0.8s'}}/>
                                    <path d="M162.03 208.619H182.912V151.289H162.03V208.714V208.619Z" fill="white" className="sound-bar" style={{animationDelay: '0.9s'}}/>
                                    <path d="M121.571 239.291H142.453V120.668H121.571V239.329V239.291Z" fill="white" className="sound-bar" style={{animationDelay: '1.0s'}}/>
                                    <path d="M81.7646 296.714H102.647V56.498H81.7658V296.756L81.7646 296.714Z" fill="white" className="sound-bar" style={{animationDelay: '1.1s'}}/>
                                    <path d="M41.3068 260.016H62.1889V97.9216H41.3068V260.056V260.016Z" fill="white" className="sound-bar" style={{animationDelay: '1.2s'}}/>
                                    <path d="M0.078125 217.848H20.9602V142.152H0.078125V217.848Z" fill="white" className="sound-bar" style={{animationDelay: '1.3s'}}/>
                                </svg>
                            </div>
                            <h3 className="feature-title">Premium Audio</h3>
                            <p className="feature-description">Surround sound system with professional-grade speakers</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-large">
                                <svg xmlns="http://www.w3.org/2000/svg" width="33" height="37" viewBox="0 0 325 368" fill="none">
                                    <path d="M6.57998 270.992C15.655 253.428 34.8133 241.658 57.9866 244.573C82.4899 247.565 106.794 252.009 130.77 257.883C167.62 267.087 199.905 284.778 223.775 300.93L231.842 306.54L239.175 311.948L245.738 317.008L251.495 321.665L256.39 325.808L260.423 329.328C275.878 343.097 265.373 365.592 247.865 367.242L245.812 367.333H88.255C57.4183 367.333 31.7883 351.842 13.015 328.357C-1.17501 310.628 -2.38501 288.335 6.59832 270.992H6.57998ZM291.333 0.666748C307.705 0.666748 314.763 16.0667 318.228 30.1834L319.328 35.0967L319.768 37.4434C322.408 52.0551 323.82 71.2134 324.388 90.9034C325.488 129.862 323.252 175.273 318.393 197.145C309.923 235.315 297.493 261.843 282.607 277.83C267.463 294.147 247.003 301.498 228.138 292.057C213.673 284.833 205.038 267.655 200.308 253.007C193.4 231.657 193.509 208.656 200.62 187.373C204.47 175.787 211.4 166.437 219.027 157.545L225.682 150.01C233.785 140.935 241.907 131.86 247.443 120.805C255.51 104.672 257.71 87.0167 258.388 69.2884L258.645 58.6551L258.81 48.3884L258.92 45.8584L259.287 40.7251C261.028 20.9617 267.793 0.666748 291.333 0.666748Z" fill="white"/>
                                </svg>
                            </div>
                            <h3 className="feature-title">Luxury Seating</h3>
                            <p className="feature-description">Comfortable reclining seats with premium materials</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-large">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="30" viewBox="0 0 224 300" fill="none">
                                    <path d="M93.2355 15.6749C86.6271 18.0318 81.2048 22.8833 78.1305 29.1899L77.0075 29.1601C71.8471 29.1547 66.7883 30.5948 62.4044 33.3172C58.0205 36.0395 54.4867 39.9354 52.2035 44.5632C46.1122 46.6706 40.9534 50.8487 37.6265 56.3693C34.2996 61.8899 33.0155 68.403 33.998 74.7732C32.1165 76.774 30.5596 79.0199 29.3274 81.5109C24.2861 83.2397 19.8551 86.3948 16.5722 90.5932C13.2894 94.7916 11.2959 99.8527 10.8337 105.162C7.04578 108.504 4.15934 112.744 2.44011 117.494C0.720891 122.244 0.224139 127.349 0.995585 132.341L1.00552 132.371L24.1599 278.959C25.0734 284.622 27.973 289.775 32.3394 293.495C36.7058 297.215 42.2538 299.259 47.99 299.261H176.184C188.009 299.261 198.146 290.665 200.014 278.959L223.168 132.421V132.391C223.803 128.512 223.665 124.545 222.761 120.72C221.857 116.895 220.205 113.286 217.901 110.101C217.981 109.253 218.021 108.408 218.021 107.567C218.029 101.83 216.241 96.2352 212.908 91.5659C209.576 86.8967 204.865 83.3876 199.438 81.5307C198.224 79.0596 196.65 76.7822 194.767 74.7732C194.966 73.4085 195.068 72.0172 195.075 70.5995C195.082 64.8617 193.293 59.2656 189.959 54.5962C186.624 49.9268 181.911 46.4184 176.482 44.5632C174.565 40.6555 171.749 37.258 168.265 34.6495C164.781 32.0411 160.727 30.296 156.438 29.5576C154.92 26.3598 152.785 23.4939 150.155 21.1249C147.525 18.7559 144.453 16.9307 141.114 15.7544C138.897 11.3068 135.486 7.56422 131.262 4.94555C127.038 2.32688 122.169 0.935535 117.199 0.927283C112.23 0.919031 107.356 2.2942 103.124 4.89883C98.8913 7.50346 95.4675 11.2347 93.2355 15.6749ZM193.574 107.567C188.427 107.567 183.726 109.495 180.159 112.685C177.722 108.135 174.097 104.332 169.669 101.681C165.242 99.0297 160.178 97.6295 155.017 97.6295C149.688 97.6274 144.466 99.1237 139.946 101.947C135.427 104.771 131.792 108.809 129.458 113.599C127.182 111.221 124.447 109.328 121.419 108.037C118.391 106.745 115.132 106.082 111.84 106.085C108.548 106.089 105.291 106.76 102.266 108.059C99.2403 109.357 96.5098 111.255 94.2391 113.639C91.5299 108.071 87.0826 103.537 81.5688 100.72L84.1526 99.6269C84.464 99.4944 84.7787 99.3785 85.0967 99.2791C88.535 98.186 91.1188 95.5029 92.3013 92.293L92.3411 92.1937L92.3709 92.0943C94.0205 86.9268 98.721 83.3195 104.336 83.3195C107.06 83.3082 109.716 84.179 111.905 85.8018C114.093 87.4247 115.698 89.7123 116.479 92.3229L118.447 97.6394L123.455 94.996C124.444 94.4747 125.496 94.0839 126.586 93.8334C128.057 93.5034 129.425 92.8144 130.566 91.8278C131.707 90.8412 132.586 89.5877 133.125 88.1789L133.154 88.1094L133.174 88.0299C134.049 85.5732 135.663 83.4478 137.795 81.9459C139.927 80.444 142.472 79.6394 145.079 79.6426C149.75 79.6426 153.854 82.1667 156.031 85.943L159.896 92.6607L164.388 86.3405C165.557 84.6969 167.102 83.3574 168.895 82.4341C170.688 81.5108 172.676 81.0307 174.693 81.0339C180.199 81.0339 184.899 84.5319 186.598 89.4211L186.608 89.4609C187.12 90.9057 187.995 92.1946 189.149 93.2039C190.303 94.2132 191.697 94.909 193.197 95.2246C196.399 95.9256 199.203 97.8453 201.016 100.577C202.828 103.309 203.506 106.639 202.906 109.863C200.03 108.346 196.826 107.557 193.574 107.567ZM173.501 126.051L160.582 289.324H130.074L136.533 125.355C136.77 120.594 138.832 116.107 142.292 112.827C145.751 109.546 150.341 107.725 155.108 107.742C159.876 107.759 164.453 109.612 167.889 112.916C171.326 116.22 173.357 120.721 173.56 125.484L173.501 126.051ZM80.267 100.104C73.7563 97.1867 66.386 96.8276 59.6225 99.098C52.859 101.368 47.1983 106.102 43.7666 112.357C41.3054 110.255 38.3727 108.78 35.2183 108.057C32.0639 107.334 28.7814 107.384 25.6505 108.203L25.6306 107.567C25.6306 101.505 29.9236 96.437 35.5185 95.2345C36.9985 94.9095 38.3746 94.2217 39.523 93.233C40.6713 92.2442 41.5559 90.9856 42.0971 89.5702L42.1269 89.5006L42.1468 89.4211C43.0215 86.9644 44.6357 84.839 46.7676 83.3371C48.8994 81.8353 51.4441 81.0306 54.0519 81.0339C59.6467 81.0339 64.2478 84.512 65.957 89.4211L65.967 89.4609C66.4792 90.9057 67.3541 92.1946 68.5079 93.2039C69.6616 94.2132 71.0554 94.909 72.5555 95.2246C74.888 95.7537 77.0278 96.9199 78.7366 98.5934L80.267 100.104ZM50.3551 123.626C50.9346 119.182 53.1121 115.102 56.4807 112.146C59.8494 109.191 64.1788 107.563 68.66 107.567C78.5975 107.567 86.7463 115.418 87.1438 125.355L93.7025 289.324H63.5919L50.6731 126.051C50.6203 125.237 50.5075 124.427 50.3551 123.626ZM99.6054 29.329C101.063 29.0278 102.416 28.3513 103.531 27.3666C104.647 26.3818 105.486 25.1229 105.965 23.7144C106.797 21.4128 108.318 19.423 110.319 18.015C112.321 16.607 114.708 15.849 117.155 15.8438C122.342 15.8438 126.745 19.1232 128.355 23.8137L128.404 23.9727L128.464 24.1119C129.617 26.8645 132.051 28.7825 134.824 29.4284H134.844C136.593 29.8302 138.228 30.6215 139.629 31.7433C141.03 32.8652 142.159 34.2886 142.933 35.9077C142.295 36.1731 141.671 36.4716 141.065 36.802C138.401 34.6211 135.26 33.0999 131.898 32.3623C128.536 31.6248 125.046 31.6916 121.715 32.5575C118.383 33.4234 115.303 35.0638 112.725 37.3451C110.147 39.6265 108.144 42.4844 106.88 45.6862C104.257 46.3507 101.78 47.4964 99.5756 49.0649C99.0906 48.9137 98.6 48.7811 98.1048 48.6674C96.5932 44.6715 93.9732 41.1897 90.5523 38.6305C91.4666 33.9997 95.0143 30.3526 99.5557 29.339L99.6054 29.329ZM109.414 55.2957C110.915 55.0295 112.317 54.3666 113.475 53.3759C114.634 52.3851 115.506 51.1026 116.002 49.6612C116.723 47.6663 117.963 45.8999 119.594 44.544C121.225 43.1881 123.189 42.2918 125.282 41.9476C127.375 41.6033 129.522 41.8235 131.501 42.5855C133.481 43.3475 135.221 44.6236 136.543 46.2824L139.703 50.2773L143.629 46.9979C145.906 45.0968 148.781 44.0589 151.747 44.0664C157.253 44.0664 161.953 47.5643 163.653 52.4536L163.663 52.4934C164.175 53.9382 165.05 55.2271 166.203 56.2364C167.357 57.2457 168.751 57.9415 170.251 58.2571C173.259 58.9155 175.922 60.6509 177.74 63.1364C179.557 65.622 180.404 68.6862 180.119 71.7522C176.776 70.9303 173.291 70.8808 169.926 71.6075C166.561 72.3341 163.407 73.8178 160.701 75.9459C156.498 71.934 150.91 69.6984 145.099 69.7051C135.49 69.7051 127.212 75.6974 123.992 84.2337L123.704 84.3132C121.696 80.9746 118.857 78.213 115.465 76.2973C112.072 74.3816 108.242 73.3773 104.346 73.382C94.3087 73.382 85.9215 79.8414 82.9601 88.9242L82.8607 89.123C80.5335 87.488 77.9216 86.3017 75.1592 85.625C73.542 81.34 70.6535 77.6519 66.8808 75.0551C63.1082 72.4583 58.6318 71.077 54.0519 71.0964C52.1903 71.0964 50.385 71.315 48.636 71.7522C48.3478 68.6987 49.1814 65.6447 50.981 63.1611C52.7806 60.6775 55.4231 58.9342 58.4145 58.2571C59.9373 57.9544 61.3521 57.2518 62.5135 56.2214C63.6749 55.191 64.541 53.8699 65.0229 52.394C65.9244 49.9437 67.5581 47.8303 69.7021 46.3405C71.8462 44.8507 74.3967 44.0567 77.0075 44.0664C82.5129 44.0664 87.2133 47.5643 88.9126 52.4536L88.9226 52.4934C89.4348 53.9382 90.3098 55.2271 91.4635 56.2364C92.6173 57.2457 94.0111 57.9415 95.5111 58.2571C96.5049 58.4824 97.439 58.8103 98.3135 59.2409L101.454 60.7613L103.958 58.3267C105.469 56.8559 107.347 55.7926 109.404 55.2957" fill="white"/>
                                </svg>
                            </div>
                            <h3 className="feature-title">Concierge Service</h3>
                            <p className="feature-description">Personalized service with food and beverage options</p>
                        </div>
                    </div>
                </div>
            </section>

            
            <style jsx>{`
                .theater-page {
                    min-height: 100vh;
                    background-color: #000000;
                    color: #ffffff;
                    position: relative;
                }

                .theater-page::after {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('/bg7.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    filter: blur(10px);
                    z-index: 0;
                }

                .theater-page::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 1;
                }

                .theater-page > * {
                    position: relative;
                    z-index: 2;
                }

                .container {
                    max-width: 80rem;
                    margin: 0 auto;
                    padding: 0 1rem;
                }

                @media (min-width: 768px) {
                    .container {
                        padding: 0 2rem;
                    }
                }

                @media (min-width: 1024px) {
                    .container {
                        padding: 0 4rem;
                    }
                }

                /* Hero Section */
                .theater-hero {
                    padding: 8rem 0 2rem 0;
                }

                .hero-content {
                    text-align: center;
                    margin-bottom: 4rem;
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: bold;
                    margin-bottom: 1.5rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 768px) {
                    .hero-title {
                        font-size: 4.5rem;
                    }
                }

                .highlight {
                    color: #FF0005;
                }

                .hero-subtitle {
                    font-size: 1.25rem;
                    color: #d1d5db;
                    margin-bottom: 2rem;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                .divider {
                    width: 6rem;
                    height: 0.25rem;
                    background-color: #FF0005;
                    margin: 0 auto;
                }

                /* Date Section */
                .date-section {
                    padding: 0rem 0 2rem 0;
                    margin-top: -2rem;
                }

                .date-card {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(239, 68, 68, 0.1));
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    border-radius: 1rem;
                    padding: 2rem;
                    text-align: center;
                    max-width: 50rem;
                    margin:  0 auto;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }

                .date-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    transition: left 0.6s ease;
                }

                .date-card:hover::before {
                    left: 100%;
                }

                .date-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 2rem;
                    position: relative;
                    z-index: 2;
                }

                @media (max-width: 768px) {
                    .date-info {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }

                .current-date,
                .current-time {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .date-label,
                .time-label {
                    font-size: 0.875rem;
                    color: #FF0005;
                    font-weight: bold;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .date-value,
                .time-value {
                    font-size: 1.25rem;
                    color: #ffffff;
                    font-weight: 600;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                .animated-time {
                    animation: timeGlow 2s ease-in-out infinite alternate;
                }

                @keyframes timeGlow {
                    0% {
                        text-shadow: 0 0 5px rgba(251, 191, 36, 0.5);
                        color: #ffffff;
                    }
                    100% {
                        text-shadow: 0 0 15px rgba(251, 191, 36, 0.8), 0 0 25px rgba(251, 191, 36, 0.4);
                        color: #FF0005;
                    }
                }

                @media (min-width: 768px) {
                    .date-value,
                    .time-value {
                        font-size: 1.5rem;
                    }
                }

                /* Filter Section */
                .filter-section {
                    padding: 2rem 0;
                }

                .filter-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    align-items: center;
                }

                @media (min-width: 768px) {
                    .filter-container {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }

                .search-box {
                    width: 100%;
                    max-width: 400px;
                }

                .search-input-wrapper {
                    position: relative;
                    width: 100%;
                    display: flex;
                    align-items: center;
                }

                .search-input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    border-radius: 0.5rem;
                    color: #ffffff;
                    font-size: 1rem;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .search-input:focus {
                    outline: none;
                    border-color: #FF0005;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
                    background: rgba(255, 255, 255, 0.15);
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    color: #888;
                    z-index: 2;
                    transition: color 0.3s ease;
                }

                .search-input-wrapper:focus-within .search-icon {
                    color: #FF0005;
                }

                .filter-dropdowns {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    justify-content: center;
                }

                @media (min-width: 768px) {
                    .filter-dropdowns {
                        justify-content: flex-end;
                    }
                }

                .dropdown-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    min-width: 150px;
                }

                .dropdown-label {
                    font-size: 0.875rem;
                    color: #FF0005;
                    font-weight: 600;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .filter-dropdown {
                    padding: 1.25rem 1.5rem;
                    background: linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.15) 0%, 
                        rgba(255, 255, 255, 0.05) 50%, 
                        rgba(251, 191, 36, 0.05) 100%);
                    border: 2px solid transparent;
                    border-radius: 1.5rem;
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-weight: 600;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    cursor: pointer;
                    backdrop-filter: blur(25px) saturate(180%);
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 1.25rem center;
                    background-size: 1.4rem;
                    padding-right: 3.5rem;
                    transition: background-image 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.12),
                        0 2px 8px rgba(251, 191, 36, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }



                .filter-dropdown.open {
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='18,15 12,9 6,15'%3e%3c/polyline%3e%3c/svg%3e");
                }



                .filter-dropdown:focus {
                    outline: none;
                    border-color: #FF0005;
                    box-shadow: 
                        0 0 0 4px rgba(251, 191, 36, 0.3),
                        0 8px 32px rgba(251, 191, 36, 0.2),
                        0 2px 8px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                }

                .filter-dropdown option {
                    background: #1a1a1a !important;
                    color: #ffffff !important;
                    padding: 0.75rem 1rem;
                    font-size: 0.9rem;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    border: none;
                    outline: none;
                    margin: 0;
                    transition: all 0.3s ease;
                }

                .filter-dropdown option:hover {
                    background: rgba(251, 191, 36, 0.2) !important;
                    color: #FF0005 !important;
                }

                .filter-dropdown option:checked {
                    background: rgba(251, 191, 36, 0.3) !important;
                    color: #FF0005 !important;
                    font-weight: 600;
                }

                /* Theater Grid */
                .theater-grid-section {
                    padding: 2rem 0;
                }

                @media (min-width: 481px) {
                    .theater-grid-section {
                        padding: 3rem 0;
                    }
                }

                @media (min-width: 769px) {
                    .theater-grid-section {
                        padding: 4rem 0;
                    }
                }

                .theater-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    width: 100%;
                    box-sizing: border-box;
                }

                @media (max-width: 480px) {
                    .theater-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                }

                @media (min-width: 481px) and (max-width: 768px) {
                    .theater-grid {
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 1.25rem;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .theater-grid {
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 1.75rem;
                    }
                }

                @media (min-width: 1025px) {
                    .theater-grid {
                        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                        gap: 2rem;
                    }
                }


                .theater-card:hover {
                    transform: translateY(-10px);
                }

                .theater-card {
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 1rem;
                    overflow: hidden;
                }

                .theater-card.active {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    border: 3px solid #FF0005;
                    position: relative;
                }

                .selected-tag {
                    position: absolute;
                    top: 0.5rem;
                    left: 0.5rem;
                    background: linear-gradient(135deg, #FF0005, #FF0005);
                    color: #000000;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.625rem;
                    font-weight: bold;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                    animation: tagPulse 2s ease-in-out infinite;
                }

                @media (min-width: 481px) {
                    .selected-tag {
                        top: 0.625rem;
                        left: 0.625rem;
                        padding: 0.4375rem 0.875rem;
                        font-size: 0.6875rem;
                    }
                }

                @media (min-width: 769px) {
                    .selected-tag {
                        top: 0.75rem;
                        left: 0.75rem;
                        padding: 0.5rem 1rem;
                        font-size: 0.75rem;
                    }
                }

                @keyframes tagPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 6px 16px rgba(251, 191, 36, 0.6);
                    }
                }

                .theater-image-container {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                    border-radius: 1rem;
                }

                @media (min-width: 481px) {
                    .theater-image-container {
                        height: 220px;
                    }
                }

                @media (min-width: 769px) {
                    .theater-image-container {
                        height: 250px;
                    }
                }

                @media (min-width: 1025px) {
                    .theater-image-container {
                        height: 280px;
                    }
                }

                .theater-glow {
                    position: absolute;
                    inset: 0;
                   
                    filter: blur(20px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 1;
                }

                .theater-card:hover .theater-glow,
                .theater-card.active .theater-glow {
                    opacity: 1;
                }

                .theater-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .theater-card:hover .theater-image,
                .theater-card.active .theater-image {
                    transform: scale(1.05);
                }

                .theater-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to bottom,
                        transparent,
                        rgba(0, 0, 0, 0.8)
                    );
                    display: flex;
                    align-items: flex-end;
                    padding: 1rem;
                    z-index: 2;
                }

                @media (min-width: 481px) {
                    .theater-overlay {
                        padding: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .theater-overlay {
                        padding: 1.5rem;
                    }
                }

                .theater-info {
                    color: white;
                }

                .theater-name {
                    font-size: 1.125rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    line-height: 1.3;
                }

                @media (min-width: 481px) {
                    .theater-name {
                        font-size: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .theater-name {
                        font-size: 1.5rem;
                    }
                }

                .theater-capacity {
                    font-size: 0.875rem;
                    color: #FF0005;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    line-height: 1.4;
                }

                @media (min-width: 481px) {
                    .theater-capacity {
                        font-size: 0.9375rem;
                    }
                }

                @media (min-width: 769px) {
                    .theater-capacity {
                        font-size: 1rem;
                    }
                }

                .theater-instructions {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    text-align: right;
                    z-index: 3;
                }

                @media (min-width: 481px) {
                    .theater-instructions {
                        top: 1rem;
                        right: 1rem;
                    }
                }

                .select-text {
                    font-size: 0.75rem;
                    color: #ffffff;
                    font-weight: bold;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.25rem;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                    animation: selectPulse 3s ease-in-out infinite;
                }

                @media (min-width: 481px) {
                    .select-text {
                        font-size: 0.8125rem;
                    }
                }

                @media (min-width: 769px) {
                    .select-text {
                        font-size: 0.875rem;
                    }
                }

                .scroll-text {
                    font-size: 0.625rem;
                    color: #FF0005;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                    animation: scrollGlow 2s ease-in-out infinite alternate;
                }

                @media (min-width: 481px) {
                    .scroll-text {
                        font-size: 0.6875rem;
                    }
                }

                @media (min-width: 769px) {
                    .scroll-text {
                        font-size: 0.75rem;
                    }
                }

                @keyframes selectPulse {
                    0%, 100% {
                        opacity: 0.8;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                    }
                }

                @keyframes scrollGlow {
                    0% {
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(251, 191, 36, 0.3);
                    }
                    100% {
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 16px rgba(251, 191, 36, 0.6);
                    }
                }

                /* Theater Details */
                .theater-details-section {
                    padding: 2rem 0;
                }

                @media (min-width: 481px) {
                    .theater-details-section {
                        padding: 3rem 0;
                    }
                }

                @media (min-width: 769px) {
                    .theater-details-section {
                        padding: 4rem 0;
                    }
                }

                .theater-details {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                    align-items: stretch;
                    min-height: auto;
                }

                @media (min-width: 769px) {
                    .theater-details {
                        grid-template-columns: 1fr 1fr;
                        gap: 3rem;
                        min-height: 500px;
                    }
                }

                @media (min-width: 1025px) {
                    .theater-details {
                        gap: 4rem;
                        min-height: 600px;
                    }
                }

                .theater-info-panel {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 1rem 0;
                }

                @media (min-width: 481px) {
                    .theater-info-panel {
                        padding: 1.5rem 0;
                    }
                }

                @media (min-width: 769px) {
                    .theater-info-panel {
                        padding: 2rem 0;
                    }
                }

                .theater-info-content {
                    max-width: 100%;
                }

                .theater-booking-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                }

                @media (min-width: 481px) {
                    .theater-booking-panel {
                        gap: 1.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .theater-booking-panel {
                        gap: 2rem;
                    }
                }

                .booking-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                    max-width: 100%;
                }

                @media (min-width: 481px) {
                    .booking-controls {
                        gap: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .booking-controls {
                        gap: 1.5rem;
                    }
                }

                .theater-detail-image {
                    position: relative;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    width: 100%;
                    max-width: 100%;
                }

                @media (min-width: 481px) {
                    .theater-detail-image {
                        border-radius: 0.875rem;
                    }
                }

                @media (min-width: 769px) {
                    .theater-detail-image {
                        border-radius: 1rem;
                    }
                }

                .detail-glow {
                    position: absolute;
                    inset: 0;
                   
                    filter: blur(30px);
                    z-index: 1;
                }

                .detail-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 0.75rem;
                    position: relative;
                    z-index: 2;
                    display: block;
                }

                @media (min-width: 481px) {
                    .detail-image {
                        height: 250px;
                        border-radius: 0.875rem;
                    }
                }

                @media (min-width: 769px) {
                    .detail-image {
                        height: 300px;
                        border-radius: 1rem;
                    }
                }

                @media (min-width: 1025px) {
                    .detail-image {
                        height: 350px;
                    }
                }

                .booking-features {
                    margin-top: 1.5rem;
                }

                @media (min-width: 481px) {
                    .booking-features {
                        margin-top: 1.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .booking-features {
                        margin-top: 2rem;
                    }
                }

                .features-title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #FF0005;
                    margin-bottom: 1rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 481px) {
                    .features-title {
                        font-size: 1.375rem;
                        margin-bottom: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .features-title {
                        font-size: 1.5rem;
                        margin-bottom: 1.5rem;
                    }
                }

                .booking-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 0.5rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 481px) {
                    .booking-label {
                        font-size: 0.9375rem;
                        margin-bottom: 0.625rem;
                    }
                }

                @media (min-width: 769px) {
                    .booking-label {
                        font-size: 1rem;
                        margin-bottom: 0.75rem;
                    }
                }

                .calendar-icon {
                    margin-right: 0.375rem;
                    font-size: 0.875rem;
                }

                @media (min-width: 481px) {
                    .calendar-icon {
                        margin-right: 0.4375rem;
                        font-size: 0.9375rem;
                    }
                }

                @media (min-width: 769px) {
                    .calendar-icon {
                        margin-right: 0.5rem;
                        font-size: 1rem;
                    }
                }

                .date-selection {
                    position: relative;
                }

                .date-picker-modal-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(10px) !important;
                    z-index: 999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 1rem !important;
                    animation: modalFadeIn 0.3s ease-out !important;
                }

                .date-picker-modal {
                    background: linear-gradient(135deg, 
                        rgba(0, 0, 0, 0.95) 0%, 
                        rgba(0, 0, 0, 0.9) 100%) !important;
                    border: 2px solid rgba(251, 191, 36, 0.3) !important;
                    border-radius: 1rem !important;
                    padding: 1.5rem !important;
                    max-width: 400px !important;
                    width: 100% !important;
                    max-height: 90vh !important;
                    overflow-y: auto !important;
                    position: relative !important;
                    z-index: 1000000 !important;
                    box-shadow: 
                        0 20px 40px rgba(0, 0, 0, 0.5),
                        0 4px 16px rgba(251, 191, 36, 0.2) !important;
                    animation: modalSlideIn 0.3s ease-out !important;
                }

                @media (min-width: 481px) {
                    .date-picker-modal {
                        padding: 2rem;
                        max-width: 450px;
                    }
                }

                @media (min-width: 769px) {
                    .date-picker-modal {
                        padding: 2.5rem;
                        max-width: 500px;
                    }
                }

                .date-picker-close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    z-index: 10;
                }

                .date-picker-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: scale(1.1);
                }

                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .date-picker-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    padding-right: 3rem;
                }

                .month-nav-btn {
                    background: rgba(251, 191, 36, 0.2);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    color: #FF0005;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.25rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .month-nav-btn:hover {
                    background: rgba(251, 191, 36, 0.3);
                    border-color: rgba(251, 191, 36, 0.5);
                    transform: scale(1.1);
                }

                .month-year {
                    font-size: 1rem;
                    font-weight: bold;
                    color: #FF0005;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    margin: 0;
                }

                @media (min-width: 481px) {
                    .month-year {
                        font-size: 1.125rem;
                    }
                }

                @media (min-width: 769px) {
                    .month-year {
                        font-size: 1.25rem;
                    }
                }

                .date-picker-calendar {
                    width: 100%;
                }

                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.25rem;
                    margin-bottom: 0.5rem;
                }

                .weekday {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #FF0005;
                    padding: 0.5rem 0;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 481px) {
                    .weekday {
                        font-size: 0.8125rem;
                    }
                }

                @media (min-width: 769px) {
                    .weekday {
                        font-size: 0.875rem;
                    }
                }

                .calendar-days {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.25rem;
                }

                .calendar-day {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    transition: all 0.3s ease;
                    min-height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (min-width: 481px) {
                    .calendar-day {
                        padding: 0.625rem;
                        font-size: 0.8125rem;
                        min-height: 2.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .calendar-day {
                        padding: 0.75rem;
                        font-size: 0.875rem;
                        min-height: 3rem;
                    }
                }

                .calendar-day:hover {
                    background: rgba(251, 191, 36, 0.2);
                    border-color: rgba(251, 191, 36, 0.4);
                    color: #FF0005;
                    transform: scale(1.05);
                }

                .calendar-day.empty {
                    background: transparent;
                    border: none;
                    cursor: default;
                }

                .calendar-day.empty:hover {
                    background: transparent;
                    border: none;
                    transform: none;
                }

                .detail-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #FF0005;
                    margin-bottom: 0.75rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    line-height: 1.2;
                }

                @media (min-width: 481px) {
                    .detail-title {
                        font-size: 1.75rem;
                        margin-bottom: 0.875rem;
                    }
                }

                @media (min-width: 769px) {
                    .detail-title {
                        font-size: 2rem;
                        margin-bottom: 1rem;
                    }
                }

                @media (min-width: 1025px) {
                    .detail-title {
                        font-size: 2.5rem;
                    }
                }

                .detail-specs {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0;
                }

                .spec-label {
                    font-weight: bold;
                    color: #FF0005;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                .spec-value {
                    color: #ffffff;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                .detail-price {
                    margin-bottom: 1rem;
                }

                @media (min-width: 481px) {
                    .detail-price {
                        margin-bottom: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .detail-price {
                        margin-bottom: 1.5rem;
                    }
                }

                .price-amount {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #FF0005;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 481px) {
                    .price-amount {
                        font-size: 1.5rem;
                    }
                }

                @media (min-width: 769px) {
                    .price-amount {
                        font-size: 1.75rem;
                    }
                }

                @media (min-width: 1025px) {
                    .price-amount {
                        font-size: 2rem;
                    }
                }

                .features-list {
                    margin-bottom: 1.5rem;
                }

                @media (min-width: 481px) {
                    .features-list {
                        margin-bottom: 1.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .features-list {
                        margin-bottom: 2rem;
                    }
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0;
                    color: #ffffff;
                }

                @media (min-width: 481px) {
                    .feature-item {
                        gap: 0.625rem;
                        padding: 0.625rem 0;
                    }
                }

                @media (min-width: 769px) {
                    .feature-item {
                        gap: 0.75rem;
                        padding: 0.75rem 0;
                    }
                }

                .feature-checkmark {
                    width: 1.25rem;
                    height: 1.25rem;
                    background: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-weight: bold;
                    font-size: 0.75rem;
                    flex-shrink: 0;
                }

                @media (min-width: 481px) {
                    .feature-checkmark {
                        width: 1.375rem;
                        height: 1.375rem;
                        font-size: 0.8125rem;
                    }
                }

                @media (min-width: 769px) {
                    .feature-checkmark {
                        width: 1.5rem;
                        height: 1.5rem;
                        font-size: 0.875rem;
                    }
                }

                .feature-text {
                    font-size: 0.875rem;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    line-height: 1.5;
                }

                @media (min-width: 481px) {
                    .feature-text {
                        font-size: 0.9375rem;
                    }
                }

                @media (min-width: 769px) {
                    .feature-text {
                        font-size: 1rem;
                    }
                }

                .booking-section {
                    margin-top: 1.5rem;
                }

                @media (min-width: 481px) {
                    .booking-section {
                        margin-top: 1.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .booking-section {
                        margin-top: 2rem;
                    }
                }

                .date-selection {
                    margin-bottom: 1rem;
                }

                @media (min-width: 481px) {
                    .date-selection {
                        margin-bottom: 1.25rem;
                    }
                }

                @media (min-width: 769px) {
                    .date-selection {
                        margin-bottom: 1.5rem;
                    }
                }

                .date-button {
                    background: #10b981;
                    color: #ffffff;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                }

                @media (min-width: 481px) {
                    .date-button {
                        padding: 0.875rem 1.25rem;
                        border-radius: 0.625rem;
                        font-size: 0.9375rem;
                    }
                }

                @media (min-width: 769px) {
                    .date-button {
                        padding: 1rem 1.5rem;
                        border-radius: 0.75rem;
                        font-size: 1rem;
                        width: auto;
                    }
                }

                .date-button:hover {
                    background: #059669;
                    transform: translateY(-2px);
                }

                .time-slots {
                    margin-bottom: 1.5rem;
                }

                @media (min-width: 481px) {
                    .time-slots {
                        margin-bottom: 1.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .time-slots {
                        margin-bottom: 2rem;
                    }
                }

                .time-slots-title {
                    font-size: 1rem;
                    font-weight: bold;
                    color: #ffffff;
                    margin-bottom: 0.75rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                @media (min-width: 481px) {
                    .time-slots-title {
                        font-size: 1.125rem;
                        margin-bottom: 0.875rem;
                    }
                }

                @media (min-width: 769px) {
                    .time-slots-title {
                        font-size: 1.25rem;
                        margin-bottom: 1rem;
                    }
                }

                .time-slots-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }

                @media (min-width: 481px) {
                    .time-slots-grid {
                        gap: 0.625rem;
                    }
                }

                @media (min-width: 769px) {
                    .time-slots-grid {
                        gap: 0.75rem;
                    }
                }

                .time-slot {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    border: 2px solid transparent;
                    padding: 0.625rem 0.5rem;
                    border-radius: 0.5rem;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    min-height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (min-width: 481px) {
                    .time-slot {
                        padding: 0.75rem 0.625rem;
                        border-radius: 0.625rem;
                        font-size: 0.75rem;
                        min-height: 2.75rem;
                    }
                }

                @media (min-width: 769px) {
                    .time-slot {
                        padding: 0.875rem 0.75rem;
                        border-radius: 0.75rem;
                        font-size: 0.8125rem;
                        min-height: 3rem;
                    }
                }

                .time-slot:hover {
                    background: rgba(251, 191, 36, 0.2);
                    border-color: rgba(251, 191, 36, 0.5);
                }

                .time-slot.selected {
                    background: #10b981;
                    border-color: #10b981;
                    color: #ffffff;
                }

                .feature-icon {
                    font-size: 1.25rem;
                }

                .sound-bars-svg {
                    overflow: visible;
                }

                .sound-bar {
                    animation: soundBarPulse 1.5s ease-in-out infinite;
                    transform-origin: bottom;
                }

                @keyframes soundBarPulse {
                    0%, 100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                    25% {
                        transform: scaleY(0.3);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scaleY(1.2);
                        opacity: 1;
                    }
                    75% {
                        transform: scaleY(0.6);
                        opacity: 0.8;
                    }
                }

                .sound-bar:nth-child(1) { animation-duration: 1.2s; }
                .sound-bar:nth-child(2) { animation-duration: 1.4s; }
                .sound-bar:nth-child(3) { animation-duration: 1.1s; }
                .sound-bar:nth-child(4) { animation-duration: 1.6s; }
                .sound-bar:nth-child(5) { animation-duration: 1.3s; }
                .sound-bar:nth-child(6) { animation-duration: 1.5s; }
                .sound-bar:nth-child(7) { animation-duration: 1.2s; }
                .sound-bar:nth-child(8) { animation-duration: 1.4s; }
                .sound-bar:nth-child(9) { animation-duration: 1.1s; }
                .sound-bar:nth-child(10) { animation-duration: 1.6s; }
                .sound-bar:nth-child(11) { animation-duration: 1.3s; }
                .sound-bar:nth-child(12) { animation-duration: 1.5s; }
                .sound-bar:nth-child(13) { animation-duration: 1.2s; }
                .sound-bar:nth-child(14) { animation-duration: 1.4s; }

                .feature-text {
                    font-size: 0.875rem;
                    color: #d1d5db;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                .book-button {
                    background: linear-gradient(45deg, #FF0005, #FF0005);
                    color:rgb(255, 255, 255);
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    width: 100%;
                }

                @media (min-width: 481px) {
                    .book-button {
                        padding: 0.875rem 1.75rem;
                        font-size: 1rem;
                    }
                }

                @media (min-width: 769px) {
                    .book-button {
                        padding: 1rem 2rem;
                        font-size: 1.125rem;
                        width: auto;
                    }
                }

                .book-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(251, 191, 36, 0.3);
                }

                /* Features Section */
                .theater-features-section {
                    padding: 4rem 0;
                    background: linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0));
                    backdrop-filter: blur(10px);
                }

                .features-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .features-title {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #FF0005;
                    margin-bottom: 1rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                .features-subtitle {
                    font-size: 1.125rem;
                    color: #d1d5db;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                .features-grid-main {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                }

                .feature-card {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.1);
                }

                .feature-icon-large {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .feature-title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #FF0005;
                    margin-bottom: 1rem;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                .feature-description {
                    font-size: 1rem;
                    color: #d1d5db;
                    line-height: 1.6;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                }

                /* Test Popup Styles */
                .test-popup-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.9) !important;
                    backdrop-filter: blur(15px) !important;
                    z-index: 9999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 1rem !important;
                    animation: testPopupFadeIn 0.4s ease-out !important;
                }

                .test-popup-modal {
                    background: linear-gradient(135deg, 
                        rgba(0, 0, 0, 0.98) 0%, 
                        rgba(0, 0, 0, 0.95) 100%) !important;
                    border: 3px solid rgba(251, 191, 36, 0.5) !important;
                    border-radius: 1.5rem !important;
                    padding: 2rem !important;
                    max-width: 500px !important;
                    width: 100% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                    position: relative !important;
                    z-index: 10000000 !important;
                    box-shadow: 
                        0 25px 50px rgba(0, 0, 0, 0.8),
                        0 8px 20px rgba(251, 191, 36, 0.3) !important;
                    animation: testPopupSlideIn 0.4s ease-out !important;
                }

                .test-popup-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid rgba(251, 191, 36, 0.3);
                }

                .test-popup-header h2 {
                    color: #FF0005;
                    font-size: 1.75rem;
                    font-weight: bold;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                    margin: 0;
                }

                .test-popup-close-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.25rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .test-popup-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: scale(1.1);
                }

                .test-popup-content {
                    margin-bottom: 2rem;
                }

                .test-popup-content p {
                    color: #ffffff;
                    font-size: 1.125rem;
                    line-height: 1.6;
                    font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
                    margin-bottom: 1rem;
                }

                .test-popup-footer {
                    display: flex;
                    justify-content: center;
                }

                .test-popup-btn {
                    background: linear-gradient(45deg, #FF0005, #FF0005);
                    color: #000000;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 0.75rem;
                    font-size: 1.125rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
                }

                .test-popup-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(251, 191, 36, 0.4);
                }

                @keyframes testPopupFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes testPopupSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>

        </div>
    );
}
