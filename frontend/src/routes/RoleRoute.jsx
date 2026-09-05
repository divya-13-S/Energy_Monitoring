import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import ErrorState from '../components/common/ErrorState/ErrorState';

const roleHomeMap = {
  [ROLES.ADMINISTRATOR]: '/admin/dashboard',
  [ROLES.HOD]: '/hod/dashboard',
  [ROLES.ELECTRICIAN]: '/electrician/dashboard',
};

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    const fallbackPath = roleHomeMap[role] || '/login';
    return (
      <div className="p-8">
        <ErrorState
          title="Access Restricted"
          message={`Your current role (${role || 'Guest'}) does not have permission to view this section.`}
          onRetry={() => window.location.href = fallbackPath}
          retryLabel="Return to My Role Dashboard"
        />
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
