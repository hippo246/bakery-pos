// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Upsell Suggestions Modal (Kiosk Mode)
 * Modal for suggesting additional items to customers
 */

import { btn, card } from "../../styles/theme";
import { formatCurrency } from "../../domain/money.js";

function UpsellSuggestionsModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  suggestedItems, 
  cart, 
  onAddToCart, 
  onShowToast 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-panel" style={{ background: "var(--cafe-bg-elevated)", border: "1px solid var(--cafe-success-border)", borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 480, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-lg)" }}>
          <span style={{ fontSize: 28 }}>✨</span>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-success)" }}>
              You might also like
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              Popular items that go well with your selection
            </div>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--cafe-space-md)", marginBottom: "var(--cafe-space-lg)" }}>
          {suggestedItems.map(item => {
            const cartItem = cart.find(c => c.id === item.id);
            const qty = cartItem ? cartItem.qty : 0;
            return (
              <div
                key={item.id}
                role="button"
                onClick={() => {
                  onAddToCart(item);
                  onShowToast(`Added ${item.name} to cart`);
                }}
                style={{
                  ...card(),
                  padding: "var(--cafe-space-md)",
                  cursor: "pointer",
                  background: qty > 0 ? "var(--cafe-success-dim)" : "var(--cafe-bg-card)",
                  border: qty > 0 ? `1px solid var(--cafe-success)` : undefined,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: "var(--cafe-space-sm)" }}>
                  {item.emoji || "🍽️"}
                </div>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: "var(--cafe-space-xs)" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-success)" }}>
                  {formatCurrency(item.price)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
          Tap an item to add it to your order, or close to continue.
        </div>
        
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn("ghost") }}>No thanks</button>
          <button
            onClick={onContinue}
            style={{ ...btn("primary") }}
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpsellSuggestionsModal;
