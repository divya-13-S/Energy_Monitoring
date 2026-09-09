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
    const defaultUser = {
      id: 1,
      name: 'Administrator',
      email: 'admin@campus.edu',
      role: ROLES.ADMINISTRATOR,
      department: 'Central Facility Management',
      avatar: null,
    };
    localStorage.setItem('energy_app_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    let token = localStorage.getItem('energy_auth_token');
    if (!token) {
      token = 'jwt_token_1_1725892800';
      localStorage.setItem('energy_auth_token', token);
    }
    return true;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('energy_app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('energy_app_user');
    }
  }, [user]);

  const login = (userData, token = 'jwt_token_1_1725892800') => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('energy_auth_token', token || `jwt_token_${userData?.id || 1}_${Date.now()}`);
    localStorage.setItem('energy_app_user', JSON.stringify(userData));
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
