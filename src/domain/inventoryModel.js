// Inventory domain model with recipe-based deduction

import { generateId, createInventoryId } from './ids.js';

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

function devWarn(msg, value) { console.warn(`[inventoryModel] ${msg}`, value ?? ''); }

function toNonNegativeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function safeString(val, fallback = '') {
  return (val && typeof val === 'string') ? val.trim() : fallback;
}

function safeDateString(val) {
  if (!val) return new Date().toISOString().split('T')[0];
  const d = new Date(val);
  return Number.isFinite(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
}

function normalizeStockMovement(mv) {
  if (!mv || typeof mv !== 'object') return null;
  return {
    id: mv.id || generateId(),
    type: safeString(mv.type, 'adjustment'),
    qty: toNonNegativeNumber(mv.qty),
    previousQty: toNonNegativeNumber(mv.previousQty),
    newQty: toNonNegativeNumber(mv.newQty),
    reason: safeString(mv.reason),
    createdAt: mv.createdAt || new Date().toISOString()
  };
}

/**
 * Create a new inventory item
 * @param {object} input - Inventory item input data
 * @returns {InventoryItem} New inventory item
 */
export function createInventoryItem(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const rawMovements = Array.isArray(safeInput.movements) ? safeInput.movements : [];
  const movements = rawMovements.map(normalizeStockMovement).filter(Boolean).slice(-50);

  return {
    id: safeInput.id || createInventoryId(),
    name: safeString(safeInput.name, 'Unknown Item'),
    category: safeString(safeInput.category, 'Ingredients'),
    quantity: toNonNegativeNumber(safeInput.quantity, 0),
    unit: safeString(safeInput.unit, 'pieces'),
    minStock: toNonNegativeNumber(safeInput.minStock, 10),
    cost: toNonNegativeNumber(safeInput.cost, 0),
    supplier: safeString(safeInput.supplier, ''),
    lastRestock: safeDateString(safeInput.lastRestock),
    expiryDate: safeInput.expiryDate ? safeDateString(safeInput.expiryDate) : null,
    batchNo: safeString(safeInput.batchNo, ''),
    movements,
    updatedAt: safeInput.updatedAt || new Date().toISOString()
  };
}

/**
 * Normalize an inventory item
 * @param {object} item - Inventory item to normalize
 * @returns {InventoryItem} Normalized inventory item
 */
export function normalizeInventoryItem(item) {
  if (!item || typeof item !== 'object') {
    devWarn('skipping malformed inventory item', item);
    return null;
  }
  const rawMovements = Array.isArray(item.movements) ? item.movements : [];
  const movements = rawMovements.map(normalizeStockMovement).filter(Boolean).slice(-50);

  return {
    id: item.id || createInventoryId(),
    name: safeString(item.name, 'Unknown Item'),
    category: safeString(item.category, 'Ingredients'),
    quantity: toNonNegativeNumber(item.quantity, 0),
    unit: safeString(item.unit, 'pieces'),
    minStock: toNonNegativeNumber(item.minStock, 10),
    cost: toNonNegativeNumber(item.cost, 0),
    supplier: safeString(item.supplier, ''),
    lastRestock: safeDateString(item.lastRestock),
    expiryDate: item.expiryDate ? safeDateString(item.expiryDate) : null,
    batchNo: safeString(item.batchNo, ''),
    movements,
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

/**
 * Check if inventory item is low stock
 * @param {InventoryItem} item - Inventory item
 * @returns {boolean} True if low stock
 */
export function isLowStock(item) {
  if (!item || typeof item !== 'object') return false;
  const qty = toNonNegativeNumber(item.quantity);
  const min = toNonNegativeNumber(item.minStock);
  return qty <= min;
}

/**
 * Check if inventory item is out of stock
 * @param {InventoryItem} item - Inventory item
 * @returns {boolean} True if out of stock
 */
export function isOutOfStock(item) {
  if (!item || typeof item !== 'object') return false;
  return toNonNegativeNumber(item.quantity) <= 0;
}

/**
 * Get out of stock items
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {InventoryItem[]} Out of stock items
 */
export function getOutOfStockItems(inventory) {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(item => item && isOutOfStock(item));
}

/**
 * Get recipe for a menu item
 * @param {string} menuItemId - Menu item ID
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {Recipe|null} Recipe or null if not found
 */
export function getRecipeForMenuItem(menuItemId, recipes = []) {
  if (!menuItemId || typeof menuItemId !== 'string') return null;
  if (!Array.isArray(recipes)) return null;
  return recipes.find(r => r && String(r.menuItemId) === String(menuItemId)) || null;
}

/**
 * Check if an order can be fulfilled with current inventory
 * @param {object} order - Order object
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {object} Object with canFulfill (boolean) and missingItems (array)
 */
export function canFulfillOrder(order, inventory, recipes = []) {
  if (!order || !Array.isArray(order.items) || !Array.isArray(inventory)) {
    return { canFulfill: true, missingItems: [] };
  }

  const missingItems = [];

  order.items.forEach(orderItem => {
    if (!orderItem || typeof orderItem !== 'object') {
      devWarn('skipping malformed order item in canFulfillOrder', orderItem);
      return;
    }
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    if (!recipe) return;

    if (!Array.isArray(recipe.ingredients)) {
      devWarn('recipe has no ingredients array', recipe.menuItemId);
      return;
    }

    recipe.ingredients.forEach(ingredient => {
      if (!ingredient || typeof ingredient !== 'object') return;
      const inventoryItem = inventory.find(inv => inv && inv.id === ingredient.inventoryItemId);
      const required = toNonNegativeNumber(ingredient.quantity) * toNonNegativeNumber(orderItem.qty, 1);

      if (!inventoryItem) {
        missingItems.push({
          inventoryItemId: ingredient.inventoryItemId || null,
          name: safeString(ingredient.inventoryItemName, 'Unknown'),
          required,
          available: 0,
          unit: safeString(ingredient.unit, '')
        });
        return;
      }

      const available = toNonNegativeNumber(inventoryItem.quantity);
      if (available < required) {
        missingItems.push({
          inventoryItemId: inventoryItem.id,
          name: safeString(inventoryItem.name, 'Unknown'),
          required,
          available,
          unit: safeString(ingredient.unit, inventoryItem.unit)
        });
      }
    });
  });

  return { canFulfill: missingItems.length === 0, missingItems };
}

/**
 * Deduct inventory for order using recipes with inventoryDeducted flag
 * @param {object} order - Order object
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {Recipe[]} recipes - Recipe definitions
 * @returns {object} Object with updatedInventory, warnings, and updatedOrder
 */
export function deductInventoryForOrder(order, inventory, recipes = []) {
  if (!order || !Array.isArray(order.items) || !Array.isArray(inventory)) {
    return { updatedInventory: inventory || [], warnings: [], updatedOrder: order };
  }
  
  // FIX: Check if inventory is already deducted
  if (order.inventoryDeducted) {
    return { updatedInventory: inventory, warnings: [], updatedOrder: order };
  }

  // FIX: Validate order items before deduction
  if (!order.items || order.items.length === 0) {
    return { updatedInventory: inventory, warnings: ['No items to deduct'], updatedOrder: order };
  }

  const updatedInventory = inventory.map(item => ({ ...item }));
  const warnings = [];

  order.items.forEach(orderItem => {
    if (!orderItem || typeof orderItem !== 'object') {
      devWarn('skipping malformed order item in deductInventoryForOrder', orderItem);
      return;
    }
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    if (!recipe) return;

    if (!Array.isArray(recipe.ingredients)) {
      devWarn('recipe missing ingredients array', recipe.menuItemId);
      return;
    }

    recipe.ingredients.forEach(ingredient => {
      if (!ingredient || typeof ingredient !== 'object') return;
      const idx = updatedInventory.findIndex(inv => inv && inv.id === ingredient.inventoryItemId);

      if (idx === -1) {
        warnings.push(`Inventory item not found: ${safeString(ingredient.inventoryItemName, ingredient.inventoryItemId)}`);
        return;
      }

      const item = updatedInventory[idx];
      const totalDeduction = toNonNegativeNumber(ingredient.quantity) * toNonNegativeNumber(orderItem.qty, 1);
      const prevQty = toNonNegativeNumber(item.quantity);
      
      // FIX: Prevent negative inventory
      const newQuantity = Math.max(0, prevQty - totalDeduction);
      
      // FIX: Warn if deduction would exceed available stock (already handled by canFulfillOrder)
      if (newQuantity === 0 && prevQty > 0) {
        warnings.push(`Out of stock: ${item.name}`);
      } else if (newQuantity < toNonNegativeNumber(item.minStock)) {
        warnings.push(`Low stock warning: ${item.name} (${newQuantity} ${item.unit} remaining)`);
      }

      const movement = normalizeStockMovement({
        type: 'deduction',
        qty: totalDeduction,
        previousQty: prevQty,
        newQty: newQuantity,
        reason: `Order ${order.id || ''}`,
        createdAt: new Date().toISOString()
      });

      const existingMovements = Array.isArray(item.movements) ? item.movements : [];
      updatedInventory[idx] = {
        ...item,
        quantity: newQuantity,
        movements: [...existingMovements, movement].slice(-50),
        updatedAt: new Date().toISOString()
      };
    });
  });

  const updatedOrder = { ...order, inventoryDeducted: true };
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
  if (!order || !Array.isArray(order.items) || !Array.isArray(inventory)) {
    return { updatedInventory: inventory || [], updatedOrder: order };
  }
  if (!order.inventoryDeducted || order.inventoryRestored) {
    return { updatedInventory: inventory, updatedOrder: order };
  }

  const updatedInventory = inventory.map(item => ({ ...item }));

  order.items.forEach(orderItem => {
    if (!orderItem || typeof orderItem !== 'object') return;
    const recipe = getRecipeForMenuItem(orderItem.menuItemId, recipes);
    if (!recipe || !Array.isArray(recipe.ingredients)) return;

    recipe.ingredients.forEach(ingredient => {
      if (!ingredient || typeof ingredient !== 'object') return;
      const idx = updatedInventory.findIndex(inv => inv && inv.id === ingredient.inventoryItemId);
      if (idx === -1) return;

      const item = updatedInventory[idx];
      const totalRestoration = toNonNegativeNumber(ingredient.quantity) * toNonNegativeNumber(orderItem.qty, 1);
      const prevQty = toNonNegativeNumber(item.quantity);
      const newQuantity = prevQty + totalRestoration;

      const movement = normalizeStockMovement({
        type: 'restoration',
        qty: totalRestoration,
        previousQty: prevQty,
        newQty: newQuantity,
        reason: `Cancellation restore: Order ${order.id || ''}`,
        createdAt: new Date().toISOString()
      });

      const existingMovements = Array.isArray(item.movements) ? item.movements : [];
      updatedInventory[idx] = {
        ...item,
        quantity: newQuantity,
        movements: [...existingMovements, movement].slice(-50),
        updatedAt: new Date().toISOString()
      };
    });
  });

  const updatedOrder = { ...order, inventoryRestored: true };
  return { updatedInventory, updatedOrder };
}

/**
 * Restock inventory item
 * @param {InventoryItem[]} inventory - Current inventory
 * @param {string} itemId - Item ID to restock
 * @param {number} amount - Amount to add
 * @returns {InventoryItem[]} Updated inventory
 */
export function restockInventoryItem(inventory, itemId, amount) {
  if (!Array.isArray(inventory) || !itemId) return inventory || [];
  const safeAmount = toNonNegativeNumber(amount);
  if (safeAmount <= 0) return inventory;

  return inventory.map(item => {
    if (!item || item.id !== itemId) return item;
    const prevQty = toNonNegativeNumber(item.quantity);
    const newQuantity = prevQty + safeAmount;
    const movement = normalizeStockMovement({
      type: 'restock',
      qty: safeAmount,
      previousQty: prevQty,
      newQty: newQuantity,
      reason: 'Manual restock',
      createdAt: new Date().toISOString()
    });
    const existingMovements = Array.isArray(item.movements) ? item.movements : [];
    return {
      ...item,
      quantity: newQuantity,
      lastRestock: new Date().toISOString().split('T')[0],
      movements: [...existingMovements, movement].slice(-50),
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * Get total inventory value
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {number} Total value
 */
export function getTotalInventoryValue(inventory) {
  if (!Array.isArray(inventory)) return 0;
  const total = inventory.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const qty = toNonNegativeNumber(item.quantity);
    const cost = toNonNegativeNumber(item.cost);
    return sum + (qty * cost);
  }, 0);
  return Number.isFinite(total) ? Math.round(total * 100) / 100 : 0;
}

/**
 * Get low stock items
 * @param {InventoryItem[]} inventory - Inventory array
 * @returns {InventoryItem[]} Low stock items
 */
export function getLowStockItems(inventory) {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(item => item && isLowStock(item));
}

/**
 * Get inventory by category
 * @param {InventoryItem[]} inventory - Inventory array
 * @param {string} category - Category to filter by
 * @returns {InventoryItem[]} Filtered inventory
 */
export function getInventoryByCategory(inventory, category) {
  if (!Array.isArray(inventory) || !category) return [];
  return inventory.filter(item => item && item.category === category);
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
