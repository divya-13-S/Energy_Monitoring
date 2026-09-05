import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  HOD: 'Department Staff (HOD)',
  ELECTRICIAN: 'Electrician / Maintenance Staff',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('energy_app_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) { return null; }
    }
    // Default initial mock state for development & foundation testing
    return {
      id: 'usr_001',
      name: 'Alexander Pierce',
      email: 'a.pierce@institution.edu',
      role: ROLES.ADMINISTRATOR,
      department: 'Central Facility Management',
      avatar: null,
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('energy_auth_token') || true; // true by default for foundation preview
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('energy_app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('energy_app_user');
    }
  }, [user]);

  const login = (userData, token = 'mock_jwt_token_123') => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('energy_auth_token', token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('energy_auth_token');
    localStorage.removeItem('energy_app_user');
  };

  // Helper method to dynamically switch roles for testing different role layouts
  const switchRole = (newRole) => {
    if (Object.values(ROLES).includes(newRole)) {
      setUser((prevUser) => ({
        ...prevUser,
        role: newRole,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated,
        login,
        logout,
        switchRole,
        ROLES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
