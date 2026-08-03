// Role model for CafeOS security & access control
// Defines roles with their permission assignments and role management utilities

import { generateId } from './ids.js';
import { now } from './dates.js';
import { 
  PERMISSIONS, 
  PERMISSION_MODULES, 
  ALL_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  groupPermissionsByModule
} from './permissionModel.js';

// ── Role Definitions ───────────────────────────────────────────────────────────

export const ROLE_TYPES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  WAITER: 'WAITER',
  KITCHEN: 'KITCHEN',
  DELIVERY: 'DELIVERY',
  STOCK_MANAGER: 'STOCK_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
};

// ── Default Role Permission Sets ────────────────────────────────────────────────

const ROLE_PERMISSIONS = {
  // Owner: Full system access
  [ROLE_TYPES.OWNER]: ALL_PERMISSIONS,

  // Admin: Full access except owner-level security changes
  [ROLE_TYPES.ADMIN]: ALL_PERMISSIONS.filter(
    perm => !perm.includes(`${PERMISSION_MODULES.SECURITY}_MANAGE_PERMISSIONS`)
  ),

  // Manager: Broad operational access, no security/permission management
  [ROLE_TYPES.MAGER]: [
    // Counter & Cash Desk
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COUNTER]),
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.CASH_DESK]),
    
    // Orders (including void/refund)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.ORDERS]),
    
    // Kitchen
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.KITCHEN]),
    
    // Tables
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.TABLES]),
    
    // Customers (including export)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.CUSTOMERS]),
    
    // QR Ordering
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.QR_ORDERING]),
    
    // Reservations
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.RESERVATIONS]),
    
    // Delivery
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.DELIVERY]),
    
    // Tracking
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.TRACKING]),
    
    // Stock
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.STOCK]),
    
    // Purchasing (including approve)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.PURCHASING]),
    
    // Production
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.PRODUCTION]),
    
    // Cost Control
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COST_CONTROL]),
    
    // Documents (including void)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.DOCUMENTS]),
    
    // Analytics (including export)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.ANALYTICS]),
    
    // Staff
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.STAFF]),
    
    // Settings (view only)
    PERMISSIONS[PERMISSION_MODULES.SETTINGS].VIEW,
    
    // Security (view only)
    PERMISSIONS[PERMISSION_MODULES.SECURITY].VIEW,
  ],

  // Cashier: Counter sales, payments, basic order operations
  [ROLE_TYPES.CASHIER]: [
    // Counter
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COUNTER]),
    
    // Cash Desk (view, create, print - no void/refund)
    PERMISSIONS[PERMISSION_MODULES.CASH_DESK].VIEW,
    PERMISSIONS[PERMISSION_MODULES.CASH_DESK].CREATE,
    PERMISSIONS[PERMISSION_MODULES.CASH_DESK].PRINT,
    
    // Orders (view, create - no delete/void/refund)
    PERMISSIONS[PERMISSION_MODULES.ORDERS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.ORDERS].CREATE,
    PERMISSIONS[PERMISSION_MODULES.ORDERS].EDIT,
    
    // Tables (view only)
    PERMISSIONS[PERMISSION_MODULES.TABLES].VIEW,
    
    // Customers (view, create - no export)
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].CREATE,
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].EDIT,
    
    // Documents (view, print - no void/export)
    PERMISSIONS[PERMISSION_MODULES.DOCUMENTS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.DOCUMENTS].PRINT,
  ],

  // Waiter: Table service, basic order operations
  [ROLE_TYPES.WAITER]: [
    // Counter
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COUNTER]),
    
    // Orders (view, create - no delete/void/refund)
    PERMISSIONS[PERMISSION_MODULES.ORDERS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.ORDERS].CREATE,
    PERMISSIONS[PERMISSION_MODULES.ORDERS].EDIT,
    
    // Tables
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.TABLES]),
    
    // Customers (view only)
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].VIEW,
    
    // Reservations
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.RESERVATIONS]),
    
    // Documents (view, print only)
    PERMISSIONS[PERMISSION_MODULES.DOCUMENTS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.DOCUMENTS].PRINT,
  ],

  // Kitchen: Kitchen operations only
  [ROLE_TYPES.KITCHEN]: [
    // Kitchen
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.KITCHEN]),
    
    // Orders (view only for assigned orders)
    PERMISSIONS[PERMISSION_MODULES.ORDERS].VIEW,
    
    // Production
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.PRODUCTION]),
  ],

  // Delivery: Delivery operations only
  [ROLE_TYPES.DELIVERY]: [
    // Delivery
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.DELIVERY]),
    
    // Tracking
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.TRACKING]),
    
    // Orders (view only for assigned orders)
    PERMISSIONS[PERMISSION_MODULES.ORDERS].VIEW,
    
    // Customers (view only - limited info)
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].VIEW,
  ],

  // Stock Manager: Inventory and purchasing
  [ROLE_TYPES.STOCK_MANAGER]: [
    // Stock
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.STOCK]),
    
    // Purchasing (no approve)
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].VIEW,
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].CREATE,
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].EDIT,
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].DELETE,
    
    // Production
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.PRODUCTION]),
    
    // Cost Control
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COST_CONTROL]),
    
    // Analytics (view only)
    PERMISSIONS[PERMISSION_MODULES.ANALYTICS].VIEW,
  ],

  // Accountant: Financial reports and documents
  [ROLE_TYPES.ACCOUNTANT]: [
    // Documents
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.DOCUMENTS]),
    
    // Cost Control
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.COST_CONTROL]),
    
    // Analytics (including export)
    ...Object.values(PERMISSIONS[PERMISSION_MODULES.ANALYTICS]),
    
    // Purchasing (view, approve only)
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].VIEW,
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].APPROVE,
    
    // Cash Desk (view only)
    PERMISSIONS[PERMISSION_MODULES.CASH_DESK].VIEW,
  ],

  // Viewer: Read-only access to most modules
  [ROLE_TYPES.VIEWER]: [
    // View permissions for most modules
    PERMISSIONS[PERMISSION_MODULES.COUNTER].VIEW,
    PERMISSIONS[PERMISSION_MODULES.CASH_DESK].VIEW,
    PERMISSIONS[PERMISSION_MODULES.ORDERS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.KITCHEN].VIEW,
    PERMISSIONS[PERMISSION_MODULES.TABLES].VIEW,
    PERMISSIONS[PERMISSION_MODULES.CUSTOMERS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.QR_ORDERING].VIEW,
    PERMISSIONS[PERMISSION_MODULES.RESERVATIONS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.DELIVERY].VIEW,
    PERMISSIONS[PERMISSION_MODULES.TRACKING].VIEW,
    PERMISSIONS[PERMISSION_MODULES.STOCK].VIEW,
    PERMISSIONS[PERMISSION_MODULES.PURCHASING].VIEW,
    PERMISSIONS[PERMISSION_MODULES.PRODUCTION].VIEW,
    PERMISSIONS[PERMISSION_MODULES.COST_CONTROL].VIEW,
    PERMISSIONS[PERMISSION_MODULES.DOCUMENTS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.ANALYTICS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.STAFF].VIEW,
    PERMISSIONS[PERMISSION_MODULES.SETTINGS].VIEW,
    PERMISSIONS[PERMISSION_MODULES.SECURITY].VIEW,
  ],
};

