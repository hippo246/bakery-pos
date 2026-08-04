// Performance Optimizer
// Virtual rendering, memoization, event batching, lazy loading for 100+ terminals and thousands of orders

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  DEFAULT_TTL: 30000, // 30 seconds
  SHORT_TTL: 10000,  // 10 seconds
  LONG_TTL: 120000,  // 2 minutes
  MAX_SIZE: 1000
};

/**
 * Performance Optimizer class
 * Virtual rendering, memoization, event batching, lazy loading for 100+ terminals and thousands of orders
 */
export class PerformanceOptimizer {
  constructor() {
    this.caches = new Map();
    this.memoizedFunctions = new Map();
    this.eventBatches = new Map();
    this.batchTimers = new Map();
    this.virtualLists = new Map();
  }

  /**
   * Create a cache
   * @param {string} cacheName - Cache name
   * @param {Object} config - Cache configuration
   * @returns {Object} Cache object
   */
  createCache(cacheName, config = {}) {
    const cache = {
      name: cacheName,
      data: new Map(),
      ttl: config.ttl || CACHE_CONFIG.DEFAULT_TTL,
      maxSize: config.maxSize || CACHE_CONFIG.MAX_SIZE,
      hits: 0,
      misses: 0,
      createdAt: Date.now()
    };

    this.caches.set(cacheName, cache);
    return cache;
  }

