// Restore Security Manager
// Manages security and access control for restore operations

import { isOwnerAuthenticated, verifyOwnerPassword, setOwnerAuthenticated } from '../utils/setupSecurity.js';

export class RestoreSecurityManager {
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
    // Restore operations
    CREATE_RESTORE: [RestoreSecurityManager.PermissionLevel.ADMIN],
    CANCEL_RESTORE: [RestoreSecurityManager.PermissionLevel.ADMIN],
    DELETE_RESTORE: [RestoreSecurityManager.PermissionLevel.ADMIN],
    VIEW_RESTORE: [RestoreSecurityManager.PermissionLevel.VIEW],
    ROLLBACK_RESTORE: [RestoreSecurityManager.PermissionLevel.ADMIN],
    
    // Dry run operations
    RUN_DRY_RUN: [RestoreSecurityManager.PermissionLevel.MANAGE],
    
    // System operations
    VIEW_STATISTICS: [RestoreSecurityManager.PermissionLevel.VIEW],
    VIEW_HISTORY: [RestoreSecurityManager.PermissionLevel.VIEW],
    VIEW_HEALTH: [RestoreSecurityManager.PermissionLevel.VIEW]
  };

  /**
   * Check if user has permission for an operation
   * @param {string} operation - Operation to check
   * @param {string} userRole - User role
   * @returns {object} Permission check result
   */
  checkPermission(operation, userRole) {
    const requiredPermissions = RestoreSecurityManager.OperationPermissions[operation];
    
    if (!requiredPermissions) {
      return { allowed: false, reason: 'Unknown operation' };
    }

    const userPermissionLevel = this.roleToPermissionLevel(userRole);

    if (userPermissionLevel === RestoreSecurityManager.PermissionLevel.NONE) {
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
      case RestoreSecurityManager.UserRole.OWNER:
        return RestoreSecurityManager.PermissionLevel.ADMIN;
      case RestoreSecurityManager.UserRole.MANAGER:
        return RestoreSecurityManager.PermissionLevel.MANAGE;
      case RestoreSecurityManager.UserRole.STAFF:
        return RestoreSecurityManager.PermissionLevel.NONE;
      default:
        return RestoreSecurityManager.PermissionLevel.NONE;
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
   * Validate restore operation security
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
        requiresOwnerAuth: permissionCheck.requiredPermission === RestoreSecurityManager.PermissionLevel.ADMIN
      };
    }

    // Additional security checks for specific operations
    switch (operation) {
      case 'ROLLBACK_RESTORE':
        if (!context.ownerAuthenticated) {
          return {
            valid: false,
            reason: 'Owner authentication required for rollback',
            requiresOwnerAuth: true
          };
        }
        break;

      case 'CREATE_RESTORE':
        if (context.restoreType === 'factory' && userRole !== RestoreSecurityManager.UserRole.OWNER) {
          return {
            valid: false,
            reason: 'Only owners can perform factory restores',
            requiresOwnerAuth: true
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Sanitize restore data for display
   * @param {object} restoreData - Restore data to sanitize
   * @param {string} userRole - User role
   * @returns {object} Sanitized restore data
   */
  sanitizeRestoreData(restoreData, userRole) {
    const sanitized = { ...restoreData };

    // Remove sensitive information based on role
    if (userRole !== RestoreSecurityManager.UserRole.OWNER) {
      delete sanitized.encryptionKey;
      delete sanitized.credentials;
    }

    if (userRole === RestoreSecurityManager.UserRole.STAFF) {
      delete sanitized.notes;
      delete sanitized.internalMetadata;
    }

    return sanitized;
  }

  /**
   * Mask sensitive restore information
   * @param {object} restoreData - Restore data
   * @returns {object} Masked restore data
   */
  maskSensitiveData(restoreData) {
    const masked = { ...restoreData };

    if (masked.encryptionKey) {
      masked.encryptionKey = '••••••••••••••••';
    }

    if (masked.credentials) {
      masked.credentials = '••••••••••••••••';
    }

    return masked;
  }

  /**
   * Destroy the security manager
   */
  destroy() {
    this.accessLog = [];
    console.log('[RestoreSecurityManager] Destroyed');
  }
}

// Singleton instance
let securityManagerInstance = null;

/**
 * Get the singleton security manager instance
 * @returns {RestoreSecurityManager} Security manager instance
 */
export function getRestoreSecurityManager() {
  if (!securityManagerInstance) {
    securityManagerInstance = new RestoreSecurityManager();
  }
  return securityManagerInstance;
}

export default RestoreSecurityManager;
