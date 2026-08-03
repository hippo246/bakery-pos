/**
 * Allergen Helper Utilities
 * Pure functions for allergen checking - NO React code
 */

/**
 * Get allergen severity level
 * @param {string} allergen - Allergen name
 * @param {Object} customerAllergens - Customer allergen profile
 * @returns {string|null} Severity level ("high" | "low" | null)
 */
export const getAllergenSeverity = (allergen, customerAllergens = []) => {
  if (!Array.isArray(customerAllergens) || customerAllergens.length === 0) {
    return null;
  }
  
  const normalizedAllergen = allergen.toLowerCase();
  const normalizedProfile = customerAllergens.map(a => a.toLowerCase());
  
  if (normalizedProfile.includes(normalizedAllergen)) {
    // High severity allergens
    const highSeverityAllergens = ["nuts", "peanuts", "shellfish", "fish", "eggs"];
    if (highSeverityAllergens.some(ha => normalizedAllergen.includes(ha))) {
      return "high";
    }
    return "low";
  }
  
  return null;
};

/**
 * Check if item conflicts with customer allergens
 * @param {Object} menuItem - Menu item
 * @param {Array} customerAllergens - Customer allergen profile
 * @param {Object} itemAllergens - Item allergen mapping
 * @returns {Object|null} Conflict info or null
 */
export const checkAllergenConflict = (menuItem, customerAllergens = [], itemAllergens = {}) => {
  if (!menuItem || !Array.isArray(customerAllergens) || customerAllergens.length === 0) {
    return null;
  }
  
  const itemAllergenList = itemAllergens[menuItem.id] || menuItem.allergens || [];
  
  if (!Array.isArray(itemAllergenList) || itemAllergenList.length === 0) {
    return null;
  }
  
  const conflicts = [];
  let maxSeverity = "low";
  
  itemAllergenList.forEach(allergen => {
    const severity = getAllergenSeverity(allergen, customerAllergens);
    if (severity) {
      conflicts.push({ allergen, severity });
      if (severity === "high") {
        maxSeverity = "high";
      }
    }
  });
  
  if (conflicts.length === 0) {
    return null;
  }
  
  return {
    menuItem: menuItem.name,
    allergens: conflicts.map(c => c.allergen),
    severity: maxSeverity
  };
};

/**
 * Get allergen display name
 * @param {string} allergen - Allergen code
 * @param {Object} allergenMap - Allergen name mapping
 * @returns {string} Display name
 */
export const getAllergenDisplayName = (allergen, allergenMap = {}) => {
  const upperKey = allergen.toUpperCase();
  return allergenMap[upperKey]?.name || allergen;
};

/**
 * Format allergen list for display
 * @param {Array} allergens - List of allergens
 * @param {Object} allergenMap - Allergen name mapping
 * @returns {string} Formatted string
 */
export const formatAllergenList = (allergens, allergenMap = {}) => {
  if (!Array.isArray(allergens) || allergens.length === 0) {
    return "";
  }
  
  return allergens
    .map(a => getAllergenDisplayName(a, allergenMap))
    .join(", ");
};
