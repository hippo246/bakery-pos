// Backup Scheduler
// Handles automated backup scheduling with retry logic
// Supports hourly, daily, weekly, monthly, and custom schedules

import backupEngine from './BackupEngine.js';

/**
 * Backup Scheduler
 * Manages automated backup schedules and execution
 * Supports retry logic and failure recovery
 */
class BackupScheduler {
  constructor() {
    this.initialized = false;
    this.schedules = new Map();
    this.activeSchedules = new Set();
    this.retryQueue = [];
    this.isProcessingQueue = false;
    this.schedulerInterval = null;
  }

  /**
   * Initialize the backup scheduler
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize backup engine
    await backupEngine.initialize();
    
    // Load saved schedules
    await this.loadSchedules();
    
    // Start scheduler
    this.startScheduler();
    
    this.initialized = true;
  }

  /**
   * Load saved schedules from localStorage
   */
  async loadSchedules() {
    try {
      const savedSchedules = localStorage.getItem('cafeos_backup_schedules');
      if (savedSchedules) {
        const schedules = JSON.parse(savedSchedules);
        for (const [id, schedule] of Object.entries(schedules)) {
          this.schedules.set(id, schedule);
          if (schedule.enabled) {
            this.activeSchedules.add(id);
          }
        }
      }
    } catch (error) {
      console.error('[BackupScheduler] Failed to load schedules:', error);
    }
  }

  /**
   * Save schedules to localStorage
   */
  async saveSchedules() {
    try {
      const schedulesObj = {};
      for (const [id, schedule] of this.schedules.entries()) {
        schedulesObj[id] = schedule;
      }
      localStorage.setItem('cafeos_backup_schedules', JSON.stringify(schedulesObj));
    } catch (error) {
      console.error('[BackupScheduler] Failed to save schedules:', error);
    }
  }

