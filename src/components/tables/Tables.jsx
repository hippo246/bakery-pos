import React from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_TABLES, TABLE_TYPES, TABLE_AREAS, TABLE_STATUS } from "../../data/tableConstants";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";
import PromptDialog from "../common/PromptDialog";
import { triggerTableNotification } from "../../utils/notificationTriggers.js";
import { saveNotifications } from "../../utils/notificationService.js";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";
import InteractiveFloorPlan from "./InteractiveFloorPlan.jsx";
import TableSearch from "./TableSearch.jsx";
import OrderProgressTimeline from "./OrderProgressTimeline.jsx";
import FloorAnalyticsDashboard from "./FloorAnalyticsDashboard.jsx";

// ── Status config ────────────────────────────────────────────────────────────
import TableDetailsPanel from "./TableDetailsPanel";

const STATUS_CFG = {
  available: { bg: C.greenBg, color: C.green, label: "Available" },
  occupied:  { bg: C.redBg,   color: C.red,   label: "Occupied"  },
  reserved:  { bg: C.amberBg, color: C.amber, label: "Reserved"  },
  cleaning:  { bg: C.blueBg,  color: C.blue,  label: "Cleaning"  },
};

// ── Capacity guard rails per table type ──────────────────────────────────────
// Soft limits — flag unusual capacity for a given type, don't hard-block it.
const CAPACITY_GUIDE = {
  indoor:  { min: 1, max: 12 },
  outdoor: { min: 1, max: 8  },
  booth:   { min: 2, max: 6  },
  bar:     { min: 1, max: 4  },
  private: { min: 4, max: 20 },
};
function capacityGuide(type) {
  return CAPACITY_GUIDE[type] || { min: 1, max: 20 };
}

// ── Safe primitives — never let a malformed field surface as NaN/undefined ──
function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function safeText(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s === "undefined" || s === "null" ? fallback : s;
}
function formatOccupancyDuration(sinceValue) {
  if (!sinceValue) return null;
  const start = new Date(sinceValue).getTime();
  if (!Number.isFinite(start)) return "—";
  const mins = Math.floor((Date.now() - start) / 60000);
  return !Number.isFinite(mins) || mins < 0 ? "—" : mins;
}

