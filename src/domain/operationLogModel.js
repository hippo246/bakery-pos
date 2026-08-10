// Operation Log Model for crash recovery and audit trail

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * @typedef {Object} OperationLog
 * @property {string} id - Unique operation ID
 * @property {string} type - Operation type (CREATE, UPDATE, DELETE, TRANSACTION)
 * @property {string} entityType - Entity type (order, kdsCard, customer, etc.)
 * @property {string} entityId - ID of the entity being operated on
 * @property {object} beforeState - Snapshot of entity before operation
 * @property {object} afterState - Snapshot of entity after operation
 * @property {string} terminalId - Terminal that performed the operation
 * @property {string} userId - User who performed the operation
 * @property {number} timestamp - When the operation occurred
 * @property {string} status - Operation status (PENDING, COMPLETED, FAILED, ROLLED_BACK)
 * @property {string} error - Error message if operation failed
 * @property {object} metadata - Additional operation metadata
 */

export const OPERATION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  TRANSACTION: 'TRANSACTION'
};

export const OPERATION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK'
};

export const ENTITY_TYPES = {
  ORDER: 'order',
  KDS_CARD: 'kdsCard',
  CUSTOMER: 'customer',
  TABLE: 'table',
  MENU_ITEM: 'menuItem',
  STAFF: 'staff',
  INVENTORY: 'inventory'
};

/**
 * Create an operation log entry
 * @param {object} params - Operation parameters
 * @returns {OperationLog} Operation log entry
 */
export function createOperationLog(params = {}) {
  const {
    type = OPERATION_TYPES.UPDATE,
    entityType = ENTITY_TYPES.ORDER,
    entityId,
    beforeState = null,
    afterState = null,
    terminalId = 'unknown',
    userId = 'unknown',
    status = OPERATION_STATUS.PENDING,
    error = null,
    metadata = {}
  } = params;

  return {
    id: generateId(),
    type,
    entityType,
    entityId: entityId || generateId(),
    beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
    afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
    terminalId,
    userId,
    timestamp: now(),
    status,
    error,
    metadata
  };
}

/**
 * Mark an operation as completed
 * @param {OperationLog} log - Operation log
 * @param {object} finalState - Final state after operation
 * @returns {OperationLog} Updated operation log
 */
export function completeOperation(log, finalState = null) {
  return {
    ...log,
    status: OPERATION_STATUS.COMPLETED,
    afterState: finalState ? JSON.parse(JSON.stringify(finalState)) : log.afterState,
    timestamp: now()
  };
}

/**
 * Mark an operation as failed
 * @param {OperationLog} log - Operation log
 * @param {string} error - Error message
 * @returns {OperationLog} Updated operation log
 */
export function failOperation(log, error) {
  return {
    ...log,
    status: OPERATION_STATUS.FAILED,
    error: String(error),
    timestamp: now()
  };
}

/**
 * Mark an operation as rolled back
 * @param {OperationLog} log - Operation log
 * @returns {OperationLog} Updated operation log
 */
export function rollbackOperation(log) {
  return {
    ...log,
    status: OPERATION_STATUS.ROLLED_BACK,
    timestamp: now()
  };
}

/**
 * Get operations for a specific entity
 * @param {OperationLog[]} logs - All operation logs
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {OperationLog[]} Filtered operations
 */
export function getOperationsForEntity(logs, entityType, entityId) {
  if (!Array.isArray(logs)) return [];
  return logs.filter(log => 
    log.entityType === entityType && log.entityId === entityId
  );
}

/**
 * Get pending operations (for crash recovery)
 * @param {OperationLog[]} logs - All operation logs
 * @param {number} timeoutMs - Timeout in milliseconds to consider stale
 * @returns {OperationLog[]} Pending operations
 */
export function getPendingOperations(logs, timeoutMs = 60000) {
  if (!Array.isArray(logs)) return [];
  const nowTime = now();
  return logs.filter(log => {
    if (log.status !== OPERATION_STATUS.PENDING) return false;
    const elapsed = nowTime - log.timestamp;
    return elapsed > timeoutMs;
  });
}

/**
 * Get operations by terminal
 * @param {OperationLog[]} logs - All operation logs
 * @param {string} terminalId - Terminal ID
 * @returns {OperationLog[]} Filtered operations
 */
export function getOperationsByTerminal(logs, terminalId) {
  if (!Array.isArray(logs)) return [];
  return logs.filter(log => log.terminalId === terminalId);
}

/**
 * Normalize an operation log
 * @param {object} log - Raw operation log
 * @returns {OperationLog} Normalized operation log
 */
export function normalizeOperationLog(log) {
  if (!log || typeof log !== 'object') return null;
  
  return {
    id: log.id || generateId(),
    type: Object.values(OPERATION_TYPES).includes(log.type) ? log.type : OPERATION_TYPES.UPDATE,
    entityType: Object.values(ENTITY_TYPES).includes(log.entityType) ? log.entityType : ENTITY_TYPES.ORDER,
    entityId: log.entityId || generateId(),
    beforeState: log.beforeState || null,
    afterState: log.afterState || null,
    terminalId: log.terminalId || 'unknown',
    userId: log.userId || 'unknown',
    timestamp: toTimestamp(log.timestamp) || now(),
    status: Object.values(OPERATION_STATUS).includes(log.status) ? log.status : OPERATION_STATUS.PENDING,
    error: log.error || null,
    metadata: log.metadata || {}
  };
}

/**
 * Calculate rollback state from operation log
 * @param {OperationLog} log - Operation log
 * @returns {object|null} State to rollback to
 */
export function getRollbackState(log) {
  if (!log) return null;
  // For CREATE operations, rollback means delete (return null)
  if (log.type === OPERATION_TYPES.CREATE) {
    return null;
  }
  // For UPDATE/DELETE, rollback to beforeState
  return log.beforeState;
}

/**
 * Check if operations conflict (same entity, different terminals, overlapping time)
 * @param {OperationLog[]} logs - Operation logs
 * @returns {Array} Array of conflict groups
 */
export function detectConflicts(logs) {
  if (!Array.isArray(logs)) return [];
  
  const entityGroups = {};
  logs.forEach(log => {
    const key = `${log.entityType}:${log.entityId}`;
    if (!entityGroups[key]) entityGroups[key] = [];
    entityGroups[key].push(log);
  });
  
  const conflicts = [];
  Object.values(entityGroups).forEach(group => {
    if (group.length < 2) return;
    
    // Sort by timestamp
    group.sort((a, b) => a.timestamp - b.timestamp);
    
    // Check for overlapping operations from different terminals
    for (let i = 0; i < group.length - 1; i++) {
      const current = group[i];
      const next = group[i + 1];
      
      if (current.terminalId !== next.terminalId) {
        const timeDiff = next.timestamp - current.timestamp;
        // If operations happened within 5 seconds of each other from different terminals
        if (timeDiff < 5000 && current.status === OPERATION_STATUS.COMPLETED) {
          conflicts.push([current, next]);
        }
      }
    }
  });
  
  return conflicts;
}
