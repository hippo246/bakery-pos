// Purchasing domain model with supplier, purchase order, and goods receiving schemas

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { roundCurrency } from './money.js';

/**
 * Purchase Order schema
 * @typedef {Object} PurchaseOrder
 * @property {string} id - Unique purchase order identifier
 * @property {string} poNumber - Purchase order number (e.g., PO-20260624-001)
 * @property {string} supplierId - Supplier identifier
 * @property {string} supplierName - Supplier name (denormalized for display)
 * @property {"DRAFT"|"READY_TO_SEND"|"SENT"|"CONFIRMED"|"PARTIALLY_RECEIVED"|"RECEIVED"|"OVERDUE"|"CANCELLED"|"CLOSED"} status - Order status
 * @property {"UNPAID"|"PARTIAL"|"PAID"} paymentStatus - Payment status
 * @property {"NOT_RECEIVED"|"PARTIALLY_RECEIVED"|"FULLY_RECEIVED"} receivingStatus - Receiving status
 * @property {number} orderDate - Order creation timestamp
 * @property {number|null} expectedDate - Expected delivery timestamp
 * @property {number|null} sentDate - When order was sent to supplier
 * @property {number|null} confirmedDate - When supplier confirmed the order
 * @property {number|null} receivedDate - When fully received
 * @property {string|null} branchId - Branch identifier if multi-location
 * @property {string|null} supplierReference - Supplier's reference number
 * @property {PurchaseOrderLine[]} items - Order line items
 * @property {number} subtotal - Subtotal before tax and charges
 * @property {number} tax - Tax amount
 * @property {number} deliveryCharge - Delivery charge
 * @property {number} otherCharges - Other charges
 * @property {number} discount - Discount amount
 * @property {number} total - Final total
 * @property {number} paidAmount - Amount paid so far
 * @property {number} remainingAmount - Remaining amount to pay
 * @property {string|null} invoiceNumber - Supplier invoice number
 * @property {number|null} invoiceDate - Invoice date
 * @property {number|null} invoiceTotal - Invoice total amount
 * @property {string|null} expenseId - Linked expense record ID
 * @property {string} paymentTerms - Payment terms (e.g., "NET 30")
 * @property {string} deliveryTerms - Delivery terms (e.g., "FOB")
 * @property {string|null} deliveryLocation - Delivery location
 * @property {string|null} contactPerson - Contact person
 * @property {string} supplierNote - Note to supplier
 * @property {string} internalNote - Internal note
 * @property {string|null} createdBy - User who created the order
 * @property {string|null} modifiedBy - User who last modified
 * @property {GoodsReceipt[]} receipts - Goods receipt records
 * @property {Document[]} attachments - Attached documents
 * @property {Activity[]} activity - Activity log
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Purchase Order Line schema
 * @typedef {Object} PurchaseOrderLine
 * @property {string} id - Unique line identifier
 * @property {string} inventoryItemId - Inventory item identifier
 * @property {string} inventoryItemName - Inventory item name (denormalized)
 * @property {string|null} supplierItemCode - Supplier's item code
 * @property {string} supplierItemName - Supplier's item name
 * @property {number} orderedQuantity - Quantity ordered
 * @property {string} unit - Unit of measurement
 * @property {number} unitPrice - Unit price
 * @property {number} taxRate - Tax rate (percentage)
 * @property {number} taxAmount - Tax amount for this line
 * @property {number} lineTotal - Line total including tax
 * @property {number} receivedQuantity - Quantity received so far
 * @property {number} remainingQuantity - Quantity remaining to receive
 * @property {number} damagedQuantity - Damaged quantity
 * @property {number} rejectedQuantity - Rejected quantity
 * @property {string|null} note - Line item note
 */

/**
 * Supplier schema
 * @typedef {Object} Supplier
 * @property {string} id - Unique supplier identifier
 * @property {string} name - Supplier name
 * @property {string} category - Supplier category
 * @property {boolean} active - Whether supplier is active
 * @property {boolean} preferred - Whether supplier is preferred
 * @property {string} contactPerson - Contact person name
 * @property {string} phone - Phone number
 * @property {string} email - Email address
 * @property {string} address - Physical address
 * @property {string} city - City
 * @property {string} state - State/region
 * @property {string} postalCode - Postal code
 * @property {string} country - Country
 * @property {string|null} gstNumber - GST/Tax number
 * @property {string|null} legalName - Legal business name
 * @property {string} paymentTerms - Payment terms
 * @property {number} deliveryDays - Expected delivery days
 * @property {number} minimumOrder - Minimum order amount
 * @property {number} deliveryCharge - Delivery charge
 * @property {string} taxDetails - Tax details
 * @property {string} notes - Operational notes
 * @property {string} internalNote - Internal notes
 * @property {SupplierItem[]} suppliedItems - Items supplied by this supplier
 * @property {number} orderCount - Total orders from this supplier
 * @property {number} unpaidBalance - Outstanding balance
 * @property {number|null} lastOrderDate - Last order date
 * @property {number|null} lastDeliveryDate - Last delivery date
 * @property {Document[]} documents - Attached documents
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Supplier Item schema
 * @typedef {Object} SupplierItem
 * @property {string} id - Unique mapping identifier
 * @property {string} supplierId - Supplier identifier
 * @property {string} inventoryItemId - Inventory item identifier
 * @property {string} inventoryItemName - Inventory item name
 * @property {string} supplierItemCode - Supplier's item code
 * @property {string} supplierItemName - Supplier's item name
 * @property {string} unit - Unit of measurement
 * @property {number} currentPrice - Current price
 * @property {number|null} previousPrice - Previous price
 * @property {string|null} supplierCode - Internal supplier code
 * @property {number|null} leadTime - Lead time in days
 * @property {number|null} minimumOrderQty - Minimum order quantity
 * @property {string|null} availabilityNote - Availability notes
 * @property {number|null} lastPurchasedDate - Last purchase date
 * @property {boolean} active - Whether this mapping is active
 */

