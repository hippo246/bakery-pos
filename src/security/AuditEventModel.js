// Canonical Audit Event Model
// Defines the authoritative audit event structure for CafeOS
// NOTE: This is the interface definition. Actual implementation requires server-side infrastructure.

/**
 * @typedef {Object} AuditEvent
 * @property {string} eventId - Unique event identifier (server-generated)
 * @property {string} eventType - Event type (e.g., LOGIN, LOGOUT, PERMISSION_DENIED)
 * @property {string} actorId - ID of the user/system performing the action
 * @property {string} actorType - Type of actor (USER, SYSTEM, SERVICE)
 * @property {string} tenantId - Tenant context (if applicable)
 * @property {string} businessId - Business context (if applicable)
 * @property {string} branchId - Branch context (if applicable)
 * @property {string} timestamp - ISO 8601 timestamp (server-generated)
 * @property {string} resource - Resource being acted upon (e.g., ORDER_123, STAFF_456)
 * @property {string} action - Action performed (e.g., CREATE, UPDATE, DELETE, VIEW)
 * @property {string} outcome - Outcome (SUCCESS, FAILURE, PARTIAL)
 * @property {string} correlationId - Correlation/request ID for tracing
 * @property {object} metadata - Additional event-specific metadata
 * @property {string} ipAddress - IP address of the request (server-captured)
 * @property {string} userAgent - User agent of the request (server-captured)
 * @property {string} sessionId - Session ID (if applicable)
 * @property {string} signature - Cryptographic signature for integrity verification (server-generated)
 */

/**
 * Audit Event Types
 * Categorized by domain for better organization
 */
export const AuditEventType = {
  // Authentication Events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_LOCKED: 'SESSION_LOCKED',
  FAILED_AUTHENTICATION: 'FAILED_AUTHENTICATION',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Authorization Events
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // Staff Management Events
  STAFF_CREATED: 'STAFF_CREATED',
  STAFF_UPDATED: 'STAFF_UPDATED',
  STAFF_DELETED: 'STAFF_DELETED',
  STAFF_STATUS_CHANGED: 'STAFF_STATUS_CHANGED',
  STAFF_ACCESS_GRANTED: 'STAFF_ACCESS_GRANTED',
  STAFF_ACCESS_REVOKED: 'STAFF_ACCESS_REVOKED',

  // Tenant/Branch Events
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  TENANT_DELETED: 'TENANT_DELETED',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_REACTIVATED: 'TENANT_REACTIVATED',
  TENANT_SWITCHED: 'TENANT_SWITCHED',
  BRANCH_CREATED: 'BRANCH_CREATED',
  BRANCH_UPDATED: 'BRANCH_UPDATED',
  BRANCH_DELETED: 'BRANCH_DELETED',
  BRANCH_SWITCHED: 'BRANCH_SWITCHED',

  // Credential Events
  CREDENTIAL_CREATED: 'CREDENTIAL_CREATED',
  CREDENTIAL_UPDATED: 'CREDENTIAL_UPDATED',
  CREDENTIAL_DELETED: 'CREDENTIAL_DELETED',
  CREDENTIAL_ROTATED: 'CREDENTIAL_ROTATED',
  CREDENTIAL_EXPIRED: 'CREDENTIAL_EXPIRED',
  CREDENTIAL_ACCESS: 'CREDENTIAL_ACCESS',

  // Provider Configuration Events
  PROVIDER_ADDED: 'PROVIDER_ADDED',
  PROVIDER_UPDATED: 'PROVIDER_UPDATED',
  PROVIDER_REMOVED: 'PROVIDER_REMOVED',
  PROVIDER_SWITCHED: 'PROVIDER_SWITCHED',

  // Sensitive Settings Events
  SECURITY_SETTINGS_CHANGED: 'SECURITY_SETTINGS_CHANGED',
  SYSTEM_SETTINGS_CHANGED: 'SYSTEM_SETTINGS_CHANGED',
  INTEGRATION_CONFIGURED: 'INTEGRATION_CONFIGURED',
  PAYMENT_CONFIGURED: 'PAYMENT_CONFIGURED',

  // Data Operations Events
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_DELETED: 'BACKUP_DELETED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
  RESTORE_APPROVED: 'RESTORE_APPROVED',
  RESTORE_REJECTED: 'RESTORE_REJECTED',

  // Order/Transaction Events
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_DELETED: 'ORDER_DELETED',
  ORDER_VOIDED: 'ORDER_VOIDED',
  ORDER_REFUNDED: 'ORDER_REFUNDED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

  // Security Events
  SECURITY_ALERT: 'SECURITY_ALERT',
  INTEGRITY_FAILURE: 'INTEGRITY_FAILURE',
  DATA_LOSS_PREVENTED: 'DATA_LOSS_PREVENTED',
  CROSS_TENANT_ACCESS_BLOCKED: 'CROSS_TENANT_ACCESS_BLOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
};

