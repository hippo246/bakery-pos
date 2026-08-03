/**
 * Item Helper Utilities
 * Pure functions for item operations - NO React code
 */

/**
 * Check if item is available (active and not 86'd)
 * @param {Object} item - Menu item
 * @returns {boolean} Whether item is available
 */
export const isItemAvailable = (item) => {
  if (!item) return false;
  return item.active === true && item.eightySixed !== true;
};

/**
 * Check if item is popular
 * @param {Object} item - Menu item
 * @returns {boolean} Whether item is popular
 */
export const isItemPopular = (item) => {
  if (!item) return false;
  return item.popular === true;
};

/**
 * Get item display name with quantity
 * @param {Object} item - Cart item
 * @returns {string} Display name
 */
export const getItemDisplayName = (item) => {
  if (!item) return "";
  const qty = Number.isFinite(item.qty) ? item.qty : 1;
  return qty > 1 ? `${item.name} × ${qty}` : item.name;
};

/**
 * Calculate item line total
 * @param {Object} item - Cart item
 * @returns {number} Line total
 */
export const calculateItemTotal = (item) => {
  if (!item) return 0;
  const qty = Number.isFinite(item.qty) ? item.qty : 0;
  const price = Number.isFinite(item.price) ? item.price : 0;
  return qty * price;
};

/**
 * Validate cart item structure
 * @param {Object} item - Cart item to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateCartItem = (item) => {
  if (!item) return "Item is missing";
  if (!item.name || typeof item.name !== "string") {
    return "Item has a missing name";
  }
  if (!(item.qty > 0)) {
    return `${item.name || "An item"} has an invalid quantity`;
  }
  if (!(item.price >= 0)) {
    return `${item.name || "An item"} has an invalid price`;
  }
  return null;
};

/**
 * Validate all cart items
 * @param {Array} items - Cart items to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateCartItems = (items) => {
  if (!Array.isArray(items)) return "Cart is not an array";
  if (items.length === 0) return "Cart is empty";
  
  for (const item of items) {
    const error = validateCartItem(item);
    if (error) return error;
  }
  return null;
};

/**
 * Check if item matches search query
 * @param {Object} item - Menu item
 * @param {string} query - Search query
 * @returns {boolean} Whether item matches
 */
export const itemMatchesSearch = (item, query) => {
  if (!item || !query) return false;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  
  const name = (item.name || "").toLowerCase();
  const category = (item.cat || "").toLowerCase();
  
  return name.includes(q) || category.includes(q);
};

/**
 * Check if item matches category filter
 * @param {Object} item - Menu item
 * @param {string} categoryFilter - Category filter
 * @returns {boolean} Whether item matches
 */
export const itemMatchesCategory = (item, categoryFilter) => {
  if (!item) return false;
  if (categoryFilter === "All") return true;
  if (categoryFilter === "Available only") {
    return isItemAvailable(item);
  }
  if (categoryFilter === "Popular") {
    return isItemPopular(item);
  }
  return item.cat === categoryFilter;
};

/**
 * Filter menu items by availability, category, and search
 * @param {Array} items - Menu items
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered items
 */
export const filterMenuItems = (items, filters = {}) => {
  const {
    showAvailableOnly = false,
    categoryFilter = "All",
    searchQuery = ""
  } = filters;
  
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => {
    if (showAvailableOnly && !isItemAvailable(item)) return false;
    if (!itemMatchesCategory(item, categoryFilter)) return false;
    if (searchQuery && !itemMatchesSearch(item, searchQuery)) return false;
    return true;
  });
};

/**
 * Calculate modifier price impact
 * @param {Object} modifier - Modifier option
 * @returns {number} Price impact
 */
export const calculateModifierPrice = (modifier) => {
  if (!modifier) return 0;
  return Number.isFinite(modifier.price) ? modifier.price : 0;
};

/**
 * Calculate total modifier price for an item
 * @param {Array} modifiers - Selected modifiers
 * @returns {number} Total modifier price
 */
export const calculateModifierTotal = (modifiers) => {
  if (!Array.isArray(modifiers)) return 0;
  return modifiers.reduce((sum, mod) => sum + calculateModifierPrice(mod), 0);
};
