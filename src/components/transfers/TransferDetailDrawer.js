import React from 'react';
import { Drawer, Tag } from 'antd';
import { purityLabel } from '../../constants/goldCatalog';
import { DEPT_LABEL, MAT_LABEL, fmt, fmtHas995 } from '../../utils/reportLabels';

const PRODUCT_FORMS = [
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

const FORM_LABEL = Object.fromEntries(PRODUCT_FORMS.map((f) => [f.value, f.label]));
const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
const ST_COLOR = { beklemede: 'orange', onaylandi: 'success', reddedildi: 'error' };
const ST_LABEL = { beklemede: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' };

const durumTag = (r) => {
  if (r.is_deleted) return <Tag color="error">Silindi</Tag>;
  if (r.is_modified && r.status === 'onaylandi') return <Tag color="cyan">Onaylandı ✎</Tag>;
  if (r.is_modified) return <Tag color="magenta">Değiştirildi</Tag>;
  return <Tag color={ST_COLOR[r.status]}>{ST_LABEL[r.status] || r.status}</Tag>;
};

const dtFmt = (v) => (v ? new Date(v).toLocaleString('tr-TR') : '—');

const TransferDetailDrawer = ({ record, onClose, colors }) => {
  const r = record;
  const labelStyle = { fontSize: 10, color: colors.subtext, letterSpacing: 1, marginBottom: 2 };
  const item = (label, value) => (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 13, color: colors.text }}>{value}</div>
    </div>
  );

  return (
    <Drawer
      title={r ? `Transfer #${r.id}` : ''}
      open={!!r}
      onClose={onClose}
      placement="right"
      width={420}
      styles={{ body: { padding: '16px 20px' } }}
    >
      {r && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {durumTag(r)}
            <Tag color="gold">{purityLabel(r.purity, r.color)}</Tag>
            {r.color && <Tag>{COLOR_LABEL[r.color] || r.color}</Tag>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {item('GÖNDEREN', <Tag color="orange">{DEPT_LABEL[r.from_department] || r.from_department || 'Dış Kaynak'}</Tag>)}
            {item('ALICI', <Tag color="blue">{DEPT_LABEL[r.to_department] || r.to_department || 'Kasa'}</Tag>)}
            {item('MATERYAL', MAT_LABEL[r.material_type] || r.material_type || '—')}
            {item('AYAR', purityLabel(r.purity, r.color))}
            {item('AĞIRLIK', <span style={{ color: colors.gold, fontWeight: 700 }}>{fmt(r.weight_grams)} gr</span>)}
            {item('HAS', r.has_value != null ? <span style={{ fontWeight: 600 }}>{fmtHas995(r.has_value)} g</span> : '—')}
            {item('MADEN TÜRÜ', FORM_LABEL[r.product_form] || r.product_form || '—')}
            {item('OLUŞTURULMA', dtFmt(r.created_at))}
            {r.confirmed_at && item('ONAYLANDI', dtFmt(r.confirmed_at))}
            {r.rejection_reason && item('RED NEDENİ', <span style={{ color: '#ff4d4f' }}>{r.rejection_reason}</span>)}
          </div>

          {r.notes && (
            <div style={{ marginTop: 8 }}>
              <div style={labelStyle}>NOTLAR</div>
              <div style={{
                background: colors.inputBg,
                border: '1px solid ' + colors.border,
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: colors.text,
              }}>
                {r.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default TransferDetailDrawer;