/**
 * Event Outcome Values
 */
export const AuditEventOutcome = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  PARTIAL: 'PARTIAL',
  BLOCKED: 'BLOCKED',
};

/**
 * Actor Types
 */
export const AuditActorType = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  SERVICE: 'SERVICE',
  API: 'API',
};

/**
 * Server-Authoritative Event Types
 * These events MUST be logged by the server to be authoritative
 */
export const SERVER_AUTHORITATIVE_EVENTS = [
  // Authentication
  AuditEventType.LOGIN,
  AuditEventType.LOGOUT,
  AuditEventType.FAILED_AUTHENTICATION,
  AuditEventType.PASSWORD_CHANGED,
  AuditEventType.PASSWORD_RESET,

  // Authorization
  AuditEventType.PERMISSION_GRANTED,
  AuditEventType.PERMISSION_REVOKED,
  AuditEventType.ROLE_ASSIGNED,
  AuditEventType.ROLE_CHANGED,
  AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,

  // Staff Management
  AuditEventType.STAFF_CREATED,
  AuditEventType.STAFF_UPDATED,
  AuditEventType.STAFF_DELETED,
  AuditEventType.STAFF_STATUS_CHANGED,
  AuditEventType.STAFF_ACCESS_GRANTED,
  AuditEventType.STAFF_ACCESS_REVOKED,

  // Tenant/Branch
  AuditEventType.TENANT_CREATED,
  AuditEventType.TENANT_UPDATED,
  AuditEventType.TENANT_DELETED,
  AuditEventType.TENANT_SUSPENDED,
  AuditEventType.TENANT_REACTIVATED,
  AuditEventType.BRANCH_CREATED,
  AuditEventType.BRANCH_UPDATED,
  AuditEventType.BRANCH_DELETED,

  // Credentials
  AuditEventType.CREDENTIAL_CREATED,
  AuditEventType.CREDENTIAL_UPDATED,
  AuditEventType.CREDENTIAL_DELETED,
  AuditEventType.CREDENTIAL_ROTATED,
  AuditEventType.CREDENTIAL_ACCESS,

  // Provider Configuration
  AuditEventType.PROVIDER_ADDED,
  AuditEventType.PROVIDER_UPDATED,
  AuditEventType.PROVIDER_REMOVED,
  AuditEventType.PROVIDER_SWITCHED,

  // Sensitive Settings
  AuditEventType.SECURITY_SETTINGS_CHANGED,
  AuditEventType.SYSTEM_SETTINGS_CHANGED,
  AuditEventType.INTEGRATION_CONFIGURED,
  AuditEventType.PAYMENT_CONFIGURED,

  // Data Operations
  AuditEventType.DATA_EXPORTED,
  AuditEventType.DATA_IMPORTED,
  AuditEventType.BACKUP_RESTORED,
  AuditEventType.RESTORE_APPROVED,
  AuditEventType.RESTORE_REJECTED,

  // Order/Transaction
  AuditEventType.ORDER_VOIDED,
  AuditEventType.ORDER_REFUNDED,
  AuditEventType.PAYMENT_REFUNDED,

  // Security
  AuditEventType.SECURITY_ALERT,
  AuditEventType.INTEGRITY_FAILURE,
  AuditEventType.CROSS_TENANT_ACCESS_BLOCKED,
  AuditEventType.SUSPICIOUS_ACTIVITY,
];

/**
 * Frontend-Only Event Types
 * These events can be logged by the frontend for UX purposes
 * but are NOT authoritative for security/compliance
 */
export const FRONTEND_ONLY_EVENTS = [
  AuditEventType.SESSION_EXPIRED,
  AuditEventType.SESSION_LOCKED,
  AuditEventType.PERMISSION_DENIED,
  AuditEventType.TENANT_SWITCHED,
  AuditEventType.BRANCH_SWITCHED,
  AuditEventType.CREDENTIAL_EXPIRED,
  AuditEventType.BACKUP_CREATED,
  AuditEventType.BACKUP_DELETED,
  AuditEventType.ORDER_CREATED,
  AuditEventType.ORDER_UPDATED,
  AuditEventType.ORDER_DELETED,
  AuditEventType.PAYMENT_PROCESSED,
  AuditEventType.DATA_LOSS_PREVENTED,
];

