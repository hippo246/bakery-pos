// Backup Isolation
// Manages isolated backups per tenant

import { getTenantContext } from './TenantContext.js';
import { getStorageIsolation } from './StorageIsolation.js';

export class BackupIsolation {
  constructor() {
    this.tenantContext = getTenantContext();
    this.storageIsolation = getStorageIsolation();
    this.backupPolicies = new Map();
    this.initializeBackupPolicies();
  }

  /**
   * Initialize backup policies
   */
  initializeBackupPolicies() {
    this.backupPolicies.set('default', {
      schedule: 'daily',
      retentionDays: 30,
      maxBackups: 30,
      autoRestore: false,
      encryption: true
    });

    this.backupPolicies.set('trial', {
      schedule: 'weekly',
      retentionDays: 7,
      maxBackups: 7,
      autoRestore: false,
      encryption: true
    });

    this.backupPolicies.set('enterprise', {
      schedule: 'hourly',
      retentionDays: 90,
      maxBackups: 90,
      autoRestore: true,
      encryption: true
    });
  }

  /**
   * Get isolated backup path
   * @param {string} backupId - Backup ID
   * @returns {string} Isolated backup path
   */
  getIsolatedBackupPath(backupId) {
    return this.storageIsolation.getIsolatedPath('backups', backupId);
  }

  /**
   * Validate backup isolation
   * @param {string} backupId - Backup ID
   * @returns {object} Validation result
   */
  validateBackupIsolation(backupId) {
    return this.storageIsolation.validatePath('backups', backupId);
  }

  /**
   * Check cross-tenant backup access
   * @param {string} backupId - Backup ID
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantAccess(backupId) {
    return this.storageIsolation.checkCrossTenantAccess('backups', backupId);
  }

  /**
   * Get backup policy for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Backup policy
   */
  getBackupPolicy(_tenantId) {
    // Placeholder for policy lookup
    // In production would get policy from tenant subscription
    return this.backupPolicies.get('default');
  }

  /**
   * Set backup policy for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} policyName - Policy name
   * @returns {object} Set result
   */
  setBackupPolicy(tenantId, policyName) {
    const policy = this.backupPolicies.get(policyName);
    
    if (!policy) {
      return { success: false, reason: 'Policy not found' };
    }

    // Placeholder for policy assignment
    // In production would save to tenant config
    return { success: true, policy };
  }

  /**
   * Get backup retention policy
   * @param {string} tenantId - Tenant ID
   * @returns {object} Retention policy
   */
  getRetentionPolicy(tenantId) {
    const policy = this.getBackupPolicy(tenantId);
    
    return {
      retentionDays: policy.retentionDays,
      maxBackups: policy.maxBackups,
      autoDelete: true
    };
  }

  /**
   * Check backup quota
   * @param {number} backupSizeMB - Backup size in MB
   * @returns {object} Quota check result
   */
  checkBackupQuota(_backupSizeMB) {
    const tenantId = this.tenantContext.getTenantId();
    const policy = this.getBackupPolicy(tenantId);
    
    // Placeholder for quota check
    // In production would check actual backup count and size
    
    return {
      allowed: true,
      maxBackups: policy.maxBackups,
      currentBackups: 0
    };
  }

  /**
   * Get backup statistics
   * @returns {object} Backup statistics
   */
  getStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    const workspaceId = this.tenantContext.getWorkspaceId();
    
    return {
      hasContext: this.tenantContext.hasContext(),
      tenantId,
      workspaceId,
      policy: this.getBackupPolicy(tenantId),
      retention: this.getRetentionPolicy(tenantId)
    };
  }

  /**
   * Destroy the backup isolation
   */
  destroy() {
    this.backupPolicies.clear();
    console.log('[BackupIsolation] Destroyed');
  }
}

// Singleton instance
let backupIsolationInstance = null;

/**
 * Get the singleton backup isolation instance
 * @returns {BackupIsolation} Backup isolation instance
 */
export function getBackupIsolation() {
  if (!backupIsolationInstance) {
    backupIsolationInstance = new BackupIsolation();
  }
  return backupIsolationInstance;
}

export default BackupIsolation;
