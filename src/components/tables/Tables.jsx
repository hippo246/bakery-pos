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
        style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: `min(${width}px,95vw)`, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.text3, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
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
        padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", minHeight: 36,
        border: `1px solid ${active ? C.amber3 : C.border2}`,
        background: active ? C.amberDim : C.bg3,
        color: active ? C.amber2 : C.text2,
        display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
      }}
    >
      {lbl}
      {count != null && (
        <span style={{ fontFamily: "monospace", fontSize: 10, background: active ? C.amber3 : C.bg4, color: active ? C.amber2 : C.text3, padding: "1px 5px", borderRadius: 8 }}>{count}</span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Tables({ tables: externalTables, setTables: externalSetTables }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [localTables, setLocalTables] = useState(() => externalTables || INIT_TABLES);

  // Keep local state in sync if parent updates externally
  useEffect(() => {
    if (externalTables) setLocalTables(externalTables);
  }, [externalTables]);

  const tables = localTables;
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
  const [modal, setModal] = useState(null); // null | "addEdit" | "reserve" | "assign" | "waiter" | "splitBill" | "history" | "reservations"
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
    setHistory(prev => [{ id: Date.now(), tableId, tableNumber, event, detail, at: new Date().toISOString() }, ...prev].slice(0, 200));
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

  // ── Derived data ────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tables]);

  const typeCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { c[t.type] = (c[t.type] || 0) + 1; });
    return c;
  }, [tables]);

  const areaCounts = useMemo(() => {
    const c = {};
    tables.forEach(t => { c[t.area] = (c[t.area] || 0) + 1; });
    return c;
  }, [tables]);

  const filtered = useMemo(() => tables.filter(t => {
    if (typeFilter !== "All" && t.type !== typeFilter) return false;
    if (areaFilter !== "All" && t.area !== areaFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  }), [tables, typeFilter, areaFilter, statusFilter]);

  const availableCount = statusCounts.available || 0;
  const occupiedCount  = statusCounts.occupied  || 0;
  const reservedCount  = statusCounts.reserved  || 0;
  const totalCapacity  = useMemo(() => tables.reduce((s, t) => s + t.capacity, 0), [tables]);
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
    setEditId(table.id);
    setForm({
      number: String(table.number),
      capacity: String(table.capacity),
      type: table.type,
      area: table.area,
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
      const dupe = tables.find(t => t.number === numVal && t.id !== editId);
      if (dupe) errors.number = `Table #${numVal} already exists`;
    }
    if (!form.capacity.trim()) errors.capacity = "Required";
    else if (isNaN(Number(form.capacity)) || Number(form.capacity) < 1) errors.capacity = "Must be ≥ 1";
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    const tableData = {
      number: numVal,
      capacity: Number(form.capacity),
      type: form.type,
      area: form.area,
      notes: form.notes.trim() || null,
    };
    if (editId) {
      handleSetTables(tables.map(t => t.id === editId ? { ...t, ...tableData } : t));
    } else {
      handleSetTables([...tables, { ...tableData, id: "tbl-" + Date.now(), status: "available", currentOrder: null }]);
    }
    setModal(null);
  }, [form, editId, tables, handleSetTables]);

  // ── Reserve ─────────────────────────────────────────────────────────────
  const openReserve = useCallback((tableId) => {
    setModalTableId(tableId);
    setReserveForm({ name: "", date: "", time: "" });
    setReserveErrors({});
    setModal("reserve");
  }, []);

  const saveReserve = useCallback(() => {
    const errors = {};
    if (!reserveForm.name.trim()) errors.name = "Required";
    if (!reserveForm.date) errors.date = "Required";
    if (!reserveForm.time) errors.time = "Required";
    if (Object.keys(errors).length) { setReserveErrors(errors); return; }
    const table = tables.find(t => t.id === modalTableId);
    handleSetTables(tables.map(t => t.id === modalTableId
      ? { ...t, status: "reserved", reservedFor: reserveForm.name, reservedDate: reserveForm.date, reservedTime: reserveForm.time, reservedPhone: reserveForm.phone, reservedPartySize: reserveForm.partySize, reservedNotes: reserveForm.notes }
      : t
    ));
    addHistory(modalTableId, table?.number, "Reserved", `${reserveForm.name} · ${reserveForm.date} ${reserveForm.time}${reserveForm.partySize ? ` · Party of ${reserveForm.partySize}` : ""}`);
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
    if (!assignOrderId.trim()) { setAssignError("Order ID is required"); return; }
    const table = tables.find(t => t.id === modalTableId);
    handleSetTables(tables.map(t => t.id === modalTableId
      ? { ...t, status: "occupied", currentOrder: assignOrderId.trim(), occupiedAt: new Date().toISOString() }
      : t
    ));
    addHistory(modalTableId, table?.number, "Occupied", `Order ${assignOrderId.trim()}`);
    setModal(null);
  }, [assignOrderId, modalTableId, tables, handleSetTables, addHistory]);

  // ── Status helpers ───────────────────────────────────────────────────────
  const clearTableFn = useCallback((id) => {
    const table = tables.find(t => t.id === id);
    handleSetTables(tables.map(t => t.id === id ? { ...t, status: "cleaning", currentOrder: null, waiter: null, splitBill: null } : t));
    addHistory(id, table?.number, "Clearing", table?.currentOrder ? `Was on ${table.currentOrder}` : "");
    setTimeout(() => {
      setLocalTables(prev => {
        const next = prev.map(t => t.id === id && t.status === "cleaning" ? { ...t, status: "available" } : t);
        if (externalSetTables) externalSetTables(next);
        return next;
      });
      setHistory(prev => [{ id: Date.now(), tableId: id, tableNumber: table?.number, event: "Available", detail: "Cleaning done", at: new Date().toISOString() }, ...prev].slice(0, 200));
    }, 3000);
  }, [tables, handleSetTables, externalSetTables, addHistory]);

  const deleteTable = useCallback((id) => {
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
    return !table.groupId && (table.status === "available");
  }, []);

  const combineSelectedTables = useCallback(() => {
    if (mergeSelection.length < 2) return;
    const groupId = "grp-" + Date.now();
    const groupMembers = [...mergeSelection];
    const combinedCapacity = tables
      .filter(t => groupMembers.includes(t.id))
      .reduce((s, t) => s + t.capacity, 0);
    const hostId = groupMembers[0];

    handleSetTables(tables.map(t => {
      if (!groupMembers.includes(t.id)) return t;
      return {
        ...t,
        groupId,
        groupMembers,
        groupHost: hostId,
        mergedCapacity: combinedCapacity,
      };
    }));

    const numbers = tables.filter(t => groupMembers.includes(t.id)).map(t => t.number);
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
    const waiter = waiters.find(w => w.id === waiterForm.waiterId) || null;
    const table = tables.find(t => t.id === modalTableId);
    handleSetTables(tables.map(t => t.id === modalTableId ? { ...t, waiter } : t));
    if (waiter) addHistory(modalTableId, table?.number, "Waiter Assigned", waiter.name);
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
    if (splitForm.ways < 2) { setSplitError("Must split at least 2 ways"); return; }
    const table = tables.find(t => t.id === modalTableId);
    handleSetTables(tables.map(t => t.id === modalTableId ? { ...t, splitBill: { ways: splitForm.ways, method: splitForm.method } } : t));
    addHistory(modalTableId, table?.number, "Split Bill", `${splitForm.ways} ways (${splitForm.method})`);
    setModal(null);
  }, [splitForm, modalTableId, tables, handleSetTables, addHistory]);

  // ── Cancel reservation ────────────────────────────────────────────────────
  const cancelReservation = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    handleSetTables(tables.map(t => t.id === tableId
      ? { ...t, status: "available", reservedFor: null, reservedDate: null, reservedTime: null, reservedPhone: null, reservedPartySize: null, reservedNotes: null }
      : t
    ));
    addHistory(tableId, table?.number, "Reservation Cancelled", table?.reservedFor || "");
  }, [tables, handleSetTables, addHistory]);

  // ── Filter reset ─────────────────────────────────────────────────────────
  const hasActiveFilters = typeFilter !== "All" || areaFilter !== "All" || statusFilter !== "All";
  const clearFilters = useCallback(() => {
    setTypeFilter("All"); setAreaFilter("All"); setStatusFilter("All");
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
          <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div style={{ marginBottom: 16, height: 6, background: C.bg3, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${occupancyRate}%`, background: occupancyRate > 70 ? C.red : C.green, transition: "width .4s" }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
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
            📅 Reservations {reservedCount > 0 && <span style={{ marginLeft: 4, background: C.amberDim, color: C.amber2, fontSize: 10, padding: "1px 5px", borderRadius: 8, fontFamily: "monospace" }}>{reservedCount}</span>}
          </button>
          <button style={{ ...btn("ghost"), fontSize: 12 }} onClick={() => setModal("history")}>🕐 History</button>
          <button
            style={{ ...btn("ghost"), fontSize: 12, borderColor: mergeMode ? C.amber3 : C.border2, color: mergeMode ? C.amber2 : C.text2, background: mergeMode ? C.amberDim : C.bg3 }}
            onClick={toggleMergeMode}
          >🔗 {mergeMode ? "Cancel Combine" : "Combine Tables"}</button>
          <button style={btn("primary")} onClick={openAdd}>＋ Add Table</button>
        </div>
      </div>

      {/* Merge mode action bar */}
      {mergeMode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: C.amberDim, border: `1px solid ${C.amber3}` }}>
          <div style={{ fontSize: 12, color: C.amber2 }}>
            {mergeSelection.length === 0
              ? "Select 2 or more available tables to combine into one party."
              : `${mergeSelection.length} table${mergeSelection.length > 1 ? "s" : ""} selected${mergeSelection.length >= 2 ? ` · ${tables.filter(t => mergeSelection.includes(t.id)).reduce((s, t) => s + t.capacity, 0)} seats total` : ""}`}
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
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}
        className="tables-grid"
      >
        {filtered.filter(table => !table.groupId || table.groupHost === table.id).map(table => {
          const sc = STATUS_CFG[table.status] || STATUS_CFG.available;
          const isSelected = selectedId === table.id;
          const isMerged = !!table.groupId;
          const groupNumbers = isMerged ? tables.filter(t => t.groupId === table.groupId).map(t => t.number) : [];
          const isMergeSelected = mergeSelection.includes(table.id);
          const canMergeSelect = mergeMode && mergeEligible(table);
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
                border: `2px solid ${mergeMode ? (isMergeSelected ? C.amber3 : C.border2) : (isSelected ? C.amber3 : sc.bg)}`,
                background: sc.bg,
                cursor: mergeMode && !canMergeSelect ? "not-allowed" : "pointer",
                opacity: mergeMode && !canMergeSelect ? 0.45 : 1,
                transition: "all .15s",
                outline: isSelected && !mergeMode ? `2px solid ${C.amber3}40` : "none",
                outlineOffset: 2,
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
                  <div style={{ fontSize: 22, fontWeight: 800, color: sc.color, fontFamily: "monospace" }}>
                    {isMerged ? `#${groupNumbers.join("+")}` : `#${table.number}`}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".05em", padding: "3px 7px", borderRadius: 6, background: `${sc.color}20`, color: sc.color, textTransform: "uppercase", border: `1px solid ${sc.color}40` }}>
                  {sc.label}
                </span>
              </div>

              {/* Merged badge */}
              {isMerged && (
                <div style={{ fontSize: 10, color: C.purple, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>🔗</span><span>Combined party · tables {groupNumbers.join(", ")}</span>
                </div>
              )}

              {/* Meta */}
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span>👥 {isMerged ? table.mergedCapacity : table.capacity}</span>
                <span style={{ color: C.text3 }}>·</span>
                <span style={{ textTransform: "capitalize" }}>{table.type}</span>
                <span style={{ color: C.text3 }}>·</span>
                <span style={{ textTransform: "capitalize" }}>{table.area}</span>
              </div>

              {/* Notes */}
              {table.notes && (
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 6, fontStyle: "italic" }}>📝 {table.notes}</div>
              )}

              {/* Current order + timer */}
              {table.currentOrder && (
                <div style={{ fontSize: 10, color: C.amber, marginBottom: 4, fontFamily: "monospace", background: C.amberBg, padding: "3px 6px", borderRadius: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>📋 {table.currentOrder}</span>
                  {table.occupiedAt && (
                    <span style={{ color: C.text3 }}>
                      {Math.floor((Date.now() - new Date(table.occupiedAt).getTime()) / 60000)}m
                    </span>
                  )}
                </div>
              )}

              {/* Waiter badge */}
              {table.waiter && (
                <div style={{ fontSize: 10, color: C.blue, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>🧑‍🍳</span><span>{table.waiter.name}</span>
                </div>
              )}

              {/* Split bill badge */}
              {table.splitBill && (
                <div style={{ fontSize: 10, color: C.green, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>✂️</span><span>Split {table.splitBill.ways} ways</span>
                </div>
              )}

              {/* Reservation info */}
              {table.status === "reserved" && (
                <div style={{ fontSize: 10, color: C.amber, marginBottom: 6, background: C.amberBg, padding: "4px 6px", borderRadius: 4 }}>
                  <div>📅 {table.reservedFor}</div>
                  <div style={{ color: C.text3, marginTop: 2 }}>{table.reservedDate} · {table.reservedTime}</div>
                </div>
              )}

              {/* Cleaning indicator */}
              {table.status === "cleaning" && (
                <div style={{ fontSize: 10, color: C.blue, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.blue, animation: "pulse 1s infinite" }} />
                  Cleaning in progress…
                </div>
              )}

              {/* Actions (visible when selected) */}
              {isSelected && (
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  {table.status === "available" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); openReserve(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.amber3}`, background: C.amberDim, color: C.amber2, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >📅 Reserve</button>
                      <button
                        onClick={e => { e.stopPropagation(); openAssign(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >📋 Assign</button>
                    </>
                  )}
                  {table.status === "occupied" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); clearTableFn(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >✓ Clear</button>
                      <button
                        onClick={e => { e.stopPropagation(); openWaiter(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >🧑‍🍳 Waiter</button>
                      <button
                        onClick={e => { e.stopPropagation(); openSplitBill(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >✂️ Split</button>
                    </>
                  )}
                  {table.status === "reserved" && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); openAssign(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >📋 Seat</button>
                      <button
                        onClick={e => { e.stopPropagation(); cancelReservation(table.id); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
                      >✕ Cancel</button>
                    </>
                  )}
                  {isMerged && (
                    <button
                      onClick={e => { e.stopPropagation(); if (window.confirm(`Split combined party back into tables ${groupNumbers.join(", ")}?`)) splitMergedGroup(table.groupId); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.purpleBorder}`, background: "transparent", color: C.purple, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                      title="Split combined tables"
                    >🔗✕ Split</button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(table); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}
                    title="Edit"
                  >✎</button>
                  <button
                    onClick={e => { e.stopPropagation(); if (window.confirm("Delete this table?")) deleteTable(table.id); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer" }}
                    title="Delete"
                  >🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>
          {hasActiveFilters ? "No tables match your filters." : "No tables yet. Add one to get started."}
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
                onClick={() => { if (window.confirm("Delete this table? This can't be undone.")) { deleteTable(editId); setModal(null); } }}
              >🗑 Delete</button>
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
              Table #{table?.number} · {table?.currentOrder || "No active order"}
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
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.reservedFor}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          Table #{t.number} · {t.capacity} seats
                          {t.reservedPartySize && ` · Party of ${t.reservedPartySize}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace" }}>{t.reservedTime}</div>
                        <div style={{ fontSize: 11, color: C.text3 }}>{t.reservedDate}</div>
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
                const eventColors = { Reserved: C.amber, Occupied: C.red, Clearing: C.blue, Available: C.green, "Waiter Assigned": C.purple, "Split Bill": C.green, "Reservation Cancelled": C.red };
                const col = eventColors[h.event] || C.text2;
                return (
                  <div key={h.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 10px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{h.event}</span>
                        <span style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>Table #{h.tableNumber}</span>
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
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
