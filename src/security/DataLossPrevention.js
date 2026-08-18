// Data Loss Prevention
// Prevents accidental data loss through confirmation and validation

import { SecurityInterface } from './SecurityInterface.js';
import { SecurityStatus } from './SecurityTypes.js';
import { getSecurityEventManager } from './SecurityEventManager.js';

export class DataLossPrevention extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.preventionRules = new Map();
    this.blockedOperations = new Map();
    this.storageKey = 'cafeos_dlp';
    this.loadState();
    this.initializeDefaultRules();
  }

  /**
   * Initialize the data loss prevention system
   */
  async initialize() {
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Initialize default prevention rules
   */
  initializeDefaultRules() {
    // Prevent accidental provider removal
    this.preventionRules.set('remove_provider', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Removing a cloud provider will disable all cloud operations. This action cannot be undone.',
      blockIfLastProvider: true
    });

    // Prevent deleting last backup
    this.preventionRules.set('delete_backup', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Deleting a backup is permanent. This action cannot be undone.',
      blockIfLastBackup: true
    });

    // Prevent disabling encryption without confirmation
    this.preventionRules.set('disable_encryption', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Disabling encryption will expose sensitive data. This action is not recommended.',
      requiresMultipleConfirmations: true
    });

    // Prevent restoring unsupported backups
    this.preventionRules.set('restore_unsupported', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Restoring an unsupported backup may cause data corruption or loss.',
      blockIfUnsupported: true
    });

    // Prevent exporting restricted information
    this.preventionRules.set('export_restricted', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Exporting restricted information may expose sensitive data.',
      blockIfRestricted: true
    });

    // Prevent overwriting critical configuration
    this.preventionRules.set('overwrite_config', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Overwriting critical configuration may cause system instability.',
      blockIfCritical: true
    });

    // Prevent credential rotation without backup
    this.preventionRules.set('rotate_credentials', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Rotating credentials may interrupt cloud operations. Ensure you have a backup.',
      requiresBackup: true
    });

    // Prevent switching providers without backup
    this.preventionRules.set('switch_provider', {
      requiresConfirmation: true,
      requiresOwnerAuth: true,
      warningMessage: 'Switching providers may interrupt cloud operations. Ensure you have a backup.',
      requiresBackup: true
    });
  }

  /**
   * Check if an operation requires prevention
   * @param {string} operation - Operation to check
   * @param {object} context - Operation context
   * @returns {object} Prevention check result
   */
  checkOperation(operation, context = {}) {
    const rule = this.preventionRules.get(operation);
    
    if (!rule) {
      return { allowed: true, requiresConfirmation: false, requiresOwnerAuth: false };
    }

    const checks = {
      allowed: true,
      requiresConfirmation: rule.requiresConfirmation || false,
      requiresOwnerAuth: rule.requiresOwnerAuth || false,
      warningMessage: rule.warningMessage || '',
      blocked: false,
      blockReason: null
    };

    // Check if last provider
    if (rule.blockIfLastProvider && context.isLastProvider) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Cannot remove the last cloud provider';
    }

    // Check if last backup
    if (rule.blockIfLastBackup && context.isLastBackup) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Cannot delete the last backup';
    }

    // Check if unsupported
    if (rule.blockIfUnsupported && context.isUnsupported) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Cannot restore unsupported backup';
    }

    // Check if restricted
    if (rule.blockIfRestricted && context.isRestricted) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Cannot export restricted information';
    }

    // Check if critical
    if (rule.blockIfCritical && context.isCritical) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Cannot overwrite critical configuration';
    }

    // Check if backup exists
    if (rule.requiresBackup && !context.hasBackup) {
      checks.allowed = false;
      checks.blocked = true;
      checks.blockReason = 'Backup required before this operation';
    }

    // Log blocked operation
    if (checks.blocked) {
      this.logBlockedOperation(operation, context, checks.blockReason);
    }

    return checks;
  }

  /**
   * Log a blocked operation
   * @param {string} operation - Blocked operation
   * @param {object} context - Operation context
   * @param {string} reason - Block reason
   */
  logBlockedOperation(operation, context, reason) {
    const securityEventManager = getSecurityEventManager();
    securityEventManager.logDataLossPrevented(operation, reason);

    this.blockedOperations.set(operation, {
      timestamp: new Date().toISOString(),
      context,
      reason
    });
  }

  /**
   * Confirm an operation
   * @param {string} operation - Operation to confirm
   * @param {string} confirmationId - Confirmation ID
   * @returns {object} Confirmation result
   */
  confirmOperation(operation, _confirmationId) {
    const rule = this.preventionRules.get(operation);
    
    if (!rule) {
      return { success: true };
    }

    // Check if multiple confirmations required
    if (rule.requiresMultipleConfirmations) {
      // This would be handled by the UI with multiple confirmation dialogs
      return { success: true, requiresMultipleConfirmations: true };
    }

    return { success: true };
  }

  /**
   * Add a custom prevention rule
   * @param {string} operation - Operation name
   * @param {object} rule - Rule configuration
   * @returns {object} Add result
   */
  addRule(operation, rule) {
    this.preventionRules.set(operation, {
      requiresConfirmation: rule.requiresConfirmation || false,
      requiresOwnerAuth: rule.requiresOwnerAuth || false,
      warningMessage: rule.warningMessage || '',
      ...rule
    });
    this.saveState();
    return { success: true, operation };
  }

  /**
   * Remove a prevention rule
   * @param {string} operation - Operation name
   * @returns {object} Remove result
   */
  removeRule(operation) {
    const deleted = this.preventionRules.delete(operation);
    this.saveState();
    return { success: deleted, operation };
  }

  /**
   * Get all prevention rules
   * @returns {object} All rules
   */
  getRules() {
    return Object.fromEntries(this.preventionRules);
  }

  /**
   * Get blocked operations history
   * @returns {Array} Blocked operations
   */
  getBlockedOperations() {
    return Array.from(this.blockedOperations.entries()).map(([operation, data]) => ({
      operation,
      ...data
    }));
  }

  /**
   * Clear blocked operations history
   */
  clearBlockedOperations() {
    this.blockedOperations.clear();
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (this.preventionRules.size === 0) {
      return { valid: false, reason: 'No prevention rules defined' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    // Deduct if no rules
    if (this.preventionRules.size === 0) {
      score -= 30;
    }

    // Deduct for high block rate
    const blockedCount = this.blockedOperations.size;
    if (blockedCount > 10) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.preventionRules.size === 0) {
      recommendations.push({
        level: 'warning',
        message: 'No data loss prevention rules defined',
        action: 'Define prevention rules for critical operations'
      });
    }

    const blockedCount = this.blockedOperations.size;
    if (blockedCount > 10) {
      recommendations.push({
        level: 'warning',
        message: 'High number of blocked operations',
        action: 'Review blocked operations and adjust rules if needed'
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
        preventionRules: Array.from(this.preventionRules.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save DLP state:', error);
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
        this.preventionRules = new Map(parsed.preventionRules || []);
      }
    } catch (error) {
      console.error('Failed to load DLP state:', error);
      this.preventionRules = new Map();
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.preventionRules.clear();
    this.blockedOperations.clear();
    localStorage.removeItem(this.storageKey);
    this.initializeDefaultRules();
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the data loss prevention system
   */
  async destroy() {
    await this.reset();
    console.log('[DataLossPrevention] Destroyed');
  }
}

// Singleton instance
let dlpInstance = null;

/**
 * Get the singleton data loss prevention instance
 * @returns {DataLossPrevention} DLP instance
 */
export function getDataLossPrevention() {
  if (!dlpInstance) {
    dlpInstance = new DataLossPrevention();
  }
  return dlpInstance;
}

export default DataLossPrevention;
