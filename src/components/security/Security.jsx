import React, { useState, useMemo, useCallback, useEffect } from "react";
import { C, btn, card, input, label, emptyState } from "../../styles/theme";
import { 
  ROLE_TYPES, 
  ROLE_METADATA, 
  getDefaultPermissions, 
  getAllRoleTypes,
  getSystemRoles,
  canDeleteRole,
  normalizeRole,
  createRole,
  setRolePermissions
} from "../../domain/roleModel.js";
import { 
  PERMISSION_MODULES, 
  PERMISSIONS, 
  ALL_PERMISSIONS,
  groupPermissionsByModule,
  formatPermissionForDisplay,
  getModulePermissions
} from "../../domain/permissionModel.js";
import { 
  createSecurityAuditLog,
  createPermissionDeniedAuditLog,
  AUDIT_ACTIONS,
  sortAuditLogsNewestFirst
} from "../../domain/auditLogModel.js";
import { 
  getCurrentUserId,
  getCurrentUserName,
  getCurrentRoleType,
  isOwner,
  isAdmin
} from "../../utils/authService.js";
import { 
  checkPermission,
  checkAllPermissions,
  getPermissionMessage,
  getContactMessage
} from "../../utils/permissionService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";

// ── Safe Helpers ─────────────────────────────────────────────────────────────

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const safeArr = (v) => (Array.isArray(v) ? v : []);

// ── Security Overview Component ─────────────────────────────────────────────────

