// useSecurity — React hook for RBAC/ABAC permission checks
// Wraps PermissionEngine singleton so components can easily gate UI elements.
//
// Usage:
//   const { role, can, isOwner, isManager } = useSecurity();
//   if (!can('VIEW_SECURITY_CENTER')) return null;

import { useState, useEffect, useCallback } from "react";
import { getPermissionEngine } from "../security/PermissionEngine.js";

// ── Permission constants shared with PermissionEngine ─────────────────────────
// Map of human-readable names → actual permission strings used by the engine.
export const PERMISSIONS = {
  // System-level
  VIEW_SECURITY_CENTER: "VIEW_SECURITY_CENTER",
  MANAGE_SECURITY: "MANAGE_SECURITY",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",
  // Cloud / Storage
  VIEW_CLOUD_SETTINGS: "VIEW_CLOUD_SETTINGS",
  MANAGE_PROVIDERS: "MANAGE_PROVIDERS",
  // Data
  RUN_BACKUPS: "RUN_BACKUPS",
  RESTORE_DATA: "RESTORE_DATA",
  EXPORT_DATA: "EXPORT_DATA",
  IMPORT_DATA: "IMPORT_DATA",
  // Sync
  CONFIGURE_SYNC: "CONFIGURE_SYNC",
  MANAGE_RETENTION: "MANAGE_RETENTION",
};

// ── Role definitions (should mirror PermissionEngine) ─────────────────────────
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
};

// ── Tab-level access control ───────────────────────────────────────────────────
// Which tabs each role CAN see. Omission = hidden for that role.
// Owner sees everything by default.
const ROLE_TAB_ACCESS = {
  owner: null, // null = unrestricted (all tabs visible)
  manager: [
    "dashboard", "orders", "kitchen", "crm", "analytics", "menu",
    "inventory", "staff", "tables", "delivery", "qr", "purchasing",
    "documents", "expenses", "shifts", "production", "tracking",
    "workflows", "backup", "settings", "notifications",
  ],
  cashier: [
    "dashboard", "orders", "crm", "tables", "qr", "notifications",
  ],
  kitchen: [
    "kitchen", "dashboard", "notifications",
  ],
  staff: [
    "dashboard", "orders", "kitchen", "crm", "tables", "notifications",
  ],
};

// ── Storage key for persisting the active session role ─────────────────────────
const SESSION_ROLE_KEY = "cafeos_session_role";

function loadSessionRole() {
  try {
    return localStorage.getItem(SESSION_ROLE_KEY) || ROLES.OWNER;
  } catch {
    return ROLES.OWNER;
  }
}

function saveSessionRole(role) {
  try {
    localStorage.setItem(SESSION_ROLE_KEY, role);
  } catch (_error) {
    // Ignore localStorage errors
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useSecurity() {
  const [role, setRoleState] = useState(() => loadSessionRole());
  const engine = getPermissionEngine();

  const setRole = useCallback((newRole) => {
    saveSessionRole(newRole);
    setRoleState(newRole);
  }, []);

  // Permission check — returns true/false for a given permission string.
  const can = useCallback(
    (permission) => {
      if (role === ROLES.OWNER) return true; // owner always has full access
      const result = engine.checkPermission(permission, role);
      return result.allowed;
    },
    [role, engine]
  );

  // Tab visibility — returns true if the current role can see this tab.
  const canSeeTab = useCallback(
    (tabId) => {
      const allowed = ROLE_TAB_ACCESS[role];
      if (allowed === null || allowed === undefined) return true; // unrestricted
      return allowed.includes(tabId);
    },
    [role]
  );

  // Convenience flags
  const isOwner   = role === ROLES.OWNER;
  const isManager = role === ROLES.MANAGER;
  const isStaff   = role === ROLES.STAFF;
  const isCashier = role === ROLES.CASHIER;
  const isKitchen = role === ROLES.KITCHEN;

  // Sync across tabs (localStorage event)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === SESSION_ROLE_KEY && e.newValue) {
        setRoleState(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return {
    role,
    setRole,
    can,
    canSeeTab,
    isOwner,
    isManager,
    isStaff,
    isCashier,
    isKitchen,
    ROLES,
    PERMISSIONS,
  };
}

export default useSecurity;
