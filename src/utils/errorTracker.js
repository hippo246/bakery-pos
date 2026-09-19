// Error Tracking and Logging Utility

class ErrorTracker {
  constructor() {
    this.logs = [];
    this.enabled = false;
    this.autoSave = false;
    this.logLevel = 'error';
    this.logRetentionDays = 30;
    this.crashDetectionEnabled = false;
    this.crashReportEmail = '';
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Load settings from localStorage
    this.loadSettings();

    // Load existing logs
    this.loadLogs();

    // Set up global error handlers if crash detection is enabled
    if (this.crashDetectionEnabled) {
      this.setupCrashDetection();
    }

    // Clean up old logs
    this.cleanupOldLogs();
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enableErrorTracking || false;
        this.autoSave = parsed.autoSaveLogs || false;
        this.logLevel = parsed.logLevel || 'error';
        this.logRetentionDays = parsed.logRetentionDays || 30;
        this.crashDetectionEnabled = parsed.enableCrashDetection || false;
        this.crashReportEmail = parsed.crashReportEmail || '';
      }
    } catch (error) {
      console.error('Failed to load error tracker settings:', error);
    }
  }

  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('error_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
      this.logs = [];
    }
  }

  saveLogs() {
    if (!this.autoSave || typeof window === 'undefined') return;

    try {
      localStorage.setItem('error_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

    this.logs = this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate > cutoffDate;
    });

    this.saveLogs();
  }

  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return this.enabled && levels[level] <= levels[this.logLevel];
  }

  log(level, message, error = null, context = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...context
      }
    };

    this.logs.push(logEntry);

    // Keep only last 1000 logs to prevent storage overflow
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    this.saveLogs();

    // Log to console as well
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         level === 'info' ? console.info : console.log;
    consoleMethod('[ErrorTracker]', message, error, context);
  }

  error(message, error = null, context = {}) {
    this.log('error', message, error, context);
  }

  warn(message, error = null, context = {}) {
    this.log('warn', message, error, context);
  }

  info(message, context = {}) {
    this.log('info', message, null, context);
  }

  debug(message, context = {}) {
    this.log('debug', message, null, context);
  }

  setupCrashDetection() {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', event.reason, {
        promise: event.promise
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.error('Resource loading error', null, {
          tagName: event.target.tagName,
          src: event.target.src || event.target.href
        });
      }
    }, true);
  }

  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getLogs(level = null, limit = 100) {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered.slice(-limit);
  }

  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
      },
      last24h: 0,
      last7d: 0
    };

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      const logDate = new Date(log.timestamp);
      if (logDate > last24h) stats.last24h++;
      if (logDate > last7d) stats.last7d++;
    });

    return stats;
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  sendCrashReport(logEntry) {
    if (!this.crashReportEmail) return;

    // In a real implementation, this would send an email via an API
    // For now, we'll just log it
    console.log('Crash report would be sent to:', this.crashReportEmail, logEntry);
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

export default errorTracker;
