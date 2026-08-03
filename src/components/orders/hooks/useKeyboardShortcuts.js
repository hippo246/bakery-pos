/**
 * useKeyboardShortcuts Hook
 * Manages keyboard shortcuts for POS operations
 */

import { useEffect, useCallback } from "react";

// Default keyboard shortcuts configuration
const DEFAULT_SHORTCUTS = {
  searchMenu: { key: "F1", label: "Search Menu", action: "searchMenu" },
  customerSearch: { key: "F2", label: "Customer Search", action: "customerSearch" },
  holdBill: { key: "F3", label: "Hold Bill", action: "holdBill" },
  resumeBill: { key: "F4", label: "Resume Bill", action: "resumeBill" },
  discount: { key: "F5", label: "Discount", action: "discount" },
  payment: { key: "F6", label: "Payment", action: "payment" },
  kitchen: { key: "F7", label: "Kitchen Status", action: "kitchen" },
  closeDialog: { key: "Escape", label: "Close Dialog", action: "closeDialog" },
  completeOrder: { key: "ctrl+Enter", label: "Complete Order", action: "completeOrder" },
  duplicateItem: { key: "ctrl+d", label: "Duplicate Item", action: "duplicateItem" },
  clearCart: { key: "ctrl+Backspace", label: "Clear Cart", action: "clearCart" },
  newOrder: { key: "ctrl+n", label: "New Order", action: "newOrder" },
  focusSearch: { key: "ctrl+f", label: "Focus Search", action: "focusSearch" },
};

export function useKeyboardShortcuts({ 
  shortcuts = DEFAULT_SHORTCUTS, 
  onAction, 
  enabled = true 
}) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = e.target;
    const isInput = target.tagName === "INPUT" || 
                   target.tagName === "TEXTAREA" || 
                   target.isContentEditable;
    
    // Allow some shortcuts in inputs, block others
    const allowedInInput = ["Escape", "ctrl+Enter", "ctrl+f"];
    if (isInput && !allowedInInput.includes(getKeyCombo(e))) {
      return;
    }

    const combo = getKeyCombo(e);
    const shortcut = Object.values(shortcuts).find(s => s.key.toLowerCase() === combo);
    
    if (shortcut) {
      e.preventDefault();
      onAction?.(shortcut.action, e);
    }
  }, [enabled, shortcuts, onAction]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Helper to get key combination string
function getKeyCombo(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  
  const key = e.key;
  if (key && !["Control", "Alt", "Shift", "Meta"].includes(key)) {
    parts.push(key.toLowerCase());
  }
  
  return parts.join("+");
}

// Export default shortcuts for use in components
export { DEFAULT_SHORTCUTS };
