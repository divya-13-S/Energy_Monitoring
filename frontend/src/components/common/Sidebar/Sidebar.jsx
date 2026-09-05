import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiActivity,
  FiServer,
  FiUsers,
  FiCpu,
  FiAlertCircle,
  FiBarChart2,
  FiSettings,
  FiSliders,
  FiHome,
  FiPieChart,
  FiTool,
  FiRadio,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const navItemsByRole = {
  Administrator: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    { label: 'Energy Monitoring', path: '/admin/monitoring', icon: FiActivity },
    { label: 'Buildings & Infra', path: '/admin/buildings', icon: FiServer },
    { label: 'Departments', path: '/admin/departments', icon: FiHome },
    { label: 'AI Optimization', path: '/admin/ai-optimization', icon: FiCpu },
    { label: 'Alerts & Anomalies', path: '/admin/alerts', icon: FiAlertCircle, badge: '3' },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: FiBarChart2 },
    { label: 'User Access', path: '/admin/users', icon: FiUsers },
    { label: 'Sensors & IoT', path: '/admin/sensors', icon: FiRadio },
  ],
  'Department Staff (HOD)': [
    { label: 'Department Overview', path: '/hod/dashboard', icon: FiGrid },
    { label: 'Room Energy Status', path: '/hod/rooms', icon: FiHome },
    { label: 'Budget & Allocation', path: '/hod/budget', icon: FiPieChart },
    { label: 'Department Alerts', path: '/hod/alerts', icon: FiAlertCircle },
    { label: 'Energy Reports', path: '/hod/reports', icon: FiBarChart2 },
  ],
  'Electrician / Maintenance Staff': [
    { label: 'Maintenance Control', path: '/electrician/dashboard', icon: FiTool },
    { label: 'Sensor Diagnostics', path: '/electrician/sensors', icon: FiRadio },
    { label: 'Faults & Alerts', path: '/electrician/alerts', icon: FiAlertCircle, badge: '5' },
    { label: 'Grid & Meter Status', path: '/electrician/meters', icon: FiZap },
  ],
};

const Sidebar = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const { role } = useAuth();
  const location = useLocation();

  const currentNav = navItemsByRole[role] || navItemsByRole.Administrator;

  return (
    <>
      {/* Overlay for mobile drawer */}
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="sidebar-role-indicator">
          <span className="role-label">{isCollapsed ? role?.[0] : role}</span>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="nav-icon" />
                    {!isCollapsed && <span className="nav-text">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed ? (
            <div className="sidebar-system-info">
              <span className="system-status-dot" />
              <div className="system-status-text">
                <span className="system-status-title">Smart Grid Live</span>
                <span className="system-status-ver">v1.0.0 Enterprise</span>
              </div>
            </div>
          ) : (
            <span className="system-status-dot centered" />
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
