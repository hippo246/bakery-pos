// Scheduling System
// Schedule discounts, promotions, prices, bundles, coupons for auto activation

import { now } from '../domain/dates.js';

const SCHEDULES_KEY = 'cafeos_pricing_schedules';

/**
 * Schedule Types
 */
export const SCHEDULE_TYPES = {
  DISCOUNT: 'DISCOUNT',
  PROMOTION: 'PROMOTION',
  PRICE: 'PRICE',
  BUNDLE: 'BUNDLE',
  COUPON: 'COUPON',
  TAX: 'TAX'
};

/**
 * Schedule Status
 */
export const SCHEDULE_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

/**
 * Recurrence Types
 */
export const RECURRENCE_TYPES = {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CUSTOM: 'CUSTOM'
};

/**
 * Scheduling System class
 * Schedule discounts, promotions, prices, bundles, coupons for auto activation
 */
export class SchedulingSystem {
  constructor() {
    this.schedules = new Map();
    this.activeScheduleIds = new Set();
    this.loadSchedules();
    this.startScheduler();
  }

  /**
   * Load schedules from localStorage
   */
  loadSchedules() {
    try {
      const stored = localStorage.getItem(SCHEDULES_KEY);
      if (stored) {
        const schedules = JSON.parse(stored);
        schedules.forEach(schedule => {
          this.schedules.set(schedule.id, schedule);
        });
      }
    } catch (error) {
      console.error('[SchedulingSystem] Failed to load schedules:', error);
    }
  }

  /**
   * Save schedules to localStorage
   */
  saveSchedules() {
    try {
      const schedules = Array.from(this.schedules.values());
      localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('[SchedulingSystem] Failed to save schedules:', error);
    }
  }

  /**
   * Start the scheduler
   */
  startScheduler() {
    // Check every minute for schedules to activate/deactivate
    setInterval(() => {
      this.checkSchedules();
    }, 60000);

    // Initial check
    this.checkSchedules();
  }

  /**
   * Check and update schedules
   */
  checkSchedules() {
    const currentTime = now();

    for (const [scheduleId, schedule] of this.schedules) {
      if (schedule.status === SCHEDULE_STATUS.CANCELLED || schedule.status === SCHEDULE_STATUS.COMPLETED) {
        continue;
      }

      // Check if schedule should activate
      if (schedule.status === SCHEDULE_STATUS.PENDING && currentTime >= schedule.startTime) {
        this.activateSchedule(scheduleId);
      }

      // Check if schedule should deactivate
      if (schedule.status === SCHEDULE_STATUS.ACTIVE && schedule.endTime && currentTime >= schedule.endTime) {
        this.deactivateSchedule(scheduleId);
      }

      // Check for recurrence
      if (schedule.recurrence !== RECURRENCE_TYPES.NONE && schedule.status === SCHEDULE_STATUS.COMPLETED) {
        this.createNextOccurrence(schedule);
      }
    }
  }

  /**
   * Create a schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Object} Created schedule
   */
  createSchedule(scheduleData) {
    const schedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: scheduleData.type || SCHEDULE_TYPES.PROMOTION,
      name: scheduleData.name || 'Untitled Schedule',
      description: scheduleData.description || '',
      
      // Target
      targetId: scheduleData.targetId, // ID of the rule/promotion/discount to schedule
      targetType: scheduleData.targetType,
      
      // Timing
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime || null,
      timezone: scheduleData.timezone || 'UTC',
      
      // Recurrence
      recurrence: scheduleData.recurrence || RECURRENCE_TYPES.NONE,
      recurrenceInterval: scheduleData.recurrenceInterval || 1,
      recurrenceDays: scheduleData.recurrenceDays || [], // For weekly: [0,1,2,3,4,5,6]
      recurrenceEndDate: scheduleData.recurrenceEndDate || null,
      
      // Branches
      branches: scheduleData.branches || [],
      
      // Actions
      activateAction: scheduleData.activateAction || 'ENABLE',
      deactivateAction: scheduleData.deactivateAction || 'DISABLE',
      
      // Status
      status: SCHEDULE_STATUS.PENDING,
      
      // Audit
      createdAt: now(),
      createdBy: scheduleData.createdBy || null,
      activatedAt: null,
      deactivatedAt: null,
      activatedBy: null,
      deactivatedBy: null
    };

