// Permission model for CafeOS security & access control
// Defines all permissions by module and provides permission checking utilities

import { generateId } from './ids.js';

// ── Permission Modules ────────────────────────────────────────────────────────

export const PERMISSION_MODULES = {
  COUNTER: 'COUNTER',
  CASH_DESK: 'CASH_DESK',
  ORDERS: 'ORDERS',
  KITCHEN: 'KITCHEN',
  TABLES: 'TABLES',
  CUSTOMERS: 'CUSTOMERS',
  QR_ORDERING: 'QR_ORDERING',
  RESERVATIONS: 'RESERVATIONS',
  DELIVERY: 'DELIVERY',
  TRACKING: 'TRACKING',
  STOCK: 'STOCK',
  PURCHASING: 'PURCHASING',
  PRODUCTION: 'PRODUCTION',
  COST_CONTROL: 'COST_CONTROL',
  DOCUMENTS: 'DOCUMENTS',
  ANALYTICS: 'ANALYTICS',
  STAFF: 'STAFF',
  SETTINGS: 'SETTINGS',
  SECURITY: 'SECURITY',
  IMPORT_EXPORT: 'IMPORT_EXPORT',
  WORKFLOWS: 'WORKFLOWS',
};

// ── Permission Actions ─────────────────────────────────────────────────────────

export const PERMISSION_ACTIONS = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  VOID: 'VOID',
  REFUND: 'REFUND',
  PRINT: 'PRINT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  MANAGE_PERMISSIONS: 'MANAGE_PERMISSIONS',
};

// ── Permission Definitions by Module ────────────────────────────────────────────

