// Operational Broadcasts
// Manager broadcasts to terminals, kitchen, waiters, cashiers, managers

import { now } from '../domain/dates.js';

const BROADCASTS_KEY = 'cafeos_broadcasts';

/**
 * Broadcast Target Types
 */
export const BROADCAST_TARGETS = {
  ENTIRE_BRANCH: 'ENTIRE_BRANCH',
  SPECIFIC_TERMINAL: 'SPECIFIC_TERMINAL',
  KITCHEN: 'KITCHEN',
  WAITERS: 'WAITERS',
  CASHIERS: 'CASHIERS',
  MANAGERS: 'MANAGERS',
  ALL_STAFF: 'ALL_STAFF',
  CUSTOM_ROLE: 'CUSTOM_ROLE'
};

/**
 * Broadcast Priority
 */
export const BROADCAST_PRIORITY = {
  INFO: 'INFO',
  IMPORTANT: 'IMPORTANT',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY'
};

/**
 * Broadcast Status
 */
export const BROADCAST_STATUS = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  DISMISSED: 'DISMISSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

/**
 * Broadcast System class
 * Manager broadcasts to terminals, kitchen, waiters, cashiers, managers
 */
export class BroadcastSystem {
  constructor() {
    this.broadcasts = new Map();
    this.acknowledgments = new Map();
    this.loadBroadcasts();
    this.loadAcknowledgments();
  }

  /**
   * Load broadcasts from localStorage
   */
  loadBroadcasts() {
    try {
      const stored = localStorage.getItem(BROADCASTS_KEY);
      if (stored) {
        const broadcasts = JSON.parse(stored);
        broadcasts.forEach(broadcast => {
          this.broadcasts.set(broadcast.id, broadcast);
        });
      }
    } catch (error) {
      console.error('[BroadcastSystem] Failed to load broadcasts:', error);
    }
  }

  /**
   * Save broadcasts to localStorage
   */
  saveBroadcasts() {
    try {
      const broadcasts = Array.from(this.broadcasts.values());
      localStorage.setItem(BROADCASTS_KEY, JSON.stringify(broadcasts));
    } catch (error) {
      console.error('[BroadcastSystem] Failed to save broadcasts:', error);
    }
  }

  /**
   * Load acknowledgments from localStorage
   */
  loadAcknowledgments() {
    try {
      const stored = localStorage.getItem('cafeos_broadcast_acknowledgments');
      if (stored) {
        const acknowledgments = JSON.parse(stored);
        acknowledgments.forEach(ack => {
          this.acknowledgments.set(ack.id, ack);
        });
      }
    } catch (error) {
      console.error('[BroadcastSystem] Failed to load acknowledgments:', error);
    }
  }

  /**
   * Save acknowledgments to localStorage
   */
  saveAcknowledgments() {
    try {
      const acknowledgments = Array.from(this.acknowledgments.values());
      localStorage.setItem('cafeos_broadcast_acknowledgments', JSON.stringify(acknowledgments));
    } catch (error) {
      console.error('[BroadcastSystem] Failed to save acknowledgments:', error);
    }
  }

  /**
   * Create a broadcast
   * @param {Object} broadcastData - Broadcast data
   * @returns {Object} Created broadcast
   */
  createBroadcast(broadcastData) {
    const broadcast = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Content
      title: broadcastData.title || 'Untitled Broadcast',
      message: broadcastData.message || '',
      type: broadcastData.type || BROADCAST_TARGETS.ENTIRE_BRANCH,
      
      // Targeting
      branchId: broadcastData.branchId || null,
      targetTerminalId: broadcastData.targetTerminalId || null,
      targetRole: broadcastData.targetRole || null,
      targetStaffIds: broadcastData.targetStaffIds || [],
      
      // Priority & Status
      priority: broadcastData.priority || BROADCAST_PRIORITY.INFO,
      status: BROADCAST_STATUS.ACTIVE,
      
      // Timing
      createdAt: now(),
      createdBy: broadcastData.createdBy || null,
      expiresAt: broadcastData.expiresAt || null,
      
      // Acknowledgment
      requiresAcknowledgment: broadcastData.requiresAcknowledgment || false,
      acknowledgmentCount: 0,
      requiredAcknowledgments: broadcastData.requiredAcknowledgments || 0,
      
      // Metadata
      metadata: broadcastData.metadata || {}
    };

    this.broadcasts.set(broadcast.id, broadcast);
    this.saveBroadcasts();

