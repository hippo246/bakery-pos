// Performance Degradation Detection
// Monitor render times, API response times, auto-disable heavy features, switch to simplified UI

export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      renderTimeThreshold: options.renderTimeThreshold || 100, // 100ms
      apiResponseThreshold: options.apiResponseThreshold || 2000, // 2s
      memoryThreshold: options.memoryThreshold || 100 * 1024 * 1024, // 100MB
      checkInterval: options.checkInterval || 5000, // 5 seconds
      degradationThreshold: options.degradationThreshold || 3, // 3 consecutive failures
      autoOptimizationEnabled: options.autoOptimizationEnabled !== false,
      ...options
    };
    
    this.metrics = {
      renderTimes: [],
      apiResponseTimes: [],
      memoryUsage: [],
      degradationCount: 0
    };
    
    this.degradedFeatures = new Set();
    this.checkTimer = null;
    this.eventHandlers = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    console.log('[PerformanceMonitor] Starting monitoring');
    this.isMonitoring = true;
    
    // Start periodic checks
    this.checkTimer = setInterval(() => {
      this.checkPerformance();
    }, this.options.checkInterval);
    
    // Monitor API calls
    this.interceptFetch();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('[PerformanceMonitor] Stopping monitoring');
    this.isMonitoring = false;
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Intercept fetch to monitor API response times
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordApiResponse(duration, args[0]);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordApiResponse(duration, args[0], true);
        
        throw error;
      }
    };
  }

  /**
   * Record render time
   */
  recordRenderTime(componentName, duration) {
    this.metrics.renderTimes.push({
      component: componentName,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 render times
    if (this.metrics.renderTimes.length > 100) {
      this.metrics.renderTimes.shift();
    }
    
    // Check threshold
    if (duration > this.options.renderTimeThreshold) {
      console.warn(`[PerformanceMonitor] Slow render: ${componentName} (${duration.toFixed(2)}ms)`);
      
      this.metrics.degradationCount++;
      
      if (this.metrics.degradationCount >= this.options.degradationThreshold) {
        this.handleDegradation('render', componentName);
      }
    } else {
      this.metrics.degradationCount = Math.max(0, this.metrics.degradationCount - 1);
    }
  }

  /**
   * Record API response time
   */
  recordApiResponse(duration, url, isError = false) {
    this.metrics.apiResponseTimes.push({
      url,
      duration,
      isError,
      timestamp: Date.now()
    });
    
    // Keep only last 100 API times
    if (this.metrics.apiResponseTimes.length > 100) {
      this.metrics.apiResponseTimes.shift();
    }
    
    // Check threshold
    if (duration > this.options.apiResponseThreshold) {
      console.warn(`[PerformanceMonitor] Slow API: ${url} (${duration.toFixed(2)}ms)`);
      
      this.metrics.degradationCount++;
      
      if (this.metrics.degradationCount >= this.options.degradationThreshold) {
        this.handleDegradation('api', url);
      }
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if (performance && performance.memory) {
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      this.metrics.memoryUsage.push(memory);
      
      // Keep only last 100 memory readings
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
      
      // Check threshold
      if (memory.used > this.options.memoryThreshold) {
        console.warn(`[PerformanceMonitor] High memory: ${(memory.used / 1024 / 1024).toFixed(2)}MB`);
        
        this.metrics.degradationCount++;
        
        if (this.metrics.degradationCount >= this.options.degradationThreshold) {
          this.handleDegradation('memory', memory.used);
        }
      }
    }
  }

  /**
   * Check overall performance
   */
  checkPerformance() {
    this.recordMemoryUsage();
    
    const stats = this.getStatistics();
    
    // Check if overall performance is degraded
    if (stats.averageRenderTime > this.options.renderTimeThreshold ||
        stats.averageApiResponseTime > this.options.apiResponseThreshold ||
        (stats.memoryUsage && stats.memoryUsage.used > this.options.memoryThreshold)) {
      
      this.emit('performanceDegraded', { stats });
      
      if (this.options.autoOptimizationEnabled) {
        this.optimizePerformance();
      }
    }
  }

  /**
   * Handle performance degradation
   */
  handleDegradation(type, source) {
    console.warn(`[PerformanceMonitor] Performance degradation detected: ${type} - ${source}`);
    
    this.emit('degradationDetected', { type, source });
    
    if (this.options.autoOptimizationEnabled) {
      this.optimizePerformance();
    }
  }

  /**
   * Optimize performance by disabling heavy features
   */
  optimizePerformance() {
    const optimizations = [];
    
    // Disable animations
    if (!this.degradedFeatures.has('animations')) {
      this.degradedFeatures.add('animations');
      document.body.classList.add('performance-mode');
      optimizations.push('animations_disabled');
    }
    
    // Disable heavy visual effects
    if (!this.degradedFeatures.has('effects')) {
      this.degradedFeatures.add('effects');
      optimizations.push('effects_disabled');
    }
    
    // Reduce data refresh rate
    if (!this.degradedFeatures.has('refresh_rate')) {
      this.degradedFeatures.add('refresh_rate');
      optimizations.push('refresh_rate_reduced');
    }
    
    // Disable non-critical features
    if (!this.degradedFeatures.has('non_critical')) {
      this.degradedFeatures.add('non_critical');
      optimizations.push('non_critical_disabled');
    }
    
    this.emit('performanceOptimized', { optimizations });
    
    if (optimizations.length > 0) {
      this.emit('alert', {
        type: 'performance_optimization',
        message: 'Performance mode enabled - some features disabled',
        severity: 'info'
      });
    }
  }

  /**
   * Restore normal performance mode
   */
  restorePerformanceMode() {
    const restored = [];
    
    this.degradedFeatures.forEach(feature => {
      if (feature === 'animations') {
        document.body.classList.remove('performance-mode');
        restored.push('animations');
      }
      restored.push(feature);
    });
    
    this.degradedFeatures.clear();
    this.metrics.degradationCount = 0;
    
    this.emit('performanceRestored', { restored });
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    const stats = {
      renderTimes: {
        average: 0,
        max: 0,
        min: 0,
        count: this.metrics.renderTimes.length
      },
      apiResponseTimes: {
        average: 0,
        max: 0,
        min: 0,
        count: this.metrics.apiResponseTimes.length,
        errorRate: 0
      },
      memoryUsage: null,
      degradedFeatures: Array.from(this.degradedFeatures),
      degradationCount: this.metrics.degradationCount
    };
    
    // Calculate render time stats
    if (this.metrics.renderTimes.length > 0) {
      const durations = this.metrics.renderTimes.map(r => r.duration);
      stats.renderTimes.average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      stats.renderTimes.max = Math.max(...durations);
      stats.renderTimes.min = Math.min(...durations);
    }
    
    // Calculate API response time stats
    if (this.metrics.apiResponseTimes.length > 0) {
      const durations = this.metrics.apiResponseTimes.map(r => r.duration);
      const errors = this.metrics.apiResponseTimes.filter(r => r.isError).length;
      
      stats.apiResponseTimes.average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      stats.apiResponseTimes.max = Math.max(...durations);
      stats.apiResponseTimes.min = Math.min(...durations);
      stats.apiResponseTimes.errorRate = (errors / this.metrics.apiResponseTimes.length) * 100;
    }
    
    // Get latest memory usage
    if (this.metrics.memoryUsage.length > 0) {
      stats.memoryUsage = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    }
    
    return stats;
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit = 10) {
    return this.metrics.renderTimes
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get slowest API calls
   */
  getSlowestApiCalls(limit = 10) {
    return this.metrics.apiResponseTimes
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.renderTimes = [];
    this.metrics.apiResponseTimes = [];
    this.metrics.memoryUsage = [];
    this.metrics.degradationCount = 0;
    
    console.log('[PerformanceMonitor] Metrics cleared');
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds) {
    if (thresholds.renderTimeThreshold !== undefined) {
      this.options.renderTimeThreshold = thresholds.renderTimeThreshold;
    }
    if (thresholds.apiResponseThreshold !== undefined) {
      this.options.apiResponseThreshold = thresholds.apiResponseThreshold;
    }
    if (thresholds.memoryThreshold !== undefined) {
      this.options.memoryThreshold = thresholds.memoryThreshold;
    }
  }

  /**
   * Enable/disable auto-optimization
   */
  setAutoOptimizationEnabled(enabled) {
    this.options.autoOptimizationEnabled = enabled;
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
          console.error(`[PerformanceMonitor] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the performance monitor
   */
  destroy() {
    this.stopMonitoring();
    this.degradedFeatures.clear();
    this.eventHandlers.clear();
    console.log('[PerformanceMonitor] Destroyed');
  }
}

// Singleton instance
let performanceMonitorInstance = null;

/**
 * Get the singleton performance monitor instance
 */
export function getPerformanceMonitor(options = {}) {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(options);
  }
  return performanceMonitorInstance;
}

/**
 * React hook for component render time tracking
 */
export function useRenderTimeTracking(componentName) {
  const monitor = getPerformanceMonitor();
  
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      monitor.recordRenderTime(componentName, duration);
    };
  }, [componentName, monitor]);
}

export default PerformanceMonitor;
