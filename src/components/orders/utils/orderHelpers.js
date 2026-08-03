/**
 * Order Helper Utilities
 * Pure functions for order operations - NO React code
 */

/**
 * Generate unique order ID
 * @returns {string} Unique order ID
 */
export const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate hold bill ID
 * @returns {string} Unique hold bill ID
 */
export const generateHoldId = () => {
  return `HOLD-${Date.now()}`;
};

/**
 * Calculate order age in minutes
 * @param {string|Date} createdAt - Order creation timestamp
 * @returns {number} Age in minutes
 */
export const getOrderAge = (createdAt) => {
  if (!createdAt) return 0;
  
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return 0;
  
  const now = new Date();
  const diffMs = now - created;
  return Math.floor(diffMs / 60000);
};

/**
 * Check if order is old (stale)
 * @param {string|Date} createdAt - Order creation timestamp
 * @param {number} thresholdMinutes - Threshold in minutes (default 15)
 * @returns {boolean} Whether order is old
 */
export const isOrderOld = (createdAt, thresholdMinutes = 15) => {
  return getOrderAge(createdAt) > thresholdMinutes;
};

/**
 * Check if order is at warning threshold
 * @param {string|Date} createdAt - Order creation timestamp
 * @param {number} thresholdMinutes - Threshold in minutes (default 8)
 * @returns {boolean} Whether order is at warning threshold
 */
export const isOrderAtWarning = (createdAt, thresholdMinutes = 8) => {
  const age = getOrderAge(createdAt);
  return age > thresholdMinutes && age <= 15;
};

/**
 * Check if order status is terminal
 * @param {string} status - Order status
 * @returns {boolean} Whether status is terminal
 */
export const isTerminalStatus = (status) => {
  const terminalStatuses = ["COMPLETED", "CANCELLED", "REFUNDED", "VOIDED"];
  return terminalStatuses.includes(status);
};

/**
 * Check if order can advance
 * @param {string} status - Current status
 * @returns {boolean} Whether order can advance
 */
export const canAdvanceStatus = (status) => {
  return !isTerminalStatus(status) && status !== "READY";
};

/**
 * Get next status in flow
 * @param {string} currentStatus - Current status
 * @param {Object} statusFlow - Status flow mapping
 * @returns {string|null} Next status or null
 */
export const getNextStatus = (currentStatus, statusFlow) => {
  if (!statusFlow || !statusFlow[currentStatus]) return null;
  return statusFlow[currentStatus];
};

/**
 * Check if status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @param {Object} statusFlow - Status flow mapping
 * @returns {boolean} Whether transition is valid
 */
export const isValidStatusTransition = (fromStatus, toStatus, statusFlow) => {
  // Terminal statuses cannot change
  if (isTerminalStatus(fromStatus)) return false;
  
  // Cancel is always allowed from non-terminal statuses
  if (toStatus === "CANCELLED") return true;
  
  // Check if it's a forward step in the flow
  const nextStatus = getNextStatus(fromStatus, statusFlow);
  return nextStatus === toStatus;
};

/**
 * Count items in cart
 * @param {Array} cart - Cart items
 * @returns {number} Total item count
 */
export const getCartItemCount = (cart) => {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => {
    const qty = Number.isFinite(item.qty) ? item.qty : 0;
    return sum + qty;
  }, 0);
};

/**
 * Count unique items in cart
 * @param {Array} cart - Cart items
 * @returns {number} Unique item count
 */
export const getCartUniqueItemCount = (cart) => {
  if (!Array.isArray(cart)) return 0;
  return cart.length;
};

/**
 * Check if cart is empty
 * @param {Array} cart - Cart items
 * @returns {boolean} Whether cart is empty
 */
export const isCartEmpty = (cart) => {
  return !Array.isArray(cart) || cart.length === 0;
};

/**
 * Get order source from order type
 * @param {string} orderType - Order type
 * @returns {string} Order source
 */
export const getSourceFromOrderType = (orderType) => {
  const sourceMap = {
    DINE_IN: "WALK_IN",
    TAKEAWAY: "WALK_IN",
    DIRECT_DELIVERY: "DIRECT_DELIVERY",
    SWIGGY: "SWIGGY",
    ZOMATO: "ZOMATO"
  };
  return sourceMap[orderType] || "WALK_IN";
};

/**
 * Check if order type requires table
 * @param {string} orderType - Order type
 * @returns {boolean} Whether table is required
 */
export const requiresTable = (orderType) => {
  return orderType === "DINE_IN";
};

/**
 * Check if order type requires customer phone
 * @param {string} orderType - Order type
 * @returns {boolean} Whether phone is required
 */
export const requiresPhone = (orderType) => {
  return orderType === "DIRECT_DELIVERY";
};

/**
 * Check if order type requires address
 * @param {string} orderType - Order type
 * @returns {boolean} Whether address is required
 */
export const requiresAddress = (orderType) => {
  return orderType === "DIRECT_DELIVERY";
};

/**
 * Check if order type requires platform order ID
 * @param {string} orderType - Order type
 * @returns {boolean} Whether platform ID is required
 */
export const requiresPlatformOrderId = (orderType) => {
  return orderType === "SWIGGY" || orderType === "ZOMATO";
};

/**
 * Check if order type is off-premise
 * @param {string} orderType - Order type
 * @returns {boolean} Whether order is off-premise
 */
export const isOffPremise = (orderType) => {
  return orderType !== "DINE_IN";
};

/**
 * Check if order type is aggregator
 * @param {string} orderType - Order type
 * @returns {boolean} Whether order is from aggregator
 */
export const isAggregatorOrder = (orderType) => {
  return orderType === "SWIGGY" || orderType === "ZOMATO";
};

/**
 * Format order type for display
 * @param {string} orderType - Order type
 * @returns {string} Display label
 */
export const formatOrderType = (orderType) => {
  const labels = {
    DINE_IN: "Dine-in",
    TAKEAWAY: "Takeaway",
    DIRECT_DELIVERY: "Delivery",
    SWIGGY: "Swiggy",
    ZOMATO: "Zomato"
  };
  return labels[orderType] || orderType;
};
