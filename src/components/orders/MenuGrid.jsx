// eslint-disable-next-line no-unused-vars
import React from 'react';
import { card, btn, emptyState } from "../../styles/theme";
import { useThemeColors, useThemeSpacing, useThemeTypography, useThemeBorderRadius } from "../../theme";
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
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const borderRadius = useThemeBorderRadius();

  const visibleItems = menuItems.filter(item => {
    if (showAvailableOnly && (!item.active || item.eightySixed)) return false;
    if (categoryFilter !== "ALL" && categoryFilter !== "All") {
      if (categoryFilter === "Available only") { if (!(item.active && !item.eightySixed)) return false; }
      else if (categoryFilter === "Popular") { if (!item.popular) return false; }
      else if (item.cat !== categoryFilter) return false;
    }
    if (menuQuery.trim() && !item.name.toLowerCase().includes(menuQuery.trim().toLowerCase())) return false;
    return true;
  });

  if (visibleItems.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 32px" }}>
        <div style={{ fontSize: 42, marginBottom: 16, opacity: 0.3 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>No items match</div>
        {menuQuery && <div style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, marginBottom: 24 }}>Try a different search term</div>}
        <button 
          onClick={onClearSearch}
          style={{ padding: "12px 24px", borderRadius: borderRadius.md, border: `1px solid ${colors.borderLight}`, background: colors.backgroundSurface, color: colors.textSecondary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: kioskMode ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(150px, 1fr))", gap: kioskMode ? 16 : 12 }}>
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
              background: qty > 0 ? colors.primaryBg : colors.backgroundCard,
              border: qty > 0 ? `2px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
              borderRadius: borderRadius.lg,
              padding: kioskMode ? 18 : 14,
              cursor: unavailable ? "not-allowed" : "pointer",
              opacity: unavailable ? 0.42 : 1,
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              position: "relative",
              minHeight: kioskMode ? 180 : 140,
              display: "flex",
              flexDirection: "column",
            }}
            onMouseEnter={(e) => {
              if (!unavailable) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
                if (qty === 0) e.currentTarget.style.borderColor = colors.primary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              if (qty === 0) e.currentTarget.style.borderColor = colors.borderLight;
            }}
            onFocus={(e) => {
              if (unavailable) return;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}55, 0 12px 32px rgba(0,0,0,0.12)`;
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              if (qty === 0) e.currentTarget.style.borderColor = colors.borderLight;
            }}
          >
            {/* In-cart qty badge */}
            {qty > 0 && (
              <div style={{ position: "absolute", top: 10, right: 10, background: colors.primary, color: "#1A1208", fontSize: 12, fontFamily: typography.fontFamilyMono, fontWeight: 800, minWidth: 24, height: 24, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>{qty}</div>
            )}

            {/* Emoji + name */}
            <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>{item.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: colors.textPrimary, lineHeight: 1.3, flex: 1 }}>{item.name}</div>
            <div style={{ fontSize: 10, color: colors.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{item.cat}</div>

            {/* Tags row */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, minHeight: 20 }}>
              {item.popular && (
                <span style={{ fontSize: 10, background: colors.primaryBg, color: colors.primary, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>⭐ Hot</span>
              )}
              {unavailable && (
                <span style={{ fontSize: 10, background: colors.dangerBg, color: colors.danger, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{item.eightySixed ? "86'd" : "Off"}</span>
              )}
            </div>

            {/* Price + controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: colors.primary, fontFamily: typography.fontFamilyMono, letterSpacing: "-0.02em" }}>{formatCurrency(item.price)}</div>
              {qty > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.borderLight}`, background: colors.backgroundSurface, color: colors.textSecondary, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 700, transition: "background .15s, transform .1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = colors.backgroundHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = colors.backgroundSurface; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = ""; }}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >−</button>
                  <button
                    onClick={() => onAddItem(item)}
                    style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.primary}`, background: colors.primary, color: "#1A1208", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 800, transition: "filter .15s, transform .1s" }}
                    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = ""; }}
                    aria-label={`Increase quantity of ${item.name}`}
                  >+</button>
                </div>
              ) : (
                // Subtle "tap to add" affordance
                !unavailable && (
                  <div style={{ fontSize: 11, color: colors.textTertiary, opacity: 0.6, fontWeight: 600 }}>tap +</div>
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
