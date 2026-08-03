// Retry Manager
// Manages intelligent retry strategies for failed sync operations

export class RetryManager {
  constructor() {
    this.retryStrategies = new Map();
    this.retryHistory = [];
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 60000; // 1 minute
    this.storageKey = 'cafeos_retry_manager';
    this.loadState();
  }

  /**
   * Retry strategy types
   */
  static RetryStrategy = {
    IMMEDIATE: 'immediate',
    EXPONENTIAL_BACKOFF: 'exponential_backoff',
    FIXED_DELAY: 'fixed_delay',
    LINEAR_BACKOFF: 'linear_backoff'
  };

  /**
   * Calculate retry delay
   * @param {number} retryCount - Current retry count
   * @param {string} strategy - Retry strategy
   * @param {object} options - Additional options
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(retryCount, strategy = RetryManager.RetryStrategy.EXPONENTIAL_BACKOFF, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const baseDelay = options.baseDelay || this.baseDelay;
    const maxDelay = options.maxDelay || this.maxDelay;

    if (retryCount >= maxRetries) {
      return -1; // No more retries
    }

    switch (strategy) {
      case RetryManager.RetryStrategy.IMMEDIATE:
        return 0;

      case RetryManager.RetryStrategy.EXPONENTIAL_BACKOFF: {
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
        // Add some jitter to avoid thundering herd
        return exponentialDelay + Math.random() * 1000;
      }

      case RetryManager.RetryStrategy.FIXED_DELAY:
        return Math.min(baseDelay, maxDelay);

      case RetryManager.RetryStrategy.LINEAR_BACKOFF: {
        const linearDelay = Math.min(baseDelay * (retryCount + 1), maxDelay);
        return linearDelay + Math.random() * 500;
      }

      default:
        return Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    }
  }

  /**
   * Should retry based on error
   * @param {Error} error - Error that occurred
   * @param {number} retryCount - Current retry count
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, retryCount) {
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Don't retry on certain errors
    const nonRetryableErrors = [
      'authentication_failed',
      'permission_denied',
      'invalid_data',
      'not_found',
      'conflict'
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (nonRetryableErrors.some(pattern => errorMessage.includes(pattern))) {
      return false;
    }

    return true;
  }

  /**
   * Schedule a retry
   * @param {string} itemId - Sync item ID
   * @param {number} retryCount - Current retry count
   * @param {string} strategy - Retry strategy
   * @param {function} callback - Callback to execute
   * @param {object} options - Additional options
   * @returns {object} Retry schedule result
   */
  scheduleRetry(itemId, retryCount, strategy, callback, options = {}) {
    const delay = this.calculateDelay(retryCount, strategy, options);

    if (delay === -1) {
      return { success: false, reason: 'Max retries exceeded' };
    }

    const retryId = `retry_${itemId}_${retryCount}_${Date.now()}`;
    const scheduledAt = new Date().toISOString();
    const scheduledFor = new Date(Date.now() + delay).toISOString();

    const retryInfo = {
      retryId,
      itemId,
      retryCount,
      strategy,
      delay,
      scheduledAt,
      scheduledFor,
      callback,
      executed: false,
      cancelled: false
    };

    this.retryStrategies.set(retryId, retryInfo);

    // Schedule the retry
    const timeoutId = setTimeout(async () => {
      if (!retryInfo.cancelled) {
        retryInfo.executed = true;
        retryInfo.executedAt = new Date().toISOString();
        
        try {
          await callback();
          this.addToHistory({
            ...retryInfo,
            success: true
          });
        } catch (error) {
          this.addToHistory({
            ...retryInfo,
            success: false,
            error: error.message
          });
        }

        this.retryStrategies.delete(retryId);
        this.saveState();
      }
    }, delay);

    retryInfo.timeoutId = timeoutId;
    this.saveState();

    return { success: true, retryId, scheduledFor, delay };
  }

