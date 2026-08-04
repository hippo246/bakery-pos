// Performance Optimizer
// Caching, memoization, and performance optimization for pricing calculations

import { now } from '../domain/dates.js';

/**
 * Performance Cache class
 * LRU cache with TTL support
 */
class PerformanceCache {
  constructor(maxSize = 1000, defaultTTL = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiry && now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access time for LRU
    entry.lastAccess = now();
    this.hits++;

    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry = {
      value,
      created: now(),
      lastAccess: now(),
      expiry: ttl ? now() + ttl : null
    };

    this.cache.set(key, entry);
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  cleanupExpired() {
    constcurrentTime = now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (entry.expiry && currentTime > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Memoization decorator
 */
function memoize(fn, ttl = 60000) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached) {
      if (cached.expiry && now() > cached.expiry) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    const result = fn.apply(this, args);
    cache.set(key, {
      value: result,
      expiry: ttl ? now() + ttl : null
    });

    return result;
  };
}

/**
 * Performance Optimizer class
 * Centralized performance optimization for pricing calculations
 */
export class PricingPerformanceOptimizer {
  constructor() {
    this.pricingCache = new PerformanceCache(500, 30000); // 500 items, 30s TTL
    this.discountCache = new PerformanceCache(500, 30000);
    this.taxCache = new PerformanceCache(500, 60000); // 60s TTL for tax
    this.promotionCache = new PerformanceCache(200, 60000);
    this.ruleCache = new PerformanceCache(1000, 120000); // 2min TTL for rules
    
    this.batchCache = new Map();
    this.calculationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Cache pricing calculation
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  cachePricing(key, value, ttl) {
    this.pricingCache.set(key, value, ttl);
  }

  /**
   * Get cached pricing
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCachedPricing(key) {
    return this.pricingCache.get(key);
  }

  /**
   * Cache discount calculation
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  cacheDiscount(key, value, ttl) {
    this.discountCache.set(key, value, ttl);
  }

  /**
   * Get cached discount
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCachedDiscount(key) {
    return this.discountCache.get(key);
  }

  /**
   * Cache tax calculation
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  cacheTax(key, value, ttl) {
    this.taxCache.set(key, value, ttl);
  }

  /**
   * Get cached tax
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCachedTax(key) {
    return this.taxCache.get(key);
  }

  /**
   * Cache promotion calculation
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  cachePromotion(key, value, ttl) {
    this.promotionCache.set(key, value, ttl);
  }

  /**
   * Get cached promotion
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCachedPromotion(key) {
    return this.promotionCache.get(key);
  }

  /**
   * Cache rule evaluation
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  cacheRule(key, value, ttl) {
    this.ruleCache.set(key, value, ttl);
  }

  /**
   * Get cached rule
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCachedRule(key) {
    return this.ruleCache.get(key);
  }

  /**
   * Batch cache multiple calculations
   * @param {Array} items - Array of items to cache
   * @param {string} cacheType - Type of cache
   * @param {number} ttl - Time to live
   */
  batchCache(items, cacheType = 'pricing', ttl = 30000) {
    const cache = this.getCacheByType(cacheType);
    
    items.forEach(item => {
      const key = item.key || this.generateKey(item);
      cache.set(key, item.value, ttl);
    });
  }

  /**
   * Get cache by type
   * @param {string} cacheType - Cache type
   * @returns {PerformanceCache} Cache instance
   */
  getCacheByType(cacheType) {
    switch (cacheType) {
      case 'pricing':
        return this.pricingCache;
      case 'discount':
        return this.discountCache;
      case 'tax':
        return this.taxCache;
      case 'promotion':
        return this.promotionCache;
      case 'rule':
        return this.ruleCache;
      default:
        return this.pricingCache;
    }
  }

  /**
   * Generate cache key from item
   * @param {Object} item - Item object
   * @returns {string} Cache key
   */
  generateKey(item) {
    const parts = [
      item.menuItemId,
      item.categoryId,
      item.branchId,
      item.customerGroup,
      item.quantity,
      item.timestamp || now()
    ];
    return parts.join('|');
  }

  /**
   * Queue calculation for batch processing
   * @param {Function} fn - Calculation function
   * @param {Array} args - Function arguments
   * @returns {Promise} Promise resolving to calculation result
   */
  queueCalculation(fn, args) {
    return new Promise((resolve, reject) => {
      this.calculationQueue.push({ fn, args, resolve, reject });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process calculation queue
   */
  async processQueue() {
    this.isProcessing = true;

    while (this.calculationQueue.length > 0) {
      const { fn, args, resolve, reject } = this.calculationQueue.shift();
      
      try {
        const result = await fn(...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Yield to event loop
      await new Promise(r => setTimeout(r, 0));
    }

    this.isProcessing = false;
  }

  /**
   * Batch process calculations
   * @param {Array} items - Array of items to process
   * @param {Function} processor - Processing function
   * @param {number} batchSize - Batch size
   * @returns {Promise<Array>} Processed results
   */
  async batchProcess(items, processor, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const processed = await Promise.all(batch.map(item => processor(item)));
      results.push(...processed);
      
      // Yield to event loop
      await new Promise(r => setTimeout(r, 0));
    }

    return results;
  }

  /**
   * Debounce function execution
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 300) {
    let timeout = null;
    
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle function execution
   * @param {Function} fn - Function to throttle
   * @param {number} interval - Interval in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, interval = 100) {
    let lastCall = 0;
    
    return function(...args) {
      const now = Date.now();
      
      if (now - lastCall >= interval) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.pricingCache.clear();
    this.discountCache.clear();
    this.taxCache.clear();
    this.promotionCache.clear();
    this.ruleCache.clear();
    this.batchCache.clear();
  }

  /**
   * Clear specific cache
   * @param {string} cacheType - Cache type
   */
  clearCache(cacheType) {
    const cache = this.getCacheByType(cacheType);
    cache.clear();
  }

  /**
   * Clear expired entries from all caches
   */
  cleanupExpired() {
    this.pricingCache.cleanupExpired();
    this.discountCache.cleanupExpired();
    this.taxCache.cleanupExpired();
    this.promotionCache.cleanupExpired();
    this.ruleCache.cleanupExpired();
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStatistics() {
    return {
      pricing: this.pricingCache.getStats(),
      discount: this.discountCache.getStats(),
      tax: this.taxCache.getStats(),
      promotion: this.promotionCache.getStats(),
      rule: this.ruleCache.getStats(),
      queueLength: this.calculationQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Reset optimizer
   */
  reset() {
    this.clearAllCaches();
    this.calculationQueue = [];
    this.isProcessing = false;
  }
}

// Singleton instance
let performanceOptimizerInstance = null;

/**
 * Get the performance optimizer singleton
 * @returns {PricingPerformanceOptimizer} Performance optimizer instance
 */
export function getPricingPerformanceOptimizer() {
  if (!performanceOptimizerInstance) {
    performanceOptimizerInstance = new PricingPerformanceOptimizer();
  }
  return performanceOptimizerInstance;
}

/**
 * Reset the performance optimizer (useful for testing)
 */
export function resetPricingPerformanceOptimizer() {
  if (performanceOptimizerInstance) {
    performanceOptimizerInstance.reset();
  }
  performanceOptimizerInstance = null;
}

/**
 * Memoization helper
 * @param {Function} fn - Function to memoize
 * @param {number} ttl - Time to live
 * @returns {Function} Memoized function
 */
export function memoizePricing(fn, ttl = 60000) {
  return memoize(fn, ttl);
}
