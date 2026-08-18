// Canonical Security Event Model
// Defines the authoritative security event structure for CafeOS
// NOTE: This is the interface definition. Actual implementation requires server-side infrastructure.

/**
 * @typedef {Object} SecurityEvent
 * @property {string} eventId - Unique event identifier (server-generated)
 * @property {string} eventType - Event type (e.g., CREDENTIAL_UPDATED, FAILED_AUTHENTICATION)
 * @property {string} severity - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
 * @property {string} actorId - ID of the user/system performing the action
 * @property {string} actorType - Type of actor (USER, SYSTEM, SERVICE)
 * @property {string} tenantId - Tenant context (if applicable)
 * @property {string} businessId - Business context (if applicable)
 * @property {string} branchId - Branch context (if applicable)
 * @property {string} timestamp - ISO 8601 timestamp (server-generated)
 * @property {string} resource - Resource being acted upon (e.g., CREDENTIAL_123, SESSION_456)
 * @property {string} action - Action performed (e.g., UPDATE, DELETE, ACCESS)
 * @property {string} outcome - Outcome (SUCCESS, FAILURE, BLOCKED)
 * @property {string} correlationId - Correlation/request ID for tracing
 * @property {object} details - Event-specific details
 * @property {string} ipAddress - IP address of the request (server-captured)
 * @property {string} userAgent - User agent of the request (server-captured)
 * @property {string} sessionId - Session ID (if applicable)
 * @property {boolean} acknowledged - Whether the event has been acknowledged
 * @property {string} acknowledgedAt - Timestamp when acknowledged (if applicable)
 * @property {string} acknowledgedBy - ID of user who acknowledged (if applicable)
 * @property {boolean} resolved - Whether the event has been resolved
 * @property {string} resolvedAt - Timestamp when resolved (if applicable)
 * @property {string} resolvedBy - ID of user who resolved (if applicable)
 * @property {string} signature - Cryptographic signature for integrity verification (server-generated)
 */

/**
 * Security Event Types
 * Categorized by domain for better organization
 */
export const SecurityEventType = {
  // Credential Events
  CREDENTIAL_UPDATED: 'CREDENTIAL_UPDATED',
  CREDENTIAL_ROTATED: 'CREDENTIAL_ROTATED',
  CREDENTIAL_EXPIRED: 'CREDENTIAL_EXPIRED',
  CREDENTIAL_ACCESS: 'CREDENTIAL_ACCESS',
  CREDENTIAL_LEAK_DETECTED: 'CREDENTIAL_LEAK_DETECTED',
  CREDENTIAL_COMPROMISED: 'CREDENTIAL_COMPROMISED',

  // Provider Events
  PROVIDER_ADDED: 'PROVIDER_ADDED',
  PROVIDER_REMOVED: 'PROVIDER_REMOVED',
  PROVIDER_SWITCHED: 'PROVIDER_SWITCHED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_UNREACHABLE: 'PROVIDER_UNREACHABLE',

  // Authentication Events
  FAILED_AUTHENTICATION: 'FAILED_AUTHENTICATION',
  MULTIPLE_FAILED_ATTEMPTS: 'MULTIPLE_FAILED_ATTEMPTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_LOGIN: 'SUSPICIOUS_LOGIN',
  BRUTE_FORCE_DETECTED: 'BRUTE_FORCE_DETECTED',

  // Session Events
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_LOCKED: 'SESSION_LOCKED',
  SESSION_TERMINATED: 'SESSION_TERMINATED',
  SESSION_HIJACK_ATTEMPT: 'SESSION_HIJACK_ATTEMPT',
  CONCURRENT_SESSIONS: 'CONCURRENT_SESSIONS',

  // Authorization Events
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ESCALATION_ATTEMPT: 'ESCALATION_ATTEMPT',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',

  // Staff Events
  STAFF_ACCESS_GRANTED: 'STAFF_ACCESS_GRANTED',
  STAFF_ACCESS_REVOKED: 'STAFF_ACCESS_REVOKED',
  STAFF_STATUS_CHANGED: 'STAFF_STATUS_CHANGED',
  STAFF_COMPROMISED: 'STAFF_COMPROMISED',

  // Owner Verification Events
  OWNER_VERIFICATION: 'OWNER_VERIFICATION',
  OWNER_VERIFICATION_FAILED: 'OWNER_VERIFICATION_FAILED',

  // Data Events
  RESTORE_APPROVED: 'RESTORE_APPROVED',
  RESTORE_REJECTED: 'RESTORE_REJECTED',
  BACKUP_DELETED: 'BACKUP_DELETED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  INTEGRITY_FAILED: 'INTEGRITY_FAILED',
  DATA_LOSS_PREVENTED: 'DATA_LOSS_PREVENTED',
  DATA_CORRUPTION_DETECTED: 'DATA_CORRUPTION_DETECTED',

  // Encryption Events
  ENCRYPTION_ENABLED: 'ENCRYPTION_ENABLED',
  ENCRYPTION_DISABLED: 'ENCRYPTION_DISABLED',
  ENCRYPTION_ROTATED: 'ENCRYPTION_ROTATED',
  ENCRYPTION_FAILURE: 'ENCRYPTION_FAILURE',
  KEY_COMPROMISED: 'KEY_COMPROMISED',

  // Tenant Security Events
  CROSS_TENANT_ACCESS_BLOCKED: 'CROSS_TENANT_ACCESS_BLOCKED',
  CROSS_TENANT_ACCESS_ATTEMPT: 'CROSS_TENANT_ACCESS_ATTEMPT',
  TENANT_ISOLATION_BREACH: 'TENANT_ISOLATION_BREACH',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_REACTIVATED: 'TENANT_REACTIVATED',

  // General Security Events
  SECURITY_ALERT: 'SECURITY_ALERT',
  SECURITY_BREACH: 'SECURITY_BREACH',
  MALWARE_DETECTED: 'MALWARE_DETECTED',
  INTRUSION_DETECTED: 'INTRUSION_DETECTED',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  VULNERABILITY_DETECTED: 'VULNERABILITY_DETECTED',
  CONFIGURATION_DRIFT: 'CONFIGURATION_DRIFT',
};

