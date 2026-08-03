// Permission Engine
// Access control and permission management

import { SecurityInterface } from './SecurityInterface.js';
import { Permission, SecurityStatus, SecurityLevel } from './SecurityTypes.js';

export class PermissionEngine extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.rolePermissions = new Map();
    this.userPermissions = new Map();
    this.accessLog = [];
    this.maxLogSize = 500;
    this.storageKey = 'cafeos_permission_engine';
    this.loadState();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default permissions
   */
  initializeDefaultPermissions() {
    // Owner has all permissions
    this.rolePermissions.set('owner', Object.values(Permission));
    
    // Manager has most permissions except security management
    this.rolePermissions.set('manager', [
      Permission.VIEW_CLOUD_SETTINGS,
      Permission.MANAGE_PROVIDERS,
      Permission.RUN_BACKUPS,
      Permission.RESTORE_DATA,
      Permission.EXPORT_DATA,
      Permission.IMPORT_DATA,
      Permission.VIEW_AUDIT_LOGS,
      Permission.CONFIGURE_SYNC,
      Permission.MANAGE_RETENTION,
      Permission.VIEW_SECURITY_CENTER
    ]);
    
    // Staff has limited permissions
    this.rolePermissions.set('staff', [
      Permission.VIEW_CLOUD_SETTINGS,
      Permission.VIEW_AUDIT_LOGS,
      Permission.VIEW_SECURITY_CENTER
    ]);
  }

  /**
   * Initialize the permission engine
   */
  async initialize() {
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Check if a user has permission
   * @param {string} permission - Permission to check
   * @param {string} userRole - User role
   * @param {string} userId - User ID (optional)
   * @returns {object} Permission check result
   */
  checkPermission(permission, userRole, userId = null) {
    // Check user-specific permissions first
    if (userId && this.userPermissions.has(userId)) {
      const userPerms = this.userPermissions.get(userId);
      if (userPerms.includes(permission)) {
        this.logAccess(permission, userRole, userId, true);
        return { allowed: true, source: 'user' };
      }
    }

    // Check role permissions
    const rolePerms = this.rolePermissions.get(userRole);
    if (rolePerms && rolePerms.includes(permission)) {
      this.logAccess(permission, userRole, userId, true);
      return { allowed: true, source: 'role' };
    }

    this.logAccess(permission, userRole, userId, false);
    return { allowed: false, reason: 'Permission denied' };
  }

  /**
   * Check multiple permissions
   * @param {Array} permissions - Permissions to check
   * @param {string} userRole - User role
   * @param {string} userId - User ID (optional)
   * @returns {object} Permission check result
   */
  checkPermissions(permissions, userRole, userId = null) {
    const results = {};
    let allAllowed = true;

    permissions.forEach(permission => {
      const result = this.checkPermission(permission, userRole, userId);
      results[permission] = result;
      if (!result.allowed) {
        allAllowed = false;
      }
    });

    return { allAllowed, results };
  }

  /**
   * Grant permission to a user
   * @param {string} userId - User ID
   * @param {string} permission - Permission to grant
   * @returns {object} Grant result
   */
  grantPermission(userId, permission) {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, []);
    }

    const userPerms = this.userPermissions.get(userId);
    if (!userPerms.includes(permission)) {
      userPerms.push(permission);
      this.saveState();
    }

    return { success: true, userId, permission };
  }

  /**
   * Revoke permission from a user
   * @param {string} userId - User ID
   * @param {string} permission - Permission to revoke
   * @returns {object} Revoke result
   */
  revokePermission(userId, permission) {
    if (!this.userPermissions.has(userId)) {
      return { success: false, reason: 'User has no custom permissions' };
    }

    const userPerms = this.userPermissions.get(userId);
    const index = userPerms.indexOf(permission);
    
    if (index === -1) {
      return { success: false, reason: 'User does not have this permission' };
    }

    userPerms.splice(index, 1);
    
    if (userPerms.length === 0) {
      this.userPermissions.delete(userId);
    }
    
    this.saveState();
    return { success: true, userId, permission };
  }

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Array} User permissions
   */
  getUserPermissions(userId, userRole) {
    const rolePerms = this.rolePermissions.get(userRole) || [];
    const userPerms = this.userPermissions.get(userId) || [];
    
    // Combine role and user permissions
    const allPermissions = [...new Set([...rolePerms, ...userPerms])];
    
    return allPermissions;
  }

  /**
   * Get role permissions
   * @param {string} role - Role name
   * @returns {Array} Role permissions
   */
  getRolePermissions(role) {
    return this.rolePermissions.get(role) || [];
  }

  /**
   * Set role permissions
   * @param {string} role - Role name
   * @param {Array} permissions - Permissions to assign
   * @returns {object} Set result
   */
  setRolePermissions(role, permissions) {
    this.rolePermissions.set(role, permissions);
    this.saveState();
    return { success: true, role, permissionCount: permissions.length };
  }

  /**
   * Log access attempt
   * @param {string} permission - Permission checked
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @param {boolean} allowed - Whether access was allowed
   */
  logAccess(permission, userRole, userId, allowed) {
    this.accessLog.push({
      timestamp: new Date().toISOString(),
      permission,
      userRole,
      userId,
      allowed
    });

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

    if (filters.permission) {
      log = log.filter(entry => entry.permission === filters.permission);
    }

    if (filters.userRole) {
      log = log.filter(entry => entry.userRole === filters.userRole);
    }

    if (filters.userId) {
      log = log.filter(entry => entry.userId === filters.userId);
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
   * @returns {object} Statistics
   */
  getStatistics() {
    const total = this.accessLog.length;
    const allowed = this.accessLog.filter(e => e.allowed).length;
    const denied = total - allowed;

    const byPermission = {};
    this.accessLog.forEach(entry => {
      byPermission[entry.permission] = (byPermission[entry.permission] || 0) + 1;
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
      byPermission,
      byRole
    };
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (this.rolePermissions.size === 0) {
      return { valid: false, reason: 'No role permissions defined' };
    }

    if (!this.rolePermissions.has('owner')) {
      return { valid: false, reason: 'Owner role not defined' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    // Deduct if no owner role
    if (!this.rolePermissions.has('owner')) {
      score -= 30;
    }

    // Deduct if no role permissions
    if (this.rolePermissions.size === 0) {
      score -= 50;
    }

    // Deduct for high denial rate
    const stats = this.getStatistics();
    if (stats.total > 10 && stats.allowRate < 50) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.rolePermissions.has('owner')) {
      recommendations.push({
        level: 'critical',
        message: 'Owner role not defined',
        action: 'Define owner role with all permissions'
      });
    }

    if (this.rolePermissions.size === 0) {
      recommendations.push({
        level: 'critical',
        message: 'No role permissions defined',
        action: 'Define role permissions for all user roles'
      });
    }

    const stats = this.getStatistics();
    if (stats.total > 10 && stats.allowRate < 50) {
      recommendations.push({
        level: 'warning',
        message: 'High permission denial rate',
        action: 'Review user permissions and roles'
      });
    }

    return recommendations;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        rolePermissions: Array.from(this.rolePermissions.entries()),
        userPermissions: Array.from(this.userPermissions.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save permission engine state:', error);
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
        this.rolePermissions = new Map(parsed.rolePermissions || []);
        this.userPermissions = new Map(parsed.userPermissions || []);
      }
    } catch (error) {
      console.error('Failed to load permission engine state:', error);
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.rolePermissions.clear();
    this.userPermissions.clear();
    this.accessLog = [];
    localStorage.removeItem(this.storageKey);
    this.initializeDefaultPermissions();
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the permission engine
   */
  async destroy() {
    await this.reset();
    console.log('[PermissionEngine] Destroyed');
  }
}

// Singleton instance
let permissionEngineInstance = null;

/**
 * Get the singleton permission engine instance
 * @returns {PermissionEngine} Permission engine instance
 */
export function getPermissionEngine() {
  if (!permissionEngineInstance) {
    permissionEngineInstance = new PermissionEngine();
  }
  return permissionEngineInstance;
}

export default PermissionEngine;
