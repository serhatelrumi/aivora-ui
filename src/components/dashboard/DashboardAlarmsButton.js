import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Table, Tag, Tooltip, Empty } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getActiveAlarms } from '../../api/dashboard';
import { DEPT_LABEL } from '../../utils/reportLabels';

const ALARM_VIEW_ROLES = ['admin', 'patron'];

const SEV_COLOR = { critical: 'red', warning: 'orange', info: 'blue' };
const SEV_LABEL = { critical: 'Kritik', warning: 'Uyarı', info: 'Bilgi' };
const TYPE_LABEL = {
  negative_balance: 'Negatif Bakiye',
  pending_transfer_timeout: 'Transfer Zaman Aşımı',
  large_transfer: 'Büyük Transfer',
};

const dtFmt = (v) =>
  (v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const DashboardAlarmsButton = ({ colors, refreshTick = 0 }) => {
  const { user } = useAuth();
  const role = user?.role;
  const canView = ALARM_VIEW_ROLES.includes(role);

  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!canView) return;
    if (!silent) setLoading(true);
    try {
      const data = await getActiveAlarms();
      setAlarms(Array.isArray(data) ? data : []);
    } catch {
      setAlarms([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [canView]);

  useEffect(() => { load(true); }, [load, refreshTick]);

  if (!canView) return null;

  const hasAlarms = alarms.length > 0;

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      width: 48,
      render: (v) => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span>,
    },
    {
      title: 'Tür',
      dataIndex: 'alarm_type',
      width: 140,
      render: (v) => <Tag style={{ fontSize: 11 }}>{TYPE_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Önem',
      dataIndex: 'severity',
      width: 80,
      render: (v) => <Tag color={SEV_COLOR[v] || 'default'}>{SEV_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Detay',
      dataIndex: 'detail',
      ellipsis: true,
      render: (v) => <span style={{ color: colors.subtext, fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Bölüm',
      dataIndex: 'related_department',
      width: 100,
      render: (v) => (v ? <Tag style={{ fontSize: 10 }}>{DEPT_LABEL[v] || v}</Tag> : '—'),
    },
    {
      title: 'Tarih',
      dataIndex: 'created_at',
      width: 128,
      render: (v) => <span style={{ fontSize: 11, color: colors.subtext }}>{dtFmt(v)}</span>,
    },
  ];

  return (
    <>
      <Tooltip title={hasAlarms ? `${alarms.length} aktif alarm` : 'Aktif alarm yok'}>
        <Button
          type="text"
          icon={<WarningOutlined />}
          onClick={() => {
            setOpen(true);
            load();
          }}
          style={{
            color: hasAlarms ? '#FF4D4F' : colors.subtext,
            fontSize: 22,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Aktif alarmlar"
        />
      </Tooltip>

      <Modal
        title={hasAlarms ? `Aktif Alarmlar (${alarms.length})` : 'Aktif Alarmlar'}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={720}
      >
        <Table
          dataSource={alarms}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          scroll={{ x: 600, y: 360 }}
          locale={{
            emptyText: <Empty description="Açık alarm yok" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Link to="/alarms" style={{ fontSize: 12, color: colors.gold }} onClick={() => setOpen(false)}>
            Tüm alarmlar →
          </Link>
        </div>
      </Modal>
    </>
  );
};

export default DashboardAlarmsButton;
