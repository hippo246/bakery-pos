// Health History Tracker
// Tracks health history and trends

import { SystemHealthStatus } from './OperationsTypes.js';

export class HealthHistoryTracker {
  constructor() {
    this.healthHistory = new Map();
    this.storageKey = 'cafeos_health_history';
    this.maxHistoryDays = 90;
    this.loadState();
  }

  /**
   * Record health snapshot
   * @param {object} healthData - Health data
   * @returns {object} Record result
   */
  recordHealth(healthData) {
    const snapshotId = this.generateSnapshotId();
    
    const snapshot = {
      snapshotId,
      timestamp: new Date().toISOString(),
      overallStatus: healthData.overallStatus || SystemHealthStatus.UNKNOWN,
      systemHealth: healthData.systemHealth || {},
      performanceScore: healthData.performanceScore || 0,
      securityScore: healthData.securityScore || 0,
      businessStatus: healthData.businessStatus || 'unknown'
    };

    const dateKey = this.getDateKey(new Date());
    
    if (!this.healthHistory.has(dateKey)) {
      this.healthHistory.set(dateKey, []);
    }

    this.healthHistory.get(dateKey).push(snapshot);
    this.trimHistory();
    this.saveState();

    return { success: true, snapshotId, snapshot };
  }

  /**
   * Get health history
   * @param {object} filters - Optional filters
   * @returns {Array} Health snapshots
   */
  getHealthHistory(filters = {}) {
    let snapshots = [];

    this.healthHistory.forEach((daySnapshots, dateKey) => {
      if (filters.since && dateKey < filters.since) {
        return;
      }

      if (filters.until && dateKey > filters.until) {
        return;
      }

      snapshots.push(...daySnapshots);
    });

    // Sort by timestamp descending
    snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filters.limit) {
      snapshots = snapshots.slice(0, filters.limit);
    }

