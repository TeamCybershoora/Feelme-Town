'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdministratorPage() {
  const [stats, setStats] = useState({
    onlineBookings: {
      today: 0,
      thisWeek: 0,
      thisMonth: 7,
      total: 274
    },
    manualBookings: {
      today: 3,
      thisWeek: 30,
      thisMonth: 89,
      total: 951
    },
    allBookings: {
      today: 3,
      thisWeek: 30,
      thisMonth: 96,
      total: 1225
    },
    activeHalls: {
      total: 4
    },
    confirmedToday: {
      confirmed: 0,
      completed: 30
    },
    unreadInquiries: {
      total: 0,
      today: 0
    }
  });

  const [recentBookings, setRecentBookings] = useState([
    {
      id: 1,
      customerName: 'John Doe',
      theater: 'Theater 1',
      date: '2024-01-15',
      time: '19:00',
      status: 'Confirmed',
      amount: 2500
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      theater: 'Theater 2',
      date: '2024-01-15',
      time: '21:00',
      status: 'Pending',
      amount: 3000
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      theater: 'Theater 3',
      date: '2024-01-16',
      time: '18:00',
      status: 'Confirmed',
      amount: 2000
    }
  ]);

  useEffect(() => {
    // In a real app, fetch data from API
    // fetchAdminStats();
  }, []);

  return (
    <div className="administrator-page">
      <AdminDashboard stats={stats} recentBookings={recentBookings} />
    </div>
  );
}
