import React, { useState, useEffect } from 'react';
import {
  Form, Select, InputNumber, Button, Table, Modal,
  Alert, message, Tag, Row, Col, Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createTakoz, listAllTakoz, listTakozDept, deleteTakoz } from '../api/takoz';
import { fmt } from '../utils/reportLabels';

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

// Has (995) value from grams and binde (millesimal) purity: gram × binde / 995.
const hasFromBinde = (gram, binde) =>
  gram > 0 && binde > 0 ? (gram * binde) / 995 : null;

const Takoz = () => {
  const { user }   = useAuth();
  const { colors } = useTheme();
  const role = user?.role;

  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [createOpen, setCreate] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [cLive, setCLive]       = useState({ gram: null, ayar: null }); // canlı önizleme

  const [cForm] = Form.useForm();

  const isDeptSor = role === 'departman_sorumlusu';
  const isAdmin = role === 'admin';

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      if (isDeptSor && user?.department) {
        data = await listTakozDept(user.department).catch(() => []);
      } else {
        data = await listAllTakoz().catch(() => []);
      }
      setRecords(data || []);
    } catch { setError('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const doDelete = (rec) => {
    Modal.confirm({
      title: 'Takoz Teslimini İptal Et',
      content: `${fmt(rec.gram)} gr takoz kaydı (#${rec.id}) silinecek. Onaylıyor musunuz?`,
      okText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTakoz(rec.id);
          message.success('Takoz teslimi iptal edildi.');
          fetchData();
        } catch (e) { message.error(e.message || 'İptal edilemedi.'); }
      },
    });
  };

  const askCreateConfirm = (vals) => {
    Modal.confirm({
      title: 'Takoz Teslimini Onayla',
      content: `${DEPT_LABEL[vals.department] || vals.department} bölümünden ${vals.tahmini_ayar} ayarla ${fmt(vals.gram)} gr takoz alıyorsunuz. Onaylansın mı?`,
      okText: 'Onayla',
      cancelText: 'Vazgeç',
      onOk: () => doCreate(vals),
    });
  };

  const doCreate = async (vals) => {
    setBusy(true);
    try {
      const payload = {
        department: vals.department,
        // tarih sunucuda bugüne damgalanır; teslim zamanı created_at'te tutulur.
        gram: vals.gram,
        tahmini_ayar: vals.tahmini_ayar / 1000, // binde → oran (582.75 → 0.58275)
      };
      await createTakoz(payload);
      message.success('Takoz kaydı oluşturuldu.');
      setCreate(false); cForm.resetFields(); setCLive({ gram: null, ayar: null }); fetchData();
    } catch (e) { message.error(e.message || 'Hata.'); }
    finally { setBusy(false); }
  };

  const columns = [
    { title: 'Departman', dataIndex: 'department', render: v => <Tag color="blue">{DEPT_LABEL[v] || v}</Tag> },
    { title: 'Takoz Gram', dataIndex: 'gram', render: v => <span style={{ color: colors.gold, fontWeight: 600 }}>{fmt(v)} gr</span> },
    { title: 'Tahmini Ayar', dataIndex: 'tahmini_ayar', render: v => <span>{v ? (v * 1000).toFixed(2) : '—'}</span> },
    {
      title: 'Tahmini HAS', dataIndex: 'tahmini_has_degeri',
      render: v => <span style={{ fontWeight: 600 }}>{v != null ? fmt(v / 0.995) + ' g' : '—'}</span>,
    },
    { title: 'Saat', dataIndex: 'created_at', key: 'saat', render: v => <span style={{ fontSize: 12 }}>{v ? dayjs(v).format('HH:mm') : '—'}</span> },
    { title: 'Tarih', dataIndex: 'created_at', key: 'tarih', render: v => <span style={{ fontSize: 12 }}>{v ? dayjs(v).format('DD.MM.YYYY') : '—'}</span> },
    {
      title: 'Vardiya', dataIndex: 'vardiya_kapanis_id',
      render: v => v ? <Tag color="cyan">#{v}</Tag> : <span style={{ color: colors.subtext, fontSize: 11 }}>—</span>,
    },
    ...(isAdmin ? [{
      title: 'İptal', width: 64,
      render: (_, r) => (
        <Tooltip title={r.vardiya_kapanis_id ? 'Kapalı vardiyaya bağlı — önce kapanışı geri alın' : 'Takoz teslimini iptal et'}>
          <Button danger size="small" icon={<DeleteOutlined />}
            disabled={!!r.vardiya_kapanis_id}
            onClick={() => doDelete(r)} />
        </Tooltip>
      ),
    }] : []),
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Takoz Teslim</h2>
          <p style={{ color: colors.subtext, fontSize: 12, margin: '4px 0 0' }}>
            Günlük takoz teslim alma · reel değerler "Bölüm Borçları" sayfasından girilir
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreate(true)}>
          Yeni Teslim
        </Button>
      </div>

      <div style={card}>
        <Table
          dataSource={records} columns={columns} rowKey="id"
          loading={loading} size="small"
          pagination={{ pageSize: 25, showSizeChanger: false }}
          locale={{ emptyText: 'Takoz kaydı bulunamadı' }}
          scroll={{ x: 760 }}
          style={{ padding: '8px 0' }}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal title="Yeni Takoz Teslimi" open={createOpen}
        onCancel={() => { setCreate(false); cForm.resetFields(); }}
        onOk={() => cForm.submit()} okText="Kaydet" cancelText="İptal"
        confirmLoading={busy} width={480}>
        <Form form={cForm} layout="vertical" onFinish={askCreateConfirm} style={{ marginTop: 16 }}
          onValuesChange={(_, all) => setCLive({ gram: all.gram, ayar: all.tahmini_ayar })}>
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="gram" label="Gram" rules={[{ required: true }]}>
                <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tahmini_ayar" label="Tahmini Ayar"
                rules={[{ required: true }]}
                extra="Ayar makinesinde gördüğünüz değeri giriniz">
                <InputNumber min={0.01} max={1000} step={0.01} precision={2}
                  style={{ width: '100%' }} placeholder="Ayar makinesi" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 4, padding: '10px 14px', background: colors.bg, borderRadius: 8, fontSize: 13 }}>
            <span style={{ color: colors.subtext }}>Hesaplanan HAS değeri: </span>
            <strong style={{ color: colors.gold }}>
              {hasFromBinde(cLive.gram, cLive.ayar) != null
                ? fmt(hasFromBinde(cLive.gram, cLive.ayar)) + ' gr'
                : '—'}
            </strong>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Takoz;