function SecurityOverview({ roles, staff, auditLogs, onNavigate, onExportAudit }) {
  const activeStaffCount = safeArr(staff).filter(s => safeStr(s.status) === 'active').length;
  const roleCount = safeArr(roles).length;
  const systemRoleCount = getSystemRoles().length;
  const customRoleCount = roleCount - systemRoleCount;
  
  const today = new Date().toISOString().slice(0, 10);
  const todayAuditLogs = safeArr(auditLogs).filter(log => 
    log.timestamp && log.timestamp.startsWith(today)
  );
  const sensitiveActionsToday = todayAuditLogs.filter(log => 
    log.module === 'SECURITY' || 
    log.action?.includes('VOID') || 
    log.action?.includes('REFUND') ||
    log.action?.includes('DELETE')
  ).length;
  
  const exportsToday = todayAuditLogs.filter(log => 
    log.action?.includes('EXPORT')
  ).length;

  const warnings = [];
  
  // Check for staff without roles
  const staffWithoutRoles = safeArr(staff).filter(s => !s.roleId);
  if (staffWithoutRoles.length > 0) {
    warnings.push({
      type: 'warning',
      message: `${staffWithoutRoles.length} staff members have no role assigned`,
      affected: staffWithoutRoles.length,
    });
  }
  
  // Check for inactive staff with potential access
  const inactiveStaff = safeArr(staff).filter(s => safeStr(s.status) === 'inactive');
  if (inactiveStaff.length > 0) {
    warnings.push({
      type: 'info',
      message: `${inactiveStaff.length} inactive staff accounts exist`,
      affected: inactiveStaff.length,
    });
  }

  return (
    <div>
      {/* Operational Stat Chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Active Staff", count: activeStaffCount, color: "var(--cafe-success)" },
          { label: "Total Roles", count: roleCount, color: "var(--cafe-info)" },
          { label: "System Roles", count: systemRoleCount, color: "var(--cafe-text-tertiary)" },
          { label: "Custom Roles", count: customRoleCount, color: "var(--cafe-accent)" },
          { label: "Sensitive Actions Today", count: sensitiveActionsToday, color: sensitiveActionsToday > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
          { label: "Exports Today", count: exportsToday, color: exportsToday > 0 ? "var(--cafe-info)" : "var(--cafe-text-tertiary)" },
          { label: "Security Warnings", count: warnings.length, color: warnings.length > 0 ? "var(--cafe-warning)" : "var(--cafe-success)" },
        ].map(chip => (
          <div key={chip.label} style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: "var(--cafe-radius-md)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 130,
          }}>
            <span style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: chip.color, fontFamily: "monospace", lineHeight: 1 }}>
              {chip.count}
            </span>
            <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* Security Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Security Warnings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {warnings.map((warning, idx) => (
              <div key={idx} style={{
                padding: "12px 16px",
                background: warning.type === 'warning' ? "var(--cafe-warning-bg)" : "var(--cafe-info-bg)",
                border: `1px solid ${warning.type === 'warning' ? "var(--cafe-warning-border)" : "var(--cafe-info-border)"}`,
                borderRadius: "var(--cafe-radius-md)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <span style={{ fontSize: 16 }}>
                  {warning.type === 'warning' ? "⚠️" : "ℹ️"}
                </span>
                <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>
                  {warning.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn("primary")} onClick={() => onNavigate?.("roles")}>+ New Role</button>
        <button style={btn("ghost")} onClick={() => onNavigate?.("staff")}>Add Staff Access</button>
        <button style={btn("ghost")} onClick={() => onExportAudit?.()}>Export Audit</button>
        <button style={btn("ghost")} onClick={() => onNavigate?.("audit")}>View Audit Trail</button>
      </div>
    </div>
  );
}

// ── Role Card Component ───────────────────────────────────────────────────────

function RoleCard({ role, staffCount, onView, onEdit, onDuplicate, onAssignStaff, onDelete }) {
  const metadata = ROLE_METADATA[role.type] || { name: role.type, description: '' };
  const permissionCount = safeArr(role.permissions).length;
  const isSystem = role.isSystem || metadata.isSystem;
  
  return (
    <div style={{
      ...card(),
      padding: 20,
      border: isSystem ? "2px solid var(--cafe-accent-border)" : "1px solid var(--cafe-border-light)",
      cursor: "pointer",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
              {metadata.name || role.name}
            </div>
            {isSystem && (
              <span style={{ 
                fontSize: "var(--cafe-font-xs)", 
                padding: "2px 6px", 
                borderRadius: "var(--cafe-radius-xs)", 
                background: "var(--cafe-accent-bg)", 
                color: "var(--cafe-accent)", 
                fontWeight: 600 
              }}>
                System
              </span>
            )}
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
            {metadata.description || role.description}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: "center", padding: 12, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-accent)", fontFamily: "monospace" }}>
            {staffCount}
          </div>
          <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
            Staff
          </div>
        </div>
        <div style={{ textAlign: "center", padding: 12, background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-info)", fontFamily: "monospace" }}>
            {permissionCount}
          </div>
          <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
            Permissions
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--cafe-border-light)", paddingTop: 12 }}>
        <button 
          onClick={() => onView && onView(role)}
          style={{ flex: 1, ...btn("ghost"), fontSize: "var(--cafe-font-sm)" }}
        >
          View
        </button>
        <button 
          onClick={() => onEdit && onEdit(role)}
          style={{ flex: 1, ...btn("ghost"), fontSize: "var(--cafe-font-sm)" }}
        >
          Edit
        </button>
        <button 
          onClick={() => onDuplicate && onDuplicate(role)}
          style={{ flex: 1, ...btn("ghost"), fontSize: "var(--cafe-font-sm)" }}
        >
          Duplicate
        </button>
        {!isSystem && (
          <button 
            onClick={() => onDelete && onDelete(role)}
            style={{ padding: "8px 16px", ...btn("ghost"), color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Roles & Permissions Section ───────────────────────────────────────────────

function RolesSection({ roles, staff, onEditRole, onDeleteRole, onDuplicateRole }) {
  const [search, setSearch] = useState("");
  
  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return safeArr(roles);
    return safeArr(roles).filter(role => {
      const metadata = ROLE_METADATA[role.type] || {};
      const name = metadata.name || role.name || "";
      const description = metadata.description || role.description || "";
      return name.toLowerCase().includes(q) || description.toLowerCase().includes(q);
    });
  }, [roles, search]);

  const rolesWithStaffCount = useMemo(() => {
    return filteredRoles.map(role => ({
      ...role,
      staffCount: safeArr(staff).filter(s => s.roleId === role.id).length,
    }));
  }, [filteredRoles, staff]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
          Roles & Permissions
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input 
              style={{ ...input, paddingLeft: 32, width: 200, fontSize: "var(--cafe-font-sm)" }} 
              placeholder="Search roles..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button style={btn("primary")}>+ New Role</button>
        </div>
      </div>

      {rolesWithStaffCount.length === 0 ? (
        <div style={emptyState()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            No roles found
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
            {search ? "Try a different search term" : "Create your first role to get started"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {rolesWithStaffCount.map(role => (
            <RoleCard 
              key={role.id} 
              role={role} 
              staffCount={role.staffCount}
              onView={() => {}}
              onEdit={onEditRole}
              onDuplicate={onDuplicateRole}
              onDelete={onDeleteRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff Access Section ───────────────────────────────────────────────────────

function StaffAccessSection({ staff, roles, onEditStaff }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  const filteredStaff = useMemo(() => {
    let result = safeArr(staff);
    
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(s => {
        const name = safeStr(s.name).toLowerCase();
        const email = safeStr(s.email).toLowerCase();
        const phone = safeStr(s.phone).toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    
    if (roleFilter !== "ALL") {
      result = result.filter(s => s.roleId === roleFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter(s => safeStr(s.status) === statusFilter);
    }
    
    return result;
  }, [staff, search, roleFilter, statusFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
          Staff Access
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input 
              style={{ ...input, paddingLeft: 32, width: 200, fontSize: "var(--cafe-font-sm)" }} 
              placeholder="Search staff..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            {safeArr(roles).map(role => (
              <option key={role.id} value={role.id}>{role.name || role.type}</option>
            ))}
          </select>
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div style={emptyState()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            No staff found
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
            {search || roleFilter !== "ALL" || statusFilter !== "ALL" ? "Try adjusting your filters" : "No staff members have been added yet"}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cafe-bg-surface)", borderBottom: "1px solid var(--cafe-border-light)" }}>
                {["Name", "Role", "Status", "Last Active", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, idx) => {
                const role = safeArr(roles).find(r => r.id === s.roleId);
                const statusColor = s.status === 'active' ? 'var(--cafe-success)' : s.status === 'inactive' ? 'var(--cafe-text-tertiary)' : 'var(--cafe-warning)';
                
                return (
                  <tr key={s.id} style={{ borderBottom: idx < filteredStaff.length - 1 ? "1px solid var(--cafe-border-light)" : "none", background: "var(--cafe-bg-card)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {safeStr(s.name)}
                      </div>
                      <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                        {safeStr(s.email) || safeStr(s.phone)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>
                        {role ? (role.name || role.type) : 'No role'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        fontSize: "var(--cafe-font-xs)", 
                        padding: "4px 8px", 
                        borderRadius: "var(--cafe-radius-xs)", 
                        background: s.status === 'active' ? "var(--cafe-success-bg)" : s.status === 'inactive' ? "var(--cafe-bg-surface)" : "var(--cafe-warning-bg)",
                        color: statusColor,
                        fontWeight: 600, 
                        textTransform: "capitalize" 
                      }}>
                        {safeStr(s.status).replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button 
                        onClick={() => onEditStaff && onEditStaff(s)}
                        style={{ ...btn("ghost"), fontSize: "var(--cafe-font-sm)", padding: "6px 12px" }}
                      >
                        Edit Access
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Audit Trail Section ───────────────────────────────────────────────────────

function AuditTrailSection({ auditLogs }) {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState(null);

  const handleExport = useCallback(() => {
    const data = safeArr(auditLogs).map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      module: log.module,
      action: log.action,
      userId: log.userId,
      details: log.details,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [auditLogs]);
  
  const filteredLogs = useMemo(() => {
    let result = safeArr(auditLogs);
    
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(log => {
        const action = safeStr(log.action).toLowerCase();
        const module = safeStr(log.module).toLowerCase();
        const userId = safeStr(log.userId).toLowerCase();
        return action.includes(q) || module.includes(q) || userId.includes(q);
      });
    }
    
    if (moduleFilter !== "ALL") {
      result = result.filter(log => log.module === moduleFilter);
    }
    
    if (actionFilter !== "ALL") {
      result = result.filter(log => log.action === actionFilter);
    }
    
    return sortAuditLogsNewestFirst(result);
  }, [auditLogs, search, moduleFilter, actionFilter]);

  const uniqueModules = useMemo(() => {
    const modules = new Set(safeArr(auditLogs).map(log => log.module));
    return Array.from(modules);
  }, [auditLogs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(safeArr(auditLogs).map(log => log.action));
    return Array.from(actions);
  }, [auditLogs]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
          Audit Trail
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input 
              style={{ ...input, paddingLeft: 32, width: 200, fontSize: "var(--cafe-font-sm)" }} 
              placeholder="Search audit logs..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            <option value="ALL">All Modules</option>
            {uniqueModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="ALL">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <button style={btn("ghost")} onClick={handleExport}>Export Audit</button>
        </div>
      </div>

      {filteredLogs.length > 0 && (
        <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 8 }}>
          Showing {filteredLogs.length} of {safeArr(auditLogs).length} events
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div style={emptyState()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            No audit events found
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
            {search || moduleFilter !== "ALL" || actionFilter !== "ALL" ? "Try adjusting your filters" : "Audit events will appear here as actions are performed"}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)", overflow: "hidden", maxHeight: 600, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--cafe-bg-surface)", zIndex: 1 }}>
              <tr style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                {["Timestamp", "Module", "Action", "User", "Details"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
                const isSecurity = log.module === 'SECURITY';
                const rowStyle = isSecurity ? { background: "var(--cafe-warning-bg)" } : {};
                
                const rowKey = log.id || idx;
                const isExpanded = expandedRow === rowKey;
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                      style={{ borderBottom: (!isExpanded && idx < filteredLogs.length - 1) ? "1px solid var(--cafe-border-light)" : "none", ...rowStyle, cursor: "pointer" }}
                    >
                      <td style={{ padding: "12px 16px", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", fontFamily: "monospace" }}>
                        {timestamp}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          fontSize: "var(--cafe-font-xs)", 
                          padding: "4px 8px", 
                          borderRadius: "var(--cafe-radius-xs)", 
                          background: isSecurity ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)",
                          color: isSecurity ? "var(--cafe-warning)" : "var(--cafe-text-secondary)",
                          fontWeight: 600 
                        }}>
                          {safeStr(log.module)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>
                        {safeStr(log.action)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>
                        {safeStr(log.userId) || 'System'}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                        {isExpanded ? "▲ hide" : log.details ? "▼ details" : "—"}
                      </td>
                    </tr>
                    {isExpanded && log.details && (
                      <tr style={{ borderBottom: idx < filteredLogs.length - 1 ? "1px solid var(--cafe-border-light)" : "none", background: "var(--cafe-bg-surface)" }}>
                        <td colSpan={5} style={{ padding: "12px 16px" }}>
                          <pre style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Security Component ────────────────────────────────────────────────────

export default function Security({ 
  roles: externalRoles, 
  setRoles: externalSetRoles,
  staff: externalStaff,
  auditLogs: externalAuditLogs 
}) {
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  
  const [roles, setRoles] = useState(() => safeArr(externalRoles));
  const [staff, setStaff] = useState(() => safeArr(externalStaff));
  const [auditLogs, setAuditLogs] = useState(() => safeArr(externalAuditLogs));
  
  const [permissionDeniedDialog, setPermissionDeniedDialog] = useState({
    open: false,
    action: '',
    requiredPermission: '',
    currentRole: '',
  });
  
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, role: null, onConfirm: null });
  const [cannotDeleteDialog, setCannotDeleteDialog] = useState({ open: false, role: null });

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => { if (externalRoles) setRoles(safeArr(externalRoles)); }, [externalRoles]);
  useEffect(() => { if (externalStaff) setStaff(safeArr(externalStaff)); }, [externalStaff]);
  useEffect(() => { if (externalAuditLogs) setAuditLogs(safeArr(externalAuditLogs)); }, [externalAuditLogs]);

  const handleSetRoles = externalSetRoles || setRoles;

  const showPermissionDenied = (action, requiredPermission) => {
    setPermissionDeniedDialog({
      open: true,
      action,
      requiredPermission,
      currentRole: getCurrentRoleType(),
    });
  };

  const handleEditRole = (role) => {
    const check = checkPermission('SECURITY_MANAGE_PERMISSIONS');
    if (!check.allowed) {
      showPermissionDenied('edit role', check.requiredPermission);
      return;
    }
    // TODO: Open role edit dialog
    console.log('Edit role:', role);
  };

  const handleDeleteRole = (role) => {
    const check = checkPermission('SECURITY_MANAGE_PERMISSIONS');
    if (!check.allowed) {
      showPermissionDenied('delete role', check.requiredPermission);
      return;
    }
    
    if (!canDeleteRole(role, roles)) {
      setCannotDeleteDialog({ open: true, role });
      return;
    }
    
    setDeleteRoleDialog({
      open: true,
      role,
      onConfirm: () => {
        handleSetRoles(roles.filter(r => r.id !== role.id));
        setDeleteRoleDialog({ open: false, role: null, onConfirm: null });
      }
    });
  };

  const handleDuplicateRole = (role) => {
    const check = checkPermission('SECURITY_MANAGE_PERMISSIONS');
    if (!check.allowed) {
      showPermissionDenied('duplicate role', check.requiredPermission);
      return;
    }
    
    const newRole = createRole({
      ...role,
      id: undefined,
      name: `${role.name} (Copy)`,
      isSystem: false,
      canBeDeleted: true,
    });
    
    handleSetRoles([...roles, newRole]);
  };

  const handleEditStaff = (staffMember) => {
    const check = checkPermission('STAFF_EDIT');
    if (!check.allowed) {
      showPermissionDenied('edit staff access', check.requiredPermission);
      return;
    }
    // TODO: Open staff access edit dialog
    console.log('Edit staff access:', staffMember);
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "roles", label: "Roles & Permissions" },
    { id: "staff", label: "Staff Access" },
    { id: "audit", label: "Audit Trail" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Security & Access
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
          Control staff permissions, protect sensitive actions, and review activity
        </div>
      </div>

      {/* Module Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--cafe-border-light)", paddingBottom: 16 }}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeSection === section.id ? "var(--cafe-accent-bg)" : "transparent",
              color: activeSection === section.id ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: activeSection === section.id ? 600 : 400,
              borderRadius: "var(--cafe-radius-sm)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {activeSection === "overview" && (
        <SecurityOverview
          roles={roles}
          staff={staff}
          auditLogs={auditLogs}
          onNavigate={setActiveSection}
          onExportAudit={() => {
            const data = safeArr(auditLogs);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}

      {activeSection === "roles" && (
        <RolesSection 
          roles={roles} 
          staff={staff}
          onEditRole={handleEditRole}
          onDeleteRole={handleDeleteRole}
          onDuplicateRole={handleDuplicateRole}
        />
      )}

      {activeSection === "staff" && (
        <StaffAccessSection 
          staff={staff} 
          roles={roles}
          onEditStaff={handleEditStaff}
        />
      )}

      {activeSection === "audit" && (
        <AuditTrailSection auditLogs={auditLogs} />
      )}

      {/* Permission Denied Dialog */}
      <PermissionDeniedDialog
        open={permissionDeniedDialog.open}
        onClose={() => setPermissionDeniedDialog({ ...permissionDeniedDialog, open: false })}
        action={permissionDeniedDialog.action}
        requiredPermission={permissionDeniedDialog.requiredPermission}
        currentRole={permissionDeniedDialog.currentRole}
        contactMessage={getContactMessage()}
      />

      {/* Cannot Delete Role Dialog */}
      <WarningDialog
        open={cannotDeleteDialog.open}
        title="Role Cannot Be Deleted"
        message={`"${cannotDeleteDialog.role?.name || ''}" is a system role or has staff assigned and cannot be deleted. Reassign all staff before deleting.`}
        confirmText="OK"
        onConfirm={() => setCannotDeleteDialog({ open: false, role: null })}
        onCancel={() => setCannotDeleteDialog({ open: false, role: null })}
      />

      {/* Delete Role Dialog */}
      <DestructiveDialog
        open={deleteRoleDialog.open}
        title={`Delete Role: ${deleteRoleDialog.role?.name || ''}`}
        message={`Are you sure you want to delete this role? This action cannot be undone. Staff members assigned to this role will need to be reassigned.`}
        confirmText="Delete Role"
        onConfirm={() => deleteRoleDialog.onConfirm && deleteRoleDialog.onConfirm()}
        onCancel={() => setDeleteRoleDialog({ open: false, role: null, onConfirm: null })}
      />
    </div>
  );
}
