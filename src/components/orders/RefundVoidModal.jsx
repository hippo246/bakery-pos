// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Refund/Void Modal
 * Modal for processing refunds or voiding orders
 */

import { btn, input, label } from "../../styles/theme";
import { REFUND_VOID_REASONS } from "../../data/constants.js";

function RefundVoidModal({ 
  isOpen, 
  onClose, 
  onProcess, 
  state, 
  setState 
}) {
  if (!isOpen) return null;

  const isRefund = state.type === "refund";

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <style>{`
        @keyframes refundVoidScaleIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: `1px solid ${isRefund ? "var(--cafe-warning-border)" : "var(--cafe-danger-border)"}`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 480, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)", animation: "refundVoidScaleIn 0.18s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 28 }}>{isRefund ? "💰" : "🚫"}</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: isRefund ? "var(--cafe-warning)" : "var(--cafe-danger)" }}>
              {isRefund ? "Process Refund" : "Void Order"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              Order #{state.orderId}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
          <label style={label}>Reason</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--cafe-space-xs)" }}>
            {REFUND_VOID_REASONS.filter(r => r.type === state.type || r.type === "both").map(reason => (
              <button
                key={reason.id}
                onClick={() => setState(prev => ({ ...prev, reason: reason.id }))}
                style={{
                  ...btn("ghost"),
                  padding: "8px 12px",
                  textAlign: "left",
                  background: state.reason === reason.id ? (isRefund ? "var(--cafe-warning-dim)" : "var(--cafe-danger-dim)") : undefined,
                  border: state.reason === reason.id ? `1px solid ${isRefund ? "var(--cafe-warning)" : "var(--cafe-danger)"}` : "1px solid var(--cafe-border-light)",
                  transition: "background .15s, border-color .15s",
                }}
                onMouseEnter={e => { if (state.reason !== reason.id) e.currentTarget.style.borderColor = isRefund ? "var(--cafe-warning)" : "var(--cafe-danger)"; }}
                onMouseLeave={e => { if (state.reason !== reason.id) e.currentTarget.style.borderColor = "var(--cafe-border-light)"; }}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
          <label style={label}>Additional Notes (optional)</label>
          <textarea
            style={{ ...input, resize: "none", transition: "border-color .15s, box-shadow .15s" }}
            rows={3}
            value={state.notes}
            onChange={(e) => setState(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional details..."
            maxLength={200}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--cafe-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--cafe-accent-dim)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          {isRefund 
            ? "This will mark the order as refunded and generate a refund receipt." 
            : "This will void the order and restore inventory. Cannot be undone."}
        </div>
        
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ ...btn("ghost"), transition: "background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; }}
          >
            Cancel
          </button>
          <button
            onClick={onProcess}
            disabled={!state.reason}
            style={{ 
              ...btn("primary"), 
              background: isRefund ? "var(--cafe-warning)" : "var(--cafe-danger)", 
              border: isRefund ? "1px solid var(--cafe-warning-border)" : "1px solid var(--cafe-danger-border)",
              opacity: !state.reason ? 0.6 : 1,
              cursor: !state.reason ? "not-allowed" : "pointer",
              transition: "filter .15s"
            }}
            onMouseEnter={e => { if (state.reason) e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
          >
            {isRefund ? "Process Refund" : "Void Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RefundVoidModal;
