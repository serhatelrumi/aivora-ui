// GELEN TRANSFERLER (INCOMING TRANSFERS)
// Purpose: A department head reviews and confirms transfers addressed to
// their own department. The backend already scopes /transfers/pending to the
// user's department, so this page simply lists and confirms.

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Popconfirm, message, Empty } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { listPending, confirmTransfer } from '../api/transfers';
import { matPurColorStr } from '../constants/goldCatalog';

const DEPT_LABEL = {
  kasa: 'Kasa', ocak: 'Ocak', pres: 'Pres', kaynak: 'Kaynak',
  pres_montaj: 'Pres Montaj', cila: 'Cila', ayarevi: 'Ayar Evi', cnc: 'CNC',
  kaliphane: 'Kalıphane', dokum: 'Döküm', dokum_montaj: 'Döküm Montaj',
  ar_ge: 'AR-GE', halka_kilit: 'Halka Kilit', sarnel_kilit: 'Sarnel Kilit',
  zincir: 'Zincir', atolye: 'Atölye', top: 'Top',
};

// from_department === null means the transfer originates from the kasa.
const senderLabel = (r) => (r.from_department ? DEPT_LABEL[r.from_department] || r.from_department : 'Kasa');

const formatGrams = (g) =>
  `${Number(g).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gr`;

const GelenTransferler = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPending();
      setRows(data || []);
    } catch (e) {
      message.error(e.message || 'Transferler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doConfirm = async (id) => {
    setConfirmingId(id);
    try {
      await confirmTransfer(id);
      message.success(`Transfer #${id} onaylandı.`);
      load();
    } catch (e) {
      message.error(e.message || 'Onaylama başarısız.');
    } finally {
      setConfirmingId(null);
    }
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      width: 70,
      render: (id) => <strong style={{ color: colors.text }}>#{id}</strong>,
    },
    {
      title: 'Gönderen',
      key: 'from',
      render: (_, r) => <Tag color="gold">{senderLabel(r)}</Tag>,
    },
    {
      title: 'Materyal',
      key: 'mat',
      render: (_, r) => (
        <span style={{ color: colors.text, fontWeight: 500 }}>
          {matPurColorStr(r.material_type, r.purity, r.color)}
        </span>
      ),
    },
    {
      title: 'Gram',
      dataIndex: 'weight_grams',
      align: 'right',
      render: (g) => <span style={{ color: colors.text }}>{formatGrams(g)}</span>,
    },
    {
      title: 'Açıklama',
      dataIndex: 'notes',
      render: (n) =>
        n
          ? <span style={{ whiteSpace: 'pre-wrap', color: colors.subtext, fontSize: 13 }}>{n}</span>
          : <span style={{ color: colors.subtext }}>—</span>,
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 160,
      render: (_, r) => (
        <Popconfirm
          title="Transferi onayla"
          description={`${senderLabel(r)} → ${formatGrams(r.weight_grams)} ${matPurColorStr(r.material_type, r.purity, r.color)} departmanınıza eklenecek.`}
          okText="Evet, onayla"
          cancelText="Vazgeç"
          onConfirm={() => doConfirm(r.id)}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={confirmingId === r.id}
            style={{ background: colors.gold, borderColor: colors.gold, color: '#111214', fontWeight: 600 }}
          >
            Onayla
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, marginBottom: 24,
      }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>
            Gelen Transferler
          </h2>
          <div style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>
            {user?.department ? `${DEPT_LABEL[user.department] || user.department} departmanına onay bekleyen transferler` : 'Onay bekleyen transferler'}
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Yenile
        </Button>
      </div>

      <div style={{
        background: colors.card, border: `1px solid ${colors.border}`,
        borderRadius: 12, boxShadow: colors.cardShadow, padding: 8,
      }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: <Empty description="Onay bekleyen transfer yok." image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      </div>
    </div>
  );
};

export default GelenTransferler;
