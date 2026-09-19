// GST Email Scheduling Service

import { createGSTReportSchedule } from '../domain/gstModel.js';
import { REPORT_TYPES, REPORT_FREQUENCIES } from '../data/gstConstants.js';
import { now } from '../domain/dates.js';

/**
 * GST Email Scheduling Service
 * Manages automated email delivery of GST reports
 */

class GSTEmailService {
  constructor() {
    this.schedules = [];
    this.loadSchedules();
  }

  /**
   * Load schedules from localStorage
   */
  loadSchedules() {
    try {
      const stored = localStorage.getItem('gst_report_schedules');
      if (stored) {
        this.schedules = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load GST report schedules:', error);
      this.schedules = [];
    }
  }

  /**
   * Save schedules to localStorage
   */
  saveSchedules() {
    try {
      localStorage.setItem('gst_report_schedules', JSON.stringify(this.schedules));
    } catch (error) {
      console.error('Failed to save GST report schedules:', error);
    }
  }

  /**
   * Create a new report schedule
   * @param {object} config - Schedule configuration
   * @returns {object} Created schedule
   */
  createSchedule(config) {
    const schedule = createGSTReportSchedule({
      reportType: config.reportType,
      frequency: config.frequency,
      recipientEmails: config.recipientEmails,
      branchId: config.branchId,
      active: config.active !== false,
      filters: config.filters || {}
    });

    this.schedules.push(schedule);
    this.saveSchedules();
    return schedule;
  }

  /**
   * Update an existing schedule
   * @param {string} scheduleId - Schedule ID
   * @param {object} updates - Updates to apply
   * @returns {object|null} Updated schedule or null if not found
   */
  updateSchedule(scheduleId, updates) {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return null;

    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
      updatedAt: now()
    };

    this.saveSchedules();
    return this.schedules[index];
  }

  /**
   * Delete a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {boolean} True if deleted
   */
  deleteSchedule(scheduleId) {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return false;

    this.schedules.splice(index, 1);
    this.saveSchedules();
    return true;
  }

  /**
   * Get all schedules
   * @returns {Array} All schedules
   */
  getAllSchedules() {
    return this.schedules;
  }

  /**
   * Get active schedules
   * @returns {Array} Active schedules
   */
  getActiveSchedules() {
    return this.schedules.filter(s => s.active);
  }

  /**
   * Get schedules by report type
   * @param {string} reportType - Report type
   * @returns {Array} Matching schedules
   */
  getSchedulesByType(reportType) {
    return this.schedules.filter(s => s.reportType === reportType);
  }

  /**
   * Get schedules by frequency
   * @param {string} frequency - Frequency
   * @returns {Array} Matching schedules
   */
  getSchedulesByFrequency(frequency) {
    return this.schedules.filter(s => s.frequency === frequency);
  }

  /**
   * Check if any schedules are due for sending
   * @returns {Array} Due schedules
   */
  checkDueSchedules() {
    const nowTime = now();
    return this.schedules.filter(s => 
      s.active && 
      s.nextSend && 
      new Date(s.nextSend).getTime() <= nowTime
    );
  }

  /**
   * Mark a schedule as sent
   * @param {string} scheduleId - Schedule ID
   * @returns {object|null} Updated schedule or null if not found
   */
  markAsSent(scheduleId) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return null;

    // Calculate next send time based on frequency
    const nextSend = this.calculateNextSend(schedule.frequency);

    return this.updateSchedule(scheduleId, {
      lastSent: now(),
      nextSend: nextSend.toISOString()
    });
  }

  /**
   * Calculate next send time based on frequency
   * @param {string} frequency - Frequency
   * @returns {Date} Next send date
   */
  calculateNextSend(frequency) {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case REPORT_FREQUENCIES.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case REPORT_FREQUENCIES.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case REPORT_FREQUENCIES.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case REPORT_FREQUENCIES.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Simulate sending a report email
   * In production, this would integrate with an email service
   * @param {object} schedule - Schedule to send
   * @param {object} reportData - Report data to send
   * @returns {Promise<boolean>} True if sent successfully
   */
  async sendReportEmail(schedule, reportData) {
    // Simulate email sending
    console.log('Sending GST report email:', {
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      recipients: schedule.recipientEmails,
      branchId: schedule.branchId,
      timestamp: new Date().toISOString()
    });

    // In production, this would call an email API
    // Example: await emailService.send({ to: schedule.recipientEmails, subject: ..., html: ... })

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Process due schedules (send emails)
   * @param {Function} getReportData - Function to get report data
   * @returns {Promise<Array>} Results of processing
   */
  async processDueSchedules(getReportData) {
    const dueSchedules = this.checkDueSchedules();
    const results = [];

    for (const schedule of dueSchedules) {
      try {
        // Get report data
        const reportData = await getReportData(schedule.reportType, schedule.filters);
        
        // Send email
        const sent = await this.sendReportEmail(schedule, reportData);
        
        if (sent) {
          this.markAsSent(schedule.id);
          results.push({ scheduleId: schedule.id, success: true });
        } else {
          results.push({ scheduleId: schedule.id, success: false, error: 'Email failed' });
        }
      } catch (error) {
        console.error('Failed to process schedule:', schedule.id, error);
        results.push({ scheduleId: schedule.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Generate email content for a report
   * @param {string} reportType - Report type
   * @param {object} reportData - Report data
   * @returns {object} Email content { subject, html, text }
   */
  generateEmailContent(reportType, reportData) {
    const subject = `GST Report: ${reportType} - ${new Date().toLocaleDateString()}`;
    
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background: #f0f0f0; padding: 20px; }
            .content { padding: 20px; }
            .footer { background: #f0f0f0; padding: 10px; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GST Report: ${reportType}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
          </div>
          <div class="footer">
            <p>This is an automated email from your Bakery POS system.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
GST Report: ${reportType}
Generated on: ${new Date().toLocaleString()}

${JSON.stringify(reportData, null, 2)}

---
This is an automated email from your Bakery POS system.
    `;

    return { subject, html, text };
  }

  /**
   * Validate email addresses
   * @param {string[]} emails - Email addresses to validate
   * @returns {boolean} True if all valid
   */
  validateEmails(emails) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return Array.isArray(emails) && emails.every(email => emailRegex.test(email));
  }

  /**
   * Get schedule statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      total: this.schedules.length,
      active: this.schedules.filter(s => s.active).length,
      inactive: this.schedules.filter(s => !s.active).length,
      byType: this.schedules.reduce((acc, s) => {
        acc[s.reportType] = (acc[s.reportType] || 0) + 1;
        return acc;
      }, {}),
      byFrequency: this.schedules.reduce((acc, s) => {
        acc[s.frequency] = (acc[s.frequency] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Export singleton instance
export const gstEmailService = new GSTEmailService();
export default gstEmailService;
