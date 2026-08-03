// Permission Isolation
// Manages tenant-specific permissions

import { getTenantContext } from './TenantContext.js';
import { getPermissionEngine } from '../security/PermissionEngine.js';

export class PermissionIsolation {
  constructor() {
    this.tenantContext = getTenantContext();
    this.permissionEngine = getPermissionEngine();
    this.tenantPermissions = new Map();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default permissions
   */
  initializeDefaultPermissions() {
    // Default permissions for each tenant
    this.tenantPermissions.set('default', {
      owner: ['all'],
      manager: ['view', 'manage', 'export', 'import'],
      staff: ['view']
    });
  }

  /**
   * Check permission with tenant isolation
   * @param {string} permission - Permission to check
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  checkPermission(permission, userRole, userId) {
    const tenantId = this.tenantContext.getTenantId();
    
    if (!tenantId) {
      return { allowed: false, reason: 'No tenant context set' };
    }

    // Check if user has permission in this tenant
    const tenantUserPermissions = this.getUserTenantPermissions(tenantId, userId);
    
    if (tenantUserPermissions && !tenantUserPermissions.includes(permission) && !tenantUserPermissions.includes('all')) {
      return { allowed: false, reason: 'Permission not granted in this tenant' };
    }

    // Use permission engine for actual check
    const result = this.permissionEngine.checkPermission(permission, userRole, userId);
    
    return result;
  }

  /**
   * Get user permissions for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @returns {Array} User permissions
   */
  getUserTenantPermissions(tenantId, userId) {
    const key = `${tenantId}_${userId}`;
    return this.tenantPermissions.get(key) || null;
  }

  /**
   * Set user permissions for tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {Array} permissions - Permissions to grant
   * @returns {object} Set result
   */
  setUserTenantPermissions(tenantId, userId, permissions) {
    const key = `${tenantId}_${userId}`;
    this.tenantPermissions.set(key, permissions);
    return { success: true };
  }

  /**
   * Remove user from tenant permissions
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @returns {object} Remove result
   */
  removeUserTenantPermissions(tenantId, userId) {
    const key = `${tenantId}_${userId}`;
    const deleted = this.tenantPermissions.delete(key);
    return { success: deleted };
  }

  /**
   * Check if role exists in tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} role - Role name
   * @returns {boolean} Role exists
   */
  roleExistsInTenant(_tenantId, _role) {
    // Placeholder for role existence check
    // In production would check tenant-specific roles
    return true;
  }

  /**
   * Create role in tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} roleName - Role name
   * @param {Array} permissions - Role permissions
   * @returns {object} Create result
   */
  createRoleInTenant(tenantId, roleName, permissions) {
    const key = `role_${tenantId}_${roleName}`;
    this.tenantPermissions.set(key, permissions);
    return { success: true };
  }

  /**
   * Delete role from tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} roleName - Role name
   * @returns {object} Delete result
   */
  deleteRoleFromTenant(tenantId, roleName) {
    const key = `role_${tenantId}_${roleName}`;
    const deleted = this.tenantPermissions.delete(key);
    return { success: deleted };
  }

  /**
   * Get all roles for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Tenant roles
   */
  getTenantRoles(_tenantId) {
    // Placeholder for tenant roles
    // In production would return actual tenant-specific roles
    return ['owner', 'manager', 'staff'];
  }

  /**
   * Check cross-tenant permission access
   * @param {string} requestedTenantId - Requested tenant ID
   * @param {string} userId - User ID
   * @returns {object} Cross-tenant check result
   */
  checkCrossTenantPermissionAccess(requestedTenantId, userId) {
    const currentTenantId = this.tenantContext.getTenantId();
    
    if (!currentTenantId) {
      return { allowed: false, reason: 'No tenant context set' };
    }

    if (currentTenantId === requestedTenantId) {
      return { allowed: true };
    }

    // Check if user has access to requested tenant
    const requestedPermissions = this.getUserTenantPermissions(requestedTenantId, userId);
    
    if (!requestedPermissions) {
      return {
        allowed: false,
        reason: 'User has no permissions in requested tenant'
      };
    }

    // Check for cross-tenant admin permission
    const currentPermissions = this.getUserTenantPermissions(currentTenantId, userId);
    
    if (currentPermissions && currentPermissions.includes('cross_tenant_access')) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Cross-tenant permission access not granted'
    };
  }

  /**
   * Get permission statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    
    return {
      hasContext: this.tenantContext.hasContext(),
      tenantId,
      totalPermissions: this.tenantPermissions.size,
      tenantPermissions: Array.from(this.tenantPermissions.keys()).filter(key => key.startsWith(`${tenantId}_`))
    };
  }

  /**
   * Destroy the permission isolation
   */
  destroy() {
    this.tenantPermissions.clear();
    console.log('[PermissionIsolation] Destroyed');
  }
}

// Singleton instance
let permissionIsolationInstance = null;

/**
 * Get the singleton permission isolation instance
 * @returns {PermissionIsolation} Permission isolation instance
 */
export function getPermissionIsolation() {
  if (!permissionIsolationInstance) {
    permissionIsolationInstance = new PermissionIsolation();
  }
  return permissionIsolationInstance;
}

export default PermissionIsolation;
