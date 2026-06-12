import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Form, Select, InputNumber, Divider, Spin, Alert, Empty, Tag, Button, Popconfirm, message, Segmented } from 'antd';
import { ExperimentOutlined, SendOutlined, SwapOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { getReceteler, sendMadenAyarlama } from '../api/receteler';
import { PURITY_HAS_RATIO } from '../constants/goldCatalog';
import { fmtRecipe, recipeGramInputProps } from '../utils/recipeFormat';

const { Option } = Select;

const PURITY_HAS = PURITY_HAS_RATIO;
const PURITY_LABELS = {
  '8k': '8K', '9k': '9K', '10k': '10K', '14k': '14K', '18k': '18K',
  '21k': '21K', '22k': '22K',
};
const COLOR_LABELS = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };

const MALZEME_COLORS = {
  altin: '#D4AF37', gumus: '#A8A9AD', bakir: '#B87333',
  palladyum: '#7B68EE', nikel: '#708090', cink: '#5F9EA0', diger: '#8B8B8B',
};
const MALZEME_LABELS = {
  altin: 'Has Altın (995)', gumus: 'Gümüş', bakir: 'Bakır',
  palladyum: 'Palladyum', nikel: 'Nikel', cink: 'Çinko', diger: 'Diğer',
};

const HAS_ALTIN_PURITY = 0.995;

