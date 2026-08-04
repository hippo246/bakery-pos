// Diagnostics Types
// Core type definitions for the Diagnostics Engine

/**
 * Incident Severity Levels
 */
export const IncidentSeverity = {
  INFORMATION: 'information',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
};

/**
 * Incident Status
 */
export const IncidentStatus = {
  DETECTED: 'detected',
  ACKNOWLEDGED: 'acknowledged',
  INVESTIGATING: 'investigating',
  RESOLVING: 'resolving',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

/**
 * Incident Priority
 */
export const IncidentPriority = {
  P1: 'p1', // Emergency - Immediate action required
  P2: 'p2', // Critical - Action within 1 hour
  P3: 'p3', // High - Action within 4 hours
  P4: 'p4', // Medium - Action within 24 hours
  P5: 'p5'  // Low - Action within 7 days
};

/**
 * Root Cause Categories
 */
export const RootCauseCategory = {
  CONFIGURATION: 'configuration',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  CREDENTIALS: 'credentials',
  CAPACITY: 'capacity',
  PERFORMANCE: 'performance',
  DEPENDENCY: 'dependency',
  CODE: 'code',
  EXTERNAL: 'external',
  UNKNOWN: 'unknown'
};

/**
 * Performance Metrics
 */
export const PerformanceMetric = {
  API_RESPONSE_TIME: 'api_response_time',
  DATABASE_RESPONSE_TIME: 'database_response_time',
  STORAGE_LATENCY: 'storage_latency',
  UPLOAD_TIME: 'upload_time',
  DOWNLOAD_TIME: 'download_time',
  BACKUP_DURATION: 'backup_duration',
  RESTORE_DURATION: 'restore_duration',
  SYNC_TIME: 'sync_time',
  IMPORT_DURATION: 'import_duration',
  EXPORT_DURATION: 'export_duration',
  ORDER_PROCESSING_TIME: 'order_processing_time',
  KITCHEN_TICKET_TIME: 'kitchen_ticket_time',
  PAYMENT_PROCESSING_TIME: 'payment_processing_time'
};

/**
 * Trend Periods
 */
export const TrendPeriod = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

/**
 * Prediction Types
 */
export const PredictionType = {
  STORAGE_CAPACITY: 'storage_capacity',
  CREDENTIAL_EXPIRATION: 'credential_expiration',
  BACKUP_OVERDUE: 'backup_overdue',
  HIGH_FAILURE_RATE: 'high_failure_rate',
  INCREASING_LATENCY: 'increasing_latency',
  GROWING_QUEUE: 'growing_queue',
  SLOW_DATABASE: 'slow_database',
  REPEATED_AUTH_FAILURES: 'repeated_auth_failures'
};

/**
 * System Score Categories
 */
export const SystemScoreCategory = {
  CLOUD: 'cloud',
  DATABASE: 'database',
  STORAGE: 'storage',
  SECURITY: 'security',
  BACKUPS: 'backups',
  SYNCHRONIZATION: 'synchronization',
  PERFORMANCE: 'performance',
  RELIABILITY: 'reliability',
  OVERALL_HEALTH: 'overall_health'
};

/**
 * Recommendation Priority
 */
export const RecommendationPriority = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFORMATIONAL: 'informational'
};

/**
 * Notification Types
 */
export const NotificationType = {
  CRITICAL: 'critical',
  HIGH: 'high',
  RECOVERY_COMPLETE: 'recovery_complete',
  ISSUE_RESOLVED: 'issue_resolved',
  REPEATED_FAILURE: 'repeated_failure',
  PREDICTION_WARNING: 'prediction_warning'
};

/**
 * Incident Class
 */
export class Incident {
  constructor({
    id,
    severity = IncidentSeverity.LOW,
    component,
    status = IncidentStatus.DETECTED,
    started,
    resolved = null,
    affectedServices = [],
    rootCause = null,
    recommendedAction = null,
    owner = null,
    resolutionNotes = null,
    metadata = {}
  }) {
    this.id = id || this.generateId();
    this.severity = severity;
    this.component = component;
    this.status = status;
    this.started = started || new Date().toISOString();
    this.resolved = resolved;
    this.affectedServices = affectedServices;
    this.rootCause = rootCause;
    this.recommendedAction = recommendedAction;
    this.owner = owner;
    this.resolutionNotes = resolutionNotes;
    this.metadata = metadata;
    this.priority = this.calculatePriority();
  }

