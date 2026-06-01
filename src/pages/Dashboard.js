import React, { useState, useEffect } from 'react';
import { Row, Col, Badge, Table, Tag, Spin, Alert } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAllBalances, getKasaBalance, getPendingReport, getActiveAlarms } from '../api/dashboard';
import { getVardiyaDurum } from '../api/vardiya';

const RENK = {
  kirmizi: { hex: '#FF4D4F', label: 'Tolerans Aşıldı' },
  sari:    { hex: '#FAAD14', label: 'Kapatmaya Hazır' },
  yesil:   { hex: '#52C41A', label: 'Kapatıldı' },
  mavi:    { hex: '#1677FF', label: 'Mizan Onaylandı' },
};

const DEPT = {
  kasa: 'Kasa', ocak: 'Ocak', pres: 'Pres', kaynak: 'Kaynak',
  pres_montaj: 'Pres Montaj', cila: 'Cila', ayarevi: 'Ayar Evi',
  cnc: 'CNC', kaliphane: 'Kalıphane', dokum: 'Döküm',
  dokum_montaj: 'Döküm Montaj', ar_ge: 'AR-GE', halka_kilit: 'Halka Kilit',
  sarnel_kilit: 'Sarnel Kilit', zincir: 'Zincir', atolye: 'Atölye', top: 'Top',
};

const fmt = (n, d = 2) => typeof n === 'number' ? n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

const COLOR_LABELS = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
const MAT_LABELS   = { altin: 'Altın', gumus: 'Gümüş' };
const PUR_LABELS   = { '8k':'8 Ayar','9k':'9 Ayar','10k':'10 Ayar','14k':'14 Ayar','18k':'18 Ayar','21k':'21 Ayar','22k':'22 Ayar','925':'925 Gümüş','altin_diger':'Altın Diğer' };
const matPurColor  = (mat, pur, col) => [MAT_LABELS[mat] || mat, PUR_LABELS[pur] || pur, col ? COLOR_LABELS[col] || col : null].filter(Boolean).join(' · ');