// ── Inline modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 380 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--cafe-bg-card)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-lg)", padding: "24px 24px 28px", width: `min(${width}px,95vw)`, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--cafe-shadow-lg)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--cafe-text-primary)" }}>{title}</div>
          <button onClick={onClose} style={{ background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, color: "var(--cafe-text-tertiary)", fontSize: 14, cursor: "pointer", lineHeight: 1, padding: "6px 10px", borderRadius: "var(--cafe-radius-sm)", fontWeight: 600 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Validation error ─────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{msg}</div>;
}

// ── Filter pill button ───────────────────────────────────────────────────────
function FilterBtn({ label: lbl, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", height: 30,
        border: `1px solid ${active ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
        background: active ? "var(--cafe-accent-bg)" : "transparent",
        color: active ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
        display: "flex", alignItems: "center", gap: 5, transition: "all .15s", whiteSpace: "nowrap",
      }}
    >
      {lbl}
      {count != null && (
        <span style={{ fontSize: 10, background: active ? "var(--cafe-accent)" : "var(--cafe-bg-surface)", color: active ? "#1A1208" : "var(--cafe-text-tertiary)", padding: "1px 6px", borderRadius: 20, fontWeight: 600, minWidth: 18, textAlign: "center" }}>{count}</span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Tables({ tables: externalTables, setTables: externalSetTables, notifications, setNotifications, orders, kdsCards, staff, waitlist, setWaitlist, onOpenPOS, onViewKitchen }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  // Live-updating clock — occupancy duration and cleaning countdown are derived from Date.now(),
  // so without this they'd only refresh when some unrelated state change happened to re-render.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const [localTables, setLocalTables] = useState(() => (Array.isArray(externalTables) ? externalTables : INIT_TABLES) || []);

  // Keep local state in sync if parent updates externally
  useEffect(() => {
    if (Array.isArray(externalTables)) setLocalTables(externalTables);
  }, [externalTables]);

  // Never let a malformed/null tables array reach rendering or logic below.
  const tables = Array.isArray(localTables) ? localTables : [];
  const handleSetTables = useCallback((next) => {
    setLocalTables(next);
    if (externalSetTables) externalSetTables(next);
  }, [externalSetTables]);

  // ── Filter state ────────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [detailsPanelTableId, setDetailsPanelTableId] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "floor"

  // ── Modal state ─────────────────────────────────────────────────────────
  // ── Waitlist state ───────────────────────────────────────────────────────
  // Waitlist state is hoisted
  const [waitlistForm, setWaitlistForm] = useState({ name: "", phone: "", partySize: "", notes: "" });
  const [waitlistErrors, setWaitlistErrors] = useState({});

  // ── Table transfer state ─────────────────────────────────────────────────
  const [transferSourceId, setTransferSourceId] = useState(null);
  const [transferDestId, setTransferDestId] = useState("");
  const [transferError, setTransferError] = useState("");

  const [modal, setModal] = useState(null); // null | "addEdit" | "reserve" | "assign" | "waiter" | "splitBill" | "history" | "reservations" | "waitlist" | "transfer" | "rotationStrategies" | "floorAnalytics"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ number: "", capacity: "", type: "indoor", area: "main", notes: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formWarnings, setFormWarnings] = useState({});
  const [reserveForm, setReserveForm] = useState({ name: "", date: "", time: "", phone: "", partySize: "", notes: "" });
  const [reserveErrors, setReserveErrors] = useState({});
  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignError, setAssignError] = useState("");
  const [modalTableId, setModalTableId] = useState(null);

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [reservationConflictDialog, setReservationConflictDialog] = useState({ open: false, table: null, existingReservation: null, onConfirm: null });
  const [capacityWarningDialog, setCapacityWarningDialog] = useState({ open: false, table: null, partySize: null, capacity: null, onConfirm: null });
  const [orderConflictDialog, setOrderConflictDialog] = useState({ open: false, orderId: null, conflictTable: null, onConfirm: null });
  const [reassignDialog, setReassignDialog] = useState({ open: false, table: null, orderId: null, onConfirm: null });
  const [clearTableDialog, setClearTableDialog] = useState({ open: false, table: null, onConfirm: null });
  const [deleteTableDialog, setDeleteTableDialog] = useState({ open: false, table: null, onConfirm: null });
  const [mergeWarningDialog, setMergeWarningDialog] = useState({ open: false, skipped: null, remaining: null, onConfirm: null });
  const [mergeErrorDialog, setMergeErrorDialog] = useState({ open: false, message: null });
  const [removeWaiterDialog, setRemoveWaiterDialog] = useState({ open: false, table: null, waiterName: null, onConfirm: null });
  const [transferWarningDialog, setTransferWarningDialog] = useState({ open: false, destTable: null, onConfirm: null });
  const [waitlistSeatDialog, setWaitlistSeatDialog] = useState({ open: false, table: null, guestName: null, onConfirm: null });
  const [cancelWaitlistDialog, setCancelWaitlistDialog] = useState({ open: false, guestName: null, onConfirm: null });
  const [splitMergedDialog, setSplitMergedDialog] = useState({ open: false, groupId: null, groupNumbers: [], onConfirm: null });

  // ── Merge / combine tables state ─────────────────────────────────────────
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState([]); // array of table ids being combined

  const toggleMergeMode = useCallback(() => {
    setMergeMode(prev => !prev);
    setMergeSelection([]);
  }, []);

  // ── Waiter assignment state ──────────────────────────────────────────────
  const [waiters] = useState([
    { id: "w1", name: "Ravi Kumar", active: true },
    { id: "w2", name: "Priya Singh", active: true },
    { id: "w3", name: "Amit Sharma", active: true },
    { id: "w4", name: "Deepa Nair", active: true },
    { id: "w5", name: "Rahul Patel", active: true },
    { id: "w6", name: "Suresh Kumar", active: true },
  ]);
  const [waiterForm, setWaiterForm] = useState({ waiterId: "" });

  // ── Occupancy history (per-session) ──────────────────────────────────────
  const [history, setHistory] = useState([]); // { tableId, tableNumber, event, at, detail }

  const addHistory = useCallback((tableId, tableNumber, event, detail = "") => {
    setHistory(prev => [{ id: Date.now(), tableId, tableNumber, event, detail, at: new Date().toISOString() }, ...prev].slice(0, 50));
  }, []);

  // Calculate waiter load (tables assigned, orders remaining)
  const getWaiterLoad = useCallback((waiterId) => {
    const assignedTables = tables.filter(t => t.waiter?.id === waiterId);
    const ordersPending = assignedTables.filter(t => t.status === "occupied" && (t.currentOrder || t.currentOrderId)).length;
    return {
      tablesAssigned: assignedTables.length,
      ordersPending,
      overloaded: assignedTables.length > 5
    };
  }, [tables]);

  // Auto-assign waiter based on workload (least loaded first)
  const getAutoSuggestedWaiter = useCallback(() => {
    const activeWaiters = waiters.filter(w => w.active);
    if (activeWaiters.length === 0) return null;
    
    // Sort by current workload (tables assigned + orders pending)
    const sorted = activeWaiters.map(w => ({
      waiter: w,
      load: getWaiterLoad(w.id)
    })).sort((a, b) => {
      const aScore = a.load.tablesAssigned + a.load.ordersPending * 2;
      const bScore = b.load.tablesAssigned + b.load.ordersPending * 2;
      return aScore - bScore;
    });
    
    return sorted[0].waiter;
  }, [waiters, getWaiterLoad]);

  // Calculate average turn time per table from history
  const getTableTurnTime = useCallback((tableId) => {
    const tableHistory = history.filter(h => h.tableId === tableId && h.event === "Available");
    if (tableHistory.length < 2) return null;
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 0; i < tableHistory.length - 1; i++) {
      const current = tableHistory[i];
      const next = tableHistory[i + 1];
      
      // Look for the corresponding "Occupied" event before this "Available"
      const occupiedEvent = history.find(h => 
        h.tableId === tableId && 
        h.event === "Occupied" && 
        new Date(h.at) < new Date(current.at) &&
        (!history.find(h2 => h2.tableId === tableId && h2.event === "Occupied" && new Date(h2.at) > new Date(current.at)))
      );
      
      if (occupiedEvent) {
        const duration = (new Date(current.at) - new Date(occupiedEvent.at)) / 60000; // minutes
        if (duration > 0 && duration < 300) { // Filter out unrealistic values (> 5 hours)
          totalTime += duration;
          count++;
        }
      }
    }
    
    return count > 0 ? Math.round(totalTime / count) : null;
  }, [history]);

  // Suggest table rotation strategies based on performance
  const getRotationStrategies = useCallback(() => {
    const availableTables = tables.filter(t => t.status === "available");
    if (availableTables.length === 0) return [];
    
    const withTurnTimes = availableTables.map(t => ({
      table: t,
      turnTime: getTableTurnTime(t.id)
    })).filter(t => t.turnTime !== null);
    
    // Sort by turn time (fastest first)
    const sorted = withTurnTimes.sort((a, b) => a.turnTime - b.turnTime);
    
    // Generate strategies
    const strategies = [];
    
    // Strategy 1: Prioritize fast-turning tables
    if (sorted.length > 0) {
      const fastest = sorted.slice(0, Math.min(3, sorted.length));
      strategies.push({
        type: "prioritize_fast",
        title: "Prioritize Fast Tables",
        description: `Seat guests at ${fastest.map(f => `#${f.table.number}`).join(", ")} first for higher turnover`,
        tables: fastest.map(f => f.table.id)
      });
    }
    
    // Strategy 2: Avoid slow tables during rush
    const slowTables = sorted.filter(s => s.turnTime > 90);
    if (slowTables.length > 0) {
      strategies.push({
        type: "avoid_slow",
        title: "Avoid Slow Tables During Rush",
        description: `Tables ${slowTables.map(s => `#${s.table.number}`).join(", ")} have >90min average turn time`,
        tables: slowTables.map(s => s.table.id)
      });
    }
    
    // Strategy 3: Balance by area
    const areas = [...new Set(availableTables.map(t => t.area))];
    if (areas.length > 1) {
      strategies.push({
        type: "balance_areas",
        title: "Balance by Area",
        description: `Distribute seating across ${areas.join(", ")} to avoid server congestion`,
        tables: []
      });
    }
    
    return strategies;
  }, [tables, getTableTurnTime]);

  // ── Split bill state ──────────────────────────────────────────────────────
  const [splitForm, setSplitForm] = useState({ ways: 2, method: "equal", customAmounts: [] });
  const [splitError, setSplitError] = useState("");

  // Click-outside deselect
  const gridRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (gridRef.current && !gridRef.current.contains(e.target)) {
        setSelectedId(null);
        setActionMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // If the selected table was deleted/no longer exists, clear the selection.
  useEffect(() => {
    if (selectedId && !tables.some(t => t.id === selectedId)) setSelectedId(null);
  }, [tables, selectedId]);

  // If the modal's target table disappears (deleted while modal is open), close the modal.
  useEffect(() => {
    if (modalTableId && modal && !tables.some(t => t.id === modalTableId)) {
      setModal(null);
      setModalTableId(null);
    }
  }, [tables, modalTableId, modal]);

  // ── Derived data ────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { const s = t?.status || "available"; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [tables]);

  const typeCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { if (t?.type) c[t.type] = (c[t.type] || 0) + 1; });
    return c;
  }, [tables]);

  const areaCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { if (t?.area) c[t.area] = (c[t.area] || 0) + 1; });
    return c;
  }, [tables]);

  const filtered = useMemo(() => tables.filter(t => {
    if (!t) return false;
    if (typeFilter !== "All" && t.type !== typeFilter) return false;
    if (areaFilter !== "All" && t.area !== areaFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  }), [tables, typeFilter, areaFilter, statusFilter]);

  const availableCount = statusCounts.available || 0;
  const occupiedCount  = statusCounts.occupied  || 0;
  const reservedCount  = statusCounts.reserved  || 0;
  const totalCapacity  = useMemo(() => tables.reduce((s, t) => s + safeNumber(t?.capacity, 0), 0), [tables]);
  const occupancyRate  = tables.length === 0 ? 0 : Math.round((occupiedCount / tables.length) * 100);

  // ── Add / Edit table ────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditId(null);
    setForm({ 
      number: "", 
      capacity: "", 
      type: "indoor", 
      area: "main", 
      notes: "",
      shape: "rect",
      rotation: "0",
      width: "80",
      height: "80",
      layer: "0",
      visible: true
    });
    setFormErrors({});
    setFormWarnings({});
    setModal("addEdit");
  }, []);

  const openEdit = useCallback((table) => {
    if (!table) return;
    setEditId(table.id);
    setForm({
      number: table.number != null ? String(table.number) : "",
      capacity: table.capacity != null ? String(table.capacity) : "",
      type: table.type || "indoor",
      area: table.area || "main",
      notes: table.notes || "",
      shape: table.shape || "rect",
      rotation: table.rotation != null ? String(table.rotation) : "0",
      width: table.dimensions?.width != null ? String(table.dimensions.width) : "80",
      height: table.dimensions?.height != null ? String(table.dimensions.height) : "80",
      layer: table.layer != null ? String(table.layer) : "0",
      visible: table.visible !== false,
    });
    setFormErrors({});
    setFormWarnings({});
    setModal("addEdit");
  }, []);

  // Live warnings (non-blocking) — recomputed whenever the form changes.
  const computeFormWarnings = useCallback((f) => {
    const warnings = {};
    const cap = Number(f.capacity);
    if (f.capacity.trim() && !isNaN(cap)) {
      const guide = capacityGuide(f.type);
      if (cap < guide.min) warnings.capacity = `Unusual for ${f.type}: most have ${guide.min}+ seats`;
      else if (cap > guide.max) warnings.capacity = `Unusual for ${f.type}: most cap out around ${guide.max} seats`;
    }
    return warnings;
  }, []);

  useEffect(() => {
    setFormWarnings(computeFormWarnings(form));
  }, [form, computeFormWarnings]);

  const editingTable = useMemo(() => (editId ? tables.find(t => t.id === editId) : null), [editId, tables]);
  const editingIsLocked = !!editingTable && (editingTable.status === "occupied" || editingTable.status === "reserved");

  const saveTable = useCallback(() => {
    const errors = {};
    const numVal = Number(form.number);
    if (!form.number.trim()) errors.number = "Required";
    else if (isNaN(numVal) || numVal < 1) errors.number = "Must be a positive number";
    else {
      const dupe = tables.find(t => safeNumber(t?.number, NaN) === numVal && t.id !== editId);
      if (dupe) errors.number = `Table #${numVal} already exists`;
    }
    if (!form.capacity.trim()) errors.capacity = "Required";
    else if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) errors.capacity = "Must be a number greater than 0";
    if (!form.type) errors.type = "Required";
    if (!form.area) errors.area = "Required";
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    const now = new Date().toISOString();
    const tableData = {
      number: numVal,
      capacity: Number(form.capacity),
      type: form.type,
      area: form.area,
      notes: form.notes.trim() || null,
      shape: form.shape || "rect",
      rotation: Number(form.rotation) || 0,
      dimensions: {
        width: Number(form.width) || 80,
        height: Number(form.height) || 80
      },
      layer: Number(form.layer) || 0,
      visible: form.visible !== false,
    };
    if (editId) {
      // Preserve id and all other existing fields; never mutate the original object/array in place.
      handleSetTables(tables.map(t => t.id === editId ? { ...t, ...tableData, updatedAt: now } : t));
    } else {
      // Cascade across a loose grid (same 100px spacing / 6 columns
      // InteractiveFloorPlan's own handleAddTable uses) instead of always
      // dropping the table at (0,0), so newly added tables don't stack
      // invisibly on top of whatever's already sitting there.
      const cascadeIndex = tables.length;
      handleSetTables([
        ...tables,
        { 
          ...tableData, 
          id: "tbl-" + Date.now(), 
          status: "available", 
          currentOrder: null, 
          position: {
            x: 60 + (cascadeIndex % 6) * 100,
            y: 60 + Math.floor(cascadeIndex / 6) * 100
          },
          createdAt: now, 
          updatedAt: now 
        },
      ]);
    }
    setModal(null);
  }, [form, editId, tables, handleSetTables]);

  // ── Reserve ─────────────────────────────────────────────────────────────
  const openReserve = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    setModalTableId(tableId);
    // Editing an existing reservation should re-populate it; otherwise start blank.
    setReserveForm(table && table.status === "reserved"
      ? {
        name: table.reservedFor || "",
        date: table.reservedDate || "",
        time: table.reservedTime || "",
        phone: table.reservedPhone || "",
        partySize: table.reservedPartySize != null ? String(table.reservedPartySize) : "",
        notes: table.reservedNotes || "",
      }
      : { name: "", date: "", time: "", phone: "", partySize: "", notes: "" });
    setReserveErrors({});
    setModal("reserve");
  }, [tables]);

  // Auto-suggest tables based on party size and availability
  const getSuggestedTables = useCallback((partySize) => {
    const size = Number(partySize);
    if (!size || size < 1) return [];
    
    return tables
      .filter(t => t.status === "available" && t.capacity >= size)
      .sort((a, b) => {
        // Prefer tables with capacity closest to party size (not oversized)
        const aDiff = a.capacity - size;
        const bDiff = b.capacity - size;
        if (aDiff !== bDiff) return aDiff - bDiff;
        // Then prefer same type/area if available
        return a.capacity - b.capacity;
      })
      .slice(0, 5); // Top 5 suggestions
  }, [tables]);

  // Check for reservation conflicts across all tables
  const checkReservationConflicts = useCallback((date, time, partySize, excludeTableId = null) => {
    const conflicts = [];
    const newStart = new Date(`${date}T${time}`);
    const newEnd = new Date(newStart.getTime() + 2 * 60 * 60 * 1000); // Assume 2-hour reservation window
    
    tables.forEach(table => {
      if (table.status === "reserved" && table.id !== excludeTableId && table.reservedDate && table.reservedTime) {
        const existingStart = new Date(`${table.reservedDate}T${table.reservedTime}`);
        const existingEnd = new Date(existingStart.getTime() + 2 * 60 * 60 * 1000);
        
        // Check for overlap
        if (newStart < existingEnd && newEnd > existingStart) {
          conflicts.push({
            table,
            overlapMinutes: Math.round((Math.min(newEnd, existingEnd) - Math.max(newStart, existingStart)) / 60000)
          });
        }
      }
    });
    
    return conflicts;
  }, [tables]);

  // Helper to proceed with reservation after conflict confirmation
  const proceedWithReservation = useCallback((name, phone, partySize, table) => {
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === modalTableId
      ? {
        ...t,
        status: "reserved",
        reservedFor: name,
        reservedDate: reserveForm.date,
        reservedTime: reserveForm.time,
        reservedPhone: phone || null,
        reservedPartySize: partySize,
        reservedNotes: (reserveForm.notes || "").trim() || null,
        updatedAt: now,
      }
      : t
    ));

    moduleEventPublisher.publishTableEvent('table.reserved', {
      tableId: modalTableId,
      customerName: name,
      date: reserveForm.date,
      time: reserveForm.time,
      partySize: partySize
    });

    addHistory(modalTableId, table?.number, "Reserved", `${name} · ${reserveForm.date} ${reserveForm.time}${partySize ? ` · Party of ${partySize}` : ""}`);
    setModal(null);
  }, [reserveForm, modalTableId, tables, handleSetTables, addHistory]);

  const saveReserve = useCallback(() => {
    const errors = {};
    const name = (reserveForm.name || "").trim();
    if (!name) errors.name = "Required";

    const phone = (reserveForm.phone || "").trim();
    if (phone && !/^[0-9+\-\s()]{6,20}$/.test(phone)) errors.phone = "Enter a valid phone number";

    let partySize = null;
    if (reserveForm.partySize !== "" && reserveForm.partySize != null) {
      partySize = Number(reserveForm.partySize);
      if (isNaN(partySize) || partySize < 1) errors.partySize = "Must be a number greater than 0";
    }

    if (!reserveForm.date) errors.date = "Required";
    if (!reserveForm.time) errors.time = "Required";

    if (reserveForm.date && reserveForm.time && !errors.date && !errors.time) {
      const when = new Date(`${reserveForm.date}T${reserveForm.time}`);
      if (isNaN(when.getTime())) errors.date = "Invalid date/time";
      else if (when.getTime() < Date.now()) errors.date = "Cannot reserve a time in the past";
    }

    const table = tables.find(t => t.id === modalTableId);

    // Check for conflicts with other tables (cross-table conflict detection)
    if (reserveForm.date && reserveForm.time && !errors.date && !errors.time) {
      const conflicts = checkReservationConflicts(reserveForm.date, reserveForm.time, partySize, modalTableId);
      if (conflicts.length > 0) {
        setReservationConflictDialog({
          open: true,
          table,
          conflicts,
          onConfirm: () => {
            setReservationConflictDialog({ open: false, table: null, conflicts: null, onConfirm: null });
            proceedWithReservation(name, phone, partySize, table);
          }
        });
        return;
      }
    }

    const capacity = safeNumber(table?.capacity, 0);
    if (!errors.partySize && partySize != null && capacity > 0 && partySize > capacity) {
      setCapacityWarningDialog({
        open: true,
        table,
        partySize,
        capacity,
        onConfirm: () => {
          setCapacityWarningDialog({ open: false, table: null, partySize: null, capacity: null, onConfirm: null });
          proceedWithReservation(name, phone, partySize, table);
        }
      });
      return;
    }

    if (Object.keys(errors).length) { setReserveErrors(errors); return; }

    proceedWithReservation(name, phone, partySize, table);
  }, [reserveForm, modalTableId, tables, handleSetTables, addHistory, checkReservationConflicts, proceedWithReservation]);

  // ── Assign order ─────────────────────────────────────────────────────────
  const openAssign = useCallback((tableId) => {
    setModalTableId(tableId);
    setAssignOrderId("");
    setAssignError("");
    setModal("assign");
  }, []);

  const saveAssign = useCallback(() => {
    const orderId = assignOrderId.trim();
    if (!orderId) { setAssignError("Order ID is required"); return; }
    const table = tables.find(t => t.id === modalTableId);
    if (!table) { setAssignError("Table not found"); return; }

    // Prevent silently assigning the same order to more than one table.
    const conflict = tables.find(t => t.id !== modalTableId && (t.currentOrder === orderId || t.currentOrderId === orderId));
    if (conflict) {
      setOrderConflictDialog({
        open: true,
        orderId,
        conflictTable: conflict,
        onConfirm: () => {
          setOrderConflictDialog({ open: false, orderId: null, conflictTable: null, onConfirm: null });
          // Continue with assignment after confirmation
          proceedWithAssignment(orderId, table);
        }
      });
      return;
    }

    if ((table.status === "occupied" || table.status === "reserved")) {
      setReassignDialog({
        open: true,
        table,
        orderId,
        onConfirm: () => {
          setReassignDialog({ open: false, table: null, orderId: null, onConfirm: null });
          proceedWithAssignment(orderId, table);
        }
      });
      return;
    }

    proceedWithAssignment(orderId, table);
  }, [assignOrderId, modalTableId, tables, handleSetTables, addHistory]);

  const proceedWithAssignment = useCallback((orderId, table) => {
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === modalTableId
      ? { ...t, status: "occupied", currentOrder: orderId, currentOrderId: orderId, occupiedAt: now, occupiedSince: now, updatedAt: now }
      : t
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishTableEvent('table.occupied', {
      tableId: modalTableId,
      orderId: orderId,
      staffId: table?.waiter?.id
    });

    addHistory(modalTableId, table?.number, "Occupied", `Order ${orderId}`);
    setModal(null);
  }, [modalTableId, tables, handleSetTables, addHistory]);

  // ── Status helpers ───────────────────────────────────────────────────────
  // Mark a table as cleaning — confirms first if it has an active order or reservation.
  const clearTableFn = useCallback((id) => {
    if (!id) return;
    const table = tables.find(t => t.id === id);
    if (!table) return;
    if (table.status === "occupied" && (table.currentOrder || table.currentOrderId)) {
      setClearTableDialog({
        open: true,
        table,
        onConfirm: () => {
          setClearTableDialog({ open: false, table: null, onConfirm: null });
          proceedWithClearTable(id, table);
        }
      });
      return;
    } else if (table.status === "reserved") {
      setClearTableDialog({
        open: true,
        table,
        onConfirm: () => {
          setClearTableDialog({ open: false, table: null, onConfirm: null });
          proceedWithClearTable(id, table);
        }
      });
      return;
    }
    proceedWithClearTable(id, table);
  }, [tables]);

  const proceedWithClearTable = useCallback((id, table) => {
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === id
      ? { ...t, status: "cleaning", currentOrder: null, currentOrderId: null, occupiedAt: null, occupiedSince: null, waiter: null, splitBill: null, reservedFor: null, reservedDate: null, reservedTime: null, reservedPhone: null, reservedPartySize: null, reservedNotes: null, cleaningStartedAt: now, updatedAt: now }
      : t
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishTableEvent('table.cleaning', {
      tableId: id,
      previousStatus: table?.status,
      previousOrderId: table?.currentOrder || table?.currentOrderId
    });

    addHistory(id, table?.number, "Cleaning", (table?.currentOrder || table?.currentOrderId) ? `Was on ${table.currentOrder || table.currentOrderId}` : "");
    setTimeout(() => {
      setLocalTables(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const next = list.map(t => t.id === id && t.status === "cleaning" ? { ...t, status: "available", updatedAt: new Date().toISOString() } : t);
        if (externalSetTables) externalSetTables(next);
        return next;
      });

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishTableEvent('table.available', {
        tableId: id,
        previousStatus: 'cleaning'
      });

      setHistory(prev => [{ id: Date.now(), tableId: id, tableNumber: table?.number, event: "Available", detail: "Cleaning done", at: new Date().toISOString() }, ...prev].slice(0, 50));
    }, 3000);
  }, [tables, handleSetTables, externalSetTables, addHistory]);

  const deleteTable = useCallback((id) => {
    if (!id) return;
    const target = tables.find(t => t.id === id);
    // If the deleted table was part of a merge group, clean up the group on the rest.
    const next = tables
      .filter(t => t.id !== id)
      .map(t => {
        if (target?.groupId && t.groupId === target.groupId) {
          const remaining = (t.groupMembers || []).filter(mid => mid !== id);
          if (remaining.length <= 1) {
            const { groupId, groupMembers, groupHost, mergedCapacity, ...rest } = t;
            return rest;
          }
          // If the deleted table was the group's host, promote the next member so
          // groupHost never points at an id that no longer exists in the group —
          // otherwise no remaining card matches groupHost and the group disappears.
          const newHost = target.groupHost === id ? remaining[0] : t.groupHost;
          const newCapacity = tables
            .filter(x => remaining.includes(x.id))
            .reduce((s, x) => s + safeNumber(x?.capacity, 0), 0);
          return { ...t, groupMembers: remaining, groupHost: newHost, mergedCapacity: newCapacity };
        }
        return t;
      });
    handleSetTables(next);
    if (selectedId === id) setSelectedId(null);
  }, [tables, handleSetTables, selectedId]);

  // Confirms deletion with the table number and extra warnings for occupied/reserved tables.
  const confirmAndDelete = useCallback((table) => {
    if (!table || !table.id) return;
    setDeleteTableDialog({
      open: true,
      table,
      onConfirm: () => {
        setDeleteTableDialog({ open: false, table: null, onConfirm: null });
        deleteTable(table.id);
        setModal(null);
      }
    });
  }, [deleteTable]);

  const mergeEligible = useCallback((table) => {
    // Can't merge a table that's already part of a group, or one that's occupied/reserved.
    return !!table && !table.groupId && (table.status === "available");
  }, []);

  const combineSelectedTables = useCallback(() => {
    // Only combine tables that still exist and are still eligible (e.g. weren't
    // deleted/changed status while the merge selection was open).
    const groupMembers = mergeSelection.filter(id => {
      const t = tables.find(x => x.id === id);
      return t && mergeEligible(t);
    });
    const skipped = mergeSelection.length - groupMembers.length;
    if (groupMembers.length < 2) {
      if (skipped > 0) {
        setMergeErrorDialog({ open: true, message: "Only available, ungrouped tables can be combined. Please select at least 2 eligible tables." });
      }
      return;
    }
    if (skipped > 0) {
      setMergeWarningDialog({
        open: true,
        skipped,
        remaining: groupMembers.length,
        onConfirm: () => {
          setMergeWarningDialog({ open: false, skipped: null, remaining: null, onConfirm: null });
          proceedWithMerge(groupMembers);
        }
      });
      return;
    }
    proceedWithMerge(groupMembers);
  }, [mergeSelection, tables, handleSetTables, addHistory, mergeEligible]);

