import { useState, useEffect, useRef } from "react";
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

// Communication channels, consent, and status constants (Prompt 16)
const COMM_TYPES = ["SMS", "WhatsApp", "Email", "Call", "Internal Note"];
const CONSENT_FIELDS = [
  { key: "marketingConsent", lbl: "Marketing" },
  { key: "smsConsent", lbl: "SMS" },
  { key: "emailConsent", lbl: "Email" },
  { key: "whatsappConsent", lbl: "WhatsApp" },
];
const PREFERRED_CHANNELS = ["None", "SMS", "Email", "WhatsApp", "Call"];
const CUSTOMER_STATUSES = ["active", "inactive", "blocked"];
// Channels that legally require explicit opt-in before logging an outbound message; Call/Internal Note do not.
const channelRequiresConsent = (t) => t === "SMS" || t === "WhatsApp" || t === "Email";
const hasConsentFor = (c, t) => {
  if (t === "SMS") return !!c?.smsConsent;
  if (t === "Email") return !!c?.emailConsent;
  if (t === "WhatsApp") return !!c?.whatsappConsent;
  return true; // Call / Internal Note don't require a specific channel consent flag here
};
const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];
// Safely normalize a birthday value to YYYY-MM-DD, tolerating missing-year formats like "--12-25" or "0000-12-25".
const normalizeBirthday = (raw) => {
  if (typeof raw !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const noYear = raw.match(/^(?:--|0000)-(\d{2})-(\d{2})/);
  if (noYear) return `0004-${noYear[1]}-${noYear[2]}`; // placeholder leap year, month/day only
  return "";
};

function CRM({ customers, setCustomers, orders, kdsCards }) {
  // --- Safe guards: never crash if customers/orders/kdsCards are null/undefined/malformed ---
  customers = Array.isArray(customers) ? customers : [];
  orders = Array.isArray(orders) ? orders : [];
  kdsCards = Array.isArray(kdsCards) ? kdsCards : [];
  const cName = (c) => (typeof c?.name === "string" && c.name.trim()) ? c.name.trim() : "Unnamed";
  const cPhone = (c) => (typeof c?.phone === "string" ? c.phone : "");
  const cEmail = (c) => (typeof c?.email === "string" ? c.email : "");
  const cTags = (c) => (Array.isArray(c?.tags) ? c.tags.filter(t => typeof t === "string" && t.trim()) : []);
  const cSpend = (c) => { const n = Number(c?.spend); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const cVisits = (c) => { const n = Number(c?.visits); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const cLoyalty = (c) => { const n = Number(c?.loyaltyPoints); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const cNotes = (c) => (typeof c?.notes === "string" ? c.notes : "");
  const cCommLog = (c) => (Array.isArray(c?.commLog) ? c.commLog : []);
  const cBirthday = (c) => normalizeBirthday(c?.birthday);
  const isValidDate = (d) => { if (!d) return true; const t = new Date(d); return !isNaN(t.getTime()); };
  const cStatus = (c) => (c?.status === "inactive" || c?.status === "blocked") ? c.status : "active"; // task 1: default active, safe for old customers
  const isBlocked = (c) => cStatus(c) === "blocked";

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalData, setModalData] = useState({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0, customerType: "", status: "active", preferredChannel: "None", marketingConsent: false, smsConsent: false, emailConsent: false, whatsappConsent: false });
  const [noteVal, setNoteVal] = useState("");
  const [sortBy, setSortBy] = useState("spend");
  const [profileTab, setProfileTab] = useState("overview");
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
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
  const lastVisitRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 700);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Get real customer order history from orders data
  const getCustomerOrders = (customerId) => {
    if (!orders) return [];
    return orders.filter(o => o && o.customerId === customerId);
  };

  // Calculate customer metrics from real orders
  const calculateCustomerMetrics = (customerId) => {
    const customerOrders = getCustomerOrders(customerId);
    const completedOrders = customerOrders.filter(o => o.status === "COMPLETED");
    const totalSpend = completedOrders.reduce((sum, o) => sum + (Number(getOrderAmount(o)) || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalSpend / completedOrders.length : 0;
    
    // Get favorite item
    const itemCounts = {};
    completedOrders.forEach(o => {
      o?.items?.forEach(item => {
        if (!item || typeof item.name !== "string") return;
        const qty = Number(item.qty);
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (Number.isFinite(qty) ? qty : 1);
      });
    });
    
    const favoriteItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Calculate preferred time
    const hourCounts = {};
    completedOrders.forEach(o => {
      const hour = new Date(o?.createdAt || Date.now()).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const preferredHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    // Calculate average prep time from KDS cards
    const customerKdsCards = kdsCards?.filter(k => {
      if (!k) return false;
      const order = orders?.find(o => o && o.id === k.orderId);
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

  // Safe helper: days since last visit. Returns null when unknown (e.g. "Never").
  const daysSinceVisit = (c) => {
    if (c?.lastVisit === "Today") return 0;
    if (c?.lastVisit === "Yesterday") return 1;
    const d = parseInt(c?.lastVisit);
    return Number.isFinite(d) ? d : null;
  };

  // Safe helper: days until next birthday. Returns null when missing/invalid.
  const daysToBirthday = (c) => {
    const bd = cBirthday(c);
    if (!bd) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const bday = new Date(today.getFullYear(), parseInt(bd.slice(5,7)) - 1, parseInt(bd.slice(8,10)));
    if (isNaN(bday.getTime())) return null;
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    return Math.round((bday - today) / 86400000);
  };

  const HIGH_VALUE_THRESHOLD = 5000;
  const AT_RISK_MIN_SPEND = 2000;
  const AT_RISK_MIN_DAYS = 10;
  const GONE_COLD_DAYS = 30;
  const NEW_CUSTOMER_DAYS = 14;
  const BIRTHDAY_SOON_DAYS = 30;

  // Safe helper: recently created (by createdAt) or low visit count as a fallback.
  const isNewCustomer = (c) => {
    if (typeof c?.createdAt === "string") {
      const created = new Date(c.createdAt);
      if (!isNaN(created.getTime())) return Math.round((Date.now() - created) / 86400000) <= NEW_CUSTOMER_DAYS;
    }
    return cVisits(c) <= 2;
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
  if (typeFilter === "OTHER") filtered = filtered.filter(c => c.customerType && !TYPE_MAP[c.customerType]);
  else if (typeFilter !== "ALL") filtered = filtered.filter(c => c.customerType === typeFilter);
  if (segmentFilter === "AT_RISK") filtered = filtered.filter(c => isAtRisk(c));
  if (segmentFilter === "BIRTHDAY") filtered = filtered.filter(c => cBirthday(c) && new Date().toISOString().slice(5,10) === cBirthday(c).slice(5,10));
  if (segmentFilter === "VIP") filtered = filtered.filter(c => c.tier === "PLATINUM" || c.tier === "GOLD");
  if (search.trim()) {
    const q = search.trim().toLowerCase(); // lower-cased once, reused for every matcher below
    const qDigits = normalizePhone(search);
    filtered = filtered.filter(c => {
      if (!c) return false;
      const matchesName = cName(c).toLowerCase().includes(q);
      const matchesPhone = qDigits.length > 0 && normalizePhone(cPhone(c)).includes(qDigits);
      const matchesEmail = cEmail(c).toLowerCase().includes(q);
      const matchesTags = cTags(c).some(t => t.toLowerCase().includes(q));
      const matchesNotes = cNotes(c).toLowerCase().includes(q);
      const typeInfo = c.customerType ? TYPE_MAP[c.customerType] : null;
      const matchesType = !!typeInfo && typeInfo.label.toLowerCase().includes(q);
      const matchesStatus = cStatus(c).includes(q);
      const bd = cBirthday(c);
      const matchesBirthdayMonth = !!bd && (() => {
        const idx = parseInt(bd.slice(5, 7), 10) - 1;
        return idx >= 0 && idx < 12 && MONTH_NAMES[idx].includes(q);
      })();
      return matchesName || matchesPhone || matchesEmail || matchesTags || matchesNotes || matchesType || matchesStatus || matchesBirthdayMonth;
    });
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "spend") return cSpend(b) - cSpend(a);
    if (sortBy === "visits") return cVisits(b) - cVisits(a);
    if (sortBy === "name") return cName(a).localeCompare(cName(b));
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

  const maxSpend = Math.max(...customers.map(c => cSpend(c)), 1);

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
    if (selected && !customers.some(c => c.id === selected)) {
      setSelected(null);
      setShowLoyaltyModal(false);
      setShowModal(false);
      setEditField(null);
    }
  }, [customers, selected]);

  useEffect(() => {
    setBulkSelected(prev => {
      if (prev.size === 0) return prev;
      const validIds = new Set(customers.map(c => c.id));
      const next = new Set([...prev].filter(id => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [customers]);

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
    setModalData({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0, customerType: "", status: "active", preferredChannel: "None", marketingConsent: false, smsConsent: false, emailConsent: false, whatsappConsent: false });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditMode(true);
    setModalData({ name: c.name, phone: c.phone, email: c.email || "", tier: c.tier, fav: c.fav, birthday: c.birthday || "", allergy: c.allergy || "", visits: c.visits, spend: c.spend, tags: (Array.isArray(c.tags) ? c.tags : []).join(", "), notes: c.notes || "", loyaltyPoints: c.loyaltyPoints || 0, customerType: c.customerType || "", status: cStatus(c), preferredChannel: PREFERRED_CHANNELS.includes(c.preferredChannel) ? c.preferredChannel : "None", marketingConsent: !!c.marketingConsent, smsConsent: !!c.smsConsent, emailConsent: !!c.emailConsent, whatsappConsent: !!c.whatsappConsent });
    setShowModal(true);
  };

  const saveModal = () => {
    const name = (modalData.name || "").trim();
    const phone = (modalData.phone || "").trim();
    const email = (modalData.email || "").trim().toLowerCase();
    if (!name) return alert("Name is required");
    let phoneDigits = "";
    if (phone) {
      phoneDigits = normalizePhone(phone);
      if (phoneDigits.length !== 10) return alert("Phone number must be 10 digits");
    }
    if (email && !isValidEmail(email)) return alert("Please enter a valid email address");
    if (modalData.birthday && !isValidDate(modalData.birthday)) return alert("Please enter a valid birthday");
    if (phoneDigits) {
      const dupPhone = customers.find(c => c.id !== selected && normalizePhone(cPhone(c)) === phoneDigits);
      if (dupPhone) return alert(`This phone number is already used by ${cName(dupPhone)}`);
    }
    if (email) {
      const dupEmail = customers.find(c => c.id !== selected && cEmail(c).toLowerCase() === email);
      if (dupEmail) return alert(`This email is already used by ${cName(dupEmail)}`);
    }
    const tagArr = (modalData.tags || "").split(",").map(t => t.trim()).filter(Boolean)
      .filter((t, i, arr) => arr.findIndex(o => o.toLowerCase() === t.toLowerCase()) === i);
    const notes = (modalData.notes || "").trim().slice(0, 1000);
    const allergy = (modalData.allergy || "").trim().slice(0, 300);
    const visits = Number.isFinite(Number(modalData.visits)) && Number(modalData.visits) >= 0 ? Number(modalData.visits) : 0;
    const spend = Number.isFinite(Number(modalData.spend)) && Number(modalData.spend) >= 0 ? Number(modalData.spend) : 0;
    const loyaltyPoints = Number.isFinite(Number(modalData.loyaltyPoints)) && Number(modalData.loyaltyPoints) >= 0 ? Number(modalData.loyaltyPoints) : 0;
    const tier = calculateTier ? calculateTier(spend) : modalData.tier;
    const status = CUSTOMER_STATUSES.includes(modalData.status) ? modalData.status : "active";
    const preferredChannel = PREFERRED_CHANNELS.includes(modalData.preferredChannel) ? modalData.preferredChannel : "None";
    const marketingConsent = !!modalData.marketingConsent;
    const smsConsent = !!modalData.smsConsent;
    const emailConsent = !!modalData.emailConsent;
    const whatsappConsent = !!modalData.whatsappConsent;
    const ts = new Date().toISOString();
    if (editMode) {
      setCustomers(customers.map(c => c.id === selected ? {
        ...c, ...modalData, name, phone, email, visits, spend, loyaltyPoints, tags: tagArr, notes, allergy, tier,
        status, preferredChannel, marketingConsent, smsConsent, emailConsent, whatsappConsent,
        updatedAt: ts,
      } : c));
      showToast("Customer updated ✓");
    } else {
      const newC = {
        id: "c" + Date.now(), ...modalData, name, phone, email, visits, spend, loyaltyPoints,
        tags: tagArr.length ? tagArr : ["New Customer"], notes, allergy, tier, lastVisit: "Never",
        status, preferredChannel, marketingConsent, smsConsent, emailConsent, whatsappConsent,
        createdAt: ts, updatedAt: ts,
      };
      setCustomers([...customers, newC]);
      setSelected(newC.id);
      showToast(`${name} added ✓`);
    }
    setShowModal(false);
  };

  const updateNote = () => {
    const notes = (noteVal || "").trim().slice(0, 1000);
    setCustomers(customers.map(c => c.id === selected ? { ...c, notes, notesUpdatedAt: new Date().toISOString() } : c));
    showToast("Notes saved ✓");
  };
  const savePinnedNote = () => {
    const pinned = (pinnedNote || "").trim().slice(0, 300);
    setCustomers(customers.map(c => c.id === selected ? { ...c, pinnedNote: pinned, pinnedNoteUpdatedAt: new Date().toISOString() } : c));
    showToast("Pinned note saved 📌");
  };

  // --- Duplicate detection & merge (task 1) ---
  const findDuplicateOf = (c) => {
    if (!c) return null;
    const phone = normalizePhone(cPhone(c));
    const email = cEmail(c).toLowerCase();
    return customers.find(o => o.id !== c.id && (
      (phone && normalizePhone(cPhone(o)) === phone) ||
      (email && cEmail(o).toLowerCase() === email)
    )) || null;
  };

  const mergeCustomers = (primaryId, duplicateId) => {
    if (!primaryId || !duplicateId || primaryId === duplicateId) return;
    const primary = customers.find(c => c.id === primaryId);
    const dup = customers.find(c => c.id === duplicateId);
    if (!primary || !dup) return;
    if (!window.confirm(`Merge "${cName(dup)}" into "${cName(primary)}"?\n\nTags, notes, loyalty points, visits, spend and history will be combined. "${cName(dup)}" will be removed. This cannot be undone.`)) return;

    const mergedTags = [...cTags(primary), ...cTags(dup)].filter((t, i, arr) => arr.findIndex(o => o.toLowerCase() === t.toLowerCase()) === i);
    const mergedNotes = [cNotes(primary), cNotes(dup)].filter(Boolean).join(" | ").slice(0, 1000);
    const mergedCommLog = [...cCommLog(primary), ...cCommLog(dup)].sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
    const mergedLoyaltyTxns = [...cLoyaltyTxns(primary), ...cLoyaltyTxns(dup)].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)).slice(0, 50);
    const mergedSpend = cSpend(primary) + cSpend(dup);

    const merged = {
      ...primary,
      email: cEmail(primary) || cEmail(dup),
      phone: cPhone(primary) || cPhone(dup),
      birthday: cBirthday(primary) || cBirthday(dup),
      allergy: primary.allergy || dup.allergy || "",
      customerType: primary.customerType || dup.customerType || "",
      pinnedNote: primary.pinnedNote || dup.pinnedNote || "",
      tags: mergedTags,
      notes: mergedNotes,
      visits: cVisits(primary) + cVisits(dup),
      spend: mergedSpend,
      loyaltyPoints: cLoyalty(primary) + cLoyalty(dup),
      loyaltyTxns: mergedLoyaltyTxns,
      commLog: mergedCommLog,
      tier: calculateTier ? calculateTier(mergedSpend) : primary.tier,
      updatedAt: new Date().toISOString(),
    };

    // Merge locally-logged visits under the primary id, without mutating the previous state in place.
    setLocalVisits(prev => {
      const next = { ...prev };
      const combined = [...(prev[duplicateId] || []), ...(prev[primaryId] || [])];
      if (combined.length) next[primaryId] = combined; else delete next[primaryId];
      delete next[duplicateId];
      return next;
    });

    setCustomers(customers.map(c => c.id === primaryId ? merged : c).filter(c => c.id !== duplicateId));
    setBulkSelected(prev => { if (!prev.has(duplicateId)) return prev; const next = new Set(prev); next.delete(duplicateId); return next; });
    if (selected === duplicateId) setSelected(primaryId);
    showToast(`Merged "${cName(dup)}" into "${cName(primary)}" ✓`);
  };

  const deleteCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) { showToast("Customer not found — it may already be deleted", C.warning); setSelected(null); return; }
    const hasOrderHistory = getCustomerOrders(id).length > 0;
    const warn = hasOrderHistory
      ? `\n\nNote: past orders will still reference "${cName(c)}" in order history — deleting the customer profile does not remove those orders.`
      : "";
    if (!window.confirm(`Delete "${cName(c)}"? This cannot be undone.${warn}`)) return;
    setCustomers(customers.filter(x => x.id !== id));
    setLocalVisits(prev => { if (!(id in prev)) return prev; const next = { ...prev }; delete next[id]; return next; });
    setBulkSelected(prev => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });
    if (selected === id) { setSelected(null); setShowLoyaltyModal(false); setShowModal(false); setEditField(null); }
    showToast(`${cName(c)} deleted`, C.red);
  };

  // --- Customer status (task 1) ---
  const toggleBlocked = (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const next = isBlocked(c) ? "active" : "blocked";
    if (next === "blocked" && !window.confirm(`Mark "${cName(c)}" as blocked? They will be excluded from bulk communication.`)) return;
    setCustomers(customers.map(x => x.id === id ? { ...x, status: next, updatedAt: new Date().toISOString() } : x));
    if (next === "blocked") setBulkSelected(prev => { if (!prev.has(id)) return prev; const nextSet = new Set(prev); nextSet.delete(id); return nextSet; });
    showToast(next === "blocked" ? `${cName(c)} marked as blocked` : `${cName(c)} unblocked ✓`, next === "blocked" ? C.warning : C.green);
  };

  // --- Consent & preferred channel controls (task 2) ---
  const toggleConsent = (id, field, val) => {
    if (!CONSENT_FIELDS.some(f => f.key === field)) return;
    setCustomers(customers.map(c => c.id === id ? { ...c, [field]: !!val, updatedAt: new Date().toISOString() } : c));
  };
  const setPreferredChannelFor = (id, channel) => {
    const valid = PREFERRED_CHANNELS.includes(channel) ? channel : "None";
    setCustomers(customers.map(c => c.id === id ? { ...c, preferredChannel: valid, updatedAt: new Date().toISOString() } : c));
  };

  // --- Privacy actions (task 4) ---
  const exportSingleCustomerJSON = (c) => {
    if (!c) return;
    const data = {
      id: c.id, name: cName(c), phone: cPhone(c), email: cEmail(c), tier: c.tier || "",
      status: cStatus(c), customerType: c.customerType || "", tags: cTags(c), notes: cNotes(c),
      pinnedNote: c.pinnedNote || "", birthday: c.birthday || "", allergy: c.allergy || "",
      visits: cVisits(c), spend: cSpend(c), lastVisit: c.lastVisit || "",
      loyaltyPoints: cLoyalty(c), loyaltyTxns: cLoyaltyTxns(c), commLog: cCommLog(c),
      localVisits: Array.isArray(localVisits?.[c.id]) ? localVisits[c.id] : [],
      marketingConsent: !!c.marketingConsent, smsConsent: !!c.smsConsent, emailConsent: !!c.emailConsent,
      whatsappConsent: !!c.whatsappConsent, preferredChannel: PREFERRED_CHANNELS.includes(c.preferredChannel) ? c.preferredChannel : "None",
      anonymizedAt: c.anonymizedAt || null, createdAt: c.createdAt || null, updatedAt: c.updatedAt || null,
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${cName(c).replace(/[^a-z0-9]+/gi, "_") || "customer"}.json`; a.click();
      showToast("Customer JSON exported ✓");
    } catch { showToast("Could not export customer", C.warning); }
  };

  const copyCustomerSummary = (c) => {
    if (!c) return;
    const summary = `${cName(c)} · ${cStatus(c)}\nPhone: ${cPhone(c) || "—"}\nEmail: ${cEmail(c) || "—"}\nTier: ${c.tier || "—"} · ${cVisits(c)} visits · ₹${cSpend(c)} spend\nLoyalty: ${cLoyalty(c)} pts\nLast visit: ${c.lastVisit || "Never"}\nTags: ${cTags(c).join(", ") || "—"}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => showToast("Summary copied ✓")).catch(() => showToast("Could not copy to clipboard", C.warning));
    } else {
      showToast("Clipboard not available on this device", C.warning);
    }
  };

  const anonymizeCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    if (!window.confirm(`Anonymize "${cName(c)}"? This clears their name, phone, email, birthday, allergy and notes but keeps spend/visit history and order links for analytics. This cannot be undone.`)) return;
    setCustomers(customers.map(x => x.id === id ? {
      ...x,
      name: "Anonymous Customer",
      phone: "", email: "", birthday: "", allergy: "", notes: "", pinnedNote: "",
      marketingConsent: false, smsConsent: false, emailConsent: false, whatsappConsent: false,
      preferredChannel: "None",
      status: "inactive",
      anonymizedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : x));
    showToast("Customer anonymized ✓", C.amber2);
  };

  const saveField = (field) => {
    const val = editVal.trim();
    if ((field === "name" || field === "phone") && !val) { setEditField(null); return; }
    if (field === "phone" && val) {
      const phoneDigits = normalizePhone(val);
      if (phoneDigits.length !== 10) { alert("Phone number must be 10 digits"); setEditField(null); return; }
      const duplicate = customers.find(c => normalizePhone(cPhone(c)) === phoneDigits && c.id !== selected);
      if (duplicate) { alert(`This phone number is already used by ${cName(duplicate)}`); setEditField(null); return; }
    }
    if (field === "email" && val) {
      if (!isValidEmail(val)) { alert("Please enter a valid email address"); setEditField(null); return; }
      const duplicate = customers.find(c => cEmail(c).toLowerCase() === val.toLowerCase() && c.id !== selected);
      if (duplicate) { alert(`This email is already used by ${cName(duplicate)}`); setEditField(null); return; }
    }
    if (field === "birthday" && val && !isValidDate(val)) { alert("Please enter a valid birthday"); setEditField(null); return; }
    const finalVal = field === "allergy" ? val.slice(0, 300) : field === "email" ? val.toLowerCase() : val;
    setCustomers(customers.map(c => c.id === selected ? { ...c, [field]: finalVal, updatedAt: new Date().toISOString() } : c));
    setEditField(null);
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const customer = customers.find(c => c.id === selected);
    if (!customer) return;
    if (cTags(customer).some(t => t.toLowerCase() === tag.toLowerCase())) { showToast("Tag already exists", C.amber); return; }
    setCustomers(customers.map(c => c.id === selected ? { ...c, tags: [...cTags(c), tag] } : c));
    setNewTag("");
    showToast(`Tag "${tag}" added ✓`);
  };

  const removeTag = (tag) => setCustomers(customers.map(c => c.id === selected ? { ...c, tags: cTags(c).filter(t => t !== tag) } : c));

  // --- Loyalty transaction history (task 3): newest first, capped at 50 ---
  const makeLoyaltyTxn = (type, points, amount, reason) => ({
    id: "lt" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type, // "earn" | "redeem" | "adjust"
    points,
    amount: Number.isFinite(Number(amount)) ? Number(amount) : null,
    reason: (reason || "").toString().trim(),
    createdAt: new Date().toISOString(),
  });
  const cLoyaltyTxns = (c) => (Array.isArray(c?.loyaltyTxns) ? c.loyaltyTxns : []);
  const appendLoyaltyTxn = (c, txn) => [txn, ...cLoyaltyTxns(c)].slice(0, 50);

  const addVisitEntry = (cid, items, amt) => {
    const amount = Number(amt);
    const itemsText = (items || "").toString().trim();
    if (!cid || !itemsText || !Number.isFinite(amount) || amount <= 0) { showToast("Enter a valid amount and items", C.warning); return; }
    const key = `${cid}|${itemsText}|${amount}`;
    const now = Date.now();
    if (lastVisitRef.current && lastVisitRef.current.key === key && now - lastVisitRef.current.at < 1500) return; // guard against double-click duplicate
    lastVisitRef.current = { key, at: now };
    const today = new Date(); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${months[today.getMonth()]} ${today.getDate()}`;
    const entry = { date: dateStr, items: itemsText, amt: amount };
    setLocalVisits(prev => ({ ...prev, [cid]: [entry, ...(prev[cid] || [])] }));
    const pointsEarned = Math.floor(amount * POINTS_PER_RUPEE);
    setCustomers(customers.map(c => {
      if (c.id !== cid) return c;
      const newSpend = cSpend(c) + amount;
      return {
        ...c,
        visits: cVisits(c) + 1,
        spend: newSpend,
        tier: calculateTier ? calculateTier(newSpend) : c.tier,
        lastVisit: "Today",
        loyaltyPoints: cLoyalty(c) + pointsEarned,
        loyaltyTxns: appendLoyaltyTxn(c, makeLoyaltyTxn("earn", pointsEarned, amount, `Visit: ${itemsText}`)),
        updatedAt: new Date().toISOString(),
      };
    }));
    showToast(`Visit logged · +${pointsEarned} pts`);
  };

  const redeemPoints = (cid, amount) => {
    const customer = customers.find(c => c.id === cid);
    if (!customer) return;
    amount = Math.floor(Number(amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount < MIN_REDEEM_AMOUNT) {
      alert(`Minimum redemption amount is ₹${MIN_REDEEM_AMOUNT}.`);
      return;
    }
    const pointsNeeded = amount * POINTS_PER_RUPEE;
    const availablePoints = cLoyalty(customer);
    if (availablePoints < pointsNeeded) {
      alert(`Insufficient points. You need ${pointsNeeded} points but have ${availablePoints}.`);
      return;
    }
    const historyEntry = { type: "Loyalty", message: `Redeemed ₹${amount} (${pointsNeeded} pts) as discount`, date: new Date().toISOString(), staff: "Staff" };
    setCustomers(customers.map(c => c.id === cid ? {
      ...c,
      loyaltyPoints: availablePoints - pointsNeeded,
      loyaltyTxns: appendLoyaltyTxn(c, makeLoyaltyTxn("redeem", -pointsNeeded, amount, "Redeemed as discount")),
      commLog: [historyEntry, ...cCommLog(c)],
      updatedAt: new Date().toISOString(),
    } : c));
    setShowLoyaltyModal(false);
    setRedeemAmount("");
    showToast(`Redeemed ₹${amount} — apply as discount on next order.`, C.amber2);
  };

  // Manual loyalty adjustment (task 4): staff can add/subtract points with a required reason.
  const adjustLoyaltyPoints = (cid, delta, reason) => {
    const customer = customers.find(c => c.id === cid);
    if (!customer) return;
    const deltaNum = Math.round(Number(delta));
    const reasonTrim = (reason || "").trim();
    if (!Number.isFinite(deltaNum) || deltaNum === 0) { alert("Enter a non-zero point amount."); return; }
    if (!reasonTrim) { alert("A reason is required for a manual adjustment."); return; }
    const current = cLoyalty(customer);
    const next = current + deltaNum;
    if (next < 0) { alert(`Cannot reduce points below 0 (current balance: ${current}).`); return; }
    setCustomers(customers.map(c => c.id === cid ? {
      ...c,
      loyaltyPoints: next,
      loyaltyTxns: appendLoyaltyTxn(c, makeLoyaltyTxn("adjust", deltaNum, null, reasonTrim)),
      updatedAt: new Date().toISOString(),
    } : c));
    showToast(`${deltaNum > 0 ? "Added" : "Deducted"} ${Math.abs(deltaNum)} pts ✓`, C.amber2);
  };

  const calculatePoints = (spend) => Math.floor(spend * POINTS_PER_RUPEE);
  const calculateRedeemable = (points) => Math.floor(points / POINTS_PER_RUPEE);

  const exportCSV = () => {
    const headers = [
      "Name","Phone","Email","Tier","Status","Visits","Spend","Last Visit","Birthday","Allergy","Tags","Notes",
      "Pinned Note","Loyalty Points","Loyalty Transactions","Last Loyalty Transaction","Customer Type",
      "Marketing Consent","SMS Consent","Email Consent","WhatsApp Consent","Preferred Channel","Anonymized At",
      "Communications Logged","Last Communication","Local Visits Logged","Local Visits Total ₹"
    ];
    const rows = customers.map(c => {
      const txns = cLoyaltyTxns(c);
      const lastTxn = txns[0];
      const comms = cCommLog(c);
      const lastComm = comms[0];
      const local = Array.isArray(localVisits?.[c?.id]) ? localVisits[c.id] : [];
      const localTotal = local.reduce((s, v) => s + (Number(v?.amt) || 0), 0);
      return [
        cName(c), cPhone(c), cEmail(c), c?.tier || "", cStatus(c), cVisits(c), cSpend(c), c?.lastVisit || "",
        c?.birthday || "", (c?.allergy || "").toString(), cTags(c).join(";"), cNotes(c).replace(/\n/g," "),
        (c?.pinnedNote || "").toString().replace(/\n/g," "), cLoyalty(c), txns.length,
        lastTxn ? `${lastTxn.type} ${lastTxn.points} (${lastTxn.reason || ""})` : "",
        c?.customerType || "",
        c?.marketingConsent ? "Yes" : "No", c?.smsConsent ? "Yes" : "No", c?.emailConsent ? "Yes" : "No", c?.whatsappConsent ? "Yes" : "No",
        PREFERRED_CHANNELS.includes(c?.preferredChannel) ? c.preferredChannel : "None", c?.anonymizedAt || "",
        comms.length, lastComm ? `${lastComm.type} ${lastComm.date || ""}` : "",
        local.length, localTotal
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "customers.csv"; a.click();
  };

  const commIcon = (t) => t === "Email" ? "📧" : t === "SMS" ? "📱" : t === "WhatsApp" ? "💬" : t === "Call" ? "📞" : t === "Internal Note" ? "🗒️" : "💬";
  const commColor = (t) => t === "Email" ? C.blue : t === "WhatsApp" ? "#25D366" : t === "Call" ? C.green : t === "Internal Note" ? C.text3 : C.amber;

  const logComm = (cid, type, message) => {
    const msg = (message || "").trim().slice(0, 1000);
    const commType_ = (type || "").trim();
    if (!msg) { showToast("A message is required", C.warning); return; }
    if (!commType_) { showToast("Select a channel first", C.warning); return; }
    const customer = customers.find(c => c.id === cid);
    if (!customer) return;
    const isInternal = commType_ === "Internal Note";
    if (!isInternal && isBlocked(customer)) { showToast(`${cName(customer)} is blocked — cannot log outbound communication`, C.warning); return; }
    if (!isInternal && channelRequiresConsent(commType_) && !hasConsentFor(customer, commType_)) {
      showToast(`${cName(customer)} has not given ${commType_} consent`, C.warning); return;
    }
    const entry = { type: commType_, message: msg, date: new Date().toISOString(), staff: "Staff", internal: isInternal };
    setCustomers(customers.map(c => c.id === cid ? { ...c, commLog: [entry, ...cCommLog(c)] } : c));
    setCommMsg("");
    showToast(`${commType_} logged ✓`);
  };

  const todayBirthdays = customers.filter(c => cBirthday(c) && new Date().toISOString().slice(5,10) === cBirthday(c).slice(5,10)).length;
  const atRiskCount = customers.filter(c => isAtRisk(c)).length;

  // Upcoming birthdays next 7 days (excluding today)
  const upcomingBirthdays = customers.filter(c => {
    if (!cBirthday(c)) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const bday = new Date(today.getFullYear(), parseInt(cBirthday(c).slice(5,7)) - 1, parseInt(cBirthday(c).slice(8,10)));
    if (isNaN(bday.getTime())) return false;
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    const diff = Math.round((bday - today) / 86400000);
    return diff > 0 && diff <= 7;
  }).sort((a, b) => {
    const daysLeft = (c) => {
      const today = new Date(); today.setHours(0,0,0,0);
      const bday = new Date(today.getFullYear(), parseInt(cBirthday(c).slice(5,7)) - 1, parseInt(cBirthday(c).slice(8,10)));
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      return Math.round((bday - today) / 86400000);
    };
    return daysLeft(a) - daysLeft(b);
  });

  // Smart list filtering
  const applySmartList = (base) => {
    if (!smartList) return base;
    if (smartList === "gone_cold") return base.filter(c => { const d = daysSinceVisit(c); return d != null && d >= GONE_COLD_DAYS; });
    if (smartList === "loyalty_ready") return base.filter(c => calculateRedeemable(cLoyalty(c)) >= MIN_REDEEM_AMOUNT);
    if (smartList === "high_value") return base.filter(c => cSpend(c) >= HIGH_VALUE_THRESHOLD);
    if (smartList === "new_customers") return base.filter(c => isNewCustomer(c));
    if (smartList === "birthday_soon") return base.filter(c => { const d = daysToBirthday(c); return d != null && d >= 0 && d <= BIRTHDAY_SOON_DAYS; });
    if (smartList === "high_value_at_risk") return base.filter(c => { const d = daysSinceVisit(c); return cSpend(c) >= AT_RISK_MIN_SPEND && d != null && d >= AT_RISK_MIN_DAYS; });
    return base;
  };

  // Owner dashboard stats from orders
  const todayOrders = (orders || []).filter(o => { const d = new Date(o.createdAt || 0); const t = new Date(); return d.toDateString() === t.toDateString(); });
  const todayRevenue = todayOrders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + (o.total || 0), 0);
  const todayNewCustomers = customers.filter(c => c.lastVisit === "Today" && c.visits === 1).length;
  const loyaltyReadyCount = customers.filter(c => calculateRedeemable(cLoyalty(c)) >= MIN_REDEEM_AMOUNT).length;
  const totalRevenue = customers.reduce((s, c) => s + cSpend(c), 0);
  const avgVisitsPerCustomer = customers.length > 0 ? (customers.reduce((s, c) => s + cVisits(c), 0) / customers.length).toFixed(1) : 0;

  // Contact method required per communication type, used to safely skip customers missing it (task 8)
  const commNeedsEmail = (t) => t === "Email";
  const commNeedsPhone = (t) => t === "SMS" || t === "WhatsApp" || t === "Call";

  const sendBulkComm = () => {
    const msg = (bulkCommMsg || "").trim().slice(0, 1000);
    const commType_ = (bulkCommType || "").trim();
    if (!msg || !commType_ || bulkSelected.size === 0) return;
    const selectedCustomers = customers.filter(c => bulkSelected.has(c.id));
    if (selectedCustomers.length === 0) { showToast("No valid customers selected", C.warning); setBulkSelected(new Set()); setShowBulkModal(false); return; }
    const isInternal = commType_ === "Internal Note";
    let blockedSkipped = 0, contactSkipped = 0, consentSkipped = 0;
    const eligible = selectedCustomers.filter(c => {
      if (!isInternal && isBlocked(c)) { blockedSkipped++; return false; }
      if (commNeedsEmail(commType_) && !cEmail(c)) { contactSkipped++; return false; }
      if (commNeedsPhone(commType_) && !cPhone(c)) { contactSkipped++; return false; }
      if (!isInternal && channelRequiresConsent(commType_) && !hasConsentFor(c, commType_)) { consentSkipped++; return false; }
      return true;
    });
    const skippedCount = selectedCustomers.length - eligible.length;
    if (eligible.length === 0) { showToast(`No selected customers are eligible for ${commType_}`, C.warning); return; }
    const reasons = [];
    if (blockedSkipped > 0) reasons.push(`${blockedSkipped} blocked`);
    if (contactSkipped > 0) reasons.push(`${contactSkipped} missing contact info`);
    if (consentSkipped > 0) reasons.push(`${consentSkipped} no consent`);
    if (!window.confirm(`Log "${commType_}" message for ${eligible.length} customer${eligible.length !== 1 ? "s" : ""}${skippedCount > 0 ? ` (${skippedCount} will be skipped: ${reasons.join(", ")})` : ""}?`)) return;
    const eligibleIds = new Set(eligible.map(c => c.id));
    const entry = { type: commType_, message: msg, date: new Date().toISOString(), staff: "Staff", bulk: true, internal: isInternal };
    setCustomers(customers.map(c => eligibleIds.has(c.id) ? { ...c, commLog: [entry, ...cCommLog(c)] } : c));
    setBulkCommMsg("");
    setBulkSelected(new Set());
    setBulkMode(false);
    setShowBulkModal(false);
    showToast(`${commType_} logged for ${eligible.length} customer${eligible.length !== 1 ? "s" : ""}.${skippedCount > 0 ? ` ${skippedCount} skipped (${reasons.join(", ")}).` : ""}`);
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
            { label: "Regulars", val: customers.length, color: C.text2, accent: C.border2 },
            { label: "Drifting", val: atRiskCount, color: atRiskCount > 0 ? C.warning : C.text3, accent: atRiskCount > 0 ? C.warning : C.border },
            { label: "Birthdays", val: todayBirthdays, color: todayBirthdays > 0 ? C.purple : C.text3, accent: todayBirthdays > 0 ? C.purple : C.border },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg3, borderRadius: 7, padding: "7px 8px", textAlign: "center", border: `1px solid ${C.border}`, borderTop: `2px solid ${s.accent}` }}>
              <div style={{ fontSize: 19, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, letterSpacing: "-.03em", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 8, color: C.text3, textTransform: "uppercase", letterSpacing: ".09em", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28, paddingRight: search ? 28 : undefined }} placeholder="Name, phone, tag, note…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <option value="OTHER">❓ Other / Unlisted</option>
          </select>
        </div>

        {/* Segment Filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "ALL", label: "Everyone" },
            { key: "AT_RISK", label: "⚠ Drifting" },
            { key: "VIP", label: "⭐ VIP" },
            { key: "BIRTHDAY", label: "🎂 Today" },
          ].map(s => (
            <button key={s.key} onClick={() => setSegmentFilter(s.key)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${segmentFilter === s.key ? C.amber3 : C.border}`, background: segmentFilter === s.key ? C.amberBg : C.bg3, color: segmentFilter === s.key ? C.amber2 : C.text3, fontSize: 9, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", minHeight: 36, minWidth: 0, letterSpacing: ".04em", boxShadow: segmentFilter === s.key ? `inset 0 0 0 1px ${C.amber3}` : "none" }}>
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
              <button key={t} onClick={() => setTierFilter(t)} style={{ flex: 1, padding: "7px 4px", borderRadius: 6, border: `1px solid ${active ? tc.color : C.border}`, background: active ? tc.bg : C.bg3, color: active ? tc.color : C.text3, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: ".04em", minHeight: 36, boxShadow: active ? `0 0 8px ${tc.glow || "transparent"}` : "none" }}>
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
                {smartList === "gone_cold" ? "🧊 Regulars Gone Cold" : smartList === "loyalty_ready" ? "⭐ Loyalty Ready" : smartList === "high_value" ? "💎 High Value" : smartList === "birthday_soon" ? "🎂 Birthday Soon" : smartList === "high_value_at_risk" ? "🚨 High Value At Risk" : "🌱 New Customers"}
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
              {bulkMode ? `${bulkSelected.size} selected` : "Select"}
            </button>
            {bulkMode && bulkSelected.size > 0 && (
              <button onClick={() => setShowBulkModal(true)} style={{ ...btn("primary"), fontSize: 10, padding: "5px 10px" }}>
                Message {bulkSelected.size}
              </button>
            )}
            {bulkMode && (
              <button onClick={() => setBulkSelected(new Set(displayList.map(c => c.id)))} style={{ ...btn("ghost"), fontSize: 10, padding: "5px 10px" }}>All</button>
            )}
            {bulkMode && bulkSelected.size > 0 && (
              <button onClick={() => setBulkSelected(new Set())} style={{ ...btn("ghost"), fontSize: 10, padding: "5px 10px" }}>None</button>
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
              }} style={{ background: active ? C.bg3 : C.bg2, border: `1px solid ${bulkSelected.has(c.id) ? C.amber3 : active ? C.amber3 : isBlocked(c) ? C.redBorder : atRisk ? C.warningBorder : C.border}`, borderLeft: `3px solid ${active ? C.amber : isBlocked(c) ? C.red : atRisk ? C.warning : "transparent"}`, borderRadius: 8, padding: "10px 11px", cursor: "pointer", transition: "background .1s, border-color .1s", opacity: isBlocked(c) ? 0.65 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {bulkMode && (
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${bulkSelected.has(c.id) ? C.amber2 : C.border2}`, background: bulkSelected.has(c.id) ? C.amber2 : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: C.onAmber2, fontWeight: 700 }}>
                      {bulkSelected.has(c.id) ? "✓" : ""}
                    </div>
                  )}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: tc.bg || C.bg4, border: `1.5px solid ${tc.color || C.border2}`, boxShadow: active ? `0 0 10px ${tc.glow || "transparent"}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: tc.color || C.text2, flexShrink: 0, letterSpacing: ".03em", fontFamily: "'JetBrains Mono', monospace" }}>{initials(cName(c))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-.01em" }}>{cName(c)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      {c.customerType && TYPE_MAP[c.customerType] ? (
                        <span style={{ fontSize: 9, color: TYPE_MAP[c.customerType].color }} title={TYPE_MAP[c.customerType].label}>{TYPE_MAP[c.customerType].icon} {TYPE_MAP[c.customerType].label}</span>
                      ) : c.customerType ? (
                        <span style={{ fontSize: 9, color: C.text3 }}>❓ {String(c.customerType).slice(0, 20)}</span>
                      ) : (
                        <span style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>{cPhone(c) || cEmail(c) || "No contact"}</span>
                      )}
                    </div>
                    {c.customerType && <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace", marginTop: 1 }}>{cPhone(c) || cEmail(c) || "—"}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ ...pill(tc.bg || C.bg4, tc.color || C.text2), fontSize: 9, letterSpacing: ".06em" }}>{c.tier}</span>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {isBlocked(c) && <span style={{ ...pill(C.redBg, C.red), fontSize: 8 }}>🚫</span>}
                      {!isBlocked(c) && cStatus(c) === "inactive" && <span style={{ ...pill(C.neutralBg, C.text3), fontSize: 8 }}>OFF</span>}
                      {c.allergy && <span title={`Allergy: ${c.allergy}`} style={{ fontSize: 10 }}>⚠️</span>}
                      {c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10) && <span title="Birthday today!" style={{ fontSize: 10 }}>🎂</span>}
                      {atRisk && <span style={{ ...pill(C.warningBg, C.warning), fontSize: 8 }}>RISK</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 7, fontSize: 11, color: C.text2, alignItems: "center" }}>
                  <span style={{ color: C.text3 }}>{cVisits(c)} {cVisits(c) === 1 ? "visit" : "visits"}</span>
                  <span style={{ fontFamily: "monospace", color: C.amber2, fontWeight: 600 }}>₹{cSpend(c).toLocaleString()}</span>
                  <span title={`Last visit: ${c.lastVisit || "Never"}`} style={{ marginLeft: "auto", color: risk.color, fontSize: 10, fontWeight: 600 }}>{risk.label}</span>
                </div>
                <div style={{ marginTop: 8, height: 3, background: C.bg4, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: tc.color || C.amber, width: `${Math.min(100, (cSpend(c) / maxSpend) * 100)}%`, transition: "width .5s ease", boxShadow: active ? `0 0 6px ${tc.glow || "transparent"}` : "none" }} />
                </div>
              </div>
            );
          })}
          {displayList.length === 0 && (
            <div style={{ textAlign: "center", padding: "36px 16px", color: C.text3, fontSize: 13 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>{search ? "🔍" : segmentFilter !== "ALL" ? "✅" : "☕"}</div>
              <div style={{ fontWeight: 700, color: C.text2, marginBottom: 6, fontSize: 14 }}>
                {search ? `No match for "${search}"` : segmentFilter === "AT_RISK" ? "Everyone's coming in" : segmentFilter === "BIRTHDAY" ? "No birthdays today" : segmentFilter === "VIP" ? "No VIPs yet" : "No customers yet"}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6, color: C.text3 }}>
                {search ? "Try their phone number, a tag, or a note keyword" : segmentFilter !== "ALL" ? "Clear the filter to see all customers" : "Start building your regulars list"}
              </div>
              {!search && segmentFilter === "ALL" && (
                <button style={{ ...btn("primary"), fontSize: 11, marginTop: 14 }} onClick={openAddModal}>＋ First customer</button>
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
            <button onClick={() => setSelected(null)} style={{ ...btn("ghost"), fontSize: 13, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>← All guests</button>
          </div>
        )}
        {!profile ? (
          <div style={{ overflowY: "auto" }}>
            {/* Owner Dashboard */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>☕ Today</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 10 }}>
                {[
                  { val: `₹${todayRevenue.toLocaleString()}`, lbl: "Revenue", color: C.amber2, accent: C.amber3 },
                  { val: todayOrders.filter(o=>o.status==="COMPLETED").length, lbl: "Orders", color: C.green, accent: C.green + "44" },
                  { val: todayNewCustomers, lbl: "New Faces", color: C.blue, accent: C.blue + "44" },
                ].map(s => (
                  <div key={s.lbl} style={{ background: C.bg3, borderRadius: 8, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.border}`, borderBottom: `2px solid ${s.accent}` }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, letterSpacing: "-.03em", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 8, color: C.text3, marginTop: 4, textTransform: "uppercase", letterSpacing: ".1em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 16 }}>
                {[
                  { val: `₹${totalRevenue.toLocaleString()}`, lbl: "All-time", color: C.text2 },
                  { val: avgVisitsPerCustomer, lbl: "Avg visits", color: C.text2 },
                  { val: loyaltyReadyCount, lbl: "Reward ready", color: loyaltyReadyCount > 0 ? C.amber2 : C.text3 },
                ].map(s => (
                  <div key={s.lbl} style={{ background: C.bg3, borderRadius: 7, padding: "9px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, letterSpacing: "-.01em" }}>{s.val}</div>
                    <div style={{ fontSize: 8, color: C.text3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".09em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Lists */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>🎯 Smart Lists</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { key: "gone_cold", icon: "🧊", label: "Regulars Gone Cold", desc: `No visit in ${GONE_COLD_DAYS}+ days`, count: customers.filter(c => { const d = daysSinceVisit(c); return d != null && d >= GONE_COLD_DAYS; }).length, color: C.warning },
                  { key: "loyalty_ready", icon: "⭐", label: "Loyalty Ready to Redeem", desc: "Enough points for a reward", count: loyaltyReadyCount, color: C.amber2 },
                  { key: "high_value", icon: "💎", label: "High Value Customers", desc: `Lifetime spend ₹${HIGH_VALUE_THRESHOLD.toLocaleString()}+`, count: customers.filter(c => cSpend(c) >= HIGH_VALUE_THRESHOLD).length, color: C.purple },
                  { key: "new_customers", icon: "🌱", label: "New Customers", desc: "Joined recently or 2 or fewer visits", count: customers.filter(c => isNewCustomer(c)).length, color: C.green },
                  { key: "birthday_soon", icon: "🎂", label: "Birthday Soon", desc: `Within ${BIRTHDAY_SOON_DAYS} days`, count: customers.filter(c => { const d = daysToBirthday(c); return d != null && d >= 0 && d <= BIRTHDAY_SOON_DAYS; }).length, color: C.purple },
                  { key: "high_value_at_risk", icon: "🚨", label: "High Value At Risk", desc: `Spend ₹${AT_RISK_MIN_SPEND.toLocaleString()}+, away ${AT_RISK_MIN_DAYS}+ days`, count: customers.filter(c => { const d = daysSinceVisit(c); return cSpend(c) >= AT_RISK_MIN_SPEND && d != null && d >= AT_RISK_MIN_DAYS; }).length, color: C.red },
                ].map(sl => (
                  <div key={sl.key} onClick={() => { setSmartList(smartList === sl.key ? null : sl.key); setSelected(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: smartList === sl.key ? C.bg4 : C.bg3, border: `1px solid ${smartList === sl.key ? C.amber3 : C.border}`, borderLeft: `3px solid ${smartList === sl.key ? C.amber : sl.count > 0 ? sl.color : C.border}`, borderRadius: 8, cursor: "pointer", transition: "background .12s, border-color .12s", opacity: sl.count === 0 ? 0.5 : 1 }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{sl.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: smartList === sl.key ? C.amber2 : C.text, letterSpacing: "-.01em" }}>{sl.label}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{sl.desc}</div>
                    </div>
                    <span style={{ ...pill(sl.count > 0 ? sl.color + "22" : C.bg4, sl.count > 0 ? sl.color : C.text3), fontSize: 11, fontWeight: 700, fontFamily: "monospace", minWidth: 24, textAlign: "center" }}>{sl.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>🎂 Coming Up</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {upcomingBirthdays.map(c => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const bday = new Date(today.getFullYear(), parseInt(c.birthday.slice(5,7)) - 1, parseInt(c.birthday.slice(8,10)));
                    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                    const diff = Math.round((bday - today) / 86400000);
                    return (
                      <div key={c.id} onClick={() => { setSelected(c.id); setProfileTab("overview"); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg3, borderRadius: 7, cursor: "pointer", border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.purple}` }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: TIER_COLORS[c.tier]?.bg || C.bg4, border: `1px solid ${TIER_COLORS[c.tier]?.color || C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: TIER_COLORS[c.tier]?.color || C.text2, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{initials(c.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: C.text3 }}>{diff === 1 ? "Tomorrow!" : `In ${diff} days`}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelected(c.id); setProfileTab("comms"); setCommMsg(`Hi ${cName(c).split(" ")[0]}, wishing you a very happy birthday! 🎂 Come celebrate with us.`); }} style={{ ...btn("ghost"), fontSize: 9, padding: "4px 8px" }}>Send 🎁</button>
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
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>⚡ Needs Attention</div>
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
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.color}`, boxShadow: `0 0 14px ${tc.glow}, 0 2px 6px rgba(0,0,0,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: tc.color, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".04em" }}>
                    {initials(cName(profile))}
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
                    <div style={{ fontSize: 18, fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${C.border2}` }} title="Click to edit" onClick={() => { setEditField("name"); setEditVal(profile.name || ""); }}>{cName(profile)}</div>
                  )}
                  <span style={{ ...pill(TIER_COLORS[profile.tier]?.bg, TIER_COLORS[profile.tier]?.color), fontSize: 10 }}>{profile.tier}</span>
                  {cStatus(profile) !== "active" && (
                    <span style={{ ...pill(isBlocked(profile) ? C.redBg : C.neutralBg, isBlocked(profile) ? C.red : C.text3), fontSize: 10 }}>
                      {isBlocked(profile) ? "🚫 BLOCKED" : "INACTIVE"}
                    </span>
                  )}
                  <span style={{ ...pill(C.neutralBg, churnRisk(profile).color), fontSize: 9, marginLeft: "auto" }}>{churnRisk(profile).label}</span>
                  <button onClick={() => openEditModal(profile)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px" }}>Edit</button>
                  <button onClick={() => toggleBlocked(profile.id)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px", color: isBlocked(profile) ? C.green : C.warning }} title={isBlocked(profile) ? "Unblock customer" : "Block from bulk messages"}>
                    {isBlocked(profile) ? "Unblock" : "Block"}
                  </button>
                  <button onClick={() => exportSingleCustomerJSON(profile)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px" }} title="Export as JSON">⬇</button>
                  <button onClick={() => copyCustomerSummary(profile)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px" }} title="Copy summary to clipboard">📋</button>
                  <button onClick={() => anonymizeCustomer(profile.id)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px", color: C.text3 }} title="Erase personal details, keep spend history">🕶</button>
                  <button onClick={() => deleteCustomer(profile.id)} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer" }} title="Delete this customer">🗑</button>
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
              const pct = next ? Math.min(100, Math.max(0, ((cSpend(profile) - prevThreshold) / (nextThreshold - prevThreshold)) * 100)) : 100;
              return (
                <div style={{ marginBottom: 16, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    <span>{profile.tier}</span>
                    {next ? <span>→ {next} · ₹{Math.max(0, nextThreshold - cSpend(profile)).toLocaleString()} to go</span> : <span style={{ color: tc.color }}>MAX TIER ✦</span>}
                  </div>
                  <div style={{ height: 5, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: tc.color || C.amber, width: `${pct}%`, transition: "width .5s", boxShadow: `0 0 8px ${tc.glow || "transparent"}` }} />
                  </div>
                </div>
              );
            })()}

            {/* Possible Duplicate Warning */}
            {(() => {
              const dup = findDuplicateOf(profile);
              if (!dup) return null;
              return (
                <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: C.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Possible Duplicate</div>
                    <div style={{ fontSize: 12, color: C.text, wordBreak: "break-word" }}>Matches "{cName(dup)}" ({cPhone(dup) || cEmail(dup) || "same contact info"})</div>
                  </div>
                  <button onClick={() => mergeCustomers(profile.id, dup.id)} style={{ ...btn("ghost"), fontSize: 10, padding: "5px 10px", color: C.red, borderColor: C.redBorder, whiteSpace: "nowrap" }}>⇄ Merge</button>
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
            {cBirthday(profile) && new Date().toISOString().slice(5,10) === cBirthday(profile).slice(5,10) && (
              <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎂</span>
                <div style={{ fontSize: 12, color: C.purple }}>It's {cName(profile).split(" ")[0]}'s birthday today! Consider a free treat 🎁</div>
              </div>
            )}
            {/* Birthday Soon banner (task 8) — only when not today, safe date math, no crash on invalid/missing birthday */}
            {(() => {
              if (!cBirthday(profile)) return null;
              if (new Date().toISOString().slice(5,10) === cBirthday(profile).slice(5,10)) return null;
              const d = daysToBirthday(profile);
              if (d == null || d <= 0 || d > BIRTHDAY_SOON_DAYS) return null;
              return (
                <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎂</span>
                  <div style={{ fontSize: 12, color: C.purple }}>Birthday coming up in {d} day{d !== 1 ? "s" : ""} — plan a treat or offer.</div>
                </div>
              );
            })()}

            {/* Customer quality warnings — compact, wraps on mobile (task 9, 12) */}
            {(() => {
              const warnings = [];
              if (!cPhone(profile) && !cEmail(profile)) warnings.push({ icon: "📵", text: "No phone or email on file" });
              if (isBlocked(profile)) warnings.push({ icon: "🚫", text: "Blocked — excluded from bulk comms" });
              if (!profile.marketingConsent && !profile.smsConsent && !profile.emailConsent && !profile.whatsappConsent) warnings.push({ icon: "🔕", text: "No contact consent on file" });
              const d = daysSinceVisit(profile);
              if (d != null && d >= GONE_COLD_DAYS) warnings.push({ icon: "🧊", text: "Gone cold — no visit in 30+ days" });
              if (cSpend(profile) >= HIGH_VALUE_THRESHOLD && d != null && d >= AT_RISK_MIN_DAYS) warnings.push({ icon: "🚨", text: "High value but inactive" });
              if (warnings.length === 0) return null;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {warnings.map((w, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: C.bg3, border: `1px solid ${C.border}`, color: C.text2, display: "inline-flex", alignItems: "center", gap: 4, wordBreak: "break-word" }}>
                      {w.icon} {w.text}
                    </span>
                  ))}
                </div>
              );
            })()}
            {profile.pinnedNote && (
              <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>📌</span>
                <div style={{ fontSize: 12, color: C.amber2, lineHeight: 1.5, flex: 1 }}>{profile.pinnedNote}</div>
              </div>
            )}

            {/* Profile Tabs */}
            <div style={{ display: "flex", gap: 3, marginBottom: 16, background: C.bg3, padding: 3, borderRadius: 9, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {[
                { key: "overview", icon: "📊", label: "Overview" },
                { key: "history", icon: "🧾", label: "Orders" },
                { key: "notes", icon: "📝", label: "Notes" },
                { key: "comms", icon: "💬", label: "Comms" },
              ].map(t => (
                <button key={t.key} onClick={() => setProfileTab(t.key)} style={{ flex: "1 1 auto", padding: isMobile ? "9px 6px" : "7px 6px", borderRadius: 7, border: "none", background: profileTab === t.key ? C.bg4 : "transparent", color: profileTab === t.key ? C.amber2 : C.text3, fontSize: isMobile ? 11 : 10, cursor: "pointer", fontWeight: profileTab === t.key ? 700 : 400, transition: "all .15s", whiteSpace: "nowrap", boxShadow: profileTab === t.key ? `inset 0 0 0 1px ${C.border2}` : "none" }}>
                  <span style={{ fontSize: 14 }}>{t.icon}</span>
                  <div style={{ fontSize: 9, marginTop: 2, letterSpacing: ".04em", textTransform: "uppercase" }}>{t.label}</div>
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
                  if (cBirthday(profile) && new Date().toISOString().slice(5,10) === cBirthday(profile).slice(5,10)) items.push({ color: C.purple, bg: C.purpleBg, icon: "🎂", text: "Birthday today! Consider a complimentary treat.", tab: "comms" });
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
                  {[
                    { val: customerMetrics?.ordersCompleted || profile.visits || 0, lbl: "Orders", color: C.text },
                    { val: "₹" + (Number(customerMetrics?.totalSpend) || Number(profile.spend) || 0).toLocaleString(), lbl: "Lifetime", color: C.amber2 },
                    { val: "₹" + Math.round((Number(customerMetrics?.totalSpend) || Number(profile.spend) || 0) / Math.max(1, Number(customerMetrics?.ordersCompleted) || Number(profile.visits) || 1)), lbl: "Per visit", color: C.green },
                    { val: customerMetrics?.lastOrderDate ? new Date(customerMetrics.lastOrderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : (profile.lastVisit || "Never"), lbl: "Last seen", color: C.blue },
                  ].map(s => (
                    <div key={s.lbl} style={{ background: C.bg3, borderRadius: 8, padding: "10px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-.01em", lineHeight: 1.1 }}>{s.val}</div>
                      <div style={{ fontSize: 8, color: C.text3, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.lbl}</div>
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
                        style={{ ...btn(canRedeem ? "primary" : "ghost"), fontSize: 11, opacity: canRedeem ? 1 : 0.45, cursor: canRedeem ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}
                        disabled={!canRedeem}
                        onClick={() => { setRedeemAmount(""); setAdjustPoints(""); setAdjustReason(""); setShowLoyaltyModal(true); }}
                      >{canRedeem ? "Redeem →" : "Not yet"}</button>
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
                  {cBirthday(profile) && (
                    <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Birthday</div>
                      <div style={{ fontSize: 13, color: C.purple, fontWeight: 600 }}>🎂 {new Date(cBirthday(profile)).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
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

                {/* Contact Consent & Preferred Channel (task 2) — compact, wraps on mobile */}
                <div style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, fontWeight: 700 }}>Contact Consent</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    {CONSENT_FIELDS.map(f => (
                      <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text2, cursor: "pointer" }}>
                        <input type="checkbox" checked={!!profile[f.key]} onChange={e => toggleConsent(profile.id, f.key, e.target.checked)} />
                        {f.lbl}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: C.text3 }}>Preferred channel:</span>
                    <select style={{ ...input, fontSize: 11, padding: "3px 8px", width: "auto" }} value={PREFERRED_CHANNELS.includes(profile.preferredChannel) ? profile.preferredChannel : "None"} onChange={e => setPreferredChannelFor(profile.id, e.target.value)}>
                      {PREFERRED_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                </div>

                <LogVisit key={profile.id} profile={profile} addVisitEntry={addVisitEntry} />

                {/* Recent Activity — compact merged history (task 2) */}
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Recent Activity</div>
                {(() => {
                  const items = [];
                  hist.slice(0, 5).forEach(h => {
                    const label = h?._manual ? `Visit logged: ${h._label || "item"}` : (Array.isArray(h?.items) && h.items.length ? h.items.map(i => `${i?.qty || 1}× ${i?.name || "item"}`).join(", ") : "Order");
                    items.push({ kind: "order", date: h?.createdAt, label, amount: h?.total });
                  });
                  cCommLog(profile).slice(0, 5).forEach(e => items.push({ kind: "comm", date: e?.date, label: `${e?.type || "Message"}: ${(e?.message || "").slice(0, 60)}` }));
                  if (profile.notesUpdatedAt) items.push({ kind: "note", date: profile.notesUpdatedAt, label: "Staff notes updated" });
                  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                  const top = items.slice(0, 5);
                  if (top.length === 0) {
                    return <div style={{ fontSize: 11, color: C.text3, padding: "10px 0", marginBottom: 12 }}>No activity yet for this customer.</div>;
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                      {top.map((it, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: C.text2, background: C.bg3, borderRadius: 7, padding: "6px 9px", wordBreak: "break-word" }}>
                          <span style={{ flexShrink: 0 }}>{it.kind === "order" ? "🧾" : it.kind === "comm" ? "💬" : "📝"}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>{it.label}</span>
                          {it.amount != null && <span style={{ fontFamily: "monospace", color: C.amber2, flexShrink: 0 }}>₹{it.amount}</span>}
                          <span style={{ fontSize: 9, color: C.text3, flexShrink: 0, whiteSpace: "nowrap" }}>{it.date && !isNaN(new Date(it.date).getTime()) ? new Date(it.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Tags */}
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Tags</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {cTags(profile).map(t => (
                    <span key={t} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: C.bg4, color: C.text2, border: `1px solid ${C.border2}`, display: "inline-flex", alignItems: "center", gap: 5, wordBreak: "break-word", maxWidth: "100%" }}>
                      {t}
                      <span style={{ cursor: "pointer", color: C.text3, fontSize: 13, lineHeight: 1, marginLeft: 2 }} onClick={() => removeTag(t)} title="Remove tag">×</span>
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
                  <div style={{ fontSize: 9, color: C.text3, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>Order History</div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{hist.length} {hist.length === 1 ? "order" : "orders"}</div>
                </div>

                {/* Status filter */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {["ALL","COMPLETED","CANCELLED","PENDING"].map(s => (
                    <button key={s} onClick={() => setHistFilter(s)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${histFilter === s ? C.amber3 : C.border}`, background: histFilter === s ? C.bg4 : C.bg3, color: histFilter === s ? C.amber2 : C.text3, fontSize: 9, fontWeight: 700, cursor: "pointer", minHeight: 32 }}>
                      {s === "ALL" ? `All (${hist.length})` : s === "COMPLETED" ? `✓ Done` : s === "CANCELLED" ? `✕ Void` : `… Pending`}
                    </button>
                  ))}
                </div>

                {hist.length > 1 && (() => {
                  const completed = hist.filter(h => h.status === "COMPLETED").slice(0, 12).reverse();
                  if (completed.length < 2) return null;
                  const maxAmt = Math.max(...completed.map(h => h.total || 0), 1);
                  return (
                    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, fontWeight: 700 }}>Spend — last {completed.length} orders</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 52 }}>
                        {completed.map((h, i) => {
                          const pct = Math.max(8, ((h.total || 0) / maxAmt) * 100);
                          const brightness = 0.55 + 0.45 * (i / completed.length);
                          return (
                            <div key={i} title={`₹${(h.total || 0).toLocaleString()}`} style={{ flex: 1, borderRadius: "4px 4px 0 0", background: C.amber3, height: `${pct}%`, transition: "height .35s ease", cursor: "default", opacity: brightness }} />
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.text3, marginTop: 5 }}>
                        <span>Oldest</span><span style={{ color: C.amber2 }}>₹{(completed[completed.length - 1]?.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                {hist.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 0", color: C.text3 }}>
                    <div style={{ fontSize: 30, marginBottom: 10 }}>🧾</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 5 }}>No orders yet</div>
                    <div style={{ fontSize: 11, lineHeight: 1.5 }}>When this customer places their first order, it'll appear here.</div>
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
                  <div style={{ fontSize: 9, color: C.amber2, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6, fontWeight: 700 }}>📌 Pinned Note <span style={{ color: C.text3, fontWeight: 400, letterSpacing: ".02em" }}>— surfaces on every visit</span></div>
                  <input
                    style={{ ...input, fontSize: 12, marginBottom: 8 }}
                    placeholder="e.g. Always asks for extra ice. Regulars discount approved."
                    value={pinnedNote}
                    maxLength={300}
                    onChange={e => setPinnedNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && savePinnedNote()}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.text3 }}>{pinnedNote.length} chars</span>
                    <button style={{ ...btn("ghost"), fontSize: 10 }} onClick={savePinnedNote}>Save Pinned Note</button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: C.text3, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>Staff Notes</div>
                  <span style={{ fontSize: 10, color: C.text3 }}>{noteVal.length} chars</span>
                </div>
                <textarea
                  style={{ ...input, resize: "none", lineHeight: 1.7, marginBottom: 8, fontFamily: "inherit" }}
                  rows={9}
                  maxLength={1000}
                  placeholder={"Staff notes — preferences, quirks, complaints, special requests…\n\ne.g. Always adds sugar. Sensitive about wait times. Regulars discount approved by owner."}
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button style={{ ...btn("primary"), fontSize: 11, flex: 1 }} onClick={updateNote}>Save Notes</button>
                  {noteVal !== (profile.notes || "") && (
                    <div style={{ display: "flex", alignItems: "center", fontSize: 10, color: C.amber2, gap: 4 }}>
                      <span>●</span> Unsaved
                    </div>
                  )}
                  {noteVal === (profile.notes || "") && profile.notesUpdatedAt && (
                    <div style={{ fontSize: 9, color: C.text3, whiteSpace: "nowrap" }}>Saved {new Date(profile.notesUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
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
                    { icon: "🎂", label: "Birthday Offer", msg: `Hi ${cName(profile).split(" ")[0]}, happy birthday! Enjoy a special treat on us today 🎂` },
                    { icon: "⭐", label: "Loyalty Reward", msg: `Hi ${cName(profile).split(" ")[0]}, you've earned ${cLoyalty(profile)} loyalty points — that's ₹${calculateRedeemable(cLoyalty(profile))} redeemable! Come redeem them on your next visit.` },
                    { icon: "🔄", label: "Come Back Offer", msg: `Hi ${cName(profile).split(" ")[0]}, we miss you! Come back soon and enjoy 10% off your next order.` },
                    { icon: "📝", label: "Review Request", msg: `Hi ${cName(profile).split(" ")[0]}, thanks for visiting us! We'd love it if you could leave us a quick review — it really helps.` },
                  ].map(t => (
                    <button key={t.label} style={{ ...btn("ghost"), fontSize: 9, padding: "5px 9px" }} onClick={() => setCommMsg(t.msg)}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                  {COMM_TYPES.map(type => (
                    <button key={type} onClick={() => setCommType(type)} style={{ flex: "1 1 auto", minWidth: 64, padding: "7px 4px", borderRadius: 6, border: `1px solid ${commType === type ? C.amber3 : C.border}`, background: commType === type ? C.bg4 : "transparent", color: commType === type ? C.amber2 : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                      {commIcon(type)} {type}
                    </button>
                  ))}
                </div>

                {/* Consent / status hint for the selected channel (task 2, 3) */}
                {commType !== "Internal Note" && (
                  <div style={{ fontSize: 10, marginBottom: 8, wordBreak: "break-word", color: isBlocked(profile) ? C.red : (channelRequiresConsent(commType) && !hasConsentFor(profile, commType)) ? C.warning : C.text3 }}>
                    {isBlocked(profile) ? "🚫 Customer is blocked — cannot log outbound communication." :
                     channelRequiresConsent(commType) && !hasConsentFor(profile, commType) ? `⚠ No ${commType} consent on file for this customer.` :
                     `✓ OK to contact via ${commType}`}
                  </div>
                )}

                <textarea
                  style={{ ...input, resize: "none", lineHeight: 1.6, marginBottom: 8, fontFamily: "inherit" }}
                  rows={4}
                  maxLength={1000}
                  placeholder={`Write a ${commType.toLowerCase()} message…`}
                  value={commMsg}
                  onChange={e => setCommMsg(e.target.value)}
                />
                <button
                  style={{ ...btn("primary"), fontSize: 11, marginBottom: 20, width: "100%", opacity: (commMsg.trim() && (commType === "Internal Note" || (!isBlocked(profile) && (!channelRequiresConsent(commType) || hasConsentFor(profile, commType))))) ? 1 : 0.5, cursor: commMsg.trim() ? "pointer" : "not-allowed" }}
                  disabled={!commMsg.trim() || (commType !== "Internal Note" && (isBlocked(profile) || (channelRequiresConsent(commType) && !hasConsentFor(profile, commType))))}
                  onClick={() => logComm(profile.id, commType, commMsg)}
                >
                  {commType === "Internal Note" ? "Save note" : `Mark ${commType} as sent`}
                </button>

                {/* Communication History */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>History</div>
                  <span style={{ fontSize: 10, color: C.text3 }}>{(profile.commLog || []).length} logged</span>
                </div>
                {(profile.commLog || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0", color: C.text3 }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 4 }}>No messages logged yet</div>
                    <div style={{ fontSize: 11, lineHeight: 1.5 }}>Send a birthday offer, loyalty nudge, or just check in — it'll appear here.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(profile.commLog || []).map((entry, i) => (
                      <div key={i} style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${commColor(entry.type)}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, flexWrap: "wrap", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: commColor(entry.type) }}>
                            {commIcon(entry.type)} {entry.type}
                            {entry.bulk && <span style={{ marginLeft: 5, color: C.text3, fontWeight: 400 }}>· bulk</span>}
                            {entry.internal && <span style={{ marginLeft: 5, color: C.text3, fontWeight: 400 }}>· internal</span>}
                          </span>
                          <span style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>
                            {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} {new Date(entry.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, wordBreak: "break-word" }}>{entry.message}</div>
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
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>Redeem points</div>
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 16 }}>
              <button style={btn("ghost")} onClick={() => setShowLoyaltyModal(false)}>Cancel</button>
              <button
                style={{ ...btn("primary"), opacity: Number(redeemAmount) >= MIN_REDEEM_AMOUNT ? 1 : 0.5 }}
                disabled={!Number(redeemAmount) || Number(redeemAmount) < MIN_REDEEM_AMOUNT}
                onClick={() => redeemPoints(profile.id, redeemAmount)}
              >Redeem ₹{redeemAmount || "—"}</button>
            </div>

            {/* Manual adjustment (task 4) */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: cLoyaltyTxns(profile).length ? 12 : 0 }}>
              <label style={{ fontSize: 10, color: C.text3, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Manual Adjustment (staff)</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input style={{ ...input, fontSize: 12, width: 90 }} type="number" placeholder="± pts" value={adjustPoints} onChange={e => setAdjustPoints(e.target.value)} />
                <input style={{ ...input, fontSize: 12, flex: 1 }} placeholder="Reason (required)" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} maxLength={200} />
              </div>
              <button
                style={{ ...btn("ghost"), fontSize: 10, width: "100%", opacity: adjustPoints && adjustReason.trim() ? 1 : 0.5, cursor: adjustPoints && adjustReason.trim() ? "pointer" : "not-allowed" }}
                disabled={!adjustPoints || !adjustReason.trim()}
                onClick={() => { adjustLoyaltyPoints(profile.id, adjustPoints, adjustReason); setAdjustPoints(""); setAdjustReason(""); }}
              >Apply Adjustment</button>
            </div>

            {/* Recent loyalty transactions (task 3) */}
            {cLoyaltyTxns(profile).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Recent Activity</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {cLoyaltyTxns(profile).slice(0, 3).map(t => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, color: C.text2, background: C.bg3, borderRadius: 6, padding: "5px 8px", wordBreak: "break-word" }}>
                      <span style={{ flex: 1 }}>{t.type === "earn" ? "＋ Earned" : t.type === "redeem" ? "－ Redeemed" : "✎ Adjusted"}{t.reason ? ` · ${t.reason}` : ""}</span>
                      <span style={{ fontFamily: "monospace", color: t.points >= 0 ? C.green : C.red, flexShrink: 0 }}>{t.points >= 0 ? "+" : ""}{t.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Communication Modal */}
      {showBulkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowBulkModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(420px, 92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>Message {bulkSelected.size} {bulkSelected.size === 1 ? "customer" : "customers"}</div>
              <button onClick={() => setShowBulkModal(false)} style={{ cursor: "pointer", color: C.text3, background: "none", border: "none", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: C.bg3, borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 11, color: C.text2 }}>
              {[...bulkSelected].map(id => customers.find(c => c.id === id)?.name).filter(Boolean).join(", ")}
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {COMM_TYPES.map(t => (
                <button key={t} onClick={() => setBulkCommType(t)} style={{ flex: "1 1 auto", minWidth: 64, padding: "6px 4px", borderRadius: 6, border: `1px solid ${bulkCommType === t ? C.amber3 : C.border}`, background: bulkCommType === t ? C.bg4 : "transparent", color: bulkCommType === t ? C.amber2 : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                  {commIcon(t)} {t}
                </button>
              ))}
            </div>
            {/* Live eligibility preview — blocked/consent/contact-info aware (task 1, 2, 3, 10) */}
            {(() => {
              const sel = customers.filter(c => bulkSelected.has(c.id));
              const isInternal = bulkCommType === "Internal Note";
              const eligibleCount = sel.filter(c =>
                (isInternal || !isBlocked(c)) &&
                (!commNeedsEmail(bulkCommType) || !!cEmail(c)) &&
                (!commNeedsPhone(bulkCommType) || !!cPhone(c)) &&
                (isInternal || !channelRequiresConsent(bulkCommType) || hasConsentFor(c, bulkCommType))
              ).length;
              const skipped = sel.length - eligibleCount;
              return (
                <div style={{ fontSize: 10, color: skipped > 0 ? C.warning : C.text3, marginBottom: 10, wordBreak: "break-word" }}>
                  {eligibleCount} eligible{skipped > 0 ? `, ${skipped} will be skipped (blocked, missing contact info, or no consent)` : ""}
                </div>
              );
            })()}
            {/* Quick templates */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {[
                { label: "🎂 Birthday Offer", msg: "Hi! Happy birthday from all of us — enjoy a special treat on your next visit 🎂" },
                { label: "⭐ Loyalty Reward", msg: "Hi! Your loyalty points are ready to redeem. Visit us today and get a reward!" },
                { label: "🔄 Come Back Offer", msg: "Hi! We miss you at the café — come back soon and enjoy a special treat on us." },
                { label: "📝 Review Request", msg: "Hi! Thanks for being a regular — we'd love it if you could leave us a quick review." },
              ].map(t => (
                <button key={t.label} style={{ ...btn("ghost"), fontSize: 9, padding: "4px 8px" }} onClick={() => setBulkCommMsg(t.msg)}>{t.label}</button>
              ))}
            </div>
            <textarea style={{ ...input, resize: "none", lineHeight: 1.6, marginBottom: 12 }} rows={4} maxLength={1000} placeholder="Type your message…" value={bulkCommMsg} onChange={e => setBulkCommMsg(e.target.value)} />
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 14 }}>This will be logged in each customer's communication history.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={sendBulkComm} disabled={!bulkCommMsg.trim()}>Send to {bulkSelected.size} {bulkSelected.size === 1 ? "customer" : "customers"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 24, width: "min(360px, 92vw)", boxShadow: "0 24px 60px rgba(0,0,0,.7)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.02em" }}>{editMode ? "Edit customer" : "New customer"}</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: C.text3, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 16, lineHeight: 1, padding: "3px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            {[
              { lbl: "Name *", val: modalData.name, set: (v) => setModalData({...modalData, name: v}), ph: "Full name", type: "text" },
              { lbl: "Phone (optional)", val: modalData.phone, set: (v) => setModalData({...modalData, phone: v}), ph: "10-digit number", type: "tel" },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Status</label>
                <select style={input} value={CUSTOMER_STATUSES.includes(modalData.status) ? modalData.status : "active"} onChange={e => setModalData({...modalData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label style={label}>Preferred Channel</label>
                <select style={input} value={PREFERRED_CHANNELS.includes(modalData.preferredChannel) ? modalData.preferredChannel : "None"} onChange={e => setModalData({...modalData, preferredChannel: e.target.value})}>
                  {PREFERRED_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Consent to Contact</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {CONSENT_FIELDS.map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text2, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!modalData[f.key]} onChange={e => setModalData({...modalData, [f.key]: e.target.checked})} />
                    {f.lbl}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Discard</button>
              <button style={btn("primary")} onClick={saveModal}>{editMode ? "Save changes" : "Add customer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 28, left: "50%", transform: "translateX(-50%)", background: C.bg3, border: `1px solid ${toast.color}55`, color: toast.color, borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700, zIndex: 200, pointerEvents: "none", boxShadow: `0 8px 32px rgba(0,0,0,.7), 0 0 0 1px ${toast.color}25`, whiteSpace: "nowrap", letterSpacing: ".02em" }}>
          {toast.msg}
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: C.bg2, borderTop: `1px solid ${C.border2}`, display: "flex", alignItems: "stretch", zIndex: 150, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { icon: "👥", label: "Guests", action: () => setSelected(null), active: !selected },
            { icon: "＋", label: "Add", action: openAddModal, active: false, highlight: true },
            { icon: "📊", label: "Overview", action: () => { setSelected(null); setSmartList(null); setSegmentFilter("ALL"); setTierFilter("ALL"); setTypeFilter("ALL"); }, active: false },
            { icon: "⬇", label: "Export", action: exportCSV, active: false },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: item.highlight ? C.amber3 : "transparent", border: "none", cursor: "pointer", color: item.active ? C.amber2 : item.highlight ? C.amber2 : C.text3, fontSize: 9, fontWeight: item.active || item.highlight ? 700 : 400, borderTop: item.active ? `2px solid ${C.amber2}` : "2px solid transparent", letterSpacing: ".04em", textTransform: "uppercase" }}>
              <span style={{ fontSize: item.highlight ? 20 : 17, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CRM;
