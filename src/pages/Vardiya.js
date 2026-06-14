import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Tag, Modal, Spin, Alert, message, Tooltip, Select, Space, Row, Col,
} from 'antd';
import { CheckCircleOutlined, ReloadOutlined, UndoOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getVardiyaDurum, createVardiyaKapanis, reopenVardiyaKapanis } from '../api/vardiya';
import { listAllTakoz, deleteTakoz } from '../api/takoz';
import { closeOperatingDay } from '../api/reports';
import { getAllBalances } from '../api/dashboard';
import { groupAltinByDepartment } from '../utils/balanceDisplay';
import { DEPT_LABEL, fmt } from '../utils/reportLabels';
import { VARDIYA_RENK, VARDIYA_RENK_FILTER, vardiyaRenkConfig } from '../constants/vardiyaStatus';
import VardiyaDetailDrawer from '../components/vardiya/VardiyaDetailDrawer';

const StatusDot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }}
    aria-hidden
  />
);

const Vardiya = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [durum, setDurum] = useState([]);
  const [balanceMap, setBalanceMap] = useState({});
  const [takozAll, setTakozAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renkFilter, setRenkFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmCtx, setConfirmCtx] = useState(null);
  const [busy, setBusy] = useState(false);

  const card = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    boxShadow: colors.cardShadow,
  };

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    let fetchError = null;
    try {
      const d = await getVardiyaDurum();
      setDurum(d || []);
      if (!d?.length) fetchError = 'Vardiya verisi alınamadı.';
    } catch (e) {
      setDurum([]);
      fetchError = e.message || 'Vardiya verisi alınamadı.';
    }
    try {
      const [bals, guv] = await Promise.all([
        getAllBalances().catch(() => []),
        listAllTakoz().catch(() => []),
      ]);
      setBalanceMap(groupAltinByDepartment(bals || [], { excludeKasa: true }));
      setTakozAll(guv || []);
    } catch {
      if (!fetchError) fetchError = 'Ek veriler yüklenemedi.';
    }
    if (fetchError) setError(fetchError);
    setLoading(false);
  };

  const takozByDept = useMemo(() => {
    const map = {};
    takozAll
      .filter((g) => g.tarih === today)
      .forEach((g) => {
        if (!map[g.department]) map[g.department] = [];
        map[g.department].push(g);
      });
    return map;
  }, [takozAll, today]);

  const filtered = useMemo(() => {
    const rows = [...durum].sort((a, b) =>
      (DEPT_LABEL[a.department] || a.department).localeCompare(
        DEPT_LABEL[b.department] || b.department,
        'tr',
      ),
    );
    if (!renkFilter) return rows;
    return rows.filter((d) => d.renk === renkFilter);
  }, [durum, renkFilter]);

  const summary = useMemo(
    () => durum.reduce((acc, d) => {
      acc[d.renk] = (acc[d.renk] || 0) + 1;
      return acc;
    }, {}),
    [durum],
  );

  const doKapat = async () => {
    if (!confirmCtx) return;
    setBusy(true);
    try {
      await createVardiyaKapanis(confirmCtx.department);
      message.success(`${DEPT_LABEL[confirmCtx.department] || confirmCtx.department} vardiyası kapatıldı.`);
      setConfirmCtx(null);
      setSelected(null);
      fetchAll();
    } catch (e) {
      message.error(e.message || 'Vardiya kapatılamadı.');
    } finally {
      setBusy(false);
    }
  };

  const requestClose = (row) => setConfirmCtx(row);

  // Gün kapatılabilir: HER bölüm tek tek kapatılmış (yesil/mavi) olmalı — boş bölümler dahil.
  const closedCount = durum.filter(d => ['yesil', 'mavi'].includes(d.renk)).length;
  const canCloseDay = durum.length > 0 && closedCount === durum.length;

  const doCloseDay = () => {
    Modal.confirm({
      title: 'Günü Kapat',
      content: 'Tüm bölümler kapandı. Günü kapatmak aktif transferleri arşivler ve günü kilitler. Onaylıyor musunuz?',
      okText: 'Evet, Günü Kapat',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await closeOperatingDay(today);
          message.success(`Gün kapatıldı — ${res.archived_count} transfer arşivlendi.`);
          fetchAll();
        } catch (e) { message.error(e.message || 'Gün kapatılamadı.'); }
      },
    });
  };

  const doDeleteTakoz = (takoz) => {
    Modal.confirm({
      title: 'Takoz Teslimini İptal Et',
      content: `${fmt(takoz.gram)} gr takoz kaydı (#${takoz.id}) silinecek. Onaylıyor musunuz?`,
      okText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTakoz(takoz.id);
          message.success('Takoz teslimi iptal edildi.');
          fetchAll();
        } catch (e) {
          message.error(e.message || 'Takoz iptal edilemedi.');
        }
      },
    });
  };

  const doGeriAl = (row) => {
    Modal.confirm({
      title: 'Vardiya Kapanışını Geri Al',
      content: `${DEPT_LABEL[row.department] || row.department} bölümünün kapanışı geri alınacak ve vardiya yeniden açılacak. Bağlı takozlar bekleyene döner. Onaylıyor musunuz?`,
      okText: 'Evet, Geri Al',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reopenVardiyaKapanis(row.vardiya_kapanis_id);
          message.success(`${DEPT_LABEL[row.department] || row.department} vardiyası yeniden açıldı.`);
          setSelected(null);
          fetchAll();
        } catch (e) {
          message.error(e.message || 'Geri alınamadı.');
        }
      },
    });
  };

  const columns = [
    {
      title: '',
      dataIndex: 'renk',
      width: 36,
      render: (v) => <StatusDot color={vardiyaRenkConfig(v).hex} />,
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      sorter: (a, b) =>
        (DEPT_LABEL[a.department] || a.department).localeCompare(
          DEPT_LABEL[b.department] || b.department,
          'tr',
        ),
      render: (v) => <span style={{ fontWeight: 600 }}>{DEPT_LABEL[v] || v}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'renk',
      width: 200,
      filters: VARDIYA_RENK_FILTER.map((f) => ({ text: f.label, value: f.value })),
      onFilter: (value, r) => r.renk === value,
      render: (v, r) => {
        const cfg = vardiyaRenkConfig(v);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Tag style={{ color: '#111214', background: cfg.hex, borderColor: cfg.hex, margin: 0, flexShrink: 0 }}>
              {cfg.label}
            </Tag>
            {r.hareket_yok && (
              <Tag style={{ margin: 0, fontSize: 10, flexShrink: 0, lineHeight: '18px' }}>Boş gün</Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Güncel HAS',
      dataIndex: 'has_borcu',
      align: 'right',
      sorter: (a, b) => (a.has_borcu || 0) - (b.has_borcu || 0),
      render: (v, r) => (
        <span style={{ fontWeight: 600, color: vardiyaRenkConfig(r.renk).hex }}>
          {fmt(v)} g
        </span>
      ),
    },
    {
      title: 'Takoz',
      dataIndex: 'takoz_karsiligi',
      align: 'right',
      sorter: (a, b) => (a.takoz_karsiligi || 0) - (b.takoz_karsiligi || 0),
      render: (v) => <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(v)} g</span>,
    },
    {
      title: 'Net Fark',
      dataIndex: 'net_fark',
      align: 'right',
      sorter: (a, b) => (a.net_fark || 0) - (b.net_fark || 0),
      render: (v) => (
        <span style={{ color: Math.abs(v) < 0.1 ? '#52C41A' : '#FAAD14', fontWeight: 600 }}>
          {fmt(v)} g
        </span>
      ),
    },
    {
      title: 'Tolerans',
      dataIndex: 'tolerance_esigi',
      align: 'right',
      width: 100,
      render: (v) => (v != null ? `${fmt(v)} g` : '—'),
    },
    {
      title: 'İşlem',
      width: 110,
      render: (_, r) => {
        const isClosed = !!r.vardiya_kapanis_id;
        if (isClosed) {
          if (!isAdmin) return <Tag color="green">Kapandı</Tag>;
          const inMizan = r.renk === 'mavi';
          return (
            <Tooltip title={inMizan ? 'Onaylı mizana dahil — önce mizan iptal edilmeli' : 'Vardiyayı geri aç (yeniden aç)'}>
              <Button
                danger
                size="small"
                icon={<UndoOutlined />}
                disabled={inMizan}
                onClick={(e) => { e.stopPropagation(); doGeriAl(r); }}
              >
                Geri Al
              </Button>
            </Tooltip>
          );
        }
        const canClose = !!r.kapanabilir;
        return (
          <Tooltip
            title={
              canClose
                ? (r.hareket_yok ? 'Boş gün kapanışı' : 'Vardiyayı kapat')
                : (r.renk === 'kirmizi'
                  ? 'Tolerans aşıldı — kapatılamaz'
                  : r.renk === 'sari'
                    ? 'Tolerans uygun; bugün vardiya kaydı açılmadı'
                    : 'Zaten kapatıldı')
            }
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              disabled={!canClose}
              onClick={(e) => { e.stopPropagation(); requestClose(r); }}
              style={canClose ? { background: '#D4AF37', borderColor: '#D4AF37', color: '#111214' } : {}}
            >
              Kapat
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Vardiya Kapanış</h2>
          <div style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>{today}</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Yenile</Button>
          {['admin', 'patron'].includes(user?.role) && (
            <Tooltip title={canCloseDay
              ? 'Tüm bölümler kapandı — günü kapat'
              : `Önce tüm bölümleri tek tek kapatın (${closedCount}/${durum.length} bölüm kapandı)`}>
              <Button danger icon={<LockOutlined />} disabled={!canCloseDay} onClick={doCloseDay}>
                Günü Kapat
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {Object.entries(VARDIYA_RENK).map(([k, v]) => (
          <Col key={k} xs={12} sm={6}>
            <div
              style={{
                ...card,
                padding: '12px 16px',
                borderLeft: `4px solid ${v.hex}`,
                cursor: 'pointer',
                opacity: renkFilter && renkFilter !== k ? 0.55 : 1,
              }}
              onClick={() => setRenkFilter(renkFilter === k ? null : k)}
            >
              <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1 }}>{v.label.toUpperCase()}</div>
              <div style={{ color: v.hex, fontSize: 24, fontWeight: 700 }}>{summary[k] || 0}</div>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ ...card, padding: '8px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: colors.subtext, fontSize: 12 }}>
            Satıra tıklayarak departman detayını açın
          </span>
          <Space>
            <Select
              allowClear
              placeholder="Durum filtresi"
              style={{ width: 180 }}
              value={renkFilter}
              onChange={setRenkFilter}
              options={VARDIYA_RENK_FILTER}
            />
          </Space>
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="department"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          locale={{ emptyText: 'Vardiya verisi bulunamadı — Yenile ile tekrar deneyin' }}
          scroll={{ x: 900 }}
          onRow={(r) => ({
            onClick: () => setSelected(r),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <VardiyaDetailDrawer
        record={selected}
        onClose={() => setSelected(null)}
        colors={colors}
        balanceMap={balanceMap}
        todayTakoz={selected ? (takozByDept[selected.department] || []) : []}
        onRequestClose={requestClose}
        canDeleteTakoz={isAdmin}
        onDeleteTakoz={doDeleteTakoz}
      />

      <Modal
        title="Vardiya Kapatma Onayı"
        open={!!confirmCtx}
        onCancel={() => setConfirmCtx(null)}
        onOk={doKapat}
        okText="Evet, Kapat"
        cancelText="Vazgeç"
        confirmLoading={busy}
        okButtonProps={{ style: { background: '#D4AF37', borderColor: '#D4AF37', color: '#111214' } }}
      >
        {confirmCtx && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ marginBottom: 12 }}>
              <strong>{DEPT_LABEL[confirmCtx.department] || confirmCtx.department}</strong>
              {' '}
              departmanının bugünkü vardiyasını kapatmak istiyorsunuz.
            </p>
            <div style={{ background: colors.bg, borderRadius: 8, padding: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: colors.subtext }}>Güncel HAS:</span>
                <span style={{ fontWeight: 600 }}>{fmt(confirmCtx.has_borcu)} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: colors.subtext }}>Takoz Karşılığı:</span>
                <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(confirmCtx.takoz_karsiligi)} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                <span style={{ color: colors.subtext }}>Net Fark:</span>
                <span style={{ color: '#FAAD14', fontWeight: 700 }}>{fmt(confirmCtx.net_fark)} g</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vardiya;
