import React from 'react';
import { useState, useMemo, useEffect, useCallback } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_STAFF, STAFF_ROLES, STAFF_STATUS, SHIFT_TYPES } from "../../data/staffConstants";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";
import { triggerStaffNotification } from "../../utils/notificationTriggers.js";
import { saveNotifications } from "../../utils/notificationService.js";
import { StaffPermissions } from "../../utils/permissionService.js";
import { createSecurityAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";

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

export default function Staff({ staff: externalStaff, setStaff: externalSetStaff, orders, tables, notifications, setNotifications }) {
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
  const [formError, setFormError] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // cards | list
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, name: null, hasOrders: false, onConfirm: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, staffId: null, currentStatus: null, newStatus: null, onConfirm: null });
  const [permissionDeniedDialog, setPermissionDeniedDialog] = useState({ open: false, action: '', requiredPermission: '', currentRole: '' });

  // Use external setter if provided, otherwise use local state
  const handleSetStaff = externalSetStaff || setStaff;

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

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
  }, [staff, orders, roleFilter, statusFilter, search]);

  // Check for staff shift issues periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      staff.forEach(person => {
        if (!person || person.status !== 'active') return;

        // Check for shift starting soon (within 15 minutes)
        person.shifts.forEach(shift => {
          if (!shift || typeof shift !== 'string') return;
          const shiftTime = shift.split('-')[0]; // Get start time
          if (!shiftTime) return;
          
          const [shiftHour, shiftMin] = shiftTime.split(':').map(Number);
          const shiftMinutes = shiftHour * 60 + shiftMin;
          const minutesUntil = shiftMinutes - currentTime;
          
          if (minutesUntil > 0 && minutesUntil <= 15) {
            const notif = triggerStaffNotification(person, 'SHIFT_STARTING_SOON', {
              minutesUntil
            });
            addNotification(notif);
          }
        });
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [staff, addNotification]);

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
    setFormError("");
    setForm({ name: "", role: defaultRole, phone: "", email: "", status: "active", hourlyRate: "", shifts: [] });
    setShowModal(true);
  };

  const openEdit = (person) => {
    if (!person) return;
    setEditStaff(safeStr(person.id) || null);
    setFormError("");
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
    setFormError("");
    const name = safeStr(form.name).trim();
    if (!name) { setFormError("Name is required"); return; }

    const role = safeStr(form.role).trim();
    if (!role) { setFormError("Role is required"); return; }

    const status = safeStr(form.status).trim();
    if (!status) { setFormError("Status is required"); return; }

    const phone = safeStr(form.phone).trim();
    if (phone && !isValidPhone(phone)) { setFormError("Phone number must be 7–15 digits"); return; }

    const email = safeStr(form.email).trim().toLowerCase();
    if (email && !isValidEmail(email)) { setFormError("Please enter a valid email address"); return; }

    if (form.hourlyRate === "" || form.hourlyRate === null || form.hourlyRate === undefined) { setFormError("Hourly rate is required"); return; }
    const hourlyRate = Number(form.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) { setFormError("Hourly rate must be a number 0 or greater"); return; }

    // Block duplicate phone/email, except when editing the same staff member.
    const others = safeArr(staff).filter(s => s && safeStr(s.id) !== safeStr(editStaff));
    if (phone) {
      const phoneDigits = cleanPhone(phone);
      const dupPhone = others.find(s => cleanPhone(safeStr(s.phone)) === phoneDigits && phoneDigits.length >= 7);
      if (dupPhone) { setFormError(`Phone ${phone} is already used by ${safeStr(dupPhone.name) || "another staff member"}`); return; }
    }
    if (email) {
      const dupEmail = others.find(s => safeStr(s.email).trim().toLowerCase() === email);
      if (dupEmail) { setFormError(`Email ${email} is already used by ${safeStr(dupEmail.name) || "another staff member"}`); return; }
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

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishStaffEvent('staff.updated', {
        staffId: editStaff,
        staffName: staffData.name,
        role: staffData.role,
        status: staffData.status,
        staffId: getCurrentUserId()
      });
    } else {
      handleSetStaff([
        ...safeArr(staff),
        { ...staffData, id: genId(), joinDate: now.split("T")[0], createdAt: now },
      ]);

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishStaffEvent('staff.created', {
        staffId: genId(),
        staffName: staffData.name,
        role: staffData.role,
        status: staffData.status,
        staffId: getCurrentUserId()
      });
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
    const target = safeArr(staff).find(s => s && safeStr(s.id) === safeStr(id));
    const currentStatus = target ? safeStr(target.status) : null;
    setStatusDialog({
      open: true,
      staffId: id,
      currentStatus,
      newStatus,
      onConfirm: () => {
        setStatusDialog({ open: false, staffId: null, currentStatus: null, newStatus: null, onConfirm: null });
        handleSetStaff(safeArr(staff).map(s =>
          safeStr(s?.id) === safeStr(id) ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
        ));

        // Publish event for real-time Dashboard synchronization
        moduleEventPublisher.publishStaffEvent('staff.status_changed', {
          staffId: id,
          previousStatus: currentStatus,
          newStatus: newStatus,
          staffId: getCurrentUserId()
        });
      }
    });
  };

  const deleteStaff = (id) => {
    if (!id) return;
    
    // Check permission before allowing delete
    const permissionCheck = StaffPermissions.canDelete();
    if (!permissionCheck.allowed) {
      // Log permission denial
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'STAFF_DELETE',
        details: { staffId: id, requiredPermission: permissionCheck.requiredPermission }
      });
      if (setNotifications) {
        setNotifications(prev => [denialLog, ...(prev || [])]);
      }
      
      setPermissionDeniedDialog({
        open: true,
        action: 'delete staff member',
        requiredPermission: permissionCheck.requiredPermission,
        currentRole: permissionCheck.currentRole || '',
      });
      return;
    }
    
    const target = safeArr(staff).find(s => s && safeStr(s.id) === safeStr(id));
    const name   = target ? (safeStr(target.name).trim() || "this staff member") : "this staff member";
    const hasOrders = safeArr(orders).some(o => o && safeStr(o.assignedStaff) === safeStr(id));
    setDeleteDialog({
      open: true,
      name,
      hasOrders,
      onConfirm: () => {
        setDeleteDialog({ open: false, name: null, hasOrders: false, onConfirm: null });
        handleSetStaff(safeArr(staff).filter(s => s && safeStr(s.id) !== safeStr(id)));
        if (selectedStaff && safeStr(selectedStaff.id) === safeStr(id)) setSelectedStaff(null);
        
        // Log staff deletion
        const deleteLog = createSecurityAuditLog({
          userId: getCurrentUserId(),
          action: 'STAFF_DELETE',
          details: { staffId: id, staffName: name, hadOrders: hasOrders }
        });
        if (setNotifications) {
          setNotifications(prev => [deleteLog, ...(prev || [])]);
        }
      }
    });
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
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Team Operations
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
          Manage today's crew, attendance, shifts, and station coverage
        </div>

        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Scheduled Today", count: safeArr(staff).length, color: "var(--cafe-text-secondary)" },
            { label: "Clocked In", count: activeCount, color: "var(--cafe-success)" },
            { label: "On Leave", count: onLeaveCount, color: onLeaveCount > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
            { label: "Inactive Staff", count: safeArr(staff).filter(s => safeStr(s.status) === "inactive").length, color: "var(--cafe-text-tertiary)" },
          ].map(chip => (
            <div key={chip.label} style={{
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: "var(--cafe-radius-md)",
              padding: "8px 14px",
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

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input 
              style={{ ...input, paddingLeft: 32, width: isMobile ? "100%" : 200, fontSize: "var(--cafe-font-sm)" }} 
              placeholder="Search name, phone, role…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          {/* Role filter */}
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            {SAFE_ROLES.slice(1).map(role => <option key={role} value={role}>{role}</option>)}
          </select>

          {/* Status filter */}
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {SAFE_STATUSES.slice(1).map(status => <option key={status} value={status}>{safeStr(status).replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button style={btn("ghost")} onClick={exportStaff} title="Export staff as CSV">Export</button>
          <div style={{ display: "flex", gap: 2, background: "var(--cafe-bg-surface)", padding: 2, borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)" }}>
            {["cards","list"].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-xs)", border: "none", background: viewMode === v ? "var(--cafe-bg-card)" : "transparent", color: viewMode === v ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: viewMode === v ? 600 : 400 }}>
                {v === "cards" ? "Cards" : "List"}
              </button>
            ))}
          </div>
          <button style={btn("primary")} onClick={openAdd}>+ Add Team Member</button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: isMobile ? 8 : 12 }} className="staff-cards">
          {filtered.map(person => {
            const isActive = person.status === "active";
            const isOnLeave = person.status === "on_leave";
            const isInactive = person.status === "inactive";
            const statusColor = isActive ? "var(--cafe-success)" : isOnLeave ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)";
            const effColor = person.efficiency >= 80 ? "var(--cafe-success)" : person.efficiency >= 60 ? "var(--cafe-accent)" : "var(--cafe-danger)";
            const statusLabel = safeStr(person.status).replace(/_/g, " ");
            
            return (
              <div 
                key={person.id} 
                onClick={() => { setSelectedStaff(person); setShowProfilePanel(true); }}
                style={{ 
                  ...card(), 
                  padding: 0, 
                  overflow: "hidden", 
                  border: `1px solid ${isOnLeave ? "var(--cafe-warning-border)" : isInactive ? "var(--cafe-border-light)" : "var(--cafe-border-light)"}`, 
                  background: "var(--cafe-bg-card)", 
                  display: "flex", 
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--cafe-shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Status bar */}
                <div style={{ height: 3, background: statusColor, opacity: isActive ? 1 : 0.5 }} />

                <div style={{ padding: 16, flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: "var(--cafe-radius-md)", 
                      background: "var(--cafe-bg-surface)", 
                      border: `1px solid var(--cafe-border-light)`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: "var(--cafe-accent)", 
                      flexShrink: 0, 
                      letterSpacing: "0.03em" 
                    }}>
                      {person.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{person.role}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ color: statusColor, fontWeight: 500, textTransform: "capitalize" }}>{statusLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shifts */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Shifts</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {safeArr(person.shifts).length > 0
                        ? safeArr(person.shifts).map(shift => (
                            <span key={shift} style={{ fontSize: "var(--cafe-font-xs)", padding: "4px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-info)", fontWeight: 500 }}>{safeStr(shift)}</span>
                          ))
                        : <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>No shifts assigned</span>
                      }
                    </div>
                  </div>

                  {/* Performance stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: 10, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", marginBottom: 12 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)", lineHeight: 1 }}>{person.ordersHandled}</div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Orders</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: effColor, lineHeight: 1 }}>{person.efficiency}%</div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Efficiency</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-info)", lineHeight: 1 }}>{person.avgPrepTime || "—"}<span style={{ fontSize: 10, fontWeight: 400 }}>{person.avgPrepTime ? "m" : ""}</span></div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Avg Time</div>
                    </div>
                  </div>

                  {/* Contact */}
                  {(person.phone || person.email) && (
                    <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", display: "flex", flexDirection: "column", gap: 2 }}>
                      {person.phone && <span style={{ fontFamily: "monospace", color: "var(--cafe-text-secondary)" }}>{person.phone}</span>}
                      {person.email && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.email}</span>}
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{ display: "flex", borderTop: "1px solid var(--cafe-border-light)", padding: 8 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEdit(person); }} 
                    style={{ flex: 1, padding: "8px 0", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
                  >
                    Edit
                  </button>
                  {isActive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStatus(person.id, "on_leave"); }} 
                      style={{ flex: 1, padding: "8px 0", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-warning)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
                    >
                      Leave
                    </button>
                  )}
                  {!isActive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStatus(person.id, "active"); }} 
                      style={{ flex: 1, padding: "8px 0", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-success)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteStaff(person.id); }} 
                    style={{ padding: "8px 16px", border: "none", background: "transparent", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div style={{ border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)", overflow: "hidden" }}>
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 100px 80px 70px 80px 120px", gap: 0, padding: "12px 16px", background: "var(--cafe-bg-surface)", borderBottom: "1px solid var(--cafe-border-light)" }}>
              {["", "Name / Role", "Shifts", "Status", "Orders", "Efficiency", "Actions"].map(h => (
                <div key={h} style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{h}</div>
              ))}
            </div>
          )}
          {filtered.map((person, i) => {
            const isActive = person.status === "active";
            const isOnLeave = person.status === "on_leave";
            const isInactive = person.status === "inactive";
            const statusColor = isActive ? "var(--cafe-success)" : isOnLeave ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)";
            const effColor = person.efficiency >= 80 ? "var(--cafe-success)" : person.efficiency >= 60 ? "var(--cafe-accent)" : "var(--cafe-danger)";
            const statusLabel = safeStr(person.status).replace(/_/g, " ");
            
            if (isMobile) {
              return (
                <div 
                  key={person.id} 
                  onClick={() => { setSelectedStaff(person); setShowProfilePanel(true); }}
                  style={{ 
                    padding: "14px 16px", 
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--cafe-border-light)" : "none", 
                    background: "var(--cafe-bg-card)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: "var(--cafe-radius-sm)", 
                      background: "var(--cafe-bg-surface)", 
                      border: "1px solid var(--cafe-border-light)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: "var(--cafe-accent)" 
                    }}>
                      {person.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>{person.name}</div>
                      <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>{person.role}</div>
                    </div>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "var(--cafe-radius-xs)", 
                      background: isActive ? "var(--cafe-success-bg)" : isOnLeave ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)",
                      color: statusColor,
                      fontSize: "var(--cafe-font-xs", 
                      fontWeight: 600, 
                      textTransform: "capitalize" 
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>Orders</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-accent)", fontFamily: "monospace" }}>{person.ordersHandled}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>Efficiency</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: effColor, fontFamily: "monospace" }}>{person.efficiency}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>Avg Time</div>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-info)", fontFamily: "monospace" }}>{person.avgPrepTime || "—"}{person.avgPrepTime ? "m" : ""}</div>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div 
                key={person.id} 
                onClick={() => { setSelectedStaff(person); setShowProfilePanel(true); }}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "48px 1fr 100px 80px 70px 80px 120px", 
                  gap: 0, 
                  padding: "14px 16px", 
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--cafe-border-light)" : "none", 
                  background: "var(--cafe-bg-card)", 
                  alignItems: "center",
                  cursor: "pointer",
                  ":hover": {
                    background: "var(--cafe-bg-surface)"
                  }
                }}
              >
                {/* Avatar */}
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: "var(--cafe-radius-sm)", 
                  background: "var(--cafe-bg-surface)", 
                  border: "1px solid var(--cafe-border-light)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: "var(--cafe-accent)" 
                }}>
                  {person.avatar}
                </div>
                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>{person.role}</div>
                </div>
                {/* Shifts */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {safeArr(person.shifts).length > 0
                    ? safeArr(person.shifts).slice(0, 2).map(shift => <span key={shift} style={{ fontSize: "var(--cafe-font-xs)", padding: "2px 6px", borderRadius: "var(--cafe-radius-xs)", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-info)" }}>{shift}</span>)
                    : <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>—</span>
                  }
                  {safeArr(person.shifts).length > 2 && <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)" }}>+{safeArr(person.shifts).length - 2}</span>}
                </div>
                {/* Status */}
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 500, color: statusColor, textTransform: "capitalize" }}>{statusLabel}</div>
                {/* Orders */}
                <div style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-accent)" }}>{person.ordersHandled}</div>
                {/* Efficiency */}
                <div style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: effColor }}>{person.efficiency}%</div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEdit(person); }} 
                    style={{ padding: "4px 8px", borderRadius: "var(--cafe-radius-xs)", border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteStaff(person.id); }} 
                    style={{ padding: "4px 8px", borderRadius: "var(--cafe-radius-xs)", border: "none", background: "transparent", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Profile Panel */}
      {showProfilePanel && selectedStaff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowProfilePanel(false)}>
          <div 
            style={{ 
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
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Profile Header */}
            <div style={{ padding: 24, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: "var(--cafe-radius-lg)", 
                    background: "var(--cafe-bg-surface)", 
                    border: "2px solid var(--cafe-accent-border)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 24, 
                    fontWeight: 700, 
                    color: "var(--cafe-accent)" 
                  }}>
                    {selectedStaff.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>{selectedStaff.name}</div>
                    <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{selectedStaff.role}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ 
                        padding: "4px 10px", 
                        borderRadius: "var(--cafe-radius-sm)", 
                        background: selectedStaff.status === "active" ? "var(--cafe-success-bg)" : selectedStaff.status === "on_leave" ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)",
                        border: `1px solid ${selectedStaff.status === "active" ? "var(--cafe-success-border)" : selectedStaff.status === "on_leave" ? "var(--cafe-warning-border)" : "var(--cafe-border-light"}`,
                        color: selectedStaff.status === "active" ? "var(--cafe-success)" : selectedStaff.status === "on_leave" ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)",
                        fontSize: "var(--cafe-font-xs", 
                        fontWeight: 600, 
                        textTransform: "capitalize" 
                      }}>
                        {safeStr(selectedStaff.status).replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfilePanel(false)} 
                  style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div style={{ padding: 24, flex: 1 }}>
              {/* Contact Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {selectedStaff.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", width: 80 }}>Phone</span>
                      <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>{selectedStaff.phone}</span>
                    </div>
                  )}
                  {selectedStaff.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", width: 80 }}>Email</span>
                      <span style={{ fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-secondary)" }}>{selectedStaff.email}</span>
                    </div>
                  )}
                  {(!selectedStaff.phone && !selectedStaff.email) && (
                    <span style={{ fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-tertiary)" }}>No contact information</span>
                  )}
                </div>
              </div>

              {/* Employment Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Employment</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", width: 80 }}>Joined</span>
                    <span style={{ fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-secondary)" }}>{selectedStaff.joinDate}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", width: 80 }}>Rate</span>
                    <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-secondary)" }}>₹{selectedStaff.hourlyRate}/hr</span>
                  </div>
                </div>
              </div>

              {/* Shifts Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Shifts</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {safeArr(selectedStaff.shifts).length > 0
                    ? safeArr(selectedStaff.shifts).map(shift => (
                        <span key={shift} style={{ fontSize: "var(--cafe-font-sm", padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-info)", fontWeight: 500 }}>{shift}</span>
                      ))
                    : <span style={{ fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-tertiary)" }}>No shifts assigned</span>
                  }
                </div>
              </div>

              {/* Performance Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--cafe-font-sm", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Performance</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: 16, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-md)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)", lineHeight: 1 }}>{selectedStaff.ordersHandled}</div>
                    <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", marginTop: 4 }}>Orders</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: selectedStaff.efficiency >= 80 ? "var(--cafe-success)" : selectedStaff.efficiency >= 60 ? "var(--cafe-accent)" : "var(--cafe-danger)", lineHeight: 1 }}>{selectedStaff.efficiency}%</div>
                    <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", marginTop: 4 }}>Efficiency</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-info)", lineHeight: 1 }}>{selectedStaff.avgPrepTime || "—"}<span style={{ fontSize: 14, fontWeight: 400 }}>{selectedStaff.avgPrepTime ? "m" : ""}</span></div>
                    <div style={{ fontSize: "var(--cafe-font-xs", color: "var(--cafe-text-tertiary)", marginTop: 4 }}>Avg Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div style={{ padding: 16, borderTop: "1px solid var(--cafe-border-light)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={() => { setShowProfilePanel(false); openEdit(selectedStaff); }} 
                style={{ padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
              >
                Edit Profile
              </button>
              <button 
                onClick={() => { setShowProfilePanel(false); deleteStaff(selectedStaff.id); }} 
                style={{ padding: "10px 20px", borderRadius: "var(--cafe-radius-md)", border: "none", background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", fontWeight: 500 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-lg)", padding: 24, width: "min(450px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--cafe-shadow-lg)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>{editStaff ? "Edit Staff Member" : "Add Team Member"}</div>
                {editStaff && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>ID · {editStaff}</div>}
              </div>
              <button style={{ padding: "6px 10px", border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 14, lineHeight: 1 }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {/* Basic Information Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Basic Information</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...label, marginBottom: 6 }}>Full Name *</label>
                <input style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Role *</label>
                  <select style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {SAFE_ROLES.slice(1).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Status *</label>
                  <select style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {SAFE_STATUSES.slice(1).map(status => <option key={status} value={status}>{safeStr(status).replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact Information</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...label, marginBottom: 6 }}>Phone <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>(optional)</span></label>
                <input style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="7–15 digits" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...label, marginBottom: 6 }}>Email <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>(optional)</span></label>
                <input style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
            </div>

            {/* Employment Details Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Employment Details</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...label, marginBottom: 6 }}>Hourly Rate (₹) *</label>
                <input style={{ ...input, borderRadius: "var(--cafe-radius-md)", padding: "10px 14px" }} type="number" min="0" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...label, marginBottom: 8, display: "block" }}>Shifts</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SAFE_SHIFTS.map(shift => {
                    const active = safeArr(form.shifts).includes(shift);
                    return (
                      <button key={shift} onClick={() => toggleShift(shift)} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-md)", border: `1px solid ${active ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, background: active ? "var(--cafe-accent-bg)" : "transparent", color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all .15s" }}>
                        {shift}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)" }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              <button style={{ ...btn("ghost"), padding: "10px 20px", borderRadius: "var(--cafe-radius-md)" }} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveStaff}>{editStaff ? "Save Changes" : "Add Member"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <DestructiveDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, name: null, hasOrders: false, onConfirm: null })}
        onConfirm={deleteDialog.onConfirm}
        title="Delete Staff Member"
        description="This action cannot be undone."
        recordName={deleteDialog.name}
        consequence={deleteDialog.hasOrders 
          ? "This staff member has handled orders. Historical records will be preserved but unlinked."
          : "This staff member will be permanently removed from the system."
        }
        confirmLabel="Delete Staff Member"
      />

      <WarningDialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, staffId: null, currentStatus: null, newStatus: null, onConfirm: null })}
        onConfirm={statusDialog.onConfirm}
        title="Change Staff Status"
        description={`Change status from "${safeStr(statusDialog.currentStatus).replace(/_/g, " ")}" to "${safeStr(statusDialog.newStatus).replace(/_/g, " ")}"?`}
        warning="This will affect the staff member's access and availability."
        confirmLabel="Change Status"
      />

      <PermissionDeniedDialog
        open={permissionDeniedDialog.open}
        onClose={() => setPermissionDeniedDialog({ ...permissionDeniedDialog, open: false })}
        action={permissionDeniedDialog.action}
        requiredPermission={permissionDeniedDialog.requiredPermission}
        currentRole={permissionDeniedDialog.currentRole}
        contactMessage="Contact a manager or owner for access to manage staff."
      />
    </div>
  );
}
