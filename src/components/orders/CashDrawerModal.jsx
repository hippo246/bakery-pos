// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Cash Drawer Modal
 * Modal for cash drawer operations (open, close, count)
 */

import { btn, input, label } from "../../styles/theme";

function CashDrawerModal({ 
  isOpen, 
  onClose, 
  onApply, 
  type, 
  amount, 
  setAmount, 
  expectedCash 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: "1px solid var(--cafe-accent-border)", borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 420, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 28 }}>💵</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-accent)" }}>
              {type === "open" ? "Open Cash Drawer" : type === "close" ? "Close Cash Drawer" : "Count Cash"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              {type === "count" ? "Enter the current cash amount in the drawer" : "Enter the starting/ending cash amount"}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
          <label style={label}>Cash Amount (₹)</label>
          <input
            style={{ ...input, fontSize: "var(--cafe-font-lg)", fontWeight: 700 }}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            autoFocus
          />
        </div>
        
        {type === "count" && expectedCash !== undefined && (
          <div style={{ padding: "var(--cafe-space-md)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", marginBottom: "var(--cafe-space-lg)" }}>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-xs)" }}>
              Expected cash from today's orders:
            </div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-accent)" }}>
              ₹{expectedCash.toFixed(2)}
            </div>
          </div>
        )}
        
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          {type === "count" 
            ? "This will calculate the discrepancy between counted and expected cash." 
            : "This will log the cash drawer operation for audit purposes."}
        </div>
        
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn("ghost") }}>Cancel</button>
          <button
            onClick={onApply}
            disabled={!amount}
            style={{ 
              ...btn("primary"), 
              opacity: !amount ? 0.6 : 1,
              cursor: !amount ? "not-allowed" : "pointer"
            }}
          >
            {type === "open" ? "Open Drawer" : type === "close" ? "Close Drawer" : "Count Cash"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashDrawerModal;
