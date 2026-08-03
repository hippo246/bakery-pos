// Tenant Security
// Prevents cross-tenant security violations

import { getTenantContext } from './TenantContext.js';
import { getTenantIsolation } from './TenantIsolation.js';
import { getStorageIsolation } from './StorageIsolation.js';
import { getSessionIsolation } from './SessionIsolation.js';
import { getPermissionIsolation } from './PermissionIsolation.js';
import { getTenantAuditLogger } from './TenantAuditLogger.js';

export class TenantSecurity {
  constructor() {
    this.tenantContext = getTenantContext();
    this.tenantIsolation = getTenantIsolation();
    this.storageIsolation = getStorageIsolation();
    this.sessionIsolation = getSessionIsolation();
    this.permissionIsolation = getPermissionIsolation();
    this.auditLogger = getTenantAuditLogger();
    this.violations = new Map();
  }

  /**
   * Check cross-tenant query
   * @param {string} requestedTenantId - Requested tenant ID
   * @param {string} sessionId - Session ID
   * @returns {object} Security check result
   */
  checkCrossTenantQuery(requestedTenantId, sessionId) {
    const currentTenantId = this.tenantContext.getTenantId();
    
    if (!currentTenantId) {
      return { allowed: false, reason: 'No tenant context set' };
    }

    if (currentTenantId === requestedTenantId) {
      return { allowed: true };
    }

    // Check session isolation
    const sessionCheck = this.sessionIsolation.checkCrossTenantSessionAccess(sessionId, requestedTenantId);
    if (!sessionCheck.allowed) {
      this.logViolation('cross_tenant_query', {
        requestedTenantId,
        sessionTenantId: sessionCheck.sessionTenantId
      });
      return sessionCheck;
    }

    // Check permission isolation
    const userId = this.getUserIdFromSession(sessionId);
    if (userId) {
      const permissionCheck = this.permissionIsolation.checkCrossTenantPermissionAccess(requestedTenantId, userId);
      if (!permissionCheck.allowed) {
        this.logViolation('cross_tenant_query', {
          requestedTenantId,
          userId,
          reason: permissionCheck.reason
        });
        return permissionCheck;
      }
    }

    return { allowed: false, reason: 'Cross-tenant query not permitted' };
  }

  /**
   * Check cross-tenant storage access
   * @param {string} storageType - Storage type
   * @param {string} path - Storage path
   * @returns {object} Security check result
   */
  checkCrossTenantStorage(storageType, path) {
    const storageCheck = this.storageIsolation.checkCrossTenantAccess(storageType, path);
    
    if (!storageCheck.allowed) {
      this.logViolation('cross_tenant_storage', {
        storageType,
        path,
        requestedWorkspaceId: storageCheck.requestedWorkspaceId,
        pathWorkspaceId: storageCheck.pathWorkspaceId
      });
    }

    return storageCheck;
  }

  /**
   * Check cross-tenant search
   * @param {string} searchScope - Search scope
   * @param {string} searchQuery - Search query
   * @returns {object} Security check result
   */
  checkCrossTenantSearch(searchScope, searchQuery) {
    const currentTenantId = this.tenantContext.getTenantId();
    
    if (!currentTenantId) {
      return { allowed: false, reason: 'No tenant context set' };
    }

    // Check if search query contains tenant ID
    if (searchQuery.includes('tenantId') && !searchQuery.includes(currentTenantId)) {
      this.logViolation('cross_tenant_search', {
        searchScope,
        searchQuery,
        currentTenantId
      });
      return { allowed: false, reason: 'Search query targets different tenant' };
    }

    return { allowed: true };
  }

  /**
   * Check cross-tenant notifications
   * @param {string} notificationId - Notification ID
   * @returns {object} Security check result
   */
  checkCrossTenantNotifications(notificationId) {
    const isolationCheck = this.tenantIsolation.checkCrossTenantAccess('notifications', notificationId);
    
    if (!isolationCheck.allowed) {
      this.logViolation('cross_tenant_notifications', {
        notificationId,
        requestedTenantId: isolationCheck.requestedTenantId,
        keyTenantId: isolationCheck.keyTenantId
      });
    }

    return isolationCheck;
  }

  /**
   * Check cross-tenant exports
   * @param {string} exportId - Export ID
   * @returns {object} Security check result
   */
  checkCrossTenantExports(exportId) {
    const isolationCheck = this.tenantIsolation.checkCrossTenantAccess('api_responses', exportId);
    
    if (!isolationCheck.allowed) {
      this.logViolation('cross_tenant_exports', {
        exportId,
        requestedTenantId: isolationCheck.requestedTenantId,
        keyTenantId: isolationCheck.keyTenantId
      });
    }

    return isolationCheck;
  }

