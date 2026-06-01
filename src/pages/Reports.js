import React, { useState } from 'react';
import {
  Tabs, DatePicker, Select, Button, Table, Tag, Alert,
  Row, Col, Spin, Empty,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, BarChartOutlined,
  BankOutlined, ClockCircleOutlined, CalendarOutlined,
  HeatMapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';
import {
  getDepartmentReport, getKasaDailyReport,
  getPendingReport, getEndOfDayReport, getHasVardiyaReport,
} from '../api/reports';

const DEPTS = [
  { value: 'kasa',         label: 'Kasa' },
  { value: 'ocak',         label: 'Ocak' },
  { value: 'pres',         label: 'Pres' },
  { value: 'kaynak',       label: 'Kaynak' },
  { value: 'pres_montaj',  label: 'Pres Montaj' },
  { value: 'cila',         label: 'Cila' },
  { value: 'ayarevi',      label: 'Ayar Evi' },
  { value: 'cnc',          label: 'CNC' },
  { value: 'kaliphane',    label: 'Kalıphane' },
  { value: 'dokum',        label: 'Döküm' },
  { value: 'dokum_montaj', label: 'Döküm Montaj' },
  { value: 'ar_ge',        label: 'AR-GE' },
  { value: 'halka_kilit',  label: 'Halka Kilit' },
  { value: 'sarnel_kilit', label: 'Sarnel Kilit' },
  { value: 'zincir',       label: 'Zincir' },
  { value: 'atolye',       label: 'Atölye' },
  { value: 'top',          label: 'Top' },
];

const DEPT_LABEL = Object.fromEntries(DEPTS.map(d => [d.value, d.label]));

const fmt = (n, d = 2) =>
  typeof n === 'number' ? n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
const PUR_LABEL   = { '8k':'8 Ayar','9k':'9 Ayar','10k':'10 Ayar','14k':'14 Ayar','18k':'18 Ayar','21k':'21 Ayar','22k':'22 Ayar','925':'925 Gümüş','altin_diger':'Altın Diğer' };
const MAT_LABEL   = { altin: 'Altın', gumus: 'Gümüş' };
const matStr      = (mat, pur, col) => [MAT_LABEL[mat] || mat, PUR_LABEL[pur] || pur, col ? COLOR_LABEL[col] || col : null].filter(Boolean).join(' · ');

const dtFmt = (v) =>
  v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const RENK_COLOR = { kirmizi: '#FF4D4F', sari: '#FAAD14', yesil: '#52C41A', mavi: '#1677FF' };
const RENK_LABEL = {
  kirmizi: 'Tolerans Aşıldı', sari: 'Kapatmaya Hazır',
  yesil: 'Kapatıldı', mavi: 'Mizan Onaylandı',
};

const transferColumns = (colors) => [
  { title: '#',        dataIndex: 'id',              width: 55, render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
  { title: 'Gönderen', dataIndex: 'from_department', render: v => <Tag color="orange" style={{ fontSize: 11 }}>{DEPT_LABEL[v] || v || 'Dış'}</Tag> },
  { title: 'Alıcı',    dataIndex: 'to_department',   render: v => <Tag color="blue"   style={{ fontSize: 11 }}>{DEPT_LABEL[v] || v || 'Kasa'}</Tag> },
  { title: 'Materyal', width: 160,
    render: (_, r) => <span style={{ fontSize: 11 }}>{matStr(r.material_type, r.purity, r.color)}</span> },
  { title: 'Ağırlık',  dataIndex: 'weight_grams',    render: v => <span style={{ color: '#D4AF37', fontWeight: 600 }}>{fmt(v)} gr</span> },
  { title: 'HAS',      dataIndex: 'has_value',        render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>{v != null ? fmt(v) : '—'}</span> },
  { title: 'Durum',    dataIndex: 'status',           render: v => <Tag color={{ beklemede: 'orange', onaylandi: 'success', reddedildi: 'error' }[v] || 'default'}>{v}</Tag> },
  { title: 'Tarih',    dataIndex: 'created_at',       render: v => <span style={{ fontSize: 11, color: colors.subtext }}>{dtFmt(v)}</span> },
];

const StatCard = ({ label, value, suffix, colors }) => (
  <div style={{
    background: colors.bg, border: '1px solid ' + colors.border,
    borderRadius: 8, padding: '16px 20px',
  }}>
    <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
    <div style={{ color: '#D4AF37', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
      {value} <span style={{ fontSize: 11, color: colors.subtext, fontWeight: 400 }}>{suffix}</span>
    </div>
  </div>
);

/* ─────────────── DEPARTMAN RAPORU ─────────────── */
const DeptReport = ({ colors }) => {
  const [dept, setDept]         = useState(null);
  const [dates, setDates]       = useState([dayjs().startOf('month'), dayjs()]);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = async () => {
    if (!dept || !dates[0] || !dates[1]) return;
    setLoading(true); setError(null);
    try {
      const res = await getDepartmentReport(dept, dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'));
      setData(res);
    } catch (e) { setError(e.message || 'Rapor yüklenemedi.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Departman</div>
          <Select
            value={dept} onChange={setDept}
            options={DEPTS} placeholder="Seçin" style={{ width: 180 }}
            showSearch filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
          />
        </div>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Tarih Aralığı</div>
          <DatePicker.RangePicker
            value={dates} onChange={setDates} format="DD.MM.YYYY"
            style={{ width: 260 }}
          />
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={fetch} loading={loading}
          disabled={!dept || !dates[0] || !dates[1]}>
          Rapor Al
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={6}><StatCard label="TOPLAM GİREN"   value={fmt(data.total_incoming_grams)} suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="TOPLAM ÇIKAN"   value={fmt(data.total_outgoing_grams)} suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET FARK"        value={fmt(data.net_grams)}            suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET HAS"         value={fmt(data.net_has)}              suffix="g has" colors={colors} /></Col>
          </Row>

          <Tabs size="small" items={[
            {
              key: 'in', label: `Giren Transferler (${data.incoming_count})`,
              children: <Table dataSource={data.incoming_transfers} columns={transferColumns(colors)}
                rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 760 }}
                locale={{ emptyText: 'Transfer yok' }} />,
            },
            {
              key: 'out', label: `Çıkan Transferler (${data.outgoing_count})`,
              children: <Table dataSource={data.outgoing_transfers} columns={transferColumns(colors)}
                rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 760 }}
                locale={{ emptyText: 'Transfer yok' }} />,
            },
          ]} />
        </>
      )}

      {!loading && !data && !error && (
        <Empty description="Rapor almak için departman ve tarih aralığı seçin." />
      )}
    </div>
  );
};

/* ─────────────── KASA GÜNLÜK ─────────────── */
const KasaDaily = ({ colors }) => {
  const [date, setDate]         = useState(dayjs());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = async () => {
    if (!date) return;
    setLoading(true); setError(null);
    try { setData(await getKasaDailyReport(date.format('YYYY-MM-DD'))); }
    catch (e) { setError(e.message || 'Rapor yüklenemedi.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Rapor Tarihi</div>
          <DatePicker value={date} onChange={setDate} format="DD.MM.YYYY" />
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={fetch} loading={loading} disabled={!date}>
          Rapor Al
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={6}><StatCard label="GIREN"    value={fmt(data.total_incoming_grams)} suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="ÇIKAN"    value={fmt(data.total_outgoing_grams)} suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET"      value={fmt(data.net_grams)}            suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET HAS"  value={fmt(data.net_has)}              suffix="g has" colors={colors} /></Col>
          </Row>
          <Tabs size="small" items={[
            {
              key: 'in',  label: `Giren (${data.incoming_count})`,
              children: <Table dataSource={data.incoming_transfers} columns={transferColumns(colors)}
                rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 760 }}
                locale={{ emptyText: 'Transfer yok' }} />,
            },
            {
              key: 'out', label: `Çıkan (${data.outgoing_count})`,
              children: <Table dataSource={data.outgoing_transfers} columns={transferColumns(colors)}
                rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 760 }}
                locale={{ emptyText: 'Transfer yok' }} />,
            },
          ]} />
        </>
      )}
      {!loading && !data && !error && <Empty description="Tarih seçip Rapor Al'a tıklayın." />}
    </div>
  );
};

