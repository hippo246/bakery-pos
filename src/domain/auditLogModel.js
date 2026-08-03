// Audit log model for tracking KDS, inventory, and delivery events

import { generateId } from './ids.js';
import { now } from './dates.js';

// ── Internal safe helpers ────────────────────────────────────────────────────

function devWarn(...args) {
  console.warn('[auditLogModel]', ...args);
}

function toSafeString(val, fallback = '') {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function toSafeNullableString(val) {
  return typeof val === 'string' && val.trim() ? val.trim() : null;
}

function toSafeTimestamp(val) {
  if (val == null) return now();
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
  if (val instanceof Date) {
    const t = val.getTime();
    return Number.isFinite(t) ? t : now();
  }
  if (typeof val === 'string' && val.trim()) {
    const t = new Date(val).getTime();
    return Number.isFinite(t) ? t : now();
  }
  devWarn('invalid timestamp, using now()', val);
  return now();
}

function toSafeDetails(val) {
  if (val == null) return {};
  if (Array.isArray(val) || typeof val !== 'object') {
    devWarn('details was not a plain object, wrapping', val);
    return { value: val };
  }
  // Strip functions and symbols for JSON-safety
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    devWarn('details not JSON-serializable, using {}');
    return {};
  }
}

function toSafeDateBound(val) {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
  if (val instanceof Date) {
    const t = val.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof val === 'string' && val.trim()) {
    const t = new Date(val).getTime();
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Audit Log Entry schema
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Unique audit log entry identifier
 * @property {string} timestamp - ISO timestamp of the event
 * @property {string} module - Module name (KDS, INVENTORY, DELIVERY, ORDERS)
 * @property {string} action - Action performed (e.g., "ORDER_CREATED", "INVENTORY_DEDUCTED", "DELIVERY_ASSIGNED")
 * @property {string} userId - User who performed the action (optional)
 * @property {object} details - Additional details about the event
 * @property {string} entityId - Related entity ID (order ID, inventory item ID, etc.)
 */

/**
 * Create a new audit log entry
 * @param {object} input - Audit log entry input data
 * @returns {AuditLogEntry} New audit log entry
 */
export function createAuditLogEntry(input = {}) {
  const safe = (input && typeof input === 'object' && !Array.isArray(input)) ? input : {};
  return {
    id: toSafeString(safe.id) || generateId(),
    timestamp: toSafeTimestamp(safe.timestamp),
    module: toSafeString(safe.module, 'GENERAL'),
    action: toSafeString(safe.action, 'UNKNOWN'),
    userId: toSafeNullableString(safe.userId),
    details: toSafeDetails(safe.details),
    entityId: toSafeNullableString(safe.entityId)
  };
}

/**
 * Normalize an audit log entry
 * @param {object} entry - Audit log entry to normalize
 * @returns {AuditLogEntry} Normalized audit log entry
 */
export function normalizeAuditLogEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    devWarn('malformed audit entry', entry);
    return null;
  }

  // Support legacy field shapes
  const rawTimestamp = entry.timestamp ?? entry.date ?? entry.createdAt;
  const rawAction    = entry.action    ?? entry.type ?? entry.event;
  const rawDetails   = entry.details   ?? entry.payload;

  return {
    id: toSafeString(entry.id) || generateId(),
    timestamp: toSafeTimestamp(rawTimestamp),
    module: toSafeString(entry.module, 'GENERAL'),
    action: toSafeString(rawAction, 'UNKNOWN'),
    userId: toSafeNullableString(entry.userId),
    details: toSafeDetails(rawDetails),
    entityId: toSafeNullableString(entry.entityId)
  };
}

/**
 * Filter audit logs by module
 * @param {AuditLogEntry[]} logs - Audit log array
 * @param {string} module - Module to filter by
 * @returns {AuditLogEntry[]} Filtered audit logs
 */
export function getAuditLogsByModule(logs, module) {
  if (!Array.isArray(logs)) return [];
  const mod = toSafeString(module);
  if (!mod) return [];
  return logs.filter(log => log && typeof log === 'object' && log.module === mod);
}

/**
 * Filter audit logs by entity ID
 */
export function getAuditLogsByEntity(logs, entityId) {
  if (!Array.isArray(logs)) return [];
  const id = toSafeString(entityId);
  if (!id) return [];
  return logs.filter(log => log && typeof log === 'object' && log.entityId === id);
}

/**
 * Filter audit logs by user ID
 */