    this.schedules.set(schedule.id, schedule);
    this.saveSchedules();

    return schedule;
  }

  /**
   * Activate a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Object} Result
   */
  activateSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    if (schedule.status !== SCHEDULE_STATUS.PENDING) {
      return { success: false, reason: `Schedule is ${schedule.status.toLowerCase()}` };
    }

    // Execute activation action
    const actionResult = this.executeAction(schedule, 'activate');

    if (!actionResult.success) {
      return actionResult;
    }

    // Update schedule status
    schedule.status = schedule.endTime ? SCHEDULE_STATUS.ACTIVE : SCHEDULE_STATUS.COMPLETED;
    schedule.activatedAt = now();
    schedule.activatedBy = 'SYSTEM';

    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    this.activeScheduleIds.add(scheduleId);

    return {
      success: true,
      schedule,
      actionResult
    };
  }

  /**
   * Deactivate a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Object} Result
   */
  deactivateSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    if (schedule.status !== SCHEDULE_STATUS.ACTIVE) {
      return { success: false, reason: `Schedule is ${schedule.status.toLowerCase()}` };
    }

    // Execute deactivation action
    const actionResult = this.executeAction(schedule, 'deactivate');

    if (!actionResult.success) {
      return actionResult;
    }

    // Update schedule status
    schedule.status = SCHEDULE_STATUS.COMPLETED;
    schedule.deactivatedAt = now();
    schedule.deactivatedBy = 'SYSTEM';

    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    this.activeScheduleIds.delete(scheduleId);

    return {
      success: true,
      schedule,
      actionResult
    };
  }

  /**
   * Execute schedule action
   * @param {Object} schedule - Schedule object
   * @param {string} phase - 'activate' or 'deactivate'
   * @returns {Object} Action result
   */
  executeAction(schedule, phase) {
    const action = phase === 'activate' ? schedule.activateAction : schedule.deactivateAction;
    const targetId = schedule.targetId;
    const targetType = schedule.targetType;

    // In a real implementation, this would call the appropriate engine
    // For now, we'll just log the action
    console.log(`[SchedulingSystem] Executing ${phase} action: ${action} on ${targetType} ${targetId}`);

    return {
      success: true,
      action,
      targetId,
      targetType,
      phase
    };
  }

  /**
   * Create next occurrence for recurring schedule
   * @param {Object} schedule - Original schedule
   * @returns {Object|null} New schedule or null
   */
  createNextOccurrence(schedule) {
    if (schedule.recurrence === RECURRENCE_TYPES.NONE) {
      return null;
    }

    if (schedule.recurrenceEndDate && now() >= schedule.recurrenceEndDate) {
      return null;
    }

    const nextStartTime = this.calculateNextStartTime(schedule);

    if (!nextStartTime) {
      return null;
    }

    const nextEndTime = schedule.endTime ? nextStartTime + (schedule.endTime - schedule.startTime) : null;

    const newSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: nextStartTime,
      endTime: nextEndTime,
      status: SCHEDULE_STATUS.PENDING,
      createdAt: now(),
      activatedAt: null,
      deactivatedAt: null,
      activatedBy: null,
      deactivatedBy: null
    };

    this.schedules.set(newSchedule.id, newSchedule);
    this.saveSchedules();

    return newSchedule;
  }

  /**
   * Calculate next start time for recurring schedule
   * @param {Object} schedule - Schedule object
   * @returns {number|null} Next start timestamp or null
   */
  calculateNextStartTime(schedule) {
    const currentStartTime = schedule.startTime;
    const interval = schedule.recurrenceInterval || 1;

    switch (schedule.recurrence) {
      case RECURRENCE_TYPES.DAILY:
        return currentStartTime + (24 * 60 * 60 * 1000 * interval);

      case RECURRENCE_TYPES.WEEKLY:
        return currentStartTime + (7 * 24 * 60 * 60 * 1000 * interval);

      case RECURRENCE_TYPES.BIWEEKLY:
        return currentStartTime + (14 * 24 * 60 * 60 * 1000 * interval);

      case RECURRENCE_TYPES.MONTHLY:
        return this.addMonths(currentStartTime, interval);

      case RECURRENCE_TYPES.YEARLY:
        return this.addYears(currentStartTime, interval);

      case RECURRENCE_TYPES.CUSTOM:
        // Custom recurrence would need more complex logic
        return null;

      default:
        return null;
    }
  }

  /**
   * Add months to timestamp
   * @param {number} timestamp - Base timestamp
   * @param {number} months - Months to add
   * @returns {number} New timestamp
   */
  addMonths(timestamp, months) {
    const date = new Date(timestamp);
    date.setMonth(date.getMonth() + months);
    return date.getTime();
  }

  /**
   * Add years to timestamp
   * @param {number} timestamp - Base timestamp
   * @param {number} years - Years to add
   * @returns {number} New timestamp
   */
  addYears(timestamp, years) {
    const date = new Date(timestamp);
    date.setFullYear(date.getFullYear() + years);
    return date.getTime();
  }

  /**
   * Manually activate schedule
   * @param {string} scheduleId - Schedule ID
   * @param {string} userId - User ID
   * @returns {Object} Result
   */
  manualActivate(scheduleId, userId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    const result = this.activateSchedule(scheduleId);

    if (result.success) {
      schedule.activatedBy = userId;
      this.schedules.set(scheduleId, schedule);
      this.saveSchedules();
    }

    return result;
  }

  /**
   * Manually deactivate schedule
   * @param {string} scheduleId - Schedule ID
   * @param {string} userId - User ID
   * @returns {Object} Result
   */
  manualDeactivate(scheduleId, userId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    const result = this.deactivateSchedule(scheduleId);

    if (result.success) {
      schedule.deactivatedBy = userId;
      this.schedules.set(scheduleId, schedule);
      this.saveSchedules();
    }

    return result;
  }

  /**
   * Cancel schedule
   * @param {string} scheduleId - Schedule ID
   * @param {string} userId - User ID
   * @returns {Object} Result
   */
  cancelSchedule(scheduleId, userId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    if (schedule.status === SCHEDULE_STATUS.COMPLETED || schedule.status === SCHEDULE_STATUS.CANCELLED) {
      return { success: false, reason: 'Schedule already completed or cancelled' };
    }

    // If schedule is active, deactivate it first
    if (schedule.status === SCHEDULE_STATUS.ACTIVE) {
      this.deactivateSchedule(scheduleId);
    }

    schedule.status = SCHEDULE_STATUS.CANCELLED;
    schedule.cancelledAt = now();
    schedule.cancelledBy = userId;

    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    this.activeScheduleIds.delete(scheduleId);

    return { success: true, schedule };
  }

  /**
   * Pause schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Object} Result
   */
  pauseSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    if (schedule.status !== SCHEDULE_STATUS.PENDING) {
      return { success: false, reason: 'Only pending schedules can be paused' };
    }

    schedule.status = SCHEDULE_STATUS.PAUSED;
    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    return { success: true, schedule };
  }

  /**
   * Resume paused schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Object} Result
   */
  resumeSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      return { success: false, reason: 'Schedule not found' };
    }

    if (schedule.status !== SCHEDULE_STATUS.PAUSED) {
      return { success: false, reason: 'Only paused schedules can be resumed' };
    }

    schedule.status = SCHEDULE_STATUS.PENDING;
    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    return { success: true, schedule };
  }

  /**
   * Get schedule by ID
   * @param {string} scheduleId - Schedule ID
   * @returns {Object|null} Schedule or null
   */
  getSchedule(scheduleId) {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Get all schedules
   * @returns {Array} Array of schedules
   */
  getAllSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Get schedules by type
   * @param {string} type - Schedule type
   * @returns {Array} Array of schedules
   */
  getSchedulesByType(type) {
    return this.getAllSchedules().filter(s => s.type === type);
  }

  /**
   * Get schedules by status
   * @param {string} status - Schedule status
   * @returns {Array} Array of schedules
   */
  getSchedulesByStatus(status) {
    return this.getAllSchedules().filter(s => s.status === status);
  }

  /**
   * Get active schedules
   * @returns {Array} Array of active schedules
   */
  getActiveSchedules() {
    return this.getAllSchedules().filter(s => s.status === SCHEDULE_STATUS.ACTIVE);
  }

  /**
   * Get pending schedules
   * @returns {Array} Array of pending schedules
   */
  getPendingSchedules() {
    return this.getAllSchedules().filter(s => s.status === SCHEDULE_STATUS.PENDING);
  }

  /**
   * Get schedules by target
   * @param {string} targetId - Target ID
   * @param {string} targetType - Target type
   * @returns {Array} Array of schedules
   */
  getSchedulesByTarget(targetId, targetType) {
    return this.getAllSchedules().filter(s => 
      s.targetId === targetId && s.targetType === targetType
    );
  }

  /**
   * Get schedules by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of schedules
   */
  getSchedulesByBranch(branchId) {
    return this.getAllSchedules().filter(s => 
      s.branches.length === 0 || s.branches.includes(branchId)
    );
  }

  /**
   * Update schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated schedule or null
   */
  updateSchedule(scheduleId, updates) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const updated = {
      ...schedule,
      ...updates,
      updatedAt: now()
    };

    this.schedules.set(scheduleId, updated);
    this.saveSchedules();

    return updated;
  }

  /**
   * Delete schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteSchedule(scheduleId) {
    const deleted = this.schedules.delete(scheduleId);
    if (deleted) {
      this.saveSchedules();
      this.activeScheduleIds.delete(scheduleId);
    }
    return deleted;
  }

  /**
   * Get schedule statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const schedules = this.getAllSchedules();

    return {
      totalSchedules: schedules.length,
      byType: schedules.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {}),
      byStatus: schedules.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {}),
      byRecurrence: schedules.reduce((acc, s) => {
        acc[s.recurrence] = (acc[s.recurrence] || 0) + 1;
        return acc;
      }, {}),
      activeSchedules: this.activeScheduleIds.size,
      upcoming: this.getPendingSchedules().length
    };
  }

  /**
   * Export schedules
   * @returns {Object} Exported schedules
   */
  exportSchedules() {
    return {
      schedules: Array.from(this.schedules.values()),
      exportedAt: now()
    };
  }

  /**
   * Import schedules
   * @param {Object} data - Imported schedules data
   * @returns {Object} Import result
   */
  importSchedules(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.schedules)) {
        data.schedules.forEach(schedule => {
          this.schedules.set(schedule.id, schedule);
        });
      }

      this.saveSchedules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let schedulingSystemInstance = null;

/**
 * Get the scheduling system singleton
 * @returns {SchedulingSystem} Scheduling system instance
 */
export function getSchedulingSystem() {
  if (!schedulingSystemInstance) {
    schedulingSystemInstance = new SchedulingSystem();
  }
  return schedulingSystemInstance;
}

/**
 * Reset the scheduling system (useful for testing)
 */
export function resetSchedulingSystem() {
  schedulingSystemInstance = null;
}

/**
 * Convenience function to create a schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Object} Created schedule
 */
export function createSchedule(scheduleData = {}) {
  const system = getSchedulingSystem();
  return system.createSchedule(scheduleData);
}
