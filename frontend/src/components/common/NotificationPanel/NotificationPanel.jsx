import React from 'react';
import { FiX, FiCheckCircle, FiAlertTriangle, FiInfo, FiTrash2, FiCheck } from 'react-icons/fi';
import { useNotification } from '../../../context/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const {
    notifications,
    isOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotification();

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <FiAlertTriangle className="notif-icon danger" />;
      case 'warning': return <FiAlertTriangle className="notif-icon warning" />;
      case 'success': return <FiCheckCircle className="notif-icon success" />;
      default: return <FiInfo className="notif-icon info" />;
    }
  };

  return (
    <div className="notification-backdrop" onClick={closePanel}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header-title">
            <h3>Notifications</h3>
            <span className="notif-count-badge">{notifications.length}</span>
          </div>
          <div className="panel-header-actions">
            {notifications.some((n) => !n.read) && (
              <button className="panel-action-btn" onClick={markAllAsRead} title="Mark all read">
                <FiCheck /> Mark all read
              </button>
            )}
            <button className="panel-close-btn" onClick={closePanel} aria-label="Close">
              <FiX />
            </button>
          </div>
        </div>

        <div className="panel-body">
          {notifications.length === 0 ? (
            <div className="panel-empty">
              <FiInfo className="panel-empty-icon" />
              <p>No notifications right now.</p>
            </div>
          ) : (
            <ul className="notif-list">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`notif-item ${!item.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(item.id)}
                >
                  <div className="notif-icon-col">{getIcon(item.type)}</div>
                  <div className="notif-content-col">
                    <div className="notif-title-row">
                      <span className="notif-item-title">{item.title}</span>
                      <span className="notif-time">{item.timestamp}</span>
                    </div>
                    <p className="notif-item-message">{item.message}</p>
                  </div>
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    title="Remove"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