export function getAuditLogsByUser(logs, userId) {
  if (!Array.isArray(logs)) return [];
  const id = toSafeString(userId);
  if (!id) return [];
  return logs.filter(log => log && typeof log === 'object' && log.userId === id);
}

/**
 * Filter audit logs by date range
 */
export function getAuditLogsByDateRange(logs, startDate, endDate) {
  if (!Array.isArray(logs)) return [];

  let start = toSafeDateBound(startDate);
  let end   = toSafeDateBound(endDate);

  if (start === null && end === null) {
    devWarn('getAuditLogsByDateRange: both bounds invalid, returning all logs', startDate, endDate);
    return [...logs];
  }
  if (start === null || end === null) {
    devWarn('getAuditLogsByDateRange: one bound invalid, ignoring that side', startDate, endDate);
  }
  if (start !== null && end !== null && start > end) {
    devWarn('startDate > endDate, swapping');
    [start, end] = [end, start];
  }

  return logs.filter(log => {
    if (!log || typeof log !== 'object') return false;
    // log.timestamp is already a numeric ms value after normalization
    const logTime = typeof log.timestamp === 'number' ? log.timestamp : toSafeDateBound(log.timestamp);
    if (logTime === null) return false;
    const afterStart = start === null || logTime >= start;
    const beforeEnd  = end   === null || logTime <= end;
    return afterStart && beforeEnd;
  });
}

/**
 * Audit action constants
 */
export const AUDIT_ACTIONS = {
  // KDS actions
  KDS_TICKET_CREATED: 'KDS_TICKET_CREATED',
  KDS_TICKET_STARTED: 'KDS_TICKET_STARTED',
  KDS_TICKET_COMPLETED: 'KDS_TICKET_COMPLETED',
  KDS_TICKET_HELD: 'KDS_TICKET_HELD',
  KDS_TICKET_RELEASED: 'KDS_TICKET_RELEASED',
  KDS_TICKET_MOVED: 'KDS_TICKET_MOVED',
  KDS_TICKET_BUMPED: 'KDS_TICKET_BUMPED',
  KDS_URGENCY_CHANGED: 'KDS_URGENCY_CHANGED',

  // Inventory actions
  INVENTORY_ITEM_CREATED: 'INVENTORY_ITEM_CREATED',
  INVENTORY_ITEM_UPDATED: 'INVENTORY_ITEM_UPDATED',
  INVENTORY_ITEM_DELETED: 'INVENTORY_ITEM_DELETED',
  INVENTORY_RESTOCKED: 'INVENTORY_RESTOCKED',
  INVENTORY_DEDUCTED: 'INVENTORY_DEDUCTED',
  INVENTORY_ADJUSTED: 'INVENTORY_ADJUSTED',
  INVENTORY_RESTORED: 'INVENTORY_RESTORED',

  // Delivery actions
  DELIVERY_ORDER_CREATED: 'DELIVERY_ORDER_CREATED',
  DELIVERY_STATUS_CHANGED: 'DELIVERY_STATUS_CHANGED',
  DELIVERY_RIDER_ASSIGNED: 'DELIVERY_RIDER_ASSIGNED',
  DELIVERY_RIDER_REASSIGNED: 'DELIVERY_RIDER_REASSIGNED',
  DELIVERY_COD_COLLECTED: 'DELIVERY_COD_COLLECTED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  DELIVERY_DELIVERED: 'DELIVERY_DELIVERED',

  // Order actions
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_PAYMENT_UPDATED: 'ORDER_PAYMENT_UPDATED',

  // Table actions
  TABLE_RESERVED: 'TABLE_RESERVED',
  TABLE_OCCUPIED: 'TABLE_OCCUPIED',
  TABLE_CLEANING: 'TABLE_CLEANING',
  TABLE_AVAILABLE: 'TABLE_AVAILABLE',

  // CRM / Customer actions
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',

  // Settings
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',

  // Security & Access
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  BRANCH_ACCESS_CHANGED: 'BRANCH_ACCESS_CHANGED',
  EXPORT_ATTEMPT: 'EXPORT_ATTEMPT',
  IMPORT_ATTEMPT: 'IMPORT_ATTEMPT',
  SECURITY_SETTINGS_CHANGED: 'SECURITY_SETTINGS_CHANGED',
  AUDIT_LOG_ACCESSED: 'AUDIT_LOG_ACCESSED',
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED',

  // Workflow Engine
  WORKFLOW_CREATED: 'WORKFLOW_CREATED',
  WORKFLOW_UPDATED: 'WORKFLOW_UPDATED',
  WORKFLOW_DELETED: 'WORKFLOW_DELETED',
  WORKFLOW_EXECUTION_STARTED: 'WORKFLOW_EXECUTION_STARTED',
  WORKFLOW_EXECUTION_PAUSED: 'WORKFLOW_EXECUTION_PAUSED',
  WORKFLOW_EXECUTION_RESUMED: 'WORKFLOW_EXECUTION_RESUMED',
  WORKFLOW_EXECUTION_COMPLETED: 'WORKFLOW_EXECUTION_COMPLETED',
  WORKFLOW_EXECUTION_CANCELLED: 'WORKFLOW_EXECUTION_CANCELLED',
  WORKFLOW_EXECUTION_FAILED: 'WORKFLOW_EXECUTION_FAILED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_SKIPPED: 'TASK_SKIPPED',
  TASK_FAILED: 'TASK_FAILED',
};

