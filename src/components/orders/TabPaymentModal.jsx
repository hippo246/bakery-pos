// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Tab/Delayed Payment Modal
 * Modal for opening, adding to, or closing customer tabs
 */

import { btn, input, label } from "../../styles/theme";

function TabPaymentModal({ 
  isOpen, 
  onClose, 
  onProcess, 
  state, 
  setState, 
  customerPhone, 
  cartTotal 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: "1px solid var(--cafe-accent-border)", borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 420, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-accent)" }}>
              {state.type === "open" ? "Open Tab" : state.type === "add" ? "Add to Tab" : "Close Tab"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              {state.type === "open" 
                ? "Open a delayed payment tab for the current customer" 
                : state.type === "add" 
                ? `Add current order to tab ${state.tabId}` 
                : `Close tab ${state.tabId} and process payment`}
            </div>
          </div>
        </div>
        
        {state.type === "open" && (
          <div style={{ padding: "var(--cafe-space-md)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", marginBottom: "var(--cafe-space-lg)" }}>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-xs)" }}>
              Customer:
            </div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-accent)" }}>
              {customerPhone ? customerPhone : "Walk-in"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-xs)", marginTop: "var(--cafe-space-sm)" }}>
              Initial Tab Amount:
            </div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-accent)" }}>
              ₹{cartTotal.toFixed(2)}
            </div>
          </div>
        )}
        
        {(state.type === "add" || state.type === "close") && (
          <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
            <label style={label}>{state.type === "add" ? "Amount to Add (₹)" : "Amount to Pay (₹)"}</label>
            <input
              style={{ ...input, fontSize: "var(--cafe-font-lg)", fontWeight: 700 }}
              type="number"
              value={state.amount}
              onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
              placeholder={state.type === "add" ? "0.00" : cartTotal.toFixed(2)}
              step="0.01"
              autoFocus
            />
          </div>
        )}
        
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          {state.type === "open" 
            ? "The tab will remain open until the customer is ready to pay. You can add more items to it later." 
            : state.type === "add" 
            ? "This amount will be added to the existing tab balance." 
            : "This will close the tab and process the final payment."}
        </div>
        
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn("ghost") }}>Cancel</button>
          <button
            onClick={onProcess}
            disabled={state.type !== "open" && !state.amount}
            style={{ 
              ...btn("primary"), 
              opacity: state.type !== "open" && !state.amount ? 0.6 : 1,
              cursor: state.type !== "open" && !state.amount ? "not-allowed" : "pointer"
            }}
          >
            {state.type === "open" ? "Open Tab" : state.type === "add" ? "Add to Tab" : "Close Tab & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TabPaymentModal;
