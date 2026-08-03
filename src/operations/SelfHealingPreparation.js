// Self-Healing Preparation
// Prepares architecture for automatic recovery actions

import { SelfHealingAction } from './OperationsTypes.js';

export class SelfHealingPreparation {
  constructor() {
    this.healingActions = new Map();
    this.healingHistory = new Map();
    this.enabled = false;
    this.initializeHealingActions();
  }

  /**
   * Initialize healing actions
   */
  initializeHealingActions() {
    this.healingActions.set(SelfHealingAction.AUTOMATIC_RETRY, {
      action: SelfHealingAction.AUTOMATIC_RETRY,
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      enabled: false
    });

    this.healingActions.set(SelfHealingAction.AUTOMATIC_RECONNECT, {
      action: SelfHealingAction.AUTOMATIC_RECONNECT,
      maxAttempts: 5,
      reconnectDelay: 2000,
      enabled: false
    });

    this.healingActions.set(SelfHealingAction.AUTOMATIC_SERVICE_RESTART, {
      action: SelfHealingAction.AUTOMATIC_SERVICE_RESTART,
      maxRestarts: 3,
      restartDelay: 5000,
      cooldownPeriod: 30000,
      enabled: false
    });

    this.healingActions.set(SelfHealingAction.AUTOMATIC_QUEUE_RECOVERY, {
      action: SelfHealingAction.AUTOMATIC_QUEUE_RECOVERY,
      maxRecoveryAttempts: 5,
      recoveryDelay: 1000,
      enabled: false
    });

    this.healingActions.set(SelfHealingAction.AUTOMATIC_CACHE_REBUILD, {
      action: SelfHealingAction.AUTOMATIC_CACHE_REBUILD,
      maxRebuildAttempts: 2,
      rebuildDelay: 5000,
      enabled: false
    });
  }

  /**
   * Enable self-healing
   */
  enableSelfHealing() {
    this.enabled = true;
  }

  /**
   * Disable self-healing
   */
  disableSelfHealing() {
    this.enabled = false;
  }

  /**
   * Enable healing action
   * @param {string} action - Healing action
   */
  enableHealingAction(action) {
    const actionConfig = this.healingActions.get(action);
    if (actionConfig) {
      actionConfig.enabled = true;
      this.healingActions.set(action, actionConfig);
    }
  }

  /**
   * Disable healing action
   * @param {string} action - Healing action
   */
  disableHealingAction(action) {
    const actionConfig = this.healingActions.get(action);
    if (actionConfig) {
      actionConfig.enabled = false;
      this.healingActions.set(action, actionConfig);
    }
  }

  /**
   * Execute automatic retry
   * @param {function} operation - Operation to retry
   * @param {object} options - Retry options
   * @returns {Promise<object>} Retry result
   */
  async executeAutomaticRetry(operation, options = {}) {
    const actionConfig = this.healingActions.get(SelfHealingAction.AUTOMATIC_RETRY);
    
    if (!this.enabled || !actionConfig.enabled) {
      return { success: false, reason: 'Automatic retry not enabled' };
    }

    const maxRetries = options.maxRetries || actionConfig.maxRetries;
    const retryDelay = options.retryDelay || actionConfig.retryDelay;
    const backoffMultiplier = options.backoffMultiplier || actionConfig.backoffMultiplier;

    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      try {
        const result = await operation();
        
        this.recordHealingAction(SelfHealingAction.AUTOMATIC_RETRY, {
          success: true,
          attempts: attempt + 1
        });

        return { success: true, result, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.recordHealingAction(SelfHealingAction.AUTOMATIC_RETRY, {
      success: false,
      attempts: attempt,
      error: lastError?.message
    });

    return { success: false, reason: 'Max retries exceeded', attempts: attempt, error: lastError?.message };
  }

  /**
   * Execute automatic reconnect
   * @param {function} connectFunction - Connect function
   * @param {object} options - Reconnect options
   * @returns {Promise<object>} Reconnect result
   */
  async executeAutomaticReconnect(connectFunction, options = {}) {
    const actionConfig = this.healingActions.get(SelfHealingAction.AUTOMATIC_RECONNECT);
    
    if (!this.enabled || !actionConfig.enabled) {
      return { success: false, reason: 'Automatic reconnect not enabled' };
    }

    const maxAttempts = options.maxAttempts || actionConfig.maxAttempts;
    const reconnectDelay = options.reconnectDelay || actionConfig.reconnectDelay;

    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts) {
      try {
        const result = await connectFunction();
        
        this.recordHealingAction(SelfHealingAction.AUTOMATIC_RECONNECT, {
          success: true,
          attempts: attempt + 1
        });

        return { success: true, result, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, reconnectDelay));
        }
      }
    }

    this.recordHealingAction(SelfHealingAction.AUTOMATIC_RECONNECT, {
      success: false,
      attempts: attempt,
      error: lastError?.message
    });

