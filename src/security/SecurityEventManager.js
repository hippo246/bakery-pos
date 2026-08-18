// Security Event Manager
// Manages security events and event logging
// NOTE: This is a frontend-only implementation for demo/local use
// For production, security events must be logged by the server to be authoritative
// Frontend events can be tampered with and are not suitable for compliance/forensics

import { SecurityEventType, RiskLevel } from './SecurityTypes.js';

export class SecurityEventManager {
  constructor() {
    this.events = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 500;
    this.storageKey = 'cafeos_security_events';
    this.loadState();
  }

  /**
   * Generate a security event
   * @param {string} type - Event type
   * @param {object} details - Event details
   * @returns {object} Event record
   */
  generateEvent(type, details = {}) {
    const eventId = this.generateEventId();
    
    const event = {
      eventId,
      type,
      timestamp: new Date().toISOString(),
      details,
      riskLevel: this.determineRiskLevel(type),
      acknowledged: false
    };

    this.events.set(eventId, event);
    this.eventHistory.push(event);
    this.trimHistory();
    this.saveState();

    console.log(`[SecurityEventManager] ${type}:`, event);
    return event;
  }

  /**
   * Determine risk level for an event type
   * @param {string} type - Event type
   * @returns {string} Risk level
   */
  determineRiskLevel(type) {
    const criticalEvents = [
      SecurityEventType.FAILED_AUTHENTICATION,
      SecurityEventType.PERMISSION_DENIED,
      SecurityEventType.INTEGRITY_FAILED,
      SecurityEventType.SECURITY_ALERT,
      SecurityEventType.DATA_LOSS_PREVENTED
    ];

    const highRiskEvents = [
      SecurityEventType.CREDENTIAL_EXPIRED,
      SecurityEventType.SESSION_EXPIRED,
      SecurityEventType.ENCRYPTION_DISABLED
    ];

    if (criticalEvents.includes(type)) {
      return RiskLevel.CRITICAL;
    }

    if (highRiskEvents.includes(type)) {
      return RiskLevel.HIGH;
    }

    return RiskLevel.LOW;
  }

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {object|null} Event
   */
  getEvent(eventId) {
    return this.events.get(eventId) || null;
  }

  /**
   * Get events by type
   * @param {string} type - Event type
   * @returns {Array} Events
   */
  getEventsByType(type) {
    const events = [];
    for (const [_id, event] of this.events) {
      if (event.type === type) {
        events.push(event);
      }
    }
    return events;
  }

  /**
   * Get events by risk level
   * @param {string} riskLevel - Risk level
   * @returns {Array} Events
   */
  getEventsByRiskLevel(riskLevel) {
    const events = [];
    for (const [_id, event] of this.events) {
      if (event.riskLevel === riskLevel) {
        events.push(event);
      }
    }
    return events;
  }

  /**
   * Get event history
   * @param {object} filters - Optional filters
   * @returns {Array} Event history
   */
  getEventHistory(filters = {}) {
    let history = [...this.eventHistory];

    if (filters.type) {
      history = history.filter(e => e.type === filters.type);
    }

    if (filters.riskLevel) {
      history = history.filter(e => e.riskLevel === filters.riskLevel);
    }

    if (filters.since) {
      history = history.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by timestamp descending
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return history;
  }

  /**
   * Acknowledge an event
   * @param {string} eventId - Event ID
   * @returns {object} Acknowledgment result
   */
  acknowledgeEvent(eventId) {
    const event = this.events.get(eventId);
    
    if (!event) {
      return { success: false, reason: 'Event not found' };
    }

    event.acknowledged = true;
    event.acknowledgedAt = new Date().toISOString();
    this.events.set(eventId, event);
    this.saveState();

    return { success: true, eventId };
  }

  /**
   * Get event statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const total = this.eventHistory.length;
    const acknowledged = this.eventHistory.filter(e => e.acknowledged).length;

    const byType = {};
    this.eventHistory.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });

    const byRiskLevel = {};
    this.eventHistory.forEach(e => {
      byRiskLevel[e.riskLevel] = (byRiskLevel[e.riskLevel] || 0) + 1;
    });

    return {
      total,
      acknowledged,
      byType,
      byRiskLevel
    };
  }

  /**
   * Trim history to max size
   */
  trimHistory() {
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    // Use crypto.randomUUID() for security-sensitive ID generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `event_${crypto.randomUUID()}`;
    }
    // Fallback to crypto.getRandomValues() if randomUUID not available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      return `event_${Date.now()}_${randomPart}`;
    }
    // Last resort fallback (should not happen in modern browsers)
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convenience methods for common events
   */
  logCredentialUpdated(credentialId, operator) {
    return this.generateEvent(SecurityEventType.CREDENTIAL_UPDATED, {
      credentialId,
      operator
    });
  }

