// Shift Operations
// Shift management, cash handover, staff handover, supervisor approval

import { now } from '../domain/dates.js';
import { getTerminalManager } from './terminalManager.js';

const SHIFTS_KEY = 'cafeos_shifts';
const SHIFT_HANDOVERS_KEY = 'cafeos_shift_handovers';

/**
 * Shift Status
 */
export const SHIFT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

/**
 * Shift Types
 */
export const SHIFT_TYPES = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
  NIGHT: 'NIGHT',
  FULL_DAY: 'FULL_DAY',
  CUSTOM: 'CUSTOM'
};

/**
 * Shift Operations class
 * Shift management, cash handover, staff handover, supervisor approval
 */
export class ShiftOperations {
  constructor() {
    this.shifts = new Map();
    this.handovers = new Map();
    this.loadShifts();
    this.loadHandovers();
  }

  /**
   * Load shifts from localStorage
   */
  loadShifts() {
    try {
      const stored = localStorage.getItem(SHIFTS_KEY);
      if (stored) {
        const shifts = JSON.parse(stored);
        shifts.forEach(shift => {
          this.shifts.set(shift.id, shift);
        });
      }
    } catch (error) {
      console.error('[ShiftOperations] Failed to load shifts:', error);
    }
  }

  /**
   * Save shifts to localStorage
   */
  saveShifts() {
    try {
      const shifts = Array.from(this.shifts.values());
      localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
    } catch (error) {
      console.error('[ShiftOperations] Failed to save shifts:', error);
    }
  }

  /**
   * Load handovers from localStorage
   */
  loadHandovers() {
    try {
      const stored = localStorage.getItem(SHIFT_HANDOVERS_KEY);
      if (stored) {
        const handovers = JSON.parse(stored);
        handovers.forEach(handover => {
          this.handovers.set(handover.id, handover);
        });
      }
    } catch (error) {
      console.error('[ShiftOperations] Failed to load handovers:', error);
    }
  }

  /**
   * Save handovers to localStorage
   */
  saveHandovers() {
    try {
      const handovers = Array.from(this.handovers.values());
      localStorage.setItem(SHIFT_HANDOVERS_KEY, JSON.stringify(handovers));
    } catch (error) {
      console.error('[ShiftOperations] Failed to save handovers:', error);
    }
  }

  /**
   * Create a shift
   * @param {Object} shiftData - Shift data
   * @returns {Object} Created shift
   */
  createShift(shiftData) {
    const shift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: shiftData.name || 'Untitled Shift',
      
      // Type
      type: shiftData.type || SHIFT_TYPES.FULL_DAY,
      
      // Location
      branchId: shiftData.branchId || null,
      terminalId: shiftData.terminalId || null,
      
      // Staff
      staffId: shiftData.staffId || null,
      supervisorId: shiftData.supervisorId || null,
      
      // Schedule
      scheduledStartTime: shiftData.scheduledStartTime || null,
      scheduledEndTime: shiftData.scheduledEndTime || null,
      
      // Actual times
      actualStartTime: null,
      actualEndTime: null,
      
      // Status
      status: shiftData.status || SHIFT_STATUS.SCHEDULED,
      
      // Cash
      openingCash: shiftData.openingCash || 0,
      closingCash: null,
      expectedCash: null,
      cashVariance: null,
      
      // Performance
      ordersProcessed: 0,
      totalSales: 0,
      refunds: 0,
      voids: 0,
      discounts: 0,
      
      // Tasks
      outstandingOrders: 0,
      pendingBills: 0,
      unfinishedTasks: [],
      
      // Approval
      requiresApproval: shiftData.requiresApproval || false,
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      
      // Metadata
      metadata: shiftData.metadata || {},
      createdAt: now(),
      createdBy: shiftData.createdBy || null
    };

    this.shifts.set(shift.id, shift);
    this.saveShifts();

