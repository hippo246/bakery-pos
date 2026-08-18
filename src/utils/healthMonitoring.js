// Health Monitoring Utilities for CafeOS
// Provides system health checks, storage monitoring, and maintenance operations

import {
  createHealthMetric,
  createHealthAlert,
  createMaintenanceLog,
  HEALTH_STATUS,
  HEALTH_CATEGORIES,
  ALERT_TYPES,
  MAINTENANCE_OPERATIONS,
  calculateHealthScore,
  getOverallHealthStatus,
  formatBytes,
  formatDuration,
  getHealthStatusColor
} from "../domain/healthModel.js";

// Re-export helpers that components import from this module
export { formatBytes, formatDuration, getHealthStatusColor };

const STORAGE_KEY = 'cafeos_health_data';
const LOGS_KEY = 'cafeos_health_logs';

export function getHealthData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('[HealthMonitoring] Failed to load health data:', e);
    return null;
  }
}

function saveHealthData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[HealthMonitoring] Failed to save health data:', e);
  }
}

export function getHealthLogs() {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[HealthMonitoring] Failed to load health logs:', e);
    return [];
  }
}

function saveHealthLogs(logs) {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('[HealthMonitoring] Failed to save health logs:', e);
  }
}

export function addHealthLog(log) {
  const logs = getHealthLogs();
  const newLog = createMaintenanceLog(log);
  logs.unshift(newLog);
  if (logs.length > 1000) logs.splice(1000);
  saveHealthLogs(logs);
  return newLog;
}

export function estimateStorageUsage() {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length * 2;
    }
  }
  return total;
}

export function getStorageBreakdown() {
  const breakdown = { database: 0, images: 0, receipts: 0, logs: 0, exports: 0, temporary: 0, other: 0 };
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const size = localStorage[key].length * 2;
      if (key.includes('orders') || key.includes('customers') || key.includes('inventory')) {
        breakdown.database += size;
      } else if (key.includes('image') || key.includes('photo')) {
        breakdown.images += size;
      } else if (key.includes('receipt')) {
        breakdown.receipts += size;
      } else if (key.includes('log') || key.includes('activity')) {
        breakdown.logs += size;
      } else if (key.includes('export') || key.includes('backup')) {
        breakdown.exports += size;
      } else if (key.includes('temp') || key.includes('cache')) {
        breakdown.temporary += size;
      } else {
        breakdown.other += size;
      }
    }
  }
  return breakdown;
}

export function checkStorageHealth() {
  const totalUsage = estimateStorageUsage();
  const breakdown = getStorageBreakdown();
  const estimatedLimit = 5 * 1024 * 1024;
  const usagePercent = (totalUsage / estimatedLimit) * 100;
  let status = HEALTH_STATUS.HEALTHY;
  if (usagePercent >= 90) status = HEALTH_STATUS.CRITICAL;
  else if (usagePercent >= 75) status = HEALTH_STATUS.WARNING;
  return createHealthMetric({
    category: HEALTH_CATEGORIES.STORAGE,
    status,
    value: usagePercent,
    unit: '%',
    warningThreshold: 75,
    criticalThreshold: 90,
    metadata: { totalUsage, breakdown, estimatedLimit }
  });
}

export function checkDatabaseHealth() {
  const metrics = [];
  const alerts = [];
  let corruptedRecords;
  try {
    const orders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
    corruptedRecords = orders.filter(o => !o.id || !o.createdAt).length;
  } catch (_e) {
    corruptedRecords = -1;
  }
  const dbStatus = corruptedRecords === 0 ? HEALTH_STATUS.HEALTHY :
                   corruptedRecords > 0 ? HEALTH_STATUS.WARNING : HEALTH_STATUS.CRITICAL;
  
  metrics.push(createHealthMetric({
    category: HEALTH_CATEGORIES.DATABASE,
    status: dbStatus,
    value: corruptedRecords,
    unit: 'records',
    warningThreshold: 1,
    criticalThreshold: 10,
    metadata: { type: 'corrupted_records' }
  }));
  if (corruptedRecords > 0) {
    alerts.push(createHealthAlert({
      type: ALERT_TYPES.DATABASE_CORRUPTION,
      category: HEALTH_CATEGORIES.DATABASE,
      severity: corruptedRecords > 5 ? HEALTH_STATUS.CRITICAL : HEALTH_STATUS.WARNING,
      title: 'Corrupted Records Detected',
      description: `${corruptedRecords} database records may be corrupted`,
      impact: 'Data loss or incorrect reporting',
      recommendedAction: corruptedRecords > 5 ? 'Restore from backup immediately' : 'Review and fix corrupted records'
    }));
  }
  return { metrics, alerts };
}

