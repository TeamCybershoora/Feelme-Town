'use client';

import { DatePickerProvider } from "@/contexts/DatePickerContext";
import { BookingProvider } from "@/contexts/BookingContext";

interface MoviesLayoutProps {
  children: React.ReactNode;
}

export default function MoviesLayout({ children }: MoviesLayoutProps) {
  return (
    <DatePickerProvider>
      <BookingProvider>
        <div className="movies-fullscreen-layout">
          {children}
          <style jsx global>{`
            /* Make movies page a full-screen overlay */
            .movies-fullscreen-layout {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              background: #0a0a0a !important;
              z-index: 999999 !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
            }
            
            /* Ensure full screen layout */
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              height: 100% !important;
              width: 100% !important;
            }
            
            /* Hide any global layout elements */
            .client-layout {
              display: contents !important;
            }
            
            /* Ensure movies content takes full space */
            .movies-container {
              width: 100% !important;
              min-height: 100vh !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #0a0a0a !important;
            }
            
            /* Make sure movies page appears above everything */
            * {
              box-sizing: border-box !important;
            }
            
            /* Additional styles to ensure full coverage */
            .movies-header {
              background: #0a0a0a !important;
              width: 100% !important;
            }
            
            .movies-content {
              background: #0a0a0a !important;
              width: 100% !important;
            }
          `}</style>
        </div>
      </BookingProvider>
    </DatePickerProvider>
  );
}
