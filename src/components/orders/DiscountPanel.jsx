// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C, input } from '../../styles/theme';

// Quick-preset buttons — flat-amount and percent presets staff use most often
const PRESETS_PERCENT = [5, 10, 15, 20];
const PRESETS_AMOUNT  = [10, 20, 50, 100];

const DiscountPanel = ({
  discountInput,
  discountMode,
  cartSubtotal,
  onDiscountModeChange,
  onDiscountInputChange,
}) => {
  const presets = discountMode === 'percent' ? PRESETS_PERCENT : PRESETS_AMOUNT;
  const numericVal = Number(discountInput) || 0;

  const handlePreset = (val) => {
    // Clicking the same preset again clears it
    if (numericVal === val) { onDiscountInputChange(''); return; }
    onDiscountInputChange(String(val));
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header row: label + ₹ / % toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3 }}>
          Discount
        </span>
        <div style={{ display: 'flex', gap: 4, background: C.bg3, borderRadius: 8, padding: 3 }}>
          {[['amount', '₹'], ['percent', '%']].map(([mode, sym]) => (
            <button
              key={mode}
              onClick={() => { onDiscountModeChange(mode); onDiscountInputChange(''); }}
              style={{
                width: 30, height: 26, borderRadius: 6,
                border: discountMode === mode ? `1px solid ${C.amber3}` : 'none',
                background: discountMode === mode ? C.amberDim : 'transparent',
                color: discountMode === mode ? C.amber2 : C.text3,
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .12s',
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Quick preset chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {presets.map(val => {
          const active = numericVal === val;
          return (
            <button
              key={val}
              onClick={() => handlePreset(val)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8,
                border: `1px solid ${active ? C.amber : C.border}`,
                background: active ? C.amberDim : C.bg3,
                color: active ? C.amber2 : C.text2,
                fontSize: 11, fontWeight: active ? 800 : 500,
                cursor: 'pointer', transition: 'all .12s',
              }}
            >
              {discountMode === 'percent' ? `${val}%` : `₹${val}`}
            </button>
          );
        })}
        {/* Clear button — only show when a value is set */}
        {numericVal > 0 && (
          <button
            onClick={() => onDiscountInputChange('')}
            style={{
              padding: '7px 10px', borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg3, color: C.text3,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Manual input */}
      <input
        style={{ ...input, width: '100%' }}
        type="number"
        min="0"
        step="1"
        inputMode="decimal"
        value={discountInput}
        onChange={e => onDiscountInputChange(e.target.value)}
        onBlur={() => {
          if (discountInput === '') return;
          const n = Number(discountInput);
          if (!Number.isFinite(n) || n <= 0) { onDiscountInputChange(''); return; }
          const clamped = discountMode === 'percent'
            ? Math.min(n, 100)
            : Math.min(n, cartSubtotal);
          onDiscountInputChange(String(clamped));
        }}
        placeholder={discountMode === 'percent' ? 'Custom %' : 'Custom ₹'}
      />
    </div>
  );
};

export default DiscountPanel;
