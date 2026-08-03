// Tenant Audit Logger
// Audit logging for tenant operations

import { getSecurityEventManager } from '../security/SecurityEventManager.js';
import { _TenantEventType } from './TenantTypes.js';

export class TenantAuditLogger {
  constructor() {
    this.securityEventManager = getSecurityEventManager();
  }

  /**
   * Log tenant created
   * @param {object} details - Tenant details
   */
  logTenantCreated(details) {
    this.securityEventManager.logSecurityAlert('Tenant Created', {
      tenantId: details.tenantId,
      businessName: details.businessName,
      businessType: details.businessType
    });
  }

  /**
   * Log tenant updated
   * @param {object} details - Update details
   */
  logTenantUpdated(details) {
    this.securityEventManager.logSecurityAlert('Tenant Updated', {
      tenantId: details.tenantId,
      updates: details.updates
    });
  }

  /**
   * Log tenant suspended
   * @param {object} details - Suspension details
   */
  logTenantSuspended(details) {
    this.securityEventManager.logSecurityAlert('Tenant Suspended', {
      tenantId: details.tenantId,
      reason: details.reason
    });
  }

  /**
   * Log tenant reactivated
   * @param {object} details - Reactivation details
   */
  logTenantReactivated(details) {
    this.securityEventManager.logSecurityAlert('Tenant Reactivated', {
      tenantId: details.tenantId
    });
  }

  /**
   * Log tenant archived
   * @param {object} details - Archive details
   */
  logTenantArchived(details) {
    this.securityEventManager.logSecurityAlert('Tenant Archived', {
      tenantId: details.tenantId
    });
  }

  /**
   * Log tenant deleted
   * @param {object} details - Deletion details
   */
  logTenantDeleted(details) {
    this.securityEventManager.logSecurityAlert('Tenant Deleted', {
      tenantId: details.tenantId
    });
  }

  /**
   * Log ownership changed
   * @param {object} details - Ownership change details
   */
  logOwnershipChanged(details) {
    this.securityEventManager.logSecurityAlert('Ownership Changed', {
      tenantId: details.tenantId,
      oldOwner: details.oldOwner,
      newOwner: details.newOwner
    });
  }

  /**
   * Log provisioning completed
   * @param {object} details - Provisioning details
   */
  logProvisioningCompleted(details) {
    this.securityEventManager.logSecurityAlert('Provisioning Completed', {
      tenantId: details.tenantId,
      steps: details.steps,
      results: details.results
    });
  }

  /**
   * Log workspace created
   * @param {object} details - Workspace details
   */
  logWorkspaceCreated(details) {
    this.securityEventManager.logSecurityAlert('Workspace Created', {
      tenantId: details.tenantId,
      workspaceId: details.workspaceId,
      databaseReference: details.databaseReference,
      storageReference: details.storageReference
    });
  }

  /**
   * Log database connected
   * @param {object} details - Database details
   */
  logDatabaseConnected(details) {
    this.securityEventManager.logSecurityAlert('Database Connected', {
      tenantId: details.tenantId,
      databaseReference: details.databaseReference
    });
  }

  /**
   * Log storage connected
   * @param {object} details - Storage details
   */
  logStorageConnected(details) {
    this.securityEventManager.logSecurityAlert('Storage Connected', {
      tenantId: details.tenantId,
      storageReference: details.storageReference
    });
  }

  /**
   * Log clone created
   * @param {object} details - Clone details
   */
  logCloneCreated(details) {
    this.securityEventManager.logSecurityAlert('Clone Created', {
      sourceTenantId: details.sourceTenantId,
      newTenantId: details.newTenantId
    });
  }

  /**
   * Log health check failed
   * @param {object} details - Health check details
   */
  logHealthCheckFailed(details) {
    this.securityEventManager.logSecurityAlert('Health Check Failed', {
      tenantId: details.tenantId,
      checkType: details.checkType,
      reason: details.reason
    });
  }

  /**
   * Log cross-tenant access blocked
   * @param {object} details - Cross-tenant access details
   */
  logCrossTenantAccessBlocked(details) {
    this.securityEventManager.logSecurityAlert('Cross-Tenant Access Blocked', {
      requestedTenantId: details.requestedTenantId,
      sessionTenantId: details.sessionTenantId,
      reason: details.reason
    });
  }

  /**
   * Get tenant audit log
   * @param {object} filters - Optional filters
   * @returns {Array} Audit log
   */
  getAuditLog(filters = {}) {
    const allEvents = this.securityEventManager.getEventHistory({ limit: 500 });
    
    // Filter for tenant-related events
    const tenantEvents = allEvents.filter(event => {
      const message = event.details?.message || '';
      return message.includes('Tenant') || message.includes('Workspace') || 
             message.includes('Database') || message.includes('Storage') ||
             message.includes('Ownership') || message.includes('Provisioning') ||
             message.includes('Clone') || message.includes('Health') ||
             message.includes('Cross-Tenant');
    });

    if (filters.tenantId) {
      return tenantEvents.filter(e => e.details?.tenantId === filters.tenantId);
    }

    if (filters.since) {
      return tenantEvents.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      return tenantEvents.slice(-filters.limit);
    }

    return tenantEvents;
  }

  /**
   * Get audit statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const auditLog = this.getAuditLog();
    const total = auditLog.length;

    const byType = {};
    auditLog.forEach(event => {
      const message = event.details?.message || 'Unknown';
      byType[message] = (byType[message] || 0) + 1;
    });

    const byTenant = {};
    auditLog.forEach(event => {
      const tenantId = event.details?.tenantId || 'Unknown';
      byTenant[tenantId] = (byTenant[tenantId] || 0) + 1;
    });

    return {
      total,
      byType,
      byTenant
    };
  }
}

// Singleton instance
let tenantAuditLoggerInstance = null;

/**
 * Get the singleton tenant audit logger instance
 * @returns {TenantAuditLogger} Tenant audit logger instance
 */
export function getTenantAuditLogger() {
  if (!tenantAuditLoggerInstance) {
    tenantAuditLoggerInstance = new TenantAuditLogger();
  }
  return tenantAuditLoggerInstance;
}

export default TenantAuditLogger;