/**
 * Goods Receipt schema
 * @typedef {Object} GoodsReceipt
 * @property {string} id - Unique receipt identifier
 * @property {string} receiptNumber - Receipt number
 * @property {string} purchaseOrderId - Purchase order identifier
 * @property {string} poNumber - Purchase order number
 * @property {string} supplierId - Supplier identifier
 * @property {string} supplierName - Supplier name
 * @property {number} receivedDate - Receipt timestamp
 * @property {string|null} receivedBy - User who received goods
 * @property {GoodsReceiptLine[]} lines - Receipt line items
 * @property {string|null} deliveryNoteNumber - Delivery note number
 * @property {string|null} invoiceNumber - Invoice number
 * @property {number|null} invoiceTotal - Invoice total
 * @property {string|null} batchNumber - Batch/lot number
 * @property {number|null} manufactureDate - Manufacture date
 * @property {number|null} expiryDate - Expiry date
 * @property {string} notes - Receiving notes
 * @property {Variance[]} variances - Delivery variances
 * @property {string|null} expenseId - Linked expense record ID
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Goods Receipt Line schema
 * @typedef {Object} GoodsReceiptLine
 * @property {string} id - Unique line identifier
 * @property {string} purchaseOrderLineId - PO line identifier
 * @property {string} inventoryItemId - Inventory item identifier
 * @property {string} inventoryItemName - Inventory item name
 * @property {number} orderedQuantity - Quantity originally ordered
 * @property {number} previouslyReceived - Quantity received before this receipt
 * @property {number} receivedQuantity - Quantity received in this receipt
 * @property {number} damagedQuantity - Damaged quantity
 * @property {number} rejectedQuantity - Rejected quantity
 * @property {number} acceptedQuantity - Accepted quantity (received - damaged - rejected)
 * @property {string} unit - Unit of measurement
 * @property {number} expectedPrice - Expected unit price
 * @property {number} actualPrice - Actual unit price
 * @property {string|null} batchNumber - Batch/lot number
 * @property {number|null} manufactureDate - Manufacture date
 * @property {number|null} expiryDate - Expiry date
 * @property {string|null} note - Line note
 */

/**
 * Variance schema
 * @typedef {Object} Variance
 * @property {string} id - Unique variance identifier
 * @property {string} type - Variance type (SHORT_DELIVERED, OVER_DELIVERED, DAMAGED, REJECTED, WRONG_ITEM, PRICE_MISMATCH, etc.)
 * @property {string} inventoryItemId - Inventory item identifier
 * @property {string} inventoryItemName - Inventory item name
 * @property {number} ordered - Ordered quantity
 * @property {number} received - Received quantity
 * @property {number} accepted - Accepted quantity
 * @property {number} difference - Difference amount
 * @property {string} reason - Reason for variance
 * @property {string} note - Additional notes
 * @property {"OPEN"|"RESOLVED"|"ACCEPTED"} resolutionState - Resolution state
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Document schema
 * @typedef {Object} Document
 * @property {string} id - Unique document identifier
 * @property {string} type - Document type (QUOTE, PO, INVOICE, DELIVERY_NOTE, RECEIPT, AGREEMENT, PRICE_LIST, OTHER)
 * @property {string} filename - Original filename
 * @property {string} url - Document URL/path
 * @property {number} fileSize - File size in bytes
 * @property {string} mimeType - MIME type
 * @property {number} uploadedAt - Upload timestamp
 * @property {string|null} uploadedBy - User who uploaded
 */

/**
 * Activity schema
 * @typedef {Object} Activity
 * @property {string} id - Unique activity identifier
 * @property {string} type - Activity type (CREATED, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, INVOICE_ATTACHED, PAYMENT_RECORDED, EDITED, CANCELLED)
 * @property {string} description - Activity description
 * @property {string|null} userId - User who performed the action
 * @property {number} timestamp - Activity timestamp
 * @property {object} metadata - Additional metadata
 */

// Valid purchase order statuses
export const PO_STATUSES = ['DRAFT', 'READY_TO_SEND', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'OVERDUE', 'CANCELLED', 'CLOSED'];

// Valid payment statuses
export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID'];

// Valid receiving statuses
export const RECEIVING_STATUSES = ['NOT_RECEIVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'];

