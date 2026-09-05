import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar/Navbar';
import Sidebar from '../components/common/Sidebar/Sidebar';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import './AdminLayout.css'; // Reuses modular layout CSS structure

const ElectricianLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 992) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="layout-root">
      <Navbar onToggleSidebar={toggleSidebar} title="Electrician & Maintenance Hub" />

      <div className="layout-body">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className={`layout-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="content-container animate-fade-in">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ElectricianLayout;
