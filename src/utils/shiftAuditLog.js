// Shift Audit Logging System for CafeOS
// Comprehensive audit trail for all shift operations

import { getRepositoryFactoryInstance } from '../repository/RepositoryFactory.js';

/**
 * Audit log storage key (fallback for DEMO/SETUP)
 */
const AUDIT_LOG_STORAGE_KEY = 'cafeos_shift_audit_log';

/**
 * Audit event types
 */
export const AUDIT_EVENT_TYPES = {
  SHIFT_OPENED: 'SHIFT_OPENED',
  SHIFT_CLOSED: 'SHIFT_CLOSED',
  SHIFT_VOIDED: 'SHIFT_VOIDED',
  CASH_COUNTED: 'CASH_COUNTED',
  PAID_OUT_ADDED: 'PAID_OUT_ADDED',
  PAID_OUT_APPROVED: 'PAID_OUT_APPROVED',
  CASH_DROP_ADDED: 'CASH_DROP_ADDED',
  CASH_DROP_APPROVED: 'CASH_DROP_APPROVED',
  PAYMENT_RECONCILED: 'PAYMENT_RECONCILED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_PRINTED: 'REPORT_PRINTED',
  MANAGER_OVERRIDE: 'MANAGER_OVERRIDE',
  SHIFT_EDITED: 'SHIFT_EDITED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ISSUE_RESOLVED: 'ISSUE_RESOLVED'
};

/**
 * Create an audit log entry
 */
export function createAuditLogEntry(eventType, data) {
  return {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    shiftId: data.shiftId || null,
    userId: data.userId || null,
    userName: data.userName || null,
    userRole: data.userRole || null,
    details: data.details || {},
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    metadata: data.metadata || {}
  };
}

/**
 * Log an audit event
 */
export function logAuditEvent(eventType, data) {
  const entry = createAuditLogEntry(eventType, data);
  
  try {
    // Try to use repository first
    const factory = getRepositoryFactoryInstance();
    if (factory) {
      const repo = factory.createAuditLogRepository();
      if (repo) {
        repo.save(entry);
        return entry;
      }
    }
    
    // Fallback to localStorage for DEMO/SETUP
    const existingLogs = getAuditLogs();
    existingLogs.push(entry);
    
    // Keep only last 1000 logs to prevent storage bloat
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(existingLogs));
    return entry;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    return null;
  }
}

/**
 * Get all audit logs
 */