const proceedWithMerge = useCallback((groupMembers) => {
  const groupId = "grp-" + Date.now();
  const combinedCapacity = tables
    .filter(t => groupMembers.includes(t.id))
    .reduce((s, t) => s + safeNumber(t?.capacity, 0), 0);
  const hostId = groupMembers[0];
  const now = new Date().toISOString();

  handleSetTables(tables.map(t => {
    if (!groupMembers.includes(t.id)) return t;
    return {
      ...t,
      groupId,
      groupMembers,
      groupHost: hostId,
      mergedCapacity: combinedCapacity,
      updatedAt: now,
    };
  }));

  const numbers = tables.filter(t => groupMembers.includes(t.id)).map(t => safeText(t.number, "?"));
  addHistory(hostId, numbers[0], "Tables Combined", `#${numbers.join(" + #")} → seats ${combinedCapacity}`);

  setMergeMode(false);
  setMergeSelection([]);
}, [tables, handleSetTables, addHistory, setMergeMode, setMergeSelection]);

const handleReservationDrop = useCallback((reservationId, tableId) => {
  // Handle dropping a reservation onto a table
  const table = tables.find(t => t.id === tableId);
  if (!table) return;
  
  handleSetTables(tables.map(t => {
    if (t.id === tableId) {
      return {
        ...t,
        reservationId,
        status: 'reserved',
        updatedAt: new Date().toISOString()
      };
    }
    return t;
  }));
  
  addHistory(tableId, table.number, "Reservation Assigned", `Reservation assigned to table ${table.number}`);
}, [tables, handleSetTables, addHistory]);

const handleWaiterDrop = useCallback((waiterId, tableId) => {
  // Handle dropping a waiter onto a table
  const table = tables.find(t => t.id === tableId);
  if (!table) return;
  
  handleSetTables(tables.map(t => {
    if (t.id === tableId) {
      return {
        ...t,
        assignedWaiterId: waiterId,
        updatedAt: new Date().toISOString()
      };
    }
    return t;
  }));
  
  addHistory(tableId, table.number, "Waiter Assigned", `Waiter assigned to table ${table.number}`);
}, [tables, handleSetTables, addHistory]);

const handleMergeTables = useCallback((tableIds) => {
  if (tableIds.length < 2) return;

  const selectedTables = tables.filter(t => tableIds.includes(t.id));
  const totalCapacity = selectedTables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const groupNumbers = selectedTables.map(t => t.number).sort((a, b) => a - b);
  const groupId = `group-${Date.now()}`;

  const now = new Date().toISOString();
  handleSetTables(tables.map(t => {
    if (tableIds.includes(t.id)) {
      return {
        ...t,
        groupId,
        groupMembers: tableIds,
        groupHost: tableIds[0],
        mergedCapacity: totalCapacity,
        updatedAt: now
      };
    }
    return t;
  }));

  addHistory(tableIds[0], groupNumbers.join("+"), "Combined", `Tables ${groupNumbers.join(", ")} merged`);
  setMergeMode(false);
  setMergeSelection([]);
}, [tables, handleSetTables, addHistory, setMergeMode, setMergeSelection]);

const splitMergedGroup = useCallback((groupId) => {
  const members = tables.filter(t => t.groupId === groupId);
  const numbers = members.map(t => t.number);
  handleSetTables(tables.map(t => {
    if (t.groupId !== groupId) return t;
    const { groupId: _g, groupMembers: _gm, groupHost: _gh, mergedCapacity: _mc, ...rest } = t;
    return rest;
  }));
  if (numbers.length) addHistory(members[0]?.id, numbers[0], "Tables Split", `#${numbers.join(", #")} separated`);
}, [tables, handleSetTables, addHistory]);

