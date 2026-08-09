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
import { getDeliveryPlatformFactory } from "../../delivery/DeliveryPlatformFactory.js";
import { PlatformType } from "../../delivery/DeliveryPlatformAdapter.js";
import { getDeliveryOrderStorage, DeliveryOrderStatus } from "../../delivery/DeliveryPlatformAdapter.js";
import { useTerminal } from "../../terminal/TerminalContext.jsx";
import { getOrderRouter } from "../../terminal/OrderRouter.js";
import { getMultiTerminalConflictResolver } from "../../terminal/MultiTerminalConflictResolver.js";

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

  const sectionLabel = { fontSize: isMobile ? 13 : 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: C.text3, marginBottom: isMobile ? 12 : 10 };
  const cardStyle   = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? "16px" : "14px", marginBottom: isMobile ? 12 : 10 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 0 : 8, height: isMobile ? "auto" : "100%", overflow: isMobile ? "visible" : "hidden" }}>

      {/* ── Held orders ── */}
      {heldOrders.length > 0 && (
        <div style={{ ...cardStyle, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, margin: isMobile ? "-16px -16px 12px" : "-14px -14px 12px" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>⏸ Held Orders ({heldOrders.length})</span>
            <span style={{ fontSize: 11, color: C.text3 }}>Tap to resume</span>
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
              <div key={h.id} className="pos-held-row" style={{ padding: "10px 0", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 16 }}>{typeIcon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? 13 : 12, fontWeight: 500, color: C.text }}>{who} · {itemCount} items <span style={{ color: C.text3, fontWeight: 400 }}>{mins}m ago</span></div>
                  <div style={{ fontSize: isMobile ? 12 : 11, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.cart.slice(0,2).map(i=>i.name).join(", ")}{h.cart.length>2?` +${h.cart.length-2}`:""}</div>
                </div>
                <button className="pos-held-resume-btn" onClick={() => resumeHeldBill(h.id)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text, fontSize: isMobile ? 13 : 12, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>↩ Resume</button>
                <button onClick={() => discardHeldBill(h.id)} style={{ padding: isMobile ? "8px 10px" : "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text3, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order Slip ── */}
      <div style={{ ...cardStyle, flexShrink: 0 }}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧾</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Order Slip</span>
              {cart.items.length > 0 && <span style={{ background: C.bg3, color: C.text2, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{cart.items.length}</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {cart.items.length > 0 && <button onClick={holdBill} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>⏸ Hold</button>}
              {cart.items.length > 0 && <button onClick={clearCart} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text3, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>🗑 Clear</button>}
            </div>
          </div>
        )}

        {cart.items.length === 0 ? (
          <div style={{ padding: isMobile ? "32px 16px" : "16px", textAlign: "center", color: C.text3, fontSize: isMobile ? 14 : 11 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <div>Empty — tap menu items to add</div>
            {isMobile && (
              <button onClick={() => setPosMobileTab("menu")} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                ← Browse Menu
              </button>
            )}
          </div>
        ) : (
          <div style={{ maxHeight: isMobile ? "none" : 230, overflowY: isMobile ? "visible" : "auto", ...(isMobile ? {} : { padding: "0" }) }}>
            {/* Hold button on mobile — inside cart section */}
            {isMobile && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={holdBill} style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>⏸ Hold Order</button>
              </div>
            )}
            {cart.items.map(item => {
              const modsTotal = (item.modifiers||[]).reduce((s,m)=>s+(Number(m.price)||0),0);
              const unitPrice = (item.overridePrice ?? item.price) + modsTotal;
              return (
                <div key={item.id} className="pos-cart-item" style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 15 : 13, fontWeight: 500, color: C.text }}>{item.name}</div>
                      {item.notes && <div style={{ fontSize: isMobile ? 12 : 11, color: C.text3, marginTop: 4 }}>📝 {item.notes}</div>}
                    </div>
                    <button className="pos-cart-remove-btn" onClick={() => removeFromCart(item.id)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg3, color: C.text3, fontSize: 12, fontWeight: 500, cursor: "pointer", marginLeft: 8, flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Qty stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button className="pos-cart-qty-btn" onClick={() => updateCartQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg4, color: C.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>−</button>
                      <span className="pos-cart-qty-val" style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 500, color: C.text, width: 24, textAlign: "center" }}>{item.qty}</span>
                      <button className="pos-cart-qty-btn" onClick={() => updateCartQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg4, color: C.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>+</button>
                    </div>
                    {/* Price + action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: isMobile ? 15 : 13, fontWeight: 500, color: C.text }}>₹{(unitPrice*item.qty).toFixed(0)}</span>
                      <button className="pos-cart-action-btn" onClick={() => setModifierModal({ open: true, item })} title="Customise" style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 12, cursor: "pointer" }}>⚙️</button>
                      <button className="pos-cart-action-btn" onClick={() => openItemNotesModal(item)} title="Notes" style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 12, cursor: "pointer" }}>📝</button>
                      <button className="pos-cart-action-btn" onClick={() => openPriceOverrideModal(item)} title="Price" style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg4, fontSize: 12, cursor: "pointer" }}>💰</button>
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
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Covers (Pax)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => setPax(n)} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 6, border: `1px solid ${pax===n?C.amber:C.border}`, background: pax===n?C.amberDim:C.bg3, color: pax===n?C.text:C.text2, fontWeight: pax===n?600:400, fontSize: isMobile ? 15 : 13, cursor: "pointer" }}>{n}</button>
                ))}
                <button onClick={() => setPax(p=>Math.max(1,p-1))} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 16, cursor: "pointer" }}>−</button>
                <button onClick={() => setPax(p=>Math.min(40,p+1))} style={{ width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 16, cursor: "pointer" }}>+</button>
                {pax > 8 && <span style={{ alignSelf: "center", fontSize: 13, fontWeight: 500, color: C.text }}>{pax} guests</span>}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />

          <DiscountPanel discountInput={discountInput} discountMode={discountMode} cartSubtotal={cartSubtotal} onDiscountModeChange={setDiscountMode} onDiscountInputChange={setDiscountInput} />

          <button onClick={() => { setOrderNotesDraft(orderNotes); setOrderNotesModal(true); }} style={{ width: "100%", padding: isMobile ? "12px 14px" : "10px 12px", borderRadius: 6, border: `1px dashed ${orderNotes?C.border:C.border}`, background: orderNotes?C.bg3:"transparent", color: orderNotes?C.text:C.text3, fontSize: isMobile ? 14 : 12, fontWeight: 400, cursor: "pointer", textAlign: "left", marginBottom: 12 }}>
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

          <PaymentPanel 
            cartTotal={activeCartTotal} 
            onBreakdownChange={(bd,ic)=>{setPaymentBreakdown(bd);setIsPaymentComplete(ic);}} 
            isPlacingOrder={isPlacingOrder} 
            cartLength={cart.items.length} 
            resetKey={paymentResetKey}
            orderId={cart.orderId}
            customerInfo={{
              name: customerPhone ? (availableCustomers.find(c => c.phone === customerPhone)?.name || '') : '',
              phone: customerPhone,
              email: '',
              businessName: 'Cafe OS'
            }}
          />

          {/* Place order — inline for desktop, sticky bar for mobile */}
          <div className="pos-place-order-bar">
            {block.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "10px 14px" : "8px 12px", borderRadius: 6, background: C.bg3, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                <span>⚠️</span>
                <span style={{ fontSize: isMobile ? 13 : 12, color: C.text, fontWeight: 400 }}>{block[0]}</span>
              </div>
            )}
            <button
              className="pos-place-order-btn"
              onClick={placeOrder}
              disabled={isBlocked}
              style={{
                width: "100%", padding: "14px 0", fontSize: isMobile ? 15 : 14, fontWeight: 500, border: "none",
                borderRadius: 6, cursor: isBlocked ? "not-allowed" : "pointer",
                background: isBlocked ? C.bg3 : C.amber,
                color: isBlocked ? C.text3 : "#000",
                boxShadow: isBlocked ? "none" : `0 2px 8px ${C.amberDim}`,
                marginTop: isMobile ? 0 : 12,
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
  
  // ── Toast notification ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  // ── Multi-Terminal Integration ─────────────────────────────────────────────
  const { currentTerminal, syncClient, terminalManager } = useTerminal();
  const orderRouter = getOrderRouter();
  const conflictResolver = getMultiTerminalConflictResolver();

  // ── Delivery Platform Integration ─────────────────────────────────────────────
  const deliveryFactory = getDeliveryPlatformFactory();
  const deliveryStorage = getDeliveryOrderStorage();

  // Listen for delivery orders from platforms
  useEffect(() => {
    const handleDeliveryOrderReceived = (event) => {
      const deliveryOrder = event.detail;
      console.log('[Orders] Delivery order received:', deliveryOrder);
      
      // Convert delivery order to POS order format
      const posOrder = convertDeliveryOrderToPosOrder(deliveryOrder);
      
      // Add to orders
      setOrders(prev => [...prev, posOrder]);
      
      // Auto-route to kitchen display
      const kdsTicket = createKdsTicketsFromOrder(posOrder);
      setKdsCards(prev => [...prev, ...kdsTicket]);
      
      showToast(`New ${deliveryOrder.platform} order received`, 'success');
    };

    window.addEventListener('deliveryOrderReceived', handleDeliveryOrderReceived);
    
    return () => {
      window.removeEventListener('deliveryOrderReceived', handleDeliveryOrderReceived);
    };
  }, [setOrders, setKdsCards]);

  // ── Real-time Sync Integration ─────────────────────────────────────────────
  useEffect(() => {
    if (!syncClient || !currentTerminal) return;

    // Listen for order events from other terminals
    const handleOrderCreated = (data) => {
      console.log('[Orders] Order created from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        setOrders(prev => [...prev, data.data]);
      }
    };

    const handleOrderUpdated = (data) => {
      console.log('[Orders] Order updated from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        setOrders(prev => prev.map(o => 
          o.id === data.data.id ? { ...o, ...data.data } : o
        ));
      }
    };

    const handleOrderDeleted = (data) => {
      console.log('[Orders] Order deleted from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        setOrders(prev => prev.filter(o => o.id !== data.data.orderId));
      }
    };

    const handleResourceLocked = (data) => {
      console.log('[Orders] Resource locked by another terminal:', data);
      if (data.lockedBy !== currentTerminal.id) {
        // Show alert that resource is locked
        console.warn(`Order being edited by another terminal`);
      }
    };

    const handleResourceUnlocked = (data) => {
      console.log('[Orders] Resource unlocked:', data);
    };

    syncClient.on('orderCreated', handleOrderCreated);
    syncClient.on('orderUpdated', handleOrderUpdated);
    syncClient.on('orderDeleted', handleOrderDeleted);
    syncClient.on('resourceLocked', handleResourceLocked);
    syncClient.on('resourceUnlocked', handleResourceUnlocked);

    return () => {
      syncClient.off('orderCreated', handleOrderCreated);
      syncClient.off('orderUpdated', handleOrderUpdated);
      syncClient.off('orderDeleted', handleOrderDeleted);
      syncClient.off('resourceLocked', handleResourceLocked);
      syncClient.off('resourceUnlocked', handleResourceUnlocked);
    };
  }, [syncClient, currentTerminal, setOrders]);

  // Convert delivery order to POS order format
  const convertDeliveryOrderToPosOrder = (deliveryOrder) => {
    return {
      id: deliveryOrder.id,
      orderId: deliveryOrder.platformOrderId,
      source: deliveryOrder.platform.toUpperCase(),
      orderType: deliveryOrder.orderType,
      status: 'NEW',
      customerName: deliveryOrder.customerInfo.name,
      customerPhone: deliveryOrder.customerInfo.phone,
      customerAddress: deliveryOrder.deliveryAddress.address,
      items: deliveryOrder.items.map(item => ({
        id: item.id,
        menuItemId: item.id,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        category: 'Food',
        modifiers: item.addons || [],
        notes: deliveryOrder.specialInstructions
      })),
      totalAmount: deliveryOrder.totalAmount,
      commission: deliveryOrder.commission,
      netAmount: deliveryOrder.netAmount,
      createdAt: deliveryOrder.createdAt,
      updatedAt: deliveryOrder.updatedAt,
      specialInstructions: deliveryOrder.specialInstructions,
      deliveryPartner: deliveryOrder.deliveryPartner,
      estimatedDeliveryTime: deliveryOrder.estimatedDeliveryTime,
      metadata: {
        platform: deliveryOrder.platform,
        platformOrderId: deliveryOrder.platformOrderId,
        isDeliveryOrder: true
      }
    };
  };

  // Update delivery order status on platform
  const updateDeliveryOrderStatus = useCallback(async (orderId, status, metadata = {}) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.metadata?.isDeliveryOrder) return;

    try {
      const platformType = order.metadata.platform === 'zomato' ? PlatformType.ZOMATO : PlatformType.SWIGGY;
      const platformOrderId = order.metadata.platformOrderId || order.orderId;
      
      await deliveryFactory.updateOrderStatus(platformOrderId, status, metadata);
      
      // Update local order status
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: mapDeliveryStatusToPosStatus(status) } : o
      ));
      
      console.log(`Order status updated on ${order.metadata.platform}`);
    } catch (error) {
      console.error('[Orders] Failed to update delivery order status:', error);
    }
  }, [orders, setOrders]);

  // Map delivery status to POS status
  const mapDeliveryStatusToPosStatus = (deliveryStatus) => {
    const statusMap = {
      [DeliveryOrderStatus.RECEIVED]: 'NEW',
      [DeliveryOrderStatus.ACCEPTED]: 'ACCEPTED',
      [DeliveryOrderStatus.PREPARING]: 'PREPARING',
      [DeliveryOrderStatus.READY]: 'READY',
      [DeliveryOrderStatus.PICKED_UP]: 'OUT_FOR_DELIVERY',
      [DeliveryOrderStatus.DELIVERED]: 'COMPLETED',
      [DeliveryOrderStatus.CANCELLED]: 'CANCELLED',
      [DeliveryOrderStatus.REJECTED]: 'CANCELLED'
    };
    return statusMap[deliveryStatus] || 'NEW';
  };

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
  const [categoryFilter, setCategoryFilter] = useState("ALL");
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
  }, []);

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
  }, []);

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
  }, [cart.items, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, clearCart]);

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
  }, [heldOrders, cart.items, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes]);

  const discardHeldBill = useCallback((id) => {
    setHeldOrders(prev => prev.filter(h => h.id !== id));
    showToast("Held bill discarded");
  }, []);

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
  }, [priceOverrideModal, closePriceOverrideModal]);

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
    
    // Broadcast order creation to other terminals
    if (syncClient && currentTerminal) {
      syncClient.broadcastOrderCreated(newOrder);
      // Auto-assign order to current terminal
      orderRouter.assignOrder(newOrder.id, currentTerminal.id);
    }
    
    clearCart();
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    if (isMobile) setPosMobileTab("menu");
    setReceiptOrder(newOrder);
    setShowReceipt(true);
    showToast("Order created! ");
  }, [inventory, setInventory, kdsCards, setKdsCards, orderType, selectedTable, setTables, availableTables, customerPhone, setCustomers, availableCustomers, orders, setOrders, clearCart, isMobile, syncClient, currentTerminal, orderRouter]);

  const placeOrder = useCallback(() => {
    if (isPlacingOrder) return;
    
    try {
      const err = validateOrder();
      if (err) { showToast(err, "error"); return; }
    } catch (error) {
      console.error('[Orders] Validation error:', error);
      showToast("Order validation failed", "error");
      return;
    }

    // Disable button IMMEDIATELY before any async operations
    setIsPlacingOrder(true);
    try {
      const items = cart?.items || [];
      const orderItems = items.map(item => ({
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
      const calculatedSubtotal = items.reduce((sum, item) => {
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
        source: sourceMap?.[orderType] || 'POS', orderType,
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
  }, [isPlacingOrder, cart.items, inventory, kdsCards, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes, paymentBreakdown, availableTables, availableCustomers, orders, clearCart, isMobile]);

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
      
      const calculatedDiscount = discountMode === "percentage"
        ? calculatedSubtotal * (Number(discountInput) / 100)
        : Number(discountInput);
      const calculatedTax = (calculatedSubtotal - calculatedDiscount) * 0.18;
      const calculatedTotal = calculatedSubtotal - calculatedDiscount + calculatedTax + Number(packagingCharge);
      
      const paymentBreakdown = calculateCartTotals({
        items: orderItems,
        discountInput,
        discountMode,
        packagingCharge,
        taxRate: 0.18
      });
      
      const newOrder = createOrder({
        items: orderItems,
        orderType,
        tableId: selectedTable?.id || null,
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        platformOrderId: platformOrderId.trim() || null,
        pax,
        discountInput,
        discountMode,
        packagingCharge,
        orderNotes: (orderNotes || "").trim().slice(0, ORDER_NOTES_MAX),
        createdBy: "local-user"
      });
      setStockWarningModal(null);
      finalizeOrderCreation(newOrder);
    } catch (_e) {
      showToast("Order failed — please try again", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [isPlacingOrder, stockWarningModal, cartSubtotal, cartDiscount, cartTax, cartTotal, paymentBreakdown, orderType, selectedTable, customerPhone, customerAddress, platformOrderId, pax, discountInput, discountMode, packagingCharge, orderNotes]);

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
    // PERFORMANCE: Early return for no filter
    if (filter === "ALL" && !search.trim()) return result.slice();
    
    if (filter !== "ALL") {
      if (isStatusFilter(filter)) result = result.filter(o => o?.status === filter);
      else if (isSrcFilter(filter)) result = result.filter(o => o?.source === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      // PERFORMANCE: Cache computed values to avoid repeated function calls
      result = result.filter(o => {
        if (!o) return false;
        let name = "", items = "";
        try { name = (getOrderCustomerName(o) || "").toLowerCase(); } catch (_e) { /* non-fatal */ }
        try { items = (getOrderDisplayItems(o) || "").toLowerCase(); } catch (_e) { /* non-fatal */ }
        const id = typeof o.id === "string" ? o.id.toLowerCase() : "";
        const phone = (o.customerPhone || "").toLowerCase();
        // PERFORMANCE: Use indexOf instead of includes for slightly better performance
        return name.indexOf(q) >= 0 || id.indexOf(q) >= 0 || phone.indexOf(q) >= 0 || items.indexOf(q) >= 0;
      });
    }
    return result.slice();
  }, [orders, filter, search]);

  // PERFORMANCE: Pagination for large datasets
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

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
  }, [setOrders, applyStatusSideEffects]);

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
  }, [refundVoidModal, applyStatusSideEffects, setOrders, closeRefundVoidModal]);

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
  }, [selected, setOrders, applyStatusSideEffects]);

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
  }, [selected, setOrders, applyStatusSideEffects]);

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

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "var(--cafe-bg-surface)", borderRadius: 12, padding: 5, border: "1px solid var(--cafe-border-light)" }}>
        {[
          { id: "active", label: "Live Orders", icon: "📋", badge: activeCount > 0 ? activeCount : null },
          { id: "pos",    label: "New Order",   icon: "➕", badge: cart.items.length > 0 ? cart.items.length : null },
        ].map(({ id, label: lbl, icon, badge }) => (
          <button key={id} className="orders-mode-btn" onClick={() => setMode(id)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 9, border: "none",
            background: mode === id ? "var(--cafe-accent)" : "transparent",
            color: mode === id ? "#fff" : "var(--cafe-text-secondary)",
            fontSize: 13, fontWeight: mode === id ? 700 : 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all .2s",
            boxShadow: mode === id ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {lbl}
            {badge !== null && <span style={{
              background: mode === id ? "rgba(255,255,255,0.25)" : "var(--cafe-bg-card)",
              color: mode === id ? "#fff" : "var(--cafe-text-secondary)",
              border: `1px solid ${mode === id ? "rgba(255,255,255,0.3)" : "var(--cafe-border-light)"}`,
              fontSize: 11, fontWeight: 700,
              padding: "2px 7px", borderRadius: 6, minWidth: 20, textAlign: "center"
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { icon: "🍽️", label: "In Kitchen",  val: activeOrders.length,              sub: "active orders",   color: "var(--cafe-accent)",  bg: "var(--cafe-accent-bg)",         border: "var(--cafe-accent-border)" },
                  { icon: "⚡",  label: "Need Action", val: needAction,                        sub: needAction > 0 ? "waiting now" : "all good", color: needAction > 0 ? "#ef4444" : "#22c55e", bg: needAction > 0 ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)", border: needAction > 0 ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)" },
                  { icon: "💰",  label: "Revenue",     val: "₹" + revenue.toLocaleString(),   sub: `${paidOrders.length} orders`,   color: "#22c55e",             bg: "rgba(34,197,94,0.07)",          border: "rgba(34,197,94,0.25)" },
                  { icon: "📊",  label: "Avg Order",   val: "₹" + avg.toLocaleString(),        sub: "per ticket",     color: "#3b82f6",             bg: "rgba(59,130,246,0.07)",         border: "rgba(59,130,246,0.25)" },
                ].map(m => (
                  <div key={m.label} style={{
                    background: m.bg,
                    border: `1px solid ${m.border}`,
                    borderRadius: 14, padding: "16px",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.color, opacity: 0.8, borderRadius: "14px 14px 0 0" }} />
                    <div style={{ fontSize: 20, marginBottom: 10 }}>{m.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: m.color, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{m.val}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cafe-text-primary)", marginTop: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{m.sub}</div>
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
              <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                {sops.map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 6, background: s.level === "alert" ? C.redBg : C.warningBg, border: "1px solid " + (s.level === "alert" ? C.redBorder : C.warningBorder) }}>
                    <span style={{ fontSize: 16 }}>{s.level === "alert" ? "🔴" : "🟡"}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: s.level === "alert" ? C.red : C.warning, marginRight: 10 }}>{s.label}</span>
                      <span style={{ fontSize: 13, color: C.text2 }}>{s.msg}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: C.text3, fontWeight: 500 }}>{counts[s.stat]} / {s.threshold}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Filters */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ overflowX: "auto", paddingBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "nowrap", minWidth: "max-content" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", background: "var(--cafe-bg-surface)", borderRadius: 8, padding: 3, gap: 2, border: "1px solid var(--cafe-border-light)", marginRight: 12 }}>
                    <button onClick={() => setViewMode("cards")} style={{ padding: "6px", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: viewMode === "cards" ? "var(--cafe-bg-card)" : "transparent", color: viewMode === "cards" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", borderRadius: 6, cursor: "pointer", boxShadow: viewMode === "cards" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }} title="Cards View">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <button onClick={() => setViewMode("list")} style={{ padding: "6px", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: viewMode === "list" ? "var(--cafe-bg-card)" : "transparent", color: viewMode === "list" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", borderRadius: 6, cursor: "pointer", boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }} title="List View">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--cafe-text-secondary)" }}>🔍</span>
                    <input style={{ ...input, paddingLeft: 32, width: 220, borderRadius: 8, height: 38, border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-card)", color: "var(--cafe-text-primary)" }} placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button 
                    onClick={() => setFilter("ALL")} 
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid " + (filter === "ALL" ? "var(--cafe-accent)" : "var(--cafe-border-light)"),
                      background: filter === "ALL" ? "var(--cafe-accent-bg)" : "var(--cafe-bg-card)",
                      color: filter === "ALL" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 38,
                      transition: "all 0.2s",
                    }}
                  >
                    All <span style={{ background: filter === "ALL" ? "rgba(255,255,255,0.4)" : "var(--cafe-bg-surface)", color: filter === "ALL" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontSize: 11, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{orders.length}</span>
                  </button>
                  {STATUS_FILTERS.concat(SOURCE_FILTERS.slice(1)).map(f => {
                    const active = filter === f;
                    const count = isStatusFilter(f) ? orders.filter(o => o.status === f).length : orders.filter(o => o.source === f).length;
                    if (count === 0 && !active) return null;
                    return (
                      <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid " + (active ? "var(--cafe-accent)" : "var(--cafe-border-light)"),
                          background: active ? "var(--cafe-accent-bg)" : "var(--cafe-bg-card)",
                          color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          height: 38,
                          transition: "all 0.2s",
                        }}
                      >
                        {f === "WALK_IN" ? "Walk-in" : f === "DIRECT_DELIVERY" ? "Delivery" : f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, " ")}
                        {count > 0 && <span style={{ background: active ? "rgba(255,255,255,0.4)" : "var(--cafe-bg-surface)", color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontSize: 11, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.amberDim, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "monospace", fontWeight: 400 }}>{selected.size} order{selected.size !== 1 && "s"} selected</span>
              <button style={{ padding: "6px 12px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 12, fontWeight: 400, cursor: "pointer" }} onClick={advanceSelected}>Advance all</button>
              <button style={{ padding: "6px 12px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg3, color: C.text2, fontSize: 12, fontWeight: 400, cursor: "pointer" }} onClick={cancelSelected}>Cancel all</button>
              <button style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "transparent", color: C.text3, fontSize: 12, fontWeight: 400, cursor: "pointer", marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Deselect</button>
            </div>
          )}

          {/* Live Orders List / Grid */}
          <div style={{ 
            display: viewMode === "cards" ? "grid" : "flex", 
            flexDirection: viewMode === "cards" ? "row" : "column",
            gridTemplateColumns: viewMode === "cards" ? "repeat(auto-fill, minmax(320px, 1fr))" : "none",
            gap: viewMode === "cards" ? 12 : 6 
          }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 32px", borderRadius: 8, background: C.bg2, border: "1px dashed " + C.border }}>
                <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.3 }}>🍽</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.text2, marginBottom: 8 }}>
                  {search.trim() ? `No orders matching "${search}"` : filter !== "ALL" ? `No ${filter.toLowerCase().replace(/_/g, " ")} orders` : "All quiet right now"}
                </div>
                <div style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>
                  {search.trim() ? "Try a different search" : filter !== "ALL" ? "Switch to All to see everything" : "Ready to take the first order?"}
                </div>
                {!search.trim() && filter === "ALL" && (
                  <button onClick={() => setMode("pos")} style={{ padding: "12px 24px", borderRadius: 6, border: "none", background: C.amber, color: "#000", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                    ➕ Take New Order
                  </button>
                )}
              </div>
            )}
            {paginated.map(o => {
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
                    border: "1px solid " + (isOld ? "var(--cafe-danger-border)" : expanded ? "var(--cafe-accent)" : "var(--cafe-border-light)"),
                    borderRadius: 18,
                    overflow: "hidden",
                    transition: "all .3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    boxShadow: expanded ? "0 12px 32px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 240,
                    position: "relative"
                  }}>
                    {/* Top Progress Bar */}
                    {!isDone && (
                      <div style={{ height: 4, width: "100%", background: "var(--cafe-bg-surface)" }}>
                        <div style={{ height: "100%", width: progressPct + "%", background: progressColor, transition: "width 1s linear" }} />
                      </div>
                    )}
                    
                    {/* Header */}
                    <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--cafe-bg-surface)", border: "2px solid " + src.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--cafe-text-primary)", flexShrink: 0, boxShadow: "0 0 12px " + src.bg + "40" }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--cafe-text-primary)" }}>{customerName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                            <span style={{ ...pill(src.bg, src.color), fontSize: 10, fontWeight: 700 }}>{srcLabel(o.source)}</span>
                            {o.tableId && <span style={{ fontSize: 11, color: "var(--cafe-text-secondary)", background: "var(--cafe-bg-surface)", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>Table {o.tableId}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: "var(--cafe-accent)", letterSpacing: "-0.02em" }}>₹{getOrderAmount(o)}</div>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: isOld ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", fontWeight: 700, marginTop: 5 }}>
                          {timeElapsed} min ago
                        </div>
                      </div>
                    </div>

                    {/* Receipt Items Preview */}
                    <div style={{ flex: 1, padding: "0 22px", marginTop: 6, cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                      <div style={{ background: "var(--cafe-bg-surface)", borderRadius: 13, padding: "14px", border: "1px solid var(--cafe-border-light)", maxHeight: expanded ? 400 : 80, overflow: "hidden", position: "relative" }}>
                        <div style={{ fontSize: 14, color: "var(--cafe-text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {getOrderDisplayItems(o).split(', ').map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontWeight: 600 }}>• {item.split(' x ')[1] || item}</span>
                              <span style={{ color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>x{item.split(' x ')[0] || "1"}</span>
                            </div>
                          ))}
                        </div>
                        {!expanded && (
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(transparent, var(--cafe-bg-surface))" }} />
                        )}
                      </div>
                      {o.notes && expanded && (
                        <div style={{ fontSize: 13, color: "var(--cafe-accent-dark)", marginTop: 12, background: "var(--cafe-accent-bg)", border: "1px dashed var(--cafe-accent-border)", borderRadius: 10, padding: "10px 14px", fontWeight: 600 }}>
                          📝 {o.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ 
                      padding: "18px 22px", 
                      borderTop: "1px solid var(--cafe-border-light)",
                      background: "var(--cafe-bg-hover)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: sc.color || "#555", boxShadow: "0 0 10px " + (sc.color || "#555") }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: sc.color || "var(--cafe-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{sc.label || o.status}</span>
                      </div>
                      
                      {nextStatus && !isDone && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(o.id, nextStatus); }}
                          style={{ 
                            padding: "12px 20px", 
                            borderRadius: 12, 
                            border: "1px solid " + (sc.color || "var(--cafe-accent)") + "40", 
                            background: (sc.color || "var(--cafe-accent)") + "20", 
                            color: sc.color || "var(--cafe-accent)", 
                            fontSize: 14, 
                            fontWeight: 800, 
                            cursor: "pointer", 
                            transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)" 
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = sc.color || "var(--cafe-accent)"; e.currentTarget.style.color = "#1A1208"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
                          onMouseOut={e => { e.currentTarget.style.background = (sc.color || "var(--cafe-accent)") + "20"; e.currentTarget.style.color = sc.color || "var(--cafe-accent)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
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
                  background: isOld ? "var(--cafe-danger-bg)" : expanded ? "var(--cafe-bg-hover)" : "var(--cafe-bg-card)",
                  border: `1px solid ${isOld ? "var(--cafe-danger-border)" : expanded ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                  borderRadius: 14, overflow: "hidden",
                  transition: "all .25s ease",
                  marginBottom: 10,
                  boxShadow: expanded ? "0 8px 24px rgba(0,0,0,0.1)" : "none",
                }}>
                  {/* Main row */}
                  <div className="orders-list-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <input type="checkbox" checked={selected.has(o.id)} onChange={e => { e.stopPropagation(); toggleSelect(o.id); }} style={{ accentColor: "var(--cafe-accent)", cursor: "pointer", width: 18, height: 18 }} />
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--cafe-bg-surface)", border: `2px solid ${src.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--cafe-text-primary)", flexShrink: 0 }}>
                        {initials}
                      </div>
                    </div>

                    {/* Customer + items */}
                    <div className="orders-list-meta" style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--cafe-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerName}</span>
                        <span style={{ ...pill(src.bg, src.color), fontSize: 10, fontWeight: 700 }}>{srcLabel(o.source)}</span>
                        {o.tableId && <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-surface)", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>T{o.tableId}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85 }}>{getOrderDisplayItems(o)}</div>
                    </div>

                    {/* Amount + time */}
                    <div className="orders-list-amount" style={{ textAlign: "right", flexShrink: 0, padding: "0 10px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: "var(--cafe-accent)", letterSpacing: "-0.02em" }}>₹{getOrderAmount(o)}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: isOld ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", fontWeight: 700, marginTop: 3 }}>{timeElapsed}m{isOld ? " ⚠" : ""}</div>
                    </div>

                    {/* Status badge */}
                    <div className="orders-list-status" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, minWidth: 110, justifyContent: "flex-end" }}>
                      <span style={{ ...pill(sc.bg, sc.color, sc.border), fontSize: 11, fontWeight: 800 }}>{sc.label || o.status}</span>
                    </div>

                    {/* Quick advance button */}
                    <div className="orders-list-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {nextStatus && !isDone && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(o.id, nextStatus); }}
                          style={{ 
                            padding: "10px 16px", 
                            borderRadius: 10, 
                            border: `1px solid ${sc.color || "var(--cafe-accent)"}40`, 
                            background: `${sc.color || "var(--cafe-accent)"}20`, 
                            color: sc.color || "var(--cafe-accent)", 
                            fontSize: 12, 
                            fontWeight: 800, 
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={e => e.currentTarget.style.background = sc.color || "var(--cafe-accent-bg)"}
                          onMouseOut={e => e.currentTarget.style.background = `${sc.color || "var(--cafe-accent)"}20`}
                        >→ {STATUS_FLOW_LABEL[o.status]}</button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : o.id); }} style={{ background: "none", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 14, cursor: "pointer", padding: "8px 6px" }}>
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
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 12, 
              padding: '20px 0',
              borderTop: '1px solid var(--cafe-border-light)',
              marginTop: 16 
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--cafe-border)',
                  background: page === 1 ? 'var(--cafe-bg-surface)' : 'var(--cafe-bg-card)',
                  color: page === 1 ? 'var(--cafe-text-tertiary)' : 'var(--cafe-text-primary)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                ← Previous
              </button>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: 'var(--cafe-text-secondary)',
                padding: '0 16px'
              }}>
                Page {page} of {totalPages} ({filtered.length} orders)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--cafe-border)',
                  background: page === totalPages ? 'var(--cafe-bg-surface)' : 'var(--cafe-bg-card)',
                  color: page === totalPages ? 'var(--cafe-text-tertiary)' : 'var(--cafe-text-primary)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Next →
              </button>
            </div>
          )}
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
          <div className="pos-mobile-tab-bar" style={{ display: "flex", gap: 6, marginBottom: 14, background: "var(--cafe-bg-surface)", borderRadius: 12, padding: 5, border: "1px solid var(--cafe-border-light)" }}>
            {cart.items.length === 0 
              ? [["menu", "🍽 Menu"], ["checkout", "🧾 New Order"]].map(([t, lbl]) => (
                  <button key={t} onClick={() => setPosMobileTab(t)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: posMobileTab === t ? "var(--cafe-accent)" : "transparent", color: posMobileTab === t ? "#1A1208" : "var(--cafe-text-secondary)", fontSize: 14, fontWeight: posMobileTab === t ? 800 : 600, cursor: "pointer", transition: "all 0.2s" }}>{lbl}</button>
                ))
              : [["menu", "🍽 Menu"], ["cart", `🛒 Cart (${cart.items.length})`], ["checkout", "🧾 Checkout"]].map(([t, lbl]) => (
                  <button key={t} onClick={() => setPosMobileTab(t)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: posMobileTab === t ? "var(--cafe-accent)" : "transparent", color: posMobileTab === t ? "#1A1208" : "var(--cafe-text-secondary)", fontSize: 14, fontWeight: posMobileTab === t ? 800 : 600, cursor: "pointer", transition: "all 0.2s" }}>{lbl}</button>
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
            <div className="pos-menu-panel" style={{ background: "var(--cafe-bg-hover)", border: `1px solid var(--cafe-border-light)`, borderRadius: 14, padding: 16, overflowY: "auto", display: isMobile && posMobileTab !== "menu" ? "none" : "flex", flexDirection: "column" }}>
              {/* ── Kitchen status widget ── */}
              {(() => {
                const pending = orders.filter(o => ["NEW","ACCEPTED","PREPARING"].includes(o.status));
                const ready   = orders.filter(o => o.status === "READY");
                if (pending.length === 0 && ready.length === 0) return null;
                return (
                  <div style={{ marginBottom: 16, borderRadius: 13, overflow: "hidden", border: `1px solid var(--cafe-accent-border)` }}>
                    <div onClick={() => setShowPosKitchenQueue(!showPosKitchenQueue)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--cafe-accent-bg)", cursor: "pointer" }}>
                      <span style={{ fontSize: 18 }}>🔥</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--cafe-accent)" }}>Kitchen Active</span>
                        <span style={{ marginLeft: 12, fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                          {pending.length > 0 && `${pending.length} cooking`}
                          {pending.length > 0 && ready.length > 0 && " · "}
                          {ready.length > 0 && <span style={{ color: "#22c55e", fontWeight: 700 }}>{ready.length} ready 🔔</span>}
                        </span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setShowKitchenStatusPanel(true); }} style={{ fontSize: 12, color: "var(--cafe-accent)", background: "none", border: `1px solid var(--cafe-accent)`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>Full View</button>
                      <span style={{ color: "var(--cafe-accent)", fontSize: 12, marginLeft: 6 }}>{showPosKitchenQueue ? "▲" : "▼"}</span>
                    </div>
                    {showPosKitchenQueue && (
                      <div style={{ background: "var(--cafe-bg-surface)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                        {ready.map(o => (
                          <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#052e16", border: "1px solid #16a34a" }}>
                            <span style={{ fontSize: 18 }}>🔔</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{getOrderCustomerName(o)} — READY</div>
                              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderDisplayItems(o)}</div>
                            </div>
                            <button onClick={() => updateStatus(o.id, "COMPLETED")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>✓ Done</button>
                          </div>
                        ))}
                        {pending.map(o => {
                          const mins = getMinutesElapsed(o.createdAt);
                          const isUrgent = mins > 15;
                          return (
                            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: isUrgent ? "var(--cafe-danger-bg)" : "var(--cafe-bg-card)", border: `1px solid ${isUrgent ? "var(--cafe-danger-border)" : "var(--cafe-border-light)"}` }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>👨‍🍳</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: isUrgent ? "var(--cafe-danger)" : "var(--cafe-text-primary)", marginBottom: 2 }}>{getOrderCustomerName(o)} <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "var(--cafe-text-tertiary)" }}>{{ NEW: "New", ACCEPTED: "Accepted", PREPARING: "Cooking" }[o.status]}</span></div>
                                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderDisplayItems(o)}</div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: isUrgent ? "var(--cafe-danger)" : "var(--cafe-accent)", fontFamily: "monospace" }}>{mins}m</div>
                                {isUrgent && <div style={{ fontSize: 10, color: "var(--cafe-danger)", fontWeight: 700 }}>LATE</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ marginBottom: 14 }}>
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
            <div className="pos-checkout-screen">
              {/* Sticky header */}
              <div className="pos-mobile-header">
                <button onClick={() => setPosMobileTab("cart")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.amber2, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>
                  ← Cart
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  🧾 Checkout
                </span>
                <span style={{ width: 60 }} />
              </div>

              {/* Scrollable body */}
              <div className="pos-checkout-scroll">
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
              <div className="pos-place-order-bar">
                <button 
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                  style={{
                    width: "100%", padding: "16px 0", borderRadius: 12, border: "none",
                    background: isPlacingOrder ? C.bg4 : `linear-gradient(135deg, ${C.amber} 0%, ${C.amber2} 100%)`,
                    color: isPlacingOrder ? C.text3 : "#1a0e00",
                    fontSize: 15, fontWeight: 800, cursor: isPlacingOrder ? "not-allowed" : "pointer",
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
