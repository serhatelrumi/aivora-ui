import React from 'react';
import { displayHasGrams } from '../../utils/balanceDisplay';
import { purityLabel } from '../../constants/goldCatalog';
import { fmt } from '../../utils/reportLabels';

const COLOR_LABEL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };

const DeptStockTable = ({ lines, colors, showFooter = true }) => {
  if (!lines || lines.length === 0) {
    return (
      <div style={{ color: colors.subtext, fontSize: 12, fontStyle: 'italic' }}>
        Bakiye yok
      </div>
    );
  }

  const totalHas = lines.reduce((sum, b) => sum + displayHasGrams(b), 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: colors.subtext, fontSize: 11 }}>
            <th style={{ textAlign: 'left', fontWeight: 400, paddingBottom: 4 }}>Ayar</th>
            <th style={{ textAlign: 'right', fontWeight: 400, paddingBottom: 4, whiteSpace: 'nowrap' }}>Ağırlık</th>
            <th style={{ textAlign: 'right', fontWeight: 400, paddingBottom: 4, whiteSpace: 'nowrap' }}>HAS</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((b, i) => (
            <tr key={i}>
              <td style={{ color: colors.text, paddingBottom: 3, whiteSpace: 'nowrap' }}>
                {purityLabel(b.purity, b.color)}
                {b.color ? (
                  <span style={{ color: colors.subtext }}>
                    {' · '}{COLOR_LABEL[b.color] || b.color}
                  </span>
                ) : null}
              </td>
              <td style={{ textAlign: 'right', color: colors.text, paddingBottom: 3, whiteSpace: 'nowrap' }}>
                {fmt(b.weight_grams)} gr
              </td>
              <td style={{ textAlign: 'right', color: colors.gold, fontWeight: 600, paddingBottom: 3, whiteSpace: 'nowrap' }}>
                {fmt(displayHasGrams(b))} g
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showFooter && (
        <div style={{
          borderTop: '1px solid ' + colors.border,
          paddingTop: 8,
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
        }}>
          <span style={{ color: colors.subtext }}>Toplam HAS</span>
          <span style={{ color: colors.gold, fontWeight: 700 }}>{fmt(totalHas)} g</span>
        </div>
      )}
    </div>
  );
};

export default DeptStockTable;