const splitAndAutoAssign = useCallback((groupId) => {
  const members = tables.filter(t => t.groupId === groupId);
  if (members.length < 2) return;

  const hostTable = members.find(t => t.id === members[0].groupHost) || members[0];
  const currentGuests = hostTable.currentGuests || 0;
  const guestPerTable = Math.ceil(currentGuests / members.length);
  const numbers = members.map(t => t.number);

  const now = new Date().toISOString();
  handleSetTables(tables.map(t => {
    if (t.groupId === groupId) {
      const { groupId: _g, groupMembers: _gm, groupHost: _gh, mergedCapacity: _mc, ...rest } = t;
      return {
        ...rest,
        status: "available",
        currentGuests: Math.min(guestPerTable, t.capacity || 0),
        updatedAt: now
      };
    }
    return t;
  }));
  
  if (numbers.length) addHistory(members[0]?.id, numbers[0], "Split & Auto-Assigned", `#${numbers.join(", #")} split · ${currentGuests} guests distributed`);
}, [tables, handleSetTables, addHistory]);

  // ── Waiter assignment ────────────────────────────────────────────────────
  const openWaiter = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    setModalTableId(tableId);
    setWaiterForm({ waiterId: table?.waiter?.id || "" });
    setModal("waiter");
  }, [tables]);

  const saveWaiter = useCallback(() => {
    const waiter = (Array.isArray(waiters) ? waiters : []).find(w => w.id === waiterForm.waiterId) || null;
    const table = tables.find(t => t.id === modalTableId);
    if (!table) { setModal(null); return; }
    // Don't let "None" be confirmed when there's already no waiter assigned — nothing to do.
    if (!waiter && !table.waiter) { setModal(null); return; }
    // Clearing an existing assignment is a meaningful change — confirm it.
    if (!waiter && table.waiter) {
      setRemoveWaiterDialog({
        open: true,
        table,
        waiterName: table.waiter.name,
        onConfirm: () => {
          setRemoveWaiterDialog({ open: false, table: null, waiterName: null, onConfirm: null });
          proceedWithWaiterAssignment(null, table);
        }
      });
      return;
    }
    proceedWithWaiterAssignment(waiter, table);
  }, [waiterForm, modalTableId, tables, waiters, handleSetTables, addHistory]);

  const proceedWithWaiterAssignment = useCallback((waiter, table) => {
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === modalTableId ? { ...t, waiter, updatedAt: now } : t));
    if (waiter) addHistory(modalTableId, table?.number, "Waiter Assigned", waiter.name);
    else if (table.waiter) addHistory(modalTableId, table?.number, "Waiter Assigned", "Cleared");
    setModal(null);
  }, [modalTableId, tables, handleSetTables, addHistory]);

  // ── Split bill ───────────────────────────────────────────────────────────
  const openSplitBill = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    setModalTableId(tableId);
    setSplitForm({ ways: table?.splitBill?.ways || 2, method: table?.splitBill?.method || "equal", customAmounts: table?.splitBill?.customAmounts || [] });
    setSplitError("");
    setModal("splitBill");
  }, [tables]);

  const saveSplitBill = useCallback(() => {
    const ways = safeNumber(splitForm.ways, 0);
    if (!ways || ways < 2) { setSplitError("Must split at least 2 ways"); return; }
    const table = tables.find(t => t.id === modalTableId);
    if (!table) { setSplitError("Table not found"); return; }

    let customAmounts = Array.isArray(splitForm.customAmounts) ? splitForm.customAmounts : [];
    if (splitForm.method === "custom" && customAmounts.length) {
      const amounts = customAmounts.map(a => safeNumber(a, NaN));
      if (amounts.some(a => isNaN(a) || a < 0)) { setSplitError("Split amounts cannot be negative"); return; }
      // Only compared if we actually have a known bill total on the table (order amount may be missing).
      const billTotal = safeNumber(table.orderTotal ?? table.billTotal, NaN);
      const total = amounts.reduce((s, a) => s + a, 0);
      if (!isNaN(billTotal) && billTotal > 0 && Math.abs(total - billTotal) > 0.01) {
        setSplitError(`Split total (${total.toFixed(2)}) doesn't match the bill total (${billTotal.toFixed(2)})`);
        return;
      }
    }

    handleSetTables(tables.map(t => t.id === modalTableId
      ? { ...t, splitBill: { ways, method: splitForm.method, customAmounts }, updatedAt: new Date().toISOString() }
      : t
    ));
    addHistory(modalTableId, table?.number, "Split Bill", `${ways} ways (${splitForm.method})`);
    setModal(null);
  }, [splitForm, modalTableId, tables, handleSetTables, addHistory]);

  // ── Cancel reservation ────────────────────────────────────────────────────
  const cancelReservation = useCallback((tableId) => {
    if (!tableId) return;
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    handleSetTables(tables.map(t => t.id === tableId
      ? { ...t, status: "available", reservedFor: null, reservedDate: null, reservedTime: null, reservedPhone: null, reservedPartySize: null, reservedNotes: null, updatedAt: new Date().toISOString() }
      : t
    ));
    addHistory(tableId, table?.number, "Reservation Cancelled", table?.reservedFor || "");
  }, [tables, handleSetTables, addHistory]);

  // Mark a cleaning table available immediately (e.g. staff confirms it's done early).
  const markAvailable = useCallback((id) => {
    if (!id) return;
    const table = tables.find(t => t.id === id);
    if (!table) return;
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === id
      ? { ...t, status: "available", cleaningStartedAt: null, updatedAt: now }
      : t
    ));
    addHistory(id, table?.number, "Available", "Marked available");
  }, [tables, handleSetTables, addHistory]);

  // ── Table transfer / upgrade ────────────────────────────────────────────
  // "Upgrade" reuses the transfer mechanism but pre-filters the destination
  // dropdown to available tables with more seats than the source, sorted best-first.
  const [isUpgradeFlow, setIsUpgradeFlow] = useState(false);

  const openTransfer = useCallback((sourceId) => {
    setTransferSourceId(sourceId);
    setTransferDestId("");
    setTransferError("");
    setIsUpgradeFlow(false);
    setModal("transfer");
  }, []);

  const openUpgrade = useCallback((sourceId) => {
    setTransferSourceId(sourceId);
    setTransferDestId("");
    setTransferError("");
    setIsUpgradeFlow(true);
    setModal("transfer");
  }, []);

  const saveTransfer = useCallback(() => {
    const source = tables.find(t => t.id === transferSourceId);
    if (!source) { setTransferError("Source table not found"); return; }
    if (!source.currentOrder && !source.currentOrderId) { setTransferError("Source table has no active order to transfer"); return; }
    const destId = transferDestId;
    if (!destId) { setTransferError(isUpgradeFlow ? "Select a table to upgrade to" : "Select a destination table"); return; }
    if (destId === transferSourceId) { setTransferError("Cannot transfer to the same table"); return; }
    const dest = tables.find(t => t.id === destId);
    if (!dest) { setTransferError("Destination table not found"); return; }
    if (dest.status === "occupied" || dest.status === "reserved") {
      setTransferWarningDialog({
        open: true,
        destTable: dest,
        onConfirm: () => {
          setTransferWarningDialog({ open: false, destTable: null, onConfirm: null });
          proceedWithTransfer(source, dest);
        }
      });
      return;
    }
    proceedWithTransfer(source, dest);
  }, [transferSourceId, transferDestId, tables, handleSetTables, addHistory, isUpgradeFlow]);

  const proceedWithTransfer = useCallback((source, dest) => {
    const orderId = source.currentOrder || source.currentOrderId;
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => {
      if (t.id === transferSourceId) {
        return { ...t, status: "cleaning", currentOrder: null, currentOrderId: null, occupiedAt: null, occupiedSince: null, cleaningStartedAt: now, updatedAt: now };
      }
      if (t.id === transferDestId) {
        return { ...t, status: "occupied", currentOrder: orderId, currentOrderId: orderId, occupiedAt: now, occupiedSince: now, updatedAt: now };
      }
      return t;
    }));
    const eventLabel = isUpgradeFlow ? "Upgraded" : "Transferred";
    addHistory(transferSourceId, source.number, eventLabel, `Order ${orderId} → Table #${dest.number} (${safeNumber(source.capacity, 0)}→${safeNumber(dest.capacity, 0)} seats)`);
    addHistory(transferDestId, dest.number, "Occupied", `${eventLabel} from Table #${source.number}`);
    setModal(null);
  }, [transferSourceId, transferDestId, tables, handleSetTables, addHistory, isUpgradeFlow]);

  // ── Waitlist ─────────────────────────────────────────────────────────────
  const saveWaitlistEntry = useCallback(() => {
    const errors = {};
    const name = (waitlistForm.name || "").trim();
    if (!name) errors.name = "Required";
    const phone = (waitlistForm.phone || "").trim();
    if (phone && !/^[0-9+\-\s()]{6,20}$/.test(phone)) errors.phone = "Enter a valid phone number";
    let partySize = null;
    if (waitlistForm.partySize) {
      partySize = Number(waitlistForm.partySize);
      if (!Number.isFinite(partySize) || partySize < 1) errors.partySize = "Must be a number greater than 0";
    }
    if (!partySize) errors.partySize = "Required";
    if (Object.keys(errors).length) { setWaitlistErrors(errors); return; }
    setWaitlist(prev => [...prev, { id: "wl-" + Date.now(), name, phone: phone || null, partySize, notes: (waitlistForm.notes || "").trim() || null, status: "waiting", createdAt: new Date().toISOString() }]);
    setWaitlistForm({ name: "", phone: "", partySize: "", notes: "" });
    setWaitlistErrors({});
  }, [waitlistForm]);

  const seatWaitlistGuest = useCallback((wlId, tableId) => {
    const guest = waitlist.find(w => w.id === wlId);
    const table = tables.find(t => t.id === tableId);
    if (!guest || !table) return;
    if (table.status !== "available") {
      setWaitlistSeatDialog({
        open: true,
        table,
        guestName: guest.name,
        onConfirm: () => {
          setWaitlistSeatDialog({ open: false, table: null, guestName: null, onConfirm: null });
          proceedWithSeatWaitlist(wlId, tableId, guest, table);
        }
      });
      return;
    }
    proceedWithSeatWaitlist(wlId, tableId, guest, table);
  }, [waitlist, tables, handleSetTables, addHistory]);

  const proceedWithSeatWaitlist = useCallback((wlId, tableId, guest, table) => {
    const now = new Date().toISOString();
    setWaitlist(prev => prev.map(w => w.id === wlId ? { ...w, status: "seated" } : w));
    handleSetTables(tables.map(t => t.id === tableId
      ? { ...t, status: "occupied", occupiedAt: now, occupiedSince: now, updatedAt: now }
      : t
    ));
    addHistory(tableId, table.number, "Occupied", `Waitlist: ${guest.name} (party of ${guest.partySize})`);
  }, [tables, handleSetTables, addHistory]);

  const cancelWaitlistEntry = useCallback((wlId) => {
    const guest = waitlist.find(w => w.id === wlId);
    if (!guest) return;
    setCancelWaitlistDialog({
      open: true,
      guestName: guest.name,
      onConfirm: () => {
        setCancelWaitlistDialog({ open: false, guestName: null, onConfirm: null });
        setWaitlist(prev => prev.map(w => w.id === wlId ? { ...w, status: "cancelled" } : w));
      }
    });
  }, [waitlist]);

  // ── Filter reset ─────────────────────────────────────────────────────────
  const hasActiveFilters = typeFilter !== "All" || areaFilter !== "All" || statusFilter !== "All";
  const clearFilters = useCallback(() => {
    setTypeFilter("All"); setAreaFilter("All"); setStatusFilter("All");
  }, []);

  const types  = useMemo(() => TABLE_TYPES.filter(t => t !== "All"),  []);
  const areas  = useMemo(() => TABLE_AREAS.filter(a => a !== "All"),  []);
  const statuses = useMemo(() => TABLE_STATUS.filter(s => s !== "All"), []);

  // Real average turn time — pairs each "Occupied" event with the next "Cleaning"/"Available"
  // event on the same table, oldest-first, and averages the elapsed minutes across sessions
  // this browser session has observed. Returns null (shown as "—") until we have data.
  const avgTurnMinutes = useMemo(() => {
    const chronological = [...history].reverse(); // history is stored newest-first
    const openSince = {}; // tableId -> ms timestamp when it went Occupied
    const durations = [];
    chronological.forEach(h => {
      if (h.event === "Occupied") {
        openSince[h.tableId] = new Date(h.at).getTime();
      } else if ((h.event === "Cleaning" || h.event === "Available") && openSince[h.tableId] != null) {
        const start = openSince[h.tableId];
        const end = new Date(h.at).getTime();
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) durations.push((end - start) / 60000);
        delete openSince[h.tableId];
      }
    });
    if (!durations.length) return null;
    return Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
  }, [history]);

  return (
    <div>
      {/* Floor Header */}
      <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
        <div style={{ marginBottom: "var(--cafe-space-sm)" }}>
          <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--cafe-text-primary)", marginBottom: 4 }}>Floor</div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>Live table management and seating</div>
        </div>

        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", flexWrap: "wrap" }}>
          {[
            { label: "Free Tables", count: availableCount, color: "var(--cafe-success)" },
            { label: "Occupied", count: occupiedCount, color: occupiedCount > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)" },
            { label: "Reserved", count: reservedCount, color: reservedCount > 0 ? "var(--cafe-info)" : "var(--cafe-text-tertiary)" },
            { label: "Cleaning", count: statusCounts.cleaning || 0, color: (statusCounts.cleaning || 0) > 0 ? "var(--cafe-purple)" : "var(--cafe-text-tertiary)" },
            { label: "Avg Turn Time", count: avgTurnMinutes != null ? `${avgTurnMinutes}m` : "—", color: "var(--cafe-text-secondary)" },
            { label: "Waiting", count: waitlist.filter(w => w.status === "waiting").length, color: waitlist.filter(w => w.status === "waiting").length > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
          ].map(chip => (
            <div key={chip.label} style={{
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: "var(--cafe-radius-md)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: chip.color, fontFamily: "monospace" }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--cafe-space-md)", marginBottom: "var(--cafe-space-md)", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          <TableSearch
            tables={tables}
            customers={[]}
            reservations={tables.filter(t => t.status === "reserved").map(t => ({
              id: t.id,
              guestName: t.reservedFor,
              phone: t.reservedPhone,
              tableId: t.id,
              time: t.reservedTime,
              partySize: t.reservedPartySize
            }))}
            waiters={waiters}
            orders={tables.filter(t => t.currentOrder || t.currentOrderId).map(t => {
              const orderId = t.currentOrderId || t.currentOrder;
              const realOrder = orders?.find(o => o.id === orderId);
              return {
                id: orderId,
                tableId: t.id,
                status: t.status,
                total: realOrder?.total || 0
              };
            })}
            onResultClick={(result) => {
              if (result.type === 'table') {
                setSelectedId(result.id);
                setViewMode('grid');
              } else if (result.type === 'waiter') {
                // Filter to show tables assigned to this waiter
                const waiterTables = tables.filter(t => t.waiter?.id === result.id);
                if (waiterTables.length > 0) {
                  setSelectedId(waiterTables[0].id);
                }
              } else if (result.type === 'reservation') {
                setSelectedId(result.tableId);
                setViewMode('grid');
              } else if (result.type === 'order') {
                const table = tables.find(t => t.currentOrderId === result.id || t.currentOrder === result.id);
                if (table) {
                  setSelectedId(table.id);
                  setViewMode('grid');
                }
              }
            }}
          />
        </div>

        {/* Status Filters */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)" }}>
          {[
            { key: "All", label: "All" },
            { key: "available", label: "Free" },
            { key: "occupied", label: "Occupied" },
            { key: "reserved", label: "Reserved" },
            { key: "cleaning", label: "Cleaning" },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)} style={{
              padding: "8px 14px",
              borderRadius: "var(--cafe-radius-md)",
              border: `1px solid ${statusFilter === s.key ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
              background: statusFilter === s.key ? "var(--cafe-accent-bg)" : "transparent",
              color: statusFilter === s.key ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: statusFilter === s.key ? 600 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: 36,
              transition: "all 0.15s ease"
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)" }}>
          <button
            className="header-action-btn"
            style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", borderColor: viewMode === "floor" ? "var(--cafe-accent-border)" : "var(--cafe-border-light)", color: viewMode === "floor" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", background: viewMode === "floor" ? "var(--cafe-accent-bg)" : "transparent" }}
            onClick={() => setViewMode(viewMode === "grid" ? "floor" : "grid")}
          >{viewMode === "grid" ? "🗺️ Floor Plan" : "📋 Grid View"}</button>
          {hasActiveFilters && (
            <button className="header-action-btn" onClick={clearFilters} style={{ ...btn("ghost"), fontSize: "var(--cafe-font-xs)", padding: "8px 14px", color: "var(--cafe-warning)", borderColor: "var(--cafe-warning-border)", borderRadius: "var(--cafe-radius-sm)" }}>✕ Clear</button>
          )}
          <button className="header-action-btn" style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)" }} onClick={() => setModal("reservations")}>
            Reservations {reservedCount > 0 && <span style={{ marginLeft: 5, background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>{reservedCount}</span>}
          </button>
          <button className="header-action-btn" style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)" }} onClick={() => { setWaitlistForm({ name: "", phone: "", partySize: "", notes: "" }); setWaitlistErrors({}); setModal("waitlist"); }}>
            Waitlist {waitlist.filter(w => w.status === "waiting").length > 0 && <span style={{ marginLeft: 5, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)", fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>{waitlist.filter(w => w.status === "waiting").length}</span>}
          </button>
          <button
            className="header-action-btn"
            style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", borderColor: mergeMode ? "var(--cafe-accent-border)" : "var(--cafe-border-light)", color: mergeMode ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", background: mergeMode ? "var(--cafe-accent-bg)" : "transparent" }}
            onClick={toggleMergeMode}
          >{mergeMode ? "Cancel Combine" : "Combine Tables"}</button>
          <button className="header-action-btn" style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)" }} onClick={() => setModal("rotationStrategies")}>
            📊 Rotation Tips
          </button>
          <button className="header-action-btn" style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)" }} onClick={() => setModal("floorAnalytics")}>
            📈 Floor Analytics
          </button>
          <button className="header-action-btn" style={btn("primary")} onClick={openAdd}>+ Add Table</button>

        </div>
      </div>

      {/* Type & Area Filters — dropdowns keep this compact as the list of types/areas grows */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--cafe-space-sm)", marginBottom: "var(--cafe-space-md)" }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            ...input, width: "auto", minWidth: 150, fontSize: "var(--cafe-font-sm)", padding: "8px 30px 8px 12px",
            borderRadius: "var(--cafe-radius-md)", cursor: "pointer",
            fontWeight: typeFilter !== "All" ? 600 : 500,
            borderColor: typeFilter !== "All" ? "var(--cafe-accent-border)" : undefined,
            background: typeFilter !== "All" ? "var(--cafe-accent-bg)" : undefined,
            color: typeFilter !== "All" ? "var(--cafe-accent)" : undefined,
          }}
          title="Filter by table type"
        >
          <option value="All">All Types ({tables.length})</option>
          {types.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} ({typeCounts[t] || 0})</option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          style={{
            ...input, width: "auto", minWidth: 150, fontSize: "var(--cafe-font-sm)", padding: "8px 30px 8px 12px",
            borderRadius: "var(--cafe-radius-md)", cursor: "pointer",
            fontWeight: areaFilter !== "All" ? 600 : 500,
            borderColor: areaFilter !== "All" ? "var(--cafe-accent-border)" : undefined,
            background: areaFilter !== "All" ? "var(--cafe-accent-bg)" : undefined,
            color: areaFilter !== "All" ? "var(--cafe-accent)" : undefined,
          }}
          title="Filter by area"
        >
          <option value="All">All Areas ({tables.length})</option>
          {areas.map(a => (
            <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)} ({areaCounts[a] || 0})</option>
          ))}
        </select>
      </div>

      {/* Merge mode action bar */}
      {mergeMode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--cafe-space-md)", marginBottom: "var(--cafe-space-md)", padding: "12px 16px", borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-accent-bg)", border: `1px solid var(--cafe-accent-border)` }}>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-accent)" }}>
            {mergeSelection.length === 0
              ? "Select 2 or more available tables to combine into one party."
              : `${mergeSelection.length} table${mergeSelection.length > 1 ? "s" : ""} selected${mergeSelection.length >= 2 ? ` · ${tables.filter(t => mergeSelection.includes(t.id)).reduce((s, t) => s + safeNumber(t.capacity, 0), 0)} seats total` : ""}`}
          </div>
          <button
            style={{ ...btn("primary"), fontSize: "var(--cafe-font-sm)", opacity: mergeSelection.length < 2 ? 0.5 : 1, cursor: mergeSelection.length < 2 ? "not-allowed" : "pointer" }}
            disabled={mergeSelection.length < 2}
            onClick={combineSelectedTables}
          >Combine {mergeSelection.length >= 2 ? `(${mergeSelection.length})` : ""}</button>
        </div>
      )}

      {/* View Mode Toggle */}
      {viewMode === "floor" ? (
        <div style={{ flex: 1, minHeight: 0, height: "calc(100vh - 160px)", position: "relative" }}>
          <InteractiveFloorPlan
            tables={tables}
            orders={orders}
            currentWaiterId={null}
            viewMode="manager"
            onTableClick={(table) => {
              setSelectedId(table.id);
              setDetailsPanelTableId(table.id);
            }}
            onTableDoubleClick={(table) => setEditId(table.id)}
            onReservationDrop={handleReservationDrop}
            onWaiterDrop={handleWaiterDrop}
            onMergeTables={handleMergeTables}
            onTableUpdate={(updated) => {
              // Persist position/size changes from floor plan back to app state
              setLocalTables(prev => prev.map(t => t.id === updated.id ? {
                ...t,
                position: updated.position,
                dimensions: updated.dimensions,
                rotation: updated.rotation,
              } : t));
            }}
          />
        </div>
      ) : (
        /* Table Grid */
        <div
          ref={gridRef}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "var(--cafe-space-md)" }}
          className="tables-grid"
        >
        {filtered.filter(table => !table.groupId || table.groupHost === table.id).map(table => {
          const sc = STATUS_CFG[table.status] || STATUS_CFG.available;
          const isSelected = selectedId === table.id;
          const isMerged = !!table.groupId;
          const groupNumbers = isMerged ? tables.filter(t => t.groupId === table.groupId).map(t => t.number) : [];
          
          const isOccupied = table.status === "occupied" || table.status === "reserved";
          
          const currentOrderObj = orders ? orders.find(o => o.id === (table.currentOrderId || table.currentOrder)) : null;
          const invoiceNo = currentOrderObj ? (currentOrderObj.invoiceNo || (currentOrderObj.id ? `#${currentOrderObj.id.slice(-6).toUpperCase()}` : '-')) : '-';
          const amount = currentOrderObj ? `₹${(currentOrderObj.total || 0).toFixed(2)}` : '-';
          // Real KOT count: count kdsCards for this table's order
          const kotCount = currentOrderObj ? kdsCards.filter(k => k.orderId === currentOrderObj.id).length : 0;
          const orderItemCount = currentOrderObj ? (currentOrderObj.items?.length || 0) : 0;
          const orderItems = currentOrderObj ? (currentOrderObj.items || []).slice(0, 3) : [];
          const partySize = currentOrderObj?.partySize || null;
          
          const occupancyMinutes = table.status === "occupied" ? formatOccupancyDuration(table.occupiedAt || table.occupiedSince) : "-";
          
          const waiterName = table.waiter?.name ? table.waiter.name.split(' ')[0] : "-";
          const isMenuOpen = actionMenuOpen === table.id;
          const isMergeSelected = mergeMode && mergeSelection.includes(table.id);

          return (
            <div
              key={table.id}
              className="table-card-interactive"
              onClick={() => {
                if (mergeMode) {
                  if (!mergeEligible(table)) return;
                  setMergeSelection(prev => prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]);
                  return;
                }
                setSelectedId(table.id);
                setDetailsPanelTableId(table.id);
              }}
              style={{
                background: "var(--cafe-bg-card)",
                border: `1px solid ${isMergeSelected ? "var(--cafe-purple)" : isSelected ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                borderRadius: 20,
                padding: "20px",
                cursor: mergeMode && !mergeEligible(table) ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                boxShadow: isMergeSelected ? "var(--cafe-shadow-lg)" : isSelected ? "var(--cafe-shadow-lg)" : "var(--cafe-shadow-sm)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minHeight: "240px",
                overflow: "hidden",
                opacity: mergeMode && !mergeEligible(table) ? 0.5 : 1
              }}
            >
              {/* Top Status Bar indicator */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: table.status === 'occupied' ? "var(--cafe-accent)" : table.status === 'reserved' ? "var(--cafe-info)" : table.status === 'cleaning' ? "var(--cafe-danger)" : "var(--cafe-success)" }} />
              
              {/* Top Row: Invoice, Amount, Menu */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Invoice No.</div>
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: currentOrderObj ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontWeight: 700 }}>{invoiceNo}</div>
                </div>
                
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
                  <div style={{ fontSize: "var(--cafe-font-xl)", color: currentOrderObj ? "var(--cafe-text-primary)" : "var(--cafe-text-tertiary)", fontWeight: 800, letterSpacing: "-0.02em" }}>{amount}</div>
                </div>
                
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", position: "relative" }}>
                  <button 
                    className="table-action-btn"
                    onClick={(e) => { e.stopPropagation(); setActionMenuOpen(isMenuOpen ? null : table.id); }}
                    style={{ background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                  >
                    ⋮
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div style={{
                      position: "absolute", top: "100%", right: 0, marginTop: 8,
                      background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)",
                      boxShadow: "var(--cafe-shadow-lg)", zIndex: 10, width: 140, overflow: "hidden"
                    }}>
                      {table.status === "available" && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); openReserve(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Reserve</button>
                          <button onClick={(e) => { e.stopPropagation(); openAssign(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Seat Guest</button>
                          <button onClick={(e) => { e.stopPropagation(); clearTableFn(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-purple)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Mark Clean</button>
                        </>
                      )}
                      {table.status === "occupied" && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); clearTableFn(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-success)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Clear Table</button>
                          <button onClick={(e) => { e.stopPropagation(); openTransfer(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Transfer</button>
                          <button onClick={(e) => { e.stopPropagation(); openUpgrade(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Upgrade Table</button>
                          <button onClick={(e) => { e.stopPropagation(); openSplitBill(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Split Bill</button>
                          <button onClick={(e) => { e.stopPropagation(); openWaiter(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Assign Server</button>
                        </>
                      )}
                      {table.status === "cleaning" && (
                        <button onClick={(e) => { e.stopPropagation(); markAvailable(table.id); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-success)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Mark Available</button>
                      )}
                      {isMerged && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitMergedDialog({
                              open: true,
                              groupId: table.groupId,
                              groupNumbers,
                              onConfirm: () => {
                                setSplitMergedDialog({ open: false, groupId: null, groupNumbers: [], onConfirm: null });
                                splitMergedGroup(table.groupId);
                              }
                            });
                            setActionMenuOpen(null);
                          }}
                          style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-purple)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}
                        >Split Group</button>
                      )}
                      <div style={{ height: 1, background: "var(--cafe-border-light)" }} />
                      <button onClick={(e) => { e.stopPropagation(); openEdit(table); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); confirmAndDelete(table); setActionMenuOpen(null); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)", cursor: "pointer" }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Circle + Order Items preview */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "12px 0" }}>
                <div 
                  className="table-circle"
                  style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: table.status === 'occupied' ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  border: `2px solid ${table.status === 'occupied' ? 'var(--cafe-accent)' : table.status === 'reserved' ? 'var(--cafe-info)' : 'var(--cafe-border)'}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 800, color: "var(--cafe-text-primary)",
                  boxShadow: table.status === 'occupied' ? `0 0 20px var(--cafe-accent-border)` : 'none'
                }}>
                  {isMerged ? `${groupNumbers[0]}+` : table.number}
                </div>
                <div style={{ marginTop: 8, fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", fontWeight: 700 }}>
                  {partySize ? `${partySize} Guests` : `${table.capacity} Seats`}
                </div>
                
                {/* Live order items preview */}
                {orderItems.length > 0 && (
                  <div style={{ marginTop: 12, width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
                    {orderItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--cafe-text-primary)", background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: 8, padding: "6px 10px" }}>
                        <span style={{ fontWeight: 600 }}>{item.qty}× {item.name}</span>
                        <span style={{ color: "var(--cafe-text-secondary)", fontWeight: 700 }}>₹{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    {orderItemCount > 3 && (
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", textAlign: "center", fontWeight: 600, marginTop: 4 }}>+{orderItemCount - 3} more items</div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: 3 Columns */}
              <div style={{ display: "flex", borderTop: "1px solid var(--cafe-border-light)", paddingTop: 16, marginTop: "auto" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid var(--cafe-border-light)" }}>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>Waiter</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>👤</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)", fontWeight: 700 }}>{waiterName}</span>
                  </div>
                </div>
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid var(--cafe-border-light)" }}>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>KOT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🧾</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: kotCount > 0 ? "var(--cafe-accent)" : "var(--cafe-text-primary)", fontWeight: 800 }}>{kotCount || '-'}</span>
                  </div>
                </div>
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>Duration</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🕒</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)", fontWeight: 700 }}>{occupancyMinutes}{occupancyMinutes !== '-' ? ' Min' : ''}</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--cafe-text-tertiary)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "var(--cafe-radius-lg)", border: `2px dashed var(--cafe-border-light)`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, opacity: 0.4 }}>
            {hasActiveFilters ? "⊘" : "⊡"}
          </div>
          <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
            {hasActiveFilters ? "No tables match your filters" : "Floor is ready"}
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", marginBottom: "var(--cafe-space-md)" }}>
            {hasActiveFilters ? "Try adjusting or clearing your filters to see more tables." : "Add your first table to get started with floor management."}
          </div>
          {hasActiveFilters ? (
            <button 
              style={{ ...btn("ghost"), marginTop: 12, padding: "8px 16px", fontSize: "var(--cafe-font-sm)" }} 
              onClick={() => {
                setTypeFilter("All");
                setAreaFilter("All");
                setStatusFilter("All");
              }}
            >
              Clear All Filters
            </button>
          ) : (
            <button style={{ ...btn("primary"), marginTop: 12, padding: "10px 24px" }} onClick={openAdd}>+ Add First Table</button>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal === "addEdit" && (
        <Modal title={editId ? `Edit Table${editingTable ? ` #${editingTable.number}` : ""}` : "Add Table"} onClose={() => setModal(null)}>
          {editingIsLocked && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: C.amber, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "8px 10px", marginBottom: 14 }}>
              <span>⚠️</span>
              <span>
                This table is currently <strong>{editingTable.status}</strong>. You can still edit it, but changes
                (capacity, type, area) won't affect the {editingTable.status === "occupied" ? "current order" : "existing reservation"} already on it.
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>Table Number *</label>
              <input style={{ ...input, borderColor: formErrors.number ? C.red : undefined }} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="#" min={1} />
              <FieldError msg={formErrors.number} />
            </div>
            <div>
              <label style={label}>Capacity *</label>
              <input style={{ ...input, borderColor: formErrors.capacity ? C.red : (formWarnings.capacity ? C.amber : undefined) }} type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="seats" min={1} />
              <FieldError msg={formErrors.capacity} />
              {!formErrors.capacity && formWarnings.capacity && (
                <div style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>⚠ {formWarnings.capacity}</div>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>Type</label>
              <select style={{ ...input, width: "100%" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {types.map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}
              </select>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
                Typical: {capacityGuide(form.type).min}–{capacityGuide(form.type).max} seats
              </div>
            </div>
            <div>
              <label style={label}>Area</label>
              <select style={{ ...input, width: "100%" }} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
                {areas.map(a => <option key={a} value={a} style={{ textTransform: "capitalize" }}>{a}</option>)}
              </select>
            </div>
          </div>
          
          {/* Visual Properties Section */}
          <div style={{ marginBottom: 12, padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8, border: "1px solid var(--cafe-border-light)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Visual Properties</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={label}>Shape</label>
                <select style={{ ...input, width: "100%" }} value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}>
                  <option value="rect">Rectangle</option>
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                  <option value="oval">Oval</option>
                  <option value="booth">Booth</option>
                  <option value="bar_seat">Bar Seat</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label style={label}>Rotation (°)</label>
                <input style={{ ...input, width: "100%" }} type="number" value={form.rotation} onChange={e => setForm(f => ({ ...f, rotation: e.target.value }))} placeholder="0" min="0" max="360" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={label}>Width (px)</label>
                <input style={{ ...input, width: "100%" }} type="number" value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} placeholder="80" min="30" max="300" />
              </div>
              <div>
                <label style={label}>Height (px)</label>
                <input style={{ ...input, width: "100%" }} type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="80" min="30" max="300" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={label}>Layer</label>
                <input style={{ ...input, width: "100%" }} type="number" value={form.layer} onChange={e => setForm(f => ({ ...f, layer: e.target.value }))} placeholder="0" min="0" max="10" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
                <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} />
                <label style={{ fontSize: 13, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>Visible</label>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Notes</label>
            <textarea
              style={{ ...input, width: "100%", resize: "none" }}
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. window seat, wheelchair accessible, VIP booth…"
              maxLength={140}
            />
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textAlign: "right" }}>{form.notes.length}/140</div>
          </div>

          {editingTable?.groupId && (
            <div style={{ fontSize: 11, color: C.purple, background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, borderRadius: 8, padding: "8px 10px", marginBottom: 16 }}>
              🔗 This table is part of a combined party. Split the group first if you want to edit it independently.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {editId ? (
              <button
                style={{ ...btn("ghost"), color: C.red, borderColor: C.redBorder }}
                onClick={() => { const t = tables.find(x => x.id === editId); if (t) confirmAndDelete(t); }}
              >Delete</button>
            ) : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={saveTable}>{editId ? "Save Changes" : "Add Table"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reserve Modal */}
      {modal === "reserve" && (
        <Modal title="Reserve Table" onClose={() => setModal(null)} width={400}>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>Guest Name *</label>
            <input style={{ ...input, width: "100%", borderColor: reserveErrors.name ? C.red : undefined }} value={reserveForm.name} onChange={e => setReserveForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" autoFocus />
            <FieldError msg={reserveErrors.name} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>Date *</label>
              <input type="date" style={{ ...input, width: "100%", borderColor: reserveErrors.date ? C.red : undefined }} value={reserveForm.date} onChange={e => setReserveForm(f => ({ ...f, date: e.target.value }))} />
              <FieldError msg={reserveErrors.date} />
            </div>
            <div>
              <label style={label}>Time *</label>
              <input type="time" style={{ ...input, width: "100%", borderColor: reserveErrors.time ? C.red : undefined }} value={reserveForm.time} onChange={e => setReserveForm(f => ({ ...f, time: e.target.value }))} />
              <FieldError msg={reserveErrors.time} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>Phone</label>
              <input style={{ ...input, width: "100%" }} value={reserveForm.phone} onChange={e => setReserveForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" type="tel" />
            </div>
            <div>
              <label style={label}>Party Size</label>
              <input style={{ ...input, width: "100%" }} value={reserveForm.partySize} onChange={e => setReserveForm(f => ({ ...f, partySize: e.target.value }))} placeholder="# guests" type="number" min={1} />
            </div>
          </div>
          {/* Auto-suggest tables based on party size */}
          {reserveForm.partySize && (() => {
            const suggestions = getSuggestedTables(reserveForm.partySize);
            const currentTable = tables.find(t => t.id === modalTableId);
            return suggestions.length > 0 && (!currentTable || currentTable.status !== "available" || currentTable.capacity < Number(reserveForm.partySize)) ? (
              <div style={{ marginBottom: 16, padding: "12px", background: "var(--cafe-accent-bg)", borderRadius: "var(--cafe-radius-md)", border: `1px solid var(--cafe-accent-border)` }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-accent)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  💡 Suggested Tables
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggestions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setModalTableId(t.id);
                        setModal(null);
                        openReserve(t.id);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--cafe-radius-sm)",
                        border: `1px solid var(--cafe-border-light)`,
                        background: "var(--cafe-bg-card)",
                        color: "var(--cafe-text-secondary)",
                        fontSize: "var(--cafe-font-sm)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>Table #{t.number} · {t.capacity} seats</span>
                      <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textTransform: "capitalize" }}>{t.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Notes</label>
            <textarea style={{ ...input, width: "100%", resize: "none" }} rows={2} value={reserveForm.notes} onChange={e => setReserveForm(f => ({ ...f, notes: e.target.value }))} placeholder="Dietary needs, occasion, etc." />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn("primary")} onClick={saveReserve}>Confirm Reservation</button>
          </div>
        </Modal>
      )}

      {/* Assign Order Modal */}
      {modal === "assign" && (
        <Modal title="Assign Order to Table" onClose={() => setModal(null)} width={320}>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Order ID *</label>
            <input
              style={{ ...input, width: "100%", borderColor: assignError ? C.red : undefined }}
              value={assignOrderId}
              onChange={e => { setAssignOrderId(e.target.value); setAssignError(""); }}
              onKeyDown={e => e.key === "Enter" && saveAssign()}
              placeholder="e.g. ORD-1234"
              autoFocus
            />
            <FieldError msg={assignError} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn("primary")} onClick={saveAssign}>Assign</button>
          </div>
        </Modal>
      )}

      {/* Waiter Assignment Modal */}
      {modal === "waiter" && (() => {
        const table = tables.find(t => t.id === modalTableId);
        const suggestedWaiter = getAutoSuggestedWaiter();
        return (
          <Modal title="Assign Waiter" onClose={() => setModal(null)} width={380}>
            <div style={{ marginBottom: 12, padding: "10px 14px", background: C.bg3, borderRadius: 8, fontSize: 12, color: C.text2 }}>
              Table #{safeText(table?.number, "?")} · {safeText(table?.type, "—")}
            </div>
            {/* Auto-assign suggestion */}
            {suggestedWaiter && !table?.waiter && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--cafe-accent-bg)", borderRadius: "var(--cafe-radius-md)", border: `1px solid var(--cafe-accent-border)` }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  💡 Suggested
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>
                    {suggestedWaiter.name} (least loaded)
                  </span>
                  <button
                    onClick={() => setWaiterForm({ waiterId: suggestedWaiter.id })}
                    style={{ fontSize: "var(--cafe-font-xs)", padding: "4px 10px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-accent-border)`, background: "var(--cafe-accent)", color: "#1A1208", cursor: "pointer", fontWeight: 600 }}
                  >
                    Auto-Assign
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={label}>Select Waiter</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setWaiterForm({ waiterId: "" })}
                  style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${!waiterForm.waiterId ? C.amber3 : C.border2}`, background: !waiterForm.waiterId ? C.amberDim : C.bg3, color: !waiterForm.waiterId ? C.amber2 : C.text2, fontSize: 13, cursor: "pointer", textAlign: "left" }}
                >
                  None (unassign)
                </button>
                {waiters.filter(w => w.active).map(w => {
                  const load = getWaiterLoad(w.id);
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWaiterForm({ waiterId: w.id })}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${waiterForm.waiterId === w.id ? C.amber3 : C.border2}`, background: waiterForm.waiterId === w.id ? C.amberDim : C.bg3, color: waiterForm.waiterId === w.id ? C.amber2 : C.text2, fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.bg4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🧑‍🍳</span>
                        {w.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.text3 }}>{load.tablesAssigned} tables</span>
                        <span style={{ fontSize: 11, color: C.text3 }}>·</span>
                        <span style={{ fontSize: 11, color: load.ordersPending > 0 ? C.amber2 : C.text3 }}>{load.ordersPending} orders</span>
                        {load.overloaded && <span style={{ fontSize: 10, padding: "2px 6px", background: C.redDim, color: C.red, borderRadius: 4, fontWeight: 600 }}>Overload</span>}
                        {waiterForm.waiterId === w.id && <span style={{ marginLeft: 6, color: C.amber2 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={saveWaiter}>Confirm</button>
            </div>
          </Modal>
        );
      })()}

      {/* Split Bill Modal */}
      {modal === "splitBill" && (() => {
        const table = tables.find(t => t.id === modalTableId);
        // Known bill total for this table, if any (used to reconcile custom split amounts against).
        const billTotal = safeNumber(table?.orderTotal ?? table?.billTotal, NaN);
        const enteredTotal = splitForm.customAmounts.reduce((s, a) => s + safeNumber(a, 0), 0);
        return (
          <Modal title="Split Bill" onClose={() => setModal(null)} width={340}>
            <div style={{ marginBottom: 12, padding: "10px 14px", background: C.bg3, borderRadius: 8, fontSize: 12, color: C.text2 }}>
              Table #{safeText(table?.number, "?")} · {safeText(table?.currentOrder || table?.currentOrderId, "") || "No active order"}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Split Method</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {["equal", "custom"].map(m => (
                  <button key={m} onClick={() => setSplitForm(f => ({ ...f, method: m }))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${splitForm.method === m ? C.amber3 : C.border2}`, background: splitForm.method === m ? C.amberDim : C.bg3, color: splitForm.method === m ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", fontWeight: splitForm.method === m ? 600 : 400, textTransform: "capitalize" }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Number of Ways</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                <button onClick={() => setSplitForm(f => ({ ...f, ways: Math.max(2, f.ways - 1) }))} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 18, cursor: "pointer" }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: C.amber2, minWidth: 32, textAlign: "center" }}>{splitForm.ways}</span>
                <button onClick={() => setSplitForm(f => ({ ...f, ways: Math.min(12, f.ways + 1) }))} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: 18, cursor: "pointer" }}>+</button>
                <span style={{ fontSize: 12, color: C.text3 }}>ways</span>
              </div>
            </div>
            {splitForm.method === "equal" ? (
              <div style={{ padding: "10px 14px", background: C.bg3, borderRadius: 8, marginBottom: 16, fontSize: 12, color: C.text2 }}>
                Each person pays an equal share of the total{Number.isFinite(billTotal) && billTotal > 0 ? ` — ₹${(billTotal / splitForm.ways).toFixed(2)} each` : ""}
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={label}>Amount Per Person</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, maxHeight: 220, overflowY: "auto" }}>
                  {Array.from({ length: splitForm.ways }).map((_, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.text3, width: 16, flexShrink: 0 }}>{i + 1}.</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        style={{ ...input, flex: 1 }}
                        value={splitForm.customAmounts[i] ?? ""}
                        onChange={e => setSplitForm(f => {
                          const next = Array.from({ length: f.ways }, (_, j) => f.customAmounts[j] ?? "");
                          next[i] = e.target.value;
                          return { ...f, customAmounts: next };
                        })}
                        placeholder="₹0.00"
                      />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 6, textAlign: "right" }}>
                  Total entered: ₹{enteredTotal.toFixed(2)}{Number.isFinite(billTotal) && billTotal > 0 ? ` of ₹${billTotal.toFixed(2)}` : ""}
                </div>
              </div>
            )}
            {splitError && <div style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{splitError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {table?.splitBill && (
                <button style={{ ...btn("ghost"), color: C.red, marginRight: "auto" }} onClick={() => { handleSetTables(tables.map(t => t.id === modalTableId ? { ...t, splitBill: null } : t)); setModal(null); }}>Remove Split</button>
              )}
              <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={saveSplitBill}>Confirm Split</button>
            </div>
          </Modal>
        );
      })()}

      {/* All Reservations Modal */}
      {modal === "reservations" && (() => {
        const reservations = tables.filter(t => t.status === "reserved").sort((a, b) => {
          const da = new Date(`${a.reservedDate} ${a.reservedTime}`);
          const db = new Date(`${b.reservedDate} ${b.reservedTime}`);
          return da - db;
        });
        return (
          <Modal title={`Reservations (${reservations.length})`} onClose={() => setModal(null)} width={480}>
            {reservations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.text3, fontSize: 13 }}>No active reservations</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reservations.map(t => (
                  <div key={t.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{safeText(t.reservedFor, "—")}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          Table #{safeText(t.number, "?")} · {safeNumber(t.capacity, 0)} seats
                          {t.reservedPartySize && ` · Party of ${safeNumber(t.reservedPartySize, "?")}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace" }}>{safeText(t.reservedTime, "—")}</div>
                        <div style={{ fontSize: 11, color: C.text3 }}>{safeText(t.reservedDate, "—")}</div>
                      </div>
                    </div>
                    {t.reservedPhone && <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>📞 {t.reservedPhone}</div>}
                    {t.reservedNotes && <div style={{ fontSize: 11, color: C.text3, fontStyle: "italic", marginBottom: 8 }}>"{t.reservedNotes}"</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { openReserve(t.id); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, cursor: "pointer" }}>✎ Edit</button>
                      <button onClick={() => { cancelReservation(t.id); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, cursor: "pointer" }}>✕ Cancel</button>
                      <button onClick={() => { openAssign(t.id); setModal("assign"); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, cursor: "pointer" }}>📋 Seat Now</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Close</button>
            </div>
          </Modal>
        );
      })()}

      {/* Occupancy History Modal */}
      {modal === "history" && (
        <Modal title="Table Activity Log" onClose={() => setModal(null)} width={480}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.text3, fontSize: 13 }}>No activity yet this session</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
              {history.map(h => {
                const eventColors = { Reserved: C.amber, Occupied: C.red, Clearing: C.blue, Cleaning: C.blue, Available: C.green, "Waiter Assigned": C.purple, "Split Bill": C.green, "Reservation Cancelled": C.red, Transferred: C.amber, "Tables Combined": C.purple, "Tables Split": C.purple };
                const col = eventColors[h.event] || C.text2;
                return (
                  <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px 8px 12px", background: C.bg3, borderRadius: 8, borderLeft: `3px solid ${col}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{h.event}</span>
                        <span style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>#{h.tableNumber}</span>
                      </div>
                      {h.detail && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{h.detail}</div>}
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{new Date(h.at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
            <button style={{ ...btn("ghost"), color: C.red, fontSize: 12 }} onClick={() => setHistory([])}>Clear Log</button>
            <button style={btn("ghost")} onClick={() => setModal(null)}>Close</button>
          </div>
        </Modal>
      )}
      {/* Table Transfer / Upgrade Modal */}
      {modal === "transfer" && (() => {
        const source = tables.find(t => t.id === transferSourceId);
        const sourceCapacity = safeNumber(source?.capacity, 0);
        const availableDests = isUpgradeFlow
          ? tables
              .filter(t => t.id !== transferSourceId && t.status === "available" && safeNumber(t.capacity, 0) > sourceCapacity)
              .sort((a, b) => safeNumber(b.capacity, 0) - safeNumber(a.capacity, 0))
          : tables.filter(t => t.id !== transferSourceId);
        return (
          <Modal title={isUpgradeFlow ? "Upgrade Table" : "Transfer Order to Another Table"} onClose={() => setModal(null)} width={360}>
            <div style={{ marginBottom: 12, padding: "10px 14px", background: C.bg3, borderRadius: 8, fontSize: 12, color: C.text2 }}>
              From: Table #{safeText(source?.number, "?")} · {sourceCapacity} seats · Order {safeText(source?.currentOrder || source?.currentOrderId, "none")}
            </div>
            {!source?.currentOrder && !source?.currentOrderId && (
              <div style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>This table has no active order to transfer.</div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={label}>{isUpgradeFlow ? "Upgrade To *" : "Destination Table *"}</label>
              <select style={{ ...input, width: "100%", marginTop: 6 }} value={transferDestId} onChange={e => { setTransferDestId(e.target.value); setTransferError(""); }}>
                <option value="">— select —</option>
                {availableDests.map(t => (
                  <option key={t.id} value={t.id}>
                    {isUpgradeFlow
                      ? `Table #${safeText(t.number, "?")} · ${safeNumber(t.capacity, 0)} seats (+${safeNumber(t.capacity, 0) - sourceCapacity}) · ${safeText(t.area, "—")}`
                      : `Table #${safeText(t.number, "?")} · ${t.status}${t.currentOrder ? ` (order ${t.currentOrder})` : ""}`}
                  </option>
                ))}
              </select>
              <FieldError msg={transferError} />
              {isUpgradeFlow && availableDests.length === 0 && (
                <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>No bigger tables are available right now.</div>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 16 }}>Source table will move to Cleaning. Destination will become Occupied.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={saveTransfer} disabled={!transferDestId}>{isUpgradeFlow ? "Upgrade" : "Transfer"}</button>
            </div>
          </Modal>
        );
      })()}

      {/* Waitlist Modal */}
      {modal === "waitlist" && (
        <Modal title="Waitlist & Queue Management" onClose={() => setModal(null)} width={550}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Add new entry form */}
            <div style={{ background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--cafe-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", borderRadius: "50%" }}>+</span>
                Add Guest to Waitlist
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ ...label, fontSize: 11, marginBottom: 4 }}>Guest Name *</label>
                  <input style={{ ...input, width: "100%", borderColor: waitlistErrors.name ? C.red : "var(--cafe-border)" }} value={waitlistForm.name} onChange={e => setWaitlistForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter name" />
                  <FieldError msg={waitlistErrors.name} />
                </div>
                <div>
                  <label style={{ ...label, fontSize: 11, marginBottom: 4 }}>Party Size *</label>
                  <input type="number" min={1} style={{ ...input, width: "100%", borderColor: waitlistErrors.partySize ? C.red : "var(--cafe-border)" }} value={waitlistForm.partySize} onChange={e => setWaitlistForm(f => ({ ...f, partySize: e.target.value }))} placeholder="#" />
                  <FieldError msg={waitlistErrors.partySize} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ ...label, fontSize: 11, marginBottom: 4 }}>Phone Number</label>
                  <input style={{ ...input, width: "100%", borderColor: waitlistErrors.phone ? C.red : "var(--cafe-border)" }} value={waitlistForm.phone} onChange={e => setWaitlistForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" type="tel" />
                  <FieldError msg={waitlistErrors.phone} />
                </div>
                <div>
                  <label style={{ ...label, fontSize: 11, marginBottom: 4 }}>Special Notes</label>
                  <input style={{ ...input, width: "100%" }} value={waitlistForm.notes} onChange={e => setWaitlistForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. high chair, window seat" />
                </div>
              </div>
              <button style={{ ...btn("primary"), width: "100%", fontSize: 13, padding: "10px 0", borderRadius: 8 }} onClick={saveWaitlistEntry}>
                Add to Queue
              </button>
            </div>

            {/* Active waiting list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>Active Queue</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", fontWeight: 600, background: "var(--cafe-bg-surface)", padding: "4px 10px", borderRadius: 20 }}>
                  {waitlist.filter(w => w.status === "waiting").length} Waiting
                </div>
              </div>

              {waitlist.filter(w => w.status === "waiting").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px dashed var(--cafe-border)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>👥</div>
                  <div style={{ fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>Queue is empty</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)" }}>No guests currently waiting for a table</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 350, overflowY: "auto", paddingRight: 4 }}>
                  {waitlist.filter(w => w.status === "waiting").sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((w, index) => {
                    const availTables = tables.filter(t => t.status === "available" && safeNumber(t.capacity, 0) >= safeNumber(w.partySize, 1));
                    const waitTimeMins = Math.floor((Date.now() - new Date(w.createdAt).getTime()) / 60000);
                    const isLongWait = waitTimeMins > 30;

                    return (
                      <div key={w.id} style={{ background: "var(--cafe-bg-card)", border: `1px solid ${isLongWait ? '#ef444455' : 'var(--cafe-border-light)'}`, borderLeft: `4px solid ${isLongWait ? '#ef4444' : 'var(--cafe-accent)'}`, borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--cafe-text-secondary)" }}>
                              #{index + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cafe-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                                {safeText(w.name)}
                                <span style={{ fontSize: 11, background: "var(--cafe-bg-surface)", padding: "2px 8px", borderRadius: 12, color: "var(--cafe-text-secondary)", fontWeight: 600 }}>Party of {safeNumber(w.partySize, "?")}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4, display: "flex", gap: 12 }}>
                                {w.phone && <span>📞 {w.phone}</span>}
                                <span style={{ color: isLongWait ? '#ef4444' : 'var(--cafe-text-tertiary)', fontWeight: isLongWait ? 600 : 400 }}>⏱️ Waiting {waitTimeMins}m</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => cancelWaitlistEntry(w.id)} style={{ background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, padding: 4 }} title="Remove from waitlist">
                            ×
                          </button>
                        </div>
                        
                        {w.notes && (
                          <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", background: "#fffbeb", padding: "6px 10px", borderRadius: 6, borderLeft: "2px solid #f59e0b", fontStyle: "italic" }}>
                            {w.notes}
                          </div>
                        )}

                        <div style={{ borderTop: "1px dashed var(--cafe-border-light)", paddingTop: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cafe-text-tertiary)", textTransform: "uppercase" }}>Seat at:</span>
                          {availTables.length > 0 ? (
                            availTables.slice(0, 4).map(t => (
                              <button key={t.id} onClick={() => { seatWaitlistGuest(w.id, t.id); }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: `1px solid var(--cafe-success)`, background: "var(--cafe-success-bg)", color: "var(--cafe-success)", cursor: "pointer", fontWeight: 700, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cafe-success)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--cafe-success-bg)'}>
                                Table {safeText(t.number, "?")}
                              </button>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-surface)", padding: "4px 10px", borderRadius: 6 }}>
                              No available tables large enough
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Rotation Strategies Modal */}
      {modal === "rotationStrategies" && (() => {
        const strategies = getRotationStrategies();
        return (
          <Modal title="Table Rotation Strategies" onClose={() => setModal(null)} width={480}>
            {strategies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.text3, fontSize: 13 }}>
                Not enough data to generate strategies. Need more table history.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {strategies.map((strategy, idx) => (
                  <div key={idx} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>
                        {strategy.type === "prioritize_fast" ? "⚡" : strategy.type === "avoid_slow" ? "⚠️" : "🔄"}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text2 }}>{strategy.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>{strategy.description}</div>
                    {strategy.tables.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {strategy.tables.map(tableId => {
                          const t = tables.find(tbl => tbl.id === tableId);
                          return t ? (
                            <span key={tableId} style={{ fontSize: 11, padding: "3px 8px", background: C.bg4, borderRadius: 4, color: C.text2 }}>
                              #{t.number}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Close</button>
            </div>
          </Modal>
        );
      })()}

      {/* Floor Analytics Modal */}
      {modal === "floorAnalytics" && (
        <Modal title="Floor Analytics Dashboard" onClose={() => setModal(null)} width={900}>
          <FloorAnalyticsDashboard
            tables={tables}
            orders={orders}
            selectedFloor="floor-main"
          />
        </Modal>
      )}

      {/* Dialogs */}
      <WarningDialog
        open={reservationConflictDialog.open}
        onClose={() => setReservationConflictDialog({ open: false, table: null, conflicts: null, existingReservation: null, onConfirm: null })}
        onConfirm={reservationConflictDialog.onConfirm}
        title="Reservation Conflict"
        description={reservationConflictDialog.conflicts 
          ? `This reservation overlaps with ${reservationConflictDialog.conflicts.length} other reservation(s).`
          : `Table #${reservationConflictDialog.table?.number} already has a reservation.`
        }
        warning={reservationConflictDialog.conflicts
          ? reservationConflictDialog.conflicts.map(c => `Table #${c.table.number} · ${c.overlapMinutes}min overlap`).join("; ")
          : `Reserved for ${reservationConflictDialog.existingReservation?.reservedFor || "another guest"} at ${reservationConflictDialog.existingReservation?.reservedTime}.`
        }
        consequence="Do you want to proceed with this reservation anyway?"
        confirmLabel="Proceed Anyway"
      />

      <WarningDialog
        open={capacityWarningDialog.open}
        onClose={() => setCapacityWarningDialog({ open: false, table: null, partySize: null, capacity: null, onConfirm: null })}
        onConfirm={capacityWarningDialog.onConfirm}
        title="Capacity Exceeded"
        description="The party size exceeds this table's capacity."
        warning={`Party of ${capacityWarningDialog.partySize} for a table with capacity of ${capacityWarningDialog.capacity}.`}
        consequence="Seating may be cramped and uncomfortable for guests."
        confirmLabel="Reserve Anyway"
      />

      <WarningDialog
        open={orderConflictDialog.open}
        onClose={() => setOrderConflictDialog({ open: false, orderId: null, conflictTable: null, onConfirm: null })}
        onConfirm={orderConflictDialog.onConfirm}
        title="Order Already Assigned"
        description="This order is already assigned to another table."
        warning={`Order ${orderConflictDialog.orderId} is currently on Table #${orderConflictDialog.conflictTable?.number}.`}
        consequence="The order will appear on both tables."
        confirmLabel="Assign Anyway"
      />

      <WarningDialog
        open={reassignDialog.open}
        onClose={() => setReassignDialog({ open: false, table: null, orderId: null, onConfirm: null })}
        onConfirm={reassignDialog.onConfirm}
        title="Reassign Table"
        description="This table is currently occupied or reserved."
        warning={`Table #${reassignDialog.table?.number} is ${reassignDialog.table?.status}.`}
        consequence="The current reservation or order will be affected."
        confirmLabel="Reassign Anyway"
      />

      <WarningDialog
        open={clearTableDialog.open}
        onClose={() => setClearTableDialog({ open: false, table: null, onConfirm: null })}
        onConfirm={clearTableDialog.onConfirm}
        title="Clear Table"
        description="Send this table to cleaning."
        warning={clearTableDialog.table?.status === "occupied" 
          ? `Table #${clearTableDialog.table?.number} has an active order (${clearTableDialog.table?.currentOrder || clearTableDialog.table?.currentOrderId}). The order will be detached.`
          : `Table #${clearTableDialog.table?.number} has a reservation for ${clearTableDialog.table?.reservedFor || "a guest"}.`
        }
        consequence="The table will be marked as cleaning and unavailable for seating."
        confirmLabel="Send to Cleaning"
      />

      <DestructiveDialog
        open={deleteTableDialog.open}
        onClose={() => setDeleteTableDialog({ open: false, table: null, onConfirm: null })}
        onConfirm={deleteTableDialog.onConfirm}
        title="Delete Table"
        description="This action cannot be undone."
        recordName={`Table #${deleteTableDialog.table?.number}`}
        consequence={
          deleteTableDialog.table?.status === "occupied"
            ? `Table is OCCUPIED${(deleteTableDialog.table?.currentOrder || deleteTableDialog.table?.currentOrderId) ? ` with order ${deleteTableDialog.table?.currentOrder || deleteTableDialog.table?.currentOrderId}` : ""}. Deleting may orphan the active order.`
            : deleteTableDialog.table?.status === "reserved"
            ? `Table has an active reservation for ${deleteTableDialog.table?.reservedFor || "a guest"}.`
            : "This table will be permanently removed from the floor plan."
        }
        confirmLabel="Delete Table"
      />

      <WarningDialog
        open={mergeWarningDialog.open}
        onClose={() => setMergeWarningDialog({ open: false, skipped: null, remaining: null, onConfirm: null })}
        onConfirm={mergeWarningDialog.onConfirm}
        title="Skip Ineligible Tables"
        description="Some selected tables cannot be combined."
        warning={`${mergeWarningDialog.skipped} table(s) are occupied, reserved, or already grouped.`}
        consequence={`Only the ${mergeWarningDialog.remaining} eligible tables will be combined.`}
        confirmLabel="Combine Remaining"
      />

      <ConfirmDialog
        open={mergeErrorDialog.open}
        onClose={() => setMergeErrorDialog({ open: false, message: null })}
        onConfirm={() => setMergeErrorDialog({ open: false, message: null })}
        title="Cannot Combine Tables"
        description={mergeErrorDialog.message}
        confirmLabel="OK"
      />

      <WarningDialog
        open={removeWaiterDialog.open}
        onClose={() => setRemoveWaiterDialog({ open: false, table: null, waiterName: null, onConfirm: null })}
        onConfirm={removeWaiterDialog.onConfirm}
        title="Remove Waiter Assignment"
        description="This will remove the waiter from the table."
        warning={`Remove ${removeWaiterDialog.waiterName} from Table #${removeWaiterDialog.table?.number}?`}
        consequence="The table will have no waiter assigned."
        confirmLabel="Remove Waiter"
      />

      <WarningDialog
        open={transferWarningDialog.open}
        onClose={() => setTransferWarningDialog({ open: false, destTable: null, onConfirm: null })}
        onConfirm={transferWarningDialog.onConfirm}
        title="Transfer to Occupied Table"
        description="The destination table is not available."
        warning={`Table #${transferWarningDialog.destTable?.number} is ${transferWarningDialog.destTable?.status}.`}
        consequence="The order will be transferred to this table regardless."
        confirmLabel="Transfer Anyway"
      />

      <WarningDialog
        open={waitlistSeatDialog.open}
        onClose={() => setWaitlistSeatDialog({ open: false, table: null, guestName: null, onConfirm: null })}
        onConfirm={waitlistSeatDialog.onConfirm}
        title="Seat at Unavailable Table"
        description="The selected table is not available."
        warning={`Table #${waitlistSeatDialog.table?.number} is ${waitlistSeatDialog.table?.status}.`}
        consequence="The guest will be seated at this table anyway."
        confirmLabel="Seat Anyway"
      />

      <ConfirmDialog
        open={cancelWaitlistDialog.open}
        onClose={() => setCancelWaitlistDialog({ open: false, guestName: null, onConfirm: null })}
        onConfirm={cancelWaitlistDialog.onConfirm}
        title="Remove from Waitlist"
        description={`Remove ${cancelWaitlistDialog.guestName} from the waitlist?`}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={splitMergedDialog.open}
        onClose={() => setSplitMergedDialog({ open: false, groupId: null, groupNumbers: [], onConfirm: null })}
        onConfirm={splitMergedDialog.onConfirm}
        title="Split Combined Tables"
        description={`Split combined party back into tables ${splitMergedDialog.groupNumbers.join(", ")}?`}
        confirmLabel="Split Tables"
      />

      <TableDetailsPanel 
        isOpen={!!detailsPanelTableId}
        onClose={() => setDetailsPanelTableId(null)}
        table={tables.find(t => t.id === detailsPanelTableId)}
        orders={orders}
        kdsCards={kdsCards}
        staff={staff}
        history={history}
        onOpenPOS={onOpenPOS}
        onViewKitchen={onViewKitchen}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
