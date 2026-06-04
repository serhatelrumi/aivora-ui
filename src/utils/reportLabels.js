import { PUR_LABEL, purityLabel, matPurColorStr } from '../constants/goldCatalog';

export const DEPT_LABEL = {
  kasa: 'Kasa', ocak: 'Ocak', pres: 'Pres', kaynak: 'Kaynak', pres_montaj: 'Pres Montaj',
  cila: 'Cila', ayarevi: 'Ayar Evi', cnc: 'CNC', kaliphane: 'Kalıphane', dokum: 'Döküm',
  dokum_montaj: 'Döküm Montaj', ar_ge: 'AR-GE', halka_kilit: 'Halka Kilit',
  sarnel_kilit: 'Sarnel Kilit', zincir: 'Zincir', atolye: 'Atölye', top: 'Top',
};

export { PUR_LABEL };

export const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
export const MAT_LABEL = { altin: 'Altın', gumus: 'Gümüş' };

export const fmt = (n, d = 2) =>
  typeof n === 'number'
    ? n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '—';

export const fmtHas995 = (v) => (v != null ? fmt(v / 0.995) : '—');

export const matStr = (mat, pur, col) =>
  mat === 'altin'
    ? purityLabel(pur, col)
    : matPurColorStr(mat, pur, col);

export const dtFmt = (v) =>
  v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const transferRow = (t) => [
  t.id,
  DEPT_LABEL[t.from_department] || t.from_department || 'Dış',
  DEPT_LABEL[t.to_department] || t.to_department || 'Kasa',
  matStr(t.material_type, t.purity, t.color),
  fmt(t.weight_grams) + ' gr',
  fmtHas995(t.has_value) + (t.has_value != null ? ' g' : ''),
  t.status || '—',
  dtFmt(t.created_at),
];

export const TRANSFER_HEADERS = [
  '#', 'Gönderen', 'Alıcı', 'Materyal', 'Ağırlık', 'HAS', 'Durum', 'Tarih',
];

export const RENK_LABEL = {
  kirmizi: 'Tolerans Aşıldı', sari: 'Kapatmaya Hazır',
  yesil: 'Kapatıldı', mavi: 'Mizan Onaylandı',
};
