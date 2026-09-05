import React from 'react';
import { FiSun, FiMoon, FiMenu, FiSearch, FiZap, FiLogOut, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import Avatar from '../Avatar/Avatar';
import Badge from '../Badge/Badge';
import './Navbar.css';

const Navbar = ({ onToggleSidebar, title = 'Smart Energy System' }) => {
  const { user, role, logout, switchRole, ROLES } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button
          className="navbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
        >
          <FiMenu />
        </button>
        <div className="navbar-brand">
          <div className="brand-logo-glow">
            <FiZap className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">EnergyOptix</span>
            <span className="brand-subtitle">{title}</span>
          </div>
        </div>
      </div>

      <div className="navbar-center hide-mobile">
        <div className="navbar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search meters, buildings, alerts..."
            className="search-input"
          />
        </div>
      </div>

      <div className="navbar-right">
        {/* Theme Switcher Button */}
        <button
          className="navbar-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <FiSun className="theme-icon sun" /> : <FiMoon className="theme-icon moon" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Role Switcher & Profile Dropdown */}
        <div className="navbar-profile-dropdown">
          <div className="profile-trigger">
            <Avatar name={user?.name || 'User'} status="online" size="sm" />
            <div className="profile-info hide-mobile">
              <span className="profile-name">{user?.name}</span>
              <Badge variant="cyan" size="sm">
                {role}
              </Badge>
            </div>
          </div>

          <div className="profile-menu">
            <div className="menu-header">
              <p className="menu-user-name">{user?.name}</p>
              <p className="menu-user-email">{user?.email}</p>
            </div>

            <div className="menu-divider" />
            <div className="menu-role-section">
              <span className="menu-section-label">Switch Layout Role:</span>
              <button
                className={`menu-role-btn ${role === ROLES.ADMINISTRATOR ? 'active' : ''}`}
                onClick={() => switchRole(ROLES.ADMINISTRATOR)}
              >
                <FiUserCheck /> Administrator
              </button>
              <button
                className={`menu-role-btn ${role === ROLES.HOD ? 'active' : ''}`}
                onClick={() => switchRole(ROLES.HOD)}
              >
                <FiUserCheck /> Department Staff (HOD)
              </button>
              <button
                className={`menu-role-btn ${role === ROLES.ELECTRICIAN ? 'active' : ''}`}
                onClick={() => switchRole(ROLES.ELECTRICIAN)}
              >
                <FiUserCheck /> Electrician / Maintenance
              </button>
            </div>

            <div className="menu-divider" />
            <button className="menu-logout-btn" onClick={logout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Render Notification Drawer */}
      <NotificationPanel />
    </header>
  );
};

export default Navbar;
