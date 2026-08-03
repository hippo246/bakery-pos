// Live Metrics Collector
// Collects live metrics for all systems

import { MetricType, PerformanceMetric } from './OperationsTypes.js';

export class LiveMetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.metricHistory = new Map();
    this.maxHistorySize = 100;
    this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  initializeMetrics() {
    Object.values(MetricType).forEach(metric => {
      this.metrics.set(metric, {
        type: metric,
        value: 0,
        unit: this.getMetricUnit(metric),
        lastUpdated: null,
        history: []
      });
    });

    Object.values(PerformanceMetric).forEach(metric => {
      this.metrics.set(metric, {
        type: metric,
        value: 0,
        unit: this.getMetricUnit(metric),
        lastUpdated: null,
        history: []
      });
    });
  }

  /**
   * Get metric unit
   * @param {string} metric - Metric type
   * @returns {string} Unit
   */
  getMetricUnit(metric) {
    const units = {
      cpu_usage: '%',
      memory_usage: '%',
      storage_usage: '%',
      database_response_time: 'ms',
      api_latency: 'ms',
      average_request_time: 'ms',
      failed_requests: 'count',
      successful_requests: 'count',
      queue_size: 'count',
      sync_queue_size: 'count',
      backup_queue_size: 'count',
      notification_queue_size: 'count',
      import_queue_size: 'count',
      export_queue_size: 'count',
      average_response_time: 'ms',
      p95_response_time: 'ms',
      p99_response_time: 'ms',
      database_query_time: 'ms',
      storage_latency: 'ms',
      upload_speed: 'MB/s',
      download_speed: 'MB/s',
      order_processing_time: 'ms',
      kitchen_ticket_time: 'ms',
      reservation_processing_time: 'ms',
      notification_delivery_time: 'ms'
    };

    return units[metric] || '';
  }

  /**
   * Record metric
   * @param {string} metricType - Metric type
   * @param {number} value - Metric value
   */
  recordMetric(metricType, value) {
    const metric = this.metrics.get(metricType);
    
    if (!metric) {
      return;
    }

    metric.value = value;
    metric.lastUpdated = new Date().toISOString();

    // Add to history
    metric.history.push({
      value,
      timestamp: new Date().toISOString()
    });

    // Trim history
    if (metric.history.length > this.maxHistorySize) {
      metric.history.shift();
    }

    this.metrics.set(metricType, metric);
  }

  /**
   * Get metric
   * @param {string} metricType - Metric type
   * @returns {object|null} Metric
   */
  getMetric(metricType) {
    return this.metrics.get(metricType) || null;
  }

  /**
   * Get all metrics
   * @returns {object} All metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Get metric history
   * @param {string} metricType - Metric type
   * @returns {Array} Metric history
   */
  getMetricHistory(metricType) {
    const metric = this.metrics.get(metricType);
    return metric ? metric.history : [];
  }

  /**
   * Get metric statistics
   * @param {string} metricType - Metric type
   * @returns {object} Statistics
   */
  getMetricStatistics(metricType) {
    const metric = this.metrics.get(metricType);
    
    if (!metric || metric.history.length === 0) {
      return {
        current: 0,
        min: 0,
        max: 0,
        average: 0,
        count: 0
      };
    }

    const values = metric.history.map(h => h.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = sum / values.length;

    return {
      current: metric.value,
      min,
      max,
      average,
      count: values.length
    };
  }

  /**
   * Collect all metrics
   * @returns {object} All current metrics
   */
  collectAllMetrics() {
    const collected = {};

    this.metrics.forEach((metric, key) => {
      collected[key] = {
        value: metric.value,
        unit: metric.unit,
        lastUpdated: metric.lastUpdated
      };
    });

    return {
      metrics: collected,
      collectedAt: new Date().toISOString()
    };
  }

  /**
   * Get metrics summary
   * @returns {object} Metrics summary
   */
  getMetricsSummary() {
    const summary = {
      resource: {
        cpuUsage: this.getMetric(MetricType.CPU_USAGE)?.value || 0,
        memoryUsage: this.getMetric(MetricType.MEMORY_USAGE)?.value || 0,
        storageUsage: this.getMetric(MetricType.STORAGE_USAGE)?.value || 0
      },
      performance: {
        apiLatency: this.getMetric(MetricType.API_LATENCY)?.value || 0,
        databaseResponseTime: this.getMetric(MetricType.DATABASE_RESPONSE_TIME)?.value || 0,
        averageRequestTime: this.getMetric(MetricType.AVERAGE_REQUEST_TIME)?.value || 0
      },
      queues: {
        syncQueue: this.getMetric(MetricType.SYNC_QUEUE_SIZE)?.value || 0,
        backupQueue: this.getMetric(MetricType.BACKUP_QUEUE_SIZE)?.value || 0,
        notificationQueue: this.getMetric(MetricType.NOTIFICATION_QUEUE_SIZE)?.value || 0,
        importQueue: this.getMetric(MetricType.IMPORT_QUEUE_SIZE)?.value || 0,
        exportQueue: this.getMetric(MetricType.EXPORT_QUEUE_SIZE)?.value || 0
      },
      requests: {
        successful: this.getMetric(MetricType.SUCCESSFUL_REQUESTS)?.value || 0,
        failed: this.getMetric(MetricType.FAILED_REQUESTS)?.value || 0
      }
    };

    return summary;
  }

  /**
   * Clear metric history
   * @param {string} metricType - Metric type
   */
  clearMetricHistory(metricType) {
    const metric = this.metrics.get(metricType);
    if (metric) {
      metric.history = [];
      this.metrics.set(metricType, metric);
    }
  }

  /**
   * Clear all metric history
   */
  clearAllHistory() {
    this.metrics.forEach((metric, key) => {
      metric.history = [];
      this.metrics.set(key, metric);
    });
  }

  /**
   * Destroy the live metrics collector
   */
  destroy() {
    this.metrics.clear();
    this.metricHistory.clear();
    console.log('[LiveMetricsCollector] Destroyed');
  }
}

// Singleton instance
let liveMetricsCollectorInstance = null;

/**
 * Get the singleton live metrics collector instance
 * @returns {LiveMetricsCollector} Live metrics collector instance
 */
export function getLiveMetricsCollector() {
  if (!liveMetricsCollectorInstance) {
    liveMetricsCollectorInstance = new LiveMetricsCollector();
  }
  return liveMetricsCollectorInstance;
}

export default LiveMetricsCollector;
