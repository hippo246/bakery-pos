import { useState, useMemo } from "react";
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
    return ordersState.filter(order => {
      const matchesPartner = partnerFilter === "ALL" || order.source === partnerFilter;
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesSearch = !search.trim() || 
        order.orderId.toLowerCase().includes(search.toLowerCase()) ||
        order.platformOrderId.toLowerCase().includes(search.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        order.customer.phone.includes(search);
      return matchesPartner && matchesStatus && matchesSearch;
    });
  }, [ordersState, partnerFilter, statusFilter, search]);

  const analytics = useMemo(() => {
    const totalOrders = ordersState.length;
    const totalRevenue = ordersState.reduce((sum, o) => sum + o.total, 0);
    const totalCommission = ordersState.reduce((sum, o) => sum + o.commission, 0);
    const netRevenue = totalRevenue - totalCommission;
    
    const partnerStats = {
      DIRECT_DELIVERY: ordersState.filter(o => o.source === "DIRECT_DELIVERY"),
      SWIGGY: ordersState.filter(o => o.source === "SWIGGY"),
      ZOMATO: ordersState.filter(o => o.source === "ZOMATO")
    };

    const statusCounts = {};
    DELIVERY_STATUSES.forEach(status => {
      statusCounts[status] = ordersState.filter(o => o.status === status).length;
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Additional metrics
    const activeDeliveries = ordersState.filter(o => ["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)).length;
    const codPending = ordersState.filter(o => o.paymentStatus === "COD" && o.status !== "DELIVERED").length;
    const deliveredToday = ordersState.filter(o => {
      const today = new Date().toDateString();
      return o.status === "DELIVERED" && new Date(o.createdAt).toDateString() === today;
    }).length;
    const failedCount = ordersState.filter(o => o.status === "FAILED").length;
    
    // Calculate average delivery time for delivered orders
    const deliveredOrders = ordersState.filter(o => o.status === "DELIVERED" && o.estimatedDelivery);
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, o) => {
          const actualTime = new Date(o.estimatedDelivery).getTime() - new Date(o.createdAt).getTime();
          return sum + actualTime;
        }, 0) / deliveredOrders.length / 60000 // Convert to minutes
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

  const updateOrderStatus = (orderId, newStatus) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;

    // Rule: cannot go OUT_FOR_DELIVERY until order is READY
    if (newStatus === "OUT_FOR_DELIVERY" && order.status !== "READY_FOR_PICKUP") {
      alert("Order must be READY_FOR_PICKUP before going OUT_FOR_DELIVERY");
      return;
    }

    // Update delivery order status
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
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
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;
    handleSetDeliveryOrders(ordersState.map(o => 
      o.id === orderId ? { ...o, rider: { id: rider.id, name: rider.name, phone: rider.phone, vehicle: rider.vehicle } } : o
    ));
    // Update rider status
    setRiders(riders.map(r => r.id === riderId ? { ...r, status: "on_delivery" } : r));
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
    
    // If COD, update payment status to PAID
    if (order.paymentStatus === "COD") {
      handleSetDeliveryOrders(ordersState.map(o => 
        o.id === orderId ? { ...o, status: "DELIVERED", paymentStatus: "PAID" } : o
      ));
      
      // Sync with main orders
      if (orders && setOrders) {
        const mainOrder = orders.find(o => o.id === order.orderId);
        if (mainOrder) {
          setOrders(orders.map(o => 
            o.id === mainOrder.id ? { ...o, status: "DELIVERED", paymentStatus: "PAID" } : o
          ));
        }
      }
    } else {
      updateOrderStatus(orderId, "DELIVERED");
    }
    
    // Update rider status to available
    if (order.rider) {
      setRiders(riders.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
  };

  const markFailed = (orderId) => {
    updateOrderStatus(orderId, "FAILED");
    // Update rider status to available
    const order = ordersState.find(o => o.id === orderId);
    if (order && order.rider) {
      setRiders(riders.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
  };

  const reassignRider = (orderId, newRiderId) => {
    const order = ordersState.find(o => o.id === orderId);
    if (!order) return;
    
    // Free up old rider
    if (order.rider) {
      setRiders(riders.map(r => r.id === order.rider.id ? { ...r, status: "available" } : r));
    }
    
    // Assign new rider
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
    if (!window.confirm("Are you sure you want to cancel this delivery order?")) return;
    updateOrderStatus(orderId, "CANCELLED");
  };

  const getStatusColor = (status) => {
    const colors = {
      PACKING: "#FF8C42",
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
    return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Orders", val: analytics.totalOrders, color: C.amber2 },
          { label: "Active", val: analytics.activeDeliveries, color: C.blue },
          { label: "Revenue", val: "₹" + analytics.totalRevenue.toLocaleString(), color: C.green },
          { label: "COD Pending", val: analytics.codPending, color: C.amber },
          { label: "Delivered Today", val: analytics.deliveredToday, color: C.green },
          { label: "Failed", val: analytics.failedCount, color: C.red }
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
          <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        {Object.entries(DELIVERY_PARTNERS).map(([key, partner]) => (
          <button 
            key={key} 
            onClick={() => setPartnerFilter(key)}
            style={{ 
              padding: "10px 12px", 
              borderRadius: 6, 
              border: `1px solid ${partnerFilter === key ? partner.color : C.border2}`, 
              background: partnerFilter === key ? `${partner.color}20` : C.bg3, 
              color: partnerFilter === key ? partner.color : C.text2, 
              fontSize: 12, 
              cursor: "pointer", 
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {partner.icon} {partner.name}
          </button>
        ))}

        <select 
          style={{ ...input, fontSize: 11, padding: "5px 8px", minHeight: 44 }} 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {DELIVERY_STATUSES.map(status => (
            <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
          ))}
        </select>

        <button 
          onClick={() => setShowSettings(true)}
          style={{ ...btn("ghost"), padding: "10px 12px", minHeight: 44, fontSize: 12 }}
        >
          ⚙️ Settings
        </button>

        <button 
          onClick={() => { setModalType("riders"); setShowModal(true); }}
          style={{ ...btn("ghost"), padding: "10px 12px", minHeight: 44, fontSize: 12 }}
        >
          🏍️ Riders
        </button>

        <button 
          onClick={() => { setModalType("settlements"); setShowModal(true); }}
          style={{ ...btn("ghost"), padding: "10px 12px", minHeight: 44, fontSize: 12 }}
        >
          💰 Settlements
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button 
            onClick={() => {
              const packingOrders = filtered.filter(o => o.status === "PACKING");
              if (packingOrders.length === 0) return;
              if (!window.confirm(`Mark ${packingOrders.length} orders as ready for pickup?`)) return;
              packingOrders.forEach(o => markPacked(o.id));
            }}
            style={{ ...btn("ghost"), padding: "10px 12px", minHeight: 44, fontSize: 12 }}
          >
            📦 Bulk Ready
          </button>
          <button 
            onClick={() => {
              const readyOrders = filtered.filter(o => o.status === "READY_FOR_PICKUP");
              if (readyOrders.length === 0) return;
              if (!window.confirm(`Mark ${readyOrders.length} orders as picked up?`)) return;
              readyOrders.forEach(o => markPickedUp(o.id));
            }}
            style={{ ...btn("ghost"), padding: "10px 12px", minHeight: 44, fontSize: 12 }}
          >
            🏍️ Bulk Pickup
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(o => {
          const p = DELIVERY_PARTNERS[o.source];
          return (
            <div key={o.id} style={{ ...card(), padding: "14px", border: `1px solid ${p.color}40`, cursor: "pointer" }} onClick={() => { setSelectedOrder(o); setShowModal(true); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{o.platformOrderId || o.orderId}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{o.customer.name} · {o.customer.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>₹{o.total}</div>
                  <span style={{ ...pill("#1a1a2a", getStatusColor(o.status)), fontSize: 9 }}>{o.status.replace(/_/g, " ")}</span>
                </div>
              </div>
              {o.paymentStatus === "COD" && (
                <div style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>COD: ₹{o.codAmount}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {showModal && modalType === "details" && selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 450, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedOrder.platformOrderId || selectedOrder.orderId}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Customer</div>
              <div>{selectedOrder.customer.name} · {selectedOrder.customer.phone}</div>
              <div style={{ fontSize: 12, color: C.text3 }}>{selectedOrder.customer.address}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Items</div>
              {selectedOrder.items.map((i, idx) => <div key={idx}>{i.qty}x {i.name} - ₹{i.price}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Status</div>
                <select style={{ ...input }} value={selectedOrder.status} onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}>
                  {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Payment</div>
                <div style={{ fontSize: 12 }}>{selectedOrder.paymentStatus} ({selectedOrder.paymentMode})</div>
                {selectedOrder.paymentStatus === "COD" && (
                  <button onClick={() => collectCOD(selectedOrder.id)} style={{ ...btn("primary"), padding: "4px 8px", fontSize: 10, marginTop: 4 }}>
                    Collect COD
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Rider</div>
              {selectedOrder.rider ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>{selectedOrder.rider.name} · {selectedOrder.rider.phone}</div>
                  <button onClick={() => reassignRider(selectedOrder.id, null)} style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 10 }}>
                    Reassign
                  </button>
                </div>
              ) : (
                <select style={{ ...input }} onChange={e => assignRider(selectedOrder.id, e.target.value)}>
                  <option value="">Assign Rider</option>
                  {riders.filter(r => r.status === "available").map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.vehicle})</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Quick Actions</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedOrder.status === "PACKING" && (
                  <button onClick={() => markPacked(selectedOrder.id)} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 11 }}>
                    Mark Ready
                  </button>
                )}
                {selectedOrder.status === "READY_FOR_PICKUP" && selectedOrder.rider && (
                  <button onClick={() => markPickedUp(selectedOrder.id)} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 11 }}>
                    Mark Picked Up
                  </button>
                )}
                {selectedOrder.status === "PICKED_UP" && (
                  <button onClick={() => markOutForDelivery(selectedOrder.id)} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 11 }}>
                    Out for Delivery
                  </button>
                )}
                {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                  <button onClick={() => markDelivered(selectedOrder.id)} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 11 }}>
                    Mark Delivered
                  </button>
                )}
                {["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(selectedOrder.status) && (
                  <button onClick={() => markFailed(selectedOrder.id)} style={{ ...btn("ghost"), padding: "6px 12px", fontSize: 11, color: C.red, borderColor: C.red }}>
                    Mark Failed
                  </button>
                )}
              </div>
            </div>
            <button style={btn("primary")} onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Riders Modal */}
      {showModal && modalType === "riders" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Rider Management</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {riders.map(rider => {
                const partner = DELIVERY_PARTNERS[rider.partner];
                return (
                  <div key={rider.id} style={{ ...card(), padding: "14px", border: `1px solid ${partner.color}40` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 24 }}>🏍️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{rider.name}</div>
                        <div style={{ fontSize: 12, color: C.text3 }}>{rider.phone} · {rider.vehicle}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ ...pill(`${partner.color}20`, partner.color), fontSize: 9 }}>{partner.name}</span>
                        <div style={{ fontSize: 12, marginTop: 4 }}>⭐ {rider.rating}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.text3 }}>
                      <span>{rider.deliveries} deliveries</span>
                      <span>•</span>
                      <span style={{ color: rider.status === "available" ? C.green : rider.status === "on_delivery" ? C.amber : C.red }}>
                        {rider.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button style={{ ...btn("primary"), marginTop: 16, width: "100%" }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settlements Modal */}
      {showModal && modalType === "settlements" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Settlement Tracking</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {settlements.map(settlement => {
                const partner = DELIVERY_PARTNERS[settlement.partner];
                return (
                  <div key={settlement.id} style={{ ...card(), padding: "14px", border: `1px solid ${partner.color}40` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 24 }}>{partner.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{partner.name}</div>
                        <div style={{ fontSize: 12, color: C.text3 }}>{settlement.period}</div>
                      </div>
                      <span style={{ ...pill("#1a1a2a", settlement.status === "paid" ? C.green : C.amber), fontSize: 9 }}>
                        {settlement.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Orders</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{settlement.totalOrders}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Revenue</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.green }}>₹{settlement.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Net</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.blue }}>₹{settlement.netRevenue.toLocaleString()}</div>
                      </div>
                    </div>

                    {settlement.paidDate && (
                      <div style={{ marginTop: 8, fontSize: 11, color: C.text3 }}>
                        Paid on {new Date(settlement.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button style={{ ...btn("primary"), marginTop: 16, width: "100%" }} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowSettings(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Delivery Partner Settings</div>
              <button aria-label="Close" onClick={() => setShowSettings(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {Object.entries(DELIVERY_PARTNERS).map(([key, partner]) => {
              const settings = partnerSettings[key];
              return (
                <div key={key} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 28 }}>{partner.icon}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{partner.name}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>{partner.settlementDays} days settlement · {partner.features.join(", ")}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={label}>Enabled</label>
                      <select 
                        style={{ ...input }} 
                        value={settings.enabled ? "true" : "false"} 
                        onChange={e => setPartnerSettings({
                          ...partnerSettings,
                          [key]: { ...settings, enabled: e.target.value === "true" }
                        })}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={label}>Auto Accept Orders</label>
                      <select 
                        style={{ ...input }} 
                        value={settings.autoAccept ? "true" : "false"} 
                        onChange={e => setPartnerSettings({
                          ...partnerSettings,
                          [key]: { ...settings, autoAccept: e.target.value === "true" }
                        })}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={label}>Commission (%)</label>
                      <input 
                        style={{ ...input }} 
                        type="number" 
                        value={settings.commission} 
                        onChange={e => setPartnerSettings({
                          ...partnerSettings,
                          [key]: { ...settings, commission: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <label style={label}>Min Order (₹)</label>
                      <input 
                        style={{ ...input }} 
                        type="number" 
                        value={settings.minOrder} 
                        onChange={e => setPartnerSettings({
                          ...partnerSettings,
                          [key]: { ...settings, minOrder: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <label style={label}>Radius (km)</label>
                      <input 
                        style={{ ...input }} 
                        type="number" 
                        value={settings.radius} 
                        onChange={e => setPartnerSettings({
                          ...partnerSettings,
                          [key]: { ...settings, radius: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button style={{ ...btn("primary"), flex: 1 }} onClick={() => setShowSettings(false)}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
