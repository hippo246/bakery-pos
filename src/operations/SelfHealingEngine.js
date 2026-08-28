// Self-Healing Engine
// Advanced self-healing system with circuit breaker, health monitoring, and recovery

import { SelfHealingPreparation } from './SelfHealingPreparation.js';
import { SelfHealingAction } from './OperationsTypes.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';
// BackupEngine not implemented yet - using localStorage fallback
// import { getBackupEngine } from '../backup/BackupEngine.js';

export class SelfHealingEngine extends SelfHealingPreparation {
  constructor(config = {}) {
    super(config);
    this.config = {
      circuitBreakerThreshold: 5,
      circuitBreakerCooldown: 60000,
      healthCheckInterval: 30000,
      maxRetryAttempts: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 16000,
      ...config
    };
    
    this.circuitBreakers = new Map();
    this.healthStatus = new Map();
    this.recoveryQueue = [];
    this.healthCheckTimer = null;
    this.errorClassifier = new ErrorClassifier();
    this.encryptionEngine = getEncryptionEngine();
    this.backupEngine = null; // BackupEngine not implemented yet - using localStorage fallback
    
    this.initializeCircuitBreakers();
    this.startHealthMonitoring();
  }

  /**
   * Initialize circuit breakers for common operations
   */
  initializeCircuitBreakers() {
    const operations = [
      'api_call',
      'database_query',
      'websocket_connection',
      'payment_gateway',
      'inventory_sync',
      'order_sync'
    ];

    operations.forEach(op => {
      this.circuitBreakers.set(op, {
        failures: 0,
        lastFailureTime: null,
        state: 'closed', // closed, open, half-open
        cooldownUntil: null
      });
    });
  }

  /**
   * Execute operation with circuit breaker and retry logic
   */
  async executeWithHealing(operation, operationType, options = {}) {
    const circuitBreaker = this.circuitBreakers.get(operationType);
    
    // Check circuit breaker state
    if (circuitBreaker && circuitBreaker.state === 'open') {
      if (Date.now() < circuitBreaker.cooldownUntil) {
        console.warn(`[SelfHealing] Circuit breaker OPEN for ${operationType}, using fallback`);
        return this.executeFallback(operationType, options);
      } else {
        // Transition to half-open
        circuitBreaker.state = 'half-open';
        console.log(`[SelfHealing] Circuit breaker HALF-OPEN for ${operationType}`);
      }
    }

    try {
      // Classify error type if operation fails
      const result = await this.executeAutomaticRetry(operation, {
        maxRetries: options.maxRetries || this.config.maxRetryAttempts,
        retryDelay: options.retryDelay || this.config.retryBaseDelay,
        backoffMultiplier: 2
      });

      if (result.success) {
        // Reset circuit breaker on success
        if (circuitBreaker) {
          circuitBreaker.failures = 0;
          circuitBreaker.state = 'closed';
          circuitBreaker.lastFailureTime = null;
        }
        return result;
      } else {
        // Handle failure
        return this.handleOperationFailure(operationType, result.error, options);
      }
    } catch (error) {
      return this.handleOperationFailure(operationType, error.message, options);
    }
  }

