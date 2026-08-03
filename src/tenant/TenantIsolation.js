// Tenant Isolation
// Enforces tenant isolation for all data types

import { getTenantContext } from './TenantContext.js';
import { IsolationScope } from './TenantTypes.js';

export class TenantIsolation {
  constructor() {
    this.tenantContext = getTenantContext();
    this.isolationScopes = new Map();
    this.initializeIsolationScopes();
  }

  /**
   * Initialize isolation scopes
   */
  initializeIsolationScopes() {
    this.isolationScopes.set(IsolationScope.DATABASE, {
      prefix: 'tenant_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.STORAGE, {
      prefix: 'storage_',
      separator: '/',
      required: true
    });

    this.isolationScopes.set(IsolationScope.MEDIA, {
      prefix: 'media_',
      separator: '/',
      required: true
    });

    this.isolationScopes.set(IsolationScope.BACKUPS, {
      prefix: 'backup_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.AUDIT_LOGS, {
      prefix: 'audit_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.NOTIFICATIONS, {
      prefix: 'notif_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.SETTINGS, {
      prefix: 'settings_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.REPORTS, {
      prefix: 'report_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.ATTACHMENTS, {
      prefix: 'attach_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.API_RESPONSES, {
      prefix: 'api_',
      separator: '_',
      required: false
    });

    this.isolationScopes.set(IsolationScope.SESSIONS, {
      prefix: 'session_',
      separator: '_',
      required: true
    });

    this.isolationScopes.set(IsolationScope.CACHE, {
      prefix: 'cache_',
      separator: '_',
      required: false
    });

    this.isolationScopes.set(IsolationScope.SEARCH_INDEX, {
      prefix: 'search_',
      separator: '_',
      required: false
    });
  }

  /**
   * Get isolated key for data
   * @param {string} scope - Isolation scope
   * @param {string} key - Original key
   * @returns {string} Isolated key
   */
  getIsolatedKey(scope, key) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      throw new Error('No tenant context set');
    }

    const scopeConfig = this.isolationScopes.get(scope);
    
    if (!scopeConfig) {
      throw new Error(`Unknown isolation scope: ${scope}`);
    }

    return `${scopeConfig.prefix}${tenantId}${scopeConfig.separator}${key}`;
  }

  /**
   * Validate data isolation
   * @param {string} scope - Isolation scope
   * @param {string} key - Key to validate
   * @returns {object} Validation result
   */
  validateIsolation(scope, key) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return { valid: false, reason: 'No tenant context set' };
    }

    const scopeConfig = this.isolationScopes.get(scope);
    
    if (!scopeConfig) {
      return { valid: false, reason: `Unknown isolation scope: ${scope}` };
    }

    const expectedPrefix = `${scopeConfig.prefix}${tenantId}${scopeConfig.separator}`;
    
    if (!key.startsWith(expectedPrefix)) {
      return { valid: false, reason: 'Key does not match tenant isolation pattern' };
    }

    return { valid: true };
  }

  /**
   * Check cross-tenant access attempt
   * @param {string} scope - Isolation scope
   * @param {string} key - Key being accessed
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantAccess(scope, key) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return { allowed: false, reason: 'No tenant context set' };
    }

    const scopeConfig = this.isolationScopes.get(scope);
    
    if (!scopeConfig) {
      return { allowed: false, reason: 'Unknown isolation scope' };
    }

    // Extract tenant ID from key
    const keyTenantId = this.extractTenantIdFromKey(scope, key);
    
    if (!keyTenantId) {
      return { allowed: false, reason: 'No tenant ID in key' };
    }

    if (keyTenantId !== tenantId) {
      return {
        allowed: false,
        reason: 'Cross-tenant access attempt',
        requestedTenantId: tenantId,
        keyTenantId
      };
    }

    return { allowed: true };
  }

  /**
   * Extract tenant ID from isolated key
   * @param {string} scope - Isolation scope
   * @param {string} key - Isolated key
   * @returns {string|null} Tenant ID
   */
  extractTenantIdFromKey(scope, key) {
    const scopeConfig = this.isolationScopes.get(scope);
    
    if (!scopeConfig) {
      return null;
    }

    const prefix = scopeConfig.prefix;
    const separator = scopeConfig.separator;

    if (!key.startsWith(prefix)) {
      return null;
    }

    const afterPrefix = key.substring(prefix.length);
    const separatorIndex = afterPrefix.indexOf(separator);

    if (separatorIndex === -1) {
      return null;
    }

    return afterPrefix.substring(0, separatorIndex);
  }

  /**
   * Wrap data with tenant context
   * @param {object} data - Data to wrap
   * @param {string} scope - Isolation scope
   * @returns {object} Wrapped data
   */
  wrapData(data, scope) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return data;
    }

    return {
      ...data,
      _isolation: {
        scope,
        tenantId,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Unwrap data and validate isolation
   * @param {object} data - Data to unwrap
   * @param {string} scope - Isolation scope
   * @returns {object} Unwrapped data
   */
  unwrapData(data, scope) {
    if (!data._isolation) {
      return data;
    }

    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      throw new Error('No tenant context set');
    }

    if (data._isolation.tenantId !== tenantId) {
      throw new Error('Cross-tenant data access detected');
    }

    if (data._isolation.scope !== scope) {
      throw new Error('Isolation scope mismatch');
    }

    const { _isolation, ...unwrapped } = data;
    return unwrapped;
  }

  /**
   * Filter data by tenant
   * @param {Array} data - Data to filter
   * @returns {Array} Filtered data
   */
  filterByTenant(data) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return data;
    }

    return data.filter(item => {
      if (item._isolation) {
        return item._isolation.tenantId === tenantId;
      }
      if (item.tenantId) {
        return item.tenantId === tenantId;
      }
      return false;
    });
  }

  /**
   * Add tenant ID to data
   * @param {object} data - Data to augment
   * @returns {object} Augmented data
   */
  addTenantId(data) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      throw new Error('No tenant context set');
    }

    return {
      ...data,
      tenantId
    };
  }

  /**
   * Validate tenant ID in data
   * @param {object} data - Data to validate
   * @returns {object} Validation result
   */
  validateTenantId(data) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return { valid: false, reason: 'No tenant context set' };
    }

    if (data.tenantId && data.tenantId !== tenantId) {
      return {
        valid: false,
        reason: 'Tenant ID mismatch',
        expected: tenantId,
        actual: data.tenantId
      };
    }

    return { valid: true };
  }

  /**
   * Get isolation statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      scopes: Array.from(this.isolationScopes.keys()),
      hasContext: this.tenantContext.hasContext(),
      currentTenantId: this.tenantContext.getTenantId()
    };
  }

  /**
   * Destroy the tenant isolation
   */
  destroy() {
    this.isolationScopes.clear();
    console.log('[TenantIsolation] Destroyed');
  }
}

// Singleton instance
let tenantIsolationInstance = null;

/**
 * Get the singleton tenant isolation instance
 * @returns {TenantIsolation} Tenant isolation instance
 */
export function getTenantIsolation() {
  if (!tenantIsolationInstance) {
    tenantIsolationInstance = new TenantIsolation();
  }
  return tenantIsolationInstance;
}

export default TenantIsolation;
