/**
 * Order Constants
 * Centralized constants for orders module
 */

/**
 * Order types
 */
export const ORDER_TYPES = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
  DIRECT_DELIVERY: "DIRECT_DELIVERY",
  SWIGGY: "SWIGGY",
  ZOMATO: "ZOMATO"
};

/**
 * Order type labels
 */
export const ORDER_TYPE_LABELS = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DIRECT_DELIVERY: "Delivery",
  SWIGGY: "Swiggy",
  ZOMATO: "Zomato"
};

/**
 * Order type icons
 */
export const ORDER_TYPE_ICONS = {
  DINE_IN: "🪑",
  TAKEAWAY: "🥡",
  DIRECT_DELIVERY: "🛵",
  SWIGGY: "🟠",
  ZOMATO: "🔴"
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CASH: "CASH",
  UPI: "UPI",
  CARD: "CARD",
  SPLIT: "SPLIT",
  ONLINE: "ONLINE",
  COD: "COD"
};

/**
 * Payment method labels
 */
export const PAYMENT_METHOD_LABELS = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  SPLIT: "Split",
  ONLINE: "Online",
  COD: "COD"
};

/**
 * Payment method icons
 */
export const PAYMENT_METHOD_ICONS = {
  CASH: "💵",
  UPI: "📱",
  CARD: "💳",
  SPLIT: "⚖",
  ONLINE: "🌐",
  COD: "📦"
};

/**
 * Payment status
 */
export const PAYMENT_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  COD: "COD",
  REFUNDED: "REFUNDED"
};

/**
 * Order status flow
 */
export const STATUS_FLOW = {
  NEW: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED"
};

/**
 * Terminal statuses (no further transitions)
 */
export const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "REFUNDED", "VOIDED"];

/**
 * Status labels
 */
export const STATUS_LABELS = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  VOIDED: "Voided"
};

/**
 * Source filters
 */
export const SOURCE_FILTERS = ["ALL", "WALK_IN", "DIRECT_DELIVERY", "SWIGGY", "ZOMATO"];

/**
 * Status filters
 */
export const STATUS_FILTERS = ["ALL", "NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

/**
 * Tax rate (18% GST)
 */
export const TAX_RATE = 0.18;

/**
 * CGST rate (9%)
 */
export const CGST_RATE = 0.09;

/**
 * SGST rate (9%)
 */
export const SGST_RATE = 0.09;

/**
 * Default packaging charge
 */
export const DEFAULT_PACKAGING_CHARGE = 10;

/**
 * Default split count
 */
export const DEFAULT_SPLIT_COUNT = 2;

/**
 * Maximum notes length
 */
export const ORDER_NOTES_MAX = 200;

/**
 * Item notes max length
 */
export const ITEM_NOTES_MAX = 100;

/**
 * Currency denominations for quick cash buttons
 */
export const CASH_DENOMINATIONS = [50, 100, 500, 1000, 2000];

/**
 * Split options
 */
export const SPLIT_OPTIONS = [2, 3, 4, 5, 6];

/**
 * Discount modes
 */
export const DISCOUNT_MODES = {
  AMOUNT: "amount",
  PERCENT: "percent"
};

/**
 * Mode types
 */
export const MODE_TYPES = {
  ACTIVE: "active",
  POS: "pos"
};

/**
 * Mobile tab types
 */
export const MOBILE_TAB_TYPES = {
  MENU: "menu",
  CART: "cart"
};
