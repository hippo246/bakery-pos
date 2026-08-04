// Performance Optimization for Large-Scale Operations
// Memoization, virtual scrolling, lazy loading utilities

/**
 * Memoization cache
 */
class MemoizationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    this.misses++;
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
}

/**
 * Order Performance Manager class
 * Manages performance optimizations for order operations
 */
export class OrderPerformanceManager {
  constructor() {
    this.memoCache = new MemoizationCache(500);
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
  }

  /**
   * Memoize a function result
   * @param {string} key - Cache key
   * @param {Function} fn - Function to memoize
   * @param {Array} args - Arguments to pass to function
   * @returns {*} Cached or computed result
   */
  memoize(key, fn, args = []) {
    const cacheKey = `${key}_${JSON.stringify(args)}`;
    const cached = this.memoCache.get(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);
    this.memoCache.set(cacheKey, result);
    return result;
  }

  /**
   * Clear memoization cache
   * @param {string} pattern - Optional pattern to clear specific keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.memoCache.cache.keys()) {
        if (key.includes(pattern)) {
          this.memoCache.cache.delete(key);
        }
      }
    } else {
      this.memoCache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return this.memoCache.getStats();
  }

  /**
   * Debounce a function
   * @param {string} key - Unique key for the debounced function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @param {Array} args - Arguments to pass to function
   */
  debounce(key, fn, delay = 300, args = []) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      fn(...args);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttle a function
   * @param {string} key - Unique key for the throttled function
   * @param {Function} fn - Function to throttle
   * @param {number} interval - Interval in milliseconds
   * @param {Array} args - Arguments to pass to function
   */
  throttle(key, fn, interval = 100, args = []) {
    if (this.throttleTimers.has(key)) {
      return; // Already throttled
    }

    fn(...args);
    this.throttleTimers.set(key, true);

    setTimeout(() => {
      this.throttleTimers.delete(key);
    }, interval);
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
    this.debounceTimers.clear();
  }

  /**
   * Paginate an array
   * @param {Array} array - Array to paginate
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Page size
   * @returns {Object} Paginated result
   */
  paginate(array, page = 1, pageSize = 20) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = array.slice(startIndex, endIndex);
    const totalPages = Math.ceil(array.length / pageSize);

    return {
      items,
      page,
      pageSize,
      totalItems: array.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  /**
   * Lazy load items from an array
   * @param {Array} array - Array to lazy load from
   * @param {number} batchSize - Number of items to load per batch
   * @returns {Function} Function to get next batch
   */
  lazyLoad(array, batchSize = 20) {
    let currentIndex = 0;

    return () => {
      const endIndex = currentIndex + batchSize;
      const batch = array.slice(currentIndex, endIndex);
      currentIndex = endIndex;
      
      return {
        items: batch,
        hasMore: currentIndex < array.length,
        loadedCount: currentIndex,
        totalCount: array.length
      };
    };
  }

  /**
   * Virtual scroll calculation
   * @param {number} totalItems - Total number of items
   * @param {number} itemHeight - Height of each item in pixels
   * @param {number} viewportHeight - Height of viewport in pixels
   * @param {number} scrollTop - Current scroll position
   * @returns {Object} Virtual scroll data
   */
  virtualScroll(totalItems, itemHeight, viewportHeight, scrollTop) {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(viewportHeight / itemHeight) + 5,
      totalItems
    );
    const visibleStartIndex = Math.max(0, startIndex - 5);
    const offsetY = visibleStartIndex * itemHeight;

    return {
      startIndex: visibleStartIndex,
      endIndex,
      offsetY,
      visibleItems: endIndex - visibleStartIndex,
      totalHeight: totalItems * itemHeight
    };
  }

  /**
   * Batch process array items
   * @param {Array} array - Array to process
   * @param {Function} processor - Processing function
   * @param {number} batchSize - Batch size
   * @returns {Promise<Array>} Processed array
   */
  async batchProcess(array, processor, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < array.length; i += batchSize) {
      const batch = array.slice(i, i + batchSize);
      const processed = await Promise.all(batch.map(item => processor(item)));
      results.push(...processed);
      
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results;
  }

  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunk(array, size = 50) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Filter array with memoization
   * @param {Array} array - Array to filter
   * @param {Function} predicate - Filter predicate
   * @param {string} cacheKey - Cache key
   * @returns {Array} Filtered array
   */
  memoizedFilter(array, predicate, cacheKey) {
    return this.memoize(
      `filter_${cacheKey}`,
      () => array.filter(predicate),
      [array]
    );
  }

