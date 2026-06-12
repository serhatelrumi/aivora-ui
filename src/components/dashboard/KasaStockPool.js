import React, { useState, useEffect, useCallback } from 'react';
import { Spin } from 'antd';
import { BankOutlined, GoldOutlined, AppstoreOutlined, FundOutlined, ToolOutlined } from '@ant-design/icons';
import { getKasaBalance, getHasSummary } from '../../api/dashboard';
import { purityLabel, lineKey, PURITY_HAS_RATIO } from '../../constants/goldCatalog';
import WidgetPool from './WidgetPool';

const HAS_PURITIES = new Set(['has_995', 'altin_diger']);

const fmt = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "14K Kırmızı (585)" → kalın isim + normal millesimal */
const OtherStockLabel = ({ label, colors }) => {
  const paren = label.indexOf(' (');
  if (paren === -1) {
    return <strong style={{ color: colors.text, fontWeight: 700 }}>{label}</strong>;
  }
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <strong style={{ color: colors.text, fontWeight: 700 }}>{label.slice(0, paren)}</strong>
      <span style={{ color: colors.subtext, fontWeight: 400 }}>{label.slice(paren)}</span>
    </span>
  );
};

/** Rapor/transfer ile uyumlu: has_balance → g has gösterimi */
const toDisplayHas = (b) => {
  if (b.has_balance != null && b.has_balance > 0) return b.has_balance / 0.995;
  const ratio = PURITY_HAS_RATIO[b.purity];
  if (ratio == null) return 0;
  return ((b.weight_grams || 0) * ratio) / 0.995;
};

const matchAyar = (b, purity, color) => {
  if (b.material_type !== 'altin' || b.purity !== purity) return false;
  const c = b.color ?? null;
  if (color == null) return c == null;
  return c === color;
};

const isTrackedKeyStock = (b) => {
  if (b.material_type !== 'altin') return false;
  if (HAS_PURITIES.has(b.purity)) return true;
  if (matchAyar(b, '14k', 'yesil')) return true;
  if (matchAyar(b, '18k', 'yesil')) return true;
  if (matchAyar(b, '21k', null)) return true;
  if (matchAyar(b, '22k', null)) return true;
  return false;
};

