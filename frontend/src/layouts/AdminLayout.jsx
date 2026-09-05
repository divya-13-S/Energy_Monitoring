import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 992) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const handleLogout = () => {
    // Placeholder logout handler for frontend state
    console.log('Logging out administrator...');
  };

  return (
    <div className="admin-layout-root">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div
        className={`admin-layout-wrapper ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <AdminNavbar
          onToggleSidebar={handleToggleSidebar}
          title="Dashboard"
          breadcrumb="Home / Dashboard"
        />

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
