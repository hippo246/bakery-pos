import React, { useState, useCallback, useMemo, useEffect } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { createOrder, getOrderDisplayItems, getOrderCustomerName, getOrderAmount } from "../../domain/orderModel.js";
import { createKdsTicketsFromOrder } from "../../domain/kdsModel.js";
import { generateId } from "../../domain/ids.js";
import { createReceipt } from "../../domain/documentModel.js";
import { printThermalDocument } from "../../utils/printService.js";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";
import PromptDialog from "../common/PromptDialog";
import SelectionDialog from "../common/SelectionDialog";
import { useAppContext } from "../../context/AppContext.jsx";

const DELIVERY_PARTNERS = {
  DIRECT_DELIVERY: { id: "direct", name: "Direct Delivery", color: "#4CAF50", icon: "🟢", commission: 0, settlementDays: 0, features: ["custom"] },
  SWIGGY: { id: "swiggy", name: "Swiggy", color: "#FC8019", icon: "🟠", commission: 18, settlementDays: 7, features: ["instant", "scheduled", "bulk"] },
  ZOMATO: { id: "zomato", name: "Zomato", color: "#CB202D", icon: "🔴", commission: 20, settlementDays: 5, features: ["instant", "scheduled", "gold"] }
};

const DELIVERY_STATUSES = ["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"];

const INIT_RIDERS = [
  { id: "rider-1", name: "Amit Kumar", phone: "+91 87654 32109", vehicle: "Bike", status: "available", partner: "DIRECT_DELIVERY", rating: 4.5, deliveries: 150 },
  { id: "rider-2", name: "Suresh Reddy", phone: "+91 76543 21098", vehicle: "Bike", status: "on_delivery", partner: "ZOMATO", rating: 4.7, deliveries: 200 },
  { id: "rider-3", name: "Vikram Singh", phone: "+91 65432 10987", vehicle: "Bike", status: "available", partner: "SWIGGY", rating: 4.3, deliveries: 120 },
  { id: "rider-4", name: "Rahul Verma", phone: "+91 54321 09876", vehicle: "Scooter", status: "available", partner: "ZOMATO", rating: 4.6, deliveries: 180 },
  { id: "rider-5", name: "Deepak Sharma", phone: "+91 43210 98765", vehicle: "Bike", status: "available", partner: "DIRECT_DELIVERY", rating: 4.4, deliveries: 95 }
];

const INIT_SETTLEMENTS = [
  { id: "settle-1", partner: "SWIGGY", period: "2024-06-01 to 2024-06-07", totalOrders: 45, totalRevenue: 18500, commission: 3330, netRevenue: 15170, status: "paid", paidDate: "2024-06-10" },
  { id: "settle-2", partner: "ZOMATO", period: "2024-06-01 to 2024-06-05", totalOrders: 38, totalRevenue: 16200, commission: 3240, netRevenue: 12960, status: "pending", paidDate: null }
];

const INIT_DELIVERY_ORDERS = [
  { 
    id: "del-1", 
    orderId: "ord-001",
    source: "SWIGGY",
    platformOrderId: "SWG-2024-001", 
    customer: { name: "Rahul Sharma", phone: "+91 98765 43210", address: "123, MG Road, Bangalore - 560001", pincode: "560001" }, 
    items: [{ name: "Cappuccino", qty: 2, price: 180 }, { name: "Croissant", qty: 1, price: 120 }], 
    subtotal: 300, 
    deliveryFee: 40, 
    commission: 61, 
    total: 340, 
    status: "PACKING", 
    paymentMode: "ONLINE", 
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
    rider: { id: "rider-1", name: "Amit Kumar", phone: "+91 87654 32109", vehicle: "Bike" },
    specialInstructions: "Less sugar in cappuccino",
    notes: ""
  },
  { 
    id: "del-2", 
    orderId: "ord-002",
    source: "ZOMATO",
    platformOrderId: "ZMT-2024-002", 
    customer: { name: "Priya Patel", phone: "+91 87654 32109", address: "456, Brigade Road, Bangalore - 560025", pincode: "560025" }, 
    items: [{ name: "Latte", qty: 1, price: 160 }, { name: "Sandwich", qty: 2, price: 280 }], 
    subtotal: 440, 
    deliveryFee: 35, 
    commission: 95, 
    total: 475, 
    status: "OUT_FOR_DELIVERY", 
    paymentMode: "COD", 
    paymentStatus: "COD",
    codAmount: 475,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 15 * 60000).toISOString(),
    rider: { id: "rider-2", name: "Suresh Reddy", phone: "+91 76543 21098", vehicle: "Bike" },
    specialInstructions: "",
    notes: ""
  },
  { 
    id: "del-3", 
    orderId: "ord-003",
    source: "DIRECT_DELIVERY",
    platformOrderId: "", 
    customer: { name: "Ankit Mehta", phone: "+91 76543 21098", address: "789, Indiranagar, Bangalore - 560038", pincode: "560038" }, 
    items: [{ name: "Espresso", qty: 3, price: 270 }, { name: "Muffin", qty: 3, price: 180 }], 
    subtotal: 450, 
    deliveryFee: 40, 
    commission: 0, 
    total: 490, 
    status: "DELIVERED", 
    paymentMode: "CASH", 
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 30 * 60000).toISOString(),
    rider: { id: "rider-3", name: "Vikram Singh", phone: "+91 65432 10987", vehicle: "Bike" },
    specialInstructions: "Hot espresso",
    notes: ""
  },
  { 
    id: "del-4", 
    orderId: "ord-004",
    source: "ZOMATO",
    platformOrderId: "ZMT-2024-004", 
    customer: { name: "Sneha Gupta", phone: "+91 65432 10987", address: "321, Koramangala, Bangalore - 560034", pincode: "560034" }, 
    items: [{ name: "Americano", qty: 2, price: 200 }, { name: "Cake Slice", qty: 1, price: 150 }], 
    subtotal: 350, 
    deliveryFee: 35, 
    commission: 77, 
    total: 385, 
    status: "PACKING", 
    paymentMode: "ONLINE", 
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 35 * 60000).toISOString(),
    rider: null,
    specialInstructions: "No ice in americano",
    notes: ""
  }
];

