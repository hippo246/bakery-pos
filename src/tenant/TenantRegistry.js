// Tenant Registry
// Manages tenant lifecycle and operations

import { TenantModel } from './TenantModel.js';
import { SubscriptionStatus } from './TenantTypes.js';
import { getTenantAuditLogger } from './TenantAuditLogger.js';

export class TenantRegistry {
  constructor() {
    this.tenants = new Map();
    this.storageKey = 'cafeos_tenant_registry';
    this.loadState();
  }

  /**
   * Create a new tenant
   * @param {object} tenantData - Tenant data
   * @returns {object} Creation result
   */
  createTenant(tenantData) {
    const tenant = new TenantModel(tenantData);
    
    const validation = tenant.validate();
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    this.tenants.set(tenant.tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantCreated({
      tenantId: tenant.tenantId,
      businessName: tenant.businessName,
      businessType: tenant.businessType
    });

    return { success: true, tenantId: tenant.tenantId, tenant };
  }

  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {TenantModel|null} Tenant
   */
  getTenant(tenantId) {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get tenant by workspace ID
   * @param {string} workspaceId - Workspace ID
   * @returns {TenantModel|null} Tenant
   */
  getTenantByWorkspace(workspaceId) {
    for (const tenant of this.tenants.values()) {
      if (tenant.workspaceId === workspaceId) {
        return tenant;
      }
    }
    return null;
  }

  /**
   * Get tenant by owner account
   * @param {string} ownerAccount - Owner account ID
   * @returns {TenantModel|null} Tenant
   */
  getTenantByOwner(ownerAccount) {
    for (const tenant of this.tenants.values()) {
      if (tenant.ownerAccount === ownerAccount) {
        return tenant;
      }
    }
    return null;
  }

  /**
   * Get all tenants
   * @param {object} filters - Optional filters
   * @returns {Array} Tenants
   */
  getAllTenants(filters = {}) {
    let tenants = Array.from(this.tenants.values());

    if (filters.status) {
      tenants = tenants.filter(t => t.status === filters.status);
    }

    if (filters.subscriptionStatus) {
      tenants = tenants.filter(t => t.subscriptionStatus === filters.subscriptionStatus);
    }

    if (filters.businessType) {
      tenants = tenants.filter(t => t.businessType === filters.businessType);
    }

    if (filters.region) {
      tenants = tenants.filter(t => t.region === filters.region);
    }

    return tenants;
  }

  /**
   * Update tenant
   * @param {string} tenantId - Tenant ID
   * @param {object} updates - Updates to apply
   * @returns {object} Update result
   */
  updateTenant(tenantId, updates) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    tenant.update(updates);
    this.tenants.set(tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantUpdated({
      tenantId,
      updates
    });

    return { success: true, tenantId };
  }

  /**
   * Suspend tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} reason - Suspension reason
   * @returns {object} Suspension result
   */
  suspendTenant(tenantId, reason = '') {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    tenant.suspend();
    tenant.metadata.suspensionReason = reason;
    this.tenants.set(tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantSuspended({
      tenantId,
      reason
    });

    return { success: true, tenantId };
  }

  /**
   * Reactivate tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Reactivation result
   */
  reactivateTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    if (!tenant.isSuspended() && !tenant.isArchived()) {
      return { success: false, reason: 'Tenant is not suspended or archived' };
    }

    tenant.activate();
    delete tenant.metadata.suspensionReason;
    this.tenants.set(tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantReactivated({
      tenantId
    });

    return { success: true, tenantId };
  }

  /**
   * Archive tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Archive result
   */
  archiveTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    tenant.archive();
    this.tenants.set(tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantArchived({
      tenantId
    });

    return { success: true, tenantId };
  }

  /**
   * Delete tenant (safe workflow)
   * @param {string} tenantId - Tenant ID
   * @param {boolean} confirm - Confirmation
   * @returns {object} Deletion result
   */
  deleteTenant(tenantId, confirm = false) {
    if (!confirm) {
      return { success: false, reason: 'Confirmation required' };
    }

    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    // Archive first
    tenant.archive();
    this.tenants.set(tenantId, tenant);
    this.saveState();

    // Then delete
    tenant.delete();
    this.tenants.delete(tenantId);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logTenantDeleted({
      tenantId
    });

    return { success: true, tenantId };
  }

  /**
   * Clone tenant
   * @param {string} tenantId - Source tenant ID
   * @param {object} cloneData - Clone data
   * @returns {object} Clone result
   */
  cloneTenant(tenantId, cloneData) {
    const sourceTenant = this.tenants.get(tenantId);
    
    if (!sourceTenant) {
      return { success: false, reason: 'Source tenant not found' };
    }

    // Create clone without sensitive data
    const cloneTenantData = {
      businessName: cloneData.businessName || `${sourceTenant.businessName} (Clone)`,
      legalName: cloneData.legalName || sourceTenant.legalName,
      businessType: sourceTenant.businessType,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      region: sourceTenant.region,
      timezone: sourceTenant.timezone,
      currency: sourceTenant.currency,
      primaryContact: cloneData.primaryContact || sourceTenant.primaryContact,
      ownerAccount: cloneData.ownerAccount,
      config: { ...sourceTenant.config },
      metadata: {
        clonedFrom: tenantId,
        clonedAt: new Date().toISOString()
      }
    };

    const result = this.createTenant(cloneTenantData);

    if (result.success) {
      const auditLogger = getTenantAuditLogger();
      auditLogger.logCloneCreated({
        sourceTenantId: tenantId,
        newTenantId: result.tenantId
      });
    }

    return result;
  }

  /**
   * Transfer ownership
   * @param {string} tenantId - Tenant ID
   * @param {string} newOwnerAccount - New owner account ID
   * @returns {object} Transfer result
   */
  transferOwnership(tenantId, newOwnerAccount) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    const oldOwner = tenant.ownerAccount;
    tenant.ownerAccount = newOwnerAccount;
    tenant.metadata.ownershipTransferredAt = new Date().toISOString();
    this.tenants.set(tenantId, tenant);
    this.saveState();

    const auditLogger = getTenantAuditLogger();
    auditLogger.logOwnershipChanged({
      tenantId,
      oldOwner,
      newOwner: newOwnerAccount
    });

    return { success: true, tenantId };
  }

  /**
   * Rename tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} newBusinessName - New business name
   * @returns {object} Rename result
   */
  renameTenant(tenantId, newBusinessName) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    tenant.businessName = newBusinessName;
    tenant.metadata.lastModified = new Date().toISOString();
    this.tenants.set(tenantId, tenant);
    this.saveState();

    return { success: true, tenantId };
  }

  /**
   * Get tenant health status
   * @param {string} tenantId - Tenant ID
   * @returns {object} Health status
   */
  getTenantHealth(tenantId) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { status: 'unknown', reason: 'Tenant not found' };
    }

