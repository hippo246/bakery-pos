// Data Conflict Resolution
// Detect concurrent edits, auto-merge non-conflicting changes, alert on conflicts, last-write-wins with audit trail

export class DataConflictResolver {
  constructor(options = {}) {
    this.options = {
      autoMergeEnabled: options.autoMergeEnabled !== false,
      conflictAlertEnabled: options.conflictAlertEnabled !== false,
      auditTrailEnabled: options.auditTrailEnabled !== false,
      conflictResolutionStrategy: options.conflictResolutionStrategy || 'last-write-wins', // 'last-write-wins', 'manual', 'auto-merge'
      ...options
    };
    
    this.conflictHistory = [];
    this.auditTrail = [];
    this.pendingConflicts = new Map();
    this.eventHandlers = new Map();
    this.loadConflictState();
  }

  /**
   * Load conflict state from localStorage
   */
  loadConflictState() {
    try {
      const stored = localStorage.getItem('cafeos_conflict_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.conflictHistory = state.conflictHistory || [];
        this.auditTrail = state.auditTrail || [];
        this.pendingConflicts = new Map(state.pendingConflicts || []);
      }
    } catch (error) {
      console.error('[DataConflictResolver] Failed to load conflict state:', error);
    }
  }

  /**
   * Save conflict state to localStorage
   */
  saveConflictState() {
    try {
      const state = {
        conflictHistory: this.conflictHistory.slice(-100), // Keep last 100
        auditTrail: this.auditTrail.slice(-200), // Keep last 200
        pendingConflicts: Array.from(this.pendingConflicts)
      };
      
      localStorage.setItem('cafeos_conflict_state', JSON.stringify(state));
    } catch (error) {
      console.error('[DataConflictResolver] Failed to save conflict state:', error);
    }
  }

  /**
   * Detect conflict between two versions of data
   */
  detectConflict(resourceId, localVersion, remoteVersion) {
    const conflict = {
      resourceId,
      localVersion,
      remoteVersion,
      timestamp: Date.now(),
      conflicts: [],
      canAutoMerge: true
    };
    
    // Check if versions are the same
    if (localVersion.version === remoteVersion.version) {
      return null; // No conflict
    }
    
    // Check for field-level conflicts
    const localFields = new Set(Object.keys(localVersion.data || {}));
    const remoteFields = new Set(Object.keys(remoteVersion.data || {}));
    const allFields = new Set([...localFields, ...remoteFields]);
    
    allFields.forEach(field => {
      const localValue = localVersion.data?.[field];
      const remoteValue = remoteVersion.data?.[field];
      
      if (localValue !== remoteValue) {
        // Check if both modified
        const localModified = localVersion.modifiedFields?.includes(field);
        const remoteModified = remoteVersion.modifiedFields?.includes(field);
        
        if (localModified && remoteModified) {
          conflict.conflicts.push({
            field,
            localValue,
            remoteValue,
            type: 'both_modified'
          });
          conflict.canAutoMerge = false;
        } else if (remoteModified) {
          // Only remote modified, can auto-merge
          conflict.conflicts.push({
            field,
            localValue,
            remoteValue,
            type: 'remote_modified',
            resolution: 'use_remote'
          });
        } else if (localModified) {
          // Only local modified, can auto-merge
          conflict.conflicts.push({
            field,
            localValue,
            remoteValue,
            type: 'local_modified',
            resolution: 'use_local'
          });
        }
      }
    });
    
    // If no field-level conflicts but versions differ, check metadata
    if (conflict.conflicts.length === 0) {
      conflict.canAutoMerge = true;
      conflict.conflicts.push({
        type: 'metadata_only',
        resolution: 'use_remote'
      });
    }
    
    return conflict;
  }

  /**
   * Resolve conflict using configured strategy
   */
  resolveConflict(conflict, strategy = null) {
    const resolutionStrategy = strategy || this.options.conflictResolutionStrategy;
    
    let resolvedData;
    let resolutionMethod;
    
    switch (resolutionStrategy) {
      case 'last-write-wins':
        resolvedData = this.resolveLastWriteWins(conflict);
        resolutionMethod = 'last-write-wins';
        break;
      
      case 'auto-merge':
        resolvedData = this.resolveAutoMerge(conflict);
        resolutionMethod = 'auto-merge';
        break;
      
      case 'manual':
        resolvedData = this.resolveManual(conflict);
        resolutionMethod = 'manual';
        break;
      
      default:
        resolvedData = this.resolveLastWriteWins(conflict);
        resolutionMethod = 'last-write-wins';
    }
    
    // Log resolution
    this.logResolution(conflict, resolvedData, resolutionMethod);
    
    return resolvedData;
  }

