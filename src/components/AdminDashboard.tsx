'use client';

import { 
  Calendar, 
  CheckSquare, 
  Theater, 
  Grid3X3, 
  HelpCircle,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface Stats {
  onlineBookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  manualBookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  allBookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  activeHalls: {
    total: number;
  };
  confirmedToday: {
    confirmed: number;
    completed: number;
  };
  unreadInquiries: {
    total: number;
    today: number;
  };
}

interface Booking {
  id: number;
  customerName: string;
  theater: string;
  date: string;
  time: string;
  status: string;
  amount: number;
}

interface AdminDashboardProps {
  stats: Stats;
  recentBookings: Booking[];
}

export default function AdminDashboard({ stats, recentBookings }: AdminDashboardProps) {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Welcome to FeelMe Town - Admin Panel</h2>
        <p>Manage your bookings, theaters, and customer inquiries</p>
      </div>

      <div className="stats-grid">
        {/* Online Bookings Widget */}
        <div className="stat-widget online-bookings">
          <div className="widget-header">
            <div className="widget-icon">
              <Calendar size={24} />
            </div>
            <div className="widget-title">Online Bookings</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">For today:</span>
              <span className="stat-value">{stats.onlineBookings.today}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Week:</span>
              <span className="stat-value">{stats.onlineBookings.thisWeek}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Month:</span>
              <span className="stat-value">{stats.onlineBookings.thisMonth}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For all Total:</span>
              <span className="stat-value">{stats.onlineBookings.total}</span>
            </div>
          </div>
        </div>

        {/* Manual Bookings Widget */}
        <div className="stat-widget manual-bookings">
          <div className="widget-header">
            <div className="widget-icon">
              <CheckSquare size={24} />
            </div>
            <div className="widget-title">Manual Bookings</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">For today:</span>
              <span className="stat-value">{stats.manualBookings.today}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Week:</span>
              <span className="stat-value">{stats.manualBookings.thisWeek}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Month:</span>
              <span className="stat-value">{stats.manualBookings.thisMonth}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For all Total:</span>
              <span className="stat-value">{stats.manualBookings.total}</span>
            </div>
          </div>
        </div>

        {/* All Total Bookings Widget */}
        <div className="stat-widget all-bookings">
          <div className="widget-header">
            <div className="widget-icon">
              <TrendingUp size={24} />
            </div>
            <div className="widget-title">All Total Bookings</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">For today:</span>
              <span className="stat-value">{stats.allBookings.today}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Week:</span>
              <span className="stat-value">{stats.allBookings.thisWeek}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For this Month:</span>
              <span className="stat-value">{stats.allBookings.thisMonth}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">For all Total:</span>
              <span className="stat-value">{stats.allBookings.total}</span>
            </div>
          </div>
        </div>

        {/* Active Halls Widget */}
        <div className="stat-widget active-halls">
          <div className="widget-header">
            <div className="widget-icon">
              <Theater size={24} />
            </div>
            <div className="widget-title">Active Halls</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.activeHalls.total} Theatres</span>
            </div>
          </div>
        </div>

        {/* Confirmed Today Widget */}
        <div className="stat-widget confirmed-today">
          <div className="widget-header">
            <div className="widget-icon">
              <Grid3X3 size={24} />
            </div>
            <div className="widget-title">Confirmed Today</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">Confirmed today:</span>
              <span className="stat-value">{stats.confirmedToday.confirmed}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Completed till-now:</span>
              <span className="stat-value">{stats.confirmedToday.completed}</span>
            </div>
          </div>
        </div>

        {/* Unread Inquiries Widget */}
        <div className="stat-widget unread-inquiries">
          <div className="widget-header">
            <div className="widget-icon">
              <HelpCircle size={24} />
            </div>
            <div className="widget-title">Unread Inquiries</div>
          </div>
          <div className="widget-content">
            <div className="stat-row">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.unreadInquiries.total}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Today:</span>
              <span className="stat-value">{stats.unreadInquiries.today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="recent-bookings">
        <div className="section-header">
          <h3>Recent Bookings</h3>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Theater</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.customerName}</td>
                  <td>{booking.theater}</td>
                  <td>{booking.date} at {booking.time}</td>
                  <td>
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>₹{booking.amount.toLocaleString()}</td>
                  <td>
                    <button className="action-btn">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decorative Image Section */}
      <div className="decorative-section">
        <div className="decorative-image">
          <img src="/images/gallery/Feelme Town_1.webp" alt="FeelMe Town Hall" />
          <div className="image-overlay">
            <h3>Beautiful Event Spaces</h3>
            <p>Create unforgettable memories in our premium theaters</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h2 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .dashboard-header p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-widget {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .stat-widget:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .widget-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .widget-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .online-bookings .widget-icon {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        }

        .manual-bookings .widget-icon {
          background: linear-gradient(135deg, #4ecdc4, #6dd5ed);
        }

        .all-bookings .widget-icon {
          background: linear-gradient(135deg, #45b7d1, #96c7ed);
        }

        .active-halls .widget-icon {
          background: linear-gradient(135deg, #2c3e50, #34495e);
        }

        .confirmed-today .widget-icon {
          background: linear-gradient(135deg, #f39c12, #f1c40f);
        }

        .unread-inquiries .widget-icon {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .widget-title {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .widget-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #666;
        }

        .stat-value {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
        }

        .recent-bookings {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .view-all-btn {
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .bookings-table {
          overflow-x: auto;
        }

        .bookings-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .bookings-table th,
        .bookings-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .bookings-table th {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          background: #f8f9fa;
        }

        .bookings-table td {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #666;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.confirmed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .action-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.25rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: #0056b3;
        }

        .decorative-section {
          margin-top: 3rem;
        }

        .decorative-image {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }

        .decorative-image img {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          color: white;
          padding: 2rem;
        }

        .image-overlay h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .image-overlay p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          margin: 0;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .dashboard-header h2 {
            font-size: 1.5rem;
          }

          .bookings-table {
            font-size: 0.8rem;
          }

          .bookings-table th,
          .bookings-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