export function checkDeviceHealth() {
  const healthData = getHealthData();
  const devices = healthData?.devices || [];
  const metrics = [];
  const alerts = [];
  const disconnectedDevices = devices.filter(d => !d.connected).length;
  const totalDevices = devices.length;
  if (totalDevices > 0) {
    const deviceStatus = disconnectedDevices === 0 ? HEALTH_STATUS.HEALTHY :
                         disconnectedDevices > totalDevices / 2 ? HEALTH_STATUS.CRITICAL : HEALTH_STATUS.WARNING;
    metrics.push(createHealthMetric({
      category: HEALTH_CATEGORIES.DEVICE,
      status: deviceStatus,
      value: disconnectedDevices,
      unit: 'devices',
      warningThreshold: 1,
      criticalThreshold: totalDevices / 2,
      metadata: { totalDevices, disconnectedDevices }
    }));
    if (disconnectedDevices > 0) {
      alerts.push(createHealthAlert({
        type: ALERT_TYPES.DEVICE_DISCONNECTED,
        category: HEALTH_CATEGORIES.DEVICE,
        severity: HEALTH_STATUS.WARNING,
        title: 'Device Disconnected',
        description: `${disconnectedDevices} device(s) are offline`,
        impact: 'Reduced operational capability',
        suggestedAction: 'Check device connections',
        actionTarget: 'devices'
      }));
    }
  }
  return { metrics, alerts, devices };
}

export function checkPerformanceHealth() {
  const metrics = [];
  const alerts = [];
  const storageUsage = estimateStorageUsage();
  const memoryStatus = storageUsage > 4 * 1024 * 1024 ? HEALTH_STATUS.WARNING : HEALTH_STATUS.HEALTHY;
  metrics.push(createHealthMetric({
    category: HEALTH_CATEGORIES.PERFORMANCE,
    status: memoryStatus,
    value: storageUsage,
    unit: 'bytes',
    warningThreshold: 4 * 1024 * 1024,
    criticalThreshold: 5 * 1024 * 1024,
    metadata: { type: 'memory_usage' }
  }));
  if (storageUsage > 4 * 1024 * 1024) {
    alerts.push(createHealthAlert({
      type: ALERT_TYPES.MEMORY_PRESSURE,
      category: HEALTH_CATEGORIES.PERFORMANCE,
      severity: HEALTH_STATUS.WARNING,
      title: 'High Memory Usage',
      description: 'LocalStorage usage is high',
      impact: 'Potential performance degradation',
      suggestedAction: 'Clear cache and temporary files',
      actionTarget: 'maintenance'
    }));
  }
  return { metrics, alerts };
}

export function checkBackupHealth() {
  const healthData = getHealthData();
  const lastBackup = healthData?.lastBackup;
  const metrics = [];
  const alerts = [];
  if (lastBackup) {
    const daysSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
    const backupStatus = daysSinceBackup <= 1 ? HEALTH_STATUS.HEALTHY :
                         daysSinceBackup <= 7 ? HEALTH_STATUS.WARNING : HEALTH_STATUS.CRITICAL;
    metrics.push(createHealthMetric({
      category: HEALTH_CATEGORIES.BACKUP,
      status: backupStatus,
      value: daysSinceBackup,
      unit: 'days',
      warningThreshold: 1,
      criticalThreshold: 7,
      metadata: { lastBackup }
    }));
    if (daysSinceBackup > 7) {
      alerts.push(createHealthAlert({
        type: ALERT_TYPES.NO_BACKUP,
        category: HEALTH_CATEGORIES.BACKUP,
        severity: HEALTH_STATUS.CRITICAL,
        title: 'No Recent Backup',
        description: `Last backup was ${Math.floor(daysSinceBackup)} days ago`,
        impact: 'Risk of data loss',
        suggestedAction: 'Create a backup immediately',
        actionTarget: 'backup'
      }));
    }
  } else {
    metrics.push(createHealthMetric({
      category: HEALTH_CATEGORIES.BACKUP,
      status: HEALTH_STATUS.CRITICAL,
      value: null,
      unit: 'days',
      warningThreshold: 1,
      criticalThreshold: 7,
      metadata: { lastBackup: null }
    }));
    alerts.push(createHealthAlert({
      type: ALERT_TYPES.NO_BACKUP,
      category: HEALTH_CATEGORIES.BACKUP,
      severity: HEALTH_STATUS.CRITICAL,
      title: 'No Backup Found',
      description: 'No backup has been created',
      impact: 'Complete data loss risk',
      suggestedAction: 'Create a backup immediately',
      actionTarget: 'backup'
    }));
  }
  return { metrics, alerts };
}

