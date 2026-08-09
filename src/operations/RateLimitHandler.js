// API Rate Limit Handler
// Detect rate limit responses (429), auto-backoff and retry, queue non-critical requests

export class RateLimitHandler {
  constructor(options = {}) {
    this.options = {
      defaultBackoffMs: options.defaultBackoffMs || 1000,
      maxBackoffMs: options.maxBackoffMs || 60000,
      backoffMultiplier: options.backoffMultiplier || 2,
      maxRetries: options.maxRetries || 5,
      queueEnabled: options.queueEnabled !== false,
      queueSize: options.queueSize || 100,
      ...options
    };
    
    this.requestQueue = [];
    this.rateLimitInfo = new Map();
    this.retryCount = new Map();
    this.eventHandlers = new Map();
    this.isProcessingQueue = false;
  }

  /**
   * Execute request with rate limit handling
   */
  async executeRequest(requestFn, options = {}) {
    const requestId = this.generateRequestId();
    const priority = options.priority || 'normal';
    const isCritical = options.critical || false;
    const maxRetries = options.maxRetries || this.options.maxRetries;
    
    try {
      const result = await requestFn();
      
      // Reset retry count on success
      this.retryCount.delete(requestId);
      
      return result;
    } catch (error) {
      // Check if rate limited
      if (this.isRateLimitError(error)) {
        const rateLimitInfo = this.extractRateLimitInfo(error);
        
        // Store rate limit info
        this.rateLimitInfo.set(requestId, rateLimitInfo);
        
        // Check retry count
        const currentRetries = this.retryCount.get(requestId) || 0;
        
        if (currentRetries < maxRetries && !isCritical) {
          this.retryCount.set(requestId, currentRetries + 1);
          
          // Calculate backoff time
          const backoffMs = this.calculateBackoff(rateLimitInfo, currentRetries);
          
          console.log(`[RateLimitHandler] Rate limited, retrying in ${backoffMs}ms (attempt ${currentRetries + 1}/${maxRetries})`);
          
          this.emit('rateLimited', {
            requestId,
            retryAttempt: currentRetries + 1,
            maxRetries,
            backoffMs,
            rateLimitInfo
          });
          
          // Wait and retry
          await this.delay(backoffMs);
          return await this.executeRequest(requestFn, options);
        } else if (!isCritical) {
          // Queue for later if not critical
          if (this.options.queueEnabled) {
            console.log(`[RateLimitHandler] Max retries reached, queuing request`);
            this.queueRequest(requestFn, options);
            return { queued: true, requestId };
          }
        }
        
        // Critical request or max retries exceeded
        throw error;
      }
      
      // Non-rate-limit error
      throw error;
    }
  }

