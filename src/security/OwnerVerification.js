// Owner Verification
// Owner authentication for critical operations

import { SecurityInterface } from './SecurityInterface.js';
import { SecurityStatus } from './SecurityTypes.js';
import { verifyOwnerPassword, setOwnerAuthenticated, isOwnerAuthenticated } from '../utils/setupSecurity.js';

export class OwnerVerification extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.verificationHistory = [];
    this.maxHistorySize = 100;
    this.confirmationTimeout = config.confirmationTimeout || 5 * 60 * 1000; // 5 minutes
    this.pendingVerifications = new Map();
    this.storageKey = 'cafeos_owner_verification';
    this.loadState();
  }

  /**
   * Initialize the owner verification system
   */
  async initialize() {
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Critical operations that require owner verification
   */
  static CriticalOperations = {
    ADD_PROVIDER: 'add_provider',
    REMOVE_PROVIDER: 'remove_provider',
    CHANGE_CREDENTIALS: 'change_credentials',
    SWITCH_PROVIDER: 'switch_provider',
    RUN_RESTORE: 'run_restore',
    DELETE_BACKUP: 'delete_backup',
    CHANGE_ENCRYPTION: 'change_encryption',
    EXPORT_SENSITIVE_DATA: 'export_sensitive_data',
    IMPORT_SENSITIVE_DATA: 'import_sensitive_data',
    RESET_SECURITY_SETTINGS: 'reset_security_settings',
    MANAGE_POLICIES: 'manage_policies',
    ROTATE_CREDENTIALS: 'rotate_credentials'
  };

  /**
   * Check if operation requires owner verification
   * @param {string} operation - Operation to check
   * @returns {boolean} Whether verification is required
   */
  requiresVerification(operation) {
    return Object.values(OwnerVerification.CriticalOperations).includes(operation);
  }

  /**
   * Request owner verification for an operation
   * @param {string} operation - Operation requiring verification
   * @param {object} context - Operation context
   * @returns {object} Verification request result
   */
  requestVerification(operation, context = {}) {
    const verificationId = this.generateVerificationId();
    
    const verification = {
      verificationId,
      operation,
      context,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.confirmationTimeout).toISOString(),
      status: 'pending',
      confirmed: false
    };

    this.pendingVerifications.set(verificationId, verification);
    this.saveState();

    return { success: true, verificationId, expiresAt: verification.expiresAt };
  }

  /**
   * Verify owner password
   * @param {string} password - Owner password
   * @param {string} verificationId - Verification ID (optional)
   * @returns {Promise<object>} Verification result
   */
  async verifyOwner(password, verificationId = null) {
    const isValid = await verifyOwnerPassword(password);

    if (!isValid) {
      this.logVerification('failed', verificationId, { reason: 'Invalid password' });
      return { success: false, reason: 'Invalid password' };
    }

    setOwnerAuthenticated(true);

    if (verificationId) {
      const verification = this.pendingVerifications.get(verificationId);
      if (verification) {
        verification.status = 'confirmed';
        verification.confirmed = true;
        verification.confirmedAt = new Date().toISOString();
        this.pendingVerifications.set(verificationId, verification);
      }
    }

    this.logVerification('success', verificationId);
    this.saveState();

    return { success: true };
  }

  /**
   * Check if owner is currently authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return isOwnerAuthenticated();
  }

  /**
   * Require owner authentication for an operation
   * @param {string} operation - Operation to check
   * @returns {object} Authentication result
   */
  requireAuthentication(operation) {
    if (!this.requiresVerification(operation)) {
      return { required: false, authenticated: true };
    }

    if (this.isAuthenticated()) {
      return { required: true, authenticated: true };
    }

    return { required: true, authenticated: false };
  }

  /**
   * Confirm an operation after verification
   * @param {string} verificationId - Verification ID
   * @param {object} confirmation - Confirmation details
   * @returns {object} Confirmation result
   */
  confirmOperation(verificationId, confirmation = {}) {
    const verification = this.pendingVerifications.get(verificationId);
    
    if (!verification) {
      return { success: false, reason: 'Verification not found' };
    }

    if (verification.status !== 'pending') {
      return { success: false, reason: 'Verification already processed' };
    }

    if (new Date(verification.expiresAt) < new Date()) {
      return { success: false, reason: 'Verification expired' };
    }

    verification.status = 'confirmed';
    verification.confirmed = true;
    verification.confirmedAt = new Date().toISOString();
    verification.confirmation = confirmation;

    this.pendingVerifications.set(verificationId, verification);
    this.logVerification('confirmed', verificationId, confirmation);
    this.saveState();

    return { success: true, verificationId };
  }

  /**
   * Cancel a pending verification
   * @param {string} verificationId - Verification ID
   * @returns {object} Cancellation result
   */
  cancelVerification(verificationId) {
    const verification = this.pendingVerifications.get(verificationId);
    
    if (!verification) {
      return { success: false, reason: 'Verification not found' };
    }

    verification.status = 'cancelled';
    verification.cancelledAt = new Date().toISOString();

    this.pendingVerifications.set(verificationId, verification);
    this.logVerification('cancelled', verificationId);
    this.saveState();

    return { success: true, verificationId };
  }

  /**
   * Get pending verification
   * @param {string} verificationId - Verification ID
   * @returns {object|null} Verification
   */
  getVerification(verificationId) {
    return this.pendingVerifications.get(verificationId) || null;
  }

  /**
   * Get all pending verifications
   * @returns {Array} Pending verifications
   */
  getPendingVerifications() {
    const now = new Date();
    const pending = [];

    for (const [_id, verification] of this.pendingVerifications) {
      if (verification.status === 'pending' && new Date(verification.expiresAt) > now) {
        pending.push(verification);
      }
    }

    return pending;
  }

  /**
   * Clean up expired verifications
   */
  cleanupExpiredVerifications() {
    const now = new Date();
    const expired = [];

    for (const [id, verification] of this.pendingVerifications) {
      if (verification.status === 'pending' && new Date(verification.expiresAt) < now) {
        verification.status = 'expired';
        verification.expiredAt = now.toISOString();
        this.pendingVerifications.set(id, verification);
        expired.push(id);
      }
    }

    if (expired.length > 0) {
      this.saveState();
    }

    return expired.length;
  }

  /**
   * Log verification attempt
   * @param {string} result - Verification result
   * @param {string} verificationId - Verification ID
   * @param {object} details - Additional details
   */
  logVerification(result, verificationId, details = {}) {
    this.verificationHistory.push({
      timestamp: new Date().toISOString(),
      result,
      verificationId,
      details
    });

    this.trimHistory();
  }

  /**
   * Trim history to max size
   */
  trimHistory() {
    if (this.verificationHistory.length > this.maxHistorySize) {
      this.verificationHistory = this.verificationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get verification history
   * @param {object} filters - Optional filters
   * @returns {Array} Verification history
   */
  getVerificationHistory(filters = {}) {
    let history = [...this.verificationHistory];

    if (filters.result) {
      history = history.filter(entry => entry.result === filters.result);
    }

    if (filters.since) {
      history = history.filter(entry => new Date(entry.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Get verification statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const total = this.verificationHistory.length;
    const successful = this.verificationHistory.filter(e => e.result === 'success' || e.result === 'confirmed').length;
    const failed = this.verificationHistory.filter(e => e.result === 'failed').length;
    const cancelled = this.verificationHistory.filter(e => e.result === 'cancelled').length;

    const byOperation = {};
    this.verificationHistory.forEach(entry => {
      const operation = entry.details?.operation || 'unknown';
      byOperation[operation] = (byOperation[operation] || 0) + 1;
    });

    return {
      total,
      successful,
      failed,
      cancelled,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byOperation,
      pendingCount: this.getPendingVerifications().length
    };
  }

  /**
   * Generate verification ID
   * @returns {string} Verification ID
   */
  generateVerificationId() {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (this.confirmationTimeout < 60000) {
      return { valid: false, reason: 'Confirmation timeout too short (minimum 1 minute)' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    // Deduct for short confirmation timeout
    if (this.confirmationTimeout < 3 * 60 * 1000) {
      score -= 10;
    }

    // Deduct for high failure rate
    const stats = this.getStatistics();
    if (stats.total > 10 && stats.successRate < 80) {
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

    if (this.confirmationTimeout < 3 * 60 * 1000) {
      recommendations.push({
        level: 'warning',
        message: 'Confirmation timeout is less than 3 minutes',
        action: 'Consider increasing confirmation timeout for better security'
      });
    }

    const stats = this.getStatistics();
    if (stats.total > 10 && stats.successRate < 80) {
      recommendations.push({
        level: 'warning',
        message: 'Low verification success rate',
        action: 'Review owner password and verification process'
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
        verificationHistory: this.verificationHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save owner verification state:', error);
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
        this.verificationHistory = parsed.verificationHistory || [];
      }
    } catch (error) {
      console.error('Failed to load owner verification state:', error);
      this.verificationHistory = [];
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.verificationHistory = [];
    this.pendingVerifications.clear();
    localStorage.removeItem(this.storageKey);
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the owner verification system
   */
  async destroy() {
    await this.reset();
    console.log('[OwnerVerification] Destroyed');
  }
}

// Singleton instance
let ownerVerificationInstance = null;

/**
 * Get the singleton owner verification instance
 * @returns {OwnerVerification} Owner verification instance
 */
export function getOwnerVerification() {
  if (!ownerVerificationInstance) {
    ownerVerificationInstance = new OwnerVerification();
  }
  return ownerVerificationInstance;
}

export default OwnerVerification;