export function getAuditLogs() {
  try {
    // Try to use repository first
    const factory = getRepositoryFactoryInstance();
    if (factory) {
      const repo = factory.createAuditLogRepository();
      if (repo) {
        const logs = repo.getAll();
        if (logs && logs.length > 0) {
          return logs;
        }
      }
    }
    
    // Fallback to localStorage for DEMO/SETUP
    const logs = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific shift
 */
export function getShiftAuditLogs(shiftId) {
  const allLogs = getAuditLogs();
  return allLogs.filter(log => log.shiftId === shiftId);
}

/**
 * Get audit logs for a specific user
 */
export function getUserAuditLogs(userId) {
  const allLogs = getAuditLogs();
  return allLogs.filter(log => log.userId === userId);
}

/**
 * Get audit logs by event type
 */
export function getAuditLogsByType(eventType) {
  const allLogs = getAuditLogs();
  return allLogs.filter(log => log.eventType === eventType);
}

/**
 * Get audit logs within a date range
 */
export function getAuditLogsByDateRange(startDate, endDate) {
  const allLogs = getAuditLogs();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return allLogs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
}

/**
 * Clear audit logs (use with caution)
 */
export function clearAuditLogs() {
  try {
    // Try to use repository first
    const factory = getRepositoryFactoryInstance();
    if (factory) {
      const repo = factory.createAuditLogRepository();
      if (repo) {
        repo.clear();
        return true;
      }
    }
    
    // Fallback to localStorage for DEMO/SETUP
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
    return false;
  }
}

/**
 * Export audit logs as JSON
 */
export function exportAuditLogs() {
  const logs = getAuditLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Get audit log statistics
 */
export function getAuditLogStats() {
  const logs = getAuditLogs();
  
  const stats = {
    total: logs.length,
    byEventType: {},
    byUser: {},
    byShift: {},
    recentActivity: logs.slice(-10).reverse()
  };
  
  logs.forEach(log => {
    // Count by event type
    stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
    
    // Count by user
    if (log.userId) {
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
    }
    
    // Count by shift
    if (log.shiftId) {
      stats.byShift[log.shiftId] = (stats.byShift[log.shiftId] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * Pre-defined audit log helpers
 */
export const auditLog = {
  shiftOpened: (shiftId, user) => 
    logAuditEvent(AUDIT_EVENT_TYPES.SHIFT_OPENED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Shift opened' }
    }),
  
  shiftClosed: (shiftId, user, closingData) =>
    logAuditEvent(AUDIT_EVENT_TYPES.SHIFT_CLOSED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { 
        action: 'Shift closed',
        cashDifference: closingData?.cashDifference,
        netSales: closingData?.netSales
      }
    }),
  
  shiftVoided: (shiftId, user, reason) =>
    logAuditEvent(AUDIT_EVENT_TYPES.SHIFT_VOIDED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Shift voided', reason }
    }),
  
  cashCounted: (shiftId, user, amount) =>
    logAuditEvent(AUDIT_EVENT_TYPES.CASH_COUNTED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Cash counted', amount }
    }),
  
  paidOutAdded: (shiftId, user, paidOut) =>
    logAuditEvent(AUDIT_EVENT_TYPES.PAID_OUT_ADDED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { 
        action: 'Paid out added',
        category: paidOut.category,
        amount: paidOut.amount,
        reason: paidOut.reason
      }
    }),
  
  paidOutApproved: (shiftId, user, paidOutId, approver) =>
    logAuditEvent(AUDIT_EVENT_TYPES.PAID_OUT_APPROVED, {
      shiftId,
      userId: approver?.id,
      userName: approver?.name,
      userRole: approver?.role,
      details: { 
        action: 'Paid out approved',
        paidOutId,
        originalUserId: user?.id
      }
    }),
  
  cashDropAdded: (shiftId, user, cashDrop) =>
    logAuditEvent(AUDIT_EVENT_TYPES.CASH_DROP_ADDED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { 
        action: 'Cash drop added',
        type: cashDrop.type,
        amount: cashDrop.amount,
        reason: cashDrop.reason
      }
    }),
  
  cashDropApproved: (shiftId, user, cashDropId, approver) =>
    logAuditEvent(AUDIT_EVENT_TYPES.CASH_DROP_APPROVED, {
      shiftId,
      userId: approver?.id,
      userName: approver?.name,
      userRole: approver?.role,
      details: { 
        action: 'Cash drop approved',
        cashDropId,
        originalUserId: user?.id
      }
    }),
  
  paymentReconciled: (shiftId, user, paymentType, amount) =>
    logAuditEvent(AUDIT_EVENT_TYPES.PAYMENT_RECONCILED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Payment reconciled', paymentType, amount }
    }),
  
  reportGenerated: (shiftId, user, reportType) =>
    logAuditEvent(AUDIT_EVENT_TYPES.REPORT_GENERATED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Report generated', reportType }
    }),
  
  reportPrinted: (shiftId, user, reportType) =>
    logAuditEvent(AUDIT_EVENT_TYPES.REPORT_PRINTED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Report printed', reportType }
    }),
  
  managerOverride: (shiftId, user, overrideType, reason) =>
    logAuditEvent(AUDIT_EVENT_TYPES.MANAGER_OVERRIDE, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Manager override', overrideType, reason }
    }),
  
  shiftEdited: (shiftId, user, changes) =>
    logAuditEvent(AUDIT_EVENT_TYPES.SHIFT_EDITED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Shift edited', changes }
    }),
  
  validationFailed: (shiftId, user, validationErrors) =>
    logAuditEvent(AUDIT_EVENT_TYPES.VALIDATION_FAILED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Validation failed', errors: validationErrors }
    }),
  
  issueResolved: (shiftId, user, issueType, resolution) =>
    logAuditEvent(AUDIT_EVENT_TYPES.ISSUE_RESOLVED, {
      shiftId,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      details: { action: 'Issue resolved', issueType, resolution }
    })
};

export default {
  AUDIT_EVENT_TYPES,
  createAuditLogEntry,
  logAuditEvent,
  getAuditLogs,
  getShiftAuditLogs,
  getUserAuditLogs,
  getAuditLogsByType,
  getAuditLogsByDateRange,
  clearAuditLogs,
  exportAuditLogs,
  getAuditLogStats,
  auditLog
};