/**
 * Audit module constants
 */
export const AUDIT_MODULES = {
  KDS: 'KDS',
  INVENTORY: 'INVENTORY',
  DELIVERY: 'DELIVERY',
  ORDERS: 'ORDERS',
  TABLES: 'TABLES',
  CRM: 'CRM',
  STAFF: 'STAFF',
  SETTINGS: 'SETTINGS',
  SECURITY: 'SECURITY',
  WORKFLOWS: 'WORKFLOWS',
  GENERAL: 'GENERAL'
};

// ── Domain-scoped audit log factory helpers ──────────────────────────────────

export function createOrderAuditLog(action, order, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.ORDERS,
    action: toSafeString(action, AUDIT_ACTIONS.ORDER_CREATED),
    entityId: order?.id ?? null,
    userId: order?.userId ?? null,
    details: { ...(order ? { orderId: order.id, source: order.source } : {}), ...details }
  });
}

export function createInventoryAuditLog(action, item, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.INVENTORY,
    action: toSafeString(action, AUDIT_ACTIONS.INVENTORY_ADJUSTED),
    entityId: item?.id ?? null,
    details: { ...(item ? { itemId: item.id, name: item.name } : {}), ...details }
  });
}

export function createKdsAuditLog(action, ticket, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.KDS,
    action: toSafeString(action, AUDIT_ACTIONS.KDS_TICKET_CREATED),
    entityId: ticket?.id ?? null,
    details: { ...(ticket ? { ticketId: ticket.id, station: ticket.station } : {}), ...details }
  });
}

export function createDeliveryAuditLog(action, delivery, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.DELIVERY,
    action: toSafeString(action, AUDIT_ACTIONS.DELIVERY_STATUS_CHANGED),
    entityId: delivery?.id ?? null,
    details: { ...(delivery ? { deliveryId: delivery.id } : {}), ...details }
  });
}

export function createSecurityAuditLog(action, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: toSafeString(action, AUDIT_ACTIONS.LOGIN),
    details
  });
}

export function createPermissionDeniedAuditLog(action, requiredPermission, context = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: AUDIT_ACTIONS.PERMISSION_DENIED,
    details: {
      attemptedAction: action,
      requiredPermission,
      ...context
    }
  });
}

export function createRoleAuditLog(action, role, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: toSafeString(action, AUDIT_ACTIONS.ROLE_UPDATED),
    entityId: role?.id ?? null,
    details: { ...(role ? { roleId: role.id, roleName: role.name, roleType: role.type } : {}), ...details }
  });
}

export function createExportAuditLog(exportType, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: AUDIT_ACTIONS.EXPORT_ATTEMPT,
    details: { exportType, ...details }
  });
}

export function createImportAuditLog(importType, details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: AUDIT_ACTIONS.IMPORT_ATTEMPT,
    details: { importType, ...details }
  });
}

export function createBackupAuditLog(details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: 'BACKUP_CREATED',
    details
  });
}

export function createRestoreAuditLog(details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: 'RESTORE_COMPLETED',
    details
  });
}

export function createRemoteSessionAuditLog(details = {}) {
  return createAuditLogEntry({
    module: AUDIT_MODULES.SECURITY,
    action: details.action || 'REMOTE_SESSION',
    details
  });
}

export function sortAuditLogsNewestFirst(logs) {
  if (!Array.isArray(logs)) return [];
  return [...logs].sort((a, b) => {
    const ta = toSafeDateBound(a?.timestamp) ?? 0;
    const tb = toSafeDateBound(b?.timestamp) ?? 0;
    return tb - ta;
  });
}
