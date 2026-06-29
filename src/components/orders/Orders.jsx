import { useState, useCallback, useMemo, useEffect } from "react";
import { C, pill, card, btn, input, label, STATUS_FLOW, STATUS_FLOW_LABEL, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS, srcLabel } from "../../styles/theme";
import { INIT_TABLES } from "../../data/tableConstants";
import { createOrder, normalizeOrder, updateOrderStatus, getOrderDisplayItems, getOrderCustomerName, getOrderAmount } from "../../domain/orderModel.js";
import { deductInventoryForOrder, canFulfillOrder, restoreInventoryForCancelledOrder } from "../../domain/inventoryModel.js";
import { BASIC_RECIPES } from "../../domain/inventoryModel.js";
import { getMinutesElapsed } from "../../domain/dates.js";
import { createKdsTicketsFromOrder } from "../../domain/kdsModel.js";
import { validateDiscount, calculateDiscountAmount, applyDiscountToOrder } from "../../domain/discountModel.js";
import { getOrCreateCustomerFromOrder, updateCustomerAfterOrder } from "../../domain/customerModel.js";
import { markTableOccupied, markTableAvailable } from "../../domain/tableModel.js";
import { formatCurrency } from "../../domain/money.js";

function Orders({ orders, setOrders, kdsCards, setKdsCards, menuItems, tables, setTables, staff, discounts, inventory, setInventory, customers, setCustomers }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  // Mode toggle: 'active' or 'pos'
  const [mode, setMode] = useState('active');
  
  // Active Orders state
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  
  // POS state
  const [cart, setCart] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [orderType, setOrderType] = useState("DINE_IN"); // DINE_IN, TAKEAWAY, DIRECT_DELIVERY, SWIGGY, ZOMATO
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [platformOrderId, setPlatformOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [itemNotesModal, setItemNotesModal] = useState(null);
  const [itemNotes, setItemNotes] = useState("");
  const [stockWarningModal, setStockWarningModal] = useState(null);
  const [managerOverride, setManagerOverride] = useState(false);
  const [posMobileTab, setPosMobileTab] = useState("menu"); // "menu" | "cart"

  // Use the passed tables, staff, and discounts instead of local constants
  const availableTables = tables || INIT_TABLES;
  const availableStaff = staff || [];
  const availableDiscounts = discounts || [];
  const availableCustomers = customers || [];

  const SOURCE_FILTERS = ["ALL", "WALK_IN", "SWIGGY", "ZOMATO", "DIRECT_DELIVERY"];
  const STATUS_FILTERS = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];
  const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DIRECT_DELIVERY", "SWIGGY", "ZOMATO"];
  const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "SPLIT", "ONLINE", "COD"];
  const MENU_CATEGORIES = ["All", "Coffee", "Food", "Special", "Popular", "Available only"];

  // Toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filter helpers — defined before the memos that use them
  const isStatusFilter = (f) => STATUS_FILTERS.includes(f);
  const isSrcFilter = (f) => SOURCE_FILTERS.slice(1).includes(f);

  // Memoized counts
  const counts = useMemo(() => {
    const c = {};
    orders.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  // Memoized filtered orders
  const filtered = useMemo(() => {
    let result = orders;
    if (filter !== "ALL") {
      if (isStatusFilter(filter)) result = orders.filter((o) => o.status === filter);
      else if (isSrcFilter(filter)) result = orders.filter((o) => o.source === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) =>
        getOrderCustomerName(o).toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.tableId && o.tableId.toLowerCase().includes(q)) ||
        getOrderDisplayItems(o).toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filter, search]);

  // Cart operations
  const addToCart = useCallback((menuItem) => {
    if (!menuItem.active || menuItem.eightySixed) {
      showToast(`${menuItem.name} is not available`, 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.id === menuItem.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { 
        id: menuItem.id, 
        menuItemId: menuItem.id, 
        name: menuItem.name, 
        qty: 1, 
        price: menuItem.price, 
        category: menuItem.cat,
        modifiers: [],
        notes: ''
      }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateCartQty = useCallback((itemId, delta) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== itemId) return [item];
      const newQty = item.qty + delta;
      if (newQty <= 0) return []; // remove item when decremented to 0
      return [{ ...item, qty: newQty }];
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }, []);

  const updateCartItemNotes = useCallback((itemId, notes) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  }, []);

  // Calculate cart totals (memoized)
  const { cartSubtotal, cartDiscount, cartTax, cartTotal } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = appliedDiscount ? calculateDiscountAmount({ total: subtotal }, appliedDiscount) : 0;
    const tax = Math.round((subtotal - discount) * 0.18);
    return { cartSubtotal: subtotal, cartDiscount: discount, cartTax: tax, cartTotal: subtotal - discount + tax };
  }, [cart, appliedDiscount]);

  // Apply discount
  const applyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError("");
      setAppliedDiscount(null);
      return;
    }

    const discount = availableDiscounts.find(d => d.code === discountCode);
    if (!discount) {
      setDiscountError("Discount code not found");
      setAppliedDiscount(null);
      return;
    }

    const validation = validateDiscount({ total: cartSubtotal }, null, discount);
    if (!validation.valid) {
      setDiscountError(validation.message);
      setAppliedDiscount(null);
      return;
    }

    const discountAmount = calculateDiscountAmount({ total: cartSubtotal }, discount);
    if (discountAmount > cartSubtotal) {
      setDiscountError("Discount exceeds order total");
      setAppliedDiscount(null);
      return;
    }

    setDiscountError("");
    setAppliedDiscount(discount);
    showToast("Discount applied successfully");
  };

  // Place order
  const placeOrder = () => {
    if (cart.length === 0) {
      showToast("Cart is empty", 'error');
      return;
    }

    // Validate order type requirements
    if (orderType === "DINE_IN" && !selectedTable) {
      showToast("Please select a table for dine-in", 'error');
      return;
    }

    if (orderType === "DIRECT_DELIVERY") {
      if (!customerPhone.trim()) {
        showToast("Customer phone is required for delivery", 'error');
        return;
      }
      if (!customerAddress.trim()) {
        showToast("Delivery address is required", 'error');
        return;
      }
    }

    // Build order items for stock check
    const orderItems = cart.map(item => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      qty: item.qty,
      price: item.price,
      modifiers: item.modifiers,
      station: item.category === "Coffee" ? "Bar" : "Kitchen",
      notes: item.notes
    }));

    // Check stock availability
    const tempOrder = { items: orderItems };
    const stockCheck = canFulfillOrder(tempOrder, inventory, BASIC_RECIPES);
    
    if (!stockCheck.canFulfill) {
      setStockWarningModal({
        missingItems: stockCheck.missingItems,
        orderItems,
      });
      return;
    }

    // Map order type to source
    const sourceMap = {
      "DINE_IN": "WALK_IN",
      "TAKEAWAY": "WALK_IN",
      "DIRECT_DELIVERY": "DIRECT_DELIVERY",
      "SWIGGY": "SWIGGY",
      "ZOMATO": "ZOMATO"
    };

    // Determine payment status
    const paymentStatusMap = {
      "CASH": "PAID",
      "UPI": "PAID",
      "CARD": "PAID",
      "SPLIT": "PARTIAL",
      "ONLINE": "PAID",
      "COD": "COD"
    };

    // Create order using domain model
    const newOrder = createOrder({
      source: sourceMap[orderType],
      customerName: customerPhone ? "Guest" : "Walk-in Customer",
      customerPhone: customerPhone,
      tableId: orderType === "DINE_IN" ? selectedTable : null,
      items: orderItems,
      discountCode: appliedDiscount?.code || null,
      discountAmount: cartDiscount,
      taxAmount: cartTax,
      total: cartTotal,
      paymentStatus: paymentStatusMap[paymentMethod],
      paymentMethod: paymentMethod === "COD" ? "COD" : paymentMethod,
      notes: orderNotes
    });

    // Auto-deduct inventory using recipe-based deduction
    if (inventory && setInventory) {
      const { updatedInventory, warnings, updatedOrder } = deductInventoryForOrder(newOrder, inventory, BASIC_RECIPES);
      setInventory(updatedInventory);
      if (warnings.length > 0) {
        console.warn("Inventory warnings:", warnings);
      }
      // Update order with inventoryDeducted flag
      newOrder.inventoryDeducted = true;
    }

    // Create KDS tickets
    const kdsTickets = createKdsTicketsFromOrder(newOrder);
    if (kdsTickets.length > 0 && setKdsCards) {
      setKdsCards([...kdsTickets, ...kdsCards]);
    }

    // Update table status if dine-in
    if (orderType === "DINE_IN" && selectedTable && setTables) {
      const updatedTable = markTableOccupied(availableTables.find(t => t.id === selectedTable), newOrder.id);
      setTables(availableTables.map(t => t.id === selectedTable ? updatedTable : t));
    }

    // Handle customer
    if (customerPhone && setCustomers) {
      const customer = getOrCreateCustomerFromOrder(newOrder, availableCustomers);
      if (!availableCustomers.find(c => c.id === customer.id)) {
        setCustomers([...availableCustomers, customer]);
      }
    }

    setOrders([newOrder, ...orders]);
    clearCart();
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    setOrderNotes("");
    setReceiptOrder(newOrder);
    setShowReceipt(true);
    showToast("Order placed successfully");
  };

  // Confirm order with manager override
  const confirmOrderWithOverride = () => {
    if (!stockWarningModal) return;

    const { orderItems } = stockWarningModal;

    const sourceMap = {
      "DINE_IN": "WALK_IN",
      "TAKEAWAY": "WALK_IN",
      "DIRECT_DELIVERY": "DIRECT_DELIVERY",
      "SWIGGY": "SWIGGY",
      "ZOMATO": "ZOMATO"
    };

    const paymentStatusMap = {
      "CASH": "PAID",
      "UPI": "PAID",
      "CARD": "PAID",
      "SPLIT": "PARTIAL",
      "ONLINE": "PAID",
      "COD": "COD"
    };

    // Create order using domain model
    const newOrder = createOrder({
      source: sourceMap[orderType],
      customerName: customerPhone ? "Guest" : "Walk-in Customer",
      customerPhone: customerPhone,
      tableId: orderType === "DINE_IN" ? selectedTable : null,
      items: orderItems,
      discountCode: appliedDiscount?.code || null,
      discountAmount: cartDiscount,
      taxAmount: cartTax,
      total: cartTotal,
      paymentStatus: paymentStatusMap[paymentMethod],
      paymentMethod: paymentMethod === "COD" ? "COD" : paymentMethod,
      notes: orderNotes + " [MANAGER OVERRIDE: LOW STOCK]"
    });

    // Auto-deduct inventory using recipe-based deduction
    if (inventory && setInventory) {
      const { updatedInventory, warnings, updatedOrder } = deductInventoryForOrder(newOrder, inventory, BASIC_RECIPES);
      setInventory(updatedInventory);
      if (warnings.length > 0) {
        console.warn("Inventory warnings:", warnings);
      }
      // Update order with inventoryDeducted flag
      newOrder.inventoryDeducted = true;
    }

    // Create KDS tickets
    const kdsTickets = createKdsTicketsFromOrder(newOrder);
    if (kdsTickets.length > 0 && setKdsCards) {
      setKdsCards([...kdsTickets, ...kdsCards]);
    }

    // Update table status if dine-in
    if (orderType === "DINE_IN" && selectedTable && setTables) {
      const updatedTable = markTableOccupied(availableTables.find(t => t.id === selectedTable), newOrder.id);
      setTables(availableTables.map(t => t.id === selectedTable ? updatedTable : t));
    }

    // Handle customer
    if (customerPhone && setCustomers) {
      const customer = getOrCreateCustomerFromOrder(newOrder, availableCustomers);
      if (!availableCustomers.find(c => c.id === customer.id)) {
        setCustomers([...availableCustomers, customer]);
      }
    }

    setOrders([newOrder, ...orders]);
    clearCart();
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    setOrderNotes("");
    setStockWarningModal(null);
    setManagerOverride(false);
    setReceiptOrder(newOrder);
    setShowReceipt(true);
    showToast("Order placed with manager override");
  };

  const toggleSelect = useCallback((id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const advanceSelected = useCallback(() => {
    setOrders(prev => prev.map(o => selected.has(o.id) && STATUS_FLOW[o.status] ? { ...o, status: STATUS_FLOW[o.status] } : o));
    setSelected(new Set());
  }, [selected, setOrders]);

  const cancelSelected = useCallback(() => {
    setOrders(prev => prev.map(o => selected.has(o.id) && ["NEW","ACCEPTED","PREPARING"].includes(o.status) ? { ...o, status: "CANCELLED" } : o));
    setSelected(new Set());
  }, [selected, setOrders]);

  const generateReceipt = useCallback((order) => {
    setReceiptOrder(order);
    setShowReceipt(true);
  }, []);

  const updateStatus = useCallback((id, status) => {
    setOrders(prev => prev.map((o) => o.id === id ? updateOrderStatus(o, status) : o));
  }, [setOrders]);

  // Safe receipt generation with escaped values
  const printReceipt = () => {
    if (!receiptOrder) return;
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${escapeHtml(receiptOrder.id)}</title>
          <style>
            body { font-family: monospace; padding: 20px; margin: 0; background: #fff; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div style="font-size: 18px; font-weight: 700;">Brew Cafe</div>
              <div>123 Coffee Street</div>
              <div>Bangalore - 560001</div>
              <div>+91 98765 43210</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div>Order ID: ${escapeHtml(receiptOrder.id)}</div>
              <div>Date: ${new Date(receiptOrder.createdAt || Date.now()).toLocaleString()}</div>
              <div>Customer: ${escapeHtml(getOrderCustomerName(receiptOrder))}</div>
              ${receiptOrder.customerPhone ? `<div>Phone: ${escapeHtml(receiptOrder.customerPhone)}</div>` : ''}
              <div>Payment: ${escapeHtml(receiptOrder.paymentStatus)}</div>
              ${receiptOrder.tableId ? `<div>Table: ${escapeHtml(receiptOrder.tableId)}</div>` : ''}
            </div>
            <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
              <div style="font-size: 12px; font-weight: 700; margin-bottom: 5px;">Items</div>
              ${receiptOrder.items ? receiptOrder.items.map((item, idx) => `
                <div class="item">
                  <span>${escapeHtml(item.qty)}x ${escapeHtml(item.name)}</span>
                  <span>₹${item.price * item.qty}</span>
                </div>
              `).join('') : `<div>${escapeHtml(getOrderDisplayItems(receiptOrder))}</div>`}
            </div>
            <div class="total">
              ${receiptOrder.subtotal && receiptOrder.subtotal !== receiptOrder.total ? `
                <div class="item">
                  <span>Subtotal</span>
                  <span>₹${receiptOrder.subtotal}</span>
                </div>
              ` : ''}
              ${receiptOrder.discountAmount > 0 ? `
                <div class="item">
                  <span>Discount</span>
                  <span>-₹${receiptOrder.discountAmount}</span>
                </div>
              ` : ''}
              <div class="item" style="font-weight: 700; font-size: 14px;">
                <span>Total</span>
                <span>₹${getOrderAmount(receiptOrder)}</span>
              </div>
            </div>
            ${receiptOrder.splitBill ? `
              <div style="margin-top: 10px; font-size: 12px;">
                Split: ₹${Math.round(getOrderAmount(receiptOrder) / receiptOrder.splitBill)} per person (${receiptOrder.splitBill} ways)
              </div>
            ` : ''}
            <div class="footer">
              <div>Thank you for your order!</div>
              <div>Visit us again</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const activeCount = orders.filter(o => !["COMPLETED","CANCELLED"].includes(o.status)).length;

  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button 
          onClick={() => setMode('active')}
          style={{ 
            ...btn(mode === 'active' ? 'primary' : 'ghost'),
            flex: 1,
            padding: '12px',
            fontSize: 14,
            fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          Active Orders
          {activeCount > 0 && (
            <span style={{ background: mode === 'active' ? "rgba(0,0,0,.25)" : C.amberDim, color: mode === 'active' ? C.onColor : C.amber2, fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{activeCount}</span>
          )}
        </button>
        <button 
          onClick={() => setMode('pos')}
          style={{ 
            ...btn(mode === 'pos' ? 'primary' : 'ghost'),
            flex: 1,
            padding: '12px',
            fontSize: 14,
            fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          New Order / POS
          {cart.length > 0 && (
            <span style={{ background: mode === 'pos' ? "rgba(0,0,0,.25)" : C.amberDim, color: mode === 'pos' ? C.onColor : C.amber2, fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{cart.length}</span>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: toast.type === 'error' ? C.redBg : C.greenBg,
          border: `1px solid ${toast.type === 'error' ? C.red : C.green}`,
          borderRadius: 8,
          padding: '12px 16px',
          color: toast.type === 'error' ? C.red : C.green,
          fontSize: 13,
          zIndex: 1000,
          animation: 'toastIn 0.25s ease'
        }}>
          <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          {toast.message}
        </div>
      )}

      {mode === 'active' ? (
        <>
          {/* Summary Row */}
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Active Orders", val: orders.filter(o => !["COMPLETED","CANCELLED"].includes(o.status)).length, color: C.amber2 },
              { label: "Need Action", val: (counts["NEW"] || 0) + (counts["READY"] || 0), color: C.red },
              { label: "Today's Revenue", val: "₹" + orders.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + getOrderAmount(o), 0).toLocaleString(), color: C.green },
              { label: "Avg Order", val: "₹" + Math.round(orders.filter(o=>o.status!=="CANCELLED").reduce((s,o)=>s+getOrderAmount(o),0) / Math.max(1, orders.filter(o=>o.status!=="CANCELLED").length)), color: C.blue },
            ].map(m => (
              <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
              </div>
            ))}
          </div>

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

          {/* Controls */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: "max-content" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
                <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {/* ALL filter */}
              <button onClick={() => setFilter("ALL")} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${filter === "ALL" ? C.amber3 : C.border2}`, background: filter === "ALL" ? C.amberDim : C.bg3, color: filter === "ALL" ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 44 }}>
                All
                <span style={{ background: filter === "ALL" ? C.amber3 : C.bg4, color: filter === "ALL" ? C.amber2 : C.text3, fontSize: 10, padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>{orders.length}</span>
              </button>
              {STATUS_FILTERS.concat(SOURCE_FILTERS.slice(1)).map((f) => {
                const active = filter === f;
                const count = isStatusFilter(f)
                  ? orders.filter(o => o.status === f).length
                  : orders.filter(o => o.source === f).length;
                if (count === 0 && !active) return null;
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${active ? C.amber3 : C.border2}`, background: active ? C.amberDim : C.bg3, color: active ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 44, minWidth: 44 }}>
                    {f === "WALK_IN" ? "Walk-in" : f === "DIRECT_DELIVERY" ? "Delivery" : f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, " ")}
                    {count > 0 && <span style={{ background: active ? C.amber3 : C.bg4, color: active ? C.amber2 : C.text3, fontSize: 10, padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>{count}</span>}
                  </button>
                );
              })}
            </div>
            </div>
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 8, padding: "10px 14px", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace", fontWeight: 700 }}>{selected.size} selected</span>
              <button style={{ ...btn("primary"), fontSize: 12, padding: "10px 14px", minHeight: 44 }} onClick={advanceSelected}>⏩ Advance All</button>
              <button style={{ ...btn("danger"), fontSize: 12, minHeight: 44 }} onClick={cancelSelected}>✕ Cancel All</button>
              <button style={{ ...btn("ghost"), fontSize: 12, marginLeft: "auto", minHeight: 44 }} onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          {/* Order List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: C.text3, fontSize: 14 }}>No orders found</div>
            )}
            {filtered.map((o) => {
              const sc = STATUS_COLORS[o.status] || {};
              const src = SRC_COLORS[o.source] || {};
              const expanded = expandedId === o.id;
              const nextStatus = STATUS_FLOW[o.status];
              const timeElapsed = getMinutesElapsed(o.createdAt);
              const isOld = !["COMPLETED","CANCELLED"].includes(o.status) && timeElapsed > 15;
              return (
                <div key={o.id} style={{ background: isOld ? C.redBg : C.bg2, border: `1px solid ${expanded ? C.border2 : isOld ? C.redBorder : C.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                    <input type="checkbox" checked={selected.has(o.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(o.id); }} onClick={e => e.stopPropagation()} style={{ accentColor: C.amber, cursor: "pointer", flexShrink: 0 }} />
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text3, width: 58, flexShrink: 0 }}>{o.id}</div>
                    <span style={pill(src.bg, src.color)}>{srcLabel(o.source)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderCustomerName(o)}</div>
                      <div style={{ fontSize: 11, color: C.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{getOrderDisplayItems(o)}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.amber2 }}>₹{getOrderAmount(o)}</div>
                      <div style={{ fontSize: 10, color: o.paymentStatus === "COD" ? C.red : C.green, fontFamily: "monospace", marginTop: 1 }}>{o.paymentStatus}</div>
                    </div>
                    <span style={pill(sc.bg, sc.color, sc.border)}>{sc.label || o.status}</span>
                    <div style={{ fontSize: 11, color: isOld ? C.red : C.text3, fontFamily: "monospace", width: 38, textAlign: "right", fontWeight: isOld ? 700 : 400 }}>{timeElapsed}m {isOld && "⚠"}</div>
                    <span style={{ color: C.text3, fontSize: 12, marginLeft: 4 }}>{expanded ? "▲" : "▼"}</span>
                  </div>

                  {expanded && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", background: C.bg3, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 11, color: C.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Items</div>
                        <div style={{ fontSize: 12, color: C.text }}>{getOrderDisplayItems(o)}</div>
                        {o.notes && <div style={{ fontSize: 11, color: C.amber, marginTop: 6, fontStyle: "italic" }}>📝 {o.notes}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: C.text2, minWidth: 120 }}>
                        {o.tableId && <div><span style={{ color: C.text3 }}>Table: </span>{o.tableId}</div>}
                        {o.customerPhone && <div><span style={{ color: C.text3 }}>Phone: </span>{o.customerPhone}</div>}
                        {o.customerAddress && <div><span style={{ color: C.text3 }}>Addr: </span>{o.customerAddress}</div>}
                        {o.paymentMethod && <div><span style={{ color: C.text3 }}>Pay: </span>{o.paymentMethod}</div>}
                        {o.discountAmount > 0 && <div style={{ color: C.green }}>Disc: -₹{o.discountAmount}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {nextStatus && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, nextStatus); }} style={{ ...btn("primary"), fontSize: 11, padding: "6px 12px" }}>
                            {STATUS_FLOW_LABEL[o.status]}
                          </button>
                        )}
                        {["NEW", "ACCEPTED", "PREPARING"].includes(o.status) && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, "CANCELLED"); }} style={btn("danger")}>Cancel</button>
                        )}
                        {o.paymentStatus === "COD" && o.status === "COMPLETED" && (
                          <button onClick={(e) => { e.stopPropagation(); setOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: "PAID" } : x)); }} style={{ ...btn("success"), fontSize: 11 }}>Mark Paid</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); generateReceipt(o); }} style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }}>🧾 Receipt</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* POS Mode */
        <>
          <style>{`
            @media (max-width: 900px) {
              .pos-layout {
                grid-template-columns: 1fr 280px !important;
              }
              .pos-categories {
                display: none !important;
              }
            }
            @media (max-width: 700px) {
              .pos-layout {
                display: flex !important;
                flex-direction: column !important;
                height: auto !important;
                gap: 12px !important;
              }
              .pos-menu-panel { max-height: 55vh; overflow-y: auto; }
              .pos-cart {
                border-radius: 14px !important;
              }
              .pos-mobile-menu { display: flex !important; }
              .pos-mobile-cart { display: flex !important; }
            }
            @media (min-width: 701px) {
              .pos-mobile-tab-bar { display: none !important; }
              .pos-mobile-menu { display: flex !important; }
              .pos-mobile-cart { display: flex !important; }
            }
          `}</style>

          {/* Mobile tab switcher for POS — only shows on small screens */}
          <div className="pos-mobile-tab-bar" style={{ display: "none", gap: 0, marginBottom: 10, background: C.bg3, borderRadius: 10, padding: 3 }}>
            {[["menu", "🍽 Menu"], ["cart", `🛒 Cart${cart.length > 0 ? ` (${cart.length})` : ""}`]].map(([t, lbl]) => (
              <button key={t} onClick={() => setPosMobileTab(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: posMobileTab === t ? C.bg4 : "transparent", color: posMobileTab === t ? C.amber2 : C.text3, fontSize: 13, fontWeight: posMobileTab === t ? 700 : 400, cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>
          
          <div className="pos-layout" style={{ display: "grid", gridTemplateColumns: "180px 1fr 300px", gap: 12, height: "calc(100dvh - 160px)", minHeight: 0 }}>
            {/* Left: Menu Categories */}
            <div className="pos-categories" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, overflowY: "auto" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>Categories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MENU_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      ...btn(categoryFilter === cat ? "primary" : "ghost"),
                      justifyContent: "flex-start",
                      textAlign: "left",
                      padding: "10px 12px",
                      fontSize: 13
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <label style={{ ...label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    style={{ accentColor: C.amber }}
                  />
                  Available only
                </label>
              </div>
            </div>

            {/* Middle: Menu Grid */}
            <div className="pos-menu-panel" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, overflowY: "auto", display: isMobile && posMobileTab !== "menu" ? "none" : undefined }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>
                {categoryFilter === "All" ? "All Items" : categoryFilter}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {menuItems
                  .filter(item => {
                    if (showAvailableOnly && (!item.active || item.eightySixed)) return false;
                    if (categoryFilter === "All") return true;
                    if (categoryFilter === "Available only") return item.active && !item.eightySixed;
                    if (categoryFilter === "Popular") return item.popular;
                    return item.cat === categoryFilter;
                  })
                  .map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const qty = cartItem ? cartItem.qty : 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        style={{
                          ...card(),
                          padding: 12,
                          cursor: (!item.active || item.eightySixed) ? "not-allowed" : "pointer",
                          opacity: (!item.active || item.eightySixed) ? 0.5 : 1,
                          transition: "transform .15s, box-shadow .15s"
                        }}
                        onMouseEnter={(e) => {
                          if (item.active && !item.eightySixed) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${C.amberDim}`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: C.text }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>{item.cat}</div>
                        {item.popular && (
                          <span style={{ 
                            fontSize: 9, 
                            background: C.amberDim, 
                            color: C.amber2, 
                            padding: "2px 6px", 
                            borderRadius: 4, 
                            textTransform: "uppercase",
                            letterSpacing: ".06em"
                          }}>Popular</span>
                        )}
                        {(!item.active || item.eightySixed) && (
                          <span style={{ 
                            fontSize: 9, 
                            background: C.redBg, 
                            color: C.red, 
                            padding: "2px 6px", 
                            borderRadius: 4,
                            textTransform: "uppercase",
                            letterSpacing: ".06em"
                          }}>{item.eightySixed ? "86'd" : "Unavailable"}</span>
                        )}
                        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: C.amber2, fontFamily: "monospace" }}>
                          ₹{item.price}
                        </div>
                        {qty > 0 && (
                          <div style={{ 
                            marginTop: 8, 
                            background: C.amberDim, 
                            color: C.amber2, 
                            padding: "4px 8px", 
                            borderRadius: 6, 
                            fontSize: 12, 
                            fontWeight: 600, 
                            textAlign: "center" 
                          }}>
                            {qty} in cart
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right: Cart and Checkout */}
            <div 
              className={`pos-cart ${cart.length > 0 ? 'open' : ''}`}
              style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, overflowY: "auto", display: isMobile && posMobileTab !== "cart" ? "none" : "flex", flexDirection: "column" }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>
                Cart {cart.length > 0 && <span style={{ fontSize: 12, color: C.text3, fontWeight: 400 }}>({cart.length} item{cart.length !== 1 ? "s" : ""})</span>}
              </div>
              
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: C.text3, fontSize: 13 }}>
                  Cart is empty
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{item.category}</div>
                            {item.notes && (
                              <div style={{ fontSize: 10, color: C.amber, marginTop: 2, fontStyle: "italic" }}>{item.notes}</div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{ background: "transparent", border: "none", color: C.text3, fontSize: 16, cursor: "pointer", padding: 4 }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              style={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: 4, 
                                border: `1px solid ${C.border2}`, 
                                background: C.bg4, 
                                color: C.text2, 
                                cursor: "pointer", 
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              −
                            </button>
                            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.amber2, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              style={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: 4, 
                                border: `1px solid ${C.amber3}`, 
                                background: C.amberDim, 
                                color: C.amber2, 
                                cursor: "pointer", 
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.amber2 }}>
                            ₹{item.price * item.qty}
                          </div>
                        </div>
                        <button
                          onClick={() => { setItemNotesModal(item.id); setItemNotes(item.notes || ""); }}
                          style={{ 
                            marginTop: 8, 
                            background: "transparent", 
                            border: `1px solid ${C.border2}`, 
                            color: C.text3, 
                            fontSize: 10, 
                            padding: "4px 8px", 
                            borderRadius: 4, 
                            cursor: "pointer" 
                          }}
                        >
                          Add note
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Order Type Selection */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Order Type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(70px,1fr))", gap: 6 }}>
                      {ORDER_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          style={{
                            ...btn(orderType === type ? "primary" : "ghost"),
                            fontSize: 11,
                            padding: "8px 6px",
                            textTransform: "uppercase",
                            letterSpacing: ".04em"
                          }}
                        >
                          {type.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Selection for Dine-in */}
                  {orderType === "DINE_IN" && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={label}>Table</label>
                      <select
                        style={{ ...input, width: "100%" }}
                        value={selectedTable || ""}
                        onChange={(e) => setSelectedTable(e.target.value || null)}
                      >
                        <option value="">Select table</option>
                        {availableTables.filter(t => t.status === "available").map(t => (
                          <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Customer Details for Delivery */}
                  {orderType === "DIRECT_DELIVERY" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={label}>Customer Phone</label>
                        <input
                          style={input}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="10-digit number"
                        />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={label}>Delivery Address</label>
                        <input
                          style={input}
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Enter address"
                        />
                      </div>
                    </>
                  )}

                  {/* Platform Order ID for Swiggy/Zomato */}
                  {(orderType === "SWIGGY" || orderType === "ZOMATO") && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={label}>Platform Order ID</label>
                      <input
                        style={input}
                        value={platformOrderId}
                        onChange={(e) => setPlatformOrderId(e.target.value)}
                        placeholder="Enter platform order ID"
                      />
                    </div>
                  )}

                  {/* Payment Method */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Payment Method</label>
                    <select
                      style={{ ...input, width: "100%" }}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  {/* Discount Code */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Discount Code</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        style={{ ...input, flex: 1 }}
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyDiscount()}
                        placeholder="Enter code"
                      />
                      <button
                        onClick={applyDiscount}
                        style={{ ...btn("primary"), padding: "0 16px" }}
                      >
                        Apply
                      </button>
                    </div>
                    {discountError && (
                      <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{discountError}</div>
                    )}
                    {appliedDiscount && (
                      <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
                        Discount applied: -₹{cartDiscount}
                      </div>
                    )}
                  </div>

                  {/* Order Notes */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Order Notes</label>
                    <textarea
                      style={{ ...input, resize: "none" }}
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Special instructions…"
                    />
                  </div>

                  {/* Totals */}
                  <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.text3 }}>Subtotal</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: C.text }}>₹{cartSubtotal}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: C.green }}>Discount</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: C.green }}>-₹{cartDiscount}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.text3 }}>Tax (18%)</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: C.text }}>₹{cartTax}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>₹{cartTotal}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button
                      onClick={clearCart}
                      style={{ ...btn("ghost"), flex: 1 }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={placeOrder}
                      style={{ ...btn("primary"), flex: 2 }}
                    >
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Item Notes Modal */}
      {itemNotesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setItemNotesModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 20, width: 400, maxWidth: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add Item Note</div>
            <textarea
              style={{ ...input, resize: "none", marginBottom: 12 }}
              rows={3}
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Special instructions for this item…"
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setItemNotesModal(null)}
                style={{ ...btn("ghost") }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateCartItemNotes(itemNotesModal, itemNotes);
                  setItemNotesModal(null);
                  setItemNotes("");
                }}
                style={{ ...btn("primary") }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Modal */}
      {stockWarningModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setStockWarningModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 20, width: 500, maxWidth: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.amber }}>⚠️ Low Stock Warning</div>
            <div style={{ marginBottom: 16, padding: 12, background: "rgba(232,160,32,.1)", borderRadius: 8, border: `1px solid ${C.amber3}` }}>
              <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>The following items have insufficient stock:</div>
              {stockWarningModal.missingItems.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>
                  • {item.name}: Need {item.required} {item.unit}, Have {item.available} {item.unit}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16, fontSize: 12, color: C.text3 }}>
              You can cancel this order to restock, or use manager override to proceed anyway.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setStockWarningModal(null)}
                style={{ ...btn("ghost") }}
              >
                Cancel Order
              </button>
              <button
                onClick={confirmOrderWithOverride}
                style={{ ...btn("primary"), background: C.amberBg, borderColor: C.amber3, color: C.amber2 }}
              >
                Manager Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowReceipt(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(380px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Receipt</div>
              <button onClick={() => setShowReceipt(false)} style={{ background: "transparent", border: "none", color: C.text3, fontSize: 24, cursor: "pointer", padding: 8 }}>×</button>
            </div>

            <div id="receipt-content" style={{ background: "#fff", color: "#000", padding: 20, borderRadius: 8, fontFamily: "monospace" }}>
              <div className="header" style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Brew Cafe</div>
                <div style={{ fontSize: 12 }}>123 Coffee Street</div>
                <div style={{ fontSize: 12 }}>Bangalore - 560001</div>
                <div style={{ fontSize: 12 }}>+91 98765 43210</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12 }}>Order ID: {receiptOrder.id}</div>
                <div style={{ fontSize: 12 }}>Date: {new Date(receiptOrder.createdAt || Date.now()).toLocaleString()}</div>
                <div style={{ fontSize: 12 }}>Customer: {getOrderCustomerName(receiptOrder)}</div>
                {receiptOrder.customerPhone && <div style={{ fontSize: 12 }}>Phone: {receiptOrder.customerPhone}</div>}
                <div style={{ fontSize: 12 }}>Payment: {receiptOrder.paymentStatus}</div>
                {receiptOrder.tableId && <div style={{ fontSize: 12 }}>Table: {receiptOrder.tableId}</div>}
              </div>

              <div style={{ borderBottom: "1px dashed #000", paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Items</div>
                {receiptOrder.items ? receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="item" style={{ display: "flex", justifyContent: "space-between", margin: "5px 0" }}>
                    <span>{item.qty}x {item.name}</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 12 }}>{getOrderDisplayItems(receiptOrder)}</div>
                )}
              </div>

              <div className="total" style={{ borderTop: "1px dashed #000", paddingTop: 10, marginTop: 10 }}>
                {receiptOrder.subtotal && receiptOrder.subtotal !== receiptOrder.total && (
                  <div className="item" style={{ display: "flex", justifyContent: "space-between", margin: "5px 0" }}>
                    <span>Subtotal</span>
                    <span>₹{receiptOrder.subtotal}</span>
                  </div>
                )}
                {receiptOrder.discountAmount > 0 && (
                  <div className="item" style={{ display: "flex", justifyContent: "space-between", margin: "5px 0" }}>
                    <span>Discount</span>
                    <span>-₹{receiptOrder.discountAmount}</span>
                  </div>
                )}
                <div className="item" style={{ display: "flex", justifyContent: "space-between", margin: "5px 0", fontWeight: 700, fontSize: 14 }}>
                  <span>Total</span>
                  <span>₹{getOrderAmount(receiptOrder)}</span>
                </div>
              </div>

              {receiptOrder.splitBill && (
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  Split: ₹{Math.round(getOrderAmount(receiptOrder) / receiptOrder.splitBill)} per person ({receiptOrder.splitBill} ways)
                </div>
              )}

              <div className="footer" style={{ textAlign: "center", marginTop: 20, fontSize: 12 }}>
                <div>Thank you for your order!</div>
                <div>Visit us again</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button style={btn("ghost")} onClick={() => setShowReceipt(false)}>Close</button>
              <button style={btn("primary")} onClick={printReceipt}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
