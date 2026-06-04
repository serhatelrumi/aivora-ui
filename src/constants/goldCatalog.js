/**
 * Fabrika altın kataloğu — transfer ve başlangıç stoğu ile aynı liste.
 * value: form alanı için "purity" veya "purity|color"
 */

/** Backend PURITY_HAS_RATIO ile aynı (has gram hesabı). */
export const PURITY_HAS_RATIO = {
  has_995: 0.995,
  '22k': 0.916,
  '21k': 0.875,
  '18k': 0.750,
  '14k': 0.585,
  '10k': 0.417,
  '9k': 0.375,
  '8k': 0.333,
};

export const GOLD_STOCK_LINES = [
  { purity: 'has_995', color: null, label: 'Has Altın (995)' },
  { purity: '22k', color: null, label: '22K (916)' },
  { purity: '21k', color: null, label: '21K (875)' },
  { purity: '18k', color: 'yesil', label: '18K Yeşil (750)' },
  { purity: '18k', color: 'kirmizi', label: '18K Kırmızı (750)' },
  { purity: '18k', color: 'beyaz', label: '18K Beyaz (750)' },
  { purity: '14k', color: 'yesil', label: '14K Yeşil (585)' },
  { purity: '14k', color: 'kirmizi', label: '14K Kırmızı (585)' },
  { purity: '14k', color: 'beyaz', label: '14K Beyaz (585)' },
  { purity: '10k', color: 'yesil', label: '10K Yeşil (417)' },
  { purity: '10k', color: 'kirmizi', label: '10K Kırmızı (417)' },
  { purity: '10k', color: 'beyaz', label: '10K Beyaz (417)' },
  { purity: '9k', color: 'yesil', label: '9K Yeşil (375)' },
  { purity: '9k', color: 'kirmizi', label: '9K Kırmızı (375)' },
  { purity: '9k', color: 'beyaz', label: '9K Beyaz (375)' },
  { purity: '8k', color: 'yesil', label: '8K Yeşil (333)' },
  { purity: '8k', color: 'kirmizi', label: '8K Kırmızı (333)' },
  { purity: '8k', color: 'beyaz', label: '8K Beyaz (333)' },
];

export const lineKey = (purity, color) => (color ? `${purity}|${color}` : purity);

export const GOLD_STOCK_SELECT_OPTIONS = GOLD_STOCK_LINES.map((line) => ({
  value: lineKey(line.purity, line.color),
  label: line.label,
}));

export const COLORED_PURITIES = ['8k', '9k', '10k', '14k', '18k'];
export const UNCOLORED_PURITIES = ['has_995', '22k', '21k'];

export const PUR_LABEL = Object.fromEntries(
  GOLD_STOCK_LINES.map((l) => [lineKey(l.purity, l.color), l.label]),
);
// Tekil purity anahtarı (renksiz satırlar + geriye dönük)
PUR_LABEL.has_995 = 'Has Altın (995)';
PUR_LABEL['22k'] = '22K (916)';
PUR_LABEL['21k'] = '21K (875)';
PUR_LABEL['8k'] = '8K';
PUR_LABEL['9k'] = '9K';
PUR_LABEL['10k'] = '10K';
PUR_LABEL['14k'] = '14K';
PUR_LABEL['18k'] = '18K';
PUR_LABEL['925'] = '925 Gümüş';
PUR_LABEL.altin_diger = 'Has Altın (995)';

export const parseStockLineKey = (key) => {
  if (!key) return { purity: undefined, color: undefined };
  if (!key.includes('|')) return { purity: key, color: undefined };
  const [purity, color] = key.split('|');
  return { purity, color };
};

export const purityLabel = (purity, color) => {
  const key = lineKey(purity, color);
  if (PUR_LABEL[key]) return PUR_LABEL[key];
  if (color) {
    const col = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' }[color] || color;
    return `${(purity || '').replace('k', 'K').toUpperCase()} ${col}`;
  }
  return PUR_LABEL[purity] || purity;
};

export const matPurColorStr = (mat, pur, col) => {
  if (mat === 'altin') return purityLabel(pur, col);
  if (mat === 'gumus') return 'Gümüş · 925';
  return [pur, col].filter(Boolean).join(' · ');
};
