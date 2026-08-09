// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Allergen Warning Modal
 * Modal for warning about allergens in menu items
 */

import { btn } from "../../styles/theme";

function AllergenWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conflict 
}) {
  if (!isOpen || !conflict) return null;

  const isHighSeverity = conflict.severity === "high";

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)", animation: "allergenFadeIn 0.15s ease" }} onClick={onClose}>
      <style>{`
        @keyframes allergenFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes allergenScaleIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: `1px solid ${isHighSeverity ? "var(--cafe-danger-border)" : "var(--cafe-warning-border)"}`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 420, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)", animation: "allergenScaleIn 0.18s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 28 }}>{isHighSeverity ? "⚠️" : "⚡"}</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: isHighSeverity ? "var(--cafe-danger)" : "var(--cafe-warning)" }}>
              {isHighSeverity ? "Allergen Alert" : "Allergen Warning"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              {conflict.menuItem} contains allergens
            </div>
          </div>
        </div>
        
        <div style={{ padding: "var(--cafe-space-md)", background: isHighSeverity ? "rgba(220, 38, 38, 0.1)" : "rgba(234, 179, 8, 0.1)", borderRadius: "var(--cafe-radius-sm)", marginBottom: "var(--cafe-space-lg)" }}>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-xs)" }}>
            Detected allergens:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--cafe-space-xs)" }}>
            {conflict.allergens.map((allergen, idx) => (
              <span key={idx} style={{ 
                padding: "4px 8px", 
                background: isHighSeverity ? "var(--cafe-danger-dim)" : "var(--cafe-warning-dim)", 
                color: isHighSeverity ? "var(--cafe-danger)" : "var(--cafe-warning)",
                borderRadius: "var(--cafe-radius-sm)", 
                fontSize: "var(--cafe-font-xs)",
                fontWeight: 600 
              }}>
                {allergen}
              </span>
            ))}
          </div>
        </div>
        
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          {isHighSeverity 
            ? "This item may cause severe allergic reactions. Proceed with caution." 
            : "This item may cause mild allergic reactions."}
        </div>
        
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ ...btn("ghost"), transition: "background .15s, border-color .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ ...btn("primary"), background: isHighSeverity ? "var(--cafe-danger)" : "var(--cafe-warning)", border: isHighSeverity ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-warning-border)", transition: "filter .15s, transform .1s" }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; }}
          >
            Add Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default AllergenWarningModal;
