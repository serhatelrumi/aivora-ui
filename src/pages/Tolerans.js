import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, InputNumber, Alert, message, Tooltip, Tag,
} from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { getAllDeptSettings, updateDeptSetting } from '../api/departmentSettings';

const ALL_DEPTS = [
  'kasa','ocak','pres','kaynak','pres_montaj','cila','ayarevi','cnc',
  'kaliphane','dokum','dokum_montaj','ar_ge','halka_kilit','sarnel_kilit',
  'zincir','atolye','top',
];

const DEPT_LABEL = { kasa:'Kasa', ocak:'Ocak', pres:'Pres', kaynak:'Kaynak', pres_montaj:'Pres Montaj', cila:'Cila', ayarevi:'Ayar Evi', cnc:'CNC', kaliphane:'Kalıphane', dokum:'Döküm', dokum_montaj:'Döküm Montaj', ar_ge:'AR-GE', halka_kilit:'Halka Kilit', sarnel_kilit:'Sarnel Kilit', zincir:'Zincir', atolye:'Atölye', top:'Top' };

const Tolerans = () => {
  const { colors } = useTheme();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [editCtx, setEditCtx]   = useState(null);
  const [busy, setBusy]         = useState(false);

  const [form] = Form.useForm();

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, boxShadow: colors.cardShadow };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllDeptSettings();
      // Map the API results, then show every department
      const map = Object.fromEntries((data || []).map(s => [s.department, s]));
      const merged = ALL_DEPTS.map(dept => map[dept] || { department: dept, tolerance_grams: null, updated_at: null, id: dept });
      setSettings(merged);
    } catch { setError('Ayarlar yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const openEdit = (rec) => {
    setEditCtx(rec);
    form.setFieldsValue({ tolerance_grams: rec.tolerance_grams ?? null });
  };

  const doSave = async () => {
    const vals = await form.validateFields().catch(() => null);
    if (!vals) return;
    setBusy(true);
    try {
      await updateDeptSetting(editCtx.department, vals.tolerance_grams ?? null);
      message.success(DEPT_LABEL[editCtx.department] + ' toleransı güncellendi.');
      setEditCtx(null); form.resetFields(); fetchData();
    } catch (e) { message.error(e.message || 'Güncelleme başarısız.'); }
    finally { setBusy(false); }
  };

  const columns = [
    {
      title: 'Departman', dataIndex: 'department', width: 200,
      render: v => <span style={{ fontWeight: 600 }}>{DEPT_LABEL[v] || v}</span>,
    },
    {
      title: 'Mevcut Tolerans', dataIndex: 'tolerance_grams',
      render: v => v != null
        ? <Tag color="gold" style={{ fontSize: 13, padding: '2px 10px' }}>{v} gr HAS</Tag>
        : <Tag color="default">Ayarlanmamış</Tag>,
    },
    {
      title: 'Son Güncelleme', dataIndex: 'updated_at',
      render: v => <span style={{ color: colors.subtext, fontSize: 12 }}>
        {v ? new Date(v).toLocaleString('tr-TR') : '—'}
      </span>,
    },
    {
      title: 'İşlem', width: 80,
      render: (_, r) => (
        <Tooltip title="Toleransı Düzenle">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Düzenle</Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0 }}>Tolerans Ayarları</h2>
          <p style={{ color: colors.subtext, fontSize: 12, margin: '4px 0 0' }}>
            Her departman için maksimum kabul edilebilir HAS farkı (gram)
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>Yenile</Button>
      </div>

      <div style={card}>
        <Table
          dataSource={settings} columns={columns} rowKey="id"
          loading={loading} size="middle"
          pagination={false}
          locale={{ emptyText: 'Ayar bulunamadı' }}
        />
      </div>

      <Modal
        title={'Tolerans Düzenle — ' + (DEPT_LABEL[editCtx?.department] || editCtx?.department || '')}
        open={!!editCtx}
        onCancel={() => { setEditCtx(null); form.resetFields(); }}
        onOk={doSave}
        okText="Kaydet"
        cancelText="İptal"
        confirmLoading={busy}
        width={400}
      >
        <div style={{ padding: '12px 0 0' }}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="tolerance_grams"
              label="Tolerans Değeri (gram HAS)"
              extra="Boş bırakırsanız tolerans kaldırılır (sınırsız fark kabul edilir)."
            >
              <InputNumber
                min={0} step={0.01} precision={2}
                style={{ width: '100%' }}
                placeholder="Örn: 0.50"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Tolerans;
