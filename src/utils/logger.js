/**
 * Logger Utility
 * Centralized logging with environment-based filtering
 * In production, logs can be disabled or sent to a logging service
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

class Logger {
  constructor() {
    this.level = this.getLogLevel();
    this.prefix = '[CafeOS]';
  }

  getLogLevel() {
    // Check environment variable or default to INFO in production, DEBUG in development
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envLevel = import.meta.env.VITE_LOG_LEVEL;
      if (envLevel && LOG_LEVELS[envLevel.toUpperCase()] !== undefined) {
        return LOG_LEVELS[envLevel.toUpperCase()];
      }
    }
    
    // Default: DEBUG in dev, INFO in production
    return import.meta.env?.MODE === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
  }

  shouldLog(level) {
    return level >= this.level;
  }

  debug(...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.prefix, '[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.prefix, '[INFO]', ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.prefix, '[WARN]', ...args);
    }
  }

  error(...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.prefix, '[ERROR]', ...args);
    }
  }

  // Component-specific logging
  component(componentName, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.prefix, `[${componentName}]`, ...args);
    }
  }

  // Security-specific logging (always log in production)
  security(...args) {
    console.error(this.prefix, '[SECURITY]', ...args);
  }
}

// Singleton instance
const logger = new Logger();

export default logger;