/**
 * Validate audit event structure
 * @param {object} event - Event to validate
 * @returns {object} Validation result
 */
export function validateAuditEvent(event) {
  const errors = [];

  if (!event.eventId || typeof event.eventId !== 'string') {
    errors.push('eventId is required and must be a string');
  }

  if (!event.eventType || typeof event.eventType !== 'string') {
    errors.push('eventType is required and must be a string');
  }

  if (!Object.values(AuditEventType).includes(event.eventType)) {
    errors.push('eventType must be a valid AuditEventType');
  }

  if (!event.actorId || typeof event.actorId !== 'string') {
    errors.push('actorId is required and must be a string');
  }

  if (!event.actorType || !Object.values(AuditActorType).includes(event.actorType)) {
    errors.push('actorType is required and must be a valid AuditActorType');
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    errors.push('timestamp is required and must be an ISO 8601 string');
  }

  if (!event.outcome || !Object.values(AuditEventOutcome).includes(event.outcome)) {
    errors.push('outcome is required and must be a valid AuditEventOutcome');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if event type is server-authoritative
 * @param {string} eventType - Event type to check
 * @returns {boolean} Whether the event type is server-authoritative
 */
export function isServerAuthoritative(eventType) {
  return SERVER_AUTHORITATIVE_EVENTS.includes(eventType);
}

/**
 * Check if event type is frontend-only
 * @param {string} eventType - Event type to check
 * @returns {boolean} Whether the event type is frontend-only
 */
export function isFrontendOnly(eventType) {
  return FRONTEND_ONLY_EVENTS.includes(eventType);
}

/**
 * Create a frontend audit event (non-authoritative)
 * @param {string} eventType - Event type
 * @param {object} details - Event details
 * @returns {object} Frontend audit event
 */
export function createFrontendAuditEvent(eventType, details = {}) {
  const session = JSON.parse(localStorage.getItem('cafeos_auth_session') || 'null');
  
  return {
    eventId: `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    actorId: session?.userId || 'unknown',
    actorType: AuditActorType.USER,
    tenantId: details.tenantId || null,
    businessId: details.businessId || null,
    branchId: session?.branchId || details.branchId || null,
    timestamp: new Date().toISOString(),
    resource: details.resource || null,
    action: details.action || null,
    outcome: details.outcome || AuditEventOutcome.SUCCESS,
    correlationId: details.correlationId || null,
    metadata: details.metadata || {},
    ipAddress: null, // Frontend cannot reliably capture
    userAgent: navigator?.userAgent || null,
    sessionId: session?.userId || null,
    signature: null, // Frontend cannot sign
    _frontend: true, // Marker for non-authoritative events
  };
}

/**
 * Audit Event Interface
 * This is the interface that the server-side audit service must implement
 */
export class AuditEventInterface {
  /**
   * Log an audit event (server-authoritative)
   * @param {AuditEvent} event - Event to log
   * @returns {Promise<object>} Logging result
   */
  async logEvent(event) {
    throw new Error('AuditEventInterface.logEvent must be implemented by server-side service');
  }

  /**
   * Query audit events
   * @param {object} filters - Query filters
   * @returns {Promise<Array>} Matching events
   */
  async queryEvents(filters) {
    throw new Error('AuditEventInterface.queryEvents must be implemented by server-side service');
  }

  /**
   * Verify event integrity
   * @param {string} eventId - Event ID to verify
   * @returns {Promise<object>} Verification result
   */
  async verifyEvent(eventId) {
    throw new Error('AuditEventInterface.verifyEvent must be implemented by server-side service');
  }

  /**
   * Get audit statistics
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Statistics
   */
  async getStatistics(filters) {
    throw new Error('AuditEventInterface.getStatistics must be implemented by server-side service');
  }
}

export default {
  AuditEventType,
  AuditEventOutcome,
  AuditActorType,
  SERVER_AUTHORITATIVE_EVENTS,
  FRONTEND_ONLY_EVENTS,
  validateAuditEvent,
  isServerAuthoritative,
  isFrontendOnly,
  createFrontendAuditEvent,
  AuditEventInterface,
};
