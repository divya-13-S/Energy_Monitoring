import React from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotification } from '../../../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell = ({ className = '' }) => {
  const { unreadCount, togglePanel, isOpen } = useNotification();

  return (
    <button
      className={`notification-bell-btn ${isOpen ? 'active' : ''} ${className}`}
      onClick={togglePanel}
      aria-label="Notifications"
    >
      <FiBell className="bell-icon" />
      {unreadCount > 0 && (
        <span className="bell-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
