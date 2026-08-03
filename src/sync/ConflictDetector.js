// Conflict Detector
// Detects conflicts between local and cloud data

import { ConflictType, ConflictSeverity } from './SyncTypes.js';

export class ConflictDetector {
  constructor() {
    this.conflicts = new Map();
    this.conflictHistory = [];
    this.maxHistorySize = 200;
    this.storageKey = 'cafeos_conflict_detector';
    this.loadState();
  }

  /**
   * Detect conflicts between local and cloud data
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @param {object} localVersion - Local version info
   * @param {object} cloudVersion - Cloud version info
   * @returns {Array} Detected conflicts
   */
  detectConflicts(localData, cloudData, localVersion, cloudVersion) {
    const conflicts = [];

    // Version mismatch
    if (localVersion?.version !== cloudVersion?.version) {
      conflicts.push({
        type: ConflictType.VERSION_MISMATCH,
        severity: ConflictSeverity.WARNING,
        message: `Version mismatch: local v${localVersion?.version} vs cloud v${cloudVersion?.version}`,
        localVersion: localVersion?.version,
        cloudVersion: cloudVersion?.version
      });
    }

    // Simultaneous edit detection
    if (this.isSimultaneousEdit(localVersion, cloudVersion)) {
      conflicts.push({
        type: ConflictType.SIMULTANEOUS_EDIT,
        severity: ConflictSeverity.ERROR,
        message: 'Data was edited simultaneously on multiple devices',
        localModifiedAt: localVersion?.modifiedAt,
        cloudModifiedAt: cloudVersion?.modifiedAt
      });
    }

    // Data integrity check
    const integrityConflict = this.checkDataIntegrity(localData, cloudData);
    if (integrityConflict) {
      conflicts.push(integrityConflict);
    }

    // Schema mismatch
    const schemaConflict = this.checkSchemaMismatch(localData, cloudData);
    if (schemaConflict) {
      conflicts.push(schemaConflict);
    }

    // Deleted conflict
    const deletedConflict = this.checkDeletedConflict(localData, cloudData);
    if (deletedConflict) {
      conflicts.push(deletedConflict);
    }

    // Duplicate key detection
    const duplicateConflict = this.checkDuplicateKeys(localData, cloudData);
    if (duplicateConflict) {
      conflicts.push(duplicateConflict);
    }

    return conflicts;
  }

  /**
   * Check for simultaneous edits
   * @param {object} localVersion - Local version info
   * @param {object} cloudVersion - Cloud version info
   * @returns {boolean} Whether simultaneous edit occurred
   */
  isSimultaneousEdit(localVersion, cloudVersion) {
    if (!localVersion?.modifiedAt || !cloudVersion?.modifiedAt) {
      return false;
    }

    const localModified = new Date(localVersion.modifiedAt);
    const cloudModified = new Date(cloudVersion.modifiedAt);
    const timeDiff = Math.abs(localModified - cloudModified);

    // If modified within 5 seconds of each other on different devices
    return timeDiff < 5000 && localVersion.deviceId !== cloudVersion.deviceId;
  }

  /**
   * Check data integrity
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @returns {object|null} Conflict or null
   */
  checkDataIntegrity(localData, cloudData) {
    if (!localData || !cloudData) {
      return null;
    }

    // Check if local data is corrupted
    if (this.isDataCorrupted(localData)) {
      return {
        type: ConflictType.DATA_INTEGRITY,
        severity: ConflictSeverity.CRITICAL,
        message: 'Local data appears to be corrupted',
        location: 'local'
      };
    }

    // Check if cloud data is corrupted
    if (this.isDataCorrupted(cloudData)) {
      return {
        type: ConflictType.DATA_INTEGRITY,
        severity: ConflictSeverity.CRITICAL,
        message: 'Cloud data appears to be corrupted',
        location: 'cloud'
      };
    }

    return null;
  }

  /**
   * Check if data is corrupted
   * @param {object} data - Data to check
   * @returns {boolean} Whether data is corrupted
   */
  isDataCorrupted(data) {
    try {
      if (typeof data === 'string') {
        JSON.parse(data);
      }
      return false;
    } catch (_error) {
      return true;
    }
  }

  /**
   * Check for schema mismatch
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @returns {object|null} Conflict or null
   */
  checkSchemaMismatch(localData, cloudData) {
    if (!localData || !cloudData) {
      return null;
    }

    const localKeys = new Set(Object.keys(localData));
    const cloudKeys = new Set(Object.keys(cloudData));

    const missingInLocal = [...cloudKeys].filter(k => !localKeys.has(k));
    const missingInCloud = [...localKeys].filter(k => !cloudKeys.has(k));

    if (missingInLocal.length > 0 || missingInCloud.length > 0) {
      return {
        type: ConflictType.SCHEMA_MISMATCH,
        severity: ConflictSeverity.WARNING,
        message: 'Schema mismatch detected',
        missingInLocal,
        missingInCloud
      };
    }

    return null;
  }

  /**
   * Check for deleted conflict
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @returns {object|null} Conflict or null
   */
  checkDeletedConflict(localData, cloudData) {
    const localExists = localData !== null && localData !== undefined;
    const cloudExists = cloudData !== null && cloudData !== undefined;

    if (localExists && !cloudExists) {
      return {
        type: ConflictType.DELETED_CONFLICT,
        severity: ConflictSeverity.WARNING,
        message: 'Data exists locally but was deleted in cloud',
        action: 'local_only'
      };
    }

    if (!localExists && cloudExists) {
      return {
        type: ConflictType.DELETED_CONFLICT,
        severity: ConflictSeverity.WARNING,
        message: 'Data exists in cloud but was deleted locally',
        action: 'cloud_only'
      };
    }

    return null;
  }

