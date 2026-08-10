// Crash Recovery Model - ties together logs, locks, and heartbeats for automatic rollback

import { 
  createOperationLog, 
  completeOperation, 
  failOperation, 
  rollbackOperation,
  getPendingOperations,
  getRollbackState,
  detectConflicts,
  OPERATION_STATUS
} from './operationLogModel.js';
import { 
  acquireLock,
  releaseTerminalLocks, 
  expireStaleLocks, 
  getActiveLock 
} from './lockModel.js';
import { 
  getCrashedTerminals, 
  markTerminalCrashed 
} from './heartbeatModel.js';
import { now } from './dates.js';

/**
 * Crash Recovery Engine
 * Detects crashes and automatically rolls back incomplete operations
 */

/**
 * Perform crash recovery
 * @param {object} state - Current application state
 * @param {object} state - { orders, kdsCards, operationLogs, locks, heartbeats, currentTerminalId }
 * @returns {object} Recovered state and recovery report
 */
export function performCrashRecovery(state) {
  const {
    orders = [],
    kdsCards = [],
    operationLogs = [],
    locks = [],
    heartbeats = [],
    currentTerminalId = 'unknown'
  } = state;

  const report = {
    crashedTerminals: [],
    rolledBackOperations: [],
    releasedLocks: [],
    conflicts: [],
    timestamp: now()
  };

  // Step 1: Detect crashed terminals
  const crashedTerminals = getCrashedTerminals(heartbeats);
  report.crashedTerminals = crashedTerminals;

  if (crashedTerminals.length === 0) {
    return {
      recovered: false,
      report,
      state
    };
  }

  // Step 2: Get pending operations from crashed terminals
  const pendingOps = getPendingOperations(operationLogs, 60000); // 1 minute timeout
  const crashedPendingOps = pendingOps.filter(op => 
    crashedTerminals.includes(op.terminalId)
  );

  // Step 3: Roll back incomplete operations
  let recoveredOrders = [...orders];
  let recoveredKdsCards = [...kdsCards];
  let recoveredLogs = [...operationLogs];

  crashedPendingOps.forEach(op => {
    const rollbackState = getRollbackState(op);
    
    if (rollbackState === null) {
      // CREATE operation - remove the entity
      if (op.entityType === 'order') {
        recoveredOrders = recoveredOrders.filter(o => o.id !== op.entityId);
      } else if (op.entityType === 'kdsCard') {
        recoveredKdsCards = recoveredKdsCards.filter(c => c.id !== op.entityId);
      }
    } else {
      // UPDATE/DELETE operation - restore to beforeState
      if (op.entityType === 'order') {
        recoveredOrders = recoveredOrders.map(o => 
          o.id === op.entityId ? rollbackState : o
        );
      } else if (op.entityType === 'kdsCard') {
        recoveredKdsCards = recoveredKdsCards.map(c => 
          c.id === op.entityId ? rollbackState : c
        );
      }
    }

    // Mark operation as rolled back
    const rolledBackOp = rollbackOperation(op);
    recoveredLogs = recoveredLogs.map(log => 
      log.id === op.id ? rolledBackOp : log
    );
    
    report.rolledBackOperations.push(op.id);
  });

  // Step 4: Release locks from crashed terminals
  let recoveredLocks = [...locks];
  crashedTerminals.forEach(terminalId => {
    const beforeReleaseCount = recoveredLocks.filter(l => 
      l.terminalId === terminalId && l.status === 'ACTIVE'
    ).length;
    
    recoveredLocks = releaseTerminalLocks(recoveredLocks, terminalId);
    
    const afterReleaseCount = recoveredLocks.filter(l => 
      l.terminalId === terminalId && l.status === 'RELEASED'
    ).length;
    
    report.releasedLocks.push({
      terminalId,
      count: afterReleaseCount - beforeReleaseCount
    });
  });

  // Step 5: Expire stale locks
  recoveredLocks = expireStaleLocks(recoveredLocks);

  // Step 6: Detect conflicts
  const conflicts = detectConflicts(recoveredLogs);
  report.conflicts = conflicts;

  // Step 7: Mark crashed terminals in heartbeats
  let recoveredHeartbeats = [...heartbeats];
  crashedTerminals.forEach(terminalId => {
    recoveredHeartbeats = markTerminalCrashed(recoveredHeartbeats, terminalId);
  });

  return {
    recovered: true,
    report,
    state: {
      orders: recoveredOrders,
      kdsCards: recoveredKdsCards,
      operationLogs: recoveredLogs,
      locks: recoveredLocks,
      heartbeats: recoveredHeartbeats,
      currentTerminalId
    }
  };
}

