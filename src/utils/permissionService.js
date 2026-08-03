// Permission service for CafeOS action-layer permission enforcement
// Provides permission checking utilities for sensitive actions across all modules

import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getMissingPermissions 
} from '../domain/permissionModel.js';
import { 
  getCurrentPermissions, 
  getCurrentUserId, 
  getCurrentUserName,
  getCurrentRoleType,
  getCurrentBranchId,
  isOwner,
  isAdmin,
  isManagerOrHigher
} from './authService.js';

// ── Permission Check Result ────────────────────────────────────────────────────

/**
 * @typedef {Object} PermissionCheckResult
 * @property {boolean} allowed - Whether the action is allowed
 * @property {string} reason - Human-readable reason if denied
 * @property {string[]} missingPermissions - Missing permissions if denied
 * @property {string} requiredPermission - The permission that was required
 */

// ── Branch Access Checking ─────────────────────────────────────────────────────

/**
 * Check if current user has access to a specific branch
 * @param {string} branchId - Branch ID to check access for
 * @returns {PermissionCheckResult}
 */
export function checkBranchAccess(branchId) {
  const _userId = getCurrentUserId();
  const _roleType = getCurrentRoleType();
  const currentBranchId = getCurrentBranchId();
  
  // Owners and admins have access to all branches
  if (isOwner() || isAdmin()) {
    return {
      allowed: true,
      reason: 'User has full branch access',
      requiredPermission: 'BRANCH_ACCESS',
    };
  }
  
  // Users can only access their assigned branch
  if (currentBranchId && currentBranchId === branchId) {
    return {
      allowed: true,
      reason: 'User has access to their assigned branch',
      requiredPermission: 'BRANCH_ACCESS',
    };
  }
  
  // If no branch is assigned, deny access
  if (!currentBranchId) {
    return {
      allowed: false,
      reason: 'No branch assigned to user',
      missingPermissions: ['BRANCH_ACCESS'],
      requiredPermission: 'BRANCH_ACCESS',
    };
  }
  
  // Branch mismatch
  return {
    allowed: false,
    reason: `User does not have access to branch ${branchId}`,
    missingPermissions: ['BRANCH_ACCESS'],
    requiredPermission: 'BRANCH_ACCESS',
  };
}

/**
 * Check if current user can access data for a specific branch
 * @param {string} branchId - Branch ID to check
 * @returns {boolean}
 */
export function hasBranchAccess(branchId) {
  return checkBranchAccess(branchId).allowed;
}

/**
 * Filter data by branch access - returns only data for branches user can access
 * @param {Array} data - Array of data items with branchId property
 * @returns {Array} Filtered data
 */
export function filterByBranchAccess(data) {
  const _userId = getCurrentUserId();
  const _roleType = getCurrentRoleType();
  const currentBranchId = getCurrentBranchId();
  
  // Owners and admins see all data
  if (isOwner() || isAdmin()) {
    return data;
  }
  
  // Other users only see their branch's data
  if (!currentBranchId) {
    return [];
  }
  
  return data.filter(item => {
    // If item has no branchId, include it (legacy data)
    if (!item.branchId) return true;
    return item.branchId === currentBranchId;
  });
}

// ── Core Permission Checking ───────────────────────────────────────────────────

/**
 * Check if current user has required permission
 * @param {string} permission - Required permission
 * @returns {PermissionCheckResult}
 */
export function checkPermission(permission) {
  const permissions = getCurrentPermissions();
  const userId = getCurrentUserId();
  const _userName = getCurrentUserName();
  const _roleType = getCurrentRoleType();
  
  if (!userId) {
    return {
      allowed: false,
      reason: 'You must be logged in to perform this action',
      missingPermissions: [permission],
      requiredPermission: permission,
    };
  }
  
  if (hasPermission(permissions, permission)) {
    return {
      allowed: true,
      reason: '',
      missingPermissions: [],
      requiredPermission: permission,
    };
  }
  
  return {
    allowed: false,
    reason: `You do not have permission to perform this action. Required: ${permission}`,
    missingPermissions: getMissingPermissions(permissions, [permission]),
    requiredPermission: permission,
  };
}

