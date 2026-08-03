// Tenant Resolver
// Resolves tenant from requests and validates access

import { getTenantRegistry } from './TenantRegistry.js';
import { getSessionManager } from '../security/SessionManager.js';
import { getTenantSecurity } from './TenantSecurity.js';
import { TenantStatus } from './TenantTypes.js';

export class TenantResolver {
  constructor() {
    this.tenantRegistry = getTenantRegistry();
    this.sessionManager = getSessionManager();
    this.tenantSecurity = getTenantSecurity();
    this.resolutionCache = new Map();
    this.cacheTTL = 60000; // 1 minute cache
  }

  /**
   * Resolve tenant from request
   * @param {object} request - Request object
   * @returns {Promise<object>} Resolution result
   */
  async resolveTenant(request) {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache
    if (this.resolutionCache.has(cacheKey)) {
      const cached = this.resolutionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.result;
      }
    }

    // Resolve tenant ID from request
    const tenantId = this.extractTenantId(request);
    
    if (!tenantId) {
      return { success: false, reason: 'No tenant ID in request' };
    }

    // Get tenant
    const tenant = this.tenantRegistry.getTenant(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    // Validate tenant status
    if (!this.validateTenantStatus(tenant)) {
      return { success: false, reason: 'Tenant is not active' };
    }

    // Validate session
    const sessionValidation = await this.validateSession(request, tenantId);
    if (!sessionValidation.valid) {
      return { success: false, reason: sessionValidation.reason };
    }

    // Check cross-tenant access
    const crossTenantCheck = this.checkCrossTenantAccess(request, tenantId);
    if (!crossTenantCheck.allowed) {
      this.tenantSecurity.logCrossTenantAccessBlocked({
        requestedTenantId: tenantId,
        sessionTenantId: crossTenantCheck.sessionTenantId,
        reason: crossTenantCheck.reason
      });
      return { success: false, reason: 'Cross-tenant access blocked' };
    }

    // Cache result
    const result = {
      success: true,
      tenantId,
      tenant,
      workspaceId: tenant.workspaceId,
      region: tenant.region,
      timezone: tenant.timezone,
      currency: tenant.currency
    };

    this.resolutionCache.set(cacheKey, {
      timestamp: Date.now(),
      result
    });

    return result;
  }

  /**
   * Extract tenant ID from request
   * @param {object} request - Request object
   * @returns {string|null} Tenant ID
   */
  extractTenantId(request) {
    // Try various sources for tenant ID
    return request.tenantId || 
           request.headers?.['x-tenant-id'] || 
           request.query?.tenantId || 
           request.body?.tenantId;
  }

  /**
   * Validate tenant status
   * @param {object} tenant - Tenant
   * @returns {boolean} Valid status
   */
  validateTenantStatus(tenant) {
    return tenant.status === TenantStatus.ACTIVE;
  }

  /**
   * Validate session
   * @param {object} request - Request object
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Validation result
   */
  async validateSession(request, tenantId) {
    const sessionId = request.sessionId || request.headers?.['x-session-id'];
    
    if (!sessionId) {
      return { valid: false, reason: 'No session ID' };
    }

    const session = this.sessionManager.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check if session belongs to tenant
    if (session.tenantId && session.tenantId !== tenantId) {
      return { valid: false, reason: 'Session tenant mismatch' };
    }

    // Check session status
    if (session.status !== 'active') {
      return { valid: false, reason: 'Session not active' };
    }

    return { valid: true };
  }

  /**
   * Check cross-tenant access
   * @param {object} request - Request object
   * @param {string} tenantId - Requested tenant ID
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantAccess(request, tenantId) {
    const sessionId = request.sessionId || request.headers?.['x-session-id'];
    
    if (!sessionId) {
      return { allowed: true }; // No session, allow (will be caught by session validation)
    }

    const session = this.sessionManager.getSession(sessionId);
    
    if (!session || !session.tenantId) {
      return { allowed: true }; // No tenant in session, allow (will be caught by session validation)
    }

    if (session.tenantId === tenantId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      sessionTenantId: session.tenantId,
      reason: 'Session belongs to different tenant'
    };
  }

  /**
   * Resolve tenant by workspace ID
   * @param {string} workspaceId - Workspace ID
   * @returns {object} Resolution result
   */
  resolveByWorkspace(workspaceId) {
    const tenant = this.tenantRegistry.getTenantByWorkspace(workspaceId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found for workspace' };
    }

    if (!this.validateTenantStatus(tenant)) {
      return { success: false, reason: 'Tenant is not active' };
    }

    return {
      success: true,
      tenantId: tenant.tenantId,
      tenant,
      workspaceId: tenant.workspaceId,
      region: tenant.region,
      timezone: tenant.timezone,
      currency: tenant.currency
    };
  }

  /**
   * Resolve tenant by owner account
   * @param {string} ownerAccount - Owner account ID
   * @returns {object} Resolution result
   */
  resolveByOwner(ownerAccount) {
    const tenant = this.tenantRegistry.getTenantByOwner(ownerAccount);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found for owner' };
    }

    if (!this.validateTenantStatus(tenant)) {
      return { success: false, reason: 'Tenant is not active' };
    }

    return {
      success: true,
      tenantId: tenant.tenantId,
      tenant,
      workspaceId: tenant.workspaceId,
      region: tenant.region,
      timezone: tenant.timezone,
      currency: tenant.currency
    };
  }

  /**
   * Get cache key for request
   * @param {object} request - Request object
   * @returns {string} Cache key
   */
  getCacheKey(request) {
    const tenantId = this.extractTenantId(request);
    const sessionId = request.sessionId || request.headers?.['x-session-id'];
    return `${tenantId}_${sessionId}`;
  }

  /**
   * Clear resolution cache
   */
  clearCache() {
    this.resolutionCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStatistics() {
    return {
      size: this.resolutionCache.size,
      ttl: this.cacheTTL
    };
  }

  /**
   * Destroy the tenant resolver
   */
  destroy() {
    this.clearCache();
    console.log('[TenantResolver] Destroyed');
  }
}

// Singleton instance
let tenantResolverInstance = null;

/**
 * Get the singleton tenant resolver instance
 * @returns {TenantResolver} Tenant resolver instance
 */
export function getTenantResolver() {
  if (!tenantResolverInstance) {
    tenantResolverInstance = new TenantResolver();
  }
  return tenantResolverInstance;
}

export default TenantResolver;