  /**
   * Check cross-tenant imports
   * @param {string} importId - Import ID
   * @returns {object} Security check result
   */
  checkCrossTenantImports(importId) {
    const isolationCheck = this.tenantIsolation.checkCrossTenantAccess('api_responses', importId);
    
    if (!isolationCheck.allowed) {
      this.logViolation('cross_tenant_imports', {
        importId,
        requestedTenantId: isolationCheck.requestedTenantId,
        keyTenantId: isolationCheck.keyTenantId
      });
    }

    return isolationCheck;
  }

  /**
   * Check cross-tenant reports
   * @param {string} reportId - Report ID
   * @returns {object} Security check result
   */
  checkCrossTenantReports(reportId) {
    const isolationCheck = this.tenantIsolation.checkCrossTenantAccess('reports', reportId);
    
    if (!isolationCheck.allowed) {
      this.logViolation('cross_tenant_reports', {
        reportId,
        requestedTenantId: isolationCheck.requestedTenantId,
        keyTenantId: isolationCheck.keyTenantId
      });
    }

    return isolationCheck;
  }

  /**
   * Check cross-tenant sessions
   * @param {string} sessionId - Session ID
   * @param {string} requestedTenantId - Requested tenant ID
   * @returns {object} Security check result
   */
  checkCrossTenantSessions(sessionId, requestedTenantId) {
    const sessionCheck = this.sessionIsolation.checkCrossTenantSessionAccess(sessionId, requestedTenantId);
    
    if (!sessionCheck.allowed) {
      this.logViolation('cross_tenant_sessions', {
        sessionId,
        requestedTenantId,
        sessionTenantId: sessionCheck.sessionTenantId
      });
    }

    return sessionCheck;
  }

  /**
   * Log security violation
   * @param {string} violationType - Violation type
   * @param {object} details - Violation details
   */
  logViolation(violationType, details) {
    const violationId = this.generateViolationId();
    
    this.violations.set(violationId, {
      id: violationId,
      type: violationType,
      details,
      timestamp: new Date().toISOString(),
      tenantId: this.tenantContext.getTenantId()
    });

    this.auditLogger.logCrossTenantAccessBlocked(details);
  }

  /**
   * Get security violations
   * @param {object} filters - Optional filters
   * @returns {Array} Violations
   */
  getViolations(filters = {}) {
    let violations = Array.from(this.violations.values());

    if (filters.type) {
      violations = violations.filter(v => v.type === filters.type);
    }

    if (filters.tenantId) {
      violations = violations.filter(v => v.tenantId === filters.tenantId);
    }

    if (filters.since) {
      violations = violations.filter(v => new Date(v.timestamp) >= new Date(filters.since));
    }

    // Sort by timestamp descending
    violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return violations;
  }

  /**
   * Get violation statistics
   * @returns {object} Statistics
   */
  getViolationStatistics() {
    const violations = Array.from(this.violations.values());
    const total = violations.length;

    const byType = {};
    violations.forEach(v => {
      byType[v.type] = (byType[v.type] || 0) + 1;
    });

    const byTenant = {};
    violations.forEach(v => {
      byTenant[v.tenantId] = (byTenant[v.tenantId] || 0) + 1;
    });

    return {
      total,
      byType,
      byTenant
    };
  }

  /**
   * Clear violations
   */
  clearViolations() {
    this.violations.clear();
  }

  /**
   * Get user ID from session
   * @param {string} sessionId - Session ID
   * @returns {string|null} User ID
   */
  getUserIdFromSession(_sessionId) {
    // Placeholder for user ID extraction
    // In production would get from session manager
    return null;
  }

  /**
   * Generate violation ID
   * @returns {string} Violation ID
   */
  generateViolationId() {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get security statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      hasContext: this.tenantContext.hasContext(),
      currentTenantId: this.tenantContext.getTenantId(),
      violations: this.getViolationStatistics()
    };
  }

  /**
   * Destroy the tenant security
   */
  destroy() {
    this.clearViolations();
    console.log('[TenantSecurity] Destroyed');
  }
}

// Singleton instance
let tenantSecurityInstance = null;

/**
 * Get the singleton tenant security instance
 * @returns {TenantSecurity} Tenant security instance
 */
export function getTenantSecurity() {
  if (!tenantSecurityInstance) {
    tenantSecurityInstance = new TenantSecurity();
  }
  return tenantSecurityInstance;
}

export default TenantSecurity;
