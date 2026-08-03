// Security Interface
// Base interface for all security operations

import { SecurityLevel, SecurityStatus } from './SecurityTypes.js';

/**
 * Base Security Interface
 * All security implementations must extend this interface
 */
export class SecurityInterface {
  constructor(config = {}) {
    this.securityLevel = config.securityLevel || SecurityLevel.MEDIUM;
    this.status = SecurityStatus.UNKNOWN;
    this.enabled = config.enabled !== false;
    this.createdAt = config.createdAt || new Date().toISOString();
    this.lastModified = config.lastModified || new Date().toISOString();
    this.metadata = config.metadata || {};
  }

  /**
   * Initialize the security component
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Check if the security component is enabled
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enable the security component
   * @returns {Promise<object>} Enable result
   */
  async enable() {
    this.enabled = true;
    return { success: true };
  }

  /**
   * Disable the security component
   * @returns {Promise<object>} Disable result
   */
  async disable() {
    this.enabled = false;
    return { success: true };
  }

  /**
   * Get security status
   * @returns {SecurityStatus} Security status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get security level
   * @returns {SecurityLevel} Security level
   */
  getSecurityLevel() {
    return this.securityLevel;
  }

  /**
   * Set security level
   * @param {SecurityLevel} level - Security level
   */
  setSecurityLevel(level) {
    this.securityLevel = level;
    this.lastModified = new Date().toISOString();
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Get metadata
   * @returns {object} Metadata
   */
  getMetadata() {
    return {
      securityLevel: this.securityLevel,
      status: this.status,
      enabled: this.enabled,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      ...this.metadata
    };
  }

  /**
   * Update metadata
   * @param {object} metadata - New metadata
   */
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    this.lastModified = new Date().toISOString();
  }

  /**
   * Check if security check passes
   * @param {object} context - Context for the check
   * @returns {object} Check result
   */
  check(_context = {}) {
    return { success: true, allowed: true };
  }

  /**
   * Perform security operation
   * @param {string} operation - Operation to perform
   * @param {object} data - Operation data
   * @returns {Promise<object>} Operation result
   */
  async performOperation(operation, data = {}) {
    return { success: true, operation, data };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    throw new Error('getSecurityScore() must be implemented by subclass');
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    throw new Error('getRecommendations() must be implemented by subclass');
  }

  /**
   * Reset security component to defaults
   * @returns {Promise<object>} Reset result
   */
  async reset() {
    throw new Error('reset() must be implemented by subclass');
  }

  /**
   * Destroy the security component
   * @returns {Promise<object>} Destroy result
   */
  async destroy() {
    throw new Error('destroy() must be implemented by subclass');
  }
}
