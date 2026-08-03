// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Order Notes Modal
 * Modal for adding special instructions to cart items
 */

import { btn, input } from "../../styles/theme";
import { ORDER_NOTES_TEMPLATES } from "../../data/constants.js";

const ITEM_NOTES_MAX = 200;

function OrderNotesModal({ 
  isOpen, 
  onClose, 
  onApply, 
  notes, 
  setNotes, 
  onInsertTemplate,
  maxLength = ITEM_NOTES_MAX
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 450, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 4, color: "var(--cafe-text-primary)" }}>Special Instructions</div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>e.g. no onions, extra spicy, allergy info</div>
        
        {/* Quick Insert Templates */}
        <div style={{ marginBottom: "var(--cafe-space-md)" }}>
          <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-xs)" }}>
            Quick Insert
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--cafe-space-xs)" }}>
            {ORDER_NOTES_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => onInsertTemplate(template.text)}
                style={{
                  ...btn("ghost"),
                  padding: "4px 8px",
                  fontSize: "var(--cafe-font-xs)",
                  border: `1px solid var(--cafe-border-light)`,
                }}
                title={template.shortcut}
              >
                {template.text}
              </button>
            ))}
          </div>
        </div>
        
        <textarea
          style={{ ...input, resize: "none", marginBottom: "var(--cafe-space-md)", width: "100%", boxSizing: "border-box" }}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, maxLength))}
          placeholder="Add instructions…"
          maxLength={maxLength}
          autoFocus
        />
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textAlign: "right", marginBottom: "var(--cafe-space-lg)" }}>{notes.length}/{maxLength}</div>
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn("ghost") }}>Discard</button>
          <button
            onClick={onApply}
            style={{ ...btn("primary") }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderNotesModal;
