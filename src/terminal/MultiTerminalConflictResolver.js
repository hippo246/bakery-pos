// Multi-Terminal Conflict Resolver
// Enhanced conflict resolution for multi-terminal POS scenarios

import { getDataConflictResolver } from '../operations/DataConflictResolver.js';
import { getRealtimeSyncClient } from '../realtime/RealtimeSyncClient.js';
import { getTerminalManager } from './TerminalManager.js';

export class MultiTerminalConflictResolver {
  constructor(options = {}) {
    this.options = {
      lockTimeout: options.lockTimeout || 30000, // 30 seconds
      autoLockOnEdit: options.autoLockOnEdit !== false,
      mergeStrategy: options.mergeStrategy || 'smart', // 'smart', 'last-write-wins', 'manual'
      ...options
    };
    
    this.baseResolver = getDataConflictResolver();
    this.syncClient = getRealtimeSyncClient();
    this.terminalManager = getTerminalManager();
    this.resourceLocks = new Map(); // resourceId -> { terminalId, timestamp, terminalName }
    this.pendingConflicts = new Map();
    this.eventHandlers = new Map();
    
    this.setupSyncListeners();
  }

  /**
   * Setup sync event listeners
   */
  setupSyncListeners() {
    // Listen for lock events from other terminals
    this.syncClient.on('resourceLocked', (data) => {
      this.handleRemoteLock(data);
    });
    
    this.syncClient.on('resourceUnlocked', (data) => {
      this.handleRemoteUnlock(data);
    });
    
    this.syncClient.on('lockDenied', (data) => {
      this.handleLockDenied(data);
    });
    
    this.syncClient.on('lockGranted', (data) => {
      this.handleLockGranted(data);
    });
  }

