import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, Select,
  InputNumber, Tabs, Alert, Space, Tooltip, message, Popconfirm, DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined, CheckOutlined, DatabaseOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  listTransfers, listPending, createTransfer,
  confirmTransfer, createInitialStock,
  deleteTransfer, updateTransfer, restoreTransfer, listTransferHistory,
} from '../api/transfers';
import {
  GOLD_STOCK_SELECT_OPTIONS,
  parseStockLineKey,
  purityLabel,
  TRANSFER_COLOR_OPTIONS,
  purityRequiresColor,
} from '../constants/goldCatalog';
import TransferDetailDrawer from '../components/transfers/TransferDetailDrawer';
import { TRANSFER_LEGEND, getTransferStatusDotColor } from '../constants/transferStatus';
import {
  EXTERNAL_DEPT_VALUE,
  FROM_DEPT_OPTIONS,
  HAS_PURITY,
  HAS_PRODUCT_FORM,
  KASA,
  getAllowedPurities,
  getAllowedProductForms,
  isProductFormLocked,
  normalizeFromDepartment,
  validateTransfer,
} from '../constants/transferRules';

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

const StatusDot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: color,
      boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
      flexShrink: 0,
    }}
    aria-hidden
  />
);

const getRowStyle = (r) => {
  if (r.is_deleted) return { opacity: 0.65, textDecoration: 'line-through' };
  return {};
};

const deptNotSameAs = (otherField) => ({ getFieldValue }) => ({
  validator(_, value) {
    const other = getFieldValue(otherField);
    if (value && other && value === other && value !== EXTERNAL_DEPT_VALUE) {
      return Promise.reject(new Error('Gönderen ve alıcı aynı departman olamaz.'));
    }
    return Promise.resolve();
  },
});

const buildTransferPayload = (vals) => {
  const from = normalizeFromDepartment(vals.from_department);
  return {
    from_department: from,
    to_department: vals.to_department,
    material_type: 'altin',
    purity: vals.purity,
    color: vals.color || null,
    product_form: vals.product_form,
    weight_grams: vals.weight_grams,
    notes: vals.notes,
  };
};

const fromDeptOptions = [...FROM_DEPT_OPTIONS, ...DEPTS];

