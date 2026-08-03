// Performance Dashboard
// Aggregates and displays performance metrics

import { PerformanceMetric } from './OperationsTypes.js';
import { getLiveMetricsCollector } from './LiveMetricsCollector.js';

export class PerformanceDashboard {
  constructor() {
    this.metricsCollector = getLiveMetricsCollector();
    this.performanceData = new Map();
    this.initializePerformanceData();
  }

  /**
   * Initialize performance data
   */
  initializePerformanceData() {
    Object.values(PerformanceMetric).forEach(metric => {
      this.performanceData.set(metric, {
        metric,
        currentValue: 0,
        historical: [],
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        trend: 'stable'
      });
    });
  }

  /**
   * Update performance metric
   * @param {string} metric - Performance metric
   * @param {number} value - Metric value
   */
  updatePerformanceMetric(metric, value) {
    const data = this.performanceData.get(metric);
    
    if (!data) {
      return;
    }

    data.currentValue = value;
    data.historical.push({
      value,
      timestamp: new Date().toISOString()
    });

    // Keep last 1000 data points
    if (data.historical.length > 1000) {
      data.historical.shift();
    }

    // Calculate statistics
    const values = data.historical.map(h => h.value);
    data.average = values.reduce((a, b) => a + b, 0) / values.length;
    data.min = Math.min(...values);
    data.max = Math.max(...values);

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    data.p50 = sorted[Math.floor(sorted.length * 0.5)];
    data.p95 = sorted[Math.floor(sorted.length * 0.95)];
    data.p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Calculate trend
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      data.trend = recentAvg > olderAvg * 1.1 ? 'degrading' : 
                    recentAvg < olderAvg * 0.9 ? 'improving' : 'stable';
    }

    this.performanceData.set(metric, data);
  }

  /**
   * Get API performance
   * @returns {object} API performance
   */
  getAPIPerformance() {
    return {
      averageResponseTime: this.performanceData.get(PerformanceMetric.AVERAGE_RESPONSE_TIME),
      p95ResponseTime: this.performanceData.get(PerformanceMetric.P95_RESPONSE_TIME),
      p99ResponseTime: this.performanceData.get(PerformanceMetric.P99_RESPONSE_TIME),
      apiLatency: this.metricsCollector.getMetric('api_latency')
    };
  }

  /**
   * Get cloud performance
   * @returns {object} Cloud performance
   */
  getCloudPerformance() {
    return {
      uploadSpeed: this.performanceData.get(PerformanceMetric.UPLOAD_SPEED),
      downloadSpeed: this.performanceData.get(PerformanceMetric.DOWNLOAD_SPEED),
      storageLatency: this.performanceData.get(PerformanceMetric.STORAGE_LATENCY)
    };
  }

  /**
   * Get database performance
   * @returns {object} Database performance
   */
  getDatabasePerformance() {
    return {
      queryTime: this.performanceData.get(PerformanceMetric.DATABASE_QUERY_TIME),
      responseTime: this.metricsCollector.getMetric('database_response_time')
    };
  }

  /**
   * Get storage performance
   * @returns {object} Storage performance
   */
  getStoragePerformance() {
    return {
      latency: this.performanceData.get(PerformanceMetric.STORAGE_LATENCY),
      uploadSpeed: this.performanceData.get(PerformanceMetric.UPLOAD_SPEED),
      downloadSpeed: this.performanceData.get(PerformanceMetric.DOWNLOAD_SPEED)
    };
  }

  /**
   * Get network performance
   * @returns {object} Network performance
   */
  getNetworkPerformance() {
    return {
      uploadSpeed: this.performanceData.get(PerformanceMetric.UPLOAD_SPEED),
      downloadSpeed: this.performanceData.get(PerformanceMetric.DOWNLOAD_SPEED),
      apiLatency: this.metricsCollector.getMetric('api_latency')
    };
  }

  /**
   * Get business performance
   * @returns {object} Business performance
   */
  getBusinessPerformance() {
    return {
      orderProcessingTime: this.performanceData.get(PerformanceMetric.ORDER_PROCESSING_TIME),
      kitchenTicketTime: this.performanceData.get(PerformanceMetric.KITCHEN_TICKET_TIME),
      reservationProcessingTime: this.performanceData.get(PerformanceMetric.RESERVATION_PROCESSING_TIME),
      notificationDeliveryTime: this.performanceData.get(PerformanceMetric.NOTIFICATION_DELIVERY_TIME)
    };
  }

  /**
   * Get queue performance
   * @returns {object} Queue performance
   */
  getQueuePerformance() {
    return {
      syncQueueSize: this.metricsCollector.getMetric('sync_queue_size'),
      backupQueueSize: this.metricsCollector.getMetric('backup_queue_size'),
      notificationQueueSize: this.metricsCollector.getMetric('notification_queue_size'),
      importQueueSize: this.metricsCollector.getMetric('import_queue_size'),
      exportQueueSize: this.metricsCollector.getMetric('export_queue_size')
    };
  }

  /**
   * Get overall performance score
   * @returns {number} Performance score (0-100)
   */
  getOverallPerformanceScore() {
    const metrics = Array.from(this.performanceData.values());
    
    if (metrics.length === 0) {
      return 100;
    }

    // Calculate score based on trends
    const improving = metrics.filter(m => m.trend === 'improving').length;
    const degrading = metrics.filter(m => m.trend === 'degrading').length;
    const stable = metrics.filter(m => m.trend === 'stable').length;

    const score = ((improving * 100) + (stable * 75) + (degrading * 50)) / metrics.length;
    return Math.round(score);
  }

  /**
   * Get performance summary
   * @returns {object} Performance summary
   */
  getPerformanceSummary() {
    return {
      api: this.getAPIPerformance(),
      cloud: this.getCloudPerformance(),
      database: this.getDatabasePerformance(),
      storage: this.getStoragePerformance(),
      network: this.getNetworkPerformance(),
      business: this.getBusinessPerformance(),
      queue: this.getQueuePerformance(),
      overallScore: this.getOverallPerformanceScore()
    };
  }

  /**
   * Get performance metric history
   * @param {string} metric - Performance metric
   * @returns {Array} Historical data
   */
  getMetricHistory(metric) {
    const data = this.performanceData.get(metric);
    return data ? data.historical : [];
  }

  /**
   * Clear performance history
   * @param {string} metric - Performance metric
   */
  clearMetricHistory(metric) {
    const data = this.performanceData.get(metric);
    if (data) {
      data.historical = [];
      this.performanceData.set(metric, data);
    }
  }

  /**
   * Clear all performance history
   */
  clearAllHistory() {
    this.performanceData.forEach((data, key) => {
      data.historical = [];
      this.performanceData.set(key, data);
    });
  }

  /**
   * Destroy the performance dashboard
   */
  destroy() {
    this.performanceData.clear();
    console.log('[PerformanceDashboard] Destroyed');
  }
}

// Singleton instance
let performanceDashboardInstance = null;

/**
 * Get the singleton performance dashboard instance
 * @returns {PerformanceDashboard} Performance dashboard instance
 */
export function getPerformanceDashboard() {
  if (!performanceDashboardInstance) {
    performanceDashboardInstance = new PerformanceDashboard();
  }
  return performanceDashboardInstance;
}

export default PerformanceDashboard;
