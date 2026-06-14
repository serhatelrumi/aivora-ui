import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Modal, Form, InputNumber, Alert, message, Tooltip,
} from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getBorcTakibi } from '../api/vardiya';
import { updateReelTakoz } from '../api/takoz';
import { fmt } from '../utils/reportLabels';

const DEPT_LABEL = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };

// has(995) display from a stored pure-gold has value
const toHas = (v) => v != null ? (v / 0.995) : null;
// has(995) from grams + binde purity
const hasFromBinde = (gram, binde) => gram > 0 && binde > 0 ? (gram * binde) / 995 : null;

const Borclar = () => {
  const { user }   = useAuth();
  const { colors } = useTheme();
  const isPatron   = ['admin', 'patron'].includes(user?.role);

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);
  const [reelCtx, setReel]    = useState({ open: false, takoz: null });
  const [rLive, setRLive]     = useState({ ayar: null });
  const [rForm] = Form.useForm();

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try { setRows(await getBorcTakibi() || []); }
    catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const openReel = (takoz) => {
    const binde = takoz.reel_ayar != null ? +(takoz.reel_ayar * 1000).toFixed(2) : undefined;
    setReel({ open: true, takoz });
    rForm.setFieldsValue({ reel_ayar: binde });
    setRLive({ ayar: binde ?? null });
  };

  const doReelUpdate = async (vals) => {
    setBusy(true);
    try {
      const gram = reelCtx.takoz?.gram || 0;
      const reelOran = vals.reel_ayar / 1000;
      const reelHasPure = +(gram * reelOran).toFixed(2);
      await updateReelTakoz(reelCtx.takoz.id, { reel_ayar: reelOran, reel_has_degeri: reelHasPure });
      message.success('Reel değer kaydedildi.');
      setReel({ open: false, takoz: null }); rForm.resetFields(); setRLive({ ayar: null });
      fetchData();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const columns = [
    { title: 'Departman', dataIndex: 'department', render: v => <Tag color="blue">{DEPT_LABEL[v] || v}</Tag> },
    { title: 'Kapanış', dataIndex: 'kapanis_sayisi', render: v => <span>{v}</span> },
    { title: 'Brüt Borç (D)', dataIndex: 'toplam_brut_borc', render: v => <span style={{ fontWeight: 600 }}>{fmt(toHas(v))} g</span> },
    { title: 'Takoz (E)', dataIndex: 'toplam_takoz_tahmini', render: v => <span style={{ color: colors.gold }}>{fmt(toHas(v))} g</span> },
    {
      title: 'Tahmini Net +/-', dataIndex: 'tahmini_net',
      render: (v, row) => {
        const h = toHas(v) ?? 0;
        // Renk: takoz teslim ettiyse turuncu (reel mutabakat bekliyor), etmediyse yeşil.
        const takozVar = (row.takozlar || []).length > 0;
        return <strong style={{ color: takozVar ? '#FAAD14' : '#52C41A' }}>{fmt(h)} g</strong>;
      },
    },
    { title: 'Bekleyen Takoz', dataIndex: 'bekleyen_takoz_sayisi', render: v => v > 0 ? <Tag color="orange">{v} adet</Tag> : <Tag color="green">yok</Tag> },
    { title: 'Son Mizan', dataIndex: 'son_mizan_tarihi', render: v => <span style={{ color: colors.subtext, fontSize: 12 }}>{v ? dayjs(v).format('DD.MM.YYYY') : '—'}</span> },
  ];

  const takozColumns = [
    { title: 'Teslim', dataIndex: 'created_at', render: v => <span style={{ fontSize: 12 }}>{v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'}</span> },
    { title: 'Gram', dataIndex: 'gram', render: v => <span style={{ color: colors.gold, fontWeight: 600 }}>{fmt(v)} gr</span> },
    { title: 'Tahmini Ayar', dataIndex: 'tahmini_ayar', render: v => <span>{v ? (v * 1000).toFixed(2) : '—'}</span> },
    { title: 'Tahmini HAS', dataIndex: 'tahmini_has_degeri', render: v => <span>{fmt(toHas(v))} g</span> },
    { title: 'Reel Ayar', dataIndex: 'reel_ayar', render: v => v != null ? <Tag color="green">{(v * 1000).toFixed(2)}</Tag> : <span style={{ color: colors.subtext }}>—</span> },
    { title: 'Reel HAS', dataIndex: 'reel_has_degeri', render: v => v != null ? <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(toHas(v))} g</span> : <span style={{ color: colors.subtext }}>—</span> },
    isPatron && {
      title: 'İşlem', width: 110,
      render: (_, t) => (
        <Tooltip title="Ayarevi reel sonucunu gir">
          <Button size="small" icon={<EditOutlined />} onClick={() => openReel(t)}>Reel Gir</Button>
        </Tooltip>
      ),
    },
  ].filter(Boolean);

  const expanded = (row) => (
    <Table
      dataSource={row.takozlar} columns={takozColumns} rowKey="id"
      size="small" pagination={false}
      locale={{ emptyText: 'Bu dönemde takoz yok' }}
    />
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Bölüm Borç Takibi</h2>
          <p style={{ color: colors.subtext, fontSize: 12, margin: '4px 0 0' }}>
            Son onaylı mizandan bu yana biriken tahmini +/- borçlar · ayarevi reel sonuçları buradan girilir
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} />
      </div>

      <div style={card}>
        <Table
          dataSource={rows} columns={columns} rowKey="department"
          loading={loading} size="small"
          pagination={false}
          expandable={{ expandedRowRender: expanded, rowExpandable: r => (r.takozlar || []).length > 0 }}
          locale={{ emptyText: 'Bekleyen borç/takoz olan bölüm yok' }}
          style={{ padding: '8px 0' }}
        />
      </div>

      <Modal title="Ayarevi Reel Sonucu" open={reelCtx.open}
        onCancel={() => { setReel({ open: false, takoz: null }); rForm.resetFields(); setRLive({ ayar: null }); }}
        onOk={() => rForm.validateFields().then(doReelUpdate)} okText="Kaydet" cancelText="İptal"
        confirmLoading={busy} width={420}>
        {reelCtx.takoz && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: colors.bg, borderRadius: 8, fontSize: 12, color: colors.subtext }}>
            <strong style={{ color: colors.text }}>{DEPT_LABEL[reelCtx.takoz.department] || ''} — {fmt(reelCtx.takoz.gram)} gr</strong>
            <br />Tahmini ayar: {(reelCtx.takoz.tahmini_ayar * 1000).toFixed(2)} = {fmt(toHas(reelCtx.takoz.tahmini_has_degeri))} g HAS
          </div>
        )}
        <Form form={rForm} layout="vertical"
          onValuesChange={(_, all) => setRLive({ ayar: all.reel_ayar })}>
          <Form.Item name="reel_ayar" label="Reel Ayar" rules={[{ required: true }]}
            extra="Ayarevinin kesin (kimyasal) sonucu">
            <InputNumber min={0.01} max={1000} step={0.01} precision={2} style={{ width: '100%' }} placeholder="Ayarevi sonucu" />
          </Form.Item>
          <div style={{ padding: '10px 14px', background: colors.bg, borderRadius: 8, fontSize: 13 }}>
            <span style={{ color: colors.subtext }}>Reel HAS değeri: </span>
            <strong style={{ color: '#52C41A' }}>
              {hasFromBinde(reelCtx.takoz?.gram, rLive.ayar) != null
                ? fmt(hasFromBinde(reelCtx.takoz?.gram, rLive.ayar)) + ' gr'
                : '—'}
            </strong>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Borclar;
