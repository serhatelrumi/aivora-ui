export const VARDIYA_RENK = {
  kirmizi: { hex: '#FF4D4F', label: 'Tolerans Aşıldı', canClose: false },
  sari: { hex: '#FAAD14', label: 'Kapatmaya Hazır', canClose: false },
  yesil: { hex: '#52C41A', label: 'Kapatıldı', canClose: false },
  mavi: { hex: '#1677FF', label: 'Mizan Onaylandı', canClose: false },
};

export const VARDIYA_RENK_FILTER = [
  { value: 'kirmizi', label: 'Tolerans Aşıldı' },
  { value: 'sari', label: 'Kapatmaya Hazır' },
  { value: 'yesil', label: 'Kapatıldı' },
  { value: 'mavi', label: 'Mizan Onaylandı' },
];

export const vardiyaRenkConfig = (renk) =>
  VARDIYA_RENK[renk] || { hex: '#8B8B8B', label: '—', canClose: false };
