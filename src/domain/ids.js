// ID generation utilities with crypto.randomUUID() fallback

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Dev-only warn */
function _warn(msg) {
  console.warn('[ids]', msg);
}

/**
 * Generate a collision-resistant random suffix (8 hex chars).
 * Uses crypto.getRandomValues when available; falls back to Math.random.
 * Never throws.
 * @returns {string}
 */
function _randomSuffix() {
  try {
    if (typeof crypto !== 'undefined') {
      if (crypto.randomUUID) {
        // Borrow 8 chars from a UUID (already hex, no dashes section)
        return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      }
      if (crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0].toString(16).padStart(8, '0');
      }
    }
  } catch { /* fall through */ }
  // Last-resort: two Math.random numbers XOR'd for slightly better spread
  const a = Math.floor(Math.random() * 0xffffffff);
  const b = Math.floor(Math.random() * 0xffffffff);
  return ((a ^ b) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Build a prefixed ID.
 * - With sequence: "PREFIX-001"
 * - Without sequence: "PREFIX-<6-digit timestamp tail>-<8-char hex>"
 * @param {string} prefix
 * @param {number|null} sequence
 * @returns {string}
 */
function _prefixedId(prefix, sequence = null) {
  const p = (typeof prefix === 'string' && prefix.trim()) ? prefix.trim().toUpperCase() : 'ID';
  if (p !== prefix && prefix !== undefined) _warn(`Invalid prefix "${prefix}", using "${p}"`);

  if (sequence !== null && sequence !== undefined) {
    const seq = Number(sequence);
    if (!Number.isFinite(seq) || seq < 0) {
      _warn(`Invalid sequence "${sequence}", generating suffix instead`);
    } else {
      return `${p}-${String(Math.round(seq)).padStart(3, '0')}`;
    }
  }

  const tail = Date.now().toString().slice(-6);
  return `${p}-${tail}-${_randomSuffix()}`;
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID using crypto.randomUUID() with fallback
 * @returns {string} A unique ID
 */
export function generateId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch { /* fall through */ }
  // Collision-resistant fallback: timestamp (ms) + two random segments
  return `${Date.now()}-${_randomSuffix()}-${_randomSuffix()}`;
}

/**
 * Check whether a value looks like a valid generated ID.
 * @param {*} value
 * @returns {boolean}
 */
export function isValidId(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 128;
}

/**
 * Generate an order ID with prefix
 * @param {number} sequence - Optional sequence number
 * @returns {string} Order ID like "ORD-001"
 */
export function createOrderId(sequence = null) {
  return _prefixedId('ORD', sequence);
}

/**
 * Generate a customer ID
 * @returns {string} Customer ID like "CUST-001"
 */
export function createCustomerId(sequence = null) {
  return _prefixedId('CUST', sequence);
}

/**
 * Generate a KDS ticket ID
 * @returns {string} KDS ticket ID like "KDS-001"
 */
export function createKdsTicketId(sequence = null) {
  return _prefixedId('KDS', sequence);
}

/**
 * Generate a table ID
 * @returns {string} Table ID like "TBL-001"
 */
export function createTableId(sequence = null) {
  return _prefixedId('TBL', sequence);
}

/**
 * Generate a staff ID
 * @returns {string} Staff ID like "STF-001"
 */
export function createStaffId(sequence = null) {
  return _prefixedId('STF', sequence);
}

/**
 * Generate an inventory item ID
 * @returns {string} Inventory item ID like "INV-001"
 */
export function createInventoryId(sequence = null) {
  return _prefixedId('INV', sequence);
}

/**
 * Generate a delivery order ID
 * @param {string} partner - Partner code (SWIGGY, ZOMATO)
 * @returns {string} Delivery order ID like "SWG-2024-001"
 */
export function createDeliveryOrderId(partner = 'GENERIC') {
  const p = (typeof partner === 'string' && partner.trim()) ? partner.trim().toUpperCase() : 'GENERIC';
  const year = new Date().getFullYear();
  return `${p}-${year}-${_randomSuffix()}`;
}
