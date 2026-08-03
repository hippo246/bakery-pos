// Conflict Resolver
// Manages conflict resolution with multiple strategies

import { ConflictResolutionAction, ConflictType } from './SyncTypes.js';

export class ConflictResolver {
  constructor() {
    this.resolutionHistory = [];
    this.maxHistorySize = 200;
    this.storageKey = 'cafeos_conflict_resolver';
    this.loadState();
  }

  /**
   * Resolve a conflict using the specified action
   * @param {object} conflict - Conflict record
   * @param {string} action - Resolution action
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @param {object} options - Additional options
   * @returns {object} Resolution result
   */
  async resolveConflict(conflict, action, localData, cloudData, options = {}) {
    switch (action) {
      case ConflictResolutionAction.USE_LOCAL: {
        const resolvedData = this.useLocalVersion(localData);
        const resolutionDetails = { strategy: 'use_local', source: 'local' };
        return { success: true, data: resolvedData, details: resolutionDetails };
      }

      case ConflictResolutionAction.USE_CLOUD: {
        const resolvedData = this.useCloudVersion(cloudData);
        const resolutionDetails = { strategy: 'use_cloud', source: 'cloud' };
        return { success: true, data: resolvedData, details: resolutionDetails };
      }

      case ConflictResolutionAction.MERGE_AUTO: {
        const mergeResult = await this.mergeAutomatically(localData, cloudData, conflict);
        return { success: true, data: mergeResult.data, details: mergeResult.details };
      }

      case ConflictResolutionAction.MANUAL_REVIEW: {
        const resolvedData = options.manualData || localData;
        const resolutionDetails = { strategy: 'manual_review', source: 'manual' };
        return { success: true, data: resolvedData, details: resolutionDetails };
      }

      case ConflictResolutionAction.RESTORE_PREVIOUS: {
        const resolvedData = await this.restorePreviousVersion(conflict, options.previousVersion);
        const resolutionDetails = { strategy: 'restore_previous', source: 'previous' };
        return { success: true, data: resolvedData, details: resolutionDetails };
      }

      default:
        return { success: false, error: 'Unknown resolution action' };
    }
  }

  /**
   * Use local version
   * @param {object} localData - Local data
   * @returns {object} Local data
   */
  useLocalVersion(localData) {
    return { ...localData };
  }

  /**
   * Use cloud version
   * @param {object} cloudData - Cloud data
   * @returns {object} Cloud data
   */
  useCloudVersion(cloudData) {
    return { ...cloudData };
  }

  /**
   * Merge automatically where possible
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @param {object} conflict - Conflict record
   * @returns {object} Merge result
   */
  async mergeAutomatically(localData, cloudData, conflict) {
    const conflicts = conflict.conflicts;
    const conflictTypes = conflicts.map(c => c.type);

    // Cannot automatically merge certain conflict types
    const nonMergeable = [
      ConflictType.SIMULTANEOUS_EDIT,
      ConflictType.DATA_INTEGRITY,
      ConflictType.DUPLICATE_KEY
    ];

    if (conflictTypes.some(type => nonMergeable.includes(type))) {
      return {
        success: false,
        data: null,
        details: { error: 'Cannot automatically merge this conflict type' }
      };
    }

    // For version mismatch, use the most recent version
    if (conflictTypes.includes(ConflictType.VERSION_MISMATCH)) {
      const localModified = new Date(localData.modifiedAt || 0);
      const cloudModified = new Date(cloudData.modifiedAt || 0);
      
      const mergedData = localModified > cloudModified ? { ...localData } : { ...cloudData };
      
      return {
        success: true,
        data: mergedData,
        details: {
          strategy: 'merge_auto',
          method: 'most_recent',
          source: localModified > cloudModified ? 'local' : 'cloud'
        }
      };
    }

    // For schema mismatch, merge keys
    if (conflictTypes.includes(ConflictType.SCHEMA_MISMATCH)) {
      const mergedData = { ...localData };
      
      // Add missing keys from cloud
      Object.keys(cloudData).forEach(key => {
        if (!(key in mergedData)) {
          mergedData[key] = cloudData[key];
        }
      });

      return {
        success: true,
        data: mergedData,
        details: {
          strategy: 'merge_auto',
          method: 'schema_merge',
          keysAdded: Object.keys(cloudData).filter(k => !(k in localData))
        }
      };
    }

    // For deleted conflict, keep the existing data
    if (conflictTypes.includes(ConflictType.DELETED_CONFLICT)) {
      const deletedConflict = conflicts.find(c => c.type === ConflictType.DELETED_CONFLICT);
      
      if (deletedConflict.action === 'local_only') {
        return {
          success: true,
          data: { ...localData },
          details: { strategy: 'merge_auto', method: 'keep_local', reason: 'cloud_deleted' }
        };
      } else {
        return {
          success: true,
          data: { ...cloudData },
          details: { strategy: 'merge_auto', method: 'keep_cloud', reason: 'local_deleted' }
        };
      }
    }

    // Default: use local version
    return {
      success: true,
      data: { ...localData },
      details: { strategy: 'merge_auto', method: 'default_local' }
    };
  }

  /**
   * Restore previous version
   * @param {object} conflict - Conflict record
   * @param {object} previousVersion - Previous version data
   * @returns {object} Previous version data
   */
  async restorePreviousVersion(conflict, previousVersion) {
    if (!previousVersion) {
      throw new Error('Previous version data is required');
    }

    return { ...previousVersion };
  }

