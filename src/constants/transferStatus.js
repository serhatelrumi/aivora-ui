/** Transfer durum topu — Kontrol Merkezi ve Transferler ile ortak */

export const STATUS_COLOR = {
  pending: '#EAB308',
  approved: '#22C55E',
  modified: '#D946EF',
  approvedModified: '#2563EB',
  deleted: '#EF4444',
};

export const TRANSFER_LEGEND = [
  { hex: STATUS_COLOR.pending, label: 'Onay bekliyor' },
  { hex: STATUS_COLOR.approved, label: 'Onaylandı' },
  { hex: STATUS_COLOR.modified, label: 'Değiştirildi' },
  { hex: STATUS_COLOR.approvedModified, label: 'Onaylandı (düzenlendi)' },
  { hex: STATUS_COLOR.deleted, label: 'Silindi' },
];

export const getTransferStatusDotColor = (r) => {
  if (r.is_deleted) return STATUS_COLOR.deleted;
  if (r.is_modified && r.status === 'onaylandi') return STATUS_COLOR.approvedModified;
  if (r.is_modified) return STATUS_COLOR.modified;
  if (r.status === 'beklemede') return STATUS_COLOR.pending;
  if (r.status === 'onaylandi') return STATUS_COLOR.approved;
  if (r.status === 'reddedildi') return STATUS_COLOR.modified;
  return STATUS_COLOR.pending;
};

export const ST_LABEL = {
  beklemede: 'Onay bekliyor',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
};

export const durumTagColor = (r) => getTransferStatusDotColor(r);

export const transferDurumLabel = (r) => {
  if (r.is_deleted) return 'Silindi';
  if (r.is_modified && r.status === 'onaylandi') return 'Onaylandı (düzenlendi)';
  if (r.is_modified) return 'Değiştirildi';
  return ST_LABEL[r.status] || r.status;
};