  /**
   * Sort array with memoization
   * @param {Array} array - Array to sort
   * @param {Function} comparator - Sort comparator
   * @param {string} cacheKey - Cache key
   * @returns {Array} Sorted array
   */
  memoizedSort(array, comparator, cacheKey) {
    return this.memoize(
      `sort_${cacheKey}`,
      () => [...array].sort(comparator),
      [array]
    );
  }

  /**
   * Map array with memoization
   * @param {Array} array - Array to map
   * @param {Function} mapper - Map function
   * @param {string} cacheKey - Cache key
   * @returns {Array} Mapped array
   */
  memoizedMap(array, mapper, cacheKey) {
    return this.memoize(
      `map_${cacheKey}`,
      () => array.map(mapper),
      [array]
    );
  }

  /**
   * Reduce array with memoization
   * @param {Array} array - Array to reduce
   * @param {Function} reducer - Reduce function
   * @param {*} initialValue - Initial value
   * @param {string} cacheKey - Cache key
   * @returns {*} Reduced value
   */
  memoizedReduce(array, reducer, initialValue, cacheKey) {
    return this.memoize(
      `reduce_${cacheKey}`,
      () => array.reduce(reducer, initialValue),
      [array]
    );
  }

  /**
   * Search array with memoization
   * @param {Array} array - Array to search
   * @param {string} query - Search query
   * @param {Function} matcher - Match function
   * @param {string} cacheKey - Cache key
   * @returns {Array} Search results
   */
  memoizedSearch(array, query, matcher, cacheKey) {
    return this.memoize(
      `search_${cacheKey}_${query}`,
      () => array.filter(item => matcher(item, query)),
      [array]
    );
  }

  /**
   * Group array with memoization
   * @param {Array} array - Array to group
   * @param {Function} keyFn - Key function
   * @param {string} cacheKey - Cache key
   * @returns {Object} Grouped object
   */
  memoizedGroup(array, keyFn, cacheKey) {
    return this.memoize(
      `group_${cacheKey}`,
      () => array.reduce((acc, item) => {
        const key = keyFn(item);
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {}),
      [array]
    );
  }

  /**
   * Performance measurement
   * @param {string} label - Measurement label
   * @param {Function} fn - Function to measure
   * @returns {*} Function result
   */
  measure(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

    return result;
  }

  /**
   * Async performance measurement
   * @param {string} label - Measurement label
   * @param {Function} fn - Async function to measure
   * @returns {Promise<*>} Function result
   */
  async measureAsync(label, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

    return result;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      cache: this.getCacheStats(),
      activeDebounceTimers: this.debounceTimers.size,
      activeThrottleTimers: this.throttleTimers.size
    };
  }

  /**
   * Reset performance manager
   */
  reset() {
    this.clearCache();
    this.clearTimers();
  }
}

// Singleton instance
let performanceManagerInstance = null;

/**
 * Get the order performance manager singleton
 * @returns {OrderPerformanceManager} Performance manager instance
 */
export function getOrderPerformanceManager() {
  if (!performanceManagerInstance) {
    performanceManagerInstance = new OrderPerformanceManager();
  }
  return performanceManagerInstance;
}

/**
 * Reset the performance manager (useful for testing)
 */
export function resetOrderPerformanceManager() {
  if (performanceManagerInstance) {
    performanceManagerInstance.reset();
  }
  performanceManagerInstance = null;
}

/**
 * Convenience function to paginate an array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 * @returns {Object} Paginated result
 */
export function paginateOrders(array, page = 1, pageSize = 20) {
  const manager = getOrderPerformanceManager();
  return manager.paginate(array, page, pageSize);
}

/**
 * Convenience function to memoize a function
 * @param {string} key - Cache key
 * @param {Function} fn - Function to memoize
 * @param {Array} args - Arguments
 * @returns {*} Cached or computed result
 */
export function memoize(key, fn, args = []) {
  const manager = getOrderPerformanceManager();
  return manager.memoize(key, fn, args);
}

/**
 * Convenience function to debounce a function
 * @param {string} key - Unique key
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} args - Arguments
 */
export function debounce(key, fn, delay = 300, args = []) {
  const manager = getOrderPerformanceManager();
  return manager.debounce(key, fn, delay, args);
}