  /**
   * Compare differences between local and cloud data
   * @param {object} localData - Local data
   * @param {object} cloudData - Cloud data
   * @returns {object} Differences
   */
  compareDifferences(localData, cloudData) {
    const differences = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    if (!localData || !cloudData) {
      return differences;
    }

    const localKeys = new Set(Object.keys(localData));
    const cloudKeys = new Set(Object.keys(cloudData));

    // Added in cloud
    cloudKeys.forEach(key => {
      if (!localKeys.has(key)) {
        differences.added.push({ key, value: cloudData[key] });
      }
    });

    // Removed from cloud
    localKeys.forEach(key => {
      if (!cloudKeys.has(key)) {
        differences.removed.push({ key, value: localData[key] });
      }
    });

    // Modified
    localKeys.forEach(key => {
      if (cloudKeys.has(key)) {
        if (JSON.stringify(localData[key]) !== JSON.stringify(cloudData[key])) {
          differences.modified.push({
            key,
            localValue: localData[key],
            cloudValue: cloudData[key]
          });
        } else {
          differences.unchanged.push({ key, value: localData[key] });
        }
      }
    });

    return differences;
  }

  /**
   * Get recommended resolution action
   * @param {object} conflict - Conflict record
   * @returns {string} Recommended action
   */
  getRecommendedAction(conflict) {
    const conflictTypes = conflict.conflicts.map(c => c.type);

    // Critical conflicts require manual review
    const criticalConflicts = conflict.conflicts.filter(c => c.severity === 'critical');
    if (criticalConflicts.length > 0) {
      return ConflictResolutionAction.MANUAL_REVIEW;
    }

    // Simultaneous edit requires manual review
    if (conflictTypes.includes(ConflictType.SIMULTANEOUS_EDIT)) {
      return ConflictResolutionAction.MANUAL_REVIEW;
    }

    // Data integrity requires manual review
    if (conflictTypes.includes(ConflictType.DATA_INTEGRITY)) {
      return ConflictResolutionAction.MANUAL_REVIEW;
    }

    // Duplicate key requires manual review
    if (conflictTypes.includes(ConflictType.DUPLICATE_KEY)) {
      return ConflictResolutionAction.MANUAL_REVIEW;
    }

    // Version mismatch can be auto-merged
    if (conflictTypes.includes(ConflictType.VERSION_MISMATCH)) {
      return ConflictResolutionAction.MERGE_AUTO;
    }

    // Schema mismatch can be auto-merged
    if (conflictTypes.includes(ConflictType.SCHEMA_MISMATCH)) {
      return ConflictResolutionAction.MERGE_AUTO;
    }

    // Deleted conflict - use the existing version
    if (conflictTypes.includes(ConflictType.DELETED_CONFLICT)) {
      const deletedConflict = conflict.conflicts.find(c => c.type === ConflictType.DELETED_CONFLICT);
      return deletedConflict.action === 'local_only' 
        ? ConflictResolutionAction.USE_LOCAL 
        : ConflictResolutionAction.USE_CLOUD;
    }

    // Default: manual review
    return ConflictResolutionAction.MANUAL_REVIEW;
  }

  /**
   * Add to resolution history
   * @param {object} resolutionRecord - Resolution record
   */
  addToHistory(resolutionRecord) {
    this.resolutionHistory.push(resolutionRecord);

    // Trim history if it exceeds max size
    if (this.resolutionHistory.length > this.maxHistorySize) {
      this.resolutionHistory = this.resolutionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get resolution history
   * @param {object} filters - Optional filters
   * @returns {Array} Resolution history
   */
  getResolutionHistory(filters = {}) {
    let history = [...this.resolutionHistory];

    if (filters.conflictId) {
      history = history.filter(r => r.conflictId === filters.conflictId);
    }

    if (filters.itemId) {
      history = history.filter(r => r.itemId === filters.itemId);
    }

    if (filters.action) {
      history = history.filter(r => r.action === filters.action);
    }

    if (filters.since) {
      history = history.filter(r => new Date(r.resolvedAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by resolution date descending
    history.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));

    return history;
  }

  /**
   * Get resolution statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.resolutionHistory;
    const total = history.length;

    const byAction = {};
    history.forEach(r => {
      byAction[r.action] = (byAction[r.action] || 0) + 1;
    });

    const byStrategy = {};
    history.forEach(r => {
      const strategy = r.resolutionDetails?.strategy || 'unknown';
      byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
    });

    return {
      total,
      byAction,
      byStrategy
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        resolutionHistory: this.resolutionHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save conflict resolver state:', error);
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
        this.resolutionHistory = parsed.resolutionHistory || [];
      }
    } catch (error) {
      console.error('Failed to load conflict resolver state:', error);
    }
  }

  /**
   * Clear resolution history
   */
  clearHistory() {
    this.resolutionHistory = [];
    this.saveState();
  }

  /**
   * Destroy the conflict resolver
   */
  destroy() {
    this.resolutionHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[ConflictResolver] Destroyed');
  }
}

// Singleton instance
let conflictResolverInstance = null;

/**
 * Get the singleton conflict resolver instance
 * @returns {ConflictResolver} Conflict resolver instance
 */
export function getConflictResolver() {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver();
  }
  return conflictResolverInstance;
}

export default ConflictResolver;
