// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useThemeColors, useThemeSpacing, useThemeTypography, useThemeBorderRadius } from '../../theme';
import { formatCurrency } from '../../domain/money.js';

const CartPanel = ({ 
  cart, 
  heldOrders, 
  onHoldBill, 
  onClearCart, 
  onUpdateQuantity, 
  onRemoveItem, 
  isMobile,
  onResumeHeldBill,
  onDiscardHeldBill,
  availableTables,
  onOpenPriceOverrideModal,
  onOpenModifierModal,
  onSetItemNotesModal,
  onSetItemNotes: _onSetItemNotes,
  cartItemSplits,
  cartSplitMode,
  cartSplitCount,
  onSetItemSplits,
  recentlyAdded = null
}) => {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const borderRadius = useThemeBorderRadius();

  const isItemModified = (item) => {
    return item.modifiers?.length > 0 || item.notes || item.overridePrice;
  };

  return (
    <div 
      className={`pos-cart ${cart.items.length > 0 ? 'open' : ''}`} 
      style={{ 
        background: colors.backgroundCard, 
        border: `1px solid ${colors.border}`, 
        borderRadius: borderRadius.lg, 
        overflowY: "auto", 
        display: isMobile && cart.items.length === 0 ? "none" : "flex", 
        flexDirection: "column",
        position: "relative"
      }}
    >
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        background: colors.backgroundCard, 
        zIndex: 10,
        borderBottom: `1px solid ${colors.border}`,
        borderRadius: `${borderRadius.lg} ${borderRadius.lg} 0 0`,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}>
        {/* Left: title + item count */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧾</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary }}>Order Slip</span>
          {cart.items.length > 0 && (
            <span style={{ 
              background: colors.primary, color: "#1A1208",
              fontSize: 12, fontFamily: typography.fontFamilyMono, fontWeight: 800,
              padding: "3px 10px", borderRadius: 22, minWidth: 24, textAlign: "center"
            }}>
              {cart.items.length}
            </span>
          )}
        </div>

        {/* Right: Hold + Clear — only when cart has items */}
        {cart.items.length > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={onHoldBill}
              aria-label="Hold bill"
              title="Hold this order and start a new one"
              style={{ 
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: colors.backgroundSurface,
                color: colors.textSecondary,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
            >
              ⏸ Hold
              {heldOrders.length > 0 && (
                <span style={{ background: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warning, fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 12, lineHeight: 1 }}>
                  {heldOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={onClearCart}
              aria-label="Clear cart"
              style={{ 
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 10,
                border: `1px solid ${colors.dangerBorder}`,
                background: colors.dangerBg,
                color: colors.danger,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              🗑 Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* ── Held orders ─────────────────────────────────────────────────── */}
      {heldOrders.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.textTertiary, marginBottom: 10 }}>
            ⏸ Held Orders ({heldOrders.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {heldOrders.map(h => {
              // eslint-disable-next-line react-hooks/purity
              const mins = Math.max(0, Math.round((Date.now() - h.savedAt) / 60000));
              const itemCount = h.cart.reduce((n, it) => n + (Number(it.qty) || 0), 0);
              const typeIcon = { DINE_IN: "🪑", TAKEAWAY: "🥡", DIRECT_DELIVERY: "🛵", SWIGGY: "🟠", ZOMATO: "🔴" }[h.orderType] || "🧾";
              let who = "";
              if (h.orderType === "DINE_IN") {
                const t = availableTables.find(t => t.id === h.selectedTable);
                who = t ? `Table ${t.number}` : "Dine In";
              } else if (h.orderType === "TAKEAWAY") { who = "Takeaway"; }
              else if (h.orderType === "DIRECT_DELIVERY") { who = h.customerPhone || "Delivery"; }
              else if (h.orderType === "SWIGGY" || h.orderType === "ZOMATO") {
                who = h.platformOrderId || h.orderType;
              }
              const itemPreview = h.cart.slice(0, 3).map(i => i.name).join(", ") + (h.cart.length > 3 ? ` +${h.cart.length - 3}` : "");
              return (
                <div key={h.id} style={{
                  background: colors.backgroundSurface,
                  border: `1px solid ${colors.warningBorder}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  {/* Icon + info */}
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: colors.textPrimary, marginBottom: 3 }}>
                      {who} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                      <span style={{ marginLeft: 8, fontSize: 11, color: colors.textTertiary, fontWeight: 600 }}>{mins}m ago</span>
                    </div>
                    <div style={{ fontSize: 12, color: colors.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {itemPreview}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => onResumeHeldBill(h.id)}
                      title="Resume this order (current cart will be held)"
                      style={{
                        padding: "8px 14px", borderRadius: 8,
                        border: `1px solid ${colors.warningBorder}`,
                        background: colors.warningBg,
                        color: colors.warning,
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ↩ Resume
                    </button>
                    <button
                      onClick={() => onDiscardHeldBill(h.id)}
                      title="Discard this held order"
                      style={{
                        padding: "8px 10px", borderRadius: 8,
                        border: `1px solid ${colors.dangerBorder}`,
                        background: colors.dangerBg,
                        color: colors.danger,
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Divider if cart also has items */}
          {cart.items.length > 0 && (
            <div style={{ height: 1, background: colors.borderLight, margin: "12px 0 0" }} />
          )}
        </div>
      )}
      
      {/* Split Payment Indicator */}
      {cartSplitMode && cartSplitCount > 1 && (
        <div style={{ marginBottom: spacing.md, padding: spacing.sm, background: colors.primaryDim, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.sm, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: typography.sizes.xs, fontWeight: 600, color: colors.primary }}>
            🔀 Split Bill: {cartSplitCount} ways
          </div>
          <button onClick={() => onSetItemSplits(null)} style={{ background: "transparent", border: "none", color: colors.primary, fontSize: 18, cursor: "pointer", padding: 0 }}>×</button>
        </div>
      )}

      {cart.items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: heldOrders.length > 0 ? "flex-start" : "center", paddingTop: heldOrders.length > 0 ? 10 : 0 }}>
          {heldOrders.length === 0 && (
            <>
              <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.25 }}>🍽</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>Nothing on the slip yet</div>
              <div style={{ fontSize: 13, color: colors.textTertiary }}>Tap any menu item to add it</div>
            </>
          )}
          {heldOrders.length > 0 && (
            <div style={{ width: "100%", padding: "12px 0 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 8 }}>
                Cart is empty — pick up a held order above, or tap items to start a new one.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.lg }}>
          {cart.items.map(item => {
            const modifiersTotal = (item.modifiers || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
            const unitPrice = (item.overridePrice ?? item.price) + modifiersTotal;
            const assignedSplit = cartItemSplits?.[item.id];
            return (
            <div 
              key={item.id} 
              style={{ 
                background: isItemModified(item) ? colors.primaryBg : colors.backgroundElevated, 
                border: isItemModified(item) ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`, 
                borderRadius: 12, 
                padding: "14px",
                animation: recentlyAdded === item.id ? "highlight 0.5s ease" : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{item.name}</div>
                    {isItemModified(item) && (
                      <span style={{ fontSize: 11, background: colors.primary, color: "#1A1208", padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>Modified</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 3 }}>{item.category}</div>
                  {item.notes && (
                    <div style={{ fontSize: 12, color: colors.primary, marginTop: 6, fontStyle: "italic", fontWeight: 600 }}>📝 {item.notes}</div>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                      {item.modifiers.map((mod, idx) => (
                        <span key={mod.id || idx}>
                          {mod.name}{mod.price ? ` (${mod.price > 0 ? "+" : ""}${formatCurrency(mod.price)})` : ""}{idx < item.modifiers.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onRemoveItem(item.id)} 
                  style={{ background: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 18, cursor: "pointer", padding: "8px 12px", borderRadius: 8, fontWeight: 700, transition: "filter .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)} 
                    style={{ width: isMobile ? 42 : 36, height: isMobile ? 42 : 36, borderRadius: 10, border: `1px solid ${colors.borderLight}`, background: colors.backgroundHover, color: colors.textSecondary, cursor: "pointer", fontSize: isMobile ? 20 : 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .1s, border-color .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.danger; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLight; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = ""; }}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span style={{ fontFamily: typography.fontFamilyMono, fontSize: 15, fontWeight: 800, color: colors.primary, minWidth: 28, textAlign: "center" }}>{item.qty}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)} 
                    style={{ width: isMobile ? 42 : 36, height: isMobile ? 42 : 36, borderRadius: 10, border: `1px solid ${colors.primary}`, background: colors.primaryBg, color: colors.primary, cursor: "pointer", fontSize: isMobile ? 20 : 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .1s, filter .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = ""; }}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontFamily: typography.fontFamilyMono, fontSize: 15, fontWeight: 800, color: colors.primary }}>
                    {(item.overridePrice != null || modifiersTotal > 0) ? (
                      <span style={{ textDecoration: "line-through", color: colors.textTertiary, marginRight: 6 }}>{formatCurrency(item.price * item.qty)}</span>
                    ) : null}
                    {formatCurrency(unitPrice * item.qty)}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={() => onOpenModifierModal(item)} 
                      title="Add modifiers" 
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.backgroundSurface, color: colors.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .15s, background .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.background = colors.primaryBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.backgroundSurface; }}
                      aria-label={`Add modifiers to ${item.name}`}
                    >
                      ⚙️
                    </button>
                    <button 
                      onClick={() => onOpenPriceOverrideModal(item)} 
                      title="Override price" 
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.backgroundSurface, color: colors.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .15s, background .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.background = colors.primaryBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.backgroundSurface; }}
                      aria-label={`Override price for ${item.name}`}
                    >
                      💰
                    </button>
                    <button 
                      onClick={() => onSetItemNotesModal(item)} 
                      title="Add notes" 
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.backgroundSurface, color: colors.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .15s, background .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.background = colors.primaryBg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.backgroundSurface; }}
                      aria-label={`Add notes to ${item.name}`}
                    >
                      📝
                    </button>
                  </div>
                </div>
              </div>

              {cartSplitMode && cartSplitCount > 1 && (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${colors.borderLight}` }}>
                  <span style={{ fontSize: typography.sizes.xs, color: colors.textTertiary, marginRight: 2 }}>Split:</span>
                  {Array.from({ length: cartSplitCount }, (_, i) => i + 1).map(n => {
                    const isAssigned = assignedSplit === n;
                    return (
                      <button
                        key={n}
                        onClick={() => onSetItemSplits(item.id, isAssigned ? null : n)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%",
                          border: isAssigned ? `1px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
                          background: isAssigned ? colors.primary : colors.backgroundSurface,
                          color: isAssigned ? "#1A1208" : colors.textSecondary,
                          fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
                        }}
                        aria-pressed={isAssigned}
                        aria-label={`Assign ${item.name} to guest ${n}`}
                        title={`Guest ${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                  {!assignedSplit && (
                    <span style={{ fontSize: 10, color: colors.warning, marginLeft: 4, fontWeight: 600 }}>Unassigned</span>
                  )}
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes highlight {
          0% { background: ${colors.primary}; transform: scale(1.02); }
          100% { background: ${colors.backgroundSurface}; transform: scale(1); }
        }
      `}</style>
      </div>{/* end body */}
    </div>
  );
};

export default CartPanel;