/* ─────────────── BEKLEYEN TRANSFERler ─────────────── */
const PendingReport = ({ colors }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = async () => {
    setLoading(true); setError(null);
    try { setData(await getPendingReport()); }
    catch (e) { setError(e.message || 'Rapor yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const cols = [
    ...transferColumns(colors),
    {
      title: 'Bekleme',
      dataIndex: 'elapsed_minutes',
      render: v => v != null
        ? <Tag color={v > 10 ? 'red' : v > 5 ? 'orange' : 'green'}>{v} dk</Tag>
        : '—',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetch} loading={loading}>
          Güncel Durumu Getir
        </Button>
        {data && (
          <span style={{ color: colors.subtext, fontSize: 12, marginLeft: 12 }}>
            {dtFmt(data.generated_at)} itibarıyla
          </span>
        )}
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {!loading && data && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag color={data.total_pending > 0 ? 'red' : 'green'} style={{ fontSize: 13, padding: '4px 12px' }}>
              {data.total_pending} bekleyen transfer
            </Tag>
          </div>
          <Table
            dataSource={data.transfers} columns={cols}
            rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 900 }}
            locale={{ emptyText: 'Bekleyen transfer yok' }}
          />
        </>
      )}
      {!loading && !data && !error && <Empty description="Bekleyen transferleri görmek için butona tıklayın." />}
    </div>
  );
};

