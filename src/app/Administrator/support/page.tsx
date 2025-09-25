'use client';

import { useState } from 'react';
import { Mail, Send, Reply, Archive, Trash2 } from 'lucide-react';

export default function SupportPage() {
  const [emails] = useState([
    {
      id: 1,
      from: 'customer@example.com',
      subject: 'Booking Issue - Theater 1',
      message: 'I am having trouble with my booking for Theater 1 on January 15th. The payment went through but I did not receive a confirmation email.',
      date: '2024-01-10',
      status: 'Unread',
      priority: 'High'
    },
    {
      id: 2,
      from: 'support@example.com',
      subject: 'Re: Theater Availability',
      message: 'Thank you for your inquiry. Theater 2 is available for your requested date. Please let us know if you would like to proceed with the booking.',
      date: '2024-01-09',
      status: 'Read',
      priority: 'Medium'
    },
    {
      id: 3,
      from: 'manager@example.com',
      subject: 'Monthly Report',
      message: 'Please find attached the monthly booking report for December 2023. All theaters performed well with 95% occupancy rate.',
      date: '2024-01-08',
      status: 'Read',
      priority: 'Low'
    }
  ]);

  const [selectedEmail, setSelectedEmail] = useState(emails[0]);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    // In a real app, this would send the reply
    console.log('Sending reply:', replyText);
    setReplyText('');
  };

  return (
    <div className="support-page">
      <div className="page-header">
        <h1>Support Mail</h1>
        <p>Manage customer support emails and inquiries</p>
      </div>

      <div className="support-layout">
        <div className="email-list">
          <div className="email-list-header">
            <h3>Inbox</h3>
            <div className="email-actions">
              <button className="action-btn">
                <Archive size={16} />
                Archive
              </button>
              <button className="action-btn">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
          
          <div className="email-items">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`email-item ${selectedEmail.id === email.id ? 'selected' : ''} ${email.status === 'Unread' ? 'unread' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="email-header">
                  <div className="email-from">{email.from}</div>
                  <div className="email-date">{email.date}</div>
                </div>
                <div className="email-subject">{email.subject}</div>
                <div className="email-preview">
                  {email.message.substring(0, 100)}...
                </div>
                <div className="email-meta">
                  <span className={`priority-badge ${email.priority.toLowerCase()}`}>
                    {email.priority}
                  </span>
                  <span className={`status-badge ${email.status.toLowerCase()}`}>
                    {email.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="email-content">
          <div className="email-detail">
            <div className="email-detail-header">
              <div className="email-info">
                <h3>{selectedEmail.subject}</h3>
                <div className="email-meta-info">
                  <span>From: {selectedEmail.from}</span>
                  <span>Date: {selectedEmail.date}</span>
                </div>
              </div>
              <div className="email-detail-actions">
                <button className="action-btn reply-btn">
                  <Reply size={16} />
                  Reply
                </button>
                <button className="action-btn forward-btn">
                  <Send size={16} />
                  Forward
                </button>
              </div>
            </div>
            
            <div className="email-body">
              <p>{selectedEmail.message}</p>
            </div>
          </div>

          <div className="reply-section">
            <h4>Reply to {selectedEmail.from}</h4>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={6}
            />
            <div className="reply-actions">
              <button className="send-btn" onClick={handleReply}>
                <Send size={16} />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .support-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .page-header p {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .support-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          height: calc(100vh - 200px);
        }

        .email-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }

        .email-list-header {
          padding: 1.5rem;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .email-list-header h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .email-actions {
          display: flex;
          gap: 0.5rem;
        }

        .email-items {
          flex: 1;
          overflow-y: auto;
        }

        .email-item {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .email-item:hover {
          background: #f8f9fa;
        }

        .email-item.selected {
          background: #e3f2fd;
          border-left: 4px solid var(--accent-color);
        }

        .email-item.unread {
          background: #fff3e0;
        }

        .email-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .email-from {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
        }

        .email-date {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.8rem;
          color: #666;
        }

        .email-subject {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .email-preview {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .email-meta {
          display: flex;
          gap: 0.5rem;
        }

        .priority-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .priority-badge.high {
          background: #ffebee;
          color: #c62828;
        }

        .priority-badge.medium {
          background: #fff3e0;
          color: #ef6c00;
        }

        .priority-badge.low {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .status-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.unread {
          background: #e3f2fd;
          color: #1565c0;
        }

        .status-badge.read {
          background: #f1f8e9;
          color: #558b2f;
        }

        .email-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }

        .email-detail {
          flex: 1;
          padding: 1.5rem;
          border-bottom: 1px solid #dee2e6;
        }

        .email-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .email-info h3 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .email-meta-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .email-meta-info span {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #666;
        }

        .email-detail-actions {
          display: flex;
          gap: 0.5rem;
        }

        .email-body {
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 1rem;
          line-height: 1.6;
          color: #333;
        }

        .reply-section {
          padding: 1.5rem;
        }

        .reply-section h4 {
          font-family: 'Paralucent-DemiBold', Arial, Helvetica, sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 1rem 0;
        }

        .reply-section textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          resize: vertical;
          margin-bottom: 1rem;
        }

        .reply-actions {
          display: flex;
          justify-content: flex-end;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Paralucent-Medium', Arial, Helvetica, sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .reply-btn {
          background: #007bff;
          color: white;
        }

        .reply-btn:hover {
          background: #0056b3;
        }

        .forward-btn {
          background: #6c757d;
          color: white;
        }

        .forward-btn:hover {
          background: #545b62;
        }

        .send-btn {
          background: var(--accent-color);
          color: white;
        }

        .send-btn:hover {
          background: var(--accent-hover);
        }

        @media (max-width: 768px) {
          .support-page {
            padding: 1rem;
          }

          .support-layout {
            grid-template-columns: 1fr;
            height: auto;
          }

          .email-list {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