export default function Delivery({ deliveryOrders, setDeliveryOrders, orders, setOrders, kdsCards, setKdsCards, menuItems, documents, setDocuments, staff }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  // Safe number formatter – never shows NaN or undefined
  const safeMoney = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const safeStr = (val, fallback = "") => (val == null ? fallback : String(val).trim() || fallback);

  // Try to use context, but fall back to props if not available
  let contextDeliveryOrders, saveDeliveryOrders;
  try {
    const context = useAppContext();
    contextDeliveryOrders = context.deliveryOrders;
    saveDeliveryOrders = context.saveDeliveryOrders;
  } catch (error) {
    // Context not available, use props only
    contextDeliveryOrders = null;
    saveDeliveryOrders = null;
  }

  const [ordersState, setOrdersState] = useState(contextDeliveryOrders || deliveryOrders || INIT_DELIVERY_ORDERS);
  const [riders, setRiders] = useState(INIT_RIDERS);
  const [settlements, setSettlements] = useState(INIT_SETTLEMENTS);

  // Sync with context delivery orders when they change
  useEffect(() => {
    if (contextDeliveryOrders && contextDeliveryOrders.length > 0) {
      setOrdersState(contextDeliveryOrders);
    }
  }, [contextDeliveryOrders]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pipelineFilter, setPipelineFilter] = useState("ALL"); // ALL, PACKING, READY_FOR_PICKUP, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, FAILED, CANCELLED
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("details"); // details, status, rider, new, settings, riders, settlements
  const [viewMode, setViewMode] = useState("list"); // list, kanban
  const [analyticsTab, setAnalyticsTab] = useState("overview"); // overview, partners, performance
  const [showSettings, setShowSettings] = useState(false);
  const [partnerSettings, setPartnerSettings] = useState({
    DIRECT_DELIVERY: { enabled: true, autoAccept: false, commission: 0, minOrder: 50, radius: 10 },
    SWIGGY: { enabled: true, autoAccept: false, commission: 18, minOrder: 100, radius: 5 },
    ZOMATO: { enabled: true, autoAccept: false, commission: 20, minOrder: 150, radius: 5 }
  });
  // Draft copy edited while the settings modal is open. Previously the modal
  // wrote straight into `partnerSettings` on every keystroke, so "Discard"
  // and "Save" were both no-ops that did the exact same thing (close the
  // modal) - Discard couldn't actually undo anything you'd typed.
  const [settingsDraft, setSettingsDraft] = useState(null);

  const openSettings = () => {
    setSettingsDraft(partnerSettings);
    setShowSettings(true);
  };

  const discardSettings = () => {
    setSettingsDraft(null);
    setShowSettings(false);
  };

  const saveSettings = () => {
    if (settingsDraft) setPartnerSettings(settingsDraft);
    setSettingsDraft(null);
    setShowSettings(false);
  };

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [statusBackwardDialog, setStatusBackwardDialog] = useState({ open: false, currentStatus: null, newStatus: null, onConfirm: null });
  const [failureReasonDialog, setFailureReasonDialog] = useState({ open: false, onConfirm: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, onConfirm: null });
  const [riderAssignDialog, setRiderAssignDialog] = useState({ open: false, rider: null, onConfirm: null });
  const [riderRemoveDialog, setRiderRemoveDialog] = useState({ open: false, onConfirm: null });
  const [terminalStateDialog, setTerminalStateDialog] = useState({ open: false, status: null, onClose: null });
  const [statusTransitionDialog, setStatusTransitionDialog] = useState({ open: false, currentStatus: null, requiredStatus: null, onClose: null });
  const [riderNotFoundDialog, setRiderNotFoundDialog] = useState({ open: false, onClose: null });
  const [codCollectionDialog, setCodCollectionDialog] = useState({ open: false, orderId: null, codAmount: 0, onConfirm: null });
  const [cancelOrderDialog, setCancelOrderDialog] = useState({ open: false, onConfirm: null });
  const [bulkPackedDialog, setBulkPackedDialog] = useState({ open: false, count: 0, onConfirm: null });
  const [bulkPickedUpDialog, setBulkPickedUpDialog] = useState({ open: false, count: 0, onConfirm: null });
  const [settlementDialog, setSettlementDialog] = useState({ open: false, partner: null, onConfirm: null });

  // Bulk selection - the two dialogs above were previously declared and
  // rendered but nothing in the UI ever set them open, so "select multiple
  // orders and mark them ready / picked up" was a dead feature. Wired up
  // below alongside checkboxes on the PACKING / READY_FOR_PICKUP cards.
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  useEffect(() => { setSelectedIds(new Set()); }, [pipelineFilter]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSetDeliveryOrders = (newOrders) => {
    setOrdersState(newOrders);
    saveDeliveryOrders(newOrders);
  };

  const filtered = useMemo(() => {
    const safeOrders = Array.isArray(ordersState) ? ordersState : [];
    const q = search.trim().toLowerCase();
    return safeOrders.filter(order => {
      if (!order || typeof order !== "object") return false;
      const matchesStatus = pipelineFilter === "ALL" || order.status === pipelineFilter;
      if (!q) return matchesStatus;
      const cust = order.customer || {};
      const rider = order.rider || {};
      const matchesSearch =
        safeStr(order.orderId).toLowerCase().includes(q) ||
        safeStr(order.platformOrderId).toLowerCase().includes(q) ||
        safeStr(cust.name).toLowerCase().includes(q) ||
        safeStr(cust.phone).includes(q) ||
        safeStr(cust.address).toLowerCase().includes(q) ||
        safeStr(rider.name).toLowerCase().includes(q) ||
        safeStr(order.source).toLowerCase().includes(q) ||
        safeStr(order.status).toLowerCase().includes(q) ||
        safeStr(order.paymentStatus).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [ordersState, pipelineFilter, search]);

  const analytics = useMemo(() => {
    const safeOrders = Array.isArray(ordersState) ? ordersState : [];
    const totalOrders = safeOrders.length;
    const totalRevenue = safeOrders.reduce((sum, o) => sum + safeMoney(o.total), 0);
    const totalCommission = safeOrders.reduce((sum, o) => sum + safeMoney(o.commission), 0);
    const netRevenue = Math.max(0, totalRevenue - totalCommission);
    
    const partnerStats = {
      DIRECT_DELIVERY: safeOrders.filter(o => o.source === "DIRECT_DELIVERY"),
      SWIGGY: safeOrders.filter(o => o.source === "SWIGGY"),
      ZOMATO: safeOrders.filter(o => o.source === "ZOMATO")
    };

    const statusCounts = {};
    DELIVERY_STATUSES.forEach(status => {
      statusCounts[status] = safeOrders.filter(o => o.status === status).length;
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Additional metrics
    const activeDeliveries = safeOrders.filter(o => ["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)).length;
    const codPending = safeOrders.filter(o => o.paymentStatus === "COD" && !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length;
    const deliveredToday = safeOrders.filter(o => {
      const today = new Date().toDateString();
      const created = o.createdAt ? new Date(o.createdAt) : null;
      return o.status === "DELIVERED" && created && !isNaN(created) && created.toDateString() === today;
    }).length;
    const failedCount = safeOrders.filter(o => o.status === "FAILED").length;
    
    // Calculate average delivery time for delivered orders
    const deliveredOrders = safeOrders.filter(o => o.status === "DELIVERED" && o.estimatedDelivery && o.createdAt);
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, o) => {
          const t1 = new Date(o.estimatedDelivery).getTime();
          const t2 = new Date(o.createdAt).getTime();
          const diff = (!isNaN(t1) && !isNaN(t2)) ? t1 - t2 : 0;
          return sum + diff;
        }, 0) / deliveredOrders.length / 60000
      : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCommission,
      netRevenue,
      partnerStats,
      statusCounts,
      avgOrderValue,
      completionRate: totalOrders > 0 ? Math.round((statusCounts.DELIVERED / totalOrders) * 100) : 0,
      activeDeliveries,
      codPending,
      deliveredToday,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      failedCount
    };
  }, [ordersState]);

  const TERMINAL_STATUSES = ["DELIVERED", "FAILED", "CANCELLED"];
  const STATUS_ORDER = ["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"];

  const updateOrderStatus = (orderId, newStatus) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;

    // Terminal states cannot transition further
    if (TERMINAL_STATUSES.includes(order.status)) {
      setTerminalStateDialog({
        open: true,
        status: order.status,
        onClose: () => setTerminalStateDialog({ open: false, status: null })
      });
      return;
    }

    // Rule: cannot go OUT_FOR_DELIVERY until order is READY
    if (newStatus === "OUT_FOR_DELIVERY" && order.status !== "READY_FOR_PICKUP") {
      setStatusTransitionDialog({
        open: true,
        currentStatus: order.status,
        requiredStatus: "READY_FOR_PICKUP",
        onClose: () => setStatusTransitionDialog({ open: false, currentStatus: null, requiredStatus: null })
      });
      return;
    }

    // Backwards-transition guard (allow CANCELLED from anywhere active, FAILED from active)
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    const isSpecial = newStatus === "FAILED" || newStatus === "CANCELLED";
    if (!isSpecial && newIdx < currentIdx) {
      setStatusBackwardDialog({
        open: true,
        currentStatus: order.status,
        newStatus,
        onConfirm: () => {
          setStatusBackwardDialog({ open: false, currentStatus: null, newStatus: null, onConfirm: null });
          proceedWithStatusChange(orderId, newStatus, order);
        }
      });
      return;
    }

    // FAILED requires a reason
    if (newStatus === "FAILED") {
      setFailureReasonDialog({
        open: true,
        onConfirm: (reason) => {
          setFailureReasonDialog({ open: false, onConfirm: null });
          if (!reason || !reason.trim()) return;
          const now = new Date().toISOString();
          handleSetDeliveryOrders(ordersState.map(o =>
            o.id === orderId ? { ...o, status: "FAILED", failureReason: reason.trim(), failedAt: now, updatedAt: now } : o
          ));
          if (order.rider) setRiders(riders.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
        }
      });
      return;
    }

    // CANCELLED requires confirmation
    if (newStatus === "CANCELLED") {
      setCancelDialog({
        open: true,
        onConfirm: () => {
          setCancelDialog({ open: false, onConfirm: null });
          proceedWithStatusChange(orderId, newStatus, order);
        }
      });
      return;
    }

    proceedWithStatusChange(orderId, newStatus, order);
  };

  const proceedWithStatusChange = (orderId, newStatus, order) => {
    const now = new Date().toISOString();
    const extra = newStatus === "DELIVERED" ? { deliveredAt: now } : {};

    // Update delivery order status
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, status: newStatus, updatedAt: now, ...extra } : o
    ));
    
    // Sync with main orders if exists
    if (orders && setOrders) {
      const mainOrder = orders.find(o => o.id === order.orderId);
      if (mainOrder) {
        // NOTE: previously called `updateOrderStatus(mainOrder, newStatus)` here,
        // which accidentally invoked this component's own updateOrderStatus(orderId, newStatus)
        // function (a naming collision, not the domain helper it looks like). That
        // function returns nothing, so the main order was being overwritten with
        // `undefined` on every synced status change. Patch the main order in place instead.
        const updatedMainOrder = { ...mainOrder, status: newStatus, updatedAt: now };
        setOrders(orders.map(o => 
          o.id === mainOrder.id ? updatedMainOrder : o
        ));
      }
    }

    // Sync with Kitchen KDS if preparing
    if (kdsCards && setKdsCards && (newStatus === "PACKING" || newStatus === "READY_FOR_PICKUP")) {
      const existingKds = kdsCards.find(k => k.orderId === order.orderId);
      if (!existingKds && newStatus === "PACKING") {
        // Create new KDS card for delivery order using domain model
        const kdsOrder = createOrder({
          id: order.orderId,
          source: order.source,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          items: order.items.map(i => ({
            id: generateId(),
            menuItemId: generateId(),
            name: i.name,
            qty: i.qty,
            price: i.price,
            modifiers: [],
            station: "Kitchen",
            notes: ""
          })),
          total: order.total,
          status: "PREPARING",
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMode,
          notes: order.specialInstructions
        });
        const kdsTickets = createKdsTicketsFromOrder(kdsOrder);
        if (kdsTickets.length > 0) {
          setKdsCards([...kdsCards, ...kdsTickets]);
        }
      } else if (existingKds && newStatus === "READY_FOR_PICKUP") {
        // Mark KDS card as complete
        setKdsCards(kdsCards.map(k => 
          k.id === existingKds.id ? { ...k, status: "completed" } : k
        ));
      }
    }
  };

  const assignRider = (orderId, riderId) => {
    if (!riderId) return;
    const safeRiders = Array.isArray(riders) ? riders : [];
    const rider = safeRiders.find(r => r.id === riderId);
    if (!rider) { 
      setRiderNotFoundDialog({
        open: true,
        onClose: () => setRiderNotFoundDialog({ open: false })
      });
      return;
    }
    if (rider.status !== "available") {
      setRiderAssignDialog({
        open: true,
        rider,
        onConfirm: () => {
          setRiderAssignDialog({ open: false, rider: null, onConfirm: null });
          proceedWithRiderAssign(orderId, rider);
        }
      });
      return;
    }
    proceedWithRiderAssign(orderId, rider);
  };

  const proceedWithRiderAssign = (orderId, rider) => {
    const now = new Date().toISOString();
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, rider: { id: rider.id, name: rider.name, phone: safeStr(rider.phone), vehicle: safeStr(rider.vehicle, "Bike") }, assignedAt: now, updatedAt: now } : o
    ));
    setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === rider.id ? { ...r, status: "on_delivery" } : r));
  };

  const markPacked = (orderId) => {
    updateOrderStatus(orderId, "READY_FOR_PICKUP");
  };

  const markPickedUp = (orderId) => {
    updateOrderStatus(orderId, "PICKED_UP");
  };

  const handleBulkMarkReady = () => {
    const ids = [...selectedIds].filter(id => {
      const o = ordersState.find(x => x.id === id);
      return o && o.status === "PACKING";
    });
    if (ids.length === 0) return;
    setBulkPackedDialog({
      open: true,
      count: ids.length,
      onConfirm: () => {
        setBulkPackedDialog({ open: false, count: 0, onConfirm: null });
        const idSet = new Set(ids);
        const now = new Date().toISOString();
        handleSetDeliveryOrders(ordersState.map(o => idSet.has(o.id) ? { ...o, status: "READY_FOR_PICKUP", updatedAt: now } : o));
        if (kdsCards && setKdsCards) {
          const orderIdSet = new Set(ids.map(id => ordersState.find(o => o.id === id)?.orderId).filter(Boolean));
          setKdsCards(kdsCards.map(k => orderIdSet.has(k.orderId) ? { ...k, status: "completed" } : k));
        }
        setSelectedIds(new Set());
      }
    });
  };

  const handleBulkMarkPickedUp = () => {
    const ids = [...selectedIds].filter(id => {
      const o = ordersState.find(x => x.id === id);
      return o && o.status === "READY_FOR_PICKUP";
    });
    if (ids.length === 0) return;
    setBulkPickedUpDialog({
      open: true,
      count: ids.length,
      onConfirm: () => {
        setBulkPickedUpDialog({ open: false, count: 0, onConfirm: null });
        const idSet = new Set(ids);
        const now = new Date().toISOString();
        handleSetDeliveryOrders(ordersState.map(o => idSet.has(o.id) ? { ...o, status: "PICKED_UP", updatedAt: now } : o));
        setSelectedIds(new Set());
      }
    });
  };

  const markOutForDelivery = (orderId) => {
    updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
  };

  const markDelivered = (orderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;
    if (TERMINAL_STATUSES.includes(order.status)) { 
      setTerminalStateDialog({
        open: true,
        status: order.status,
        onClose: () => setTerminalStateDialog({ open: false, status: null })
      });
      return;
    }

    // If COD, show warning dialog to confirm cash collection
    if (order.paymentMode === "COD" && order.paymentStatus !== "PAID") {
      setCodCollectionDialog({
        open: true,
        orderId,
        codAmount: order.codAmount,
        onConfirm: () => {
          setCodCollectionDialog({ open: false, orderId: null, codAmount: 0, onConfirm: null });
          proceedWithDelivery(orderId, true);
        }
      });
      return;
    }

    proceedWithDelivery(orderId, false);
  };

  const printDeliveryReceipt = (deliveryOrder) => {
    // Create a receipt document from the delivery order
    const branch = { id: 'BRANCH-1', name: 'Main Branch' };
    const staffMember = staff?.[0] || { id: 'STAFF-001', name: 'System' };
    
    // Convert delivery order to a format compatible with createReceipt
    const orderForReceipt = {
      id: deliveryOrder.orderId || deliveryOrder.id,
      customerName: deliveryOrder.customer?.name,
      customerPhone: deliveryOrder.customer?.phone,
      items: deliveryOrder.items || [],
      total: deliveryOrder.total,
      subtotal: deliveryOrder.subtotal,
      taxAmount: 0,
      serviceCharge: 0,
      deliveryCharge: deliveryOrder.deliveryFee || 0,
      discountAmount: 0,
      paymentMethod: deliveryOrder.paymentMode,
      paymentStatus: deliveryOrder.paymentStatus,
      tableId: null,
      source: deliveryOrder.source,
      createdAt: deliveryOrder.createdAt,
      notes: deliveryOrder.specialInstructions || deliveryOrder.notes
    };
    
    const receipt = createReceipt(orderForReceipt, staffMember, branch);
    
    // Add to documents if setDocuments is available
    if (setDocuments && documents) {
      setDocuments([...documents, receipt]);
    }
    
    // Print using thermal layout
    printThermalDocument(receipt, '58mm');
  };

  const proceedWithDelivery = (orderId, codCollected) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;

    const now = new Date().toISOString();
    // If COD, mark payment collected
    const paymentUpdate = codCollected ? { paymentStatus: "PAID" } : {};
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, status: "DELIVERED", deliveredAt: now, updatedAt: now, ...paymentUpdate } : o
    ));
    
    // Sync with main orders
    if (orders && setOrders) {
      const mainOrder = orders.find(o => o.id === order.orderId);
      if (mainOrder) {
        setOrders(orders.map(o => 
          o.id === mainOrder.id ? { ...o, status: "DELIVERED", ...paymentUpdate } : o
        ));
      }
    }
    
    // Update rider status to available
    if (order.rider && order.rider.id) {
      setRiders(prev => prev.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
  };

  const markFailed = (orderId) => {
    // Delegate to updateOrderStatus which handles reason prompt and rider release
    updateOrderStatus(orderId, "FAILED");
  };

  const reassignRider = (orderId, newRiderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;
    if (!newRiderId) {
      // Clearing rider — require confirmation
      setRiderRemoveDialog({
        open: true,
        onConfirm: () => {
          setRiderRemoveDialog({ open: false, onConfirm: null });
          if (order.rider && order.rider.id) {
            setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
          }
          const now = new Date().toISOString();
          handleSetDeliveryOrders(ordersState.map(o => o.id === orderId ? { ...o, rider: null, updatedAt: now } : o));
        }
      });
      return;
    }
    // Free up old rider first
    if (order.rider && order.rider.id) {
      setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
    assignRider(orderId, newRiderId);
  };

  const collectCOD = (orderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order || order.paymentStatus !== "COD") return;
    
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, paymentStatus: "PAID" } : o
    ));
    
    // Sync with main orders
    if (orders && setOrders) {
      const mainOrder = orders.find(o => o.id === order.orderId);
      if (mainOrder) {
        setOrders(orders.map(o => 
          o.id === mainOrder.id ? { ...o, paymentStatus: "PAID" } : o
        ));
      }
    }
  };

  const cancelOrder = (orderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;
    if (TERMINAL_STATUSES.includes(order.status)) { 
      setTerminalStateDialog({
        open: true,
        status: order.status,
        onClose: () => setTerminalStateDialog({ open: false, status: null })
      });
      return;
    }
    const active = ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status);
    setCancelOrderDialog({
      open: true,
      active,
      onConfirm: () => {
        setCancelOrderDialog({ open: false, active: false, onConfirm: null });
        updateOrderStatus(orderId, "CANCELLED");
        if (order.rider && order.rider.id) {
          setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PACKING: "var(--cafe-warning)",
      READY_FOR_PICKUP: "var(--cafe-success)",
      PICKED_UP: "var(--cafe-info)",
      OUT_FOR_DELIVERY: "var(--cafe-accent)",
      DELIVERED: "var(--cafe-success)",
      FAILED: "var(--cafe-danger)",
      CANCELLED: "var(--cafe-danger)"
    };
    return colors[status] || "var(--cafe-text-tertiary)";
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Delivery Operations
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
          Manage dispatch, riders, delivery status, and customer handoff
        </div>

        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexWrap: "wrap" }}>
          {[
            { label: "Ready for Pickup", count: analytics.statusCounts.READY_FOR_PICKUP || 0, color: "var(--cafe-success)" },
            { label: "Assigned", count: analytics.statusCounts.PICKED_UP || 0, color: "var(--cafe-info)" },
            { label: "Out for Delivery", count: analytics.statusCounts.OUT_FOR_DELIVERY || 0, color: "var(--cafe-accent)" },
            { label: "Delayed", count: ordersState.filter(o => {
              if (!o.estimatedDelivery || !["PACKING","READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY"].includes(o.status)) return false;
              const etaMin = Math.round((new Date(o.estimatedDelivery) - Date.now()) / 60000);
              return etaMin < 0;
            }).length, color: "var(--cafe-danger)" },
            { label: "Delivered Today", count: analytics.deliveredToday || 0, color: "var(--cafe-success)" },
            { label: "Failed", count: analytics.failedCount || 0, color: analytics.failedCount > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" },
            { label: "COD Pending", count: analytics.codPending || 0, color: analytics.codPending > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
          ].map(chip => (
            <div key={chip.label} style={{
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: "var(--cafe-radius-md)",
              padding: isMobile ? "6px 10px" : "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 6 : 8,
            }}>
              <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 700, color: chip.color, fontFamily: "monospace" }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Pipeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: isMobile ? 4 : 6, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { key: "ALL", label: "All", count: ordersState.length, color: "var(--cafe-text-secondary)" },
            { key: "PACKING", label: "Preparing", count: analytics.statusCounts.PACKING || 0, color: "var(--cafe-warning)" },
            { key: "READY_FOR_PICKUP", label: "Ready", count: analytics.statusCounts.READY_FOR_PICKUP || 0, color: "var(--cafe-success)" },
            { key: "PICKED_UP", label: "Assigned", count: analytics.statusCounts.PICKED_UP || 0, color: "var(--cafe-info)" },
            { key: "OUT_FOR_DELIVERY", label: "Out", count: analytics.statusCounts.OUT_FOR_DELIVERY || 0, color: "var(--cafe-accent)" },
            { key: "DELIVERED", label: "Delivered", count: analytics.statusCounts.DELIVERED || 0, color: "var(--cafe-success)" },
            { key: "FAILED", label: "Failed", count: analytics.statusCounts.FAILED || 0, color: "var(--cafe-danger)" },
          ].map(stage => {
            const isSelected = pipelineFilter === stage.key;
            const hasUrgency = stage.key === "READY_FOR_PICKUP" && stage.count > 0;
            return (
              <button
                key={stage.key}
                onClick={() => setPipelineFilter(stage.key)}
                style={{
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "var(--cafe-radius-md)",
                  border: `1px solid ${isSelected ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                  background: isSelected ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  color: isSelected ? "var(--cafe-accent)" : stage.color,
                  fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 500,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <span>{stage.label}</span>
                <span style={{ 
                  fontFamily: "monospace", 
                  fontWeight: 700,
                  fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)"
                }}>{stage.count}</span>
                {hasUrgency && (
                  <span style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: "50%", 
                    background: "var(--cafe-warning)",
                    animation: "pulse 2s infinite"
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dispatch Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", flex: isMobile ? 1 : "auto" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input 
              style={{ ...input, paddingLeft: 32, width: isMobile ? "100%" : 200, fontSize: "var(--cafe-font-sm)" }} 
              placeholder="Order, customer, rider, address…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          {/* Payment filter */}
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Payment</option>
            <option value="PAID">Paid</option>
            <option value="COD">COD</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => { setModalType("riders"); setShowModal(true); }}
            style={{ ...btn("ghost"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}
          >
            Riders
          </button>
          <button 
            onClick={() => { setModalType("settlements"); setShowModal(true); }}
            style={{ ...btn("ghost"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}
          >
            Settlements
          </button>
          <button 
            onClick={openSettings}
            style={{ ...btn("ghost"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Ready for Pickup Queue */}
      {pipelineFilter === "ALL" && filtered.filter(o => o.status === "READY_FOR_PICKUP").length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ready for Pickup Queue
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
            {filtered.filter(o => o.status === "READY_FOR_PICKUP").map(o => {
              const p = DELIVERY_PARTNERS[o.source] || { color: "#999", icon: "📦", name: safeStr(o.source, "Unknown") };
              const cust = o.customer || {};
              const total = safeMoney(o.total);
              const codAmt = safeMoney(o.codAmount);
              const isCodPending = o.paymentMode === "COD" && o.paymentStatus !== "PAID";
              const noRider = !o.rider;
              const elapsedMin = o.createdAt ? Math.round((Date.now() - new Date(o.createdAt)) / 60000) : null;
              
              return (
                <div
                  key={o.id}
                  style={{
                    ...card(),
                    padding: isMobile ? 12 : 16,
                    border: `1px solid ${noRider ? "var(--cafe-warning-border)" : "var(--cafe-border-light)"}`,
                    background: "var(--cafe-bg-card)",
                    borderRadius: "var(--cafe-radius-md)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onClick={() => { setSelectedOrder(o); setModalType("details"); setShowModal(true); }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--cafe-shadow-md)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 8 : 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
                      <div style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: "50%", background: p.color }} />
                      <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)", fontWeight: 700, fontFamily: "monospace" }}>
                        {safeStr(o.platformOrderId) || safeStr(o.orderId, "—")}
                      </span>
                      <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: p.color, fontWeight: 600 }}>
                        {p.name.split(" ")[0]}
                      </span>
                    </div>
                    {elapsedMin !== null && (
                      <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                        {elapsedMin}m waiting
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: isMobile ? 8 : 12 }}>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                      {safeStr(cust.name, "Unknown")}
                    </div>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                      {safeStr(cust.address, "No address")}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 8 : 12 }}>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>
                      ₹{total.toLocaleString()}
                    </div>
                    {isCodPending && (
                      <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-warning)", background: "var(--cafe-warning-bg)", padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                        COD ₹{codAmt}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center" }}>
                    {o.rider ? (
                      <div style={{ flex: 1, fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)" }}>
                        <span style={{ fontWeight: 600 }}>Rider:</span> {o.rider.name}
                      </div>
                    ) : (
                      <div style={{ flex: 1, fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-warning)", fontWeight: 600 }}>
                        No rider assigned
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); markPickedUp(o.id); }}
                      style={{ padding: isMobile ? "4px 10px" : "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600 }}
                    >
                      Mark Picked Up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {(pipelineFilter === "PACKING" || pipelineFilter === "READY_FOR_PICKUP") && selectedIds.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          marginBottom: 12, padding: "10px 14px",
          background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent-border)",
          borderRadius: "var(--cafe-radius-md)"
        }}>
          <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-accent)" }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSelectedIds(new Set())} style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer" }}>
              Clear
            </button>
            {pipelineFilter === "PACKING" && (
              <button onClick={handleBulkMarkReady} style={{ padding: "6px 14px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600 }}>
                Mark Ready for Pickup
              </button>
            )}
            {pipelineFilter === "READY_FOR_PICKUP" && (
              <button onClick={handleBulkMarkPickedUp} style={{ padding: "6px 14px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-info)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600 }}>
                Mark Picked Up
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delivery Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--cafe-text-tertiary)" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📦</div>
            <div style={{ fontSize: "var(--cafe-font-base)", color: "var(--cafe-text-secondary)", fontWeight: 600, marginBottom: 8 }}>
              {search ? "No matching deliveries" : pipelineFilter !== "ALL" ? `No ${pipelineFilter.replace(/_/g, " ").toLowerCase()} deliveries` : "Dispatch queue is clear"}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 20 }}>
              {search ? `No results for "${search}"` : "All deliveries have been processed"}
            </div>
            {(search || pipelineFilter !== "ALL") && (
              <button onClick={() => { setSearch(""); setPipelineFilter("ALL"); }} style={{ padding: "8px 16px", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Clear filters</button>
            )}
          </div>
        )}
        {filtered.filter(o => pipelineFilter !== "ALL" || o.status !== "READY_FOR_PICKUP").map(o => {
          const p = DELIVERY_PARTNERS[o.source] || { color: "#999", icon: "📦", name: safeStr(o.source, "Unknown") };
          const cust = o.customer || {};
          const total = safeMoney(o.total);
          const codAmt = safeMoney(o.codAmount);
          const isActive = ["PACKING","READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY"].includes(o.status);
          const isCodPending = o.paymentMode === "COD" && o.paymentStatus !== "PAID" && isActive;
          const noRider = isActive && !o.rider;
          const isFailed = o.status === "FAILED";
          const isDelivered = o.status === "DELIVERED";
          const isCancelled = o.status === "CANCELLED";
          const statusColor = getStatusColor(o.status);
          const statusLabel = safeStr(o.status, "UNKNOWN").replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
          const orderId = safeStr(o.platformOrderId) || safeStr(o.orderId, "—");
          const elapsedMin = o.createdAt ? Math.round((Date.now() - new Date(o.createdAt)) / 60000) : null;
          const etaMin = o.estimatedDelivery ? Math.round((new Date(o.estimatedDelivery) - Date.now()) / 60000) : null;
          const isLate = etaMin !== null && etaMin < 0 && isActive;
          const isDueSoon = etaMin !== null && etaMin >= 0 && etaMin <= 10 && isActive;
          
          // Time state
          let timeState = "On Time";
          let timeColor = "var(--cafe-success)";
          if (isLate) {
            timeState = `${Math.abs(etaMin)}m late`;
            timeColor = "var(--cafe-danger)";
          } else if (isDueSoon) {
            timeState = `Due in ${etaMin}m`;
            timeColor = "var(--cafe-warning)";
          } else if (etaMin !== null && etaMin > 0) {
            timeState = `Due in ${etaMin}m`;
            timeColor = "var(--cafe-info)";
          } else if (elapsedMin !== null) {
            timeState = `${elapsedMin}m ago`;
            timeColor = "var(--cafe-text-tertiary)";
          }

          return (
            <div
              key={o.id}
              style={{
                ...card(),
                padding: isMobile ? 12 : 16,
                border: `1px solid ${isFailed || isCancelled ? "var(--cafe-danger-border)" : isDelivered ? "var(--cafe-success-border)" : "var(--cafe-border-light)"}`,
                background: "var(--cafe-bg-card)",
                cursor: "pointer",
                opacity: isCancelled ? 0.65 : 1,
                borderLeft: `3px solid ${statusColor}`,
                borderRadius: "var(--cafe-radius-md)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => { setSelectedOrder(o); setModalType("details"); setShowModal(true); }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--cafe-shadow-md)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 10 : 12 }}>
                {/* Bulk-select checkbox (PACKING / READY_FOR_PICKUP only) */}
                {(o.status === "PACKING" || o.status === "READY_FOR_PICKUP") && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(o.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(o.id)}
                    style={{ marginTop: isMobile ? 8 : 12, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
                    aria-label={`Select order ${orderId}`}
                  />
                )}
                {/* Partner indicator */}
                <div style={{ 
                  width: isMobile ? 32 : 40, 
                  height: isMobile ? 32 : 40, 
                  borderRadius: "var(--cafe-radius-sm)", 
                  background: `${p.color}20`, 
                  border: `1px solid ${p.color}40`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: isMobile ? 14 : 16, 
                  flexShrink: 0 
                }}>
                  {p.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 6 : 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, marginBottom: 4 }}>
                        <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-primary)" }}>
                          {orderId}
                        </span>
                        <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: p.color, fontWeight: 600, background: `${p.color}15`, padding: "2px 6px", borderRadius: "var(--cafe-radius-xs)" }}>
                          {p.name.split(" ")[0]}
                        </span>
                      </div>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", fontWeight: 600 }}>
                        {safeStr(cust.name, "Unknown")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>
                        ₹{total.toLocaleString()}
                      </div>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: timeColor, fontWeight: 500, marginTop: 2 }}>
                        {timeState}
                      </div>
                    </div>
                  </div>

                  {/* Address and rider */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 6 : 8 }}>
                    <div style={{ flex: 1, fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {safeStr(cust.address, "No address")}
                    </div>
                    {o.rider && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: isMobile ? 8 : 12 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--cafe-info)" }} />
                        <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", fontWeight: 500 }}>
                          {o.rider.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status and alerts */}
                  <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ 
                      fontSize: "var(--cafe-font-xs)", 
                      padding: "3px 8px", 
                      borderRadius: "var(--cafe-radius-xs)", 
                      background: `${statusColor}20`, 
                      color: statusColor, 
                      fontWeight: 600,
                      textTransform: "capitalize" 
                    }}>
                      {statusLabel}
                    </span>
                    {isCodPending && (
                      <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-warning)", background: "var(--cafe-warning-bg)", padding: "3px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                        COD ₹{codAmt}
                      </span>
                    )}
                    {noRider && (
                      <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-warning)", background: "var(--cafe-warning-bg)", padding: "3px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                        No rider
                      </span>
                    )}
                    {isFailed && o.failureReason && (
                      <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", background: "var(--cafe-danger-bg)", padding: "3px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                        {o.failureReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Detail Panel */}
      {showModal && modalType === "details" && selectedOrder && (() => {
        const so = selectedOrder;
        const cust = so.customer || {};
        const items = Array.isArray(so.items) ? so.items : [];
        const safeRiders = Array.isArray(riders) ? riders : [];
        const isTerminal = TERMINAL_STATUSES.includes(so.status);
        const isActive = ["PACKING","READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY"].includes(so.status);
        const isCodPending = so.paymentMode === "COD" && so.paymentStatus !== "PAID" && !["DELIVERED","FAILED","CANCELLED"].includes(so.status);
        const partnerInfo = DELIVERY_PARTNERS[so.source] || { color: "#999", name: safeStr(so.source, "Unknown") };
        
        // Calculate time states
        const elapsedMin = so.createdAt ? Math.round((Date.now() - new Date(so.createdAt)) / 60000) : null;
        const etaMin = so.estimatedDelivery ? Math.round((new Date(so.estimatedDelivery) - Date.now()) / 60000) : null;
        const isLate = etaMin !== null && etaMin < 0 && isActive;
        const isDueSoon = etaMin !== null && etaMin >= 0 && etaMin <= 10 && isActive;
        let timeState = "On Time";
        let timeColor = "var(--cafe-success)";
        if (isLate) {
          timeState = `${Math.abs(etaMin)}m late`;
          timeColor = "var(--cafe-danger)";
        } else if (isDueSoon) {
          timeState = `Due in ${etaMin}m`;
          timeColor = "var(--cafe-warning)";
        } else if (etaMin !== null && etaMin > 0) {
          timeState = `Due in ${etaMin}m`;
          timeColor = "var(--cafe-info)";
        } else if (elapsedMin !== null) {
          timeState = `${elapsedMin}m ago`;
          timeColor = "var(--cafe-text-tertiary)";
        }

        return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(500px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: 24, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-primary)" }}>
                      {safeStr(so.platformOrderId) || safeStr(so.orderId, "—")}
                    </span>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: partnerInfo.color, fontWeight: 600, background: `${partnerInfo.color}15`, padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)" }}>
                      {partnerInfo.name.split(" ")[0]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: getStatusColor(so.status), fontWeight: 600, textTransform: "capitalize" }}>
                      {safeStr(so.status).replace(/_/g, " ").toLowerCase()}
                    </span>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: timeColor, fontWeight: 500 }}>
                      {timeState}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: 24, flex: 1 }}>
              {/* Customer */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Customer</div>
                <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>{safeStr(cust.name, "Unknown")}</div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 8, fontFamily: "monospace" }}>{safeStr(cust.phone, "No phone on file")}</div>
                {safeStr(cust.address) && (
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                    {cust.address}{safeStr(cust.pincode) ? ` – ${cust.pincode}` : ""}
                  </div>
                )}
                {so.specialInstructions && (
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-warning)", background: "var(--cafe-warning-bg)", padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)" }}>
                    {so.specialInstructions}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Order</div>
                <div style={{ background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-md)", padding: 16 }}>
                  {items.length === 0
                    ? <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>No items</div>
                    : items.map((i, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--cafe-font-sm)", marginBottom: 8, paddingBottom: 8, borderBottom: idx < items.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                          <span style={{ color: "var(--cafe-text-secondary)" }}>{safeMoney(i.qty) || 1}× {safeStr(i.name, "Item")}</span>
                          <span style={{ fontFamily: "monospace", color: "var(--cafe-text-primary)", fontWeight: 600 }}>₹{safeMoney(i.price).toLocaleString()}</span>
                        </div>
                      ))
                  }
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--cafe-border-light)", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Subtotal</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontFamily: "monospace", color: "var(--cafe-text-secondary)" }}>₹{safeMoney(so.subtotal).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Delivery</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontFamily: "monospace", color: "var(--cafe-text-secondary)" }}>₹{safeMoney(so.deliveryFee).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Commission</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontFamily: "monospace", color: "var(--cafe-text-tertiary)" }}>₹{safeMoney(so.commission).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total</div>
                      <div style={{ fontSize: "var(--cafe-font-base)", fontFamily: "monospace", color: "var(--cafe-accent)", fontWeight: 700 }}>₹{safeMoney(so.total).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-md)" }}>
                  <div>
                    <div style={{ fontSize: "var(--cafe-font-sm)" }}>
                      <span style={{ fontWeight: 600, color: so.paymentStatus === "PAID" ? "var(--cafe-success)" : "var(--cafe-warning)" }}>{safeStr(so.paymentStatus, "UNKNOWN")}</span>
                      <span style={{ color: "var(--cafe-text-tertiary)", marginLeft: 8 }}>· {safeStr(so.paymentMode, "—")}</span>
                    </div>
                    {so.paymentMode === "COD" && (
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>COD amount: ₹{safeMoney(so.codAmount).toLocaleString()}</div>
                    )}
                  </div>
                  {isCodPending && (
                    <button onClick={() => collectCOD(so.id)} style={{ padding: "8px 16px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                      Collect Cash
                    </button>
                  )}
                </div>
              </div>

              {/* Failed notice */}
              {so.status === "FAILED" && (
                <div style={{ marginBottom: 20, padding: 12, background: "var(--cafe-danger-bg)", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-danger-border)" }}>
                  <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-danger)", marginBottom: 4 }}>Delivery failed</div>
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>{safeStr(so.failureReason, "No reason recorded")}</div>
                  {so.failedAt && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 4 }}>{formatDate(so.failedAt)} {formatTime(so.failedAt)}</div>}
                </div>
              )}

              {/* Rider */}
              {!isTerminal && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rider</div>
                  {so.rider ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-md)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>{safeStr(so.rider.name)}</div>
                        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>{safeStr(so.rider.phone)} · {safeStr(so.rider.vehicle)}</div>
                      </div>
                      <button onClick={() => reassignRider(so.id, null)} style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer" }}>
                        Remove
                      </button>
                      <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "6px 12px" }} defaultValue="" onChange={e => { if (e.target.value) reassignRider(so.id, e.target.value); }}>
                        <option value="">Reassign…</option>
                        {safeRiders.map(r => (
                          <option key={r.id} value={r.id}>{r.name} · {safeStr(r.vehicle)}{r.status !== "available" ? " (busy)" : ""}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px", width: "100%" }} defaultValue="" onChange={e => { if (e.target.value) assignRider(so.id, e.target.value); }}>
                      <option value="">Assign a rider…</option>
                      {safeRiders.map(r => (
                        <option key={r.id} value={r.id}>{r.name} · {safeStr(r.vehicle)}{r.status !== "available" ? " (busy)" : ""}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Status selector (non-terminal) */}
              {!isTerminal && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                  <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px", width: "100%" }} value={so.status} onChange={e => updateOrderStatus(so.id, e.target.value)}>
                    {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Timeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Order created", time: so.createdAt, completed: true },
                    { label: "Kitchen ready", time: null, completed: ["READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED"].includes(so.status) },
                    { label: "Rider assigned", time: so.assignedAt, completed: !!so.rider },
                    { label: "Picked up", time: null, completed: ["PICKED_UP","OUT_FOR_DELIVERY","DELIVERED"].includes(so.status) },
                    { label: "Out for delivery", time: null, completed: ["OUT_FOR_DELIVERY","DELIVERED"].includes(so.status) },
                    { label: so.status === "DELIVERED" ? "Delivered" : "Delivery deadline", time: so.estimatedDelivery, completed: so.status === "DELIVERED" },
                  ].map((event, idx) => {
                    const isCurrent = !event.completed && idx > 0 && (idx === 1 ? ["READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED"].includes(so.status) : false);
                    return (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: "50%", 
                          background: event.completed ? "var(--cafe-success)" : isCurrent ? "var(--cafe-warning)" : "var(--cafe-border-light)",
                          flexShrink: 0,
                          marginTop: 2
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "var(--cafe-font-sm)", color: event.completed ? "var(--cafe-text-secondary)" : isCurrent ? "var(--cafe-text-primary)" : "var(--cafe-text-tertiary)", fontWeight: event.completed || isCurrent ? 600 : 400 }}>
                            {event.label}
                          </div>
                          {event.time && (
                            <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                              {formatDate(event.time)} {formatTime(event.time)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            {isActive && (
              <div style={{ padding: 16, borderTop: "1px solid var(--cafe-border-light)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {so.status === "PACKING" && (
                  <button onClick={() => markPacked(so.id)} style={{ flex: 1, padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                    Ready for Pickup
                  </button>
                )}
                {so.status === "READY_FOR_PICKUP" && (
                  <button onClick={() => markPickedUp(so.id)} style={{ flex: 1, padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "none", background: "var(--cafe-info)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                    Mark Picked Up
                  </button>
                )}
                {so.status === "PICKED_UP" && (
                  <button onClick={() => markOutForDelivery(so.id)} style={{ flex: 1, padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "none", background: "var(--cafe-accent)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                    Out for Delivery
                  </button>
                )}
                {so.status === "OUT_FOR_DELIVERY" && (
                  <button onClick={() => markDelivered(so.id)} style={{ flex: 1, padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                    Mark Delivered
                  </button>
                )}
                <button onClick={() => printDeliveryReceipt(so)} style={{ padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                  Print Receipt
                </button>
                <button onClick={() => cancelOrder(so.id)} style={{ padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-danger-border)", background: "transparent", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      );})()}

      {/* Riders Modal */}
      {showModal && modalType === "riders" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(540px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Riders</div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
                  {(Array.isArray(riders) ? riders : []).filter(r => r.status === "available").length} available · {(Array.isArray(riders) ? riders : []).filter(r => r.status === "on_delivery").length} on delivery
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(Array.isArray(riders) ? riders : []).map(rider => {
                if (!rider || typeof rider !== "object") return null;
                const partner = DELIVERY_PARTNERS[rider.partner] || { color: "#999", name: safeStr(rider.partner, "Unknown") };
                const rating = safeMoney(rider.rating);
                const deliveries = safeMoney(rider.deliveries);
                const statusColor = rider.status === "available" ? "var(--cafe-success)" : rider.status === "on_delivery" ? "var(--cafe-warning)" : "var(--cafe-danger)";
                const statusLabel = rider.status === "available" ? "Available" : rider.status === "on_delivery" ? "On delivery" : safeStr(rider.status).replace(/_/g, " ");
                return (
                  <div key={rider.id} style={{ ...card(), padding: 12, borderRadius: "var(--cafe-radius-md)", display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--cafe-border-light)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>{safeStr(rider.name, "Unnamed")}</span>
                        <span style={{ fontSize: "var(--cafe-font-xs)", color: partner.color, fontWeight: 600 }}>{partner.name.split(" ")[0]}</span>
                        <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>{safeStr(rider.vehicle)}</span>
                      </div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2, fontFamily: "monospace" }}>{safeStr(rider.phone, "—")}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: statusColor }}>{statusLabel}</div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
                        {rating > 0 && `★ ${rating}`}{deliveries > 0 && ` · ${deliveries} trips`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button style={{ ...btn("ghost"), marginTop: 14, width: "100%", fontSize: "var(--cafe-font-sm)" }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settlements Modal */}
      {showModal && modalType === "settlements" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(560px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Settlements</div>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(Array.isArray(settlements) ? settlements : []).map(settlement => {
                const partner = DELIVERY_PARTNERS[settlement.partner] || { name: safeStr(settlement.partner, "Unknown"), color: "#999" };
                const gross = safeMoney(settlement.totalRevenue);
                const commission = Math.min(safeMoney(settlement.commission), gross);
                const net = Math.max(0, gross - commission);
                const totalOrders = safeMoney(settlement.totalOrders);
                const isPaid = settlement.status === "paid";
                return (
                  <div key={settlement.id} style={{ ...card(), padding: 16, borderRadius: "var(--cafe-radius-md)", borderLeft: `3px solid ${partner.color}`, border: "1px solid var(--cafe-border-light)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>{partner.name}</div>
                        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{safeStr(settlement.period, "—")}</div>
                      </div>
                      <span style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, color: isPaid ? "var(--cafe-success)" : "var(--cafe-warning)", background: isPaid ? "var(--cafe-success-bg)" : "var(--cafe-warning-bg)", borderRadius: "var(--cafe-radius-xs)", padding: "4px 10px" }}>
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingTop: 10, borderTop: "1px solid var(--cafe-border-light)" }}>
                      {[
                        { label: "Orders", val: totalOrders, color: "var(--cafe-text-primary)" },
                        { label: "Revenue", val: `₹${gross.toLocaleString()}`, color: "var(--cafe-success)" },
                        { label: "Commission", val: `₹${commission.toLocaleString()}`, color: "var(--cafe-danger)" },
                        { label: "Net", val: `₹${net.toLocaleString()}`, color: "var(--cafe-accent)" },
                      ].map(cell => (
                        <div key={cell.label}>
                          <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{cell.label}</div>
                          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: cell.color }}>{cell.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {settlement.paidDate && (() => { const d = new Date(settlement.paidDate); return !isNaN(d) ? (
                        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                          Paid {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      ) : <div />; })()}
                      {!settlement.paidDate && <div />}
                      {!isPaid && (
                        <button
                          style={{ padding: "6px 14px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-success)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 600 }}
                          onClick={() => {
                            setSettlementDialog({
                              open: true,
                              partner,
                              onConfirm: () => {
                                setSettlementDialog({ open: false, partner: null, onConfirm: null });
                                const now = new Date().toISOString().slice(0, 10);
                                setSettlements(prev => prev.map(s => s.id === settlement.id ? { ...s, status: "paid", paidDate: now } : s));
                              }
                            });
                          }}
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button style={{ ...btn("ghost"), marginTop: 14, width: "100%", fontSize: "var(--cafe-font-sm)" }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && settingsDraft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={discardSettings}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 14, padding: 20, width: "min(500px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Partner settings</div>
              <button aria-label="Close" onClick={discardSettings} style={{ cursor: "pointer", color: "var(--cafe-text-tertiary)", background: "none", border: "none", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {Object.entries(DELIVERY_PARTNERS).map(([key, partner], idx, arr) => {
              const settings = settingsDraft[key];
              return (
                <div key={key} style={{ marginBottom: idx < arr.length - 1 ? 20 : 0, paddingBottom: idx < arr.length - 1 ? 20 : 0, borderBottom: idx < arr.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: partner.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{partner.name}</span>
                      <span style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", marginLeft: 8 }}>{partner.settlementDays}d settlement · {partner.features.join(", ")}</span>
                    </div>
                    {/* Enabled toggle */}
                    <button
                      onClick={() => setSettingsDraft({ ...settingsDraft, [key]: { ...settings, enabled: !settings.enabled } })}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${settings.enabled ? "var(--cafe-success)" : "var(--cafe-border-light)"}`, background: settings.enabled ? "var(--cafe-success-bg)" : "var(--cafe-bg-surface)", color: settings.enabled ? "var(--cafe-success)" : "var(--cafe-text-tertiary)", cursor: "pointer", fontWeight: 600 }}
                    >
                      {settings.enabled ? "On" : "Off"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={label}>Auto-accept orders</label>
                      <select
                        style={{ ...input, fontSize: 12 }}
                        value={settings.autoAccept ? "true" : "false"}
                        onChange={e => setSettingsDraft({ ...settingsDraft, [key]: { ...settings, autoAccept: e.target.value === "true" } })}
                      >
                        <option value="false">Manual</option>
                        <option value="true">Auto-accept</option>
                      </select>
                    </div>
                    <div>
                      <label style={label}>Commission (%)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.commission} onChange={e => setSettingsDraft({ ...settingsDraft, [key]: { ...settings, commission: parseInt(e.target.value) || 0 } })} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={label}>Min order (₹)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.minOrder} onChange={e => setSettingsDraft({ ...settingsDraft, [key]: { ...settings, minOrder: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div>
                      <label style={label}>Radius (km)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.radius} onChange={e => setSettingsDraft({ ...settingsDraft, [key]: { ...settings, radius: parseInt(e.target.value) || 0 } })} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              <button style={{ ...btn("ghost"), flex: 1, fontSize: 12 }} onClick={discardSettings}>
                Discard
              </button>
              <button style={{ ...btn("primary"), flex: 1, fontSize: 12 }} onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <WarningDialog
        open={statusBackwardDialog.open}
        onClose={() => setStatusBackwardDialog({ open: false, currentStatus: null, newStatus: null, onConfirm: null })}
        onConfirm={statusBackwardDialog.onConfirm}
        title="Move Order Backwards"
        description="Moving an order to an earlier status is unusual."
        warning={`Move from ${statusBackwardDialog.currentStatus?.replace(/_/g, " ")} to ${statusBackwardDialog.newStatus?.replace(/_/g, " ")}?`}
        consequence="This may cause confusion in order tracking and rider assignment."
        confirmLabel="Move Anyway"
      />

      <PromptDialog
        open={failureReasonDialog.open}
        onClose={() => setFailureReasonDialog({ open: false, onConfirm: null })}
        onConfirm={failureReasonDialog.onConfirm}
        title="Enter Failure Reason"
        label="Failure Reason"
        helperText="Explain why this delivery failed (required)"
        placeholder="e.g., Customer not available, Address not found"
        required={true}
        confirmLabel="Mark Failed"
      />

      <DestructiveDialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, onConfirm: null })}
        onConfirm={cancelDialog.onConfirm}
        title="Cancel Delivery Order"
        description="This action cannot be undone."
        recordName="Delivery Order"
        consequence="The order will be marked as cancelled and the rider will be released."
        confirmLabel="Cancel Order"
      />

      <WarningDialog
        open={riderAssignDialog.open}
        onClose={() => setRiderAssignDialog({ open: false, rider: null, onConfirm: null })}
        onConfirm={riderAssignDialog.onConfirm}
        title="Assign Unavailable Rider"
        description="This rider is currently not available."
        warning={`${riderAssignDialog.rider?.name} is currently ${riderAssignDialog.rider?.status?.replace(/_/g, " ")}.`}
        consequence="Assigning this rider may cause conflicts with their current delivery."
        confirmLabel="Assign Anyway"
      />

      <ConfirmDialog
        open={riderRemoveDialog.open}
        onClose={() => setRiderRemoveDialog({ open: false, onConfirm: null })}
        onConfirm={riderRemoveDialog.onConfirm}
        title="Remove Rider Assignment"
        description="Remove the currently assigned rider from this order?"
        confirmLabel="Remove Rider"
      />

      <WarningDialog
        open={cancelOrderDialog.open}
        onClose={() => setCancelOrderDialog({ open: false, active: false, onConfirm: null })}
        onConfirm={cancelOrderDialog.onConfirm}
        title="Cancel Delivery Order"
        description="This action cannot be undone."
        warning={cancelOrderDialog.active ? "Order is with the rider and may be in transit." : "Cancel this delivery order?"}
        consequence="The order will be marked as cancelled and the rider will be released."
        confirmLabel="Cancel Order"
      />

      <ConfirmDialog
        open={bulkPackedDialog.open}
        onClose={() => setBulkPackedDialog({ open: false, count: 0, onConfirm: null })}
        onConfirm={bulkPackedDialog.onConfirm}
        title="Mark Orders Ready"
        description={`Mark ${bulkPackedDialog.count} order${bulkPackedDialog.count > 1 ? "s" : ""} as ready for pickup?`}
        confirmLabel="Mark Ready"
      />

      <ConfirmDialog
        open={bulkPickedUpDialog.open}
        onClose={() => setBulkPickedUpDialog({ open: false, count: 0, onConfirm: null })}
        onConfirm={bulkPickedUpDialog.onConfirm}
        title="Mark Orders Picked Up"
        description={`Mark ${bulkPickedUpDialog.count} order${bulkPickedUpDialog.count > 1 ? "s" : ""} as picked up?`}
        confirmLabel="Mark Picked Up"
      />

      <ConfirmDialog
        open={settlementDialog.open}
        onClose={() => setSettlementDialog({ open: false, partner: null, onConfirm: null })}
        onConfirm={settlementDialog.onConfirm}
        title="Mark Settlement Paid"
        description={`Mark ${settlementDialog.partner?.name} settlement as paid?`}
        confirmLabel="Mark Paid"
      />

      <WarningDialog
        open={terminalStateDialog.open}
        onClose={terminalStateDialog.onClose}
        title="Order Already Terminal"
        description="This order is already in a terminal state and cannot be changed."
        warning={`Order is ${terminalStateDialog.status?.replace(/_/g, " ")}.`}
        consequence="Terminal states (Delivered, Failed, Cancelled) are final."
        confirmLabel="Close"
      />

      <WarningDialog
        open={statusTransitionDialog.open}
        onClose={statusTransitionDialog.onClose}
        title="Invalid Status Transition"
        description="This status transition is not allowed."
        warning={`Order is currently ${statusTransitionDialog.currentStatus?.replace(/_/g, " ")}.`}
        consequence={`Order must be ${statusTransitionDialog.requiredStatus?.replace(/_/g, " ")} before this transition.`}
        confirmLabel="Close"
      />

      <WarningDialog
        open={riderNotFoundDialog.open}
        onClose={riderNotFoundDialog.onClose}
        title="Rider Not Found"
        description="The selected rider could not be found in the system."
        warning="Please select a valid rider from the list."
        consequence="No rider assignment was made."
        confirmLabel="Close"
      />

      <WarningDialog
        open={codCollectionDialog.open}
        onClose={() => setCodCollectionDialog({ open: false, orderId: null, codAmount: 0, onConfirm: null })}
        onConfirm={codCollectionDialog.onConfirm}
        title="Confirm COD Collection"
        description="This order is Cash on Delivery."
        warning={`COD amount: ₹${codCollectionDialog.codAmount?.toLocaleString()}`}
        consequence="Confirm that you have collected the cash from the customer before marking as delivered."
        confirmLabel="Confirm Cash Collected"
      />
    </div>
  );
}
