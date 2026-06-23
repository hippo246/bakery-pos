// ID generation utilities with crypto.randomUUID() fallback

/**
 * Generate a unique ID using crypto.randomUUID() with fallback
 * @returns {string} A unique ID
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an order ID with prefix
 * @param {number} sequence - Optional sequence number
 * @returns {string} Order ID like "ORD-001"
 */
export function createOrderId(sequence = null) {
  if (sequence !== null) {
    return `ORD-${String(sequence).padStart(3, '0')}`;
  }
  return `ORD-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a customer ID
 * @returns {string} Customer ID like "CUST-001"
 */
export function createCustomerId() {
  return `CUST-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a KDS ticket ID
 * @returns {string} KDS ticket ID like "KDS-001"
 */
export function createKdsTicketId() {
  return `KDS-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a table ID
 * @returns {string} Table ID like "TBL-001"
 */
export function createTableId() {
  return `TBL-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a staff ID
 * @returns {string} Staff ID like "STF-001"
 */
export function createStaffId() {
  return `STF-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a discount ID
 * @returns {string} Discount ID like "DSC-001"
 */
export function createDiscountId() {
  return `DSC-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate an inventory item ID
 * @returns {string} Inventory item ID like "INV-001"
 */
export function createInventoryId() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate a delivery order ID
 * @param {string} partner - Partner code (SWIGGY, ZOMATO)
 * @returns {string} Delivery order ID like "SWG-2024-001"
 */
export function createDeliveryOrderId(partner = 'GENERIC') {
  const year = new Date().getFullYear();
  const sequence = Date.now().toString().slice(-6);
  return `${partner}-${year}-${sequence}`;
}
