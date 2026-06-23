// Inventory domain model with recipe-based deduction

import { generateId, createInventoryId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * Standard Inventory Item schema
 * @typedef {Object} InventoryItem
 * @property {string} id - Unique inventory item identifier
 * @property {string} name - Item name
 * @property {string} category - Item category
 * @property {number} quantity - Current quantity
 * @property {string} unit - Unit of measurement
 * @property {number} minStock - Minimum stock threshold
 * @property {number} cost - Cost per unit
 * @property {string} supplier - Supplier name
 * @property {string} lastRestock - Last restock date (ISO string)
 */

/**
 * Recipe/BOM (Bill of Materials) schema
 * @typedef {Object} Recipe
 * @property {string} menuItemId - Menu item ID
 * @property {string} menuItemName - Menu item name
 * @property {RecipeIngredient[]} ingredients - Required inventory items
 */

/**
 * @typedef {Object} RecipeIngredient
 * @property {string} inventoryItemId - Inventory item ID
 * @property {string} inventoryItemName - Inventory item name
 * @property {number} quantity - Quantity required per menu item
 * @property {string} unit - Unit of measurement
 */

/**
 * Create a new inventory item
 * @param {object} input - Inventory item input data
 * @returns {InventoryItem} New inventory item
 */
export function createInventoryItem(input = {}) {
  return {
    id: input.id || createInventoryId(),
    name: input.name || 'Unknown',
    category: input.category || 'Ingredients',
    quantity: typeof input.quantity === 'number' ? input.quantity : 0,
    unit: input.unit || 'pieces',
    minStock: typeof input.minStock === 'number' ? input.minStock : 10,
    cost: typeof input.cost === 'number' ? input.cost : 0,
    supplier: input.supplier || '',
    lastRestock: input.lastRestock || new Date().toISOString().split('T')[0]
  };
}

/**
 * Normalize an inventory item
 * @param {object} item - Inventory item to normalize
 * @returns {InventoryItem} Normalized inventory item
 */
export function normalizeInventoryItem(item) {
  if (!item) return null;

  return {
    id: item.id || createInventoryId(),
    name: item.name || 'Unknown',
    category: item.category || 'Ingredients',
    quantity: typeof item.quantity === 'number' ? item.quantity : 0,
    unit: item.unit || 'pieces',
    minStock: typeof item.minStock === 'number' ? item.minStock : 10,
    cost: typeof item.cost === 'number' ? item.cost : 0,
    supplier: item.supplier || '',
    lastRestock: item.lastRestock || new Date().toISOString().split('T')[0]
  };
}

/**
 * Check if inventory item is low stock
 * @param {InventoryItem} item - Inventory item
 * @returns {boolean} True if low stock
 */
export function isLowStock(item) {
  return item.quantity <= item.minStock;
}

/**
 * Check if inventory item is out of stock
 * @param {InventoryItem} item - Inventory item
 * @returns {boolean} True if out of stock
 */
export function isOutOfStock(item) {
  return item.quantity === 0;
}

/**
 * Get out of stock items
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {InventoryItem[]} Out of stock items
 */
export function getOutOfStockItems(inventory) {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(item => isOutOfStock(item));
}

/**
 * Get recipe for a menu item
 * @param {string} menuItemId - Menu item ID
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {Recipe|null} Recipe or null if not found
 */
export function getRecipeForMenuItem(menuItemId, recipes = []) {
  return recipes.find(r => r.menuItemId === menuItemId) || null;
}

/**
 * Check if an order can be fulfilled with current inventory
 * @param {object} order - Order object
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {object} Object with canFulfill (boolean) and missingItems (array)
 */
export function canFulfillOrder(order, inventory, recipes = []) {
  if (!order || !order.items || !Array.isArray(inventory)) {
    return { canFulfill: true, missingItems: [] };
  }

  const missingItems = [];

  // Process each order item
  order.items.forEach(orderItem => {
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    
    if (!recipe) {
      // No recipe found, assume it can be fulfilled
      return;
    }

    // Check each recipe ingredient
    recipe.ingredients.forEach(ingredient => {
      const inventoryItem = inventory.find(inv => inv.id === ingredient.inventoryItemId);
      
      if (!inventoryItem) {
        missingItems.push({
          name: ingredient.inventoryItemName,
          required: ingredient.quantity * orderItem.qty,
          available: 0,
          unit: ingredient.unit
        });
        return;
      }

      const totalRequired = ingredient.quantity * orderItem.qty;
      if (inventoryItem.quantity < totalRequired) {
        missingItems.push({
          name: ingredient.inventoryItemName,
          required: totalRequired,
          available: inventoryItem.quantity,
          unit: ingredient.unit
        });
      }
    });
  });

  return {
    canFulfill: missingItems.length === 0,
    missingItems
  };
}

/**
 * Deduct inventory for order using recipes with inventoryDeducted flag
 * @param {object} order - Order object
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {object} Object with updatedInventory, warnings, and updatedOrder
 */
export function deductInventoryForOrder(order, inventory, recipes = []) {
  if (!order || !order.items || !Array.isArray(inventory)) {
    return { updatedInventory: inventory, warnings: [], updatedOrder: order };
  }

  // Check if inventory already deducted for this order
  if (order.inventoryDeducted) {
    return { updatedInventory: inventory, warnings: [], updatedOrder: order };
  }

  const updatedInventory = [...inventory];
  const warnings = [];

  // Process each order item
  order.items.forEach(orderItem => {
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    
    if (!recipe) {
      // No recipe found, skip this item
      return;
    }

    // Deduct each recipe ingredient
    recipe.ingredients.forEach(ingredient => {
      const inventoryItem = updatedInventory.find(inv => inv.id === ingredient.inventoryItemId);
      
      if (!inventoryItem) {
        warnings.push(`Inventory item not found: ${ingredient.inventoryItemName}`);
        return;
      }

      const totalDeduction = ingredient.quantity * orderItem.qty;
      const newQuantity = Math.max(0, inventoryItem.quantity - totalDeduction);

      if (newQuantity < inventoryItem.minStock) {
        warnings.push(`Low stock warning: ${inventoryItem.name} (${newQuantity} ${inventoryItem.unit} remaining)`);
      }

      if (newQuantity === 0 && inventoryItem.quantity > 0) {
        warnings.push(`Out of stock: ${inventoryItem.name}`);
      }

      // Update inventory item
      const index = updatedInventory.findIndex(inv => inv.id === inventoryItem.id);
      if (index !== -1) {
        updatedInventory[index] = {
          ...updatedInventory[index],
          quantity: newQuantity,
          lastRestock: new Date().toISOString().split('T')[0]
        };
      }
    });
  });

  // Mark order as inventory deducted
  const updatedOrder = {
    ...order,
    inventoryDeducted: true
  };

  return { updatedInventory, warnings, updatedOrder };
}

/**
 * Restore inventory for a cancelled order
 * @param {object} order - Order object
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {object} Object with updatedInventory
 */
export function restoreInventoryForCancelledOrder(order, inventory, recipes = []) {
  if (!order || !order.items || !Array.isArray(inventory)) {
    return { updatedInventory: inventory };
  }

  // Only restore if inventory was deducted
  if (!order.inventoryDeducted) {
    return { updatedInventory: inventory };
  }

  const updatedInventory = [...inventory];

  // Process each order item to restore inventory
  order.items.forEach(orderItem => {
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    
    if (!recipe) {
      // No recipe found, skip this item
      return;
    }

    // Restore each recipe ingredient
    recipe.ingredients.forEach(ingredient => {
      const inventoryItem = updatedInventory.find(inv => inv.id === ingredient.inventoryItemId);
      
      if (!inventoryItem) {
        return;
      }

      const totalRestoration = ingredient.quantity * orderItem.qty;
      const newQuantity = inventoryItem.quantity + totalRestoration;

      // Update inventory item
      const index = updatedInventory.findIndex(inv => inv.id === inventoryItem.id);
      if (index !== -1) {
        updatedInventory[index] = {
          ...updatedInventory[index],
          quantity: newQuantity,
          lastRestock: new Date().toISOString().split('T')[0]
        };
      }
    });
  });

  return { updatedInventory };
}

/**
 * Restock inventory item
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {string} itemId - Item ID to restock
 * @param {number} amount - Amount to add
 * @returns {InventoryItem[]} Updated inventory
 */
export function restockInventoryItem(inventory, itemId, amount) {
  if (!Array.isArray(inventory) || amount <= 0) return inventory;

  return inventory.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        quantity: item.quantity + amount,
        lastRestock: new Date().toISOString().split('T')[0]
      };
    }
    return item;
  });
}

