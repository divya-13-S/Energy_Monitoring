import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../pages/auth/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import HodLayout from '../layouts/HodLayout';
import ElectricianLayout from '../layouts/ElectricianLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminBuildings from '../pages/AdminBuildings';
import AdminDepartments from '../pages/AdminDepartments';
import AdminLiveMonitoring from '../pages/AdminLiveMonitoring';
import AdminAIPrediction from '../pages/AdminAIPrediction';
import AdminEnergyOptimization from '../pages/AdminEnergyOptimization';
import AdminReports from '../pages/AdminReports';
import AdminAlerts from '../pages/AdminAlerts';
import AdminUsers from '../pages/AdminUsers';
import AdminSensors from '../pages/AdminSensors';
import AdminSettings from '../pages/AdminSettings';
import AdminProfile from '../pages/AdminProfile';
import HodDashboard from '../pages/HodDashboard';
import ElectricianDashboard from '../pages/ElectricianDashboard';

const getRoleHomePath = (role) => {
  if (role === ROLES.HOD) return '/hod/dashboard';
  if (role === ROLES.ELECTRICIAN) return '/electrician/dashboard';
  return '/admin/dashboard';
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

const CatchAllRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getRoleHomePath(user?.role)} replace />
          ) : (
            <AuthLayout />
          )
        }
      >
        <Route index element={<LoginPage />} />
      </Route>

      {/* Protected Administrator Console Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin">
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          
          {/* Role Protected Admin Sub-routes */}
          <Route path="buildings" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR]}><AdminBuildings /></RoleRoute>} />
          <Route path="departments" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR]}><AdminDepartments /></RoleRoute>} />
          <Route path="live-monitoring" element={<AdminLiveMonitoring />} />
          <Route path="ai-prediction" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR, ROLES.HOD]}><AdminAIPrediction /></RoleRoute>} />
          <Route path="optimization" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR, ROLES.HOD]}><AdminEnergyOptimization /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR, ROLES.HOD]}><AdminReports /></RoleRoute>} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="users" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR]}><AdminUsers /></RoleRoute>} />
          <Route path="sensors" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR, ROLES.ELECTRICIAN]}><AdminSensors /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute allowedRoles={[ROLES.ADMINISTRATOR]}><AdminSettings /></RoleRoute>} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Protected HOD Portal Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.HOD, ROLES.ADMINISTRATOR]}>
              <HodLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/hod">
          <Route index element={<Navigate to="/hod/dashboard" replace />} />
          <Route path="dashboard" element={<HodDashboard />} />
          <Route path="rooms" element={<AdminDepartments />} />
          <Route path="budget" element={<AdminReports />} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      {/* Protected Electrician Portal Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ELECTRICIAN, ROLES.ADMINISTRATOR]}>
              <ElectricianLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/electrician">
          <Route index element={<Navigate to="/electrician/dashboard" replace />} />
          <Route path="dashboard" element={<ElectricianDashboard />} />
          <Route path="sensors" element={<AdminSensors />} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="meters" element={<AdminLiveMonitoring />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
