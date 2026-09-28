// Simple caching strategy utilities

class Cache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  get size() {
    this.cleanup();
    return this.cache.size;
  }
}

// Create a singleton cache instance
const cache = new Cache();

// Run cleanup every minute
setInterval(() => cache.cleanup(), 60 * 1000);

export default cache;

// Memoization with cache
export const memoizeWithCache = (fn, keyPrefix, ttl) => {
  return (...args) => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
};

// Cache decorator for functions
export const cached = (ttl) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    const cacheKey = `${target.constructor.name}_${propertyKey}`;
    
    descriptor.value = function(...args) {
      const key = `${cacheKey}:${JSON.stringify(args)}`;
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = originalMethod.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };
    
    return descriptor;
  };
};
