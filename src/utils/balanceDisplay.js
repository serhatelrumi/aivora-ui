import { PURITY_HAS_RATIO, purityLabel } from '../constants/goldCatalog';
import { DEPT_LABEL } from './reportLabels';

/** Rapor/transfer ile uyumlu: has_balance → g has gösterimi */
export const displayHasGrams = (b) => {
  if (b.has_balance != null && b.has_balance > 0) return b.has_balance / 0.995;
  const ratio = PURITY_HAS_RATIO[b.purity];
  if (ratio == null) return 0;
  return ((b.weight_grams || 0) * ratio) / 0.995;
};

export const PRODUCTION_DEPARTMENTS = [
  'ocak', 'pres', 'kaynak', 'pres_montaj', 'cila', 'ayarevi', 'cnc', 'kaliphane',
  'dokum', 'dokum_montaj', 'ar_ge', 'halka_kilit', 'sarnel_kilit', 'zincir', 'atolye', 'top',
];

/**
 * @param {Array} balances - API balance rows
 * @param {{ excludeKasa?: boolean }} opts
 * @returns {Record<string, Array>} department -> sorted balance lines
 */
export const groupAltinByDepartment = (balances, { excludeKasa = true } = {}) => {
  const map = {};
  if (!Array.isArray(balances)) return map;

  for (const b of balances) {
    if (b.material_type !== 'altin') continue;
    if ((b.weight_grams || 0) <= 0) continue;
    if (excludeKasa && b.department === 'kasa') continue;

    (map[b.department] = map[b.department] || []).push(b);
  }

  for (const dept of Object.keys(map)) {
    map[dept].sort((a, b) => {
      const la = purityLabel(a.purity, a.color);
      const lb = purityLabel(b.purity, b.color);
      return la.localeCompare(lb, 'tr');
    });
  }

  return map;
};

export const deptTotalHas = (lines) =>
  (lines || []).reduce((sum, b) => sum + displayHasGrams(b), 0);

/**
 * @returns {{ department: string, lines: Array, totalHas: number }[]}
 */
export const buildDeptStockCards = (
  balanceMap,
  { showEmpty = false, search = '', deptOrder = PRODUCTION_DEPARTMENTS } = {},
) => {
  const q = (search || '').trim().toLowerCase();
  const depts = showEmpty
    ? [...deptOrder]
    : deptOrder.filter((d) => (balanceMap[d] || []).length > 0);

  let cards = depts.map((department) => ({
    department,
    lines: balanceMap[department] || [],
    totalHas: deptTotalHas(balanceMap[department]),
  }));

  if (q) {
    cards = cards.filter((c) => {
      const label = (DEPT_LABEL[c.department] || c.department).toLowerCase();
      return label.includes(q) || c.department.includes(q);
    });
  }

  cards.sort((a, b) => b.totalHas - a.totalHas);
  return cards;
};

export { purityLabel };
