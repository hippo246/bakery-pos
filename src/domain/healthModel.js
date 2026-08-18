// Health Monitoring Domain Model for CafeOS
// Defines health metrics, alerts, and maintenance operations

// Health status levels
export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

// Health categories
export const HEALTH_CATEGORIES = {
  STORAGE: 'STORAGE',
  DATABASE: 'DATABASE',
  DEVICE: 'DEVICE',
  PERFORMANCE: 'PERFORMANCE',
  BACKUP: 'BACKUP',
  NETWORK: 'NETWORK',
  CONFIGURATION: 'CONFIGURATION',
  SECURITY: 'SECURITY'
};

// Alert types
export const ALERT_TYPES = {
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_WARNING: 'STORAGE_WARNING',
  DATABASE_CORRUPTION: 'DATABASE_CORRUPTION',
  DATABASE_PERFORMANCE: 'DATABASE_PERFORMANCE',
  PRINTER_OFFLINE: 'PRINTER_OFFLINE',
  DEVICE_DISCONNECTED: 'DEVICE_DISCONNECTED',
  NO_BACKUP: 'NO_BACKUP',
  MEMORY_PRESSURE: 'MEMORY_PRESSURE',
  LARGE_LOGS: 'LARGE_LOGS',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NETWORK_DISCONNECTED: 'NETWORK_DISCONNECTED',
  CACHE_OVERFLOW: 'CACHE_OVERFLOW',
  INDEX_CORRUPTION: 'INDEX_CORRUPTION'
};

// Device types
export const DEVICE_TYPES = {
  RECEIPT_PRINTER: 'RECEIPT_PRINTER',
  KITCHEN_DISPLAY: 'KITCHEN_DISPLAY',
  CUSTOMER_DISPLAY: 'CUSTOMER_DISPLAY',
  BARCODE_SCANNER: 'BARCODE_SCANNER',
  CASH_DRAWER: 'CASH_DRAWER',
  NETWORK: 'NETWORK',
  PAYMENT_TERMINAL: 'PAYMENT_TERMINAL'
};

// Maintenance operation types
export const MAINTENANCE_OPERATIONS = {
  HEALTH_CHECK: 'HEALTH_CHECK',
  OPTIMIZE_DATABASE: 'OPTIMIZE_DATABASE',
  CLEAR_CACHE: 'CLEAR_CACHE',
  CLEAN_TEMP_FILES: 'CLEAN_TEMP_FILES',
  REBUILD_INDEX: 'REBUILD_INDEX',
  VERIFY_CONFIG: 'VERIFY_CONFIG',
  EXPORT_DIAGNOSTICS: 'EXPORT_DIAGNOSTICS',
  GENERATE_REPORT: 'GENERATE_REPORT',
  RUN_INTEGRITY_CHECK: 'RUN_INTEGRITY_CHECK',
  COMPACT_DATABASE: 'COMPACT_DATABASE'
};

// Log levels
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  MAINTENANCE: 'MAINTENANCE'
};

/**
 * Create a health metric
 */
export function createHealthMetric(data) {
  return {
    id: `HEALTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: data.category,
    status: data.status || HEALTH_STATUS.UNKNOWN,
    value: data.value,
    unit: data.unit,
    threshold: data.threshold,
    warningThreshold: data.warningThreshold,
    criticalThreshold: data.criticalThreshold,
    lastChecked: new Date().toISOString(),
    history: data.history || [],
    metadata: data.metadata || {}
  };
}

/**
 * Create a health alert
 */
export function createHealthAlert(data) {
  return {
    id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    category: data.category,
    severity: data.severity || HEALTH_STATUS.WARNING,
    title: data.title,
    description: data.description,
    impact: data.impact,
    suggestedAction: data.suggestedAction,
    actionTarget: data.actionTarget,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolved: false,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    metadata: data.metadata || {}
  };
}

/**
 * Create a device status
 */
export function createDeviceStatus(data) {
  return {
    id: data.id,
    type: data.type,
    name: data.name,
    status: data.status || 'UNKNOWN',
    connected: data.connected || false,
    lastSeen: data.lastSeen || new Date().toISOString(),
    metadata: data.metadata || {},
    healthHistory: data.healthHistory || []
  };
}

/**
 * Create a maintenance log entry
 */
export function createMaintenanceLog(data) {
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operation: data.operation,
    initiatedBy: data.initiatedBy,
    status: data.status || 'PENDING',
    startedAt: data.startedAt || new Date().toISOString(),
    completedAt: data.completedAt || null,
    duration: data.duration || null,
    result: data.result || null,
    error: data.error || null,
    metadata: data.metadata || {}
  };
}

/**
 * Create a system health report
 */
export function createSystemHealthReport(data) {
  return {
    id: `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy,
    overallScore: data.overallScore,
    overallStatus: data.overallStatus,
    metrics: data.metrics || [],
    alerts: data.alerts || [],
    devices: data.devices || [],
    recommendations: data.recommendations || [],
    metadata: data.metadata || {}
  };
}