const parseKasaStocks = (balances) => {
  const empty = {
    has: 0, hasHas: 0,
    k14Yesil: 0, k14YesilHas: 0,
    k18Yesil: 0, k18YesilHas: 0,
    k21: 0, k21Has: 0,
    k22: 0, k22Has: 0,
    otherLines: [],
  };
  if (!Array.isArray(balances)) return empty;

  let has = 0;
  let hasHas = 0;
  let k14Yesil = 0;
  let k14YesilHas = 0;
  let k18Yesil = 0;
  let k18YesilHas = 0;
  let k21 = 0;
  let k21Has = 0;
  let k22 = 0;
  let k22Has = 0;
  const otherByKey = new Map();

  for (const b of balances) {
    const w = b.weight_grams || 0;
    if (w <= 0) continue;
    const h = toDisplayHas(b);
    if (b.material_type === 'altin' && HAS_PURITIES.has(b.purity)) {
      has += w;
      hasHas += h;
    } else if (matchAyar(b, '14k', 'yesil')) {
      k14Yesil += w;
      k14YesilHas += h;
    } else if (matchAyar(b, '18k', 'yesil')) {
      k18Yesil += w;
      k18YesilHas += h;
    } else if (matchAyar(b, '21k', null)) {
      k21 += w;
      k21Has += h;
    } else if (matchAyar(b, '22k', null)) {
      k22 += w;
      k22Has += h;
    } else if (b.material_type === 'altin' && !isTrackedKeyStock(b)) {
      const key = lineKey(b.purity, b.color ?? null);
      const prev = otherByKey.get(key) || {
        purity: b.purity, color: b.color ?? null, grams: 0, hasGrams: 0,
      };
      otherByKey.set(key, {
        ...prev,
        grams: prev.grams + w,
        hasGrams: prev.hasGrams + h,
      });
    }
  }

  const otherLines = [...otherByKey.values()]
    .map((row) => ({
      ...row,
      label: purityLabel(row.purity, row.color),
      key: lineKey(row.purity, row.color),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr'));

  return {
    has, hasHas, k14Yesil, k14YesilHas, k18Yesil, k18YesilHas,
    k21, k21Has, k22, k22Has, otherLines,
  };
};

const FIXED_WIDGETS = [
  { key: 'has', label: 'Kasa Has Miktarı', field: 'has', hasField: 'hasHas', icon: BankOutlined },
  { key: '14k', label: '14K Yeşil', field: 'k14Yesil', hasField: 'k14YesilHas', icon: GoldOutlined },
  { key: '18k', label: '18K Yeşil', field: 'k18Yesil', hasField: 'k18YesilHas', icon: GoldOutlined },
  { key: '21k', label: '21K', field: 'k21', hasField: 'k21Has', icon: GoldOutlined },
  { key: '22k', label: '22K', field: 'k22', hasField: 'k22Has', icon: GoldOutlined },
];

const WIDGET_TITLE = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 0.3,
  whiteSpace: 'nowrap',
  lineHeight: 1.25,
};

const VALUE_STYLE = { color: '#D4AF37', fontSize: 28, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' };
const HAS_LINE_STYLE = { fontSize: 14, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', marginTop: 8 };

const StockWidget = ({ label, value, hasValue, icon: Icon, loading, failed, colors, isHasStock }) => (
  <div style={{
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    boxShadow: colors.cardShadow,
    padding: '20px 24px',
    height: '100%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, minWidth: 0 }}>
      <Icon style={{ color: '#D4AF37', fontSize: 20, flexShrink: 0 }} />
      <span style={{ color: colors.subtext, ...WIDGET_TITLE }}>
        {label}
      </span>
    </div>
    {loading ? (
      <Spin size="small" />
    ) : failed ? (
      <span style={{ color: colors.subtext, fontSize: 13 }}>—</span>
    ) : isHasStock ? (
      <div style={VALUE_STYLE}>
        {fmt(value)}
        <span style={{ fontSize: 13, color: colors.subtext, fontWeight: 400, marginLeft: 6 }}>gr</span>
      </div>
    ) : (
      <>
        <div style={VALUE_STYLE}>
          {fmt(value)}
          <span style={{ fontSize: 13, color: colors.subtext, fontWeight: 400, marginLeft: 6 }}>gr</span>
        </div>
        <div style={{ ...HAS_LINE_STYLE, color: colors.subtext }}>
          <span style={{ color: colors.subtext, fontWeight: 500, marginRight: 6 }}>HAS</span>
          <span style={{ color: '#D4AF37' }}>{fmt(hasValue)}</span>
          <span style={{ fontWeight: 400, marginLeft: 6 }}>gr</span>
        </div>
      </>
    )}
  </div>
);

const OTHER_GRID = 'minmax(0, 1fr) auto auto';
const OtherStockWidget = ({ lines, colors }) => (
  <div style={{
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    boxShadow: colors.cardShadow,
    padding: '20px 24px',
    height: '100%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <AppstoreOutlined style={{ color: '#D4AF37', fontSize: 20, flexShrink: 0 }} />
      <span style={{ color: colors.subtext, ...WIDGET_TITLE }}>Kasa Diğer Stok</span>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: OTHER_GRID,
      columnGap: 20,
      rowGap: 10,
      fontSize: 12,
      alignItems: 'baseline',
    }}>
      <span />
      <span style={{ color: colors.subtext, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>Miktar</span>
      <span style={{ color: colors.subtext, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>HAS</span>
      {lines.map((row) => (
        <React.Fragment key={row.key}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <OtherStockLabel label={row.label} colors={colors} />
          </span>
          <span style={{ color: '#D4AF37', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
            {fmt(row.grams)} gr
          </span>
          <span style={{ color: '#D4AF37', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
            {fmt(row.hasGrams)} gr
          </span>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const KasaStockPool = ({ colors, refreshTick = 0 }) => {
  const [stocks, setStocks] = useState(null);
  const [totals, setTotals] = useState({ kasa: 0, factory: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFailed(false);
    try {
      const [balances, summary] = await Promise.all([
        getKasaBalance(),
        getHasSummary(),
      ]);
      setStocks(parseKasaStocks(balances));
      setTotals({
        kasa: summary?.kasa_total_has_gr ?? 0,
        factory: summary?.factory_total_has_gr ?? 0,
      });
    } catch {
      setFailed(true);
      setStocks(null);
      setTotals({ kasa: 0, factory: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(refreshTick > 0); }, [load, refreshTick]);

  const otherLines = stocks?.otherLines ?? [];
  const showOther = !loading && !failed && otherLines.length > 0;
  const kasaTotal = totals.kasa ?? 0;
  const factoryTotal = totals.factory ?? 0;
  const atolyeTotal = factoryTotal - kasaTotal;

  return (
    <WidgetPool
      title="Kasa Stoku"
      subtitle="Anlık kasa bakiyeleri"
      colors={colors}
    >
      <div className="kasa-stock-grid">
        {FIXED_WIDGETS.map((w) => (
          <StockWidget
            key={w.key}
            label={w.label}
            value={stocks?.[w.field] ?? 0}
            hasValue={stocks?.[w.hasField] ?? 0}
            icon={w.icon}
            loading={loading}
            failed={failed}
            colors={colors}
            isHasStock={w.key === 'has'}
          />
        ))}
        <StockWidget
          label="Fabrika Toplam HAS"
          value={factoryTotal}
          hasValue={0}
          icon={FundOutlined}
          loading={loading}
          failed={failed}
          colors={colors}
          isHasStock
        />
        <StockWidget
          label="Kasa Toplam HAS"
          value={kasaTotal}
          hasValue={0}
          icon={BankOutlined}
          loading={loading}
          failed={failed}
          colors={colors}
          isHasStock
        />
        <StockWidget
          label="Atölye Toplam HAS"
          value={atolyeTotal}
          hasValue={0}
          icon={ToolOutlined}
          loading={loading}
          failed={failed}
          colors={colors}
          isHasStock
        />
        <div className="kasa-stock-span-2">
          {showOther ? (
            <OtherStockWidget lines={otherLines} colors={colors} />
          ) : (
            <div aria-hidden style={{ height: '100%' }} />
          )}
        </div>
      </div>
    </WidgetPool>
  );
};

export default KasaStockPool;
