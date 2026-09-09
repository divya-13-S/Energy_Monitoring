import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AdminNavbar.css';

const pageTitleMap = {
  '/admin/dashboard': { title: 'Dashboard', breadcrumb: 'Home / Dashboard' },
  '/admin/buildings': { title: 'Buildings', breadcrumb: 'Home / Buildings' },
  '/admin/departments': { title: 'Departments', breadcrumb: 'Home / Departments' },
  '/admin/live-monitoring': { title: 'Live Monitoring', breadcrumb: 'Home / Live Monitoring' },
  '/admin/ai-prediction': { title: 'AI Prediction', breadcrumb: 'Home / AI Prediction' },
  '/admin/optimization': { title: 'Energy Optimization', breadcrumb: 'Home / Energy Optimization' },
  '/admin/reports': { title: 'Reports', breadcrumb: 'Home / Reports' },
  '/admin/alerts': { title: 'Alerts', breadcrumb: 'Home / Alerts' },
  '/admin/users': { title: 'User Management', breadcrumb: 'Home / User Management' },
  '/admin/sensors': { title: 'Sensor Management', breadcrumb: 'Home / Sensor Management' },
  '/admin/settings': { title: 'Settings', breadcrumb: 'Home / Settings' },
  '/admin/profile': { title: 'Profile', breadcrumb: 'Home / Profile' },
};

const AdminNavbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const pageMeta = pageTitleMap[location.pathname] || {
    title: 'Dashboard',
    breadcrumb: 'Home / Dashboard',
  };

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const dateFormatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setCurrentDate(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitial = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="admin-navbar">
      <div className="navbar-left">
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FiMenu />
        </button>

        <div className="page-header-info">
          <div className="breadcrumb-text">{pageMeta.breadcrumb}</div>
          <h1 className="page-title">{pageMeta.title}</h1>
        </div>
      </div>

      <div className="navbar-right">
        {/* Date & Time Widget */}
        <div className="datetime-widget hide-mobile-sm">
          <span className="current-date">{currentDate}</span>
          <span className="datetime-divider">•</span>
          <span className="current-time">{currentTime}</span>
        </div>

        {/* Notification Bell */}
        <button className="notification-btn" aria-label="Notifications">
          <FiBell className="bell-icon" />
          <span className="notification-dot" />
        </button>

        {/* Profile Pill */}
        <div
          className="profile-pill"
          onClick={() => navigate('/admin/profile')}
          title="Click to view profile"
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar-circle">
            <span>{getInitial(user?.name)}</span>
          </div>
          <div className="user-details hide-mobile">
            <span className="user-name">{user?.name || 'Administrator'}</span>
            <span className="user-role">{role || user?.role || 'Administrator'}</span>
          </div>
          <FiChevronDown className="dropdown-arrow" />
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
