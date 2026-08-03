// Trend Analyzer
// Analyzes trends in health, performance, and system metrics

import { TrendData, TrendPeriod } from './DiagnosticsTypes.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Trend Analyzer - Analyzes trends across system metrics
 */
class TrendAnalyzer {
  constructor() {
    this.isInitialized = false;
    this.trendCache = new Map(); // key -> TrendData
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the Trend Analyzer
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[TrendAnalyzer] Already initialized');
      return;
    }

    console.log('[TrendAnalyzer] Initializing...');
    this.isInitialized = true;
    console.log('[TrendAnalyzer] Initialized successfully');
  }

  /**
   * Analyze trend for a specific metric
   */
  async analyzeTrend(metric, period = TrendPeriod.DAILY) {
    const cacheKey = `${metric}-${period}`;
    const cached = this.trendCache.get(cacheKey);
    
    if (cached && (Date.now() - new Date(cached.generatedAt).getTime()) < this.cacheTTL) {
      return cached;
    }

    // Get performance data
    const dataPoints = performanceAnalyzer.getMetricsData(metric, this.periodToTimeRange(period));
    
    if (dataPoints.length < 2) {
      return null;
    }

    // Calculate trend statistics
    const values = dataPoints.map(dp => dp.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Determine trend direction
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend = 'stable';
    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (percentChange > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    // Check for volatility
    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / average;
    
    if (coefficientOfVariation > 0.5) {
      trend = 'volatile';
    }

    const trendData = new TrendData({
      metric,
      period,
      dataPoints,
      trend,
      average,
      min,
      max,
      percentChange
    });

    this.trendCache.set(cacheKey, trendData);
    return trendData;
  }

  /**
   * Analyze health score trend
   */
  async analyzeHealthScoreTrend(period = TrendPeriod.DAILY) {
    const cacheKey = `health-score-${period}`;
    const cached = this.trendCache.get(cacheKey);
    
    if (cached && (Date.now() - new Date(cached.generatedAt).getTime()) < this.cacheTTL) {
      return cached;
    }

    // Get historical health scores from localStorage
    const history = this.getHealthHistory();
    const filteredHistory = this.filterHistoryByPeriod(history, period);
    
    if (filteredHistory.length < 2) {
      return null;
    }

    const scores = filteredHistory.map(h => h.score);
    const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend = 'stable';
    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (percentChange > 0) {
      trend = 'improving';
    } else {
      trend = 'degrading';
    }

    const trendData = new TrendData({
      metric: 'health_score',
      period,
      dataPoints: filteredHistory.map(h => ({
        value: h.score,
        timestamp: h.timestamp
      })),
      trend,
      average,
      min,
      max,
      percentChange
    });

    this.trendCache.set(cacheKey, trendData);
    return trendData;
  }

  /**
   * Get health history from localStorage
   */
  getHealthHistory() {
    try {
      const saved = localStorage.getItem('cafeos_health_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to load health history:', error);
    }
    return [];
  }

  /**
   * Filter history by time period
   */
  filterHistoryByPeriod(history, period) {
    const now = Date.now();
    const timeRange = this.periodToTimeRange(period);
    
    return history.filter(h => {
      const timestamp = new Date(h.timestamp).getTime();
      return now - timestamp <= timeRange;
    });
  }

  /**
   * Convert period to time range in milliseconds
   */
  periodToTimeRange(period) {
    switch (period) {
      case TrendPeriod.HOURLY:
        return 60 * 60 * 1000; // 1 hour
      case TrendPeriod.DAILY:
        return 24 * 60 * 60 * 1000; // 1 day
      case TrendPeriod.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000; // 1 week
      case TrendPeriod.MONTHLY:
        return 30 * 24 * 60 * 60 * 1000; // 1 month
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get multiple trends at once
   */
  async analyzeMultipleTrends(metrics, period = TrendPeriod.DAILY) {
    const trends = {};
    
    for (const metric of metrics) {
      trends[metric] = await this.analyzeTrend(metric, period);
    }

    return trends;
  }

  /**
   * Get system-wide trend summary
   */
  async getSystemTrendSummary(period = TrendPeriod.DAILY) {
    const healthTrend = await this.analyzeHealthScoreTrend(period);
    
    // Get trends for key performance metrics
    const keyMetrics = [
      'api_response_time',
      'database_response_time',
      'storage_latency'
    ];
    
    const performanceTrends = await this.analyzeMultipleTrends(keyMetrics, period);

    return {
      health: healthTrend,
      performance: performanceTrends,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Detect anomalies in trend data
   */
  detectAnomalies(trendData, threshold = 2) {
    if (!trendData || trendData.dataPoints.length < 10) {
      return [];
    }

    const values = trendData.dataPoints.map(dp => dp.value);
    const average = trendData.average;
    const stdDev = Math.sqrt(
      values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length
    );

    const anomalies = trendData.dataPoints.filter(dp => {
      const zScore = Math.abs(dp.value - average) / stdDev;
      return zScore > threshold;
    });

    return anomalies.map(dp => ({
      value: dp.value,
      timestamp: dp.timestamp,
      zScore: Math.abs(dp.value - average) / stdDev,
      severity: Math.abs(dp.value - average) / stdDev > threshold * 2 ? 'critical' : 'warning'
    }));
  }

  /**
   * Clear trend cache
   */
  clearCache() {
    this.trendCache.clear();
  }

  /**
   * Get cached trends
   */
  getCachedTrends() {
    return Object.fromEntries(this.trendCache);
  }
}

// Singleton instance
const trendAnalyzer = new TrendAnalyzer();

export default trendAnalyzer;
export { TrendAnalyzer };
