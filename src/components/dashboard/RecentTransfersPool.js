import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { listTransfers } from '../../api/transfers';
import { purityLabel } from '../../constants/goldCatalog';
import { DEPT_LABEL, fmt, fmtHas995 } from '../../utils/reportLabels';
import WidgetPool from './WidgetPool';
import TransferDetailDrawer from '../transfers/TransferDetailDrawer';
import { durumTagColor, transferDurumLabel } from '../../constants/transferStatus';

const TBL_FONT = 12;
const TBL_CELL = { fontSize: TBL_FONT, whiteSpace: 'nowrap' };
const tagStyle = { margin: 0, fontSize: TBL_FONT, lineHeight: '20px' };

const tblCol = (col) => ({
  ...col,
  onCell: () => ({ style: TBL_CELL }),
  onHeaderCell: () => ({ style: TBL_CELL }),
});

const rowStyle = (r) => {
  if (r.is_deleted) return { background: 'rgba(128,128,128,0.08)', opacity: 0.65, textDecoration: 'line-through' };
  if (r.is_modified && r.status === 'onaylandi') return { background: 'rgba(0,188,188,0.07)' };
  if (r.is_modified) return { background: 'rgba(250,140,0,0.08)' };
  return {};
};

const durumTag = (r) => {
  const color = durumTagColor(r);
  return (
    <Tag style={{ ...tagStyle, color: '#111214', background: color, borderColor: color }}>
      {transferDurumLabel(r)}
    </Tag>
  );
};

const sortRecent = (list) =>
  [...list]
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return (b.id || 0) - (a.id || 0);
    })
    .slice(0, 10);

const RecentTransfersPool = ({ colors, refreshTick = 0 }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [detailRec, setDetailRec] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFailed(false);
    try {
      const data = await listTransfers();
      setRows(sortRecent(Array.isArray(data) ? data : []));
    } catch {
      setFailed(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(refreshTick > 0); }, [load, refreshTick]);

  const columns = useMemo(() => [
    tblCol({
      title: '#',
      dataIndex: 'id',
      width: 48,
      render: (v) => <span style={{ color: colors.subtext }}>#{v}</span>,
    }),
    tblCol({
      title: 'Gönderen',
      dataIndex: 'from_department',
      width: 108,
      render: (v) => (
        <Tag color="orange" style={tagStyle}>{DEPT_LABEL[v] || v || 'Dış Kaynak'}</Tag>
      ),
    }),
    tblCol({
      title: 'Alıcı',
      dataIndex: 'to_department',
      width: 96,
      render: (v) => (
        <Tag color="blue" style={tagStyle}>{DEPT_LABEL[v] || v || 'Kasa'}</Tag>
      ),
    }),
    tblCol({
      title: 'Ayar',
      dataIndex: 'purity',
      width: 150,
      render: (_, r) => purityLabel(r.purity, r.color),
    }),
    tblCol({
      title: 'Ağırlık',
      dataIndex: 'weight_grams',
      width: 100,
      render: (v) => (
        <span style={{ color: colors.gold }}>
          {typeof v === 'number' ? `${fmt(v)} gr` : v}
        </span>
      ),
    }),
    tblCol({
      title: 'HAS',
      dataIndex: 'has_value',
      width: 88,
      render: (v) => (
        <span style={{ color: colors.gold }}>
          {v != null ? `${fmtHas995(v)} g` : '—'}
        </span>
      ),
    }),
    tblCol({
      title: 'Durum',
      dataIndex: 'status',
      width: 112,
      render: (_, r) => durumTag(r),
    }),
    tblCol({
      title: 'Saat',
      dataIndex: 'created_at',
      key: 'saat',
      width: 88,
      render: (v) => (
        <span style={{ color: colors.subtext }}>
          {v
            ? new Date(v).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
            : '—'}
        </span>
      ),
    }),
    tblCol({
      title: 'Tarih',
      dataIndex: 'created_at',
      key: 'tarih',
      width: 100,
      render: (v) => (
        <span style={{ color: colors.subtext }}>
          {v ? new Date(v).toLocaleDateString('tr-TR') : '—'}
        </span>
      ),
    }),
  ], [colors]);

  return (
    <WidgetPool
      title="Son 10 Transfer"
      colors={colors}
      headerExtra={(
        <Link to="/transfers" style={{ fontSize: 12, color: colors.gold }}>
          Tüm transferler
        </Link>
      )}
    >
      <div style={{
        background: colors.card,
        border: '1px solid ' + colors.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          onRow={(r) => ({
            style: { ...rowStyle(r), cursor: 'pointer' },
            onClick: () => setDetailRec(r),
          })}
          locale={{
            emptyText: failed
              ? 'Transferler yüklenemedi.'
              : 'Henüz transfer yok.',
          }}
          scroll={{ x: 960 }}
          tableLayout="fixed"
        />
      </div>

      <TransferDetailDrawer
        record={detailRec}
        onClose={() => setDetailRec(null)}
        colors={colors}
      />
    </WidgetPool>
  );
};

export default RecentTransfersPool;
