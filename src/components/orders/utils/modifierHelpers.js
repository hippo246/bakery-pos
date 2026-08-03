/**
 * Modifier Helper Utilities
 * Pure functions for modifier operations - NO React code
 */

/**
 * Toggle modifier selection
 * @param {Object} selectedModifiers - Current selected modifiers
 * @param {string} itemId - Item ID
 * @param {string} categoryId - Modifier category ID
 * @param {string} optionId - Modifier option ID
 * @param {boolean} isMultiSelect - Whether category allows multiple selections
 * @returns {Object} Updated selected modifiers
 */
export const toggleModifier = (selectedModifiers, itemId, categoryId, optionId, isMultiSelect = false) => {
  const itemModifiers = selectedModifiers[itemId] || {};
  const currentSelection = itemModifiers[categoryId];
  
  if (isMultiSelect) {
    // Multi-select: toggle option in array
    const currentArray = Array.isArray(currentSelection) ? currentSelection : [];
    const isSelected = currentArray.includes(optionId);
    
    if (isSelected) {
      // Remove option
      const newArray = currentArray.filter(id => id !== optionId);
      return {
        ...selectedModifiers,
        [itemId]: {
          ...itemModifiers,
          [categoryId]: newArray.length > 0 ? newArray : undefined
        }
      };
    } else {
      // Add option
      return {
        ...selectedModifiers,
        [itemId]: {
          ...itemModifiers,
          [categoryId]: [...currentArray, optionId]
        }
      };
    }
  } else {
    // Single-select: replace selection
    if (currentSelection === optionId) {
      // Deselect
      const { [categoryId]: removed, ...rest } = itemModifiers;
      return {
        ...selectedModifiers,
        [itemId]: Object.keys(rest).length > 0 ? rest : undefined
      };
    } else {
      // Select new option
      return {
        ...selectedModifiers,
        [itemId]: {
          ...itemModifiers,
          [categoryId]: optionId
        }
      };
    }
  }
};

/**
 * Apply modifiers to cart item
 * @param {Object} item - Cart item
 * @param {Object} selectedModifiers - Selected modifiers for this item
 * @param {Object} modifierCategories - Available modifier categories
 * @returns {Object} Updated item with modifiers
 */
export const applyModifiersToItem = (item, selectedModifiers, modifierCategories) => {
  if (!selectedModifiers || Object.keys(selectedModifiers).length === 0) {
    return { ...item, modifiers: [] };
  }
  
  const modifierNames = [];
  
  Object.entries(selectedModifiers).forEach(([categoryId, selection]) => {
    const category = modifierCategories[categoryId];
    if (!category) return;
    
    if (Array.isArray(selection)) {
      // Multi-select
      selection.forEach(optionId => {
        const option = category.options.find(opt => opt.id === optionId);
        if (option) modifierNames.push(option.name);
      });
    } else if (selection) {
      // Single-select
      const option = category.options.find(opt => opt.id === selection);
      if (option) modifierNames.push(option.name);
    }
  });
  
  return {
    ...item,
    modifiers: modifierNames
  };
};

/**
 * Calculate modifier price for an item
 * @param {Object} selectedModifiers - Selected modifiers for this item
 * @param {Object} modifierCategories - Available modifier categories
 * @returns {number} Total modifier price
 */
export const calculateModifierPriceForItem = (selectedModifiers, modifierCategories) => {
  if (!selectedModifiers || Object.keys(selectedModifiers).length === 0) {
    return 0;
  }
  
  let totalPrice = 0;
  
  Object.entries(selectedModifiers).forEach(([categoryId, selection]) => {
    const category = modifierCategories[categoryId];
    if (!category) return;
    
    if (Array.isArray(selection)) {
      // Multi-select
      selection.forEach(optionId => {
        const option = category.options.find(opt => opt.id === optionId);
        if (option && option.price) {
          totalPrice += Number(option.price) || 0;
        }
      });
    } else if (selection) {
      // Single-select
      const option = category.options.find(opt => opt.id === selection);
      if (option && option.price) {
        totalPrice += Number(option.price) || 0;
      }
    }
  });
  
  return totalPrice;
};

/**
 * Get applicable modifier categories for a menu item
 * @param {Object} menuItem - Menu item
 * @param {Object} modifierMap - Menu to modifier category mapping
 * @returns {Array} Applicable category IDs
 */
export const getApplicableModifierCategories = (menuItem, modifierMap) => {
  if (!menuItem || !modifierMap) return [];
  return modifierMap[menuItem.category] || [];
};

/**
 * Check if item has any modifiers
 * @param {Object} item - Cart item
 * @returns {boolean} Whether item has modifiers
 */
export const hasModifiers = (item) => {
  return item && Array.isArray(item.modifiers) && item.modifiers.length > 0;
};