export function runHealthCheck() {
  const startTime = Date.now();
  const allMetrics = [];
  const allAlerts = [];

  allMetrics.push(checkStorageHealth());

  const { metrics: dbMetrics, alerts: dbAlerts } = checkDatabaseHealth();
  allMetrics.push(...dbMetrics);
  allAlerts.push(...dbAlerts);

  const { metrics: deviceMetrics, alerts: deviceAlerts } = checkDeviceHealth();
  allMetrics.push(...deviceMetrics);
  allAlerts.push(...deviceAlerts);

  const { metrics: perfMetrics, alerts: perfAlerts } = checkPerformanceHealth();
  allMetrics.push(...perfMetrics);
  allAlerts.push(...perfAlerts);

  const { metrics: backupMetrics, alerts: backupAlerts } = checkBackupHealth();
  allMetrics.push(...backupMetrics);
  allAlerts.push(...backupAlerts);

  const healthScore = calculateHealthScore(allMetrics);
  const overallStatus = getOverallHealthStatus(healthScore);

  const healthData = {
    lastCheck: new Date().toISOString(),
    healthScore,
    overallStatus,
    metrics: allMetrics,
    alerts: allAlerts,
    checkDuration: Date.now() - startTime
  };

  saveHealthData(healthData);
  addHealthLog({
    operation: MAINTENANCE_OPERATIONS.HEALTH_CHECK,
    initiatedBy: 'system',
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
    result: { healthScore, overallStatus, alertCount: allAlerts.length }
  });

  return healthData;
}

export function clearCache() {
  const startTime = Date.now();
  let clearedCount = 0;
  try {
    const keysToRemove = [];
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key) && (key.includes('cache') || key.includes('temp'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => { localStorage.removeItem(key); clearedCount++; });
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.CLEAR_CACHE, initiatedBy: 'user', status: 'COMPLETED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, result: { clearedCount } });
    return { success: true, clearedCount };
  } catch (e) {
    console.error('[HealthMonitoring] Failed to clear cache:', e);
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.CLEAR_CACHE, initiatedBy: 'user', status: 'FAILED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, error: e.message });
    return { success: false, error: e.message };
  }
}

export function cleanTemporaryFiles() {
  const startTime = Date.now();
  let cleanedSize = 0;
  try {
    const keysToRemove = [];
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key) && (key.includes('temp') || key.includes('tmp'))) {
        cleanedSize += localStorage[key].length * 2;
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.CLEAN_TEMP_FILES, initiatedBy: 'user', status: 'COMPLETED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, result: { cleanedSize, cleanedCount: keysToRemove.length } });
    return { success: true, cleanedSize, cleanedCount: keysToRemove.length };
  } catch (e) {
    console.error('[HealthMonitoring] Failed to clean temp files:', e);
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.CLEAN_TEMP_FILES, initiatedBy: 'user', status: 'FAILED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, error: e.message });
    return { success: false, error: e.message };
  }
}

export function exportDiagnostics() {
  const startTime = Date.now();
  try {
    const healthData = getHealthData();
    const logs = getHealthLogs();
    const storageBreakdown = getStorageBreakdown();
    const storageUsage = estimateStorageUsage();
    const diagnostics = {
      exportDate: new Date().toISOString(),
      healthData,
      recentLogs: logs.slice(0, 100),
      storageBreakdown,
      storageUsage,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafeos-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.EXPORT_DIAGNOSTICS, initiatedBy: 'user', status: 'COMPLETED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, result: { exportSize: blob.size } });
    return { success: true, exportSize: blob.size };
  } catch (e) {
    console.error('[HealthMonitoring] Failed to export diagnostics:', e);
    addHealthLog({ operation: MAINTENANCE_OPERATIONS.EXPORT_DIAGNOSTICS, initiatedBy: 'user', status: 'FAILED', completedAt: new Date().toISOString(), duration: Date.now() - startTime, error: e.message });
    return { success: false, error: e.message };
  }
}

export function getSystemUptime() {
  const healthData = getHealthData();
  if (healthData?.firstRun) return Date.now() - new Date(healthData.firstRun).getTime();
  return 0;
}

export function getSystemVersion() {
  return '1.0.0';
}

export function getLastRestart() {
  const healthData = getHealthData();
  return healthData?.lastRestart || null;
}

export function initializeHealthMonitoring() {
  let healthData = getHealthData();
  if (!healthData) {
    healthData = {
      firstRun: new Date().toISOString(),
      lastRestart: new Date().toISOString(),
      lastBackup: null,
      devices: [],
      metrics: [],
      alerts: []
    };
    saveHealthData(healthData);
  } else {
    healthData.lastRestart = new Date().toISOString();
    saveHealthData(healthData);
  }
  return runHealthCheck();
}

/**
 * Resolve an alert — marks it resolved with a timestamp
 */
export function resolveAlert(alert) {
  return {
    ...alert,
    resolved: true,
    resolvedAt: new Date().toISOString()
  };
}

/**
 * Acknowledge an alert — marks it acknowledged
 */
export function acknowledgeAlert(alert) {
  return {
    ...alert,
    acknowledged: true,
    acknowledgedAt: new Date().toISOString()
  };
}

export default {
  getHealthData,
  getHealthLogs,
  addHealthLog,
  estimateStorageUsage,
  getStorageBreakdown,
  checkStorageHealth,
  checkDatabaseHealth,
  checkDeviceHealth,
  checkPerformanceHealth,
  checkBackupHealth,
  runHealthCheck,
  clearCache,
  cleanTemporaryFiles,
  exportDiagnostics,
  getSystemUptime,
  getSystemVersion,
  getLastRestart,
  initializeHealthMonitoring,
  resolveAlert,
  acknowledgeAlert
};
