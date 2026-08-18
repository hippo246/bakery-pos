// Memory Leak Detector
// Monitors component mount/unmount cycles and memory usage

export class MemoryLeakDetector {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000,
      memoryThreshold: config.memoryThreshold || 100 * 1024 * 1024, // 100MB
      componentTrackingEnabled: config.componentTrackingEnabled !== false,
      alertThreshold: config.alertThreshold || 3, // Alert after 3 consecutive high memory checks
      ...config
    };
    
    this.componentRegistry = new Map();
    this.memoryHistory = [];
    this.highMemoryCount = 0;
    this.checkTimer = null;
    this.initialMemory = null;
    
    this.initialize();
  }

  /**
   * Initialize memory leak detection
   */
  initialize() {
    // Record initial memory usage
    this.initialMemory = this.getMemoryUsage();
    
    // Start periodic checks
    if (this.config.componentTrackingEnabled) {
      this.startMonitoring();
    }
    
    console.log('[MemoryLeakDetector] Initialized');
  }

  /**
   * Register component for tracking
   */
  registerComponent(componentId, componentName) {
    this.componentRegistry.set(componentId, {
      name: componentName,
      mountTime: Date.now(),
      unmountTime: null,
      mountCount: 1
    });
    
    console.log(`[MemoryLeakDetector] Registered component: ${componentName} (${componentId})`);
  }

  /**
   * Record component mount
   */
  recordMount(componentId) {
    const component = this.componentRegistry.get(componentId);
    
    if (component) {
      component.mountTime = Date.now();
      component.mountCount = (component.mountCount || 0) + 1;
      component.unmountTime = null;
    } else {
      console.warn(`[MemoryLeakDetector] Component not registered: ${componentId}`);
    }
  }

  /**
   * Record component unmount
   */
  recordUnmount(componentId) {
    const component = this.componentRegistry.get(componentId);
    
    if (component) {
      component.unmountTime = Date.now();
      const lifetime = component.unmountTime - component.mountTime;
      
      // Alert if component lived too long (> 5 minutes)
      if (lifetime > 5 * 60 * 1000) {
        console.warn(`[MemoryLeakDetector] Long-lived component: ${component.name} (${lifetime / 1000}s)`);
      }
      
      // Alert if component mounted many times (> 10)
      if (component.mountCount > 10) {
        console.warn(`[MemoryLeakDetector] High mount count: ${component.name} (${component.mountCount} times)`);
      }
    }
  }

  /**
   * Unregister component
   */
  unregisterComponent(componentId) {
    this.componentRegistry.delete(componentId);
    console.log(`[MemoryLeakDetector] Unregistered component: ${componentId}`);
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    if (performance && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usedMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        totalMB: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limitMB: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      };
    }
    
    return null;
  }

  /**
   * Check memory usage
   */
  checkMemoryUsage() {
    const memory = this.getMemoryUsage();
    
    if (!memory) {
      console.warn('[MemoryLeakDetector] Memory API not available');
      return { available: false };
    }

    const memoryDiff = memory.used - (this.initialMemory?.used || 0);
    const usagePercent = (memory.used / memory.limit) * 100;
    
    this.memoryHistory.push({
      timestamp: Date.now(),
      ...memory,
      memoryDiff,
      usagePercent
    });
    
    // Keep only last 100 readings
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
    
    // Check threshold
    if (memory.used > this.config.memoryThreshold) {
      this.highMemoryCount++;
      
      console.warn(`[MemoryLeakDetector] High memory usage: ${memory.usedMB}MB (${usagePercent.toFixed(1)}%)`);
      
      if (this.highMemoryCount >= this.config.alertThreshold) {
        this.triggerMemoryAlert(memory);
      }
    } else {
      this.highMemoryCount = 0;
    }
    
    return {
      available: true,
      memory,
      memoryDiff,
      usagePercent,
      highMemoryCount: this.highMemoryCount
    };
  }

  /**
   * Check for potential memory leaks in components
   */
  checkComponentLeaks() {
    const leaks = [];
    const now = Date.now();
    
    this.componentRegistry.forEach((component, componentId) => {
      // Check for components that never unmounted
      if (!component.unmountTime) {
        const age = now - component.mountTime;
        
        // Alert if component has been mounted for > 10 minutes without unmount
        if (age > 10 * 60 * 1000) {
          leaks.push({
            componentId,
            name: component.name,
            issue: 'never_unmounted',
            age: age / 1000,
            mountCount: component.mountCount
          });
        }
      }
      
      // Check for high mount counts
      if (component.mountCount > 20) {
        leaks.push({
          componentId,
          name: component.name,
          issue: 'high_mount_count',
          mountCount: component.mountCount
        });
      }
    });
    
    return leaks;
  }

  /**
   * Trigger memory alert
   */
  triggerMemoryAlert(memory) {
    console.error('[MemoryLeakDetector] MEMORY ALERT:', {
      used: `${memory.usedMB  }MB`,
      limit: `${memory.limitMB  }MB`,
      usagePercent: `${((memory.used / memory.limit) * 100).toFixed(1)  }%`,
      highMemoryCount: this.highMemoryCount
    });
    
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('memoryAlert', {
      detail: {
        memory,
        highMemoryCount: this.highMemoryCount
      }
    }));
    
    // Suggest garbage collection if available
    if (window.gc) {
      console.log('[MemoryLeakDetector] Attempting garbage collection');
      window.gc();
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(() => {
      this.checkMemoryUsage();
      this.checkComponentLeaks();
    }, this.config.checkInterval);
    
    console.log('[MemoryLeakDetector] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('[MemoryLeakDetector] Monitoring stopped');
    }
  }

  /**
   * Get memory history
   */
  getMemoryHistory(limit = 50) {
    return this.memoryHistory.slice(-limit);
  }

  /**
   * Get component registry
   */
  getComponentRegistry() {
    return Object.fromEntries(this.componentRegistry);
  }

  /**
   * Get memory trend
   */
  getMemoryTrend() {
    if (this.memoryHistory.length < 2) {
      return { trend: 'unknown', change: 0 };
    }
    
    const recent = this.memoryHistory.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const change = last.used - first.used;
    const changePercent = ((change / first.used) * 100).toFixed(2);
    
    let trend = 'stable';
    if (change > 10 * 1024 * 1024) { // > 10MB increase
      trend = 'increasing';
    } else if (change < -10 * 1024 * 1024) { // > 10MB decrease
      trend = 'decreasing';
    }
    
    return {
      trend,
      change,
      changePercent,
      changeMB: (change / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection() {
    if (window.gc) {
      console.log('[MemoryLeakDetector] Forcing garbage collection');
      window.gc();
      return { success: true };
    }
    
    return { success: false, error: 'GC not available' };
  }

  /**
   * Reset high memory counter
   */
  resetHighMemoryCounter() {
    this.highMemoryCount = 0;
    console.log('[MemoryLeakDetector] High memory counter reset');
  }

  /**
   * Clear memory history
   */
  clearMemoryHistory() {
    this.memoryHistory = [];
    console.log('[MemoryLeakDetector] Memory history cleared');
  }

  /**
   * Get summary
   */
  getSummary() {
    const memory = this.getMemoryUsage();
    const componentLeaks = this.checkComponentLeaks();
    const trend = this.getMemoryTrend();
    
    return {
      memory,
      componentLeaks,
      trend,
      highMemoryCount: this.highMemoryCount,
      registeredComponents: this.componentRegistry.size,
      monitoringActive: !!this.checkTimer
    };
  }

  /**
   * Destroy the memory leak detector
   */
  destroy() {
    this.stopMonitoring();
    this.componentRegistry.clear();
    this.memoryHistory = [];
    console.log('[MemoryLeakDetector] Destroyed');
  }
}

// Singleton instance
let memoryLeakDetectorInstance = null;

/**
 * Get the singleton memory leak detector instance
 */
export function getMemoryLeakDetector() {
  if (!memoryLeakDetectorInstance) {
    memoryLeakDetectorInstance = new MemoryLeakDetector();
  }
  return memoryLeakDetectorInstance;
}

/**
 * React hook for component memory tracking
 */
export function useMemoryTracking(componentName) {
  const detector = getMemoryLeakDetector();
  const componentId = React.useRef(`comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;
  
  React.useEffect(() => {
    detector.registerComponent(componentId, componentName);
    detector.recordMount(componentId);
    
    return () => {
      detector.recordUnmount(componentId);
      detector.unregisterComponent(componentId);
    };
  }, [componentName, detector, componentId]);
  
  return {
    componentId,
    detector
  };
}

export default MemoryLeakDetector;
