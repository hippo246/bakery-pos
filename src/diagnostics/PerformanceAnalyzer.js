// Performance Analyzer
// Tracks and analyzes performance metrics across the system

import { PerformanceDataPoint, PerformanceMetric } from './DiagnosticsTypes.js';

/**
 * Performance Analyzer - Tracks and analyzes system performance
 */
class PerformanceAnalyzer {
  constructor() {
    this.isInitialized = false;
    this.metricsData = new Map(); // metric -> array of PerformanceDataPoint
    this.aggregatedData = new Map(); // metric -> aggregated stats
  }

  /**
   * Initialize the Performance Analyzer
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[PerformanceAnalyzer] Already initialized');
      return;
    }

    console.log('[PerformanceAnalyzer] Initializing...');
    await this.loadMetricsData();
    this.isInitialized = true;
    console.log('[PerformanceAnalyzer] Initialized successfully');
  }

  /**
   * Load metrics data from localStorage
   */
  async loadMetricsData() {
    try {
      const saved = localStorage.getItem('cafeos_performance_metrics');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([metric, data]) => {
          this.metricsData.set(metric, data);
        });
        console.log(`[PerformanceAnalyzer] Loaded data for ${this.metricsData.size} metrics`);
      }
    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to load metrics data:', error);
    }
  }

  /**
   * Save metrics data to localStorage
   */
  async saveMetricsData() {
    try {
      const dataObj = Object.fromEntries(this.metricsData);
      localStorage.setItem('cafeos_performance_metrics', JSON.stringify(dataObj));
    } catch (error) {
      console.error('[PerformanceAnalyzer] Failed to save metrics data:', error);
    }
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric, value, metadata = {}) {
    const dataPoint = new PerformanceDataPoint({
      metric,
      value,
      timestamp: new Date().toISOString(),
      metadata
    });

    if (!this.metricsData.has(metric)) {
      this.metricsData.set(metric, []);
    }

    this.metricsData.get(metric).push(dataPoint);

    // Keep only last 1000 data points per metric to prevent memory issues
    const metricData = this.metricsData.get(metric);
    if (metricData.length > 1000) {
      this.metricsData.set(metric, metricData.slice(-1000));
    }

    // Update aggregated data
    this.updateAggregatedData(metric);

    await this.saveMetricsData();
  }

  /**
   * Update aggregated statistics for a metric
   */
  updateAggregatedData(metric) {
    const data = this.metricsData.get(metric);
    if (!data || data.length === 0) return;

    const values = data.map(dp => dp.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    this.aggregatedData.set(metric, {
      count: values.length,
      average: avg,
      min,
      max,
      stdDev,
      p50,
      p95,
      p99,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Get metrics data for a specific metric
   */
  getMetricsData(metric, period = '1h') {
    const data = this.metricsData.get(metric) || [];
    const now = Date.now();
    const periodMs = this.parsePeriod(period);
    
    return data.filter(dp => {
      const timestamp = new Date(dp.timestamp).getTime();
      return now - timestamp <= periodMs;
    });
  }

  /**
   * Get aggregated statistics for a metric
   */
  getAggregatedData(metric) {
    return this.aggregatedData.get(metric) || null;
  }

  /**
   * Get all metrics with their aggregated data
   */
  getAllMetrics() {
    const metrics = {};
    
    for (const [metric, data] of this.metricsData.entries()) {
      metrics[metric] = {
        count: data.length,
        aggregated: this.aggregatedData.get(metric) || null,
        latest: data[data.length - 1] || null
      };
    }

    return metrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      totalMetrics: this.metricsData.size,
      totalDataPoints: 0,
      metrics: {},
      alerts: []
    };

    for (const [metric, aggregated] of this.aggregatedData.entries()) {
      summary.totalDataPoints += aggregated.count;
      summary.metrics[metric] = aggregated;

      // Check for performance alerts
      if (aggregated.p95 > aggregated.average * 2) {
        summary.alerts.push({
          metric,
          type: 'high_variance',
          message: `${metric} has high variance (p95 is ${Math.round(aggregated.p95 / aggregated.average * 100)}% of average)`,
          severity: 'warning'
        });
      }

      if (aggregated.p99 > 5000) { // 5 seconds
        summary.alerts.push({
          metric,
          type: 'slow_p99',
          message: `${metric} p99 latency is high (${Math.round(aggregated.p99)}ms)`,
          severity: aggregated.p99 > 10000 ? 'critical' : 'warning'
        });
      }
    }

    return summary;
  }

  /**
   * Compare performance between two time periods
   */
  comparePerformance(metric, period1, period2) {
    const data1 = this.getMetricsData(metric, period1);
    const data2 = this.getMetricsData(metric, period2);

    if (data1.length === 0 || data2.length === 0) {
      return null;
    }

    const avg1 = data1.reduce((sum, dp) => sum + dp.value, 0) / data1.length;
    const avg2 = data2.reduce((sum, dp) => sum + dp.value, 0) / data2.length;

    const percentChange = ((avg2 - avg1) / avg1) * 100;

    return {
      metric,
      period1: {
        period: period1,
        average: avg1,
        count: data1.length
      },
      period2: {
        period: period2,
        average: avg2,
        count: data2.length
      },
      percentChange,
      trend: percentChange > 0 ? 'degraded' : percentChange < 0 ? 'improved' : 'stable'
    };
  }

  /**
   * Get slowest operations for a metric
   */
  getSlowestOperations(metric, limit = 10) {
    const data = this.metricsData.get(metric) || [];
    
    return data
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map(dp => ({
        value: dp.value,
        timestamp: dp.timestamp,
        metadata: dp.metadata
      }));
  }

  /**
   * Parse period string to milliseconds
   */
  parsePeriod(period) {
    const units = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
      'w': 604800000
    };
    
    const match = period.match(/^(\d+)([smhdw])$/);
    if (!match) return 3600000; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * units[unit];
  }

  /**
   * Cleanup old metrics data
   */
  async cleanupOldData(retentionDays) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [metric, data] of this.metricsData.entries()) {
      const originalLength = data.length;
      const filtered = data.filter(dp => new Date(dp.timestamp).getTime() > cutoff);
      
      if (filtered.length !== originalLength) {
        this.metricsData.set(metric, filtered);
        this.updateAggregatedData(metric);
        removedCount += (originalLength - filtered.length);
      }
    }

    if (removedCount > 0) {
      await this.saveMetricsData();
      console.log(`[PerformanceAnalyzer] Cleaned up ${removedCount} old data points`);
    }

    return removedCount;
  }

  /**
   * Get performance baseline for a metric
   */
  getBaseline(metric, period = '7d') {
    const data = this.getMetricsData(metric, period);
    
    if (data.length === 0) return null;

    const values = data.map(dp => dp.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      metric,
      period,
      average: avg,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      sampleSize: values.length
    };
  }

  /**
   * Check if current performance deviates from baseline
   */
  checkDeviation(metric, currentValue, threshold = 2) {
    const baseline = this.getBaseline(metric);
    
    if (!baseline) return null;

    const stdDev = baseline.p95 - baseline.p50;
    const deviation = Math.abs(currentValue - baseline.average) / stdDev;

    return {
      metric,
      currentValue,
      baseline: baseline.average,
      deviation,
      isAnomalous: deviation > threshold,
      severity: deviation > threshold * 2 ? 'critical' : deviation > threshold ? 'warning' : 'normal'
    };
  }
}

// Singleton instance
const performanceAnalyzer = new PerformanceAnalyzer();

export default performanceAnalyzer;
export { PerformanceAnalyzer };
