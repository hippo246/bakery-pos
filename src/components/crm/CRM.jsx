import { useState, useEffect } from "react";
import { C, pill, card, btn, input, label, TIER_COLORS, TIER_SPEND, TIER_NEXT } from "../../styles/theme";
import { initials } from "../../styles/theme";
import { INIT_HIST } from "../../data/constants";
import LogVisit from "./LogVisit";
import { normalizeCustomer, calculateTier, updateCustomerAfterOrder, getOrCreateCustomerFromOrder, isVipCustomer, getCustomerDisplayName, getCustomerDisplayPhone } from "../../domain/customerModel.js";
import { getOrderDisplayItems, getOrderAmount } from "../../domain/orderModel.js";

// Loyalty points system
const POINTS_PER_RUPEE = 1;
const POINTS_REWARD_THRESHOLD = 1000;
const REWARD_AMOUNT = 100;
const MIN_REDEEM_AMOUNT = 10;

// Cafe customer types
const CUSTOMER_TYPES = [
  { key: "morning_regular", label: "Morning Regular", icon: "🌅", color: "#e8a020", desc: "Here every morning, usually before 9am", tip: "Reserve their usual spot. Pre-empt their usual order at the counter." },
  { key: "remote_worker", label: "Remote Worker", icon: "💻", color: "#4a9eff", desc: "Works from the café for hours at a stretch", tip: "Offer a loyalty deal for long sessions. Note their preferred corner seat or plug point." },
  { key: "student", label: "Student", icon: "📚", color: "#a78bfa", desc: "Studies here, often during off-peak hours", tip: "Consider a student discount or exam-season offer to lock in loyalty." },
  { key: "office_group", label: "Office Group", icon: "🏢", color: "#34d399", desc: "Comes in groups, often bulk orders", tip: "Reach out for corporate catering or pre-order options. High AOV potential." },
  { key: "family", label: "Family", icon: "👨‍👩‍👧", color: "#f472b6", desc: "Visits with kids, needs space and patience", tip: "Note any kids' preferences. Weekend and holiday visits likely." },
  { key: "tourist", label: "Tourist", icon: "🗺️", color: "#fb923c", desc: "Passing through, unlikely to return often", tip: "Focus on experience and review — ask for a Google review before they leave." },
  { key: "takeaway_only", label: "Takeaway Only", icon: "🥡", color: "#94a3b8", desc: "Always orders to go, never dines in", tip: "Fast service is key. Consider a loyalty stamp card for takeaway regulars." },
  { key: "weekend_visitor", label: "Weekend Visitor", icon: "📅", color: "#22d3ee", desc: "Only comes on weekends or special days", tip: "Promote weekend specials and brunch offers to this segment." },
  { key: "health_conscious", label: "Health Conscious", icon: "🥗", color: "#86efac", desc: "Always asks about ingredients, prefers light options", tip: "Flag new healthy menu items. Note dietary preferences carefully." },
  { key: "social_visitor", label: "Social Visitor", icon: "👥", color: "#f9a8d4", desc: "Comes with different friends each time, social hub", tip: "Word-of-mouth champion. A good experience here gets shared widely." },
];
const TYPE_MAP = Object.fromEntries(CUSTOMER_TYPES.map(t => [t.key, t]));

