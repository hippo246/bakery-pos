// Diagnostics Generator
// Generates diagnostics reports for support investigations

import { getSystemHealthMonitor } from './SystemHealthMonitor.js';
import { getLiveMetricsCollector } from './LiveMetricsCollector.js';
import { getServiceStatusTracker } from './ServiceStatusTracker.js';
import { getErrorCenter } from './ErrorCenter.js';
import { getAlertCenter } from './AlertCenter.js';
import { getLogViewer } from './LogViewer.js';
import { getPerformanceDashboard } from './PerformanceDashboard.js';

export class DiagnosticsGenerator {
  constructor() {
    this.healthMonitor = getSystemHealthMonitor();
    this.metricsCollector = getLiveMetricsCollector();
    this.serviceTracker = getServiceStatusTracker();
    this.errorCenter = getErrorCenter();
    this.alertCenter = getAlertCenter();
    this.logViewer = getLogViewer();
    this.performanceDashboard = getPerformanceDashboard();
  }

  /**
   * Generate full diagnostics report
   * @returns {object} Diagnostics report
   */
  generateDiagnosticsReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      reportId: this.generateReportId(),
      application: this.getApplicationDiagnostics(),
      browser: this.getBrowserDiagnostics(),
      storage: this.getStorageDiagnostics(),
      database: this.getDatabaseDiagnostics(),
      cloud: this.getCloudDiagnostics(),
      synchronization: this.getSynchronizationDiagnostics(),
      permissions: this.getPermissionsDiagnostics(),
      security: this.getSecurityDiagnostics(),
      performance: this.getPerformanceDiagnostics(),
      errors: this.getErrorDiagnostics(),
      alerts: this.getAlertDiagnostics(),
      logs: this.getLogDiagnostics()
    };

    return report;
  }

  /**
   * Get application diagnostics
   * @returns {object} Application diagnostics
   */
  getApplicationDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('application'),
      serviceStatus: this.serviceTracker.getServiceStatus('application'),
      uptime: this.getApplicationUptime(),
      version: this.getApplicationVersion(),
      environment: this.getEnvironment()
    };
  }

  /**
   * Get browser diagnostics
   * @returns {object} Browser diagnostics
   */
  getBrowserDiagnostics() {
    if (typeof navigator === 'undefined') {
      return { status: 'not_available' };
    }

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Get storage diagnostics
   * @returns {object} Storage diagnostics
   */
  getStorageDiagnostics() {
    const storageDiagnostics = {
      localStorage: this.getStorageInfo('localStorage'),
      sessionStorage: this.getStorageInfo('sessionStorage'),
      indexedDB: this.getIndexedDBInfo(),
      storageUsage: this.metricsCollector.getMetric('storage_usage')
    };

    return storageDiagnostics;
  }

  /**
   * Get storage info
   * @param {string} type - Storage type
   * @returns {object} Storage info
   */
  getStorageInfo(type) {
    try {
      const storage = type === 'localStorage' ? localStorage : sessionStorage;
      const keys = Object.keys(storage);
      let totalSize = 0;

      keys.forEach(key => {
        totalSize += storage[key].length;
      });

      return {
        available: true,
        keysCount: keys.length,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2)
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get IndexedDB info
   * @returns {object} IndexedDB info
   */
  getIndexedDBInfo() {
    // Placeholder for IndexedDB diagnostics
    return {
      available: true,
      databases: []
    };
  }

  /**
   * Get database diagnostics
   * @returns {object} Database diagnostics
   */
  getDatabaseDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('database'),
      serviceStatus: this.serviceTracker.getServiceStatus('database'),
      responseTime: this.metricsCollector.getMetric('database_response_time'),
      queryTime: this.performanceDashboard.getMetricHistory('database_query_time')
    };
  }

  /**
   * Get cloud diagnostics
   * @returns {object} Cloud diagnostics
   */
  getCloudDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('cloud_provider'),
      serviceStatus: this.serviceTracker.getServiceStatus('cloud_provider'),
      uploadSpeed: this.metricsCollector.getMetric('upload_speed'),
      downloadSpeed: this.metricsCollector.getMetric('download_speed'),
      storageLatency: this.performanceDashboard.getMetricHistory('storage_latency')
    };
  }

  /**
   * Get synchronization diagnostics
   * @returns {object} Synchronization diagnostics
   */
  getSynchronizationDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('synchronization_engine'),
      serviceStatus: this.serviceTracker.getServiceStatus('synchronization_engine'),
      queueSize: this.metricsCollector.getMetric('sync_queue_size'),
      lastSync: this.getLastSyncTime()
    };
  }

  /**
   * Get permissions diagnostics
   * @returns {object} Permissions diagnostics
   */
  getPermissionsDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('permissions'),
      serviceStatus: this.serviceTracker.getServiceStatus('permissions'),
      permissionCount: this.getPermissionCount()
    };
  }

  /**
   * Get security diagnostics
   * @returns {object} Security diagnostics
   */
  getSecurityDiagnostics() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth('authentication'),
      serviceStatus: this.serviceTracker.getServiceStatus('authentication'),
      securityScore: this.getSecurityScore(),
      activeSessions: this.getActiveSessionCount()
    };
  }

  /**
   * Get performance diagnostics
   * @returns {object} Performance diagnostics
   */
  getPerformanceDiagnostics() {
    return {
      overallScore: this.performanceDashboard.getOverallPerformanceScore(),
      apiPerformance: this.performanceDashboard.getAPIPerformance(),
      databasePerformance: this.performanceDashboard.getDatabasePerformance(),
      storagePerformance: this.performanceDashboard.getStoragePerformance(),
      networkPerformance: this.performanceDashboard.getNetworkPerformance(),
      businessPerformance: this.performanceDashboard.getBusinessPerformance(),
      queuePerformance: this.performanceDashboard.getQueuePerformance()
    };
  }

  /**
   * Get error diagnostics
   * @returns {object} Error diagnostics
   */
  getErrorDiagnostics() {
    const recentErrors = this.errorCenter.getErrors({ limit: 50 });
    const errorStats = this.errorCenter.getErrorStatistics();

    return {
      totalErrors: errorStats.total,
      byCategory: errorStats.byCategory,
      bySeverity: errorStats.bySeverity,
      resolutionRate: errorStats.resolutionRate,
      recentErrors: recentErrors.slice(0, 10)
    };
  }

  /**
   * Get alert diagnostics
   * @returns {object} Alert diagnostics
   */
  getAlertDiagnostics() {
    const activeAlerts = this.alertCenter.getActiveAlerts();
    const alertStats = this.alertCenter.getAlertStatistics();

    return {
      totalAlerts: alertStats.total,
      active: alertStats.active,
      critical: this.alertCenter.getCriticalAlerts().length,
      emergency: this.alertCenter.getEmergencyAlerts().length,
      recentAlerts: activeAlerts.slice(0, 10)
    };
  }

  /**
   * Get log diagnostics
   * @returns {object} Log diagnostics
   */
  getLogDiagnostics() {
    const recentLogs = this.logViewer.getLogs({ limit: 100 });
    const logStats = this.logViewer.getLogStatistics();

    return {
      totalLogs: logStats.total,
      byLevel: logStats.byLevel,
      byModule: logStats.byModule,
      recentLogs: recentLogs.slice(0, 10)
    };
  }

  /**
   * Get application uptime
   * @returns {number} Uptime in milliseconds
   */
  getApplicationUptime() {
    if (typeof performance === 'undefined' || !performance.timing) {
      return 0;
    }

    return Date.now() - performance.timing.navigationStart;
  }

  /**
   * Get application version
   * @returns {string} Version
   */
  getApplicationVersion() {
    // Placeholder for version detection
    return '1.0.0';
  }

  /**
   * Get environment
   * @returns {string} Environment
   */
  getEnvironment() {
    // Placeholder for environment detection
    return 'production';
  }

  /**
   * Get last sync time
   * @returns {string} Last sync timestamp
   */
  getLastSyncTime() {
    // Placeholder for last sync time
    return new Date().toISOString();
  }

  /**
   * Get permission count
   * @returns {number} Permission count
   */
  getPermissionCount() {
    // Placeholder for permission count
    return 0;
  }

  /**
   * Get security score
   * @returns {number} Security score
   */
  getSecurityScore() {
    // Placeholder for security score
    return 85;
  }

  /**
   * Get active session count
   * @returns {number} Active session count
   */
  getActiveSessionCount() {
    // Placeholder for session count
    return 1;
  }

  /**
   * Generate report ID
   * @returns {string} Report ID
   */
  generateReportId() {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export diagnostics report
   * @param {object} report - Diagnostics report
   * @returns {object} Export result
   */
  exportReport(report) {
    return {
      success: true,
      data: report,
      format: 'json',
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Destroy the diagnostics generator
   */
  destroy() {
    console.log('[DiagnosticsGenerator] Destroyed');
  }
}

// Singleton instance
let diagnosticsGeneratorInstance = null;

/**
 * Get the singleton diagnostics generator instance
 * @returns {DiagnosticsGenerator} Diagnostics generator instance
 */
export function getDiagnosticsGenerator() {
  if (!diagnosticsGeneratorInstance) {
    diagnosticsGeneratorInstance = new DiagnosticsGenerator();
  }
  return diagnosticsGeneratorInstance;
}

export default DiagnosticsGenerator;