// Fix typo in MANAGER role
ROLE_PERMISSIONS[ROLE_TYPES.MANAGER] = ROLE_PERMISSIONS[ROLE_TYPES.MAGER];
delete ROLE_PERMISSIONS[ROLE_TYPES.MAGER];

// ── Role Metadata ──────────────────────────────────────────────────────────────

export const ROLE_METADATA = {
  [ROLE_TYPES.OWNER]: {
    name: 'Owner',
    description: 'Full system access including security and permission management',
    isSystem: true,
    canBeDeleted: false,
    level: 100,
  },
  [ROLE_TYPES.ADMIN]: {
    name: 'Admin',
    description: 'Full operational access, cannot manage security permissions',
    isSystem: true,
    canBeDeleted: false,
    level: 90,
  },
  [ROLE_TYPES.MANAGER]: {
    name: 'Manager',
    description: 'Broad operational access including voids, refunds, and reports',
    isSystem: true,
    canBeDeleted: false,
    level: 70,
  },
  [ROLE_TYPES.CASHIER]: {
    name: 'Cashier',
    description: 'Counter sales, payments, and basic order operations',
    isSystem: true,
    canBeDeleted: false,
    level: 40,
  },
  [ROLE_TYPES.WAITER]: {
    name: 'Waiter',
    description: 'Table service and order management',
    isSystem: true,
    canBeDeleted: false,
    level: 40,
  },
  [ROLE_TYPES.KITCHEN]: {
    name: 'Kitchen',
    description: 'Kitchen operations and production management',
    isSystem: true,
    canBeDeleted: false,
    level: 40,
  },
  [ROLE_TYPES.DELIVERY]: {
    name: 'Delivery',
    description: 'Delivery operations and route tracking',
    isSystem: true,
    canBeDeleted: false,
    level: 40,
  },
  [ROLE_TYPES.STOCK_MANAGER]: {
    name: 'Stock Manager',
    description: 'Inventory management and purchasing',
    isSystem: true,
    canBeDeleted: false,
    level: 60,
  },
  [ROLE_TYPES.ACCOUNTANT]: {
    name: 'Accountant',
    description: 'Financial reports and document management',
    isSystem: true,
    canBeDeleted: false,
    level: 60,
  },
  [ROLE_TYPES.VIEWER]: {
    name: 'Viewer',
    description: 'Read-only access to all modules',
    isSystem: true,
    canBeDeleted: false,
    level: 20,
  },
};