  logCredentialRotated(credentialId, operator) {
    return this.generateEvent(SecurityEventType.CREDENTIAL_ROTATED, {
      credentialId,
      operator
    });
  }

  logCredentialExpired(credentialId) {
    return this.generateEvent(SecurityEventType.CREDENTIAL_EXPIRED, {
      credentialId
    });
  }

  logProviderAdded(providerId, operator) {
    return this.generateEvent(SecurityEventType.PROVIDER_ADDED, {
      providerId,
      operator
    });
  }

  logProviderRemoved(providerId, operator) {
    return this.generateEvent(SecurityEventType.PROVIDER_REMOVED, {
      providerId,
      operator
    });
  }

  logProviderSwitched(fromProvider, toProvider, operator) {
    return this.generateEvent(SecurityEventType.PROVIDER_SWITCHED, {
      fromProvider,
      toProvider,
      operator
    });
  }

  logOwnerVerification(operation, operator) {
    return this.generateEvent(SecurityEventType.OWNER_VERIFICATION, {
      operation,
      operator
    });
  }

  logFailedAuthentication(userId, reason) {
    return this.generateEvent(SecurityEventType.FAILED_AUTHENTICATION, {
      userId,
      reason
    });
  }

  logSessionExpired(sessionId) {
    return this.generateEvent(SecurityEventType.SESSION_EXPIRED, {
      sessionId
    });
  }

  logSessionLocked(sessionId) {
    return this.generateEvent(SecurityEventType.SESSION_LOCKED, {
      sessionId
    });
  }

  logRestoreApproved(backupId, operator) {
    return this.generateEvent(SecurityEventType.RESTORE_APPROVED, {
      backupId,
      operator
    });
  }

  logBackupDeleted(backupId, operator) {
    return this.generateEvent(SecurityEventType.BACKUP_DELETED, {
      backupId,
      operator
    });
  }

  logPermissionDenied(permission, userRole, userId) {
    return this.generateEvent(SecurityEventType.PERMISSION_DENIED, {
      permission,
      userRole,
      userId
    });
  }

  logExportCompleted(exportId, operator) {
    return this.generateEvent(SecurityEventType.EXPORT_COMPLETED, {
      exportId,
      operator
    });
  }

  logImportCompleted(importId, operator) {
    return this.generateEvent(SecurityEventType.IMPORT_COMPLETED, {
      importId,
      operator
    });
  }

  logEncryptionEnabled(operator) {
    return this.generateEvent(SecurityEventType.ENCRYPTION_ENABLED, {
      operator
    });
  }

  logEncryptionDisabled(operator) {
    return this.generateEvent(SecurityEventType.ENCRYPTION_DISABLED, {
      operator
    });
  }

  logEncryptionRotated(operator) {
    return this.generateEvent(SecurityEventType.ENCRYPTION_ROTATED, {
      operator
    });
  }

  logIntegrityFailed(dataId, expectedChecksum, actualChecksum) {
    return this.generateEvent(SecurityEventType.INTEGRITY_FAILED, {
      dataId,
      expectedChecksum,
      actualChecksum
    });
  }

  logSecurityAlert(message, details) {
    return this.generateEvent(SecurityEventType.SECURITY_ALERT, {
      message,
      details
    });
  }

  logDataLossPrevented(operation, reason) {
    return this.generateEvent(SecurityEventType.DATA_LOSS_PREVENTED, {
      operation,
      reason
    });
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        events: Array.from(this.events.entries()),
        eventHistory: this.eventHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save security events state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.events = new Map(parsed.events || []);
        this.eventHistory = parsed.eventHistory || [];
      }
    } catch (error) {
      console.error('Failed to load security events state:', error);
      this.events = new Map();
      this.eventHistory = [];
    }
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events.clear();
    this.eventHistory = [];
    this.saveState();
  }

  /**
   * Destroy the security event manager
   */
  destroy() {
    this.clearEvents();
    localStorage.removeItem(this.storageKey);
    console.log('[SecurityEventManager] Destroyed');
  }
}

// Singleton instance
let securityEventManagerInstance = null;

/**
 * Get the singleton security event manager instance
 * @returns {SecurityEventManager} Security event manager instance
 */
export function getSecurityEventManager() {
  if (!securityEventManagerInstance) {
    securityEventManagerInstance = new SecurityEventManager();
  }
  return securityEventManagerInstance;
}

export default SecurityEventManager;