const DEPT_LABEL  = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };
const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
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
  const [busy, setBusy]         = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [editCtx, setEditCtx]   = useState(null);
  const [detailRec, setDetail]  = useState(null);
  const [history, setHistory]   = useState([]);
  const [histDates, setHistDates] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [histLoading, setHistLoading] = useState(false);

  const [cForm] = Form.useForm();
  const [sForm] = Form.useForm();
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
    const ruleErr = validateTransfer(vals);
    if (ruleErr) {
      message.error(ruleErr);
      return;
    }
    setBusy(true);
    try {
      await createTransfer(buildTransferPayload(vals));
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
    eForm.setFieldsValue({
      from_department: record.from_department ?? EXTERNAL_DEPT_VALUE,
      to_department:   record.to_department,
      material_type:   'altin',
      purity:          record.purity,
      color:           record.color || undefined,
      product_form:    record.product_form,
      weight_grams:    record.weight_grams,
      notes:           record.notes,
    });
  };

  const doEdit = async (vals) => {
    const ruleErr = validateTransfer(vals);
    if (ruleErr) {
      message.error(ruleErr);
      return;
    }
    setBusy(true);
    try {
      await updateTransfer(editCtx.id, buildTransferPayload(vals));
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
      title: '',
      key: 'status_dot',
      width: 28,
      render: (_, r) => (
        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <StatusDot color={getTransferStatusDotColor(r)} />
        </span>
      ),
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
      title: 'Ayar', dataIndex: 'purity', width: 110,
      render: (_, r) => purityLabel(r.purity, null),
    }),
    tblCol({
      title: 'Renk', dataIndex: 'color', width: 72,
      sorter: (a, b) => (COLOR_LABEL[a.color] || a.color || '').localeCompare(COLOR_LABEL[b.color] || b.color || '', 'tr'),
      render: v => v
        ? COLOR_LABEL[v] || v
        : <span style={{ color: colors.subtext }}>—</span>,
    }),
    tblCol({
      title: 'Ağırlık', dataIndex: 'weight_grams', width: 100,
      sorter: (a, b) => (a.weight_grams || 0) - (b.weight_grams || 0),
      render: v => (
        <span style={{ color: colors.gold }}>
          {typeof v === 'number' ? `${v.toFixed(2)}\u00a0gr` : v}
        </span>
      ),
    }),
    tblCol({
      title: 'Saat', dataIndex: 'created_at', key: 'saat', width: 88,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => (
        <span style={{ color: colors.subtext }}>
          {new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      ),
    }),
    tblCol({
      title: 'HAS', dataIndex: 'has_value', width: 88,
      sorter: (a, b) => (a.has_value || 0) - (b.has_value || 0),
      render: v => (
        <span style={{ color: colors.gold }}>
          {v != null ? `${(v / 0.995).toFixed(2)}\u00a0g` : '—'}
        </span>
      ),
    }),
    tblCol({
      title: 'Tarih', dataIndex: 'created_at', key: 'tarih', width: 100,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => <span style={{ color: colors.subtext }}>{new Date(v).toLocaleDateString('tr-TR')}</span>,
    }),
    withActions && tblCol({
      title: 'İşlem', width: 52,
      render: (_, r) => r.status === 'beklemede' ? (
        <Tooltip title="Onayla">
          <Button size="small" icon={<CheckOutlined />} onClick={(e) => { e.stopPropagation(); doConfirm(r.id); }}
            style={{ background: '#22C55E', borderColor: '#22C55E', color: '#fff' }} />
        </Tooltip>
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
                <Button size="small" icon={<UndoOutlined />} onClick={(e) => e.stopPropagation()} style={{ color: '#52C41A', borderColor: '#52C41A' }} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <>
              {r.status === 'beklemede' && (
                <Tooltip title="Düzenle">
                  <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(r); }} />
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
                  <Button danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    }),
  ].filter(Boolean);

  const defaultProductForm = (purity) => (purity === HAS_PURITY ? HAS_PRODUCT_FORM : 'ayarli_maden');

  const onPurityChange = (form, purity) => {
    form.setFieldsValue({
      material_type: 'altin',
      purity,
      color: undefined,
      product_form: defaultProductForm(purity),
    });
  };

  const excludeDept = (options, dept) => {
    if (!dept || dept === EXTERNAL_DEPT_VALUE) return options;
    return options.filter((o) => o.value !== dept);
  };

  const syncFormOnDeptChange = (form, from, to) => {
    const allowed = getAllowedPurities(from, to).map((o) => o.value);
    const currentPurity = form.getFieldValue('purity');
    const patch = {};

    if (from === EXTERNAL_DEPT_VALUE) {
      patch.to_department = KASA;
      patch.purity = HAS_PURITY;
      patch.product_form = HAS_PRODUCT_FORM;
      patch.color = undefined;
    } else {
      if (from && to === from) {
        patch.to_department = undefined;
      }
      if (currentPurity && !allowed.includes(currentPurity)) {
        patch.purity = undefined;
        patch.color = undefined;
        patch.product_form = 'ayarli_maden';
      }
    }

    if (Object.keys(patch).length) {
      form.setFieldsValue(patch);
    }
  };

  const applyStockLine = (form, lineKeyVal) => {
    const { purity } = parseStockLineKey(lineKeyVal);
    form.setFieldsValue({
      product_form: defaultProductForm(purity),
    });
  };

  const TransferFormFields = ({ form }) => {
    const fromDept = Form.useWatch('from_department', form);
    const toDept = Form.useWatch('to_department', form);
    const purity = Form.useWatch('purity', form);
    const showColor = purityRequiresColor(purity);
    const purityOptions = getAllowedPurities(fromDept, toDept);
    const formOptions = getAllowedProductForms(purity, FORMS);
    const productFormLocked = isProductFormLocked(purity);
    const isHasEntryForm = fromDept === EXTERNAL_DEPT_VALUE && toDept === KASA;
    const senderOptions = excludeDept(fromDeptOptions, toDept);
    const recipientOptions = excludeDept(DEPTS, fromDept);

    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Has altın yalnızca Dış Kaynak → Kasa girişinde kullanılır. Fabrika içi trafik ayarlı maden ve ürün formları ile yapılır."
        />
        <Form.Item
          name="from_department"
          label="Gönderen"
          rules={[{ required: true }, deptNotSameAs('to_department')]}
          dependencies={['to_department']}
        >
          <Select
            options={senderOptions}
            placeholder="Gönderen departman"
            showSearch
            filterOption={filterOpt}
            onChange={(v) => {
              syncFormOnDeptChange(form, v, form.getFieldValue('to_department'));
              form.validateFields(['to_department']);
            }}
          />
        </Form.Item>
        <Form.Item
          name="to_department"
          label="Alıcı"
          rules={[{ required: true }, deptNotSameAs('from_department')]}
          dependencies={['from_department']}
        >
          <Select
            options={recipientOptions}
            placeholder="Alıcı departman"
            showSearch
            filterOption={filterOpt}
            disabled={fromDept === EXTERNAL_DEPT_VALUE}
            onChange={(v) => {
              syncFormOnDeptChange(form, form.getFieldValue('from_department'), v);
              form.validateFields(['from_department']);
            }}
          />
        </Form.Item>
        <Form.Item name="purity" label="Ayar" rules={[{ required: true, message: 'Ayar seçin.' }]}>
          <Select
            options={purityOptions}
            placeholder="Ayar seçin"
            showSearch
            filterOption={filterOpt}
            disabled={isHasEntryForm}
            onChange={(v) => onPurityChange(form, v)}
          />
        </Form.Item>
        {showColor && (
          <Form.Item
            name="color"
            label="Renk"
            rules={[{ required: true, message: 'Renk seçin.' }]}
          >
            <Select
              options={TRANSFER_COLOR_OPTIONS}
              placeholder="Renk seçin"
              allowClear={false}
            />
          </Form.Item>
        )}
        <Form.Item name="product_form" label="Maden türü" rules={[{ required: true }]} initialValue="ayarli_maden">
          <Select
            options={formOptions}
            placeholder="Maden türü seçin"
            showSearch
            filterOption={filterOpt}
            disabled={productFormLocked}
          />
        </Form.Item>
        <Form.Item name="material_type" hidden initialValue="altin"><Input /></Form.Item>
        <Form.Item name="weight_grams" label="Ağırlık (gr)" rules={[{ required: true }]}>
          <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="notes" label="Notlar">
          <Input.TextArea rows={2} placeholder="İsteğe bağlı not..." />
        </Form.Item>
      </>
    );
  };

  const StockFormFields = ({ form }) => {
    const stockLine = Form.useWatch('stock_line', form);
    const stockPurity = stockLine ? parseStockLineKey(stockLine).purity : undefined;
    const stockFormLocked = isProductFormLocked(stockPurity);
    const stockFormOptions = getAllowedProductForms(stockPurity, FORMS);

    return (
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
        <Select
          options={stockFormOptions.length ? stockFormOptions : FORMS}
          placeholder="Maden türü seçin"
          showSearch
          filterOption={filterOpt}
          disabled={stockFormLocked}
        />
      </Form.Item>
      <Form.Item name="weight_grams" label="Ağırlık (gr)" rules={[{ required: true }]}>
        <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
      </Form.Item>
      <Form.Item name="notes" label="Notlar">
        <Input.TextArea rows={2} placeholder="İsteğe bağlı not..." />
      </Form.Item>
    </>
    );
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>Transferler</h2>
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

      <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        {TRANSFER_LEGEND.map((item) => (
          <span key={item.label} style={{ fontSize: 12, color: colors.subtext, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.hex, display: 'inline-block', flexShrink: 0 }} />
            {item.label}
          </span>
        ))}
      </div>

      <div style={cardStyle}>
        <Tabs
          defaultActiveKey={role === 'kasa' ? 'pend' : 'all'}
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'all', label: 'Tümü',
              children: <Table dataSource={all} columns={columns(false)} rowKey="id"
                loading={loading} size="small"
                onRow={(r) => ({ style: { ...getRowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: emptyActive }} scroll={{ x: 1096 }} tableLayout="fixed" />,
            },
            {
              key: 'pend', label: 'Beklemede (' + pend.length + ')',
              children: <Table dataSource={pend} columns={columns(true)} rowKey="id"
                loading={loading} size="small"
                onRow={(r) => ({ style: { ...getRowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: 'Bekleyen transfer yok' }} scroll={{ x: 1148 }} tableLayout="fixed" />,
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
                    onRow={(r) => ({ style: { ...getRowStyle(r), cursor: 'pointer' }, onClick: () => setDetail(r) })}
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'Arşivlenmiş transfer bulunamadı' }}
                    scroll={{ x: 1096 }} tableLayout="fixed" />
                </div>
              ),
            }] : []),
          ]}
        />
      </div>

      <TransferDetailDrawer
        record={detailRec}
        onClose={() => setDetail(null)}
        colors={colors}
      />

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
