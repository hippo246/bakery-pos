// Version Tracker
// Tracks version information for synchronized objects

import { _VersionInfo } from './SyncTypes.js';

export class VersionTracker {
  constructor() {
    this.versions = new Map();
    this.versionHistory = [];
    this.maxHistorySize = 500;
    this.storageKey = 'cafeos_version_tracker';
    this.loadState();
  }

  /**
   * Create version info for an object
   * @param {string} objectId - Object ID
   * @param {object} data - Object data
   * @param {string} operator - Operator who made the change
   * @returns {object} Version info
   */
  async createVersion(objectId, data, operator = 'system') {
    const deviceId = this.getDeviceId();
    const checksum = await this.calculateChecksum(data);

    const versionInfo = {
      objectId,
      version: this.getNextVersion(objectId),
      revision: this.getNextRevision(objectId),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      deviceId,
      operator,
      checksum,
      previousVersion: this.getLatestVersion(objectId)
    };

    this.versions.set(`${objectId}_${versionInfo.version}`, versionInfo);
    this.addToHistory(versionInfo);
    this.saveState();

    return versionInfo;
  }

  /**
   * Update version info for an object
   * @param {string} objectId - Object ID
   * @param {object} data - Object data
   * @param {string} operator - Operator who made the change
   * @returns {object} Updated version info
   */
  async updateVersion(objectId, data, operator = 'system') {
    const deviceId = this.getDeviceId();
    const checksum = await this.calculateChecksum(data);

    const latestVersion = this.getLatestVersion(objectId);
    const currentVersion = latestVersion?.version || 0;
    const currentRevision = latestVersion?.revision || 0;

    const versionInfo = {
      objectId,
      version: currentVersion + 1,
      revision: currentRevision + 1,
      createdAt: latestVersion?.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      deviceId,
      operator,
      checksum,
      previousVersion: latestVersion
    };

    this.versions.set(`${objectId}_${versionInfo.version}`, versionInfo);
    this.addToHistory(versionInfo);
    this.saveState();

    return versionInfo;
  }

  /**
   * Get version info for an object
   * @param {string} objectId - Object ID
   * @param {number} version - Version number (optional, defaults to latest)
   * @returns {object|null} Version info
   */
  getVersion(objectId, version = null) {
    if (version === null) {
      return this.getLatestVersion(objectId);
    }

    return this.versions.get(`${objectId}_${version}`) || null;
  }

  /**
   * Get latest version info for an object
   * @param {string} objectId - Object ID
   * @returns {object|null} Latest version info
   */
  getLatestVersion(objectId) {
    const objectVersions = this.getVersionsForObject(objectId);
    if (objectVersions.length === 0) {
      return null;
    }

    return objectVersions.reduce((latest, current) => 
      current.version > latest.version ? current : latest
    );
  }

  /**
   * Get all versions for an object
   * @param {string} objectId - Object ID
   * @returns {Array} All versions for the object
   */
  getVersionsForObject(objectId) {
    const versions = [];
    for (const [key, versionInfo] of this.versions) {
      if (key.startsWith(`${objectId}_`)) {
        versions.push(versionInfo);
      }
    }

    // Sort by version number descending
    versions.sort((a, b) => b.version - a.version);

    return versions;
  }