  /**
   * Start the scheduler
   */
  startScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check every minute for due backups
    this.schedulerInterval = setInterval(() => {
      this.checkDueBackups();
    }, 60000); // 1 minute
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  /**
   * Check for due backups
   */
  async checkDueBackups() {
    const now = new Date();
    
    for (const scheduleId of this.activeSchedules) {
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule || !schedule.enabled) {
        continue;
      }

      if (this.isBackupDue(schedule, now)) {
        await this.executeBackup(scheduleId);
      }
    }
  }

  /**
   * Check if a backup is due
   * @param {object} schedule 
   * @param {Date} now 
   * @returns {boolean}
   */
  isBackupDue(schedule, now) {
    const lastBackup = schedule.lastBackup ? new Date(schedule.lastBackup) : null;
    
    switch (schedule.frequency) {
      case 'hourly':
        if (!lastBackup) return true;
        {
          const hoursSinceLast = (now - lastBackup) / (1000 * 60 * 60);
          return hoursSinceLast >= 1;
        }
      
      case 'daily':
        if (!lastBackup) return true;
        {
          const daysSinceLast = (now - lastBackup) / (1000 * 60 * 60 * 24);
          return daysSinceLast >= 1;
        }
      
      case 'weekly':
        if (!lastBackup) return true;
        {
          const weeksSinceLast = (now - lastBackup) / (1000 * 60 * 60 * 24 * 7);
          return weeksSinceLast >= 1;
        }
      
      case 'monthly':
        if (!lastBackup) return true;
        {
          const monthsSinceLast = (now - lastBackup) / (1000 * 60 * 60 * 24 * 30);
          return monthsSinceLast >= 1;
        }
      
      case 'custom':
        if (!schedule.customInterval) return false;
        if (!lastBackup) return true;
        {
          const customSinceLast = (now - lastBackup) / (1000 * 60 * schedule.customInterval);
          return customSinceLast >= 1;
        }
      
      default:
        return false;
    }
  }

  /**
   * Execute a backup
   * @param {string} scheduleId 
   */
  async executeBackup(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    
    if (!schedule) {
      console.error(`[BackupScheduler] Schedule ${scheduleId} not found`);
      return;
    }

    try {
      // Create backup
      const result = await backupEngine.createBackup({
        modules: schedule.modules,
        compress: schedule.compress,
        encrypt: schedule.encrypt,
        description: schedule.description,
        createdBy: 'scheduler'
      });

      if (result.success) {
        // Update last backup time
        schedule.lastBackup = new Date().toISOString();
        schedule.lastBackupId = result.backupId;
        schedule.successCount = (schedule.successCount || 0) + 1;
        schedule.failureCount = 0;
        
        await this.saveSchedules();
        
        // Log success
        await this.logScheduleOperation('backup_success', scheduleId, result);
      } else {
        // Handle failure
        schedule.failureCount = (schedule.failureCount || 0) + 1;
        
        // Add to retry queue if within retry limit
        if (schedule.failureCount <= (schedule.maxRetries || 3)) {
          this.retryQueue.push({
            scheduleId,
            timestamp: Date.now(),
            retryAt: Date.now() + (schedule.retryDelay || 5) * 60 * 1000 // Default 5 minutes
          });
        }
        
        await this.saveSchedules();
        
        // Log failure
        await this.logScheduleOperation('backup_failed', scheduleId, { error: result.error });
      }
    } catch (error) {
      console.error(`[BackupScheduler] Backup execution failed for ${scheduleId}:`, error);
      
      schedule.failureCount = (schedule.failureCount || 0) + 1;
      await this.saveSchedules();
      
      await this.logScheduleOperation('backup_error', scheduleId, { error: error.message });
    }
  }

  /**
   * Create a new schedule
   * @param {object} scheduleConfig 
   * @returns {Promise<{success: boolean, scheduleId?: string, error?: string}>}
   */
  async createSchedule(scheduleConfig) {
    try {
      const scheduleId = `schedule_${Date.now()}`;
      
      const schedule = {
        id: scheduleId,
        name: scheduleConfig.name || 'Untitled Schedule',
        frequency: scheduleConfig.frequency || 'daily',
        customInterval: scheduleConfig.customInterval,
        modules: scheduleConfig.modules || ['all'],
        compress: scheduleConfig.compress !== false,
        encrypt: scheduleConfig.encrypt || false,
        description: scheduleConfig.description || '',
        enabled: scheduleConfig.enabled !== false,
        maxRetries: scheduleConfig.maxRetries || 3,
        retryDelay: scheduleConfig.retryDelay || 5,
        createdAt: new Date().toISOString(),
        lastBackup: null,
        lastBackupId: null,
        successCount: 0,
        failureCount: 0
      };

      this.schedules.set(scheduleId, schedule);
      
      if (schedule.enabled) {
        this.activeSchedules.add(scheduleId);
      }
      
      await this.saveSchedules();
      
      await this.logScheduleOperation('schedule_created', scheduleId);
      
      return { success: true, scheduleId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a schedule
   * @param {string} scheduleId 
   * @param {object} updates 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateSchedule(scheduleId, updates) {
    try {
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      // Apply updates
      Object.assign(schedule, updates);
      
      // Update active set
      if (updates.enabled !== undefined) {
        if (updates.enabled) {
          this.activeSchedules.add(scheduleId);
        } else {
          this.activeSchedules.delete(scheduleId);
        }
      }
      
      await this.saveSchedules();
      
      await this.logScheduleOperation('schedule_updated', scheduleId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a schedule
   * @param {string} scheduleId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteSchedule(scheduleId) {
    try {
      this.schedules.delete(scheduleId);
      this.activeSchedules.delete(scheduleId);
      
      await this.saveSchedules();
      
      await this.logScheduleOperation('schedule_deleted', scheduleId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable a schedule
   * @param {string} scheduleId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async enableSchedule(scheduleId) {
    return await this.updateSchedule(scheduleId, { enabled: true });
  }

  /**
   * Disable a schedule
   * @param {string} scheduleId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async disableSchedule(scheduleId) {
    return await this.updateSchedule(scheduleId, { enabled: false });
  }

  /**
   * Run a schedule immediately
   * @param {string} scheduleId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async runScheduleNow(scheduleId) {
    try {
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      await this.executeBackup(scheduleId);
      
      await this.logScheduleOperation('schedule_run_now', scheduleId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a schedule
   * @param {string} scheduleId 
   * @returns {object|null}
   */
  getSchedule(scheduleId) {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Get all schedules
   * @returns {Array}
   */
  getAllSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Get active schedules
   * @returns {Array}
   */
  getActiveSchedules() {
    return Array.from(this.activeSchedules)
      .map(id => this.schedules.get(id))
      .filter(schedule => schedule !== null);
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.isProcessingQueue || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const now = Date.now();

    for (const item of this.retryQueue) {
      if (now >= item.retryAt) {
        await this.executeBackup(item.scheduleId);
        // Remove from queue
        this.retryQueue = this.retryQueue.filter(i => i !== item);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Log schedule operation
   * @param {string} operation 
   * @param {string} scheduleId 
   * @param {object} details 
   */
  async logScheduleOperation(operation, scheduleId, details = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_scheduler_logs') || '[]');
      logs.push({
        operation,
        scheduleId,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_backup_scheduler_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[BackupScheduler] Failed to log operation:', error);
    }
  }

  /**
   * Get scheduler logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_scheduler_logs') || '[]');
      
      let filtered = logs;
      
      if (options.operation) {
        filtered = filtered.filter(log => log.operation === options.operation);
      }
      
      if (options.scheduleId) {
        filtered = filtered.filter(log => log.scheduleId === options.scheduleId);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch {
      return [];
    }
  }

  /**
   * Get scheduler statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const schedules = Array.from(this.schedules.values());
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_scheduler_logs') || '[]');
      
      const stats = {
        totalSchedules: schedules.length,
        activeSchedules: this.activeSchedules.size,
        totalBackups: schedules.reduce((sum, s) => sum + (s.successCount || 0), 0),
        totalFailures: schedules.reduce((sum, s) => sum + (s.failureCount || 0), 0),
        byFrequency: {},
        retryQueueSize: this.retryQueue.length,
        recent: logs.slice(-10)
      };
      
      for (const schedule of schedules) {
        stats.byFrequency[schedule.frequency] = (stats.byFrequency[schedule.frequency] || 0) + 1;
      }
      
      return stats;
    } catch {
      return {
        totalSchedules: 0,
        activeSchedules: 0,
        totalBackups: 0,
        totalFailures: 0,
        byFrequency: {},
        retryQueueSize: 0,
        recent: []
      };
    }
  }
}

// Singleton instance
const backupScheduler = new BackupScheduler();

export default backupScheduler;
