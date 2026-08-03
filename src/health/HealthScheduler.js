// Health Scheduler
// Manages scheduled health checks with configurable intervals

import healthEngine from './HealthEngine.js';
import healthRegistry from './HealthRegistry.js';
import { HealthCheckIntervals } from './HealthTypes.js';

/**
 * Health Scheduler - Manages scheduled health checks
 */
class HealthScheduler {
  constructor() {
    this.scheduledChecks = new Map(); // componentId -> intervalId
    this.isRunning = false;
    this.defaultInterval = HealthCheckIntervals.NORMAL;
  }

  /**
   * Start the health scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('[HealthScheduler] Already running');
      return;
    }

    console.log('[HealthScheduler] Starting...');
    this.isRunning = true;
    this.scheduleAllChecks();
    console.log('[HealthScheduler] Started successfully');
  }

  /**
   * Stop the health scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('[HealthScheduler] Not running');
      return;
    }

    console.log('[HealthScheduler] Stopping...');
    this.isRunning = false;
    this.clearAllScheduledChecks();
    console.log('[HealthScheduler] Stopped successfully');
  }

  /**
   * Schedule health check for a specific component
   * @param {string} componentId - Component identifier
   * @param {number} interval - Check interval in milliseconds
   */
  scheduleCheck(componentId, interval = this.defaultInterval) {
    // Clear existing schedule if any
    this.unscheduleCheck(componentId);

    const config = healthRegistry.getConfig(componentId);
    if (!config?.enabled) {
      console.log(`[HealthScheduler] Component ${componentId} is disabled, skipping schedule`);
      return;
    }

    const intervalId = setInterval(async () => {
      if (!this.isRunning) return;

      // Use requestIdleCallback to avoid blocking UI
      const runCheck = async () => {
        try {
          await healthEngine.checkComponent(componentId);
        } catch (error) {
          console.error(`[HealthScheduler] Scheduled check failed for ${componentId}:`, error);
        }
      };

      // Check if requestIdleCallback is available
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => runCheck(), { timeout: 5000 });
      } else {
        // Fallback for environments without requestIdleCallback
        setTimeout(() => runCheck(), 0);
      }
    }, interval);

    this.scheduledChecks.set(componentId, intervalId);
    console.log(`[HealthScheduler] Scheduled check for ${componentId} every ${interval}ms`);
  }

  /**
   * Unschedule health check for a specific component
   * @param {string} componentId - Component identifier
   */
  unscheduleCheck(componentId) {
    const intervalId = this.scheduledChecks.get(componentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.scheduledChecks.delete(componentId);
      console.log(`[HealthScheduler] Unscheduled check for ${componentId}`);
    }
  }

  /**
   * Schedule health checks for all registered components
   */
  scheduleAllChecks() {
    const componentIds = healthRegistry.getAllComponentIds();
    
    componentIds.forEach(componentId => {
      const config = healthRegistry.getConfig(componentId);
      const interval = config?.interval || this.defaultInterval;
      this.scheduleCheck(componentId, interval);
    });
  }

  /**
   * Clear all scheduled checks
   */
  clearAllScheduledChecks() {
    this.scheduledChecks.forEach((intervalId, _componentId) => {
      clearInterval(intervalId);
    });
    this.scheduledChecks.clear();
    console.log('[HealthScheduler] Cleared all scheduled checks');
  }

  /**
   * Reschedule a component with a new interval
   * @param {string} componentId - Component identifier
   * @param {number} newInterval - New interval in milliseconds
   */
  rescheduleCheck(componentId, newInterval) {
    this.unscheduleCheck(componentId);
    this.scheduleCheck(componentId, newInterval);
  }

  /**
   * Update default interval for new checks
   * @param {number} interval - New default interval in milliseconds
   */
  setDefaultInterval(interval) {
    this.defaultInterval = interval;
    console.log(`[HealthScheduler] Default interval set to ${interval}ms`);
  }

  /**
   * Get scheduler status
   * @returns {Object}
   */
  getStatus() {
    return {
      running: this.isRunning,
      scheduledChecks: this.scheduledChecks.size,
      defaultInterval: this.defaultInterval,
      scheduledComponentIds: Array.from(this.scheduledChecks.keys())
    };
  }

  /**
   * Manually trigger a check for a component
   * @param {string} componentId - Component identifier
   */
  async triggerCheck(componentId) {
    console.log(`[HealthScheduler] Manually triggering check for ${componentId}`);
    return await healthEngine.checkComponent(componentId, true);
  }

  /**
   * Manually trigger checks for all components
   */
  async triggerAllChecks() {
    console.log('[HealthScheduler] Manually triggering all checks');
    return await healthEngine.checkAll(true);
  }
}

// Singleton instance
const healthScheduler = new HealthScheduler();

export default healthScheduler;
export { HealthScheduler };