/**
 * Security Severity Levels
 */
export const SecuritySeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Event Outcome Values
 */
export const SecurityEventOutcome = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  BLOCKED: 'BLOCKED',
  PREVENTED: 'PREVENTED',
  DETECTED: 'DETECTED',
};

/**
 * Actor Types
 */
export const SecurityActorType = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  SERVICE: 'SERVICE',
  ATTACKER: 'ATTACKER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Server-Authoritative Security Event Types
 * These events MUST be logged by the server to be authoritative
 */
export const SERVER_AUTHORITATIVE_SECURITY_EVENTS = [
  // Credential Events
  SecurityEventType.CREDENTIAL_UPDATED,
  SecurityEventType.CREDENTIAL_ROTATED,
  SecurityEventType.CREDENTIAL_ACCESS,
  SecurityEventType.CREDENTIAL_LEAK_DETECTED,
  SecurityEventType.CREDENTIAL_COMPROMISED,

  // Provider Events
  SecurityEventType.PROVIDER_ADDED,
  SecurityEventType.PROVIDER_REMOVED,
  SecurityEventType.PROVIDER_SWITCHED,

  // Authentication Events
  SecurityEventType.FAILED_AUTHENTICATION,
  SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
  SecurityEventType.ACCOUNT_LOCKED,
  SecurityEventType.ACCOUNT_UNLOCKED,
  SecurityEventType.SUSPICIOUS_LOGIN,
  SecurityEventType.BRUTE_FORCE_DETECTED,

  // Session Events
  SecurityEventType.SESSION_TERMINATED,
  SecurityEventType.SESSION_HIJACK_ATTEMPT,
  SecurityEventType.CONCURRENT_SESSIONS,

  // Authorization Events
  SecurityEventType.PERMISSION_DENIED,
  SecurityEventType.ESCALATION_ATTEMPT,
  SecurityEventType.PRIVILEGE_ESCALATION,
  SecurityEventType.UNAUTHORIZED_ACCESS,
  SecurityEventType.ROLE_CHANGED,
  SecurityEventType.PERMISSION_CHANGED,

  // Staff Events
  SecurityEventType.STAFF_ACCESS_GRANTED,
  SecurityEventType.STAFF_ACCESS_REVOKED,
  SecurityEventType.STAFF_STATUS_CHANGED,
  SecurityEventType.STAFF_COMPROMISED,

  // Owner Verification Events
  SecurityEventType.OWNER_VERIFICATION,
  SecurityEventType.OWNER_VERIFICATION_FAILED,

  // Data Events
  SecurityEventType.RESTORE_APPROVED,
  SecurityEventType.RESTORE_REJECTED,
  SecurityEventType.BACKUP_DELETED,
  SecurityEventType.DATA_EXPORTED,
  SecurityEventType.DATA_IMPORTED,
  SecurityEventType.INTEGRITY_FAILED,
  SecurityEventType.DATA_LOSS_PREVENTED,
  SecurityEventType.DATA_CORRUPTION_DETECTED,

  // Encryption Events
  SecurityEventType.ENCRYPTION_ENABLED,
  SecurityEventType.ENCRYPTION_DISABLED,
  SecurityEventType.ENCRYPTION_ROTATED,
  SecurityEventType.ENCRYPTION_FAILURE,
  SecurityEventType.KEY_COMPROMISED,

  // Tenant Security Events
  SecurityEventType.CROSS_TENANT_ACCESS_BLOCKED,
  SecurityEventType.CROSS_TENANT_ACCESS_ATTEMPT,
  SecurityEventType.TENANT_ISOLATION_BREACH,
  SecurityEventType.TENANT_SUSPENDED,
  SecurityEventType.TENANT_REACTIVATED,

  // General Security Events
  SecurityEventType.SECURITY_ALERT,
  SecurityEventType.SECURITY_BREACH,
  SecurityEventType.MALWARE_DETECTED,
  SecurityEventType.INTRUSION_DETECTED,
  SecurityEventType.ANOMALY_DETECTED,
  SecurityEventType.VULNERABILITY_DETECTED,
  SecurityEventType.CONFIGURATION_DRIFT,
];