const normalizePhone = (p) => (p || "").replace(/\D/g, "");
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function CRM({ customers, setCustomers, orders, kdsCards }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalData, setModalData] = useState({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0, customerType: "" });
  const [noteVal, setNoteVal] = useState("");
  const [sortBy, setSortBy] = useState("spend");
  const [profileTab, setProfileTab] = useState("overview");
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL"); // ALL | AT_RISK | BIRTHDAY | VIP
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | any CUSTOMER_TYPES key
  const [commType, setCommType] = useState("Email");
  const [commMsg, setCommMsg] = useState("");
  const [histFilter, setHistFilter] = useState("ALL"); // ALL | COMPLETED | CANCELLED | PENDING
  const [pinnedNote, setPinnedNote] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCommType, setBulkCommType] = useState("SMS");
  const [bulkCommMsg, setBulkCommMsg] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [smartList, setSmartList] = useState(null); // null | "gone_cold" | "loyalty_ready" | "high_value" | "new_customers"
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = C.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const [localVisits, setLocalVisits] = useState({}); // cid -> [{date, items, amt}]

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 700);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Get real customer order history from orders data
  const getCustomerOrders = (customerId) => {
    if (!orders) return [];
    return orders.filter(o => o.customerId === customerId);
  };

  // Calculate customer metrics from real orders
  const calculateCustomerMetrics = (customerId) => {
    const customerOrders = getCustomerOrders(customerId);
    const completedOrders = customerOrders.filter(o => o.status === "COMPLETED");
    const totalSpend = completedOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalSpend / completedOrders.length : 0;
    
    // Get favorite item
    const itemCounts = {};
    completedOrders.forEach(o => {
      o.items?.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
      });
    });
    
    const favoriteItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Calculate preferred time
    const hourCounts = {};
    completedOrders.forEach(o => {
      const hour = new Date(o.createdAt || Date.now()).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const preferredHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    // Calculate average prep time from KDS cards
    const customerKdsCards = kdsCards?.filter(k => {
      const order = orders?.find(o => o.id === k.orderId);
      return order?.customerId === customerId;
    }) || [];
    const avgPrepTime = customerKdsCards.length > 0
      ? Math.round(customerKdsCards.reduce((sum, k) => sum + (k.prepTime || 5), 0) / customerKdsCards.length)
      : 0;
    
    const cancelledOrders = customerOrders.filter(o => o.status === "CANCELLED");
    const cancelRate = customerOrders.length > 0 ? Math.round((cancelledOrders.length / customerOrders.length) * 100) : 0;

    // Top items with counts
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // LTV projection: avg monthly spend * 12
    const firstOrderDate = completedOrders.length > 0
      ? new Date(completedOrders[completedOrders.length - 1].createdAt || Date.now())
      : null;
    const monthsActive = firstOrderDate
      ? Math.max(1, Math.round((Date.now() - firstOrderDate) / (1000 * 60 * 60 * 24 * 30)))
      : 1;
    const monthlySpend = totalSpend / monthsActive;
    const ltvProjection = Math.round(monthlySpend * 12);

    return {
      visits: completedOrders.length,
      spend: totalSpend,
      avgOrderValue,
      favoriteItem,
      tier: calculateTier(totalSpend),
      preferredHour,
      avgPrepTime,
      ordersHandled: customerOrders.length,
      ordersCompleted: completedOrders.length,
      lastOrderDate: completedOrders.length > 0 ? completedOrders[0].createdAt : null,
      kitchenEfficiency: customerKdsCards.length > 0 ? Math.round((customerKdsCards.filter(k => k.urgency !== "urgent").length / customerKdsCards.length) * 100) : 0,
      cancelRate,
      topItems,
      ltvProjection,
      monthlySpend: Math.round(monthlySpend),
    };
  };

  const isAtRisk = (c) => {
    if (c.lastVisit === "Today" || c.lastVisit === "Yesterday") return false;
    const days = parseInt(c.lastVisit);
    return !isNaN(days) && days >= 10;
  };

  const churnRisk = (c) => {
    if (c.lastVisit === "Today") return { label: "Active", color: C.green };
    if (c.lastVisit === "Yesterday") return { label: "Good", color: C.green };
    const days = parseInt(c.lastVisit);
    if (isNaN(days)) return { label: "Unknown", color: C.text3 };
    if (days <= 5) return { label: "Good", color: C.green };
    if (days <= 10) return { label: "Cooling", color: C.amber };
    if (days <= 20) return { label: "At Risk", color: C.warning };
    return { label: "Churned", color: C.red };
  };

  let filtered = customers;
  if (tierFilter !== "ALL") filtered = filtered.filter(c => c.tier === tierFilter);
  if (typeFilter !== "ALL") filtered = filtered.filter(c => c.customerType === typeFilter);
  if (segmentFilter === "AT_RISK") filtered = filtered.filter(c => isAtRisk(c));
  if (segmentFilter === "BIRTHDAY") filtered = filtered.filter(c => c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10));
  if (segmentFilter === "VIP") filtered = filtered.filter(c => c.tier === "PLATINUM" || c.tier === "GOLD");
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    const qDigits = normalizePhone(search);
    filtered = filtered.filter(c => {
      const matchesName = c.name.toLowerCase().includes(q);
      const matchesPhone = qDigits.length > 0 && normalizePhone(c.phone).includes(qDigits);
      const matchesEmail = c.email?.toLowerCase().includes(q);
      return matchesName || matchesPhone || matchesEmail;
    });
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "spend") return b.spend - a.spend;
    if (sortBy === "visits") return b.visits - a.visits;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "risk") {
      const riskOrder = { "Churned": 0, "At Risk": 1, "Cooling": 2, "Good": 3, "Active": 4, "Unknown": 5 };
      return (riskOrder[churnRisk(a).label] ?? 9) - (riskOrder[churnRisk(b).label] ?? 9);
    }
    if (sortBy === "recent") {
      const order = { "Today": 0, "Yesterday": 1 };
      const av = order[a.lastVisit] ?? parseInt(a.lastVisit) ?? 99;
      const bv = order[b.lastVisit] ?? parseInt(b.lastVisit) ?? 99;
      return av - bv;
    }
    return 0;
  });

  const maxSpend = Math.max(...customers.map(c => c.spend), 1);

  const profile = selected ? customers.find(c => c.id === selected) : null;
  const customerMetrics = selected ? calculateCustomerMetrics(selected) : null;
  const realOrders = selected ? getCustomerOrders(selected) : [];
  // Merge real orders with manually-logged visits (shown as synthetic entries)
  const manualEntries = selected ? (localVisits[selected] || []).map(v => ({
    id: `manual-${v.date}-${v.amt}`,
    createdAt: new Date().toISOString(),
    status: "COMPLETED",
    total: v.amt,
    items: [{ name: v.items, qty: 1 }],
    _manual: true,
    _label: v.items,
  })) : [];
  const hist = [...manualEntries, ...realOrders];

  // Update customer data with metrics when order is completed
  const updateCustomerOnOrderComplete = (order) => {
    if (!order.customerId || !customers) return;
    const customer = customers.find(c => c.id === order.customerId);
    if (customer && order.status === "COMPLETED") {
      const updatedCustomer = updateCustomerAfterOrder(customer, order);
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    }
  };

  useEffect(() => {
    if (orders) {
      orders.forEach(order => {
        if (order.status === "COMPLETED") {
          updateCustomerOnOrderComplete(order);
        }
      });
    }
  }, [orders]);

  useEffect(() => { if (profile) { setNoteVal(profile.notes || ""); setPinnedNote(profile.pinnedNote || ""); } }, [profile?.id]);

  useEffect(() => {
    if (!showModal && !showLoyaltyModal && !showBulkModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") { setShowModal(false); setShowLoyaltyModal(false); setShowBulkModal(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, showLoyaltyModal, showBulkModal]);

  const openAddModal = () => {
    setEditMode(false);
    setModalData({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0, customerType: "" });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditMode(true);
    setModalData({ name: c.name, phone: c.phone, email: c.email || "", tier: c.tier, fav: c.fav, birthday: c.birthday || "", allergy: c.allergy || "", visits: c.visits, spend: c.spend, tags: c.tags.join(", "), notes: c.notes || "", customerType: c.customerType || "" });
    setShowModal(true);
  };

  const saveModal = () => {
    const name = modalData.name.trim();
    const phone = modalData.phone.trim();
    const email = modalData.email.trim();
    if (!name || !phone) return alert("Name and phone required");
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length !== 10) return alert("Phone number must be 10 digits");
    if (email && !isValidEmail(email)) return alert("Please enter a valid email address");
    const duplicate = customers.find(c => normalizePhone(c.phone) === phoneDigits && c.id !== selected);
    if (duplicate) return alert(`This phone number is already used by ${duplicate.name}`);
    const tagArr = modalData.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editMode) {
      setCustomers(customers.map(c => c.id === selected ? { ...c, ...modalData, name, phone, email, visits: Number(modalData.visits), spend: Number(modalData.spend), tags: tagArr } : c));
      showToast("Customer updated ✓");
    } else {
      const newC = { id: "c" + Date.now(), ...modalData, name, phone, email, visits: Number(modalData.visits), spend: Number(modalData.spend), tags: tagArr.length ? tagArr : ["New Customer"], lastVisit: "Never" };
      setCustomers([...customers, newC]);
      setSelected(newC.id);
      showToast(`${name} added ✓`);
    }
    setShowModal(false);
  };

  const updateNote = () => { setCustomers(customers.map(c => c.id === selected ? { ...c, notes: noteVal } : c)); showToast("Notes saved ✓"); };
  const savePinnedNote = () => { setCustomers(customers.map(c => c.id === selected ? { ...c, pinnedNote } : c)); showToast("Pinned note saved 📌"); };

  const deleteCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (!window.confirm("Delete this customer?")) return;
    setCustomers(customers.filter(c => c.id !== id));
    setSelected(null);
    showToast(`${c?.name || "Customer"} deleted`, C.red);
  };

  const saveField = (field) => {
    const val = editVal.trim();
    if ((field === "name" || field === "phone") && !val) { setEditField(null); return; }
    if (field === "phone") {
      const phoneDigits = normalizePhone(val);
      if (phoneDigits.length !== 10) { alert("Phone number must be 10 digits"); setEditField(null); return; }
      const duplicate = customers.find(c => normalizePhone(c.phone) === phoneDigits && c.id !== selected);
      if (duplicate) { alert(`This phone number is already used by ${duplicate.name}`); setEditField(null); return; }
    }
    if (field === "email" && val && !isValidEmail(val)) { alert("Please enter a valid email address"); setEditField(null); return; }
    setCustomers(customers.map(c => c.id === selected ? { ...c, [field]: val } : c));
    setEditField(null);
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const customer = customers.find(c => c.id === selected);
    if (customer?.tags.some(t => t.toLowerCase() === tag.toLowerCase())) { showToast("Tag already exists", C.amber); return; }
    setCustomers(customers.map(c => c.id === selected ? { ...c, tags: [...c.tags, tag] } : c));
    setNewTag("");
    showToast(`Tag "${tag}" added ✓`);
  };

  const removeTag = (tag) => setCustomers(customers.map(c => c.id === selected ? { ...c, tags: c.tags.filter(t => t !== tag) } : c));

  const addVisitEntry = (cid, items, amt) => {
    const today = new Date(); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${months[today.getMonth()]} ${today.getDate()}`;
    const entry = { date: dateStr, items, amt: Number(amt) };
    setLocalVisits(prev => ({ ...prev, [cid]: [entry, ...(prev[cid] || [])] }));
    const pointsEarned = Math.floor(Number(amt) * POINTS_PER_RUPEE);
    setCustomers(customers.map(c => c.id === cid ? { 
      ...c, 
      visits: c.visits + 1, 
      spend: c.spend + Number(amt), 
      lastVisit: "Today",
      loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned
    } : c));
    showToast(`Visit logged · +${pointsEarned} pts`);
  };

  const redeemPoints = (cid, amount) => {
    const customer = customers.find(c => c.id === cid);
    if (!customer) return;
    amount = Math.floor(Number(amount));
    if (!amount || amount < MIN_REDEEM_AMOUNT) {
      alert(`Minimum redemption amount is ₹${MIN_REDEEM_AMOUNT}.`);
      return;
    }
    const pointsNeeded = amount * POINTS_PER_RUPEE;
    if ((customer.loyaltyPoints || 0) < pointsNeeded) {
      alert(`Insufficient points. You need ${pointsNeeded} points but have ${customer.loyaltyPoints || 0}.`);
      return;
    }
    setCustomers(customers.map(c => c.id === cid ? { 
      ...c, 
      loyaltyPoints: (c.loyaltyPoints || 0) - pointsNeeded
    } : c));
    setShowLoyaltyModal(false);
    setRedeemAmount("");
    showToast(`Redeemed ₹${amount} — apply as discount on next order.`, C.amber2);
  };

  const calculatePoints = (spend) => Math.floor(spend * POINTS_PER_RUPEE);
  const calculateRedeemable = (points) => Math.floor(points / POINTS_PER_RUPEE);

  const exportCSV = () => {
    const headers = ["Name","Phone","Email","Tier","Visits","Spend","Last Visit","Birthday","Allergy","Tags","Notes","Loyalty Points"];
    const rows = customers.map(c => [
      c.name, c.phone, c.email || "", c.tier, c.visits, c.spend, c.lastVisit || "",
      c.birthday || "", c.allergy || "", (c.tags || []).join(";"), (c.notes || "").replace(/\n/g," "), c.loyaltyPoints || 0
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "customers.csv"; a.click();
  };

  const logComm = (cid, type, message) => {
    if (!message.trim()) return;
    const entry = { type, message, date: new Date().toISOString(), staff: "Staff" };
    setCustomers(customers.map(c => c.id === cid ? { ...c, commLog: [entry, ...(c.commLog || [])] } : c));
    setCommMsg("");
    showToast(`${type} logged ✓`);
  };

  const todayBirthdays = customers.filter(c => c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10)).length;
  const atRiskCount = customers.filter(c => isAtRisk(c)).length;

  // Upcoming birthdays next 7 days (excluding today)
  const upcomingBirthdays = customers.filter(c => {
    if (!c.birthday) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const bday = new Date(today.getFullYear(), parseInt(c.birthday.slice(5,7)) - 1, parseInt(c.birthday.slice(8,10)));
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    const diff = Math.round((bday - today) / 86400000);
    return diff > 0 && diff <= 7;
  }).sort((a, b) => {
    const daysLeft = (c) => {
      const today = new Date(); today.setHours(0,0,0,0);
      const bday = new Date(today.getFullYear(), parseInt(c.birthday.slice(5,7)) - 1, parseInt(c.birthday.slice(8,10)));
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      return Math.round((bday - today) / 86400000);
    };
    return daysLeft(a) - daysLeft(b);
  });

  // Smart list filtering
  const applySmartList = (base) => {
    if (!smartList) return base;
    if (smartList === "gone_cold") return base.filter(c => { const d = parseInt(c.lastVisit); return !isNaN(d) && d >= 14 && c.visits >= 3; });
    if (smartList === "loyalty_ready") return base.filter(c => calculateRedeemable(c.loyaltyPoints || 0) >= MIN_REDEEM_AMOUNT);
    if (smartList === "high_value") return base.filter(c => c.spend >= 5000);
    if (smartList === "new_customers") return base.filter(c => c.visits <= 2);
    return base;
  };

  // Owner dashboard stats from orders
  const todayOrders = (orders || []).filter(o => { const d = new Date(o.createdAt || 0); const t = new Date(); return d.toDateString() === t.toDateString(); });
  const todayRevenue = todayOrders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + (o.total || 0), 0);
  const todayNewCustomers = customers.filter(c => c.lastVisit === "Today" && c.visits === 1).length;
  const loyaltyReadyCount = customers.filter(c => calculateRedeemable(c.loyaltyPoints || 0) >= MIN_REDEEM_AMOUNT).length;
  const totalRevenue = customers.reduce((s, c) => s + c.spend, 0);
  const avgVisitsPerCustomer = customers.length > 0 ? (customers.reduce((s, c) => s + c.visits, 0) / customers.length).toFixed(1) : 0;

  const sendBulkComm = () => {
    if (!bulkCommMsg.trim() || bulkSelected.size === 0) return;
    const count = bulkSelected.size;
    const entry = { type: bulkCommType, message: bulkCommMsg, date: new Date().toISOString(), staff: "Staff", bulk: true };
    setCustomers(customers.map(c => bulkSelected.has(c.id) ? { ...c, commLog: [entry, ...(c.commLog || [])] } : c));
    setBulkCommMsg("");
    setBulkSelected(new Set());
    setBulkMode(false);
    setShowBulkModal(false);
    showToast(`${bulkCommType} logged for ${count} customers.`);
  };

  const tierCounts = { ALL: customers.length };
  customers.forEach(c => { tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1; });

  // Apply smart list on top of other filters
  let displayList = applySmartList(filtered);

  return (
    <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: isMobile ? "auto" : "calc(100dvh - 160px)", minHeight: 0, position: "relative" }}>
      {/* Left: Customer List — hidden on mobile when a profile is open */}
      <div style={{ display: isMobile && selected ? "none" : "flex", flexDirection: "column", gap: 8, overflow: "hidden", height: isMobile ? "calc(100dvh - 60px)" : "auto" }}>
        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 2 }}>
          {[
            { label: "Total", val: customers.length, color: C.text2 },
            { label: "At Risk", val: atRiskCount, color: atRiskCount > 0 ? C.warning : C.text3 },
            { label: "Birthdays", val: todayBirthdays, color: todayBirthdays > 0 ? C.purple : C.text3 },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg3, borderRadius: 7, padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28, paddingRight: search ? 28 : undefined }} placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.text3, fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }} title="Clear search">×</button>
            )}
          </div>
          <button style={btn("primary")} onClick={openAddModal}>＋ Add</button>
          <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 9px" }} onClick={exportCSV} title="Export to CSV">⬇ CSV</button>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", flex: 1, minHeight: 44 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="spend">Sort: Top Spenders</option>
            <option value="visits">Sort: Most Visits</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="risk">Sort: Churn Risk</option>
          </select>
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", flex: 1, minHeight: 44 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            {CUSTOMER_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        {/* Segment Filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "ALL", label: "All" },
            { key: "AT_RISK", label: "⚠ At Risk" },
            { key: "VIP", label: "⭐ VIP" },
            { key: "BIRTHDAY", label: "🎂 B-day" },
          ].map(s => (
            <button key={s.key} onClick={() => setSegmentFilter(s.key)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${segmentFilter === s.key ? C.amber3 : C.border}`, background: segmentFilter === s.key ? C.bg4 : "transparent", color: segmentFilter === s.key ? C.amber2 : C.text3, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, minWidth: 0 }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Tier Filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["ALL", "PLATINUM", "GOLD", "SILVER", "BRONZE"].map(t => {
            const tc = TIER_COLORS[t] || { color: C.text2, bg: C.bg3 };
            const active = tierFilter === t;
            return (
              <button key={t} onClick={() => setTierFilter(t)} style={{ flex: 1, padding: "10px 6px", borderRadius: 6, border: `1px solid ${active ? tc.color : C.border}`, background: active ? tc.bg : "transparent", color: active ? tc.color : C.text3, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: ".04em", minHeight: 44 }}>
                {t === "ALL" ? `All ${tierCounts.ALL}` : `${t.slice(0,2)} ${tierCounts[t] || 0}`}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, paddingRight: 2, paddingBottom: isMobile ? 8 : 0 }}>
          {/* Smart list label */}
          {smartList && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.amberBg, border: `1px solid ${C.amber3}`, borderRadius: 8, fontSize: 11 }}>
              <span style={{ color: C.amber2, fontWeight: 600 }}>
                {smartList === "gone_cold" ? "🧊 Regulars Gone Cold" : smartList === "loyalty_ready" ? "⭐ Loyalty Ready" : smartList === "high_value" ? "💎 High Value" : "🌱 New Customers"}
              </span>
              <span style={{ color: C.text3 }}>({displayList.length})</span>
              <button onClick={() => setSmartList(null)} style={{ marginLeft: "auto", ...btn("ghost"), fontSize: 9, padding: "2px 7px" }}>✕ Clear</button>
            </div>
          )}

          {/* Bulk mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(tierFilter !== "ALL" || segmentFilter !== "ALL" || typeFilter !== "ALL" || smartList) && (
              <button onClick={() => { setTierFilter("ALL"); setSegmentFilter("ALL"); setTypeFilter("ALL"); setSmartList(null); }} style={{ ...btn("ghost"), fontSize: 10, padding: "5px 10px", color: C.warning, borderColor: C.warningBorder }}>✕ Clear filters</button>
            )}
            <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }} style={{ ...btn(bulkMode ? "primary" : "ghost"), fontSize: 10, padding: "5px 10px" }}>
              {bulkMode ? `✓ ${bulkSelected.size} selected` : "☑ Select"}
            </button>
            {bulkMode && bulkSelected.size > 0 && (
              <button onClick={() => setShowBulkModal(true)} style={{ ...btn("primary"), fontSize: 10, padding: "5px 10px" }}>
                💬 Message {bulkSelected.size}
              </button>
            )}
            {bulkMode && (
              <button onClick={() => setBulkSelected(new Set(displayList.map(c => c.id)))} style={{ ...btn("ghost"), fontSize: 10, padding: "5px 10px" }}>All</button>
            )}
          </div>

          {displayList.map(c => {
            const tc = TIER_COLORS[c.tier] || {};
            const active = selected === c.id;
            const risk = churnRisk(c);
            const atRisk = isAtRisk(c);
            return (
              <div key={c.id} onClick={() => {
                if (bulkMode) {
                  const next = new Set(bulkSelected);
                  next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                  setBulkSelected(next);
                } else {
                  setSelected(c.id); setProfileTab("overview");
                }
              }} style={{ background: active ? C.bg3 : C.bg2, border: `1px solid ${bulkSelected.has(c.id) ? C.amber3 : active ? C.amber3 : atRisk ? C.warningBorder : C.border}`, borderRadius: 10, padding: 11, cursor: "pointer", transition: "all .12s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {bulkMode && (
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${bulkSelected.has(c.id) ? C.amber2 : C.border2}`, background: bulkSelected.has(c.id) ? C.amber2 : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: C.onAmber2, fontWeight: 700 }}>
                      {bulkSelected.has(c.id) ? "✓" : ""}
                    </div>
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.bg || C.bg4, border: `2px solid ${tc.color || C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: tc.color || C.text2, flexShrink: 0 }}>{initials(c.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                      {c.customerType && TYPE_MAP[c.customerType] && (
                        <span style={{ fontSize: 9, color: TYPE_MAP[c.customerType].color }} title={TYPE_MAP[c.customerType].label}>{TYPE_MAP[c.customerType].icon} {TYPE_MAP[c.customerType].label}</span>
                      )}
                      {!c.customerType && <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>{c.phone}</div>}
                    </div>
                    {c.customerType && <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>{c.phone}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ ...pill(tc.bg || C.bg4, tc.color || C.text2), fontSize: 9 }}>{c.tier}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {c.allergy && <span title={`Allergy: ${c.allergy}`} style={{ fontSize: 11 }}>⚠️</span>}
                      {c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10) && <span title="Birthday today!" style={{ fontSize: 11 }}>🎂</span>}
                      {atRisk && <span style={{ ...pill(C.warningBg, C.warning), fontSize: 8 }}>⚠ RISK</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 7, fontSize: 11, color: C.text2 }}>
                  <span>{c.visits} visits</span>
                  <span>₹{c.spend.toLocaleString()}</span>
                  <span style={{ marginLeft: "auto", color: risk.color, fontSize: 10, fontWeight: 600 }}>{risk.label}</span>
                </div>
                <div style={{ marginTop: 6, height: 3, background: C.bg4, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: tc.color || C.amber3, width: `${Math.min(100, (c.spend / maxSpend) * 100)}%`, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
          {displayList.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: C.text3, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{search ? "🔍" : segmentFilter !== "ALL" ? "✅" : "👤"}</div>
              <div style={{ fontWeight: 600, color: C.text2, marginBottom: 6 }}>
                {search ? `No results for "${search}"` : segmentFilter === "AT_RISK" ? "No at-risk customers" : segmentFilter === "BIRTHDAY" ? "No birthdays today" : segmentFilter === "VIP" ? "No VIP customers yet" : "No customers yet"}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                {search ? "Try a different name, phone, or email" : segmentFilter !== "ALL" ? "Clear the filter to see all customers" : "Add your first customer to get started"}
              </div>
              {!search && segmentFilter === "ALL" && (
                <button style={{ ...btn("primary"), fontSize: 11, marginTop: 12 }} onClick={openAddModal}>＋ Add Customer</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Profile Panel — hidden on mobile when no profile is selected */}
      <div style={{ display: isMobile && !selected ? "none" : "flex", flexDirection: "column", background: C.bg2, border: isMobile ? "none" : `1px solid ${C.border}`, borderRadius: isMobile ? 0 : 14, padding: isMobile ? "14px 14px 80px" : 20, overflowY: "auto", height: isMobile ? "calc(100dvh - 60px)" : "auto" }}>
        {/* Mobile back button */}
        {isMobile && selected && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setSelected(null)} style={{ ...btn("ghost"), fontSize: 13, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>← Customers</button>
          </div>
        )}
        {!profile ? (
          <div style={{ overflowY: "auto" }}>
            {/* Owner Dashboard */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>☕ Today's Snapshot</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 12 }}>
                {[
                  { val: `₹${todayRevenue.toLocaleString()}`, lbl: "Today's Revenue", color: C.amber2 },
                  { val: todayOrders.filter(o=>o.status==="COMPLETED").length, lbl: "Orders Today", color: C.green },
                  { val: todayNewCustomers, lbl: "New Customers", color: C.blue },
                ].map(s => (
                  <div key={s.lbl} style={{ background: C.bg3, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 16 }}>
                {[
                  { val: `₹${totalRevenue.toLocaleString()}`, lbl: "Total Revenue", color: C.text2 },
                  { val: avgVisitsPerCustomer, lbl: "Avg Visits", color: C.text2 },
                  { val: loyaltyReadyCount, lbl: "Loyalty Ready", color: loyaltyReadyCount > 0 ? C.amber2 : C.text3 },
                ].map(s => (
                  <div key={s.lbl} style={{ background: C.bg3, borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: C.text3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Lists */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>🎯 Smart Lists</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { key: "gone_cold", icon: "🧊", label: "Regulars Gone Cold", desc: "3+ visits, away 14+ days", count: customers.filter(c => { const d = parseInt(c.lastVisit); return !isNaN(d) && d >= 14 && c.visits >= 3; }).length, color: C.warning },
                  { key: "loyalty_ready", icon: "⭐", label: "Loyalty Ready to Redeem", desc: "Enough points for a reward", count: loyaltyReadyCount, color: C.amber2 },
                  { key: "high_value", icon: "💎", label: "High Value Customers", desc: "Lifetime spend ₹5,000+", count: customers.filter(c => c.spend >= 5000).length, color: C.purple },
                  { key: "new_customers", icon: "🌱", label: "New Customers", desc: "2 or fewer visits", count: customers.filter(c => c.visits <= 2).length, color: C.green },
                ].map(sl => (
                  <div key={sl.key} onClick={() => { setSmartList(smartList === sl.key ? null : sl.key); setSelected(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: smartList === sl.key ? C.bg4 : C.bg3, border: `1px solid ${smartList === sl.key ? C.amber3 : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all .15s" }}>
                    <span style={{ fontSize: 18 }}>{sl.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: smartList === sl.key ? C.amber2 : C.text }}>{sl.label}</div>
                      <div style={{ fontSize: 10, color: C.text3 }}>{sl.desc}</div>
                    </div>
                    <span style={{ ...pill(C.bg4, sl.color), fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{sl.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>🎂 Birthdays This Week</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {upcomingBirthdays.map(c => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const bday = new Date(today.getFullYear(), parseInt(c.birthday.slice(5,7)) - 1, parseInt(c.birthday.slice(8,10)));
                    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                    const diff = Math.round((bday - today) / 86400000);
                    return (
                      <div key={c.id} onClick={() => { setSelected(c.id); setProfileTab("overview"); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg3, borderRadius: 8, cursor: "pointer", border: `1px solid ${C.border}` }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: TIER_COLORS[c.tier]?.bg || C.bg4, border: `1px solid ${TIER_COLORS[c.tier]?.color || C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: TIER_COLORS[c.tier]?.color || C.text2, flexShrink: 0 }}>{initials(c.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: C.text3 }}>{diff === 1 ? "Tomorrow!" : `In ${diff} days`}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelected(c.id); setProfileTab("comms"); setCommMsg(`Hi ${c.name.split(" ")[0]}, wishing you a very happy birthday! 🎂 Come celebrate with us.`); }} style={{ ...btn("ghost"), fontSize: 9, padding: "4px 8px" }}>Send 🎁</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Needed */}
            {(() => {
              const actions = [];
              if (atRiskCount > 0) actions.push({ icon: "🚨", text: `${atRiskCount} customers at churn risk`, action: () => setSegmentFilter("AT_RISK"), cta: "View" });
              if (loyaltyReadyCount > 0) actions.push({ icon: "⭐", text: `${loyaltyReadyCount} customers have redeemable loyalty points`, action: () => setSmartList("loyalty_ready"), cta: "View" });
              if (todayBirthdays > 0) actions.push({ icon: "🎂", text: `${todayBirthdays} birthday${todayBirthdays > 1 ? "s" : ""} today — send a treat!`, action: () => setSegmentFilter("BIRTHDAY"), cta: "View" });
              if (actions.length === 0) return null;
              return (
                <div>
                  <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>⚡ Action Needed</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {actions.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: 10 }}>
                        <span style={{ fontSize: 16 }}>{a.icon}</span>
                        <div style={{ flex: 1, fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{a.text}</div>
                        <button onClick={a.action} style={{ ...btn("ghost"), fontSize: 10, padding: "4px 8px", whiteSpace: "nowrap" }}>{a.cta}</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              {(() => {
                const tc = TIER_COLORS[profile.tier] || {};
                return (
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}`, boxShadow: `0 0 16px ${tc.glow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: tc.color, flexShrink: 0 }}>
                    {initials(profile.name)}
                  </div>
                );
              })()}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {editField === "name" ? (
                    <input autoFocus style={{ ...input, fontSize: 16, fontWeight: 700, padding: "3px 8px", width: 180 }} value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveField("name"); if (e.key === "Escape") setEditField(null); }}
                      onBlur={() => saveField("name")} />
                  ) : (
                    <div style={{ fontSize: 18, fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${C.border2}` }} title="Click to edit" onClick={() => { setEditField("name"); setEditVal(profile.name); }}>{profile.name}</div>
                  )}
                  <span style={{ ...pill(TIER_COLORS[profile.tier]?.bg, TIER_COLORS[profile.tier]?.color), fontSize: 10 }}>{profile.tier}</span>
                  <span style={{ ...pill(C.neutralBg, churnRisk(profile).color), fontSize: 9, marginLeft: "auto" }}>{churnRisk(profile).label}</span>
                  <button onClick={() => openEditModal(profile)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px" }}>✎ Edit</button>
                  <button onClick={() => deleteCustomer(profile.id)} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer" }} title="Delete customer">🗑</button>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  {["phone","email","birthday","allergy"].map(field => (
                    editField === field ? (
                      <input key={field} autoFocus
                        type={field === "birthday" ? "date" : "text"}
                        style={{ ...input, fontSize: 11, padding: "2px 7px", width: field === "birthday" ? 130 : 160, fontFamily: "monospace" }}
                        value={editVal} onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveField(field); if (e.key === "Escape") setEditField(null); }}
                        onBlur={() => saveField(field)} />
                    ) : (
                      <span key={field} style={{ fontSize: 11, color: field === "allergy" && profile[field] ? C.warning : C.text2, fontFamily: "monospace", cursor: "pointer", borderBottom: `1px dashed ${C.border2}` }} title={`Click to edit ${field}`} onClick={() => { setEditField(field); setEditVal(profile[field] || ""); }}>
                        {field === "birthday" && profile[field] ? `🎂 ${new Date(profile[field]).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}` :
                         field === "allergy" && profile[field] ? `⚠️ ${profile[field]}` :
                         profile[field] || `+ add ${field}`}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Tier Progress Bar */}
            {(() => {
              const tc = TIER_COLORS[profile.tier] || {};
              const next = TIER_NEXT[profile.tier];
              const nextThreshold = TIER_SPEND[profile.tier];
              const prevThreshold = profile.tier === "BRONZE" ? 0 : TIER_SPEND[{ SILVER: "BRONZE", GOLD: "SILVER", PLATINUM: "GOLD" }[profile.tier]];
              const pct = next ? Math.min(100, ((profile.spend - prevThreshold) / (nextThreshold - prevThreshold)) * 100) : 100;
              return (
                <div style={{ marginBottom: 16, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    <span>{profile.tier}</span>
                    {next ? <span>→ {next} · ₹{(nextThreshold - profile.spend).toLocaleString()} to go</span> : <span style={{ color: tc.color }}>MAX TIER ✦</span>}
                  </div>
                  <div style={{ height: 5, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: tc.color || C.amber, width: `${pct}%`, transition: "width .5s", boxShadow: `0 0 8px ${tc.glow || "transparent"}` }} />
                  </div>
                </div>
              );
            })()}

            {/* Allergy Warning */}
            {profile.allergy && (
              <div style={{ background: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 10, color: C.warning, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Allergy Alert</div>
                  <div style={{ fontSize: 12, color: C.text }}>{profile.allergy}</div>
                </div>
              </div>
            )}
            {profile.birthday && new Date().toISOString().slice(5,10) === profile.birthday?.slice(5,10) && (
              <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎂</span>
                <div style={{ fontSize: 12, color: C.purple }}>It's {profile.name.split(" ")[0]}'s birthday today! Consider a free treat 🎁</div>
              </div>
            )}
            {profile.pinnedNote && (
              <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>📌</span>
                <div style={{ fontSize: 12, color: C.amber2, lineHeight: 1.5, flex: 1 }}>{profile.pinnedNote}</div>
              </div>
            )}

            {/* Profile Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bg3, padding: 3, borderRadius: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {["overview","history","notes","comms"].map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{ flex: "0 0 auto", minWidth: isMobile ? 70 : 64, padding: isMobile ? "10px 0" : "7px 0", borderRadius: 6, border: "none", background: profileTab === t ? C.bg4 : "transparent", color: profileTab === t ? C.amber2 : C.text3, fontSize: isMobile ? 12 : 11, cursor: "pointer", fontWeight: profileTab === t ? 600 : 400, transition: "all .15s", whiteSpace: "nowrap" }}>
                  {t === "overview" ? "📊" : t === "history" ? "🧾" : t === "notes" ? "📝" : "💬"}
                  <div style={{ fontSize: 9, marginTop: 1 }}>{t === "overview" ? "Overview" : t === "history" ? "History" : t === "notes" ? "Notes" : "Comms"}</div>
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {profileTab === "overview" && (
              <>
                {/* Action Needed callouts */}
                {(() => {
                  const items = [];
                  const risk = churnRisk(profile);
                  if (risk.label === "At Risk" || risk.label === "Churned") items.push({ color: C.red, bg: C.redBg, icon: "🚨", text: `${risk.label}: Last visit was ${profile.lastVisit}. Send a win-back offer.`, tab: "comms" });
                  if (profile.birthday && new Date().toISOString().slice(5,10) === profile.birthday?.slice(5,10)) items.push({ color: C.purple, bg: C.purpleBg, icon: "🎂", text: "Birthday today! Consider a complimentary treat.", tab: "comms" });
                  if (!profile.email) items.push({ color: C.text3, bg: C.bg3, icon: "📧", text: "No email on file — add it to enable email campaigns.", tab: null });
                  if (items.length === 0) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: item.bg, border: `1px solid ${item.color}33`, borderRadius: 9 }}>
                          <span style={{ fontSize: 15 }}>{item.icon}</span>
                          <div style={{ flex: 1, fontSize: 11, color: C.text2, lineHeight: 1.4 }}>{item.text}</div>
                          {item.tab && <button onClick={() => setProfileTab(item.tab)} style={{ ...btn("ghost"), fontSize: 9, padding: "3px 8px", whiteSpace: "nowrap", borderColor: item.color + "55", color: item.color }}>Go →</button>}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                  {[
                    { val: customerMetrics?.ordersCompleted || profile.visits || 0, lbl: "Orders", color: C.text },
                    { val: "₹" + (Number(customerMetrics?.totalSpend) || Number(profile.spend) || 0).toLocaleString(), lbl: "Lifetime", color: C.amber2 },
                    { val: "₹" + Math.round((Number(customerMetrics?.totalSpend) || Number(profile.spend) || 0) / Math.max(1, Number(customerMetrics?.ordersCompleted) || Number(profile.visits) || 1)), lbl: "Avg Order", color: C.green },
                    { val: customerMetrics?.lastOrderDate ? new Date(customerMetrics.lastOrderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : (profile.lastVisit || "Never"), lbl: "Last Visit", color: C.blue },
                  ].map(s => (
                    <div key={s.lbl} style={{ background: C.bg3, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Loyalty Points Card */}
                {(() => {
                  const pts = profile.loyaltyPoints || 0;
                  const redeemable = calculateRedeemable(pts);
                  const canRedeem = redeemable >= MIN_REDEEM_AMOUNT;
                  return (
                    <div style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", marginBottom: 16, border: `1px solid ${canRedeem ? C.amber3 : C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>⭐</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>Loyalty Points</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: canRedeem ? C.amber2 : C.text, fontFamily: "monospace" }}>{pts.toLocaleString()} pts</div>
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>Redeemable: ₹{redeemable} {canRedeem ? "· Ready!" : `· Need ${MIN_REDEEM_AMOUNT - redeemable} more`}</div>
                      </div>
                      <button
                        style={{ ...btn(canRedeem ? "primary" : "ghost"), fontSize: 11, opacity: canRedeem ? 1 : 0.5, cursor: canRedeem ? "pointer" : "not-allowed" }}
                        disabled={!canRedeem}
                        onClick={() => { setRedeemAmount(""); setShowLoyaltyModal(true); }}
                      >Redeem</button>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Favourite Item</div>
                    <div style={{ fontSize: 13, color: C.amber2, fontWeight: 600 }}>☕ {customerMetrics?.favoriteItem || profile.fav || "—"}</div>
                  </div>
                  <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Preferred Time</div>
                    <div style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>
                      {customerMetrics?.preferredHour != null
                        ? (() => { const h = parseInt(customerMetrics.preferredHour); return `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`; })()
                        : "Not enough data"}
                    </div>
                  </div>
                  {profile.birthday && (
                    <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Birthday</div>
                      <div style={{ fontSize: 13, color: C.purple, fontWeight: 600 }}>🎂 {new Date(profile.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                    </div>
                  )}
                </div>

                {/* Customer Type Card */}
                {profile.customerType && TYPE_MAP[profile.customerType] && (() => {
                  const ct = TYPE_MAP[profile.customerType];
                  return (
                    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: `1px solid ${ct.color}33` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{ct.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: ct.color }}>{ct.label}</div>
                          <div style={{ fontSize: 10, color: C.text3 }}>{ct.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.text2, background: C.bg4, borderRadius: 7, padding: "8px 10px", lineHeight: 1.5 }}>💡 {ct.tip}</div>
                    </div>
                  );
                })()}

                <LogVisit key={profile.id} profile={profile} addVisitEntry={addVisitEntry} />

                {/* Tags */}
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {profile.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: C.bg4, color: C.text2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", gap: 5 }}>
                      {t}
                      <span style={{ cursor: "pointer", color: C.text3, fontSize: 12, lineHeight: 1 }} onClick={() => removeTag(t)}>×</span>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                  <input style={{ ...input, fontSize: 11, padding: "5px 9px" }} value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag…" onKeyDown={e => e.key === "Enter" && addTag()} />
                  <button style={{ ...btn("ghost"), fontSize: 11, whiteSpace: "nowrap" }} onClick={addTag}>+ Add</button>
                </div>
              </>
            )}

            {/* TAB: HISTORY */}
            {profileTab === "history" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase" }}>Order History</div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{hist.length} total</div>
                </div>

                {/* Status filter */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {["ALL","COMPLETED","CANCELLED","PENDING"].map(s => (
                    <button key={s} onClick={() => setHistFilter(s)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${histFilter === s ? C.amber3 : C.border}`, background: histFilter === s ? C.bg4 : "transparent", color: histFilter === s ? C.amber2 : C.text3, fontSize: 9, fontWeight: 700, cursor: "pointer", minHeight: 34 }}>
                      {s === "ALL" ? `All (${hist.length})` : s === "COMPLETED" ? `✓ Done` : s === "CANCELLED" ? `✕ Cancelled` : `… Pending`}
                    </button>
                  ))}
                </div>

                {hist.length > 1 && (() => {
                  const completed = hist.filter(h => h.status === "COMPLETED").slice(0, 12).reverse();
                  if (completed.length < 2) return null;
                  const maxAmt = Math.max(...completed.map(h => h.total || 0), 1);
                  return (
                    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Spend Trend — last {completed.length} orders</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
                        {completed.map((h, i) => (
                          <div key={i} title={`₹${h.total || 0}`} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: C.amber3, height: `${Math.max(10, ((h.total || 0) / maxAmt) * 100)}%`, transition: "height .3s", cursor: "default", opacity: 0.7 + 0.3 * (i / completed.length) }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.text3, marginTop: 4 }}>
                        <span>Oldest</span><span>Newest</span>
                      </div>
                    </div>
                  );
                })()}

                {hist.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: C.text3 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🧾</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>No orders yet</div>
                    <div style={{ fontSize: 11 }}>This customer hasn't placed any orders</div>
                  </div>
                ) : (() => {
                  const filtered = hist.filter(h => histFilter === "ALL" || h.status === histFilter);
                  if (filtered.length === 0) return (
                    <div style={{ fontSize: 12, color: C.text3, padding: "20px 0", textAlign: "center" }}>No {histFilter.toLowerCase()} orders</div>
                  );
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {filtered.map((h, i) => (
                        <div key={i} style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", border: `1px solid ${h.status === "CANCELLED" ? C.red + "22" : C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: h.items?.length ? 6 : 0 }}>
                            <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>
                              {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                              {h.createdAt && <span style={{ marginLeft: 6 }}>{new Date(h.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ color: C.amber2, fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>₹{h.total || 0}</span>
                              <span style={{ ...pill(h.status === "COMPLETED" ? C.greenBg : h.status === "CANCELLED" ? C.redBg : C.neutralBg, h.status === "COMPLETED" ? C.green : h.status === "CANCELLED" ? C.red : C.amber), fontSize: 9 }}>
                                {h.status}
                              </span>
                            </div>
                          </div>
                          {h.items?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {h.items.map((item, j) => (
                                <span key={j} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: C.bg4, color: C.text2, border: `1px solid ${C.border}` }}>
                                  {item.qty}× {item.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.text3, padding: "8px 12px", borderTop: `1px solid ${C.border}`, marginTop: 2 }}>
                        <span>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
                        <span style={{ color: C.amber2, fontFamily: "monospace", fontWeight: 600 }}>₹{filtered.reduce((s, h) => s + (h.total || 0), 0).toLocaleString()} total</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* TAB: NOTES */}
            {profileTab === "notes" && (
              <>
                {/* Pinned Note */}
                <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: C.amber2, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>📌 Pinned Note <span style={{ color: C.text3, fontWeight: 400 }}>— shown at top of every visit</span></div>
                  <input
                    style={{ ...input, fontSize: 12, marginBottom: 8 }}
                    placeholder="e.g. Always asks for extra ice. Regulars discount approved."
                    value={pinnedNote}
                    onChange={e => setPinnedNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && savePinnedNote()}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.text3 }}>{pinnedNote.length} chars</span>
                    <button style={{ ...btn("ghost"), fontSize: 10 }} onClick={savePinnedNote}>Save Pinned Note</button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase" }}>Staff Notes</div>
                  <span style={{ fontSize: 10, color: C.text3 }}>{noteVal.length} chars</span>
                </div>
                <textarea
                  style={{ ...input, resize: "none", lineHeight: 1.7, marginBottom: 8, fontFamily: "inherit" }}
                  rows={9}
                  placeholder={"Add notes about this customer…\n\nGood for:\n• Preferences & quirks\n• Past complaints\n• Special requests\n• Staff observations"}
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btn("primary"), fontSize: 11, flex: 1 }} onClick={updateNote}>Save Notes</button>
                  {noteVal !== (profile.notes || "") && (
                    <div style={{ display: "flex", alignItems: "center", fontSize: 10, color: C.amber2, gap: 4 }}>
                      <span>●</span> Unsaved
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB: COMMS */}
            {profileTab === "comms" && (
              <>
                {/* Contact quick-access */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 10px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border}`, color: C.green, fontSize: 11, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
                      📞 {profile.phone}
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`https://wa.me/91${profile.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border}`, color: "#25D366", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      💬 WA
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 10px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border}`, color: C.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", overflow: "hidden" }}>
                      📧 <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</span>
                    </a>
                  )}
                </div>

                <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Log Communication</div>

                {/* Quick message templates */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {[
                    { icon: "🎁", label: "Birthday", msg: `Hi ${profile.name.split(" ")[0]}, happy birthday! Enjoy a special treat on us today 🎂` },
                    { icon: "🔄", label: "Win Back", msg: `Hi ${profile.name.split(" ")[0]}, we miss you! Come back soon and enjoy 10% off your next order.` },
                    { icon: "📢", label: "Promo", msg: `Hi ${profile.name.split(" ")[0]}, we have a special offer just for you this week!` },
                    { icon: "⭐", label: "Thank You", msg: `Hi ${profile.name.split(" ")[0]}, thank you for visiting us! We hope to see you again soon ☕` },
                  ].map(t => (
                    <button key={t.label} style={{ ...btn("ghost"), fontSize: 9, padding: "5px 9px" }} onClick={() => setCommMsg(t.msg)}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                  {["SMS","WhatsApp","Email","Call"].map(type => (
                    <button key={type} onClick={() => setCommType(type)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: `1px solid ${commType === type ? C.amber3 : C.border}`, background: commType === type ? C.bg4 : "transparent", color: commType === type ? C.amber2 : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                      {type === "Email" ? "📧" : type === "SMS" ? "📱" : type === "WhatsApp" ? "💬" : "📞"} {type}
                    </button>
                  ))}
                </div>

                <textarea
                  style={{ ...input, resize: "none", lineHeight: 1.6, marginBottom: 8, fontFamily: "inherit" }}
                  rows={4}
                  placeholder={`Write a ${commType.toLowerCase()} message…`}
                  value={commMsg}
                  onChange={e => setCommMsg(e.target.value)}
                />
                <button
                  style={{ ...btn("primary"), fontSize: 11, marginBottom: 20, width: "100%", opacity: commMsg.trim() ? 1 : 0.5, cursor: commMsg.trim() ? "pointer" : "not-allowed" }}
                  disabled={!commMsg.trim()}
                  onClick={() => logComm(profile.id, commType, commMsg)}
                >
                  ✓ Log {commType} as Sent
                </button>

                {/* Communication History */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em" }}>History</div>
                  <span style={{ fontSize: 10, color: C.text3 }}>{(profile.commLog || []).length} logged</span>
                </div>
                {(profile.commLog || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: C.text3 }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
                    <div style={{ fontSize: 12 }}>No communications logged yet</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(profile.commLog || []).map((entry, i) => (
                      <div key={i} style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${entry.type === "Email" ? C.blue : entry.type === "WhatsApp" ? "#25D366" : entry.type === "Call" ? C.green : C.amber}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: entry.type === "Email" ? C.blue : entry.type === "WhatsApp" ? "#25D366" : entry.type === "Call" ? C.green : C.amber }}>
                            {entry.type === "Email" ? "📧" : entry.type === "SMS" ? "📱" : entry.type === "WhatsApp" ? "💬" : "📞"} {entry.type}
                            {entry.bulk && <span style={{ marginLeft: 5, color: C.text3, fontWeight: 400 }}>· bulk</span>}
                          </span>
                          <span style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>
                            {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} {new Date(entry.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{entry.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Loyalty Redeem Modal */}
      {showLoyaltyModal && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowLoyaltyModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.amber3}`, borderRadius: 18, padding: 24, width: "min(340px, 92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>⭐ Redeem Points</div>
              <button onClick={() => setShowLoyaltyModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Available points</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{(profile.loyaltyPoints || 0).toLocaleString()} pts</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>= ₹{calculateRedeemable(profile.loyaltyPoints || 0)} redeemable</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.text3, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Redeem Amount (₹)</label>
              <input
                style={{ ...input, fontSize: 14, fontFamily: "monospace" }}
                type="number"
                min={MIN_REDEEM_AMOUNT}
                max={calculateRedeemable(profile.loyaltyPoints || 0)}
                step="1"
                placeholder={`Min ₹${MIN_REDEEM_AMOUNT}`}
                value={redeemAmount}
                onChange={e => setRedeemAmount(e.target.value)}
                onKeyDown={e => e.key === "Enter" && redeemPoints(profile.id, redeemAmount)}
                autoFocus
              />
              {redeemAmount && Number(redeemAmount) > calculateRedeemable(profile.loyaltyPoints || 0) && (
                <div style={{ fontSize: 10, color: C.warning, marginTop: 5 }}>Max redeemable is ₹{calculateRedeemable(profile.loyaltyPoints || 0)}</div>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 14, lineHeight: 1.5 }}>
              This deducts {Number(redeemAmount) * POINTS_PER_RUPEE || "—"} points. Apply ₹{redeemAmount || "—"} as a discount on the customer's next order.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowLoyaltyModal(false)}>Cancel</button>
              <button
                style={{ ...btn("primary"), opacity: Number(redeemAmount) >= MIN_REDEEM_AMOUNT ? 1 : 0.5 }}
                disabled={!Number(redeemAmount) || Number(redeemAmount) < MIN_REDEEM_AMOUNT}
                onClick={() => redeemPoints(profile.id, redeemAmount)}
              >Redeem ₹{redeemAmount || "—"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Communication Modal */}
      {showBulkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowBulkModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(420px, 92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>💬 Message {bulkSelected.size} Customers</div>
              <button onClick={() => setShowBulkModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 11, color: C.text2 }}>
              {[...bulkSelected].map(id => customers.find(c => c.id === id)?.name).filter(Boolean).join(", ")}
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {["SMS","WhatsApp","Email","Call"].map(t => (
                <button key={t} onClick={() => setBulkCommType(t)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${bulkCommType === t ? C.amber3 : C.border}`, background: bulkCommType === t ? C.bg4 : "transparent", color: bulkCommType === t ? C.amber2 : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                  {t === "SMS" ? "📱" : t === "WhatsApp" ? "💬" : t === "Email" ? "📧" : "📞"} {t}
                </button>
              ))}
            </div>
            {/* Quick templates */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {[
                { label: "🧊 Win Back", msg: "Hi! We miss you at the café — come back soon and enjoy a special treat on us." },
                { label: "⭐ Redeem", msg: "Hi! Your loyalty points are ready to redeem. Visit us today and get a reward!" },
                { label: "📢 Promo", msg: "Hi! We have something special for you this week. Come by and check it out!" },
              ].map(t => (
                <button key={t.label} style={{ ...btn("ghost"), fontSize: 9, padding: "4px 8px" }} onClick={() => setBulkCommMsg(t.msg)}>{t.label}</button>
              ))}
            </div>
            <textarea style={{ ...input, resize: "none", lineHeight: 1.6, marginBottom: 12 }} rows={4} placeholder="Type your message…" value={bulkCommMsg} onChange={e => setBulkCommMsg(e.target.value)} />
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 14 }}>This will be logged in each customer's communication history.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={sendBulkComm} disabled={!bulkCommMsg.trim()}>Log {bulkCommType} to {bulkSelected.size} customers</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(360px, 92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editMode ? "Edit Customer" : "Add Customer"}</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {[
              { lbl: "Name *", val: modalData.name, set: (v) => setModalData({...modalData, name: v}), ph: "Full name", type: "text" },
              { lbl: "Phone *", val: modalData.phone, set: (v) => setModalData({...modalData, phone: v}), ph: "10-digit number", type: "tel" },
              { lbl: "Email (optional)", val: modalData.email, set: (v) => setModalData({...modalData, email: v}), ph: "email@example.com", type: "email" },
            ].map(f => (
              <div key={f.lbl} style={{ marginBottom: 12 }}>
                <label style={label}>{f.lbl}</label>
                <input style={input} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Birthday (optional)</label>
                <input style={input} type="date" value={modalData.birthday} onChange={e => setModalData({...modalData, birthday: e.target.value})} />
              </div>
              <div>
                <label style={label}>Allergy / Dietary</label>
                <input style={input} value={modalData.allergy} onChange={e => setModalData({...modalData, allergy: e.target.value})} placeholder="e.g. Nuts, Dairy" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Tags (comma separated)</label>
              <input style={input} value={modalData.tags} onChange={e => setModalData({...modalData, tags: e.target.value})} placeholder="Regular, Corporate, VIP…" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Customer Type</label>
              <select style={input} value={modalData.customerType} onChange={e => setModalData({...modalData, customerType: e.target.value})}>
                <option value="">— Select type —</option>
                {CUSTOMER_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label} — {t.desc}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveModal}>{editMode ? "Save Changes" : "Add Customer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 28, left: "50%", transform: "translateX(-50%)", background: C.neutralBg, border: `1px solid ${toast.color}`, color: toast.color, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 200, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,.5)", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: C.bg2, borderTop: `1px solid ${C.border2}`, display: "flex", alignItems: "stretch", zIndex: 150, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { icon: "👥", label: "Customers", action: () => setSelected(null), active: !selected },
            { icon: "➕", label: "Add", action: openAddModal, active: false, highlight: true },
            { icon: "📊", label: "Dashboard", action: () => { setSelected(null); setSmartList(null); setSegmentFilter("ALL"); setTierFilter("ALL"); setTypeFilter("ALL"); }, active: false },
            { icon: "⬇", label: "Export", action: exportCSV, active: false },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: item.highlight ? C.amber3 : "transparent", border: "none", cursor: "pointer", color: item.active ? C.amber2 : item.highlight ? C.amber2 : C.text3, fontSize: 10, fontWeight: item.active || item.highlight ? 700 : 400, borderTop: item.active ? `2px solid ${C.amber2}` : "2px solid transparent" }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CRM;
