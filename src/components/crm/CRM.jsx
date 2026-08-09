// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useState, useEffect, useCallback, startTransition } from "react";
import { C, btn, input, emptyState } from "../../styles/theme";
import { initials } from "../../styles/theme";
import { calculateTier, updateCustomerAfterOrder } from "../../domain/customerModel.js";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";
import ConflictDialog from "../common/ConflictDialog";
import AlertDialog from "../common/AlertDialog.jsx";
import { CustomerPermissions, ImportExportPermissions } from "../../utils/permissionService.js";
import { createSecurityAuditLog, createPermissionDeniedAuditLog, createExportAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import LogVisit from "./LogVisit";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";

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

function CRM({ customers, setCustomers, orders, kdsCards, tables: _tables, setNotifications, documents }) {
  // --- Safe guards: never crash if customers/orders/kdsCards are null/undefined/malformed ---
  // eslint-disable-next-line react-hooks/immutability
  customers = Array.isArray(customers) ? customers : [];
  // eslint-disable-next-line react-hooks/immutability
  orders = Array.isArray(orders) ? orders : [];
  // eslint-disable-next-line react-hooks/immutability
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
  const cLoyaltyTxns = (c) => (Array.isArray(c?.loyaltyTxns) ? c.loyaltyTxns : []);
  const cBirthday = (c) => normalizeBirthday(c?.birthday);
  const isValidDate = (d) => { if (!d) return true; const t = new Date(d); return !isNaN(t.getTime()); };
  const cStatus = (c) => (c?.status === "inactive" || c?.status === "blocked") ? c.status : "active"; // task 1: default active, safe for old customers
  const isBlocked = (c) => cStatus(c) === "blocked";

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalData, setModalData] = useState({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0, customerType: "", status: "active", preferredChannel: "None", marketingConsent: false, smsConsent: false, emailConsent: false, whatsappConsent: false });
  const [noteVal, setNoteVal] = useState("");
  const [_editField, setEditField] = useState(null);
  const [_profileTab, setProfileTab] = useState("overview");
  const [sortBy, setSortBy] = useState("spend");
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("ALL"); // ALL | AT_RISK | BIRTHDAY | VIP
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | any CUSTOMER_TYPES key
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCommType, setBulkCommType] = useState("SMS");
  const [bulkCommMsg, setBulkCommMsg] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [smartList, setSmartList] = useState(null); // null | "gone_cold" | "loyalty_ready" | "high_value" | "new_customers"
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = C.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const [localVisits, setLocalVisits] = useState({}); // cid -> [{date, items, amt}]

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [mergeDialog, setMergeDialog] = useState({ open: false, primary: null, duplicate: null, onConfirm: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customer: null, onConfirm: null });
  const [blockDialog, setBlockDialog] = useState({ open: false, customer: null, onConfirm: null });
  const [anonymizeDialog, setAnonymizeDialog] = useState({ open: false, customer: null, onConfirm: null });
  const [bulkCommDialog, setBulkCommDialog] = useState({ open: false, count: 0, skipped: 0, reasons: [], onConfirm: null });
  const [permissionDeniedDialog, setPermissionDeniedDialog] = useState({ open: false, action: '', requiredPermission: '', currentRole: '' });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
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
    const totalSpend = completedOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
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
      ? new Date(completedOrders[completedOrders.length - 1].createdAt || new Date().toISOString())
      : null;
    const now = new Date();
    const monthsActive = firstOrderDate
      ? Math.max(1, Math.round((now - firstOrderDate) / (1000 * 60 * 60 * 24 * 30)))
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
      const now = new Date();
      if (!isNaN(created.getTime())) return Math.round((now - created) / 86400000) <= NEW_CUSTOMER_DAYS;
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
  if (typeFilter === "OTHER") filtered = filtered.filter(c => c.customerType && !TYPE_MAP[c.customerType]);
  else if (typeFilter !== "ALL") filtered = filtered.filter(c => c.customerType === typeFilter);
  if (segmentFilter === "AT_RISK") filtered = filtered.filter(c => isAtRisk(c));
  if (segmentFilter === "BIRTHDAY") filtered = filtered.filter(c => cBirthday(c) && new Date().toISOString().slice(5,10) === cBirthday(c).slice(5,10));
  if (segmentFilter === "VIP") filtered = filtered.filter(c => c.tier === "PLATINUM" || c.tier === "GOLD");
  // Apply smartList filter — was set but never applied to the visible list
  if (smartList === "gone_cold") filtered = filtered.filter(c => { const d = daysSinceVisit(c); return d != null && d >= 14; });
  else if (smartList === "high_value") filtered = filtered.filter(c => cSpend(c) >= 2000);
  else if (smartList === "new_customers") filtered = filtered.filter(c => isNewCustomer(c));
  else if (smartList === "birthday_soon") filtered = filtered.filter(c => { const d = daysToBirthday(c); return d != null && d >= 0 && d <= 7; });
  else if (smartList === "high_value_at_risk") filtered = filtered.filter(c => { const d = daysSinceVisit(c); return cSpend(c) >= 1000 && d != null && d >= 10; });
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

  // Record a manually-logged visit (e.g. a walk-in order taken outside the POS) against a customer.
  const addVisitEntry = (customerId, items, amt) => {
    const amount = Number(amt);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const c = customers.find(x => x.id === customerId);
    if (!c) { showToast("Customer not found — it may have been removed", C.warning); return; }

    setLocalVisits(prev => {
      const next = { ...prev };
      const list = Array.isArray(prev[customerId]) ? prev[customerId] : [];
      next[customerId] = [{ date: new Date().toISOString(), items, amt: amount }, ...list];
      return next;
    });

    const newSpend = cSpend(c) + amount;
    const updated = {
      ...c,
      visits: cVisits(c) + 1,
      spend: newSpend,
      lastVisit: "Today",
      tier: calculateTier ? calculateTier(newSpend) : c.tier,
      updatedAt: new Date().toISOString(),
    };
    setCustomers(customers.map(x => x.id === customerId ? updated : x));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishCrmEvent('customer.visit_completed', {
      customerId: customerId,
      customerName: cName(c),
      amount: amount,
      totalVisits: cVisits(c) + 1,
      totalSpend: newSpend,
      newTier: updated.tier
    });

    showToast(`Visit logged for ${cName(c)} ✓`);
  };

  // Update customer data with metrics when order is completed
  const updateCustomerOnOrderComplete = useCallback((order) => {
    if (!order.customerId || !customers) return;
    const customer = customers.find(c => c.id === order.customerId);
    if (customer && order.status === "COMPLETED") {
      const updatedCustomer = updateCustomerAfterOrder(customer, order);
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishCrmEvent('customer.loyalty_updated', {
        customerId: updatedCustomer.id,
        customerName: updatedCustomer.name,
        orderId: order.id,
        orderAmount: order.total,
        newTier: updatedCustomer.tier,
        loyaltyPoints: updatedCustomer.loyaltyPoints
      });
    }
  }, [customers, setCustomers]);

  useEffect(() => {
    if (orders) {
      orders.forEach(order => {
        if (order.status === "COMPLETED") {
          updateCustomerOnOrderComplete(order);
        }
      });
    }
  }, [orders, updateCustomerOnOrderComplete]);

  useEffect(() => { if (profile) { startTransition(() => setNoteVal(profile.notes || "")); } }, [profile?.id]);

  useEffect(() => {
    if (selected && !customers.some(c => c.id === selected)) {
      startTransition(() => {
        setSelected(null);
        setShowLoyaltyModal(false);
        setShowModal(false);
        setEditField(null);
      });
    }
  }, [customers, selected]);

  useEffect(() => {
    startTransition(() => {
      setBulkSelected(prev => {
        if (prev.size === 0) return prev;
        const validIds = new Set(customers.map(c => c.id));
        const next = new Set([...prev].filter(id => validIds.has(id)));
        return next.size === prev.size ? prev : next;
      });
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
    if (!name) {
      setAlertDialog({ isOpen: true, title: 'Validation Error', message: 'Name is required', type: 'error' });
      return;
    }
    let phoneDigits = "";
    if (phone) {
      phoneDigits = normalizePhone(phone);
      if (phoneDigits.length !== 10) {
        setAlertDialog({ isOpen: true, title: 'Validation Error', message: 'Phone number must be 10 digits', type: 'error' });
        return;
      }
    }
    if (email && !isValidEmail(email)) {
      setAlertDialog({ isOpen: true, title: 'Validation Error', message: 'Please enter a valid email address', type: 'error' });
      return;
    }
    if (modalData.birthday && !isValidDate(modalData.birthday)) {
      setAlertDialog({ isOpen: true, title: 'Validation Error', message: 'Please enter a valid birthday', type: 'error' });
      return;
    }
    if (phoneDigits) {
      const dupPhone = customers.find(c => c.id !== selected && normalizePhone(cPhone(c)) === phoneDigits);
      if (dupPhone) {
        setAlertDialog({ isOpen: true, title: 'Duplicate Phone', message: `This phone number is already used by ${cName(dupPhone)}`, type: 'warning' });
        return;
      }
    }
    if (email) {
      const dupEmail = customers.find(c => c.id !== selected && cEmail(c).toLowerCase() === email);
      if (dupEmail) {
        setAlertDialog({ isOpen: true, title: 'Duplicate Email', message: `This email is already used by ${cName(dupEmail)}`, type: 'warning' });
        return;
      }
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

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishCrmEvent('customer.updated', {
        customerId: selected,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        tier: tier,
        staffId: getCurrentUserId()
      });

      showToast("Customer updated ✓");
    } else {
      const newC = {
        id: "c" + Date.now(), ...modalData, name, phone, email, visits, spend, loyaltyPoints,
        tags: tagArr.length ? tagArr : ["New Customer"], notes, allergy, tier, lastVisit: "Never",
        status, preferredChannel, marketingConsent, smsConsent, emailConsent, whatsappConsent,
        createdAt: ts, updatedAt: ts,
      };
      setCustomers([...customers, newC]);

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishCrmEvent('customer.created', {
        customerId: newC.id,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        tier: tier,
        customerType: modalData.customerType,
        staffId: getCurrentUserId()
      });

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
    setMergeDialog({
      open: true,
      primary,
      duplicate: dup,
      onConfirm: () => {
        setMergeDialog({ open: false, primary: null, duplicate: null, onConfirm: null });
        proceedWithMerge(primary, dup);
      }
    });
  };

  const proceedWithMerge = (primary, dup) => {
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
    const primaryId = primary.id;
    const duplicateId = dup.id;
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
    // Check permission before allowing delete
    const permissionCheck = CustomerPermissions.canDelete();
    if (!permissionCheck.allowed) {
      // Log permission denial
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'CUSTOMER_DELETE',
        details: { customerId: id, requiredPermission: permissionCheck.requiredPermission }
      });
      if (setNotifications) {
        setNotifications(prev => [denialLog, ...(prev || [])]);
      }
      
      setPermissionDeniedDialog({
        open: true,
        action: 'delete customer',
        requiredPermission: permissionCheck.requiredPermission,
        currentRole: permissionCheck.currentRole || '',
      });
      return;
    }
    
    const c = customers.find(x => x.id === id);
    if (!c) { showToast("Customer not found — it may already be deleted", C.warning); setSelected(null); return; }
    const hasOrderHistory = getCustomerOrders(id).length > 0;
    setDeleteDialog({
      open: true,
      customer: c,
      hasOrderHistory,
      onConfirm: () => {
        setDeleteDialog({ open: false, customer: null, onConfirm: null });
        proceedWithDelete(id, c);
        
        // Log customer deletion
        const deleteLog = createSecurityAuditLog({
          userId: getCurrentUserId(),
          action: 'CUSTOMER_DELETE',
          details: { customerId: id, customerName: cName(c), hadOrderHistory: hasOrderHistory }
        });
        if (setNotifications) {
          setNotifications(prev => [deleteLog, ...(prev || [])]);
        }
      }
    });
  };

  const proceedWithDelete = (id, c) => {
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
    if (next === "blocked") {
      setBlockDialog({
        open: true,
        customer: c,
        onConfirm: () => {
          setBlockDialog({ open: false, customer: null, onConfirm: null });
          proceedWithToggleBlocked(id, c, next);
        }
      });
      return;
    }
    proceedWithToggleBlocked(id, c, next);
  };

  const proceedWithToggleBlocked = (id, c, next) => {
    setCustomers(customers.map(x => x.id === id ? { ...x, status: next, updatedAt: new Date().toISOString() } : x));
    if (next === "blocked") setBulkSelected(prev => { if (!prev.has(id)) return prev; const nextSet = new Set(prev); nextSet.delete(id); return nextSet; });
    showToast(next === "blocked" ? `${cName(c)} marked as blocked` : `${cName(c)} unblocked ✓`, next === "blocked" ? C.warning : C.green);
  };

  const exportCSV = () => {
    // Check permission before allowing export
    const permissionCheck = ImportExportPermissions.canExport();
    if (!permissionCheck.allowed) {
      // Log permission denial
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'EXPORT_ATTEMPT',
        details: { module: 'CRM', requiredPermission: permissionCheck.requiredPermission }
      });
      if (setNotifications) {
        setNotifications(prev => [denialLog, ...(prev || [])]);
      }
      
      setPermissionDeniedDialog({
        open: true,
        action: 'export customer data',
        requiredPermission: permissionCheck.requiredPermission,
        currentRole: permissionCheck.currentRole || '',
      });
      return;
    }
    
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
    
    // Log successful export
    const exportLog = createExportAuditLog({
      userId: getCurrentUserId(),
      module: 'CRM',
      details: { customerCount: customers.length, format: 'CSV' }
    });
    if (setNotifications) {
      setNotifications(prev => [exportLog, ...(prev || [])]);
    }
  };

  const commIcon = (t) => t === "Email" ? "📧" : t === "SMS" ? "📱" : t === "WhatsApp" ? "💬" : t === "Call" ? "📞" : t === "Internal Note" ? "🗒️" : "💬";

  // Build a human-readable item summary for a real order (manual visit entries already carry _label)
  const getOrderDisplayItems = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (items.length === 0) return "Order";
    return items
      .map(it => {
        const name = (it && typeof it.name === "string" && it.name.trim()) ? it.name.trim() : "Item";
        const qty = Number(it?.qty);
        return Number.isFinite(qty) && qty > 1 ? `${name} x${qty}` : name;
      })
      .join(", ");
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
    if (smartList === "loyalty_ready") return []; // Loyalty disabled - always empty
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
    setBulkCommDialog({
      open: true,
      count: eligible.length,
      skipped: skippedCount,
      reasons,
      onConfirm: () => {
        setBulkCommDialog({ open: false, count: 0, skipped: 0, reasons: [], onConfirm: null });
        proceedWithBulkComm(eligible, commType_, msg, isInternal, skippedCount, reasons);
      }
    });
  };

  const proceedWithBulkComm = (eligible, commType_, msg, isInternal, skippedCount, reasons) => {
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
    <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: isMobile ? 0 : "var(--cafe-space-lg)", height: isMobile ? "auto" : "calc(100dvh - 160px)", minHeight: 0, position: "relative" }}>
      {/* Left: Guest List — hidden on mobile when a profile is open */}
      <div style={{ display: isMobile && selected ? "none" : "flex", flexDirection: "column", gap: "var(--cafe-space-md)", overflow: "hidden", height: isMobile ? "calc(100dvh - 60px)" : "auto", background: isMobile ? "var(--cafe-bg)" : "transparent" }}>
        {/* Guest Book Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Guest Book
          </div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", fontWeight: 500, marginBottom: 14 }}>
            Customer profiles, visits, preferences, and order history
          </div>
          
          {/* Operational Stat Chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Total Guests", count: customers.length, color: "var(--cafe-text-secondary)", bg: "var(--cafe-bg-surface)" },
              { label: "Active", count: customers.filter(c => cStatus(c) === "active").length, color: "var(--cafe-success)", bg: "var(--cafe-success-bg)" },
              { label: "Drifting", count: atRiskCount, color: atRiskCount > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)", bg: atRiskCount > 0 ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)" },
              { label: "Birthdays", count: todayBirthdays, color: todayBirthdays > 0 ? "var(--cafe-purple)" : "var(--cafe-text-tertiary)", bg: todayBirthdays > 0 ? "var(--cafe-purple-bg)" : "var(--cafe-bg-surface)" },
              { label: "Dietary Notes", count: customers.filter(c => c.allergy).length, color: customers.filter(c => c.allergy).length > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", bg: customers.filter(c => c.allergy).length > 0 ? "var(--cafe-danger-bg)" : "var(--cafe-bg-surface)" },
            ].map(chip => (
              <div key={chip.label} style={{
                background: chip.bg,
                border: `1px solid var(--cafe-border-light)`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: "fit-content",
                transition: "all 0.2s"
              }}>
                <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {chip.label}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: chip.color, fontFamily: "monospace", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {chip.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Book Toolbar */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--cafe-text-tertiary)" }}>⌕</span>
            <input style={{ paddingLeft: 40, paddingRight: search ? 40 : undefined, borderRadius: 12, fontSize: 13, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} placeholder="Name, phone, tag, note…" value={search} onChange={e => setSearch(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }} title="Clear search">×</button>
            )}
          </div>
          <button style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, minHeight: 44, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onClick={openAddModal} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}>+ Add Guest</button>
          <button style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onClick={exportCSV} title="Export to CSV" onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>↓ Export</button>
        </div>

        {/* Sort and Type Filters */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ fontSize: 13, padding: "10px 32px 10px 14px", borderRadius: 12, flex: 1, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} value={sortBy} onChange={e => setSortBy(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
            <option value="spend">Sort: Top Spenders</option>
            <option value="visits">Sort: Most Visits</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="risk">Sort: Churn Risk</option>
          </select>
          <select style={{ fontSize: 13, padding: "10px 32px 10px 14px", borderRadius: 12, flex: 1, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
            <option value="ALL">All Types</option>
            {CUSTOMER_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
            ))}
            <option value="OTHER">❓ Other / Unlisted</option>
          </select>
        </div>

        {/* Segment Filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "ALL", label: "Everyone" },
            { key: "AT_RISK", label: "⚠ Drifting" },
            { key: "VIP", label: "⭐ High Value" },
            { key: "BIRTHDAY", label: "🎂 Today" },
          ].map(s => (
            <button key={s.key} onClick={() => setSegmentFilter(s.key)} style={{ 
              padding: "10px 16px", 
              borderRadius: 12, 
              border: `1px solid ${segmentFilter === s.key ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`, 
              background: segmentFilter === s.key ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", 
              color: segmentFilter === s.key ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", 
              fontSize: 13, 
              fontWeight: segmentFilter === s.key ? 700 : 600, 
              cursor: "pointer", 
              whiteSpace: "nowrap", 
              minHeight: 44,
              transition: "all 0.2s ease"
            }}
            onMouseOver={e => { if (segmentFilter !== s.key) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
            onMouseOut={e => { if (segmentFilter !== s.key) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--cafe-space-sm)" }}>
          {(segmentFilter !== "ALL" || typeFilter !== "ALL" || smartList) && (
            <button onClick={() => { setSegmentFilter("ALL"); setTypeFilter("ALL"); setSmartList(null); }} style={{ ...btn("ghost"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", color: "var(--cafe-warning)", borderColor: "var(--cafe-warning-border)", borderRadius: "var(--cafe-radius-sm)" }}>✕ Clear filters</button>
          )}
          <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }} style={{ ...btn(bulkMode ? "primary" : "ghost"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", minHeight: 36 }}>
            {bulkMode ? `${bulkSelected.size} selected` : "Select"}
          </button>
          {bulkMode && bulkSelected.size > 0 && (
            <button onClick={() => setShowBulkModal(true)} style={{ ...btn("primary"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", minHeight: 36 }}>
              Message {bulkSelected.size}
            </button>
          )}
          {bulkMode && (
            <button onClick={() => setBulkSelected(new Set(displayList.map(c => c.id)))} style={{ ...btn("ghost"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", minHeight: 36 }}>All</button>
          )}
          {bulkMode && bulkSelected.size > 0 && (
            <button onClick={() => setBulkSelected(new Set())} style={{ ...btn("ghost"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", minHeight: 36 }}>None</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)", paddingRight: 2, paddingBottom: isMobile ? 8 : 0 }}>
          {/* Smart list label */}
          {smartList && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--cafe-accent-bg)", border: `1px solid var(--cafe-accent-border)`, borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }}>
              <span style={{ color: "var(--cafe-accent)", fontWeight: 600 }}>
                {smartList === "gone_cold" ? "🧊 Regulars Gone Cold" : smartList === "high_value" ? "💎 High Value" : smartList === "birthday_soon" ? "🎂 Birthday Soon" : smartList === "high_value_at_risk" ? "🚨 High Value At Risk" : "🌱 New Customers"}
              </span>
              <span style={{ color: "var(--cafe-text-tertiary)" }}>({displayList.length})</span>
              <button onClick={() => setSmartList(null)} style={{ marginLeft: "auto", ...btn("ghost"), fontSize: "var(--cafe-font-xs)", padding: "4px 10px", borderRadius: "var(--cafe-radius-sm)" }}>✕ Clear</button>
            </div>
          )}

          {displayList.map(c => {
            const active = selected === c.id;
            const risk = churnRisk(c);
            const atRisk = isAtRisk(c);
            const typeInfo = c.customerType ? TYPE_MAP[c.customerType] : null;
            const borderColor = bulkSelected.has(c.id) ? "var(--cafe-accent-border)" : active ? "var(--cafe-accent-border)" : isBlocked(c) ? "var(--cafe-danger-border)" : atRisk ? "var(--cafe-warning-border)" : "var(--cafe-border-light)";
            const leftBorderColor = active ? "var(--cafe-accent)" : isBlocked(c) ? "var(--cafe-danger)" : atRisk ? "var(--cafe-warning)" : "transparent";
            return (
              <div key={c.id} onClick={() => {
                if (bulkMode) {
                  const next = new Set(bulkSelected);
                  next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                  setBulkSelected(next);
                } else {
                  setSelected(c.id); setProfileTab("overview");
                }
              }} style={{
                background: active ? "var(--cafe-bg-hover)" : "var(--cafe-bg-surface)",
                border: `1px solid ${borderColor}`,
                borderLeft: `3px solid ${leftBorderColor}`,
                borderRadius: 14,
                padding: "18px",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: isBlocked(c) ? 0.6 : 1,
                boxShadow: active ? "0 4px 16px rgba(0,0,0,.12)" : "none"
              }}
              onMouseOver={e => { if (!active && !bulkMode) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
              onMouseOut={e => { if (!active && !bulkMode) { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {bulkMode && (
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${bulkSelected.has(c.id) ? "var(--cafe-accent)" : "var(--cafe-border)"}`, background: bulkSelected.has(c.id) ? "var(--cafe-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: bulkSelected.has(c.id) ? "#1A1208" : "var(--cafe-text-tertiary)", fontWeight: 700 }}>
                      {bulkSelected.has(c.id) ? "✓" : ""}
                    </div>
                  )}
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: 14,
                    background: typeInfo ? typeInfo.color + "22" : "var(--cafe-bg-hover)",
                    border: `2px solid ${typeInfo ? typeInfo.color : "var(--cafe-border-light)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800,
                    color: typeInfo ? typeInfo.color : "var(--cafe-text-secondary)",
                    flexShrink: 0, letterSpacing: ".03em", fontFamily: "monospace"
                  }}>
                    {typeInfo ? typeInfo.icon : initials(cName(c))}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-.01em", color: "var(--cafe-text-primary)" }}>{cName(c)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {typeInfo ? (
                        <span style={{ fontSize: 12, color: typeInfo.color, fontWeight: 600 }}>{typeInfo.icon} {typeInfo.label}</span>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>{cPhone(c) || cEmail(c) || "No contact"}</span>
                      )}
                    </div>
                    {typeInfo && <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", fontFamily: "monospace", marginTop: 2 }}>{cPhone(c) || cEmail(c) || "—"}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {isBlocked(c) && <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: 10, fontWeight: 600 }}>🚫 Blocked</span>}
                      {!isBlocked(c) && cStatus(c) === "inactive" && <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-tertiary)", fontSize: 10, fontWeight: 600 }}>Inactive</span>}
                      {c.allergy && <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: 10, fontWeight: 600 }} title={`Allergy: ${c.allergy}`}>⚠️ Allergy</span>}
                      {c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10) && <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--cafe-purple-bg)", color: "var(--cafe-purple)", fontSize: 10, fontWeight: 600 }} title="Birthday today!">🎂 Birthday</span>}
                      {atRisk && <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--cafe-amber-bg)", color: "var(--cafe-warning)", fontSize: 10, fontWeight: 600 }}>Drifting</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 13, color: "var(--cafe-text-secondary)", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--cafe-border-light)" }}>
                  <span style={{ color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>{cVisits(c)} {cVisits(c) === 1 ? "visit" : "visits"}</span>
                  <span style={{ fontFamily: "monospace", color: "var(--cafe-accent)", fontWeight: 800, letterSpacing: "-0.02em" }}>₹{cSpend(c).toLocaleString()}</span>
                  <span title={`Last visit: ${c.lastVisit || "Never"}`} style={{ marginLeft: "auto", color: risk.color, fontSize: 12, fontWeight: 700 }}>{risk.label}</span>
                </div>
              </div>
            );
          })}
          {displayList.length === 0 && (
            <div style={emptyState}>
              <div style={{ fontSize: 40, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>{search ? "🔍" : segmentFilter !== "ALL" ? "✅" : "☕"}</div>
              <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                {search ? `No match for "${search}"` : segmentFilter === "AT_RISK" ? "Everyone's coming in" : segmentFilter === "BIRTHDAY" ? "No birthdays today" : segmentFilter === "VIP" ? "No high value guests yet" : "No customers yet"}
              </div>
              <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
                {search ? "Try their phone number, a tag, or a note keyword" : segmentFilter !== "ALL" ? "Clear the filter to see all customers" : "Start building your regulars list"}
              </div>
              {!search && segmentFilter === "ALL" && (
                <button style={{ ...btn("primary"), fontSize: "var(--cafe-font-sm)", padding: "10px 18px", borderRadius: "var(--cafe-radius-md)" }} onClick={openAddModal}>+ First Guest</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Profile Panel — hidden on mobile when no profile is selected */}
      <div style={{ display: isMobile && !selected ? "none" : "flex", flexDirection: "column", background: "var(--cafe-bg-surface)", border: isMobile ? "none" : `1px solid var(--cafe-border-light)`, borderRadius: isMobile ? 0 : 16, padding: isMobile ? "14px 14px 80px" : 24, overflowY: "auto", height: isMobile ? "calc(100dvh - 60px)" : "auto" }}>
        {/* Mobile back button */}
        {isMobile && selected && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid var(--cafe-border-light)` }}>
            <button onClick={() => setSelected(null)} style={{ ...btn("ghost"), fontSize: 13, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, color: "var(--cafe-text-secondary)" }}>← All guests</button>
          </div>
        )}
        {!profile ? (
          <div style={{ overflowY: "auto" }}>
            {/* Guest Book Dashboard */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>☕ Today</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 10 }}>
                {[
                  { val: `₹${todayRevenue.toLocaleString()}`, lbl: "Revenue", color: "var(--cafe-accent)", accent: "var(--cafe-accent-border)" },
                  { val: todayOrders.filter(o=>o.status==="COMPLETED").length, lbl: "Orders", color: "var(--cafe-success)", accent: "var(--cafe-success-border)" },
                  { val: todayNewCustomers, lbl: "New Faces", color: "var(--cafe-info)", accent: "var(--cafe-info-border)" },
                ].map(s => (
                  <div key={s.lbl} style={{ background: "var(--cafe-bg-hover)", borderRadius: 12, padding: "16px 12px", textAlign: "center", border: `1px solid var(--cafe-border-light)`, borderBottom: `3px solid ${s.accent}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { val: `₹${totalRevenue.toLocaleString()}`, lbl: "All-time", color: "var(--cafe-text-secondary)" },
                  { val: avgVisitsPerCustomer, lbl: "Avg visits", color: "var(--cafe-text-secondary)" },
                  { val: customers.filter(c => c.allergy).length, lbl: "Dietary notes", color: customers.filter(c => c.allergy).length > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" },
                ].map(s => (
                  <div key={s.lbl} style={{ background: "var(--cafe-bg-hover)", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: `1px solid var(--cafe-border-light)` }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: s.color, letterSpacing: "-0.01em" }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Groups */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>🎯 Guest Groups</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "gone_cold", icon: "🧊", label: "Regulars Gone Cold", desc: `No visit in ${GONE_COLD_DAYS}+ days`, count: customers.filter(c => { const d = daysSinceVisit(c); return d != null && d >= GONE_COLD_DAYS; }).length, color: "var(--cafe-warning)" },
                  { key: "high_value", icon: "💎", label: "High Value Guests", desc: `Lifetime spend ₹${HIGH_VALUE_THRESHOLD.toLocaleString()}+`, count: customers.filter(c => cSpend(c) >= HIGH_VALUE_THRESHOLD).length, color: "var(--cafe-purple)" },
                  { key: "new_customers", icon: "🌱", label: "New Guests", desc: "Joined recently or 2 or fewer visits", count: customers.filter(c => isNewCustomer(c)).length, color: "var(--cafe-success)" },
                  { key: "birthday_soon", icon: "🎂", label: "Birthday Soon", desc: `Within ${BIRTHDAY_SOON_DAYS} days`, count: customers.filter(c => { const d = daysToBirthday(c); return d != null && d >= 0 && d <= BIRTHDAY_SOON_DAYS; }).length, color: "var(--cafe-purple)" },
                  { key: "high_value_at_risk", icon: "🚨", label: "High Value At Risk", desc: `Spend ₹${AT_RISK_MIN_SPEND.toLocaleString()}+, away ${AT_RISK_MIN_DAYS}+ days`, count: customers.filter(c => { const d = daysSinceVisit(c); return cSpend(c) >= AT_RISK_MIN_SPEND && d != null && d >= AT_RISK_MIN_DAYS; }).length, color: "var(--cafe-danger)" },
                ].map(sl => (
                  <div key={sl.key} onClick={() => { setSmartList(smartList === sl.key ? null : sl.key); setSelected(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: smartList === sl.key ? "var(--cafe-bg-hover)" : "var(--cafe-bg-surface)", border: `1px solid ${smartList === sl.key ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, borderLeft: `4px solid ${smartList === sl.key ? "var(--cafe-accent)" : sl.count > 0 ? sl.color : "var(--cafe-border)"}`, borderRadius: 12, cursor: "pointer", transition: "background .12s, border-color .12s, box-shadow .12s", opacity: sl.count === 0 ? 0.5 : 1, boxShadow: smartList === sl.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{sl.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: smartList === sl.key ? "var(--cafe-accent)" : "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{sl.label}</div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{sl.desc}</div>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: 8, background: sl.count > 0 ? sl.color + "22" : "var(--cafe-bg-hover)", color: sl.count > 0 ? sl.color : "var(--cafe-text-tertiary)", fontSize: 13, fontWeight: 700, fontFamily: "monospace", minWidth: 32, textAlign: "center" }}>{sl.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>🎂 Coming Up</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {upcomingBirthdays.map(c => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const bday = new Date(today.getFullYear(), parseInt(c.birthday.slice(5,7)) - 1, parseInt(c.birthday.slice(8,10)));
                    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                    const diff = Math.round((bday - today) / 86400000);
                    return (
                      <div key={c.id} onClick={() => { setSelected(c.id); setProfileTab("overview"); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--cafe-bg-surface)", borderRadius: 12, cursor: "pointer", border: `1px solid var(--cafe-border-light)`, borderLeft: `4px solid var(--cafe-purple)`, transition: "background .12s, border-color .12s" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--cafe-purple-bg)", border: `1px solid var(--cafe-purple-border)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--cafe-purple)", flexShrink: 0, fontFamily: "monospace" }}>{initials(c.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{diff === 1 ? "Tomorrow!" : `In ${diff} days`}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setBulkSelected(new Set([c.id])); setBulkCommType("WhatsApp"); setBulkCommMsg(`Hi ${cName(c).split(" ")[0]}, wishing you a very happy birthday! 🎂 Come celebrate with us.`); setShowBulkModal(true); }} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 14px", borderRadius: 8, color: "var(--cafe-purple)", borderColor: "var(--cafe-purple-border)" }}>Send 🎁</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Needed */}
            {(() => {
              const actions = [];
              if (atRiskCount > 0) actions.push({ icon: "🚨", text: `${atRiskCount} guests at churn risk`, action: () => setSegmentFilter("AT_RISK"), cta: "View" });
              if (todayBirthdays > 0) actions.push({ icon: "🎂", text: `${todayBirthdays} birthday${todayBirthdays > 1 ? "s" : ""} today — send a treat!`, action: () => setSegmentFilter("BIRTHDAY"), cta: "View" });
              if (actions.length === 0) return null;
              return (
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>⚡ Needs Attention</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {actions.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--cafe-amber-bg)", border: `1px solid var(--cafe-warning-border)`, borderRadius: 12 }}>
                        <span style={{ fontSize: 20 }}>{a.icon}</span>
                        <div style={{ flex: 1, fontSize: 14, color: "var(--cafe-text-primary)" }}>{a.text}</div>
                        <button onClick={a.action} style={{ ...btn("primary"), fontSize: 12, padding: "8px 16px", borderRadius: 8, background: "var(--cafe-warning)", borderColor: "var(--cafe-warning-border)" }}>{a.cta}</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ overflowY: "auto" }}>
            {/* Guest Profile Header */}
            <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid var(--cafe-border-light)` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{
                  width: 72, height: 72,
                  borderRadius: 16,
                  background: profile.customerType && TYPE_MAP[profile.customerType] ? TYPE_MAP[profile.customerType].color + "22" : "var(--cafe-bg-hover)",
                  border: `2px solid ${profile.customerType && TYPE_MAP[profile.customerType] ? TYPE_MAP[profile.customerType].color : "var(--cafe-border-light)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700,
                  color: profile.customerType && TYPE_MAP[profile.customerType] ? TYPE_MAP[profile.customerType].color : "var(--cafe-text-secondary)",
                  flexShrink: 0, fontFamily: "monospace"
                }}>
                  {profile.customerType && TYPE_MAP[profile.customerType] ? TYPE_MAP[profile.customerType].icon : initials(cName(profile))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>{cName(profile)}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {profile.customerType && TYPE_MAP[profile.customerType] && (
                      <span style={{ padding: "5px 12px", borderRadius: 8, background: TYPE_MAP[profile.customerType].color + "22", color: TYPE_MAP[profile.customerType].color, fontSize: 12, fontWeight: 600 }}>{TYPE_MAP[profile.customerType].icon} {TYPE_MAP[profile.customerType].label}</span>
                    )}
                    {isBlocked(profile) && <span style={{ padding: "5px 12px", borderRadius: 8, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: 12, fontWeight: 600 }}>🚫 Blocked</span>}
                    {!isBlocked(profile) && cStatus(profile) === "inactive" && <span style={{ padding: "5px 12px", borderRadius: 8, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-tertiary)", fontSize: 12, fontWeight: 600 }}>Inactive</span>}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>{cPhone(profile) || cEmail(profile) || "No contact info"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={() => openEditModal(profile)} style={{ ...btn("ghost"), fontSize: 14, padding: "10px 18px", borderRadius: 8 }}>Edit Profile</button>
                <button onClick={() => toggleBlocked(profile.id)} style={{ ...btn("ghost"), fontSize: 14, padding: "10px 18px", borderRadius: 8, color: isBlocked(profile) ? "var(--cafe-success)" : "var(--cafe-warning)", borderColor: isBlocked(profile) ? "var(--cafe-success-border)" : "var(--cafe-warning-border)" }}>{isBlocked(profile) ? "Unblock" : "Block"}</button>
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} style={{ ...btn("ghost"), fontSize: 14, padding: "10px 18px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>📞 Call</a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} style={{ ...btn("ghost"), fontSize: 14, padding: "10px 18px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>📧 Email</a>
                )}
                <button onClick={() => deleteCustomer(profile.id)} style={{ ...btn("ghost"), fontSize: 14, padding: "10px 18px", borderRadius: 8, color: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)" }}>Delete</button>
              </div>
            </div>

            {/* Visit Summary */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Visit Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                {[
                  { val: cVisits(profile), lbl: "Total Visits", color: "var(--cafe-text-secondary)" },
                  { val: `₹${cSpend(profile).toLocaleString()}`, lbl: "Total Spend", color: "var(--cafe-accent)" },
                  { val: customerMetrics?.avgOrderValue ? `₹${Math.round(customerMetrics.avgOrderValue)}` : "—", lbl: "Avg Order", color: "var(--cafe-text-secondary)" },
                  { val: profile.lastVisit || "Never", lbl: "Last Visit", color: "var(--cafe-text-secondary)" },
                ].map(s => (
                  <div key={s.lbl} style={{ background: "var(--cafe-bg-hover)", borderRadius: 12, padding: "16px 12px", border: `1px solid var(--cafe-border-light)` }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: s.color, letterSpacing: "-0.01em" }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              {customerMetrics?.favoriteItem && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--cafe-accent-bg)", border: `1px solid var(--cafe-accent-border)`, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Favorite Item</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)", fontWeight: 600 }}>{customerMetrics.favoriteItem}</div>
                </div>
              )}
            </div>

            {/* Duplicate Warning */}
            {(() => {
              const dup = findDuplicateOf(profile);
              if (!dup) return null;
              return (
                <div style={{ marginBottom: 24, padding: "14px 16px", background: "var(--cafe-amber-bg)", border: `1px solid var(--cafe-warning-border)`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <div style={{ fontSize: 11, color: "var(--cafe-warning)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Possible Duplicate Found</div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                    This guest may be the same as <strong>{cName(dup)}</strong> ({cPhone(dup) || cEmail(dup) || "same contact info"})
                  </div>
                  <button onClick={() => mergeCustomers(profile.id, dup.id)} style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid var(--cafe-warning-border)`, background: "var(--cafe-warning)", color: "#1A1208", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                    ⇄ Merge Profiles
                  </button>
                </div>
              );
            })()}

            {/* Dietary & Allergy Notes */}
            {(profile.allergy || profile.dietTags) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Dietary Notes</div>
                {profile.allergy && (
                  <div style={{ padding: "14px 16px", background: "var(--cafe-danger-bg)", border: `1px solid var(--cafe-danger-border)`, borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-danger)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>⚠️ Allergies</div>
                    <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{profile.allergy}</div>
                  </div>
                )}
                {profile.dietTags && (
                  <div style={{ padding: "14px 16px", background: "var(--cafe-success-bg)", border: `1px solid var(--cafe-success-border)`, borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-success)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Dietary Preferences</div>
                    <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{profile.dietTags}</div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Notes</div>
              <div style={{ background: "var(--cafe-bg-hover)", borderRadius: 12, padding: "16px", border: `1px solid var(--cafe-border-light)` }}>
                <textarea
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "vertical", minHeight: 100, fontSize: 14, color: "var(--cafe-text-primary)", fontFamily: "inherit", lineHeight: 1.5 }}
                  placeholder="Add notes about this guest..."
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button onClick={updateNote} style={{ ...btn("primary"), fontSize: 13, padding: "10px 18px", borderRadius: 8 }}>Save Notes</button>
                </div>
              </div>
            </div>

            {/* Log a manual visit (e.g. a walk-in order taken outside the POS) */}
            <LogVisit profile={profile} addVisitEntry={addVisitEntry} />

            {/* Recent Orders */}
            {hist.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Recent Orders</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hist.slice(0, 10).map((order, i) => (
                    <div key={order.id || i} style={{ padding: "14px 16px", background: "var(--cafe-bg-hover)", borderRadius: 12, border: `1px solid var(--cafe-border-light)`, borderLeft: `4px solid ${order.status === "COMPLETED" ? "var(--cafe-success)" : order.status === "CANCELLED" ? "var(--cafe-danger)" : "var(--cafe-warning)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{order._label || getOrderDisplayItems(order)}</div>
                        <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--cafe-accent)", fontWeight: 700 }}>₹{order.total?.toLocaleString() || order.amt?.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        /* eslint-disable-next-line react-hooks/purity */
                              <span>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
                        <span>{order.status}</span>
                        {order._manual && <span>Manual entry</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents && documents.length > 0 && (() => {
              const customerDocs = documents.filter(d =>
                d.customerId === profile.id ||
                (d.customerPhone && d.customerPhone === profile.phone) ||
                (d.customerName && d.customerName === profile.name)
              );
              if (customerDocs.length === 0) return null;

              return (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Documents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {customerDocs.slice(0, 5).map((doc, i) => (
                      <div key={doc.id || i} style={{ padding: "14px 16px", background: "var(--cafe-bg-hover)", borderRadius: 12, border: `1px solid var(--cafe-border-light)`, borderLeft: `4px solid ${doc.receiptNumber ? "var(--cafe-success)" : doc.invoiceNumber ? "var(--cafe-accent)" : doc.creditNoteNumber ? "var(--cafe-warning)" : "var(--cafe-purple)"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                            {doc.receiptNumber ? `Receipt: ${doc.receiptNumber}` : doc.invoiceNumber ? `Invoice: ${doc.invoiceNumber}` : doc.paymentReceiptNumber ? `Payment: ${doc.paymentReceiptNumber}` : `Credit: ${doc.creditNoteNumber}`}
                          </div>
                          <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--cafe-accent)", fontWeight: 700 }}>
                            ₹{doc.total?.toLocaleString() || doc.amountReceived?.toLocaleString() || doc.refundAmount?.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                          <span>{new Date(doc.issuedAt || doc.createdAt).toLocaleDateString()}</span>
                          <span>{doc.paymentStatus || doc.status || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Communication Log */}
            {cCommLog(profile).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "monospace", fontWeight: 700 }}>Communication Log</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cCommLog(profile).slice(0, 5).map((log, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: "var(--cafe-bg-hover)", borderRadius: 12, border: `1px solid var(--cafe-border-light)` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>{commIcon(log.type)} {log.type}</span>
                        <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Guest Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--cafe-bg-card)", border: `1px solid var(--cafe-border-light)`, borderRadius: 16, padding: 28, width: "min(420px, 92vw)", boxShadow: "var(--cafe-shadow-lg)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--cafe-text-primary)" }}>{editMode ? "Edit Guest" : "Add New Guest"}</div>
              <button aria-label="Close" onClick={() => setShowModal(false)} style={{ cursor: "pointer", color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-hover)", border: `1px solid var(--cafe-border-light)`, borderRadius: 8, fontSize: 18, lineHeight: 1, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Basic Info Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>Basic Info</div>
              {[
                { lbl: "Name *", val: modalData.name, set: (v) => setModalData({...modalData, name: v}), ph: "Full name", type: "text" },
                { lbl: "Phone", val: modalData.phone, set: (v) => setModalData({...modalData, phone: v}), ph: "10-digit number", type: "tel" },
                { lbl: "Email", val: modalData.email, set: (v) => setModalData({...modalData, email: v}), ph: "email@example.com", type: "email" },
              ].map(f => (
                <div key={f.lbl} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>{f.lbl}</label>
                  <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.15s" }} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
                </div>
              ))}
            </div>

            {/* Preferences Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>Preferences</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Birthday</label>
                  <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} type="date" value={modalData.birthday} onChange={e => setModalData({...modalData, birthday: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Guest Type</label>
                  <select style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} value={modalData.customerType} onChange={e => setModalData({...modalData, customerType: e.target.value})}>
                    <option value="">— Select —</option>
                    {CUSTOMER_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Allergies / Dietary Notes</label>
                <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} value={modalData.allergy} onChange={e => setModalData({...modalData, allergy: e.target.value})} placeholder="e.g. Nuts, Dairy, Gluten-free" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Tags</label>
                <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} value={modalData.tags} onChange={e => setModalData({...modalData, tags: e.target.value})} placeholder="Regular, Corporate, VIP…" />
              </div>
            </div>

            {/* Status & Contact Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>Status & Contact</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Status</label>
                  <select style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} value={CUSTOMER_STATUSES.includes(modalData.status) ? modalData.status : "active"} onChange={e => setModalData({...modalData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Preferred Channel</label>
                  <select style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none" }} value={PREFERRED_CHANNELS.includes(modalData.preferredChannel) ? modalData.preferredChannel : "None"} onChange={e => setModalData({...modalData, preferredChannel: e.target.value})}>
                    {PREFERRED_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 10, display: "block", fontWeight: 500 }}>Consent to Contact</label>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {CONSENT_FIELDS.map(f => (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
                      <input type="checkbox" checked={!!modalData[f.key]} onChange={e => setModalData({...modalData, [f.key]: e.target.checked})} />
                      {f.lbl}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button style={{ padding: "12px 22px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: 14, cursor: "pointer", fontWeight: 500 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ padding: "12px 22px", borderRadius: 10, border: `1px solid var(--cafe-accent-border)`, background: "var(--cafe-accent)", color: "#1A1208", fontSize: 14, cursor: "pointer", fontWeight: 600 }} onClick={saveModal}>{editMode ? "Save Changes" : "Add Guest"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Communication Modal */}
      {showBulkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowBulkModal(false)}>
          <div style={{ background: "var(--cafe-bg-card)", border: `1px solid var(--cafe-border-light)`, borderRadius: 16, padding: 28, width: "min(440px, 92vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--cafe-text-primary)" }}>Message {bulkSelected.size} {bulkSelected.size === 1 ? "guest" : "guests"}</div>
              <button onClick={() => setShowBulkModal(false)} style={{ cursor: "pointer", color: "var(--cafe-text-tertiary)", background: "none", border: "none", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: "var(--cafe-bg-hover)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 14, color: "var(--cafe-text-secondary)" }}>
              {[...bulkSelected].map(id => customers.find(c => c.id === id)?.name).filter(Boolean).join(", ")}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {COMM_TYPES.map(t => (
                <button key={t} onClick={() => setBulkCommType(t)} style={{ flex: "1 1 auto", minWidth: 80, padding: "10px 14px", borderRadius: 10, border: `1px solid ${bulkCommType === t ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, background: bulkCommType === t ? "var(--cafe-accent-bg)" : "transparent", color: bulkCommType === t ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                  {commIcon(t)} {t}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
              {(() => {
                const sel = customers.filter(c => bulkSelected.has(c.id));
                const isInternal = bulkCommType === "Internal Note";
                const eligibleCount = sel.filter(c => (isInternal || !isBlocked(c)) && (!commNeedsEmail(bulkCommType) || !!cEmail(c)) && (!commNeedsPhone(bulkCommType) || !!cPhone(c)) && (isInternal || !channelRequiresConsent(bulkCommType) || hasConsentFor(c, bulkCommType))).length;
                const skipped = sel.length - eligibleCount;
                return <span>{eligibleCount} eligible{skipped > 0 ? `, ${skipped} will be skipped` : ""}</span>;
              })()}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "🎂 Birthday", msg: "Hi! Happy birthday from all of us — enjoy a special treat on your next visit 🎂" },
                { label: "🔄 Come Back", msg: "Hi! We miss you at the café — come back soon and enjoy a special treat on us." },
                { label: "📝 Review", msg: "Hi! Thanks for being a regular — we'd love it if you could leave us a quick review." },
              ].map(t => (
                <button key={t.label} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: 13, cursor: "pointer" }} onClick={() => setBulkCommMsg(t.msg)}>{t.label}</button>
              ))}
            </div>
            <textarea style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6, marginBottom: 20 }} rows={4} maxLength={1000} placeholder="Type your message…" value={bulkCommMsg} onChange={e => setBulkCommMsg(e.target.value)} />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button style={{ padding: "12px 22px", borderRadius: 10, border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: 14, cursor: "pointer", fontWeight: 500 }} onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button style={{ padding: "12px 22px", borderRadius: 10, border: `1px solid var(--cafe-accent-border)`, background: "var(--cafe-accent)", color: "#1A1208", fontSize: 14, cursor: "pointer", fontWeight: 600 }} onClick={sendBulkComm} disabled={!bulkCommMsg.trim()}>Send Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 28, left: "50%", transform: "translateX(-50%)", background: "var(--cafe-bg-hover)", border: `1px solid ${toast.color}55`, color: toast.color, borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 600, zIndex: 200, pointerEvents: "none", boxShadow: "var(--cafe-shadow-lg)", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
          {toast.msg}
        </div>
      )}

      {/* Dialogs */}
      <ConflictDialog
        open={mergeDialog.open}
        onClose={() => setMergeDialog({ open: false, primary: null, duplicate: null, onConfirm: null })}
        onResolve={mergeDialog.onConfirm}
        title="Merge Customer Records"
        description="Combine duplicate customer profiles into one."
        conflictType="duplicate"
        currentRecord={mergeDialog.primary ? {
          Name: cName(mergeDialog.primary),
          Phone: cPhone(mergeDialog.primary) || "—",
          Email: cEmail(mergeDialog.primary) || "—",
          Visits: cVisits(mergeDialog.primary),
          Spend: `₹${cSpend(mergeDialog.primary)}`
        } : null}
        incomingRecord={mergeDialog.duplicate ? {
          Name: cName(mergeDialog.duplicate),
          Phone: cPhone(mergeDialog.duplicate) || "—",
          Email: cEmail(mergeDialog.duplicate) || "—",
          Visits: cVisits(mergeDialog.duplicate),
          Spend: `₹${cSpend(mergeDialog.duplicate)}`
        } : null}
      />

      <DestructiveDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, customer: null, onConfirm: null })}
        onConfirm={deleteDialog.onConfirm}
        title="Delete Customer"
        description="This action cannot be undone."
        recordName={cName(deleteDialog.customer)}
        consequence={deleteDialog.hasOrderHistory 
          ? "Past orders will still reference this customer in order history. Deleting the customer profile does not remove those orders."
          : "This customer will be permanently removed from the guest book."
        }
        confirmLabel="Delete Customer"
      />

      <WarningDialog
        open={blockDialog.open}
        onClose={() => setBlockDialog({ open: false, customer: null, onConfirm: null })}
        onConfirm={blockDialog.onConfirm}
        title="Block Customer"
        description="This customer will be excluded from bulk communication."
        warning={`Mark "${cName(blockDialog.customer)}" as blocked?`}
        consequence="Blocked customers will not receive bulk messages or communications."
        confirmLabel="Block Customer"
      />

      <WarningDialog
        open={anonymizeDialog.open}
        onClose={() => setAnonymizeDialog({ open: false, customer: null, onConfirm: null })}
        onConfirm={anonymizeDialog.onConfirm}
        title="Anonymize Customer"
        description="This clears personal data but keeps analytics history."
        warning={`Anonymize "${cName(anonymizeDialog.customer)}"?`}
        consequence="Name, phone, email, birthday, allergy, and notes will be cleared. Spend/visit history and order links will be retained for analytics. This cannot be undone."
        confirmLabel="Anonymize Customer"
      />

      <ConfirmDialog
        open={bulkCommDialog.open}
        onClose={() => setBulkCommDialog({ open: false, count: 0, skipped: 0, reasons: [], onConfirm: null })}
        onConfirm={bulkCommDialog.onConfirm}
        title="Log Bulk Communication"
        description={`Log message for ${bulkCommDialog.count} customer${bulkCommDialog.count !== 1 ? "s" : ""}.`}
        summary={bulkCommDialog.skipped > 0 
          ? `${bulkCommDialog.skipped} customer(s) will be skipped: ${bulkCommDialog.reasons.join(", ")}.`
          : null
        }
        confirmLabel="Log Message"
      />

      <PermissionDeniedDialog
        open={permissionDeniedDialog.open}
        onClose={() => setPermissionDeniedDialog({ ...permissionDeniedDialog, open: false })}
        action={permissionDeniedDialog.action}
        requiredPermission={permissionDeniedDialog.requiredPermission}
        currentRole={permissionDeniedDialog.currentRole}
        contactMessage="Contact a manager or owner for access to manage customers."
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "var(--cafe-bg-card)", borderTop: `1px solid var(--cafe-border-light)`, display: "flex", alignItems: "stretch", zIndex: 150, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { icon: "👥", label: "Guests", action: () => setSelected(null), active: !selected },
            { icon: "＋", label: "Add", action: openAddModal, active: false, highlight: true },
            { icon: "📊", label: "Overview", action: () => { setSelected(null); setSmartList(null); setSegmentFilter("ALL"); setTypeFilter("ALL"); }, active: false },
            { icon: "⬇", label: "Export", action: exportCSV, active: false },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: item.highlight ? "var(--cafe-accent-bg)" : "transparent", border: "none", cursor: "pointer", color: item.active ? "var(--cafe-accent)" : item.highlight ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontSize: 11, fontWeight: item.active || item.highlight ? 700 : 400, borderTop: item.active ? `2px solid var(--cafe-accent)` : "2px solid transparent", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <span style={{ fontSize: item.highlight ? 22 : 18, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CRM;
