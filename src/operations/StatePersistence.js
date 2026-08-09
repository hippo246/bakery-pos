// State Persistence and Recovery
// Manages application state persistence, crash recovery, and undo/redo

import { getEncryptionEngine } from '../security/EncryptionEngine.js';
import { getDataValidator } from './DataValidator.js';

export class StatePersistence {
  constructor(config = {}) {
    this.config = {
      autoSave: config.autoSave !== false,
      autoSaveInterval: config.autoSaveInterval || 30000,
      maxUndoSteps: config.maxUndoSteps || 50,
      encryptState: config.encryptState !== false,
      ...config
    };
    
    this.encryptionEngine = getEncryptionEngine();
    this.dataValidator = getDataValidator();
    
    this.undoStack = [];
    this.redoStack = [];
    this.autoSaveTimer = null;
    this.currentSessionId = this.generateSessionId();
    
    this.initialize();
  }

  /**
   * Initialize state persistence
   */
  initialize() {
    // Load previous session state if available
    this.loadPreviousSession();
    
    // Start auto-save if enabled
    if (this.config.autoSave) {
      this.startAutoSave();
    }
    
    // Handle page unload
    window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    
    console.log('[StatePersistence] Initialized');
  }

  /**
   * Save application state
   */
  async saveState(state, options = {}) {
    const { key = 'app_state', metadata = {} } = options;
    
    try {
      const stateData = {
        sessionId: this.currentSessionId,
        timestamp: Date.now(),
        state,
        metadata: {
          ...metadata,
          version: '1.0.0'
        }
      };

      let serializedData = JSON.stringify(stateData);
      
      // Encrypt if enabled
      if (this.config.encryptState) {
        const encrypted = await this.encryptionEngine.encrypt(serializedData);
        if (encrypted.success) {
          serializedData = encrypted.encryptedData;
        }
      }

      // Save to localStorage
      localStorage.setItem(`cafeos_state_${key}`, serializedData);
      
      // Validate saved state
      const validation = await this.dataValidator.validate('app_state', stateData);
      
      return {
        success: true,
        key,
        validated: validation.valid,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[StatePersistence] Failed to save state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load application state
   */
  async loadState(key = 'app_state') {
    try {
      const serializedData = localStorage.getItem(`cafeos_state_${key}`);
      
      if (!serializedData) {
        return { success: false, error: 'No saved state found' };
      }

      let stateData;
      
      // Decrypt if encrypted
      if (this.config.encryptState) {
        const decrypted = await this.encryptionEngine.decrypt(serializedData);
        if (decrypted.success) {
          stateData = JSON.parse(decrypted.decryptedData);
        } else {
          // Try parsing as unencrypted (fallback)
          stateData = JSON.parse(serializedData);
        }
      } else {
        stateData = JSON.parse(serializedData);
      }

      // Validate loaded state
      const validation = await this.dataValidator.validate('app_state', stateData);
      
      if (!validation.valid) {
        console.warn('[StatePersistence] Loaded state validation failed:', validation.errors);
        // Attempt auto-repair
        if (validation.repaired) {
          stateData = validation.data;
        }
      }

      return {
        success: true,
        state: stateData.state,
        sessionId: stateData.sessionId,
        timestamp: stateData.timestamp,
        metadata: stateData.metadata,
        validation
      };
    } catch (error) {
      console.error('[StatePersistence] Failed to load state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save state before risky operation
   */
  async saveBeforeRiskyOperation(operationName, state) {
    const backupKey = `pre_operation_${operationName}_${Date.now()}`;
    
    const result = await this.saveState(state, { 
      key: backupKey,
      metadata: { operation: operationName, type: 'pre_operation_backup' }
    });
    
    if (result.success) {
      // Add to undo stack
      this.addToUndoStack(operationName, state, backupKey);
    }
    
    return result;
  }

  /**
   * Restore state after crash
   */
  async restoreAfterCrash() {
    console.log('[StatePersistence] Attempting crash recovery');
    
    // Load last known good state
    const result = await this.loadState('last_known_good');
    
    if (result.success) {
      console.log('[StatePersistence] Crash recovery successful');
      return result;
    }
    
    // Try regular state as fallback
    const fallback = await this.loadState('app_state');
    
    if (fallback.success) {
      console.log('[StatePersistence] Using fallback state');
      return fallback;
    }
    
    return { success: false, error: 'No recoverable state found' };
  }

  /**
   * Add to undo stack
   */
  addToUndoStack(operation, state, backupKey) {
    this.undoStack.push({
      id: this.generateActionId(),
      operation,
      state,
      backupKey,
      timestamp: Date.now()
    });
    
    // Limit stack size
    if (this.undoStack.length > this.config.maxUndoSteps) {
      const removed = this.undoStack.shift();
      // Clean up old backup
      if (removed.backupKey) {
        localStorage.removeItem(`cafeos_state_${removed.backupKey}`);
      }
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Undo last action
   */
  async undo() {
    if (this.undoStack.length === 0) {
      return { success: false, error: 'Nothing to undo' };
    }

    const lastAction = this.undoStack.pop();
    
    try {
      // Load the state from backup
      const result = await this.loadState(lastAction.backupKey);
      
      if (result.success) {
        // Add to redo stack
        this.redoStack.push(lastAction);
        
        return {
          success: true,
          state: result.state,
          operation: lastAction.operation
        };
      }
      
      return { success: false, error: 'Failed to restore backup' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Redo last undone action
   */
  async redo() {
    if (this.redoStack.length === 0) {
      return { success: false, error: 'Nothing to redo' };
    }

    const action = this.redoStack.pop();
    
    try {
      // Restore the state
      this.undoStack.push(action);
      
      return {
        success: true,
        state: action.state,
        operation: action.operation
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, this.config.autoSaveInterval);
    
    console.log('[StatePersistence] Auto-save started');
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('[StatePersistence] Auto-save stopped');
    }
  }

  /**
   * Perform auto-save
   */
  async performAutoSave() {
    // This would be called with current app state
    // For now, it's a placeholder that would be integrated with the app
    console.log('[StatePersistence] Auto-save triggered');
  }

  /**
   * Load previous session
   */
  async loadPreviousSession() {
    const sessionInfo = localStorage.getItem('cafeos_session_info');
    
    if (sessionInfo) {
      try {
        const info = JSON.parse(sessionInfo);
        console.log('[StatePersistence] Previous session found:', info);
        
        // Check if crash occurred
        const lastSaveTime = info.lastSaveTime || 0;
        const timeSinceSave = Date.now() - lastSaveTime;
        
        // If more than 5 minutes since last save, likely a crash
        if (timeSinceSave > 5 * 60 * 1000) {
          console.warn('[StatePersistence] Possible crash detected, attempting recovery');
          await this.restoreAfterCrash();
        }
      } catch (error) {
        console.error('[StatePersistence] Failed to load session info:', error);
      }
    }
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    // Save session info
    const sessionInfo = {
      sessionId: this.currentSessionId,
      lastSaveTime: Date.now(),
      undoStackLength: this.undoStack.length
    };
    
    localStorage.setItem('cafeos_session_info', JSON.stringify(sessionInfo));
    
    // Mark as clean shutdown
    localStorage.setItem('cafeos_clean_shutdown', 'true');
  }

  /**
   * Mark as last known good state
   */
  async markAsLastKnownGood(state) {
    return await this.saveState(state, { 
      key: 'last_known_good',
      metadata: { type: 'last_known_good' }
    });
  }

  /**
   * Clear all saved states
   */
  clearAllStates() {
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cafeos_state_')) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    
    this.undoStack = [];
    this.redoStack = [];
    
    console.log('[StatePersistence] Cleared all saved states');
  }

  /**
   * Get state history
   */
  getStateHistory() {
    return {
      undoStack: this.undoStack.map(action => ({
        operation: action.operation,
        timestamp: action.timestamp
      })),
      redoStack: this.redoStack.map(action => ({
        operation: action.operation,
        timestamp: action.timestamp
      })),
      currentSessionId: this.currentSessionId
    };
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate action ID
   */
  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy state persistence
   */
  destroy() {
    this.stopAutoSave();
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.undoStack = [];
    this.redoStack = [];
    console.log('[StatePersistence] Destroyed');
  }
}

// Singleton instance
let statePersistenceInstance = null;

/**
 * Get the singleton state persistence instance
 */
export function getStatePersistence() {
  if (!statePersistenceInstance) {
    statePersistenceInstance = new StatePersistence();
  }
  return statePersistenceInstance;
}

export default StatePersistence;
