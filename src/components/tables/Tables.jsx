import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_TABLES, TABLE_TYPES, TABLE_AREAS, TABLE_STATUS } from "../../data/tableConstants";

// ── Status config ────────────────────────────────────────────────────────────
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
        style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 24px 28px", width: `min(${width}px,95vw)`, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.55)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>{title}</div>
          <button onClick={onClose} style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: "pointer", lineHeight: 1, padding: "5px 9px", borderRadius: 8, fontWeight: 600 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Validation error ─────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{msg}</div>;
}

// ── Filter pill button ───────────────────────────────────────────────────────
function FilterBtn({ label: lbl, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", height: 30,
        border: `1px solid ${active ? C.amber3 : C.border2}`,
        background: active ? C.amberDim : "transparent",
        color: active ? C.amber2 : C.text3,
        display: "flex", alignItems: "center", gap: 5, transition: "all .15s", whiteSpace: "nowrap",
      }}
    >
      {lbl}
      {count != null && (
        <span style={{ fontSize: 10, background: active ? C.amber3 : C.bg3, color: active ? "#000" : C.text3, padding: "1px 6px", borderRadius: 20, fontWeight: 600, minWidth: 18, textAlign: "center" }}>{count}</span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Tables({ tables: externalTables, setTables: externalSetTables }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

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

  // ── Modal state ─────────────────────────────────────────────────────────
  // ── Waitlist state ───────────────────────────────────────────────────────
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", phone: "", partySize: "", notes: "" });
  const [waitlistErrors, setWaitlistErrors] = useState({});

  // ── Table transfer state ─────────────────────────────────────────────────
  const [transferSourceId, setTransferSourceId] = useState(null);
  const [transferDestId, setTransferDestId] = useState("");
  const [transferError, setTransferError] = useState("");

  const [modal, setModal] = useState(null); // null | "addEdit" | "reserve" | "assign" | "waiter" | "splitBill" | "history" | "reservations" | "waitlist" | "transfer"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ number: "", capacity: "", type: "indoor", area: "main", notes: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formWarnings, setFormWarnings] = useState({});
  const [reserveForm, setReserveForm] = useState({ name: "", date: "", time: "", phone: "", partySize: "", notes: "" });
  const [reserveErrors, setReserveErrors] = useState({});
  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignError, setAssignError] = useState("");
  const [modalTableId, setModalTableId] = useState(null);

  // ── Merge / combine tables state ─────────────────────────────────────────
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState([]); // array of table ids being combined

  // ── Waiter assignment state ──────────────────────────────────────────────
  const [waiters] = useState([
    { id: "w1", name: "Ravi Kumar", active: true },
    { id: "w2", name: "Priya Singh", active: true },
    { id: "w3", name: "Amit Sharma", active: true },
    { id: "w4", name: "Deepa Nair", active: true },
  ]);
  const [waiterForm, setWaiterForm] = useState({ waiterId: "" });

  // ── Split bill state ──────────────────────────────────────────────────────
  const [splitForm, setSplitForm] = useState({ ways: 2, method: "equal", customAmounts: [] });
  const [splitError, setSplitError] = useState("");

  // ── Occupancy history (per-session) ──────────────────────────────────────
  const [history, setHistory] = useState([]); // { tableId, tableNumber, event, at, detail }

  const addHistory = useCallback((tableId, tableNumber, event, detail = "") => {
    setHistory(prev => [{ id: Date.now(), tableId, tableNumber, event, detail, at: new Date().toISOString() }, ...prev].slice(0, 50));
  }, []);

  // Click-outside deselect
  const gridRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (gridRef.current && !gridRef.current.contains(e.target)) setSelectedId(null);
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

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => tables.filter(t => {
    if (!t) return false;
    if (typeFilter !== "All" && t.type !== typeFilter) return false;
    if (areaFilter !== "All" && t.area !== areaFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack = [t.number, t.status, t.type, t.area, t.reservedFor, t.currentOrder, t.currentOrderId, t.waiter?.name]
        .filter(v => v !== null && v !== undefined)
        .map(v => String(v).toLowerCase());
      if (!haystack.some(v => v.includes(q))) return false;
    }
    return true;
  }), [tables, typeFilter, areaFilter, statusFilter, searchQuery]);

  const availableCount = statusCounts.available || 0;
  const occupiedCount  = statusCounts.occupied  || 0;
  const reservedCount  = statusCounts.reserved  || 0;
  const totalCapacity  = useMemo(() => tables.reduce((s, t) => s + safeNumber(t?.capacity, 0), 0), [tables]);
  const occupancyRate  = tables.length === 0 ? 0 : Math.round((occupiedCount / tables.length) * 100);

  // ── Add / Edit table ────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditId(null);
    setForm({ number: "", capacity: "", type: "indoor", area: "main", notes: "" });
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
    };
    if (editId) {
      // Preserve id and all other existing fields; never mutate the original object/array in place.
      handleSetTables(tables.map(t => t.id === editId ? { ...t, ...tableData, updatedAt: now } : t));
    } else {
      handleSetTables([
        ...tables,
        { ...tableData, id: "tbl-" + Date.now(), status: "available", currentOrder: null, createdAt: now, updatedAt: now },
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

    // Reservation conflict: same table, same or overlapping date+time (exact match check)
    if (reserveForm.date && reserveForm.time && !errors.date) {
      const newWhen = new Date(`${reserveForm.date}T${reserveForm.time}`).getTime();
      const sameTableOtherRes = tables.find(t =>
        t.id === modalTableId && t.status === "reserved" &&
        t.reservedDate && t.reservedTime &&
        Math.abs(new Date(`${t.reservedDate}T${t.reservedTime}`).getTime() - newWhen) < 30 * 60 * 1000
      );
      if (sameTableOtherRes && sameTableOtherRes.reservedFor !== (reserveForm.name || "").trim()) {
        if (!window.confirm(`Table #${table?.number} already has a reservation at a similar time (${sameTableOtherRes.reservedFor}). Overwrite?`)) {
          errors.date = `Conflict with existing reservation (${sameTableOtherRes.reservedFor})`;
        }
      }
    }

    const capacity = safeNumber(table?.capacity, 0);
    if (!errors.partySize && partySize != null && capacity > 0 && partySize > capacity) {
      if (!window.confirm(`Party of ${partySize} exceeds this table's capacity (${capacity}). Reserve anyway?`)) {
        errors.partySize = `Exceeds capacity of ${capacity}`;
      }
    }

    if (Object.keys(errors).length) { setReserveErrors(errors); return; }

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
    addHistory(modalTableId, table?.number, "Reserved", `${name} · ${reserveForm.date} ${reserveForm.time}${partySize ? ` · Party of ${partySize}` : ""}`);
    setModal(null);
  }, [reserveForm, modalTableId, tables, handleSetTables, addHistory]);

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
      if (!window.confirm(`Order ${orderId} is already assigned to Table #${conflict.number}. Assign it here too?`)) {
        setAssignError(`Order ${orderId} is already on Table #${conflict.number}`);
        return;
      }
    }

    if ((table.status === "occupied" || table.status === "reserved") &&
      !window.confirm(`Table #${table.number} is currently ${table.status}. Reassign it to order ${orderId}?`)) {
      return;
    }

    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === modalTableId
      ? { ...t, status: "occupied", currentOrder: orderId, currentOrderId: orderId, occupiedAt: now, occupiedSince: now, updatedAt: now }
      : t
    ));
    addHistory(modalTableId, table?.number, "Occupied", `Order ${orderId}`);
    setModal(null);
  }, [assignOrderId, modalTableId, tables, handleSetTables, addHistory]);

  // ── Status helpers ───────────────────────────────────────────────────────
  // Mark a table as cleaning — confirms first if it has an active order or reservation.
  const clearTableFn = useCallback((id) => {
    if (!id) return;
    const table = tables.find(t => t.id === id);
    if (!table) return;
    if (table.status === "occupied" && table.currentOrder) {
      if (!window.confirm(`Clear Table #${table.number} and send to cleaning? Order ${table.currentOrder} will be detached.`)) return;
    } else if (table.status === "reserved") {
      if (!window.confirm(`Table #${table.number} has a reservation for ${table.reservedFor || "a guest"}. Move to cleaning anyway?`)) return;
    }
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === id
      ? { ...t, status: "cleaning", currentOrder: null, currentOrderId: null, occupiedAt: null, occupiedSince: null, waiter: null, splitBill: null, reservedFor: null, reservedDate: null, reservedTime: null, reservedPhone: null, reservedPartySize: null, reservedNotes: null, cleaningStartedAt: now, updatedAt: now }
      : t
    ));
    addHistory(id, table?.number, "Cleaning", table?.currentOrder ? `Was on ${table.currentOrder}` : "");
    setTimeout(() => {
      setLocalTables(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const next = list.map(t => t.id === id && t.status === "cleaning" ? { ...t, status: "available", updatedAt: new Date().toISOString() } : t);
        if (externalSetTables) externalSetTables(next);
        return next;
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
          return { ...t, groupMembers: remaining };
        }
        return t;
      });
    handleSetTables(next);
    if (selectedId === id) setSelectedId(null);
  }, [tables, handleSetTables, selectedId]);

  // Confirms deletion with the table number and extra warnings for occupied/reserved tables.
  const confirmAndDelete = useCallback((table) => {
    if (!table || !table.id) return;
    const num = table.number != null ? table.number : "?";
    let msg = `Delete Table #${num}? This can't be undone.`;
    if (table.status === "occupied") {
      msg = `Table #${num} is currently OCCUPIED${table.currentOrder ? ` (order ${table.currentOrder})` : ""}. Deleting it may orphan the active order. Delete anyway?`;
    } else if (table.status === "reserved") {
      msg = `Table #${num} has an active reservation for ${table.reservedFor || "a guest"}. Delete anyway?`;
    }
    if (window.confirm(msg)) {
      deleteTable(table.id);
      setModal(null);
    }
  }, [deleteTable]);

  // ── Merge / combine tables ───────────────────────────────────────────────
  const toggleMergeMode = useCallback(() => {
    setMergeMode(m => !m);
    setMergeSelection([]);
    setSelectedId(null);
  }, []);

  const toggleMergeSelect = useCallback((id) => {
    setMergeSelection(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }, []);

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
        window.alert("Only available, ungrouped tables can be combined. Please select at least 2 eligible tables.");
      }
      return;
    }
    if (skipped > 0 && !window.confirm(`${skipped} selected table(s) are occupied, reserved, or already grouped and will be skipped. Combine the remaining ${groupMembers.length}?`)) {
      return;
    }

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
  }, [mergeSelection, tables, handleSetTables, addHistory]);

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
    if (!waiter && table.waiter && !window.confirm(`Remove ${table.waiter.name} from Table #${table.number}?`)) {
      return;
    }
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => t.id === modalTableId ? { ...t, waiter, updatedAt: now } : t));
    if (waiter) addHistory(modalTableId, table?.number, "Waiter Assigned", waiter.name);
    else if (table.waiter) addHistory(modalTableId, table?.number, "Waiter Assigned", "Cleared");
    setModal(null);
  }, [waiterForm, modalTableId, tables, waiters, handleSetTables, addHistory]);

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

  // ── Table transfer ────────────────────────────────────────────────────────
  const openTransfer = useCallback((sourceId) => {
    setTransferSourceId(sourceId);
    setTransferDestId("");
    setTransferError("");
    setModal("transfer");
  }, []);

  const saveTransfer = useCallback(() => {
    const source = tables.find(t => t.id === transferSourceId);
    if (!source) { setTransferError("Source table not found"); return; }
    if (!source.currentOrder && !source.currentOrderId) { setTransferError("Source table has no active order to transfer"); return; }
    const destId = transferDestId;
    if (!destId) { setTransferError("Select a destination table"); return; }
    if (destId === transferSourceId) { setTransferError("Cannot transfer to the same table"); return; }
    const dest = tables.find(t => t.id === destId);
    if (!dest) { setTransferError("Destination table not found"); return; }
    if (dest.status === "occupied" || dest.status === "reserved") {
      if (!window.confirm(`Table #${dest.number} is ${dest.status}. Transfer order here anyway?`)) return;
    }
    const orderId = source.currentOrder || source.currentOrderId;
    const now = new Date().toISOString();
    handleSetTables(tables.map(t => {
      if (t.id === transferSourceId) {
        return { ...t, status: "cleaning", currentOrder: null, currentOrderId: null, occupiedAt: null, occupiedSince: null, cleaningStartedAt: now, updatedAt: now };
      }
      if (t.id === destId) {
        return { ...t, status: "occupied", currentOrder: orderId, currentOrderId: orderId, occupiedAt: now, occupiedSince: now, updatedAt: now };
      }
      return t;
    }));
    addHistory(transferSourceId, source.number, "Transferred", `Order ${orderId} → Table #${dest.number}`);
    addHistory(destId, dest.number, "Occupied", `Transferred from Table #${source.number}`);
    setModal(null);
  }, [transferSourceId, transferDestId, tables, handleSetTables, addHistory]);

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
      if (!window.confirm(`Table #${table.number} is ${table.status}. Seat ${guest.name} here anyway?`)) return;
    }
    const now = new Date().toISOString();
    setWaitlist(prev => prev.map(w => w.id === wlId ? { ...w, status: "seated" } : w));
    handleSetTables(tables.map(t => t.id === tableId
      ? { ...t, status: "occupied", occupiedAt: now, occupiedSince: now, updatedAt: now }
      : t
    ));
    addHistory(tableId, table.number, "Occupied", `Waitlist: ${guest.name} (party of ${guest.partySize})`);
  }, [waitlist, tables, handleSetTables, addHistory]);

  const cancelWaitlistEntry = useCallback((wlId) => {
    const guest = waitlist.find(w => w.id === wlId);
    if (!guest) return;
    if (!window.confirm(`Remove ${guest.name} from the waitlist?`)) return;
    setWaitlist(prev => prev.map(w => w.id === wlId ? { ...w, status: "cancelled" } : w));
  }, [waitlist]);

  // ── Filter reset ─────────────────────────────────────────────────────────
  const hasActiveFilters = typeFilter !== "All" || areaFilter !== "All" || statusFilter !== "All" || searchQuery.trim() !== "";
  const clearFilters = useCallback(() => {
    setTypeFilter("All"); setAreaFilter("All"); setStatusFilter("All"); setSearchQuery("");
  }, []);

  const types  = useMemo(() => TABLE_TYPES.filter(t => t !== "All"),  []);
  const areas  = useMemo(() => TABLE_AREAS.filter(a => a !== "All"),  []);
  const statuses = useMemo(() => TABLE_STATUS.filter(s => s !== "All"), []);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Total",     val: tables.length,  color: C.amber2 },
          { label: "Available", val: availableCount, color: C.green  },
          { label: "Occupied",  val: occupiedCount,  color: occupiedCount > 0 ? C.red : C.text3 },
          { label: "Reserved",  val: reservedCount,  color: reservedCount > 0 ? C.amber  : C.text3 },
          { label: "Capacity",  val: `${totalCapacity} seats`, color: C.blue },
          { label: "Occupancy", val: `${occupancyRate}%`,       color: occupancyRate > 70 ? C.red : C.amber2 },
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "14px 16px 12px", borderLeft: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 6, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: C.text3, fontWeight: 600 }}>Floor Occupancy</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: occupancyRate > 70 ? C.red : C.green }}>{occupancyRate}%</span>
        </div>
        <div style={{ height: 8, background: C.bg3, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${occupancyRate}%`, background: occupancyRate > 70 ? `linear-gradient(90deg, ${C.green}, ${C.amber}, ${C.red})` : `linear-gradient(90deg, ${C.green}, ${C.amber})`, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={{ ...input, width: 160, minWidth: 120 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tables…"
          />
          {hasActiveFilters && (
            <FilterBtn label="✕ Clear filters" active={false} onClick={clearFilters} />
          )}
          {types.map(type => (
            <FilterBtn key={type} label={type} active={typeFilter === type} count={typeCounts[type] || 0} onClick={() => setTypeFilter(t => t === type ? "All" : type)} />
          ))}
          {areas.map(area => (
            <FilterBtn key={area} label={area} active={areaFilter === area} count={areaCounts[area] || 0} onClick={() => setAreaFilter(a => a === area ? "All" : area)} />
          ))}
          {statuses.map(status => (
            <FilterBtn key={status} label={STATUS_CFG[status]?.label || status} active={statusFilter === status} count={statusCounts[status] || 0} onClick={() => setStatusFilter(s => s === status ? "All" : status)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ ...btn("ghost"), fontSize: 12 }} onClick={() => setModal("reservations")}>
            Reservations {reservedCount > 0 && <span style={{ marginLeft: 5, background: C.amberDim, color: C.amber2, fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>{reservedCount}</span>}
          </button>
          <button style={{ ...btn("ghost"), fontSize: 12 }} onClick={() => { setWaitlistForm({ name: "", phone: "", partySize: "", notes: "" }); setWaitlistErrors({}); setModal("waitlist"); }}>
            Waitlist {waitlist.filter(w => w.status === "waiting").length > 0 && <span style={{ marginLeft: 5, background: C.bg3, color: C.text2, fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>{waitlist.filter(w => w.status === "waiting").length}</span>}
          </button>
          <button style={{ ...btn("ghost"), fontSize: 12 }} onClick={() => setModal("history")}>Log</button>
          <button
            style={{ ...btn("ghost"), fontSize: 12, borderColor: mergeMode ? C.amber3 : C.border2, color: mergeMode ? C.amber2 : C.text2, background: mergeMode ? C.amberDim : "transparent" }}
            onClick={toggleMergeMode}
          >{mergeMode ? "Cancel Combine" : "Combine Tables"}</button>
          <button style={btn("primary")} onClick={openAdd}>+ Add Table</button>
        </div>
      </div>

      {/* Merge mode action bar */}
      {mergeMode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: C.amberDim, border: `1px solid ${C.amber3}` }}>
          <div style={{ fontSize: 12, color: C.amber2 }}>
            {mergeSelection.length === 0
              ? "Select 2 or more available tables to combine into one party."
              : `${mergeSelection.length} table${mergeSelection.length > 1 ? "s" : ""} selected${mergeSelection.length >= 2 ? ` · ${tables.filter(t => mergeSelection.includes(t.id)).reduce((s, t) => s + safeNumber(t.capacity, 0), 0)} seats total` : ""}`}
          </div>
          <button
            style={{ ...btn("primary"), fontSize: 12, opacity: mergeSelection.length < 2 ? 0.5 : 1, cursor: mergeSelection.length < 2 ? "not-allowed" : "pointer" }}
            disabled={mergeSelection.length < 2}
            onClick={combineSelectedTables}
          >Combine {mergeSelection.length >= 2 ? `(${mergeSelection.length})` : ""}</button>
        </div>
      )}

      {/* Table Grid */}
      <div
        ref={gridRef}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}
        className="tables-grid"
      >
        {filtered.filter(table => !table.groupId || table.groupHost === table.id).map(table => {
          const sc = STATUS_CFG[table.status] || STATUS_CFG.available;
          const isSelected = selectedId === table.id;
          const isMerged = !!table.groupId;
          const groupNumbers = isMerged ? tables.filter(t => t.groupId === table.groupId).map(t => t.number) : [];
          const isMergeSelected = mergeSelection.includes(table.id);
          const canMergeSelect = mergeMode && mergeEligible(table);
          const occupancyMinutes = table.status === "occupied" ? formatOccupancyDuration(table.occupiedAt || table.occupiedSince) : null;
          const occupancyIsLong = typeof occupancyMinutes === "number" && occupancyMinutes > 90;
          const occupancyIsVeryLong = typeof occupancyMinutes === "number" && occupancyMinutes > 150;
          const cleaningMinutes = table.status === "cleaning" ? formatOccupancyDuration(table.cleaningStartedAt) : null;
          return (
            <div
              key={table.id}
              onClick={() => {
                if (mergeMode) {
                  if (canMergeSelect) toggleMergeSelect(table.id);
                  return;
                }
                setSelectedId(id => id === table.id ? null : table.id);
              }}
              style={{
                ...card(),
                padding: "14px 14px 12px",
                border: `1px solid ${mergeMode ? (isMergeSelected ? C.amber3 : C.border2) : (isSelected ? C.amber3 : C.border)}`,
                borderLeft: `4px solid ${mergeMode ? (isMergeSelected ? C.amber3 : C.border) : sc.color}`,
                background: isSelected && !mergeMode ? `${sc.color}0a` : C.bg2,
                cursor: mergeMode && !canMergeSelect ? "not-allowed" : "pointer",
                opacity: mergeMode && !canMergeSelect ? 0.4 : 1,
                transition: "all .15s",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {mergeMode && canMergeSelect && (
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isMergeSelected ? C.amber3 : C.border2}`,
                        background: isMergeSelected ? C.amber3 : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.onAmber3,
                      }}
                    >{isMergeSelected ? "✓" : ""}</div>
                  )}
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>
                    {isMerged ? `#${groupNumbers.join("+")}` : `#${table.number}`}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".07em", padding: "2px 8px", borderRadius: 20, background: `${sc.color}18`, color: sc.color, textTransform: "uppercase" }}>
                  {sc.label}
                </span>
              </div>

              {/* Merged badge */}
              {isMerged && (
                <div style={{ fontSize: 10, color: C.purple, marginBottom: 6, fontWeight: 600 }}>
                  Combined · tables {groupNumbers.join(", ")}
                </div>
              )}

              {/* Meta */}
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>
                {safeNumber(isMerged ? table.mergedCapacity : table.capacity, 0)} seats · <span style={{ textTransform: "capitalize" }}>{safeText(table.type, "—")}</span> · <span style={{ textTransform: "capitalize" }}>{safeText(table.area, "—")}</span>
              </div>

              {/* Notes */}
              {table.notes && (
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 6, fontStyle: "italic", wordBreak: "break-word" }}>{safeText(table.notes)}</div>
              )}

              {/* Current order + timer */}
              {table.currentOrder && (
                <div style={{ fontSize: 10, marginBottom: 6, background: C.amberBg, padding: "5px 8px", borderRadius: 6, display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: ".1em", color: C.text3, fontWeight: 600, marginBottom: 1 }}>Order</div>
                    <div style={{ color: C.amber, fontWeight: 700, wordBreak: "break-word", fontFamily: "monospace", fontSize: 11 }}>{safeText(table.currentOrder)}</div>
                  </div>
                  {table.status === "occupied" && (
                    <span style={{ color: occupancyIsVeryLong ? "#ff3333" : occupancyIsLong ? C.red : C.text3, fontWeight: occupancyIsLong ? 700 : 400, flexShrink: 0, fontSize: 11 }}>
                      {occupancyMinutes != null ? `${occupancyMinutes}m` : "—"}{occupancyIsVeryLong ? " !" : occupancyIsLong ? " ↑" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Waiter badge */}
              {table.waiter && (
                <div style={{ fontSize: 10, color: C.blue, marginBottom: 4 }}>
                  <span style={{ opacity: 0.55, fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em", marginRight: 5, fontWeight: 600 }}>Server</span>{table.waiter.name}
                </div>
              )}

              {/* Split bill badge */}
              {table.splitBill && (
                <div style={{ fontSize: 10, color: C.green, marginBottom: 4 }}>
                  Bill split · {table.splitBill.ways} ways
                </div>
              )}

              {/* Reservation info */}
              {table.status === "reserved" && (
                <div style={{ fontSize: 10, marginBottom: 6, background: C.amberBg, padding: "6px 8px", borderRadius: 6, wordBreak: "break-word", borderLeft: `2px solid ${C.amber}` }}>
                  <div style={{ fontWeight: 700, color: C.amber }}>{safeText(table.reservedFor, "Guest")}</div>
                  <div style={{ color: C.text3, marginTop: 2 }}>{safeText(table.reservedDate, "—")} · {safeText(table.reservedTime, "—")}</div>
                </div>
              )}

              {/* Cleaning indicator */}
              {table.status === "cleaning" && (
                <div style={{ fontSize: 10, color: C.blue, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: C.blue, animation: "pulse 1s infinite", flexShrink: 0 }} />
                  <span>Cleaning{cleaningMinutes != null && cleaningMinutes !== "—" ? ` · ${cleaningMinutes}m` : ""}…</span>
                </div>
              )}

              {/* Actions (visible when selected) */}
              {isSelected && (
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  {table.status === "available" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); openReserve(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Reserve</button>
                      <button
                        onClick={e => { e.stopPropagation(); openAssign(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Order</button>
                      <button
                        onClick={e => { e.stopPropagation(); clearTableFn(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.blue, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Clean</button>
                    </>
                  )}
                  {table.status === "occupied" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); clearTableFn(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Clear</button>
                      <button
                        onClick={e => { e.stopPropagation(); openTransfer(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Transfer</button>
                      <button
                        onClick={e => { e.stopPropagation(); openWaiter(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Server</button>
                      <button
                        onClick={e => { e.stopPropagation(); openSplitBill(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Split</button>
                    </>
                  )}
                  {table.status === "reserved" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); openAssign(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Seat</button>
                      <button
                        onClick={e => { e.stopPropagation(); cancelReservation(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Cancel</button>
                      <button
                        onClick={e => { e.stopPropagation(); clearTableFn(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.blue, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      >Clean</button>
                    </>
                  )}
                  {table.status === "cleaning" && (
                    <button
                      onClick={e => { e.stopPropagation(); markAvailable(table.id); }}
                      style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    >Mark Available</button>
                  )}
                  {isMerged && (
                    <button
                      onClick={e => { e.stopPropagation(); if (window.confirm(`Split combined party back into tables ${groupNumbers.join(", ")}?`)) splitMergedGroup(table.groupId); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.purpleBorder}`, background: "transparent", color: C.purple, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      title="Split combined tables"
                    >Ungroup</button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(table); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    title="Edit"
                  >Edit</button>
                  <button
                    onClick={e => { e.stopPropagation(); confirmAndDelete(table); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    title="Delete"
                  >Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: C.text3 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, border: `2px dashed ${C.border2}`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, opacity: 0.4 }}>
            {hasActiveFilters ? "⊘" : "⊡"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text2, marginBottom: 6 }}>
            {hasActiveFilters ? "No matches" : "No tables yet"}
          </div>
          <div style={{ fontSize: 12 }}>
            {hasActiveFilters ? "Try adjusting or clearing your filters." : "Add your first table to get started."}
          </div>
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
      {modal === "waiter" && (
        <Modal title="Assign Waiter" onClose={() => setModal(null)} width={320}>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Select Waiter</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setWaiterForm({ waiterId: "" })}
                style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${!waiterForm.waiterId ? C.amber3 : C.border2}`, background: !waiterForm.waiterId ? C.amberDim : C.bg3, color: !waiterForm.waiterId ? C.amber2 : C.text2, fontSize: 13, cursor: "pointer", textAlign: "left" }}
              >
                None (unassign)
              </button>
              {waiters.filter(w => w.active).map(w => (
                <button
                  key={w.id}
                  onClick={() => setWaiterForm({ waiterId: w.id })}
                  style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${waiterForm.waiterId === w.id ? C.amber3 : C.border2}`, background: waiterForm.waiterId === w.id ? C.amberDim : C.bg3, color: waiterForm.waiterId === w.id ? C.amber2 : C.text2, fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.bg4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🧑‍🍳</span>
                  {w.name}
                  {waiterForm.waiterId === w.id && <span style={{ marginLeft: "auto", color: C.amber2 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn("primary")} onClick={saveWaiter}>Confirm</button>
          </div>
        </Modal>
      )}

      {/* Split Bill Modal */}
      {modal === "splitBill" && (() => {
        const table = tables.find(t => t.id === modalTableId);
        const orderTotal = 0; // would come from order data
        return (
          <Modal title="Split Bill" onClose={() => setModal(null)} width={340}>
            <div style={{ marginBottom: 12, padding: "10px 14px", background: C.bg3, borderRadius: 8, fontSize: 12, color: C.text2 }}>
              Table #{safeText(table?.number, "?")} · {safeText(table?.currentOrder, "") || "No active order"}
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
            <div style={{ padding: "10px 14px", background: C.bg3, borderRadius: 8, marginBottom: 16, fontSize: 12, color: C.text2 }}>
              {splitForm.method === "equal"
                ? `Each person pays an equal share of the total`
                : `Enter custom amounts per person after confirming`}
            </div>
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
      {/* Table Transfer Modal */}
      {modal === "transfer" && (() => {
        const source = tables.find(t => t.id === transferSourceId);
        const availableDests = tables.filter(t => t.id !== transferSourceId);
        return (
          <Modal title="Transfer Order to Another Table" onClose={() => setModal(null)} width={360}>
            <div style={{ marginBottom: 12, padding: "10px 14px", background: C.bg3, borderRadius: 8, fontSize: 12, color: C.text2 }}>
              From: Table #{safeText(source?.number, "?")} · Order {safeText(source?.currentOrder || source?.currentOrderId, "none")}
            </div>
            {!source?.currentOrder && !source?.currentOrderId && (
              <div style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>This table has no active order to transfer.</div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Destination Table *</label>
              <select style={{ ...input, width: "100%", marginTop: 6 }} value={transferDestId} onChange={e => { setTransferDestId(e.target.value); setTransferError(""); }}>
                <option value="">— select —</option>
                {availableDests.map(t => (
                  <option key={t.id} value={t.id}>Table #{safeText(t.number, "?")} · {t.status}{t.currentOrder ? ` (order ${t.currentOrder})` : ""}</option>
                ))}
              </select>
              <FieldError msg={transferError} />
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 16 }}>Source table will move to Cleaning. Destination will become Occupied.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={saveTransfer} disabled={!transferDestId}>Transfer</button>
            </div>
          </Modal>
        );
      })()}

      {/* Waitlist Modal */}
      {modal === "waitlist" && (
        <Modal title="Waitlist" onClose={() => setModal(null)} width={460}>
          {/* Add new entry form */}
          <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: C.text2 }}>Add to Waitlist</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={label}>Name *</label>
                <input style={{ ...input, width: "100%", borderColor: waitlistErrors.name ? C.red : undefined }} value={waitlistForm.name} onChange={e => setWaitlistForm(f => ({ ...f, name: e.target.value }))} placeholder="Guest name" />
                <FieldError msg={waitlistErrors.name} />
              </div>
              <div>
                <label style={label}>Party Size *</label>
                <input type="number" min={1} style={{ ...input, width: "100%", borderColor: waitlistErrors.partySize ? C.red : undefined }} value={waitlistForm.partySize} onChange={e => setWaitlistForm(f => ({ ...f, partySize: e.target.value }))} placeholder="#" />
                <FieldError msg={waitlistErrors.partySize} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={label}>Phone</label>
                <input style={{ ...input, width: "100%", borderColor: waitlistErrors.phone ? C.red : undefined }} value={waitlistForm.phone} onChange={e => setWaitlistForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" type="tel" />
                <FieldError msg={waitlistErrors.phone} />
              </div>
              <div>
                <label style={label}>Notes</label>
                <input style={{ ...input, width: "100%" }} value={waitlistForm.notes} onChange={e => setWaitlistForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. high chair" />
              </div>
            </div>
            <button style={{ ...btn("primary"), width: "100%", fontSize: 12 }} onClick={saveWaitlistEntry}>Add to Waitlist</button>
          </div>
          {/* Active waiting list */}
          {waitlist.filter(w => w.status === "waiting").length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: C.text3, fontSize: 13 }}>No one waiting right now</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {waitlist.filter(w => w.status === "waiting").map(w => {
                const availTables = tables.filter(t => t.status === "available" && safeNumber(t.capacity, 0) >= safeNumber(w.partySize, 1));
                return (
                  <div key={w.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{safeText(w.name)}</div>
                        <div style={{ fontSize: 11, color: C.text3 }}>Party of {safeNumber(w.partySize, "?")}{w.phone ? ` · 📞 ${w.phone}` : ""}</div>
                        {w.notes && <div style={{ fontSize: 11, color: C.text3, fontStyle: "italic" }}>{w.notes}</div>}
                      </div>
                      <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{new Date(w.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {availTables.length > 0 ? (
                        availTables.slice(0, 3).map(t => (
                          <button key={t.id} onClick={() => { seatWaitlistGuest(w.id, t.id); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, cursor: "pointer", fontWeight: 600 }}>
                            Seat at #{safeText(t.number, "?")}
                          </button>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: C.text3 }}>No available tables with enough seats</span>
                      )}
                      <button onClick={() => cancelWaitlistEntry(w.id)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, cursor: "pointer", marginLeft: "auto", fontWeight: 600 }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
