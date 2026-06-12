// AUTH API
// Purpose: Login and logout functions

import { post } from './client';

export const login = async (username, password) => {
  const data = await post('/auth/login', { username, password });

  // Save token and user info to localStorage
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify({
    username: data.username,
    full_name: data.full_name,
    role: data.role,
    department: data.department,
  }));

  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => !!localStorage.getItem('token');
