import React, { useState, useEffect } from 'react';
import {
  Tabs, DatePicker, Select, Button, Table, Tag, Alert,
  Row, Col, Spin, Empty, Collapse,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, BarChartOutlined,
  BankOutlined, ClockCircleOutlined, CalendarOutlined,
  HeatMapOutlined, FileTextOutlined,
} from '@ant-design/icons';
import ReportExportBar from '../components/ReportExportBar';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';
import {
  getDepartmentReport, getKasaDailyReport,
  getPendingReport, getEndOfDayReport, getHasVardiyaReport,
  listDayCloses, getMasterSummary,
} from '../api/reports';
import { purityLabel, matPurColorStr } from '../constants/goldCatalog';

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
const MAT_LABEL   = { altin: 'Altın', gumus: 'Gümüş' };
const matStr      = (mat, pur, col) =>
  mat === 'altin' ? purityLabel(pur, col) : matPurColorStr(mat, pur, col);

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
  { title: 'HAS',      dataIndex: 'has_value',        render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>{v != null ? fmt(v / 0.995) : '—'}</span> },
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
        <ReportExportBar
          data={data}
          reportType="department"
          filenameBase={
            dept && dates[0] && dates[1]
              ? `Aivora_Dept_${dept}_${dates[0].format('YYYY-MM-DD')}_${dates[1].format('YYYY-MM-DD')}`
              : 'Aivora_Dept'
          }
          meta={{ title: DEPT_LABEL[dept] }}
        />
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={6}><StatCard label="TOPLAM GİREN"   value={fmt(data.total_incoming_grams)} suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="TOPLAM ÇIKAN"   value={fmt(data.total_outgoing_grams)} suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET FARK"        value={fmt(data.net_grams)}            suffix="gr" colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET HAS"         value={fmt(data.net_has / 0.995)}              suffix="g has" colors={colors} /></Col>
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
        <ReportExportBar
          data={data}
          reportType="kasa"
          filenameBase={date ? `Aivora_Kasa_${date.format('YYYY-MM-DD')}` : 'Aivora_Kasa'}
          meta={{ date: date?.format('YYYY-MM-DD') }}
        />
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={6}><StatCard label="GIREN"    value={fmt(data.total_incoming_grams)} suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="ÇIKAN"    value={fmt(data.total_outgoing_grams)} suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET"      value={fmt(data.net_grams)}            suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={6}><StatCard label="NET HAS"  value={fmt(data.net_has / 0.995)}              suffix="g has" colors={colors} /></Col>
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetch} loading={loading}>
          Güncel Durumu Getir
        </Button>
        <ReportExportBar
          data={data}
          reportType="pending"
          filenameBase={`Aivora_Bekleyen_${dayjs().format('YYYY-MM-DD')}`}
        />
        {data && (
          <span style={{ color: colors.subtext, fontSize: 12 }}>
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
  const [closedDates, setClosedDates] = useState(new Set());

  const dateStr = date ? date.format('YYYY-MM-DD') : null;
  const isClosed = dateStr ? closedDates.has(dateStr) : false;

  const loadCloses = async () => {
    try {
      const rows = await listDayCloses();
      setClosedDates(new Set((rows || []).map(r => r.kapanis_tarihi)));
    } catch { /* ignore */ }
  };

  useEffect(() => { loadCloses(); }, []);

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
        {isClosed
          ? <Tag color="green" style={{ alignSelf: 'center' }}>Bu gün kapatıldı</Tag>
          : <span style={{ color: colors.subtext, fontSize: 12, alignSelf: 'center' }}>
              Gün kapatma → <strong>Vardiya</strong> sekmesinden yapılır.
            </span>}
        <ReportExportBar
          data={data}
          reportType="end_of_day"
          filenameBase={dateStr ? `Aivora_GunSonu_${dateStr}` : 'Aivora_GunSonu'}
          meta={{ date: dateStr }}
        />
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={8}><StatCard label="ONAYLANAN TRANSFERler" value={data.daily_summary?.total_transfers_confirmed ?? '—'} suffix="adet" colors={colors} /></Col>
            <Col xs={12} md={8}><StatCard label="HAREKET EDEN ALTIN"    value={fmt(data.daily_summary?.total_grams_moved)}         suffix="gr"    colors={colors} /></Col>
            <Col xs={12} md={8}><StatCard label="HAREKET EDEN HAS"      value={fmt((data.daily_summary?.total_has_moved ?? null) != null ? data.daily_summary.total_has_moved / 0.995 : null)}           suffix="g has" colors={colors} /></Col>
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
                    { title: 'HAS',      dataIndex: 'has_balance',  render: v => <span style={{ color: colors.subtext }}>{v != null ? fmt(v / 0.995) + ' g has' : '—'}</span> },
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
        <ReportExportBar
          data={data}
          reportType="has_vardiya"
          filenameBase={date ? `Aivora_HasVardiya_${date.format('YYYY-MM-DD')}` : 'Aivora_HasVardiya'}
          meta={{ date: date?.format('YYYY-MM-DD') }}
        />
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
                    <span style={{ color: colors.subtext }}>Takoz</span>
                    <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(d.takoz_karsiligi)} g</span>
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

const flowMergedColumns = (colors) => [
  {
    title: 'Materyal',
    render: (_, r) => <span style={{ fontSize: 11 }}>{matStr(r.material_type, r.purity, r.color)}</span>,
  },
  {
    title: 'Giren',
    dataIndex: 'incoming_grams',
    align: 'right',
    render: v => <span style={{ fontSize: 11 }}>{fmt(v)} gr</span>,
  },
  {
    title: 'Çıkan',
    dataIndex: 'outgoing_grams',
    align: 'right',
    render: v => <span style={{ fontSize: 11 }}>{fmt(v)} gr</span>,
  },
  {
    title: 'Net',
    dataIndex: 'net_grams',
    align: 'right',
    render: v => (
      <span style={{
        color: v > 0 ? '#52C41A' : v < 0 ? '#FF4D4F' : colors.subtext,
        fontWeight: 600,
        fontSize: 11,
      }}>
        {v > 0 ? '+' : ''}{fmt(v)} gr
      </span>
    ),
  },
  {
    title: 'HAS',
    dataIndex: 'net_has_internal',
    align: 'right',
    width: 100,
    render: v => (
      <span style={{ color: '#D4AF37', fontWeight: 600, fontSize: 11 }}>
        {v != null ? fmt(v / 0.995) + ' g' : '—'}
      </span>
    ),
  },
];

const kasaAyarColumns = (colors) => [
  {
    title: 'Materyal',
    render: (_, r) => <span style={{ fontSize: 11 }}>{matStr(r.material_type, r.purity, r.color)}</span>,
  },
  {
    title: 'Stok',
    dataIndex: 'weight_grams',
    render: v => <span style={{ color: '#D4AF37', fontWeight: 600 }}>{fmt(v)} gr</span>,
  },
];

const patronSectionTitle = (colors) => ({
  color: colors.text,
  fontSize: 17,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 4,
});

/* ─────────────── PATRON ÖZETİ ─────────────── */
const MasterPatronSummary = ({ colors }) => {
  const [date, setDate]       = useState(dayjs().subtract(1, 'day'));
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const dateStr = date ? date.format('YYYY-MM-DD') : null;
  const meta = data?.meta;
  const kasaSnap = data?.kasa_snapshot;

  const fetch = async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getMasterSummary(date.format('YYYY-MM-DD')));
    } catch (e) {
      setError(e.message || 'Özet rapor yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const flowRowKey = (r, i) =>
    `${r.material_type}-${r.purity}-${r.color ?? 'x'}-${i}`;

  const deptPanels = (data?.department_flows || []).map(df => ({
    key: df.department,
    label: (
      <span style={{ fontWeight: 700, fontSize: 13 }}>
        {DEPT_LABEL[df.department] || df.department}
      </span>
    ),
    children: (
      <Table
        dataSource={df.lines || []}
        columns={flowMergedColumns(colors)}
        rowKey={(r, i) => flowRowKey(r, i)}
        size="small"
        pagination={false}
        scroll={{ x: 560 }}
        locale={{ emptyText: 'Hareket yok' }}
      />
    ),
  }));

  const vardiyaClosureColumns = [
    {
      title: 'Bölüm',
      dataIndex: 'department',
      render: v => <span style={{ fontWeight: 600 }}>{DEPT_LABEL[v] || v}</span>,
    },
    {
      title: 'Kalan has',
      dataIndex: 'net_fark_has_internal',
      render: v => (
        <span style={{ color: '#D4AF37', fontWeight: 600 }}>
          {v != null ? fmt(v / 0.995) + ' g has' : '—'}
        </span>
      ),
    },
    {
      title: 'Kapanış',
      dataIndex: 'closed_at',
      render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>{dtFmt(v)}</span>,
    },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Patron özeti — kümülatif günlük özet. Detaylı transfer ve vardiya listeleri için diğer sekmeleri kullanın."
      />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Rapor Tarihi</div>
          <DatePicker value={date} onChange={setDate} format="DD.MM.YYYY" />
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={fetch} loading={loading} disabled={!date}>
          Rapor Al
        </Button>
        <ReportExportBar
          data={data}
          reportType="master_summary"
          filenameBase={dateStr ? `Aivora_Patron_Ozet_${dateStr}` : 'Aivora_Patron_Ozet'}
          meta={{ date: dateStr }}
        />
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}

      {!loading && data && (
        <>
          <h3 style={patronSectionTitle(colors)}>Özet</h3>
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={6}>
              <StatCard
                label="TRANSFER"
                value={data.transfers?.confirmed_count ?? '—'}
                suffix="onaylı"
                colors={colors}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <StatCard
                label="GÜN KAPANIŞI"
                value={meta?.day_close ? 'Evet' : 'Hayır'}
                suffix={meta?.day_close ? `(${meta.day_close.archived_count} arşiv)` : ''}
                colors={colors}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <StatCard
                label="BEKLEYEN"
                value={meta?.pending_count ?? (meta?.pending_note ? '—' : '0')}
                suffix="transfer"
                colors={colors}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <StatCard
                label="AKTİF BÖLÜM"
                value={meta?.active_department_count ?? 0}
                suffix="adet"
                colors={colors}
              />
            </Col>
          </Row>

          {meta?.pending_note && (
            <Alert type="warning" message={meta.pending_note} style={{ marginBottom: 16 }} showIcon />
          )}

          <h3 style={patronSectionTitle(colors)}>Kasa stoku</h3>
          {kasaSnap?.snapshot_note && (
            <Alert type="info" message={kasaSnap.snapshot_note} style={{ marginBottom: 12 }} showIcon />
          )}
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <StatCard
                label="HAS ALTIN (995)"
                value={fmt(kasaSnap?.has_altin_995_grams)}
                suffix="g has"
                colors={colors}
              />
            </Col>
            <Col xs={24} md={16}>
              <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 8 }}>Ayarlı stok (has hariç)</div>
              <Table
                dataSource={kasaSnap?.ayarli_stok || []}
                columns={kasaAyarColumns(colors)}
                rowKey={(r, i) => `kasa-${r.purity}-${r.color ?? 'x'}-${i}`}
                size="small"
                pagination={false}
                locale={{ emptyText: 'Ayarlı stok yok' }}
              />
            </Col>
          </Row>

          <h3 style={patronSectionTitle(colors)}>
            Bölüm hareketleri ({meta?.active_department_count ?? 0} bölüm)
          </h3>
          {deptPanels.length > 0 ? (
            <Collapse items={deptPanels} style={{ marginBottom: 24 }} />
          ) : (
            <Empty description="Bu gün hareket gören bölüm yok." style={{ marginBottom: 24 }} />
          )}

          <h3 style={patronSectionTitle(colors)}>Vardiya kapanışları</h3>
          <Table
            dataSource={data.vardiya_closures || []}
            columns={vardiyaClosureColumns}
            rowKey="kapanis_id"
            size="small"
            pagination={false}
            locale={{ emptyText: 'Bu gün onaylı vardiya kapanışı yok' }}
          />
        </>
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
      key: 'master',  label: <span><FileTextOutlined /> Patron Özeti</span>,
      children: <MasterPatronSummary colors={colors} />,
    },
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
          Patron özeti, departman, kasa, gün sonu ve HAS vardiya — PDF / Excel dışa aktarma
        </p>
      </div>

      <div style={card}>
        <Tabs items={tabItems} size="middle" />
      </div>
    </div>
  );
};

export default Reports;