/* ─────────────── GÜN SONU RAPORU ─────────────── */
const EndOfDay = ({ colors }) => {
  const [date, setDate]         = useState(dayjs());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = async () => {
    if (!date) return;
    setLoading(true); setError(null);
    try { setData(await getEndOfDayReport(date.format('YYYY-MM-DD'))); }
    catch (e) { setError(e.message || 'Rapor yüklenemedi.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Rapor Tarihi</div>
          <DatePicker value={date} onChange={setDate} format="DD.MM.YYYY" />
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={fetch} loading={loading} disabled={!date}>
          Rapor Al
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={8}><StatCard label="ONAYLANAN TRANSFERler" value={data.daily_summary?.total_transfers_confirmed ?? '—'} suffix="adet" colors={colors} /></Col>
            <Col xs={12} md={8}><StatCard label="HAREKET EDEN ALTIN"    value={fmt(data.daily_summary?.total_grams_moved)}         suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={8}><StatCard label="HAREKET EDEN HAS"      value={fmt(data.daily_summary?.total_has_moved)}           suffix="g has" colors={colors} /></Col>
          </Row>

          <Tabs size="small" items={[
            {
              key: 'bal', label: 'Departman Bakiyeleri',
              children: (
                <Table
                  dataSource={data.department_balances}
                  rowKey={(r, i) => `${r.department}-${r.purity}-${i}`}
                  size="small" pagination={false} scroll={{ x: 500 }}
                  locale={{ emptyText: 'Bakiye yok' }}
                  columns={[
                    { title: 'Departman', dataIndex: 'department', render: v => <Tag>{DEPT_LABEL[v] || v}</Tag> },
                    { title: 'Materyal',  width: 160,
                      render: (_, r) => <span style={{ fontSize: 11 }}>{matStr(r.material_type, r.purity, r.color)}</span> },
                    { title: 'Ağırlık',  dataIndex: 'weight_grams', render: v => <span style={{ color: '#D4AF37', fontWeight: 600 }}>{fmt(v)} gr</span> },
                    { title: 'HAS',      dataIndex: 'has_balance',  render: v => <span style={{ color: colors.subtext }}>{v != null ? fmt(v) + ' g has' : '—'}</span> },
                  ]}
                />
              ),
            },
            {
              key: 'tr', label: `Transferler (${data.transfers?.length ?? 0})`,
              children: <Table dataSource={data.transfers} columns={transferColumns(colors)}
                rowKey="id" size="small" pagination={{ pageSize: 15 }} scroll={{ x: 760 }}
                locale={{ emptyText: 'Transfer yok' }} />,
            },
          ]} />
        </>
      )}
      {!loading && !data && !error && <Empty description="Tarih seçip Rapor Al'a tıklayın." />}
    </div>
  );
};

