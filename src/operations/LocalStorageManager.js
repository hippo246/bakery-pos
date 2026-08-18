// LocalStorage Quota Management
// Monitor localStorage usage, auto-cleanup, compression, and IndexedDB fallback

export class LocalStorageManager {
  constructor() {
    this.quotaLimit = 5 * 1024 * 1024; // 5MB limit
    this.warningThreshold = 4 * 1024 * 1024; // 4MB warning threshold
    this.criticalThreshold = 4.5 * 1024 * 1024; // 4.5MB critical threshold
    this.usage = 0;
    this.usagePercentage = 0;
    this.compressionEnabled = true;
    this.indexedDBFallbackEnabled = true;
    this.cleanupRules = this.getDefaultCleanupRules();
    this.usageHistory = [];
    this.loadUsageHistory();
  }

  /**
   * Get default cleanup rules
   */
  getDefaultCleanupRules() {
    return {
      logs: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxSize: 1024 * 1024, // 1MB
        keys: ['cafeos_webhook_log', 'cafeos_data_migration_log', 'cafeos_status_update_history']
      },
      cache: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        maxSize: 512 * 1024, // 512KB
        keys: ['cafeos_cache_', 'cafeos_menu_cache']
      },
      history: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxSize: 2 * 1024 * 1024, // 2MB
        keys: ['cafeos_menu_sync_history', 'cafeos_settlement_history']
      },
      temp: {
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
        maxSize: 256 * 1024, // 256KB
        keys: ['cafeos_temp_', 'cafeos_draft_']
      }
    };
  }

  /**
   * Calculate current localStorage usage
   */
  calculateUsage() {
    let total = 0;
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2; // UTF-16 uses 2 bytes per character
      }
    }
    
    this.usage = total;
    this.usagePercentage = (total / this.quotaLimit) * 100;
    
    return {
      used: total,
      limit: this.quotaLimit,
      percentage: this.usagePercentage,
      remaining: this.quotaLimit - total
    };
  }

  /**
   * Check if near quota limit
   */
  isNearQuota() {
    const usage = this.calculateUsage();
    return usage.used >= this.warningThreshold;
  }

  /**
   * Check if at critical quota level
   */
  isAtCriticalQuota() {
    const usage = this.calculateUsage();
    return usage.used >= this.criticalThreshold;
  }

  /**
   * Compress data before storage
   */
  async compressData(data) {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }

    try {
      const jsonString = JSON.stringify(data);
      
      // Simple compression: remove unnecessary whitespace
      const compressed = jsonString
        .replace(/\s+/g, ' ')
        .replace(/\{\s+/g, '{')
        .replace(/\}\s+/g, '}')
        .replace(/\[\s+/g, '[')
        .replace(/\]\s+/g, ']')
        .replace(/,\s+/g, ',')
        .replace(/:\s+/g, ':');
      
      return compressed;
    } catch (error) {
      console.error('[LocalStorageManager] Compression failed:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data after retrieval
   */
  decompressData(compressedString) {
    try {
      return JSON.parse(compressedString);
    } catch (error) {
      console.error('[LocalStorageManager] Decompression failed:', error);
      return compressedString;
    }
  }

  /**
   * Save data with quota management
   */
  async save(key, data) {
    const usageBefore = this.calculateUsage();
    
    // Check if near quota before saving
    if (this.isAtCriticalQuota()) {
      await this.performCleanup();
    }

    try {
      const compressed = await this.compressData(data);
      
      // Try to save to localStorage
      try {
        localStorage.setItem(key, compressed);
        this.logUsage('save', key, usageBefore.used);
        return { success: true, storage: 'localStorage' };
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('[LocalStorageManager] Quota exceeded, attempting cleanup');
          
          // Perform emergency cleanup
          await this.performEmergencyCleanup();
          
          // Try again
          try {
            localStorage.setItem(key, compressed);
            this.logUsage('save_after_cleanup', key, usageBefore.used);
            return { success: true, storage: 'localStorage' };
          } catch (retryError) {
            // Fallback to IndexedDB
            if (this.indexedDBFallbackEnabled) {
              return await this.saveToIndexedDB(key, data);
            }
            throw retryError;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('[LocalStorageManager] Save failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load data with decompression
   */
  async load(key) {
    try {
      const compressed = localStorage.getItem(key);
      if (compressed === null) {
        return null;
      }
      
      return this.decompressData(compressed);
    } catch (error) {
      console.error('[LocalStorageManager] Load failed:', error);
      return null;
    }
  }

  /**
   * Save to IndexedDB as fallback
   */
  async saveToIndexedDB(key, data) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cafeos_data'], 'readwrite');
      const store = transaction.objectStore('cafeos_data');
      
      return new Promise((resolve, reject) => {
        const request = store.put({ key, data, timestamp: Date.now() });
        
        request.onsuccess = () => {
          resolve({ success: true, storage: 'indexedDB' });
        };
        
        request.onerror = () => {
          reject(new Error('IndexedDB save failed'));
        };
      });
    } catch (error) {
      console.error('[LocalStorageManager] IndexedDB fallback failed:', error);
      return { success: false, error: error.message, storage: 'indexedDB' };
    }
  }

  /**
   * Load from IndexedDB
   */
  async loadFromIndexedDB(key) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cafeos_data'], 'readonly');
      const store = transaction.objectStore('cafeos_data');
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result ? request.result.data : null);
        };
        
        request.onerror = () => {
          reject(new Error('IndexedDB load failed'));
        };
      });
    } catch (error) {
      console.error('[LocalStorageManager] IndexedDB load failed:', error);
      return null;
    }
  }

  /**
   * Open IndexedDB
   */
  async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CafeOS_Storage', 1);
      
      request.onerror = () => reject(new Error('IndexedDB open failed'));
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cafeos_data')) {
          db.createObjectStore('cafeos_data', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Perform cleanup based on rules
   */
  async performCleanup() {
    const usage = this.calculateUsage();
    console.log('[LocalStorageManager] Performing cleanup, usage:', `${usage.percentage.toFixed(2)  }%`);
    
    let freedSpace = 0;
    
    for (const [category, rule] of Object.entries(this.cleanupRules)) {
      const freed = await this.cleanupByRule(category, rule);
      freedSpace += freed;
    }
    
    console.log('[LocalStorageManager] Cleanup completed, freed:', `${(freedSpace / 1024).toFixed(2)  }KB`);
    
    return freedSpace;
  }

  /**
   * Cleanup by specific rule
   */
  async cleanupByRule(category, rule) {
    let freedSpace = 0;
    const now = Date.now();
    
    for (const keyPattern of rule.keys) {
      for (const key in localStorage) {
        if (key.startsWith(keyPattern)) {
          try {
            const data = localStorage.getItem(key);
            const size = (data.length + key.length) * 2;
            
            // Check age
            let shouldDelete = false;
            
            // Try to parse timestamp from data
            try {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && (now - parsed.timestamp) > rule.maxAge) {
                shouldDelete = true;
              }
            } catch (e) {
              // If no timestamp, check key pattern for date
              const dateMatch = key.match(/\d{13}/); // Unix timestamp
              if (dateMatch) {
                const timestamp = parseInt(dateMatch[0]);
                if ((now - timestamp) > rule.maxAge) {
                  shouldDelete = true;
                }
              }
            }
            
            // Delete if should delete or if category is temp (always cleanup temp)
            if (shouldDelete || category === 'temp') {
              localStorage.removeItem(key);
              freedSpace += size;
            }
          } catch (error) {
            console.error(`[LocalStorageManager] Failed to cleanup key ${key}:`, error);
          }
        }
      }
    }
    
    return freedSpace;
  }

  /**
   * Emergency cleanup - remove oldest data regardless of rules
   */
  async performEmergencyCleanup() {
    console.log('[LocalStorageManager] Performing emergency cleanup');
    
    const keySizes = [];
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = (localStorage[key].length + key.length) * 2;
        keySizes.push({ key, size });
      }
    }
    
    // Sort by size (remove largest first)
    keySizes.sort((a, b) => b.size - a.size);
    
    let freedSpace = 0;
    const targetFreed = 1024 * 1024; // Free 1MB
    
    for (const { key, size } of keySizes) {
      // Skip essential keys
      if (key.startsWith('cafeos_gateway_configs') || 
          key.startsWith('cafeos_delivery_platform_configs') ||
          key.startsWith('cafeos_encryption')) {
        continue;
      }
      
      localStorage.removeItem(key);
      freedSpace += size;
      
      if (freedSpace >= targetFreed) {
        break;
      }
    }
    
    console.log('[LocalStorageManager] Emergency cleanup freed:', `${(freedSpace / 1024).toFixed(2)  }KB`);
    
    return freedSpace;
  }

  /**
   * Log usage history
   */
  logUsage(action, key, usageBefore) {
    const entry = {
      action,
      key,
      usageBefore,
      usageAfter: this.calculateUsage().used,
      timestamp: Date.now()
    };
    
    this.usageHistory.push(entry);
    
    // Keep only last 100 entries
    if (this.usageHistory.length > 100) {
      this.usageHistory.shift();
    }
    
    this.saveUsageHistory();
  }

  /**
   * Load usage history
   */
  loadUsageHistory() {
    try {
      const stored = localStorage.getItem('cafeos_storage_usage_history');
      if (stored) {
        this.usageHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[LocalStorageManager] Failed to load usage history:', error);
    }
  }

  /**
   * Save usage history
   */
  saveUsageHistory() {
    try {
      localStorage.setItem('cafeos_storage_usage_history', JSON.stringify(this.usageHistory));
    } catch (error) {
      console.error('[LocalStorageManager] Failed to save usage history:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics() {
    const usage = this.calculateUsage();
    const keyCount = Object.keys(localStorage).length;
    
    // Calculate size by key prefix
    const sizeByPrefix = {};
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const prefix = key.split('_')[0] || 'other';
        const size = (localStorage[key].length + key.length) * 2;
        sizeByPrefix[prefix] = (sizeByPrefix[prefix] || 0) + size;
      }
    }
    
    return {
      usage,
      keyCount,
      sizeByPrefix,
      usageHistory: this.usageHistory.slice(-20),
      compressionEnabled: this.compressionEnabled,
      indexedDBFallbackEnabled: this.indexedDBFallbackEnabled
    };
  }

  /**
   * Get largest keys
   */
  getLargestKeys(limit = 10) {
    const keySizes = [];
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = (localStorage[key].length + key.length) * 2;
        keySizes.push({ key, size });
      }
    }
    
    keySizes.sort((a, b) => b.size - a.size);
    
    return keySizes.slice(0, limit);
  }

  /**
   * Clear specific key pattern
   */
  clearKeyPattern(pattern) {
    let clearedCount = 0;
    
    for (const key in localStorage) {
      if (key.startsWith(pattern)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  /**
   * Enable/disable compression
   */
  setCompressionEnabled(enabled) {
    this.compressionEnabled = enabled;
  }

  /**
   * Enable/disable IndexedDB fallback
   */
  setIndexedDBFallbackEnabled(enabled) {
    this.indexedDBFallbackEnabled = enabled;
  }

  /**
   * Update cleanup rules
   */
  updateCleanupRules(category, rules) {
    this.cleanupRules[category] = { ...this.cleanupRules[category], ...rules };
  }

  /**
   * Get cleanup rules
   */
  getCleanupRules() {
    return { ...this.cleanupRules };
  }

  /**
   * Destroy the manager
   */
  destroy() {
    console.log('[LocalStorageManager] Destroyed');
  }
}

// Singleton instance
let localStorageManagerInstance = null;

/**
 * Get the singleton localStorage manager instance
 */
export function getLocalStorageManager() {
  if (!localStorageManagerInstance) {
    localStorageManagerInstance = new LocalStorageManager();
  }
  return localStorageManagerInstance;
}

export default LocalStorageManager;
