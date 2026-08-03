// eslint-disable-next-line no-unused-vars
import React from 'react';
import { card, btn, emptyState } from "../../styles/theme";
import { formatCurrency } from "../../domain/money.js";

const MenuGrid = ({ 
  menuItems, 
  categoryFilter, 
  menuQuery, 
  showAvailableOnly, 
  cart, 
  onAddItem, 
  onUpdateQuantity, 
  kioskMode, 
  onClearSearch 
}) => {
  const visibleItems = menuItems.filter(item => {
    if (showAvailableOnly && (!item.active || item.eightySixed)) return false;
    if (categoryFilter !== "All") {
      if (categoryFilter === "Available only") { if (!(item.active && !item.eightySixed)) return false; }
      else if (categoryFilter === "Popular") { if (!item.popular) return false; }
      else if (item.cat !== categoryFilter) return false;
    }
    if (menuQuery.trim() && !item.name.toLowerCase().includes(menuQuery.trim().toLowerCase())) return false;
    return true;
  });

  if (visibleItems.length === 0) {
    return (
      <div style={{ ...emptyState, padding: "var(--cafe-space-xl) 0" }}>
        <div style={{ fontSize: 32, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>🔍</div>
        <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>No items match</div>
        {menuQuery && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 4, marginBottom: "var(--cafe-space-md)" }}>Try a different search term</div>}
        <button 
          onClick={onClearSearch}
          style={{ ...btn("ghost"), padding: "8px 16px", fontSize: "var(--cafe-font-sm)" }}
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: kioskMode ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(145px, 1fr))", gap: kioskMode ? "var(--cafe-space-lg)" : "var(--cafe-space-md)" }}>
      {visibleItems.map(item => {
        const cartItem = cart.items.find(c => c.id === item.id);
        const qty = cartItem ? cartItem.qty : 0;
        const unavailable = !item.active || item.eightySixed;
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={unavailable ? -1 : 0}
            aria-disabled={unavailable}
            aria-label={`${item.name}, ${formatCurrency(item.price)}${qty > 0 ? `, ${qty} in cart` : ""}`}
            onClick={() => onAddItem(item)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !unavailable) { e.preventDefault(); onAddItem(item); } }}
            style={{
              ...card(),
              padding: kioskMode ? "var(--cafe-space-lg)" : "12px",
              cursor: unavailable ? "not-allowed" : "pointer",
              opacity: unavailable ? 0.42 : 1,
              transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease",
              background: qty > 0 ? "var(--cafe-accent-dim)" : "var(--cafe-bg-card)",
              border: qty > 0 ? `2px solid var(--cafe-accent)` : `1px solid var(--cafe-border-light)`,
              position: "relative",
              minHeight: kioskMode ? 180 : 130,
              display: "flex",
              flexDirection: "column",
            }}
            onMouseEnter={(e) => {
              if (!unavailable) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                if (qty === 0) e.currentTarget.style.borderColor = "var(--cafe-accent)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "var(--cafe-shadow-sm)";
              if (qty === 0) e.currentTarget.style.borderColor = "var(--cafe-border-light)";
            }}
          >
            {/* In-cart qty badge */}
            {qty > 0 && (
              <div style={{ position: "absolute", top: 7, right: 7, background: "var(--cafe-accent)", color: "#1A1208", fontSize: 11, fontFamily: "monospace", fontWeight: 800, minWidth: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{qty}</div>
            )}

            {/* Emoji + name */}
            <div style={{ fontSize: 26, marginBottom: 6, lineHeight: 1 }}>{item.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: "var(--cafe-text-primary)", lineHeight: 1.25, flex: 1 }}>{item.name}</div>
            <div style={{ fontSize: 9, color: "var(--cafe-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{item.cat}</div>

            {/* Tags row */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6, minHeight: 18 }}>
              {item.popular && (
                <span style={{ fontSize: 9, background: "var(--cafe-accent-dim)", color: "var(--cafe-accent)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>⭐ Hot</span>
              )}
              {unavailable && (
                <span style={{ fontSize: 9, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{item.eightySixed ? "86'd" : "Off"}</span>
              )}
            </div>

            {/* Price + controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--cafe-accent)", fontFamily: "monospace" }}>{formatCurrency(item.price)}</div>
              {qty > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 3 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 700 }}
                  >−</button>
                  <button
                    onClick={() => onAddItem(item)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid var(--cafe-accent)`, background: "var(--cafe-accent)", color: "#1A1208", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 800 }}
                  >+</button>
                </div>
              ) : (
                // Subtle "tap to add" affordance
                !unavailable && (
                  <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", opacity: 0.6 }}>tap +</div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuGrid;
