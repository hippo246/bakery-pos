// Session Isolation
// Manages tenant-aware sessions

import { getTenantContext } from './TenantContext.js';
import { getSessionManager } from '../security/SessionManager.js';

export class SessionIsolation {
  constructor() {
    this.tenantContext = getTenantContext();
    this.sessionManager = getSessionManager();
  }

  /**
   * Create tenant-aware session
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {string} tenantId - Tenant ID
   * @param {object} metadata - Additional metadata
   * @returns {object} Session creation result
   */
  createSession(userId, userRole, tenantId, metadata = {}) {
    const sessionData = {
      userId,
      userRole,
      tenantId,
      workspaceId: this.getWorkspaceIdForTenant(tenantId),
      branch: metadata.branch || 'main',
      deviceInfo: metadata.deviceInfo || {},
      metadata: {
        ...metadata,
        tenantAware: true
      }
    };

    const result = this.sessionManager.createSession(sessionData);
    
    return result;
  }

  /**
   * Validate session tenant
   * @param {string} sessionId - Session ID
   * @param {string} tenantId - Expected tenant ID
   * @returns {object} Validation result
   */
  validateSessionTenant(sessionId, tenantId) {
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (!session.tenantId) {
      return { valid: false, reason: 'Session has no tenant ID' };
    }

    if (session.tenantId !== tenantId) {
      return {
        valid: false,
        reason: 'Session tenant mismatch',
        sessionTenantId: session.tenantId,
        requestedTenantId: tenantId
      };
    }

    return { valid: true };
  }

  /**
   * Get tenant ID from session
   * @param {string} sessionId - Session ID
   * @returns {string|null} Tenant ID
   */
  getTenantIdFromSession(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    return session?.tenantId || null;
  }

  /**
   * Get workspace ID from session
   * @param {string} sessionId - Session ID
   * @returns {string|null} Workspace ID
   */
  getWorkspaceIdFromSession(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    return session?.workspaceId || null;
  }

  /**
   * Terminate all sessions for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Termination result
   */
  terminateTenantSessions(tenantId) {
    const allSessions = this.sessionManager.getAllSessions();
    let terminated = 0;

    allSessions.forEach(session => {
      if (session.tenantId === tenantId) {
        this.sessionManager.terminateSession(session.sessionId);
        terminated++;
      }
    });

    return { success: true, terminated };
  }

  /**
   * Terminate user sessions for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @returns {object} Termination result
   */
  terminateUserTenantSessions(tenantId, userId) {
    const allSessions = this.sessionManager.getAllSessions();
    let terminated = 0;

    allSessions.forEach(session => {
      if (session.tenantId === tenantId && session.userId === userId) {
        this.sessionManager.terminateSession(session.sessionId);
        terminated++;
      }
    });

    return { success: true, terminated };
  }

  /**
   * Get active sessions for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Active sessions
   */
  getTenantSessions(tenantId) {
    const allSessions = this.sessionManager.getAllSessions();
    return allSessions.filter(session => 
      session.tenantId === tenantId && session.status === 'active'
    );
  }

  /**
   * Get session statistics for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Session statistics
   */
  getTenantSessionStatistics(tenantId) {
    const allSessions = this.sessionManager.getAllSessions();
    const tenantSessions = allSessions.filter(session => session.tenantId === tenantId);

    const active = tenantSessions.filter(s => s.status === 'active').length;
    const expired = tenantSessions.filter(s => s.status === 'expired').length;
    const terminated = tenantSessions.filter(s => s.status === 'terminated').length;

    return {
      tenantId,
      total: tenantSessions.length,
      active,
      expired,
      terminated
    };
  }

  /**
   * Check cross-tenant session access
   * @param {string} sessionId - Session ID
   * @param {string} requestedTenantId - Requested tenant ID
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantSessionAccess(sessionId, requestedTenantId) {
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session) {
      return { allowed: true, reason: 'No session' };
    }

    if (!session.tenantId) {
      return { allowed: true, reason: 'Session has no tenant ID' };
    }

    if (session.tenantId === requestedTenantId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Session belongs to different tenant',
      sessionTenantId: session.tenantId,
      requestedTenantId
    };
  }

  /**
   * Get workspace ID for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {string|null} Workspace ID
   */
  getWorkspaceIdForTenant(tenantId) {
    // Placeholder for workspace ID lookup
    // In production would get from tenant registry
    return `workspace_${tenantId}`;
  }

  /**
   * Get session statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    
    return {
      hasContext: this.tenantContext.hasContext(),
      tenantId,
      tenantSessions: tenantId ? this.getTenantSessionStatistics(tenantId) : null
    };
  }

  /**
   * Destroy the session isolation
   */
  destroy() {
    console.log('[SessionIsolation] Destroyed');
  }
}

// Singleton instance
let sessionIsolationInstance = null;

/**
 * Get the singleton session isolation instance
 * @returns {SessionIsolation} Session isolation instance
 */
export function getSessionIsolation() {
  if (!sessionIsolationInstance) {
    sessionIsolationInstance = new SessionIsolation();
  }
  return sessionIsolationInstance;
}

export default SessionIsolation;
