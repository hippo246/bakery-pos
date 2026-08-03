import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { C, pill, btn, input, STATUS_FLOW, STATUS_FLOW_LABEL, STATUS_COLORS, SRC_COLORS, PEAK_SOP, srcLabel } from "../../styles/theme";
import { INIT_TABLES } from "../../data/tableConstants";
import { createOrder, updateOrderStatus, getOrderDisplayItems, getOrderCustomerName, getOrderAmount } from "../../domain/orderModel.js";
import { deductInventoryForOrder, canFulfillOrder, restoreInventoryForCancelledOrder, BASIC_RECIPES } from "../../domain/inventoryModel.js";
import { getMinutesElapsed } from "../../domain/dates.js";
import { createKdsTicketsFromOrder } from "../../domain/kdsModel.js";
import { getOrCreateCustomerFromOrder, updateCustomerAfterOrder } from "../../domain/customerModel.js";
import { markTableOccupied, markTableAvailable } from "../../domain/tableModel.js";
import { calculateCartTotals } from "./utils/cartCalculations";
import { MODIFIER_CATEGORIES } from "../../data/constants.js";
import { useMobile } from "../../hooks/useMobile.js";

// ── Devin's extracted components ──────────────────────────────────────────────
import CategorySidebar from "./CategorySidebar";
import MenuGrid from "./MenuGrid";
// eslint-disable-next-line no-unused-vars
import CartPanel from "./CartPanel";
import OrderTypePanel from "./OrderTypePanel";
import DiscountPanel from "./DiscountPanel";
import TotalsPanel from "./TotalsPanel";
import PaymentPanel from "./PaymentPanel";
import ModifierModal from "./ModifierModal";
import StockWarningModal from "./StockWarningModal";
import OrderNotesModal from "./OrderNotesModal";
import ReceiptModal from "./ReceiptModal";
import RefundVoidModal from "./RefundVoidModal";
import KitchenStatusPanel from "./KitchenStatusPanel";
import PriceOverrideModal from "./PriceOverrideModal";
import SearchBar from "./SearchBar";
import CustomerPanel from "./CustomerPanel";

const _MENU_CATEGORIES = ["All", "Coffee", "Food", "Special", "Popular", "Available only"];
const ORDER_NOTES_MAX = 500;
const ITEM_NOTES_MAX = 200;
const STATUS_FILTERS = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];
const SOURCE_FILTERS = ["ALL", "WALK_IN", "QR_ORDERING", "SWIGGY", "ZOMATO", "DIRECT_DELIVERY"];
const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DIRECT_DELIVERY", "SWIGGY", "ZOMATO"];
const sourceMap = { "DINE_IN": "WALK_IN", "TAKEAWAY": "WALK_IN", "DIRECT_DELIVERY": "DIRECT_DELIVERY", "SWIGGY": "SWIGGY", "ZOMATO": "ZOMATO" };
const _paymentStatusMap = { "CASH": "PAID", "UPI": "PAID", "CARD": "PAID", "SPLIT": "PARTIAL", "ONLINE": "PAID", "COD": "COD" };

const devWarn = (...args) => {
  try {
    const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
    if (isDev) console.warn(...args);
  } catch { /* silent */ }
};


