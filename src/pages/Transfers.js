import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, Select,
  InputNumber, Tabs, Alert, Space, Tooltip, message, Popconfirm,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, DatabaseOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  listTransfers, listPending, createTransfer,
  confirmTransfer, rejectTransfer, createInitialStock,
  deleteTransfer, updateTransfer, restoreTransfer,
} from '../api/transfers';

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

const GOLD_PUR = [
  { value: '8k', label: '8 Ayar' }, { value: '9k', label: '9 Ayar' },
  { value: '10k', label: '10 Ayar' }, { value: '14k', label: '14 Ayar' },
  { value: '18k', label: '18 Ayar' }, { value: '21k', label: '21 Ayar' },
  { value: '22k', label: '22 Ayar' }, { value: 'altin_diger', label: 'Altın Diğer' },
];
const SILV_PUR = [{ value: '925', label: '925 (Gümüş)' }];
const COLORED  = ['8k', '9k', '10k', '14k', '18k'];
const COLORS   = [
  { value: 'yesil', label: 'Yeşil Altın' },
  { value: 'kirmizi', label: 'Kırmızı / Rosé' },
  { value: 'beyaz', label: 'Beyaz Altın' },
];
const FORMS = [
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
  if (r.is_deleted)  return <Tag color="error">Silindi</Tag>;
  if (r.is_modified && r.status === 'onaylandi') return <Tag color="cyan">Onaylandı ✎</Tag>;
  if (r.is_modified) return <Tag color="magenta">Değiştirildi</Tag>;
  return <Tag color={ST_COLOR[r.status]}>{ST_LABEL[r.status] || r.status}</Tag>;
};

const DEPT_LABEL  = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };
const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
const PUR_LABEL   = { '8k':'8 Ayar','9k':'9 Ayar','10k':'10 Ayar','14k':'14 Ayar','18k':'18 Ayar','21k':'21 Ayar','22k':'22 Ayar','925':'925 Gümüş','altin_diger':'Altın Diğer' };
const MAT_LABEL   = { altin: 'Altın', gumus: 'Gümüş' };