/**
 * Calculate health score from metrics
 */
export function calculateHealthScore(metrics) {
  if (!metrics || metrics.length === 0) return 100;

  let totalScore = 0;
  let weightedCount = 0;

  metrics.forEach(metric => {
    const weight = getMetricWeight(metric.category);
    let score = 100;

    if (metric.status === HEALTH_STATUS.CRITICAL) {
      score = 0;
    } else if (metric.status === HEALTH_STATUS.WARNING) {
      score = 50;
    } else if (metric.status === HEALTH_STATUS.UNKNOWN) {
      score = 75;
    }

    totalScore += score * weight;
    weightedCount += weight;
  });

  return weightedCount > 0 ? Math.round(totalScore / weightedCount) : 100;
}

/**
 * Get metric weight for health score calculation
 */
function getMetricWeight(category) {
  const weights = {
    [HEALTH_CATEGORIES.STORAGE]: 1.5,
    [HEALTH_CATEGORIES.DATABASE]: 2.0,
    [HEALTH_CATEGORIES.DEVICE]: 1.0,
    [HEALTH_CATEGORIES.PERFORMANCE]: 1.2,
    [HEALTH_CATEGORIES.BACKUP]: 1.8,
    [HEALTH_CATEGORIES.NETWORK]: 1.0,
    [HEALTH_CATEGORIES.CONFIGURATION]: 1.0,
    [HEALTH_CATEGORIES.SECURITY]: 1.5
  };
  return weights[category] || 1.0;
}

/**
 * Determine overall health status from score
 */
export function getOverallHealthStatus(score) {
  if (score >= 90) return HEALTH_STATUS.HEALTHY;
  if (score >= 70) return HEALTH_STATUS.WARNING;
  return HEALTH_STATUS.CRITICAL;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))  } ${  sizes[i]}`;
}

/**
 * Format duration in human readable
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get health status color
 */
export function getHealthStatusColor(status) {
  switch (status) {
    case HEALTH_STATUS.HEALTHY:
      return '#27ae60';
    case HEALTH_STATUS.WARNING:
      return '#f39c12';
    case HEALTH_STATUS.CRITICAL:
      return '#e74c3c';
    case HEALTH_STATUS.UNKNOWN:
      return '#95a5a6';
    default:
      return '#95a5a6';
  }
}

/**
 * Get health status emoji
 */
export function getHealthStatusEmoji(status) {
  switch (status) {
    case HEALTH_STATUS.HEALTHY:
      return '🟢';
    case HEALTH_STATUS.WARNING:
      return '🟡';
    case HEALTH_STATUS.CRITICAL:
      return '🔴';
    case HEALTH_STATUS.UNKNOWN:
      return '⚪';
    default:
      return '⚪';
  }
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alert, userId) {
  return {
    ...alert,
    acknowledged: true,
    acknowledgedBy: userId,
    acknowledgedAt: new Date().toISOString()
  };
}

/**
 * Resolve an alert
 */
export function resolveAlert(alert) {
  return {
    ...alert,
    resolved: true,
    resolvedAt: new Date().toISOString()
  };
}

/**
 * Normalize health metric
 */
export function normalizeHealthMetric(metric) {
  return {
    ...metric,
    id: metric.id || `HEALTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lastChecked: metric.lastChecked || new Date().toISOString(),
    history: metric.history || []
  };
}

/**
 * Filter alerts by severity
 */
export function filterAlertsBySeverity(alerts, severity) {
  return alerts.filter(alert => alert.severity === severity);
}

/**
 * Filter alerts by category
 */
export function filterAlertsByCategory(alerts, category) {
  return alerts.filter(alert => alert.category === category);
}

/**
 * Get active alerts (not resolved)
 */
export function getActiveAlerts(alerts) {
  return alerts.filter(alert => !alert.resolved);
}

/**
 * Get unacknowledged alerts
 */
export function getUnacknowledgedAlerts(alerts) {
  return alerts.filter(alert => !alert.acknowledged && !alert.resolved);
}

/**
 * Get critical alerts
 */
export function getCriticalAlerts(alerts) {
  return alerts.filter(alert => alert.severity === HEALTH_STATUS.CRITICAL && !alert.resolved);
}

export default {
  HEALTH_STATUS,
  HEALTH_CATEGORIES,
  ALERT_TYPES,
  DEVICE_TYPES,
  MAINTENANCE_OPERATIONS,
  LOG_LEVELS,
  createHealthMetric,
  createHealthAlert,
  createDeviceStatus,
  createMaintenanceLog,
  createSystemHealthReport,
  calculateHealthScore,
  getOverallHealthStatus,
  formatBytes,
  formatDuration,
  getHealthStatusColor,
  getHealthStatusEmoji,
  acknowledgeAlert,
  resolveAlert,
  normalizeHealthMetric,
  filterAlertsBySeverity,
  filterAlertsByCategory,
  getActiveAlerts,
  getUnacknowledgedAlerts,
  getCriticalAlerts
};
