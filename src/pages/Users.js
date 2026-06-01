import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, Select,
  Alert, Space, Tooltip, Popconfirm, message, Badge,
} from 'antd';
import {
  PlusOutlined, StopOutlined, UserOutlined, LockOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { listUsers, createUser, deactivateUser } from '../api/users';

const ROLES = [
  { value: 'admin',               label: 'Admin' },
  { value: 'patron',              label: 'Patron' },
  { value: 'fabrika_muduru',      label: 'Fabrika Müdürü' },
  { value: 'kasa',                label: 'Kasa' },
  { value: 'departman_sorumlusu', label: 'Departman Sorumlusu' },
  { value: 'muhasebe',            label: 'Muhasebe' },
  { value: 'satis',               label: 'Satış' },
];

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

const ROLE_COLORS = {
  admin: 'red', patron: 'gold', fabrika_muduru: 'purple',
  kasa: 'blue', departman_sorumlusu: 'cyan', muhasebe: 'green', satis: 'orange',
};

const ROLE_LABELS = {
  admin: 'Admin', patron: 'Patron', fabrika_muduru: 'Fabrika Müd.',
  kasa: 'Kasa', departman_sorumlusu: 'Dept. Sor.', muhasebe: 'Muhasebe', satis: 'Satış',
};

const DEPT_LABELS = Object.fromEntries(DEPTS.map(d => [d.value, d.label]));

const filterOpt = (input, opt) => opt.label.toLowerCase().includes(input.toLowerCase());

const Users = () => {
  const { user: me }  = useAuth();
  const { colors }    = useTheme();

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy]           = useState(false);

  const [form] = Form.useForm();
  const selectedRole = Form.useWatch('role', form);

  const isAdmin = me?.role === 'admin';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message || 'Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (vals) => {
    setBusy(true);
    try {
      await createUser(vals);
      message.success('Kullanıcı oluşturuldu.');
      setModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (e) {
      message.error(e.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (userId, username) => {
    try {
      await deactivateUser(userId);
      message.success(`${username} deaktif edildi.`);
      fetchUsers();
    } catch (e) {
      message.error(e.message || 'Deaktif etme başarısız.');
    }
  };

  const card = {
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
  };

  const activeCount   = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      width: 55,
      render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>#{v}</span>,
    },
    {
      title: 'Ad Soyad',
      dataIndex: 'full_name',
      render: (v, r) => (
        <Space>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#D4AF3720', border: '1px solid #D4AF3750',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#D4AF37', fontWeight: 700, flexShrink: 0,
          }}>
            {r.username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{v}</div>
            <div style={{ color: colors.subtext, fontSize: 11 }}>@{r.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      render: v => <Tag color={ROLE_COLORS[v] || 'default'}>{ROLE_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      render: v => v ? <Tag color="default">{DEPT_LABELS[v] || v}</Tag> : <span style={{ color: colors.subtext }}>—</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'is_active',
      render: v => v
        ? <Badge status="success" text={<span style={{ color: '#52C41A', fontSize: 12 }}>Aktif</span>} />
        : <Badge status="error"   text={<span style={{ color: '#FF4D4F', fontSize: 12 }}>Deaktif</span>} />,
    },
    {
      title: 'Son Giriş',
      dataIndex: 'last_login',
      render: v => v
        ? <span style={{ color: colors.subtext, fontSize: 11 }}>
            {new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        : <span style={{ color: colors.subtext, fontSize: 11 }}>—</span>,
    },
    {
      title: 'Kayıt Tarihi',
      dataIndex: 'created_at',
      render: v => <span style={{ color: colors.subtext, fontSize: 11 }}>
        {new Date(v).toLocaleDateString('tr-TR')}
      </span>,
    },
    isAdmin && {
      title: 'İşlem',
      width: 80,
      render: (_, r) => {
        const isSelf = r.id === me?.id || r.username === me?.username;
        if (!r.is_active) return <span style={{ color: colors.subtext, fontSize: 11 }}>Deaktif</span>;
        if (isSelf) return (
          <Tooltip title="Kendi hesabınızı deaktif edemezsiniz">
            <Button size="small" icon={<StopOutlined />} disabled />
          </Tooltip>
        );
        return (
          <Popconfirm
            title={`"${r.full_name}" kullanıcısını deaktif et?`}
            description="Bu işlem geri alınamaz."
            onConfirm={() => handleDeactivate(r.id, r.full_name)}
            okText="Evet, Deaktif Et"
            cancelText="Vazgeç"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Deaktif Et">
              <Button danger size="small" icon={<StopOutlined />} />
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ].filter(Boolean);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>
            Kullanıcı Yönetimi
          </h2>
          <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>
            {activeCount} aktif · {inactiveCount} deaktif kullanıcı
          </p>
        </div>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Yeni Kullanıcı
          </Button>
        )}
      </div>

      <div style={card}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'Kullanıcı bulunamadı' }}
          scroll={{ x: 800 }}
          rowClassName={(r) => !r.is_active ? 'row-inactive' : ''}
          style={{ padding: '0 4px' }}
        />
      </div>

      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#D4AF37' }} />
            <span>Yeni Kullanıcı Oluştur</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Oluştur"
        cancelText="İptal"
        confirmLoading={busy}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="full_name"
            label="Ad Soyad"
            rules={[{ required: true, message: 'Ad Soyad gereklidir.' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ahmet Yılmaz" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Kullanıcı Adı"
            rules={[
              { required: true, message: 'Kullanıcı adı gereklidir.' },
              { pattern: /^[a-z0-9_]+$/, message: 'Sadece küçük harf, rakam ve alt çizgi.' },
            ]}
          >
            <Input prefix={<span style={{ color: colors.subtext }}>@</span>} placeholder="ahmet_yilmaz" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Şifre"
            rules={[
              { required: true, message: 'Şifre gereklidir.' },
              { min: 6, message: 'En az 6 karakter olmalı.' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Rol seçiniz.' }]}
          >
            <Select
              options={ROLES}
              placeholder="Rol seçin"
              onChange={() => form.setFieldValue('department', undefined)}
            />
          </Form.Item>

          {selectedRole === 'departman_sorumlusu' && (
            <Form.Item
              name="department"
              label="Departman"
              rules={[{ required: true, message: 'Departman Sorumlusu için departman zorunludur.' }]}
            >
              <Select
                options={DEPTS}
                placeholder="Departman seçin"
                showSearch
                filterOption={filterOpt}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
