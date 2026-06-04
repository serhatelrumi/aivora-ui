import React, { useState, useEffect } from 'react';
import {
  Row, Col, Button, Table, Tag, Modal, Spin, Alert, message, Tooltip,
} from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { getVardiyaDurum, createVardiyaKapanis, listVardiyaKapanis } from '../api/vardiya';
import { getAllBalances } from '../api/dashboard';
import { groupAltinByDepartment } from '../utils/balanceDisplay';
import DeptStockTable from '../components/dashboard/DeptStockTable';

const RENK = {
  kirmizi: { hex: '#FF4D4F', label: 'Tolerans Aşıldı',    canClose: false },
  sari:    { hex: '#FAAD14', label: 'Kapatmaya Hazır',     canClose: true  },
  yesil:   { hex: '#52C41A', label: 'Kapatıldı',           canClose: false },
  mavi:    { hex: '#1677FF', label: 'Mizan Onaylandı',     canClose: false },
};

const DEPT_LABEL  = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };
const DURUM_LABEL = { ACIK:'Açık', KAPALI:'Kapalı', onaylandi:'Onaylandı', beklemede:'Beklemede', ONAYLANDI:'Onaylandı' };
const Vardiya = () => {
  const { colors } = useTheme();

  const [durum, setDurum]           = useState([]);
  const [gecmis, setGecmis]         = useState([]);
  const [balanceMap, setBalanceMap] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [confirmCtx, setConfirmCtx] = useState(null);
  const [busy, setBusy]             = useState(false);

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, g, bals] = await Promise.all([
        getVardiyaDurum().catch(() => []),
        listVardiyaKapanis().catch(() => []),
        getAllBalances().catch(() => []),
      ]);
      setDurum(d || []);
      setGecmis(g || []);
      setBalanceMap(groupAltinByDepartment(bals || [], { excludeKasa: true }));
    } catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const doKapat = async () => {
    if (!confirmCtx) return;
    setBusy(true);
    try {
      await createVardiyaKapanis(confirmCtx.department);
      message.success(DEPT_LABEL[confirmCtx.department] + ' vardiyası kapatıldı.');
      setConfirmCtx(null);
      fetchAll();
    } catch (e) { message.error(e.message || 'Vardiya kapatılamadı.'); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spin size="large" />
    </div>
  );

  const summary = durum.reduce((acc, d) => {
    acc[d.renk] = (acc[d.renk] || 0) + 1;
    return acc;
  }, {});

  const gecmisColumns = [
    { title: '#', dataIndex: 'id', width: 55, render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
    { title: 'Departman', dataIndex: 'department', render: v => <Tag color="blue">{DEPT_LABEL[v] || v}</Tag> },
    { title: 'Tarih', dataIndex: 'tarih' },
    { title: 'HAS Borcu', dataIndex: 'toplam_tahmini_has_borcu', render: v => <span style={{ fontWeight: 600 }}>{v?.toFixed(2)} g</span> },
    { title: 'Güverse', dataIndex: 'guvarse_tahmini_has_karsiligi', render: v => <span style={{ color: '#52C41A' }}>{v?.toFixed(2)} g</span> },
    { title: 'Net Fark', dataIndex: 'net_fark', render: v => <span style={{ color: Math.abs(v) < 0.1 ? '#52C41A' : '#FAAD14', fontWeight: 600 }}>{v?.toFixed(2)} g</span> },
    { title: 'Tolerans', dataIndex: 'tolerance_esigi', render: v => v != null ? v + 'g' : '—' },
    { title: 'Durum', dataIndex: 'durum', render: v => <Tag color={['onaylandi','ONAYLANDI','KAPALI'].includes(v) ? 'success' : 'warning'}>{DURUM_LABEL[v] || v}</Tag> },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Vardiya Kapanış</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchAll}>Yenile</Button>
      </div>

      {/* SUMMARY STATS */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {Object.entries(RENK).map(([k, v]) => (
          <Col key={k} xs={12} sm={6}>
            <div style={{ ...card, padding: '14px 20px', borderLeft: '4px solid ' + v.hex }}>
              <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{v.label.toUpperCase()}</div>
              <div style={{ color: v.hex, fontSize: 28, fontWeight: 700 }}>{summary[k] || 0}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* COLOR LEGEND */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(RENK).map(([k, v]) => (
          <span key={k} style={{ fontSize: 12, color: colors.subtext, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: v.hex, display: 'inline-block' }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* DEPARTMENT CARDS */}
      {durum.length === 0 ? (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.subtext }}>
          Bugün için vardiya kaydı bulunamadı.
        </div>
      ) : (
        <Row gutter={[12, 12]} style={{ marginBottom: 32 }}>
          {durum.map((d) => {
            const r = RENK[d.renk] || { hex: '#8B8B8B', label: '—', canClose: false };
            return (
              <Col key={d.department} xs={24} sm={12} md={8} lg={6}>
                <div style={{
                  ...card, padding: 20,
                  borderLeft: '5px solid ' + r.hex,
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: colors.text, fontWeight: 700, fontSize: 15 }}>
                        {DEPT_LABEL[d.department] || d.department}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.hex, display: 'inline-block' }} />
                        <span style={{ color: r.hex, fontSize: 11, fontWeight: 600 }}>{r.label}</span>
                      </div>
                    </div>
                    <Tooltip title={
                      !r.canClose
                        ? (d.renk === 'kirmizi' ? 'Tolerans aşıldı — kapatılamaz' : 'Zaten kapatıldı')
                        : 'Vardiyayı kapat'
                    }>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        disabled={!r.canClose}
                        onClick={() => setConfirmCtx(d)}
                        style={r.canClose ? { background: '#D4AF37', borderColor: '#D4AF37', color: '#111214' } : {}}
                      >
                        Kapat
                      </Button>
                    </Tooltip>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <DeptStockTable
                      lines={balanceMap[d.department]}
                      colors={colors}
                      showFooter={false}
                    />
                  </div>

                  {/* Footer: total + tolerance */}
                  <div style={{
                    borderTop: '1px solid ' + colors.border,
                    paddingTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}>
                    <div>
                      <span style={{ color: colors.subtext }}>Toplam HAS  </span>
                      <span style={{ color: r.hex, fontWeight: 700 }}>{d.has_borcu?.toFixed(2)} g</span>
                    </div>
                    <div style={{ color: colors.subtext }}>
                      Tolerans: <span style={{ color: colors.text }}>{d.tolerance_esigi != null ? d.tolerance_esigi + ' g' : '—'}</span>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* HISTORY */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ color: colors.text, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Geçmiş Kapanışlar</h3>
        <Table
          dataSource={gecmis} columns={gecmisColumns} rowKey="id"
          size="small" pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'Kapanış kaydı bulunamadı' }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* CONFIRM MODAL */}
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
              <strong>{DEPT_LABEL[confirmCtx.department]}</strong> departmanının bugünkü vardiyasını kapatmak istiyorsunuz.
            </p>
            <div style={{ background: colors.bg, borderRadius: 8, padding: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: colors.subtext }}>HAS Borcu:</span>
                <span style={{ fontWeight: 600 }}>{confirmCtx.has_borcu?.toFixed(2)} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: colors.subtext }}>Güverse Karşılığı:</span>
                <span style={{ color: '#52C41A', fontWeight: 600 }}>{confirmCtx.guvarse_karsiligi?.toFixed(2)} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid ' + colors.border, paddingTop: 8 }}>
                <span style={{ color: colors.subtext }}>Net Fark:</span>
                <span style={{ color: '#FAAD14', fontWeight: 700 }}>{confirmCtx.net_fark != null ? (confirmCtx.net_fark / 0.995).toFixed(2) : '—'} g has</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vardiya;
