// Lock Model for operation locking and crash recovery

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * @typedef {Object} EntityLock
 * @property {string} id - Unique lock ID
 * @property {string} entityType - Entity type (order, kdsCard, customer, etc.)
 * @property {string} entityId - ID of the locked entity
 * @property {string} terminalId - Terminal that holds the lock
 * @property {string} userId - User who holds the lock
 * @property {number} acquiredAt - When the lock was acquired
 * @property {number} expiresAt - When the lock expires (auto-release)
 * @property {string} status - Lock status (ACTIVE, RELEASED, EXPIRED)
 * @property {string} operation - Operation being performed (CREATE, UPDATE, DELETE)
 */

export const LOCK_STATUS = {
  ACTIVE: 'ACTIVE',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED'
};

export const LOCK_TIMEOUT_MS = 300000; // 5 minutes default lock timeout

/**
 * Create an entity lock
 * @param {object} params - Lock parameters
 * @returns {EntityLock} Entity lock
 */
export function createLock(params = {}) {
  const {
    entityType,
    entityId,
    terminalId = 'unknown',
    userId = 'unknown',
    operation = 'UPDATE',
    timeoutMs = LOCK_TIMEOUT_MS
  } = params;

  const nowTime = now();

  return {
    id: generateId(),
    entityType,
    entityId,
    terminalId,
    userId,
    operation,
    acquiredAt: nowTime,
    expiresAt: nowTime + timeoutMs,
    status: LOCK_STATUS.ACTIVE
  };
}

/**
 * Check if a lock is valid (not expired and active)
 * @param {EntityLock} lock - Entity lock
 * @returns {boolean} Whether lock is valid
 */
export function isLockValid(lock) {
  if (!lock || typeof lock !== 'object') return false;
  if (lock.status !== LOCK_STATUS.ACTIVE) return false;
  const nowTime = now();
  return nowTime < lock.expiresAt;
}

/**
 * Check if an entity is locked
 * @param {EntityLock[]} locks - All locks
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {EntityLock|null} Active lock if exists, null otherwise
 */
export function getActiveLock(locks, entityType, entityId) {
  if (!Array.isArray(locks)) return null;
  const activeLocks = locks.filter(lock => 
    lock.entityType === entityType && 
    lock.entityId === entityId &&
    isLockValid(lock)
  );
  return activeLocks.length > 0 ? activeLocks[0] : null;
}

/**
 * Try to acquire a lock on an entity
 * @param {EntityLock[]} locks - All locks
 * @param {object} params - Lock parameters
 * @returns {{success: boolean, lock: EntityLock|null, error: string|null}}
 */
export function acquireLock(locks, params = {}) {
  const { entityType, entityId, terminalId, userId, operation, timeoutMs } = params;
  
  // Check if already locked
  const existingLock = getActiveLock(locks, entityType, entityId);
  if (existingLock) {
    // Same terminal can re-acquire (renew lock)
    if (existingLock.terminalId === terminalId) {
      const renewedLock = createLock({
        entityType,
        entityId,
        terminalId,
        userId,
        operation,
        timeoutMs
      });
      return {
        success: true,
        lock: renewedLock,
        error: null
      };
    }
    return {
      success: false,
      lock: null,
      error: `Entity locked by terminal ${existingLock.terminalId}`
    };
  }
  
  // Acquire new lock
  const newLock = createLock({
    entityType,
    entityId,
    terminalId,
    userId,
    operation,
    timeoutMs
  });
  
  return {
    success: true,
    lock: newLock,
    error: null
  };
}

/**
 * Release a lock
 * @param {EntityLock} lock - Lock to release
 * @returns {EntityLock} Released lock
 */
export function releaseLock(lock) {
  if (!lock) return null;
  return {
    ...lock,
    status: LOCK_STATUS.RELEASED,
    releasedAt: now()
  };
}

/**
 * Release all locks for a terminal (on crash/logout)
 * @param {EntityLock[]} locks - All locks
 * @param {string} terminalId - Terminal ID
 * @returns {EntityLock[]} Updated locks
 */
export function releaseTerminalLocks(locks, terminalId) {
  if (!Array.isArray(locks)) return [];
  return locks.map(lock => {
    if (lock.terminalId === terminalId && lock.status === LOCK_STATUS.ACTIVE) {
      return releaseLock(lock);
    }
    return lock;
  });
}

/**
 * Expire stale locks
 * @param {EntityLock[]} locks - All locks
 * @returns {EntityLock[]} Updated locks with expired locks marked
 */
export function expireStaleLocks(locks) {
  if (!Array.isArray(locks)) return [];
  const nowTime = now();
  return locks.map(lock => {
    if (lock.status === LOCK_STATUS.ACTIVE && nowTime >= lock.expiresAt) {
      return {
        ...lock,
        status: LOCK_STATUS.EXPIRED,
        expiredAt: nowTime
      };
    }
    return lock;
  });
}

/**
 * Get all locks for a terminal
 * @param {EntityLock[]} locks - All locks
 * @param {string} terminalId - Terminal ID
 * @returns {EntityLock[]} Terminal's locks
 */
export function getTerminalLocks(locks, terminalId) {
  if (!Array.isArray(locks)) return [];
  return locks.filter(lock => lock.terminalId === terminalId);
}

/**
 * Normalize a lock
 * @param {object} lock - Raw lock
 * @returns {EntityLock} Normalized lock
 */
export function normalizeLock(lock) {
  if (!lock || typeof lock !== 'object') return null;
  
  return {
    id: lock.id || generateId(),
    entityType: lock.entityType || 'unknown',
    entityId: lock.entityId || generateId(),
    terminalId: lock.terminalId || 'unknown',
    userId: lock.userId || 'unknown',
    operation: lock.operation || 'UPDATE',
    acquiredAt: toTimestamp(lock.acquiredAt) || now(),
    expiresAt: toTimestamp(lock.expiresAt) || (now() + LOCK_TIMEOUT_MS),
    status: Object.values(LOCK_STATUS).includes(lock.status) ? lock.status : LOCK_STATUS.ACTIVE
  };
}

/**
 * Renew a lock (extend expiration)
 * @param {EntityLock} lock - Lock to renew
 * @param {number} timeoutMs - New timeout in milliseconds
 * @returns {EntityLock} Renewed lock
 */
export function renewLock(lock, timeoutMs = LOCK_TIMEOUT_MS) {
  if (!lock) return null;
  const nowTime = now();
  return {
    ...lock,
    expiresAt: nowTime + timeoutMs,
    renewedAt: nowTime
  };
}

/**
 * Check if a terminal has any active locks
 * @param {EntityLock[]} locks - All locks
 * @param {string} terminalId - Terminal ID
 * @returns {boolean} Whether terminal has active locks
 */
export function terminalHasActiveLocks(locks, terminalId) {
  const terminalLocks = getTerminalLocks(locks, terminalId);
  return terminalLocks.some(lock => isLockValid(lock));
}
