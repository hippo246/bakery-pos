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
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // duplicate-submit guard

  // Simple max lengths for free-text notes (task: notes safety)
  const ORDER_NOTES_MAX = 500;
  const ITEM_NOTES_MAX = 200;

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

  // Dev-only console warning (silent in production builds)
  const devWarn = useCallback((...args) => {
    try {
      const isDev = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
        (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production");
      if (isDev) console.warn(...args);
    } catch {
      // ignore - environment doesn't expose dev flags
    }
  }, []);

  // Validate cart items are well-formed before building an order
  const validateCartItems = useCallback((items) => {
    for (const item of items) {
      if (!item.name || typeof item.name !== "string") {
        return "Cart has an item with a missing name";
      }
      if (!(item.qty > 0)) {
        return `${item.name || "An item"} has an invalid quantity`;
      }
      if (!(item.price >= 0)) {
        return `${item.name || "An item"} has an invalid price`;
      }
    }
    return null;
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
    let result = orders || [];
    if (filter !== "ALL") {
      if (isStatusFilter(filter)) result = result.filter((o) => o && o.status === filter);
      else if (isSrcFilter(filter)) result = result.filter((o) => o && o.source === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => {
        if (!o) return false;
        let customerName = "";
        let displayItems = "";
        try { customerName = (getOrderCustomerName(o) || "").toLowerCase(); } catch { /* malformed order */ }
        try { displayItems = (getOrderDisplayItems(o) || "").toLowerCase(); } catch { /* malformed order */ }
        const id = typeof o.id === "string" ? o.id.toLowerCase() : "";
        const phone = typeof o.customerPhone === "string" ? o.customerPhone : "";
        const tableId = typeof o.tableId === "string" ? o.tableId.toLowerCase() : "";
        return (
          customerName.includes(q) ||
          id.includes(q) ||
          phone.includes(q) ||
          tableId.includes(q) ||
          displayItems.includes(q)
        );
      });
    }
    // Return a new array (never mutate/reorder the source "orders" array)
    return result.slice();
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
        price: Number.isFinite(menuItem.price) ? menuItem.price : (Number(menuItem.price) || 0), 
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
    if (!Number.isFinite(delta) || delta === 0) {
      devWarn("Ignored invalid cart qty change:", { itemId, delta });
      return;
    }
    setCart(prev => {
      const exists = prev.some(item => item.id === itemId);
      if (!exists) {
        showToast("Item is no longer in the cart", "error");
        return prev;
      }
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const currentQty = Number.isFinite(item.qty) ? item.qty : 1;
        const currentPrice = Number.isFinite(item.price) ? item.price : (Number(item.price) || 0);
        const newQty = currentQty + delta;
        // Quantity never goes below 1 from the +/- controls; removal is explicit via the × button
        return { ...item, qty: newQty < 1 ? 1 : newQty, price: currentPrice };
      });
    });
  }, [devWarn, showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }, []);

  const updateCartItemNotes = useCallback((itemId, notes) => {
    const safeNotes = (typeof notes === "string" ? notes : "").trim().slice(0, ITEM_NOTES_MAX);
    setCart(prev => {
      const exists = prev.some(item => item.id === itemId);
      if (!exists) {
        devWarn("Tried to set notes on a cart item that no longer exists:", itemId);
        return prev;
      }
      // Map returns a new array/objects — never mutates the existing cart items in place
      return prev.map(item => item.id === itemId ? { ...item, notes: safeNotes } : item);
    });
  }, [devWarn]);

  // Calculate cart totals (memoized)
  const { cartSubtotal, cartDiscount, cartTax, cartTotal } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
    let discount = appliedDiscount ? calculateDiscountAmount({ total: subtotal }, appliedDiscount) : 0;
    // Never let a stale/oversized discount exceed the subtotal (avoids double-apply / negative totals)
    discount = Math.max(0, Math.min(discount, subtotal));
    const tax = Math.max(0, Math.round((subtotal - discount) * 0.18));
    const total = Math.max(0, subtotal - discount + tax);
    return { cartSubtotal: subtotal, cartDiscount: discount, cartTax: tax, cartTotal: total };
  }, [cart, appliedDiscount]);

  // If the cart changes (items removed) and an applied discount no longer meets its own
  // minimum-order/validity rules, clear it instead of silently keeping a stale discount.
  useEffect(() => {
    if (!appliedDiscount) return;
    const validation = validateDiscount({ total: cartSubtotal }, null, appliedDiscount);
    if (!validation.valid) {
      setAppliedDiscount(null);
      setDiscountError(validation.message || "Discount no longer applies to this cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal]);

  const clearDiscount = useCallback(() => {
    const hadDiscount = !!appliedDiscount;
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
    if (hadDiscount) showToast("Discount removed");
  }, [appliedDiscount, showToast]);

  // Apply discount
  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountError("");
      setAppliedDiscount(null);
      return;
    }

    try {
      const discount = availableDiscounts.find(d => (d.code || "").trim().toUpperCase() === code);
      if (!discount) {
        setDiscountError("Discount code not found");
        setAppliedDiscount(null);
        return;
      }

      if (discount.active === false) {
        setDiscountError("This discount is no longer active");
        setAppliedDiscount(null);
        return;
      }

      if (typeof discount.maxUsage === "number" && typeof discount.usedCount === "number" && discount.usedCount >= discount.maxUsage) {
        setDiscountError("This discount has reached its usage limit");
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

      setDiscountCode(code);
      setDiscountError("");
      setAppliedDiscount(discount);
      showToast("Discount applied successfully");
    } catch (e) {
      devWarn("Discount validation failed:", e);
      setDiscountError("Could not validate discount code");
      setAppliedDiscount(null);
    }
  };

  // Shared: map order type -> source / payment status
  const sourceMap = { "DINE_IN": "WALK_IN", "TAKEAWAY": "WALK_IN", "DIRECT_DELIVERY": "DIRECT_DELIVERY", "SWIGGY": "SWIGGY", "ZOMATO": "ZOMATO" };
  const paymentStatusMap = { "CASH": "PAID", "UPI": "PAID", "CARD": "PAID", "SPLIT": "PARTIAL", "ONLINE": "PAID", "COD": "COD" };

  // Validate everything needed to create an order. Returns an error string, or null if valid.
  const validateOrderForSubmit = useCallback((items) => {
    if (!items || items.length === 0) return "Cart is empty";
    const itemError = validateCartItems(items);
    if (itemError) return itemError;
    if (!ORDER_TYPES.includes(orderType)) return "Please select a valid order type";
    if (orderType === "DINE_IN" && !selectedTable) return "Please select a table for dine-in";
    if (orderType === "DIRECT_DELIVERY") {
      if (!customerPhone.trim()) return "Customer phone is required for delivery";
      if (!customerAddress.trim()) return "Delivery address is required";
    }
    if ((orderType === "SWIGGY" || orderType === "ZOMATO") && !platformOrderId.trim()) {
      return `Platform order ID is required for ${orderType === "SWIGGY" ? "Swiggy" : "Zomato"} orders`;
    }
    return null;
  }, [orderType, selectedTable, customerPhone, customerAddress, platformOrderId, validateCartItems]);

  // Shared: finish creating an order — deduct inventory once, create KDS tickets (no dupes),
  // occupy table, link/update customer, push into orders list, reset POS state, show receipt.
  const finalizeOrderCreation = useCallback((newOrder, successMessage) => {
    // Deduct inventory exactly once, defensively
    if (inventory && setInventory && !newOrder.inventoryDeducted) {
      try {
        const { updatedInventory, warnings } = deductInventoryForOrder(newOrder, inventory, BASIC_RECIPES);
        setInventory(updatedInventory);
        if (warnings && warnings.length > 0) {
          devWarn("Inventory warnings:", warnings);
        }
        newOrder.inventoryDeducted = true;
      } catch (e) {
        devWarn("Inventory deduction failed:", e);
        showToast("Order placed, but inventory could not be updated automatically", "error");
      }
    }

    // Create KDS tickets once — guard against duplicates for the same order, and skip
    // entirely if the order has no kitchen/bar items to ticket
    try {
      const hasStationItems = Array.isArray(newOrder.items) && newOrder.items.some(it => it && it.station);
      const alreadyHasTickets = (kdsCards || []).some(c => c.orderId === newOrder.id);
      if (hasStationItems && !alreadyHasTickets) {
        const kdsTickets = createKdsTicketsFromOrder(newOrder);
        if (kdsTickets && kdsTickets.length > 0 && setKdsCards) {
          setKdsCards([...kdsTickets, ...(kdsCards || [])]);
        }
      }
    } catch (e) {
      devWarn("KDS ticket creation failed:", e);
    }

    // Mark table occupied (dine-in only) without mutating the original table object
    if (orderType === "DINE_IN" && selectedTable && setTables) {
      try {
        const table = availableTables.find(t => t.id === selectedTable);
        if (table) {
          const updatedTable = markTableOccupied({ ...table }, newOrder.id);
          setTables(availableTables.map(t => t.id === selectedTable ? updatedTable : t));
        }
      } catch (e) {
        devWarn("Could not mark table occupied:", e);
      }
    }

    // Link/create customer safely, matching by phone first to avoid duplicates
    if (customerPhone.trim() && setCustomers) {
      try {
        const existing = availableCustomers.find(c => c.phone === customerPhone.trim());
        const customer = getOrCreateCustomerFromOrder(newOrder, availableCustomers);
        if (!existing && customer && !availableCustomers.find(c => c.id === customer.id)) {
          setCustomers([...availableCustomers, customer]);
        }
      } catch (e) {
        devWarn("Customer linking failed:", e);
      }
    }

    setOrders([newOrder, ...orders]);
    // Full draft reset — only happens after the order was actually created
    clearCart(); // clears cart + appliedDiscount + discountCode + discountError
    setSelectedTable(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setPlatformOrderId("");
    setOrderNotes("");
    setItemNotesModal(null);
    setItemNotes("");
    setManagerOverride(false);
    if (isMobile) setPosMobileTab("menu");
    setReceiptOrder(newOrder);
    setShowReceipt(true);
    showToast(successMessage || "Order created");
  }, [inventory, setInventory, kdsCards, setKdsCards, orderType, selectedTable, setTables, availableTables, customerPhone, setCustomers, availableCustomers, orders, setOrders, clearCart, devWarn, showToast, isMobile]);

  // Place order
  const placeOrder = () => {
    if (isPlacingOrder) return; // ignore duplicate submit while already submitting
    const validationError = validateOrderForSubmit(cart);
    if (validationError) {
      devWarn("Order validation failed:", validationError, { cart, orderType });
      showToast(validationError, 'error');
      return;
    }

    setIsPlacingOrder(true);
    try {
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
      let stockCheck;
      try {
        const tempOrder = { items: orderItems };
        stockCheck = canFulfillOrder(tempOrder, inventory, BASIC_RECIPES);
      } catch (e) {
        devWarn("Stock check failed:", e);
        stockCheck = { canFulfill: true, missingItems: [] };
      }

      if (!stockCheck.canFulfill) {
        setStockWarningModal({
          missingItems: stockCheck.missingItems,
          orderItems,
        });
        showToast("Order blocked: insufficient stock", "error");
        return;
      }

      const safeNotes = (orderNotes || "").trim().slice(0, ORDER_NOTES_MAX);

      // Create order using domain model — totals are recomputed from cart, never trusted from stale state
      const newOrder = createOrder({
        source: sourceMap[orderType],
        orderType,
        customerName: customerPhone ? "Guest" : "Walk-in Customer",
        customerPhone: customerPhone,
        customerAddress: orderType === "DIRECT_DELIVERY" ? customerAddress : undefined,
        platformOrderId: (orderType === "SWIGGY" || orderType === "ZOMATO") ? platformOrderId.trim() : undefined,
        tableId: orderType === "DINE_IN" ? selectedTable : null,
        items: orderItems,
        subtotal: cartSubtotal,
        discountCode: appliedDiscount?.code || null,
        discountAmount: cartDiscount,
        taxAmount: cartTax,
        total: cartTotal,
        paymentStatus: paymentStatusMap[paymentMethod],
        paymentMethod: paymentMethod === "COD" ? "COD" : paymentMethod,
        notes: safeNotes,
        createdBy: "local-user"
      });

      finalizeOrderCreation(newOrder, "Order created");
    } catch (e) {
      devWarn("Order creation failed:", e);
      showToast("Order failed — please try again", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Confirm order with manager override (only reachable when managerOverride has been enabled)
  const confirmOrderWithOverride = () => {
    if (isPlacingOrder) return; // ignore duplicate submit while already submitting
    if (!stockWarningModal) return;
    if (!managerOverride) {
      showToast("Manager override must be enabled to proceed", "error");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const { orderItems } = stockWarningModal;
      const safeNotes = (orderNotes || "").trim().slice(0, ORDER_NOTES_MAX);

      const newOrder = createOrder({
        source: sourceMap[orderType],
        orderType,
        customerName: customerPhone ? "Guest" : "Walk-in Customer",
        customerPhone: customerPhone,
        customerAddress: orderType === "DIRECT_DELIVERY" ? customerAddress : undefined,
        platformOrderId: (orderType === "SWIGGY" || orderType === "ZOMATO") ? platformOrderId.trim() : undefined,
        tableId: orderType === "DINE_IN" ? selectedTable : null,
        items: orderItems,
        subtotal: cartSubtotal,
        discountCode: appliedDiscount?.code || null,
        discountAmount: cartDiscount,
        taxAmount: cartTax,
        total: cartTotal,
        paymentStatus: paymentStatusMap[paymentMethod],
        paymentMethod: paymentMethod === "COD" ? "COD" : paymentMethod,
        notes: safeNotes ? `${safeNotes} [MANAGER OVERRIDE: LOW STOCK]` : "[MANAGER OVERRIDE: LOW STOCK]",
        createdBy: "local-user"
      });

      setStockWarningModal(null);
      finalizeOrderCreation(newOrder, "Order created with manager override");
      showToast("Manager override used to place order");
    } catch (e) {
      devWarn("Order creation (override) failed:", e);
      showToast("Order failed — please try again", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const toggleSelect = useCallback((id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  // Apply all side effects (table free/customer update/inventory restore) for a single order's
  // status change, then return the updated order object. Mutating helpers are never called twice.
  const applyStatusSideEffects = useCallback((order, nextStatus) => {
    let updated;
    try {
      updated = updateOrderStatus(order, nextStatus);
    } catch (e) {
      devWarn("updateOrderStatus failed, applying minimal status change:", e);
      updated = { ...order, status: nextStatus };
    }
    updated = { ...updated, updatedAt: new Date().toISOString() };
    if (nextStatus === "COMPLETED" && !updated.completedAt) {
      updated.completedAt = new Date().toISOString();
      if (!updated.paymentMethod) {
        devWarn("Order completed without a payment method:", order.id);
        showToast("Order completed, but no payment method was recorded", "error");
      }
    }
    if (nextStatus === "CANCELLED" && !updated.cancelledAt) {
      updated.cancelledAt = new Date().toISOString();
      if (!updated.cancelledReason) updated.cancelledReason = "Cancelled from Orders";
    }

    // Free the table on completion/cancellation
    if (order.tableId && (nextStatus === "COMPLETED" || nextStatus === "CANCELLED") && setTables) {
      try {
        const table = availableTables.find(t => t.id === order.tableId);
        if (table) {
          const freedTable = markTableAvailable({ ...table });
          setTables(availableTables.map(t => t.id === order.tableId ? freedTable : t));
        }
      } catch (e) {
        devWarn("Could not free table:", e);
      }
    }

    // Restore inventory if the order was deducted and is now cancelled
    if (nextStatus === "CANCELLED" && order.inventoryDeducted && inventory && setInventory) {
      try {
        const restoredInventory = restoreInventoryForCancelledOrder(order, inventory, BASIC_RECIPES);
        if (restoredInventory) {
          setInventory(restoredInventory);
          updated.inventoryDeducted = false;
        }
      } catch (e) {
        devWarn("Inventory restore failed:", e);
      }
    }

    // Update customer visit/spend history on completion
    if (nextStatus === "COMPLETED" && order.customerPhone && setCustomers) {
      try {
        const existing = availableCustomers.find(c => c.phone === order.customerPhone);
        if (existing) {
          const updatedCustomer = updateCustomerAfterOrder(existing, updated);
          setCustomers(availableCustomers.map(c => c.id === existing.id ? updatedCustomer : c));
        }
      } catch (e) {
        devWarn("Customer spend update failed:", e);
      }
    }

    return updated;
  }, [availableTables, setTables, inventory, setInventory, availableCustomers, setCustomers, devWarn, showToast]);

  const advanceSelected = useCallback(() => {
    if (selected.size === 0) return;
    let movedCount = 0;
    setOrders(prev => prev.map(o => {
      if (!selected.has(o.id)) return o;
      const next = STATUS_FLOW[o.status];
      if (!next || ["COMPLETED", "CANCELLED"].includes(o.status)) return o;
      movedCount += 1;
      return applyStatusSideEffects(o, next);
    }));
    setSelected(new Set());
    showToast(movedCount > 0 ? `Advanced ${movedCount} order${movedCount !== 1 ? "s" : ""}` : "No eligible orders to advance");
  }, [selected, setOrders, applyStatusSideEffects, showToast]);

  const cancelSelected = useCallback(() => {
    if (selected.size === 0) return;
    if (!window.confirm(`Cancel ${selected.size} selected order(s)? This cannot be undone.`)) return;
    let cancelledCount = 0;
    setOrders(prev => prev.map(o => {
      if (!selected.has(o.id) || !["NEW", "ACCEPTED", "PREPARING"].includes(o.status)) return o;
      cancelledCount += 1;
      return applyStatusSideEffects(o, "CANCELLED");
    }));
    setSelected(new Set());
    showToast(cancelledCount > 0 ? `Cancelled ${cancelledCount} order${cancelledCount !== 1 ? "s" : ""}` : "No eligible orders to cancel");
  }, [selected, setOrders, applyStatusSideEffects, showToast]);

  const generateReceipt = useCallback((order) => {
    setReceiptOrder(order);
    setShowReceipt(true);
  }, []);

  // Closing the receipt clears the held order so a stale receipt can't reopen accidentally;
  // the order itself stays in `orders` untouched.
  const closeReceipt = useCallback(() => {
    setShowReceipt(false);
    setReceiptOrder(null);
  }, []);

  const updateStatus = useCallback((id, status) => {
    let applied = false;
    setOrders(prev => prev.map((o) => {
      if (o.id !== id) return o;
      if (["COMPLETED", "CANCELLED"].includes(o.status)) {
        devWarn(`Blocked status change on terminal order ${id} (${o.status} -> ${status})`);
        return o;
      }
      const isForwardStep = STATUS_FLOW[o.status] === status;
      const isCancel = status === "CANCELLED";
      if (!isForwardStep && !isCancel) {
        devWarn(`Blocked invalid status transition ${o.status} -> ${status} for order ${id}`);
        return o;
      }
      applied = true;
      return applyStatusSideEffects(o, status);
    }));
    if (applied) {
      if (status === "COMPLETED") showToast("Order completed");
      else if (status === "CANCELLED") showToast("Order cancelled");
    }
  }, [setOrders, applyStatusSideEffects, devWarn, showToast]);

  // Single-order cancel with confirmation (mirrors cancelSelected's safety for bulk cancel)
  const cancelOrder = useCallback((order) => {
    if (!order || ["COMPLETED", "CANCELLED"].includes(order.status)) return;
    if (!window.confirm(`Cancel order ${order.id}? This cannot be undone.`)) return;
    updateStatus(order.id, "CANCELLED");
  }, [updateStatus]);

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
      <div style={{ display: "flex", gap: 3, marginBottom: 20, background: C.bg3, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>
        {[
          { id: 'active', label: 'Live Orders', badge: activeCount > 0 ? activeCount : null },
          { id: 'pos', label: 'New Order', badge: cart.length > 0 ? cart.length : null },
        ].map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 9,
              border: 'none',
              background: mode === id ? C.bg2 : 'transparent',
              color: mode === id ? C.amber2 : C.text3,
              fontSize: 13,
              fontWeight: mode === id ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all .15s',
              boxShadow: mode === id ? `0 1px 4px rgba(0,0,0,.18), 0 0 0 1px ${C.border}` : 'none',
            }}
          >
            {label}
            {badge !== null && (
              <span style={{
                background: mode === id ? C.amberDim : C.bg4,
                color: mode === id ? C.amber2 : C.text3,
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 20,
                minWidth: 20,
                textAlign: 'center',
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 24,
          background: C.bg2,
          border: `1px solid ${toast.type === 'error' ? C.red : toast.type === 'success' ? C.green : C.border2}`,
          borderRadius: 40,
          padding: '10px 18px 10px 14px',
          color: C.text,
          fontSize: 13,
          fontWeight: 500,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,.35)',
          animation: 'toastUp 0.22s cubic-bezier(.22,.68,0,1.3)',
          maxWidth: 320,
        }}>
          <style>{`@keyframes toastUp { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
          <span style={{ fontSize: 15, lineHeight: 1 }}>
            {toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}
          </span>
          <span style={{ color: toast.type === 'error' ? C.red : toast.type === 'success' ? C.green : C.text2 }}>
            {toast.message}
          </span>
        </div>
      )}

      {mode === 'active' ? (
        <>
          {/* Summary Row */}
          {(() => {
            const activeOrders = orders.filter(o => !["COMPLETED","CANCELLED"].includes(o.status));
            const needAction = (counts["NEW"] || 0) + (counts["READY"] || 0);
            const paidOrders = orders.filter(o => o.status !== "CANCELLED");
            const revenue = paidOrders.reduce((s, o) => s + getOrderAmount(o), 0);
            const avgOrder = Math.round(revenue / Math.max(1, paidOrders.length));
            const metrics = [
              { label: "Active", val: activeOrders.length, sub: "orders in kitchen", color: C.amber2, urgent: false },
              { label: "Need action", val: needAction, sub: needAction === 1 ? "order waiting" : "orders waiting", color: needAction > 0 ? C.red : C.text3, urgent: needAction > 0 },
              { label: "Revenue", val: "₹" + revenue.toLocaleString(), sub: `${paidOrders.length} orders`, color: C.green, urgent: false },
              { label: "Avg order", val: "₹" + avgOrder.toLocaleString(), sub: "per ticket", color: C.blue, urgent: false },
            ];
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 16 }}>
                {metrics.map(m => (
                  <div key={m.label} style={{ ...card(), padding: "14px 14px 12px", borderColor: m.urgent ? C.redBorder : undefined, background: m.urgent ? C.redBg : undefined }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: m.color, lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: C.text, fontWeight: 600, marginTop: 5 }}>{m.label}</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace", fontWeight: 700 }}>{selected.size} order{selected.size !== 1 ? "s" : ""} selected</span>
              <button style={{ ...btn("primary"), fontSize: 12, padding: "8px 14px" }} onClick={advanceSelected}>Advance all</button>
              <button style={{ ...btn("danger"), fontSize: 12 }} onClick={cancelSelected}>Cancel all</button>
              <button style={{ ...btn("ghost"), fontSize: 12, marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Deselect</button>
            </div>
          )}

          {/* Order List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "56px 24px", color: C.text3 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🍽</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 6 }}>
                  {search.trim() ? `No orders matching "${search}"` : filter !== "ALL" ? `No ${filter.toLowerCase().replace(/_/g, " ")} orders` : "All quiet"}
                </div>
                <div style={{ fontSize: 12, color: C.text3 }}>
                  {search.trim() ? "Try a different name, phone, or order ID" : filter !== "ALL" ? "Switch to All to see every order" : "New orders will appear here"}
                </div>
              </div>
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
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: C.text3, width: 52, flexShrink: 0, letterSpacing: '-.01em' }}>{o.id?.slice(-6) || ''}</div>
                    <span style={pill(src.bg, src.color)}>{srcLabel(o.source)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOrderCustomerName(o)}</div>
                      <div style={{ fontSize: 11, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{getOrderDisplayItems(o)}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: C.amber2 }}>₹{getOrderAmount(o)}</div>
                      <div style={{ fontSize: 10, color: o.paymentStatus === "COD" ? C.red : o.paymentStatus === "PAID" ? C.green : C.text3, fontFamily: "monospace", marginTop: 1 }}>{o.paymentStatus}</div>
                    </div>
                    <span style={pill(sc.bg, sc.color, sc.border)}>{sc.label || o.status}</span>
                    <div style={{
                      fontSize: 10,
                      color: isOld ? C.red : C.text3,
                      fontFamily: "monospace",
                      fontWeight: isOld ? 700 : 400,
                      background: isOld ? C.redBg : 'transparent',
                      border: isOld ? `1px solid ${C.redBorder}` : '1px solid transparent',
                      borderRadius: 5,
                      padding: '2px 6px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>{timeElapsed}m{isOld ? ' !' : ''}</div>
                    <span style={{ color: C.text3, fontSize: 11, marginLeft: 2, opacity: 0.6 }}>{expanded ? "▲" : "▼"}</span>
                  </div>

                  {expanded && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 14px 12px", background: C.bg3 }}>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontSize: 10, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>Order items</div>
                          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{getOrderDisplayItems(o)}</div>
                          {o.notes && (
                            <div style={{ fontSize: 11, color: C.amber, marginTop: 8, background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 6, padding: "5px 8px" }}>
                              {o.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: C.text2, minWidth: 130 }}>
                          {[
                            o.tableId && ['Table', o.tableId],
                            o.customerPhone && ['Phone', o.customerPhone],
                            o.customerAddress && ['Deliver to', o.customerAddress],
                            o.paymentMethod && ['Payment', o.paymentMethod],
                            o.discountAmount > 0 && ['Discount', `-₹${o.discountAmount}`],
                          ].filter(Boolean).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                              <span style={{ color: C.text3, minWidth: 60 }}>{k}</span>
                              <span style={{ color: k === 'Discount' ? C.green : C.text }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        {nextStatus && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, nextStatus); }} style={{ ...btn("primary"), fontSize: 12, padding: "8px 14px" }}>
                            {STATUS_FLOW_LABEL[o.status]}
                          </button>
                        )}
                        {["NEW", "ACCEPTED", "PREPARING"].includes(o.status) && (
                          <button onClick={(e) => { e.stopPropagation(); cancelOrder(o); }} style={{ ...btn("danger"), fontSize: 12 }}>Cancel order</button>
                        )}
                        {o.paymentStatus === "COD" && o.status === "COMPLETED" && (
                          <button onClick={(e) => { e.stopPropagation(); setOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: "PAID", updatedAt: new Date().toISOString() } : x)); showToast("Payment collected"); }} style={{ ...btn("success"), fontSize: 12 }}>Collect payment</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); generateReceipt(o); }} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 14px", marginLeft: "auto" }}>Print receipt</button>
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
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em" }}>Menu</div>
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
                  In stock only
                </label>
              </div>
            </div>

            {/* Middle: Menu Grid */}
            <div className="pos-menu-panel" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, overflowY: "auto", display: isMobile && posMobileTab !== "menu" ? "none" : undefined }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em" }}>
                {categoryFilter === "All" ? "All items" : categoryFilter}
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.amber2, fontFamily: "monospace" }}>₹{item.price}</div>
                          {qty > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => updateCartQty(item.id, -1)}
                                style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${C.border2}`, background: C.bg4, color: C.text2, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                              >−</button>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.amber2, fontFamily: "monospace", minWidth: 14, textAlign: "center" }}>{qty}</span>
                              <button
                                onClick={() => addToCart(item)}
                                style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                              >+</button>
                            </div>
                          )}
                        </div>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Order
                  {cart.length > 0 && <span style={{ fontSize: 11, color: C.text3, fontWeight: 400, marginLeft: 6 }}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>}
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} style={{ background: "transparent", border: "none", color: C.text3, fontSize: 11, cursor: "pointer", padding: "2px 0", textDecoration: "underline", textUnderlineOffset: 3 }}>Clear all</button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px", color: C.text3, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ fontSize: 28, opacity: 0.3 }}>🛒</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text3 }}>Nothing added yet</div>
                  <div style={{ fontSize: 11, color: C.text3, opacity: 0.7 }}>Tap items on the left to add them</div>
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
                            marginTop: 6, 
                            background: "transparent", 
                            border: "none", 
                            color: item.notes ? C.amber : C.text3, 
                            fontSize: 10, 
                            padding: "2px 0", 
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: 2,
                          }}
                        >
                          {item.notes ? "✎ Edit note" : "+ Add note"}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Order Type Selection */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Order type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(68px,1fr))", gap: 5 }}>
                      {[
                        { type: "DINE_IN", icon: "🪑", short: "Dine in" },
                        { type: "TAKEAWAY", icon: "🥡", short: "Takeaway" },
                        { type: "DIRECT_DELIVERY", icon: "🛵", short: "Delivery" },
                        { type: "SWIGGY", icon: "🟠", short: "Swiggy" },
                        { type: "ZOMATO", icon: "🔴", short: "Zomato" },
                      ].map(({ type, icon, short }) => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          style={{
                            ...btn(orderType === type ? "primary" : "ghost"),
                            fontSize: 11,
                            padding: "8px 4px",
                            flexDirection: "column",
                            gap: 3,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{icon}</span>
                          <span>{short}</span>
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
                    <label style={label}>Promo code</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        style={{ ...input, flex: 1, fontFamily: "monospace", letterSpacing: ".05em", textTransform: "uppercase" }}
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyDiscount()}
                        placeholder="e.g. BREW10"
                      />
                      <button
                        onClick={applyDiscount}
                        style={{ ...btn(appliedDiscount ? "ghost" : "primary"), padding: "0 14px", whiteSpace: "nowrap" }}
                      >
                        {appliedDiscount ? "Change" : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{discountError}</div>
                    )}
                    {appliedDiscount && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: C.green }}>
                          Discount applied: -₹{cartDiscount}
                        </div>
                        <button
                          onClick={clearDiscount}
                          style={{ background: "transparent", border: "none", color: C.text3, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Notes */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={label}>Kitchen notes</label>
                    <textarea
                      style={{ ...input, resize: "none" }}
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value.slice(0, ORDER_NOTES_MAX))}
                      placeholder="Allergy info, cooking preferences, seat number…"
                      maxLength={ORDER_NOTES_MAX}
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
                      onClick={placeOrder}
                      disabled={isPlacingOrder}
                      style={{ ...btn("primary"), flex: 1, padding: "13px 0", fontSize: 14, fontWeight: 700, opacity: isPlacingOrder ? 0.6 : 1, cursor: isPlacingOrder ? "not-allowed" : "pointer" }}
                    >
                      {isPlacingOrder ? "Placing…" : `Send to kitchen · ₹${cartTotal}`}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setItemNotesModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 16, padding: 24, width: 400, maxWidth: "95%", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Special instructions</div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>e.g. no onions, extra spicy, allergy info</div>
            <textarea
              style={{ ...input, resize: "none", marginBottom: 8, width: "100%", boxSizing: "border-box" }}
              rows={3}
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value.slice(0, ITEM_NOTES_MAX))}
              placeholder="Add instructions…"
              maxLength={ITEM_NOTES_MAX}
              autoFocus
            />
            <div style={{ fontSize: 10, color: C.text3, textAlign: "right", marginBottom: 16 }}>{itemNotes.length}/{ITEM_NOTES_MAX}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setItemNotesModal(null)} style={{ ...btn("ghost") }}>Discard</button>
              <button
                onClick={() => {
                  updateCartItemNotes(itemNotesModal, itemNotes);
                  setItemNotesModal(null);
                  setItemNotes("");
                }}
                style={{ ...btn("primary") }}
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Modal */}
      {stockWarningModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setStockWarningModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.amber3}`, borderRadius: 16, padding: 24, width: 460, maxWidth: "95%", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.amber }}>Not enough stock</div>
                <div style={{ fontSize: 12, color: C.text3 }}>Inventory check failed for this order</div>
              </div>
            </div>
            <div style={{ marginBottom: 16, padding: 12, background: C.amberDim, borderRadius: 10, border: `1px solid ${C.amber3}` }}>
              {stockWarningModal.missingItems.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.text, padding: "4px 0", borderBottom: i < stockWarningModal.missingItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: C.text3 }}>need {item.required}, have {item.available} {item.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20, fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
              Restock first to fulfil accurately, or use manager override to place anyway and reconcile later.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setStockWarningModal(null)} style={{ ...btn("ghost") }}>Go back</button>
              <button
                onClick={confirmOrderWithOverride}
                disabled={isPlacingOrder}
                style={{ ...btn("primary"), background: C.amberDim, borderColor: C.amber3, color: C.amber2, opacity: isPlacingOrder ? 0.6 : 1, cursor: isPlacingOrder ? "not-allowed" : "pointer" }}
              >
                {isPlacingOrder ? "Placing…" : "Override & place order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={closeReceipt}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20, padding: 0, width: "min(380px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,.5)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Receipt</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{receiptOrder.id}</div>
              </div>
              <button onClick={closeReceipt} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, fontSize: 16, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "0 20px 20px" }}>

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
              <button style={{ ...btn("ghost"), flex: 1 }} onClick={closeReceipt}>Close</button>
              <button style={{ ...btn("primary"), flex: 1 }} onClick={printReceipt}>Print receipt</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
