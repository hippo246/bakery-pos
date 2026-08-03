/**
 * PaymentPanel.jsx
 * Multi-method split payment panel for the POS.
 * Supports CASH / UPI / CARD in any combination.
 *
 * FIX: In single-payment mode the panel previously never reported isComplete=true
 * because the amount field was hidden and allocatedTotal stayed 0. Now in non-split
 * mode we treat the selection of any payment method as "complete" (the full
 * cartTotal is implicitly allocated), so the "Send to Kitchen" button unlocks
 * as soon as the user picks Cash / UPI / Card.
 */
import { useState, useEffect, useCallback, startTransition } from 'react';
import { C, btn, input } from '../../styles/theme';
import { formatCurrency } from '../../domain/money.js';

const METHOD_META = {
  CASH: { icon: '💵', label: 'Cash',  color: '#22c55e' },
  UPI:  { icon: '📱', label: 'UPI',   color: '#6366f1' },
  CARD: { icon: '💳', label: 'Card',  color: '#3b82f6' },
};
const METHODS = ['CASH', 'UPI', 'CARD'];

// Smart quick-cash denominations: show notes that bracket the cart total
const smartQuickCash = (total) => {
  const all = [10, 20, 50, 100, 200, 500, 1000, 2000];
  const results = [];
  // exact
  results.push(total);
  // nearest note above
  for (const v of all) { if (v > total) { results.push(v); break; } }
  // round-ups
  const roundUps = [
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
  ];
  for (const v of roundUps) { if (v > total && !results.includes(v)) results.push(v); }
  return [...new Set(results)].sort((a, b) => a - b).slice(0, 5);
};

function newRow(method = 'CASH', amount = '') {
  return { id: Date.now() + Math.random(), method, amount, cashTendered: '' };
}

/**
 * PaymentPanel
 * Props:
 *   cartTotal           — number, total amount to collect
 *   onBreakdownChange   — fn(breakdown, isComplete)
 *   isPlacingOrder      — bool
 *   cartLength          — number
 *   resetKey            — any; changing this value resets internal state (used
 *                         by Orders.jsx after a successful order to clear payment)
 */
