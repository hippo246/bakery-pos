// Storage Metrics System
// Tracks and reports storage operation metrics

/**
 * Storage Metrics
 * Tracks performance and usage metrics
 */
class StorageMetrics {
  constructor() {
    this.initialized = false;
    this.metrics = {
      uploads: { count: 0, totalBytes: 0, totalTime: 0, failures: 0 },
      downloads: { count: 0, totalBytes: 0, totalTime: 0, failures: 0 },
      deletes: { count: 0, totalTime: 0, failures: 0 },
      operations: { count: 0, failures: 0 },
      providerAvailability: new Map(),
      storageUsage: new Map()
    };
    this.operationHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Initialize metrics system
   */
  async initialize() {
    if (this.initialized) return;
    this.loadMetrics();
    this.initialized = true;
  }

  /**
   * Record upload operation
   * @param {number} bytes 
   * @param {number} duration 
   * @param {boolean} success 
   * @param {string} providerId 
   */
  recordUpload(bytes, duration, success, providerId) {
    this.metrics.uploads.count++;
    this.metrics.uploads.totalBytes += bytes;
    this.metrics.uploads.totalTime += duration;
    if (!success) this.metrics.uploads.failures++;

    this.recordOperation('upload', bytes, duration, success, providerId);
  }

  /**
   * Record download operation
   * @param {number} bytes 
   * @param {number} duration 
   * @param {boolean} success 
   * @param {string} providerId 
   */
  recordDownload(bytes, duration, success, providerId) {
    this.metrics.downloads.count++;
    this.metrics.downloads.totalBytes += bytes;
    this.metrics.downloads.totalTime += duration;
    if (!success) this.metrics.downloads.failures++;

    this.recordOperation('download', bytes, duration, success, providerId);
  }

  /**
   * Record delete operation
   * @param {number} duration 
   * @param {boolean} success 
   * @param {string} providerId 
   */
  recordDelete(duration, success, providerId) {
    this.metrics.deletes.count++;
    this.metrics.deletes.totalTime += duration;
    if (!success) this.metrics.deletes.failures++;

    this.recordOperation('delete', 0, duration, success, providerId);
  }

  /**
   * Record generic operation
   * @param {string} operation 
   * @param {number} bytes 
   * @param {number} duration 
   * @param {boolean} success 
   * @param {string} providerId 
   */
  recordOperation(operation, bytes, duration, success, providerId) {
    this.metrics.operations.count++;
    if (!success) this.metrics.operations.failures++;

    const record = {
      operation,
      bytes,
      duration,
      success,
      providerId,
      timestamp: new Date().toISOString()
    };

    this.operationHistory.push(record);

    // Limit history size
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift();
    }

    // Update provider availability
    if (!this.metrics.providerAvailability.has(providerId)) {
      this.metrics.providerAvailability.set(providerId, {
        total: 0,
        successful: 0,
        failed: 0
      });
    }

    const providerMetrics = this.metrics.providerAvailability.get(providerId);
    providerMetrics.total++;
    if (success) {
      providerMetrics.successful++;
    } else {
      providerMetrics.failed++;
    }

    this.saveMetrics();
  }

  /**
   * Record storage usage
   * @param {string} providerId 
   * @param {number} usedBytes 
   * @param {number} totalBytes 
   */
  recordStorageUsage(providerId, usedBytes, totalBytes) {
    this.metrics.storageUsage.set(providerId, {
      usedBytes,
      totalBytes,
      timestamp: new Date().toISOString()
    });

    this.saveMetrics();
  }

  /**
   * Get upload metrics
   * @returns {object}
   */
  getUploadMetrics() {
    const { uploads } = this.metrics;
    return {
      count: uploads.count,
      totalBytes: uploads.totalBytes,
      averageSize: uploads.count > 0 ? uploads.totalBytes / uploads.count : 0,
      averageTime: uploads.count > 0 ? uploads.totalTime / uploads.count : 0,
      failureRate: uploads.count > 0 ? (uploads.failures / uploads.count) * 100 : 0,
      failures: uploads.failures
    };
  }

  /**
   * Get download metrics
   * @returns {object}
   */
  getDownloadMetrics() {
    const { downloads } = this.metrics;
    return {
      count: downloads.count,
      totalBytes: downloads.totalBytes,
      averageSize: downloads.count > 0 ? downloads.totalBytes / downloads.count : 0,
      averageTime: downloads.count > 0 ? downloads.totalTime / downloads.count : 0,
      failureRate: downloads.count > 0 ? (downloads.failures / downloads.count) * 100 : 0,
      failures: downloads.failures
    };
  }

  /**
   * Get delete metrics
   * @returns {object}
   */
  getDeleteMetrics() {
    const { deletes } = this.metrics;
    return {
      count: deletes.count,
      averageTime: deletes.count > 0 ? deletes.totalTime / deletes.count : 0,
      failureRate: deletes.count > 0 ? (deletes.failures / deletes.count) * 100 : 0,
      failures: deletes.failures
    };
  }

