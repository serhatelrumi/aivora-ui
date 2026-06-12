import React, { useEffect, useState } from 'react';
import {
  Drawer, Tag, Table, Collapse, Button, Spin, Tooltip, Alert,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { DEPT_LABEL, fmt } from '../../utils/reportLabels';
import { vardiyaRenkConfig } from '../../constants/vardiyaStatus';
import { listKapanisByDept } from '../../api/vardiya';
import DeptStockTable from '../dashboard/DeptStockTable';

const KAPANIS_DURUM = { ONAYLANDI: 'Onaylandı', onaylandi: 'Onaylandı', KAPALI: 'Kapalı' };

const VardiyaDetailDrawer = ({
  record,
  onClose,
  colors,
  balanceMap,
  todayGuvarse = [],
  onRequestClose,
}) => {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!record?.department) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    listKapanisByDept(record.department)
      .then((rows) => { if (!cancelled) setHistory(rows || []); })
      .catch(() => { if (!cancelled) setHistory([]); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [record?.department]);

  const r = record;
  const renk = r ? vardiyaRenkConfig(r.renk) : null;
  const labelStyle = { fontSize: 10, color: colors.subtext, letterSpacing: 1, marginBottom: 2 };
  const metric = (label, value, valueColor) => (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: valueColor || colors.text }}>{value}</div>
    </div>
  );

  const guvarseColumns = [
    { title: '#', dataIndex: 'id', width: 48, render: (v) => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
    { title: 'Gram', dataIndex: 'gram', render: (v) => <span style={{ fontWeight: 600 }}>{fmt(v)} gr</span> },
    {
      title: 'Tahmini Ayar',
      dataIndex: 'tahmini_ayar',
      render: (v) => (v != null ? `${(v * 100).toFixed(2)}%` : '—'),
    },
    {
      title: 'Tahmini HAS',
      dataIndex: 'tahmini_has_degeri',
      render: (v) => <span style={{ color: '#52C41A', fontWeight: 600 }}>{v != null ? `${fmt(v)} g` : '—'}</span>,
    },
    {
      title: 'Vardiya',
      dataIndex: 'vardiya_kapanis_id',
      render: (v) => (v ? <Tag color="cyan">#{v}</Tag> : <span style={{ color: colors.subtext, fontSize: 11 }}>Açık</span>),
    },
  ];

  const historyColumns = [
    { title: '#', dataIndex: 'id', width: 48, render: (v) => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
    { title: 'Tarih', dataIndex: 'tarih' },
    { title: 'HAS Borcu', dataIndex: 'toplam_tahmini_has_borcu', render: (v) => `${fmt(v)} g` },
    { title: 'Güverse', dataIndex: 'guvarse_tahmini_has_karsiligi', render: (v) => <span style={{ color: '#52C41A' }}>{fmt(v)} g</span> },
    {
      title: 'Net Fark',
      dataIndex: 'net_fark',
      render: (v) => (
        <span style={{ color: Math.abs(v) < 0.1 ? '#52C41A' : '#FAAD14', fontWeight: 600 }}>
          {fmt(v)} g
        </span>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'durum',
      render: (v) => <Tag color="success">{KAPANIS_DURUM[v] || v}</Tag>,
    },
  ];

  return (
    <Drawer
      title={r ? DEPT_LABEL[r.department] || r.department : ''}
      open={!!r}
      onClose={onClose}
      placement="right"
      width={520}
      styles={{ body: { padding: '16px 20px' } }}
      extra={r && r.kapanabilir && (
        <Tooltip title="Vardiyayı kapat">
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => onRequestClose(r)}
            style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#111214' }}
          >
            Kapat
          </Button>
        </Tooltip>
      )}
    >
      {r && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: renk.hex,
                flexShrink: 0,
              }}
            />
            <Tag style={{ color: '#111214', background: renk.hex, borderColor: renk.hex, margin: 0 }}>
              {renk.label}
            </Tag>
            {r.hareket_yok && <Tag style={{ margin: 0 }}>Boş gün</Tag>}
            {r.mizan_id && <Tag color="blue">Mizan #{r.mizan_id}</Tag>}
            <span style={{ color: colors.subtext, fontSize: 12, marginLeft: 'auto' }}>{r.tarih}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 16px',
              marginBottom: 20,
              padding: '12px 16px',
              background: colors.bg,
              borderRadius: 8,
            }}
          >
            {metric('GÜNCEL HAS', `${fmt(r.has_borcu)} g`, renk.hex)}
            {metric('GÜVERSE', `${fmt(r.guvarse_karsiligi)} g`, '#52C41A')}
            {metric(
              'NET FARK',
              `${fmt(r.net_fark)} g`,
              Math.abs(r.net_fark) < 0.1 ? '#52C41A' : '#FAAD14',
            )}
            {metric('TOLERANS', r.tolerance_esigi != null ? `${fmt(r.tolerance_esigi)} g` : '—')}
          </div>

          {r.hareket_yok && r.kapanabilir && (
            <Alert
              type="info"
              showIcon
              message="Boş gün"
              description="Stok ve güverse kaydı yok. Vardiya kapanışı yapılabilir."
              style={{ marginBottom: 20 }}
            />
          )}
          {r.renk === 'sari' && !r.hareket_yok && !r.kapanabilir && (
            <Alert
              type="warning"
              showIcon
              message="Vardiya kapanışı için bugün transfer onayı gerekli"
              description="Güncel fark tolerans içinde; kapanış yapılabilmesi için bugün en az bir transfer onayı ile vardiya kaydı açılmalıdır."
              style={{ marginBottom: 20 }}
            />
          )}

          <Collapse
            ghost
            items={[
              {
                key: 'stock',
                label: <span style={{ fontWeight: 600, fontSize: 13 }}>Departman Stoğu</span>,
                children: (
                  <DeptStockTable
                    lines={balanceMap[r.department]}
                    colors={colors}
                    showFooter={false}
                  />
                ),
              },
            ]}
            style={{ marginBottom: 20 }}
          />

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: colors.text }}>
              Bugünkü Güverse Kayıtları
            </div>
            <Table
              dataSource={todayGuvarse}
              columns={guvarseColumns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: 'Bugün güverse kaydı yok' }}
              scroll={{ x: 400 }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: colors.text }}>
              Geçmiş Kapanışlar
            </div>
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : (
              <Table
                dataSource={history}
                columns={historyColumns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
                locale={{ emptyText: 'Kapanış kaydı bulunamadı' }}
                scroll={{ x: 480 }}
              />
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default VardiyaDetailDrawer;
