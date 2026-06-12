import React, { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Button, Modal, Form, Input, Select, InputNumber,
  Popconfirm, Tag, Spin, Alert, Tooltip, Divider, Radio, message,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getReceteler, createRecete, updateRecete, deleteRecete } from '../api/receteler';
import { fmtRecipe, recipePercentInputProps, recipeGramInputProps } from '../utils/recipeFormat';

const { Option } = Select;

const PURITY_LABELS = {
  '8k':'8 Ayar','9k':'9 Ayar','10k':'10 Ayar',
  '14k':'14 Ayar','18k':'18 Ayar','21k':'21 Ayar','22k':'22 Ayar',
};
const COLOR_LABELS = { yesil: 'Yeşil', kirmizi: 'Kırmızı (Rose)', beyaz: 'Beyaz' };
const COLORED_PURITIES = ['8k','9k','10k','14k','18k'];

const MALZEME_OPTIONS = [
  { value: 'altin',     label: 'Has Altın (995)',    color: '#D4AF37' },
  { value: 'gumus',     label: 'Gümüş',              color: '#A8A9AD' },
  { value: 'bakir',     label: 'Bakır',              color: '#B87333' },
  { value: 'palladyum', label: 'Palladyum',          color: '#7B68EE' },
  { value: 'nikel',     label: 'Nikel',              color: '#708090' },
  { value: 'cink',      label: 'Çinko',              color: '#5F9EA0' },
  { value: 'diger',     label: 'Diğer',              color: '#8B8B8B' },
];

const malzemeColor = (m) => MALZEME_OPTIONS.find(o => o.value === m)?.color || '#8B8B8B';
const malzemeLabel = (m) => MALZEME_OPTIONS.find(o => o.value === m)?.label || m;

const EMPTY_ROW = { malzeme: undefined, oran: undefined };

// For has gold 995 the real fine-gold factor is 0.995; everything else is 1.0
const getMalzemePurity = (malzeme) => malzeme === 'altin' ? 0.995 : 1.0;