// ── CartContent: shared by desktop right-col and mobile full-screen ──────────
function CartContent({
  isMobile, cart, heldOrders, availableTables,
  orderType, setOrderType, selectedTable, setSelectedTable,
  customerPhone, setCustomerPhone, customerAddress, setCustomerAddress,
  platformOrderId, setPlatformOrderId, pax, setPax,
  discountInput, setDiscountInput, discountMode, setDiscountMode,
  packagingCharge, setPackagingCharge, orderNotes,
  splitBillMode, setSplitBillMode, splitBillCount, setSplitBillCount,
  setCartItemSplits, activeCartTotal,
  cartSubtotal, cartCgst, cartSgst, cartPackaging, cartDiscount, cartTotal,
  isPaymentComplete, setIsPaymentComplete,
  paymentBreakdown, setPaymentBreakdown, paymentResetKey, isPlacingOrder,
  availableCustomers, showCustomerHistory, setShowCustomerHistory,
  customerOrders, reorderItems,
  holdBill, clearCart, resumeHeldBill, discardHeldBill,
  removeFromCart, updateCartQty,
  setModifierModal, openItemNotesModal, openPriceOverrideModal,
  setOrderNotesDraft, setOrderNotesModal,
  placeOrder, setPosMobileTab,
}) {
  // Validation block
  const block = [];
  if (orderType === "DINE_IN" && !selectedTable) block.push("Select a table");
  else if (orderType === "DIRECT_DELIVERY" && !customerPhone.trim()) block.push("Enter customer phone");
  else if (orderType === "DIRECT_DELIVERY" && !customerAddress.trim()) block.push("Enter delivery address");
  else if ((orderType === "SWIGGY" || orderType === "ZOMATO") && !platformOrderId.trim()) block.push(`Enter ${orderType} order ID`);
  const isBlocked = isPlacingOrder || block.length > 0 || !isPaymentComplete;

  const sectionLabel = { fontSize: isMobile ? 13 : 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: isMobile ? 10 : 8 };
  const cardStyle   = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? "16px" : "12px", marginBottom: isMobile ? 12 : 8 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 0 : 8, height: isMobile ? "auto" : "100%", overflow: isMobile ? "visible" : "hidden" }}>

      {/* ── Held orders ── */}
      {heldOrders.length > 0 && (
        <div style={{ ...cardStyle, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.amber3}`, margin: isMobile ? "-16px -16px 12px" : "-12px -12px 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.amber2 }}>⏸ Held Orders ({heldOrders.length})</span>
            <span style={{ fontSize: 10, color: C.text3 }}>Tap to resume</span>
          </div>
          {heldOrders.map(h => {
            const mins = Math.max(0, Math.round((Date.now() - h.savedAt) / 60000));
            const itemCount = h.cart.reduce((n, it) => n + (Number(it.qty) || 0), 0);
            const typeIcon = { DINE_IN: "🪑", TAKEAWAY: "🥡", DIRECT_DELIVERY: "��", SWIGGY: "🟠", ZOMATO: "🔴" }[h.orderType] || "🧾";
            const who = h.orderType === "DINE_IN"
              ? (() => { const t = availableTables.find(t => t.id === h.selectedTable); return t ? `T${t.number}` : "Dine In"; })()
              : h.orderType === "TAKEAWAY" ? "Takeaway"
              : h.orderType === "DIRECT_DELIVERY" ? (h.customerPhone || "Delivery")
              : h.platformOrderId || h.orderType;
            return (
              <div key={h.id} className="pos-held-row" style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 16 }}>{typeIcon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? 13 : 11, fontWeight: 700, color: C.text }}>{who} · {itemCount} items <span style={{ color: C.text3, fontWeight: 400 }}>{mins}m ago</span></div>
                  <div style={{ fontSize: isMobile ? 12 : 10, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.cart.slice(0,2).map(i=>i.name).join(", ")}{h.cart.length>2?` +${h.cart.length-2}`:""}</div>
                </div>
                <button className="pos-held-resume-btn" onClick={() => resumeHeldBill(h.id)} style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: isMobile ? 13 : 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>↩ Resume</button>
                <button onClick={() => discardHeldBill(h.id)} style={{ padding: isMobile ? "8px 10px" : "5px 7px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order Slip ── */}
      <div style={{ ...cardStyle, flexShrink: 0 }}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>🧾</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Order Slip</span>
              {cart.items.length > 0 && <span style={{ background: C.amber, color: "#1a0e00", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>{cart.items.length}</span>}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {cart.items.length > 0 && <button onClick={holdBill} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⏸ Hold</button>}
              {cart.items.length > 0 && <button onClick={clearCart} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🗑 Clear</button>}
            </div>
          </div>
        )}

        {cart.items.length === 0 ? (
          <div style={{ padding: isMobile ? "32px 16px" : "16px", textAlign: "center", color: C.text3, fontSize: isMobile ? 14 : 11 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <div>Empty — tap menu items to add</div>
            {isMobile && (
              <button onClick={() => setPosMobileTab("menu")} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 10, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ← Browse Menu
              </button>
            )}
          </div>
        ) : (
          <div style={{ maxHeight: isMobile ? "none" : 230, overflowY: isMobile ? "visible" : "auto", ...(isMobile ? {} : { padding: "0" }) }}>
            {/* Hold button on mobile — inside cart section */}
            {isMobile && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={holdBill} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⏸ Hold Order</button>
              </div>
            )}
            {cart.items.map(item => {
              const modsTotal = (item.modifiers||[]).reduce((s,m)=>s+(Number(m.price)||0),0);
              const unitPrice = (item.overridePrice ?? item.price) + modsTotal;
              return (
                <div key={item.id} className="pos-cart-item" style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 15 : 12, fontWeight: 700, color: C.text }}>{item.name}</div>
                      {item.notes && <div style={{ fontSize: isMobile ? 12 : 10, color: C.amber2, marginTop: 2 }}>📝 {item.notes}</div>}
                    </div>
                    <button className="pos-cart-remove-btn" onClick={() => removeFromCart(item.id)} style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 14, fontWeight: 700, cursor: "pointer", marginLeft: 8, flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Qty stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button className="pos-cart-qty-btn" onClick={() => updateCartQty(item.id, -1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg4, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>−</button>
                      <span className="pos-cart-qty-val" style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: C.amber2, width: 28, textAlign: "center" }}>{item.qty}</span>
                      <button className="pos-cart-qty-btn" onClick={() => updateCartQty(item.id, 1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
                    </div>
                    {/* Price + action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: isMobile ? 15 : 13, fontWeight: 800, color: C.amber2 }}>₹{(unitPrice*item.qty).toFixed(0)}</span>
                      <button className="pos-cart-action-btn" onClick={() => setModifierModal({ open: true, item })} title="Customise" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 13, cursor: "pointer" }}>⚙️</button>
                      <button className="pos-cart-action-btn" onClick={() => openItemNotesModal(item)} title="Notes" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 13, cursor: "pointer" }}>📝</button>
                      <button className="pos-cart-action-btn" onClick={() => openPriceOverrideModal(item)} title="Price" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 13, cursor: "pointer" }}>💰</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Checkout form — only when cart has items ── */}
      {cart.items.length > 0 && (
        <div className="pos-checkout-form" style={{ ...(isMobile ? {} : { flex: 1, overflowY: "auto", minHeight: 0 }), ...cardStyle }}>

          {/* Order type */}
          <OrderTypePanel
            orderType={orderType} onOrderTypeChange={setOrderType}
            selectedTable={selectedTable} onTableSelect={setSelectedTable}
            availableTables={availableTables}
            customerPhone={customerPhone} onCustomerPhoneChange={setCustomerPhone}
            customerAddress={customerAddress} onCustomerAddressChange={setCustomerAddress}
            platformOrderId={platformOrderId} onPlatformOrderIdChange={setPlatformOrderId}
          />

          {/* Customer lookup */}
          {(orderType === "DINE_IN" || orderType === "TAKEAWAY") && (
            <CustomerPanel
              customerPhone={customerPhone} onCustomerPhoneChange={setCustomerPhone}
              availableCustomers={availableCustomers}
              showOrderHistory={showCustomerHistory}
              onToggleOrderHistory={() => setShowCustomerHistory(v => !v)}
              customerOrders={customerOrders}
              onReorderItems={reorderItems}
            />
          )}

          {/* Covers (pax) */}
          {orderType === "DINE_IN" && (
            <div style={{ marginBottom: 14 }}>
              <div style={sectionLabel}>Covers (Pax)</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => setPax(n)} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 9, border: `2px solid ${pax===n?C.amber:C.border}`, background: pax===n?C.amberDim:C.bg3, color: pax===n?C.amber2:C.text2, fontWeight: pax===n?800:500, fontSize: isMobile ? 15 : 13, cursor: "pointer" }}>{n}</button>
                ))}
                <button onClick={() => setPax(p=>Math.max(1,p-1))} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 18, cursor: "pointer" }}>−</button>
                <button onClick={() => setPax(p=>Math.min(40,p+1))} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 18, cursor: "pointer" }}>+</button>
                {pax > 8 && <span style={{ alignSelf: "center", fontSize: 13, fontWeight: 700, color: C.amber2 }}>{pax} guests</span>}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />

          <DiscountPanel discountInput={discountInput} discountMode={discountMode} cartSubtotal={cartSubtotal} onDiscountModeChange={setDiscountMode} onDiscountInputChange={setDiscountInput} />

          <button onClick={() => { setOrderNotesDraft(orderNotes); setOrderNotesModal(true); }} style={{ width: "100%", padding: isMobile ? "12px 14px" : "8px 12px", borderRadius: 8, border: `1px dashed ${orderNotes?C.amber3:C.border2}`, background: orderNotes?C.amberDim:"transparent", color: orderNotes?C.amber2:C.text3, fontSize: isMobile ? 14 : 12, fontWeight: 600, cursor: "pointer", textAlign: "left", marginBottom: 12 }}>
            {orderNotes ? `📝 ${orderNotes.slice(0,40)}${orderNotes.length>40?"…":""}` : "+ Add kitchen notes / allergy info"}
          </button>

          <div style={{ height: 1, background: C.border, margin: "0 0 10px" }} />

          <TotalsPanel cartSubtotal={cartSubtotal} cartCgst={cartCgst} cartSgst={cartSgst} cartPackaging={cartPackaging} cartDiscount={cartDiscount} cartTotal={cartTotal} discountMode={discountMode} discountInput={discountInput} packagingCharge={packagingCharge} onPackagingChargeChange={setPackagingCharge} />

          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />

          {/* Split bill */}
          <div style={{ marginBottom: 14 }}>
            <div style={sectionLabel}>Split Bill</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: isMobile ? 14 : 12, color: C.text, cursor: "pointer" }}>
                <input type="checkbox" checked={splitBillMode} onChange={(e) => { setSplitBillMode(e.target.checked); if (!e.target.checked) setCartItemSplits({}); }} style={{ accentColor: C.amber, width: isMobile ? 18 : 14, height: isMobile ? 18 : 14 }} /> Enable Split
              </label>
              {splitBillMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                  <button onClick={() => setSplitBillCount(Math.max(2,splitBillCount-1))} style={{ padding: isMobile ? "8px 12px" : "4px 8px", background: "transparent", border: "none", color: C.text, cursor: "pointer", fontSize: isMobile ? 18 : 14 }}>-</button>
                  <span style={{ fontSize: isMobile ? 15 : 12, fontWeight: 700, color: C.text, width: 24, textAlign: "center" }}>{splitBillCount}</span>
                  <button onClick={() => setSplitBillCount(Math.min(10,splitBillCount+1))} style={{ padding: isMobile ? "8px 12px" : "4px 8px", background: "transparent", border: "none", color: C.text, cursor: "pointer", fontSize: isMobile ? 18 : 14 }}>+</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

          <PaymentPanel cartTotal={activeCartTotal} onBreakdownChange={(bd,ic)=>{setPaymentBreakdown(bd);setIsPaymentComplete(ic);}} isPlacingOrder={isPlacingOrder} cartLength={cart.items.length} resetKey={paymentResetKey} />

          {/* Place order — inline for desktop, sticky bar for mobile */}
          <div className="pos-place-order-bar">
            {block.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "10px 14px" : "8px 12px", borderRadius: 8, background: C.amberDim, border: `1px solid ${C.amber3}`, marginBottom: 8 }}>
                <span>⚠️</span>
                <span style={{ fontSize: isMobile ? 13 : 12, color: C.amber2, fontWeight: 600 }}>{block[0]}</span>
              </div>
            )}
            <button
              className="pos-place-order-btn"
              onClick={placeOrder}
              disabled={isBlocked}
              style={{
                width: "100%", padding: "15px 0", fontSize: isMobile ? 16 : 15, fontWeight: 900, border: "none",
                borderRadius: 12, cursor: isBlocked ? "not-allowed" : "pointer",
                background: isBlocked ? C.bg4 : `linear-gradient(135deg, ${C.amber} 0%, ${C.amber2} 100%)`,
                color: isBlocked ? C.text3 : "#1a0e00",
                boxShadow: isBlocked ? "none" : `0 4px 20px ${C.amberDim}`,
                marginTop: isMobile ? 0 : 10,
              }}
            >
              {isPlacingOrder ? "⏳ Placing…" : splitBillMode ? `🍳 Send to Kitchen (1/${splitBillCount}) · ₹${activeCartTotal}` : `🍳 Send to Kitchen · ₹${activeCartTotal}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Orders({ orders, setOrders, kdsCards, setKdsCards, menuItems, tables, setTables, staff, discounts, inventory, setInventory, customers, setCustomers }) {
  const { isMobile } = useMobile();

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("active");

  // ── Active Orders ─────────────────────────────────────────────────────────
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState("cards"); // "list" | "cards"

  // ── POS state ─────────────────────────────────────────────────────────────
  const [cart, setCart] = useState({ items: [] });        // shape: { items: [] }
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [menuQuery, setMenuQuery] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [orderType, setOrderType] = useState("DINE_IN");
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [platformOrderId, setPlatformOrderId] = useState("");
  const [pax, setPax] = useState(2); // Count of people
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountMode, setDiscountMode] = useState("amount");  // "amount" | "percent"
  const [packagingCharge, setPackagingCharge] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [posMobileTab, setPosMobileTab] = useState("menu");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [managerOverride, setManagerOverride] = useState(false);
  const [splitBillMode, setSplitBillMode] = useState(false);
  const [splitBillCount, setSplitBillCount] = useState(2);
  const [_cartItemSplits, setCartItemSplits] = useState({});
  const [showPosKitchenQueue, setShowPosKitchenQueue] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);
  const [priceOverrideModal, setPriceOverrideModal] = useState({ open: false, item: null, newPrice: "", reason: "", notes: "" });
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [paymentResetKey, setPaymentResetKey] = useState(0);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptOptions, setReceiptOptions] = useState({ type: "print", email: "", phone: "", customFooter: "" });
  const updateReceiptOption = useCallback((key, val) => setReceiptOptions(prev => ({ ...prev, [key]: val })), []);
  const [toast, setToast] = useState(null);
  const [stockWarningModal, setStockWarningModal] = useState(null);
  const [modifierModal, setModifierModal] = useState({ open: false, item: null });
  const [orderNotesModal, setOrderNotesModal] = useState(false);
  const [orderNotesDraft, setOrderNotesDraft] = useState("");
  const [itemNotesModal, setItemNotesModal] = useState({ open: false, item: null, draft: "" });
  const [refundVoidModal, setRefundVoidModal] = useState({ open: false, type: "void", orderId: null, reason: "", notes: "" });
  const [showKitchenStatusPanel, setShowKitchenStatusPanel] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const availableTables = useMemo(() => tables || INIT_TABLES, [tables]);
  const availableCustomers = useMemo(() => customers || [], [customers]);
  const _availableDiscounts = discounts || [];

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const customerOrders = useMemo(() => {
    if (!customerPhone.trim()) return [];
    return orders
      .filter(o => o.customerPhone === customerPhone.trim() && o.status === "COMPLETED")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [orders, customerPhone]);

  const reorderItems = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) return;
    setCart(prev => {
      const next = [...prev.items];
      items.forEach(it => {
        const itemId = it.menuItemId || it.id;
        const idx = next.findIndex(c => c.id === itemId);
        if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + (it.qty || 1) };
        else next.push({ id: itemId, menuItemId: itemId, name: it.name, qty: it.qty || 1, price: it.price || 0, category: it.category, modifiers: it.modifiers || [], notes: "" });
      });
      return { ...prev, items: next };
    });
    showToast("Items added from previous order");
  }, [showToast]);

  // ── Cart calculations ─────────────────────────────────────────────────────
  const cartTotals = useMemo(() => calculateCartTotals({
    items: cart.items,
    discountInput,
    discountMode,
    packagingCharge,
    taxRate: 0.18
  }), [cart.items, discountInput, discountMode, packagingCharge]);

  const { subtotal: cartSubtotal, taxAmount: cartTax, cgst: cartCgst, sgst: cartSgst, discountAmount: cartDiscount, packagingAmount: cartPackaging, total: cartTotal } = cartTotals;
  const activeCartTotal = splitBillMode ? Math.ceil(cartTotal / splitBillCount) : cartTotal;


  // ── Cart operations ───────────────────────────────────────────────────────
  const addToCart = useCallback((menuItem) => {
    if (!menuItem.active || menuItem.eightySixed) { showToast(`${menuItem.name} is not available`, "error"); return; }
    setCart(prev => {
      const existing = prev.items.find(i => i.id === menuItem.id);
      if (existing) return { ...prev, items: prev.items.map(i => i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i) };
      return { ...prev, items: [...prev.items, { id: menuItem.id, menuItemId: menuItem.id, name: menuItem.name, qty: 1, price: Number.isFinite(menuItem.price) ? menuItem.price : 0, category: menuItem.cat, modifiers: [], notes: "" }] };
    });
  }, [showToast]);

  const updateCartQty = useCallback((itemId, delta) => {
    setCart(prev => {
      const items = prev.items.map(i => {
        if (i.id !== itemId) return i;
        const next = (i.qty || 1) + delta;
        return next <= 0 ? null : { ...i, qty: next };
      }).filter(Boolean);
      return { ...prev, items };
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  }, []);

  const updateCartItemNotes = useCallback((itemId, notes) => {
    const safe = String(notes || "").trim().slice(0, ITEM_NOTES_MAX);
    setCart(prev => ({ ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, notes: safe } : i) }));
  }, []);

  const openItemNotesModal = useCallback((item) => {
    setItemNotesModal({ open: true, item, draft: item?.notes || "" });
  }, []);

  const closeItemNotesModal = useCallback(() => {
    setItemNotesModal({ open: false, item: null, draft: "" });
  }, []);

  const applyItemNotes = useCallback(() => {
    if (!itemNotesModal.item) return;
    updateCartItemNotes(itemNotesModal.item.id, itemNotesModal.draft);
    closeItemNotesModal();
  }, [itemNotesModal, updateCartItemNotes, closeItemNotesModal]);

  const applyModifiers = useCallback((itemId, modifiers) => {
    setCart(prev => ({ ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, modifiers } : i) }));
  }, []);

  const toggleModifier = useCallback((itemId, categoryKey, optionId) => {
    setSelectedModifiers(prev => {
      const itemMods = prev[itemId] || {};
      const current = itemMods[categoryKey];
      const currentArr = Array.isArray(current) ? current : (current ? [current] : []);
      const next = currentArr.includes(optionId) ? currentArr.filter(id => id !== optionId) : [...currentArr, optionId];
      return { ...prev, [itemId]: { ...itemMods, [categoryKey]: next } };
    });
  }, []);

  const buildModifiersList = useCallback((categoryModifiers) => {
    const list = [];
    Object.entries(categoryModifiers || {}).forEach(([categoryKey, val]) => {
      const category = MODIFIER_CATEGORIES[categoryKey];
      if (!category) return;
      const ids = Array.isArray(val) ? val : (val ? [val] : []);
      ids.forEach(optionId => {
        const option = category.options.find(o => o.id === optionId);
        if (option) list.push({ id: option.id, name: option.name, price: option.price || 0 });
      });
    });
    return list;
  }, []);

  const clearCart = useCallback(() => {
    setCart({ items: [] });
    setDiscountInput("");
    setPackagingCharge("");
    setSelectedModifiers({});
    setOrderNotes("");
    setCartItemSplits({});
    setPaymentResetKey(k => k + 1); // remounts PaymentPanel, clearing its state
  }, []);

  const _setItemSplit = useCallback((itemId, splitNumber) => {
    if (itemId === null) { setCartItemSplits({}); return; }
    setCartItemSplits(prev => {
      const next = { ...prev };
      if (splitNumber == null) delete next[itemId];
      else next[itemId] = splitNumber;
      return next;
    });
  }, []);

  // ── Held bills ────────────────────────────────────────────────────────────
  const holdBill = useCallback(() => {
    if (!cart.items.length) return;
    const held = {
      id: `hold-${Date.now()}`,
      cart: cart.items,
      orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax,
      discountInput, discountMode, packagingCharge, orderNotes,
      savedAt: Date.now(),
    };
    setHeldOrders(prev => [...prev, held]);
    clearCart();
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    showToast("Bill held");
  }, [cart.items, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, clearCart, showToast]);

  const resumeHeldBill = useCallback((id) => {
    const held = heldOrders.find(h => h.id === id);
    if (!held) return;

    // If current cart has items, auto-hold it first before resuming
    if (cart.items.length > 0) {
      const currentHeld = {
        id: `hold-${Date.now()}`,
        cart: cart.items,
        orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax,
        discountInput, discountMode, packagingCharge, orderNotes,
        savedAt: Date.now(),
      };
      setHeldOrders(prev => [...prev.filter(h => h.id !== id), currentHeld]);
    } else {
      setHeldOrders(prev => prev.filter(h => h.id !== id));
    }

    setCart({ items: held.cart });
    setOrderType(held.orderType);
    setSelectedTable(held.selectedTable);
    setCustomerPhone(held.customerPhone);
    setCustomerAddress(held.customerAddress);
    setPlatformOrderId(held.platformOrderId);
    setPax(held.pax);
    setDiscountInput(held.discountInput);
    setDiscountMode(held.discountMode);
    setPackagingCharge(held.packagingCharge);
    setOrderNotes(held.orderNotes || "");
    setPaymentResetKey(k => k + 1);
    showToast(cart.items.length > 0 ? "Swapped orders — current held" : "Order resumed");
  }, [heldOrders, cart.items, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, showToast]);

  const discardHeldBill = useCallback((id) => {
    setHeldOrders(prev => prev.filter(h => h.id !== id));
    showToast("Held bill discarded");
  }, [showToast]);

  // ── Price override ───────────────────────────────────────────────────────
  const openPriceOverrideModal = useCallback((item) => {
    setPriceOverrideModal({ open: true, item, newPrice: String(item.price), reason: "", notes: "" });
  }, []);

  const closePriceOverrideModal = useCallback(() => {
    setPriceOverrideModal({ open: false, item: null, newPrice: "", reason: "", notes: "" });
  }, []);

  const applyPriceOverride = useCallback(() => {
    const { item, newPrice, reason } = priceOverrideModal;
    const override = Number(newPrice);
    if (!item || !reason || newPrice === "" || !Number.isFinite(override) || override < 0) return;
    setCart(prev => ({ ...prev, items: prev.items.map(i => i.id === item.id ? { ...i, overridePrice: override, overrideReason: reason } : i) }));
    showToast("Price overridden");
    closePriceOverrideModal();
  }, [priceOverrideModal, showToast, closePriceOverrideModal]);

  // ── Order submission ──────────────────────────────────────────────────────
  const validateOrder = () => {
    if (!cart.items.length) return "Cart is empty";
    if (!ORDER_TYPES.includes(orderType)) return "Please select a valid order type";
    if (orderType === "DINE_IN" && !selectedTable) return "Please select a table for dine-in";
    if (orderType === "DIRECT_DELIVERY") {
      if (!customerPhone.trim()) return "Customer phone is required for delivery";
      if (!customerAddress.trim()) return "Delivery address is required";
    }
    if ((orderType === "SWIGGY" || orderType === "ZOMATO") && !platformOrderId.trim())
      return `Platform order ID is required for ${orderType === "SWIGGY" ? "Swiggy" : "Zomato"} orders`;
    return null;
  };

  const finalizeOrderCreation = useCallback((newOrder) => {
    // Deduct inventory
    if (inventory && setInventory && !newOrder.inventoryDeducted) {
      try {
        const { updatedInventory } = deductInventoryForOrder(newOrder, inventory, BASIC_RECIPES);
        setInventory(updatedInventory);
        newOrder.inventoryDeducted = true;
      } catch (e) { devWarn("Inventory deduction failed:", e); }
    }

    // KDS tickets
    try {
      const hasStationItems = newOrder.items?.some(it => it?.station);
      const alreadyHasTickets = (kdsCards || []).some(c => c.orderId === newOrder.id);
      if (hasStationItems && !alreadyHasTickets) {
        const tickets = createKdsTicketsFromOrder(newOrder);
        if (tickets?.length && setKdsCards) setKdsCards([...tickets, ...(kdsCards || [])]);
      }
    } catch (e) { devWarn("KDS failed:", e); }

    // Mark table occupied
    if (orderType === "DINE_IN" && selectedTable && setTables) {
      try {
        const table = availableTables.find(t => t.id === selectedTable);
        if (table) setTables(availableTables.map(t => t.id === selectedTable ? markTableOccupied({ ...table }, newOrder.id) : t));
      } catch (e) { devWarn("Table mark failed:", e); }
    }

    // Customer linking
    if (customerPhone.trim() && setCustomers) {
      try {
        const existing = availableCustomers.find(c => c.phone === customerPhone.trim());
        const customer = getOrCreateCustomerFromOrder(newOrder, availableCustomers);
        if (!existing && customer && !availableCustomers.find(c => c.id === customer.id))
          setCustomers([...availableCustomers, customer]);
      } catch (e) { devWarn("Customer link failed:", e); }
    }

    setOrders([newOrder, ...orders]);
    clearCart();
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    if (isMobile) setPosMobileTab("menu");
    setReceiptOrder(newOrder);
    setShowReceipt(true);
    showToast("Order created! 🎉");
  }, [inventory, setInventory, kdsCards, setKdsCards, orderType, selectedTable, setTables, availableTables, customerPhone, setCustomers, availableCustomers, orders, setOrders, clearCart, showToast, isMobile]);

  const placeOrder = useCallback(() => {
    if (isPlacingOrder) return;
    const err = validateOrder();
    if (err) { showToast(err, "error"); return; }

    // Disable button IMMEDIATELY before any async operations
    setIsPlacingOrder(true);
    try {
      const orderItems = cart.items.map(item => ({
        id: item.id, menuItemId: item.menuItemId, name: item.name, qty: item.qty,
        price: Number.isFinite(item.price) ? item.price : 0, modifiers: item.modifiers || [],
        station: item.category === "Coffee" ? "Bar" : "Kitchen",
        notes: item.notes || ""
      }));

      // Better stock check with proper error handling
      let stockCheck;
      try { stockCheck = canFulfillOrder({ items: orderItems }, inventory || [], BASIC_RECIPES); }
      catch (e) { 
        devWarn("Stock check failed:", e);
        stockCheck = { canFulfill: true, missingItems: [] }; 
      }

      if (!stockCheck.canFulfill) {
        setStockWarningModal({ missingItems: stockCheck.missingItems || [], orderItems });
        showToast("Order blocked: insufficient stock", "error");
        setIsPlacingOrder(false);  // Re-enable button
        return;
      }

      // Calculate totals inline to avoid stale closure
      const calculatedSubtotal = cart.items.reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        return sum + (qty * price);
      }, 0);
      
      const calculatedTax = Math.round(calculatedSubtotal * 0.18 * 100) / 100;
      const calculatedDiscount = discountMode === "percent" 
        ? Math.round(calculatedSubtotal * (Number(discountInput) || 0) / 100 * 100) / 100
        : Math.min(Math.round(Number(discountInput) || 0 * 100) / 100, calculatedSubtotal);
      const calculatedTotal = Math.round((calculatedSubtotal + calculatedTax - calculatedDiscount + (Number(packagingCharge) || 0)) * 100) / 100;

      const newOrder = createOrder({
        source: sourceMap[orderType], orderType,
        customerName: customerPhone ? "Guest" : "Walk-in Customer",
        customerPhone: customerPhone || "",
        customerAddress: orderType === "DIRECT_DELIVERY" ? (customerAddress || "") : undefined,
        platformOrderId: (orderType === "SWIGGY" || orderType === "ZOMATO") ? (platformOrderId || "").trim() : undefined,
        tableId: orderType === "DINE_IN" ? selectedTable : null,
        partySize: orderType === "DINE_IN" ? pax : undefined,
        items: orderItems,
        subtotal: calculatedSubtotal, 
        discountAmount: calculatedDiscount, 
        taxAmount: calculatedTax,
        packagingAmount: Number(packagingCharge) || 0, 
        total: calculatedTotal,
        paymentStatus: (paymentBreakdown.length > 1) ? "PARTIAL" : (paymentBreakdown.length === 1 && paymentBreakdown[0].method === "COD") ? "COD" : "PAID",
        paymentMethod: paymentBreakdown.length > 1 ? "SPLIT" : (paymentBreakdown[0]?.method || "CASH"),
        paymentBreakdown: paymentBreakdown || [],
        notes: (orderNotes || "").trim().slice(0, ORDER_NOTES_MAX),
        createdBy: "local-user"
      });
      finalizeOrderCreation(newOrder);
    } catch (e) {
      devWarn("Order creation failed:", e);
      showToast("Order failed — please try again", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [isPlacingOrder, cart.items, inventory, kdsCards, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, paymentBreakdown, availableTables, availableCustomers, orders, clearCart, showToast, isMobile]);

  const confirmOrderWithOverride = useCallback(() => {
    if (isPlacingOrder || !stockWarningModal) return;
    setIsPlacingOrder(true);
    try {
      const { orderItems } = stockWarningModal;
      
      // Calculate totals inline
      const calculatedSubtotal = orderItems.reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        return sum + (qty * price);
      }, 0);
      
      const calculatedTax = Math.round(calculatedSubtotal * 0.18 * 100) / 100;
      const calculatedDiscount = discountMode === "percent" 
        ? Math.round(calculatedSubtotal * (Number(discountInput) || 0) / 100 * 100) / 100
        : Math.min(Math.round(Number(discountInput) || 0 * 100) / 100, calculatedSubtotal);
      const calculatedTotal = Math.round((calculatedSubtotal + calculatedTax - calculatedDiscount + (Number(packagingCharge) || 0)) * 100) / 100;

      const newOrder = createOrder({
        source: sourceMap[orderType], orderType,
        customerName: customerPhone ? "Guest" : "Walk-in Customer",
        customerPhone: customerPhone || "",
        customerAddress: orderType === "DIRECT_DELIVERY" ? (customerAddress || "") : undefined,
        platformOrderId: (orderType === "SWIGGY" || orderType === "ZOMATO") ? (platformOrderId || "").trim() : undefined,
        tableId: orderType === "DINE_IN" ? selectedTable : null,
        items: orderItems,
        subtotal: calculatedSubtotal, 
        discountAmount: calculatedDiscount, 
        taxAmount: calculatedTax,
        packagingAmount: Number(packagingCharge) || 0, 
        total: calculatedTotal,
        paymentStatus: (paymentBreakdown.length > 1) ? "PARTIAL" : (paymentBreakdown.length === 1 && paymentBreakdown[0].method === "COD") ? "COD" : "PAID",
        paymentMethod: paymentBreakdown.length > 1 ? "SPLIT" : (paymentBreakdown[0]?.method || "CASH"),
        paymentBreakdown: paymentBreakdown || [],
        notes: `${(orderNotes || "").trim().slice(0, 400)} [MANAGER OVERRIDE: LOW STOCK]`.trim(),
        createdBy: "local-user"
      });
      setStockWarningModal(null);
      finalizeOrderCreation(newOrder);
    } catch (_e) {
      showToast("Order failed — please try again", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [isPlacingOrder, stockWarningModal, cartSubtotal, cartDiscount, cartTax, cartTotal, paymentBreakdown, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, showToast]);

  // ── Active orders helpers ─────────────────────────────────────────────────
  const isStatusFilter = f => STATUS_FILTERS.includes(f);
  const isSrcFilter = f => SOURCE_FILTERS.slice(1).includes(f);

  const counts = useMemo(() => {
    const c = {};
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders || [];
    if (filter !== "ALL") {
      if (isStatusFilter(filter)) result = result.filter(o => o?.status === filter);
      else if (isSrcFilter(filter)) result = result.filter(o => o?.source === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(o => {
        if (!o) return false;
        let name = "", items = "";
        try { name = (getOrderCustomerName(o) || "").toLowerCase(); } catch (_e) { /* non-fatal */ }
        try { items = (getOrderDisplayItems(o) || "").toLowerCase(); } catch (_e) { /* non-fatal */ }
        const id = typeof o.id === "string" ? o.id.toLowerCase() : "";
        return name.includes(q) || id.includes(q) || (o.customerPhone || "").includes(q) || items.includes(q);
      });
    }
    return result.slice();
  }, [orders, filter, search]);

  const toggleSelect = useCallback(id => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const applyStatusSideEffects = useCallback((order, nextStatus) => {
    let updated;
    try { updated = updateOrderStatus(order, nextStatus); }
    catch { updated = { ...order, status: nextStatus }; }
    updated = { ...updated, updatedAt: new Date().toISOString() };
    if (nextStatus === "COMPLETED" && !updated.completedAt) updated.completedAt = new Date().toISOString();
    if (nextStatus === "CANCELLED" && !updated.cancelledAt) { updated.cancelledAt = new Date().toISOString(); updated.cancelledReason = updated.cancelledReason || "Cancelled from Orders"; }

    if (order.tableId && ["COMPLETED", "CANCELLED"].includes(nextStatus) && setTables) {
      try { const t = availableTables.find(t => t.id === order.tableId); if (t) setTables(availableTables.map(x => x.id === order.tableId ? markTableAvailable({ ...t }) : x)); } catch (_e) { /* non-fatal */ }
    }
    if (nextStatus === "CANCELLED" && order.inventoryDeducted && inventory && setInventory) {
      try { const r = restoreInventoryForCancelledOrder(order, inventory, BASIC_RECIPES); if (r) { setInventory(r); updated.inventoryDeducted = false; } } catch (_e) { /* non-fatal */ }
    }
    if (nextStatus === "COMPLETED" && order.customerPhone && setCustomers) {
      try { const ex = availableCustomers.find(c => c.phone === order.customerPhone); if (ex) setCustomers(availableCustomers.map(c => c.id === ex.id ? updateCustomerAfterOrder(ex, updated) : c)); } catch (_e) { /* non-fatal */ }
    }
    return updated;
  }, [availableTables, setTables, inventory, setInventory, availableCustomers, setCustomers]);

  const updateStatus = useCallback((id, status) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (["COMPLETED", "CANCELLED"].includes(o.status)) return o;
      const isForward = STATUS_FLOW[o.status] === status;
      const isCancel = status === "CANCELLED";
      if (!isForward && !isCancel) return o;
      return applyStatusSideEffects(o, status);
    }));
    if (status === "COMPLETED") showToast("Order completed");
    else if (status === "CANCELLED") showToast("Order cancelled");
  }, [setOrders, applyStatusSideEffects, showToast]);

  const openVoidModal = useCallback(order => {
    if (!order || ["COMPLETED", "CANCELLED"].includes(order.status)) return;
    setRefundVoidModal({ open: true, type: "void", orderId: order.id, reason: "", notes: "" });
  }, []);

  const openRefundModal = useCallback(order => {
    if (!order || order.status !== "COMPLETED" || order.paymentStatus === "REFUNDED") return;
    setRefundVoidModal({ open: true, type: "refund", orderId: order.id, reason: "", notes: "" });
  }, []);

  const closeRefundVoidModal = useCallback(() => {
    setRefundVoidModal({ open: false, type: "void", orderId: null, reason: "", notes: "" });
  }, []);

  const processRefundVoid = useCallback(() => {
    const { type, orderId, reason, notes } = refundVoidModal;
    if (!orderId || !reason) return;
    if (type === "void") {
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId || ["COMPLETED", "CANCELLED"].includes(o.status)) return o;
        const updated = applyStatusSideEffects(o, "CANCELLED");
        return { ...updated, cancelledReason: reason, cancelledNotes: notes };
      }));
      showToast("Order voided");
    } else {
      setOrders(prev => prev.map(o => o.id === orderId
        ? { ...o, paymentStatus: "REFUNDED", refundReason: reason, refundNotes: notes, refundedAt: new Date().toISOString() }
        : o));
      showToast("Refund processed");
    }
    closeRefundVoidModal();
  }, [refundVoidModal, applyStatusSideEffects, setOrders, showToast, closeRefundVoidModal]);

  const advanceSelected = useCallback(() => {
    if (!selected.size) return;
    let moved = 0;
    setOrders(prev => prev.map(o => {
      if (!selected.has(o.id)) return o;
      const next = STATUS_FLOW[o.status];
      if (!next || ["COMPLETED", "CANCELLED"].includes(o.status)) return o;
      moved++;
      return applyStatusSideEffects(o, next);
    }));
    setSelected(new Set());
    showToast(moved > 0 ? `Advanced ${moved} order${moved !== 1 ? "s" : ""}` : "No eligible orders");
  }, [selected, setOrders, applyStatusSideEffects, showToast]);

  const cancelSelected = useCallback(() => {
    if (!selected.size) return;
    if (!window.confirm(`Cancel ${selected.size} order(s)?`)) return;
    let n = 0;
    setOrders(prev => prev.map(o => {
      if (!selected.has(o.id) || !["NEW", "ACCEPTED", "PREPARING"].includes(o.status)) return o;
      n++;
      return applyStatusSideEffects(o, "CANCELLED");
    }));
    setSelected(new Set());
    showToast(n > 0 ? `Cancelled ${n} order${n !== 1 ? "s" : ""}` : "No eligible orders");
  }, [selected, setOrders, applyStatusSideEffects, showToast]);

  const activeCount = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status)).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes toastUp { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
        .orders-mode-btn:hover { opacity: 0.85; }
        .orders-row:hover { background: rgba(255,255,255,0.02) !important; }
        
        @media (max-width: 600px) {
          .orders-list-row { flex-wrap: wrap !important; gap: 12px 8px !important; }
          .orders-list-meta { order: 1; flex: 1 1 60% !important; min-width: 0 !important; }
          .orders-list-amount { order: 2; flex: 0 0 auto !important; text-align: right !important; }
          .orders-list-status { order: 3; flex: 1 1 auto !important; justify-content: flex-start !important; min-width: 0 !important; }
          .orders-list-actions { order: 4; flex: 0 0 auto !important; justify-content: flex-end !important; }
        }
      `}</style>

      {/* Premium Mode Toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.bg3, borderRadius: 14, padding: 5, border: `1px solid ${C.border}` }}>
        {[
          { id: "active", label: "Live Orders", icon: "📋", badge: activeCount > 0 ? activeCount : null },
          { id: "pos", label: "New Order", icon: "➕", badge: cart.items.length > 0 ? cart.items.length : null },
        ].map(({ id, label: lbl, icon, badge }) => (
          <button key={id} className="orders-mode-btn" onClick={() => setMode(id)} style={{
            flex: 1, padding: "11px 16px", borderRadius: 10, border: "none",
            background: mode === id ? `linear-gradient(135deg, ${C.amberDim} 0%, ${C.bg2} 100%)` : "transparent",
            color: mode === id ? C.amber2 : C.text3,
            fontSize: 13, fontWeight: mode === id ? 700 : 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all .2s",
            boxShadow: mode === id ? `0 0 0 1px ${C.amber3}, 0 4px 12px rgba(212,146,42,0.15)` : "none",
          }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {lbl}
            {badge !== null && <span style={{
              background: mode === id ? C.amber3 : C.bg4,
              color: mode === id ? "#1a1208" : C.text3,
              fontSize: 10, fontFamily: "monospace", fontWeight: 800,
              padding: "2px 7px", borderRadius: 20, minWidth: 20, textAlign: "center"
            }}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 24, background: C.bg2, border: `1px solid ${toast.type === "error" ? C.red : C.green}`, borderRadius: 40, padding: "12px 20px 12px 16px", color: C.text, fontSize: 13, fontWeight: 600, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, boxShadow: `0 8px 32px rgba(0,0,0,.15), 0 0 0 1px ${toast.type === "error" ? C.redBorder : C.greenBorder}`, animation: "toastUp 0.22s cubic-bezier(.22,.68,0,1.3)", maxWidth: 340 }}>
          <span style={{ fontSize: 16, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: toast.type === "error" ? C.redBg : C.greenBg, color: toast.type === "error" ? C.red : C.green }}>{toast.type === "error" ? "✕" : "✓"}</span>
          <span style={{ color: toast.type === "error" ? C.red : C.green }}>{toast.message}</span>
        </div>
      )}

      {/* ── ACTIVE ORDERS ──────────────────────────────────────────────────── */}
      {mode === "active" ? (
        <>
          {/* Premium Summary Metrics */}
          {(() => {
            const activeOrders = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status));
            const needAction = (counts["NEW"] || 0) + (counts["READY"] || 0);
            const paidOrders = orders.filter(o => o.status !== "CANCELLED");
            const revenue = paidOrders.reduce((s, o) => s + getOrderAmount(o), 0);
            const avg = Math.round(revenue / Math.max(1, paidOrders.length));
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
                {[
                  { icon: "🍽", label: "In Kitchen", val: activeOrders.length, sub: "active orders", color: C.amber2, glow: C.amberDim, urgent: false },
                  { icon: "⚡", label: "Need Action", val: needAction, sub: needAction > 0 ? "waiting now" : "all caught up", color: needAction > 0 ? C.red : C.green, glow: needAction > 0 ? C.redBg : C.greenBg, urgent: needAction > 0 },
                  { icon: "💰", label: "Revenue", val: "₹" + revenue.toLocaleString(), sub: `${paidOrders.length} orders`, color: C.green, glow: C.greenBg, urgent: false },
                  { icon: "📊", label: "Avg Order", val: "₹" + avg.toLocaleString(), sub: "per ticket", color: C.blue, glow: C.blueBg, urgent: false },
                ].map(m => (
                  <div key={m.label} style={{
                    background: C.bg2,
                    border: `1px solid ${m.urgent ? C.redBorder : C.border}`,
                    borderRadius: 14, padding: "16px 16px 14px",
                    boxShadow: `0 4px 12px ${m.glow}`,
                    animation: m.urgent ? "pulse 1.5s infinite" : "none"
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: m.color, lineHeight: 1, letterSpacing: "-0.03em" }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: C.text2, fontWeight: 700, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Peak SOP Alerts */}
          {(() => {
            const sops = PEAK_SOP.filter(s => counts[s.stat] >= s.threshold);
            if (!sops.length) return null;
            return (
              <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {sops.map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 9, background: s.level === "alert" ? C.redBg : C.amberBg, border: `1px solid ${s.level === "alert" ? C.redBorder : C.amberBorder}` }}>
                    <span style={{ fontSize: 15 }}>{s.level === "alert" ? "🔴" : "🟡"}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.level === "alert" ? C.red : C.amber, marginRight: 8 }}>{s.label}</span>
                      <span style={{ fontSize: 11, color: C.text2 }}>{s.msg}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{counts[s.stat]} / {s.threshold}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Filters */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: "max-content" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", background: C.bg3, borderRadius: 8, padding: 4, gap: 4, marginRight: 8 }}>
                    <button onClick={() => setViewMode("cards")} style={{ ...btn(viewMode === "cards" ? "primary" : "ghost"), padding: "8px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} title="Cards View">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <button onClick={() => setViewMode("list")} style={{ ...btn(viewMode === "list" ? "primary" : "ghost"), padding: "8px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} title="List View">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
                    <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button onClick={() => setFilter("ALL")} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${filter === "ALL" ? C.amber3 : C.border2}`, background: filter === "ALL" ? C.amberDim : C.bg3, color: filter === "ALL" ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 44 }}>
                    All <span style={{ background: C.bg4, color: C.text3, fontSize: 10, padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>{orders.length}</span>
                  </button>
                  {STATUS_FILTERS.concat(SOURCE_FILTERS.slice(1)).map(f => {
                    const active = filter === f;
                    const count = isStatusFilter(f) ? orders.filter(o => o.status === f).length : orders.filter(o => o.source === f).length;
                    if (count === 0 && !active) return null;
                    return (
                      <button key={f} onClick={() => setFilter(f)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${active ? C.amber3 : C.border2}`, background: active ? C.amberDim : C.bg3, color: active ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 44 }}>
                        {f === "WALK_IN" ? "Walk-in" : f === "DIRECT_DELIVERY" ? "Delivery" : f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, " ")}
                        {count > 0 && <span style={{ background: C.bg4, color: C.text3, fontSize: 10, padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace", fontWeight: 700 }}>{selected.size} order{selected.size !== 1 ? "s" : ""} selected</span>
              <button style={{ ...btn("primary"), fontSize: 12, padding: "8px 14px" }} onClick={advanceSelected}>Advance all</button>
              <button style={{ ...btn("danger"), fontSize: 12 }} onClick={cancelSelected}>Cancel all</button>
              <button style={{ ...btn("ghost"), fontSize: 12, marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Deselect</button>
            </div>
          )}

          {/* Live Orders List / Grid */}
          <div style={{ 
            display: viewMode === "cards" ? "grid" : "flex", 
            flexDirection: viewMode === "cards" ? "row" : "column",
            gridTemplateColumns: viewMode === "cards" ? "repeat(auto-fill, minmax(320px, 1fr))" : "none",
            gap: viewMode === "cards" ? 16 : 6 
          }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "56px 24px", borderRadius: 16, background: C.bg2, border: `1px dashed ${C.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🍽</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text2, marginBottom: 6 }}>
                  {search.trim() ? `No orders matching "${search}"` : filter !== "ALL" ? `No ${filter.toLowerCase().replace(/_/g, " ")} orders` : "All quiet right now"}
                </div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
                  {search.trim() ? "Try a different search" : filter !== "ALL" ? "Switch to All to see everything" : "Ready to take the first order?"}
                </div>
                {!search.trim() && filter === "ALL" && (
                  <button onClick={() => setMode("pos")} style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.amber} 0%, ${C.amber2} 100%)`, color: "#1a0e00", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${C.amberDim}` }}>
                    ➕ Take New Order
                  </button>
                )}
              </div>
            )}
            {filtered.map(o => {
              const sc = STATUS_COLORS[o.status] || {};
              const src = SRC_COLORS[o.source] || {};
              const expanded = expandedId === o.id;
              const nextStatus = STATUS_FLOW[o.status];
              const timeElapsed = getMinutesElapsed(o.createdAt);
              const isOld = !["COMPLETED", "CANCELLED"].includes(o.status) && timeElapsed > 15;
              const isDone = ["COMPLETED", "CANCELLED"].includes(o.status);
              
              // Customer Avatar Logic
              const customerName = getOrderCustomerName(o) || "Walk In";
              const initials = customerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "W";
              
              // Progress Logic
              const maxTime = 20; // 20 mins max expected
              const progressPct = Math.min(100, (timeElapsed / maxTime) * 100);
              const progressColor = timeElapsed > 15 ? C.red : timeElapsed > 10 ? C.amber : "#10b981";

              if (viewMode === "cards") {
                return (
                  <div key={o.id} className="orders-row" style={{
                    background: isOld ? "var(--cafe-danger-bg)" : "var(--cafe-bg-card)",
                    border: `1px solid ${isOld ? "var(--cafe-danger-border)" : expanded ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    transition: "all .3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    boxShadow: expanded ? "var(--cafe-shadow-lg)" : "var(--cafe-shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 220,
                    position: "relative"
                  }}>
                    {/* Top Progress Bar */}
                    {!isDone && (
                      <div style={{ height: 4, width: "100%", background: "var(--cafe-bg-surface)" }}>
                        <div style={{ height: "100%", width: `${progressPct}%`, background: progressColor, transition: "width 1s linear" }} />
                      </div>
                    )}
                    
                    {/* Header */}
                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.bg4, border: `2px solid ${src.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: C.text, flexShrink: 0, boxShadow: `0 0 10px ${src.bg}40` }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{customerName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ ...pill(src.bg, src.color), fontSize: 9 }}>{srcLabel(o.source)}</span>
                            {o.tableId && <span style={{ fontSize: 10, color: C.text2, background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Table {o.tableId}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: C.amber2 }}>₹{getOrderAmount(o)}</div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: isOld ? C.red : C.text3, fontWeight: 700, marginTop: 4 }}>
                          {timeElapsed} min ago
                        </div>
                      </div>
                    </div>

                    {/* Receipt Items Preview */}
                    <div style={{ flex: 1, padding: "0 20px", marginTop: 4, cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                      <div style={{ background: "var(--cafe-bg-surface)", borderRadius: 12, padding: "12px", border: `1px solid var(--cafe-border-light)`, maxHeight: expanded ? 400 : 70, overflow: "hidden", position: "relative" }}>
                        <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {getOrderDisplayItems(o).split(', ').map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontWeight: 600 }}>• {item.split(' x ')[1] || item}</span>
                              <span style={{ color: "var(--cafe-text-tertiary)" }}>x{item.split(' x ')[0] || "1"}</span>
                            </div>
                          ))}
                        </div>
                        {!expanded && (
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, var(--cafe-bg-surface))` }} />
                        )}
                      </div>
                      {o.notes && expanded && (
                        <div style={{ fontSize: 12, color: "var(--cafe-accent-dark)", marginTop: 10, background: "var(--cafe-accent-bg)", border: `1px dashed var(--cafe-accent-border)`, borderRadius: 8, padding: "8px 12px", fontWeight: 500 }}>
                          📝 {o.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ 
                      padding: "16px 20px", 
                      borderTop: `1px solid var(--cafe-border-light)`,
                      background: "var(--cafe-bg-elevated)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.color || "#555", boxShadow: `0 0 8px ${sc.color || "#555"}` }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: sc.color || C.text2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sc.label || o.status}</span>
                      </div>
                      
                      {nextStatus && !isDone && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(o.id, nextStatus); }}
                          style={{ 
                            padding: "10px 18px", 
                            borderRadius: 12, 
                            border: `1px solid ${sc.color || C.amber3}40`, 
                            background: `${sc.color || C.amber}20`, 
                            color: sc.color || C.amber2, 
                            fontSize: 13, 
                            fontWeight: 800, 
                            cursor: "pointer", 
                            transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)" 
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = sc.color || C.amber; e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "scale(1.05)"; }}
                          onMouseOut={e => { e.currentTarget.style.background = `${sc.color || C.amber}20`; e.currentTarget.style.color = sc.color || C.amber2; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          → {STATUS_FLOW_LABEL[o.status]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // List View Render
              return (
                <div key={o.id} className="orders-row" style={{
                  background: isOld ? "var(--cafe-danger-bg)" : expanded ? "var(--cafe-bg-surface)" : "var(--cafe-bg-card)",
                  border: `1px solid ${isOld ? "var(--cafe-danger-border)" : expanded ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                  borderRadius: 16, overflow: "hidden",
                  transition: "all .2s ease",
                  marginBottom: 8,
                  boxShadow: expanded ? "var(--cafe-shadow-md)" : "none",
                }}>
                  {/* Main row */}
                  <div className="orders-list-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <input type="checkbox" checked={selected.has(o.id)} onChange={e => { e.stopPropagation(); toggleSelect(o.id); }} style={{ accentColor: "var(--cafe-accent)", cursor: "pointer", width: 16, height: 16 }} />
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--cafe-bg-surface)", border: `1.5px solid ${src.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--cafe-text-primary)", flexShrink: 0 }}>
                        {initials}
                      </div>
                    </div>

                    {/* Customer + items */}
                    <div className="orders-list-meta" style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerName}</span>
                        <span style={{ ...pill(src.bg, src.color), fontSize: 9 }}>{srcLabel(o.source)}</span>
                        {o.tableId && <span style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-surface)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>T{o.tableId}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }}>{getOrderDisplayItems(o)}</div>
                    </div>

                    {/* Amount + time */}
                    <div className="orders-list-amount" style={{ textAlign: "right", flexShrink: 0, padding: "0 8px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "var(--cafe-accent)" }}>₹{getOrderAmount(o)}</div>
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: isOld ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", fontWeight: 700, marginTop: 2 }}>{timeElapsed}m{isOld ? " ⚠" : ""}</div>
                    </div>

                    {/* Status badge */}
                    <div className="orders-list-status" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 100, justifyContent: "flex-end" }}>
                      <span style={{ ...pill(sc.bg, sc.color, sc.border), fontSize: 10, fontWeight: 800 }}>{sc.label || o.status}</span>
                    </div>

                    {/* Quick advance button */}
                    <div className="orders-list-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {nextStatus && !isDone && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(o.id, nextStatus); }}
                          style={{ 
                            padding: "8px 14px", 
                            borderRadius: 10, 
                            border: `1px solid ${sc.color || C.amber3}40`, 
                            background: `${sc.color || C.amber}20`, 
                            color: sc.color || C.amber2, 
                            fontSize: 11, 
                            fontWeight: 800, 
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >→ {STATUS_FLOW_LABEL[o.status]}</button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : o.id); }} style={{ background: "none", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 12, cursor: "pointer", padding: "8px 4px" }}>
                        {expanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{ borderTop: `1px solid var(--cafe-border-light)`, padding: "20px", background: "var(--cafe-bg-elevated)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 20 }}>
                        {/* Order Items Section */}
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <span>🛒</span> Order Items
                          </div>
                          <div style={{ background: "var(--cafe-bg-surface)", borderRadius: 14, padding: "8px", border: `1px solid var(--cafe-border-light)`, display: "flex", flexDirection: "column", gap: 6 }}>
                            {Array.isArray(o.items) && o.items.length > 0 ? o.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 12px", background: "var(--cafe-bg-card)", borderRadius: 10, border: "1px solid var(--cafe-border-light)", boxShadow: "var(--cafe-shadow-sm)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--cafe-text-primary)" }}>{item.name}</span>
                                  <span style={{ color: "var(--cafe-text-primary)", fontWeight: 800, fontFamily: "monospace", fontSize: 14 }}>₹{item.price * (item.qty || 1)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
                                  <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                      <div style={{ color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>+ {item.modifiers.join(', ')}</div>
                                    )}
                                    {item.notes && (
                                      <div style={{ color: "var(--cafe-accent-dark)", background: "var(--cafe-accent-bg)", padding: "2px 6px", borderRadius: 4, display: "inline-block", width: "fit-content", fontSize: 11, fontWeight: 600 }}>📝 {item.notes}</div>
                                    )}
                                  </div>
                                  <span style={{ color: "var(--cafe-text-secondary)", fontWeight: 700, fontSize: 12, background: "var(--cafe-bg-elevated)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--cafe-border-light)" }}>Qty: {item.qty || 1}</span>
                                </div>
                              </div>
                            )) : (
                              <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--cafe-text-tertiary)", fontStyle: "italic" }}>No items</div>
                            )}
                          </div>
                          {o.notes && (
                            <div style={{ fontSize: 12, color: "var(--cafe-accent-dark)", marginTop: 12, background: "var(--cafe-accent-bg)", border: `1px dashed var(--cafe-accent-border)`, borderRadius: 10, padding: "12px 16px", fontWeight: 500, display: "flex", gap: 10 }}>
                              <span style={{ fontSize: 16 }}>📝</span>
                              <span>{o.notes}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Metadata & Actions Section */}
                        <div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <span>📋</span> Fulfillment Details
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                              o.tableId && ["Table / Spot", `Table ${o.tableId}`, "🪑"],
                              o.customerPhone && ["Phone", o.customerPhone, "📞"],
                              o.customerAddress && ["Delivery Address", o.customerAddress, "📍"],
                              ["Payment Method", o.paymentBreakdown?.length > 1 ? "Split Payment" : (o.paymentMethod || "Pending"), "💰"],
                              o.discountAmount > 0 && ["Applied Discount", `-₹${o.discountAmount}`, "🏷️"],
                            ].filter(Boolean).map(([k, v, icon]) => (
                              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{ fontSize: 16, background: "var(--cafe-bg-card)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, boxShadow: "var(--cafe-shadow-sm)", border: "1px solid var(--cafe-border-light)" }}>{icon}</span>
                                  <span style={{ color: "var(--cafe-text-secondary)", fontSize: 12, fontWeight: 700 }}>{k}</span>
                                </div>
                                <span style={{ color: "var(--cafe-text-primary)", fontWeight: 800, fontSize: 13 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid var(--cafe-border-light)` }}>
                        {nextStatus && (
                          <button 
                            onClick={e => { e.stopPropagation(); updateStatus(o.id, nextStatus); }} 
                            style={{ 
                              ...btn("primary"), 
                              height: 42, 
                              fontSize: 14, 
                              padding: "0 24px",
                              boxShadow: "var(--cafe-shadow-md)" 
                            }}
                          >
                            → {STATUS_FLOW_LABEL[o.status]}
                          </button>
                        )}
                        {["NEW", "ACCEPTED", "PREPARING"].includes(o.status) && (
                          <button 
                            onClick={e => { e.stopPropagation(); openVoidModal(o); }} 
                            style={{ ...btn("danger"), height: 42, fontSize: 13, padding: "0 16px" }}
                          >
                            Void Order
                          </button>
                        )}
                        {o.paymentStatus === "COD" && o.status === "COMPLETED" && (
                          <button 
                            onClick={e => { e.stopPropagation(); setOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: "PAID", updatedAt: new Date().toISOString() } : x)); showToast("Payment collected"); }} 
                            style={{ ...btn("success"), height: 42, fontSize: 13, padding: "0 16px" }}
                          >
                            Collect Cash
                          </button>
                        )}
                        {o.status === "COMPLETED" && o.paymentStatus === "PAID" && (
                          <button 
                            onClick={e => { e.stopPropagation(); openRefundModal(o); }} 
                            style={{ 
                              ...btn("ghost"), 
                              height: 42, 
                              fontSize: 13, 
                              padding: "0 16px",
                              border: `1px solid var(--cafe-accent-border)`, 
                              color: "var(--cafe-accent)" 
                            }}
                          >
                            💰 Refund Ticket
                          </button>
                        )}
                        <button 
                          onClick={e => { e.stopPropagation(); setReceiptOrder(o); setShowReceipt(true); }} 
                          style={{ 
                            ...btn("ghost"), 
                            height: 42, 
                            fontSize: 13, 
                            padding: "0 20px",
                            marginLeft: "auto",
                            background: "var(--cafe-bg-surface)" 
                          }}
                        >
                          🖨 Print Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ── POS MODE ────────────────────────────────────────────────────── */
        <>
          <style>{`
            /* ─── Desktop layout ─── */
            @media (min-width: 701px) {
              .pos-layout { display: grid; grid-template-columns: 180px 1fr 320px; gap: 12px; height: calc(100dvh - 160px); min-height: 0; }
              .pos-mobile-tab-bar { display: none !important; }
              .pos-mobile-header  { display: none !important; }
              .pos-place-order-bar { position: static; padding: 0; background: transparent; border-top: none; }
            }
            @media (max-width: 900px) and (min-width: 701px) {
              .pos-layout { grid-template-columns: 1fr 280px !important; }
              .pos-categories { display: none !important; }
            }
            /* ─── Mobile layout ≤700px ─── */
            @media (max-width: 700px) {
              .pos-layout { display: block; height: auto; }
              .pos-categories { display: none !important; }
              /* Cart screen: full-page fixed sheet */
              .pos-cart-screen {
                position: fixed; inset: 0; z-index: 200;
                display: flex; flex-direction: column;
                background: #111; overflow: hidden;
              }
              .pos-cart-scroll {
                flex: 1; overflow-y: auto; padding: 12px 14px 100px;
              }
              /* Sticky header inside cart screen */
              .pos-mobile-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 14px 16px;
                background: #1a1a1a; border-bottom: 1px solid #2a2a2a;
                flex-shrink: 0; position: sticky; top: 0; z-index: 10;
              }
              /* Sticky bottom bar */
              .pos-place-order-bar {
                position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
                padding: 12px 16px 24px;
                background: #1a1a1a; border-top: 2px solid #2a2a2a;
              }
              /* Cart items */
              .pos-cart-item     { padding: 14px !important; }
              .pos-cart-qty-btn  { width: 42px !important; height: 42px !important; font-size: 20px !important; border-radius: 10px !important; }
              .pos-cart-qty-val  { font-size: 16px !important; width: 34px !important; }
              .pos-cart-action-btn { width: 38px !important; height: 38px !important; font-size: 15px !important; }
              .pos-cart-remove-btn { padding: 8px 12px !important; font-size: 14px !important; border-radius: 8px !important; }
              /* Order type: 3 cols */
              .pos-order-type-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; margin-bottom: 16px !important; }
              .pos-order-type-btn  { padding: 14px 4px !important; font-size: 12px !important; }
              .pos-order-type-icon { font-size: 22px !important; }
              /* Table chips */
              .pos-table-chip { min-width: 66px !important; padding: 12px 8px !important; }
              /* Payment method */
              .pos-payment-method-btn { padding: 16px 0 !important; font-size: 15px !important; border-radius: 12px !important; }
              .pos-payment-icon       { font-size: 20px !important; }
              /* Inputs */
              .pos-checkout-form input { padding: 14px 12px !important; font-size: 15px !important; min-height: 48px !important; }
              /* Place order button */
              .pos-place-order-btn { padding: 18px 0 !important; font-size: 17px !important; border-radius: 14px !important; }
            }
          `}</style>

          {/* ── Mobile tab bar (shown only on phone) ── */}
          <div className="pos-mobile-tab-bar" style={{ display: "flex", gap: 0, marginBottom: 10, background: C.bg3, borderRadius: 10, padding: 3 }}>
            {cart.items.length === 0 
              ? [["menu", "🍽 Menu"], ["checkout", "🧾 New Order"]].map(([t, lbl]) => (
                  <button key={t} onClick={() => setPosMobileTab(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: posMobileTab === t ? C.bg4 : "transparent", color: posMobileTab === t ? C.amber2 : C.text3, fontSize: 13, fontWeight: posMobileTab === t ? 700 : 400, cursor: "pointer" }}>{lbl}</button>
                ))
              : [["menu", "🍽 Menu"], ["cart", `🛒 Cart (${cart.items.length})`], ["checkout", "🧾 Checkout"]].map(([t, lbl]) => (
                  <button key={t} onClick={() => setPosMobileTab(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: posMobileTab === t ? C.bg4 : "transparent", color: posMobileTab === t ? C.amber2 : C.text3, fontSize: 13, fontWeight: posMobileTab === t ? 700 : 400, cursor: "pointer" }}>{lbl}</button>
                ))}
          </div>

          {/* ── Main POS grid (desktop) / menu panel (mobile) ── */}
          <div className="pos-layout" style={{ display: "grid", gridTemplateColumns: "180px 1fr 320px", gap: 12, height: "calc(100dvh - 160px)", minHeight: 0 }}>

            {/* Category Sidebar */}
            <CategorySidebar
              categoryFilter={categoryFilter}
              showAvailableOnly={showAvailableOnly}
              onCategorySelect={setCategoryFilter}
              onToggleAvailable={setShowAvailableOnly}
              menuItems={menuItems || []}
            />

            {/* Menu Grid */}
            <div className="pos-menu-panel" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, overflowY: "auto", display: isMobile && posMobileTab !== "menu" ? "none" : "flex", flexDirection: "column" }}>
              {/* ── Kitchen status widget ── */}
              {(() => {
                const pending = orders.filter(o => ["NEW","ACCEPTED","PREPARING"].includes(o.status));
                const ready   = orders.filter(o => o.status === "READY");
                if (pending.length === 0 && ready.length === 0) return null;
                return (
                  <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.amber3}` }}>
                    <div onClick={() => setShowPosKitchenQueue(!showPosKitchenQueue)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.amberDim, cursor: "pointer" }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.amber2 }}>Kitchen Active</span>
                        <span style={{ marginLeft: 10, fontSize: 11, color: C.text3 }}>
                          {pending.length > 0 && `${pending.length} cooking`}
                          {pending.length > 0 && ready.length > 0 && " · "}
                          {ready.length > 0 && <span style={{ color: "#4ade80", fontWeight: 700 }}>{ready.length} ready 🔔</span>}
                        </span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setShowKitchenStatusPanel(true); }} style={{ fontSize: 11, color: C.amber2, background: "none", border: `1px solid ${C.amber3}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>Full View</button>
                      <span style={{ color: C.amber, fontSize: 11, marginLeft: 4 }}>{showPosKitchenQueue ? "▲" : "▼"}</span>
                    </div>
                    {showPosKitchenQueue && (
                      <div style={{ background: C.bg3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                        {ready.map(o => (
                          <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: "#052e16", border: "1px solid #16a34a" }}>
                            <span style={{ fontSize: 16 }}>🔔</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>{getOrderCustomerName(o)} — READY</div>
                              <div style={{ fontSize: 11, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderDisplayItems(o)}</div>
                            </div>
                            <button onClick={() => updateStatus(o.id, "COMPLETED")} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>✓ Done</button>
                          </div>
                        ))}
                        {pending.map(o => {
                          const mins = getMinutesElapsed(o.createdAt);
                          const isUrgent = mins > 15;
                          return (
                            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: isUrgent ? C.redBg : C.bg4, border: `1px solid ${isUrgent ? C.redBorder : C.border}` }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>👨‍🍳</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: isUrgent ? C.red : C.text, marginBottom: 1 }}>{getOrderCustomerName(o)} <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: C.text3 }}>{{ NEW: "New", ACCEPTED: "Accepted", PREPARING: "Cooking" }[o.status]}</span></div>
                                <div style={{ fontSize: 11, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderDisplayItems(o)}</div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: isUrgent ? C.red : C.amber2, fontFamily: "monospace" }}>{mins}m</div>
                                {isUrgent && <div style={{ fontSize: 9, color: C.red, fontWeight: 700 }}>LATE</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ marginBottom: 10 }}>
                <SearchBar value={menuQuery} onChange={setMenuQuery} menuItems={menuItems || []} onSelectItem={addToCart} placeholder="Search menu (name, category)…" />
              </div>
              <MenuGrid
                menuItems={menuItems || []}
                categoryFilter={categoryFilter}
                menuQuery={menuQuery}
                showAvailableOnly={showAvailableOnly}
                cart={cart}
                onAddItem={addToCart}
                onUpdateQuantity={updateCartQty}
                kioskMode={false}
                onClearSearch={() => setMenuQuery("")}
              />
            </div>

            {/* ── RIGHT COLUMN — desktop inline / mobile full-screen ── */}
            <div style={{ display: isMobile ? "none" : "flex", flexDirection: "column", gap: 8, minHeight: 0, overflow: "hidden" }}>
              {/* desktop cart content — rendered below as shared component */}
              <CartContent
                isMobile={false}
                cart={cart}
                heldOrders={heldOrders}
                availableTables={availableTables}
                orderType={orderType} setOrderType={setOrderType}
                selectedTable={selectedTable} setSelectedTable={setSelectedTable}
                customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                customerAddress={customerAddress} setCustomerAddress={setCustomerAddress}
                platformOrderId={platformOrderId} setPlatformOrderId={setPlatformOrderId}
                pax={pax} setPax={setPax}
                discountInput={discountInput} setDiscountInput={setDiscountInput}
                discountMode={discountMode} setDiscountMode={setDiscountMode}
                packagingCharge={packagingCharge} setPackagingCharge={setPackagingCharge}
                orderNotes={orderNotes}
                splitBillMode={splitBillMode} setSplitBillMode={setSplitBillMode}
                splitBillCount={splitBillCount} setSplitBillCount={setSplitBillCount}
                setCartItemSplits={setCartItemSplits}
                activeCartTotal={activeCartTotal}
                cartSubtotal={cartSubtotal} cartCgst={cartCgst} cartSgst={cartSgst}
                cartPackaging={cartPackaging} cartDiscount={cartDiscount} cartTotal={cartTotal}
                isPaymentComplete={isPaymentComplete} setIsPaymentComplete={setIsPaymentComplete}
                paymentBreakdown={paymentBreakdown} setPaymentBreakdown={setPaymentBreakdown}
                paymentResetKey={paymentResetKey}
                isPlacingOrder={isPlacingOrder}
                availableCustomers={availableCustomers}
                showCustomerHistory={showCustomerHistory} setShowCustomerHistory={setShowCustomerHistory}
                customerOrders={customerOrders}
                reorderItems={reorderItems}
                holdBill={holdBill} clearCart={clearCart}
                resumeHeldBill={resumeHeldBill} discardHeldBill={discardHeldBill}
                removeFromCart={removeFromCart} updateCartQty={updateCartQty}
                setModifierModal={setModifierModal}
                openItemNotesModal={openItemNotesModal}
                openPriceOverrideModal={openPriceOverrideModal}
                setOrderNotesDraft={setOrderNotesDraft} setOrderNotesModal={setOrderNotesModal}
                placeOrder={placeOrder}
                setPosMobileTab={setPosMobileTab}
              />
            </div>
          </div>

          {/* ── MOBILE CART SCREEN — full-page overlay ── */}
          {isMobile && posMobileTab === "cart" && (
            <div className="pos-cart-screen">
              {/* Sticky header */}
              <div className="pos-mobile-header">
                <button onClick={() => setPosMobileTab("menu")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.amber2, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>
                  ← Menu
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  🧾 {cart.items.length > 0 ? `Order (${cart.items.length} items)` : "New Order"}
                </span>
                {cart.items.length > 0 ? (
                  <button onClick={clearCart} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    🗑 Clear
                  </button>
                ) : <span style={{ width: 60 }} />}
              </div>

              {/* Scrollable body */}
              <div className="pos-cart-scroll">
                <CartContent
                  isMobile={true}
                  cart={cart}
                  heldOrders={heldOrders}
                  availableTables={availableTables}
                  orderType={orderType} setOrderType={setOrderType}
                  selectedTable={selectedTable} setSelectedTable={setSelectedTable}
                  customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                  customerAddress={customerAddress} setCustomerAddress={setCustomerAddress}
                  platformOrderId={platformOrderId} setPlatformOrderId={setPlatformOrderId}
                  pax={pax} setPax={setPax}
                  discountInput={discountInput} setDiscountInput={setDiscountInput}
                  discountMode={discountMode} setDiscountMode={setDiscountMode}
                  packagingCharge={packagingCharge} setPackagingCharge={setPackagingCharge}
                  orderNotes={orderNotes}
                  splitBillMode={splitBillMode} setSplitBillMode={setSplitBillMode}
                  splitBillCount={splitBillCount} setSplitBillCount={setSplitBillCount}
                  setCartItemSplits={setCartItemSplits}
                  activeCartTotal={activeCartTotal}
                  cartSubtotal={cartSubtotal} cartCgst={cartCgst} cartSgst={cartSgst}
                  cartPackaging={cartPackaging} cartDiscount={cartDiscount} cartTotal={cartTotal}
                  isPaymentComplete={isPaymentComplete} setIsPaymentComplete={setIsPaymentComplete}
                  paymentBreakdown={paymentBreakdown} setPaymentBreakdown={setPaymentBreakdown}
                  paymentResetKey={paymentResetKey}
                  isPlacingOrder={isPlacingOrder}
                  availableCustomers={availableCustomers}
                  showCustomerHistory={showCustomerHistory} setShowCustomerHistory={setShowCustomerHistory}
                  customerOrders={customerOrders}
                  reorderItems={reorderItems}
                  holdBill={holdBill} clearCart={clearCart}
                  resumeHeldBill={resumeHeldBill} discardHeldBill={discardHeldBill}
                  removeFromCart={removeFromCart} updateCartQty={updateCartQty}
                  setModifierModal={setModifierModal}
                  openItemNotesModal={openItemNotesModal}
                  openPriceOverrideModal={openPriceOverrideModal}
                  setOrderNotesDraft={setOrderNotesDraft} setOrderNotesModal={setOrderNotesModal}
                  placeOrder={placeOrder}
                  setPosMobileTab={setPosMobileTab}
                />
              </div>
            </div>
          )}

          {/* ── MOBILE CHECKOUT SCREEN — full-page overlay ── */}
          {isMobile && posMobileTab === "checkout" && (
            <div className="pos-checkout-screen" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: C.bg1, zIndex: 100, display: "flex", flexDirection: "column" }}>
              {/* Sticky header */}
              <div className="pos-mobile-header" style={{ padding: "12px 16px", background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button onClick={() => setPosMobileTab("cart")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.amber2, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>
                    ← Back
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Place Order</span>
                  <div style={{ width: 60 }} />
                </div>
              </div>

              {/* Scrollable body */}
              <div className="pos-checkout-scroll" style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: 80 }}>
                <CartContent
                  isMobile={true}
                  cart={cart}
                  heldOrders={heldOrders}
                  availableTables={availableTables}
                  orderType={orderType} setOrderType={setOrderType}
                  selectedTable={selectedTable} setSelectedTable={setSelectedTable}
                  customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                  customerAddress={customerAddress} setCustomerAddress={setCustomerAddress}
                  platformOrderId={platformOrderId} setPlatformOrderId={setPlatformOrderId}
                  pax={pax} setPax={setPax}
                  discountInput={discountInput} setDiscountInput={setDiscountInput}
                  discountMode={discountMode} setDiscountMode={setDiscountMode}
                  packagingCharge={packagingCharge} setPackagingCharge={setPackagingCharge}
                  orderNotes={orderNotes}
                  splitBillMode={splitBillMode} setSplitBillMode={setSplitBillMode}
                  splitBillCount={splitBillCount} setSplitBillCount={setSplitBillCount}
                  setCartItemSplits={setCartItemSplits}
                  activeCartTotal={activeCartTotal}
                  cartSubtotal={cartSubtotal} cartCgst={cartCgst} cartSgst={cartSgst}
                  cartPackaging={cartPackaging} cartDiscount={cartDiscount} cartTotal={cartTotal}
                  isPaymentComplete={isPaymentComplete} setIsPaymentComplete={setIsPaymentComplete}
                  paymentBreakdown={paymentBreakdown} setPaymentBreakdown={setPaymentBreakdown}
                  paymentResetKey={paymentResetKey}
                  isPlacingOrder={isPlacingOrder}
                  availableCustomers={availableCustomers}
                  showCustomerHistory={showCustomerHistory} setShowCustomerHistory={setShowCustomerHistory}
                  customerOrders={customerOrders}
                  reorderItems={reorderItems}
                  holdBill={holdBill} clearCart={clearCart}
                  resumeHeldBill={resumeHeldBill} discardHeldBill={discardHeldBill}
                  removeFromCart={removeFromCart} updateCartQty={updateCartQty}
                  setModifierModal={setModifierModal}
                  openItemNotesModal={openItemNotesModal}
                  openPriceOverrideModal={openPriceOverrideModal}
                  setOrderNotesDraft={setOrderNotesDraft} setOrderNotesModal={setOrderNotesModal}
                  placeOrder={placeOrder}
                  setPosMobileTab={setPosMobileTab}
                />
              </div>

              {/* Sticky bottom action bar */}
              <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 12, background: C.bg2, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                <button onClick={() => setPosMobileTab("cart")} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Edit Cart
                </button>
                <button 
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                  style={{
                    flex: 2, padding: "14px 0", borderRadius: 10, border: "none",
                    background: isPlacingOrder ? C.bg4 : `linear-gradient(135deg, ${C.amber} 0%, ${C.amber2} 100%)`,
                    color: isPlacingOrder ? C.text3 : "#1a0e00",
                    fontSize: 14, fontWeight: 800, cursor: isPlacingOrder ? "not-allowed" : "pointer",
                    boxShadow: isPlacingOrder ? "none" : `0 4px 12px ${C.amberDim}`,
                  }}
                >
                  {isPlacingOrder ? "⏳ Placing..." : `Send to Kitchen · ₹${cartTotal}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Modifier Modal */}
      {modifierModal.open && modifierModal.item && (
        <ModifierModal
          isOpen={modifierModal.open}
          onClose={() => setModifierModal({ open: false, item: null })}
          onApply={() => { const itemId = modifierModal.item.id; applyModifiers(itemId, buildModifiersList(selectedModifiers[itemId])); setModifierModal({ open: false, item: null }); }}
          onToggleModifier={toggleModifier}
          itemId={modifierModal.item.id}
          menuItem={modifierModal.item}
          selectedModifiers={selectedModifiers}
        />
      )}

      {/* Order Notes Modal */}
      <OrderNotesModal
        isOpen={orderNotesModal}
        onClose={() => setOrderNotesModal(false)}
        onApply={() => { setOrderNotes(orderNotesDraft); setOrderNotesModal(false); }}
        notes={orderNotesDraft}
        setNotes={setOrderNotesDraft}
        onInsertTemplate={(text) => setOrderNotesDraft(prev => (prev ? `${prev} ${text}` : text).slice(0, ORDER_NOTES_MAX))}
        maxLength={ORDER_NOTES_MAX}
      />

      {/* Per-item Notes Modal */}
      {itemNotesModal.open && itemNotesModal.item && (
        <OrderNotesModal
          isOpen={itemNotesModal.open}
          onClose={closeItemNotesModal}
          onApply={applyItemNotes}
          notes={itemNotesModal.draft}
          setNotes={(v) => setItemNotesModal(prev => ({ ...prev, draft: v }))}
          onInsertTemplate={(text) => setItemNotesModal(prev => ({ ...prev, draft: (prev.draft ? `${prev.draft} ${text}` : text).slice(0, ITEM_NOTES_MAX) }))}
          maxLength={ITEM_NOTES_MAX}
        />
      )}

      {/* Price Override Modal */}
      {priceOverrideModal.open && priceOverrideModal.item && (
        <PriceOverrideModal
          isOpen={priceOverrideModal.open}
          onClose={closePriceOverrideModal}
          onApply={applyPriceOverride}
          originalPrice={priceOverrideModal.item.price}
          newPrice={priceOverrideModal.newPrice}
          setNewPrice={(v) => setPriceOverrideModal(prev => ({ ...prev, newPrice: v }))}
          reason={priceOverrideModal.reason}
          setReason={(v) => setPriceOverrideModal(prev => ({ ...prev, reason: v }))}
          notes={priceOverrideModal.notes}
          setNotes={(v) => setPriceOverrideModal(prev => ({ ...prev, notes: v }))}
        />
      )}

      {/* Refund / Void Modal */}
      {refundVoidModal.open && (
        <RefundVoidModal
          isOpen={refundVoidModal.open}
          onClose={closeRefundVoidModal}
          onProcess={processRefundVoid}
          state={refundVoidModal}
          setState={setRefundVoidModal}
        />
      )}

      {/* Kitchen Status floating panel */}
      {showKitchenStatusPanel && (
        <KitchenStatusPanel kdsCards={kdsCards || []} onClose={() => setShowKitchenStatusPanel(false)} />
      )}

      {/* Stock Warning Modal */}
      {stockWarningModal && (
        <StockWarningModal
          isOpen={!!stockWarningModal}
          missingItems={stockWarningModal.missingItems}
          isPlacingOrder={isPlacingOrder}
          managerOverride={managerOverride}
          setManagerOverride={setManagerOverride}
          onClose={() => { setStockWarningModal(null); setManagerOverride(false); }}
          onConfirm={confirmOrderWithOverride}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptOrder && (
        <ReceiptModal
          isOpen={showReceipt}
          order={receiptOrder}
          staff={staff}
          receiptOptions={receiptOptions}
          updateReceiptOption={updateReceiptOption}
          onClose={() => { setShowReceipt(false); setReceiptOrder(null); }}
          printReceipt={() => {
            const w = window.open("", "", "width=400,height=600");
            if (!w) return;
            const el = document.getElementById("receipt-content");
            if (el) { w.document.write(`<html><body style="margin:0">${el.outerHTML}</body></html>`); w.document.close(); w.print(); }
          }}
          sendReceiptEmail={(order, email) => showToast(`Receipt would be emailed to ${email || "customer"}`, "success")}
          sendReceiptSMS={(order, phone) => showToast(`Receipt would be sent via SMS to ${phone || "customer"}`, "success")}
        />
      )}
    </div>
  );
}

export default Orders;
