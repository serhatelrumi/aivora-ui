import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Switch, Spin } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBalances, getDeptBalance } from '../../api/dashboard';
import { DEPT_LABEL } from '../../utils/reportLabels';
import {
  groupAltinByDepartment,
  buildDeptStockCards,
  PRODUCTION_DEPARTMENTS,
} from '../../utils/balanceDisplay';
import WidgetPool from './WidgetPool';
import DeptStockTable from './DeptStockTable';

const FULL_ACCESS_ROLES = ['admin', 'patron', 'fabrika_muduru'];
const DEPT_ROLE = 'departman_sorumlusu';

const DepartmentStockPool = ({ colors, refreshTick = 0 }) => {
  const { user } = useAuth();
  const role = user?.role;

  const [balanceMap, setBalanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const canView =
    FULL_ACCESS_ROLES.includes(role) ||
    (role === DEPT_ROLE && user?.department && user.department !== 'kasa');

  const load = useCallback(async (silent = false) => {
    if (!canView) return;
    if (!silent) setLoading(true);
    setFailed(false);
    try {
      let balances = [];
      if (FULL_ACCESS_ROLES.includes(role)) {
        balances = await getAllBalances();
      } else if (role === DEPT_ROLE && user?.department) {
        balances = await getDeptBalance(user.department);
      }
      setBalanceMap(groupAltinByDepartment(balances, { excludeKasa: true }));
    } catch {
      setFailed(true);
      setBalanceMap({});
    } finally {
      setLoading(false);
    }
  }, [canView, role, user?.department]);

  useEffect(() => { load(refreshTick > 0); }, [load, refreshTick]);

  const cards = useMemo(
    () => buildDeptStockCards(balanceMap, {
      showEmpty,
      deptOrder: role === DEPT_ROLE && user?.department
        ? [user.department]
        : PRODUCTION_DEPARTMENTS,
    }),
    [balanceMap, showEmpty, role, user?.department],
  );

  if (!canView) return null;

  const cardStyle = {
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    boxShadow: colors.cardShadow,
    padding: '16px 18px',
    height: '100%',
  };

  return (
    <WidgetPool
      title="Bölüm Stokları"
      subtitle="Bölüm bazında ayarlı altın ve HAS karşılıkları (kasa hariç)"
      colors={colors}
      headerExtra={
        FULL_ACCESS_ROLES.includes(role) ? (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: colors.subtext,
            fontSize: 12,
            cursor: 'pointer',
          }}>
            <Switch size="small" checked={showEmpty} onChange={setShowEmpty} disabled={loading} />
            Boş bölümleri göster
          </label>
        ) : null
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : failed ? (
        <div style={{ color: colors.subtext, fontSize: 13, textAlign: 'center', padding: 24 }}>
          Bölüm stokları yüklenemedi.
        </div>
      ) : cards.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, fontSize: 13 }}>
          Stoklu bölüm yok.
        </div>
      ) : (
        <Row gutter={[12, 12]}>
          {cards.map((c) => (
            <Col key={c.department} xs={24} sm={12} md={8} lg={6}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AppstoreOutlined style={{ color: colors.gold, fontSize: 18, flexShrink: 0 }} />
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: 15 }}>
                    {DEPT_LABEL[c.department] || c.department}
                  </span>
                </div>
                <DeptStockTable lines={c.lines} colors={colors} />
              </div>
            </Col>
          ))}
        </Row>
      )}
    </WidgetPool>
  );
};

export default DepartmentStockPool;