// ── Role Schema ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Role
 * @property {string} id - Unique role identifier
 * @property {string} type - Role type (from ROLE_TYPES)
 * @property {string} name - Display name
 * @property {string} description - Role description
 * @property {string[]} permissions - Array of permission strings
 * @property {boolean} isSystem - Whether this is a system role
 * @property {boolean} canBeDeleted - Whether this role can be deleted
 * @property {number} level - Access level (higher = more access)
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

// ── Role Creation & Normalization ─────────────────────────────────────────────

export function createRole(input = {}) {
  const safe = (input && typeof input === 'object') ? input : {};
  const type = safe.type || ROLE_TYPES.VIEWER;
  
  // Use default permissions for system roles
  const defaultPermissions = ROLE_PERMISSIONS[type] || [];
  const permissions = Array.isArray(safe.permissions) && safe.permissions.length > 0
    ? safe.permissions
    : [...defaultPermissions];
  
  const metadata = ROLE_METADATA[type] || {
    name: type,
    description: 'Custom role',
    isSystem: false,
    canBeDeleted: true,
    level: 30,
  };
  
  return {
    id: safe.id || generateId(),
    type,
    name: safe.name || metadata.name,
    description: safe.description || metadata.description,
    permissions,
    isSystem: metadata.isSystem,
    canBeDeleted: metadata.canBeDeleted,
    level: metadata.level,
    createdAt: safe.createdAt || now(),
    updatedAt: safe.updatedAt || now(),
  };
}

export function normalizeRole(role) {
  if (!role || typeof role !== 'object') return null;
  
  const type = role.type || ROLE_TYPES.VIEWER;
  const metadata = ROLE_METADATA[type] || {
    name: type,
    description: 'Custom role',
    isSystem: false,
    canBeDeleted: true,
    level: 30,
  };
  
  return {
    id: role.id || generateId(),
    type,
    name: role.name || metadata.name,
    description: role.description || metadata.description,
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
    isSystem: metadata.isSystem,
    canBeDeleted: metadata.canBeDeleted,
    level: metadata.level,
    createdAt: role.createdAt || now(),
    updatedAt: role.updatedAt || now(),
  };
}

// ── Role Permission Management ─────────────────────────────────────────────────

export function addPermissionToRole(role, permission) {
  if (!role || !permission) return role;
  const normalized = normalizeRole(role);
  if (!normalized.permissions.includes(permission)) {
    normalized.permissions = [...normalized.permissions, permission];
    normalized.updatedAt = now();
  }
  return normalized;
}

export function removePermissionFromRole(role, permission) {
  if (!role || !permission) return role;
  const normalized = normalizeRole(role);
  normalized.permissions = normalized.permissions.filter(p => p !== permission);
  normalized.updatedAt = now();
  return normalized;
}

export function setRolePermissions(role, permissions) {
  if (!role) return role;
  const normalized = normalizeRole(role);
  normalized.permissions = Array.isArray(permissions) ? permissions : [];
  normalized.updatedAt = now();
  return normalized;
}

// ── Role Permission Checking ───────────────────────────────────────────────────

