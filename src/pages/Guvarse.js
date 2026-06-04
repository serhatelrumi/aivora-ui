import React, { useState, useEffect } from 'react';
import {
  Form, Select, InputNumber, Button, Table, Modal,
  Alert, message, DatePicker, Tooltip, Tag, Row, Col,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createGuvarse, listAllGuvarse, listGuvarseDept, updateReelGuvarse } from '../api/guvarse';

const DEPTS = [
  { value: 'ocak', label: 'Ocak' }, { value: 'pres', label: 'Pres' },
  { value: 'kaynak', label: 'Kaynak' }, { value: 'pres_montaj', label: 'Pres Montaj' },
  { value: 'cila', label: 'Cila' }, { value: 'ayarevi', label: 'Ayar Evi' },
  { value: 'cnc', label: 'CNC' }, { value: 'kaliphane', label: 'Kalıphane' },
  { value: 'dokum', label: 'Döküm' }, { value: 'dokum_montaj', label: 'Döküm Montaj' },
  { value: 'ar_ge', label: 'AR-GE' }, { value: 'halka_kilit', label: 'Halka Kilit' },
  { value: 'sarnel_kilit', label: 'Sarnel Kilit' }, { value: 'zincir', label: 'Zincir' },
  { value: 'atolye', label: 'Atölye' }, { value: 'top', label: 'Top' },
  { value: 'kasa', label: 'Kasa' },
];

const DEPT_LABEL = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };

const AYAR_OPTS = [
  { value: 0.333, label: '8k  — 0.333' },  { value: 0.375, label: '9k  — 0.375' },
  { value: 0.417, label: '10k — 0.417' },  { value: 0.585, label: '14k — 0.585' },
  { value: 0.750, label: '18k — 0.750' },  { value: 0.875, label: '21k — 0.875' },
  { value: 0.916, label: '22k — 0.916' },  { value: 0.925, label: '925 — 0.925' },
];

