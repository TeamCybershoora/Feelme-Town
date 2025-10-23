'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

interface PricingData {
  slotBookingFee: number;
  extraGuestFee: number;
  convenienceFee: number;
}

const PricingManagement: React.FC = () => {
  const [pricing, setPricing] = useState<PricingData>({
    slotBookingFee: 1000,
    extraGuestFee: 400,
    convenienceFee: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError, toasts, removeToast } = useToast();

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing');
      const data = await response.json();
      
      if (data.success && data.pricing) {
        setPricing(data.pricing);
      } else {
        console.error('Failed to fetch pricing:', data.error);
        showError('Failed to load pricing data');
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      showError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricing),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Pricing updated successfully!');
      } else {
        showError('Failed to update pricing: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      showError('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PricingData, value: string) => {
    const numValue = parseInt(value) || 0;
    setPricing(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  if (loading) {
    return (
      <div className="pricing-container">
        <div className="pricing-header">
          <div className="header-content">
            <h1>Pricing Management</h1>
            <p>Manage booking fees and charges</p>
          </div>
        </div>
        <div className="loading">Loading pricing data...</div>
      </div>
    );
  }

  return (
    <div className="pricing-container">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <div className="pricing-header">
        <div className="header-content">
          <h1>Pricing Management</h1>
          <p>Manage booking fees and charges for the booking system</p>
        </div>
      </div>

      <div className="pricing-content">
        <div className="pricing-card">
          <div className="pricing-card-header">
            <h2>Booking Fees</h2>
            <p>Configure the fees charged for different booking services</p>
          </div>

          <div className="pricing-form">
            <div className="pricing-field">
              <label htmlFor="slotBookingFee">Slot Booking Fee (₹)</label>
              <input
                id="slotBookingFee"
                type="number"
                value={pricing.slotBookingFee}
                onChange={(e) => handleInputChange('slotBookingFee', e.target.value)}
                placeholder="Enter slot booking fee"
                min="0"
              />
              <p className="field-description">
                Base fee charged for booking a theater slot
              </p>
            </div>

            <div className="pricing-field">
              <label htmlFor="extraGuestFee">Extra Guest Fee (₹)</label>
              <input
                id="extraGuestFee"
                type="number"
                value={pricing.extraGuestFee}
                onChange={(e) => handleInputChange('extraGuestFee', e.target.value)}
                placeholder="Enter extra guest fee"
                min="0"
              />
              <p className="field-description">
                Additional fee per guest beyond theater minimum capacity
              </p>
            </div>

            <div className="pricing-field">
              <label htmlFor="convenienceFee">Convenience Fee (₹)</label>
              <input
                id="convenienceFee"
                type="number"
                value={pricing.convenienceFee}
                onChange={(e) => handleInputChange('convenienceFee', e.target.value)}
                placeholder="Enter convenience fee"
                min="0"
              />
              <p className="field-description">
                Processing fee for online bookings
              </p>
            </div>
          </div>

          <div className="pricing-actions">
            <button
              onClick={handleSave}
              disabled={saving}
              className="save-button"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="pricing-preview">
          <h3>Current Pricing Summary</h3>
          <div className="pricing-summary">
            <div className="summary-item">
              <span className="label">Slot Booking Fee:</span>
              <span className="value">₹{pricing.slotBookingFee}</span>
            </div>
            <div className="summary-item">
              <span className="label">Extra Guest Fee:</span>
              <span className="value">₹{pricing.extraGuestFee} per guest</span>
            </div>
            <div className="summary-item">
              <span className="label">Convenience Fee:</span>
              <span className="value">₹{pricing.convenienceFee}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .pricing-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #000;
          margin: 0 0 0.5rem 0;
        }

        .header-content p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #000;
          margin: 0;
        }

        .loading {
          text-align: center;
          color: #000;
          font-size: 1.2rem;
          margin-top: 4rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
        }

        .pricing-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .pricing-card {
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .pricing-card-header {
          padding: 2rem 2rem 1rem 2rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .pricing-card-header h2 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .pricing-card-header p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          color: #666;
          font-size: 0.95rem;
          margin: 0;
        }

        .pricing-form {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .pricing-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pricing-field label {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-weight: 500;
          color: #000;
          font-size: 0.95rem;
        }

        .pricing-field input {
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          transition: all 0.3s ease;
          background: white;
          color: #000;
        }

        .pricing-field input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .field-description {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.85rem;
          color: #000;
          margin: 0;
          line-height: 1.4;
        }

        .pricing-actions {
          padding: 1.5rem 2rem 2rem 2rem;
          display: flex;
          justify-content: flex-end;
        }

        .save-button {
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 2rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .save-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .pricing-preview {
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          height: fit-content;
        }

        .pricing-preview:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .pricing-preview h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
          padding: 2rem 2rem 0 2rem;
        }

        .pricing-summary {
          padding: 0 2rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--accent-color);
          transition: all 0.3s ease;
        }

        .summary-item:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .summary-item .label {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .summary-item .value {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-weight: 600;
          color: var(--accent-color);
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .pricing-container {
            padding: 1rem;
          }

          .pricing-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .pricing-header h1 {
            font-size: 1.8rem;
          }

          .pricing-card,
          .pricing-preview {
            margin: 0;
          }

          .pricing-card-header,
          .pricing-form,
          .pricing-actions {
            padding: 1.5rem;
          }

          .pricing-preview h3 {
            padding: 1.5rem 1.5rem 0 1.5rem;
          }

          .pricing-summary {
            padding: 0 1.5rem 1.5rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PricingManagement;
