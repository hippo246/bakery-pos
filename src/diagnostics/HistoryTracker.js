// History Tracker
// Maintains historical data for incidents, warnings, failures, recoveries

/**
 * History Tracker - Maintains historical diagnostics data
 */
class HistoryTracker {
  constructor() {
    this.isInitialized = false;
    this.history = new Map(); // type -> array of history entries
  }

  /**
   * Initialize the History Tracker
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[HistoryTracker] Already initialized');
      return;
    }

    console.log('[HistoryTracker] Initializing...');
    await this.loadHistory();
    this.isInitialized = true;
    console.log('[HistoryTracker] Initialized successfully');
  }

  /**
   * Load history from localStorage
   */
  async loadHistory() {
    try {
      const saved = localStorage.getItem('cafeos_diagnostics_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([type, entries]) => {
          this.history.set(type, entries);
        });
        console.log(`[HistoryTracker] Loaded history for ${this.history.size} types`);
      }
    } catch (error) {
      console.error('[HistoryTracker] Failed to load history:', error);
    }
  }

  /**
   * Save history to localStorage
   */
  async saveHistory() {
    try {
      const historyObj = Object.fromEntries(this.history);
      localStorage.setItem('cafeos_diagnostics_history', JSON.stringify(historyObj));
    } catch (error) {
      console.error('[HistoryTracker] Failed to save history:', error);
    }
  }

  /**
   * Record an incident in history
   */
  async recordIncident(incident) {
    const entry = {
      type: 'incident',
      id: incident.id,
      component: incident.component,
      severity: incident.severity,
      status: incident.status,
      started: incident.started,
      resolved: incident.resolved,
      rootCause: incident.rootCause?.likelyCause,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('incidents', entry);
  }

  /**
   * Record a warning in history
   */
  async recordWarning(warning) {
    const entry = {
      type: 'warning',
      id: warning.id,
      component: warning.component,
      severity: warning.severity,
      message: warning.predictedIssue,
      confidence: warning.confidence,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('warnings', entry);
  }

  /**
   * Record a failure in history
   */
  async recordFailure(component, error, metadata = {}) {
    const entry = {
      type: 'failure',
      component,
      error,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('failures', entry);
  }

  /**
   * Record a recovery in history
   */
  async recordRecovery(component, recoveryType, details = {}) {
    const entry = {
      type: 'recovery',
      component,
      recoveryType,
      details,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('recoveries', entry);
  }

  /**
   * Record a recommendation in history
   */
  async recordRecommendation(recommendation) {
    const entry = {
      type: 'recommendation',
      id: recommendation.id,
      component: recommendation.component,
      priority: recommendation.priority,
      title: recommendation.title,
      acknowledged: recommendation.acknowledged,
      implemented: recommendation.implemented,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('recommendations', entry);
  }

  /**
   * Record performance data in history
   */
  async recordPerformance(metric, value, metadata = {}) {
    const entry = {
      type: 'performance',
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('performance', entry);
  }

  /**
   * Record health data in history
   */
  async recordHealth(healthData) {
    const entry = {
      type: 'health',
      overallStatus: healthData.overallStatus,
      healthScore: healthData.healthScore,
      components: healthData.components,
      timestamp: new Date().toISOString()
    };

    this.addToHistory('health', entry);
  }

  /**
   * Add entry to history
   */
  addToHistory(type, entry) {
    if (!this.history.has(type)) {
      this.history.set(type, []);
    }

    const historyArray = this.history.get(type);
    historyArray.push(entry);

    // Keep only last 1000 entries per type
    if (historyArray.length > 1000) {
      this.history.set(type, historyArray.slice(-1000));
    }

    this.saveHistory();
  }

  /**
   * Get history for a specific type
   */
  getHistory(type, filters = {}) {
    const historyArray = this.history.get(type) || [];

    let filtered = historyArray;

    // Apply filters
    if (filters.component) {
      filtered = filtered.filter(entry => entry.component === filters.component);
    }
    if (filters.severity) {
      filtered = filtered.filter(entry => entry.severity === filters.severity);
    }
    if (filters.startDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
    }
    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }

  /**
   * Get all history types
   */
  getAllHistoryTypes() {
    return Array.from(this.history.keys());
  }

  /**
   * Get history statistics
   */
  getHistoryStatistics() {
    const stats = {};

    for (const [type, entries] of this.history.entries()) {
      stats[type] = {
        total: entries.length,
        lastEntry: entries[entries.length - 1]?.timestamp || null
      };
    }

    return stats;
  }

  /**
   * Get history summary for a time period
   */
  getHistorySummary(period = '24h') {
    const now = Date.now();
    const periodMs = this.parsePeriod(period);
    const cutoff = now - periodMs;

    const summary = {
      incidents: 0,
      warnings: 0,
      failures: 0,
      recoveries: 0,
      recommendations: 0
    };

    for (const [type, entries] of this.history.entries()) {
      const recentEntries = entries.filter(entry => 
        new Date(entry.timestamp).getTime() > cutoff
      );

      summary[type] = recentEntries.length;
    }

    return summary;
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
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours
    
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * units[unit];
  }

  /**
   * Cleanup old history data
   */
  async cleanupOldData(retentionDays) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [type, entries] of this.history.entries()) {
      const originalLength = entries.length;
      const filtered = entries.filter(entry => new Date(entry.timestamp).getTime() > cutoff);
      
      if (filtered.length !== originalLength) {
        this.history.set(type, filtered);
        removedCount += (originalLength - filtered.length);
      }
    }

    if (removedCount > 0) {
      await this.saveHistory();
      console.log(`[HistoryTracker] Cleaned up ${removedCount} old history entries`);
    }

    return removedCount;
  }

  /**
   * Export history for a type
   */
  exportHistory(type, format = 'json') {
    const historyArray = this.history.get(type) || [];

    if (format === 'json') {
      return JSON.stringify(historyArray, null, 2);
    } else if (format === 'csv') {
      if (historyArray.length === 0) return '';
      
      const headers = Object.keys(historyArray[0]);
      const rows = historyArray.map(entry => 
        headers.map(header => {
          const value = entry[header];
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        }).join(',')
      );
      
      return [headers.join(','), ...rows].join('\n');
    }

    throw new Error(`Unsupported format: ${format}`);
  }
}

// Singleton instance
const historyTracker = new HistoryTracker();

export default historyTracker;
export { HistoryTracker };
