// Order References System
// Manages sequential numbers, unique IDs, and immutable references

import { createOrderId } from './ids.js';
import { now } from './dates.js';

const SEQUENCE_KEY = 'cafeos_order_sequence';
const BRANCH_SEQUENCES_KEY = 'cafeos_branch_sequences';
const TERMINAL_SEQUENCES_KEY = 'cafeos_terminal_sequences';

/**
 * Order References Manager class
 * Manages sequential numbers and immutable order references
 */
export class OrderReferencesManager {
  constructor() {
    this.globalSequence = 0;
    this.branchSequences = new Map();
    this.terminalSequences = new Map();
    this.currentBranchId = null;
    this.currentTerminalId = null;
    this.currentShiftId = null;
    this.loadSequences();
  }

  /**
   * Set current context (branch, terminal, shift)
   * @param {string} branchId - Current branch ID
   * @param {string} terminalId - Current terminal ID
   * @param {string} shiftId - Current shift ID
   */
  setCurrentContext(branchId, terminalId, shiftId) {
    this.currentBranchId = branchId;
    this.currentTerminalId = terminalId;
    this.currentShiftId = shiftId;
  }

  /**
   * Load sequences from localStorage
   */
  loadSequences() {
    try {
      // Load global sequence
      const globalSeq = localStorage.getItem(SEQUENCE_KEY);
      if (globalSeq) {
        this.globalSequence = parseInt(globalSeq, 10) || 0;
      }

      // Load branch sequences
      const branchSeq = localStorage.getItem(BRANCH_SEQUENCES_KEY);
      if (branchSeq) {
        const data = JSON.parse(branchSeq);
        Object.entries(data).forEach(([branchId, seq]) => {
          this.branchSequences.set(branchId, seq);
        });
      }

      // Load terminal sequences
      const terminalSeq = localStorage.getItem(TERMINAL_SEQUENCES_KEY);
      if (terminalSeq) {
        const data = JSON.parse(terminalSeq);
        Object.entries(data).forEach(([terminalId, seq]) => {
          this.terminalSequences.set(terminalId, seq);
        });
      }
    } catch (error) {
      console.error('[OrderReferencesManager] Failed to load sequences:', error);
    }
  }

  /**
   * Save sequences to localStorage
   */
  saveSequences() {
    try {
      localStorage.setItem(SEQUENCE_KEY, this.globalSequence.toString());
      localStorage.setItem(BRANCH_SEQUENCES_KEY, JSON.stringify(Object.fromEntries(this.branchSequences)));
      localStorage.setItem(TERMINAL_SEQUENCES_KEY, JSON.stringify(Object.fromEntries(this.terminalSequences)));
    } catch (error) {
      console.error('[OrderReferencesManager] Failed to save sequences:', error);
    }
  }

  /**
   * Get next global sequential number
   * @returns {number} Next sequential number
   */
  getNextGlobalSequence() {
    this.globalSequence++;
    this.saveSequences();
    return this.globalSequence;
  }

  /**
   * Get next branch sequential number
   * @param {string} branchId - Branch ID
   * @returns {number} Next branch sequential number
   */
  getNextBranchSequence(branchId) {
    const currentSeq = this.branchSequences.get(branchId) || 0;
    const nextSeq = currentSeq + 1;
    this.branchSequences.set(branchId, nextSeq);
    this.saveSequences();
    return nextSeq;
  }

  /**
   * Get next terminal sequential number
   * @param {string} terminalId - Terminal ID
   * @returns {number} Next terminal sequential number
   */
  getNextTerminalSequence(terminalId) {
    const currentSeq = this.terminalSequences.get(terminalId) || 0;
    const nextSeq = currentSeq + 1;
    this.terminalSequences.set(terminalId, nextSeq);
    this.saveSequences();
    return nextSeq;
  }

  /**
   * Generate complete order references
   * @param {Object} options - Reference options
   * @returns {Object} Order references
   */
  generateOrderReferences(options = {}) {
    const branchId = options.branchId || this.currentBranchId;
    const terminalId = options.terminalId || this.currentTerminalId;
    const shiftId = options.shiftId || this.currentShiftId;
    const staffId = options.staffId || null;

    const globalSequence = this.getNextGlobalSequence();
    const branchSequence = branchId ? this.getNextBranchSequence(branchId) : null;
    const terminalSequence = terminalId ? this.getNextTerminalSequence(terminalId) : null;

    // Generate display-friendly order number
    const orderNumber = this.formatOrderNumber(globalSequence, branchId);

    return {
      // Unique identifiers
      orderId: createOrderId(),
      globalSequence,
      branchSequence,
      terminalSequence,

      // Display number
      orderNumber,

      // Context references
      branchId,
      terminalId,
      shiftId,
      staffId,

      // Audit references
      auditId: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      
      // Timestamps
      generatedAt: now(),

      // Immutable flag
      immutable: true
    };
  }

  /**
   * Format order number for display
   * @param {number} sequence - Sequential number
   * @param {string} branchId - Branch ID
   * @returns {string} Formatted order number
   */
  formatOrderNumber(sequence, branchId = null) {
    // Format: ORD-0001 or BRANCH-ORD-0001
    const paddedSeq = String(sequence).padStart(4, '0');
    
    if (branchId) {
      // Extract short branch code (first 3 chars uppercase)
      const branchCode = branchId.substring(0, 3).toUpperCase();
      return `${branchCode}-${paddedSeq}`;
    }
    
    return `ORD-${paddedSeq}`;
  }