  /**
   * Cancel a scheduled retry
   * @param {string} retryId - Retry ID
   * @returns {boolean} Cancellation result
   */
  cancelRetry(retryId) {
    const retryInfo = this.retryStrategies.get(retryId);
    if (!retryInfo) {
      return false;
    }

    if (retryInfo.timeoutId) {
      clearTimeout(retryInfo.timeoutId);
    }

    retryInfo.cancelled = true;
    this.retryStrategies.delete(retryId);
    this.saveState();

    return true;
  }

  /**
   * Cancel all retries for an item
   * @param {string} itemId - Sync item ID
   * @returns {number} Number of retries cancelled
   */
  cancelItemRetries(itemId) {
    let cancelled = 0;

    for (const [retryId, retryInfo] of this.retryStrategies) {
      if (retryInfo.itemId === itemId) {
        this.cancelRetry(retryId);
        cancelled++;
      }
    }

    return cancelled;
  }

  /**
   * Get retry info
   * @param {string} retryId - Retry ID
   * @returns {object|null} Retry info
   */
  getRetryInfo(retryId) {
    return this.retryStrategies.get(retryId) || null;
  }

  /**
   * Get all active retries
   * @returns {Array} Active retries
   */
  getActiveRetries() {
    return Array.from(this.retryStrategies.values()).filter(r => !r.executed && !r.cancelled);
  }

  /**
   * Get retry history
   * @param {object} filters - Optional filters
   * @returns {Array} Retry history
   */
  getRetryHistory(filters = {}) {
    let history = [...this.retryHistory];

    if (filters.itemId) {
      history = history.filter(r => r.itemId === filters.itemId);
    }

    if (filters.success !== undefined) {
      history = history.filter(r => r.success === filters.success);
    }

    if (filters.since) {
      history = history.filter(r => new Date(r.scheduledAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by scheduled date descending
    history.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    return history;
  }

  /**
   * Get retry statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const activeRetries = this.getActiveRetries();
    const history = this.retryHistory;

    const successfulRetries = history.filter(r => r.success).length;
    const failedRetries = history.filter(r => !r.success).length;
    const totalRetries = history.length;

    const byStrategy = {};
    history.forEach(r => {
      byStrategy[r.strategy] = (byStrategy[r.strategy] || 0) + 1;
    });

    const averageDelay = totalRetries > 0
      ? history.reduce((sum, r) => sum + r.delay, 0) / totalRetries
      : 0;

    return {
      activeRetries: activeRetries.length,
      successfulRetries,
      failedRetries,
      totalRetries,
      successRate: totalRetries > 0 ? (successfulRetries / totalRetries) * 100 : 0,
      averageDelay,
      byStrategy
    };
  }

  /**
   * Add to retry history
   * @param {object} retryInfo - Retry info
   */
  addToHistory(retryInfo) {
    this.retryHistory.push(retryInfo);

    // Trim history if it exceeds max size
    if (this.retryHistory.length > 200) {
      this.retryHistory = this.retryHistory.slice(-200);
    }
  }

  /**
   * Clear all scheduled retries
   */
  clearAllRetries() {
    for (const [retryId, _retryInfo] of this.retryStrategies) {
      this.cancelRetry(retryId);
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        retryHistory: this.retryHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save retry manager state:', error);
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
        this.retryHistory = parsed.retryHistory || [];
      }
    } catch (error) {
      console.error('Failed to load retry manager state:', error);
    }
  }

  /**
   * Destroy the retry manager
   */
  destroy() {
    this.clearAllRetries();
    this.retryHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[RetryManager] Destroyed');
  }
}

// Singleton instance
let retryManagerInstance = null;

/**
 * Get the singleton retry manager instance
 * @returns {RetryManager} Retry manager instance
 */
export function getRetryManager() {
  if (!retryManagerInstance) {
    retryManagerInstance = new RetryManager();
  }
  return retryManagerInstance;
}

export default RetryManager;
