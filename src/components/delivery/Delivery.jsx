import { useState, useMemo, useEffect } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { createOrder, normalizeOrder, updateOrderStatus, getOrderDisplayItems, getOrderCustomerName, getOrderAmount } from "../../domain/orderModel.js";
import { createKdsTicketsFromOrder } from "../../domain/kdsModel.js";
import { generateId } from "../../domain/ids.js";

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

export default function Delivery({ deliveryOrders, setDeliveryOrders, orders, setOrders, kdsCards, setKdsCards, menuItems }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [ordersState, setOrdersState] = useState(deliveryOrders || INIT_DELIVERY_ORDERS);
  const [riders, setRiders] = useState(INIT_RIDERS);
  const [settlements, setSettlements] = useState(INIT_SETTLEMENTS);
  const [partnerFilter, setPartnerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
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

  const handleSetDeliveryOrders = setDeliveryOrders || setOrdersState;

  const filtered = useMemo(() => {
    const safeOrders = Array.isArray(ordersState) ? ordersState : [];
    const q = search.trim().toLowerCase();
    return safeOrders.filter(order => {
      if (!order || typeof order !== "object") return false;
      const matchesPartner = partnerFilter === "ALL" || order.source === partnerFilter;
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      if (!q) return matchesPartner && matchesStatus;
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
      return matchesPartner && matchesStatus && matchesSearch;
    });
  }, [ordersState, partnerFilter, statusFilter, search]);

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
      alert(`Order is already ${order.status.replace(/_/g, " ")} and cannot be changed.`);
      return;
    }

    // Rule: cannot go OUT_FOR_DELIVERY until order is READY
    if (newStatus === "OUT_FOR_DELIVERY" && order.status !== "READY_FOR_PICKUP") {
      alert("Order must be READY_FOR_PICKUP before going OUT_FOR_DELIVERY");
      return;
    }

    // Backwards-transition guard (allow CANCELLED from anywhere active, FAILED from active)
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    const isSpecial = newStatus === "FAILED" || newStatus === "CANCELLED";
    if (!isSpecial && newIdx < currentIdx) {
      if (!window.confirm(`Move order backwards from ${order.status.replace(/_/g, " ")} to ${newStatus.replace(/_/g, " ")}? This is unusual.`)) return;
    }

    // FAILED requires a reason
    if (newStatus === "FAILED") {
      const reason = window.prompt("Enter failure reason (required):");
      if (!reason || !reason.trim()) { alert("Failure reason is required."); return; }
      const now = new Date().toISOString();
      handleSetDeliveryOrders(ordersState.map(o =>
        o.id === orderId ? { ...o, status: "FAILED", failureReason: reason.trim(), failedAt: now, updatedAt: now } : o
      ));
      // Free rider
      if (order.rider) setRiders(riders.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
      return;
    }

    // CANCELLED requires confirmation
    if (newStatus === "CANCELLED") {
      if (!window.confirm("Cancel this delivery order? This cannot be undone.")) return;
    }

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
        const updatedMainOrder = updateOrderStatus(mainOrder, newStatus);
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
    if (!rider) { alert("Rider not found."); return; }
    if (rider.status !== "available") {
      if (!window.confirm(`${rider.name} is currently ${rider.status.replace(/_/g, " ")}. Assign anyway?`)) return;
    }
    const now = new Date().toISOString();
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, rider: { id: rider.id, name: rider.name, phone: safeStr(rider.phone), vehicle: safeStr(rider.vehicle, "Bike") }, assignedAt: now, updatedAt: now } : o
    ));
    setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === riderId ? { ...r, status: "on_delivery" } : r));
  };

  const markPacked = (orderId) => {
    updateOrderStatus(orderId, "READY_FOR_PICKUP");
  };

  const markPickedUp = (orderId) => {
    updateOrderStatus(orderId, "PICKED_UP");
  };

  const markOutForDelivery = (orderId) => {
    updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
  };

  const markDelivered = (orderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;
    if (TERMINAL_STATUSES.includes(order.status)) { alert("Order already in terminal state."); return; }

    const now = new Date().toISOString();
    // If COD, mark payment collected
    const paymentUpdate = order.paymentMode === "COD" ? { paymentStatus: "PAID" } : {};
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
      if (!window.confirm("Remove the currently assigned rider from this order?")) return;
      if (order.rider && order.rider.id) {
        setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
      }
      const now = new Date().toISOString();
      handleSetDeliveryOrders(ordersState.map(o => o.id === orderId ? { ...o, rider: null, updatedAt: now } : o));
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
    if (TERMINAL_STATUSES.includes(order.status)) { alert(`Order is already ${order.status.replace(/_/g, " ")}.`); return; }
    const active = ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status);
    const msg = active
      ? `Order is ${order.status.replace(/_/g, " ")} and may be with the rider. Cancel anyway?`
      : "Cancel this delivery order?";
    if (!window.confirm(msg)) return;
    updateOrderStatus(orderId, "CANCELLED");
    if (order.rider && order.rider.id) {
      setRiders(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PACKING: C.warning,
      READY_FOR_PICKUP: C.green,
      PICKED_UP: C.purple,
      OUT_FOR_DELIVERY: C.blue,
      DELIVERED: C.green,
      FAILED: C.red,
      CANCELLED: C.red
    };
    return colors[status] || C.text2;
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

  // Safe number formatter – never shows NaN or undefined
  const safeMoney = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const safeStr = (val, fallback = "") => (val == null ? fallback : String(val).trim() || fallback);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 6, marginBottom: 14 }}>
        {[
          { label: "Orders", val: analytics.totalOrders ?? 0, color: C.text1, sub: null },
          { label: "In flight", val: analytics.activeDeliveries ?? 0, color: C.blue, sub: "active now" },
          { label: "Revenue", val: "₹" + safeMoney(analytics.totalRevenue).toLocaleString(), color: C.green, sub: `net ₹${safeMoney(analytics.netRevenue).toLocaleString()}` },
          { label: "COD uncollected", val: analytics.codPending ?? 0, color: analytics.codPending > 0 ? C.amber : C.text3, sub: null },
          { label: "Delivered today", val: analytics.deliveredToday ?? 0, color: C.green, sub: null },
          { label: "Failed", val: analytics.failedCount ?? 0, color: analytics.failedCount > 0 ? C.red : C.text3, sub: null }
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "10px 12px", borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4, fontWeight: 500 }}>{m.label}</div>
            {m.sub && <div style={{ fontSize: 9, color: C.text3, marginTop: 1, opacity: 0.7 }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.text3, pointerEvents: "none" }}>⌕</span>
          <input style={{ ...input, paddingLeft: 26, width: 170, fontSize: 12 }} placeholder="Order, customer, rider…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 4, background: C.bg3, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
          <button
            onClick={() => setPartnerFilter("ALL")}
            style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: partnerFilter === "ALL" ? C.bg2 : "transparent", color: partnerFilter === "ALL" ? C.text1 : C.text3, fontSize: 11, cursor: "pointer", fontWeight: partnerFilter === "ALL" ? 600 : 400, boxShadow: partnerFilter === "ALL" ? `0 1px 3px rgba(0,0,0,.15)` : "none" }}
          >All</button>
          {Object.entries(DELIVERY_PARTNERS).map(([key, partner]) => (
            <button
              key={key}
              onClick={() => setPartnerFilter(partnerFilter === key ? "ALL" : key)}
              style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: partnerFilter === key ? `${partner.color}22` : "transparent", color: partnerFilter === key ? partner.color : C.text3, fontSize: 11, cursor: "pointer", fontWeight: partnerFilter === key ? 700 : 400, transition: "all .12s" }}
            >
              {partner.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <select
          style={{ ...input, fontSize: 11, padding: "5px 8px", height: 32, minHeight: "unset" }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          {DELIVERY_STATUSES.map(status => (
            <option key={status} value={status}>{status.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => { setModalType("riders"); setShowModal(true); }}
            style={{ ...btn("ghost"), padding: "5px 10px", fontSize: 11, height: 32, minHeight: "unset" }}
          >Riders</button>
          <button
            onClick={() => { setModalType("settlements"); setShowModal(true); }}
            style={{ ...btn("ghost"), padding: "5px 10px", fontSize: 11, height: 32, minHeight: "unset" }}
          >Settlements</button>
          <button
            onClick={() => setShowSettings(true)}
            style={{ ...btn("ghost"), padding: "5px 10px", fontSize: 11, height: 32, minHeight: "unset" }}
          >Settings</button>
        </div>
      </div>

      {(filtered.filter(o => o.status === "PACKING").length > 0 || filtered.filter(o => o.status === "READY_FOR_PICKUP").length > 0) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {filtered.filter(o => o.status === "PACKING").length > 0 && (
            <button
              onClick={() => {
                const packingOrders = filtered.filter(o => o.status === "PACKING");
                if (!window.confirm(`Mark ${packingOrders.length} order${packingOrders.length > 1 ? "s" : ""} as ready for pickup?`)) return;
                packingOrders.forEach(o => markPacked(o.id));
              }}
              style={{ ...btn("ghost"), padding: "5px 12px", fontSize: 11, height: 30, minHeight: "unset", borderStyle: "dashed" }}
            >
              Mark all packing ready ({filtered.filter(o => o.status === "PACKING").length})
            </button>
          )}
          {filtered.filter(o => o.status === "READY_FOR_PICKUP").length > 0 && (
            <button
              onClick={() => {
                const readyOrders = filtered.filter(o => o.status === "READY_FOR_PICKUP");
                if (!window.confirm(`Mark ${readyOrders.length} order${readyOrders.length > 1 ? "s" : ""} as picked up?`)) return;
                readyOrders.forEach(o => markPickedUp(o.id));
              }}
              style={{ ...btn("ghost"), padding: "5px 12px", fontSize: 11, height: 30, minHeight: "unset", borderStyle: "dashed" }}
            >
              Mark all ready as picked up ({filtered.filter(o => o.status === "READY_FOR_PICKUP").length})
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.length === 0 && (
          <div style={{ ...card(), padding: "32px 16px", textAlign: "center", color: C.text3, fontSize: 13 }}>
            No orders match these filters
          </div>
        )}
        {filtered.map(o => {
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

          return (
            <div
              key={o.id}
              style={{
                ...card(),
                padding: "12px 14px",
                border: `1px solid ${isFailed || isCancelled ? `${C.red}30` : isDelivered ? `${C.green}25` : `${p.color}35`}`,
                cursor: "pointer",
                opacity: isCancelled ? 0.65 : 1,
                borderLeft: `3px solid ${statusColor}`,
                borderRadius: 10,
              }}
              onClick={() => { setSelectedOrder(o); setModalType("details"); setShowModal(true); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Partner dot + order ID */}
                <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: p.color, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-.01em" }}>{orderId}</span>
                    <span style={{ fontSize: 10, color: p.color, fontWeight: 600 }}>{p.name.split(" ")[0]}</span>
                    {elapsedMin !== null && (
                      <span style={{ fontSize: 10, color: C.text3 }}>{elapsedMin < 60 ? `${elapsedMin}m ago` : `${Math.round(elapsedMin/60)}h ago`}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.text2 }}>{safeStr(cust.name, "Unknown")}</span>
                    {safeStr(cust.phone) && <span style={{ fontSize: 11, color: C.text3 }}>{cust.phone}</span>}
                    {o.rider && <span style={{ fontSize: 11, color: C.text3 }}>· {o.rider.name}</span>}
                  </div>
                </div>

                {/* Right: amount + status */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: isDelivered ? C.green : C.text1 }}>
                    ₹{total.toLocaleString()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                </div>
              </div>

              {/* Alerts row */}
              {(noRider || isCodPending || isFailed || isLate) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7, paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
                  {noRider && <span style={{ fontSize: 10, color: C.amber, background: `${C.amber}18`, borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>No rider assigned</span>}
                  {isCodPending && <span style={{ fontSize: 10, color: C.amber, background: `${C.amber}18`, borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>COD ₹{codAmt} uncollected</span>}
                  {isLate && <span style={{ fontSize: 10, color: C.red, background: `${C.red}18`, borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>{Math.abs(etaMin)}m overdue</span>}
                  {isFailed && o.failureReason && <span style={{ fontSize: 10, color: C.red, background: `${C.red}18`, borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>{o.failureReason}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {showModal && modalType === "details" && selectedOrder && (() => {
        const so = selectedOrder;
        const cust = so.customer || {};
        const items = Array.isArray(so.items) ? so.items : [];
        const safeRiders = Array.isArray(riders) ? riders : [];
        const isTerminal = TERMINAL_STATUSES.includes(so.status);
        const isActive = ["PACKING","READY_FOR_PICKUP","PICKED_UP","OUT_FOR_DELIVERY"].includes(so.status);
        const isCodPending = so.paymentMode === "COD" && so.paymentStatus !== "PAID" && !["DELIVERED","FAILED","CANCELLED"].includes(so.status);
        const partnerInfo = DELIVERY_PARTNERS[so.source] || { color: "#999", name: safeStr(so.source, "Unknown") };
        return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 20, width: "min(460px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "monospace", letterSpacing: "-.01em" }}>{safeStr(so.platformOrderId) || safeStr(so.orderId, "—")}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: partnerInfo.color, fontWeight: 600 }}>{partnerInfo.name}</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.text3 }} />
                  <span style={{ fontSize: 11, color: getStatusColor(so.status), fontWeight: 600 }}>
                    {safeStr(so.status).replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                  </span>
                  {so.createdAt && (() => { const d = new Date(so.createdAt); return !isNaN(d) ? (
                    <span style={{ fontSize: 10, color: C.text3 }}>· {formatDate(so.createdAt)} {formatTime(so.createdAt)}</span>
                  ) : null; })()}
                </div>
              </div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 20, lineHeight: 1, padding: "0 0 0 8px", marginTop: -2 }}>×</button>
            </div>

            {/* Customer */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Customer</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{safeStr(cust.name, "Unknown")}</div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{safeStr(cust.phone, "No phone on file")}</div>
              {safeStr(cust.address) && (
                <div style={{ fontSize: 12, color: C.text3, marginTop: 2, wordBreak: "break-word" }}>
                  {cust.address}{safeStr(cust.pincode) ? ` – ${cust.pincode}` : ""}
                </div>
              )}
              {so.specialInstructions && (
                <div style={{ marginTop: 6, fontSize: 11, color: C.amber, background: `${C.amber}12`, borderRadius: 6, padding: "4px 8px" }}>
                  Note: {so.specialInstructions}
                </div>
              )}
            </div>

            {/* Items + pricing */}
            <div style={{ marginBottom: 14, background: C.bg3, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Order</div>
              {items.length === 0
                ? <div style={{ fontSize: 12, color: C.text3 }}>No items</div>
                : items.map((i, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: C.text2 }}>{safeMoney(i.qty) || 1}× {safeStr(i.name, "Item")}</span>
                      <span style={{ fontFamily: "monospace", color: C.text1 }}>₹{safeMoney(i.price).toLocaleString()}</span>
                    </div>
                  ))
              }
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {[
                  { label: "Subtotal", val: `₹${safeMoney(so.subtotal).toLocaleString()}` },
                  { label: "Delivery", val: `₹${safeMoney(so.deliveryFee).toLocaleString()}` },
                  { label: "Commission", val: `₹${safeMoney(so.commission).toLocaleString()}`, dim: true },
                  { label: "Total", val: `₹${safeMoney(so.total).toLocaleString()}`, bold: true },
                ].map(cell => (
                  <div key={cell.label}>
                    <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".05em" }}>{cell.label}</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: cell.bold ? 700 : 400, color: cell.dim ? C.text3 : C.text1 }}>{cell.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Payment</div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: so.paymentStatus === "PAID" ? C.green : C.amber }}>{safeStr(so.paymentStatus, "UNKNOWN")}</span>
                  <span style={{ color: C.text3 }}> · {safeStr(so.paymentMode, "—")}</span>
                  {so.paymentMode === "COD" && <span style={{ color: C.text3 }}> · ₹{safeMoney(so.codAmount).toLocaleString()}</span>}
                </div>
              </div>
              {isCodPending && (
                <button onClick={() => collectCOD(so.id)} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 11 }}>
                  Collect cash
                </button>
              )}
            </div>

            {/* Failed notice */}
            {so.status === "FAILED" && (
              <div style={{ marginBottom: 14, padding: "8px 12px", background: `${C.red}12`, borderRadius: 8, border: `1px solid ${C.red}30` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 3 }}>Delivery failed</div>
                <div style={{ fontSize: 12, color: C.text2 }}>{safeStr(so.failureReason, "No reason recorded")}</div>
                {so.failedAt && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{formatDate(so.failedAt)} {formatTime(so.failedAt)}</div>}
              </div>
            )}

            {/* Rider */}
            {!isTerminal && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Rider</div>
                {so.rider ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{safeStr(so.rider.name)}</span>
                      <span style={{ color: C.text3 }}> · {safeStr(so.rider.phone)}</span>
                    </div>
                    <button onClick={() => reassignRider(so.id, null)} style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 10 }}>
                      Remove
                    </button>
                    <select style={{ ...input, fontSize: 11, flex: 1, minWidth: 120 }} defaultValue="" onChange={e => { if (e.target.value) reassignRider(so.id, e.target.value); }}>
                      <option value="">Reassign…</option>
                      {safeRiders.map(r => (
                        <option key={r.id} value={r.id}>{r.name} · {safeStr(r.vehicle)}{r.status !== "available" ? " (busy)" : ""}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <select style={{ ...input, fontSize: 12 }} defaultValue="" onChange={e => { if (e.target.value) assignRider(so.id, e.target.value); }}>
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
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Status</div>
                <select style={{ ...input, fontSize: 12 }} value={so.status} onChange={e => updateOrderStatus(so.id, e.target.value)}>
                  {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            )}

            {/* Actions */}
            {isActive && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                {so.status === "PACKING" && (
                  <button onClick={() => markPacked(so.id)} style={{ ...btn("primary"), padding: "7px 14px", fontSize: 12, flex: 1 }}>
                    Ready for pickup
                  </button>
                )}
                {so.status === "READY_FOR_PICKUP" && so.rider && (
                  <button onClick={() => markPickedUp(so.id)} style={{ ...btn("primary"), padding: "7px 14px", fontSize: 12, flex: 1 }}>
                    Rider picked up
                  </button>
                )}
                {so.status === "PICKED_UP" && (
                  <button onClick={() => markOutForDelivery(so.id)} style={{ ...btn("primary"), padding: "7px 14px", fontSize: 12, flex: 1 }}>
                    Out for delivery
                  </button>
                )}
                {so.status === "OUT_FOR_DELIVERY" && (
                  <button onClick={() => markDelivered(so.id)} style={{ ...btn("primary"), padding: "7px 14px", fontSize: 12, flex: 1 }}>
                    Delivered
                  </button>
                )}
                <button onClick={() => { markFailed(so.id); }} style={{ ...btn("ghost"), padding: "7px 12px", fontSize: 11, color: C.red, borderColor: `${C.red}50` }}>
                  Failed
                </button>
                <button onClick={() => cancelOrder(so.id)} style={{ ...btn("ghost"), padding: "7px 12px", fontSize: 11 }}>
                  Cancel
                </button>
              </div>
            )}

            <button style={{ ...btn("ghost"), width: "100%", fontSize: 12 }} onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
        );
      })()}

      {/* Riders Modal */}
      {showModal && modalType === "riders" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 20, width: "min(540px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Riders</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                  {(Array.isArray(riders) ? riders : []).filter(r => r.status === "available").length} available · {(Array.isArray(riders) ? riders : []).filter(r => r.status === "on_delivery").length} on delivery
                </div>
              </div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(Array.isArray(riders) ? riders : []).map(rider => {
                if (!rider || typeof rider !== "object") return null;
                const partner = DELIVERY_PARTNERS[rider.partner] || { color: "#999", name: safeStr(rider.partner, "Unknown") };
                const rating = safeMoney(rider.rating);
                const deliveries = safeMoney(rider.deliveries);
                const statusColor = rider.status === "available" ? C.green : rider.status === "on_delivery" ? C.amber : C.red;
                const statusLabel = rider.status === "available" ? "Available" : rider.status === "on_delivery" ? "On delivery" : safeStr(rider.status).replace(/_/g, " ");
                return (
                  <div key={rider.id} style={{ ...card(), padding: "12px 14px", borderRadius: 9, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{safeStr(rider.name, "Unnamed")}</span>
                        <span style={{ fontSize: 10, color: partner.color, fontWeight: 600 }}>{partner.name.split(" ")[0]}</span>
                        <span style={{ fontSize: 10, color: C.text3 }}>{safeStr(rider.vehicle)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{safeStr(rider.phone, "—")}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{statusLabel}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                        {rating > 0 && `★ ${rating}`}{deliveries > 0 && ` · ${deliveries} trips`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button style={{ ...btn("ghost"), marginTop: 14, width: "100%", fontSize: 12 }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settlements Modal */}
      {showModal && modalType === "settlements" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 20, width: "min(560px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Settlements</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
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
                  <div key={settlement.id} style={{ ...card(), padding: "14px 16px", borderRadius: 10, borderLeft: `3px solid ${partner.color}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{partner.name}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{safeStr(settlement.period, "—")}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isPaid ? C.green : C.amber, background: isPaid ? `${C.green}15` : `${C.amber}15`, borderRadius: 5, padding: "3px 8px" }}>
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      {[
                        { label: "Orders", val: totalOrders, color: C.text1 },
                        { label: "Revenue", val: `₹${gross.toLocaleString()}`, color: C.green },
                        { label: "Commission", val: `₹${commission.toLocaleString()}`, color: C.red },
                        { label: "Net", val: `₹${net.toLocaleString()}`, color: C.blue },
                      ].map(cell => (
                        <div key={cell.label}>
                          <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{cell.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: cell.color }}>{cell.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {settlement.paidDate && (() => { const d = new Date(settlement.paidDate); return !isNaN(d) ? (
                        <div style={{ fontSize: 10, color: C.text3 }}>
                          Paid {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      ) : <div />; })()}
                      {!settlement.paidDate && <div />}
                      {!isPaid && (
                        <button
                          style={{ ...btn("primary"), padding: "5px 12px", fontSize: 11 }}
                          onClick={() => {
                            if (!window.confirm(`Mark ${partner.name} settlement as paid?`)) return;
                            const now = new Date().toISOString().slice(0, 10);
                            setSettlements(prev => prev.map(s => s.id === settlement.id ? { ...s, status: "paid", paidDate: now } : s));
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

            <button style={{ ...btn("ghost"), marginTop: 14, width: "100%", fontSize: 12 }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowSettings(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 20, width: "min(500px,95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Partner settings</div>
              <button aria-label="Close" onClick={() => setShowSettings(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {Object.entries(DELIVERY_PARTNERS).map(([key, partner], idx, arr) => {
              const settings = partnerSettings[key];
              return (
                <div key={key} style={{ marginBottom: idx < arr.length - 1 ? 20 : 0, paddingBottom: idx < arr.length - 1 ? 20 : 0, borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: partner.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{partner.name}</span>
                      <span style={{ fontSize: 10, color: C.text3, marginLeft: 8 }}>{partner.settlementDays}d settlement · {partner.features.join(", ")}</span>
                    </div>
                    {/* Enabled toggle */}
                    <button
                      onClick={() => setPartnerSettings({ ...partnerSettings, [key]: { ...settings, enabled: !settings.enabled } })}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${settings.enabled ? C.green : C.border2}`, background: settings.enabled ? `${C.green}18` : C.bg3, color: settings.enabled ? C.green : C.text3, cursor: "pointer", fontWeight: 600 }}
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
                        onChange={e => setPartnerSettings({ ...partnerSettings, [key]: { ...settings, autoAccept: e.target.value === "true" } })}
                      >
                        <option value="false">Manual</option>
                        <option value="true">Auto-accept</option>
                      </select>
                    </div>
                    <div>
                      <label style={label}>Commission (%)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.commission} onChange={e => setPartnerSettings({ ...partnerSettings, [key]: { ...settings, commission: parseInt(e.target.value) || 0 } })} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={label}>Min order (₹)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.minOrder} onChange={e => setPartnerSettings({ ...partnerSettings, [key]: { ...settings, minOrder: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div>
                      <label style={label}>Radius (km)</label>
                      <input style={{ ...input, fontSize: 12 }} type="number" value={settings.radius} onChange={e => setPartnerSettings({ ...partnerSettings, [key]: { ...settings, radius: parseInt(e.target.value) || 0 } })} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button style={{ ...btn("ghost"), flex: 1, fontSize: 12 }} onClick={() => setShowSettings(false)}>
                Discard
              </button>
              <button style={{ ...btn("primary"), flex: 1, fontSize: 12 }} onClick={() => setShowSettings(false)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
