'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';

interface OrderItem {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  serviceName?: string;
  isDecoration?: boolean;
}

interface OrderRecord {
  _id?: string;
  bookingId?: string;
  mongoBookingId?: string;
  ticketNumber?: string;
  customerName?: string;
  serviceName?: string;
  serviceField?: string;
  canonicalField?: string;
  items?: OrderItem[];
  subtotal?: number;
  previousSubtotal?: number;
  actionType?: 'save' | 'clear';
  status?: string;
  markPaid?: boolean;
  totalAmountBefore?: number;
  totalAmountAfter?: number;
  venuePaymentBefore?: number;
  venuePaymentAfter?: number;
  performedBy?: string;
  recordedAt?: string;
  createdAt?: string;
}

const limitOptions = [50, 100, 200, 300, 500];

const currency = (value?: number) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
    : '—';

const formatTimestamp = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [limit, setLimit] = useState(200);
  const [viewOrdersModalOpen, setViewOrdersModalOpen] = useState(false);
  const [buttonStates, setButtonStates] = useState<Record<string, 'initial' | 'received' | 'ready'>>({});
  const [buttonLoading, setButtonLoading] = useState<Record<string, boolean>>({});
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [pendingAlertOrder, setPendingAlertOrder] = useState<OrderRecord | null>(null);
  const [pendingAlertOpen, setPendingAlertOpen] = useState(false);
  const [dismissedTickets, setDismissedTickets] = useState<string[]>([]);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [modalActionLoading, setModalActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (serviceFilter) params.set('serviceName', serviceFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load orders');
      }

      const fetched = Array.isArray(data.orders) ? data.orders : [];
      setOrders(fetched);
      setButtonStates(() => {
        const next: Record<string, 'initial' | 'received' | 'ready'> = {};
        fetched.forEach((order: OrderRecord) => {
          const ticket = order.ticketNumber;
          if (!ticket) return;
          const status = (order.status || '').toLowerCase();
          if (status === 'ready') {
            next[ticket] = 'ready';
          } else if (status === 'received' || status === 'placed') {
            next[ticket] = 'received';
          } else {
            next[ticket] = 'initial';
          }
        });
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (order: OrderRecord) => {
    if (!order.ticketNumber) {
      alert('No ticket number associated with this order.');
      return;
    }

    const key = order.ticketNumber;
    const stage = buttonStates[key] || 'initial';
    const nextAction = stage === 'received' ? 'ready' : 'received';

    try {
      setButtonLoading((prev) => ({ ...prev, [key]: true }));
      const res = await fetch('/api/order-items/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumber: order.ticketNumber, status: nextAction }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to notify customer');
      }
      setButtonStates((prev) => ({ ...prev, [key]: nextAction === 'received' ? 'received' : 'ready' }));
    } catch (err: any) {
      alert(err?.message || 'Failed to notify customer');
    } finally {
      setButtonLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, serviceFilter, limit]);

  const serviceOptions = useMemo(() => {
    const values = new Set<string>();
    orders.forEach((order) => {
      if (order.serviceName) {
        values.add(order.serviceName);
      }
    });
    return Array.from(values).sort();
  }, [orders]);

  return (
    <>
      <main className="orders-page">
        <div className="orders-shell">
          <header className="orders-header">
            <div>
              <p className="orders-kicker">Operations</p>
              <h1>Orders board</h1>
              <p className="orders-subtitle">Every service-specific item the team adds lands here in real time.</p>
            </div>
            <div className="header-actions">
              <button type="button" className="view-orders-button" onClick={() => setViewOrdersModalOpen(true)}>
                View Orders
              </button>
              <button type="button" className="refresh-button" onClick={() => fetchOrders()}>
                <RefreshCw className={loading ? 'spin' : ''} />
                Refresh feed
              </button>
            </div>
          </header>

          <section className="filters">
            <div className="search-box">
              <Search className="icon" />
              <input
                type="text"
                placeholder="Search by booking, ticket, customer, service, staff"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                <option value="">All services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                {limitOptions.map((value) => (
                  <option key={value} value={value}>
                    Show {value}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="orders-table">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Service</th>
                    <th>Items (Name · Qty · Price)</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No orders found for the selected filters.
                      </td>
                    </tr>
                  )}

                  {orders.map((order) => (
                    <tr key={order._id || `${order.bookingId}-${order.ticketNumber}-${order.recordedAt}`}>
                      <td>
                        <div className="table-title">{order.bookingId || '—'}</div>
                        <div className="table-sub">Ticket: {order.ticketNumber || '—'}</div>
                      </td>
                      <td>
                        <div className="table-title">{order.serviceName || '—'}</div>
                        {order.performedBy && <div className="table-sub">By: {order.performedBy}</div>}
                      </td>
                      <td>
                        <div className="items-pill-grid">
                          {(order.items || []).map((item, index) => (
                            <div key={`${item.id || item.name}-${index}`} className="item-pill">
                              <span className="pill-name">{item.name || '—'}</span>
                              <span className="pill-qty"> × {item.quantity || 0}</span>
                              <span className="pill-price">{currency(item.price)}</span>
                            </div>
                          ))}
                          {(order.items || []).length === 0 && <div className="table-sub">No items.</div>}
                        </div>
                      </td>
                      <td>
                        <div className="table-title">{currency(order.subtotal)}</div>
                        <div className="table-sub">
                          Invoice: {currency(order.totalAmountBefore)} → {currency(order.totalAmountAfter)}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="view-detail-button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setViewDetailOpen(true);
                          }}
                        >
                          View Detail
                        </button>
                        <button
                          type="button"
                          className="notify-button"
                          disabled={buttonLoading[order.ticketNumber || ''] || buttonStates[order.ticketNumber || ''] === 'ready'}
                          onClick={() => handleNotify(order)}
                        >
                          {buttonLoading[order.ticketNumber || '']
                            ? 'Sending…'
                            : buttonStates[order.ticketNumber || ''] === 'received'
                            ? 'Order Placed'
                            : buttonStates[order.ticketNumber || ''] === 'ready'
                            ? 'Notified'
                            : 'Order Received'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {loading && (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        Loading orders…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && <div className="error-banner">{error}</div>}
          </section>
        </div>
    </main>

    {viewOrdersModalOpen && (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <p className="orders-kicker">All orders</p>
              <h2>Orders overview</h2>
              <p className="orders-subtitle">Snapshot of {orders.length} orders currently loaded.</p>
            </div>
            <button type="button" className="icon-button" onClick={() => setViewOrdersModalOpen(false)}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Service</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={`modal-${order._id || order.ticketNumber}`}>
                      <td>
                        <div className="table-title">{order.bookingId || '—'}</div>
                        <div className="table-sub">Ticket: {order.ticketNumber || '—'}</div>
                      </td>
                      <td>{order.serviceName || '—'}</td>
                      <td>
                        {(order.items || []).map((item, index) => (
                          <div key={`${order._id || order.ticketNumber}-${index}`} className="item-pill">
                            <span className="pill-name">{item.name || '—'}</span>
                            <span className="pill-qty"> × {item.quantity || 0}</span>
                            <span className="pill-price">{currency(item.price)}</span>
                          </div>
                        ))}
                        {(order.items || []).length === 0 && <div className="table-sub">No items.</div>}
                      </td>
                      <td>{currency(order.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {viewDetailOpen && selectedOrder && (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <p className="orders-kicker">Order detail</p>
              <h2>Booking {selectedOrder.bookingId || '—'}</h2>
              <p className="orders-subtitle">
                Ticket: {selectedOrder.ticketNumber || '—'} • {selectedOrder.serviceName || '—'} • {(selectedOrder.items || []).length} items
              </p>
            </div>
            <button type="button" className="icon-button" onClick={() => setViewDetailOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="modal-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={`${it?.id || it?.name || 'item'}-${idx}`}>
                      <td>{it?.name || '—'}</td>
                      <td>{it?.quantity || 0}</td>
                      <td>{currency(it?.price)}</td>
                    </tr>
                  ))}
                  {(selectedOrder.items || []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-state">No items.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    <style jsx>{`
      .orders-page {
        min-height: 100vh;
        width: 100%;
        padding: 48px 16px 64px;
        background: #f5f6fb;
        color: #111827;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .orders-shell {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      .orders-header {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 32px;
        padding: 32px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
      }
      .header-actions {
        display: flex;
        gap: 12px;
      }
      .view-orders-button {
        border: 1px solid #e5e7eb;
        background: #fff7ed;
        color: #c2410c;
        border-radius: 999px;
        padding: 12px 20px;
        font-weight: 600;
        cursor: pointer;
      }
      .orders-header h1 {
        margin: 8px 0 4px;
        font-size: 32px;
        font-weight: 600;
      }
      .orders-kicker {
        text-transform: uppercase;
        letter-spacing: 0.4em;
        font-size: 11px;
        color: #9ca3af;
      }
      .orders-subtitle {
        color: #6b7280;
        font-size: 14px;
      }
      .refresh-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        border-radius: 999px;
        padding: 12px 28px;
        font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        background: linear-gradient(90deg, #e50914, #ff6e40);
        box-shadow: 0 10px 20px rgba(244, 63, 94, 0.25);
        transition: filter 0.2s ease;
      }
      .refresh-button:hover {
        filter: brightness(1.08);
      }
      .refresh-button .spin {
        animation: spin 2s linear infinite;
      }
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .stat-card {
        border-radius: 24px;
        padding: 24px;
        background: #ffffff;
        border: 1px solid #f1f5f9;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
      }
      .stat-label {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 11px;
        color: #94a3b8;
      }
      .stat-value {
        margin-top: 12px;
        font-size: 30px;
        font-weight: 600;
      }
      .stat-accent {
        margin-top: 16px;
        height: 4px;
        border-radius: 999px;
      }
      .filters {
        padding: 20px;
        border-radius: 32px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08);
      }
      .search-box {
        flex: 1;
        min-width: 220px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .search-box input {
        flex: 1;
        background: transparent;
        border: none;
        color: #111827;
        font-size: 14px;
        outline: none;
      }
      .icon {
        width: 16px;
        height: 16px;
        color: #9ca3af;
      }
      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 8px 12px;
      }
      .filter-item select {
        background: transparent;
        border: none;
        color: #111827;
        font-size: 14px;
        outline: none;
      }
      .orders-table {
        border-radius: 32px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        box-shadow: 0 25px 60px rgba(15, 23, 42, 0.07);
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      thead {
        background: #f9fafb;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        color: #6b7280;
      }
      th,
      td {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        text-align: left;
      }
      tbody tr:hover {
        background: #f9fafb;
      }
      .table-title {
        font-weight: 600;
      }
      .table-sub {
        font-size: 12px;
        color: #6b7280;
      }
      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
      }
      .status-paid {
        background: rgba(16, 185, 129, 0.15);
        color: #047857;
      }
      .status-pending {
        background: rgba(251, 191, 36, 0.2);
        color: #92400e;
      }
      .status-empty {
        background: rgba(148, 163, 184, 0.2);
        color: #475569;
      }
      .table-actions button {
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #111827;
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        font-size: 14px;
        color: #9ca3af;
      }
      .error-banner {
        border-top: 1px solid #fee2e2;
        background: #fef2f2;
        color: #b91c1c;
        padding: 12px 24px;
        font-size: 14px;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 50;
      }
      .modal-card {
        width: 100%;
        max-width: 720px;
        border-radius: 32px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #111827;
        padding: 32px;
        box-shadow: 0 30px 70px rgba(15, 23, 42, 0.15);
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }
      .modal-header h2 {
        margin: 8px 0 4px;
        font-size: 24px;
      }
      .icon-button {
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        color: #6b7280;
        border-radius: 50%;
        padding: 8px;
        cursor: pointer;
      }
      .modal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
      }
      .modal-tile {
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        background: #f8fafc;
        padding: 16px;
      }
      .tile-label {
        text-transform: uppercase;
        letter-spacing: 0.25em;
        font-size: 10px;
        color: #94a3b8;
      }
      .tile-value {
        font-size: 20px;
        font-weight: 600;
        margin-top: 8px;
      }
      .tile-sub {
        font-size: 12px;
        color: #6b7280;
        margin-top: 6px;
      }
      .items-table {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .items-title {
        font-weight: 600;
      }
      .items-scroll {
        max-height: 260px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
      }
      .items-scroll table {
        width: 100%;
        font-size: 13px;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
      }
      .modal-actions button {
        border: 1px solid #e5e7eb;
        color: #111827;
        background: #f9fafb;
        border-radius: 999px;
        padding: 10px 26px;
        cursor: pointer;
      }
      @media (max-width: 768px) {
        .orders-header {
          flex-direction: column;
        }
        .filters {
          flex-direction: column;
        }
        .filter-item,
        .search-box {
          width: 100%;
        }
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .notify-button {
        border: none;
        border-radius: 999px;
        padding: 10px 18px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(90deg, #f97316, #fb923c);
        color: #fff;
        min-width: 140px;
      }
      .view-detail-button {
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        padding: 10px 16px;
        font-weight: 600;
        background: #f9fafb;
        color: #111827;
        margin-right: 8px;
      }
      .notify-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .modal-body {
        margin-top: 16px;
      }
      .modal-table-scroll {
        max-height: 420px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
      }
    `}</style>
  </>
  );
}