  /**
   * Check for duplicate keys
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @returns {object|null} Conflict or null
   */
  checkDuplicateKeys(localData, cloudData) {
    if (!localData || !cloudData) {
      return null;
    }

    // Check for arrays with duplicate IDs
    if (Array.isArray(localData) && Array.isArray(cloudData)) {
      const localIds = new Set(localData.map(item => item.id).filter(Boolean));
      const cloudIds = new Set(cloudData.map(item => item.id).filter(Boolean));

      const duplicates = [...localIds].filter(id => cloudIds.has(id));

      if (duplicates.length > 0) {
        return {
          type: ConflictType.DUPLICATE_KEY,
          severity: ConflictSeverity.ERROR,
          message: 'Duplicate IDs detected',
          duplicateIds: duplicates
        };
      }
    }

    return null;
  }

  /**
   * Register a conflict
   * @param {string} itemId - Item ID
   * @param {Array} conflicts - Detected conflicts
   * @returns {string} Conflict ID
   */
  registerConflict(itemId, conflicts) {
    if (conflicts.length === 0) {
      return null;
    }

    const conflictId = `conflict_${itemId}_${Date.now()}`;
    const conflictRecord = {
      conflictId,
      itemId,
      conflicts,
      detectedAt: new Date().toISOString(),
      resolved: false,
      resolution: null
    };

    this.conflicts.set(conflictId, conflictRecord);
    this.addToHistory(conflictRecord);
    this.saveState();

    return conflictId;
  }

  /**
   * Resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution action
   * @param {object} resolutionData - Additional resolution data
   * @returns {boolean} Resolution result
   */
  resolveConflict(conflictId, resolution, resolutionData = {}) {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return false;
    }

    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolutionData = resolutionData;

    this.saveState();
    return true;
  }

  /**
   * Get conflict by ID
   * @param {string} conflictId - Conflict ID
   * @returns {object|null} Conflict record
   */
  getConflict(conflictId) {
    return this.conflicts.get(conflictId) || null;
  }

  /**
   * Get conflicts by item ID
   * @param {string} itemId - Item ID
   * @returns {Array} Conflicts for item
   */
  getConflictsByItem(itemId) {
    return Array.from(this.conflicts.values()).filter(c => c.itemId === itemId);
  }

  /**
   * Get all unresolved conflicts
   * @returns {Array} Unresolved conflicts
   */
  getUnresolvedConflicts() {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }

  /**
   * Get conflict history
   * @param {object} filters - Optional filters
   * @returns {Array} Conflict history
   */
  getConflictHistory(filters = {}) {
    let history = [...this.conflictHistory];

    if (filters.itemId) {
      history = history.filter(c => c.itemId === filters.itemId);
    }

    if (filters.resolved !== undefined) {
      history = history.filter(c => c.resolved === filters.resolved);
    }

    if (filters.since) {
      history = history.filter(c => new Date(c.detectedAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by detection date descending
    history.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

    return history;
  }

  /**
   * Get conflict statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const allConflicts = Array.from(this.conflicts.values());
    const unresolved = this.getUnresolvedConflicts();

    const byType = {};
    allConflicts.forEach(c => {
      c.conflicts.forEach(conflict => {
        byType[conflict.type] = (byType[conflict.type] || 0) + 1;
      });
    });

    const bySeverity = {};
    allConflicts.forEach(c => {
      c.conflicts.forEach(conflict => {
        bySeverity[conflict.severity] = (bySeverity[conflict.severity] || 0) + 1;
      });
    });

    const resolvedCount = allConflicts.filter(c => c.resolved).length;

    return {
      totalConflicts: allConflicts.length,
      unresolvedCount: unresolved.length,
      resolvedCount,
      resolutionRate: allConflicts.length > 0 ? (resolvedCount / allConflicts.length) * 100 : 0,
      byType,
      bySeverity
    };
  }

  /**
   * Add to conflict history
   * @param {object} conflictRecord - Conflict record
   */
  addToHistory(conflictRecord) {
    this.conflictHistory.push(conflictRecord);

    // Trim history if it exceeds max size
    if (this.conflictHistory.length > this.maxHistorySize) {
      this.conflictHistory = this.conflictHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clear all conflicts
   */
  clearConflicts() {
    this.conflicts.clear();
    this.saveState();
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        conflicts: Array.from(this.conflicts.entries()),
        conflictHistory: this.conflictHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save conflict detector state:', error);
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
        this.conflicts = new Map(parsed.conflicts || []);
        this.conflictHistory = parsed.conflictHistory || [];
      }
    } catch (error) {
      console.error('Failed to load conflict detector state:', error);
    }
  }

  /**
   * Destroy the conflict detector
   */
  destroy() {
    this.conflicts.clear();
    this.conflictHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[ConflictDetector] Destroyed');
  }
}

// Singleton instance
let conflictDetectorInstance = null;

/**
 * Get the singleton conflict detector instance
 * @returns {ConflictDetector} Conflict detector instance
 */
export function getConflictDetector() {
  if (!conflictDetectorInstance) {
    conflictDetectorInstance = new ConflictDetector();
  }
  return conflictDetectorInstance;
}

export default ConflictDetector;
