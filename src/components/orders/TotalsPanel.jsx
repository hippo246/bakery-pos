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
        background: C.bg3,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>Packaging</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.text2, fontWeight: 600 }}>
                {cartPackaging > 0 ? formatCurrency(cartPackaging) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {QUICK_PACKAGING.map(v => {
                const active = Number(packagingCharge) === v;
                return (
                  <button
                    key={v}
                    onClick={() => onPackagingChargeChange(v === 0 ? '' : String(v))}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 7,
                      border: `1px solid ${active ? C.amber3 : C.border}`,
                      background: active ? C.amberDim : C.bg4,
                      color: active ? C.amber2 : C.text3,
                      fontSize: 10, fontWeight: active ? 800 : 500,
                      cursor: 'pointer', transition: 'all .1s',
                    }}
                  >
                    {v === 0 ? 'None' : `₹${v}`}
                  </button>
                );
              })}
              <input
                style={{ ...input, width: 52, padding: '4px 6px', fontSize: 11, textAlign: 'center' }}
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={packagingCharge}
                onChange={e => onPackagingChargeChange(e.target.value)}
                placeholder="..."
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
        padding: '14px 16px',
        borderRadius: 12,
        background: C.amberDim,
        border: `1px solid ${C.amber3}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text2 }}>Total</span>
        <span style={{
          fontSize: 26, fontWeight: 900, fontFamily: 'monospace',
          color: C.amber2, letterSpacing: '-0.03em',
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
      <span style={{ fontSize: 11, color: muted ? C.text3 : C.text2, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: color || (muted ? C.text3 : C.text2), fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default TotalsPanel;
