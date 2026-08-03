// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Quick Actions Panel
 * Provides quick access to common POS operations
 */

import { useState } from "react";
import { btn, card } from "../../styles/theme";

const QUICK_ACTIONS = [
  { id: "holdBill", label: "Hold Bill", icon: "📋", shortcut: "F3" },
  { id: "resumeBill", label: "Resume Bill", icon: "📂", shortcut: "F4" },
  { id: "openCashDrawer", label: "Open Cash Drawer", icon: "💰", shortcut: null },
  { id: "priceOverride", label: "Price Override", icon: "✏️", shortcut: null },
  { id: "discount", label: "Discount", icon: "🏷️", shortcut: "F5" },
  { id: "refund", label: "Refund", icon: "↩️", shortcut: null },
  { id: "void", label: "Void Order", icon: "🚫", shortcut: null },
  { id: "reprintReceipt", label: "Reprint Receipt", icon: "🧾", shortcut: null },
  { id: "duplicateOrder", label: "Duplicate Order", icon: "📋", shortcut: null },
  { id: "newCustomer", label: "New Customer", icon: "👤", shortcut: "F2" },
];

function QuickActions({ 
  onAction, 
  disabledActions = [],
  isExpanded: _isExpanded = false,
  onToggleExpand 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionId) => {
    onAction?.(actionId);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    onToggleExpand?.(!isOpen);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Quick Actions Toggle Button */}
      <button
        onClick={toggleOpen}
        style={{
          ...btn("ghost"),
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          minWidth: 140,
          justifyContent: "space-between",
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚡</span>
          <span>Quick Actions</span>
        </span>
        <span style={{ fontSize: 12, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {/* Quick Actions Dropdown */}
      {isOpen && (
        <div
          style={{
            ...card(),
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 8,
            minWidth: 240,
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 100,
            padding: "var(--cafe-space-sm)",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "var(--cafe-space-xs)",
          }}
          role="menu"
          aria-label="Quick actions menu"
        >
          {QUICK_ACTIONS.map((action) => {
            const isDisabled = disabledActions.includes(action.id);
            return (
              <button
                key={action.id}
                onClick={() => !isDisabled && handleAction(action.id)}
                disabled={isDisabled}
                style={{
                  ...btn("ghost"),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "var(--cafe-font-xs)",
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  minHeight: 72,
                }}
                role="menuitem"
                aria-disabled={isDisabled}
              >
                <span style={{ fontSize: 24 }}>{action.icon}</span>
                <span style={{ fontWeight: 600, lineHeight: 1.2 }}>{action.label}</span>
                {action.shortcut && (
                  <span style={{ 
                    fontSize: 10, 
                    color: "var(--cafe-text-tertiary)",
                    fontFamily: "monospace",
                    marginTop: 2
                  }}>
                    {action.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuickActions;
export { QUICK_ACTIONS };
