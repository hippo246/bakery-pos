// Sync Security Manager
// Manages security and access control for sync operations

import { isOwnerAuthenticated, verifyOwnerPassword, setOwnerAuthenticated } from '../utils/setupSecurity.js';

export class SyncSecurityManager {
  constructor() {
    this.accessLog = [];
    this.maxLogSize = 200;
  }

  /**
   * Permission levels
   */
  static PermissionLevel = {
    NONE: 'none',
    VIEW: 'view',
    MANAGE: 'manage',
    ADMIN: 'admin'
  };

  /**
   * User roles
   */
  static UserRole = {
    OWNER: 'owner',
    MANAGER: 'manager',
    STAFF: 'staff',
    NONE: 'none'
  };

  /**
   * Required permissions for operations
   */
  static OperationPermissions = {
    // Sync operations
    QUEUE_SYNC: [SyncSecurityManager.PermissionLevel.MANAGE],
    CANCEL_SYNC: [SyncSecurityManager.PermissionLevel.MANAGE],
    PAUSE_SYNC: [SyncSecurityManager.PermissionLevel.MANAGE],
    RESUME_SYNC: [SyncSecurityManager.PermissionLevel.MANAGE],
    DELETE_SYNC: [SyncSecurityManager.PermissionLevel.ADMIN],
    VIEW_SYNC: [SyncSecurityManager.PermissionLevel.VIEW],
    VIEW_QUEUE: [SyncSecurityManager.PermissionLevel.VIEW],
    VIEW_HISTORY: [SyncSecurityManager.PermissionLevel.VIEW],
    
    // Conflict operations
    VIEW_CONFLICTS: [SyncSecurityManager.PermissionLevel.VIEW],
    RESOLVE_CONFLICT: [SyncSecurityManager.PermissionLevel.MANAGE],
    RESOLVE_CRITICAL_CONFLICT: [SyncSecurityManager.PermissionLevel.ADMIN],
    
    // System operations
    VIEW_STATISTICS: [SyncSecurityManager.PermissionLevel.VIEW],
    MANAGE_POLICIES: [SyncSecurityManager.PermissionLevel.ADMIN],
    MANAGE_FILTERS: [SyncSecurityManager.PermissionLevel.MANAGE],
    VIEW_NETWORK_STATUS: [SyncSecurityManager.PermissionLevel.VIEW]
  };

  /**
   * Check if user has permission for an operation
   * @param {string} operation - Operation to check
   * @param {string} userRole - User role
   * @returns {object} Permission check result
   */
  checkPermission(operation, userRole) {
    const requiredPermissions = SyncSecurityManager.OperationPermissions[operation];
    
    if (!requiredPermissions) {
      return { allowed: false, reason: 'Unknown operation' };
    }

    const userPermissionLevel = this.roleToPermissionLevel(userRole);

    if (userPermissionLevel === SyncSecurityManager.PermissionLevel.NONE) {
      return { allowed: false, reason: 'No permission level' };
    }

    const hasPermission = requiredPermissions.includes(userPermissionLevel);

    this.logAccess({
      operation,
      userRole,
      userPermissionLevel,
      allowed: hasPermission,
      timestamp: new Date().toISOString()
    });

    return {
      allowed: hasPermission,
      requiredPermission: requiredPermissions[0],
      userPermission: userPermissionLevel
    };
  }

  /**
   * Convert user role to permission level
   * @param {string} userRole - User role
   * @returns {string} Permission level
   */
  roleToPermissionLevel(userRole) {
    switch (userRole) {
      case SyncSecurityManager.UserRole.OWNER:
        return SyncSecurityManager.PermissionLevel.ADMIN;
      case SyncSecurityManager.UserRole.MANAGER:
        return SyncSecurityManager.PermissionLevel.MANAGE;
      case SyncSecurityManager.UserRole.STAFF:
        return SyncSecurityManager.PermissionLevel.NONE;
      default:
        return SyncSecurityManager.PermissionLevel.NONE;
    }
  }

  /**
   * Require owner authentication
   * @param {string} password - Owner password
   * @returns {Promise<object>} Authentication result
   */
  async requireOwnerAuth(password) {
    const isValid = await verifyOwnerPassword(password);

    if (isValid) {
      setOwnerAuthenticated(true);
      this.logAccess({
        operation: 'owner_auth',
        success: true,
        timestamp: new Date().toISOString()
      });
      return { allowed: true };
    }

    this.logAccess({
      operation: 'owner_auth',
      success: false,
      timestamp: new Date().toISOString()
    });

    return { allowed: false, reason: 'Invalid password' };
  }

  /**
   * Check if owner is currently authenticated
   * @returns {boolean} Authentication status
   */
  isOwnerAuthenticated() {
    return isOwnerAuthenticated();
  }

  /**
   * Require owner authentication for sensitive operations
   * @returns {Promise<object>} Authentication result
   */
  async requireAuthenticatedOwner() {
    if (this.isOwnerAuthenticated()) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Owner authentication required' };
  }

