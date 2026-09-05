import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminBuildings from '../pages/AdminBuildings';
import AdminDepartments from '../pages/AdminDepartments';
import PlaceholderPage from '../pages/PlaceholderPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect to Administrator Dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Administrator Console Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* Administrator Pages */}
        <Route path="buildings" element={<AdminBuildings />} />
        <Route path="departments" element={<AdminDepartments />} />
        
        {/* Other Module Placeholder Routes */}
        <Route path="live-monitoring" element={<PlaceholderPage title="Live Energy Monitoring" />} />
        <Route path="ai-prediction" element={<PlaceholderPage title="AI Energy Prediction" />} />
        <Route path="optimization" element={<PlaceholderPage title="Energy Optimization Suggestions" />} />
        <Route path="reports" element={<PlaceholderPage title="Energy Reports & Analytics" />} />
        <Route path="alerts" element={<PlaceholderPage title="System Alerts & Warnings" />} />
        <Route path="users" element={<PlaceholderPage title="User Access Control" />} />
        <Route path="sensors" element={<PlaceholderPage title="Sensor Management & Diagnostics" />} />
        <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
        <Route path="profile" element={<PlaceholderPage title="Administrator Profile" />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