export const PERMISSIONS = {
  // Today's Counter
  [PERMISSION_MODULES.COUNTER]: {
    VIEW: `${PERMISSION_MODULES.COUNTER}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.COUNTER}_${PERMISSION_ACTIONS.CREATE}`,
  },

  // Cash Desk
  [PERMISSION_MODULES.CASH_DESK]: {
    VIEW: `${PERMISSION_MODULES.CASH_DESK}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.CASH_DESK}_${PERMISSION_ACTIONS.CREATE}`,
    VOID: `${PERMISSION_MODULES.CASH_DESK}_${PERMISSION_ACTIONS.VOID}`,
    REFUND: `${PERMISSION_MODULES.CASH_DESK}_${PERMISSION_ACTIONS.REFUND}`,
    PRINT: `${PERMISSION_MODULES.CASH_DESK}_${PERMISSION_ACTIONS.PRINT}`,
  },

  // Orders
  [PERMISSION_MODULES.ORDERS]: {
    VIEW: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.DELETE}`,
    VOID: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.VOID}`,
    REFUND: `${PERMISSION_MODULES.ORDERS}_${PERMISSION_ACTIONS.REFUND}`,
  },

  // Kitchen
  [PERMISSION_MODULES.KITCHEN]: {
    VIEW: `${PERMISSION_MODULES.KITCHEN}_${PERMISSION_ACTIONS.VIEW}`,
    EDIT: `${PERMISSION_MODULES.KITCHEN}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.KITCHEN}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Tables
  [PERMISSION_MODULES.TABLES]: {
    VIEW: `${PERMISSION_MODULES.TABLES}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.TABLES}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.TABLES}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.TABLES}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Customers
  [PERMISSION_MODULES.CUSTOMERS]: {
    VIEW: `${PERMISSION_MODULES.CUSTOMERS}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.CUSTOMERS}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.CUSTOMERS}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.CUSTOMERS}_${PERMISSION_ACTIONS.DELETE}`,
    EXPORT: `${PERMISSION_MODULES.CUSTOMERS}_${PERMISSION_ACTIONS.EXPORT}`,
  },

  // QR Ordering
  [PERMISSION_MODULES.QR_ORDERING]: {
    VIEW: `${PERMISSION_MODULES.QR_ORDERING}_${PERMISSION_ACTIONS.VIEW}`,
    MANAGE_SETTINGS: `${PERMISSION_MODULES.QR_ORDERING}_${PERMISSION_ACTIONS.MANAGE_SETTINGS}`,
  },

  // Reservations
  [PERMISSION_MODULES.RESERVATIONS]: {
    VIEW: `${PERMISSION_MODULES.RESERVATIONS}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.RESERVATIONS}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.RESERVATIONS}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.RESERVATIONS}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Delivery
  [PERMISSION_MODULES.DELIVERY]: {
    VIEW: `${PERMISSION_MODULES.DELIVERY}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.DELIVERY}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.DELIVERY}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.DELIVERY}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Route & Tracking
  [PERMISSION_MODULES.TRACKING]: {
    VIEW: `${PERMISSION_MODULES.TRACKING}_${PERMISSION_ACTIONS.VIEW}`,
    EDIT: `${PERMISSION_MODULES.TRACKING}_${PERMISSION_ACTIONS.EDIT}`,
  },

  // Stock Room
  [PERMISSION_MODULES.STOCK]: {
    VIEW: `${PERMISSION_MODULES.STOCK}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.STOCK}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.STOCK}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.STOCK}_${PERMISSION_ACTIONS.DELETE}`,
    ADJUST: `${PERMISSION_MODULES.STOCK}_ADJUST`,
  },

  // Purchasing
  [PERMISSION_MODULES.PURCHASING]: {
    VIEW: `${PERMISSION_MODULES.PURCHASING}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.PURCHASING}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.PURCHASING}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.PURCHASING}_${PERMISSION_ACTIONS.DELETE}`,
    APPROVE: `${PERMISSION_MODULES.PURCHASING}_${PERMISSION_ACTIONS.APPROVE}`,
  },

  // Production
  [PERMISSION_MODULES.PRODUCTION]: {
    VIEW: `${PERMISSION_MODULES.PRODUCTION}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.PRODUCTION}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.PRODUCTION}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.PRODUCTION}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Cost Control / Expenses
  [PERMISSION_MODULES.COST_CONTROL]: {
    VIEW: `${PERMISSION_MODULES.COST_CONTROL}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.COST_CONTROL}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.COST_CONTROL}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.COST_CONTROL}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Receipts & Documents
  [PERMISSION_MODULES.DOCUMENTS]: {
    VIEW: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.DELETE}`,
    VOID: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.VOID}`,
    PRINT: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.PRINT}`,
    EXPORT: `${PERMISSION_MODULES.DOCUMENTS}_${PERMISSION_ACTIONS.EXPORT}`,
  },

  // Analytics & Reports
  [PERMISSION_MODULES.ANALYTICS]: {
    VIEW: `${PERMISSION_MODULES.ANALYTICS}_${PERMISSION_ACTIONS.VIEW}`,
    EXPORT: `${PERMISSION_MODULES.ANALYTICS}_${PERMISSION_ACTIONS.EXPORT}`,
  },

  // Staff & Shifts
  [PERMISSION_MODULES.STAFF]: {
    VIEW: `${PERMISSION_MODULES.STAFF}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.STAFF}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.STAFF}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.STAFF}_${PERMISSION_ACTIONS.DELETE}`,
  },

  // Cafe Configuration / Settings
  [PERMISSION_MODULES.SETTINGS]: {
    VIEW: `${PERMISSION_MODULES.SETTINGS}_${PERMISSION_ACTIONS.VIEW}`,
    MANAGE_SETTINGS: `${PERMISSION_MODULES.SETTINGS}_${PERMISSION_ACTIONS.MANAGE_SETTINGS}`,
  },

  // Security & Access
  [PERMISSION_MODULES.SECURITY]: {
    VIEW: `${PERMISSION_MODULES.SECURITY}_${PERMISSION_ACTIONS.VIEW}`,
    MANAGE_PERMISSIONS: `${PERMISSION_MODULES.SECURITY}_${PERMISSION_ACTIONS.MANAGE_PERMISSIONS}`,
    EXPORT: `${PERMISSION_MODULES.SECURITY}_${PERMISSION_ACTIONS.EXPORT}`,
  },

  // Import / Export
  [PERMISSION_MODULES.IMPORT_EXPORT]: {
    EXPORT: `${PERMISSION_MODULES.IMPORT_EXPORT}_${PERMISSION_ACTIONS.EXPORT}`,
    IMPORT: `${PERMISSION_MODULES.IMPORT_EXPORT}_${PERMISSION_ACTIONS.IMPORT}`,
  },

  // Workflows
  [PERMISSION_MODULES.WORKFLOWS]: {
    VIEW: `${PERMISSION_MODULES.WORKFLOWS}_${PERMISSION_ACTIONS.VIEW}`,
    CREATE: `${PERMISSION_MODULES.WORKFLOWS}_${PERMISSION_ACTIONS.CREATE}`,
    EDIT: `${PERMISSION_MODULES.WORKFLOWS}_${PERMISSION_ACTIONS.EDIT}`,
    DELETE: `${PERMISSION_MODULES.WORKFLOWS}_${PERMISSION_ACTIONS.DELETE}`,
    EXECUTE: `${PERMISSION_MODULES.WORKFLOWS}_EXECUTE`,
    ASSIGN: `${PERMISSION_MODULES.WORKFLOWS}_ASSIGN`,
    REVIEW: `${PERMISSION_MODULES.WORKFLOWS}_REVIEW`,
    ARCHIVE: `${PERMISSION_MODULES.WORKFLOWS}_ARCHIVE`,
  },
};

// ── All Permissions Flat List ─────────────────────────────────────────────────

export const ALL_PERMISSIONS = Object.values(PERMISSIONS).map(modulePermissions => Object.values(modulePermissions)).flat();

// ── Permission Helpers ───────────────────────────────────────────────────────

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission) {
  return typeof permission === 'string' && ALL_PERMISSIONS.includes(permission);
}

/**
 * Get module from permission string
 */
export function getPermissionModule(permission) {
  if (!isValidPermission(permission)) return null;
  return permission.split('_').slice(0, -1).join('_');
}

/**
 * Get action from permission string
 */
export function getPermissionAction(permission) {
  if (!isValidPermission(permission)) return null;
  return permission.split('_').pop();
}

/**
 * Format permission for display (e.g., "COUNTER_VIEW" -> "Counter - View")
 */
export function formatPermissionForDisplay(permission) {
  if (!isValidPermission(permission)) return 'Unknown Permission';
  
  const module = getPermissionModule(permission);
  const action = getPermissionAction(permission);
  
  const moduleDisplay = module
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  
  const actionDisplay = action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  
  return `${moduleDisplay} - ${actionDisplay}`;
}

/**
 * Group permissions by module
 */
export function groupPermissionsByModule(permissions) {
  const grouped = {};
  
  for (const module of Object.values(PERMISSION_MODULES)) {
    grouped[module] = [];
  }
  
  for (const permission of permissions) {
    const module = getPermissionModule(permission);
    if (module && grouped[module]) {
      grouped[module].push(permission);
    }
  }
  
  return grouped;
}

/**
 * Get all permissions for a specific module
 */
export function getModulePermissions(module) {
  return PERMISSIONS[module] ? Object.values(PERMISSIONS[module]) : [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!isValidPermission(requiredPermission)) return false;
  if (!Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return true;
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userPermissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return true;
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * Get missing permissions
 */
export function getMissingPermissions(userPermissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) return [];
  if (!Array.isArray(userPermissions)) return [...requiredPermissions];
  return requiredPermissions.filter(perm => !hasPermission(userPermissions, perm));
}
