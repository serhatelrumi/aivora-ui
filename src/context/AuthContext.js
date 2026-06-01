import React, { createContext, useContext, useState } from 'react';
import { getCurrentUser, isLoggedIn, logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(isLoggedIn() ? getCurrentUser() : null);

  const handleLogin = (data) => {
    setUser({
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      department: data.department,
    });
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
