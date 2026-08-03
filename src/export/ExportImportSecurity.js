// Export/Import Security
// Security and access control for export/import operations

import { getPermissionEngine } from '../security/PermissionEngine.js';
import { getOwnerVerification } from '../security/OwnerVerification.js';

export class ExportImportSecurity {
  constructor() {
    this.permissionEngine = getPermissionEngine();
    this.ownerVerification = getOwnerVerification();
  }

  /**
   * Check if user can export
   * @param {string} module - Module to export
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  canExport(module, userRole, userId) {
    // All roles can export operational data
    const basicPermission = this.permissionEngine.checkPermission('export_data', userRole, userId);
    
    if (!basicPermission.allowed) {
      return basicPermission;
    }

    // Sensitive modules require owner permission
    const sensitiveModules = ['settings', 'staff', 'audit_logs'];
    if (sensitiveModules.includes(module)) {
      const ownerCheck = this.permissionEngine.checkPermission('manage_security', userRole, userId);
      if (!ownerCheck.allowed) {
        return { allowed: false, reason: 'Owner permission required for sensitive modules' };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user can import
   * @param {string} module - Module to import
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  canImport(module, userRole, userId) {
    // All roles can import operational data
    const basicPermission = this.permissionEngine.checkPermission('import_data', userRole, userId);
    
    if (!basicPermission.allowed) {
      return basicPermission;
    }

    // Sensitive modules require owner permission
    const sensitiveModules = ['settings', 'staff', 'audit_logs'];
    if (sensitiveModules.includes(module)) {
      const ownerCheck = this.permissionEngine.checkPermission('manage_security', userRole, userId);
      if (!ownerCheck.allowed) {
        return { allowed: false, reason: 'Owner permission required for sensitive modules' };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user can delete history
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  canDeleteHistory(userRole, userId) {
    // Only owners can delete history
    return this.permissionEngine.checkPermission('manage_security', userRole, userId);
  }

  /**
   * Check if user can export sensitive data
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  canExportSensitiveData(userRole, userId) {
    // Only owners can export sensitive data
    return this.permissionEngine.checkPermission('manage_security', userRole, userId);
  }

  /**
   * Check if user can import settings
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} Permission check result
   */
  canImportSettings(userRole, userId) {
    // Only owners can import settings
    return this.permissionEngine.checkPermission('manage_security', userRole, userId);
  }

  /**
   * Require owner verification for operation
   * @param {string} operation - Operation type
   * @returns {object} Verification requirement
   */
  requiresOwnerVerification(operation) {
    const criticalOperations = [
      'export_sensitive_data',
      'import_settings',
      'delete_history',
      'bulk_import',
      'bulk_export'
    ];

    return {
      required: criticalOperations.includes(operation),
      operation
    };
  }

  /**
   * Verify owner for operation
   * @param {string} password - Owner password
   * @returns {Promise<object>} Verification result
   */
  async verifyOwner(password) {
    return await this.ownerVerification.verifyOwner(password);
  }

  /**
   * Log operation
   * @param {string} operation - Operation type
   * @param {string} module - Module
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @param {object} details - Additional details
   */
  logOperation(operation, module, userRole, userId, details = {}) {
    // This would integrate with the Security Event Manager
    console.log(`[ExportImportSecurity] ${operation} on ${module} by ${userRole} (${userId})`, details);
  }

  /**
   * Get user permissions for export/import
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {object} User permissions
   */
  getUserPermissions(userRole, userId) {
    const permissions = this.permissionEngine.getUserPermissions(userId, userRole);
    
    return {
      canExport: permissions.includes('export_data'),
      canImport: permissions.includes('import_data'),
      canDeleteHistory: permissions.includes('manage_security'),
      canExportSensitive: permissions.includes('manage_security'),
      canImportSettings: permissions.includes('manage_security'),
      allPermissions: permissions
    };
  }
}

// Singleton instance
let exportImportSecurityInstance = null;

/**
 * Get the singleton export/import security instance
 * @returns {ExportImportSecurity} Export/import security instance
 */
export function getExportImportSecurity() {
  if (!exportImportSecurityInstance) {
    exportImportSecurityInstance = new ExportImportSecurity();
  }
  return exportImportSecurityInstance;
}

export default ExportImportSecurity;