/**
 * Frontend-Only Security Event Types
 * These events can be logged by the frontend for UX purposes
 * but are NOT authoritative for security/compliance
 */
export const FRONTEND_ONLY_SECURITY_EVENTS = [
  SecurityEventType.CREDENTIAL_EXPIRED,
  SecurityEventType.PROVIDER_ERROR,
  SecurityEventType.PROVIDER_UNREACHABLE,
  SecurityEventType.SESSION_EXPIRED,
  SecurityEventType.SESSION_LOCKED,
];

/**
 * Determine risk level for an event type
 * @param {string} eventType - Event type
 * @returns {string} Risk level
 */
export function determineRiskLevel(eventType) {
  const criticalEvents = [
    SecurityEventType.FAILED_AUTHENTICATION,
    SecurityEventType.PERMISSION_DENIED,
    SecurityEventType.INTEGRITY_FAILED,
    SecurityEventType.SECURITY_ALERT,
    SecurityEventType.DATA_LOSS_PREVENTED,
    SecurityEventType.CREDENTIAL_COMPROMISED,
    SecurityEventType.SESSION_HIJACK_ATTEMPT,
    SecurityEventType.CROSS_TENANT_ACCESS_ATTEMPT,
    SecurityEventType.TENANT_ISOLATION_BREACH,
    SecurityEventType.SECURITY_BREACH,
    SecurityEventType.MALWARE_DETECTED,
    SecurityEventType.INTRUSION_DETECTED,
    SecurityEventType.KEY_COMPROMISED,
  ];

  const highRiskEvents = [
    SecurityEventType.CREDENTIAL_EXPIRED,
    SecurityEventType.SESSION_EXPIRED,
    SecurityEventType.ENCRYPTION_DISABLED,
    SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
    SecurityEventType.ACCOUNT_LOCKED,
    SecurityEventType.SUSPICIOUS_LOGIN,
    SecurityEventType.BRUTE_FORCE_DETECTED,
    SecurityEventType.ESCALATION_ATTEMPT,
    SecurityEventType.PRIVILEGE_ESCALATION,
    SecurityEventType.UNAUTHORIZED_ACCESS,
    SecurityEventType.STAFF_COMPROMISED,
    SecurityEventType.OWNER_VERIFICATION_FAILED,
    SecurityEventType.DATA_CORRUPTION_DETECTED,
    SecurityEventType.ENCRYPTION_FAILURE,
    SecurityEventType.VULNERABILITY_DETECTED,
  ];

  if (criticalEvents.includes(eventType)) {
    return SecuritySeverity.CRITICAL;
  }

  if (highRiskEvents.includes(eventType)) {
    return SecuritySeverity.HIGH;
  }

  return SecuritySeverity.LOW;
}

/**
 * Validate security event structure
 * @param {object} event - Event to validate
 * @returns {object} Validation result
 */
