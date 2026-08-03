// Log Viewer
// Searchable operational log viewer

export class LogViewer {
  constructor() {
    this.logs = new Map();
    this.storageKey = 'cafeos_log_viewer';
    this.maxLogs = 5000;
    this.loadState();
  }

  /**
   * Log entry
   * @param {object} logData - Log data
   * @returns {object} Log result
   */
  log(logData) {
    const logId = this.generateLogId();
    
    const log = {
      logId,
      timestamp: new Date().toISOString(),
      level: logData.level || 'info',
      module: logData.module || 'system',
      message: logData.message || '',
      userId: logData.userId || null,
      tenantId: logData.tenantId || null,
      service: logData.service || null,
      action: logData.action || null,
      status: logData.status || 'success',
      metadata: logData.metadata || {}
    };

    this.logs.set(logId, log);
    this.trimLogs();
    this.saveState();

    return { success: true, logId, log };
  }

  /**
   * Get log by ID
   * @param {string} logId - Log ID
   * @returns {object|null} Log
   */
  getLog(logId) {
    return this.logs.get(logId) || null;
  }

  /**
   * Get all logs
   * @param {object} filters - Optional filters
   * @returns {Array} Logs
   */
  getLogs(filters = {}) {
    let logs = Array.from(this.logs.values());

    if (filters.level) {
      logs = logs.filter(l => l.level === filters.level);
    }

    if (filters.module) {
      logs = logs.filter(l => l.module === filters.module);
    }

    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }

    if (filters.tenantId) {
      logs = logs.filter(l => l.tenantId === filters.tenantId);
    }

    if (filters.service) {
      logs = logs.filter(l => l.service === filters.service);
    }

    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }

    if (filters.status) {
      logs = logs.filter(l => l.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      logs = logs.filter(l => 
        l.message.toLowerCase().includes(searchLower) ||
        l.module.toLowerCase().includes(searchLower) ||
        (l.service && l.service.toLowerCase().includes(searchLower))
      );
    }

    if (filters.since) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.since));
    }

    if (filters.until) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.until));
    }

    if (filters.limit) {
      logs = logs.slice(-filters.limit);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return logs;
  }

  /**
   * Search logs
   * @param {string} query - Search query
   * @param {object} filters - Optional filters
   * @returns {Array} Matching logs
   */
  searchLogs(query, filters = {}) {
    return this.getLogs({ ...filters, search: query });
  }

  /**
   * Export logs
   * @param {object} filters - Optional filters
   * @returns {object} Export result
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      count: logs.length,
      filters,
      logs
    };

    return {
      success: true,
      data: exportData,
      format: 'json'
    };
  }

  /**
   * Get log statistics
   * @returns {object} Statistics
   */
  getLogStatistics() {
    const logs = Array.from(this.logs.values());
    const total = logs.length;

    const byLevel = {};
    logs.forEach(l => {
      byLevel[l.level] = (byLevel[l.level] || 0) + 1;
    });

    const byModule = {};
    logs.forEach(l => {
      byModule[l.module] = (byModule[l.module] || 0) + 1;
    });

    const byService = {};
    logs.forEach(l => {
      if (l.service) {
        byService[l.service] = (byService[l.service] || 0) + 1;
      }
    });

    const byStatus = {};
    logs.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });

    return {
      total,
      byLevel,
      byModule,
      byService,
      byStatus
    };
  }

  /**
   * Get logs by level
   * @param {string} level - Log level
   * @returns {Array} Logs
   */
  getLogsByLevel(level) {
    return this.getLogs({ level });
  }

  /**
   * Get logs by module
   * @param {string} module - Module
   * @returns {Array} Logs
   */
  getLogsByModule(module) {
    return this.getLogs({ module });
  }

  /**
   * Get error logs
   * @returns {Array} Error logs
   */
  getErrorLogs() {
    return this.getLogs({ level: 'error' });
  }

  /**
   * Delete log
   * @param {string} logId - Log ID
   * @returns {object} Delete result
   */
  deleteLog(logId) {
    const deleted = this.logs.delete(logId);
    this.saveState();
    return { success: deleted, logId };
  }

  /**
   * Clear old logs
   * @param {number} daysToKeep - Days to keep
   * @returns {object} Clear result
   */
  clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let cleared = 0;
    
    this.logs.forEach((log, logId) => {
      if (new Date(log.timestamp) < cutoffDate) {
        this.logs.delete(logId);
        cleared++;
      }
    });

    this.saveState();
    return { success: true, cleared };
  }

  /**
   * Trim logs to max size
   */
  trimLogs() {
    while (this.logs.size > this.maxLogs) {
      const firstKey = this.logs.keys().next().value;
      this.logs.delete(firstKey);
    }
  }

  /**
   * Generate log ID
   * @returns {string} Log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        logs: Array.from(this.logs.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save log viewer state:', error);
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
        this.logs = new Map(parsed.logs || []);
      }
    } catch (error) {
      console.error('Failed to load log viewer state:', error);
      this.logs = new Map();
    }
  }

  /**
   * Destroy the log viewer
   */
  destroy() {
    this.logs.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[LogViewer] Destroyed');
  }
}

// Singleton instance
let logViewerInstance = null;

/**
 * Get the singleton log viewer instance
 * @returns {LogViewer} Log viewer instance
 */
export function getLogViewer() {
  if (!logViewerInstance) {
    logViewerInstance = new LogViewer();
  }
  return logViewerInstance;
}

export default LogViewer;
