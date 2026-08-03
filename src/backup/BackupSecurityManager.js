// Backup Security Manager
// Manages security and access control for backup operations

import { isOwnerAuthenticated, verifyOwnerPassword, setOwnerAuthenticated } from '../utils/setupSecurity.js';

export class BackupSecurityManager {
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
    // Backup operations
    CREATE_BACKUP: [BackupSecurityManager.PermissionLevel.MANAGE],
    DELETE_BACKUP: [BackupSecurityManager.PermissionLevel.ADMIN],
    VIEW_BACKUP: [BackupSecurityManager.PermissionLevel.VIEW],
    EXPORT_BACKUP: [BackupSecurityManager.PermissionLevel.MANAGE],
    
    // Schedule operations
    CREATE_SCHEDULE: [BackupSecurityManager.PermissionLevel.ADMIN],
    DELETE_SCHEDULE: [BackupSecurityManager.PermissionLevel.ADMIN],
    MODIFY_SCHEDULE: [BackupSecurityManager.PermissionLevel.ADMIN],
    VIEW_SCHEDULE: [BackupSecurityManager.PermissionLevel.VIEW],
    
    // Retention operations
    CREATE_RETENTION_POLICY: [BackupSecurityManager.PermissionLevel.ADMIN],
    DELETE_RETENTION_POLICY: [BackupSecurityManager.PermissionLevel.ADMIN],
    MODIFY_RETENTION_POLICY: [BackupSecurityManager.PermissionLevel.ADMIN],
    VIEW_RETENTION_POLICY: [BackupSecurityManager.PermissionLevel.VIEW],
    
    // System operations
    VIEW_STATISTICS: [BackupSecurityManager.PermissionLevel.VIEW],
    VIEW_HISTORY: [BackupSecurityManager.PermissionLevel.VIEW],
    MODIFY_ENCRYPTION: [BackupSecurityManager.PermissionLevel.ADMIN],
    DISABLE_ENCRYPTION: [BackupSecurityManager.PermissionLevel.ADMIN]
  };

  /**
   * Check if user has permission for an operation
   * @param {string} operation - Operation to check
   * @param {string} userRole - User role
   * @returns {object} Permission check result
   */
  checkPermission(operation, userRole) {
    const requiredPermissions = BackupSecurityManager.OperationPermissions[operation];
    
    if (!requiredPermissions) {
      return { allowed: false, reason: 'Unknown operation' };
    }

    const userPermissionLevel = this.roleToPermissionLevel(userRole);

    if (userPermissionLevel === BackupSecurityManager.PermissionLevel.NONE) {
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
      case BackupSecurityManager.UserRole.OWNER:
        return BackupSecurityManager.PermissionLevel.ADMIN;
      case BackupSecurityManager.UserRole.MANAGER:
        return BackupSecurityManager.PermissionLevel.MANAGE;
      case BackupSecurityManager.UserRole.STAFF:
        return BackupSecurityManager.PermissionLevel.NONE;
      default:
        return BackupSecurityManager.PermissionLevel.NONE;
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
   * Validate backup operation security
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
        requiresOwnerAuth: permissionCheck.requiredPermission === BackupSecurityManager.PermissionLevel.ADMIN
      };
    }

    // Additional security checks for specific operations
    switch (operation) {
      case 'DELETE_BACKUP':
        if (context.backupType === 'manual' && userRole !== BackupSecurityManager.UserRole.OWNER) {
          return {
            valid: false,
            reason: 'Only owners can delete manual backups',
            requiresOwnerAuth: true
          };
        }
        break;

      case 'DISABLE_ENCRYPTION':
        if (!context.ownerAuthenticated) {
          return {
            valid: false,
            reason: 'Owner authentication required to disable encryption',
            requiresOwnerAuth: true
          };
        }
        break;

      case 'MODIFY_RETENTION_POLICY':
        if (context.neverDeleteManual && userRole !== BackupSecurityManager.UserRole.OWNER) {
          return {
            valid: false,
            reason: 'Only owners can modify retention policies that affect manual backups',
            requiresOwnerAuth: true
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Sanitize backup data for display
   * @param {object} backupData - Backup data to sanitize
   * @param {string} userRole - User role
   * @returns {object} Sanitized backup data
   */
  sanitizeBackupData(backupData, userRole) {
    const sanitized = { ...backupData };

    // Remove sensitive information based on role
    if (userRole !== BackupSecurityManager.UserRole.OWNER) {
      delete sanitized.encryptionKey;
      delete sanitized.credentials;
      delete sanitized.apiKeys;
    }

    if (userRole === BackupSecurityManager.UserRole.STAFF) {
      delete sanitized.notes;
      delete sanitized.internalMetadata;
    }

    return sanitized;
  }

  /**
   * Mask sensitive backup information
   * @param {object} backupData - Backup data
   * @returns {object} Masked backup data
   */
  maskSensitiveData(backupData) {
    const masked = { ...backupData };

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
    console.log('[BackupSecurityManager] Destroyed');
  }
}

// Singleton instance
let securityManagerInstance = null;

/**
 * Get the singleton security manager instance
 * @returns {BackupSecurityManager} Security manager instance
 */
export function getBackupSecurityManager() {
  if (!securityManagerInstance) {
    securityManagerInstance = new BackupSecurityManager();
  }
  return securityManagerInstance;
}

export default BackupSecurityManager;
