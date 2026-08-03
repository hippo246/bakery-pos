// Error Center
// Centralizes all operational errors

import { ErrorSeverity, ErrorCategory } from './OperationsTypes.js';

export class ErrorCenter {
  constructor() {
    this.errors = new Map();
    this.storageKey = 'cafeos_error_center';
    this.maxErrors = 1000;
    this.loadState();
  }

  /**
   * Log error
   * @param {object} errorData - Error data
   * @returns {object} Log result
   */
  logError(errorData) {
    const errorId = this.generateErrorId();
    
    const error = {
      errorId,
      category: errorData.category || ErrorCategory.APPLICATION,
      severity: errorData.severity || ErrorSeverity.ERROR,
      module: errorData.module || 'unknown',
      description: errorData.description || '',
      suggestedAction: errorData.suggestedAction || '',
      timestamp: new Date().toISOString(),
      stackTrace: errorData.stackTrace || '',
      userId: errorData.userId || null,
      tenantId: errorData.tenantId || null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    this.errors.set(errorId, error);
    this.trimErrors();
    this.saveState();

    return { success: true, errorId, error };
  }

  /**
   * Get error by ID
   * @param {string} errorId - Error ID
   * @returns {object|null} Error
   */
  getError(errorId) {
    return this.errors.get(errorId) || null;
  }

  /**
   * Get all errors
   * @param {object} filters - Optional filters
   * @returns {Array} Errors
   */
  getErrors(filters = {}) {
    let errors = Array.from(this.errors.values());

    if (filters.category) {
      errors = errors.filter(e => e.category === filters.category);
    }

    if (filters.severity) {
      errors = errors.filter(e => e.severity === filters.severity);
    }

    if (filters.module) {
      errors = errors.filter(e => e.module === filters.module);
    }

    if (filters.resolved !== undefined) {
      errors = errors.filter(e => e.resolved === filters.resolved);
    }

    if (filters.userId) {
      errors = errors.filter(e => e.userId === filters.userId);
    }

    if (filters.tenantId) {
      errors = errors.filter(e => e.tenantId === filters.tenantId);
    }

    if (filters.since) {
      errors = errors.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      errors = errors.slice(-filters.limit);
    }

    // Sort by timestamp descending
    errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return errors;
  }

  /**
   * Resolve error
   * @param {string} errorId - Error ID
   * @param {string} resolvedBy - Who resolved it
   * @returns {object} Resolve result
   */
  resolveError(errorId, resolvedBy) {
    const error = this.errors.get(errorId);
    
    if (!error) {
      return { success: false, reason: 'Error not found' };
    }

    error.resolved = true;
    error.resolvedAt = new Date().toISOString();
    error.resolvedBy = resolvedBy;

    this.errors.set(errorId, error);
    this.saveState();

    return { success: true, errorId };
  }

  /**
   * Get error statistics
   * @returns {object} Statistics
   */
  getErrorStatistics() {
    const errors = Array.from(this.errors.values());
    const total = errors.length;

    const byCategory = {};
    errors.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });

    const bySeverity = {};
    errors.forEach(e => {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });

    const byModule = {};
    errors.forEach(e => {
      byModule[e.module] = (byModule[e.module] || 0) + 1;
    });

    const resolved = errors.filter(e => e.resolved).length;
    const unresolved = total - resolved;

    return {
      total,
      byCategory,
      bySeverity,
      byModule,
      resolved,
      unresolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  }

  /**
   * Get errors by category
   * @param {string} category - Error category
   * @returns {Array} Errors
   */
  getErrorsByCategory(category) {
    return this.getErrors({ category });
  }

  /**
   * Get errors by severity
   * @param {string} severity - Error severity
   * @returns {Array} Errors
   */
  getErrorsBySeverity(severity) {
    return this.getErrors({ severity });
  }

  /**
   * Get critical errors
   * @returns {Array} Critical errors
   */
  getCriticalErrors() {
    return this.getErrors({ severity: ErrorSeverity.CRITICAL, resolved: false });
  }

  /**
   * Get fatal errors
   * @returns {Array} Fatal errors
   */
  getFatalErrors() {
    return this.getErrors({ severity: ErrorSeverity.FATAL, resolved: false });
  }

  /**
   * Delete error
   * @param {string} errorId - Error ID
   * @returns {object} Delete result
   */
  deleteError(errorId) {
    const deleted = this.errors.delete(errorId);
    this.saveState();
    return { success: deleted, errorId };
  }

  /**
   * Clear resolved errors
   * @returns {object} Clear result
   */
  clearResolvedErrors() {
    let cleared = 0;
    
    this.errors.forEach((error, errorId) => {
      if (error.resolved) {
        this.errors.delete(errorId);
        cleared++;
      }
    });

    this.saveState();
    return { success: true, cleared };
  }

  /**
   * Trim errors to max size
   */
  trimErrors() {
    while (this.errors.size > this.maxErrors) {
      const firstKey = this.errors.keys().next().value;
      this.errors.delete(firstKey);
    }
  }

  /**
   * Generate error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        errors: Array.from(this.errors.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save error center state:', error);
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
        this.errors = new Map(parsed.errors || []);
      }
    } catch (error) {
      console.error('Failed to load error center state:', error);
      this.errors = new Map();
    }
  }

  /**
   * Destroy the error center
   */
  destroy() {
    this.errors.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[ErrorCenter] Destroyed');
  }
}

// Singleton instance
let errorCenterInstance = null;

/**
 * Get the singleton error center instance
 * @returns {ErrorCenter} Error center instance
 */
export function getErrorCenter() {
  if (!errorCenterInstance) {
    errorCenterInstance = new ErrorCenter();
  }
  return errorCenterInstance;
}

export default ErrorCenter;
