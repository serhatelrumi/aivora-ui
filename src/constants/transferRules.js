/**
 * Has altın ve fabrika-içi transfer iş kuralları.
 * Kontrol Merkezi / raporlar da bu modülü kullanabilir.
 */

import { buildTransferPurityOptions } from './goldCatalog';

export const EXTERNAL_DEPT_VALUE = '__external__';
export const HAS_PURITY = 'has_995';
export const HAS_PRODUCT_FORM = 'has_altin';
export const KASA = 'kasa';

export const HAS_INTERNAL_ERROR =
  'Fabrika içinde has altın transferi yapılamaz. Has girişi yalnızca Dış Kaynak → Kasa ile kaydedilir.';

export const HAS_ENTRY_MISMATCH_ERROR =
  'Has altın girişi: gönderen Dış Kaynak, alıcı Kasa, ayar Has 995 ve maden türü Has Altın olmalıdır.';

export const EXTERNAL_ONLY_KASA_ERROR =
  'Dış Kaynak yalnızca Kasaya transfer yapabilir.';

/** Form/API gönderen değerini normalize et */
export const normalizeFromDepartment = (from) => {
  if (from === EXTERNAL_DEPT_VALUE || from === null || from === undefined || from === '') {
    return null;
  }
  return from;
};

export const isExternalSender = (from) => normalizeFromDepartment(from) === null;

export const isHasEntry = (from, to, purity, productForm) =>
  isExternalSender(from) &&
  to === KASA &&
  purity === HAS_PURITY &&
  productForm === HAS_PRODUCT_FORM;

export const isInternalTransfer = (from, to) => {
  const f = normalizeFromDepartment(from);
  return f != null && to != null && to !== '';
};

/** Bu from/to için ayar listesinde has_995 gösterilsin mi? */
export const allowsHasPurity = (from, to) => {
  const f = normalizeFromDepartment(from);
  return f === null && to === KASA;
};

export const getAllowedPurities = (from, to) => {
  if (allowsHasPurity(from, to)) {
    return buildTransferPurityOptions({ includeHas: true }).filter((o) => o.value === HAS_PURITY);
  }
  return buildTransferPurityOptions({ includeHas: false });
};

export const getAllowedProductForms = (purity, allForms) => {
  if (purity === HAS_PURITY) {
    return allForms.filter((f) => f.value === HAS_PRODUCT_FORM);
  }
  return allForms.filter((f) => f.value !== HAS_PRODUCT_FORM);
};

export const isProductFormLocked = (purity) => purity === HAS_PURITY;

/**
 * Transfer iş kuralı doğrulaması.
 * @returns {string|null} Hata mesajı veya null
 */
export const validateTransfer = ({ from_department, to_department, purity, product_form }) => {
  const from = normalizeFromDepartment(from_department);
  const to = to_department;

  if (!to) return 'Alıcı departman seçilmelidir.';

  if (from && from === to) {
    return 'Gönderen ve alıcı aynı departman olamaz.';
  }

  if (isExternalSender(from) && to !== KASA) {
    return EXTERNAL_ONLY_KASA_ERROR;
  }

  const hasPurity = purity === HAS_PURITY;
  const hasForm = product_form === HAS_PRODUCT_FORM;

  if (isHasEntry(from, to, purity, product_form)) {
    return null;
  }

  if (hasPurity || hasForm) {
    if (isInternalTransfer(from, to)) {
      return HAS_INTERNAL_ERROR;
    }
    if (isExternalSender(from) && to === KASA) {
      return HAS_ENTRY_MISMATCH_ERROR;
    }
    return HAS_INTERNAL_ERROR;
  }

  if (isExternalSender(from) && to === KASA) {
    return HAS_ENTRY_MISMATCH_ERROR;
  }

  return null;
};

export const FROM_DEPT_OPTIONS = [
  { value: EXTERNAL_DEPT_VALUE, label: 'Dış Kaynak' },
];
