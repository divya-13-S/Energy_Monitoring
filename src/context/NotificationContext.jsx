import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

const initialNotifications = [
  {
    id: 'notif_1',
    title: 'High Consumption Alert',
    message: 'Block B Electrical Lab consumption exceeded threshold by 24% in peak hours.',
    type: 'warning',
    timestamp: '10 mins ago',
    read: false,
    link: '/alerts',
  },
  {
    id: 'notif_2',
    title: 'Solar Grid Sync Complete',
    message: 'Main Roof Solar PV array generated 420 kWh today. Efficiency +12%.',
    type: 'success',
    timestamp: '1 hour ago',
    read: false,
    link: '/monitoring',
  },
  {
    id: 'notif_3',
    title: 'Transformer Maintenance Required',
    message: 'Substation 3 temperature anomaly reported by IoT sensor #TF-04.',
    type: 'danger',
    timestamp: '3 hours ago',
    read: true,
    link: '/maintenance',
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const togglePanel = () => setIsOpen((prev) => !prev);
  const closePanel = () => setIsOpen(false);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      timestamp: 'Just now',
      read: false,
      type: 'info',
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        togglePanel,
        closePanel,
        markAsRead,
        markAllAsRead,
        removeNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