  /**
   * Parse order number to extract sequence
   * @param {string} orderNumber - Order number string
   * @returns {Object|null} Parsed data or null
   */
  parseOrderNumber(orderNumber) {
    if (!orderNumber || typeof orderNumber !== 'string') return null;

    // Try BRANCH-0001 format
    const branchMatch = orderNumber.match(/^([A-Z]{3})-(\d+)$/);
    if (branchMatch) {
      return {
        branchCode: branchMatch[1],
        sequence: parseInt(branchMatch[2], 10),
        format: 'branch'
      };
    }

    // Try ORD-0001 format
    const globalMatch = orderNumber.match(/^ORD-(\d+)$/);
    if (globalMatch) {
      return {
        sequence: parseInt(globalMatch[1], 10),
        format: 'global'
      };
    }

    return null;
  }

  /**
   * Validate order references
   * @param {Object} references - Order references to validate
   * @returns {Object} Validation result
   */
  validateReferences(references) {
    if (!references || typeof references !== 'object') {
      return { valid: false, reason: 'References must be an object' };
    }

    const required = ['orderId', 'orderNumber', 'globalSequence'];
    const missing = required.filter(field => !references[field]);

    if (missing.length > 0) {
      return { valid: false, reason: `Missing required fields: ${missing.join(', ')}` };
    }

    if (typeof references.globalSequence !== 'number' || references.globalSequence <= 0) {
      return { valid: false, reason: 'Invalid global sequence' };
    }

    if (typeof references.orderId !== 'string' || references.orderId.length < 8) {
      return { valid: false, reason: 'Invalid order ID' };
    }

    return { valid: true };
  }

  /**
   * Get current sequence status
   * @returns {Object} Sequence status
   */
  getSequenceStatus() {
    return {
      globalSequence: this.globalSequence,
      branchSequences: Object.fromEntries(this.branchSequences),
      terminalSequences: Object.fromEntries(this.terminalSequences),
      currentContext: {
        branchId: this.currentBranchId,
        terminalId: this.currentTerminalId,
        shiftId: this.currentShiftId
      }
    };
  }

  /**
   * Reset sequences (use with caution - for testing only)
   * @param {Object} options - Reset options
   */
  resetSequences(options = {}) {
    if (options.global !== false) {
      this.globalSequence = 0;
    }

    if (options.branches !== false) {
      this.branchSequences.clear();
    }

    if (options.terminals !== false) {
      this.terminalSequences.clear();
    }

    this.saveSequences();
  }

  /**
   * Set specific sequence value (for recovery/migration)
   * @param {string} type - Sequence type ('global', 'branch', 'terminal')
   * @param {string} id - Branch or terminal ID (for branch/terminal sequences)
   * @param {number} value - Sequence value
   */
  setSequence(type, id, value) {
    if (type === 'global') {
      this.globalSequence = Math.max(0, value);
    } else if (type === 'branch' && id) {
      this.branchSequences.set(id, Math.max(0, value));
    } else if (type === 'terminal' && id) {
      this.terminalSequences.set(id, Math.max(0, value));
    }

    this.saveSequences();
  }

  /**
   * Get sequence statistics
   * @returns {Object} Sequence statistics
   */
  getStatistics() {
    return {
      totalOrders: this.globalSequence,
      totalBranches: this.branchSequences.size,
      totalTerminals: this.terminalSequences.size,
      ordersPerBranch: this.calculateOrdersPerBranch(),
      ordersPerTerminal: this.calculateOrdersPerTerminal()
    };
  }

  /**
   * Calculate orders per branch
   * @returns {Object} Orders per branch
   */
  calculateOrdersPerBranch() {
    const result = {};
    for (const [branchId, seq] of this.branchSequences) {
      result[branchId] = seq;
    }
    return result;
  }

  /**
   * Calculate orders per terminal
   * @returns {Object} Orders per terminal
   */
  calculateOrdersPerTerminal() {
    const result = {};
    for (const [terminalId, seq] of this.terminalSequences) {
      result[terminalId] = seq;
    }
    return result;
  }

  /**
   * Export sequences for backup
   * @returns {Object} Exported sequences
   */
  exportSequences() {
    return {
      globalSequence: this.globalSequence,
      branchSequences: Object.fromEntries(this.branchSequences),
      terminalSequences: Object.fromEntries(this.terminalSequences),
      exportedAt: now()
    };
  }

  /**
   * Import sequences from backup
   * @param {Object} data - Imported sequences data
   * @returns {Object} Import result
   */
  importSequences(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (typeof data.globalSequence === 'number') {
        this.globalSequence = data.globalSequence;
      }

      if (data.branchSequences && typeof data.branchSequences === 'object') {
        Object.entries(data.branchSequences).forEach(([branchId, seq]) => {
          if (typeof seq === 'number') {
            this.branchSequences.set(branchId, seq);
          }
        });
      }

      if (data.terminalSequences && typeof data.terminalSequences === 'object') {
        Object.entries(data.terminalSequences).forEach(([terminalId, seq]) => {
          if (typeof seq === 'number') {
            this.terminalSequences.set(terminalId, seq);
          }
        });
      }

      this.saveSequences();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let referencesManagerInstance = null;

/**
 * Get the order references manager singleton
 * @returns {OrderReferencesManager} References manager instance
 */
export function getOrderReferencesManager() {
  if (!referencesManagerInstance) {
    referencesManagerInstance = new OrderReferencesManager();
  }
  return referencesManagerInstance;
}

/**
 * Reset the references manager (useful for testing)
 */
export function resetOrderReferencesManager() {
  referencesManagerInstance = null;
}

/**
 * Generate order references with current context
 * @param {Object} options - Reference options
 * @returns {Object} Order references
 */
export function generateOrderReferences(options = {}) {
  const manager = getOrderReferencesManager();
  return manager.generateOrderReferences(options);
}
