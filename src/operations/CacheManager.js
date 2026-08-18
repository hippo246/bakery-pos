// Cache Invalidation
// Auto-detect stale cache, background refresh, cache warming, smart cache prediction

export class CacheManager {
  constructor(options = {}) {
    this.options = {
      defaultTTL: options.defaultTTL || 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: options.staleWhileRevalidate !== false,
      backgroundRefreshEnabled: options.backgroundRefreshEnabled !== false,
      cacheWarmingEnabled: options.cacheWarmingEnabled !== false,
      smartCacheEnabled: options.smartCacheEnabled !== false,
      maxCacheSize: options.maxCacheSize || 50 * 1024 * 1024, // 50MB
      ...options
    };
    
    this.cache = new Map();
    this.cacheMetadata = new Map();
    this.accessPatterns = new Map();
    this.refreshTimers = new Map();
    this.eventHandlers = new Map();
    this.loadCacheState();
  }

  /**
   * Load cache state from localStorage
   */
  loadCacheState() {
    try {
      const stored = localStorage.getItem('cafeos_cache_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.accessPatterns = new Map(state.accessPatterns || []);
      }
    } catch (error) {
      console.error('[CacheManager] Failed to load cache state:', error);
    }
  }

  /**
   * Save cache state to localStorage
   */
  saveCacheState() {
    try {
      const state = {
        accessPatterns: Array.from(this.accessPatterns)
      };
      
      localStorage.setItem('cafeos_cache_state', JSON.stringify(state));
    } catch (error) {
      console.error('[CacheManager] Failed to save cache state:', error);
    }
  }

  /**
   * Set cache entry
   */
  set(key, data, options = {}) {
    const ttl = options.ttl || this.options.defaultTTL;
    const priority = options.priority || 'normal';
    const tags = options.tags || [];
    
    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl,
      priority,
      tags,
      size: this.calculateSize(data),
      hits: 0,
      lastAccess: Date.now()
    };
    
    this.cache.set(key, entry);
    this.cacheMetadata.set(key, {
      ...entry,
      key
    });
    
    // Record access pattern
    this.recordAccess(key, 'set');
    
    // Set up background refresh if enabled
    if (this.options.backgroundRefreshEnabled && options.refreshFn) {
      this.scheduleBackgroundRefresh(key, options.refreshFn, ttl);
    }
    
    // Check cache size
    this.checkCacheSize();
    