/**
 * Check if current user has any of the required permissions
 * @param {string[]} permissions - Required permissions (any one)
 * @returns {PermissionCheckResult}
 */
export function checkAnyPermission(permissions) {
  const currentPermissions = getCurrentPermissions();
  const userId = getCurrentUserId();
  
  if (!userId) {
    return {
      allowed: false,
      reason: 'You must be logged in to perform this action',
      missingPermissions: permissions,
      requiredPermission: permissions.join(' OR '),
    };
  }
  
  if (hasAnyPermission(currentPermissions, permissions)) {
    return {
      allowed: true,
      reason: '',
      missingPermissions: [],
      requiredPermission: permissions.join(' OR '),
    };
  }
  
  return {
    allowed: false,
    reason: `You do not have permission to perform this action. Required one of: ${permissions.join(', ')}`,
    missingPermissions: getMissingPermissions(currentPermissions, permissions),
    requiredPermission: permissions.join(' OR '),
  };
}

/**
 * Check if current user has all required permissions
 * @param {string[]} permissions - Required permissions (all)
 * @returns {PermissionCheckResult}
 */
export function checkAllPermissions(permissions) {
  const currentPermissions = getCurrentPermissions();
  const userId = getCurrentUserId();
  
  if (!userId) {
    return {
      allowed: false,
      reason: 'You must be logged in to perform this action',
      missingPermissions: permissions,
      requiredPermission: permissions.join(' AND '),
    };
  }
  
  if (hasAllPermissions(currentPermissions, permissions)) {
    return {
      allowed: true,
      reason: '',
      missingPermissions: [],
      requiredPermission: permissions.join(' AND '),
    };
  }
  
  return {
    allowed: false,
    reason: `You do not have permission to perform this action. Required all of: ${permissions.join(', ')}`,
    missingPermissions: getMissingPermissions(currentPermissions, permissions),
    requiredPermission: permissions.join(' AND '),
  };
}

// ── Module-Specific Permission Checks ───────────────────────────────────────────

/**
 * Check order-related permissions
 */
export const OrderPermissions = {
  canView: () => checkPermission('ORDERS_VIEW'),
  canCreate: () => checkPermission('ORDERS_CREATE'),
  canEdit: () => checkPermission('ORDERS_EDIT'),
  canDelete: () => checkPermission('ORDERS_DELETE'),
  canVoid: () => checkPermission('ORDERS_VOID'),
  canRefund: () => checkPermission('ORDERS_REFUND'),
};

/**
 * Check customer-related permissions
 */
export const CustomerPermissions = {
  canView: () => checkPermission('CUSTOMERS_VIEW'),
  canCreate: () => checkPermission('CUSTOMERS_CREATE'),
  canEdit: () => checkPermission('CUSTOMERS_EDIT'),
  canDelete: () => checkPermission('CUSTOMERS_DELETE'),
  canExport: () => checkPermission('CUSTOMERS_EXPORT'),
};

/**
 * Check stock-related permissions
 */
export const StockPermissions = {
  canView: () => checkPermission('STOCK_VIEW'),
  canCreate: () => checkPermission('STOCK_CREATE'),
  canEdit: () => checkPermission('STOCK_EDIT'),
  canDelete: () => checkPermission('STOCK_DELETE'),
  canAdjust: () => checkPermission('STOCK_ADJUST'),
};

/**
 * Check purchasing-related permissions
 */
export const PurchasingPermissions = {
  canView: () => checkPermission('PURCHASING_VIEW'),
  canCreate: () => checkPermission('PURCHASING_CREATE'),
  canEdit: () => checkPermission('PURCHASING_EDIT'),
  canDelete: () => checkPermission('PURCHASING_DELETE'),
  canApprove: () => checkPermission('PURCHASING_APPROVE'),
};

