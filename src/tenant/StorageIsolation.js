// Storage Isolation
// Manages isolated storage per tenant

import { getTenantContext } from './TenantContext.js';
import { getTenantIsolation } from './TenantIsolation.js';

export class StorageIsolation {
  constructor() {
    this.tenantContext = getTenantContext();
    this.tenantIsolation = getTenantIsolation();
    this.storagePaths = new Map();
    this.initializeStoragePaths();
  }

  /**
   * Initialize storage paths
   */
  initializeStoragePaths() {
    this.storagePaths.set('attachments', 'attachments');
    this.storagePaths.set('media', 'media');
    this.storagePaths.set('exports', 'exports');
    this.storagePaths.set('imports', 'imports');
    this.storagePaths.set('backups', 'backups');
    this.storagePaths.set('temporary', 'temp');
    this.storagePaths.set('logs', 'logs');
  }

  /**
   * Get isolated storage path
   * @param {string} storageType - Storage type
   * @param {string} path - Original path
   * @returns {string} Isolated path
   */
  getIsolatedPath(storageType, path = '') {
    const tenantId = this.tenantContext.getTenantId();
    const workspaceId = this.tenantContext.getWorkspaceId();
    
    if (!tenantId) {
      throw new Error('No tenant context set');
    }

    const basePath = this.storagePaths.get(storageType);
    
    if (!basePath) {
      throw new Error(`Unknown storage type: ${storageType}`);
    }

    const tenantPath = `${basePath}/${workspaceId}`;
    
    if (path) {
      return `${tenantPath}/${path}`;
    }

    return tenantPath;
  }

  /**
   * Validate storage path isolation
   * @param {string} storageType - Storage type
   * @param {string} path - Path to validate
   * @returns {object} Validation result
   */
  validatePath(storageType, path) {
    const tenantId = this.tenantContext.getTenantId();
    const workspaceId = this.tenantContext.getWorkspaceId();
    
    if (!tenantId) {
      return { valid: false, reason: 'No tenant context set' };
    }

    const basePath = this.storagePaths.get(storageType);
    
    if (!basePath) {
      return { valid: false, reason: `Unknown storage type: ${storageType}` };
    }

    const expectedPrefix = `${basePath}/${workspaceId}`;
    
    if (!path.startsWith(expectedPrefix)) {
      return { valid: false, reason: 'Path does not match tenant isolation pattern' };
    }

    return { valid: true };
  }

  /**
   * Check cross-tenant storage access
   * @param {string} storageType - Storage type
   * @param {string} path - Path being accessed
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantAccess(storageType, path) {
    const tenantId = this.tenantContext.getTenantId();
    const workspaceId = this.tenantContext.getWorkspaceId();
    
    if (!tenantId) {
      return { allowed: true, reason: 'No tenant context set' };
    }

    const basePath = this.storagePaths.get(storageType);
    
    if (!basePath) {
      return { allowed: true, reason: 'Unknown storage type' };
    }

    // Extract workspace ID from path
    const pathWorkspaceId = this.extractWorkspaceIdFromPath(storageType, path);
    
    if (!pathWorkspaceId) {
      return { allowed: true, reason: 'No workspace ID in path' };
    }

    if (pathWorkspaceId !== workspaceId) {
      return {
        allowed: false,
        reason: 'Cross-tenant storage access attempt',
        requestedWorkspaceId: workspaceId,
        pathWorkspaceId
      };
    }

    return { allowed: true };
  }

  /**
   * Extract workspace ID from path
   * @param {string} storageType - Storage type
   * @param {string} path - Storage path
   * @returns {string|null} Workspace ID
   */
  extractWorkspaceIdFromPath(storageType, path) {
    const basePath = this.storagePaths.get(storageType);
    
    if (!basePath) {
      return null;
    }

    if (!path.startsWith(basePath)) {
      return null;
    }

    const afterBase = path.substring(basePath.length + 1); // +1 for slash
    const slashIndex = afterBase.indexOf('/');

    if (slashIndex === -1) {
      return afterBase;
    }

    return afterBase.substring(0, slashIndex);
  }

  /**
   * Get storage quota for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Storage quota
   */
  getStorageQuota(tenantId) {
    // Placeholder for storage quota management
    // In production would check actual storage usage
    
    return {
      tenantId,
      maxGB: 10,
      usedGB: 0,
      availableGB: 10,
      percentage: 0
    };
  }

  /**
   * Check storage quota
   * @param {number} sizeMB - Size in MB
   * @returns {object} Quota check result
   */
  checkStorageQuota(sizeMB) {
    const tenantId = this.tenantContext.getTenantId();
    const quota = this.getStorageQuota(tenantId);
    
    const sizeGB = sizeMB / 1024;
    
    if (quota.usedGB + sizeGB > quota.maxGB) {
      return {
        allowed: false,
        reason: 'Storage quota exceeded',
        current: quota.usedGB,
      requested: sizeGB,
        max: quota.maxGB
      };
    }

    return { allowed: true };
  }

  /**
   * Get storage statistics
   * @returns {object} Storage statistics
   */
  getStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    const workspaceId = this.tenantContext.getWorkspaceId();
    
    return {
      hasContext: this.tenantContext.hasContext(),
      tenantId,
      workspaceId,
      storageTypes: Array.from(this.storagePaths.keys()),
      quota: this.getStorageQuota(tenantId)
    };
  }

  /**
   * Destroy the storage isolation
   */
  destroy() {
    this.storagePaths.clear();
    console.log('[StorageIsolation] Destroyed');
  }
}

// Singleton instance
let storageIsolationInstance = null;

/**
 * Get the singleton storage isolation instance
 * @returns {StorageIsolation} Storage isolation instance
 */
export function getStorageIsolation() {
  if (!storageIsolationInstance) {
    storageIsolationInstance = new StorageIsolation();
  }
  return storageIsolationInstance;
}

export default StorageIsolation;
