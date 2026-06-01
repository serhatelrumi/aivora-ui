import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Alert, Tabs, Switch, InputNumber,
  Space, Tooltip, Popconfirm, message, Badge, Row, Col,
} from 'antd';
import {
  CheckOutlined, SyncOutlined, BellOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  listAlarms, resolveAlarm, checkPendingAlarms,
  listAlarmSettings, updateAlarmSetting,
} from '../api/alarms';

const SEV_COLOR = { critical: 'red', warning: 'orange', info: 'blue' };
const SEV_LABEL = { critical: 'Kritik', warning: 'Uyarı', info: 'Bilgi' };

const TYPE_LABEL = {
  negative_balance:         'Negatif Bakiye',
  pending_transfer_timeout: 'Transfer Zaman Aşımı',
  large_transfer:           'Büyük Transfer',
};

const dtFmt = (v) =>
  v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/* ─────────────── ALARM LİSTESİ ─────────────── */
const AlarmList = ({ isAdmin, colors }) => {
  const [alarms, setAlarms]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [checking, setChecking]   = useState(false);
  const [showAll, setShowAll]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => { fetch(showAll); }, [showAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch = async (all = false) => {
    setLoading(true); setError(null);
    try {
      const data = await listAlarms(all);
      setAlarms(data);
    } catch (e) { setError(e.message || 'Alarmlar yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlarm(id);
      message.success('Alarm çözüldü.');
      fetch(showAll);
    } catch (e) { message.error(e.message || 'Çözme başarısız.'); }
  };

  const handleCheckPending = async () => {
    setChecking(true);
    try {
      const newAlarms = await checkPendingAlarms();
      message.info(`Kontrol tamamlandı. ${newAlarms.length} zaman aşımı alarmı.`);
      fetch(showAll);
    } catch (e) { message.error(e.message || 'Kontrol başarısız.'); }
    finally { setChecking(false); }
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      width: 55,
      render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span>,
    },
    {
      title: 'Tür',
      dataIndex: 'alarm_type',
      render: v => <Tag color="default">{TYPE_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Önem',
      dataIndex: 'severity',
      render: v => <Tag color={SEV_COLOR[v] || 'default'}>{SEV_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Detay',
      dataIndex: 'detail',
      ellipsis: true,
      render: v => <span style={{ color: colors.subtext, fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Transfer',
      dataIndex: 'related_transfer_id',
      width: 90,
      render: v => v ? <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> : '—',
    },
    {
      title: 'Departman',
      dataIndex: 'related_department',
      width: 120,
      render: v => v
        ? <Tag style={{ fontSize: 10 }}>{v}</Tag>
        : <span style={{ color: colors.subtext }}>—</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'is_resolved',
      width: 90,
      render: v => v
        ? <Badge status="success" text={<span style={{ color: '#52C41A', fontSize: 11 }}>Çözüldü</span>} />
        : <Badge status="error"   text={<span style={{ color: '#FF4D4F', fontSize: 11 }}>Açık</span>} />,
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      render: v => <span style={{ fontSize: 11, color: colors.subtext }}>{dtFmt(v)}</span>,
    },
    {
      title: 'Çözülme',
      dataIndex: 'resolved_at',
      render: v => <span style={{ fontSize: 11, color: colors.subtext }}>{dtFmt(v)}</span>,
    },
    isAdmin && {
      title: 'İşlem',
      width: 80,
      render: (_, r) => !r.is_resolved ? (
        <Popconfirm
          title="Bu alarm çözüldü olarak işaretlensin mi?"
          onConfirm={() => handleResolve(r.id)}
          okText="Evet"
          cancelText="Vazgeç"
        >
          <Tooltip title="Çözüldü olarak işaretle">
            <Button
              size="small"
              icon={<CheckOutlined />}
              style={{ background: '#52C41A', borderColor: '#52C41A', color: '#fff' }}
            />
          </Tooltip>
        </Popconfirm>
      ) : null,
    },
  ].filter(Boolean);

  const openCount = alarms.filter(a => !a.is_resolved).length;

  return (
    <div>
      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <span style={{ color: colors.subtext, fontSize: 13 }}>
            {showAll ? 'Tüm alarmlar' : 'Açık alarmlar'}
            {!showAll && openCount > 0 && (
              <Badge count={openCount} style={{ marginLeft: 8, backgroundColor: '#FF4D4F' }} />
            )}
          </span>
          <Switch
            checked={showAll}
            onChange={setShowAll}
            checkedChildren="Tümü"
            unCheckedChildren="Açıklar"
          />
        </Space>
        <Space wrap>
          <Button icon={<SyncOutlined />} onClick={() => fetch(showAll)} loading={loading}>
            Yenile
          </Button>
          {isAdmin && (
            <Button
              icon={<BellOutlined />}
              onClick={handleCheckPending}
              loading={checking}
            >
              Transfer Zaman Aşımı Kontrol
            </Button>
          )}
        </Space>
      </div>

      <Table
        dataSource={alarms}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: showAll ? 'Alarm yok' : 'Açık alarm yok' }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

/* ─────────────── ALARM AYARLARI ─────────────── */
const AlarmSettings = ({ colors }) => {
  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [error, setError]         = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true); setError(null);
    try { setSettings(await listAlarmSettings()); }
    catch (e) { setError(e.message || 'Ayarlar yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (alarmType, isActive) => {
    setSaving(p => ({ ...p, [alarmType]: true }));
    try {
      const updated = await updateAlarmSetting(alarmType, { is_active: isActive });
      setSettings(prev => prev.map(s => s.alarm_type === alarmType ? updated : s));
      message.success('Ayar güncellendi.');
    } catch (e) { message.error(e.message || 'Güncelleme başarısız.'); }
    finally { setSaving(p => ({ ...p, [alarmType]: false })); }
  };

  const handleThreshold = async (alarmType, threshold_value) => {
    if (threshold_value == null) return;
    setSaving(p => ({ ...p, [alarmType + '_th']: true }));
    try {
      const updated = await updateAlarmSetting(alarmType, { threshold_value });
      setSettings(prev => prev.map(s => s.alarm_type === alarmType ? updated : s));
      message.success('Eşik değeri güncellendi.');
    } catch (e) { message.error(e.message || 'Güncelleme başarısız.'); }
    finally { setSaving(p => ({ ...p, [alarmType + '_th']: false })); }
  };

  if (loading) return <div style={{ padding: 24, color: colors.subtext }}>Yükleniyor…</div>;
  if (error)   return <Alert message={error} type="error" />;

  return (
    <div>
      <Row gutter={[16, 16]}>
        {settings.map(s => (
          <Col key={s.alarm_type} xs={24} md={12} lg={8}>
            <div style={{
              background: colors.bg,
              border: '1px solid ' + (s.is_active ? colors.border : colors.subtext + '40'),
              borderRadius: 10, padding: '18px 20px',
              opacity: s.is_active ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>
                  {TYPE_LABEL[s.alarm_type] || s.alarm_type}
                </div>
                <Switch
                  checked={s.is_active}
                  onChange={(v) => handleToggle(s.alarm_type, v)}
                  loading={saving[s.alarm_type]}
                  checkedChildren="Aktif"
                  unCheckedChildren="Kapalı"
                />
              </div>

              {s.description && (
                <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 12 }}>
                  {s.description}
                </div>
              )}

              {s.threshold_value != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: colors.subtext, fontSize: 11, flexShrink: 0 }}>Eşik:</span>
                  <InputNumber
                    defaultValue={s.threshold_value}
                    min={0}
                    step={s.alarm_type === 'pending_transfer_timeout' ? 1 : 100}
                    precision={s.alarm_type === 'pending_transfer_timeout' ? 0 : 2}
                    suffix={s.alarm_type === 'pending_transfer_timeout' ? 'dk' : 'gr'}
                    size="small"
                    style={{ width: 120 }}
                    onBlur={(e) => handleThreshold(s.alarm_type, parseFloat(e.target.value))}
                    disabled={!s.is_active}
                  />
                  <Button
                    size="small"
                    loading={saving[s.alarm_type + '_th']}
                    onClick={(e) => {
                      const el = e.currentTarget.closest('[data-type]')?.querySelector('input');
                      if (el) handleThreshold(s.alarm_type, parseFloat(el.value));
                    }}
                    disabled={!s.is_active}
                  >
                    Kaydet
                  </Button>
                </div>
              )}

              <div style={{ color: colors.subtext, fontSize: 10, marginTop: 10 }}>
                Güncellendi: {dtFmt(s.updated_at)}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

/* ─────────────── ANA SAYFA ─────────────── */
const Alarms = () => {
  const { user }   = useAuth();
  const { colors } = useTheme();

  const isAdmin = user?.role === 'admin';

  const card = {
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    padding: 24,
  };

  const items = [
    {
      key: 'list',
      label: <span><BellOutlined /> Alarm Listesi</span>,
      children: <AlarmList isAdmin={isAdmin} colors={colors} />,
    },
    isAdmin && {
      key: 'settings',
      label: <span><SettingOutlined /> Alarm Ayarları</span>,
      children: <AlarmSettings colors={colors} />,
    },
  ].filter(Boolean);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>Alarmlar</h2>
        <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>
          Sistem alarmları ve eşik ayarları
        </p>
      </div>

      <div style={card}>
        <Tabs items={items} size="middle" />
      </div>
    </div>
  );
};

export default Alarms;
