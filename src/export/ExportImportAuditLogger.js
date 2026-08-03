// Export/Import Audit Logger
// Audit logging for export and import operations

import { getSecurityEventManager } from '../security/SecurityEventManager.js';

export class ExportImportAuditLogger {
  constructor() {
    this.securityEventManager = getSecurityEventManager();
  }

  /**
   * Log export started
   * @param {object} details - Export details
   */
  logExportStarted(details) {
    this.securityEventManager.logSecurityAlert('Export Started', {
      module: details.module,
      format: details.format,
      destination: details.destination,
      operator: details.operator
    });
  }

  /**
   * Log export completed
   * @param {object} details - Export details
   */
  logExportCompleted(details) {
    this.securityEventManager.logSecurityAlert('Export Completed', {
      module: details.module,
      format: details.format,
      destination: details.destination,
      recordCount: details.recordCount,
      size: details.size,
      duration: details.duration,
      operator: details.operator
    });
  }

  /**
   * Log export failed
   * @param {object} details - Export details
   */
  logExportFailed(details) {
    this.securityEventManager.logSecurityAlert('Export Failed', {
      module: details.module,
      format: details.format,
      error: details.error,
      operator: details.operator
    });
  }

  /**
   * Log import started
   * @param {object} details - Import details
   */
  logImportStarted(details) {
    this.securityEventManager.logSecurityAlert('Import Started', {
      module: details.module,
      format: details.format,
      source: details.source,
      operator: details.operator
    });
  }

  /**
   * Log import completed
   * @param {object} details - Import details
   */
  logImportCompleted(details) {
    this.securityEventManager.logSecurityAlert('Import Completed', {
      module: details.module,
      format: details.format,
      source: details.source,
      recordsImported: details.recordsImported,
      recordsSkipped: details.recordsSkipped,
      recordsFailed: details.recordsFailed,
      duration: details.duration,
      operator: details.operator
    });
  }

  /**
   * Log import failed
   * @param {object} details - Import details
   */
  logImportFailed(details) {
    this.securityEventManager.logSecurityAlert('Import Failed', {
      module: details.module,
      format: details.format,
      error: details.error,
      operator: details.operator
    });
  }

  /**
   * Log validation failed
   * @param {object} details - Validation details
   */
  logValidationFailed(details) {
    this.securityEventManager.logSecurityAlert('Validation Failed', {
      module: details.module,
      errorCount: details.errorCount,
      errors: details.errors,
      operator: details.operator
    });
  }

  /**
   * Log conflict resolved
   * @param {object} details - Conflict resolution details
   */
  logConflictResolved(details) {
    this.securityEventManager.logSecurityAlert('Conflict Resolved', {
      module: details.module,
      conflictType: details.conflictType,
      resolution: details.resolution,
      operator: details.operator
    });
  }

  /**
   * Log template saved
   * @param {object} details - Template details
   */
  logTemplateSaved(details) {
    this.securityEventManager.logSecurityAlert('Template Saved', {
      templateName: details.name,
      templateType: details.type,
      operator: details.operator
    });
  }

  /**
   * Get audit log
   * @param {object} filters - Optional filters
   * @returns {Array} Audit log
   */
  getAuditLog(filters = {}) {
    const allEvents = this.securityEventManager.getEventHistory({ limit: 500 });
    
    // Filter for export/import related events
    const exportImportEvents = allEvents.filter(event => {
      const message = event.details?.message || '';
      return message.includes('Export') || message.includes('Import') || 
             message.includes('Validation') || message.includes('Conflict') ||
             message.includes('Template');
    });

    if (filters.module) {
      return exportImportEvents.filter(e => e.details?.module === filters.module);
    }

    if (filters.operator) {
      return exportImportEvents.filter(e => e.details?.operator === filters.operator);
    }

    if (filters.since) {
      return exportImportEvents.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      return exportImportEvents.slice(-filters.limit);
    }

    return exportImportEvents;
  }

  /**
   * Get audit statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const auditLog = this.getAuditLog();
    const total = auditLog.length;

    const byType = {};
    auditLog.forEach(event => {
      const message = event.details?.message || 'Unknown';
      byType[message] = (byType[message] || 0) + 1;
    });

    const byModule = {};
    auditLog.forEach(event => {
      const module = event.details?.module || 'Unknown';
      byModule[module] = (byModule[module] || 0) + 1;
    });

    return {
      total,
      byType,
      byModule
    };
  }
}

// Singleton instance
let exportImportAuditLoggerInstance = null;

/**
 * Get the singleton export/import audit logger instance
 * @returns {ExportImportAuditLogger} Export/import audit logger instance
 */
export function getExportImportAuditLogger() {
  if (!exportImportAuditLoggerInstance) {
    exportImportAuditLoggerInstance = new ExportImportAuditLogger();
  }
  return exportImportAuditLoggerInstance;
}

export default ExportImportAuditLogger;