    this.emit('cacheSet', { key, ttl, priority, tags });
  }

  /**
   * Get cache entry
   */
  async get(key, refreshFn = null) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordAccess(key, 'miss');
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.recordAccess(key, 'stale');
      
      // Stale-while-revalidate
      if (this.options.staleWhileRevalidate && refreshFn) {
        // Return stale data and refresh in background
        this.refreshInBackground(key, refreshFn);
        return entry.data;
      }
      
      // Remove expired entry
      this.delete(key);
      return null;
    }
    
    // Update access stats
    entry.hits++;
    entry.lastAccess = now;
    
    this.recordAccess(key, 'hit');
    
    return entry.data;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.cache.delete(key);
      this.cacheMetadata.delete(key);
      
      // Clear refresh timer
      const timer = this.refreshTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.refreshTimers.delete(key);
      }
      
      this.emit('cacheDelete', { key });
    }
  }

  /**
   * Delete entries by tag
   */
  deleteByTag(tag) {
    const keysToDelete = [];
    
    this.cacheMetadata.forEach((metadata, key) => {
      if (metadata.tags && metadata.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Delete entries by pattern
   */
  deleteByPattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    this.cacheMetadata.forEach((metadata, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Check if entry exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    return now <= entry.expiresAt;
  }

  /**
   * Get cache entry metadata
   */
  getMetadata(key) {
    return this.cacheMetadata.get(key);
  }

  /**
   * Get all cache metadata
   */
  getAllMetadata() {
    return Array.from(this.cacheMetadata.values());
  }

  /**
   * Refresh cache entry
   */
  async refresh(key, refreshFn) {
    try {
      const newData = await refreshFn();
      
      const entry = this.cache.get(key);
      if (entry) {
        this.set(key, newData, {
          ttl: entry.ttl,
          priority: entry.priority,
          tags: entry.tags,
          refreshFn
        });
        
        this.emit('cacheRefresh', { key });
      }
      
      return newData;
    } catch (error) {
      console.error(`[CacheManager] Failed to refresh ${key}:`, error);
      this.emit('cacheRefreshError', { key, error });
      throw error;
    }
  }

  /**
   * Schedule background refresh
   */
  scheduleBackgroundRefresh(key, refreshFn, ttl) {
    const refreshTime = ttl * 0.8; // Refresh at 80% of TTL
    
    const timer = setTimeout(() => {
      this.refreshInBackground(key, refreshFn);
    }, refreshTime);
    
    this.refreshTimers.set(key, timer);
  }

  /**
   * Refresh in background
   */
  async refreshInBackground(key, refreshFn) {
    try {
      await this.refresh(key, refreshFn);
    } catch (error) {
      // Silent fail for background refresh
      console.error(`[CacheManager] Background refresh failed for ${key}:`, error);
    }
  }

  /**
   * Record access pattern
   */
  recordAccess(key, type) {
    const pattern = this.accessPatterns.get(key) || {
      hits: 0,
      misses: 0,
      stale: 0,
      lastAccess: Date.now(),
      accessCount: 0
    };
    
    pattern[type === 'hit' ? 'hits' : type === 'miss' ? 'misses' : 'stale']++;
    pattern.lastAccess = Date.now();
    pattern.accessCount++;
    
    this.accessPatterns.set(key, pattern);
    this.saveCacheState();
  }

  /**
   * Get access pattern
   */
  getAccessPattern(key) {
    return this.accessPatterns.get(key);
  }

  /**
   * Predict what user might need next (smart cache)
   */
  predictNextAccess(currentKey) {
    if (!this.options.smartCacheEnabled) {
      return [];
    }
    
    const predictions = [];
    const currentPattern = this.accessPatterns.get(currentKey);
    
    if (!currentPattern) {
      return predictions;
    }
    
    // Find keys frequently accessed after current key
    const now = Date.now();
    const recentThreshold = now - (24 * 60 * 60 * 1000); // Last 24 hours
    
    this.accessPatterns.forEach((pattern, key) => {
      if (key !== currentKey && pattern.lastAccess > recentThreshold) {
        const score = pattern.hits / pattern.accessCount;
        
        if (score > 0.5) {
          predictions.push({
            key,
            score,
            hits: pattern.hits,
            accessCount: pattern.accessCount
          });
        }
      }
    });
    
    // Sort by score
    predictions.sort((a, b) => b.score - a.score);
    
    return predictions.slice(0, 5); // Top 5 predictions
  }

  /**
   * Warm cache with predicted data
   */
  async warmCache(warmFn) {
    if (!this.options.cacheWarmingEnabled) {
      return;
    }
    
    try {
      const predictions = this.predictNextAccess('startup');
      
      for (const prediction of predictions) {
        try {
          const data = await warmFn(prediction.key);
          if (data) {
            this.set(prediction.key, data, {
              ttl: this.options.defaultTTL,
              priority: 'high'
            });
          }
        } catch (error) {
          console.error(`[CacheManager] Failed to warm cache for ${prediction.key}:`, error);
        }
      }
      
      this.emit('cacheWarmed', { count: predictions.length });
    } catch (error) {
      console.error('[CacheManager] Cache warming failed:', error);
    }
  }

  /**
   * Invalidate stale cache entries
   */
  invalidateStale() {
    const now = Date.now();
    const invalidated = [];
    
    this.cacheMetadata.forEach((metadata, key) => {
      if (now > metadata.expiresAt) {
        this.delete(key);
        invalidated.push(key);
      }
    });
    
    this.emit('cacheInvalidated', { count: invalidated.length, keys: invalidated });
    
    return invalidated;
  }

  /**
   * Invalidate by tags
   */
  invalidateByTags(tags) {
    const invalidated = [];
    
    tags.forEach(tag => {
      const count = this.deleteByTag(tag);
      invalidated.push({ tag, count });
    });
    
    this.emit('cacheInvalidated', { byTags: invalidated });
    
    return invalidated;
  }

  /**
   * Clear all cache
   */
  clear() {
    const count = this.cache.size;
    
    this.cache.clear();
    this.cacheMetadata.clear();
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    
    this.emit('cacheCleared', { count });
  }

  /**
   * Calculate size of data
   */
  calculateSize(data) {
    try {
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // UTF-16 uses 2 bytes per character
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check cache size and evict if needed
   */
  checkCacheSize() {
    let totalSize = 0;
    
    this.cacheMetadata.forEach(metadata => {
      totalSize += metadata.size;
    });
    
    if (totalSize > this.options.maxCacheSize) {
      this.evictLRU(totalSize - this.options.maxCacheSize);
    }
  }

  /**
   * Evict least recently used entries
   */
  evictLRU(targetSize) {
    const entries = Array.from(this.cacheMetadata.values());
    
    // Sort by last access (oldest first)
    entries.sort((a, b) => a.lastAccess - b.lastAccess);
    
    let evictedSize = 0;
    
    for (const entry of entries) {
      if (evictedSize >= targetSize) {
        break;
      }
      
      this.delete(entry.key);
      evictedSize += entry.size;
    }
    
    this.emit('cacheEvicted', { size: evictedSize });
  }

  /**
   * Get cache statistics
   */
  getStatistics() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    const byPriority = { high: 0, normal: 0, low: 0 };
    
    this.cacheMetadata.forEach(metadata => {
      totalSize += metadata.size;
      
      if (now > metadata.expiresAt) {
        expiredCount++;
      }
      
      byPriority[metadata.priority] = (byPriority[metadata.priority] || 0) + 1;
    });
    
    const accessStats = {
      totalHits: 0,
      totalMisses: 0,
      totalStale: 0
    };
    
    this.accessPatterns.forEach(pattern => {
      accessStats.totalHits += pattern.hits;
      accessStats.totalMisses += pattern.misses;
      accessStats.totalStale += pattern.stale;
    });
    
    const hitRate = accessStats.totalHits + accessStats.totalMisses > 0
      ? (accessStats.totalHits / (accessStats.totalHits + accessStats.totalMisses)) * 100
      : 0;
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      maxSize: this.options.maxCacheSize,
      sizePercent: (totalSize / this.options.maxCacheSize) * 100,
      expiredCount,
      byPriority,
      accessStats,
      hitRate: hitRate.toFixed(2)
    };
  }

  /**
   * Update cache options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
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
          console.error(`[CacheManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the cache manager
   */
  destroy() {
    this.clear();
    this.accessPatterns.clear();
    this.eventHandlers.clear();
    console.log('[CacheManager] Destroyed');
  }
}

// Singleton instance
let cacheManagerInstance = null;

/**
 * Get the singleton cache manager instance
 */
export function getCacheManager(options = {}) {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(options);
  }
  return cacheManagerInstance;
}

export default CacheManager;