    return { success: false, reason: 'Max reconnect attempts exceeded', attempts: attempt, error: lastError?.message };
  }

  /**
   * Execute automatic service restart
   * @param {string} service - Service to restart
   * @param {function} restartFunction - Restart function
   * @returns {Promise<object>} Restart result
   */
  async executeAutomaticServiceRestart(service, restartFunction) {
    const actionConfig = this.healingActions.get(SelfHealingAction.AUTOMATIC_SERVICE_RESTART);
    
    if (!this.enabled || !actionConfig.enabled) {
      return { success: false, reason: 'Automatic service restart not enabled' };
    }

    const cooldownKey = `restart_cooldown_${service}`;
    const lastRestart = this.healingHistory.get(cooldownKey);
    
    if (lastRestart) {
      const cooldownPeriod = actionConfig.cooldownPeriod;
      const elapsed = Date.now() - new Date(lastRestart).getTime();
      
      if (elapsed < cooldownPeriod) {
        return { success: false, reason: 'Service restart in cooldown period' };
      }
    }

    try {
      await restartFunction();
      
      this.healingHistory.set(cooldownKey, new Date().toISOString());
      
      this.recordHealingAction(SelfHealingAction.AUTOMATIC_SERVICE_RESTART, {
        success: true,
        service
      });

      return { success: true, service };
    } catch (error) {
      this.recordHealingAction(SelfHealingAction.AUTOMATIC_SERVICE_RESTART, {
        success: false,
        service,
        error: error.message
      });

      return { success: false, reason: error.message, service };
    }
  }

  /**
   * Execute automatic queue recovery
   * @param {string} queue - Queue to recover
   * @param {function} recoveryFunction - Recovery function
   * @returns {Promise<object>} Recovery result
   */
  async executeAutomaticQueueRecovery(queue, recoveryFunction) {
    const actionConfig = this.healingActions.get(SelfHealingAction.AUTOMATIC_QUEUE_RECOVERY);
    
    if (!this.enabled || !actionConfig.enabled) {
      return { success: false, reason: 'Automatic queue recovery not enabled' };
    }

    const maxAttempts = actionConfig.maxRecoveryAttempts;
    const recoveryDelay = actionConfig.recoveryDelay;

    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts) {
      try {
        const result = await recoveryFunction();
        
        this.recordHealingAction(SelfHealingAction.AUTOMATIC_QUEUE_RECOVERY, {
          success: true,
          queue,
          attempts: attempt + 1
        });

        return { success: true, result, queue, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, recoveryDelay));
        }
      }
    }

    this.recordHealingAction(SelfHealingAction.AUTOMATIC_QUEUE_RECOVERY, {
      success: false,
      queue,
      attempts: attempt,
      error: lastError?.message
    });

    return { success: false, reason: 'Max recovery attempts exceeded', queue, attempts: attempt, error: lastError?.message };
  }

  /**
   * Execute automatic cache rebuild
   * @param {string} cache - Cache to rebuild
   * @param {function} rebuildFunction - Rebuild function
   * @returns {Promise<object>} Rebuild result
   */
  async executeAutomaticCacheRebuild(cache, rebuildFunction) {
    const actionConfig = this.healingActions.get(SelfHealingAction.AUTOMATIC_CACHE_REBUILD);
    
    if (!this.enabled || !actionConfig.enabled) {
      return { success: false, reason: 'Automatic cache rebuild not enabled' };
    }

    const maxAttempts = actionConfig.maxRebuildAttempts;
    const rebuildDelay = actionConfig.rebuildDelay;

    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts) {
      try {
        const result = await rebuildFunction();
        
        this.recordHealingAction(SelfHealingAction.AUTOMATIC_CACHE_REBUILD, {
          success: true,
          cache,
          attempts: attempt + 1
        });

        return { success: true, result, cache, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, rebuildDelay));
        }
      }
    }

    this.recordHealingAction(SelfHealingAction.AUTOMATIC_CACHE_REBUILD, {
      success: false,
      cache,
      attempts: attempt,
      error: lastError?.message
    });

    return { success: false, reason: 'Max rebuild attempts exceeded', cache, attempts: attempt, error: lastError?.message };
  }

  /**
   * Record healing action
   * @param {string} action - Healing action
   * @param {object} details - Action details
   */
  recordHealingAction(action, details) {
    const historyId = this.generateHistoryId();
    
    this.healingHistory.set(historyId, {
      historyId,
      action,
      timestamp: new Date().toISOString(),
      details
    });
  }

  /**
   * Get healing history
   * @param {object} filters - Optional filters
   * @returns {Array} Healing history
   */
  getHealingHistory(filters = {}) {
    let history = Array.from(this.healingHistory.values());

    if (filters.action) {
      history = history.filter(h => h.action === filters.action);
    }

    if (filters.since) {
      history = history.filter(h => new Date(h.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return history;
  }

  /**
   * Get healing action configuration
   * @param {string} action - Healing action
   * @returns {object|null} Action configuration
   */
  getHealingActionConfig(action) {
    return this.healingActions.get(action) || null;
  }

  /**
   * Get all healing action configurations
   * @returns {object} All configurations
   */
  getAllHealingActionConfigs() {
    return Object.fromEntries(this.healingActions);
  }

  /**
   * Generate history ID
   * @returns {string} History ID
   */
  generateHistoryId() {
    return `healing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy the self-healing preparation
   */
  destroy() {
    this.healingActions.clear();
    this.healingHistory.clear();
    console.log('[SelfHealingPreparation] Destroyed');
  }
}

// Singleton instance
let selfHealingPreparationInstance = null;

/**
 * Get the singleton self-healing preparation instance
 * @returns {SelfHealingPreparation} Self-healing preparation instance
 */
export function getSelfHealingPreparation() {
  if (!selfHealingPreparationInstance) {
    selfHealingPreparationInstance = new SelfHealingPreparation();
  }
  return selfHealingPreparationInstance;
}

export default SelfHealingPreparation;