// Valid variance types
export const VARIANCE_TYPES = ['SHORT_DELIVERED', 'OVER_DELIVERED', 'DAMAGED', 'REJECTED', 'WRONG_ITEM', 'PRICE_MISMATCH', 'MISSING_INVOICE', 'MISSING_DELIVERY_NOTE', 'EXPIRY_TOO_SOON', 'UNKNOWN_ITEM'];

// Valid document types
export const DOCUMENT_TYPES = ['QUOTE', 'PO', 'INVOICE', 'DELIVERY_NOTE', 'RECEIPT', 'AGREEMENT', 'PRICE_LIST', 'OTHER'];

// Valid activity types
export const ACTIVITY_TYPES = ['CREATED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'INVOICE_ATTACHED', 'PAYMENT_RECORDED', 'EDITED', 'CANCELLED'];

// Valid supplier categories
export const SUPPLIER_CATEGORIES = ['INGREDIENTS', 'DAIRY', 'BAKERY', 'BEVERAGES', 'SUPPLIES', 'EQUIPMENT', 'SERVICES', 'OTHER'];


function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function safeStr(v, fallback = '') {
  return (v === null || v === undefined) ? fallback : String(v).trim();
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * Generate a purchase order number
 * Format: PO-YYYYMMDD-XXX
 */
export function generatePONumber(date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PO-${dateStr}-${random}`;
}

/**
 * Generate a goods receipt number
 * Format: GR-YYYYMMDD-XXX
 */
export function generateReceiptNumber(date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `GR-${dateStr}-${random}`;
}

/**
 * Create a new purchase order
 */
export function createPurchaseOrder(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  
  const status = PO_STATUSES.includes(safeInput.status) ? safeInput.status : 'DRAFT';
  const paymentStatus = PAYMENT_STATUSES.includes(safeInput.paymentStatus) ? safeInput.paymentStatus : 'UNPAID';
  const receivingStatus = RECEIVING_STATUSES.includes(safeInput.receivingStatus) ? safeInput.receivingStatus : 'NOT_RECEIVED';

  const rawItems = safeArr(safeInput.items);
  const items = rawItems.map(createPurchaseOrderLine);
  
  const rawReceipts = safeArr(safeInput.receipts);
  const receipts = rawReceipts.map(normalizeGoodsReceipt);

  const rawAttachments = safeArr(safeInput.attachments);
  const attachments = rawAttachments.map(normalizeDocument);

  const rawActivity = safeArr(safeInput.activity);
  const activity = rawActivity.map(normalizeActivity);

  const calculated = calculatePOTotals(items, safeInput.tax, safeInput.deliveryCharge, safeInput.otherCharges, safeInput.discount);

  return {
    id: safeInput.id || generateId(),
    poNumber: safeStr(safeInput.poNumber) || generatePONumber(),
    supplierId: safeStr(safeInput.supplierId),
    supplierName: safeStr(safeInput.supplierName),
    status,
    paymentStatus,
    receivingStatus,
    orderDate: safeInput.orderDate ? toTimestamp(safeInput.orderDate) : now(),
    expectedDate: safeInput.expectedDate ? toTimestamp(safeInput.expectedDate) : null,
    sentDate: safeInput.sentDate ? toTimestamp(safeInput.sentDate) : null,
    confirmedDate: safeInput.confirmedDate ? toTimestamp(safeInput.confirmedDate) : null,
    receivedDate: safeInput.receivedDate ? toTimestamp(safeInput.receivedDate) : null,
    branchId: safeStr(safeInput.branchId),
    supplierReference: safeStr(safeInput.supplierReference),
    items,
    subtotal: calculated.subtotal,
    deliveryCharge: safeNum(safeInput.deliveryCharge),
    otherCharges: safeNum(safeInput.otherCharges),
    discount: safeNum(safeInput.discount),
    tax: calculated.tax,
    total: calculated.total,
    paidAmount: safeNum(safeInput.paidAmount),
    remainingAmount: calculated.total - safeNum(safeInput.paidAmount),
    invoiceNumber: safeStr(safeInput.invoiceNumber) || null,
    invoiceDate: safeInput.invoiceDate ? toTimestamp(safeInput.invoiceDate) : null,
    invoiceTotal: safeNum(safeInput.invoiceTotal),
    expenseId: safeStr(safeInput.expenseId) || null,
    paymentTerms: safeStr(safeInput.paymentTerms, 'NET 30'),
    deliveryTerms: safeStr(safeInput.deliveryTerms),
    deliveryLocation: safeStr(safeInput.deliveryLocation),
    contactPerson: safeStr(safeInput.contactPerson),
    supplierNote: safeStr(safeInput.supplierNote),
    internalNote: safeStr(safeInput.internalNote),
    createdBy: safeStr(safeInput.createdBy),
    modifiedBy: safeStr(safeInput.modifiedBy),
    receipts,
    attachments,
    activity,
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now()
  };
}

/**
 * Create a purchase order line
 */
export function createPurchaseOrderLine(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  
  const orderedQuantity = safeNum(safeInput.orderedQuantity);
  const unitPrice = safeNum(safeInput.unitPrice);
  const taxRate = safeNum(safeInput.taxRate);
  const lineTotal = orderedQuantity * unitPrice;
  const taxAmount = lineTotal * (taxRate / 100);

  return {
    id: safeInput.id || generateId(),
    inventoryItemId: safeStr(safeInput.inventoryItemId),
    inventoryItemName: safeStr(safeInput.inventoryItemName),
    supplierItemCode: safeStr(safeInput.supplierItemCode) || null,
    supplierItemName: safeStr(safeInput.supplierItemName),
    orderedQuantity,
    unit: safeStr(safeInput.unit, 'pcs'),
    unitPrice,
    taxRate,
    taxAmount: roundCurrency(taxAmount),
    lineTotal: roundCurrency(lineTotal + taxAmount),
    receivedQuantity: safeNum(safeInput.receivedQuantity),
    remainingQuantity: orderedQuantity - safeNum(safeInput.receivedQuantity),
    damagedQuantity: safeNum(safeInput.damagedQuantity),
    rejectedQuantity: safeNum(safeInput.rejectedQuantity),
    note: safeStr(safeInput.note) || null
  };
}

/**
 * Calculate purchase order totals
 */
export function calculatePOTotals(items, taxRate = 0, deliveryCharge = 0, otherCharges = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const lineTotal = safeNum(item.lineTotal);
    return sum + lineTotal;
  }, 0);

  const taxAmount = subtotal * (safeNum(taxRate) / 100);
  const total = Math.max(0, subtotal + taxAmount + safeNum(deliveryCharge) + safeNum(otherCharges) - safeNum(discount));

  return {
    subtotal: roundCurrency(subtotal),
    tax: roundCurrency(taxAmount),
    deliveryCharge: roundCurrency(safeNum(deliveryCharge)),
    otherCharges: roundCurrency(safeNum(otherCharges)),
    discount: roundCurrency(safeNum(discount)),
    total: roundCurrency(total)
  };
}

/**
 * Normalize a purchase order
 */
export function normalizePurchaseOrder(po) {
  if (!po || typeof po !== 'object') return null;

  const status = PO_STATUSES.includes(po.status) ? po.status : 'DRAFT';
  const paymentStatus = PAYMENT_STATUSES.includes(po.paymentStatus) ? po.paymentStatus : 'UNPAID';
  const receivingStatus = RECEIVING_STATUSES.includes(po.receivingStatus) ? po.receivingStatus : 'NOT_RECEIVED';

  const rawItems = safeArr(po.items);
  const items = rawItems.map(normalizePurchaseOrderLine).filter(Boolean);

  const rawReceipts = safeArr(po.receipts);
  const receipts = rawReceipts.map(normalizeGoodsReceipt).filter(Boolean);

  const rawAttachments = safeArr(po.attachments);
  const attachments = rawAttachments.map(normalizeDocument).filter(Boolean);

  const rawActivity = safeArr(po.activity);
  const activity = rawActivity.map(normalizeActivity).filter(Boolean);

  const calculated = calculatePOTotals(items, po.taxRate, po.deliveryCharge, po.otherCharges, po.discount);

  return {
    id: po.id || generateId(),
    poNumber: safeStr(po.poNumber) || generatePONumber(),
    supplierId: safeStr(po.supplierId),
    supplierName: safeStr(po.supplierName),
    status,
    paymentStatus,
    receivingStatus,
    orderDate: po.orderDate ? toTimestamp(po.orderDate) : now(),
    expectedDate: po.expectedDate ? toTimestamp(po.expectedDate) : null,
    sentDate: po.sentDate ? toTimestamp(po.sentDate) : null,
    confirmedDate: po.confirmedDate ? toTimestamp(po.confirmedDate) : null,
    receivedDate: po.receivedDate ? toTimestamp(po.receivedDate) : null,
    branchId: safeStr(po.branchId),
    supplierReference: safeStr(po.supplierReference),
    items,
    subtotal: calculated.subtotal,
    deliveryCharge: safeNum(po.deliveryCharge),
    otherCharges: safeNum(po.otherCharges),
    discount: safeNum(po.discount),
    tax: calculated.tax,
    total: calculated.total,
    paidAmount: safeNum(po.paidAmount),
    remainingAmount: calculated.total - safeNum(po.paidAmount),
    invoiceNumber: safeStr(po.invoiceNumber) || null,
    invoiceDate: po.invoiceDate ? toTimestamp(po.invoiceDate) : null,
    invoiceTotal: safeNum(po.invoiceTotal),
    expenseId: safeStr(po.expenseId) || null,
    paymentTerms: safeStr(po.paymentTerms, 'NET 30'),
    deliveryTerms: safeStr(po.deliveryTerms),
    deliveryLocation: safeStr(po.deliveryLocation),
    contactPerson: safeStr(po.contactPerson),
    supplierNote: safeStr(po.supplierNote),
    internalNote: safeStr(po.internalNote),
    createdBy: safeStr(po.createdBy),
    modifiedBy: safeStr(po.modifiedBy),
    receipts,
    attachments,
    activity,
    createdAt: po.createdAt ? toTimestamp(po.createdAt) : now(),
    updatedAt: po.updatedAt ? toTimestamp(po.updatedAt) : now()
  };
}

/**
 * Normalize a purchase order line
 */
export function normalizePurchaseOrderLine(line) {
  if (!line || typeof line !== 'object') return null;

  const orderedQuantity = safeNum(line.orderedQuantity);
  const unitPrice = safeNum(line.unitPrice);
  const taxRate = safeNum(line.taxRate);
  const lineTotal = orderedQuantity * unitPrice;
  const taxAmount = lineTotal * (taxRate / 100);

  return {
    id: line.id || generateId(),
    inventoryItemId: safeStr(line.inventoryItemId),
    inventoryItemName: safeStr(line.inventoryItemName),
    supplierItemCode: safeStr(line.supplierItemCode) || null,
    supplierItemName: safeStr(line.supplierItemName),
    orderedQuantity,
    unit: safeStr(line.unit, 'pcs'),
    unitPrice,
    taxRate,
    taxAmount: roundCurrency(taxAmount),
    lineTotal: roundCurrency(lineTotal + taxAmount),
    receivedQuantity: safeNum(line.receivedQuantity),
    remainingQuantity: orderedQuantity - safeNum(line.receivedQuantity),
    damagedQuantity: safeNum(line.damagedQuantity),
    rejectedQuantity: safeNum(line.rejectedQuantity),
    note: safeStr(line.note) || null
  };
}

/**
 * Create a new supplier
 */
export function createSupplier(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const category = SUPPLIER_CATEGORIES.includes(safeInput.category) ? safeInput.category : 'OTHER';

  const rawSuppliedItems = safeArr(safeInput.suppliedItems);
  const suppliedItems = rawSuppliedItems.map(createSupplierItem);

  const rawDocuments = safeArr(safeInput.documents);
  const documents = rawDocuments.map(normalizeDocument);

  return {
    id: safeInput.id || generateId(),
    name: safeStr(safeInput.name, 'New Supplier'),
    category,
    active: safeInput.active !== false,
    preferred: Boolean(safeInput.preferred),
    contactPerson: safeStr(safeInput.contactPerson),
    phone: safeStr(safeInput.phone),
    email: safeStr(safeInput.email),
    address: safeStr(safeInput.address),
    city: safeStr(safeInput.city),
    state: safeStr(safeInput.state),
    postalCode: safeStr(safeInput.postalCode),
    country: safeStr(safeInput.country),
    gstNumber: safeStr(safeInput.gstNumber) || null,
    legalName: safeStr(safeInput.legalName) || null,
    paymentTerms: safeStr(safeInput.paymentTerms, 'NET 30'),
    deliveryDays: safeNum(safeInput.deliveryDays, 7),
    minimumOrder: safeNum(safeInput.minimumOrder),
    deliveryCharge: safeNum(safeInput.deliveryCharge),
    taxDetails: safeStr(safeInput.taxDetails),
    notes: safeStr(safeInput.notes),
    internalNote: safeStr(safeInput.internalNote),
    suppliedItems,
    orderCount: safeNum(safeInput.orderCount),
    unpaidBalance: safeNum(safeInput.unpaidBalance),
    lastOrderDate: safeInput.lastOrderDate ? toTimestamp(safeInput.lastOrderDate) : null,
    lastDeliveryDate: safeInput.lastDeliveryDate ? toTimestamp(safeInput.lastDeliveryDate) : null,
    documents,
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now()
  };
}

/**
 * Create a supplier item mapping
 */
export function createSupplierItem(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  return {
    id: safeInput.id || generateId(),
    supplierId: safeStr(safeInput.supplierId),
    inventoryItemId: safeStr(safeInput.inventoryItemId),
    inventoryItemName: safeStr(safeInput.inventoryItemName),
    supplierItemCode: safeStr(safeInput.supplierItemCode),
    supplierItemName: safeStr(safeInput.supplierItemName),
    unit: safeStr(safeInput.unit, 'pcs'),
    currentPrice: safeNum(safeInput.currentPrice),
    previousPrice: safeNum(safeInput.previousPrice) || null,
    supplierCode: safeStr(safeInput.supplierCode) || null,
    leadTime: safeNum(safeInput.leadTime) || null,
    minimumOrderQty: safeNum(safeInput.minimumOrderQty) || null,
    availabilityNote: safeStr(safeInput.availabilityNote) || null,
    lastPurchasedDate: safeInput.lastPurchasedDate ? toTimestamp(safeInput.lastPurchasedDate) : null,
    active: safeInput.active !== false
  };
}

/**
 * Normalize a supplier
 */
export function normalizeSupplier(supplier) {
  if (!supplier || typeof supplier !== 'object') return null;

  const category = SUPPLIER_CATEGORIES.includes(supplier.category) ? supplier.category : 'OTHER';

  const rawSuppliedItems = safeArr(supplier.suppliedItems);
  const suppliedItems = rawSuppliedItems.map(normalizeSupplierItem).filter(Boolean);

  const rawDocuments = safeArr(supplier.documents);
  const documents = rawDocuments.map(normalizeDocument).filter(Boolean);

  return {
    id: supplier.id || generateId(),
    name: safeStr(supplier.name, 'New Supplier'),
    category,
    active: Boolean(supplier.active),
    preferred: Boolean(supplier.preferred),
    contactPerson: safeStr(supplier.contactPerson),
    phone: safeStr(supplier.phone),
    email: safeStr(supplier.email),
    address: safeStr(supplier.address),
    city: safeStr(supplier.city),
    state: safeStr(supplier.state),
    postalCode: safeStr(supplier.postalCode),
    country: safeStr(supplier.country),
    gstNumber: safeStr(supplier.gstNumber) || null,
    legalName: safeStr(supplier.legalName) || null,
    paymentTerms: safeStr(supplier.paymentTerms, 'NET 30'),
    deliveryDays: safeNum(supplier.deliveryDays, 7),
    minimumOrder: safeNum(supplier.minimumOrder),
    deliveryCharge: safeNum(supplier.deliveryCharge),
    taxDetails: safeStr(supplier.taxDetails),
    notes: safeStr(supplier.notes),
    internalNote: safeStr(supplier.internalNote),
    suppliedItems,
    orderCount: safeNum(supplier.orderCount),
    unpaidBalance: safeNum(supplier.unpaidBalance),
    lastOrderDate: supplier.lastOrderDate ? toTimestamp(supplier.lastOrderDate) : null,
    lastDeliveryDate: supplier.lastDeliveryDate ? toTimestamp(supplier.lastDeliveryDate) : null,
    documents,
    createdAt: supplier.createdAt ? toTimestamp(supplier.createdAt) : now(),
    updatedAt: supplier.updatedAt ? toTimestamp(supplier.updatedAt) : now()
  };
}

/**
 * Normalize a supplier item
 */
export function normalizeSupplierItem(item) {
  if (!item || typeof item !== 'object') return null;

  return {
    id: item.id || generateId(),
    supplierId: safeStr(item.supplierId),
    inventoryItemId: safeStr(item.inventoryItemId),
    inventoryItemName: safeStr(item.inventoryItemName),
    supplierItemCode: safeStr(item.supplierItemCode),
    supplierItemName: safeStr(item.supplierItemName),
    unit: safeStr(item.unit, 'pcs'),
    currentPrice: safeNum(item.currentPrice),
    previousPrice: safeNum(item.previousPrice) || null,
    supplierCode: safeStr(item.supplierCode) || null,
    leadTime: safeNum(item.leadTime) || null,
    minimumOrderQty: safeNum(item.minimumOrderQty) || null,
    availabilityNote: safeStr(item.availabilityNote) || null,
    lastPurchasedDate: item.lastPurchasedDate ? toTimestamp(item.lastPurchasedDate) : null,
    active: Boolean(item.active)
  };
}

/**
 * Create a goods receipt
 */
export function createGoodsReceipt(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const rawLines = safeArr(safeInput.lines);
  const lines = rawLines.map(createGoodsReceiptLine);

  const rawVariances = safeArr(safeInput.variances);
  const variances = rawVariances.map(createVariance);

  return {
    id: safeInput.id || generateId(),
    receiptNumber: safeStr(safeInput.receiptNumber) || generateReceiptNumber(),
    purchaseOrderId: safeStr(safeInput.purchaseOrderId),
    poNumber: safeStr(safeInput.poNumber),
    supplierId: safeStr(safeInput.supplierId),
    supplierName: safeStr(safeInput.supplierName),
    receivedDate: safeInput.receivedDate ? toTimestamp(safeInput.receivedDate) : now(),
    receivedBy: safeStr(safeInput.receivedBy) || null,
    lines,
    deliveryNoteNumber: safeStr(safeInput.deliveryNoteNumber) || null,
    invoiceNumber: safeStr(safeInput.invoiceNumber) || null,
    invoiceTotal: safeNum(safeInput.invoiceTotal),
    batchNumber: safeStr(safeInput.batchNumber) || null,
    manufactureDate: safeInput.manufactureDate ? toTimestamp(safeInput.manufactureDate) : null,
    expiryDate: safeInput.expiryDate ? toTimestamp(safeInput.expiryDate) : null,
    notes: safeStr(safeInput.notes),
    variances,
    expenseId: safeStr(safeInput.expenseId) || null,
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now()
  };
}

/**
 * Create a goods receipt line
 */
export function createGoodsReceiptLine(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const receivedQuantity = safeNum(safeInput.receivedQuantity);
  const damagedQuantity = safeNum(safeInput.damagedQuantity);
  const rejectedQuantity = safeNum(safeInput.rejectedQuantity);
  const acceptedQuantity = Math.max(0, receivedQuantity - damagedQuantity - rejectedQuantity);

  return {
    id: safeInput.id || generateId(),
    purchaseOrderLineId: safeStr(safeInput.purchaseOrderLineId),
    inventoryItemId: safeStr(safeInput.inventoryItemId),
    inventoryItemName: safeStr(safeInput.inventoryItemName),
    orderedQuantity: safeNum(safeInput.orderedQuantity),
    previouslyReceived: safeNum(safeInput.previouslyReceived),
    receivedQuantity,
    damagedQuantity,
    rejectedQuantity,
    acceptedQuantity,
    unit: safeStr(safeInput.unit, 'pcs'),
    expectedPrice: safeNum(safeInput.expectedPrice),
    actualPrice: safeNum(safeInput.actualPrice),
    batchNumber: safeStr(safeInput.batchNumber) || null,
    manufactureDate: safeInput.manufactureDate ? toTimestamp(safeInput.manufactureDate) : null,
    expiryDate: safeInput.expiryDate ? toTimestamp(safeInput.expiryDate) : null,
    note: safeStr(safeInput.note) || null
  };
}

/**
 * Normalize a goods receipt
 */
export function normalizeGoodsReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') return null;

  const rawLines = safeArr(receipt.lines);
  const lines = rawLines.map(normalizeGoodsReceiptLine).filter(Boolean);

  const rawVariances = safeArr(receipt.variances);
  const variances = rawVariances.map(normalizeVariance).filter(Boolean);

  return {
    id: receipt.id || generateId(),
    receiptNumber: safeStr(receipt.receiptNumber) || generateReceiptNumber(),
    purchaseOrderId: safeStr(receipt.purchaseOrderId),
    poNumber: safeStr(receipt.poNumber),
    supplierId: safeStr(receipt.supplierId),
    supplierName: safeStr(receipt.supplierName),
    receivedDate: receipt.receivedDate ? toTimestamp(receipt.receivedDate) : now(),
    receivedBy: safeStr(receipt.receivedBy) || null,
    lines,
    deliveryNoteNumber: safeStr(receipt.deliveryNoteNumber) || null,
    invoiceNumber: safeStr(receipt.invoiceNumber) || null,
    invoiceTotal: safeNum(receipt.invoiceTotal),
    batchNumber: safeStr(receipt.batchNumber) || null,
    manufactureDate: receipt.manufactureDate ? toTimestamp(receipt.manufactureDate) : null,
    expiryDate: receipt.expiryDate ? toTimestamp(receipt.expiryDate) : null,
    notes: safeStr(receipt.notes),
    variances,
    expenseId: safeStr(receipt.expenseId) || null,
    createdAt: receipt.createdAt ? toTimestamp(receipt.createdAt) : now(),
    updatedAt: receipt.updatedAt ? toTimestamp(receipt.updatedAt) : now()
  };
}

/**
 * Normalize a goods receipt line
 */
export function normalizeGoodsReceiptLine(line) {
  if (!line || typeof line !== 'object') return null;

  const receivedQuantity = safeNum(line.receivedQuantity);
  const damagedQuantity = safeNum(line.damagedQuantity);
  const rejectedQuantity = safeNum(line.rejectedQuantity);
  const acceptedQuantity = Math.max(0, receivedQuantity - damagedQuantity - rejectedQuantity);

  return {
    id: line.id || generateId(),
    purchaseOrderLineId: safeStr(line.purchaseOrderLineId),
    inventoryItemId: safeStr(line.inventoryItemId),
    inventoryItemName: safeStr(line.inventoryItemName),
    orderedQuantity: safeNum(line.orderedQuantity),
    previouslyReceived: safeNum(line.previouslyReceived),
    receivedQuantity,
    damagedQuantity,
    rejectedQuantity,
    acceptedQuantity,
    unit: safeStr(line.unit, 'pcs'),
    expectedPrice: safeNum(line.expectedPrice),
    actualPrice: safeNum(line.actualPrice),
    batchNumber: safeStr(line.batchNumber) || null,
    manufactureDate: line.manufactureDate ? toTimestamp(line.manufactureDate) : null,
    expiryDate: line.expiryDate ? toTimestamp(line.expiryDate) : null,
    note: safeStr(line.note) || null
  };
}

/**
 * Create a variance record
 */
export function createVariance(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const type = VARIANCE_TYPES.includes(safeInput.type) ? safeInput.type : 'SHORT_DELIVERED';

  return {
    id: safeInput.id || generateId(),
    type,
    inventoryItemId: safeStr(safeInput.inventoryItemId),
    inventoryItemName: safeStr(safeInput.inventoryItemName),
    ordered: safeNum(safeInput.ordered),
    received: safeNum(safeInput.received),
    accepted: safeNum(safeInput.accepted),
    difference: safeNum(safeInput.difference),
    reason: safeStr(safeInput.reason),
    note: safeStr(safeInput.note),
    resolutionState: safeInput.resolutionState || 'OPEN',
    createdAt: safeInput.createdAt || now()
  };
}

/**
 * Normalize a variance
 */
export function normalizeVariance(variance) {
  if (!variance || typeof variance !== 'object') return null;

  const type = VARIANCE_TYPES.includes(variance.type) ? variance.type : 'SHORT_DELIVERED';

  return {
    id: variance.id || generateId(),
    type,
    inventoryItemId: safeStr(variance.inventoryItemId),
    inventoryItemName: safeStr(variance.inventoryItemName),
    ordered: safeNum(variance.ordered),
    received: safeNum(variance.received),
    accepted: safeNum(variance.accepted),
    difference: safeNum(variance.difference),
    reason: safeStr(variance.reason),
    note: safeStr(variance.note),
    resolutionState: variance.resolutionState || 'OPEN',
    createdAt: variance.createdAt ? toTimestamp(variance.createdAt) : now()
  };
}

/**
 * Create a document record
 */
export function createDocument(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const type = DOCUMENT_TYPES.includes(safeInput.type) ? safeInput.type : 'OTHER';

  return {
    id: safeInput.id || generateId(),
    type,
    filename: safeStr(safeInput.filename),
    url: safeStr(safeInput.url),
    fileSize: safeNum(safeInput.fileSize),
    mimeType: safeStr(safeInput.mimeType),
    uploadedAt: safeInput.uploadedAt ? toTimestamp(safeInput.uploadedAt) : now(),
    uploadedBy: safeStr(safeInput.uploadedBy) || null
  };
}

/**
 * Normalize a document
 */
export function normalizeDocument(doc) {
  if (!doc || typeof doc !== 'object') return null;

  const type = DOCUMENT_TYPES.includes(doc.type) ? doc.type : 'OTHER';

  return {
    id: doc.id || generateId(),
    type,
    filename: safeStr(doc.filename),
    url: safeStr(doc.url),
    fileSize: safeNum(doc.fileSize),
    mimeType: safeStr(doc.mimeType),
    uploadedAt: doc.uploadedAt ? toTimestamp(doc.uploadedAt) : now(),
    uploadedBy: safeStr(doc.uploadedBy) || null
  };
}

/**
 * Create an activity record
 */
export function createActivity(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const type = ACTIVITY_TYPES.includes(safeInput.type) ? safeInput.type : 'EDITED';

  return {
    id: safeInput.id || generateId(),
    type,
    description: safeStr(safeInput.description),
    userId: safeStr(safeInput.userId) || null,
    timestamp: safeInput.timestamp ? toTimestamp(safeInput.timestamp) : now(),
    metadata: safeInput.metadata || {}
  };
}

/**
 * Normalize an activity
 */
export function normalizeActivity(activity) {
  if (!activity || typeof activity !== 'object') return null;

  const type = ACTIVITY_TYPES.includes(activity.type) ? activity.type : 'EDITED';

  return {
    id: activity.id || generateId(),
    type,
    description: safeStr(activity.description),
    userId: safeStr(activity.userId) || null,
    timestamp: activity.timestamp ? toTimestamp(activity.timestamp) : now(),
    metadata: activity.metadata || {}
  };
}

/**
 * Check if purchase order is overdue
 */
export function isPOOverdue(po) {
  if (!po || !po.expectedDate) return false;
  if (po.status === 'RECEIVED' || po.status === 'CANCELLED' || po.status === 'CLOSED') return false;
  return po.expectedDate < now();
}

/**
 * Check if purchase order has unpaid balance
 */
export function hasUnpaidBalance(po) {
  if (!po) return false;
  return safeNum(po.remainingAmount) > 0;
}

/**
 * Calculate price variance percentage
 */
export function calculatePriceVariance(previousPrice, currentPrice) {
  if (!previousPrice || previousPrice === 0) return 0;
  const diff = currentPrice - previousPrice;
  return roundCurrency((diff / previousPrice) * 100);
}

/**
 * Update purchase order status based on receiving
 */
export function updatePOReceivingStatus(po) {
  if (!po || typeof po !== 'object') return po;

  const items = safeArr(po.items);
  const totalOrdered = items.reduce((sum, item) => sum + safeNum(item.orderedQuantity), 0);
  const totalReceived = items.reduce((sum, item) => sum + safeNum(item.receivedQuantity), 0);

  if (totalReceived === 0) {
    return { ...po, receivingStatus: 'NOT_RECEIVED' };
  }
  if (totalReceived >= totalOrdered) {
    return { ...po, receivingStatus: 'FULLY_RECEIVED', receivedDate: now() };
  }
  return { ...po, receivingStatus: 'PARTIALLY_RECEIVED' };
}

/**
 * Validate purchase order data
 */
export function validatePurchaseOrder(po) {
  if (!po || typeof po !== 'object') {
    return { valid: false, message: 'Purchase order must be an object' };
  }

  if (!po.supplierId || typeof po.supplierId !== 'string' || po.supplierId.trim().length === 0) {
    return { valid: false, message: 'Supplier is required' };
  }

  if (!Array.isArray(po.items) || po.items.length === 0) {
    return { valid: false, message: 'At least one item is required' };
  }

  for (const item of po.items) {
    if (!item || typeof item !== 'object') continue;
    if (safeNum(item.orderedQuantity) <= 0) {
      return { valid: false, message: 'All items must have a positive ordered quantity' };
    }
    if (safeNum(item.unitPrice) < 0) {
      return { valid: false, message: 'Unit price cannot be negative' };
    }
  }

  return { valid: true, message: null };
}

/**
 * Validate supplier data
 */
export function validateSupplier(supplier) {
  if (!supplier || typeof supplier !== 'object') {
    return { valid: false, message: 'Supplier must be an object' };
  }

  if (!supplier.name || typeof supplier.name !== 'string' || supplier.name.trim().length === 0) {
    return { valid: false, message: 'Supplier name is required' };
  }

  return { valid: true, message: null };
}
