// Order Locking System
// Prevents concurrent edits to the same order

import { now } from './dates.js';

const ORDER_LOCKS_KEY = 'cafeos_order_locks';
const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Order Lock Manager class
 * Manages order locks to prevent concurrent edits
 */
export class OrderLockManager {
  constructor() {
    this.locks = new Map();
    this.currentStaffId = null;
    this.currentTerminalId = null;
    this.loadLocks();
    this.startCleanupTimer();
  }

  /**
   * Set current staff and terminal IDs
   * @param {string} staffId - Current staff ID
   * @param {string} terminalId - Current terminal ID
   */
  setCurrentContext(staffId, terminalId) {
    this.currentStaffId = staffId;
    this.currentTerminalId = terminalId;
  }

  /**
   * Load locks from localStorage
   */
  loadLocks() {
    try {
      const stored = localStorage.getItem(ORDER_LOCKS_KEY);
      if (stored) {
        const locks = JSON.parse(stored);
        const currentTime = now();
        
        // Filter out expired locks
        const validLocks = locks.filter(lock => {
          return (lock.lockedAt + LOCK_TIMEOUT) > currentTime;
        });

        validLocks.forEach(lock => {
          this.locks.set(lock.orderId, lock);
        });

        // Save cleaned locks
        if (validLocks.length !== locks.length) {
          this.saveLocks();
        }
      }
    } catch (error) {
      console.error('[OrderLockManager] Failed to load locks:', error);
    }
  }

  /**
   * Save locks to localStorage
   */
  saveLocks() {
    try {
      const locks = Array.from(this.locks.values());
      localStorage.setItem(ORDER_LOCKS_KEY, JSON.stringify(locks));
    } catch (error) {
      console.error('[OrderLockManager] Failed to save locks:', error);
    }
  }

