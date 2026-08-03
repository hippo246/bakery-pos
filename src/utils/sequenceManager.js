// Sequence Manager for CafeOS
// Handles numbering sequences for orders, invoices, receipts, and other documents

const SEQUENCE_KEYS = {
  orders: 'cafeos_order_sequence',
  invoices: 'cafeos_invoice_sequence',
  receipts: 'cafeos_receipt_sequence',
  deliveryOrders: 'cafeos_delivery_order_sequence',
  purchaseOrders: 'cafeos_purchase_order_sequence'
};

/**
 * Get next sequence number
 * @param {string} sequenceType - Type of sequence (orders, invoices, etc.)
 * @param {object} options - Options for sequence generation
 * @returns {number} Next sequence number
 */
export function getNextSequence(sequenceType, options = {}) {
  const { prefix = '', resetDaily = false, resetMonthly = false } = options;
  
  const key = SEQUENCE_KEYS[sequenceType];
  if (!key) {
    console.warn(`[SequenceManager] Unknown sequence type: ${sequenceType}`);
    return 1;
  }

  try {
    // Get current sequence data
    const sequenceData = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Check if reset is needed
    const now = new Date();
    const lastUpdate = sequenceData.lastUpdate ? new Date(sequenceData.lastUpdate) : null;
    
    let shouldReset = false;
    if (resetDaily && lastUpdate) {
      shouldReset = now.toDateString() !== lastUpdate.toDateString();
    }
    if (resetMonthly && lastUpdate) {
      shouldReset = now.getMonth() !== lastUpdate.getMonth() || now.getFullYear() !== lastUpdate.getFullYear();
    }

    if (shouldReset || !sequenceData.sequence) {
      sequenceData.sequence = 1;
    } else {
      sequenceData.sequence = (sequenceData.sequence || 0) + 1;
    }

    sequenceData.lastUpdate = now.toISOString();
    sequenceData.prefix = prefix;

    // Save updated sequence
    localStorage.setItem(key, JSON.stringify(sequenceData));

    return sequenceData.sequence;
  } catch (err) {
    console.error('[SequenceManager] Error getting sequence:', err);
    return 1;
  }
}

/**
 * Get current sequence number without incrementing
 * @param {string} sequenceType - Type of sequence
 * @returns {number} Current sequence number
 */
export function getCurrentSequence(sequenceType) {
  const key = SEQUENCE_KEYS[sequenceType];
  if (!key) return 1;

  try {
    const sequenceData = JSON.parse(localStorage.getItem(key) || '{}');
    return sequenceData.sequence || 1;
  } catch {
    return 1;
  }
}

/**
 * Reset sequence to starting value
 * @param {string} sequenceType - Type of sequence
 * @param {number} startValue - Starting value (default: 1)
 */
export function resetSequence(sequenceType, startValue = 1) {
  const key = SEQUENCE_KEYS[sequenceType];
  if (!key) return;

  try {
    const sequenceData = {
      sequence: startValue,
      lastUpdate: new Date().toISOString(),
      prefix: ''
    };
    localStorage.setItem(key, JSON.stringify(sequenceData));
  } catch (err) {
    console.error('[SequenceManager] Error resetting sequence:', err);
  }
}

/**
 * Generate formatted sequence number
 * @param {string} sequenceType - Type of sequence
 * @param {object} options - Options for formatting
 * @returns {string} Formatted sequence number
 */
export function generateSequenceNumber(sequenceType, options = {}) {
  const {
    prefix = '',
    padLength = 4,
    separator = '-',
    includeDate = false,
    dateFormat = 'YYYYMMDD'
  } = options;

  const sequence = getNextSequence(sequenceType, options);
  const paddedSequence = String(sequence).padStart(padLength, '0');

  let result = '';
  
  if (prefix) {
    result += prefix + separator;
  }

  if (includeDate) {
    const now = new Date();
    const dateStr = formatDate(now, dateFormat);
    result += dateStr + separator;
  }

  result += paddedSequence;

  return result;
}

/**
 * Format date for sequence number
 */
function formatDate(date, format) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYYMMDD':
      return `${year}${month}${day}`;
    case 'YYMMDD':
      return `${String(year).slice(-2)}${month}${day}`;
    case 'DDMMYYYY':
      return `${day}${month}${year}`;
    default:
      return `${year}${month}${day}`;
  }
}

/**
 * Get all sequence states
 * @returns {object} All sequence states
 */
export function getAllSequenceStates() {
  const states = {};
  
  Object.keys(SEQUENCE_KEYS).forEach(type => {
    const key = SEQUENCE_KEYS[type];
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      states[type] = {
        current: data.sequence || 1,
        lastUpdate: data.lastUpdate,
        prefix: data.prefix
      };
    } catch {
      states[type] = { current: 1, lastUpdate: null, prefix: '' };
    }
  });

  return states;
}

/**
 * Backup sequence states
 * @returns {object} Backup of all sequence states
 */
export function backupSequences() {
  return getAllSequenceStates();
}

/**
 * Restore sequence states from backup
 * @param {object} backup - Backup data from backupSequences()
 */
export function restoreSequences(backup) {
  if (!backup || typeof backup !== 'object') return;

  Object.keys(backup).forEach(type => {
    const key = SEQUENCE_KEYS[type];
    if (!key) return;

    try {
      const state = backup[type];
      const sequenceData = {
        sequence: state.current,
        lastUpdate: state.lastUpdate || new Date().toISOString(),
        prefix: state.prefix || ''
      };
      localStorage.setItem(key, JSON.stringify(sequenceData));
    } catch (err) {
      console.error(`[SequenceManager] Error restoring sequence ${type}:`, err);
    }
  });
}

/**
 * Validate sequence integrity
 * @returns {object} Validation result
 */
export function validateSequences() {
  const issues = [];
  const states = getAllSequenceStates();

  Object.keys(states).forEach(type => {
    const state = states[type];
    
    // Check for missing sequences
    if (!state.current || state.current < 1) {
      issues.push({
        type,
        severity: 'error',
        message: `Invalid sequence value: ${state.current}`
      });
    }

    // Check for stale sequences (older than 1 year)
    if (state.lastUpdate) {
      const lastUpdate = new Date(state.lastUpdate);
      const now = new Date();
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 365) {
        issues.push({
          type,
          severity: 'warning',
          message: `Sequence not updated in ${Math.floor(daysSinceUpdate)} days`
        });
      }
    }
  });

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues
  };
}

export default {
  getNextSequence,
  getCurrentSequence,
  resetSequence,
  generateSequenceNumber,
  getAllSequenceStates,
  backupSequences,
  restoreSequences,
  validateSequences
};
