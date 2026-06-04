import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import KasaStockPool from '../components/dashboard/KasaStockPool';
import RecentTransfersPool from '../components/dashboard/RecentTransfersPool';
import DepartmentStockPool from '../components/dashboard/DepartmentStockPool';
import DashboardAlarmsButton from '../components/dashboard/DashboardAlarmsButton';

const Dashboard = () => {
  const { colors } = useTheme();
  const refreshTick = useAutoRefresh();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>
          Kontrol Merkezi
        </h2>
        <DashboardAlarmsButton colors={colors} refreshTick={refreshTick} />
      </div>

      <KasaStockPool colors={colors} refreshTick={refreshTick} />
      <DepartmentStockPool colors={colors} refreshTick={refreshTick} />
      <RecentTransfersPool colors={colors} refreshTick={refreshTick} />
    </div>
  );
};

export default Dashboard;