const Dashboard = () => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [balances, setBalances]         = useState([]);
  const [pending, setPending]           = useState([]);
  const [alarms, setAlarms]             = useState([]);
  const [vardiyaDurum, setVardiyaDurum] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const role          = user?.role;
  const isFullAccess  = ['admin', 'patron', 'fabrika_muduru', 'kasa'].includes(role);
  const canAllBal     = ['admin', 'patron'].includes(role);
  const canVardiya    = ['admin', 'patron', 'fabrika_muduru'].includes(role);

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    try {
      setError(null);
      const balProm  = canAllBal ? getAllBalances() : role === 'kasa' ? getKasaBalance() : Promise.resolve([]);
      const penProm  = getPendingReport().catch(() => ({ transfers: [] }));
      const almProm  = getActiveAlarms().catch(() => []);
      const varProm  = canVardiya ? getVardiyaDurum().catch(() => []) : Promise.resolve([]);

      const [b, p, a, v] = await Promise.all([balProm, penProm, almProm, varProm]);
      setBalances(b || []);
      setPending((p && p.transfers) || []);
      setAlarms(a || []);
      setVardiyaDurum(v || []);
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spin size="large" />
    </div>
  );

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const totalGold  = balances.filter(b => b.material_type === 'altin').reduce((s, b) => s + b.weight_grams, 0);
  const totalHas   = balances.filter(b => b.material_type === 'altin' && b.has_balance != null).reduce((s, b) => s + b.has_balance, 0);
  const kasaGrams  = balances.filter(b => b.department === 'kasa').reduce((s, b) => s + b.weight_grams, 0);
  const kasaHas    = balances.filter(b => b.department === 'kasa' && b.has_balance != null).reduce((s, b) => s + b.has_balance, 0);

  const statCard = (label, val, col, hasVal) => (
    <div style={{ ...card, padding: '20px 24px' }}>
      <div style={{ color: colors.subtext, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ color: col || colors.gold, fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{val}</div>
      {hasVal != null && (
        <div style={{ color: '#D4AF3799', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
          {hasVal} <span style={{ fontSize: 10, fontWeight: 400 }}>g has</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>Kontrol Merkezi</h2>
        <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>{today}</p>
      </div>

      {/* VARDIYA RENK GRİD */}
      {canVardiya && vardiyaDurum.length > 0 && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <h3 style={{ color: colors.text, fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>
              BUGÜNKÜ VARDİYA DURUMU
            </h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(RENK).map(([k, v]) => (
                <span key={k} style={{ fontSize: 11, color: colors.subtext, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.hex, display: 'inline-block', flexShrink: 0 }} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
          <Row gutter={[10, 10]}>
            {vardiyaDurum.map((d) => {
              const r = RENK[d.renk] || { hex: '#8B8B8B', label: '—' };
              return (
                <Col key={d.department} xs={12} sm={8} md={6} lg={4}>
                  <div style={{
                    background: colors.bg, borderRadius: 8,
                    border: '1px solid ' + colors.border,
                    borderLeft: '4px solid ' + r.hex,
                    padding: '12px 14px',
                  }}>
                    <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>
                      {DEPT[d.department] || d.department.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.hex, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ color: r.hex, fontSize: 10, fontWeight: 600 }}>{r.label}</span>
                    </div>
                    <div style={{ color: colors.text, fontSize: 19, fontWeight: 700, lineHeight: 1 }}>
                      {d.net_fark.toFixed(2)}
                      <span style={{ fontSize: 10, color: colors.subtext, marginLeft: 2 }}> g has</span>
                    </div>
                    {d.tolerance_esigi != null && (
                      <div style={{ color: colors.subtext, fontSize: 9, marginTop: 3 }}>tol: {d.tolerance_esigi}g</div>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {/* STAT CARDS */}
      {isFullAccess && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>{statCard('TOPLAM ALTIN', fmt(totalGold) + ' gr', null, fmt(totalHas))}</Col>
          <Col xs={24} sm={12} md={6}>{statCard('KASA BAKİYESİ', fmt(kasaGrams) + ' gr', null, fmt(kasaHas))}</Col>
          <Col xs={24} sm={12} md={6}>{statCard('BEKLEYEN TRANSFER', pending.length, pending.length > 0 ? '#FF4D4F' : '#52C41A')}</Col>
          <Col xs={24} sm={12} md={6}>{statCard('AKTİF ALARM', alarms.length, alarms.length > 0 ? '#FF4D4F' : '#52C41A')}</Col>
        </Row>
      )}

      {/* DEPT SORUMLUSU */}
      {!isFullAccess && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: colors.text, fontSize: 14, marginBottom: 16, fontWeight: 700 }}>
            {DEPT[user?.department] || user?.department?.toUpperCase()} BAKİYESİ
          </h3>
          <Row gutter={[12, 12]}>
            {balances.filter(b => b.department === user?.department).map((b, i) => (
              <Col key={i} xs={24} sm={12} md={8}>
                <div style={{ background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, padding: 16 }}>
                  <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>
                    {matPurColor(b.material_type, b.purity, b.color)}
                  </div>
                  <div style={{ color: colors.gold, fontSize: 22, fontWeight: 700 }}>
                    {fmt(b.weight_grams)} <span style={{ fontSize: 12, color: colors.subtext }}>gr</span>
                  </div>
                  {b.has_balance != null && (
                    <div style={{ color: '#D4AF3799', fontSize: 12, marginTop: 2 }}>
                      {fmt(b.has_balance)} <span style={{ fontSize: 10 }}>g has</span>
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ALL BALANCES */}
      {canAllBal && balances.length > 0 && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: colors.text, fontSize: 14, letterSpacing: 0.5, marginBottom: 16, fontWeight: 700 }}>
            DEPARTMAN BAKİYELERİ
          </h3>
          <Row gutter={[10, 10]}>
            {balances.map((b, i) => (
              <Col key={i} xs={12} sm={8} md={6} lg={4}>
                <div style={{ background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: colors.subtext, fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>
                    {DEPT[b.department] || b.department?.toUpperCase()}
                  </div>
                  <div style={{ color: colors.gold, fontSize: 16, fontWeight: 700 }}>
                    {fmt(b.weight_grams)} <span style={{ fontSize: 10, color: colors.subtext }}>gr</span>
                  </div>
                  {b.has_balance != null && (
                    <div style={{ color: '#D4AF3799', fontSize: 10, marginTop: 1 }}>
                      {fmt(b.has_balance)} g has
                    </div>
                  )}
                  <div style={{ color: colors.subtext, fontSize: 9, marginTop: 2 }}>
                    {[PUR_LABELS[b.purity] || b.purity, b.color ? COLOR_LABELS[b.color] || b.color : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* TABLES */}
      {isFullAccess && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ color: colors.text, fontSize: 13, letterSpacing: 0.5, marginBottom: 16, fontWeight: 700 }}>
                BEKLEYEN TRANSFERler
                {pending.length > 0 && <Badge count={pending.length} style={{ marginLeft: 8, backgroundColor: '#FF4D4F' }} />}
              </h3>
              <Table
                dataSource={pending} rowKey="id" pagination={false} size="small"
                locale={{ emptyText: 'Bekleyen transfer yok' }}
                columns={[
                  { title: '#', dataIndex: 'id', width: 50, render: v => <span style={{ color: colors.subtext }}>#{v}</span> },
                  { title: 'Gönderen', dataIndex: 'from_department', render: v => <Tag color="orange">{v || 'Dış'}</Tag> },
                  { title: 'Alıcı', dataIndex: 'to_department', render: v => <Tag color="blue">{DEPT[v] || v || 'Kasa'}</Tag> },
                  { title: 'Miktar', dataIndex: 'weight_grams', render: v => <span style={{ color: colors.gold, fontWeight: 600 }}>{v} gr</span> },
                  { title: 'Bekleme', dataIndex: 'elapsed_minutes', render: v => v != null ? <Tag color={v > 10 ? 'red' : 'green'}>{v} dk</Tag> : '—' },
                ]}
              />
            </div>
          </Col>
          <Col xs={24} lg={10}>
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ color: colors.text, fontSize: 13, letterSpacing: 0.5, marginBottom: 16, fontWeight: 700 }}>
                AKTİF ALARMLAR
                {alarms.length > 0 && <Badge count={alarms.length} style={{ marginLeft: 8, backgroundColor: '#FF4D4F' }} />}
              </h3>
              <Table
                dataSource={alarms} rowKey="id" pagination={false} size="small"
                locale={{ emptyText: 'Aktif alarm yok' }}
                columns={[
                  { title: 'Tür', dataIndex: 'alarm_type', render: v => <Tag color="red">{v}</Tag> },
                  { title: 'Detay', dataIndex: 'detail', ellipsis: true,
                    render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>{v}</span> },
                ]}
              />
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