  /**
   * Get from cache
   * @param {string} cacheName - Cache name
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getFromCache(cacheName, key) {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    const item = cache.data.get(key);
    if (!item) {
      cache.misses++;
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      cache.data.delete(key);
      cache.misses++;
      return null;
    }

    cache.hits++;
    return item.value;
  }

  /**
   * Set in cache
   * @param {string} cacheName - Cache name
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setInCache(cacheName, key, value, ttl = null) {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    // Evict if at max size (LRU)
    if (cache.data.size >= cache.maxSize) {
      const firstKey = cache.data.keys().next().value;
      cache.data.delete(firstKey);
    }

    const item = {
      value,
      expiresAt: ttl ? Date.now() + ttl : Date.now() + cache.ttl,
      createdAt: Date.now()
    };

    cache.data.set(key, item);
  }

  /**
   * Clear cache
   * @param {string} cacheName - Cache name
   */
  clearCache(cacheName) {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.data.clear();
      cache.hits = 0;
      cache.misses = 0;
    }
  }

  /**
   * Get cache statistics
   * @param {string} cacheName - Cache name
   * @returns {Object} Cache statistics
   */
  getCacheStats(cacheName) {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    return {
      name: cache.name,
      size: cache.data.size,
      maxSize: cache.maxSize,
      hits: cache.hits,
      misses: cache.misses,
      hitRate: cache.hits + cache.misses > 0 ? cache.hits / (cache.hits + cache.misses) : 0
    };
  }

  /**
   * Memoize a function
   * @param {Function} fn - Function to memoize
   * @param {Object} options - Memoization options
   * @returns {Function} Memoized function
   */
  memoize(fn, options = {}) {
    const {
      cacheName = `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      maxSize = CACHE_CONFIG.MAX_SIZE,
      keyGenerator = null
    } = options;

    // Create cache for this function
    this.createCache(cacheName, { ttl, maxSize });

    const memoizedFn = (...args) => {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      // Check cache
      const cached = this.getFromCache(cacheName, cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = fn(...args);

      // Cache result
      this.setInCache(cacheName, cacheKey, result, ttl);

      return result;
    };

    // Store reference to clear cache
    memoizedFn.clearCache = () => this.clearCache(cacheName);
    memoizedFn.getStats = () => this.getCacheStats(cacheName);

    this.memoizedFunctions.set(cacheName, memoizedFn);

    return memoizedFn;
  }

  /**
   * Clear memoized function cache
   * @param {Function} memoizedFn - Memoized function
   */
  clearMemoizedCache(memoizedFn) {
    if (memoizedFn.clearCache) {
      memoizedFn.clearCache();
    }
  }

  /**
   * Batch events
   * @param {string} batchName - Batch name
   * @param {Function} handler - Batch handler
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Function to add events to batch
   */
  createEventBatch(batchName, handler, delay = 100) {
    const addEvent = (event) => {
      if (!this.eventBatches.has(batchName)) {
        this.eventBatches.set(batchName, []);
      }

      this.eventBatches.get(batchName).push(event);

      // Reset timer
      if (this.batchTimers.has(batchName)) {
        clearTimeout(this.batchTimers.get(batchName));
      }

      // Set new timer
      const timer = setTimeout(() => {
        const events = this.eventBatches.get(batchName) || [];
        this.eventBatches.delete(batchName);
        this.batchTimers.delete(batchName);
        handler(events);
      }, delay);

      this.batchTimers.set(batchName, timer);
    };

    return addEvent;
  }

  /**
   * Flush event batch immediately
   * @param {string} batchName - Batch name
   */
  flushEventBatch(batchName) {
    if (this.batchTimers.has(batchName)) {
      clearTimeout(this.batchTimers.get(batchName));
      this.batchTimers.delete(batchName);
    }

    const events = this.eventBatches.get(batchName);
    if (events) {
      this.eventBatches.delete(batchName);
      return events;
    }

    return [];
  }

  /**
   * Create virtual list
   * @param {string} listName - List name
   * @param {Array} items - List items
   * @param {Object} config - Virtual list configuration
   * @returns {Object} Virtual list
   */
  createVirtualList(listName, items, config = {}) {
    const virtualList = {
      name: listName,
      items,
      itemHeight: config.itemHeight || 50,
      viewportHeight: config.viewportHeight || 500,
      overscan: config.overscan || 5,
      scrollTop: 0
    };

    this.virtualLists.set(listName, virtualList);
    return virtualList;
  }

  /**
   * Get visible items from virtual list
   * @param {string} listName - List name
   * @returns {Object} Visible items info
   */
  getVisibleItems(listName) {
    const virtualList = this.virtualLists.get(listName);
    if (!virtualList) return null;

    const { items, itemHeight, viewportHeight, overscan, scrollTop } = virtualList;

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      items: visibleItems,
      startIndex,
      endIndex,
      offsetY,
      totalHeight,
      scrollTop
    };
  }

  /**
   * Update virtual list scroll position
   * @param {string} listName - List name
   * @param {number} scrollTop - Scroll position
   */
  updateVirtualListScroll(listName, scrollTop) {
    const virtualList = this.virtualLists.get(listName);
    if (virtualList) {
      virtualList.scrollTop = scrollTop;
    }
  }

  /**
   * Update virtual list items
   * @param {string} listName - List name
   * @param {Array} items - New items
   */
  updateVirtualListItems(listName, items) {
    const virtualList = this.virtualLists.get(listName);
    if (virtualList) {
      virtualList.items = items;
    }
  }

  /**
   * Lazy load data
   * @param {Function} loader - Loader function
   * @param {Object} options - Lazy loading options
   * @returns {Object} Lazy load result
   */
  async lazyLoad(loader, options = {}) {
    const {
      cacheName,
      cacheKey,
      ttl = CACHE_CONFIG.LONG_TTL
    } = options;

    // Check cache if provided
    if (cacheName && cacheKey) {
      const cached = this.getFromCache(cacheName, cacheKey);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }
    }

    // Load data
    const data = await loader();

    // Cache result if cache provided
    if (cacheName && cacheKey) {
      this.setInCache(cacheName, cacheKey, data, ttl);
    }

    return { data, fromCache: false };
  }

  /**
   * Debounce a function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 300) {
    let timeoutId;

    const debouncedFn = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };

    debouncedFn.cancel = () => clearTimeout(timeoutId);

    return debouncedFn;
  }

  /**
   * Throttle a function
   * @param {Function} fn - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, delay = 300) {
    let lastCall = 0;

    const throttledFn = (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    };

    return throttledFn;
  }

  /**
   * Request animation frame throttle
   * @param {Function} fn - Function to throttle
   * @returns {Function} RAF throttled function
   */
  rafThrottle(fn) {
    let rafId = null;

    const rafThrottledFn = (...args) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          fn(...args);
          rafId = null;
        });
      }
    };

    return rafThrottledFn;
  }

  /**
   * Batch DOM updates
   * @param {Array} updates - Array of update functions
   */
  batchDOMUpdates(updates) {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  /**
   * Create lazy image loader
   * @param {string} src - Image source
   * @param {Object} options - Options
   * @returns {Object} Lazy image loader
   */
  createLazyImageLoader(src, options = {}) {
    const {
      threshold = 0.1,
      rootMargin = '0px'
    } = options;

    return {
      src,
      loaded: false,
      loading: false,
      observer: null,

      load() {
        if (this.loaded || this.loading) return;

        this.loading = true;

        const img = new Image();
        img.onload = () => {
          this.loaded = true;
          this.loading = false;
          if (options.onLoad) options.onLoad();
        };
        img.onerror = () => {
          this.loading = false;
          if (options.onError) options.onError();
        };
        img.src = src;
      },

      observe(element) {
        if (typeof IntersectionObserver !== 'undefined') {
          this.observer = new IntersectionObserver(
            (entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  this.load();
                  this.observer.unobserve(element);
                }
              });
            },
            { threshold, rootMargin }
          );
          this.observer.observe(element);
        } else {
          // Fallback: load immediately
          this.load();
        }
      },

      unobserve(element) {
        if (this.observer) {
          this.observer.unobserve(element);
        }
      }
    };
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    const cacheStats = {};
    for (const [name, cache] of this.caches) {
      cacheStats[name] = this.getCacheStats(name);
    }

    return {
      caches: cacheStats,
      memoizedFunctions: this.memoizedFunctions.size,
      activeBatches: this.eventBatches.size,
      virtualLists: this.virtualLists.size
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    for (const cacheName of this.caches.keys()) {
      this.clearCache(cacheName);
    }
  }

  /**
   * Clear all event batches
   */
  clearAllEventBatches() {
    for (const [batchName, timer] of this.batchTimers) {
      clearTimeout(timer);
    }
    this.eventBatches.clear();
    this.batchTimers.clear();
  }

  /**
   * Clear all virtual lists
   */
  clearAllVirtualLists() {
    this.virtualLists.clear();
  }

  /**
   * Reset all performance optimizations
   */
  reset() {
    this.clearAllCaches();
    this.clearAllEventBatches();
    this.clearAllVirtualLists();
    this.memoizedFunctions.clear();
  }
}

// Singleton instance
let performanceOptimizerInstance = null;

/**
 * Get the performance optimizer singleton
 * @returns {PerformanceOptimizer} Performance optimizer instance
 */
export function getPerformanceOptimizer() {
  if (!performanceOptimizerInstance) {
    performanceOptimizerInstance = new PerformanceOptimizer();
  }
  return performanceOptimizerInstance;
}

/**
 * Reset the performance optimizer (useful for testing)
 */
export function resetPerformanceOptimizer() {
  performanceOptimizerInstance = null;
}

/**
 * Convenience function to memoize a function
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} Memoized function
 */
export function memoize(fn, options = {}) {
  const optimizer = getPerformanceOptimizer();
  return optimizer.memoize(fn, options);
}

/**
 * Convenience function to debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  const optimizer = getPerformanceOptimizer();
  return optimizer.debounce(fn, delay);
}

/**
 * Convenience function to throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, delay = 300) {
  const optimizer = getPerformanceOptimizer();
  return optimizer.throttle(fn, delay);
}
