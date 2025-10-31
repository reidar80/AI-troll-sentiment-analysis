/**
 * logger.js - Debug logging utility with configurable levels
 * Provides controlled logging to avoid console spam in production
 */

class Logger {
  constructor(prefix = '[AI and Troll Detector]', config = null) {
    this.prefix = prefix;
    this.config = config || (typeof CONFIG !== 'undefined' ? CONFIG : { DEBUG: { ENABLED: false } });
  }

  /**
   * Get debug settings from config
   */
  get enabled() {
    return this.config.DEBUG && this.config.DEBUG.ENABLED;
  }

  get logAnalysis() {
    return this.config.DEBUG && this.config.DEBUG.LOG_ANALYSIS;
  }

  get logPerformance() {
    return this.config.DEBUG && this.config.DEBUG.LOG_PERFORMANCE;
  }

  /**
   * Regular debug log - only shown when DEBUG.ENABLED is true
   */
  log(...args) {
    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  /**
   * Analysis-specific logging
   */
  analysis(...args) {
    if (this.logAnalysis) {
      console.log(`${this.prefix} [ANALYSIS]`, ...args);
    }
  }

  /**
   * Performance-specific logging
   */
  performance(...args) {
    if (this.logPerformance) {
      console.log(`${this.prefix} [PERF]`, ...args);
    }
  }

  /**
   * Warning - always shown
   */
  warn(...args) {
    console.warn(this.prefix, ...args);
  }

  /**
   * Error - always shown
   */
  error(...args) {
    console.error(this.prefix, ...args);
  }

  /**
   * Info - always shown for important user-facing information
   */
  info(...args) {
    console.info(this.prefix, ...args);
  }

  /**
   * Performance timing helper
   */
  time(label) {
    if (this.logPerformance) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  timeEnd(label) {
    if (this.logPerformance) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }

  /**
   * Group logging
   */
  group(label) {
    if (this.enabled) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for structured data
   */
  table(data) {
    if (this.enabled) {
      console.log(this.prefix);
      console.table(data);
    }
  }
}

// Create default logger instance
const logger = new Logger();

// Make available globally
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger };
}