  /**
   * Resolve using last-write-wins strategy
   */
  resolveLastWriteWins(conflict) {
    const localTimestamp = conflict.localVersion.timestamp || 0;
    const remoteTimestamp = conflict.remoteVersion.timestamp || 0;
    
    if (remoteTimestamp > localTimestamp) {
      return {
        data: conflict.remoteVersion.data,
        version: conflict.remoteVersion.version,
        source: 'remote',
        timestamp: Date.now()
      };
    } else {
      return {
        data: conflict.localVersion.data,
        version: conflict.localVersion.version,
        source: 'local',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Resolve using auto-merge strategy
   */
  resolveAutoMerge(conflict) {
    if (!conflict.canAutoMerge) {
      // Cannot auto-merge, fall back to last-write-wins
      return this.resolveLastWriteWins(conflict);
    }
    
    const mergedData = { ...conflict.localVersion.data };
    
    conflict.conflicts.forEach(fieldConflict => {
      if (fieldConflict.resolution === 'use_remote') {
        mergedData[fieldConflict.field] = fieldConflict.remoteValue;
      } else if (fieldConflict.resolution === 'use_local') {
        mergedData[fieldConflict.field] = fieldConflict.localValue;
      }
    });
    
    return {
      data: mergedData,
      version: Math.max(conflict.localVersion.version, conflict.remoteVersion.version) + 1,
      source: 'merged',
      timestamp: Date.now(),
      mergedFields: conflict.conflicts.map(c => c.field)
    };
  }

  /**
   * Resolve using manual strategy
   */
  resolveManual(conflict) {
    // Add to pending conflicts for manual resolution
    this.pendingConflicts.set(conflict.resourceId, conflict);
    this.saveConflictState();
    
    // Emit conflict event for UI to handle
    this.emit('conflictDetected', conflict);
    
    if (this.options.conflictAlertEnabled) {
      this.emit('alert', {
        type: 'data_conflict',
        message: `Conflict detected for ${conflict.resourceId}`,
        conflict,
        severity: 'warning'
      });
    }
    
    return {
      data: conflict.localVersion.data,
      version: conflict.localVersion.version,
      source: 'local_pending',
      timestamp: Date.now(),
      requiresManualResolution: true
    };
  }

  /**
   * Manually resolve pending conflict
   */
  manuallyResolveConflict(resourceId, resolutionData, resolutionNotes = '') {
    const conflict = this.pendingConflicts.get(resourceId);
    
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }
    
    const resolved = {
      data: resolutionData,
      version: Math.max(conflict.localVersion.version, conflict.remoteVersion.version) + 1,
      source: 'manual',
      timestamp: Date.now(),
      notes: resolutionNotes
    };
    
    // Log resolution
    this.logResolution(conflict, resolved, 'manual');
    
    // Remove from pending
    this.pendingConflicts.delete(resourceId);
    this.saveConflictState();
    
    this.emit('conflictResolved', { resourceId, resolved });
    
    return { success: true, resolved };
  }

  /**
   * Log resolution to audit trail
   */
  logResolution(conflict, resolvedData, method) {
    const logEntry = {
      resourceId: conflict.resourceId,
      method,
      localVersion: conflict.localVersion.version,
      remoteVersion: conflict.remoteVersion.version,
      resolvedVersion: resolvedData.version,
      timestamp: Date.now(),
      conflicts: conflict.conflicts.length,
      canAutoMerge: conflict.canAutoMerge
    };
    
    this.auditTrail.push(logEntry);
    this.conflictHistory.push({
      ...logEntry,
      resolvedData
    });
    
    this.saveConflictState();
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts() {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Get conflict history
   */
  getConflictHistory(limit = 50) {
    return this.conflictHistory.slice(-limit);
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }

  /**
   * Get conflict statistics
   */
  getStatistics() {
    const stats = {
      totalConflicts: this.conflictHistory.length,
      byMethod: {},
      byResource: {},
      autoMergeRate: 0,
      manualResolutionRate: 0,
      pendingConflicts: this.pendingConflicts.size
    };
    
    this.conflictHistory.forEach(log => {
      // By method
      stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
      
      // By resource
      stats.byResource[log.resourceId] = (stats.byResource[log.resourceId] || 0) + 1;
    });
    
    // Calculate rates
    const total = stats.totalConflicts;
    if (total > 0) {
      stats.autoMergeRate = ((stats.byMethod['auto-merge'] || 0) / total) * 100;
      stats.manualResolutionRate = ((stats.byMethod['manual'] || 0) / total) * 100;
    }
    
    return stats;
  }

  /**
   * Clear conflict history
   */
  clearConflictHistory() {
    this.conflictHistory = [];
    this.saveConflictState();
  }

  /**
   * Clear audit trail
   */
  clearAuditTrail() {
    this.auditTrail = [];
    this.saveConflictState();
  }

  /**
   * Clear pending conflicts
   */
  clearPendingConflicts() {
    this.pendingConflicts.clear();
    this.saveConflictState();
  }

  /**
   * Update conflict resolution strategy
   */
  setConflictResolutionStrategy(strategy) {
    this.options.conflictResolutionStrategy = strategy;
  }

  /**
   * Enable/disable auto-merge
   */
  setAutoMergeEnabled(enabled) {
    this.options.autoMergeEnabled = enabled;
  }

  /**
   * Enable/disable conflict alerts
   */
  setConflictAlertEnabled(enabled) {
    this.options.conflictAlertEnabled = enabled;
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[DataConflictResolver] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the conflict resolver
   */
  destroy() {
    this.pendingConflicts.clear();
    this.eventHandlers.clear();
    console.log('[DataConflictResolver] Destroyed');
  }
}

// Singleton instance
let dataConflictResolverInstance = null;

/**
 * Get the singleton data conflict resolver instance
 */
export function getDataConflictResolver(options = {}) {
  if (!dataConflictResolverInstance) {
    dataConflictResolverInstance = new DataConflictResolver(options);
  }
  return dataConflictResolverInstance;
}

export default DataConflictResolver;