/**
 * Check document-related permissions
 */
export const DocumentPermissions = {
  canView: () => checkPermission('DOCUMENTS_VIEW'),
  canCreate: () => checkPermission('DOCUMENTS_CREATE'),
  canEdit: () => checkPermission('DOCUMENTS_EDIT'),
  canDelete: () => checkPermission('DOCUMENTS_DELETE'),
  canVoid: () => checkPermission('DOCUMENTS_VOID'),
  canPrint: () => checkPermission('DOCUMENTS_PRINT'),
  canExport: () => checkPermission('DOCUMENTS_EXPORT'),
};

/**
 * Check analytics-related permissions
 */
export const AnalyticsPermissions = {
  canView: () => checkPermission('ANALYTICS_VIEW'),
  canExport: () => checkPermission('ANALYTICS_EXPORT'),
};

/**
 * Check staff-related permissions
 */
export const StaffPermissions = {
  canView: () => checkPermission('STAFF_VIEW'),
  canCreate: () => checkPermission('STAFF_CREATE'),
  canEdit: () => checkPermission('STAFF_EDIT'),
  canDelete: () => checkPermission('STAFF_DELETE'),
};

/**
 * Check security-related permissions
 */
export const SecurityPermissions = {
  canView: () => checkPermission('SECURITY_VIEW'),
  canManagePermissions: () => checkPermission('SECURITY_MANAGE_PERMISSIONS'),
  canExport: () => checkPermission('SECURITY_EXPORT'),
};

/**
 * Check settings-related permissions
 */
export const SettingsPermissions = {
  canView: () => checkPermission('SETTINGS_VIEW'),
  canManageSettings: () => checkPermission('SETTINGS_MANAGE_SETTINGS'),
};

/**
 * Check import/export permissions
 */
export const ImportExportPermissions = {
  canExport: () => checkPermission('IMPORT_EXPORT_EXPORT'),
  canImport: () => checkPermission('IMPORT_EXPORT_IMPORT'),
  canBackup: () => checkPermission('SECURITY_BACKUP'),
  canRestore: () => checkPermission('SECURITY_RESTORE'),
};

// ── High-Level Action Guards ───────────────────────────────────────────────────

/**
 * Guard for deleting orders
 */
export function guardOrderDelete() {
  return checkAnyPermission(['ORDERS_DELETE', 'ORDERS_VOID']);
}

/**
 * Guard for refunding payments
 */
export function guardPaymentRefund() {
  return checkAnyPermission(['ORDERS_REFUND', 'CASH_DESK_REFUND']);
}

/**
 * Guard for voiding sales
 */
export function guardSaleVoid() {
  return checkAnyPermission(['ORDERS_VOID', 'CASH_DESK_VOID']);
}

/**
 * Guard for exporting customer data
 */
export function guardCustomerExport() {
  return checkPermission('CUSTOMERS_EXPORT');
}

/**
 * Guard for viewing financial analytics
 */
export function guardFinancialAnalytics() {
  return checkPermission('ANALYTICS_VIEW');
}

/**
 * Guard for exporting reports
 */
export function guardReportExport() {
  return checkAnyPermission(['ANALYTICS_EXPORT', 'DOCUMENTS_EXPORT']);
}

/**
 * Guard for stock adjustments
 */
export function guardStockAdjust() {
  return checkPermission('STOCK_ADJUST');
}

/**
 * Guard for approving purchase orders
 */
export function guardPurchaseApprove() {
  return checkPermission('PURCHASING_APPROVE');
}

/**
 * Guard for deleting suppliers
 */
export function guardSupplierDelete() {
  return checkPermission('PURCHASING_DELETE');
}

/**
 * Guard for managing security permissions
 */
export function guardSecurityManage() {
  return checkPermission('SECURITY_MANAGE_PERMISSIONS');
}

/**
 * Guard for changing business settings
 */
export function guardSettingsChange() {
  return checkPermission('SETTINGS_MANAGE_SETTINGS');
}

