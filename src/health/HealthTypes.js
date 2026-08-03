// Health Types and Constants
// Defines health states, report structure, and constants for the Health Engine

/**
 * Health States - Every component returns exactly one state
 */
export const HealthState = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown'
};

/**
 * Health Check Result Structure
 * Every component returns this structure
 */
export class HealthCheckResult {
  constructor({
    status = HealthState.UNKNOWN,
    reason = 'No reason provided',
    lastSuccessfulCheck = null,
    lastFailedCheck = null,
    responseTime = 0,
    latency = 0,
    version = null,
    healthScore = 0,
    recommendedAction = null,
    metadata = {}
  } = {}) {
    this.status = status;
    this.reason = reason;
    this.lastSuccessfulCheck = lastSuccessfulCheck;
    this.lastFailedCheck = lastFailedCheck;
    this.responseTime = responseTime; // in milliseconds
    this.latency = latency; // in milliseconds
    this.version = version;
    this.healthScore = healthScore; // 0-100
    this.recommendedAction = recommendedAction;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Check if the health check is healthy
   */
  isHealthy() {
    return this.status === HealthState.HEALTHY;
  }

  /**
   * Check if the health check has issues
   */
  hasIssues() {
    return [HealthState.WARNING, HealthState.CRITICAL, HealthState.OFFLINE].includes(this.status);
  }

  /**
   * Get severity level (0-5, higher is worse)
   */
  getSeverity() {
    const severityMap = {
      [HealthState.HEALTHY]: 0,
      [HealthState.WARNING]: 1,
      [HealthState.MAINTENANCE]: 2,
      [HealthState.UNKNOWN]: 3,
      [HealthState.CRITICAL]: 4,
      [HealthState.OFFLINE]: 5
    };
    return severityMap[this.status] || 3;
  }
}

/**
 * Health Check Configuration
 */
export class HealthCheckConfig {
  constructor({
    enabled = true,
    interval = 60000, // 1 minute in milliseconds
    timeout = 10000, // 10 seconds in milliseconds
    retries = 3,
    retryDelay = 1000, // 1 second in milliseconds
    alertThreshold = HealthState.WARNING,
    sensitivity = 'normal' // low, normal, high
  } = {}) {
    this.enabled = enabled;
    this.interval = interval;
    this.timeout = timeout;
    this.retries = retries;
    this.retryDelay = retryDelay;
    this.alertThreshold = alertThreshold;
    this.sensitivity = sensitivity;
  }
}

/**
 * Health History Entry
 */
export class HealthHistoryEntry {
  constructor({
    componentId,
    status,
    reason,
    duration = 0,
    latency = 0,
    timestamp = new Date().toISOString()
  } = {}) {
    this.componentId = componentId;
    this.status = status;
    this.reason = reason;
    this.duration = duration;
    this.latency = latency;
    this.timestamp = timestamp;
  }
}

/**
 * Health Alert
 */
export class HealthAlert {
  constructor({
    componentId,
    severity,
    message,
    timestamp = new Date().toISOString(),
    acknowledged = false,
    acknowledgedBy = null,
    acknowledgedAt = null
  } = {}) {
    this.componentId = componentId;
    this.severity = severity;
    this.message = message;
    this.timestamp = timestamp;
    this.acknowledged = acknowledged;
    this.acknowledgedBy = acknowledgedBy;
    this.acknowledgedAt = acknowledgedAt;
  }
}

/**
 * Component Health Report
 */
export class ComponentHealthReport {
  constructor({
    componentId,
    componentName,
    category,
    result,
    config,
    history = [],
    alerts = []
  } = {}) {
    this.componentId = componentId;
    this.componentName = componentName;
    this.category = category;
    this.result = result;
    this.config = config;
    this.history = history;
    this.alerts = alerts;
  }
}

/**
 * System Health Summary
 */
export class SystemHealthSummary {
  constructor({
    overallStatus = HealthState.UNKNOWN,
    totalComponents = 0,
    healthyComponents = 0,
    warningComponents = 0,
    criticalComponents = 0,
    offlineComponents = 0,
    maintenanceComponents = 0,
    unknownComponents = 0,
    averageHealthScore = 0,
    timestamp = new Date().toISOString()
  } = {}) {
    this.overallStatus = overallStatus;
    this.totalComponents = totalComponents;
    this.healthyComponents = healthyComponents;
    this.warningComponents = warningComponents;
    this.criticalComponents = criticalComponents;
    this.offlineComponents = offlineComponents;
    this.maintenanceComponents = maintenanceComponents;
    this.unknownComponents = unknownComponents;
    this.averageHealthScore = averageHealthScore;
    this.timestamp = timestamp;
  }

  /**
   * Calculate overall system health
   */
  static fromReports(reports) {
    const total = reports.length;
    if (total === 0) {
      return new SystemHealthSummary();
    }

    let healthy = 0, warning = 0, critical = 0, offline = 0, maintenance = 0, unknown = 0;
    let totalScore = 0;

    reports.forEach(report => {
      const status = report.result.status;
      const score = report.result.healthScore;

      switch (status) {
        case HealthState.HEALTHY: healthy++; break;
        case HealthState.WARNING: warning++; break;
        case HealthState.CRITICAL: critical++; break;
        case HealthState.OFFLINE: offline++; break;
        case HealthState.MAINTENANCE: maintenance++; break;
        case HealthState.UNKNOWN: unknown++; break;
      }

      totalScore += score;
    });

    // Determine overall status
    let overallStatus = HealthState.HEALTHY;
    if (critical > 0) {
      overallStatus = HealthState.CRITICAL;
    } else if (offline > 0) {
      overallStatus = HealthState.OFFLINE;
    } else if (warning > 0) {
      overallStatus = HealthState.WARNING;
    } else if (maintenance > 0) {
      overallStatus = HealthState.MAINTENANCE;
    } else if (unknown > 0) {
      overallStatus = HealthState.UNKNOWN;
    }

    return new SystemHealthSummary({
      overallStatus,
      totalComponents: total,
      healthyComponents: healthy,
      warningComponents: warning,
      criticalComponents: critical,
      offlineComponents: offline,
      maintenanceComponents: maintenance,
      unknownComponents: unknown,
      averageHealthScore: Math.round(totalScore / total)
    });
  }
}

/**
 * Component Categories
 */
export const ComponentCategory = {
  CLOUD: 'cloud',
  STORAGE: 'storage',
  SECURITY: 'security',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  BACKUP: 'backup',
  RESTORE: 'restore',
  SYNC: 'sync',
  IMPORT_EXPORT: 'import_export',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  PRINTING: 'printing',
  BUSINESS: 'business',
  OPERATIONS: 'operations'
};

/**
 * Default Health Check Intervals (in milliseconds)
 */
export const HealthCheckIntervals = {
  FAST: 30000,      // 30 seconds
  NORMAL: 60000,    // 1 minute
  SLOW: 300000,     // 5 minutes
  VERY_SLOW: 900000 // 15 minutes
};

/**
 * Default Health Check Timeouts (in milliseconds)
 */
export const HealthCheckTimeouts = {
  FAST: 5000,       // 5 seconds
  NORMAL: 10000,    // 10 seconds
  SLOW: 30000,      // 30 seconds
  VERY_SLOW: 60000  // 1 minute
};
