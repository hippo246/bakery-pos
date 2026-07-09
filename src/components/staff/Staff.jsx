import { useState, useMemo, useEffect } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_STAFF, STAFF_ROLES, STAFF_STATUS, SHIFT_TYPES } from "../../data/staffConstants";

// --- Safety helpers -----------------------------------------------------------
const SAFE_ROLES   = Array.isArray(STAFF_ROLES)  && STAFF_ROLES.length  ? STAFF_ROLES  : ["All","Barista","Manager","Chef","Kitchen Staff","Waiter","Cashier","Cleaner"];
const SAFE_STATUSES = Array.isArray(STAFF_STATUS) && STAFF_STATUS.length ? STAFF_STATUS : ["All","active","inactive","on_leave"];
const SAFE_SHIFTS  = Array.isArray(SHIFT_TYPES)  && SHIFT_TYPES.length  ? SHIFT_TYPES  : ["Morning","Evening","Night","Full Day"];
const SAFE_INIT    = Array.isArray(INIT_STAFF)   ? INIT_STAFF : [];

const genId     = () => "staff-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr   = (v) => (v === null || v === undefined ? "" : String(v));
const toNum     = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr   = (v) => (Array.isArray(v) ? v : []);

// Avatar initials from name — safe even for 1-word names or empty strings.
const makeAvatar = (name) => {
  const parts = safeStr(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Loose phone validator: strip non-digits, require 7-15 digits.
const cleanPhone = (v) => safeStr(v).replace(/\D/g, "");
const isValidPhone = (v) => { const d = cleanPhone(v); return d.length >= 7 && d.length <= 15; };

// Loose email validator.
const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeStr(v).trim());

// Normalize a raw staff record so the UI never sees null/undefined/NaN.
const normalizeStaffRecord = (s) => ({
  ...s,
  id:         safeStr(s?.id) || genId(),
  name:       safeStr(s?.name).trim() || "Unknown",
  role:       safeStr(s?.role).trim() || "Barista",
  phone:      safeStr(s?.phone).trim(),
  email:      safeStr(s?.email).trim().toLowerCase(),
  status:     safeStr(s?.status).trim() || "active",
  hourlyRate: Math.max(0, toNum(s?.hourlyRate, 0)),
  shifts:     safeArr(s?.shifts).filter(sh => sh && typeof sh === "string"),
  avatar:     safeStr(s?.avatar).trim() || makeAvatar(s?.name),
  joinDate:   safeStr(s?.joinDate) || new Date().toISOString().split("T")[0],
});

export default function Staff({ staff: externalStaff, setStaff: externalSetStaff, orders }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const [staff, setStaff] = useState(() => safeArr(externalStaff).length ? safeArr(externalStaff) : SAFE_INIT);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const defaultRole = SAFE_ROLES.find(r => r !== "All") || "Barista";
  const [form, setForm] = useState({ name: "", role: defaultRole, phone: "", email: "", status: "active", hourlyRate: "", shifts: [] });
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Use external setter if provided, otherwise use local state
  const handleSetStaff = externalSetStaff || setStaff;

  // Calculate staff performance metrics — safe against null staff, null orders,
  // malformed records, and zero-division. Never produces NaN in output.
  const staffPerformance = useMemo(() => {
    const safeStaff  = safeArr(staff).filter(Boolean).map(normalizeStaffRecord);
    const safeOrders = safeArr(orders).filter(o => o && safeStr(o.id));
    return safeStaff.map(person => {
      const staffOrders     = safeOrders.filter(o => safeStr(o.assignedStaff) === safeStr(person.id));
      const completedOrders = staffOrders.filter(o => safeStr(o.status).toUpperCase() === "COMPLETED");
      const totalRevenue    = staffOrders.reduce((sum, o) => sum + Math.max(0, toNum(o.total ?? o.amount, 0)), 0);
      const avgPrepTime     = completedOrders.length > 0
        ? Math.round(completedOrders.reduce((sum, o) => sum + Math.max(0, toNum(o.prepTime, 5)), 0) / completedOrders.length)
        : 0;
      const efficiency = staffOrders.length > 0
        ? Math.min(100, Math.round((completedOrders.length / staffOrders.length) * 100))
        : 0;
      return {
        ...person,
        ordersHandled:   staffOrders.length,
        ordersCompleted: completedOrders.length,
        avgPrepTime,
        efficiency,
        totalRevenue,
      };
    });
  }, [staff, orders]);

  const filtered = staffPerformance.filter(person => {
    if (!person) return false;
    const matchesRole   = roleFilter === "All" || safeStr(person.role) === roleFilter;
    const matchesStatus = statusFilter === "All" || safeStr(person.status) === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [
      person.name, person.email, person.phone, person.role, person.status,
      ...safeArr(person.shifts),
    ].some(f => safeStr(f).toLowerCase().includes(q));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const safeStaffList   = safeArr(staff).filter(Boolean);
  const activeCount     = safeStaffList.filter(s => safeStr(s.status) === "active").length;
  const onLeaveCount    = safeStaffList.filter(s => safeStr(s.status) === "on_leave").length;
  const activeStaff     = safeStaffList.filter(s => safeStr(s.status) === "active");
  const totalHourlyCost = activeStaff.reduce((sum, s) => sum + Math.max(0, toNum(s.hourlyRate, 0)), 0);
  const avgHourlyRate   = activeStaff.length > 0 ? Math.round(totalHourlyCost / activeStaff.length) : 0;
  const totalOrdersHandled = staffPerformance.reduce((sum, s) => sum + (s.ordersHandled || 0), 0);
  const avgEfficiency = staffPerformance.length > 0
    ? Math.min(100, Math.round(staffPerformance.reduce((sum, s) => sum + (s.efficiency || 0), 0) / staffPerformance.length))
    : 0;

  const openAdd = () => {
    setEditStaff(null);
    setForm({ name: "", role: defaultRole, phone: "", email: "", status: "active", hourlyRate: "", shifts: [] });
    setShowModal(true);
  };

  const openEdit = (person) => {
    if (!person) return;
    setEditStaff(safeStr(person.id) || null);
    setForm({
      name:       safeStr(person.name).trim(),
      role:       safeStr(person.role).trim() || defaultRole,
      phone:      safeStr(person.phone).trim(),
      email:      safeStr(person.email).trim().toLowerCase(),
      status:     safeStr(person.status).trim() || "active",
      hourlyRate: person.hourlyRate !== undefined && person.hourlyRate !== null && person.hourlyRate !== "" ? String(person.hourlyRate) : "",
      shifts:     safeArr(person.shifts).filter(sh => typeof sh === "string"),
    });
    setShowModal(true);
  };

  const saveStaff = () => {
    const name = safeStr(form.name).trim();
    if (!name) return alert("Name is required");

    const role = safeStr(form.role).trim();
    if (!role) return alert("Role is required");

    const status = safeStr(form.status).trim();
    if (!status) return alert("Status is required");

    const phone = safeStr(form.phone).trim();
    if (phone && !isValidPhone(phone)) return alert("Phone number must be 7–15 digits");

    const email = safeStr(form.email).trim().toLowerCase();
    if (email && !isValidEmail(email)) return alert("Please enter a valid email address");

    if (form.hourlyRate === "" || form.hourlyRate === null || form.hourlyRate === undefined) return alert("Hourly rate is required");
    const hourlyRate = Number(form.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) return alert("Hourly rate must be a number 0 or greater");

    // Block duplicate phone/email, except when editing the same staff member.
    const others = safeArr(staff).filter(s => s && safeStr(s.id) !== safeStr(editStaff));
    if (phone) {
      const phoneDigits = cleanPhone(phone);
      const dupPhone = others.find(s => cleanPhone(safeStr(s.phone)) === phoneDigits && phoneDigits.length >= 7);
      if (dupPhone) return alert(`Phone ${phone} is already used by ${safeStr(dupPhone.name) || "another staff member"}`);
    }
    if (email) {
      const dupEmail = others.find(s => safeStr(s.email).trim().toLowerCase() === email);
      if (dupEmail) return alert(`Email ${email} is already used by ${safeStr(dupEmail.name) || "another staff member"}`);
    }

    const now = new Date().toISOString();
    const staffData = {
      name,
      role,
      status,
      phone,
      email,
      hourlyRate,
      shifts:    safeArr(form.shifts).filter(sh => typeof sh === "string"),
      avatar:    makeAvatar(name),
      updatedAt: now,
    };

    if (editStaff) {
      // Preserve id, joinDate, createdAt, and any other fields the form doesn't touch.
      handleSetStaff(safeArr(staff).map(s => safeStr(s?.id) === safeStr(editStaff) ? { ...s, ...staffData } : s));
    } else {
      handleSetStaff([
        ...safeArr(staff),
        { ...staffData, id: genId(), joinDate: now.split("T")[0], createdAt: now },
      ]);
    }
    setShowModal(false);
  };

  const toggleShift = (shift) => {
    setForm(prev => {
      const prevShifts = safeArr(prev.shifts);
      return {
        ...prev,
        shifts: prevShifts.includes(shift)
          ? prevShifts.filter(s => s !== shift)
          : [...prevShifts, shift],
      };
    });
  };

  const updateStatus = (id, newStatus) => {
    if (!id) return;
    handleSetStaff(safeArr(staff).map(s =>
      safeStr(s?.id) === safeStr(id) ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    ));
  };

  const deleteStaff = (id) => {
    if (!id) return;
    const target = safeArr(staff).find(s => s && safeStr(s.id) === safeStr(id));
    const name   = target ? (safeStr(target.name).trim() || "this staff member") : "this staff member";
    const hasOrders = safeArr(orders).some(o => o && safeStr(o.assignedStaff) === safeStr(id));
    const warning = hasOrders ? "\n\nWarning: this staff member has handled orders. Historical records will be preserved but unlinked." : "";
    if (!window.confirm(`Delete "${name}"?${warning}`)) return;
    handleSetStaff(safeArr(staff).filter(s => s && safeStr(s.id) !== safeStr(id)));
    if (selectedStaff && safeStr(selectedStaff.id) === safeStr(id)) setSelectedStaff(null);
  };

  // Export currently-filtered staff as a dated CSV — safe against missing fields.
  const exportStaff = () => {
    const esc = (s) => `"${safeStr(s).replace(/"/g, '""')}"`;
    const header = ["name","role","phone","email","status","hourlyRate","shifts","ordersHandled","ordersCompleted","efficiency"].join(",");
    const rows = filtered.map(p => [
      esc(p.name), esc(p.role), esc(p.phone), esc(p.email), esc(p.status),
      p.hourlyRate,
      esc(safeArr(p.shifts).join("/")),
      p.ordersHandled, p.ordersCompleted, p.efficiency + "%",
    ].join(","));
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `staff-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 1, marginBottom: 18, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", background: C.border2 }}>
        {[
          { label: "Headcount",     val: safeArr(staff).length, color: C.text1, sub: "total staff" },
          { label: "Active",        val: activeCount,           color: activeCount > 0 ? C.green : C.text3, sub: "on floor now" },
          { label: "On Leave",      val: onLeaveCount,          color: onLeaveCount > 0 ? C.amber : C.text3, sub: onLeaveCount > 0 ? "away" : "all clear", alert: onLeaveCount > 0 },
          { label: "Avg Rate",      val: `₹${avgHourlyRate}/hr`, color: C.amber2, sub: "active staff", mono: true },
          { label: "Orders Today",  val: totalOrdersHandled,    color: C.blue,   sub: "handled" },
          { label: "Efficiency",    val: avgEfficiency + "%",   color: avgEfficiency >= 80 ? C.green : avgEfficiency >= 60 ? C.amber : C.red, sub: avgEfficiency >= 80 ? "excellent" : avgEfficiency >= 60 ? "acceptable" : "needs review" },
        ].map(m => (
          <div key={m.label} style={{ background: C.bg2, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 3, position: "relative" }}>
            {m.alert && <div style={{ position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: "50%", background: m.color, boxShadow: `0 0 6px ${m.color}` }} />}
            <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: m.mono ? "monospace" : "inherit", color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.text3, pointerEvents: "none" }}>⌕</span>
            <input style={{ ...input, paddingLeft: 26, width: 160, fontSize: 12 }} placeholder="Search name, role…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Role filter — segmented */}
          <div style={{ display: "flex", gap: 4, padding: "3px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border2}` }}>
            {["All", ...SAFE_ROLES.slice(1)].map(role => (
              <button key={role} onClick={() => setRoleFilter(role)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: roleFilter === role ? C.bg1 : "transparent", color: roleFilter === role ? C.amber2 : C.text3, fontSize: 11, fontWeight: roleFilter === role ? 600 : 400, cursor: "pointer", transition: "all .15s", boxShadow: roleFilter === role ? `0 1px 3px rgba(0,0,0,.3), inset 0 0 0 1px ${C.border2}` : "none" }}>
                {role === "All" ? "All roles" : role}
              </button>
            ))}
          </div>
          {/* Status filter — compact chips */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { val: "All",      label: "All" },
              { val: "active",   label: "Active",   color: C.green },
              { val: "on_leave", label: "Leave",    color: C.amber },
              { val: "inactive", label: "Inactive", color: C.text3 },
            ].map(s => (
              <button key={s.val} onClick={() => setStatusFilter(s.val)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${statusFilter === s.val ? (s.color || C.amber) : C.border2}`, background: statusFilter === s.val ? C.bg3 : "transparent", color: statusFilter === s.val ? (s.color || C.amber2) : C.text3, fontSize: 11, fontWeight: statusFilter === s.val ? 600 : 400, cursor: "pointer" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button style={btn("ghost")} onClick={exportStaff} title="Export staff as CSV">↓ CSV</button>
          <div style={{ display: "flex", gap: 1, background: C.bg3, padding: 3, borderRadius: 7, border: `1px solid ${C.border2}` }}>
            {["grid","list"].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: "5px 10px", borderRadius: 5, border: "none", background: viewMode === v ? C.bg1 : "transparent", color: viewMode === v ? C.amber2 : C.text3, fontSize: 11, cursor: "pointer", fontWeight: viewMode === v ? 600 : 400 }}>
                {v === "grid" ? "⊞" : "≡"}
              </button>
            ))}
          </div>
          <button style={btn("primary")} onClick={openAdd}>+ Add Staff</button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 8 }} className="staff-grid">
          {filtered.map(person => {
            const statusColor = person.status === "active" ? C.green : person.status === "on_leave" ? C.amber : C.text3;
            const effColor = person.efficiency >= 80 ? C.green : person.efficiency >= 60 ? C.amber2 : C.red;
            return (
              <div key={person.id} style={{ ...card(), padding: 0, overflow: "hidden", border: `1px solid ${person.status === "on_leave" ? C.amberBorder : person.status === "inactive" ? C.border2 : C.border}`, background: C.bg2, display: "flex", flexDirection: "column" }}>
                {/* Accent bar */}
                <div style={{ height: 3, background: statusColor, opacity: person.status === "inactive" ? 0.2 : 0.7 }} />

                <div style={{ padding: "12px 14px 0", flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: C.bg3, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.amber2, flexShrink: 0, letterSpacing: ".03em" }}>
                      {person.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{person.role}</span>
                        <span style={{ opacity: .4 }}>·</span>
                        <span style={{ color: statusColor, fontWeight: 500 }}>{safeStr(person.status).replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>₹{person.hourlyRate}</div>
                      <div style={{ fontSize: 9, color: C.text3 }}>per hr</div>
                    </div>
                  </div>

                  {/* Shifts */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                    {safeArr(person.shifts).length > 0
                      ? safeArr(person.shifts).map(shift => (
                          <span key={shift} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: C.bg3, border: `1px solid ${C.border2}`, color: C.blue, fontWeight: 500 }}>{safeStr(shift)}</span>
                        ))
                      : <span style={{ fontSize: 10, color: C.text3 }}>No shifts assigned</span>
                    }
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.border2}`, borderBottom: `1px solid ${C.border2}`, marginBottom: 8 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.amber2, lineHeight: 1 }}>{person.ordersHandled}</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>orders</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: effColor, lineHeight: 1 }}>{person.efficiency}%</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>efficiency</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.blue, lineHeight: 1 }}>{person.avgPrepTime || "—"}<span style={{ fontSize: 10, fontWeight: 400 }}>{person.avgPrepTime ? "m" : ""}</span></div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>avg time</div>
                    </div>
                  </div>

                  {/* Contact */}
                  {(person.phone || person.email) && (
                    <div style={{ fontSize: 10, color: C.text3, marginBottom: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                      {person.phone && <span style={{ fontFamily: "monospace", color: C.text2 }}>{person.phone}</span>}
                      {person.email && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.email}</span>}
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{ display: "flex", borderTop: `1px solid ${C.border2}`, marginTop: "auto" }}>
                  <button onClick={() => openEdit(person)} style={{ flex: 1, padding: "9px 0", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>Edit</button>
                  {person.status !== "active"   && <button onClick={() => updateStatus(person.id, "active")}   style={{ padding: "9px 12px", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.green,  fontSize: 10, cursor: "pointer" }}>Active</button>}
                  {person.status !== "on_leave" && <button onClick={() => updateStatus(person.id, "on_leave")} style={{ padding: "9px 12px", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.amber, fontSize: 10, cursor: "pointer" }}>Leave</button>}
                  {person.status !== "inactive" && <button onClick={() => updateStatus(person.id, "inactive")} style={{ padding: "9px 12px", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.text3, fontSize: 10, cursor: "pointer" }}>Off</button>}
                  <button onClick={() => deleteStaff(person.id)} style={{ padding: "9px 12px", border: "none", background: "transparent", color: C.mutedRed, fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div style={{ border: `1px solid ${C.border2}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 90px 70px 60px 80px 80px", gap: 0, padding: "8px 14px", background: C.bg3, borderBottom: `1px solid ${C.border2}` }}>
            {["", "Name / Role", "Shifts", "Status", "Orders", "Efficiency", "Rate"].map(h => (
              <div key={h} style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 500 }}>{h}</div>
            ))}
          </div>
          {filtered.map((person, i) => {
            const statusColor = person.status === "active" ? C.green : person.status === "on_leave" ? C.amber : C.text3;
            const effColor = person.efficiency >= 80 ? C.green : person.efficiency >= 60 ? C.amber2 : C.red;
            return (
              <div key={person.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 90px 70px 60px 80px 80px", gap: 0, padding: "10px 14px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border2}` : "none", background: C.bg2, alignItems: "center" }}>
                {/* Avatar */}
                <div style={{ width: 30, height: 30, borderRadius: 7, background: C.bg3, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.amber2 }}>
                  {person.avatar}
                </div>
                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{person.role}{person.phone ? ` · ${person.phone}` : ""}</div>
                </div>
                {/* Shifts */}
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {safeArr(person.shifts).length > 0
                    ? safeArr(person.shifts).map(shift => <span key={shift} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: C.bg3, border: `1px solid ${C.border2}`, color: C.blue }}>{shift}</span>)
                    : <span style={{ fontSize: 10, color: C.text3 }}>—</span>
                  }
                </div>
                {/* Status */}
                <div style={{ fontSize: 11, fontWeight: 500, color: statusColor }}>{safeStr(person.status).replace(/_/g, " ")}</div>
                {/* Orders */}
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: C.amber2 }}>{person.ordersHandled}</div>
                {/* Efficiency */}
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: effColor }}>{person.efficiency}%</div>
                {/* Rate + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.text2 }}>₹{person.hourlyRate}</span>
                  <button onClick={() => openEdit(person)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.text3, fontSize: 10, cursor: "pointer" }}>✎</button>
                  <button onClick={() => deleteStaff(person.id)} style={{ padding: "3px 7px", borderRadius: 5, border: "none", background: "transparent", color: C.mutedRed, fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.text3 }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: .35 }}>◎</div>
          <div style={{ fontSize: 13, color: C.text2, fontWeight: 500, marginBottom: 6 }}>
            {search || roleFilter !== "All" || statusFilter !== "All" ? "No staff match these filters" : "No staff added yet"}
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 14 }}>
            {search ? `No results for "${search}"` : statusFilter !== "All" ? `No ${statusFilter.replace(/_/g, " ")} staff` : "Add your first team member to get started"}
          </div>
          {(search || roleFilter !== "All" || statusFilter !== "All") && (
            <button onClick={() => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); }} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>Clear filters</button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 16, padding: 24, width: "min(420px,95vw)", maxHeight: "92dvh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border2}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{editStaff ? "Edit Staff Member" : "Add Team Member"}</div>
                {editStaff && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>ID · {editStaff}</div>}
              </div>
              <button style={{ padding: "4px 8px", border: `1px solid ${C.border2}`, borderRadius: 6, background: "transparent", color: C.text3, cursor: "pointer", fontSize: 14, lineHeight: 1 }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Name *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Role *</label>
                <select style={{ ...input }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {SAFE_ROLES.slice(1).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Status *</label>
                <select style={{ ...input }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {SAFE_STATUSES.slice(1).map(status => <option key={status} value={status}>{safeStr(status).replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Phone</label>
                <input style={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="7–15 digits" />
              </div>
              <div>
                <label style={label}>Hourly Rate (₹) *</label>
                <input style={input} type="number" min="0" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Email</label>
              <input style={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...label, marginBottom: 8, display: "block" }}>Shifts</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SAFE_SHIFTS.map(shift => {
                  const active = safeArr(form.shifts).includes(shift);
                  return (
                    <button key={shift} onClick={() => toggleShift(shift)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${active ? C.amber : C.border2}`, background: active ? C.amberDim : "transparent", color: active ? C.amber2 : C.text3, fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all .15s" }}>
                      {shift}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${C.border2}` }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveStaff}>{editStaff ? "Save Changes" : "Add Member"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