  /**
   * Get overall metrics
   * @returns {object}
   */
  getOverallMetrics() {
    const { operations } = this.metrics;
    return {
      totalOperations: operations.count,
      totalFailures: operations.failures,
      overallFailureRate: operations.count > 0 ? (operations.failures / operations.count) * 100 : 0,
      successRate: operations.count > 0 ? ((operations.count - operations.failures) / operations.count) * 100 : 0
    };
  }

  /**
   * Get provider availability
   * @param {string} providerId 
   * @returns {object|null}
   */
  getProviderAvailability(providerId) {
    const metrics = this.metrics.providerAvailability.get(providerId);
    if (!metrics) return null;

    return {
      total: metrics.total,
      successful: metrics.successful,
      failed: metrics.failed,
      availability: metrics.total > 0 ? (metrics.successful / metrics.total) * 100 : 0
    };
  }

  /**
   * Get all provider availability
   * @returns {object}
   */
  getAllProviderAvailability() {
    const result = {};
    for (const [providerId, metrics] of this.metrics.providerAvailability.entries()) {
      result[providerId] = {
        total: metrics.total,
        successful: metrics.successful,
        failed: metrics.failed,
        availability: metrics.total > 0 ? (metrics.successful / metrics.total) * 100 : 0
      };
    }
    return result;
  }

  /**
   * Get storage usage
   * @param {string} providerId 
   * @returns {object|null}
   */
  getStorageUsage(providerId) {
    return this.metrics.storageUsage.get(providerId) || null;
  }

  /**
   * Get all storage usage
   * @returns {object}
   */
  getAllStorageUsage() {
    const result = {};
    for (const [providerId, usage] of this.metrics.storageUsage.entries()) {
      result[providerId] = usage;
    }
    return result;
  }

  /**
   * Get operation history
   * @param {object} options 
   * @returns {Array}
   */
  getOperationHistory(options = {}) {
    let history = this.operationHistory;

    if (options.operation) {
      history = history.filter(r => r.operation === options.operation);
    }

    if (options.providerId) {
      history = history.filter(r => r.providerId === options.providerId);
    }

    if (options.success !== undefined) {
      history = history.filter(r => r.success === options.success);
    }

    if (options.since) {
      const since = new Date(options.since);
      history = history.filter(r => new Date(r.timestamp) >= since);
    }

    if (options.until) {
      const until = new Date(options.until);
      history = history.filter(r => new Date(r.timestamp) <= until);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Reset metrics
   * @param {string} providerId 
   */
  resetMetrics(providerId) {
    if (providerId) {
      this.metrics.providerAvailability.delete(providerId);
      this.metrics.storageUsage.delete(providerId);
    } else {
      this.metrics = {
        uploads: { count: 0, totalBytes: 0, totalTime: 0, failures: 0 },
        downloads: { count: 0, totalBytes: 0, totalTime: 0, failures: 0 },
        deletes: { count: 0, totalTime: 0, failures: 0 },
        operations: { count: 0, failures: 0 },
        providerAvailability: new Map(),
        storageUsage: new Map()
      };
      this.operationHistory = [];
    }

    this.saveMetrics();
  }

  /**
   * Save metrics to localStorage
   */
  saveMetrics() {
    try {
      const data = {
        metrics: {
          uploads: this.metrics.uploads,
          downloads: this.metrics.downloads,
          deletes: this.metrics.deletes,
          operations: this.metrics.operations,
          providerAvailability: Array.from(this.metrics.providerAvailability.entries()),
          storageUsage: Array.from(this.metrics.storageUsage.entries())
        },
        operationHistory: this.operationHistory.slice(-100) // Keep last 100
      };
      localStorage.setItem('cafeos_storage_metrics', JSON.stringify(data));
    } catch (error) {
      console.error('[StorageMetrics] Failed to save metrics:', error);
    }
  }

  /**
   * Load metrics from localStorage
   */
  loadMetrics() {
    try {
      const data = localStorage.getItem('cafeos_storage_metrics');
      if (data) {
        const parsed = JSON.parse(data);
        this.metrics.uploads = parsed.metrics.uploads || this.metrics.uploads;
        this.metrics.downloads = parsed.metrics.downloads || this.metrics.downloads;
        this.metrics.deletes = parsed.metrics.deletes || this.metrics.deletes;
        this.metrics.operations = parsed.metrics.operations || this.metrics.operations;
        this.metrics.providerAvailability = new Map(parsed.metrics.providerAvailability || []);
        this.metrics.storageUsage = new Map(parsed.metrics.storageUsage || []);
        this.operationHistory = parsed.operationHistory || [];
      }
    } catch (error) {
      console.error('[StorageMetrics] Failed to load metrics:', error);
    }
  }

  /**
   * Format bytes for display
   * @param {number} bytes 
   * @returns {string}
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format duration for display
   * @param {number} milliseconds 
   * @returns {string}
   */
  formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }
}

// Singleton instance
const storageMetrics = new StorageMetrics();

export default storageMetrics;