/**
 * Wrap an operation with crash recovery protection
 * @param {Function} operation - The operation to execute
 * @param {object} params - Operation parameters
 * @param {object} context - Application context (state, setState, etc.)
 * @returns {Promise} Result of operation
 */
export async function withCrashRecovery(operation, params, context) {
  const {
    entityType,
    entityId,
    terminalId,
    userId,
    state,
    setState
  } = context;

  // Step 1: Acquire lock
  const lockResult = acquireLock(state.locks, {
    entityType,
    entityId,
    terminalId,
    userId,
    operation: params.operationType || 'UPDATE'
  });

  if (!lockResult.success) {
    throw new Error(`Cannot acquire lock: ${lockResult.error}`);
  }

  // Step 2: Create operation log (PENDING)
  const operationLog = createOperationLog({
    type: params.operationType || 'UPDATE',
    entityType,
    entityId,
    beforeState: params.beforeState,
    terminalId,
    userId,
    status: OPERATION_STATUS.PENDING,
    metadata: params.metadata || {}
  });

  // Add lock and log to state
  setState(prev => ({
    ...prev,
    locks: [...prev.locks, lockResult.lock],
    operationLogs: [...prev.operationLogs, operationLog]
  }));

  try {
    // Step 3: Execute the operation
    const result = await operation(params);

    // Step 4: Mark operation as COMPLETED
    const completedLog = completeOperation(operationLog, result.afterState);

    // Step 5: Release lock
    const releasedLock = releaseLock(lockResult.lock);

    setState(prev => ({
      ...prev,
      operationLogs: prev.operationLogs.map(log => 
        log.id === operationLog.id ? completedLog : log
      ),
      locks: prev.locks.map(lock => 
        lock.id === lockResult.lock.id ? releasedLock : lock
      )
    }));

    return result;
  } catch (error) {
    // Step 6: On error, mark as FAILED and release lock
    const failedLog = failOperation(operationLog, error.message);
    const releasedLock = releaseLock(lockResult.lock);

    setState(prev => ({
      ...prev,
      operationLogs: prev.operationLogs.map(log => 
        log.id === operationLog.id ? failedLog : log
      ),
      locks: prev.locks.map(lock => 
        lock.id === lockResult.lock.id ? releasedLock : lock
      )
    }));

    throw error;
  }
}

/**
 * Check if an entity can be modified (not locked)
 * @param {object[]} locks - All locks
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {string} terminalId - Current terminal ID
 * @returns {{canModify: boolean, lock: object|null}}
 */
export function canModifyEntity(locks, entityType, entityId, terminalId) {
  const activeLock = getActiveLock(locks, entityType, entityId);
  
  if (!activeLock) {
    return { canModify: true, lock: null };
  }

  // Same terminal can modify (renew lock)
  if (activeLock.terminalId === terminalId) {
    return { canModify: true, lock: activeLock };
  }

  return { 
    canModify: false, 
    lock: activeLock,
    reason: `Locked by terminal ${activeLock.terminalId}`
  };
}

/**
 * Resolve a conflict between two operations
 * @param {object} conflict - Conflict data { operation1, operation2 }
 * @param {string} resolutionStrategy - Strategy (LATEST_WINS, MANUAL, FIRST_WINS)
 * @returns {object} Resolution result
 */
export function resolveConflict(conflict, resolutionStrategy = 'LATEST_WINS') {
  const { operation1, operation2 } = conflict;

  switch (resolutionStrategy) {
    case 'LATEST_WINS':
      // Keep the operation with the later timestamp
      const winner = operation1.timestamp > operation2.timestamp ? operation1 : operation2;
      const loser = operation1.timestamp > operation2.timestamp ? operation2 : operation1;
      return {
        resolved: true,
        keepOperation: winner,
        discardOperation: loser,
        strategy: 'LATEST_WINS'
      };

    case 'FIRST_WINS':
      // Keep the first operation
      return {
        resolved: true,
        keepOperation: operation1,
        discardOperation: operation2,
        strategy: 'FIRST_WINS'
      };

    case 'MANUAL':
      // Return conflict for manual resolution
      return {
        resolved: false,
        conflict,
        strategy: 'MANUAL'
      };

    default:
      return {
        resolved: false,
        conflict,
        strategy: 'UNKNOWN'
      };
  }
}

/**
 * Get recovery statistics
 * @param {object} report - Recovery report
 * @returns {object} Statistics
 */
export function getRecoveryStats(report) {
  return {
    crashedTerminalsCount: report.crashedTerminals.length,
    rolledBackOperationsCount: report.rolledBackOperations.length,
    releasedLocksCount: report.releasedLocks.reduce((sum, item) => sum + item.count, 0),
    conflictsCount: report.conflicts.length,
    recoveredAt: new Date(report.timestamp).toISOString()
  };
}
