// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Weight-Based Item Modal
 * Modal for entering weight for items sold by weight (e.g., by kg)
 */

import { btn, input, label } from "../../styles/theme";

function WeightBasedItemModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  menuItem, 
  basePrice, 
  itemWeight, 
  setItemWeight 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 400, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 4, color: "var(--cafe-text-primary)" }}>
          ⚖️ Weight-Based Item
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          {menuItem.name} (₹{basePrice}/kg)
        </div>
        <div style={{ marginBottom: "var(--cafe-space-md)" }}>
          <label style={label}>Weight (kg)</label>
          <input
            style={input}
            type="number"
            step="0.01"
            min="0.01"
            value={itemWeight}
            onChange={(e) => setItemWeight(e.target.value)}
            placeholder="Enter weight..."
            autoFocus
          />
        </div>
        {itemWeight && Number(itemWeight) > 0 && (
          <div style={{ padding: "var(--cafe-space-sm)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", marginBottom: "var(--cafe-space-lg)", fontSize: "var(--cafe-font-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--cafe-text-secondary)" }}>
              <span>Calculated Price:</span>
              <span style={{ fontWeight: 700, color: "var(--cafe-accent)" }}>
                ₹{(Number(itemWeight) * basePrice).toFixed(2)}
              </span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn("ghost") }}>Cancel</button>
          <button
            onClick={onAdd}
            disabled={!itemWeight || Number(itemWeight) <= 0}
            style={{ ...btn("primary"), opacity: (!itemWeight || Number(itemWeight) <= 0) ? 0.6 : 1, cursor: (!itemWeight || Number(itemWeight) <= 0) ? "not-allowed" : "pointer" }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeightBasedItemModal;