const MadenAyarlama = () => {
  const { colors } = useTheme();

  const [receteler, setReceteler]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);

  const [inputMode, setInputMode]             = useState('has');   // 'has' | 'toplam'
  const [hasGramInput, setHasGramInput]       = useState(null);
  const [toplamGramInput, setToplamGramInput] = useState(null);
  const [secilenAyar, setSecilenAyar]         = useState(null);
  const [secilenRecete, setSecilenRecete]     = useState(null);
  const [sending, setSending]                 = useState(false);

  const card = {
    background: colors.card, border: '1px solid ' + colors.border,
    borderRadius: 12, boxShadow: colors.cardShadow,
  };

  const load = useCallback(async () => {
    try {
      const data = await getReceteler();
      setReceteler(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredReceteler = receteler.filter(r => r.hedef_ayar === secilenAyar && r.is_active);

  const handleAyarChange = (val) => {
    setSecilenAyar(val);
    setSecilenRecete(null);
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
  };

  const receteObj = secilenRecete ? receteler.find(r => r.id === secilenRecete) : null;

  const hasRatio = secilenAyar ? PURITY_HAS[secilenAyar] : null;

  // --- Mode-dependent calculations ---
  let toplamGram, hasGram, safAltinGram;

  if (inputMode === 'has') {
    // User enters has gold (995) grams → total alloy is computed
    hasGram     = hasGramInput;
    safAltinGram = (hasGram && hasGram > 0) ? hasGram * HAS_ALTIN_PURITY : null;
    toplamGram  = (safAltinGram && hasRatio) ? safAltinGram / hasRatio : null;
  } else {
    // User enters target total alloy grams → required has gold is computed
    toplamGram = (toplamGramInput && toplamGramInput > 0) ? toplamGramInput : null;
    if (toplamGram && receteObj) {
      // If the recipe has a gold ratio, use it; otherwise estimate from purity
      const altinRow = receteObj.malzemeler.find(m => m.malzeme === 'altin');
      hasGram = altinRow
        ? toplamGram * (altinRow.oran / 100)
        : (hasRatio ? toplamGram * hasRatio / HAS_ALTIN_PURITY : null);
    } else if (toplamGram && hasRatio) {
      // If no recipe is selected, show a has-gold estimate based on purity
      hasGram = toplamGram * hasRatio / HAS_ALTIN_PURITY;
    } else {
      hasGram = null;
    }
    safAltinGram = (hasGram && hasGram > 0) ? hasGram * HAS_ALTIN_PURITY : null;
  }

  // Per-material gram breakdown
  const malzemeGramlar = (toplamGram && receteObj)
    ? (() => {
        if (inputMode === 'has') {
          // Has-gold amount stays fixed; the rest is distributed by ratio
          const hasAltinRow  = receteObj.malzemeler.find(m => m.malzeme === 'altin');
          if (hasAltinRow && hasGram) {
            const otherRows    = receteObj.malzemeler.filter(m => m.malzeme !== 'altin');
            const otherOranSum = otherRows.reduce((s, m) => s + m.oran, 0);
            const otherTotal   = toplamGram - hasGram;
            return receteObj.malzemeler.map(m => ({
              ...m,
              gram: m.malzeme === 'altin'
                ? hasGram
                : otherOranSum > 0 ? otherTotal * (m.oran / otherOranSum) : 0,
            }));
          }
          return receteObj.malzemeler.map(m => ({ ...m, gram: toplamGram * (m.oran / 100) }));
        } else {
          // Total alloy is fixed; each material = ratio × total directly
          return receteObj.malzemeler.map(m => ({ ...m, gram: toplamGram * (m.oran / 100) }));
        }
      })()
    : [];

  const handleSend = async () => {
    if (!toplamGram || !secilenAyar || !receteObj || !hasGram) return;
    try {
      setSending(true);
      await sendMadenAyarlama({
        recete_id: receteObj.id,
        input_mode: inputMode,
        has_grams: inputMode === 'has' ? hasGram : null,
        toplam_grams: inputMode === 'toplam' ? toplamGram : null,
        to_department: 'ocak',
      });
      message.success(
        'Maden ayarlandı ve transfer oluşturuldu — kasada has düşüldü, ayarlı stok oluştu. Ocak onayı bekleniyor.',
      );
    } catch (e) {
      message.error(e.message || 'Maden ayarlama / transfer başarısız.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spin size="large" />
    </div>
  );

  const ayarOrder  = ['8k','9k','10k','14k','18k','21k','22k'];
  const hasInput   = inputMode === 'has' ? !!hasGramInput : !!toplamGramInput;
  const modeOptions = [
    { label: 'Has Altın → Alaşım', value: 'has' },
    { label: 'Alaşım → Has Altın', value: 'toplam' },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && <Alert message={error} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: 22 }}>
          <ExperimentOutlined style={{ marginRight: 8, color: '#D4AF37' }} />
          Maden Ayarlama
        </h2>
        <p style={{ color: colors.subtext, fontSize: 13, margin: '4px 0 0' }}>
          Seçilen reçete ve ayara göre malzeme miktarlarını hesapla
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ marginBottom: 20 }}>
        <Segmented
          value={inputMode}
          onChange={handleModeChange}
          options={modeOptions}
          size="large"
          style={{ fontWeight: 600 }}
        />
        <div style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>
          {inputMode === 'has'
            ? 'Elimdeki Has Altın (995) miktarını gir — toplam alaşım ve malzeme dökümü hesaplanır'
            : 'İstediğin alaşım miktarını gir — gereken Has Altın ve tüm malzemeler hesaplanır'}
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* INPUT PANEL */}
        <Col xs={24} md={10}>
          <div style={{ ...card, padding: 28 }}>
            <div style={{ color: colors.subtext, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 20 }}>
              GİRİŞ PARAMETRELERİ
            </div>
            <Form layout="vertical">

              {inputMode === 'has' ? (
                <Form.Item label={
                  <span style={{ color: colors.text, fontWeight: 600 }}>Has Altın (995) Miktarı</span>
                }>
                  <InputNumber
                    value={hasGramInput}
                    onChange={setHasGramInput}
                    {...recipeGramInputProps}
                    placeholder="örn. 1000,000"
                    style={{ width: '100%' }}
                    size="large"
                    addonAfter="gr"
                  />
                </Form.Item>
              ) : (
                <Form.Item label={
                  <span style={{ color: colors.text, fontWeight: 600 }}>Hedef Alaşım Miktarı</span>
                }>
                  <InputNumber
                    value={toplamGramInput}
                    onChange={setToplamGramInput}
                    {...recipeGramInputProps}
                    placeholder="örn. 1860,000"
                    style={{ width: '100%' }}
                    size="large"
                    addonAfter="gr"
                  />
                </Form.Item>
              )}

              <Form.Item label={
                <span style={{ color: colors.text, fontWeight: 600 }}>Hedef Ayar</span>
              }>
                <Select
                  value={secilenAyar}
                  onChange={handleAyarChange}
                  placeholder="Ayar seçin"
                  size="large"
                  style={{ width: '100%' }}
                >
                  {ayarOrder.map(a => (
                    <Option key={a} value={a}>
                      <strong>{PURITY_LABELS[a]}</strong>
                      <span style={{ color: colors.subtext, fontSize: 11, marginLeft: 6 }}>
                        ({fmtRecipe(PURITY_HAS[a] * 100)}% has)
                      </span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label={
                <span style={{ color: colors.text, fontWeight: 600 }}>Reçete</span>
              }>
                <Select
                  value={secilenRecete}
                  onChange={setSecilenRecete}
                  placeholder={
                    !secilenAyar
                      ? 'Önce ayar seçin'
                      : filteredReceteler.length === 0
                        ? 'Bu ayar için reçete yok'
                        : 'Reçete seçin'
                  }
                  disabled={!secilenAyar || filteredReceteler.length === 0}
                  size="large"
                  style={{ width: '100%' }}
                >
                  {filteredReceteler.map(r => (
                    <Option key={r.id} value={r.id}>
                      {r.ad}
                      {r.hedef_renk && (
                        <span style={{ color: colors.subtext, fontSize: 11, marginLeft: 6 }}>
                          · {COLOR_LABELS[r.hedef_renk] || r.hedef_renk}
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Quick info box */}
              {secilenAyar && hasInput && (
                <div style={{
                  background: '#D4AF3712', border: '1px solid #D4AF3730',
                  borderRadius: 8, padding: '12px 16px', marginTop: 4,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  {inputMode === 'has' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Saf altın eşdeğeri (×0.995)</span>
                        <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 13 }}>
                          {safAltinGram ? fmtRecipe(safAltinGram) + ' g has' : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Hedef ayar has oranı</span>
                        <span style={{ color: colors.subtext, fontSize: 13 }}>
                          %{fmtRecipe(PURITY_HAS[secilenAyar] * 100)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D4AF3730', paddingTop: 5 }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Toplam alaşım ağırlığı</span>
                        <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>
                          {toplamGram ? fmtRecipe(toplamGram) + ' gr' : '—'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Hedef ayar has oranı</span>
                        <span style={{ color: colors.subtext, fontSize: 13 }}>
                          %{fmtRecipe(PURITY_HAS[secilenAyar] * 100)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Saf altın içeriği</span>
                        <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 13 }}>
                          {safAltinGram ? fmtRecipe(safAltinGram) + ' g has' : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D4AF3730', paddingTop: 5 }}>
                        <span style={{ color: colors.subtext, fontSize: 11 }}>Gerekli Has Altın (995)</span>
                        <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>
                          {hasGram ? fmtRecipe(hasGram) + ' gr' : '—'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Form>
          </div>
        </Col>

        {/* RESULT PANEL */}
        <Col xs={24} md={14}>
          <div style={{ ...card, padding: 28, minHeight: 300 }}>
            <div style={{ color: colors.subtext, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 20 }}>
              HESAPLAMA SONUCU
            </div>

            {!hasInput || !secilenAyar ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 12 }}>
                <ExperimentOutlined style={{ fontSize: 36, color: colors.subtext }} />
                <span style={{ color: colors.subtext, fontSize: 13 }}>
                  {inputMode === 'has'
                    ? 'Has Altın 995 miktarı ve hedef ayar seçin'
                    : 'Hedef alaşım miktarı ve ayar seçin'}
                </span>
              </div>
            ) : !receteObj ? (
              <Empty
                description={
                  <span style={{ color: colors.subtext }}>
                    {filteredReceteler.length === 0
                      ? `${PURITY_LABELS[secilenAyar]} için tanımlı reçete yok`
                      : 'Reçete seçin'}
                  </span>
                }
              />
            ) : (
              <>
                {/* Header summary */}
                <div style={{
                  background: '#D4AF3712', border: '1px solid #D4AF3730',
                  borderRadius: 8, padding: '14px 18px', marginBottom: 20,
                  display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 2 }}>REÇETE</div>
                    <div style={{ color: colors.text, fontWeight: 700, fontSize: 14 }}>{receteObj.ad}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Tag color="gold">{PURITY_LABELS[receteObj.hedef_ayar]}</Tag>
                      {receteObj.hedef_renk && (
                        <Tag>{COLOR_LABELS[receteObj.hedef_renk] || receteObj.hedef_renk}</Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {inputMode === 'has' ? (
                      <>
                        <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 2 }}>TOPLAM ALAŞIM</div>
                        <div style={{ color: '#D4AF37', fontWeight: 700, fontSize: 24 }}>
                          {fmtRecipe(toplamGram)} <span style={{ fontSize: 14, fontWeight: 400 }}>gr</span>
                        </div>
                        <div style={{ color: colors.subtext, fontSize: 11 }}>
                          {fmtRecipe(hasGram)} g has giriş
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 2 }}>GEREKEN HAS ALTIN (995)</div>
                        <div style={{ color: '#D4AF37', fontWeight: 700, fontSize: 24 }}>
                          {fmtRecipe(hasGram)} <span style={{ fontSize: 14, fontWeight: 400 }}>gr</span>
                        </div>
                        <div style={{ color: colors.subtext, fontSize: 11 }}>
                          {fmtRecipe(toplamGram)} gr toplam alaşım
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Ingredient breakdown */}
                <div style={{ color: colors.subtext, fontSize: 10, letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
                  MALZEME DÖKÜMÜ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {malzemeGramlar.map((m, i) => {
                    const barColor = MALZEME_COLORS[m.malzeme] || '#8B8B8B';
                    return (
                      <div key={i} style={{
                        background: colors.bg, border: '1px solid ' + colors.border,
                        borderLeft: '4px solid ' + barColor,
                        borderRadius: 8, padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: barColor }} />
                          <span style={{ color: colors.text, fontWeight: 600, fontSize: 13 }}>
                            {MALZEME_LABELS[m.malzeme] || m.malzeme}
                          </span>
                          <span style={{ color: colors.subtext, fontSize: 11 }}>%{fmtRecipe(m.oran)}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: barColor, fontWeight: 700, fontSize: 18 }}>
                            {fmtRecipe(m.gram)}
                          </span>
                          <span style={{ color: colors.subtext, fontSize: 11, marginLeft: 4 }}>gr</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ color: colors.subtext, fontSize: 12 }}>Toplam malzeme</span>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: 14 }}>
                    {fmtRecipe(malzemeGramlar.reduce((s, m) => s + m.gram, 0))} gr
                  </span>
                </div>

                <div style={{ marginTop: 20 }}>
                  <Popconfirm
                    title="Ocağa transfer oluştur"
                    description={
                      <div style={{ marginTop: 4, lineHeight: 1.8 }}>
                        <div><strong>{fmtRecipe(toplamGram)} gr</strong> ayarlı maden</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {PURITY_LABELS[secilenAyar]}
                          {receteObj.hedef_renk ? ' · ' + (COLOR_LABELS[receteObj.hedef_renk] || receteObj.hedef_renk) : ''}
                          {' · '}{receteObj.ad}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>Kasa → Ocak (onay bekleyecek)</div>
                      </div>
                    }
                    onConfirm={handleSend}
                    okText="Gönder"
                    cancelText="İptal"
                    okButtonProps={{ loading: sending }}
                    disabled={!toplamGram || !secilenAyar || !receteObj}
                  >
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      block
                      size="large"
                      loading={sending}
                      disabled={!toplamGram || !secilenAyar || !receteObj}
                    >
                      Ocağa Gönder
                    </Button>
                  </Popconfirm>
                </div>
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MadenAyarlama;
