// Data Integrity Verification
// Data integrity verification with checksums, hashes, and tamper detection

import { SecurityInterface } from './SecurityInterface.js';
import { IntegrityStatus, SecurityStatus } from './SecurityTypes.js';

export class DataIntegrity extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.integrityStore = new Map();
    this.algorithm = 'SHA-256';
    this.storageKey = 'cafeos_data_integrity';
    this.enabled = config.enabled !== false;
    this.loadState();
  }

  /**
   * Initialize the data integrity module
   */
  async initialize() {
    this.status = IntegrityStatus.VERIFIED;
    return { success: true };
  }

  /**
   * Calculate hash of data
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hash
   */
  async calculateHash(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest(this.algorithm, dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Hash calculation failed:', error);
      throw error;
    }
  }

  /**
   * Store data with integrity check
   * @param {string} key - Data key
   * @param {any} data - Data to store
   * @returns {Promise<object>} Store result
   */
  async storeWithIntegrity(key, data) {
    try {
      const jsonString = JSON.stringify(data);
      const hash = await this.calculateHash(jsonString);
      const timestamp = new Date().toISOString();

      this.integrityStore.set(key, {
        hash,
        timestamp,
        algorithm: this.algorithm,
        dataSize: jsonString.length
      });

      this.saveState();

      return { success: true, key, hash, timestamp };
    } catch (error) {
      console.error('Failed to store with integrity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify data integrity
   * @param {string} key - Data key
   * @param {any} data - Data to verify
   * @returns {Promise<object>} Verification result
   */
  async verifyIntegrity(key, data) {
    try {
      const integrityRecord = this.integrityStore.get(key);
      
      if (!integrityRecord) {
        return { 
          success: false, 
          status: IntegrityStatus.UNKNOWN,
          reason: 'No integrity record found' 
        };
      }

      const jsonString = JSON.stringify(data);
      const currentHash = await this.calculateHash(jsonString);

      const isValid = currentHash === integrityRecord.hash;

      return {
        success: true,
        status: isValid ? IntegrityStatus.VERIFIED : IntegrityStatus.FAILED,
        valid: isValid,
        expectedHash: integrityRecord.hash,
        actualHash: currentHash,
        timestamp: integrityRecord.timestamp
      };
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return { 
        success: false, 
        status: IntegrityStatus.FAILED,
        error: error.message 
      };
    }
  }

  /**
   * Verify localStorage data integrity
   * @param {string} key - localStorage key
   * @returns {Promise<object>} Verification result
   */
  async verifyLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      
      if (!data) {
        return { 
          success: false, 
          status: IntegrityStatus.UNKNOWN,
          reason: 'Data not found in localStorage' 
        };
      }

      return await this.verifyIntegrity(key, data);
    } catch (error) {
      console.error('localStorage integrity verification failed:', error);
      return { 
        success: false, 
        status: IntegrityStatus.FAILED,
        error: error.message 
      };
    }
  }

  /**
   * Batch verify multiple data items
   * @param {Array} items - Array of {key, data} objects
   * @returns {Promise<object>} Batch verification result
   */
  async batchVerify(items) {
    const results = {};
    let verified = 0;
    let failed = 0;
    let unknown = 0;

    for (const item of items) {
      const result = await this.verifyIntegrity(item.key, item.data);
      results[item.key] = result;

      if (result.status === IntegrityStatus.VERIFIED) {
        verified++;
      } else if (result.status === IntegrityStatus.FAILED) {
        failed++;
      } else {
        unknown++;
      }
    }

    return {
      success: true,
      total: items.length,
      verified,
      failed,
      unknown,
      results
    };
  }

  /**
   * Update integrity record
   * @param {string} key - Data key
   * @param {any} data - New data
   * @returns {Promise<object>} Update result
   */
  async updateIntegrity(key, data) {
    return await this.storeWithIntegrity(key, data);
  }

  /**
   * Remove integrity record
   * @param {string} key - Data key
   * @returns {object} Remove result
   */
  removeIntegrity(key) {
    this.integrityStore.delete(key);
    this.saveState();
    return { success: true, key };
  }

  /**
   * Get integrity record
   * @param {string} key - Data key
   * @returns {object|null} Integrity record
   */
  getIntegrityRecord(key) {
    return this.integrityStore.get(key) || null;
  }

  /**
   * Get all integrity records
   * @returns {Array} All integrity records
   */
  getAllRecords() {
    return Array.from(this.integrityStore.entries()).map(([key, record]) => ({
      key,
      ...record
    }));
  }

  /**
   * Check for tampered data
   * @returns {Promise<Array>} List of tampered keys
   */
  async checkForTampering() {
    const tampered = [];

    for (const [key, record] of this.integrityStore) {
      const data = localStorage.getItem(key);
      
      if (data) {
        const verification = await this.verifyIntegrity(key, data);
        if (verification.status === IntegrityStatus.FAILED) {
          tampered.push({
            key,
            expectedHash: verification.expectedHash,
            actualHash: verification.actualHash,
            timestamp: record.timestamp
          });
        }
      }
    }

    return tampered;
  }

  /**
   * Get integrity statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const records = Array.from(this.integrityStore.values());
    const total = records.length;

    const byAlgorithm = {};
    records.forEach(r => {
      byAlgorithm[r.algorithm] = (byAlgorithm[r.algorithm] || 0) + 1;
    });

    const totalSize = records.reduce((sum, r) => sum + (r.dataSize || 0), 0);

    return {
      total,
      byAlgorithm,
      totalSize,
      enabled: this.enabled
    };
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (!crypto.subtle) {
      return { valid: false, reason: 'Web Crypto API not available' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    if (!this.enabled) {
      score -= 50;
    }

    const stats = this.getStatistics();
    if (stats.total === 0) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.enabled) {
      recommendations.push({
        level: 'critical',
        message: 'Data integrity verification is disabled',
        action: 'Enable data integrity verification to detect tampering'
      });
    }

    const stats = this.getStatistics();
    if (stats.total === 0) {
      recommendations.push({
        level: 'warning',
        message: 'No integrity records found',
        action: 'Start storing data with integrity checks'
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
        integrityStore: Array.from(this.integrityStore.entries()),
        enabled: this.enabled,
        algorithm: this.algorithm
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save data integrity state:', error);
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
        this.integrityStore = new Map(parsed.integrityStore || []);
        this.enabled = parsed.enabled !== false;
        this.algorithm = parsed.algorithm || 'SHA-256';
      }
    } catch (error) {
      console.error('Failed to load data integrity state:', error);
      this.integrityStore = new Map();
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.integrityStore.clear();
    localStorage.removeItem(this.storageKey);
    this.status = IntegrityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the data integrity module
   */
  async destroy() {
    await this.reset();
    console.log('[DataIntegrity] Destroyed');
  }
}

// Singleton instance
let dataIntegrityInstance = null;

/**
 * Get the singleton data integrity instance
 * @returns {DataIntegrity} Data integrity instance
 */
export function getDataIntegrity() {
  if (!dataIntegrityInstance) {
    dataIntegrityInstance = new DataIntegrity();
  }
  return dataIntegrityInstance;
}

export default DataIntegrity;
