import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import './AuthLayout.css';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-bg-gradient" />
      <div className="auth-container">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <FiZap className="auth-logo-icon" />
          </div>
          <h1 className="auth-system-title">Smart Energy System</h1>
          <p className="auth-system-subtitle">
            AI-Based Smart Energy Monitoring & Optimization for Educational Institutions
          </p>
        </div>

        <div className="auth-card">
          <Outlet />
        </div>

        <footer className="auth-footer">
          <p>&copy; 2026 Smart Energy System. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