export default function PaymentPanel({
  cartTotal,
  onBreakdownChange,
  isPlacingOrder: _isPlacingOrder,
  cartLength,
  resetKey,
}) {
  const [rows, setRows] = useState([newRow('CASH', '')]);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isLocallyPlacing, setIsLocallyPlacing] = useState(false);  // FIX: Track loading state
  const isPlacing = _isPlacingOrder || isLocallyPlacing;  // FIX: Combine with local state

  // Reset when parent signals a new order (clearCart increments resetKey)
  useEffect(() => {
    startTransition(() => {
      setRows([newRow('CASH', '')]);
      setIsSplitMode(false);
      setIsLocallyPlacing(false);  // FIX: Reset loading state
    });
  }, [resetKey]);

  // ── Derived values ────────────────────────────────────────────────────────
  const allocatedTotal = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const remaining = Math.max(0, cartTotal - allocatedTotal);

  // KEY FIX: in single mode, any selected method = complete (full total is
  // implicitly allocated). In split mode, amounts must add up to cartTotal.
  const isComplete = cartTotal > 0 && (
    !isSplitMode
      ? rows[0]?.method != null        // always true — method is always set
      : Math.abs(allocatedTotal - cartTotal) < 0.5
  );

  // Notify parent
  useEffect(() => {
    if (cartLength === 0) { onBreakdownChange?.([], false); return; }
    const breakdown = isSplitMode
      ? rows.map(r => {
          const amount = parseFloat(r.amount) || 0;
          const cashTendered = r.method === 'CASH' ? (parseFloat(r.cashTendered) || 0) : 0;
          const changeDue = r.method === 'CASH' && cashTendered > 0 ? cashTendered - amount : 0;
          return { method: r.method, amount, cashTendered, changeDue: Math.max(0, changeDue) };
        }).filter(r => r.amount > 0)
      : [{
          method: rows[0]?.method || 'CASH',
          amount: cartTotal,
          cashTendered: parseFloat(rows[0]?.cashTendered) || 0,
          changeDue: rows[0]?.method === 'CASH' && parseFloat(rows[0]?.cashTendered) > 0
            ? Math.max(0, parseFloat(rows[0].cashTendered) - cartTotal)
            : 0,
        }];
    // FIX: Check if there's an active order being placed
    const hasActiveOrder = cartLength > 0 && isPlacing;
    onBreakdownChange?.(breakdown, isComplete && !hasActiveOrder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, isSplitMode, isComplete, cartTotal, cartLength]);

  const updateRow = useCallback((id, patch) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => {
      const usedMethods = new Set(prev.map(r => r.method));
      const nextMethod = METHODS.find(m => !usedMethods.has(m)) || 'CASH';
      return [...prev, newRow(nextMethod, '')];
    });
  }, []);

  const removeRow = useCallback((id) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  }, []);

  const toggleSplitMode = useCallback((on) => {
    setIsSplitMode(on);
    if (!on) setRows(prev => [newRow(prev[0]?.method || 'CASH', '')]);
  }, []);

  const handleFillRemaining = useCallback((rowId) => {
    const others = rows.filter(r => r.id !== rowId).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const fill = Math.max(0, cartTotal - others);
    updateRow(rowId, { amount: String(fill) });
  }, [rows, cartTotal, updateRow]);

  const totalCashChange = rows.reduce((s, r) => {
    if (r.method !== 'CASH') return s;
    const amt = isSplitMode ? (parseFloat(r.amount) || 0) : cartTotal;
    const tendered = parseFloat(r.cashTendered) || 0;
    return s + Math.max(0, tendered - amt);
  }, 0);

  if (cartLength === 0) return null;

  return (
    <div style={{ marginBottom: 8, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3 }}>
          Payment Method
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: C.text3 }}>
          <input
            type="checkbox"
            checked={isSplitMode}
            onChange={e => toggleSplitMode(e.target.checked)}
            style={{ accentColor: C.amber, cursor: 'pointer' }}
          />
          Split
        </label>
      </div>

      {rows.map((row, idx) => (
        <PaymentRow
          key={row.id}
          row={row}
          idx={idx}
          cartTotal={cartTotal}
          isSplitMode={isSplitMode}
          showRemove={isSplitMode && rows.length > 1}
          onMethodChange={method => updateRow(row.id, { method, cashTendered: '' })}
          onAmountChange={amount => updateRow(row.id, { amount })}
          onCashTenderedChange={cashTendered => updateRow(row.id, { cashTendered })}
          onFillRemaining={() => handleFillRemaining(row.id)}
          onRemove={() => removeRow(row.id)}
          remaining={remaining}
          isPlacing={isPlacing}  // FIX: Pass loading state
        />
      ))}

      {/* Split: add row */}
      {isSplitMode && rows.length < 3 && (
        <button
          onClick={addRow}
          style={{ ...btn('ghost'), width: '100%', marginTop: 8, fontSize: 12, borderStyle: 'dashed' }}
        >
          + Add payment method
        </button>
      )}

      {/* Split running total */}
      {isSplitMode && (
        <div style={{
          marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: isComplete ? '#052e16' : '#1c0a00',
          border: `1px solid ${isComplete ? '#16a34a' : '#92400e'}`,
          color: isComplete ? '#4ade80' : '#fbbf24',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{isComplete ? '✓ Fully allocated' : `Remaining: ${formatCurrency(remaining)}`}</span>
          <span style={{ fontFamily: 'monospace' }}>{formatCurrency(allocatedTotal)} / {formatCurrency(cartTotal)}</span>
        </div>
      )}

      {/* Loading overlay for order placement */}
      {isPlacing && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, pointerEvents: 'none'
        }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Processing order...</span>
        </div>
      )}

      {/* Change due */}
      {totalCashChange > 0 && (
        <div style={{
          marginTop: 8, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: '#052e16', border: '1px solid #16a34a',
          color: '#4ade80', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>💰 Change Due</span>
          <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{formatCurrency(totalCashChange)}</span>
        </div>
      )}
    </div>
  );
}