const filterOpt = (input, opt) => opt.label.toLowerCase().includes(input.toLowerCase());

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

  const [cForm] = Form.useForm();
  const [sForm] = Form.useForm();
  const [rForm] = Form.useForm();
  const [eForm] = Form.useForm();

  const role       = user?.role;
  const canCreate  = ['admin', 'kasa'].includes(role);
  const isAdmin    = role === 'admin';

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
      await createTransfer(vals);
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
    } catch (e) { message.error(e.message || 'Geri alınamadı.'); }
  };

  const openEdit = (record) => {
    setEditCtx(record);
    eForm.setFieldsValue({
      from_department: record.from_department,
      to_department:   record.to_department,
      material_type:   record.material_type,
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
      await updateTransfer(editCtx.id, vals);
      message.success('Transfer güncellendi.');
      setEditCtx(null); eForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Güncellenemedi.'); }
    finally { setBusy(false); }
  };

  const doStock = async (vals) => {
    setBusy(true);
    try {
      await createInitialStock(vals);
      message.success('Başlangıç stoğu girildi.');
      setStock(false); sForm.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12 };

  const columns = (withActions) => [
    {
      title: '#', dataIndex: 'id', width: 55,
      sorter: (a, b) => a.id - b.id,
      render: v => <span style={{ color: colors.subtext }}>#{v}</span>,
    },
    {
      title: 'Gönderen', dataIndex: 'from_department', width: 120,
      sorter: (a, b) => (DEPT_LABEL[a.from_department] || a.from_department || '').localeCompare(DEPT_LABEL[b.from_department] || b.from_department || '', 'tr'),
      render: v => <Tag color="orange">{DEPT_LABEL[v] || v || 'Dış Kaynak'}</Tag>,
    },
    {
      title: 'Alıcı', dataIndex: 'to_department', width: 120,
      sorter: (a, b) => (DEPT_LABEL[a.to_department] || a.to_department || '').localeCompare(DEPT_LABEL[b.to_department] || b.to_department || '', 'tr'),
      render: v => <Tag color="blue">{DEPT_LABEL[v] || v || 'Kasa'}</Tag>,
    },
    {
      title: 'Maden', dataIndex: 'material_type', width: 80,
      sorter: (a, b) => (MAT_LABEL[a.material_type] || a.material_type || '').localeCompare(MAT_LABEL[b.material_type] || b.material_type || '', 'tr'),
      render: v => MAT_LABEL[v] || v || '—',
    },
    {
      title: 'Ayar', dataIndex: 'purity', width: 90,
      sorter: (a, b) => (PUR_LABEL[a.purity] || a.purity || '').localeCompare(PUR_LABEL[b.purity] || b.purity || '', 'tr'),
      render: v => PUR_LABEL[v] || v || '—',
    },
    {
      title: 'Renk', dataIndex: 'color', width: 90,
      sorter: (a, b) => (COLOR_LABEL[a.color] || a.color || '').localeCompare(COLOR_LABEL[b.color] || b.color || '', 'tr'),
      render: v => v
        ? COLOR_LABEL[v] || v
        : <span style={{ color: colors.subtext }}>—</span>,
    },
    {
      title: 'Ağırlık', dataIndex: 'weight_grams', width: 95,
      sorter: (a, b) => (a.weight_grams || 0) - (b.weight_grams || 0),
      render: v => <span style={{ color: colors.gold, fontWeight: 600 }}>{typeof v === 'number' ? v.toFixed(2) : v} gr</span>,
    },
    {
      title: 'HAS', dataIndex: 'has_value', width: 85,
      sorter: (a, b) => (a.has_value || 0) - (b.has_value || 0),
      render: v => v != null ? v.toFixed(2) + ' g' : '—',
    },
    {
      title: 'Durum', dataIndex: 'status', width: 130,
      sorter: (a, b) => (ST_LABEL[a.status] || a.status || '').localeCompare(ST_LABEL[b.status] || b.status || '', 'tr'),
      render: (_, r) => durumTag(r),
    },
    {
      title: 'Saat', dataIndex: 'created_at', key: 'saat', width: 85,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => (
        <span style={{ color: colors.subtext }}>
          {new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      ),
    },
    {
      title: 'Tarih', dataIndex: 'created_at', key: 'tarih', width: 100,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: v => <span style={{ color: colors.subtext }}>{new Date(v).toLocaleDateString('tr-TR')}</span>,
    },
    withActions && {
      title: 'İşlem', width: 90,
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
    },
    isAdmin && {
      title: 'Yönetim', width: 95, fixed: 'right',
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
    },
  ].filter(Boolean);

  const TransferFormFields = ({ form, isStock }) => {
    const mt  = Form.useWatch('material_type', form);
    const pur = Form.useWatch('purity', form);
    return (
      <>
        {!isStock && (
          <>
            <Form.Item name="from_department" label="Gönderen" rules={[{ required: true }]}>
              <Select options={DEPTS} placeholder="Gönderen departman" showSearch filterOption={filterOpt} />
            </Form.Item>
            <Form.Item name="to_department" label="Alıcı" rules={[{ required: true }]}>
              <Select options={DEPTS} placeholder="Alıcı departman" showSearch filterOption={filterOpt} />
            </Form.Item>
          </>
        )}
        <Form.Item name="material_type" label="Materyal" rules={[{ required: true }]}>
          <Select
            options={[{ value: 'altin', label: 'Altın' }, { value: 'gumus', label: 'Gümüş' }]}
            placeholder="Seçin"
            onChange={() => form.setFieldsValue({ purity: undefined, color: undefined })}
          />
        </Form.Item>
        <Form.Item name="purity" label="Ayar" rules={[{ required: true }]}>
          <Select
            options={mt === 'gumus' ? SILV_PUR : GOLD_PUR}
            placeholder="Ayar seçin"
            onChange={(v) => { if (!COLORED.includes(v)) form.setFieldValue('color', undefined); }}
          />
        </Form.Item>
        {COLORED.includes(pur) && (
          <Form.Item name="color" label="Altın Rengi" rules={[{ required: true }]}>
            <Select options={COLORS} placeholder="Renk seçin" />
          </Form.Item>
        )}
        <Form.Item name="product_form" label="Ürün Formu" rules={[{ required: true }]}>
          <Select options={FORMS} placeholder="Form seçin" showSearch filterOption={filterOpt} />
        </Form.Item>
        <Form.Item name="weight_grams" label="Ağırlık (gr)" rules={[{ required: true }]}>
          <InputNumber min={0.0001} step={0.1} precision={4} style={{ width: '100%' }} placeholder="0.0000" />
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
                onRow={(r) => ({ style: rowStyle(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: 'Transfer bulunamadı' }} scroll={{ x: 1200 }} />,
            },
            {
              key: 'pend', label: 'Beklemede (' + pend.length + ')',
              children: <Table dataSource={pend} columns={columns(true)} rowKey="id"
                loading={loading} size="small"
                onRow={(r) => ({ style: rowStyle(r) })}
                pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['20','50','100'], onShowSizeChange: (_, size) => setPageSize(size) }}
                locale={{ emptyText: 'Bekleyen transfer yok' }} scroll={{ x: 1300 }} />,
            },
          ]}
        />
      </div>

      {/* CREATE */}
      <Modal title="Yeni Transfer" open={createOpen}
        onCancel={() => { setCreate(false); cForm.resetFields(); }}
        onOk={() => cForm.submit()} okText="Oluştur" cancelText="İptal"
        confirmLoading={busy} width={520}>
        <Form form={cForm} layout="vertical" onFinish={doCreate} style={{ marginTop: 16 }}>
          <TransferFormFields form={cForm} isStock={false} />
        </Form>
      </Modal>

      {/* INITIAL STOCK */}
      <Modal title="Başlangıç Stoğu" open={stockOpen}
        onCancel={() => { setStock(false); sForm.resetFields(); }}
        onOk={() => sForm.submit()} okText="Kaydet" cancelText="İptal"
        confirmLoading={busy} width={520}>
        <Form form={sForm} layout="vertical" onFinish={doStock} style={{ marginTop: 16 }}>
          <TransferFormFields form={sForm} isStock={true} />
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
          <TransferFormFields form={eForm} isStock={false} />
        </Form>
      </Modal>
    </div>
  );
};

export default Transfers;
