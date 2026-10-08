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
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('energy_auth_token');
    const savedUser = localStorage.getItem('energy_app_user');
    return Boolean(token && savedUser);
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('energy_app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('energy_app_user');
    }
  }, [user]);

  const login = (userData, token) => {
    const authToken = token || userData?.token || `jwt_token_${userData?.id || 1}_${Date.now()}`;
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('energy_auth_token', authToken);
    localStorage.setItem('energy_app_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('energy_auth_token');
    localStorage.removeItem('energy_app_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  };

  // Helper method to dynamically switch roles for testing different role layouts
  const switchRole = (newRole) => {
    if (Object.values(ROLES).includes(newRole)) {
      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          role: newRole,
        };
      });
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
