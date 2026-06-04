import React from 'react';

/**
 * Kontrol Merkezi widget grupları — her havuz kendi başlığı ve kart alanında.
 */
const WidgetPool = ({ title, subtitle, headerExtra, children, colors }) => (
  <section
    style={{
      background: colors.poolBg,
      border: '1px solid ' + colors.poolBorder,
      borderRadius: 12,
      boxShadow: colors.poolShadow,
      padding: '20px 24px 24px',
      marginBottom: 24,
    }}
  >
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px 12px',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: '8px 10px',
        flex: '1 1 auto',
        minWidth: 0,
      }}>
        <h3 style={{ color: colors.text, fontWeight: 600, fontSize: 16, margin: 0, flexShrink: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <span style={{ color: colors.subtext, fontSize: 12, fontWeight: 400, lineHeight: 1.4 }}>
            {subtitle}
          </span>
        )}
      </div>
      {headerExtra && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {headerExtra}
        </div>
      )}
    </div>
    {children}
  </section>
);

export default WidgetPool;
