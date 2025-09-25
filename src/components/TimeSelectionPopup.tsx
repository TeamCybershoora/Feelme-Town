'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Check } from 'lucide-react';

interface TimeSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime: string | null;
  onTimeSelected: (time: string) => void;
}

const timeSlots = [
  { value: '9:00 am - 12:00 pm', label: '9:00 AM - 12:00 PM' },
  { value: '12:30 PM - 03:30 PM', label: '12:30 PM - 03:30 PM' },
  { value: '04:00 PM - 07:00 PM', label: '04:00 PM - 07:00 PM' },
  { value: '07:30 PM - 10:30 PM', label: '07:30 PM - 10:30 PM' }
];

export default function TimeSelectionPopup({ 
  isOpen, 
  onClose, 
  selectedTime, 
  onTimeSelected 
}: TimeSelectionPopupProps) {
  if (!isOpen) return null;

  const handleTimeSelect = (time: string) => {
    onTimeSelected(time);
    onClose();
  };

  const popupContent = (
    <div className="time-selection-overlay">
      <div className="time-selection-popup">
        {/* Header */}
        <div className="time-selection-header">
          <div className="time-selection-title-section">
            <h2 className="time-selection-title">
              <Clock className="w-6 h-6" />
              Select Time Slot
            </h2>
            <p className="time-selection-description">
              Choose your preferred time slot for the theater booking
            </p>
          </div>
          <button 
            onClick={onClose}
            className="time-selection-close-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Time Slots Grid */}
        <div className="time-selection-content">
          <div className="time-selection-grid">
            {timeSlots.map((timeSlot) => (
              <button
                key={timeSlot.value}
                onClick={() => handleTimeSelect(timeSlot.value)}
                className={`time-selection-slot ${selectedTime === timeSlot.value ? 'selected' : ''}`}
              >
                <div className="time-selection-slot-content">
                  <Clock className="w-5 h-5" />
                  <span className="time-selection-slot-text">{timeSlot.label}</span>
                </div>
                {selectedTime === timeSlot.value && (
                  <div className="time-selection-checkmark">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="time-selection-footer">
          <button 
            onClick={onClose}
            className="time-selection-btn secondary"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .time-selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          z-index: 1000001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .time-selection-popup {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .time-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .time-selection-title-section {
          flex: 1;
        }

        .time-selection-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
        }

        .time-selection-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }

        .time-selection-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-selection-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .time-selection-content {
          flex: 1;
          padding: 1.5rem 2rem;
        }

        .time-selection-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .time-selection-slot {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          text-align: left;
        }

        .time-selection-slot:hover {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .time-selection-slot.selected {
          border-color: #FF0005;
          background: rgba(255, 0, 5, 0.15);
        }

        .time-selection-slot-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #ffffff;
        }

        .time-selection-slot-text {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .time-selection-checkmark {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #FF0005;
          color: #ffffff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(255, 0, 5, 0.3);
        }

        .time-selection-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: center;
        }

        .time-selection-btn {
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .time-selection-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .time-selection-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .time-selection-popup {
            margin: 0.5rem;
            max-width: 95vw;
          }

          .time-selection-header {
            padding: 1rem 1.5rem;
          }

          .time-selection-title {
            font-size: 1.25rem;
          }

          .time-selection-content {
            padding: 1rem 1.5rem;
          }

          .time-selection-footer {
            padding: 1rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(popupContent, document.body);
}