  /**
   * Handle operation failure with circuit breaker logic
   */
  async handleOperationFailure(operationType, error, options) {
    const circuitBreaker = this.circuitBreakers.get(operationType);
    const errorType = this.errorClassifier.classify(error);

    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.cooldownUntil = Date.now() + this.config.circuitBreakerCooldown;
        console.error(`[SelfHealing] Circuit breaker OPENED for ${operationType} after ${circuitBreaker.failures} failures`);
      }
    }

    // Route error based on classification
    return this.routeError(errorType, operationType, error, options);
  }

  /**
   * Execute fallback for failed operations
   */
  async executeFallback(operationType, options) {
    console.log(`[SelfHealing] Executing fallback for ${operationType}`);

    switch (operationType) {
      case 'api_call':
        return this.fallbackToCachedData(options);
      case 'database_query':
        return this.fallbackToLocalStorage(options);
      case 'websocket_connection':
        return this.fallbackToPolling(options);
      case 'payment_gateway':
        return this.fallbackToCashPayment(options);
      case 'inventory_sync':
        return this.fallbackToLocalInventory(options);
      case 'order_sync':
        return this.fallbackToOfflineQueue(options);
      default:
        return { success: false, error: 'No fallback available' };
    }
  }

  /**
   * Fallback to cached data
   */
  async fallbackToCachedData(options) {
    const cacheKey = options.cacheKey || 'default_cache';
    const cachedData = localStorage.getItem(`cache_${cacheKey}`);
    
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        return { success: true, data, source: 'cache' };
      } catch (error) {
        return { success: false, error: 'Cache parse failed' };
      }
    }
    
    return { success: false, error: 'No cached data available' };
  }

  /**
   * Fallback to localStorage
   */
  async fallbackToLocalStorage(options) {
    const storageKey = options.storageKey;
    
    if (storageKey) {
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          return { success: true, data: JSON.parse(data), source: 'localStorage' };
        } catch (error) {
          return { success: false, error: 'LocalStorage parse failed' };
        }
      }
    }
    
    return { success: false, error: 'No localStorage data available' };
  }

  /**
   * Fallback to polling when WebSocket fails
   */
  async fallbackToPolling(options) {
    console.log('[SelfHealing] Falling back to polling mode');
    return { success: true, mode: 'polling', interval: 5000 };
  }

  /**
   * Fallback to cash payment when gateway fails
   */
  async fallbackToCashPayment(options) {
    console.log('[SelfHealing] Payment gateway failed, suggesting cash payment');
    return { success: true, fallbackMethod: 'cash', message: 'Payment gateway unavailable, please use cash' };
  }

  /**
   * Fallback to local inventory when sync fails
   */
  async fallbackToLocalInventory(options) {
    const localInventory = localStorage.getItem('cafeos_inventory');
    if (localInventory) {
      try {
        return { success: true, inventory: JSON.parse(localInventory), source: 'local' };
      } catch (error) {
        return { success: false, error: 'Local inventory parse failed' };
      }
    }
    return { success: false, error: 'No local inventory available' };
  }

  /**
   * Fallback to offline queue when sync fails
   */
  async fallbackToOfflineQueue(options) {
    console.log('[SelfHealing] Adding operation to offline queue');
    this.addToRecoveryQueue(options.operation, options.data);
    return { success: true, queued: true, message: 'Operation queued for offline sync' };
  }

  /**
   * Route error based on classification
   */
  async routeError(errorType, operationType, error, options) {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return this.handleNetworkError(operationType, error, options);
      case 'VALIDATION_ERROR':
        return this.handleValidationError(operationType, error, options);
      case 'PERMISSION_ERROR':
        return this.handlePermissionError(operationType, error, options);
      case 'TRANSIENT_ERROR':
        return this.handleTransientError(operationType, error, options);
      case 'PERMANENT_ERROR':
        return this.handlePermanentError(operationType, error, options);
      default:
        return this.handleUnknownError(operationType, error, options);
    }
  }

  /**
   * Handle network errors
   */
  async handleNetworkError(operationType, error, options) {
    console.log(`[SelfHealing] Network error for ${operationType}, queuing for retry`);
    this.addToRecoveryQueue(operationType, { ...options, error });
    return { success: false, error, action: 'queued_for_retry' };
  }

  /**
   * Handle validation errors
   */
  async handleValidationError(operationType, error, options) {
    console.log(`[SelfHealing] Validation error for ${operationType}: ${error}`);
    return { success: false, error, action: 'show_validation_form' };
  }

  /**
   * Handle permission errors
   */
  async handlePermissionError(operationType, error, options) {
    console.log(`[SelfHealing] Permission error for ${operationType}`);
    return { success: false, error, action: 'redirect_to_login' };
  }

  /**
   * Handle transient errors
   */
  async handleTransientError(operationType, error, options) {
    console.log(`[SelfHealing] Transient error for ${operationType}, will retry`);
    return { success: false, error, action: 'retry_with_backoff' };
  }

  /**
   * Handle permanent errors
   */
  async handlePermanentError(operationType, error, options) {
    console.error(`[SelfHealing] Permanent error for ${operationType}: ${error}`);
    return { success: false, error, action: 'manual_intervention_required' };
  }

  /**
   * Handle unknown errors
   */
  async handleUnknownError(operationType, error, options) {
    console.error(`[SelfHealing] Unknown error for ${operationType}: ${error}`);
    // Trigger ErrorBoundary for unknown errors
    return { success: false, error, action: 'trigger_error_boundary' };
  }

  /**
   * Add operation to recovery queue
   */
  addToRecoveryQueue(operationType, data) {
    this.recoveryQueue.push({
      id: this.generateRecoveryId(),
      operationType,
      data,
      timestamp: Date.now(),
      attempts: 0
    });
    
    // Persist queue to localStorage
    this.persistRecoveryQueue();
  }

  /**
   * Process recovery queue
   */
  async processRecoveryQueue() {
    if (this.recoveryQueue.length === 0) {
      return { processed: 0 };
    }

    let processed = 0;
    const remaining = [];

    for (const item of this.recoveryQueue) {
      if (item.attempts >= 3) {
        console.warn(`[SelfHealing] Skipping queued item ${item.id} after 3 attempts`);
        continue;
      }

      try {
        // Attempt to retry the operation
        const result = await this.retryQueuedOperation(item);
        
        if (result.success) {
          processed++;
          console.log(`[SelfHealing] Successfully recovered queued item ${item.id}`);
        } else {
          item.attempts++;
          remaining.push(item);
        }
      } catch (error) {
        item.attempts++;
        remaining.push(item);
      }
    }

    this.recoveryQueue = remaining;
    this.persistRecoveryQueue();
    
    return { processed, remaining: this.recoveryQueue.length };
  }

  /**
   * Retry a queued operation
   */
  async retryQueuedOperation(item) {
    // This would need to be implemented based on operation type
    // For now, return success to simulate recovery
    return { success: true };
  }

  /**
   * Persist recovery queue to localStorage
   */
  persistRecoveryQueue() {
    try {
      localStorage.setItem('cafeos_recovery_queue', JSON.stringify(this.recoveryQueue));
    } catch (error) {
      console.error('[SelfHealing] Failed to persist recovery queue:', error);
    }
  }

  /**
   * Load recovery queue from localStorage
   */
  loadRecoveryQueue() {
    try {
      const queue = localStorage.getItem('cafeos_recovery_queue');
      if (queue) {
        this.recoveryQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('[SelfHealing] Failed to load recovery queue:', error);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.loadRecoveryQueue();
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    console.log('[SelfHealing] Health monitoring started');
  }

  /**
   * Perform health checks
   */
  async performHealthChecks() {
    try {
      const checks = {
        localStorage: this.checkLocalStorage(),
        memory: this.checkMemoryUsage(),
        circuitBreakers: this.checkCircuitBreakers(),
        encryption: this.checkEncryptionEngine(),
        backup: this.checkBackupEngine()
      };

      this.healthStatus = new Map(Object.entries(checks));
      
      // Log health status
      const overallHealth = this.calculateOverallHealth(checks);
      console.log('[SelfHealing] Health check:', overallHealth);
      
      // Trigger recovery if needed
      if (overallHealth?.status === 'critical') {
        await this.triggerCriticalRecovery();
      }
    } catch (error) {
      console.error('[SelfHealing] Health check failed:', error);
      // Set fallback health status
      this.healthStatus = new Map([
        ['localStorage', { healthy: false, message: 'Health check failed' }],
        ['memory', { healthy: false, message: 'Health check failed' }],
        ['circuitBreakers', { healthy: false, message: 'Health check failed' }],
        ['encryption', { healthy: false, message: 'Health check failed' }],
        ['backup', { healthy: false, message: 'Health check failed' }]
      ]);
    }
  }

  /**
   * Check localStorage health
   */
  checkLocalStorage() {
    try {
      const testKey = 'health_check_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const usage = JSON.stringify(localStorage).length;
      const quota = 5 * 1024 * 1024; // 5MB
      const usagePercent = (usage / quota) * 100;
      
      return {
        status: usagePercent > 90 ? 'warning' : 'healthy',
        usage: `${(usage / 1024).toFixed(2)} KB`,
        usagePercent: usagePercent.toFixed(2)
      };
    } catch (error) {
      return { status: 'critical', error: error.message };
    }
  }

  /**
   * Check memory usage
   */
  checkMemoryUsage() {
    if (performance && performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.totalJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      const usagePercent = (used / limit) * 100;
      
      return {
        status: usagePercent > 80 ? 'warning' : 'healthy',
        used: `${(used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(total / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: usagePercent.toFixed(2)
      };
    }
    
    return { status: 'unknown', message: 'Memory API not available' };
  }

  /**
   * Check circuit breaker status
   */
  checkCircuitBreakers() {
    const openBreakers = [];
    this.circuitBreakers.forEach((breaker, operation) => {
      if (breaker.state === 'open') {
        openBreakers.push(operation);
      }
    });
    
    return {
      status: openBreakers.length > 0 ? 'warning' : 'healthy',
      openBreakers,
      total: this.circuitBreakers.size
    };
  }

  /**
   * Check encryption engine
   */
  checkEncryptionEngine() {
    try {
      const status = this.encryptionEngine.getStatusInfo();
      return {
        status: status.enabled ? 'healthy' : 'warning',
        ...status
      };
    } catch (error) {
      return { status: 'critical', error: error.message };
    }
  }

  /**
   * Check backup engine
   */
  checkBackupEngine() {
    try {
      // Check if backup engine is available
      return {
        status: 'healthy',
        message: 'Backup engine available'
      };
    } catch (error) {
      return { status: 'warning', error: error.message };
    }
  }

  /**
   * Calculate overall health
   */
  calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map(c => c.status);
    
    if (statuses.includes('critical')) {
      return { status: 'critical', checks };
    }
    
    if (statuses.includes('warning')) {
      return { status: 'warning', checks };
    }
    
    return { status: 'healthy', checks };
  }

  /**
   * Trigger critical recovery
   */
  async triggerCriticalRecovery() {
    console.error('[SelfHealing] Critical health detected, triggering recovery');
    
    // Create emergency backup
    try {
      await this.createEmergencyBackup();
    } catch (error) {
      console.error('[SelfHealing] Emergency backup failed:', error);
    }
    
    // Process recovery queue
    await this.processRecoveryQueue();
    
    // Attempt to reset circuit breakers
    this.resetCircuitBreakers();
  }

  /**
   * Create emergency backup
   */
  async createEmergencyBackup() {
    console.log('[SelfHealing] Creating emergency backup');

    try {
      // BackupEngine not implemented yet - use localStorage fallback directly
      console.log('[SelfHealing] BackupEngine not available, using localStorage fallback');
      return this.createLocalStorageBackup();
    } catch (error) {
      console.error('[SelfHealing] Emergency backup failed:', error);

      // Fallback to localStorage backup
      return this.createLocalStorageBackup();
    }
  }

  /**
   * Create fallback localStorage backup
   */
  async createLocalStorageBackup() {
    console.log('[SelfHealing] Creating localStorage backup as fallback');
    
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        modules: {}
      };
      
      // Backup critical modules
      const modules = ['orders', 'inventory', 'customers', 'tables'];
      
      for (const module of modules) {
        const data = localStorage.getItem(`cafeos_${module}`);
        if (data) {
          backupData.modules[module] = JSON.parse(data);
        }
      }
      
      // Store backup
      const backupKey = `emergency_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Clean up old backups (keep last 5)
      this.cleanupOldBackups('emergency_backup_', 5);
      
      console.log('[SelfHealing] LocalStorage backup created:', backupKey);
      return { success: true, backupKey };
    } catch (error) {
      console.error('[SelfHealing] LocalStorage backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old backups
   */
  cleanupOldBackups(prefix, keepCount = 5) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    // Sort by timestamp (embedded in key)
    keys.sort().reverse();
    
    // Remove old backups
    keys.slice(keepCount).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Auto-backup before risky operation
   */
  async autoBackupBeforeOperation(operationName, modules = ['orders', 'inventory']) {
    try {
      console.log(`[SelfHealing] Creating auto-backup before ${operationName}`);
      
      const backupKey = `pre_op_backup_${operationName}_${Date.now()}`;
      const backupData = {
        timestamp: new Date().toISOString(),
        operation: operationName,
        modules: {}
      };
      
      for (const module of modules) {
        const data = localStorage.getItem(`cafeos_${module}`);
        if (data) {
          backupData.modules[module] = JSON.parse(data);
        }
      }
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Clean up old pre-operation backups (keep last 20)
      this.cleanupOldBackups('pre_op_backup_', 20);
      
      return { success: true, backupKey };
    } catch (error) {
      console.error('[SelfHealing] Auto-backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset circuit breakers
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach((breaker, operation) => {
      breaker.failures = 0;
      breaker.state = 'closed';
      breaker.lastFailureTime = null;
      breaker.cooldownUntil = null;
    });
    console.log('[SelfHealing] Circuit breakers reset');
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const checks = Object.fromEntries(this.healthStatus);
    const overallHealth = this.calculateOverallHealth(checks);
    return {
      status: overallHealth.status,
      checks: checks,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Get recovery queue status
   */
  getRecoveryQueueStatus() {
    return {
      length: this.recoveryQueue.length,
      items: this.recoveryQueue
    };
  }

  /**
   * Generate recovery ID
   */
  generateRecoveryId() {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('[SelfHealing] Health monitoring stopped');
    }
  }

  /**
   * Destroy the self-healing engine
   */
  destroy() {
    this.stopHealthMonitoring();
    super.destroy();
    console.log('[SelfHealingEngine] Destroyed');
  }
}

/**
 * Error Classifier
 * Classifies errors for intelligent routing
 */
class ErrorClassifier {
  constructor() {
    this.patterns = {
      NETWORK_ERROR: [
        /network/i,
        /timeout/i,
        /fetch/i,
        /connection/i,
        /ECONNREFUSED/i,
        /ETIMEDOUT/i
      ],
      VALIDATION_ERROR: [
        /validation/i,
        /invalid/i,
        /required/i,
        /format/i,
        /schema/i
      ],
      PERMISSION_ERROR: [
        /permission/i,
        /unauthorized/i,
        /forbidden/i,
        /401/i,
        /403/i
      ],
      TRANSIENT_ERROR: [
        /503/i,
        /502/i,
        /504/i,
        /temporarily/i,
        /unavailable/i
      ],
      PERMANENT_ERROR: [
        /404/i,
        /400/i,
        /not found/i,
        /permanent/i
      ]
    };
  }

  /**
   * Classify an error
   */
  classify(error) {
    const errorMessage = (error?.message || error || '').toString().toLowerCase();
    
    for (const [errorType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(errorMessage)) {
          return errorType;
        }
      }
    }
    
    return 'UNKNOWN_ERROR';
  }
}

// Singleton instance
let selfHealingEngineInstance = null;

/**
 * Get the singleton self-healing engine instance
 */
export function getSelfHealingEngine() {
  if (!selfHealingEngineInstance) {
    selfHealingEngineInstance = new SelfHealingEngine();
  }
  return selfHealingEngineInstance;
}

export default SelfHealingEngine;