/* ─────────────── HAS VARDİYA ─────────────── */
const HasVardiya = ({ colors }) => {
  const [date, setDate]         = useState(dayjs());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = async () => {
    if (!date) return;
    setLoading(true); setError(null);
    try { setData(await getHasVardiyaReport(date.format('YYYY-MM-DD'))); }
    catch (e) { setError(e.message || 'Rapor yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const depts = data?.departments || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Rapor Tarihi</div>
          <DatePicker value={date} onChange={setDate} format="DD.MM.YYYY" />
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={fetch} loading={loading} disabled={!date}>
          Rapor Al
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <Row gutter={[10, 10]}>
          {depts.map(d => {
            const col = RENK_COLOR[d.renk] || '#8B8B8B';
            return (
              <Col key={d.department} xs={24} sm={12} md={8} lg={6}>
                <div style={{
                  background: colors.bg, border: '1px solid ' + colors.border,
                  borderLeft: '4px solid ' + col, borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
                    {DEPT_LABEL[d.department] || d.department?.toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'inline-block' }} />
                    <span style={{ color: col, fontSize: 11, fontWeight: 600 }}>{RENK_LABEL[d.renk] || d.renk}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 11 }}>
                    <span style={{ color: colors.subtext }}>HAS Borcu</span>
                    <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(d.has_borcu)} g</span>
                    <span style={{ color: colors.subtext }}>Güverse</span>
                    <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(d.guvarse_karsiligi)} g</span>
                    <span style={{ color: colors.subtext }}>Net Fark</span>
                    <span style={{ color: Math.abs(d.net_fark) > (d.tolerance_esigi || 0) ? '#FF4D4F' : '#52C41A', fontWeight: 700, fontSize: 14 }}>
                      {fmt(d.net_fark)} g
                    </span>
                    {d.tolerance_esigi != null && (
                      <>
                        <span style={{ color: colors.subtext }}>Tolerans</span>
                        <span style={{ color: colors.subtext }}>{d.tolerance_esigi} g</span>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
          {depts.length === 0 && <Col span={24}><Empty description="Bu tarih için veri yok." /></Col>}
        </Row>
      )}
      {!loading && !data && !error && <Empty description="Tarih seçip Rapor Al'a tıklayın." />}
    </div>
  );
};

/* ─────────────── ANA SAYFA ─────────────── */
const Reports = () => {
  const { colors } = useTheme();

  const card = {
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    padding: 24,
  };

  const tabItems = [
    {
      key: 'dept',    label: <span><BarChartOutlined /> Departman</span>,
      children: <DeptReport colors={colors} />,
    },
    {
      key: 'kasa',    label: <span><BankOutlined /> Kasa Günlük</span>,
      children: <KasaDaily colors={colors} />,
    },
    {
      key: 'pending', label: <span><ClockCircleOutlined /> Bekleyen</span>,
      children: <PendingReport colors={colors} />,
    },
    {
      key: 'eod',     label: <span><CalendarOutlined /> Gün Sonu</span>,
      children: <EndOfDay colors={colors} />,
    },
    {
      key: 'vardiya', label: <span><HeatMapOutlined /> HAS Vardiya</span>,
      children: <HasVardiya colors={colors} />,
    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>Raporlar</h2>
        <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>
          Departman hareketi, kasa, gün sonu ve HAS vardiya raporları
        </p>
      </div>

      <div style={card}>
        <Tabs items={tabItems} size="middle" />
      </div>
    </div>
  );
};

export default Reports;