function PaymentRow({
  row, idx, cartTotal, isSplitMode,
  showRemove, onMethodChange, onAmountChange, onCashTenderedChange,
  onFillRemaining, onRemove, remaining,
  isPlacing,  // FIX: Loading state prop
}) {
  const amount = isSplitMode ? (parseFloat(row.amount) || 0) : cartTotal;
  const cashTendered = parseFloat(row.cashTendered) || 0;
  const cashChange = row.method === 'CASH' && cashTendered > 0 ? cashTendered - amount : null;
  const isCashShort = cashChange !== null && cashChange < 0;
  const quickCash = smartQuickCash(amount);

  return (
    <div style={{
      marginBottom: isSplitMode ? 12 : 6,
      padding: isSplitMode ? '12px 14px' : '4px 0',
      background: isSplitMode ? C.bg3 : 'transparent',
      borderRadius: isSplitMode ? 10 : 0,
      border: isSplitMode ? `1px solid ${C.border}` : 'none',
    }}>
      {/* Method selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: row.method === 'CASH' ? 10 : 0, alignItems: 'center' }}>
        {isSplitMode && (
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, minWidth: 18 }}>{idx + 1}.</span>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, flex: 1 }}>
          {METHODS.map(m => {
            const active = row.method === m;
            const meta = METHOD_META[m];
            return (
              <button
                key={m}
                className="pos-payment-method-btn"
                onClick={() => !isPlacing && onMethodChange(m)}  // FIX: Disable during placement
                disabled={isPlacing}  // FIX: Disable button
                style={{
                  padding: '11px 0',
                  borderRadius: 10,
                  border: `2px solid ${active ? meta.color : C.border}`,
                  background: active ? meta.color + '22' : C.bg4,
                  color: isPlacing ? C.text3 : (active ? meta.color : C.text3),
                  fontSize: 12, fontWeight: active ? 800 : 500,
                  cursor: isPlacing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all .15s',
                  boxShadow: active ? `0 0 0 1px ${meta.color}44` : 'none',
                }}
              >
                <span className="pos-payment-icon" style={{ fontSize: 15 }}>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        {showRemove && (
          <button onClick={onRemove} style={{ padding: '8px 10px', background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* Amount input — split mode only */}
      {isSplitMode && (
        <div style={{ display: 'flex', gap: 6, marginBottom: row.method === 'CASH' ? 8 : 0 }}>
          <input
            style={{ ...input, flex: 1 }}
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={row.amount}
            onChange={e => !isPlacing && onAmountChange(e.target.value)}  // FIX: Disable during placement
            placeholder={`Amount (${METHOD_META[row.method].label})`}
            disabled={isPlacing}  // FIX: Disable input
          />
          {remaining > 0.5 && (
            <button
              onClick={() => !isPlacing && onFillRemaining()}  // FIX: Disable during placement
              disabled={isPlacing}  // FIX: Disable button
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.amber3}`, background: isPlacing ? C.bg4 : C.amberDim, color: isPlacing ? C.text3 : C.amber2, fontSize: 12, fontWeight: 700, cursor: isPlacing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              +₹{Math.round(remaining)}
            </button>
          )}
        </div>
      )}

      {/* Cash received section */}
      {row.method === 'CASH' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Cash Received
          </div>
          {/* Quick denomination buttons */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {quickCash.map(v => {
              const isExact = v === amount;
              const isSelected = row.cashTendered === String(v);
              return (
                <button
                  key={v}
                  onClick={() => onCashTenderedChange(String(v))}
                  style={{
                    flex: 1, minWidth: 44,
                    padding: '7px 4px',
                    borderRadius: 8,
                    border: `1px solid ${isSelected ? '#16a34a' : isExact ? C.amber3 : C.border}`,
                    background: isSelected ? '#052e16' : isExact ? C.amberDim : C.bg3,
                    color: isSelected ? '#4ade80' : isExact ? C.amber2 : C.text2,
                    fontSize: 11, fontWeight: isSelected || isExact ? 800 : 500,
                    cursor: 'pointer',
                    transition: 'all .12s',
                  }}
                >
                  {isExact ? 'Exact' : `₹${v}`}
                </button>
              );
            })}
          </div>
          <input
            style={{ ...input, width: '100%' }}
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={row.cashTendered}
            onChange={e => !isPlacing && onCashTenderedChange(e.target.value)}  // FIX: Disable during placement
            placeholder={`Cash received (need ₹${Math.round(amount)})`}
            disabled={isPlacing}  // FIX: Disable input
          />
          {cashChange !== null && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 8, padding: '9px 12px', borderRadius: 8,
              background: isCashShort ? '#1c0a0a' : '#052e16',
              border: `1px solid ${isCashShort ? '#ef4444' : '#16a34a'}`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isCashShort ? '#f87171' : '#4ade80' }}>
                {isCashShort ? '⚠ Short by' : '💰 Change Due'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: isCashShort ? '#f87171' : '#4ade80' }}>
                {formatCurrency(Math.abs(cashChange))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
