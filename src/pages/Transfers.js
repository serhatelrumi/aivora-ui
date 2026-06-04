import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, Select,
  InputNumber, Tabs, Alert, Space, Tooltip, message, Popconfirm, Drawer, DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, DatabaseOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  listTransfers, listPending, createTransfer,
  confirmTransfer, rejectTransfer, createInitialStock,
  deleteTransfer, updateTransfer, restoreTransfer, listTransferHistory,
} from '../api/transfers';
import {
  GOLD_STOCK_SELECT_OPTIONS,
  GOLD_STOCK_LINES,
  parseStockLineKey,
  purityLabel,
  lineKey,
} from '../constants/goldCatalog';

const DEPTS = [
  { value: 'kasa', label: 'Kasa' }, { value: 'ocak', label: 'Ocak' },
  { value: 'pres', label: 'Pres' }, { value: 'kaynak', label: 'Kaynak' },
  { value: 'pres_montaj', label: 'Pres Montaj' }, { value: 'cila', label: 'Cila' },
  { value: 'ayarevi', label: 'Ayar Evi' }, { value: 'cnc', label: 'CNC' },
  { value: 'kaliphane', label: 'Kalıphane' }, { value: 'dokum', label: 'Döküm' },
  { value: 'dokum_montaj', label: 'Döküm Montaj' }, { value: 'ar_ge', label: 'AR-GE' },
  { value: 'halka_kilit', label: 'Halka Kilit' }, { value: 'sarnel_kilit', label: 'Sarnel Kilit' },
  { value: 'zincir', label: 'Zincir' }, { value: 'atolye', label: 'Atölye' },
  { value: 'top', label: 'Top' },
];

const GOLD_PUR_OPTIONS = GOLD_STOCK_LINES.map((l) => ({
  value: l.color ? `${l.purity}|${l.color}` : l.purity,
  label: l.label,
}));
const FORMS = [
  { value: 'has_altin', label: 'Has Altın' },
  { value: 'ayarli_maden', label: 'Ayarlı Maden' },
  { value: 'hurda_maden', label: 'Hurda Maden' },
  { value: 'karisik_maden', label: 'Karışık Maden' },
  { value: 'ayarsiz_maden_ornegi', label: 'Ayarsız Maden Örneği' },
  { value: 'astar', label: 'Astar' }, { value: 'curuf', label: 'Curuf' },
  { value: 'dokum_cubugu', label: 'Döküm Çubuğu' },
  { value: 'basilmis_astar', label: 'Basılmış Astar' },
  { value: 'kaynak_teli', label: 'Kaynak Teli' },
  { value: 'kaynakli_yari_mamul', label: 'Kaynaklı Yarı Mamul' },
  { value: 'dokum_urun', label: 'Döküm Ürün' }, { value: 'yay', label: 'Yay' },
  { value: 'montajli_urun', label: 'Montajlı Ürün' },
  { value: 'montajli_dokum_urun', label: 'Montajlı Döküm Ürün' },
  { value: 'bitimis_montajli_urun', label: 'Bitimiş Montajlı Ürün' },
  { value: 'bitimis_montajli_dokum_urun', label: 'Bitimiş Montajlı Döküm Ürün' },
  { value: 'bitimis_zincir', label: 'Bitimiş Zincir' },
  { value: 'bitimis_boylanmis_zincir', label: 'Bitimiş Boylanmış Zincir' },
  { value: 'bitimis_top', label: 'Bitimiş Top' },
  { value: 'boylanmis_zincir', label: 'Boylanmış Zincir' },
  { value: 'cekilmis_tel', label: 'Çekilmiş Tel' },
  { value: 'zincir', label: 'Zincir' }, { value: 'top', label: 'Top' },
  { value: 'toz', label: 'Toz' }, { value: 'rapor', label: 'Rapor' },
  { value: 'halka_kilit', label: 'Halka Kilit' },
  { value: 'sarnel_kilit', label: 'Sarnel Kilit' },
  { value: 'hurda', label: 'Hurda' }, { value: 'numune', label: 'Numune' },
];

