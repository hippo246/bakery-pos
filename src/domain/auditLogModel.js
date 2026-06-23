// Audit log model for tracking KDS, inventory, and delivery events

import { generateId } from './ids.js';
import { now } from './dates.js';

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
  return {
    id: input.id || generateId(),
    timestamp: input.timestamp || now(),
    module: input.module || 'GENERAL',
    action: input.action || 'UNKNOWN',
    userId: input.userId || null,
    details: input.details || {},
    entityId: input.entityId || null
  };
}

/**
 * Normalize an audit log entry
 * @param {object} entry - Audit log entry to normalize
 * @returns {AuditLogEntry} Normalized audit log entry
 */
export function normalizeAuditLogEntry(entry) {
  if (!entry) return null;

  return {
    id: entry.id || generateId(),
    timestamp: entry.timestamp || now(),
    module: entry.module || 'GENERAL',
    action: entry.action || 'UNKNOWN',
    userId: entry.userId || null,
    details: entry.details || {},
    entityId: entry.entityId || null
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
  return logs.filter(log => log.module === module);
}

/**
 * Filter audit logs by entity ID
 * @param {AuditLogEntry[]} logs - Audit log array
 * @param {string} entityId - Entity ID to filter by
 * @returns {AuditLogEntry[]} Filtered audit logs
 */
export function getAuditLogsByEntity(logs, entityId) {
  if (!Array.isArray(logs)) return [];
  return logs.filter(log => log.entityId === entityId);
}

/**
 * Filter audit logs by date range
 * @param {AuditLogEntry[]} logs - Audit log array
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {AuditLogEntry[]} Filtered audit logs
 */
export function getAuditLogsByDateRange(logs, startDate, endDate) {
  if (!Array.isArray(logs)) return [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
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
  
  // Order actions
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_PAYMENT_UPDATED: 'ORDER_PAYMENT_UPDATED'
};

/**
 * Audit module constants
 */
export const AUDIT_MODULES = {
  KDS: 'KDS',
  INVENTORY: 'INVENTORY',
  DELIVERY: 'DELIVERY',
  ORDERS: 'ORDERS',
  GENERAL: 'GENERAL'
};
