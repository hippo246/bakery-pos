// Rate limiting utility for API calls and operations

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getWaitTime() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = this.requests[0];
    return this.windowMs - (now - oldestRequest);
  }
}

// Create rate limiters for different operations
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const authRateLimiter = new RateLimiter(5, 60000); // 5 auth attempts per minute
export const paymentRateLimiter = new RateLimiter(10, 60000); // 10 payments per minute

export const withRateLimit = (limiter, fn) => {
  return async (...args) => {
    if (!limiter.canMakeRequest()) {
      const waitTime = limiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    return fn(...args);
  };
};