const ST_COLOR = { beklemede: 'orange', onaylandi: 'success', reddedildi: 'error' };
const ST_LABEL = { beklemede: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' };

const rowStyle = (r) => {
  if (r.is_deleted)  return { background: 'rgba(128,128,128,0.08)', opacity: 0.65, textDecoration: 'line-through' };
  if (r.is_modified && r.status === 'onaylandi') return { background: 'rgba(0,188,188,0.07)' };
  if (r.is_modified) return { background: 'rgba(250,140,0,0.08)' };
  return {};
};

const durumTag = (r) => {
  if (r.is_deleted)  return <Tag color="error" style={tagStyle}>Silindi</Tag>;
  if (r.is_modified && r.status === 'onaylandi') return <Tag color="cyan" style={tagStyle}>Onaylandı ✎</Tag>;
  if (r.is_modified) return <Tag color="magenta" style={tagStyle}>Değiştirildi</Tag>;
  return <Tag color={ST_COLOR[r.status]} style={tagStyle}>{ST_LABEL[r.status] || r.status}</Tag>;
};

const DEPT_LABEL  = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };
const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
const MAT_LABEL   = { altin: 'Altın' };
const FORM_LABEL  = Object.fromEntries(FORMS.map(f => [f.value, f.label]));

const filterOpt = (input, opt) => opt.label.toLowerCase().includes(input.toLowerCase());

const TBL_FONT = 12;
const TBL_CELL = { fontSize: TBL_FONT, whiteSpace: 'nowrap' };
const tblCol = (col) => ({
  ...col,
  onCell: () => ({ style: TBL_CELL }),
  onHeaderCell: () => ({ style: TBL_CELL }),
});
const tagStyle = { margin: 0, fontSize: TBL_FONT, lineHeight: '20px' };

