import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';
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

const AdminNavbar = ({ onToggleSidebar, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoutAction = () => {
    setShowProfileMenu(false);
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Profile Pill & Dropdown */}
        <div className="profile-pill-container" ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="profile-pill"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            title="User menu"
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

          {showProfileMenu && (
            <div className="admin-dropdown-menu" style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '200px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              padding: '6px 0'
            }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: 'var(--primary-text, #0f172a)' }}>
                  {user?.name || 'User'}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--secondary-text, #64748b)' }}>
                  {user?.email || ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/admin/profile');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: 'var(--primary-text, #0f172a)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <FiUser /> Profile
              </button>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e2e8f0)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={handleLogoutAction}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: '#ef4444',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
