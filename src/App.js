import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import trTR from 'antd/locale/tr_TR';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transfers from './pages/Transfers';
import Guvarse from './pages/Guvarse';
import Vardiya from './pages/Vardiya';
import Tolerans from './pages/Tolerans';
import Mizan from './pages/Mizan';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Alarms from './pages/Alarms';

const ThemedApp = () => {
  const { darkMode } = useTheme();
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#D4AF37',
          fontFamily: "'Poppins', sans-serif",
          borderRadius: 8,
          colorLink: '#D4AF37',
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/transfers" element={<Transfers />} />
                      <Route path="/guvarse" element={<Guvarse />} />
                      <Route path="/vardiya" element={<Vardiya />} />
                      <Route path="/tolerans" element={<Tolerans />} />
                      <Route path="/mizan" element={<Mizan />} />
                      <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron']}>
                          <Users />
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron']}>
                          <Reports />
                        </ProtectedRoute>
                      } />
                      <Route path="/alarms" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron']}>
                          <Alarms />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);

export default App;