const Transfers = () => {
  const { user }    = useAuth();
  const { colors }  = useTheme();

  const [all, setAll]           = useState([]);
  const [pend, setPend]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [createOpen, setCreate] = useState(false);
  const [stockOpen, setStock]   = useState(false);
  const [rejectCtx, setReject]  = useState({ open: false, id: null });
  const [busy, setBusy]         = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [editCtx, setEditCtx]   = useState(null);
  const [detailRec, setDetail]  = useState(null);
  const [history, setHistory]   = useState([]);
  const [histDates, setHistDates] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [histLoading, setHistLoading] = useState(false);

  const [cForm] = Form.useForm();
  const [sForm] = Form.useForm();
  const [rForm] = Form.useForm();
  const [eForm] = Form.useForm();

  const role       = user?.role;
  const canCreate  = ['admin', 'kasa'].includes(role);
  const isAdmin    = role === 'admin';
  const canHistory = ['admin', 'patron'].includes(role);

  const emptyActive = 'Aktif transfer yok. Gün sonu kapatıldıysa kayıtlar Raporlar → Gün Sonu veya Geçmiş sekmesinde.';

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        listTransfers().catch(() => []),
        listPending().catch(() => []),
      ]);
      setAll(a); setPend(p);
    } catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const doCreate = async (vals) => {
    setBusy(true);
    try {
      const { purity, color } = parseStockLineKey(vals.gold_line);
      await createTransfer({
        ...vals,
        material_type: 'altin',
        purity,
        color,
        product_form: vals.product_form,
      });
      message.success('Transfer oluşturuldu.');
      setCreate(false); cForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Hata oluştu.'); }
    finally { setBusy(false); }
  };

  const doConfirm = async (id) => {
    try {
      await confirmTransfer(id);
      message.success('Onaylandı.'); fetchAll();
    } catch (e) { message.error(e.message || 'Onaylama başarısız.'); }
  };

  const doReject = async () => {
    const vals = await rForm.validateFields().catch(() => null);
    if (!vals) return;
    setBusy(true);
    try {
      await rejectTransfer(rejectCtx.id, vals.rejection_reason);
      message.success('Reddedildi.');
      setReject({ open: false, id: null }); rForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const doDelete = async (id) => {
    try {
      await deleteTransfer(id);
      message.success(`Transfer #${id} silindi.`);
      fetchAll();
    } catch (e) { message.error(e.message || 'Silinemedi.'); }
  };

  const doRestore = async (id) => {
    try {
      await restoreTransfer(id);
      message.success(`Transfer #${id} geri alındı.`);
      fetchAll();
    } catch (e) {
      const msg = e.message || 'Geri alınamadı.';
      message.error(msg.includes('stok') || msg.includes('yeterli') ? msg : `Geri alınamadı: ${msg}`);
    }
  };

  const openEdit = (record) => {
    setEditCtx(record);
    const gl = lineKey(record.purity, record.color);
    eForm.setFieldsValue({
      from_department: record.from_department,
      to_department:   record.to_department,
      gold_line:       gl,
      material_type:   'altin',
      purity:          record.purity,
      color:           record.color,
      product_form:    record.product_form,
      weight_grams:    record.weight_grams,
      notes:           record.notes,
    });
  };

  const doEdit = async (vals) => {
    setBusy(true);
    try {
      const { purity, color } = parseStockLineKey(vals.gold_line);
      await updateTransfer(editCtx.id, {
        ...vals,
        material_type: 'altin',
        purity,
        color,
        product_form: vals.product_form,
      });
      message.success('Transfer güncellendi.');
      setEditCtx(null); eForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Güncellenemedi.'); }
    finally { setBusy(false); }
  };

  const fetchHistory = async () => {
    if (!histDates?.[0] || !histDates?.[1]) return;
    setHistLoading(true);
    try {
      const data = await listTransferHistory(
        histDates[0].format('YYYY-MM-DD'),
        histDates[1].format('YYYY-MM-DD'),
      );
      setHistory(data || []);
    } catch (e) { message.error(e.message || 'Geçmiş yüklenemedi.'); }
    finally { setHistLoading(false); }
  };

  const doStock = async (vals) => {
    setBusy(true);
    try {
      const { purity, color } = parseStockLineKey(vals.stock_line);
      await createInitialStock({
        purity,
        color,
        weight_grams: vals.weight_grams,
        product_form: vals.product_form,
        notes: vals.notes,
      });
      message.success('Başlangıç stoğu girildi.');
      setStock(false); sForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12 };

  const columns = (withActions) => [
    tblCol({
      title: '#', dataIndex: 'id', width: 48,
      sorter: (a, b) => a.id - b.id,
      render: v => <span style={{ color: colors.subtext }}>#{v}</span>,
    }),
    tblCol({
      title: 'Gönderen', dataIndex: 'from_department', width: 112,
      sorter: (a, b) => (DEPT_LABEL[a.from_department] || a.from_department || '').localeCompare(DEPT_LABEL[b.from_department] || b.from_department || '', 'tr'),
      render: v => <Tag color="orange" style={tagStyle}>{DEPT_LABEL[v] || v || 'Dış Kaynak'}</Tag>,
    }),
    tblCol({
      title: 'Alıcı', dataIndex: 'to_department', width: 100,
      sorter: (a, b) => (DEPT_LABEL[a.to_department] || a.to_department || '').localeCompare(DEPT_LABEL[b.to_department] || b.to_department || '', 'tr'),
      render: v => <Tag color="blue" style={tagStyle}>{DEPT_LABEL[v] || v || 'Kasa'}</Tag>,
    }),
    tblCol({
      title: 'Maden', dataIndex: 'material_type', width: 58,
      sorter: (a, b) => (MAT_LABEL[a.material_type] || a.material_type || '').localeCompare(MAT_LABEL[b.material_type] || b.material_type || '', 'tr'),
      render: v => MAT_LABEL[v] || v || '—',
    }),
    tblCol({
      title: 'Ayar', dataIndex: 'purity', width: 158,
      render: (_, r) => purityLabel(r.purity, r.color),
    }),
    tblCol({
      title: 'Renk', dataIndex: 'color', width: 72,
      sorter: (a, b) => (COLOR_LABEL[a.color] || a.color || '').localeCompare(COLOR_LABEL[b.color] || b.color || '', 'tr'),
      render: v => v
        ? COLOR_LABEL[v] || v
        : <span style={{ color: colors.subtext }}>—</span>,
    }),
    tblCol({
      title: 'Maden türü', dataIndex: 'product_form', width: 128,
      render: v => FORM_LABEL[v] || v || '—',
    }),
    tblCol({
      title: 'Ağırlık', dataIndex: 'weight_grams', width: 118,
      sorter: (a, b) => (a.weight_grams || 0) - (b.weight_grams || 0),
      render: v => (
        <span style={{ color: colors.gold }}>
          {typeof v === 'number' ? `${v.toFixed(2)}\u00a0gr` : v}
        </span>
      ),
    }),
    tblCol({
      title: 'HAS', dataIndex: 'has_value', width: 100,
      sorter: (a, b) => (a.has_value || 0) - (b.has_value || 0),
      render: v => (v != null ? `${(v / 0.995).toFixed(2)}\u00a0g` : '—'),
    }),
    tblCol({
      title: 'Durum', dataIndex: 'status', width: 118,
      sorter: (a, b) => (ST_LABEL[a.status] || a.status || '').localeCompare(ST_LABEL[b.status] || b.status || '', 'tr'),
      render: (_, r) => durumTag(r),
    }),
    tblCol({
      title: 'Saat', dataIndex: 'created_at', key: 'saat', width: 92,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => (
        <span style={{ color: colors.subtext }}>
          {new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      ),
    }),
    tblCol({
      title: 'Tarih', dataIndex: 'created_at', key: 'tarih', width: 102,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => <span style={{ color: colors.subtext }}>{new Date(v).toLocaleDateString('tr-TR')}</span>,
    }),
    withActions && tblCol({
      title: 'İşlem', width: 88,
      render: (_, r) => r.status === 'beklemede' ? (
        <Space size={4}>
          <Tooltip title="Onayla">
            <Button size="small" icon={<CheckOutlined />} onClick={() => doConfirm(r.id)}
              style={{ background: '#52C41A', borderColor: '#52C41A', color: '#fff' }} />
          </Tooltip>
          <Tooltip title="Reddet">
            <Button danger size="small" icon={<CloseOutlined />} onClick={() => setReject({ open: true, id: r.id })} />
          </Tooltip>
        </Space>
      ) : null,
    }),
    isAdmin && tblCol({
      title: 'Yönetim', width: 92, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          {r.is_deleted ? (
            <Popconfirm
              title={`#${r.id} geri alınacak${r.status === 'onaylandi' ? ' ve bakiyeler yeniden uygulanacak' : ''}. Emin misiniz?`}
              onConfirm={() => doRestore(r.id)}
              okText="Evet, Geri Al"
              cancelText="Vazgeç"
            >
              <Tooltip title="Geri Al">
                <Button size="small" icon={<UndoOutlined />} style={{ color: '#52C41A', borderColor: '#52C41A' }} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <>
              {r.status === 'beklemede' && (
                <Tooltip title="Düzenle">
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                </Tooltip>
              )}
              <Popconfirm
                title={r.status === 'onaylandi'
                  ? `#${r.id} onaylı transfer silinecek ve bakiyeler geri alınacak. Emin misiniz?`
                  : `#${r.id} transfer silinecek. Emin misiniz?`}
                onConfirm={() => doDelete(r.id)}
                okText="Evet, Sil"
                cancelText="Vazgeç"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Sil">
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    }),
  ].filter(Boolean);

  const defaultProductForm = (purity) => (purity === 'has_995' ? 'has_altin' : 'ayarli_maden');

  const applyGoldLine = (form, lineKeyVal) => {
    const { purity, color } = parseStockLineKey(lineKeyVal);
    form.setFieldsValue({
      material_type: 'altin',
      purity,
      color: color || undefined,
      product_form: defaultProductForm(purity),
    });
  };

  const applyStockLine = (form, lineKeyVal) => {
    const { purity } = parseStockLineKey(lineKeyVal);
    const current = form.getFieldValue('product_form');
    form.setFieldsValue({
      product_form: current || defaultProductForm(purity),
    });
  };

  const TransferFormFields = ({ form }) => (
    <>
      <Form.Item name="from_department" label="Gönderen" rules={[{ required: true }]}>
        <Select options={DEPTS} placeholder="Gönderen departman" showSearch filterOption={filterOpt} />
      </Form.Item>
      <Form.Item name="to_department" label="Alıcı" rules={[{ required: true }]}>
        <Select options={DEPTS} placeholder="Alıcı departman" showSearch filterOption={filterOpt} />
      </Form.Item>
      <Form.Item name="gold_line" label="Ayar" rules={[{ required: true }]}>
        <Select
          options={GOLD_PUR_OPTIONS}
          placeholder="Ayar seçin"
          showSearch
          filterOption={filterOpt}
          onChange={(v) => applyGoldLine(form, v)}
        />
      </Form.Item>
      <Form.Item name="product_form" label="Maden türü" rules={[{ required: true }]} initialValue="ayarli_maden">
        <Select options={FORMS} placeholder="Maden türü seçin" showSearch filterOption={filterOpt} />
      </Form.Item>
      <Form.Item name="material_type" hidden initialValue="altin"><Input /></Form.Item>
      <Form.Item name="purity" hidden><Input /></Form.Item>
      <Form.Item name="color" hidden><Input /></Form.Item>
      <Form.Item name="weight_grams" label="Ağırlık (gr)" rules={[{ required: true }]}>
        <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
      </Form.Item>
      <Form.Item name="notes" label="Notlar">
        <Input.TextArea rows={2} placeholder="İsteğe bağlı not..." />
      </Form.Item>
    </>
  );

  const StockFormFields = ({ form }) => (
    <>
      <Form.Item name="stock_line" label="Altın türü" rules={[{ required: true }]}>
        <Select
          options={GOLD_STOCK_SELECT_OPTIONS}
          placeholder="Ayar seçin"
          showSearch
          filterOption={filterOpt}
          onChange={(v) => applyStockLine(form, v)}
        />
      </Form.Item>
      <Form.Item name="product_form" label="Maden türü" rules={[{ required: true }]} initialValue="ayarli_maden">
        <Select options={FORMS} placeholder="Maden türü seçin" showSearch filterOption={filterOpt} />
      </Form.Item>
      <Form.Item name="weight_grams" label="Ağırlık (gr)" rules={[{ required: true }]}>
        <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
      </Form.Item>
      <Form.Item name="notes" label="Notlar">
        <Input.TextArea rows={2} placeholder="İsteğe bağlı not..." />
      </Form.Item>
    </>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Transferler</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>Yenile</Button>
          {isAdmin && (
            <Button icon={<DatabaseOutlined />} onClick={() => setStock(true)}>Başlangıç Stoğu</Button>
          )}
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreate(true)}>Yeni Transfer</Button>
          )}
        </Space>
      </div>

      <div style={cardStyle}>
        <Tabs
          defaultActiveKey="all"
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'all', label: 'Tümü',
              children: <Table dataSource={all} columns={columns(false)} rowKey="id"
                loading={loading} size="small"
                onRow={(r) => ({ style: { ...rowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: emptyActive }} scroll={{ x: 1500 }} tableLayout="fixed" />,
            },
            {
              key: 'pend', label: 'Beklemede (' + pend.length + ')',
              children: <Table dataSource={pend} columns={columns(true)} rowKey="id"
                loading={loading} size="small"
                onRow={(r) => ({ style: { ...rowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: 'Bekleyen transfer yok' }} scroll={{ x: 1580 }} tableLayout="fixed" />,
            },
            ...(canHistory ? [{
              key: 'hist',
              label: 'Geçmiş',
              children: (
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Tarih aralığı</div>
                      <DatePicker.RangePicker
                        value={histDates}
                        onChange={setHistDates}
                        format="DD.MM.YYYY"
                      />
                    </div>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={fetchHistory} loading={histLoading}>
                      Listele
                    </Button>
                  </div>
                  <Table dataSource={history} columns={columns(false)} rowKey="id"
                    loading={histLoading} size="small"
                    onRow={(r) => ({ style: { ...rowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'Arşivlenmiş transfer bulunamadı' }}
                    scroll={{ x: 1500 }} tableLayout="fixed" />
                </div>
              ),
            }] : []),
          ]}
        />
      </div>

      {/* DETAIL DRAWER */}
      <Drawer
        title={detailRec ? `Transfer #${detailRec.id}` : ''}
        open={!!detailRec}
        onClose={() => setDetail(null)}
        width={420}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {detailRec && (() => {
          const r = detailRec;
          const dtFmt = (v) => v ? new Date(v).toLocaleString('tr-TR') : '—';
          const item = (label, value) => (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13 }}>{value}</div>
            </div>
          );
          return (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {durumTag(r)}
                <Tag color="gold">{purityLabel(r.purity, r.color)}</Tag>
                {r.color && <Tag>{COLOR_LABEL[r.color] || r.color}</Tag>}
                {r.is_deleted && <Tag color="error">Silindi</Tag>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {item('GÖNDEREN', <Tag color="orange">{DEPT_LABEL[r.from_department] || r.from_department || 'Dış Kaynak'}</Tag>)}
                {item('ALICI', <Tag color="blue">{DEPT_LABEL[r.to_department] || r.to_department || 'Kasa'}</Tag>)}
                {item('MATERYAL', MAT_LABEL[r.material_type] || r.material_type)}
                {item('AYAR', purityLabel(r.purity, r.color))}
                {item('AĞIRLIK', <span style={{ color: '#D4AF37', fontWeight: 700 }}>{r.weight_grams?.toFixed(2)} gr</span>)}
                {item('HAS', r.has_value != null ? <span style={{ fontWeight: 600 }}>{(r.has_value / 0.995).toFixed(2)} g</span> : '—')}
                {item('MADEN TÜRÜ', FORM_LABEL[r.product_form] || r.product_form || '—')}
                {item('OLUŞTURULMA', dtFmt(r.created_at))}
                {r.confirmed_at && item('ONAYLANDI', dtFmt(r.confirmed_at))}
                {r.rejection_reason && item('RED NEDENİ', <span style={{ color: '#ff4d4f' }}>{r.rejection_reason}</span>)}
              </div>

              {r.notes && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, marginBottom: 6 }}>NOTLAR</div>
                  <div style={{
                    background: 'rgba(128,128,128,0.08)',
                    borderRadius: 6, padding: '10px 12px',
                    fontSize: 12, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {r.notes}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* CREATE */}
      <Modal title="Yeni Transfer" open={createOpen}
        onCancel={() => { setCreate(false); cForm.resetFields(); }}
        onOk={() => cForm.submit()} okText="Oluştur" cancelText="İptal"
        confirmLoading={busy} width={520}>
        <Form form={cForm} layout="vertical" onFinish={doCreate} style={{ marginTop: 16 }}>
          <TransferFormFields form={cForm} />
        </Form>
      </Modal>

      {/* INITIAL STOCK */}
      <Modal title="Başlangıç Stoğu" open={stockOpen}
        onCancel={() => { setStock(false); sForm.resetFields(); }}
        onOk={() => sForm.submit()} okText="Kaydet" cancelText="İptal"
        confirmLoading={busy} width={520}>
        <Form form={sForm} layout="vertical" onFinish={doStock} style={{ marginTop: 16 }}>
          <StockFormFields form={sForm} />
        </Form>
      </Modal>

      {/* REJECT */}
      <Modal title="Transfer Reddet" open={rejectCtx.open}
        onCancel={() => { setReject({ open: false, id: null }); rForm.resetFields(); }}
        onOk={doReject} okText="Reddet" okButtonProps={{ danger: true }}
        cancelText="İptal" confirmLoading={busy}>
        <Form form={rForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="rejection_reason" label="Red Nedeni" rules={[{ required: true, message: 'Gerekli.' }]}>
            <Input.TextArea rows={3} placeholder="Transfer neden reddediliyor?" />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT (admin, beklemede only) */}
      <Modal
        title={editCtx ? `Transfer #${editCtx.id} Düzenle` : 'Düzenle'}
        open={!!editCtx}
        onCancel={() => { setEditCtx(null); eForm.resetFields(); }}
        onOk={() => eForm.submit()}
        okText="Kaydet"
        cancelText="İptal"
        confirmLoading={busy}
        width={520}
      >
        <Form form={eForm} layout="vertical" onFinish={doEdit} style={{ marginTop: 16 }}>
          <TransferFormFields form={eForm} />
        </Form>
      </Modal>
    </div>
  );
};

export default Transfers;