export function validateSecurityEvent(event) {
  const errors = [];

  if (!event.eventId || typeof event.eventId !== 'string') {
    errors.push('eventId is required and must be a string');
  }

  if (!event.eventType || typeof event.eventType !== 'string') {
    errors.push('eventType is required and must be a string');
  }

  if (!Object.values(SecurityEventType).includes(event.eventType)) {
    errors.push('eventType must be a valid SecurityEventType');
  }

  if (!event.severity || !Object.values(SecuritySeverity).includes(event.severity)) {
    errors.push('severity is required and must be a valid SecuritySeverity');
  }

  if (!event.actorId || typeof event.actorId !== 'string') {
    errors.push('actorId is required and must be a string');
  }

  if (!event.actorType || !Object.values(SecurityActorType).includes(event.actorType)) {
    errors.push('actorType is required and must be a valid SecurityActorType');
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    errors.push('timestamp is required and must be an ISO 8601 string');
  }

  if (!event.outcome || !Object.values(SecurityEventOutcome).includes(event.outcome)) {
    errors.push('outcome is required and must be a valid SecurityEventOutcome');
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
  return SERVER_AUTHORITATIVE_SECURITY_EVENTS.includes(eventType);
}

/**
 * Check if event type is frontend-only
 * @param {string} eventType - Event type to check
 * @returns {boolean} Whether the event type is frontend-only
 */
export function isFrontendOnly(eventType) {
  return FRONTEND_ONLY_SECURITY_EVENTS.includes(eventType);
}

/**
 * Create a frontend security event (non-authoritative)
 * @param {string} eventType - Event type
 * @param {object} details - Event details
 * @returns {object} Frontend security event
 */
export function createFrontendSecurityEvent(eventType, details = {}) {
  const session = JSON.parse(localStorage.getItem('cafeos_auth_session') || 'null');
  
  return {
    eventId: `security_frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    severity: determineRiskLevel(eventType),
    actorId: session?.userId || 'unknown',
    actorType: SecurityActorType.USER,
    tenantId: details.tenantId || null,
    businessId: details.businessId || null,
    branchId: session?.branchId || details.branchId || null,
    timestamp: new Date().toISOString(),
    resource: details.resource || null,
    action: details.action || null,
    outcome: details.outcome || SecurityEventOutcome.DETECTED,
    correlationId: details.correlationId || null,
    details: details.details || {},
    ipAddress: null, // Frontend cannot reliably capture
    userAgent: navigator?.userAgent || null,
    sessionId: session?.userId || null,
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolved: false,
    resolvedAt: null,
    resolvedBy: null,
    signature: null, // Frontend cannot sign
    _frontend: true, // Marker for non-authoritative events
  };
}

/**
 * Security Event Interface
 * This is the interface that the server-side security event service must implement
 */
export class SecurityEventInterface {
  /**
   * Log a security event (server-authoritative)
   * @param {SecurityEvent} event - Event to log
   * @returns {Promise<object>} Logging result
   */
  async logEvent(event) {
    throw new Error('SecurityEventInterface.logEvent must be implemented by server-side service');
  }

  /**
   * Query security events
   * @param {object} filters - Query filters
   * @returns {Promise<Array>} Matching events
   */
  async queryEvents(filters) {
    throw new Error('SecurityEventInterface.queryEvents must be implemented by server-side service');
  }

  /**
   * Acknowledge a security event
   * @param {string} eventId - Event ID to acknowledge
   * @param {string} acknowledgedBy - User ID acknowledging
   * @returns {Promise<object>} Acknowledgment result
   */
  async acknowledgeEvent(eventId, acknowledgedBy) {
    throw new Error('SecurityEventInterface.acknowledgeEvent must be implemented by server-side service');
  }

  /**
   * Resolve a security event
   * @param {string} eventId - Event ID to resolve
   * @param {string} resolvedBy - User ID resolving
   * @returns {Promise<object>} Resolution result
   */
  async resolveEvent(eventId, resolvedBy) {
    throw new Error('SecurityEventInterface.resolveEvent must be implemented by server-side service');
  }

  /**
   * Verify event integrity
   * @param {string} eventId - Event ID to verify
   * @returns {Promise<object>} Verification result
   */
  async verifyEvent(eventId) {
    throw new Error('SecurityEventInterface.verifyEvent must be implemented by server-side service');
  }

  /**
   * Get security statistics
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Statistics
   */
  async getStatistics(filters) {
    throw new Error('SecurityEventInterface.getStatistics must be implemented by server-side service');
  }
}

export default {
  SecurityEventType,
  SecuritySeverity,
  SecurityEventOutcome,
  SecurityActorType,
  SERVER_AUTHORITATIVE_SECURITY_EVENTS,
  FRONTEND_ONLY_SECURITY_EVENTS,
  determineRiskLevel,
  validateSecurityEvent,
  isServerAuthoritative,
  isFrontendOnly,
  createFrontendSecurityEvent,
  SecurityEventInterface,
};