    return shift;
  }

  /**
   * Get shift by ID
   * @param {string} shiftId - Shift ID
   * @returns {Object|null} Shift or null
   */
  getShift(shiftId) {
    return this.shifts.get(shiftId) || null;
  }

  /**
   * Get all shifts
   * @returns {Array} Array of shifts
   */
  getAllShifts() {
    return Array.from(this.shifts.values());
  }

  /**
   * Get shifts by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of shifts
   */
  getShiftsByBranch(branchId) {
    return this.getAllShifts().filter(s => s.branchId === branchId);
  }

  /**
   * Get shifts by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of shifts
   */
  getShiftsByStaff(staffId) {
    return this.getAllShifts().filter(s => s.staffId === staffId);
  }

  /**
   * Get shifts by status
   * @param {string} status - Shift status
   * @returns {Array} Array of shifts
   */
  getShiftsByStatus(status) {
    return this.getAllShifts().filter(s => s.status === status);
  }

  /**
   * Get active shifts
   * @returns {Array} Array of active shifts
   */
  getActiveShifts() {
    return this.getAllShifts().filter(s => 
      s.status === SHIFT_STATUS.OPEN || s.status === SHIFT_STATUS.IN_PROGRESS
    );
  }

  /**
   * Open shift
   * @param {string} shiftId - Shift ID
   * @param {number} openingCash - Opening cash amount
   * @returns {Object} Result
   */
  openShift(shiftId, openingCash = 0) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status !== SHIFT_STATUS.SCHEDULED) {
      return { success: false, reason: `Shift is ${shift.status.toLowerCase()}` };
    }

    shift.status = SHIFT_STATUS.OPEN;
    shift.actualStartTime = now();
    shift.openingCash = openingCash;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Start shift (begin operations)
   * @param {string} shiftId - Shift ID
   * @returns {Object} Result
   */
  startShift(shiftId) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status !== SHIFT_STATUS.OPEN) {
      return { success: false, reason: `Shift is ${shift.status.toLowerCase()}` };
    }

    shift.status = SHIFT_STATUS.IN_PROGRESS;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Begin closing shift
   * @param {string} shiftId - Shift ID
   * @returns {Object} Result
   */
  beginClosingShift(shiftId) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status !== SHIFT_STATUS.IN_PROGRESS) {
      return { success: false, reason: `Shift is ${shift.status.toLowerCase()}` };
    }

    shift.status = SHIFT_STATUS.CLOSING;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Close shift
   * @param {string} shiftId - Shift ID
   * @param {number} closingCash - Closing cash amount
   * @param {Object} summary - Shift summary
   * @returns {Object} Result
   */
  closeShift(shiftId, closingCash, summary = {}) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status !== SHIFT_STATUS.CLOSING && shift.status !== SHIFT_STATUS.IN_PROGRESS) {
      return { success: false, reason: `Shift is ${shift.status.toLowerCase()}` };
    }

    shift.status = SHIFT_STATUS.CLOSED;
    shift.actualEndTime = now();
    shift.closingCash = closingCash;
    shift.expectedCash = shift.openingCash + shift.totalSales;
    shift.cashVariance = closingCash - shift.expectedCash;

    // Update summary
    if (summary.ordersProcessed !== undefined) shift.ordersProcessed = summary.ordersProcessed;
    if (summary.totalSales !== undefined) shift.totalSales = summary.totalSales;
    if (summary.refunds !== undefined) shift.refunds = summary.refunds;
    if (summary.voids !== undefined) shift.voids = summary.voids;
    if (summary.discounts !== undefined) shift.discounts = summary.discounts;
    if (summary.outstandingOrders !== undefined) shift.outstandingOrders = summary.outstandingOrders;
    if (summary.pendingBills !== undefined) shift.pendingBills = summary.pendingBills;
    if (summary.unfinishedTasks !== undefined) shift.unfinishedTasks = summary.unfinishedTasks;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Cancel shift
   * @param {string} shiftId - Shift ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Result
   */
  cancelShift(shiftId, reason = '') {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status === SHIFT_STATUS.CLOSED) {
      return { success: false, reason: 'Cannot close a closed shift' };
    }

    shift.status = SHIFT_STATUS.CANCELLED;
    shift.cancellationReason = reason;
    shift.cancelledAt = now();

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Update shift
   * @param {string} shiftId - Shift ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated shift or null
   */
  updateShift(shiftId, updates) {
    const shift = this.shifts.get(shiftId);
    if (!shift) return null;

    const updated = {
      ...shift,
      ...updates,
      updatedAt: now()
    };

    this.shifts.set(shiftId, updated);
    this.saveShifts();

    return updated;
  }

  /**
   * Record order in shift
   * @param {string} shiftId - Shift ID
   * @param {number} amount - Order amount
   * @returns {Object} Result
   */
  recordOrder(shiftId, amount) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    shift.ordersProcessed++;
    shift.totalSales += amount;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Record refund in shift
   * @param {string} shiftId - Shift ID
   * @param {number} amount - Refund amount
   * @returns {Object} Result
   */
  recordRefund(shiftId, amount) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    shift.refunds++;
    shift.totalSales -= amount;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Record void in shift
   * @param {string} shiftId - Shift ID
   * @returns {Object} Result
   */
  recordVoid(shiftId) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    shift.voids++;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Record discount in shift
   * @param {string} shiftId - Shift ID
   * @returns {Object} Result
   */
  recordDiscount(shiftId) {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    shift.discounts++;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Create cash handover
   * @param {Object} handoverData - Handover data
   * @returns {Object} Created handover
   */
  createCashHandover(handoverData) {
    const handover = {
      id: `handover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // From/To
      fromShiftId: handoverData.fromShiftId || null,
      toShiftId: handoverData.toShiftId || null,
      fromStaffId: handoverData.fromStaffId || null,
      toStaffId: handoverData.toStaffId || null,
      
      // Cash
      cashAmount: handoverData.cashAmount || 0,
      cashBreakdown: handoverData.cashBreakdown || {},
      
      // Status
      status: 'PENDING',
      
      // Approval
      requiresApproval: handoverData.requiresApproval || true,
      approvedBy: null,
      approvedAt: null,
      
      // Timestamps
      createdAt: now(),
      completedAt: null,
      
      // Notes
      notes: handoverData.notes || '',
      
      // Metadata
      metadata: handoverData.metadata || {}
    };

    this.handovers.set(handover.id, handover);
    this.saveHandovers();

    return handover;
  }

  /**
   * Create staff handover
   * @param {Object} handoverData - Handover data
   * @returns {Object} Created handover
   */
  createStaffHandover(handoverData) {
    const handover = {
      id: `handover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'STAFF',
      
      // From/To
      fromShiftId: handoverData.fromShiftId || null,
      toShiftId: handoverData.toShiftId || null,
      fromStaffId: handoverData.fromStaffId || null,
      toStaffId: handoverData.toStaffId || null,
      
      // Handover items
      outstandingOrders: handoverData.outstandingOrders || 0,
      pendingBills: handoverData.pendingBills || 0,
      unfinishedTasks: handoverData.unfinishedTasks || [],
      notes: handoverData.notes || '',
      
      // Status
      status: 'PENDING',
      
      // Approval
      requiresApproval: handoverData.requiresApproval || true,
      approvedBy: null,
      approvedAt: null,
      
      // Timestamps
      createdAt: now(),
      completedAt: null,
      
      // Metadata
      metadata: handoverData.metadata || {}
    };

    this.handovers.set(handover.id, handover);
    this.saveHandovers();

    return handover;
  }

  /**
   * Get handover by ID
   * @param {string} handoverId - Handover ID
   * @returns {Object|null} Handover or null
   */
  getHandover(handoverId) {
    return this.handovers.get(handoverId) || null;
  }

  /**
   * Get all handovers
   * @returns {Array} Array of handovers
   */
  getAllHandovers() {
    return Array.from(this.handovers.values());
  }

  /**
   * Get handovers by shift
   * @param {string} shiftId - Shift ID
   * @returns {Array} Array of handovers
   */
  getHandoversByShift(shiftId) {
    return this.getAllHandovers().filter(h => 
      h.fromShiftId === shiftId || h.toShiftId === shiftId
    );
  }

  /**
   * Get pending handovers
   * @returns {Array} Array of pending handovers
   */
  getPendingHandovers() {
    return this.getAllHandovers().filter(h => h.status === 'PENDING');
  }

  /**
   * Approve handover
   * @param {string} handoverId - Handover ID
   * @param {string} supervisorId - Supervisor ID
   * @param {string} notes - Approval notes
   * @returns {Object} Result
   */
  approveHandover(handoverId, supervisorId, notes = '') {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      return { success: false, reason: 'Handover not found' };
    }

    if (handover.status !== 'PENDING') {
      return { success: false, reason: `Handover is ${handover.status.toLowerCase()}` };
    }

    handover.status = 'APPROVED';
    handover.approvedBy = supervisorId;
    handover.approvedAt = now();
    handover.approvalNotes = notes;

    this.handovers.set(handoverId, handover);
    this.saveHandovers();

    return { success: true, handover };
  }

  /**
   * Complete handover
   * @param {string} handoverId - Handover ID
   * @returns {Object} Result
   */
  completeHandover(handoverId) {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      return { success: false, reason: 'Handover not found' };
    }

    if (handover.status !== 'APPROVED') {
      return { success: false, reason: `Handover is ${handover.status.toLowerCase()}` };
    }

    handover.status = 'COMPLETED';
    handover.completedAt = now();

    this.handovers.set(handoverId, handover);
    this.saveHandovers();

    return { success: true, handover };
  }

  /**
   * Approve shift closing
   * @param {string} shiftId - Shift ID
   * @param {string} supervisorId - Supervisor ID
   * @param {string} notes - Approval notes
   * @returns {Object} Result
   */
  approveShiftClosing(shiftId, supervisorId, notes = '') {
    const shift = this.shifts.get(shiftId);
    if (!shift) {
      return { success: false, reason: 'Shift not found' };
    }

    if (shift.status !== SHIFT_STATUS.CLOSED) {
      return { success: false, reason: `Shift is ${shift.status.toLowerCase()}` };
    }

    shift.approvedBy = supervisorId;
    shift.approvedAt = now();
    shift.approvalNotes = notes;

    this.shifts.set(shiftId, shift);
    this.saveShifts();

    return { success: true, shift };
  }

  /**
   * Get shift summary
   * @param {string} shiftId - Shift ID
   * @returns {Object} Shift summary
   */
  getShiftSummary(shiftId) {
    const shift = this.getShift(shiftId);
    if (!shift) return null;

    const duration = shift.actualStartTime && shift.actualEndTime
      ? shift.actualEndTime - shift.actualStartTime
      : null;

    return {
      shiftId: shift.id,
      shiftName: shift.name,
      staffId: shift.staffId,
      status: shift.status,
      
      // Time
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      actualStartTime: shift.actualStartTime,
      actualEndTime: shift.actualEndTime,
      duration,
      
      // Cash
      openingCash: shift.openingCash,
      closingCash: shift.closingCash,
      expectedCash: shift.expectedCash,
      cashVariance: shift.cashVariance,
      
      // Performance
      ordersProcessed: shift.ordersProcessed,
      totalSales: shift.totalSales,
      refunds: shift.refunds,
      voids: shift.voids,
      discounts: shift.discounts,
      
      // Tasks
      outstandingOrders: shift.outstandingOrders,
      pendingBills: shift.pendingBills,
      unfinishedTasks: shift.unfinishedTasks,
      
      // Approval
      requiresApproval: shift.requiresApproval,
      approvedBy: shift.approvedBy,
      approvedAt: shift.approvedAt,
      approvalNotes: shift.approvalNotes
    };
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const shifts = this.getAllShifts();
    const handovers = this.getAllHandovers();

    return {
      totalShifts: shifts.length,
      byStatus: shifts.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {}),
      byType: shifts.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {}),
      activeShifts: this.getActiveShifts().length,
      totalHandovers: handovers.length,
      pendingHandovers: this.getPendingHandovers().length,
      totalSales: shifts.reduce((sum, s) => sum + s.totalSales, 0),
      totalOrders: shifts.reduce((sum, s) => sum + s.ordersProcessed, 0)
    };
  }

  /**
   * Export shifts
   * @returns {Object} Exported shifts
   */
  exportShifts() {
    return {
      shifts: Array.from(this.shifts.values()),
      handovers: Array.from(this.handovers.values()),
      exportedAt: now()
    };
  }

  /**
   * Import shifts
   * @param {Object} data - Imported shifts data
   * @returns {Object} Import result
   */
  importShifts(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.shifts)) {
        data.shifts.forEach(shift => {
          this.shifts.set(shift.id, shift);
        });
      }

      if (Array.isArray(data.handovers)) {
        data.handovers.forEach(handover => {
          this.handovers.set(handover.id, handover);
        });
      }

      this.saveShifts();
      this.saveHandovers();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let shiftOperationsInstance = null;

/**
 * Get the shift operations singleton
 * @returns {ShiftOperations} Shift operations instance
 */
export function getShiftOperations() {
  if (!shiftOperationsInstance) {
    shiftOperationsInstance = new ShiftOperations();
  }
  return shiftOperationsInstance;
}

/**
 * Reset the shift operations (useful for testing)
 */
export function resetShiftOperations() {
  shiftOperationsInstance = null;
}

/**
 * Convenience function to create a shift
 * @param {Object} shiftData - Shift data
 * @returns {Object} Created shift
 */
export function createShift(shiftData = {}) {
  const operations = getShiftOperations();
  return operations.createShift(shiftData);
}

/**
 * Convenience function to open a shift
 * @param {string} shiftId - Shift ID
 * @param {number} openingCash - Opening cash amount
 * @returns {Object} Result
 */
export function openShift(shiftId, openingCash = 0) {
  const operations = getShiftOperations();
  return operations.openShift(shiftId, openingCash);
}
