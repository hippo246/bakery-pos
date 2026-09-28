/**
 * Order Configuration
 * Centralized configuration for order-related magic numbers and constants
 */

export const ORDER_CONFIG = {
  // Tax configuration
  DEFAULT_GST_RATE: 19, // 19% GST rate
  
  // Course configuration
  DEFAULT_COURSE: 1,
  DEFAULT_COURSE_SEQUENCE: [1, 2, 3],
  
  // Seating configuration
  DEFAULT_GUEST_COUNT: 4,
  DEFAULT_TABLE_NUMBER: '1',
  
  // Token configuration
  TOKEN_PREFIX: 'T',
  TOKEN_MIN: 1,
  TOKEN_MAX: 1000,
  
  // Order history
  ORDER_HISTORY_LIMIT: null, // No limit (was 50)
  
  // Tokens storage
  TOKENS_LIMIT: null, // No limit (was 100)
  
  // Kitchen delay
  KITCHEN_DELAY_MINUTES: 5,
  
  // Inventory
  INVENTORY_DEFAULT_STOCK: 0,
  
  // Loyalty points
  LOYALTY_POINTS_PER_RUPEE: 0.1, // 1 point per ₹10 spent
  
  // Order status
  ORDER_STATUS: {
    CREATED: 'created',
    FIRED: 'fired',
    COMPLETED: 'completed',
    PAID: 'paid',
    SENT_TO_KITCHEN: 'SENT_TO_KITCHEN'
  },
  
  // Table status
  TABLE_STATUS: {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    CLEANING: 'cleaning',
    RESERVED: 'reserved',
    DIRTY: 'dirty'
  },
  
  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    OTHER: 'OTHER'
  },
  
  // Order types
  ORDER_TYPES: {
    DINE_IN: 'dine_in',
    TAKEAWAY: 'takeaway',
    DELIVERY: 'delivery'
  }
};

export default ORDER_CONFIG;