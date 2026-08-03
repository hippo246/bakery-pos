// Restore Interface
// Base interface for all restore operations

import { RestoreType, RestoreStatus, RestoreHealth, _CompatibilityStatus, _VerificationStatus } from './RestoreTypes.js';

/**
 * Base Restore Interface
 * All restore implementations must extend this interface
 */
export class RestoreInterface {
  constructor(config = {}) {
    this.restoreId = config.restoreId || null;
    this.backupId = config.backupId || null;
    this.type = config.type || RestoreType.FULL;
    this.modules = config.modules || [];
    this.status = RestoreStatus.PENDING;
    this.health = RestoreHealth.UNKNOWN;
    this.startedAt = config.startedAt || null;
    this.completedAt = config.completedAt || null;
    this.duration = config.duration || 0;
    this.operator = config.operator || 'system';
    this.safetyBackupId = config.safetyBackupId || null;
    this.rollbackAvailable = false;
    this.rollbackId = config.rollbackId || null;
    this.compatibility = config.compatibility || null;
    this.verification = config.verification || null;
    this.conflicts = config.conflicts || [];
    this.error = config.error || null;
    this.dryRun = config.dryRun || false;
    this.createSafetyBackup = config.createSafetyBackup !== false;
    this.verifyAfterRestore = config.verifyAfterRestore !== false;
    this.progress = {
      currentStep: 'initializing',
      percentage: 0,
      message: 'Initializing restore...',
      details: {}
    };
  }

  /**
   * Initialize the restore
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Start the restore process
   * @returns {Promise<object>} Restore result
   */
  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  /**
   * Cancel the restore process
   * @returns {Promise<object>} Cancellation result
   */
  async cancel() {
    throw new Error('cancel() must be implemented by subclass');
  }

  /**
   * Get restore progress
   * @returns {object} Progress information
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Check compatibility with current system
   * @returns {Promise<object>} Compatibility check result
   */
  async checkCompatibility() {
    throw new Error('checkCompatibility() must be implemented by subclass');
  }

  /**
   * Verify backup integrity before restore
   * @returns {Promise<object>} Verification result
   */
  async verifyIntegrity() {
    throw new Error('verifyIntegrity() must be implemented by subclass');
  }

  /**
   * Preview restore changes
   * @returns {Promise<object>} Preview result
   */
  async previewChanges() {
    throw new Error('previewChanges() must be implemented by subclass');
  }

  /**
   * Create safety backup before restore
   * @returns {Promise<object>} Safety backup result
   */
  async createSafetyBackup() {
    throw new Error('createSafetyBackup() must be implemented by subclass');
  }

  /**
   * Execute the restore
   * @returns {Promise<object>} Restore result
   */
  async executeRestore() {
    throw new Error('executeRestore() must be implemented by subclass');
  }

  /**
   * Verify restore after completion
   * @returns {Promise<object>} Verification result
   */
  async verifyRestore() {
    throw new Error('verifyRestore() must be implemented by subclass');
  }

  /**
   * Rollback to safety backup
   * @returns {Promise<object>} Rollback result
   */
  async rollback() {
    throw new Error('rollback() must be implemented by subclass');
  }

  /**
   * Detect conflicts
   * @returns {Promise<object>} Conflict detection result
   */
  async detectConflicts() {
    throw new Error('detectConflicts() must be implemented by subclass');
  }

  /**
   * Get restore metadata
   * @returns {object} Restore metadata
   */
  getMetadata() {
    return {
      restoreId: this.restoreId,
      backupId: this.backupId,
      type: this.type,
      status: this.status,
      health: this.health,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      modules: this.modules,
      operator: this.operator,
      safetyBackupId: this.safetyBackupId,
      rollbackAvailable: this.rollbackAvailable,
      rollbackId: this.rollbackId,
      compatibility: this.compatibility,
      verification: this.verification,
      conflicts: this.conflicts,
      error: this.error,
      dryRun: this.dryRun
    };
  }

  /**
   * Update restore status
   * @param {RestoreStatus} status - New status
   */
  setStatus(status) {
    this.status = status;
  }

  /**
   * Update restore health
   * @param {RestoreHealth} health - New health status
   */
  setHealth(health) {
    this.health = health;
  }

  /**
   * Set error information
   * @param {string} error - Error message
   */
  setError(error) {
    this.error = error;
  }

  /**
   * Add conflict
   * @param {object} conflict - Conflict object
   */
  addConflict(conflict) {
    this.conflicts.push(conflict);
  }

  /**
   * Update progress
   * @param {string} step - Current step
   * @param {number} percentage - Progress percentage
   * @param {string} message - Progress message
   * @param {object} details - Additional details
   */
  updateProgress(step, percentage, message, details = {}) {
    this.progress = {
      currentStep: step,
      percentage,
      message,
      details
    };
  }

  /**
   * Generate a unique restore ID
   * @returns {string} Restore ID
   */
  generateRestoreId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `restore_${timestamp}_${random}`;
  }
}
