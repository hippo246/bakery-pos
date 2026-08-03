/**
 * Cart Type Definitions
 * TypeScript-like type definitions for cart operations
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - Unique item identifier
 * @property {string} menuItemId - Menu item ID
 * @property {string} name - Item name
 * @property {string} category - Item category
 * @property {number} qty - Quantity
 * @property {number} price - Unit price
 * @property {string[]} [modifiers] - Selected modifiers
 * @property {string} [notes] - Item notes
 * @property {string} [station] - Kitchen station (Bar/Kitchen)
 */

/**
 * @typedef {Object} CartTotals
 * @property {number} subtotal - Subtotal before tax/discount
 * @property {number} taxAmount - Total tax amount
 * @property {number} cgst - CGST amount
 * @property {number} sgst - SGST amount
 * @property {number} discountAmount - Discount amount
 * @property {number} packagingAmount - Packaging charge
 * @property {number} total - Final total
 */

/**
 * @typedef {Object} CartState
 * @property {CartItem[]} items - Cart items
 * @property {string} discountInput - Discount input value
 * @property {string} discountMode - Discount mode ("amount" | "percent")
 * @property {string} packagingCharge - Packaging charge
 */

/**
 * @typedef {Object} CartActions
 * @property {Function} addItem - Add item to cart
 * @property {Function} removeItem - Remove item from cart
 * @property {Function} updateQuantity - Update item quantity
 * @property {Function} updateNotes - Update item notes
 * @property {Function} clearCart - Clear all items
 * @property {Function} setDiscount - Set discount
 * @property {Function} setPackaging - Set packaging charge
 */

/**
 * @typedef {Object} ModifierSelection
 * @property {string} categoryId - Modifier category ID
 * @property {string|string[]} optionId - Selected option ID(s)
 */

/**
 * @typedef {Object} SelectedModifiers
 * @property {Object.<string, ModifierSelection>} - Item ID to modifier selections
 */

/**
 * @typedef {Object} HeldBill
 * @property {string} id - Hold ID
 * @property {number} savedAt - Timestamp when held
 * @property {CartItem[]} cart - Cart items
 * @property {string} orderType - Order type
 * @property {string|null} selectedTable - Selected table
 * @property {string} customerPhone - Customer phone
 * @property {string} customerAddress - Customer address
 * @property {string} platformOrderId - Platform order ID
 * @property {string} paymentMethod - Payment method
 * @property {number} splitCount - Split count
 * @property {string} discountInput - Discount input
 * @property {string} discountMode - Discount mode
 * @property {string} orderNotes - Order notes
 * @property {string} packagingCharge - Packaging charge
 */
