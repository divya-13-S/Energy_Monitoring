import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiServer,
  FiLayers,
  FiActivity,
  FiCpu,
  FiZap,
  FiBarChart2,
  FiAlertTriangle,
  FiUsers,
  FiRadio,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import './AdminSidebar.css';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
  { label: 'Buildings', path: '/admin/buildings', icon: FiServer },
  { label: 'Departments', path: '/admin/departments', icon: FiLayers },
  { label: 'Live Monitoring', path: '/admin/live-monitoring', icon: FiActivity },
  { label: 'AI Prediction', path: '/admin/ai-prediction', icon: FiCpu },
  { label: 'Energy Optimization', path: '/admin/optimization', icon: FiZap },
  { label: 'Reports', path: '/admin/reports', icon: FiBarChart2 },
  { label: 'Alerts', path: '/admin/alerts', icon: FiAlertTriangle },
  { label: 'User Management', path: '/admin/users', icon: FiUsers },
  { label: 'Sensor Management', path: '/admin/sensors', icon: FiRadio },
  { label: 'Settings', path: '/admin/settings', icon: FiSettings },
  { label: 'Profile', path: '/admin/profile', icon: FiUser },
];

const AdminSidebar = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
}) => {
  return (
    <>
      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-icon-wrapper">
              <FiZap className="brand-icon" />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">Smart Energy</span>
                <span className="brand-subtitle">Energy Management System</span>
              </div>
            )}
          </div>
          <button
            className="collapse-toggle-btn hide-mobile"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="nav-icon" />
                    {!isCollapsed && <span className="nav-text">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <FiLogOut className="logout-icon" />
            {!isCollapsed && <span className="logout-text">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
