// useCrashRecovery Hook - Wraps operations with crash recovery protection

import { useCallback, useContext } from 'react';
import { useTerminal } from '../terminal/TerminalContext.jsx';
import { 
  createOperationLog, 
  completeOperation, 
  failOperation,
  OPERATION_TYPES,
  ENTITY_TYPES
} from '../domain/operationLogModel.js';
import { 
  acquireLock, 
  releaseLock,
  LOCK_STATUS
} from '../domain/lockModel.js';
import { now } from '../domain/dates.js';

/**
 * Hook for wrapping operations with crash recovery protection
 * @param {object} params - Hook parameters
 * @param {Function} params.setOperationLogs - Function to update operation logs
 * @param {Function} params.setLocks - Function to update locks
 * @param {string} params.currentUserId - Current user ID
 * @returns {object} Crash recovery utilities
 */
export function useCrashRecovery({ setOperationLogs, setLocks, currentUserId = 'unknown' }) {
  const { currentTerminal } = useTerminal();
  const terminalId = currentTerminal?.id || 'unknown';

  /**
   * Wrap an operation with crash recovery protection
   * @param {Function} operation - The operation to execute
   * @param {object} params - Operation parameters
   * @param {string} params.entityType - Entity type (order, kdsCard, etc.)
   * @param {string} params.entityId - Entity ID
   * @param {string} params.operationType - Operation type (CREATE, UPDATE, DELETE)
   * @param {object} params.beforeState - State before operation
   * @param {object} params.metadata - Additional metadata
   * @returns {Promise} Result of operation
   */
  const withRecovery = useCallback(async (operation, params) => {
    const {
      entityType = ENTITY_TYPES.ORDER,
      entityId,
      operationType = OPERATION_TYPES.UPDATE,
      beforeState = null,
      metadata = {}
    } = params;

    // Step 1: Acquire lock
    const lockResult = acquireLock(
      setLocks ? (prevLocks => {
        const result = acquireLock(prevLocks, {
          entityType,
          entityId,
          terminalId,
          userId: currentUserId,
          operation: operationType
        });
        if (result.success) {
          return [...prevLocks, result.lock];
        }
        return prevLocks;
      }) : [],
      {
        entityType,
        entityId,
        terminalId,
        userId: currentUserId,
        operation: operationType
      }
    );

    if (!lockResult.success) {
      throw new Error(`Cannot acquire lock: ${lockResult.error}`);
    }

    const lock = lockResult.lock;

    // Step 2: Create operation log (PENDING)
    const operationLog = createOperationLog({
      type: operationType,
      entityType,
      entityId,
      beforeState,
      terminalId,
      userId: currentUserId,
      status: 'PENDING',
      metadata
    });

    // Add log to state
    if (setOperationLogs) {
      setOperationLogs(prev => [...prev, operationLog]);
    }

    try {
      // Step 3: Execute the operation
      const result = await operation(params);

      // Step 4: Mark operation as COMPLETED
      const completedLog = completeOperation(operationLog, result.afterState);

      // Step 5: Release lock
      const releasedLock = releaseLock(lock);

      // Update state
      if (setOperationLogs) {
        setOperationLogs(prev => 
          prev.map(log => log.id === operationLog.id ? completedLog : log)
        );
      }

      if (setLocks) {
        setLocks(prev => 
          prev.map(l => l.id === lock.id ? releasedLock : l)
        );
      }

      return result;
    } catch (error) {
      // Step 6: On error, mark as FAILED and release lock
      const failedLog = failOperation(operationLog, error.message);
      const releasedLock = releaseLock(lock);

      if (setOperationLogs) {
        setOperationLogs(prev => 
          prev.map(log => log.id === operationLog.id ? failedLog : log)
        );
      }

      if (setLocks) {
        setLocks(prev => 
          prev.map(l => l.id === lock.id ? releasedLock : l)
        );
      }

      throw error;
    }
  }, [terminalId, currentUserId, setOperationLogs, setLocks]);

  /**
   * Check if an entity can be modified (not locked)
   * @param {object[]} locks - All locks
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {{canModify: boolean, lock: object|null, reason: string|null}}
   */
  const canModify = useCallback((locks, entityType, entityId) => {
    if (!Array.isArray(locks)) return { canModify: true, lock: null, reason: null };
    
    const activeLock = locks.find(lock => 
      lock.entityType === entityType && 
      lock.entityId === entityId &&
      lock.status === LOCK_STATUS.ACTIVE &&
      lock.expiresAt > now()
    );
    
    if (!activeLock) {
      return { canModify: true, lock: null, reason: null };
    }

    // Same terminal can modify
    if (activeLock.terminalId === terminalId) {
      return { canModify: true, lock: activeLock, reason: null };
    }

    return { 
      canModify: false, 
      lock: activeLock,
      reason: `Locked by terminal ${activeLock.terminalId}`
    };
  }, [terminalId]);

  /**
   * Renew a lock (extend expiration)
   * @param {object} lock - Lock to renew
   * @param {number} timeoutMs - New timeout in milliseconds
   */
  const renewLock = useCallback((lock, timeoutMs = 300000) => {
    if (!lock || lock.terminalId !== terminalId) return;
    
    const renewedLock = {
      ...lock,
      expiresAt: now() + timeoutMs,
      renewedAt: now()
    };

    if (setLocks) {
      setLocks(prev => 
        prev.map(l => l.id === lock.id ? renewedLock : l)
      );
    }
  }, [terminalId, setLocks]);

  return {
    withRecovery,
    canModify,
    renewLock,
    terminalId
  };
}
