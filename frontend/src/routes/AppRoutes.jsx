import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminBuildings from '../pages/AdminBuildings';
import AdminDepartments from '../pages/AdminDepartments';
import AdminLiveMonitoring from '../pages/AdminLiveMonitoring';
import AdminEnergyOptimization from '../pages/AdminEnergyOptimization';
import AdminReports from '../pages/AdminReports';
import AdminAlerts from '../pages/AdminAlerts';
import AdminUsers from '../pages/AdminUsers';
import AdminSensors from '../pages/AdminSensors';
import AdminSettings from '../pages/AdminSettings';
import AdminProfile from '../pages/AdminProfile';
import RoleRoute from './RoleRoute';
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
        <Route path="live-monitoring" element={<AdminLiveMonitoring />} />
        <Route path="ai-prediction" element={<PlaceholderPage title="AI Energy Prediction" />} />
        <Route path="optimization" element={<AdminEnergyOptimization />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="users" element={<RoleRoute allowedRoles={['Administrator']}><AdminUsers /></RoleRoute>} />
        <Route path="sensors" element={<RoleRoute allowedRoles={['Administrator', 'Electrician / Maintenance Staff']}><AdminSensors /></RoleRoute>} />
        <Route path="settings" element={<RoleRoute allowedRoles={['Administrator']}><AdminSettings /></RoleRoute>} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