/**
 * Guard for importing data
 */
export function guardDataImport() {
  return checkPermission('IMPORT_EXPORT_IMPORT');
}

/**
 * Guard for exporting backup
 */
export function guardBackupExport() {
  return checkAnyPermission(['IMPORT_EXPORT_EXPORT', 'SECURITY_EXPORT']);
}

// ── Permission Enforcement Wrapper ─────────────────────────────────────────────

/**
 * Execute action only if permission check passes
 * @param {Function} check - Permission check function
 * @param {Function} action - Action to execute if allowed
 * @param {Function} onDenied - Callback when denied (optional)
 * @returns {any} Result of action or null if denied
 */
export function withPermissionCheck(check, action, onDenied = null) {
  const result = check();
  
  if (result.allowed) {
    return action();
  }
  
  if (onDenied) {
    onDenied(result);
  }
  
  return null;
}

/**
 * Async version of withPermissionCheck
 */
export async function withPermissionCheckAsync(check, action, onDenied = null) {
  const result = check();
  
  if (result.allowed) {
    return await action();
  }
  
  if (onDenied) {
    onDenied(result);
  }
  
  return null;
}

// ── Permission UI Helpers ───────────────────────────────────────────────────

/**
 * Get human-readable permission requirement message
 */
export function getPermissionMessage(checkResult) {
  if (!checkResult) {
    return 'Permission check failed';
  }
  
  if (checkResult.allowed) {
    return '';
  }
  
  const userName = getCurrentUserName() || 'You';
  const roleType = getCurrentRoleType() || 'your current role';
  
  return `${userName} (Role: ${roleType}) ${checkResult.reason}`;
}

/**
 * Get contact message for permission denial
 */
export function getContactMessage() {
  if (isOwner()) {
    return 'You have full access. This should not happen.';
  }
  
  if (isAdmin()) {
    return 'Contact the owner for additional permissions.';
  }
  
  if (isManagerOrHigher()) {
    return 'Contact an admin or owner for additional permissions.';
  }
  
  return 'Contact a manager, admin, or owner for additional permissions.';
}

// ── Role-Based Quick Checks ───────────────────────────────────────────────────

/**
 * Quick check if user can perform sensitive financial actions
 */
export function canPerformFinancialActions() {
  return isManagerOrHigher();
}

/**
 * Quick check if user can manage staff
 */
export function canManageStaff() {
  return isManagerOrHigher();
}

/**
 * Quick check if user can manage security
 */
export function canManageSecurity() {
  return isOwner();
}

/**
 * Quick check if user can export sensitive data
 */
export function canExportSensitiveData() {
  return isManagerOrHigher();
}

// ── Audit Logging Integration ─────────────────────────────────────────────────

/**
 * Create audit log entry for permission denial
 * @param {string} action - Action attempted
 * @param {string} permission - Required permission
 * @param {object} context - Additional context
 */
export function createPermissionDenialAudit(action, permission, context = {}) {
  return {
    action: 'PERMISSION_DENIED',
    module: 'SECURITY',
    userId: getCurrentUserId(),
    userName: getCurrentUserName(),
    roleType: getCurrentRoleType(),
    attemptedAction: action,
    requiredPermission: permission,
    timestamp: new Date().toISOString(),
    context,
  };
}

// ── Permission Cache (for performance) ───────────────────────────────────────

const permissionCache = new Map();
const CACHE_TTL = 60000; // 1 minute

/**
 * Cached permission check
 */
export function checkPermissionCached(permission) {
  const cacheKey = `${getCurrentUserId()}_${permission}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const result = checkPermission(permission);
  permissionCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
  
  return result;
}

/**
 * Clear permission cache
 */
export function clearPermissionCache() {
  permissionCache.clear();
}

/**
 * Clear permission cache for specific user
 */
export function clearUserPermissionCache(userId) {
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`${userId}_`)) {
      permissionCache.delete(key);
    }
  }
}