/**
 * Get total inventory value
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {number} Total value
 */
export function getTotalInventoryValue(inventory) {
  if (!Array.isArray(inventory)) return 0;
  return inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
}

/**
 * Get low stock items
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {InventoryItem[]} Low stock items
 */
export function getLowStockItems(inventory) {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(item => isLowStock(item));
}

/**
 * Get inventory by category
 * @param {InventoryItem[]} inventory - Inventory array
 * @param {string} category - Category to filter by
 * @returns {InventoryItem[]} Filtered inventory
 */
export function getInventoryByCategory(inventory, category) {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(item => item.category === category);
}

/**
 * Basic recipe definitions for common menu items
 * This should be expanded based on actual menu
 */
export const BASIC_RECIPES = [
  {
    menuItemId: 'menu-cappuccino',
    menuItemName: 'Cappuccino',
    ingredients: [
      { inventoryItemId: 'inv-001', inventoryItemName: 'Coffee Beans (Arabica)', quantity: 0.02, unit: 'kg' },
      { inventoryItemId: 'inv-002', inventoryItemName: 'Milk (Whole)', quantity: 0.2, unit: 'liters' },
      { inventoryItemId: 'inv-013', inventoryItemName: 'Cups (Small)', quantity: 1, unit: 'pieces' },
      { inventoryItemId: 'inv-015', inventoryItemName: 'Lids', quantity: 1, unit: 'pieces' }
    ]
  },
  {
    menuItemId: 'menu-latte',
    menuItemName: 'Latte',
    ingredients: [
      { inventoryItemId: 'inv-001', inventoryItemName: 'Coffee Beans (Arabica)', quantity: 0.02, unit: 'kg' },
      { inventoryItemId: 'inv-002', inventoryItemName: 'Milk (Whole)', quantity: 0.3, unit: 'liters' },
      { inventoryItemId: 'inv-013', inventoryItemName: 'Cups (Small)', quantity: 1, unit: 'pieces' },
      { inventoryItemId: 'inv-015', inventoryItemName: 'Lids', quantity: 1, unit: 'pieces' }
    ]
  },
  {
    menuItemId: 'menu-croissant',
    menuItemName: 'Croissant',
    ingredients: [
      { inventoryItemId: 'inv-009', inventoryItemName: 'Sourdough Bread', quantity: 0.5, unit: 'loaves' }
    ]
  },
  {
    menuItemId: 'menu-cold-brew',
    menuItemName: 'Cold Brew',
    ingredients: [
      { inventoryItemId: 'inv-001', inventoryItemName: 'Coffee Beans (Arabica)', quantity: 0.03, unit: 'kg' },
      { inventoryItemId: 'inv-012', inventoryItemName: 'Ice Cubes', quantity: 5, unit: 'trays' },
      { inventoryItemId: 'inv-014', inventoryItemName: 'Cups (Large)', quantity: 1, unit: 'pieces' },
      { inventoryItemId: 'inv-015', inventoryItemName: 'Lids', quantity: 1, unit: 'pieces' }
    ]
  }
];