const Receteler = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const isAdmin = ['admin'].includes(user?.role);

  const [receteler, setReceteler] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);

  // 'percent' | 'gram' — in gram mode, % is computed from gramValues
  const [inputMode, setInputMode] = useState('percent');
  const [gramValues, setGramValues] = useState([0]);

  const [form] = Form.useForm();
  const hedefAyar = Form.useWatch('hedef_ayar', form);

  const card = {
    background: colors.card, border: '1px solid ' + colors.border,
    borderRadius: 12, boxShadow: colors.cardShadow,
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getReceteler();
      setReceteler(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setInputMode('percent');
    setGramValues([0]);
    form.resetFields();
    form.setFieldsValue({ malzemeler: [{ ...EMPTY_ROW }] });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setInputMode('percent');
    setGramValues(r.malzemeler.map(() => 0));
    form.setFieldsValue({
      ad: r.ad,
      hedef_ayar: r.hedef_ayar,
      hedef_renk: r.hedef_renk || undefined,
      notlar: r.notlar || '',
      malzemeler: r.malzemeler.map(m => ({ malzeme: m.malzeme, oran: m.oran })),
    });
    setModalOpen(true);
  };

  // Gram mode: when one gram value changes, update all ratio fields.
  // Effective value for has gold (altin) = gram × 0.995; others = gram × 1.0
  const handleGramChange = (index, value, overrideMalzeme = null) => {
    const newGrams = [...gramValues];
    newGrams[index] = value || 0;
    setGramValues(newGrams);
    const items = form.getFieldValue('malzemeler') || [];
    const effectives = newGrams.map((g, i) => {
      const malzeme = (i === index && overrideMalzeme != null) ? overrideMalzeme : items[i]?.malzeme;
      return (g || 0) * getMalzemePurity(malzeme);
    });
    const totalEff = effectives.reduce((s, e) => s + e, 0);
    if (totalEff > 0) {
      form.setFieldsValue({
        malzemeler: items.map((item, i) => ({
          ...item,
          oran: parseFloat((effectives[i] / totalEff * 100).toFixed(3)),
        })),
      });
    }
  };

  // Reset gram values when the mode changes
  const handleModeChange = (e) => {
    setInputMode(e.target.value);
    const count = form.getFieldValue('malzemeler')?.length || 1;
    setGramValues(Array(count).fill(0));
  };

  const validateMalzemeTotal = (items) => {
    if (!items?.length) throw new Error('En az bir malzeme ekleyin.');
    const total = items.reduce((s, i) => s + (Number(i?.oran) || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Toplam ${fmtRecipe(total)}% — 100% olmalı.`);
    }
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (inputMode === 'percent') {
        validateMalzemeTotal(vals.malzemeler);
      }
      setSaving(true);
      const payload = {
        ad: vals.ad,
        hedef_ayar: vals.hedef_ayar,
        hedef_renk: vals.hedef_renk || null,
        malzemeler: vals.malzemeler,
        notlar: vals.notlar || null,
      };
      if (editing) {
        await updateRecete(editing.id, payload);
      } else {
        await createRecete(payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e.message || 'Kaydedilemedi.');
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRecete(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  // Group recipes by purity
  const byAyar = receteler.reduce((acc, r) => {
    const key = r.hedef_ayar;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const ayarOrder = ['8k','9k','10k','14k','18k','21k','22k'];
  const sortedAyarlar = Object.keys(byAyar).sort(
    (a, b) => (ayarOrder.indexOf(a) === -1 ? 99 : ayarOrder.indexOf(a))
           - (ayarOrder.indexOf(b) === -1 ? 99 : ayarOrder.indexOf(b))
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>Reçeteler</h2>
          <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>
            Ayar bazında alaşım reçeteleri
          </p>
        </div>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni Reçete
          </Button>
        )}
      </div>

      {receteler.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <ExperimentOutlined style={{ fontSize: 40, color: colors.subtext, marginBottom: 12 }} />
          <p style={{ color: colors.subtext }}>Henüz reçete eklenmemiş.</p>
        </div>
      ) : (
        sortedAyarlar.map(ayar => (
          <div key={ayar} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                background: '#D4AF3722', border: '1px solid #D4AF3750',
                borderRadius: 6, padding: '2px 12px',
                color: '#D4AF37', fontWeight: 700, fontSize: 13,
              }}>
                {PURITY_LABELS[ayar] || ayar}
              </div>
              <div style={{ height: 1, flex: 1, background: colors.border }} />
            </div>
            <Row gutter={[12, 12]}>
              {byAyar[ayar].map(r => (
                <Col key={r.id} xs={24} sm={12} md={8} lg={6}>
                  <ReceteCard
                    recete={r} colors={colors} isAdmin={isAdmin}
                    onEdit={() => openEdit(r)}
                    onDelete={() => handleDelete(r.id)}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        title={editing ? 'Reçete Düzenle' : 'Yeni Reçete'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Kaydet' : 'Oluştur'}
        cancelText="İptal"
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="ad" label="Reçete Adı"
            rules={[{ required: true, message: 'Ad zorunlu' }]}>
            <Input placeholder="örn. 14 Ayar Sarı Standard" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="hedef_ayar" label="Hedef Ayar"
                rules={[{ required: true, message: 'Ayar seçin' }]}>
                <Select placeholder="Ayar seç" onChange={() => form.setFieldValue('hedef_renk', undefined)}>
                  {ayarOrder.map(a => (
                    <Option key={a} value={a}>{PURITY_LABELS[a]}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hedef_renk" label="Renk"
                rules={COLORED_PURITIES.includes(hedefAyar)
                  ? [{ required: true, message: 'Renk seçin' }] : []}>
                <Select
                  placeholder="Renk seç"
                  disabled={!hedefAyar || !COLORED_PURITIES.includes(hedefAyar)}
                  allowClear
                >
                  {Object.entries(COLOR_LABELS).map(([v, l]) => (
                    <Option key={v} value={v}>{l}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* DYNAMIC INGREDIENT ROWS */}
          <Form.List name="malzemeler">
            {(fields, { add, remove }) => {
              const items = form.getFieldValue('malzemeler') || [];
              const effectives = inputMode === 'gram'
                ? gramValues.map((g, i) =>
                  (g || 0) * getMalzemePurity(items[i]?.malzeme),
                )
                : [];
              const totalEff = effectives.reduce((s, e) => s + e, 0);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ color: colors.subtext, fontSize: 12, fontWeight: 600 }}>
                      MALZEME BİLEŞİMİ
                    </div>
                    <Radio.Group
                      value={inputMode}
                      onChange={handleModeChange}
                      size="small"
                      optionType="button"
                      buttonStyle="solid"
                      options={[
                        { label: '% Giriş', value: 'percent' },
                        { label: 'Gram Giriş', value: 'gram' },
                      ]}
                    />
                  </div>
                  {fields.map(({ key, name }) => {
                    const computedPct = totalEff > 0 ? effectives[name] / totalEff * 100 : 0;
                    return (
                      <Row key={key} gutter={8} align="middle" style={{ marginBottom: 6 }}>
                        <Col flex="1">
                          <Form.Item name={[name, 'malzeme']} noStyle
                            rules={[{ required: true, message: 'Malzeme seçin' }]}>
                            <Select
                              placeholder="Malzeme"
                              onChange={(newMalzeme) => {
                                if (inputMode === 'gram')
                                  handleGramChange(name, gramValues[name], newMalzeme);
                              }}
                            >
                              {MALZEME_OPTIONS.map(o => (
                                <Option key={o.value} value={o.value}>
                                  <span style={{ color: o.color, fontWeight: 600 }}>■ </span>{o.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        {inputMode === 'percent' ? (
                          <Col flex="120px">
                            <Form.Item name={[name, 'oran']} noStyle
                              rules={[{ required: true, message: 'Oran girin' }]}>
                              <InputNumber
                                {...recipePercentInputProps}
                                placeholder="0,000" style={{ width: '100%' }}
                                addonAfter="%"
                              />
                            </Form.Item>
                          </Col>
                        ) : (
                          <Col flex="210px">
                            <Form.Item name={[name, 'oran']} noStyle hidden>
                              <InputNumber />
                            </Form.Item>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <InputNumber
                                value={gramValues[name] || null}
                                onChange={(v) => handleGramChange(name, v)}
                                {...recipeGramInputProps}
                                placeholder="0,000" style={{ flex: 1, minWidth: 0 }}
                                addonAfter="gr"
                              />
                              <Tag style={{ margin: 0, flexShrink: 0, minWidth: 56, textAlign: 'center', fontSize: 11 }}
                                color={totalEff > 0 ? 'gold' : 'default'}>
                                %{fmtRecipe(computedPct)}
                              </Tag>
                            </div>
                          </Col>
                        )}

                        <Col flex="32px">
                          {fields.length > 1 && (
                            <Button
                              type="text" danger size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                remove(name);
                                setGramValues(prev => prev.filter((_, i) => i !== name));
                              }}
                            />
                          )}
                        </Col>
                      </Row>
                    );
                  })}
                  <Button
                    type="dashed"
                    onClick={() => {
                      add({ ...EMPTY_ROW });
                      setGramValues(prev => [...prev, 0]);
                    }}
                    icon={<PlusOutlined />} block style={{ marginTop: 4 }}
                  >
                    Malzeme Ekle
                  </Button>
                </>
              );
            }}
          </Form.List>

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item name="notlar" label="Notlar" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="İsteğe bağlı açıklama…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ReceteCard = ({ recete, colors, isAdmin, onEdit, onDelete }) => {
  const total = recete.malzemeler.reduce((s, m) => s + m.oran, 0);

  return (
    <div style={{
      background: colors.card,
      border: '1px solid ' + colors.border,
      borderTop: '3px solid #D4AF37',
      borderRadius: 10,
      padding: '14px 16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
            {recete.ad}
          </div>
          {recete.hedef_renk && (
            <div style={{ color: colors.subtext, fontSize: 10, marginTop: 2 }}>
              {COLOR_LABELS[recete.hedef_renk] || recete.hedef_renk}
            </div>
          )}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Tooltip title="Düzenle">
              <Button type="text" size="small" icon={<EditOutlined />}
                style={{ color: colors.subtext }} onClick={onEdit} />
            </Tooltip>
            <Popconfirm title="Reçeteyi sil?" onConfirm={onDelete} okText="Sil" cancelText="İptal" okButtonProps={{ danger: true }}>
              <Tooltip title="Sil">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        )}
      </div>

      {/* Percentage bar */}
      <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 8, marginBottom: 10 }}>
        {recete.malzemeler.map((m, i) => (
          <Tooltip key={i} title={`${malzemeLabel(m.malzeme)}: ${fmtRecipe(m.oran)}%`}>
            <div style={{
              width: `${(m.oran / total) * 100}%`,
              background: malzemeColor(m.malzeme),
              minWidth: 2,
            }} />
          </Tooltip>
        ))}
      </div>

      {/* Ingredient list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {recete.malzemeler.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: malzemeColor(m.malzeme), flexShrink: 0 }} />
              <span style={{ color: colors.subtext, fontSize: 10 }}>{malzemeLabel(m.malzeme)}</span>
            </div>
            <Tag style={{ margin: 0, fontSize: 10, padding: '0 6px', lineHeight: '18px' }}
              color="default">
              %{fmtRecipe(m.oran)}
            </Tag>
          </div>
        ))}
      </div>

      {recete.notlar && (
        <div style={{ color: colors.subtext, fontSize: 9, marginTop: 8, borderTop: '1px solid ' + colors.border, paddingTop: 6, fontStyle: 'italic' }}>
          {recete.notlar}
        </div>
      )}
    </div>
  );
};

export default Receteler;
