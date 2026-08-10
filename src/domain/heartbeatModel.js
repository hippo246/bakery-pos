// Heartbeat Model for crash detection and terminal health monitoring

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * @typedef {Object} Heartbeat
 * @property {string} id - Unique heartbeat ID
 * @property {string} terminalId - Terminal ID
 * @property {number} timestamp - When heartbeat was sent
 * @property {string} status - Terminal status (ONLINE, OFFLINE, CRASHED)
 * @property {object} metadata - Additional metadata (version, load, etc.)
 */

export const TERMINAL_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  CRASHED: 'CRASHED'
};

export const HEARTBEAT_INTERVAL_MS = 5000; // Send heartbeat every 5 seconds
export const CRASH_TIMEOUT_MS = 15000; // Consider crashed after 15 seconds without heartbeat

/**
 * Create a heartbeat
 * @param {object} params - Heartbeat parameters
 * @returns {Heartbeat} Heartbeat
 */
export function createHeartbeat(params = {}) {
  const {
    terminalId = 'unknown',
    status = TERMINAL_STATUS.ONLINE,
    metadata = {}
  } = params;

  return {
    id: generateId(),
    terminalId,
    timestamp: now(),
    status,
    metadata
  };
}

/**
 * Check if a terminal is considered crashed
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @param {string} terminalId - Terminal ID
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {boolean} Whether terminal is crashed
 */
export function isTerminalCrashed(heartbeats, terminalId, timeoutMs = CRASH_TIMEOUT_MS) {
  if (!Array.isArray(heartbeats)) return true;
  
  const terminalHeartbeats = heartbeats.filter(hb => hb.terminalId === terminalId);
  if (terminalHeartbeats.length === 0) return true;
  
  // Get the most recent heartbeat
  const latest = terminalHeartbeats.reduce((latest, current) => 
    current.timestamp > latest.timestamp ? current : latest
  );
  
  const nowTime = now();
  const elapsed = nowTime - latest.timestamp;
  
  return elapsed > timeoutMs;
}

/**
 * Get terminal status
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @param {string} terminalId - Terminal ID
 * @returns {string} Terminal status
 */
export function getTerminalStatus(heartbeats, terminalId) {
  if (isTerminalCrashed(heartbeats, terminalId)) {
    return TERMINAL_STATUS.CRASHED;
  }
  
  const terminalHeartbeats = heartbeats.filter(hb => hb.terminalId === terminalId);
  if (terminalHeartbeats.length === 0) {
    return TERMINAL_STATUS.OFFLINE;
  }
  
  return TERMINAL_STATUS.ONLINE;
}

/**
 * Get all crashed terminals
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @returns {string[]} Array of crashed terminal IDs
 */
export function getCrashedTerminals(heartbeats) {
  if (!Array.isArray(heartbeats)) return [];
  
  const terminalIds = [...new Set(heartbeats.map(hb => hb.terminalId))];
  return terminalIds.filter(terminalId => isTerminalCrashed(heartbeats, terminalId));
}

/**
 * Get all online terminals
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @returns {string[]} Array of online terminal IDs
 */
export function getOnlineTerminals(heartbeats) {
  if (!Array.isArray(heartbeats)) return [];
  
  const terminalIds = [...new Set(heartbeats.map(hb => hb.terminalId))];
  return terminalIds.filter(terminalId => !isTerminalCrashed(heartbeats, terminalId));
}

/**
 * Clean up old heartbeats (keep only recent ones)
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @param {number} keepMs - How many milliseconds of history to keep
 * @returns {Heartbeat[]} Cleaned heartbeats
 */
export function cleanupOldHeartbeats(heartbeats, keepMs = 300000) {
  if (!Array.isArray(heartbeats)) return [];
  const cutoff = now() - keepMs;
  return heartbeats.filter(hb => hb.timestamp > cutoff);
}

/**
 * Normalize a heartbeat
 * @param {object} heartbeat - Raw heartbeat
 * @returns {Heartbeat} Normalized heartbeat
 */
export function normalizeHeartbeat(heartbeat) {
  if (!heartbeat || typeof heartbeat !== 'object') return null;
  
  return {
    id: heartbeat.id || generateId(),
    terminalId: heartbeat.terminalId || 'unknown',
    timestamp: toTimestamp(heartbeat.timestamp) || now(),
    status: Object.values(TERMINAL_STATUS).includes(heartbeat.status) ? heartbeat.status : TERMINAL_STATUS.ONLINE,
    metadata: heartbeat.metadata || {}
  };
}

/**
 * Get terminal health summary
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @returns {object} Health summary
 */
export function getTerminalHealthSummary(heartbeats) {
  if (!Array.isArray(heartbeats)) {
    return {
      total: 0,
      online: 0,
      offline: 0,
      crashed: 0,
      terminals: {}
    };
  }
  
  const terminalIds = [...new Set(heartbeats.map(hb => hb.terminalId))];
  const summary = {
    total: terminalIds.length,
    online: 0,
    offline: 0,
    crashed: 0,
    terminals: {}
  };
  
  terminalIds.forEach(terminalId => {
    const status = getTerminalStatus(heartbeats, terminalId);
    summary.terminals[terminalId] = status;
    
    if (status === TERMINAL_STATUS.ONLINE) summary.online++;
    else if (status === TERMINAL_STATUS.CRASHED) summary.crashed++;
    else summary.offline++;
  });
  
  return summary;
}

/**
 * Mark terminal as crashed
 * @param {Heartbeat[]} heartbeats - All heartbeats
 * @param {string} terminalId - Terminal ID
 * @returns {Heartbeat[]} Updated heartbeats
 */
export function markTerminalCrashed(heartbeats, terminalId) {
  if (!Array.isArray(heartbeats)) return [];
  
  const crashedHeartbeat = createHeartbeat({
    terminalId,
    status: TERMINAL_STATUS.CRASHED
  });
  
  return [...heartbeats, crashedHeartbeat];
}