  /**
   * Start cleanup timer for expired locks
   */
  startCleanupTimer() {
    // Clean up expired locks every minute
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60 * 1000);
  }

  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks() {
    const currentTime = now();
    let removed = 0;

    for (const [orderId, lock] of this.locks) {
      if ((lock.lockedAt + LOCK_TIMEOUT) < currentTime) {
        this.locks.delete(orderId);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveLocks();
      console.log(`[OrderLockManager] Cleaned up ${removed} expired locks`);
    }
  }

  /**
   * Lock an order
   * @param {string} orderId - Order ID to lock
   * @param {string} reason - Reason for locking
   * @returns {Object} Lock result
   */
  lockOrder(orderId, reason = null) {
    if (!this.currentStaffId) {
      return {
        success: false,
        reason: 'Staff ID not set'
      };
    }

    const existingLock = this.locks.get(orderId);

    // Check if already locked by same staff/terminal
    if (existingLock) {
      if (existingLock.staffId === this.currentStaffId && 
          existingLock.terminalId === this.currentTerminalId) {
        // Already locked by same context, refresh the lock
        existingLock.lockedAt = now();
        this.saveLocks();
        return {
          success: true,
          lock: existingLock,
          refreshed: true
        };
      }

      // Locked by someone else
      return {
        success: false,
        reason: 'Order already locked',
        lockedBy: existingLock.staffId,
        lockedAt: existingLock.lockedAt,
        terminalId: existingLock.terminalId
      };
    }

    // Create new lock
    const lock = {
      orderId,
      staffId: this.currentStaffId,
      terminalId: this.currentTerminalId,
      lockedAt: now(),
      reason: reason || 'Order being edited'
    };

    this.locks.set(orderId, lock);
    this.saveLocks();

    return {
      success: true,
      lock
    };
  }

  /**
   * Unlock an order
   * @param {string} orderId - Order ID to unlock
   * @param {boolean} force - Force unlock even if not locked by current staff
   * @returns {Object} Unlock result
   */
  unlockOrder(orderId, force = false) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        success: true,
        reason: 'Order was not locked'
      };
    }

    // Check if locked by current staff
    if (!force && lock.staffId !== this.currentStaffId) {
      return {
        success: false,
        reason: 'Order locked by another staff member',
        lockedBy: lock.staffId,
        requiresManagerOverride: true
      };
    }

    this.locks.delete(orderId);
    this.saveLocks();

    return {
      success: true,
      unlockedBy: this.currentStaffId
    };
  }

  /**
   * Request takeover of a locked order
   * @param {string} orderId - Order ID to takeover
   * @param {string} reason - Reason for takeover
   * @returns {Object} Takeover result
   */
  requestTakeover(orderId, reason = null) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        success: false,
        reason: 'Order is not locked'
      };
    }

    // Check if locked by current staff
    if (lock.staffId === this.currentStaffId) {
      return {
        success: false,
        reason: 'You already have this order locked'
      };
    }

    // Create takeover request (would be sent to the locking staff in a real system)
    const takeoverRequest = {
      orderId,
      fromStaffId: this.currentStaffId,
      fromTerminalId: this.currentTerminalId,
      toStaffId: lock.staffId,
      toTerminalId: lock.terminalId,
      reason: reason || 'Requesting order edit access',
      requestedAt: now(),
      status: 'PENDING'
    };

    // In a real system, this would send a notification to the locking staff
    console.log('[OrderLockManager] Takeover request:', takeoverRequest);

    return {
      success: true,
      request: takeoverRequest,
      message: 'Takeover request sent to staff member'
    };
  }

  /**
   * Approve takeover request
   * @param {string} orderId - Order ID
   * @param {string} requestingStaffId - Staff requesting takeover
   * @returns {Object} Approval result
   */
  approveTakeover(orderId, requestingStaffId) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        success: false,
        reason: 'Order is not locked'
      };
    }

    if (lock.staffId !== this.currentStaffId) {
      return {
        success: false,
        reason: 'You do not have this order locked'
      };
    }

    // Transfer lock to requesting staff
    lock.staffId = requestingStaffId;
    lock.terminalId = null; // Clear terminal ID on transfer
    lock.lockedAt = now();
    lock.transferredFrom = this.currentStaffId;
    lock.transferredAt = now();

    this.saveLocks();

    return {
      success: true,
      lock,
      message: 'Lock transferred successfully'
    };
  }

  /**
   * Check if order is locked
   * @param {string} orderId - Order ID to check
   * @returns {Object} Lock status
   */
  isOrderLocked(orderId) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        locked: false
      };
    }

    const currentTime = now();
    const isExpired = (lock.lockedAt + LOCK_TIMEOUT) < currentTime;

    if (isExpired) {
      // Remove expired lock
      this.locks.delete(orderId);
      this.saveLocks();
      return {
        locked: false
      };
    }

    return {
      locked: true,
      lock,
      isMyLock: lock.staffId === this.currentStaffId,
      timeRemaining: LOCK_TIMEOUT - (currentTime - lock.lockedAt)
    };
  }

  /**
   * Get all active locks
   * @returns {Array} Array of active locks
   */
  getAllLocks() {
    const currentTime = now();
    return Array.from(this.locks.values()).filter(lock => {
      return (lock.lockedAt + LOCK_TIMEOUT) > currentTime;
    });
  }

  /**
   * Get locks for current staff
   * @returns {Array} Array of locks held by current staff
   */
  getMyLocks() {
    if (!this.currentStaffId) return [];
    
    return Array.from(this.locks.values()).filter(lock => {
      return lock.staffId === this.currentStaffId;
    });
  }

  /**
   * Release all locks for current staff
   * @returns {number} Number of locks released
   */
  releaseMyLocks() {
    if (!this.currentStaffId) return 0;

    let released = 0;
    for (const [orderId, lock] of this.locks) {
      if (lock.staffId === this.currentStaffId) {
        this.locks.delete(orderId);
        released++;
      }
    }

    if (released > 0) {
      this.saveLocks();
    }

    return released;
  }

  /**
   * Force unlock an order (manager override)
   * @param {string} orderId - Order ID to force unlock
   * @param {string} managerId - Manager ID authorizing the override
   * @param {string} reason - Reason for override
   * @returns {Object} Force unlock result
   */
  forceUnlock(orderId, managerId, reason = null) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        success: false,
        reason: 'Order is not locked'
      };
    }

    const previousLock = { ...lock };
    this.locks.delete(orderId);
    this.saveLocks();

    // Log the override (would go to audit log in real system)
    console.log('[OrderLockManager] Manager override:', {
      orderId,
      managerId,
      previousLock,
      reason
    });

    return {
      success: true,
      previousLock,
      overriddenBy: managerId,
      reason
    };
  }

  /**
   * Extend lock timeout
   * @param {string} orderId - Order ID to extend lock
   * @returns {Object} Extension result
   */
  extendLock(orderId) {
    const lock = this.locks.get(orderId);

    if (!lock) {
      return {
        success: false,
        reason: 'Order is not locked'
      };
    }

    if (lock.staffId !== this.currentStaffId) {
      return {
        success: false,
        reason: 'You do not have this order locked'
      };
    }

    lock.lockedAt = now();
    this.saveLocks();

    return {
      success: true,
      lock,
      message: 'Lock extended'
    };
  }

  /**
   * Get lock statistics
   * @returns {Object} Lock statistics
   */
  getStatistics() {
    const allLocks = this.getAllLocks();
    const myLocks = this.getMyLocks();

    return {
      totalLocks: allLocks.length,
      myLocks: myLocks.length,
      otherLocks: allLocks.length - myLocks.length,
      locksByStaff: this.groupLocksByStaff(allLocks)
    };
  }

  /**
   * Group locks by staff ID
   * @param {Array} locks - Array of locks
   * @returns {Object} Locks grouped by staff
   */
  groupLocksByStaff(locks) {
    return locks.reduce((acc, lock) => {
      acc[lock.staffId] = (acc[lock.staffId] || 0) + 1;
      return acc;
    }, {});
  }
}

// Singleton instance
let lockManagerInstance = null;

/**
 * Get the order lock manager singleton
 * @returns {OrderLockManager} Lock manager instance
 */
export function getOrderLockManager() {
  if (!lockManagerInstance) {
    lockManagerInstance = new OrderLockManager();
  }
  return lockManagerInstance;
}

/**
 * Reset the lock manager (useful for testing)
 */
export function resetOrderLockManager() {
  if (lockManagerInstance) {
    lockManagerInstance.releaseMyLocks();
  }
  lockManagerInstance = null;
}
