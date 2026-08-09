// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C, input } from '../../styles/theme';
import { formatCurrency } from '../../domain/money.js';

const QUICK_PACKAGING = [0, 10, 20, 30];

const TotalsPanel = ({
  cartSubtotal,
  cartCgst,
  cartSgst,
  cartPackaging,
  cartDiscount,
  cartTotal,
  discountMode,
  discountInput,
  // Packaging charge editing (optional — passed through from Orders)
  packagingCharge,
  onPackagingChargeChange,
}) => {
  return (
    <div>
      {/* Line items */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        border: '1px solid var(--cafe-border-light)',
      }}>
        <Row label="Subtotal"      value={formatCurrency(cartSubtotal)} />
        <Row label="CGST (9%)"     value={formatCurrency(cartCgst)}     muted />
        <Row label="SGST (9%)"     value={formatCurrency(cartSgst)}     muted />
        {cartDiscount > 0 && (
          <Row
            label={`Discount${discountMode === 'percent' && discountInput ? ` (${discountInput}%)` : ''}`}
            value={`−${formatCurrency(cartDiscount)}`}
            color="#4ade80"
          />
        )}
        {/* Packaging charge — inline quick-select if handler provided */}
        {onPackagingChargeChange ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 600 }}>Packaging</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--cafe-text-secondary)', fontWeight: 700 }}>
                {cartPackaging > 0 ? formatCurrency(cartPackaging) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {QUICK_PACKAGING.map(v => {
                const active = Number(packagingCharge) === v;
                return (
                  <button
                    key={v}
                    onClick={() => onPackagingChargeChange(v === 0 ? '' : String(v))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      border: `1px solid ${active ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`,
                      background: active ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                      color: active ? 'var(--cafe-accent)' : 'var(--cafe-text-tertiary)',
                      fontSize: 11, fontWeight: active ? 800 : 600,
                      cursor: 'pointer', transition: 'all .2s',
                    }}
                    onMouseOver={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
                    onMouseOut={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-card)'; } }}
                  >
                    {v === 0 ? 'None' : `₹${v}`}
                  </button>
                );
              })}
              <input
                style={{ width: 60, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 12, textAlign: 'center', outline: 'none', transition: 'all 0.2s' }}
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={packagingCharge}
                onChange={e => onPackagingChargeChange(e.target.value)}
                placeholder="..."
                onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
              />
            </div>
          </div>
        ) : (
          cartPackaging > 0 && (
            <Row label="Packaging" value={formatCurrency(cartPackaging)} muted />
          )
        )}
      </div>

      {/* Grand total — prominent */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 20px',
        borderRadius: 14,
        background: 'var(--cafe-accent-bg)',
        border: '1px solid var(--cafe-accent)',
        boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cafe-text-secondary)' }}>Total</span>
        <span style={{
          fontSize: 28, fontWeight: 900, fontFamily: 'monospace',
          color: 'var(--cafe-accent)', letterSpacing: '-0.03em',
        }}>
          {formatCurrency(cartTotal)}
        </span>
      </div>
    </div>
  );
};

function Row({ label, value, muted = false, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: muted ? 'var(--cafe-text-tertiary)' : 'var(--cafe-text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'monospace', color: color || (muted ? 'var(--cafe-text-tertiary)' : 'var(--cafe-text-secondary)'), fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export default TotalsPanel;
