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
import Takoz from './pages/Takoz';
import Vardiya from './pages/Vardiya';
import Borclar from './pages/Borclar';
import Yetkiler from './pages/Yetkiler';
import Tolerans from './pages/Tolerans';
import Mizan from './pages/Mizan';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Alarms from './pages/Alarms';
import Receteler from './pages/Receteler';
import MadenAyarlama from './pages/MadenAyarlama';
import GelenTransferler from './pages/GelenTransferler';

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
                      <Route path="/gelen-transferler" element={
                        <ProtectedRoute allowedRoles={['admin', 'departman_sorumlusu']}>
                          <GelenTransferler />
                        </ProtectedRoute>
                      } />
                      <Route path="/takoz" element={<Takoz />} />
                      <Route path="/vardiya" element={<Vardiya />} />
                      <Route path="/borclar" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron', 'fabrika_muduru']}>
                          <Borclar />
                        </ProtectedRoute>
                      } />
                      <Route path="/tolerans" element={<Tolerans />} />
                      <Route path="/yetkiler" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <Yetkiler />
                        </ProtectedRoute>
                      } />
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
                      <Route path="/receteler" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron', 'fabrika_muduru']}>
                          <Receteler />
                        </ProtectedRoute>
                      } />
                      <Route path="/maden-ayarlama" element={
                        <ProtectedRoute allowedRoles={['admin', 'patron', 'fabrika_muduru', 'kasa']}>
                          <MadenAyarlama />
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