    return broadcast;
  }

  /**
   * Get broadcast by ID
   * @param {string} broadcastId - Broadcast ID
   * @returns {Object|null} Broadcast or null
   */
  getBroadcast(broadcastId) {
    return this.broadcasts.get(broadcastId) || null;
  }

  /**
   * Get all broadcasts
   * @returns {Array} Array of broadcasts
   */
  getAllBroadcasts() {
    return Array.from(this.broadcasts.values());
  }

  /**
   * Get broadcasts by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of broadcasts
   */
  getBroadcastsByBranch(branchId) {
    return this.getAllBroadcasts().filter(b => b.branchId === branchId);
  }

  /**
   * Get broadcasts by status
   * @param {string} status - Broadcast status
   * @returns {Array} Array of broadcasts
   */
  getBroadcastsByStatus(status) {
    return this.getAllBroadcasts().filter(b => b.status === status);
  }

  /**
   * Get active broadcasts
   * @returns {Array} Array of active broadcasts
   */
  getActiveBroadcasts() {
    const currentTime = now();
    return this.getAllBroadcasts().filter(b => 
      b.status === BROADCAST_STATUS.ACTIVE && 
      (!b.expiresAt || currentTime < b.expiresAt)
    );
  }

  /**
   * Get broadcasts for target
   * @param {Object} target - Target filter
   * @returns {Array} Array of broadcasts
   */
  getBroadcastsForTarget(target) {
    const currentTime = now();
    
    return this.getAllBroadcasts().filter(b => {
      // Check expiration
      if (b.expiresAt && currentTime >= b.expiresAt) return false;
      
      // Check status
      if (b.status !== BROADCAST_STATUS.ACTIVE) return false;

      // Check branch
      if (b.branchId && target.branchId && b.branchId !== target.branchId) return false;

      // Check terminal
      if (b.type === BROADCAST_TARGETS.SPECIFIC_TERMINAL) {
        if (b.targetTerminalId && target.terminalId && b.targetTerminalId !== target.terminalId) return false;
      }

      // Check role
      if (b.type === BROADCAST_TARGETS.KITCHEN && target.role !== 'KITCHEN') return false;
      if (b.type === BROADCAST_TARGETS.WAITERS && target.role !== 'WAITER') return false;
      if (b.type === BROADCAST_TARGETS.CASHIERS && target.role !== 'CASHIER') return false;
      if (b.type === BROADCAST_TARGETS.MANAGERS && target.role !== 'MANAGER') return false;

      // Check custom role
      if (b.type === BROADCAST_TARGETS.CUSTOM_ROLE && b.targetRole && target.role !== b.targetRole) return false;

      // Check specific staff
      if (b.targetStaffIds.length > 0 && target.staffId && !b.targetStaffIds.includes(target.staffId)) return false;

      return true;
    });
  }

  /**
   * Acknowledge broadcast
   * @param {string} broadcastId - Broadcast ID
   * @param {string} staffId - Staff ID
   * @param {string} notes - Acknowledgment notes
   * @returns {Object} Result
   */
  acknowledgeBroadcast(broadcastId, staffId, notes = '') {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) {
      return { success: false, reason: 'Broadcast not found' };
    }

    if (broadcast.status !== BROADCAST_STATUS.ACTIVE) {
      return { success: false, reason: `Broadcast is ${broadcast.status.toLowerCase()}` };
    }

    // Check if already acknowledged
    const existingAck = Array.from(this.acknowledgments.values()).find(
      a => a.broadcastId === broadcastId && a.staffId === staffId
    );
    if (existingAck) {
      return { success: false, reason: 'Already acknowledged' };
    }

    // Create acknowledgment
    const acknowledgment = {
      id: `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      broadcastId,
      staffId,
      acknowledgedAt: now(),
      notes
    };

    this.acknowledgments.set(acknowledgment.id, acknowledgment);
    this.saveAcknowledgments();

    // Update broadcast acknowledgment count
    broadcast.acknowledgmentCount++;
    this.broadcasts.set(broadcastId, broadcast);
    this.saveBroadcasts();

    return { success: true, acknowledgment };
  }

  /**
   * Dismiss broadcast
   * @param {string} broadcastId - Broadcast ID
   * @param {string} staffId - Staff ID
   * @returns {Object} Result
   */
  dismissBroadcast(broadcastId, staffId) {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) {
      return { success: false, reason: 'Broadcast not found' };
    }

    if (broadcast.status !== BROADCAST_STATUS.ACTIVE) {
      return { success: false, reason: `Broadcast is ${broadcast.status.toLowerCase()}` };
    }

    // Create acknowledgment with dismissed flag
    const acknowledgment = {
      id: `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      broadcastId,
      staffId,
      acknowledgedAt: now(),
      dismissed: true
    };

    this.acknowledgments.set(acknowledgment.id, acknowledgment);
    this.saveAcknowledgments();

    return { success: true, acknowledgment };
  }

  /**
   * Cancel broadcast
   * @param {string} broadcastId - Broadcast ID
   * @param {string} cancelledBy - Who cancelled it
   * @returns {Object} Result
   */
  cancelBroadcast(broadcastId, cancelledBy) {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) {
      return { success: false, reason: 'Broadcast not found' };
    }

    broadcast.status = BROADCAST_STATUS.CANCELLED;
    broadcast.cancelledBy = cancelledBy;
    broadcast.cancelledAt = now();

    this.broadcasts.set(broadcastId, broadcast);
    this.saveBroadcasts();

    return { success: true, broadcast };
  }

  /**
   * Expire broadcast
   * @param {string} broadcastId - Broadcast ID
   * @returns {Object} Result
   */
  expireBroadcast(broadcastId) {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) {
      return { success: false, reason: 'Broadcast not found' };
    }

    broadcast.status = BROADCAST_STATUS.EXPIRED;
    broadcast.expiredAt = now();

    this.broadcasts.set(broadcastId, broadcast);
    this.saveBroadcasts();

    return { success: true, broadcast };
  }

  /**
   * Update broadcast
   * @param {string} broadcastId - Broadcast ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated broadcast or null
   */
  updateBroadcast(broadcastId, updates) {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) return null;

    const updated = {
      ...broadcast,
      ...updates,
      updatedAt: now()
    };

    this.broadcasts.set(broadcastId, updated);
    this.saveBroadcasts();

    return updated;
  }

  /**
   * Delete broadcast
   * @param {string} broadcastId - Broadcast ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteBroadcast(broadcastId) {
    const deleted = this.broadcasts.delete(broadcastId);
    if (deleted) {
      this.saveBroadcasts();
    }
    return deleted;
  }

  /**
   * Get acknowledgments for broadcast
   * @param {string} broadcastId - Broadcast ID
   * @returns {Array} Array of acknowledgments
   */
  getAcknowledgmentsForBroadcast(broadcastId) {
    return Array.from(this.acknowledgments.values()).filter(a => a.broadcastId === broadcastId);
  }

  /**
   * Get acknowledgments by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of acknowledgments
   */
  getAcknowledgmentsByStaff(staffId) {
    return Array.from(this.acknowledgments.values()).filter(a => a.staffId === staffId);
  }

  /**
   * Check if broadcast is fully acknowledged
   * @param {string} broadcastId - Broadcast ID
   * @returns {boolean} Whether fully acknowledged
   */
  isFullyAcknowledged(broadcastId) {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) return false;

    if (!broadcast.requiresAcknowledgment) return true;

    return broadcast.acknowledgmentCount >= broadcast.requiredAcknowledgments;
  }

  /**
   * Create common broadcast templates
   * @param {string} templateType - Template type
   * @param {Object} context - Context data
   * @returns {Object} Created broadcast
   */
  createTemplateBroadcast(templateType, context = {}) {
    const templates = {
      PRINTER_OFFLINE: {
        title: 'Printer Offline',
        message: 'The printer at {location} is currently offline. Please check the connection.',
        type: BROADCAST_TARGETS.KITCHEN,
        priority: BROADCAST_PRIORITY.URGENT
      },
      KITCHEN_DELAY: {
        title: 'Kitchen Delay',
        message: 'Kitchen is experiencing delays. Estimated wait time: {waitTime} minutes.',
        type: BROADCAST_TARGETS.WAITERS,
        priority: BROADCAST_PRIORITY.IMPORTANT
      },
      NEW_PROMOTION: {
        title: 'New Promotion',
        message: 'New promotion available: {promotionName}. Details: {details}',
        type: BROADCAST_TARGETS.ALL_STAFF,
        priority: BROADCAST_PRIORITY.INFO
      },
      EMERGENCY_NOTICE: {
        title: 'Emergency Notice',
        message: '{message}',
        type: BROADCAST_TARGETS.ENTIRE_BRANCH,
        priority: BROADCAST_PRIORITY.EMERGENCY
      },
      CLOSING_EARLY: {
        title: 'Closing Early',
        message: 'The restaurant will be closing early at {closeTime}. Please inform customers.',
        type: BROADCAST_TARGETS.ALL_STAFF,
        priority: BROADCAST_PRIORITY.IMPORTANT
      }
    };

    const template = templates[templateType];
    if (!template) {
      return { success: false, reason: 'Template not found' };
    }

    // Replace placeholders
    let message = template.message;
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(`{${key}}`, value);
    }

    return this.createBroadcast({
      ...template,
      message,
      branchId: context.branchId,
      createdBy: context.createdBy
    });
  }

  /**
   * Get broadcast statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const broadcasts = this.getAllBroadcasts();
    const acknowledgments = Array.from(this.acknowledgments.values());

    return {
      totalBroadcasts: broadcasts.length,
      byStatus: broadcasts.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}),
      byType: broadcasts.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: broadcasts.reduce((acc, b) => {
        acc[b.priority] = (acc[b.priority] || 0) + 1;
        return acc;
      }, {}),
      active: this.getActiveBroadcasts().length,
      totalAcknowledgments: acknowledgments.length,
      dismissedAcknowledgments: acknowledgments.filter(a => a.dismissed).length
    };
  }

  /**
   * Clear old broadcasts
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of broadcasts cleared
   */
  clearOldBroadcasts(olderThan = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [id, broadcast] of this.broadcasts) {
      if ((broadcast.status === BROADCAST_STATUS.ACKNOWLEDGED || 
           broadcast.status === BROADCAST_STATUS.DISMISSED ||
           broadcast.status === BROADCAST_STATUS.EXPIRED ||
           broadcast.status === BROADCAST_STATUS.CANCELLED) &&
          broadcast.createdAt && broadcast.createdAt < cutoff) {
        this.broadcasts.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveBroadcasts();
    }

    return cleared;
  }

  /**
   * Export broadcasts
   * @param {Object} options - Export options
   * @returns {Object} Exported broadcasts
   */
  exportBroadcasts(options = {}) {
    const { branchId, startDate, endDate } = options;
    
    let broadcasts = this.getAllBroadcasts();
    
    if (branchId) {
      broadcasts = broadcasts.filter(b => b.branchId === branchId);
    }
    if (startDate) {
      broadcasts = broadcasts.filter(b => b.createdAt >= startDate);
    }
    if (endDate) {
      broadcasts = broadcasts.filter(b => b.createdAt <= endDate);
    }

    return {
      broadcasts,
      acknowledgments: Array.from(this.acknowledgments.values()),
      exportedAt: now(),
      totalBroadcasts: broadcasts.length
    };
  }

  /**
   * Import broadcasts
   * @param {Object} data - Imported broadcasts data
   * @returns {Object} Import result
   */
  importBroadcasts(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.broadcasts)) {
        data.broadcasts.forEach(broadcast => {
          this.broadcasts.set(broadcast.id, broadcast);
        });
      }

      if (Array.isArray(data.acknowledgments)) {
        data.acknowledgments.forEach(ack => {
          this.acknowledgments.set(ack.id, ack);
        });
      }

      this.saveBroadcasts();
      this.saveAcknowledgments();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let broadcastSystemInstance = null;

/**
 * Get the broadcast system singleton
 * @returns {BroadcastSystem} Broadcast system instance
 */
export function getBroadcastSystem() {
  if (!broadcastSystemInstance) {
    broadcastSystemInstance = new BroadcastSystem();
  }
  return broadcastSystemInstance;
}

/**
 * Reset the broadcast system (useful for testing)
 */
export function resetBroadcastSystem() {
  broadcastSystemInstance = null;
}

/**
 * Convenience function to create a broadcast
 * @param {Object} broadcastData - Broadcast data
 * @returns {Object} Created broadcast
 */
export function createBroadcast(broadcastData = {}) {
  const system = getBroadcastSystem();
  return system.createBroadcast(broadcastData);
}

/**
 * Convenience function to acknowledge a broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {string} staffId - Staff ID
 * @param {string} notes - Acknowledgment notes
 * @returns {Object} Result
 */
export function acknowledgeBroadcast(broadcastId, staffId, notes = '') {
  const system = getBroadcastSystem();
  return system.acknowledgeBroadcast(broadcastId, staffId, notes);
}
