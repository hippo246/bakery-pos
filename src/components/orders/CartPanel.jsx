// eslint-disable-next-line no-unused-vars
import React from 'react';
import { formatCurrency } from "../../domain/money.js";

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
  const isItemModified = (item) => {
    return item.modifiers?.length > 0 || item.notes || item.overridePrice;
  };

  return (
    <div 
      className={`pos-cart ${cart.items.length > 0 ? 'open' : ''}`} 
      style={{ 
        background: "var(--cafe-bg-elevated)", 
        border: `1px solid var(--cafe-border)`, 
        borderRadius: "var(--cafe-radius-lg)", 
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
        background: "var(--cafe-bg-elevated)", 
        zIndex: 10,
        borderBottom: `1px solid var(--cafe-border-light)`,
        borderRadius: "var(--cafe-radius-lg) var(--cafe-radius-lg) 0 0",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        {/* Left: title + item count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧾</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>Order Slip</span>
          {cart.items.length > 0 && (
            <span style={{ 
              background: "var(--cafe-accent)", color: "#1A1208",
              fontSize: 11, fontFamily: "monospace", fontWeight: 800,
              padding: "2px 8px", borderRadius: 20, minWidth: 22, textAlign: "center"
            }}>
              {cart.items.length}
            </span>
          )}
        </div>

        {/* Right: Hold + Clear — only when cart has items */}
        {cart.items.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={onHoldBill}
              aria-label="Hold bill"
              title="Hold this order and start a new one"
              style={{ 
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", borderRadius: 8,
                border: "1px solid var(--cafe-border)",
                background: "var(--cafe-bg-surface)",
                color: "var(--cafe-text-secondary)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cafe-accent)"; e.currentTarget.style.color = "var(--cafe-accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--cafe-border)"; e.currentTarget.style.color = "var(--cafe-text-secondary)"; }}
            >
              ⏸ Hold
              {heldOrders.length > 0 && (
                <span style={{ background: "var(--cafe-warning-bg)", border: "1px solid var(--cafe-warning-border)", color: "var(--cafe-warning)", fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 10, lineHeight: 1 }}>
                  {heldOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={onClearCart}
              aria-label="Clear cart"
              style={{ 
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", borderRadius: 8,
                border: "1px solid var(--cafe-danger-border)",
                background: "var(--cafe-danger-bg)",
                color: "var(--cafe-danger)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "all .15s",
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
      <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* ── Held orders ─────────────────────────────────────────────────── */}
      {heldOrders.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cafe-text-tertiary)", marginBottom: 8 }}>
            ⏸ Held Orders ({heldOrders.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-warning-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  {/* Icon + info */}
                  <div style={{ fontSize: 20, flexShrink: 0 }}>{typeIcon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 2 }}>
                      {who} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                      <span style={{ marginLeft: 6, fontSize: 10, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>{mins}m ago</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {itemPreview}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => onResumeHeldBill(h.id)}
                      title="Resume this order (current cart will be held)"
                      style={{
                        padding: "6px 12px", borderRadius: 7,
                        border: "1px solid var(--cafe-warning-border)",
                        background: "var(--cafe-warning-bg)",
                        color: "var(--cafe-warning)",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ↩ Resume
                    </button>
                    <button
                      onClick={() => onDiscardHeldBill(h.id)}
                      title="Discard this held order"
                      style={{
                        padding: "6px 8px", borderRadius: 7,
                        border: "1px solid var(--cafe-danger-border)",
                        background: "var(--cafe-danger-bg)",
                        color: "var(--cafe-danger)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
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
            <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "10px 0 0" }} />
          )}
        </div>
      )}
      
      {/* Split Payment Indicator */}
      {cartSplitMode && cartSplitCount > 1 && (
        <div style={{ marginBottom: "var(--cafe-space-md)", padding: "var(--cafe-space-sm)", background: "var(--cafe-accent-dim)", border: `1px solid var(--cafe-accent)`, borderRadius: "var(--cafe-radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-accent)" }}>
            🔀 Split Bill: {cartSplitCount} ways
          </div>
          <button onClick={() => onSetItemSplits(null)} style={{ background: "transparent", border: "none", color: "var(--cafe-accent)", fontSize: 18, cursor: "pointer", padding: 0 }}>×</button>
        </div>
      )}

      {cart.items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: heldOrders.length > 0 ? "flex-start" : "center", paddingTop: heldOrders.length > 0 ? 8 : 0 }}>
          {heldOrders.length === 0 && (
            <>
              <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.25 }}>🍽</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 6 }}>Nothing on the slip yet</div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Tap any menu item to add it</div>
            </>
          )}
          {heldOrders.length > 0 && (
            <div style={{ width: "100%", padding: "12px 0 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 8 }}>
                Cart is empty — pick up a held order above, or tap items to start a new one.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)", marginBottom: "var(--cafe-space-lg)" }}>
          {cart.items.map(item => {
            const modifiersTotal = (item.modifiers || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
            const unitPrice = (item.overridePrice ?? item.price) + modifiersTotal;
            const assignedSplit = cartItemSplits?.[item.id];
            return (
            <div 
              key={item.id} 
              style={{ 
                background: isItemModified(item) ? "var(--cafe-accent-dim)" : "var(--cafe-bg-surface)", 
                border: isItemModified(item) ? `1px solid var(--cafe-accent)` : `1px solid var(--cafe-border-light)`, 
                borderRadius: "var(--cafe-radius-md)", 
                padding: "var(--cafe-space-md)",
                animation: recentlyAdded === item.id ? "highlight 0.5s ease" : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--cafe-space-sm)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>{item.name}</div>
                    {isItemModified(item) && (
                      <span style={{ fontSize: 10, background: "var(--cafe-accent)", color: "#1A1208", padding: "2px 6px", borderRadius: "var(--cafe-radius-sm)", fontWeight: 600 }}>Modified</span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{item.category}</div>
                  {item.notes && (
                    <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-accent)", marginTop: 4, fontStyle: "italic" }}>📝 {item.notes}</div>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", marginTop: 4 }}>
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
                  style={{ background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)", color: "var(--cafe-danger)", fontSize: 16, cursor: "pointer", padding: "6px 10px", borderRadius: "var(--cafe-radius-sm)", fontWeight: 600 }}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)} 
                    style={{ width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-secondary)", cursor: "pointer", fontSize: isMobile ? 18 : 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-accent)", minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)} 
                    style={{ width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-accent)`, background: "var(--cafe-accent-dim)", color: "var(--cafe-accent)", cursor: "pointer", fontSize: isMobile ? 18 : 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-accent)" }}>
                    {(item.overridePrice != null || modifiersTotal > 0) ? (
                      <span style={{ textDecoration: "line-through", color: "var(--cafe-text-tertiary)", marginRight: 4 }}>{formatCurrency(item.price * item.qty)}</span>
                    ) : null}
                    {formatCurrency(unitPrice * item.qty)}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button 
                      onClick={() => onOpenModifierModal(item)} 
                      title="Add modifiers" 
                      style={{ width: 28, height: 28, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                      aria-label={`Add modifiers to ${item.name}`}
                    >
                      ⚙️
                    </button>
                    <button 
                      onClick={() => onOpenPriceOverrideModal(item)} 
                      title="Override price" 
                      style={{ width: 28, height: 28, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                      aria-label={`Override price for ${item.name}`}
                    >
                      💰
                    </button>
                    <button 
                      onClick={() => onSetItemNotesModal(item)} 
                      title="Add notes" 
                      style={{ width: 28, height: 28, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                      aria-label={`Add notes to ${item.name}`}
                    >
                      📝
                    </button>
                  </div>
                </div>
              </div>

              {cartSplitMode && cartSplitCount > 1 && (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 10, paddingTop: 10, borderTop: `1px dashed var(--cafe-border-light)` }}>
                  <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginRight: 2 }}>Split:</span>
                  {Array.from({ length: cartSplitCount }, (_, i) => i + 1).map(n => {
                    const isAssigned = assignedSplit === n;
                    return (
                      <button
                        key={n}
                        onClick={() => onSetItemSplits(item.id, isAssigned ? null : n)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%",
                          border: isAssigned ? `1px solid var(--cafe-accent)` : `1px solid var(--cafe-border-light)`,
                          background: isAssigned ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                          color: isAssigned ? "#1A1208" : "var(--cafe-text-secondary)",
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
                    <span style={{ fontSize: 10, color: "var(--cafe-warning)", marginLeft: 4, fontWeight: 600 }}>Unassigned</span>
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
          0% { background: var(--cafe-accent); transform: scale(1.02); }
          100% { background: var(--cafe-bg-surface); transform: scale(1); }
        }
      `}</style>
      </div>{/* end body */}
    </div>
  );
};

export default CartPanel;