    // Placeholder health check
    // In production would check actual database, storage, cloud health
    return {
      status: 'healthy',
      tenantId,
      databaseHealth: 'healthy',
      storageHealth: 'healthy',
      cloudHealth: 'healthy',
      backupHealth: 'healthy',
      syncHealth: 'healthy',
      lastActivity: tenant.metadata.lastActivity || new Date().toISOString()
    };
  }

  /**
   * Get tenant diagnostics
   * @param {string} tenantId - Tenant ID
   * @returns {object} Diagnostics
   */
  getTenantDiagnostics(tenantId) {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return { success: false, reason: 'Tenant not found' };
    }

    return {
      success: true,
      tenantId,
      tenant: tenant.getSummary(),
      health: this.getTenantHealth(tenantId),
      config: tenant.config,
      metadata: tenant.metadata
    };
  }

  /**
   * Get registry statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const tenants = Array.from(this.tenants.values());
    const total = tenants.length;

    const byStatus = {};
    tenants.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    const bySubscriptionStatus = {};
    tenants.forEach(t => {
      bySubscriptionStatus[t.subscriptionStatus] = (bySubscriptionStatus[t.subscriptionStatus] || 0) + 1;
    });

    const byBusinessType = {};
    tenants.forEach(t => {
      byBusinessType[t.businessType] = (byBusinessType[t.businessType] || 0) + 1;
    });

    const byRegion = {};
    tenants.forEach(t => {
      byRegion[t.region] = (byRegion[t.region] || 0) + 1;
    });

    return {
      total,
      byStatus,
      bySubscriptionStatus,
      byBusinessType,
      byRegion
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        tenants: Array.from(this.tenants.entries()).map(([id, tenant]) => [id, tenant.toJSON()])
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save tenant registry state:', error);
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
        this.tenants = new Map(parsed.tenants.map(([id, data]) => [id, TenantModel.fromJSON(data)]));
      }
    } catch (error) {
      console.error('Failed to load tenant registry state:', error);
      this.tenants = new Map();
    }
  }

  /**
   * Destroy the tenant registry
   */
  destroy() {
    this.tenants.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[TenantRegistry] Destroyed');
  }
}

// Singleton instance
let tenantRegistryInstance = null;

/**
 * Get the singleton tenant registry instance
 * @returns {TenantRegistry} Tenant registry instance
 */
export function getTenantRegistry() {
  if (!tenantRegistryInstance) {
    tenantRegistryInstance = new TenantRegistry();
  }
  return tenantRegistryInstance;
}

export default TenantRegistry;