  /**
   * Log access attempt
   * @param {object} logEntry - Log entry
   */
  logAccess(logEntry) {
    this.accessLog.push(logEntry);
    this.trimLog();
  }

  /**
   * Trim access log to max size
   */
  trimLog() {
    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog = this.accessLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Get access log
   * @param {object} filters - Optional filters
   * @returns {Array} Filtered access log
   */
  getAccessLog(filters = {}) {
    let log = [...this.accessLog];

    if (filters.operation) {
      log = log.filter(entry => entry.operation === filters.operation);
    }

    if (filters.userRole) {
      log = log.filter(entry => entry.userRole === filters.userRole);
    }

    if (filters.allowed !== undefined) {
      log = log.filter(entry => entry.allowed === filters.allowed);
    }

    if (filters.since) {
      log = log.filter(entry => new Date(entry.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      log = log.slice(-filters.limit);
    }

    return log;
  }

  /**
   * Get access statistics
   * @returns {object} Access statistics
   */
  getAccessStatistics() {
    const total = this.accessLog.length;
    const allowed = this.accessLog.filter(e => e.allowed).length;
    const denied = total - allowed;

    const byOperation = {};
    this.accessLog.forEach(entry => {
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + 1;
    });

    const byRole = {};
    this.accessLog.forEach(entry => {
      byRole[entry.userRole] = (byRole[entry.userRole] || 0) + 1;
    });

    return {
      total,
      allowed,
      denied,
      allowRate: total > 0 ? (allowed / total) * 100 : 0,
      byOperation,
      byRole
    };
  }

  /**
   * Clear access log
   */
  clearAccessLog() {
    this.accessLog = [];
  }

  /**
   * Validate sync operation security
   * @param {string} operation - Operation to validate
   * @param {string} userRole - User role
   * @param {object} context - Additional context
   * @returns {object} Validation result
   */
  validateOperation(operation, userRole, context = {}) {
    // Check basic permission
    const permissionCheck = this.checkPermission(operation, userRole);
    if (!permissionCheck.allowed) {
      return {
        valid: false,
        reason: permissionCheck.reason,
        requiresOwnerAuth: permissionCheck.requiredPermission === SyncSecurityManager.PermissionLevel.ADMIN
      };
    }

    // Additional security checks for specific operations
    switch (operation) {
      case 'RESOLVE_CRITICAL_CONFLICT':
        if (!context.ownerAuthenticated) {
          return {
            valid: false,
            reason: 'Owner authentication required for critical conflict resolution',
            requiresOwnerAuth: true
          };
        }
        break;

      case 'MANAGE_POLICIES':
        if (userRole !== SyncSecurityManager.UserRole.OWNER) {
          return {
            valid: false,
            reason: 'Only owners can manage sync policies',
            requiresOwnerAuth: true
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Sanitize sync data for display
   * @param {object} syncData - Sync data to sanitize
   * @param {string} userRole - User role
   * @returns {object} Sanitized sync data
   */
  sanitizeSyncData(syncData, userRole) {
    const sanitized = { ...syncData };

    // Remove sensitive information based on role
    if (userRole !== SyncSecurityManager.UserRole.OWNER) {
      delete sanitized.encryptionKey;
      delete sanitized.credentials;
    }

    if (userRole === SyncSecurityManager.UserRole.STAFF) {
      delete sanitized.notes;
      delete sanitized.internalMetadata;
    }

    return sanitized;
  }

  /**
   * Mask sensitive sync information
   * @param {object} syncData - Sync data
   * @returns {object} Masked sync data
   */
  maskSensitiveData(syncData) {
    const masked = { ...syncData };

    if (masked.encryptionKey) {
      masked.encryptionKey = '••••••••••••••••';
    }

    if (masked.credentials) {
      masked.credentials = '••••••••••••••••';
    }

    return masked;
  }

  /**
   * Encrypt queued sensitive information
   * @param {object} data - Data to encrypt
   * @returns {Promise<object>} Encrypted data
   */
  async encryptSensitiveData(data) {
    // This is a placeholder - in production would use actual encryption
    return {
      encrypted: true,
      data: JSON.stringify(data),
      iv: 'placeholder_iv'
    };
  }

  /**
   * Decrypt sensitive information
   * @param {object} encryptedData - Encrypted data
   * @returns {Promise<object>} Decrypted data
   */
  async decryptSensitiveData(encryptedData) {
    // This is a placeholder - in production would use actual decryption
    try {
      return JSON.parse(encryptedData.data);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Destroy the security manager
   */
  destroy() {
    this.accessLog = [];
    console.log('[SyncSecurityManager] Destroyed');
  }
}

// Singleton instance
let securityManagerInstance = null;

/**
 * Get the singleton security manager instance
 * @returns {SyncSecurityManager} Security manager instance
 */
export function getSyncSecurityManager() {
  if (!securityManagerInstance) {
    securityManagerInstance = new SyncSecurityManager();
  }
  return securityManagerInstance;
}

export default SyncSecurityManager;
