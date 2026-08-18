// Permission Engine
// Access control and permission management
// NOTE: This is a frontend-only implementation for demo/local use
// For production, permission checks must be enforced by the server
// Frontend permission checks are UI-only and can be bypassed by modifying localStorage
// All permission enforcement must happen on the server-side

import { SecurityInterface } from './SecurityInterface.js';
import { Permission, SecurityStatus } from './SecurityTypes.js';

export class PermissionEngine extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.rolePermissions = new Map();
    this.userPermissions = new Map();
    this.userAttributes = new Map(); // ABAC: User attributes (department, location, clearance, etc.)
    this.resourceAttributes = new Map(); // ABAC: Resource attributes (sensitivity, ownership, classification)
    this.abacPolicies = []; // ABAC: Attribute-based policies
    this.accessLog = [];
    this.maxLogSize = 500;
    this.storageKey = 'cafeos_permission_engine';
    this.loadState();
    this.initializeDefaultPermissions();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default ABAC policies
   */
  initializeDefaultPolicies() {
    // Example: Managers can only access data for their own branch
    this.abacPolicies.push({
      id: 'manager-branch-isolation',
      name: 'Manager Branch Isolation',
      description: 'Managers can only access data for their assigned branch',
      enabled: true,
      conditions: {
        userRole: 'manager',
        resourceType: 'data'
      },
      rule: (userAttrs, resourceAttrs) => {
        // Manager can only access resources from their branch
        return userAttrs.branchId === resourceAttrs.branchId;
      }
    });

    // Example: Staff can only modify orders they created
    this.abacPolicies.push({
      id: 'staff-order-ownership',
      name: 'Staff Order Ownership',
      description: 'Staff can only modify orders they created',
      enabled: true,
      conditions: {
        userRole: 'staff',
        resourceType: 'order',
        action: 'modify'
      },
      rule: (userAttrs, resourceAttrs) => {
        // Staff can only modify orders they created
        return userAttrs.userId === resourceAttrs.createdBy;
      }
    });

    // Example: Time-based access (business hours only)
    this.abacPolicies.push({
      id: 'business-hours-only',
      name: 'Business Hours Access',
      description: 'Staff can only access sensitive data during business hours',
      enabled: false, // Disabled by default
      conditions: {
        userRole: 'staff',
        resourceType: 'sensitive'
      },
      rule: (userAttrs, resourceAttrs) => {
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17; // 9 AM to 5 PM
      }
    });
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
   * Check if a user has permission (RBAC + ABAC)
   * @param {string} permission - Permission to check
   * @param {string} userRole - User role
   * @param {string} userId - User ID (optional)
   * @param {object} resourceContext - Resource context for ABAC (optional)
   * @returns {object} Permission check result
   */
  checkPermission(permission, userRole, userId = null, resourceContext = null) {
    // First check RBAC
    let rbacResult = this._checkRBAC(permission, userRole, userId);
    
    // If RBAC denies, check ABAC policies
    if (!rbacResult.allowed && resourceContext) {
      const abacResult = this._checkABAC(permission, userRole, userId, resourceContext);
      if (abacResult.allowed) {
        this.logAccess(permission, userRole, userId, true, 'abac');
        return { allowed: true, source: 'abac', policy: abacResult.policy };
      }
    }
    
    this.logAccess(permission, userRole, userId, rbacResult.allowed, rbacResult.source);
    return rbacResult;
  }

  /**
   * Check RBAC (Role-Based Access Control)
   * @private
   */
  _checkRBAC(permission, userRole, userId) {
    // Check user-specific permissions first
    if (userId && this.userPermissions.has(userId)) {
      const userPerms = this.userPermissions.get(userId);
      if (userPerms.includes(permission)) {
        return { allowed: true, source: 'user' };
      }
    }

    // Check role permissions
    const rolePerms = this.rolePermissions.get(userRole);
    if (rolePerms && rolePerms.includes(permission)) {
      return { allowed: true, source: 'role' };
    }

    return { allowed: false, reason: 'Permission denied' };
  }

  /**
   * Check ABAC (Attribute-Based Access Control)
   * @private
   */
  _checkABAC(permission, userRole, userId, resourceContext) {
    const userAttrs = this.userAttributes.get(userId) || {};
    
    for (const policy of this.abacPolicies) {
      if (!policy.enabled) continue;
      
      // Check if policy conditions match
      if (policy.conditions.userRole && policy.conditions.userRole !== userRole) continue;
      if (policy.conditions.resourceType && policy.conditions.resourceType !== resourceContext.type) continue;
      if (policy.conditions.action && policy.conditions.action !== resourceContext.action) continue;
      
      // Evaluate policy rule
      try {
        const result = policy.rule(userAttrs, resourceContext);
        if (result) {
          return { allowed: true, policy: policy.id };
        }
      } catch (error) {
        console.error('[PermissionEngine] Policy evaluation error:', error);
      }
    }
    
    return { allowed: false };
  }

  /**
   * Set user attributes for ABAC
   * @param {string} userId - User ID
   * @param {object} attributes - User attributes (branchId, department, location, clearance, etc.)
   * @returns {object} Set result
   */
  setUserAttributes(userId, attributes) {
    this.userAttributes.set(userId, attributes);
    this.saveState();
    return { success: true, userId, attributes };
  }

  /**
   * Get user attributes
   * @param {string} userId - User ID
   * @returns {object} User attributes
   */
  getUserAttributes(userId) {
    return this.userAttributes.get(userId) || {};
  }

  /**
   * Set resource attributes for ABAC
   * @param {string} resourceId - Resource ID
   * @param {object} attributes - Resource attributes (branchId, sensitivity, ownership, classification, etc.)
   * @returns {object} Set result
   */
  setResourceAttributes(resourceId, attributes) {
    this.resourceAttributes.set(resourceId, attributes);
    this.saveState();
    return { success: true, resourceId, attributes };
  }

  /**
   * Get resource attributes
   * @param {string} resourceId - Resource ID
   * @returns {object} Resource attributes
   */
  getResourceAttributes(resourceId) {
    return this.resourceAttributes.get(resourceId) || {};
  }

  /**
   * Add ABAC policy
   * @param {object} policy - Policy definition
   * @returns {object} Add result
   */
  addPolicy(policy) {
    if (!policy.id || !policy.rule) {
      return { success: false, reason: 'Policy must have id and rule' };
    }
    
    // Check if policy already exists
    const existingIndex = this.abacPolicies.findIndex(p => p.id === policy.id);
    if (existingIndex >= 0) {
      this.abacPolicies[existingIndex] = policy;
    } else {
      this.abacPolicies.push(policy);
    }
    
    this.saveState();
    return { success: true, policyId: policy.id };
  }

  /**
   * Remove ABAC policy
   * @param {string} policyId - Policy ID
   * @returns {object} Remove result
   */
  removePolicy(policyId) {
    const index = this.abacPolicies.findIndex(p => p.id === policyId);
    if (index === -1) {
      return { success: false, reason: 'Policy not found' };
    }
    
    this.abacPolicies.splice(index, 1);
    this.saveState();
    return { success: true, policyId };
  }

  /**
   * Enable/disable ABAC policy
   * @param {string} policyId - Policy ID
   * @param {boolean} enabled - Enable status
   * @returns {object} Update result
   */
  setPolicyEnabled(policyId, enabled) {
    const policy = this.abacPolicies.find(p => p.id === policyId);
    if (!policy) {
      return { success: false, reason: 'Policy not found' };
    }
    
    policy.enabled = enabled;
    this.saveState();
    return { success: true, policyId, enabled };
  }

  /**
   * Get all ABAC policies
   * @returns {Array} Policies
   */
  getPolicies() {
    return this.abacPolicies;
  }

  /**
   * Check multiple permissions (RBAC + ABAC)
   * @param {Array} permissions - Permissions to check
   * @param {string} userRole - User role
   * @param {string} userId - User ID (optional)
   * @param {object} resourceContext - Resource context for ABAC (optional)
   * @returns {object} Permission check result
   */
  checkPermissions(permissions, userRole, userId = null, resourceContext = null) {
    const results = {};
    let allAllowed = true;

    permissions.forEach(permission => {
      const result = this.checkPermission(permission, userRole, userId, resourceContext);
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
   * @param {string} source - Access source (role, user, abac)
   */
  logAccess(permission, userRole, userId, allowed, source = 'role') {
    this.accessLog.push({
      timestamp: new Date().toISOString(),
      permission,
      userRole,
      userId,
      allowed,
      source
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
        userPermissions: Array.from(this.userPermissions.entries()),
        userAttributes: Array.from(this.userAttributes.entries()),
        resourceAttributes: Array.from(this.resourceAttributes.entries()),
        abacPolicies: this.abacPolicies
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
        this.userAttributes = new Map(parsed.userAttributes || []);
        this.resourceAttributes = new Map(parsed.resourceAttributes || []);
        this.abacPolicies = parsed.abacPolicies || [];
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
    this.userAttributes.clear();
    this.resourceAttributes.clear();
    this.abacPolicies = [];
    this.accessLog = [];
    localStorage.removeItem(this.storageKey);
    this.initializeDefaultPermissions();
    this.initializeDefaultPolicies();
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
