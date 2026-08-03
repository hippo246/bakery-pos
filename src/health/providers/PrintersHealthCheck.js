// Printers Health Check Provider
// Real health checks for Printers

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';

/**
 * Health check provider for Printers
 * Verifies connection, availability, ready state, and queue
 */
export class PrintersHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'printers',
      'Printers',
      ComponentCategory.PRINTING
    );
  }

  /**
   * Perform printers health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check printer connection
      const connectionCheck = await this.checkPrinterConnection();
      
      // Check printer availability
      const availabilityCheck = await this.checkPrinterAvailability();
      
      // Check ready state
      const readyCheck = await this.checkReadyState();
      
      // Check print queue
      const queueCheck = await this.checkPrintQueue();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, connectionCheck, availabilityCheck, readyCheck, queueCheck);

      // Determine overall status based on printer states
      let status = HealthState.HEALTHY;
      let reason = 'Printers are operational';
      
      if (!connectionCheck.connected) {
        status = HealthState.OFFLINE;
        reason = 'No printers connected';
      } else if (!availabilityCheck.available) {
        status = HealthState.WARNING;
        reason = 'Printers not available';
      } else if (!readyCheck.ready) {
        status = HealthState.WARNING;
        reason = 'Printers not ready';
      } else if (queueCheck.stuck > 0) {
        status = HealthState.WARNING;
        reason = `${queueCheck.stuck} stuck print jobs`;
      }

      return new HealthCheckResult({
        status,
        reason,
        latency,
        healthScore,
        metadata: {
          connectedPrinters: connectionCheck.count,
          availablePrinters: availabilityCheck.count,
          readyPrinters: readyCheck.count,
          queueSize: queueCheck.size,
          stuckJobs: queueCheck.stuck,
          paperStatus: readyCheck.paperStatus
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Printers health check error: ${error.message}`,
        recommendedAction: 'Check printer configuration and connections'
      });
    }
  }

  /**
   * Check printer connection
   * @returns {Promise<Object>}
   */
  async checkPrinterConnection() {
    try {
      // Check printer configuration from localStorage
      const config = localStorage.getItem('cafeos_printer_config');
      if (!config) {
        return {
          success: true,
          connected: false,
          count: 0,
          error: null
        };
      }

      const parsed = JSON.parse(config);
      const printers = parsed.printers || [];
      const connected = printers.filter(p => p.connected).length;
      
      return {
        success: true,
        connected: connected > 0,
        count: connected,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Check printer availability
   * @returns {Promise<Object>}
   */
  async checkPrinterAvailability() {
    try {
      const config = localStorage.getItem('cafeos_printer_config');
      if (!config) {
        return {
          success: true,
          available: false,
          count: 0,
          error: null
        };
      }

      const parsed = JSON.parse(config);
      const printers = parsed.printers || [];
      const available = printers.filter(p => p.available).length;
      
      return {
        success: true,
        available: available > 0,
        count: available,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        available: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Check ready state
   * @returns {Promise<Object>}
   */
  async checkReadyState() {
    try {
      const config = localStorage.getItem('cafeos_printer_config');
      if (!config) {
        return {
          success: true,
          ready: false,
          count: 0,
          paperStatus: 'unknown',
          error: null
        };
      }

      const parsed = JSON.parse(config);
      const printers = parsed.printers || [];
      const ready = printers.filter(p => p.ready).length;
      const paperStatus = ready > 0 ? 'ok' : 'unknown';
      
      return {
        success: true,
        ready: ready > 0,
        count: ready,
        paperStatus,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        ready: false,
        count: 0,
        paperStatus: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Check print queue
   * @returns {Promise<Object>}
   */
  async checkPrintQueue() {
    try {
      const queue = localStorage.getItem('cafeos_print_queue');
      const size = queue ? JSON.parse(queue).length : 0;
      const stuck = queue ? JSON.parse(queue).filter(j => j.status === 'stuck').length : 0;
      
      return {
        success: true,
        size,
        stuck,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        stuck: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} connectionCheck - Connection check result
   * @param {Object} availabilityCheck - Availability check result
   * @param {Object} readyCheck - Ready state check result
   * @param {Object} queueCheck - Queue check result
   * @returns {number}
   */
  calculateHealthScore(latency, connectionCheck, availabilityCheck, readyCheck, queueCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for connection issues
    if (!connectionCheck.connected) score -= 50;
    if (connectionCheck.count === 0) score -= 40;

    // Deduct for availability issues
    if (!availabilityCheck.available) score -= 30;
    if (availabilityCheck.count === 0) score -= 20;

    // Deduct for ready state issues
    if (!readyCheck.ready) score -= 20;

    // Deduct for queue issues
    if (queueCheck.size > 20) score -= 10;
    if (queueCheck.stuck > 0) score -= 15;
    if (queueCheck.stuck > 5) score -= 25;

    return Math.max(0, score);
  }

  /**
   * Get Printers version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default PrintersHealthCheck;