  generateId() {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  calculatePriority() {
    switch (this.severity) {
      case IncidentSeverity.EMERGENCY:
        return IncidentPriority.P1;
      case IncidentSeverity.CRITICAL:
        return IncidentPriority.P2;
      case IncidentSeverity.HIGH:
        return IncidentPriority.P3;
      case IncidentSeverity.MEDIUM:
        return IncidentPriority.P4;
      case IncidentSeverity.LOW:
      case IncidentSeverity.INFORMATION:
        return IncidentPriority.P5;
      default:
        return IncidentPriority.P5;
    }
  }

  getDuration() {
    if (!this.resolved) return null;
    const start = new Date(this.started).getTime();
    const end = new Date(this.resolved).getTime();
    return end - start;
  }
}

/**
 * Root Cause Analysis Result
 */
export class RootCauseAnalysis {
  constructor({
    component,
    issue,
    category,
    likelyCause,
    confidence,
    evidence = [],
    relatedIncidents = [],
    recommendedActions = []
  }) {
    this.component = component;
    this.issue = issue;
    this.category = category;
    this.likelyCause = likelyCause;
    this.confidence = confidence; // 0-100
    this.evidence = evidence;
    this.relatedIncidents = relatedIncidents;
    this.recommendedActions = recommendedActions;
    this.analyzedAt = new Date().toISOString();
  }
}

/**
 * Performance Data Point
 */
export class PerformanceDataPoint {
  constructor({
    metric,
    value,
    timestamp,
    metadata = {}
  }) {
    this.metric = metric;
    this.value = value;
    this.timestamp = timestamp || new Date().toISOString();
    this.metadata = metadata;
  }
}

/**
 * Trend Data
 */
export class TrendData {
  constructor({
    metric,
    period,
    dataPoints = [],
    trend, // 'increasing', 'decreasing', 'stable', 'volatile'
    average,
    min,
    max,
    percentChange
  }) {
    this.metric = metric;
    this.period = period;
    this.dataPoints = dataPoints;
    this.trend = trend;
    this.average = average;
    this.min = min;
    this.max = max;
    this.percentChange = percentChange;
    this.generatedAt = new Date().toISOString();
  }
}

/**
 * Prediction Warning
 */
export class PredictionWarning {
  constructor({
    type,
    component,
    severity,
    predictedIssue,
    confidence,
    timeToIssue,
    recommendedActions = [],
    metadata = {}
  }) {
    this.type = type;
    this.component = component;
    this.severity = severity;
    this.predictedIssue = predictedIssue;
    this.confidence = confidence; // 0-100
    this.timeToIssue = timeToIssue; // milliseconds until predicted issue
    this.recommendedActions = recommendedActions;
    this.metadata = metadata;
    this.generatedAt = new Date().toISOString();
    this.id = this.generateId();
  }

  generateId() {
    return `PRED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * System Score
 */
export class SystemScore {
  constructor({
    overall,
    categories = {},
    deductions = [],
    calculatedAt
  }) {
    this.overall = overall; // 0-100
    this.categories = categories; // Map of category -> score
    this.deductions = deductions; // Array of {category, reason, amount}
    this.calculatedAt = calculatedAt || new Date().toISOString();
  }
}

/**
 * Recommendation
 */
export class Recommendation {
  constructor({
    id,
    priority = RecommendationPriority.MEDIUM,
    title,
    description,
    component,
    actionType, // 'manual', 'automated', 'configuration'
    steps = [],
    estimatedImpact,
    estimatedEffort,
    createdAt = null,
    acknowledged = false,
    implemented = false
  }) {
    this.id = id || this.generateId();
    this.priority = priority;
    this.title = title;
    this.description = description;
    this.component = component;
    this.actionType = actionType;
    this.steps = steps;
    this.estimatedImpact = estimatedImpact;
    this.estimatedEffort = estimatedEffort;
    this.createdAt = createdAt || new Date().toISOString();
    this.acknowledged = acknowledged;
    this.implemented = implemented;
  }

  generateId() {
    return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Diagnostics Report
 */
export class DiagnosticsReport {
  constructor({
    id,
    generatedAt,
    systemSummary,
    incidentSummary,
    performanceSummary,
    healthSummary,
    recommendations = [],
    warnings = [],
    resolvedIssues = [],
    outstandingIssues = []
  }) {
    this.id = id || this.generateId();
    this.generatedAt = generatedAt || new Date().toISOString();
    this.systemSummary = systemSummary;
    this.incidentSummary = incidentSummary;
    this.performanceSummary = performanceSummary;
    this.healthSummary = healthSummary;
    this.recommendations = recommendations;
    this.warnings = warnings;
    this.resolvedIssues = resolvedIssues;
    this.outstandingIssues = outstandingIssues;
  }

  generateId() {
    return `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Recovery Tracking
 */
export class RecoveryTracking {
  constructor({
    incidentId,
    timeToDetect,
    timeToAcknowledge,
    timeToResolve,
    recoverySuccess,
    recoveryFailures = [],
    repeatedIncidents = []
  }) {
    this.incidentId = incidentId;
    this.timeToDetect = timeToDetect; // milliseconds
    this.timeToAcknowledge = timeToAcknowledge; // milliseconds
    this.timeToResolve = timeToResolve; // milliseconds
    this.recoverySuccess = recoverySuccess;
    this.recoveryFailures = recoveryFailures;
    this.repeatedIncidents = repeatedIncidents;
    this.totalRecoveryTime = timeToResolve;
  }
}

/**
 * Diagnostics Configuration
 */
export class DiagnosticsConfig {
  constructor({
    predictionSensitivity = 'normal', // 'low', 'normal', 'high'
    incidentRetentionDays = 90,
    monitoringThresholds = {},
    recommendationBehavior = 'suggest', // 'suggest', 'auto', 'disabled'
    diagnosticsRetentionDays = 30,
    enablePredictions = true,
    enableRootCauseAnalysis = true,
    enablePerformanceTracking = true,
    enableTrendAnalysis = true
  } = {}) {
    // Handle case where constructor is called with no arguments or undefined
    const config = arguments[0] || {};
    
    this.predictionSensitivity = config.predictionSensitivity || 'normal';
    this.incidentRetentionDays = config.incidentRetentionDays || 90;
    this.monitoringThresholds = config.monitoringThresholds || {};
    this.recommendationBehavior = config.recommendationBehavior || 'suggest';
    this.diagnosticsRetentionDays = config.diagnosticsRetentionDays || 30;
    this.enablePredictions = config.enablePredictions !== undefined ? config.enablePredictions : true;
    this.enableRootCauseAnalysis = config.enableRootCauseAnalysis !== undefined ? config.enableRootCauseAnalysis : true;
    this.enablePerformanceTracking = config.enablePerformanceTracking !== undefined ? config.enablePerformanceTracking : true;
    this.enableTrendAnalysis = config.enableTrendAnalysis !== undefined ? config.enableTrendAnalysis : true;
  }
}
