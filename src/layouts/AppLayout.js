import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, SwapOutlined, ExperimentOutlined,
  FieldTimeOutlined, SettingOutlined, BarChartOutlined,
  SunOutlined, MoonOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  TeamOutlined, FileTextOutlined, BellOutlined,
  FireOutlined, BookOutlined, AccountBookOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { Sider, Content, Header } = Layout;

const ROLE_LABELS = {
  admin: 'Admin',
  patron: 'Patron',
  fabrika_muduru: 'Fabrika Müd.',
  kasa: 'Kasa',
  departman_sorumlusu: 'Dept. Sor.',
  muhasebe: 'Muhasebe',
  satis: 'Satış',
};

const formatBannerDate = (d) =>
  d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatBannerTime = (d) =>
  d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user, handleLogout } = useAuth();
  const { darkMode, toggleDarkMode, colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role;

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Kontrol Merkezi' },
  ];

  if (['admin', 'kasa'].includes(role)) {
    menuItems.push({ key: '/transfers', icon: <SwapOutlined />, label: 'Transferler' });
  }
  if (role === 'departman_sorumlusu') {
    menuItems.push({ key: '/gelen-transferler', icon: <SwapOutlined />, label: 'Gelen Transferler' });
  }
  if (['admin', 'patron', 'fabrika_muduru', 'departman_sorumlusu'].includes(role)) {
    menuItems.push({ key: '/takoz', icon: <ExperimentOutlined />, label: 'Takoz' });
  }
  if (['admin', 'patron', 'fabrika_muduru'].includes(role)) {
    menuItems.push({ key: '/vardiya', icon: <FieldTimeOutlined />, label: 'Vardiya' });
    menuItems.push({ key: '/borclar', icon: <AccountBookOutlined />, label: 'Bölüm Borçları' });
  }
  if (['admin', 'patron', 'fabrika_muduru', 'kasa'].includes(role)) {
    menuItems.push({ key: '/maden-ayarlama', icon: <FireOutlined />, label: 'Maden Ayarlama' });
  }
  if (['admin', 'patron', 'fabrika_muduru'].includes(role)) {
    menuItems.push({ key: '/receteler', icon: <BookOutlined />, label: 'Reçeteler' });
  }
  if (['admin', 'patron'].includes(role)) {
    menuItems.push({ key: '/mizan', icon: <BarChartOutlined />, label: 'Mizan' });
    menuItems.push({ key: '/reports', icon: <FileTextOutlined />, label: 'Raporlar' });
    menuItems.push({ key: '/alarms', icon: <BellOutlined />, label: 'Alarmlar' });
    menuItems.push({ key: '/users', icon: <TeamOutlined />, label: 'Kullanıcılar' });
    menuItems.push({ key: '/tolerans', icon: <SettingOutlined />, label: 'Tolerans' });
  }
  if (role === 'admin') {
    menuItems.push({ key: '/yetkiler', icon: <SafetyOutlined />, label: 'Yetkiler' });
  }

  const selectedKey = location.pathname === '/'
    ? '/'
    : '/' + location.pathname.split('/')[1];

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        collapsedWidth={72}
        collapsed={collapsed}
        style={{
          background: colors.sider,
          borderRight: '1px solid ' + colors.siderBorder,
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        trigger={null}
      >
        <div style={{
          padding: '0 12px',
          borderBottom: '1px solid ' + colors.siderBorder,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img
            src={darkMode ? '/Aivora_Logo2.png' : '/Aivora_Logo.png'}
            alt="Aivora"
            style={{ height: collapsed ? 22 : 30, objectFit: 'contain', transition: 'height 0.2s' }}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', marginTop: 8, fontFamily: "'Poppins', sans-serif" }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 220, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: colors.card,
          borderBottom: '1px solid ' + colors.border,
          padding: '0 24px 0 0',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          boxShadow: darkMode ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ height: 64, width: 64, fontSize: 16, color: colors.subtext }}
          />
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'right', marginRight: 20, lineHeight: 1.35, minWidth: 200 }}>
            <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>
              {formatBannerDate(now)}
            </div>
            <div style={{ color: colors.subtext, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {formatBannerTime(now)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip title={darkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}>
              <Button
                type="text"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleDarkMode}
                style={{ color: '#D4AF37', fontSize: 16 }}
              />
            </Tooltip>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#D4AF3720', border: '2px solid #D4AF3760',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#D4AF37', fontWeight: 700, flexShrink: 0,
              }}>
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>
                  {user?.full_name || user?.username}
                </div>
                <div style={{ color: '#D4AF37', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                  {ROLE_LABELS[role] || role}
                </div>
              </div>
            </div>
            <Tooltip title="Çıkış Yap">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: colors.subtext, fontSize: 14 }}
              />
            </Tooltip>
          </div>
        </Header>
        <Content style={{
          padding: 24,
          background: colors.bg,
          minHeight: 'calc(100vh - 64px)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
