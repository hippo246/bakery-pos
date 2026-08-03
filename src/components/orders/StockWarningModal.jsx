// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Stock Warning Modal
 * Modal for warning about insufficient inventory stock
 */

import { btn } from "../../styles/theme";

function StockWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  missingItems, 
  managerOverride, 
  setManagerOverride, 
  isPlacingOrder 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-warning-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 480, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-warning)" }}>Not Enough Stock</div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>Inventory check failed for this order</div>
          </div>
        </div>
        <div style={{ marginBottom: "var(--cafe-space-lg)", padding: "var(--cafe-space-md)", background: "var(--cafe-warning-bg)", borderRadius: "var(--cafe-radius-md)", border: `1px solid var(--cafe-warning-border)` }}>
          {missingItems.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)", padding: "6px 0", borderBottom: i < missingItems.length - 1 ? `1px solid var(--cafe-warning-border)` : "none" }}>
              <span style={{ fontWeight: 600 }}>{item.name}</span>
              <span style={{ color: "var(--cafe-text-tertiary)" }}>need {item.required}, have {item.available} {item.unit}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: "var(--cafe-space-xl)", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", lineHeight: 1.6 }}>
          Restock first to fulfil accurately, or use manager override to place anyway and reconcile later.
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: "var(--cafe-space-lg)", padding: "var(--cafe-space-md)", background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-md)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={managerOverride}
            onChange={(e) => setManagerOverride(e.target.checked)}
            style={{ accentColor: "var(--cafe-accent)", marginTop: 2, cursor: "pointer", flexShrink: 0 }}
          />
          <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>
            A manager authorizes placing this order despite insufficient stock.
          </span>
        </label>
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={() => { onClose(); setManagerOverride(false); }} style={{ ...btn("ghost") }}>Go Back</button>
          <button
            onClick={onConfirm}
            disabled={isPlacingOrder || !managerOverride}
            style={{ ...btn("primary"), background: "var(--cafe-warning-bg)", borderColor: "var(--cafe-warning-border)", color: "var(--cafe-warning)", opacity: (isPlacingOrder || !managerOverride) ? 0.6 : 1, cursor: (isPlacingOrder || !managerOverride) ? "not-allowed" : "pointer" }}
          >
            {isPlacingOrder ? "Placing…" : "Override & Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockWarningModal;
