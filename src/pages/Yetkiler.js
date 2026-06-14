import React, { useState, useEffect } from 'react';
import { Table, Checkbox, Button, Tag, Alert, message, Space, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { getPermissions, savePermissions } from '../api/permissions';

const ROLE_LABEL = {
  patron: 'Patron',
  fabrika_muduru: 'Fabrika Müdürü',
  kasa: 'Kasa',
  departman_sorumlusu: 'Departman Sorumlusu',
  muhasebe: 'Muhasebe',
  satis: 'Satış',
};

const Yetkiler = () => {
  const { colors } = useTheme();

  const [catalog, setCatalog] = useState([]);
  const [roles, setRoles]     = useState([]);
  const [grants, setGrants]   = useState({});   // { role: Set(keys) }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPermissions();
      setCatalog(data.catalog || []);
      setRoles(data.roles || []);
      const g = {};
      (data.roles || []).forEach(r => { g[r] = new Set((data.matrix && data.matrix[r]) || []); });
      setGrants(g);
    } catch (e) { setError(e.message || 'Yetkiler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const toggle = (role, key) => {
    setGrants(prev => {
      const next = { ...prev };
      const s = new Set(next[role] || []);
      if (s.has(key)) s.delete(key); else s.add(key);
      next[role] = s;
      return next;
    });
  };

  // Bir rol sütununun tüm eylemlerini topluca aç/kapat
  const toggleAll = (role, checked) => {
    setGrants(prev => ({ ...prev, [role]: checked ? new Set(catalog.map(c => c.key)) : new Set() }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const matrix = {};
      roles.forEach(r => { matrix[r] = Array.from(grants[r] || []); });
      await savePermissions(matrix);
      message.success('Yetkiler kaydedildi.');
    } catch (e) { message.error(e.message || 'Kaydedilemedi.'); }
    finally { setBusy(false); }
  };

  const columns = [
    {
      title: 'Eylem', dataIndex: 'label', fixed: 'left', width: 240,
      render: (v, r) => (
        <span>
          <Tag color="default" style={{ marginRight: 6 }}>{r.group}</Tag>
          {v}
        </span>
      ),
    },
    ...roles.map(role => ({
      title: (
        <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600 }}>{ROLE_LABEL[role] || role}</div>
          <Checkbox
            style={{ marginTop: 2 }}
            indeterminate={
              (grants[role]?.size || 0) > 0 && (grants[role]?.size || 0) < catalog.length
            }
            checked={catalog.length > 0 && (grants[role]?.size || 0) === catalog.length}
            onChange={e => toggleAll(role, e.target.checked)}
          />
        </div>
      ),
      align: 'center', width: 130,
      render: (_, r) => (
        <Checkbox
          checked={grants[role]?.has(r.key) || false}
          onChange={() => toggle(role, r.key)}
        />
      ),
    })),
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Rol Yetkileri</h2>
          <p style={{ color: colors.subtext, fontSize: 12, margin: '4px 0 0' }}>
            Hangi rolün hangi eylemi yapabileceğini işaretleyin. <strong>Admin her zaman tam yetkilidir</strong> (listede yoktur).
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>Yenile</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={busy} onClick={save}>Kaydet</Button>
        </Space>
      </div>

      <div style={card}>
        <Table
          dataSource={catalog}
          columns={columns}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 240 + roles.length * 130 }}
          style={{ padding: '8px 0' }}
        />
      </div>
    </div>
  );
};

export default Yetkiler;
