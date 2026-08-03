// Tenant Context
// Manages tenant-aware operations and context

import { getTenantRegistry } from './TenantRegistry.js';
import { getTenantResolver } from './TenantResolver.js';

export class TenantContext {
  constructor() {
    this.tenantRegistry = getTenantRegistry();
    this.tenantResolver = getTenantResolver();
    this.currentContext = null;
    this.contextStack = [];
  }

  /**
   * Set current tenant context
   * @param {string} tenantId - Tenant ID
   * @returns {object} Context set result
   */
  setContext(tenantId) {
    const tenant = this.tenantRegistry.getTenant(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    this.currentContext = {
      tenantId: tenant.tenantId,
      workspaceId: tenant.workspaceId,
      businessName: tenant.businessName,
      businessType: tenant.businessType,
      region: tenant.region,
      timezone: tenant.timezone,
      currency: tenant.currency,
      config: tenant.config,
      metadata: tenant.metadata,
      setAt: new Date().toISOString()
    };

    return { success: true, context: this.currentContext };
  }

  /**
   * Get current tenant context
   * @returns {object|null} Current context
   */
  getContext() {
    return this.currentContext;
  }

  /**
   * Clear current context
   */
  clearContext() {
    this.currentContext = null;
  }

  /**
   * Push context to stack
   * @param {string} tenantId - Tenant ID
   * @returns {object} Context push result
   */
  pushContext(tenantId) {
    const result = this.setContext(tenantId);
    
    if (result.success) {
      this.contextStack.push(this.currentContext);
    }

    return result;
  }

  /**
   * Pop context from stack
   * @returns {object|null} Popped context
   */
  popContext() {
    if (this.contextStack.length === 0) {
      this.clearContext();
      return null;
    }

    this.contextStack.pop();
    this.currentContext = this.contextStack[this.contextStack.length - 1] || null;
    
    return this.currentContext;
  }

  /**
   * Get tenant ID from context
   * @returns {string|null} Tenant ID
   */
  getTenantId() {
    return this.currentContext?.tenantId || null;
  }

  /**
   * Get workspace ID from context
   * @returns {string|null} Workspace ID
   */
  getWorkspaceId() {
    return this.currentContext?.workspaceId || null;
  }

  /**
   * Get region from context
   * @returns {string|null} Region
   */
  getRegion() {
    return this.currentContext?.region || null;
  }

  /**
   * Get timezone from context
   * @returns {string|null} Timezone
   */
  getTimezone() {
    return this.currentContext?.timezone || null;
  }

  /**
   * Get currency from context
   * @returns {string|null} Currency
   */
  getCurrency() {
    return this.currentContext?.currency || null;
  }

  /**
   * Get config from context
   * @returns {object|null} Config
   */
  getConfig() {
    return this.currentContext?.config || null;
  }

  /**
   * Check if context is set
   * @returns {boolean} Context set status
   */
  hasContext() {
    return this.currentContext !== null;
  }

  /**
   * Execute operation in tenant context
   * @param {string} tenantId - Tenant ID
   * @param {function} operation - Operation to execute
   * @returns {Promise<object>} Operation result
   */
  async executeInContext(tenantId, operation) {
    const previousContext = this.currentContext;
    
    try {
      const setResult = this.setContext(tenantId);
      if (!setResult.success) {
        return setResult;
      }

      const result = await operation();
      return { success: true, result };
    } finally {
      this.currentContext = previousContext;
    }
  }

  /**
   * Wrap data with tenant context
   * @param {object} data - Data to wrap
   * @returns {object} Wrapped data
   */
  wrapData(data) {
    if (!this.hasContext()) {
      return data;
    }

    return {
      ...data,
      _tenantContext: {
        tenantId: this.getTenantId(),
        workspaceId: this.getWorkspaceId(),
        region: this.getRegion()
      }
    };
  }

  /**
   * Unwrap data from tenant context
   * @param {object} data - Data to unwrap
   * @returns {object} Unwrapped data
   */
  unwrapData(data) {
    if (!data._tenantContext) {
      return data;
    }

    const { _tenantContext, ...unwrapped } = data;
    return unwrapped;
  }

  /**
   * Validate data against current context
   * @param {object} data - Data to validate
   * @returns {object} Validation result
   */
  validateData(data) {
    if (!this.hasContext()) {
      return { valid: false, reason: 'No context set' };
    }

    if (data._tenantContext) {
      if (data._tenantContext.tenantId !== this.getTenantId()) {
        return { valid: false, reason: 'Tenant ID mismatch' };
      }
    }

    return { valid: true };
  }

  /**
   * Get context stack size
   * @returns {number} Stack size
   */
  getStackSize() {
    return this.contextStack.length;
  }

  /**
   * Destroy the tenant context
   */
  destroy() {
    this.currentContext = null;
    this.contextStack = [];
    console.log('[TenantContext] Destroyed');
  }
}

// Singleton instance
let tenantContextInstance = null;

/**
 * Get the singleton tenant context instance
 * @returns {TenantContext} Tenant context instance
 */
export function getTenantContext() {
  if (!tenantContextInstance) {
    tenantContextInstance = new TenantContext();
  }
  return tenantContextInstance;
}

export default TenantContext;