  /**
   * Check if error is rate limit error
   */
  isRateLimitError(error) {
    if (!error) return false;
    
    // Check HTTP status
    if (error.status === 429 || error.statusCode === 429) {
      return true;
    }
    
    // Check error message
    if (error.message && error.message.toLowerCase().includes('rate limit')) {
      return true;
    }
    
    // Check response
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract rate limit info from error
   */
  extractRateLimitInfo(error) {
    const info = {
      limit: null,
      remaining: null,
      reset: null,
      retryAfter: null
    };
    
    // Try to extract from headers
    const headers = error.response?.headers || error.headers;
    
    if (headers) {
      info.limit = headers['X-RateLimit-Limit'] || headers['x-ratelimit-limit'];
      info.remaining = headers['X-RateLimit-Remaining'] || headers['x-ratelimit-remaining'];
      info.reset = headers['X-RateLimit-Reset'] || headers['x-ratelimit-reset'];
      info.retryAfter = headers['Retry-After'] || headers['retry-after'];
    }
    
    // Try to extract from response body
    const data = error.response?.data || error.data;
    if (data) {
      info.limit = data.limit || info.limit;
      info.remaining = data.remaining || info.remaining;
      info.reset = data.reset || info.reset;
      info.retryAfter = data.retryAfter || info.retryAfter;
    }
    
    // Parse numeric values
    if (info.limit) info.limit = parseInt(info.limit);
    if (info.remaining) info.remaining = parseInt(info.remaining);
    if (info.reset) info.reset = parseInt(info.reset);
    if (info.retryAfter) info.retryAfter = parseInt(info.retryAfter) * 1000; // Convert to ms
    
    return info;
  }

  /**
   * Calculate backoff time
   */
  calculateBackoff(rateLimitInfo, retryCount) {
    // Use retry-after if provided
    if (rateLimitInfo.retryAfter) {
      return Math.min(rateLimitInfo.retryAfter, this.options.maxBackoffMs);
    }
    
    // Use exponential backoff
    const backoff = this.options.defaultBackoffMs * Math.pow(this.options.backoffMultiplier, retryCount);
    
    return Math.min(backoff, this.options.maxBackoffMs);
  }

  /**
   * Queue request for later processing
   */
  queueRequest(requestFn, options = {}) {
    const queuedRequest = {
      requestFn,
      options,
      priority: options.priority || 'normal',
      timestamp: Date.now(),
      id: this.generateRequestId()
    };
    
    // Add to queue based on priority
    if (queuedRequest.priority === 'high') {
      this.requestQueue.unshift(queuedRequest);
    } else {
      this.requestQueue.push(queuedRequest);
    }
    
    // Limit queue size
    if (this.requestQueue.length > this.options.queueSize) {
      this.requestQueue.shift();
    }
    
    this.emit('requestQueued', { requestId: queuedRequest.id, queueSize: this.requestQueue.length });
    
    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const queuedRequest = this.requestQueue.shift();
      
      try {
        console.log(`[RateLimitHandler] Processing queued request: ${queuedRequest.id}`);
        
        const result = await this.executeRequest(queuedRequest.requestFn, queuedRequest.options);
        
        this.emit('requestProcessed', { requestId: queuedRequest.id, result });
      } catch (error) {
        console.error(`[RateLimitHandler] Failed to process queued request: ${queuedRequest.id}`, error);
        
        // Re-queue if not critical
        if (!queuedRequest.options.critical) {
          this.requestQueue.unshift(queuedRequest);
          // Add delay before retry
          await this.delay(1000);
        } else {
          this.emit('requestFailed', { requestId: queuedRequest.id, error });
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      byPriority: {
        high: this.requestQueue.filter(r => r.priority === 'high').length,
        normal: this.requestQueue.filter(r => r.priority === 'normal').length,
        low: this.requestQueue.filter(r => r.priority === 'low').length
      }
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    const clearedCount = this.requestQueue.length;
    this.requestQueue = [];
    
    this.emit('queueCleared', { clearedCount });
    
    return clearedCount;
  }

  /**
   * Get rate limit statistics
   */
  getStatistics() {
    const stats = {
      totalRequests: 0,
      rateLimitedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0,
      byEndpoint: new Map()
    };
    
    this.retryCount.forEach((count, requestId) => {
      stats.retriedRequests += count;
    });
    
    this.rateLimitInfo.forEach((info, requestId) => {
      stats.rateLimitedRequests++;
    });
    
    return {
      ...stats,
      queueStatus: this.getQueueStatus(),
      retryCount: Object.fromEntries(this.retryCount)
    };
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
          console.error(`[RateLimitHandler] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the rate limit handler
   */
  destroy() {
    this.clearQueue();
    this.rateLimitInfo.clear();
    this.retryCount.clear();
    this.eventHandlers.clear();
    console.log('[RateLimitHandler] Destroyed');
  }
}

// Singleton instance
let rateLimitHandlerInstance = null;

/**
 * Get the singleton rate limit handler instance
 */
export function getRateLimitHandler(options = {}) {
  if (!rateLimitHandlerInstance) {
    rateLimitHandlerInstance = new RateLimitHandler(options);
  }
  return rateLimitHandlerInstance;
}

export default RateLimitHandler;
