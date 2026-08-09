// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C, input } from '../../styles/theme';
import { PRICE_OVERRIDE_REASONS } from '../../data/constants.js';

function PriceOverrideModal({
  isOpen, onClose, onApply,
  originalPrice, newPrice, setNewPrice,
  reason, setReason,
  notes, setNotes,
}) {
  if (!isOpen) return null;

  const parsed   = parseFloat(newPrice) || 0;
  const diff     = parsed - originalPrice;
  const hasChange = newPrice !== '' && parsed !== originalPrice;
  const canApply  = reason && newPrice !== '' && parsed >= 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes priceOverrideScaleIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div
        style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, width: 400, maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.3)', animation: 'priceOverrideScaleIn 0.18s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💰</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Override Price</div>
              <div style={{ fontSize: 11, color: C.text3 }}>Logged for audit · needs manager approval</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', borderRadius: 8, fontSize: 20, cursor: 'pointer', color: C.text3, lineHeight: 1, padding: '2px 6px', transition: 'background .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text3; }}
          >×</button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {/* Price row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Original</div>
              <div style={{ padding: '9px 12px', background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontWeight: 700, color: C.text3, fontFamily: 'monospace' }}>₹{originalPrice.toFixed(0)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>New Price</div>
              <input
                style={{ ...input, fontSize: 15, fontWeight: 700, fontFamily: 'monospace', width: '100%' }}
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                inputMode="decimal"
                autoFocus
              />
            </div>
          </div>

          {/* Diff badge */}
          {hasChange && (
            <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: diff < 0 ? '#052e16' : '#1c0a00', border: `1px solid ${diff < 0 ? '#16a34a' : '#92400e'}` }}>
              <span style={{ fontSize: 12, color: diff < 0 ? '#4ade80' : C.amber2, fontWeight: 600 }}>{diff < 0 ? '▼ Discount' : '▲ Markup'}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: diff < 0 ? '#4ade80' : C.amber2 }}>{diff < 0 ? '-' : '+'}₹{Math.abs(diff).toFixed(0)}</span>
            </div>
          )}

          {/* Reason chips — 2 column grid */}
          <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Reason <span style={{ color: C.red }}>*</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {PRICE_OVERRIDE_REASONS.map(r => {
              const active = reason === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 9,
                    border: `1.5px solid ${active ? C.amber : C.border}`,
                    background: active ? C.amberDim : C.bg3,
                    color: active ? C.amber2 : C.text2,
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .1s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = C.amber3; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = C.border; }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Notes <span style={{ color: C.text3, fontWeight: 400 }}>(optional)</span></div>
          <textarea
            style={{ ...input, width: '100%', resize: 'none', fontSize: 12 }}
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context if needed…"
            maxLength={200}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg4 || C.border; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bg3; }}
            >Cancel</button>
            <button
              onClick={onApply}
              disabled={!canApply}
              style={{
                flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                background: canApply ? `linear-gradient(135deg, ${C.amber}, ${C.amber2})` : C.bg4,
                color: canApply ? '#1a0e00' : C.text3,
                fontSize: 13, fontWeight: 800, cursor: canApply ? 'pointer' : 'not-allowed',
                transition: 'filter .15s, transform .1s',
              }}
              onMouseEnter={e => { if (canApply) e.currentTarget.style.filter = 'brightness(1.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
              onMouseDown={e => { if (canApply) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; }}
            >
              ✓ Apply Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceOverrideModal;