    return snapshots;
  }

  /**
   * Get daily health
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Array} Daily snapshots
   */
  getDailyHealth(date) {
    return this.healthHistory.get(date) || [];
  }

  /**
   * Get weekly health
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @returns {Array} Weekly snapshots
   */
  getWeeklyHealth(startDate) {
    const snapshots = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateKey = this.getDateKey(date);
      const daySnapshots = this.healthHistory.get(dateKey);
      if (daySnapshots) {
        snapshots.push(...daySnapshots);
      }
    }

    return snapshots;
  }

  /**
   * Get monthly health
   * @param {string} yearMonth - Year-month (YYYY-MM)
   * @returns {Array} Monthly snapshots
   */
  getMonthlyHealth(yearMonth) {
    const snapshots = [];
    const [year, month] = yearMonth.split('-').map(Number);

    this.healthHistory.forEach((daySnapshots, dateKey) => {
      const [snapYear, snapMonth] = dateKey.split('-').map(Number);
      if (snapYear === year && snapMonth === month) {
        snapshots.push(...daySnapshots);
      }
    });

    return snapshots;
  }

  /**
   * Get health trends
   * @param {number} days - Number of days
   * @returns {object} Trends
   */
  getHealthTrends(days = 30) {
    const snapshots = this.getHealthHistory({ limit: days * 24 }); // Assuming hourly snapshots
    
    if (snapshots.length === 0) {
      return {
        overallTrend: 'stable',
        performanceTrend: 'stable',
        securityTrend: 'stable',
        availability: 0
      };
    }

    const recent = snapshots.slice(0, Math.floor(snapshots.length / 3));
    const older = snapshots.slice(Math.floor(snapshots.length / 3));

    const recentHealthy = recent.filter(s => s.overallStatus === SystemHealthStatus.HEALTHY).length;
    const olderHealthy = older.filter(s => s.overallStatus === SystemHealthStatus.HEALTHY).length;

    const recentAvgPerf = recent.reduce((sum, s) => sum + s.performanceScore, 0) / recent.length;
    const olderAvgPerf = older.reduce((sum, s) => sum + s.performanceScore, 0) / older.length;

    const recentAvgSec = recent.reduce((sum, s) => sum + s.securityScore, 0) / recent.length;
    const olderAvgSec = older.reduce((sum, s) => sum + s.securityScore, 0) / older.length;

    const overallTrend = recentHealthy >= olderHealthy ? 'improving' : 'degrading';
    const performanceTrend = recentAvgPerf >= olderAvgPerf ? 'improving' : 'degrading';
    const securityTrend = recentAvgSec >= olderAvgSec ? 'improving' : 'degrading';

    const availability = (recentHealthy / recent.length) * 100;

    return {
      overallTrend,
      performanceTrend,
      securityTrend,
      availability: Math.round(availability)
    };
  }

  /**
   * Get incident history
   * @returns {Array} Incidents
   */
  getIncidentHistory() {
   const incidents = [];

    this.healthHistory.forEach((daySnapshots) => {
      daySnapshots.forEach(snapshot => {
        if (snapshot.overallStatus === SystemHealthStatus.CRITICAL || 
            snapshot.overallStatus === SystemHealthStatus.OFFLINE) {
          incidents.push({
            timestamp: snapshot.timestamp,
            status: snapshot.overallStatus,
            systemHealth: snapshot.systemHealth
          });
        }
      });
    });

    incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return incidents;
  }

  /**
   * Get recovery history
   * @returns {Array} Recoveries
   */
  getRecoveryHistory() {
    const recoveries = [];
    let previousStatus = null;

    const snapshots = this.getHealthHistory({ limit: 1000 });

    snapshots.reverse().forEach(snapshot => {
      if (previousStatus && 
          (previousStatus === SystemHealthStatus.CRITICAL || previousStatus === SystemHealthStatus.OFFLINE) &&
          snapshot.overallStatus === SystemHealthStatus.HEALTHY) {
        recoveries.push({
          timestamp: snapshot.timestamp,
          recoveredFrom: previousStatus
        });
      }
      previousStatus = snapshot.overallStatus;
    });

    recoveries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return recoveries;
  }

  /**
   * Get availability statistics
   * @param {number} days - Number of days
   * @returns {object} Availability statistics
   */
  getAvailabilityStatistics(days = 30) {
    const snapshots = this.getHealthHistory({ limit: days * 24 });
    
    if (snapshots.length === 0) {
      return {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        offline: 0,
        availability: 0
      };
    }

    const total = snapshots.length;
    const healthy = snapshots.filter(s => s.overallStatus === SystemHealthStatus.HEALTHY).length;
    const warning = snapshots.filter(s => s.overallStatus === SystemHealthStatus.WARNING).length;
    const critical = snapshots.filter(s => s.overallStatus === SystemHealthStatus.CRITICAL).length;
    const offline = snapshots.filter(s => s.overallStatus === SystemHealthStatus.OFFLINE).length;

    return {
      total,
      healthy,
      warning,
      critical,
      offline,
      availability: Math.round((healthy / total) * 100)
    };
  }

  /**
   * Get date key
   * @param {Date} date - Date
   * @returns {string} Date key (YYYY-MM-DD)
   */
  getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Trim history to max days
   */
  trimHistory() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxHistoryDays);
    const cutoffKey = this.getDateKey(cutoffDate);

    this.healthHistory.forEach((_, dateKey) => {
      if (dateKey < cutoffKey) {
        this.healthHistory.delete(dateKey);
      }
    });
  }

  /**
   * Generate snapshot ID
   * @returns {string} Snapshot ID
   */
  generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        healthHistory: Array.from(this.healthHistory.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save health history state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.healthHistory = new Map(parsed.healthHistory || []);
      }
    } catch (error) {
      console.error('Failed to load health history state:', error);
      this.healthHistory = new Map();
    }
  }

  /**
   * Destroy the health history tracker
   */
  destroy() {
    this.healthHistory.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[HealthHistoryTracker] Destroyed');
  }
}

// Singleton instance
let healthHistoryTrackerInstance = null;

/**
 * Get the singleton health history tracker instance
 * @returns {HealthHistoryTracker} Health history tracker instance
 */
export function getHealthHistoryTracker() {
  if (!healthHistoryTrackerInstance) {
    healthHistoryTrackerInstance = new HealthHistoryTracker();
  }
  return healthHistoryTrackerInstance;
}

export default HealthHistoryTracker;