export function roleHasPermission(role, permission) {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return hasPermission(normalized.permissions, permission);
}

export function roleHasAnyPermission(role, permissions) {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return hasAnyPermission(normalized.permissions, permissions);
}

export function roleHasAllPermissions(role, permissions) {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return hasAllPermissions(normalized.permissions, permissions);
}

// ── Role Comparison ───────────────────────────────────────────────────────────

export function compareRoleLevel(roleA, roleB) {
  const levelA = roleA?.level || 0;
  const levelB = roleB?.level || 0;
  return levelA - levelB;
}

export function isHigherRole(roleA, roleB) {
  return compareRoleLevel(roleA, roleB) > 0;
}

export function isSameOrHigherRole(roleA, roleB) {
  return compareRoleLevel(roleA, roleB) >= 0;
}

// ── Role Safety Checks ────────────────────────────────────────────────────────

export function canDeleteRole(role, allRoles = []) {
  if (!role) return false;
  const normalized = normalizeRole(role);
  
  // System roles cannot be deleted
  if (normalized.isSystem || !normalized.canBeDeleted) {
    return false;
  }
  
  // Prevent deleting the last owner/admin role
  const ownerAdminCount = allRoles.filter(r => {
    const n = normalizeRole(r);
    return n.type === ROLE_TYPES.OWNER || n.type === ROLE_TYPES.ADMIN;
  }).length;
  
  if ((normalized.type === ROLE_TYPES.OWNER || normalized.type === ROLE_TYPES.ADMIN) && ownerAdminCount <= 1) {
    return false;
  }
  
  return true;
}

export function canModifyRolePermissions(role, currentRole) {
  if (!role || !currentRole) return false;
  const target = normalizeRole(role);
  const current = normalizeRole(currentRole);
  
  // Cannot modify system roles unless you are owner
  if (target.isSystem && current.type !== ROLE_TYPES.OWNER) {
    return false;
  }
  
  // Cannot modify roles higher than your own
  if (isHigherRole(target, current)) {
    return false;
  }
  
  return true;
}

// ── Role Utilities ───────────────────────────────────────────────────────────

export function getRoleLabel(roleType) {
  const metadata = ROLE_METADATA[roleType];
  return metadata ? metadata.name : roleType;
}

export function getRoleDescription(roleType) {
  const metadata = ROLE_METADATA[roleType];
  return metadata ? metadata.description : '';
}

export function getDefaultPermissions(roleType) {
  return ROLE_PERMISSIONS[roleType] || [];
}

export function getAllRoleTypes() {
  return Object.values(ROLE_TYPES);
}

export function getSystemRoles() {
  return Object.values(ROLE_TYPES).filter(type => ROLE_METADATA[type]?.isSystem);
}

export function getCustomRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles.filter(role => {
    const normalized = normalizeRole(role);
    return !normalized.isSystem;
  });
}

// ── Role Presets for Quick Assignment ─────────────────────────────────────────

export const ROLE_PRESETS = {
  CASHIER_PRESET: {
    type: ROLE_TYPES.CASHIER,
    name: 'Cashier',
    description: 'Counter sales and payments',
    permissions: getDefaultPermissions(ROLE_TYPES.CASHIER),
  },
  WAITER_PRESET: {
    type: ROLE_TYPES.WAITER,
    name: 'Waiter',
    description: 'Table service',
    permissions: getDefaultPermissions(ROLE_TYPES.WAITER),
  },
  KITCHEN_PRESET: {
    type: ROLE_TYPES.KITCHEN,
    name: 'Kitchen',
    description: 'Kitchen operations',
    permissions: getDefaultPermissions(ROLE_TYPES.KITCHEN),
  },
  DELIVERY_PRESET: {
    type: ROLE_TYPES.DELIVERY,
    name: 'Delivery',
    description: 'Delivery operations',
    permissions: getDefaultPermissions(ROLE_TYPES.DELIVERY),
  },
  MANAGER_PRESET: {
    type: ROLE_TYPES.MANAGER,
    name: 'Manager',
    description: 'Full operational access',
    permissions: getDefaultPermissions(ROLE_TYPES.MANAGER),
  },
};

export function applyRolePreset(presetKey) {
  const preset = ROLE_PRESETS[presetKey];
  if (!preset) return null;
  return createRole(preset);
}