  /**
   * Request lock on resource
   */
  async requestLock(resourceId) {
    const currentTerminal = this.terminalManager.getCurrentTerminal();
    
    if (!currentTerminal) {
      throw new Error('No current terminal');
    }
    
    // Check if already locked
    const existingLock = this.resourceLocks.get(resourceId);
    
    if (existingLock) {
      if (existingLock.terminalId === currentTerminal.id) {
        // Already locked by this terminal
        return { success: true, alreadyLocked: true };
      } else {
        // Locked by another terminal
        return {
          success: false,
          lockedBy: existingLock.terminalId,
          lockedByName: existingLock.terminalName,
          lockedAt: existingLock.timestamp
        };
      }
    }
    
    // Request lock from sync server
    this.syncClient.requestLock(resourceId);
    
    // Wait for response (in real implementation, this would use promises)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Lock request timeout' });
      }, 5000);
      
      const handler = (data) => {
        if (data.resourceId === resourceId) {
          clearTimeout(timeout);
          this.syncClient.off('lockGranted', handler);
          this.syncClient.off('lockDenied', handler);
          
          if (data.type === 'lock_granted') {
            this.resourceLocks.set(resourceId, {
              terminalId: currentTerminal.id,
              terminalName: currentTerminal.name,
              timestamp: Date.now()
            });
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              lockedBy: data.lockedBy,
              error: 'Resource locked by another terminal'
            });
          }
        }
      };
      
      this.syncClient.on('lockGranted', handler);
      this.syncClient.on('lockDenied', handler);
    });
  }

  /**
   * Release lock on resource
   */
  releaseLock(resourceId) {
    const currentTerminal = this.terminalManager.getCurrentTerminal();
    
    if (!currentTerminal) {
      return;
    }
    
    const lock = this.resourceLocks.get(resourceId);
    
    if (lock && lock.terminalId === currentTerminal.id) {
      this.resourceLocks.delete(resourceId);
      this.syncClient.releaseLock(resourceId);
      
      this.emit('lockReleased', { resourceId, terminalId: currentTerminal.id });
    }
  }

  /**
   * Handle remote lock from another terminal
   */
  handleRemoteLock(data) {
    const { resourceId, lockedBy, timestamp } = data;
    
    const terminal = this.terminalManager.getTerminal(lockedBy);
    
    this.resourceLocks.set(resourceId, {
      terminalId: lockedBy,
      terminalName: terminal?.name || lockedBy,
      timestamp: timestamp || Date.now()
    });
    
    this.emit('remoteLockAcquired', { resourceId, lockedBy });
  }

  /**
   * Handle remote unlock from another terminal
   */
  handleRemoteUnlock(data) {
    const { resourceId } = data;
    
    this.resourceLocks.delete(resourceId);
    
    this.emit('remoteLockReleased', { resourceId });
  }

  /**
   * Handle lock denied
   */
  handleLockDenied(data) {
    const { resourceId, lockedBy } = data;
    
    this.emit('lockDenied', { resourceId, lockedBy });
  }

  /**
   * Handle lock granted
   */
  handleLockGranted(data) {
    const { resourceId } = data;
    
    const currentTerminal = this.terminalManager.getCurrentTerminal();
    
    if (currentTerminal) {
      this.resourceLocks.set(resourceId, {
        terminalId: currentTerminal.id,
        terminalName: currentTerminal.name,
        timestamp: Date.now()
      });
    }
    
    this.emit('lockGranted', { resourceId });
  }

  /**
   * Detect conflict between versions
   */
  detectConflict(resourceId, localVersion, remoteVersion) {
    const conflict = this.baseResolver.detectConflict(resourceId, localVersion, remoteVersion);
    
    if (conflict) {
      // Add terminal information
      conflict.localTerminal = this.terminalManager.getCurrentTerminal();
      conflict.remoteTerminal = this.terminalManager.getTerminal(remoteVersion.terminalId);
      
      // Check if resource is locked
      const lock = this.resourceLocks.get(resourceId);
      if (lock) {
        conflict.isLocked = true;
        conflict.lockedBy = lock.terminalId;
        conflict.lockedByName = lock.terminalName;
      }
    }
    
    return conflict;
  }

  /**
   * Resolve conflict with multi-terminal awareness
   */
  async resolveConflict(conflict, strategy = null) {
    const resolutionStrategy = strategy || this.options.mergeStrategy;
    
    // If resource is locked by another terminal, deny edit
    if (conflict.isLocked && conflict.lockedBy !== conflict.localTerminal?.id) {
      this.emit('conflictDenied', {
        resourceId: conflict.resourceId,
        reason: 'Resource locked by another terminal',
        lockedBy: conflict.lockedBy,
        lockedByName: conflict.lockedByName
      });
      
      return {
        success: false,
        reason: 'locked',
        lockedBy: conflict.lockedBy,
        lockedByName: conflict.lockedByName
      };
    }
    
    switch (resolutionStrategy) {
      case 'smart':
        return await this.resolveSmart(conflict);
      
      case 'last-write-wins':
        return this.resolveLastWriteWins(conflict);
      
      case 'manual':
        return this.resolveManual(conflict);
      
      default:
        return this.resolveLastWriteWins(conflict);
    }
  }

  /**
   * Smart resolution - merge non-conflicting, alert on conflicts
   */
  async resolveSmart(conflict) {
    if (conflict.canAutoMerge) {
      // Auto-merge non-conflicting changes
      const resolved = this.baseResolver.resolveAutoMerge(conflict);
      
      this.emit('conflictAutoMerged', {
        resourceId: conflict.resourceId,
        resolved
      });
      
      return { success: true, resolved, method: 'auto-merge' };
    } else {
      // Has conflicts, require manual resolution
      return this.resolveManual(conflict);
    }
  }

  /**
   * Last-write-wins resolution
   */
  resolveLastWriteWins(conflict) {
    const resolved = this.baseResolver.resolveLastWriteWins(conflict);
    
    this.emit('conflictResolved', {
      resourceId: conflict.resourceId,
      resolved,
      method: 'last-write-wins'
    });
    
    return { success: true, resolved, method: 'last-write-wins' };
  }

  /**
   * Manual resolution - queue for user input
   */
  resolveManual(conflict) {
    this.pendingConflicts.set(conflict.resourceId, conflict);
    
    this.emit('conflictRequiresManualResolution', {
      resourceId: conflict.resourceId,
      conflict
    });
    
    return {
      success: false,
      requiresManualResolution: true,
      conflict
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
      notes: resolutionNotes,
      resolvedBy: this.terminalManager.getCurrentTerminal()?.id
    };
    
    // Remove from pending
    this.pendingConflicts.delete(resourceId);
    
    // Release lock
    this.releaseLock(resourceId);
    
    this.emit('conflictManuallyResolved', {
      resourceId,
      resolved
    });
    
    return { success: true, resolved };
  }

  /**
   * Start editing resource (auto-lock if enabled)
   */
  async startEditing(resourceId) {
    if (this.options.autoLockOnEdit) {
      const result = await this.requestLock(resourceId);
      
      if (!result.success) {
        this.emit('editDenied', {
          resourceId,
          reason: result.error || 'Resource locked',
          lockedBy: result.lockedBy
        });
        
        return { success: false, ...result };
      }
    }
    
    this.emit('editStarted', { resourceId });
    
    return { success: true };
  }

  /**
   * Stop editing resource (release lock)
   */
  stopEditing(resourceId) {
    this.releaseLock(resourceId);
    
    this.emit('editStopped', { resourceId });
    
    return { success: true };
  }

  /**
   * Check if resource is locked
   */
  isLocked(resourceId) {
    return this.resourceLocks.has(resourceId);
  }

  /**
   * Get lock info for resource
   */
  getLockInfo(resourceId) {
    return this.resourceLocks.get(resourceId);
  }

  /**
   * Get all locks
   */
  getAllLocks() {
    return Object.fromEntries(this.resourceLocks);
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts() {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Clear expired locks
   */
  clearExpiredLocks() {
    const now = Date.now();
    const expired = [];
    
    this.resourceLocks.forEach((lock, resourceId) => {
      if (now - lock.timestamp > this.options.lockTimeout) {
        expired.push(resourceId);
      }
    });
    
    expired.forEach(resourceId => {
      this.resourceLocks.delete(resourceId);
      this.emit('lockExpired', { resourceId });
    });
    
    return expired.length;
  }

  /**
   * Get conflict statistics
   */
  getStatistics() {
    const baseStats = this.baseResolver.getStatistics();
    
    return {
      ...baseStats,
      activeLocks: this.resourceLocks.size,
      pendingConflicts: this.pendingConflicts.size,
      lockTimeout: this.options.lockTimeout,
      mergeStrategy: this.options.mergeStrategy
    };
  }

  /**
   * Update merge strategy
   */
  setMergeStrategy(strategy) {
    this.options.mergeStrategy = strategy;
  }

  /**
   * Enable/disable auto-lock on edit
   */
  setAutoLockOnEdit(enabled) {
    this.options.autoLockOnEdit = enabled;
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
          console.error(`[MultiTerminalConflictResolver] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the conflict resolver
   */
  destroy() {
    // Release all locks held by this terminal
    const currentTerminal = this.terminalManager.getCurrentTerminal();
    
    if (currentTerminal) {
      this.resourceLocks.forEach((lock, resourceId) => {
        if (lock.terminalId === currentTerminal.id) {
          this.releaseLock(resourceId);
        }
      });
    }
    
    this.pendingConflicts.clear();
    this.eventHandlers.clear();
    console.log('[MultiTerminalConflictResolver] Destroyed');
  }
}

// Singleton instance
let multiTerminalConflictResolverInstance = null;

/**
 * Get the singleton multi-terminal conflict resolver instance
 */
export function getMultiTerminalConflictResolver(options = {}) {
  if (!multiTerminalConflictResolverInstance) {
    multiTerminalConflictResolverInstance = new MultiTerminalConflictResolver(options);
  }
  return multiTerminalConflictResolverInstance;
}

export default MultiTerminalConflictResolver;