const Guvarse = () => {
  const { user }   = useAuth();
  const { colors } = useTheme();
  const role = user?.role;

  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [createOpen, setCreate]     = useState(false);
  const [reelCtx, setReel]          = useState({ open: false, record: null });
  const [busy, setBusy]             = useState(false);

  const [cForm] = Form.useForm();
  const [rForm] = Form.useForm();

  const isDeptSor = role === 'departman_sorumlusu';
  const isPatron  = ['admin', 'patron'].includes(role);

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      if (isDeptSor && user?.department) {
        data = await listGuvarseDept(user.department).catch(() => []);
      } else {
        data = await listAllGuvarse().catch(() => []);
      }
      setRecords(data || []);
    } catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const doCreate = async (vals) => {
    setBusy(true);
    try {
      const payload = {
        department: vals.department,
        tarih: vals.tarih ? vals.tarih.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        gram: vals.gram,
        tahmini_ayar: vals.tahmini_ayar,
      };
      await createGuvarse(payload);
      message.success('Güverse kaydı oluşturuldu.');
      setCreate(false); cForm.resetFields(); fetchData();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const doReelUpdate = async (vals) => {
    setBusy(true);
    try {
      await updateReelGuvarse(reelCtx.record.id, {
        reel_ayar: vals.reel_ayar,
        reel_has_degeri: vals.reel_has_degeri,
      });
      message.success('Reel değerler güncellendi.');
      setReel({ open: false, record: null }); rForm.resetFields(); fetchData();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const openReel = (rec) => {
    setReel({ open: true, record: rec });
    rForm.setFieldsValue({ reel_ayar: rec.reel_ayar, reel_has_degeri: rec.reel_has_degeri });
  };

  const columns = [
    { title: '#', dataIndex: 'id', width: 55, render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span> },
    { title: 'Departman', dataIndex: 'department', render: v => <Tag color="blue">{DEPT_LABEL[v] || v}</Tag> },
    { title: 'Tarih', dataIndex: 'tarih', render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: 'Gram', dataIndex: 'gram', render: v => <span style={{ color: colors.gold, fontWeight: 600 }}>{v} gr</span> },
    { title: 'Tahmini Ayar', dataIndex: 'tahmini_ayar', render: v => <span>{v ? (v * 100).toFixed(2) + '%' : '—'}</span> },
    {
      title: 'Tahmini HAS', dataIndex: 'tahmini_has_degeri',
      render: v => <span style={{ fontWeight: 600 }}>{v != null ? v.toFixed(2) + ' g' : '—'}</span>,
    },
    { title: 'Reel Ayar', dataIndex: 'reel_ayar', render: v => v != null ? <Tag color="green">{(v * 100).toFixed(2)}%</Tag> : <span style={{ color: colors.subtext }}>—</span> },
    { title: 'Reel HAS', dataIndex: 'reel_has_degeri', render: v => v != null ? <span style={{ color: '#52C41A', fontWeight: 600 }}>{v.toFixed(2)} g</span> : <span style={{ color: colors.subtext }}>—</span> },
    {
      title: 'Vardiya', dataIndex: 'vardiya_kapanis_id',
      render: v => v ? <Tag color="cyan">#{v}</Tag> : <span style={{ color: colors.subtext, fontSize: 11 }}>—</span>,
    },
    isPatron && {
      title: 'İşlem', width: 80,
      render: (_, r) => (
        <Tooltip title="Reel Güncelle">
          <Button size="small" icon={<EditOutlined />} onClick={() => openReel(r)} />
        </Tooltip>
      ),
    },
  ].filter(Boolean);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Güverse Teslim</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreate(true)}>
          Yeni Teslim
        </Button>
      </div>

      <div style={card}>
        <Table
          dataSource={records} columns={columns} rowKey="id"
          loading={loading} size="small"
          pagination={{ pageSize: 25, showSizeChanger: false }}
          locale={{ emptyText: 'Güverse kaydı bulunamadı' }}
          scroll={{ x: 920 }}
          style={{ padding: '8px 0' }}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal title="Yeni Güverse Teslimi" open={createOpen}
        onCancel={() => { setCreate(false); cForm.resetFields(); }}
        onOk={() => cForm.submit()} okText="Kaydet" cancelText="İptal"
        confirmLoading={busy} width={480}>
        <Form form={cForm} layout="vertical" onFinish={doCreate} style={{ marginTop: 16 }}>
          <Form.Item name="department" label="Departman" rules={[{ required: true }]}
            initialValue={isDeptSor ? user?.department : undefined}>
            <Select
              options={DEPTS}
              disabled={isDeptSor}
              placeholder="Departman seçin"
              showSearch
              filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="tarih" label="Tarih" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="gram" label="Gram" rules={[{ required: true }]}>
                <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tahmini_ayar" label="Tahmini Ayar" rules={[{ required: true }]}>
                <Select options={AYAR_OPTS} placeholder="Ayar seçin" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* REEL UPDATE MODAL */}
      <Modal title="Reel Değerleri Güncelle" open={reelCtx.open}
        onCancel={() => { setReel({ open: false, record: null }); rForm.resetFields(); }}
        onOk={() => rForm.validateFields().then(doReelUpdate)} okText="Güncelle" cancelText="İptal"
        confirmLoading={busy} width={420}>
        {reelCtx.record && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: colors.bg, borderRadius: 8, fontSize: 12, color: colors.subtext }}>
            <strong style={{ color: colors.text }}>{DEPT_LABEL[reelCtx.record.department]} — {reelCtx.record.tarih}</strong>
            <br />Tahmini: {reelCtx.record.gram} gr @ {(reelCtx.record.tahmini_ayar * 100).toFixed(2)}% = {reelCtx.record.tahmini_has_degeri != null ? (reelCtx.record.tahmini_has_degeri / 0.995).toFixed(2) : '—'} g HAS
          </div>
        )}
        <Form form={rForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="reel_ayar" label="Reel Ayar" rules={[{ required: true }]}>
                <InputNumber min={0.001} max={1} step={0.001} precision={3} style={{ width: '100%' }} placeholder="0.750" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reel_has_degeri" label="Reel HAS (g)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Guvarse;