  /**
   * Get version history for an object
   * @param {string} objectId - Object ID
   * @param {object} filters - Optional filters
   * @returns {Array} Version history
   */
  getVersionHistory(objectId, filters = {}) {
    let history = this.versionHistory.filter(v => v.objectId === objectId);

    if (filters.since) {
      history = history.filter(v => new Date(v.modifiedAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by modification date descending
    history.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

    return history;
  }

  /**
   * Compare two versions
   * @param {object} version1 - First version
   * @param {object} version2 - Second version
   * @returns {object} Comparison result
   */
  compareVersions(version1, version2) {
    if (!version1 || !version2) {
      return { equal: false, newer: null, difference: null };
    }

    if (version1.version === version2.version) {
      return { equal: true, newer: null, difference: 0 };
    }

    const newer = version1.version > version2.version ? version1 : version2;
    const difference = Math.abs(version1.version - version2.version);

    return {
      equal: false,
      newer,
      difference,
      version1: version1.version,
      version2: version2.version
    };
  }

  /**
   * Check if versions are compatible
   * @param {object} localVersion - Local version
   * @param {object} cloudVersion - Cloud version
   * @returns {object} Compatibility result
   */
  checkCompatibility(localVersion, cloudVersion) {
    if (!localVersion || !cloudVersion) {
      return { compatible: false, reason: 'Missing version information' };
    }

    // Check checksums
    if (localVersion.checksum === cloudVersion.checksum) {
      return { compatible: true, reason: 'Identical data', identical: true };
    }

    // Check version difference
    const versionDiff = Math.abs(localVersion.version - cloudVersion.version);

    if (versionDiff === 0) {
      // Same version but different checksum - data corruption or simultaneous edit
      return { 
        compatible: false, 
        reason: 'Same version but different checksum - possible conflict',
        conflict: true
      };
    }

    if (versionDiff === 1) {
      // Adjacent versions - usually compatible
      return { compatible: true, reason: 'Adjacent versions', versionDiff };
    }

    if (versionDiff > 5) {
      // Large version difference - may need special handling
      return { 
        compatible: false, 
        reason: 'Large version difference',
        versionDiff,
        requiresManualReview: true
      };
    }

    // Small version difference - compatible
    return { compatible: true, reason: 'Small version difference', versionDiff };
  }

  /**
   * Rollback to a previous version
   * @param {string} objectId - Object ID
   * @param {number} targetVersion - Target version
   * @returns {object|null} Target version info
   */
  rollbackToVersion(objectId, targetVersion) {
    const targetVersionInfo = this.getVersion(objectId, targetVersion);
    
    if (!targetVersionInfo) {
      return null;
    }

    // Create a new version based on the target version
    const newVersionInfo = {
      ...targetVersionInfo,
      version: this.getNextVersion(objectId),
      revision: this.getNextRevision(objectId),
      modifiedAt: new Date().toISOString(),
      previousVersion: this.getLatestVersion(objectId),
      rollbackFrom: targetVersion,
      isRollback: true
    };

    this.versions.set(`${objectId}_${newVersionInfo.version}`, newVersionInfo);
    this.addToHistory(newVersionInfo);
    this.saveState();

    return newVersionInfo;
  }

  /**
   * Get next version number for an object
   * @param {string} objectId - Object ID
   * @returns {number} Next version number
   */
  getNextVersion(objectId) {
    const latest = this.getLatestVersion(objectId);
    return (latest?.version || 0) + 1;
  }

  /**
   * Get next revision number for an object
   * @param {string} objectId - Object ID
   * @returns {number} Next revision number
   */
  getNextRevision(objectId) {
    const latest = this.getLatestVersion(objectId);
    return (latest?.revision || 0) + 1;
  }

  /**
   * Calculate checksum for data
   * @param {object} data - Data to checksum
   * @returns {Promise<string>} Checksum
   */
  async calculateChecksum(data) {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Get device ID
   * @returns {string} Device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('cafeos_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('cafeos_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Add to version history
   * @param {object} versionInfo - Version info
   */
  addToHistory(versionInfo) {
    this.versionHistory.push(versionInfo);

    // Trim history if it exceeds max size
    if (this.versionHistory.length > this.maxHistorySize) {
      this.versionHistory = this.versionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get version statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const totalVersions = this.versions.size;
    const totalHistory = this.versionHistory.length;

    const byDevice = {};
    this.versionHistory.forEach(v => {
      byDevice[v.deviceId] = (byDevice[v.deviceId] || 0) + 1;
    });

    const byOperator = {};
    this.versionHistory.forEach(v => {
      byOperator[v.operator] = (byOperator[v.operator] || 0) + 1;
    });

    const rollbacks = this.versionHistory.filter(v => v.isRollback).length;

    return {
      totalVersions,
      totalHistory,
      uniqueObjects: new Set(this.versionHistory.map(v => v.objectId)).size,
      byDevice,
      byOperator,
      rollbacks
    };
  }

  /**
   * Clear versions for an object
   * @param {string} objectId - Object ID
   */
  clearObjectVersions(objectId) {
    const keysToDelete = [];
    for (const [key] of this.versions) {
      if (key.startsWith(`${objectId}_`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.versions.delete(key));
    this.saveState();
  }

  /**
   * Clear all versions
   */
  clearAllVersions() {
    this.versions.clear();
    this.versionHistory = [];
    this.saveState();
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        versions: Array.from(this.versions.entries()),
        versionHistory: this.versionHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save version tracker state:', error);
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
        this.versions = new Map(parsed.versions || []);
        this.versionHistory = parsed.versionHistory || [];
      }
    } catch (error) {
      console.error('Failed to load version tracker state:', error);
    }
  }

  /**
   * Destroy the version tracker
   */
  destroy() {
    this.versions.clear();
    this.versionHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[VersionTracker] Destroyed');
  }
}

// Singleton instance
let versionTrackerInstance = null;

/**
 * Get the singleton version tracker instance
 * @returns {VersionTracker} Version tracker instance
 */
export function getVersionTracker() {
  if (!versionTrackerInstance) {
    versionTrackerInstance = new VersionTracker();
  }
  return versionTrackerInstance;
}

export default VersionTracker;
