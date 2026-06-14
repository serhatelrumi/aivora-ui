import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, InputNumber, Alert, message,
  Tag, Select, DatePicker, Space, Tooltip,
} from 'antd';
import { PlusOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { createMizan, listMizan, onaylaMizan } from '../api/mizan';
import { listVardiyaKapanis } from '../api/vardiya';
import { fmt } from '../utils/reportLabels';

const DEPT_LABEL = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };

const Mizan = () => {
  const { colors } = useTheme();

  const [mizanlar, setMizanlar]       = useState([]);
  const [kapanislar, setKapanislar]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [createOpen, setCreate]       = useState(false);
  const [busy, setBusy]               = useState(false);

  const [form] = Form.useForm();

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, k] = await Promise.all([
        listMizan().catch(() => []),
        listVardiyaKapanis().catch(() => []),
      ]);
      setMizanlar(m || []);
      setKapanislar(k || []);
    } catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const doCreate = async (vals) => {
    setBusy(true);
    try {
      const [start, end] = vals.donem;
      await createMizan({
        donem_baslangic: start.format('YYYY-MM-DD'),
        donem_bitis: end.format('YYYY-MM-DD'),
        included_vardiya_kapanis_ids: vals.kapanis_ids,
        ayarevi_reel_has_degeri: vals.ayarevi_reel_has_degeri,
      });
      message.success('Haftalık mizan oluşturuldu.');
      setCreate(false); form.resetFields(); fetchAll();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const doOnayla = async (id) => {
    try {
      await onaylaMizan(id);
      message.success('Mizan onaylandı.'); fetchAll();
    } catch (e) { message.error(e.message || 'Onaylama başarısız.'); }
  };

  const kapanisOpts = kapanislar.map(k => ({
    value: k.id,
    label: (DEPT_LABEL[k.department] || k.department) + ' · ' + k.tarih + ' · net ' + fmt(k.net_fark) + 'g',
  }));

  const columns = [
    { title: '#', dataIndex: 'id', width: 55, render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
    {
      title: 'Dönem', width: 200,
      render: (_, r) => (
        <span style={{ fontSize: 12 }}>
          {r.donem_baslangic} <span style={{ color: colors.subtext }}>→</span> {r.donem_bitis}
        </span>
      ),
    },
    {
      title: 'Kapanış Sayısı', dataIndex: 'dahil_vardiya_kapanislari',
      render: v => <Tag color="blue">{(v || []).length} vardiya</Tag>,
    },
    {
      title: 'Brüt Borç (D)', dataIndex: 'toplam_tahmini_borc',
      render: v => <span style={{ fontWeight: 600 }}>{v != null ? fmt(v) : '—'} g has</span>,
    },
    {
      title: 'Ayarevi Reel HAS', dataIndex: 'ayarevi_reel_has_degeri',
      render: v => v != null ? <span style={{ color: '#52C41A', fontWeight: 600 }}>{fmt(v)} g</span> : '—',
    },
    {
      title: 'Gerçek Borç (D−R)', dataIndex: 'reel_fark',
      render: v => v != null ? (
        <span style={{ color: Math.abs(v) < 1 ? '#52C41A' : '#FF4D4F', fontWeight: 600 }}>
          {fmt(v)} g
        </span>
      ) : '—',
    },
    {
      title: 'Durum', dataIndex: 'durum',
      render: v => <Tag color={v === 'onaylandi' ? 'success' : 'processing'}>
        {v === 'onaylandi' ? 'Onaylandı' : 'Beklemede'}
      </Tag>,
    },
    {
      title: 'Tarih', dataIndex: 'created_at',
      render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>{new Date(v).toLocaleDateString('tr-TR')}</span>,
    },
    {
      title: 'İşlem', width: 100,
      render: (_, r) => r.durum !== 'onaylandi' ? (
        <Tooltip title="Mizanı Onayla">
          <Button
            size="small" icon={<CheckOutlined />} type="primary"
            onClick={() => doOnayla(r.id)}
            style={{ background: '#52C41A', borderColor: '#52C41A' }}
          >
            Onayla
          </Button>
        </Tooltip>
      ) : <Tag color="success">✓ Onaylı</Tag>,
    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Haftalık Mizan</h2>
          <p style={{ color: colors.subtext, fontSize: 12, margin: '4px 0 0' }}>
            Vardiya kapanışlarını haftalık dönem bazında mutabakatlayın
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreate(true)}>
            Yeni Mizan
          </Button>
        </Space>
      </div>

      <div style={card}>
        <Table
          dataSource={mizanlar} columns={columns} rowKey="id"
          loading={loading} size="small"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: 'Mizan kaydı bulunamadı' }}
          scroll={{ x: 900 }}
          style={{ padding: '8px 0' }}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal
        title="Yeni Haftalık Mizan Oluştur"
        open={createOpen}
        onCancel={() => { setCreate(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Oluştur"
        cancelText="İptal"
        confirmLoading={busy}
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={doCreate} style={{ marginTop: 16 }}>
          <Form.Item name="donem" label="Dönem Aralığı" rules={[{ required: true, message: 'Dönem seçin.' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item
            name="kapanis_ids"
            label="Dahil Edilecek Vardiya Kapanışları"
            rules={[{ required: true, message: 'En az bir kapanış seçin.' }]}
            extra={'Kullanılabilir kapanış sayısı: ' + kapanislar.length}
          >
            <Select
              mode="multiple"
              options={kapanisOpts}
              placeholder="Kapanışları seçin..."
              showSearch
              filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
              maxTagCount={4}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="ayarevi_reel_has_degeri"
            label="Ayarevi Reel HAS Değeri (g)"
            rules={[{ required: true }]}
            extra="Haftalık eritme sonrası ayarevi tarafından bildirilen gerçek HAS değeri"
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Mizan;
