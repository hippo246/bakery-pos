// Integrity Verifier
// Data integrity verification with checksums and hash validation

import { SecurityInterface } from './SecurityInterface.js';
import { IntegrityStatus, SecurityStatus } from './SecurityTypes.js';

export class IntegrityVerifier extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.integrityRecords = new Map();
    this.hashAlgorithm = 'SHA-256';
    this.storageKey = 'cafeos_integrity_verifier';
    this.loadState();
  }

  /**
   * Initialize the integrity verifier
   */
  async initialize() {
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Generate checksum for data
   * @param {string|object} data - Data to checksum
   * @returns {Promise<string>} Checksum
   */
  async generateChecksum(data) {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest(this.hashAlgorithm, dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum generation failed:', error);
      return null;
    }
  }

  /**
   * Generate integrity record for data
   * @param {string} id - Data ID
   * @param {string} type - Data type
   * @param {string|object} data - Data
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Integrity record
   */
  async generateIntegrityRecord(id, type, data, metadata = {}) {
    const checksum = await this.generateChecksum(data);
    const timestamp = new Date().toISOString();

    const record = {
      id,
      type,
      checksum,
      algorithm: this.hashAlgorithm,
      size: typeof data === 'string' ? data.length : JSON.stringify(data).length,
      createdAt: timestamp,
      lastVerified: timestamp,
      metadata
    };

    this.integrityRecords.set(id, record);
    this.saveState();

    return record;
  }

  /**
   * Verify integrity of data
   * @param {string} id - Data ID
   * @param {string|object} data - Data to verify
   * @returns {Promise<object>} Verification result
   */
  async verifyIntegrity(id, data) {
    const record = this.integrityRecords.get(id);
    
    if (!record) {
      return { 
        status: IntegrityStatus.UNKNOWN, 
        valid: false, 
        reason: 'No integrity record found' 
      };
    }

    const currentChecksum = await this.generateChecksum(data);
    
    if (!currentChecksum) {
      return { 
        status: IntegrityStatus.FAILED, 
        valid: false, 
        reason: 'Checksum generation failed' 
      };
    }

    const isValid = currentChecksum === record.checksum;
    const timestamp = new Date().toISOString();

    // Update last verified timestamp
    record.lastVerified = timestamp;
    record.verificationCount = (record.verificationCount || 0) + 1;
    this.integrityRecords.set(id, record);
    this.saveState();

    return {
      status: isValid ? IntegrityStatus.VERIFIED : IntegrityStatus.FAILED,
      valid: isValid,
      expectedChecksum: record.checksum,
      actualChecksum: currentChecksum,
      verifiedAt: timestamp
    };
  }

  /**
   * Get integrity record
   * @param {string} id - Data ID
   * @returns {object|null} Integrity record
   */
  getIntegrityRecord(id) {
    return this.integrityRecords.get(id) || null;
  }

  /**
   * Get integrity records by type
   * @param {string} type - Data type
   * @returns {Array} Integrity records
   */
  getIntegrityRecordsByType(type) {
    const records = [];
    for (const [_id, record] of this.integrityRecords) {
      if (record.type === type) {
        records.push(record);
      }
    }
    return records;
  }

  /**
   * Delete integrity record
   * @param {string} id - Data ID
   * @returns {object} Deletion result
   */
  deleteIntegrityRecord(id) {
    const deleted = this.integrityRecords.delete(id);
    this.saveState();
    return { success: deleted, id };
  }

  /**
   * Verify all integrity records
   * @param {object} dataProvider - Function to get data by ID
   * @returns {Promise<object>} Verification result
   */
  async verifyAll(dataProvider) {
    const results = {
      total: this.integrityRecords.size,
      verified: 0,
      failed: 0,
      pending: 0,
      errors: []
    };

    for (const [id, record] of this.integrityRecords) {
      try {
        const data = await dataProvider(id);
        if (data === null || data === undefined) {
          results.pending++;
          continue;
        }

        const verification = await this.verifyIntegrity(id, data);
        
        if (verification.valid) {
          results.verified++;
        } else {
          results.failed++;
          results.errors.push({
            id,
            type: record.type,
            error: 'Checksum mismatch'
          });
        }
      } catch (error) {
        results.errors.push({
          id,
          type: record.type,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Detect tampering
   * @param {object} dataProvider - Function to get data by ID
   * @returns {Promise<Array>} Tampered records
   */
  async detectTampering(dataProvider) {
    const tampered = [];

    for (const [id, record] of this.integrityRecords) {
      try {
        const data = await dataProvider(id);
        if (data === null || data === undefined) {
          continue;
        }

        const verification = await this.verifyIntegrity(id, data);
        
        if (!verification.valid) {
          tampered.push({
            id,
            type: record.type,
            expectedChecksum: verification.expectedChecksum,
            actualChecksum: verification.actualChecksum,
            lastVerified: record.lastVerified
          });
        }
      } catch (_error) {
        // Skip data that can't be retrieved
      }
    }

    return tampered;
  }

  /**
   * Get integrity statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const records = Array.from(this.integrityRecords.values());
    const total = records.length;

    const byType = {};
    records.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    const totalSize = records.reduce((sum, r) => sum + (r.size || 0), 0);

    const recentlyVerified = records.filter(r => {
      const lastVerified = new Date(r.lastVerified);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return lastVerified > oneDayAgo;
    }).length;

    return {
      total,
      byType,
      totalSize,
      recentlyVerified,
      verificationRate: total > 0 ? (recentlyVerified / total) * 100 : 0
    };
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (!this.hashAlgorithm) {
      return { valid: false, reason: 'Hash algorithm not specified' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    const stats = this.getStatistics();
    
    // Deduct for low verification rate
    if (stats.total > 10 && stats.verificationRate < 50) {
      score -= 15;
    }

    // Deduct if no records
    if (stats.total === 0) {
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

    const stats = this.getStatistics();
    
    if (stats.total === 0) {
      recommendations.push({
        level: 'warning',
        message: 'No integrity records found',
        action: 'Generate integrity records for sensitive data'
      });
    }

    if (stats.total > 10 && stats.verificationRate < 50) {
      recommendations.push({
        level: 'warning',
        message: 'Low integrity verification rate',
        action: 'Run integrity verification regularly'
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
        integrityRecords: Array.from(this.integrityRecords.entries()),
        hashAlgorithm: this.hashAlgorithm
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save integrity verifier state:', error);
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
        this.integrityRecords = new Map(parsed.integrityRecords || []);
        this.hashAlgorithm = parsed.hashAlgorithm || 'SHA-256';
      }
    } catch (error) {
      console.error('Failed to load integrity verifier state:', error);
      this.integrityRecords = new Map();
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.integrityRecords.clear();
    localStorage.removeItem(this.storageKey);
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the integrity verifier
   */
  async destroy() {
    await this.reset();
    console.log('[IntegrityVerifier] Destroyed');
  }
}

// Singleton instance
let integrityVerifierInstance = null;

/**
 * Get the singleton integrity verifier instance
 * @returns {IntegrityVerifier} Integrity verifier instance
 */
export function getIntegrityVerifier() {
  if (!integrityVerifierInstance) {
    integrityVerifierInstance = new IntegrityVerifier();
  }
  return integrityVerifierInstance;
}

export default IntegrityVerifier;
