'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react';

export default function TheatresPage() {
  const [theatres] = useState([
    {
      id: 1,
      name: 'Theater 1',
      capacity: 50,
      price: 2500,
      status: 'Active',
      location: 'Ground Floor',
      amenities: ['AC', 'Sound System', 'Lighting'],
      image: '/images/theater1.webp'
    },
    {
      id: 2,
      name: 'Theater 2',
      capacity: 75,
      price: 3000,
      status: 'Active',
      location: 'First Floor',
      amenities: ['AC', 'Sound System', 'Lighting', 'Projector'],
      image: '/images/theater2.webp'
    },
    {
      id: 3,
      name: 'Theater 3',
      capacity: 100,
      price: 4000,
      status: 'Maintenance',
      location: 'Second Floor',
      amenities: ['AC', 'Sound System', 'Lighting', 'Projector', 'Stage'],
      image: '/images/theater3.webp'
    },
    {
      id: 4,
      name: 'Theater 4',
      capacity: 30,
      price: 2000,
      status: 'Active',
      location: 'Ground Floor',
      amenities: ['AC', 'Sound System'],
      image: '/images/theater4.webp'
    }
  ]);

  return (
    <div className="theatres-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Theatre List</h1>
          <p>Manage all theater halls and their configurations</p>
        </div>
        <button className="add-theatre-btn">
          <Plus size={20} />
          Add New Theatre
        </button>
      </div>

      <div className="theatres-grid">
        {theatres.map((theatre) => (
          <div key={theatre.id} className="theatre-card">
            <div className="theatre-image">
              <img src={theatre.image} alt={theatre.name} />
              <div className="status-badge">
                <span className={`status ${theatre.status.toLowerCase()}`}>
                  {theatre.status}
                </span>
              </div>
            </div>
            
            <div className="theatre-content">
              <div className="theatre-header">
                <h3>{theatre.name}</h3>
                <span className="price">₹{theatre.price.toLocaleString()}</span>
              </div>
              
              <div className="theatre-details">
                <div className="detail-row">
                  <span className="label">Capacity:</span>
                  <span className="value">{theatre.capacity} people</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{theatre.location}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amenities:</span>
                  <div className="amenities">
                    {theatre.amenities.map((amenity, index) => (
                      <span key={index} className="amenity-tag">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="theatre-actions">
                <button className="action-btn view-btn">
                  <Eye size={16} />
                  View
                </button>
                <button className="action-btn edit-btn">
                  <Edit size={16} />
                  Edit
                </button>
                <button className="action-btn settings-btn">
                  <Settings size={16} />
                  Settings
                </button>
                <button className="action-btn delete-btn">
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .theatres-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .header-content p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .add-theatre-btn {
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .add-theatre-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .theatres-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .theatre-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .theatre-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .theatre-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .theatre-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }

        .status {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status.active {
          background: #d4edda;
          color: #155724;
        }

        .status.maintenance {
          background: #fff3cd;
          color: #856404;
        }

        .theatre-content {
          padding: 1.5rem;
        }

        .theatre-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .theatre-header h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .price {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent-color);
        }

        .theatre-details {
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .value {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #333;
        }

        .amenities {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .amenity-tag {
          background: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .theatre-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .view-btn {
          background: #007bff;
          color: white;
        }

        .view-btn:hover {
          background: #0056b3;
        }

        .edit-btn {
          background: #28a745;
          color: white;
        }

        .edit-btn:hover {
          background: #1e7e34;
        }

        .settings-btn {
          background: #6c757d;
          color: white;
        }

        .settings-btn:hover {
          background: #545b62;
        }

        .delete-btn {
          background: #dc3545;
          color: white;
        }

        .delete-btn:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .theatres-page {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .theatres-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .theatre-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
