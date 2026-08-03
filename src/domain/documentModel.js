// Document domain model for Receipts, Invoices, Payment Receipts, and Credit Notes

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { roundCurrency } from './money.js';

/**
 * Document types
 */
export const DOCUMENT_TYPES = {
  RECEIPT: 'RECEIPT',
  INVOICE: 'INVOICE',
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DELIVERY_NOTE: 'DELIVERY_NOTE',
  PRO_FORMA: 'PRO_FORMA',
  ESTIMATE: 'ESTIMATE'
};

/**
 * Document statuses
 */
export const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  VOIDED: 'VOIDED',
  CREDITED: 'CREDITED'
};

/**
 * Payment statuses for documents
 */
export const DOCUMENT_PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERPAID: 'OVERPAID',
  REFUNDED: 'REFUNDED'
};

/**
 * Credit note reasons
 */
export const CREDIT_NOTE_REASONS = {
  RETURN: 'RETURN',
  OVERCHARGE: 'OVERCHARGE',
  ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  ORDER_CORRECTION: 'ORDER_CORRECTION',
  DELIVERY_ISSUE: 'DELIVERY_ISSUE',
  OTHER: 'OTHER'
};

/**
 * Receipt schema
 * @typedef {Object} Receipt
 * @property {string} id - Unique receipt ID
 * @property {string} receiptNumber - Human-readable receipt number (e.g., RCP-2026-0042)
 * @property {string} orderId - Linked order ID
 * @property {string|null} customerId - Customer ID if linked
 * @property {string} customerName - Customer name
 * @property {string} customerPhone - Customer phone
 * @property {string} customerEmail - Customer email
 * @property {string|null} tableId - Table ID if dine-in
 * @property {string} orderType - Order type (DINE_IN, TAKEAWAY, DELIVERY)
 * @property {ReceiptItem[]} items - Receipt items
 * @property {number} subtotal - Subtotal before discount/tax
 * @property {number} discountAmount - Discount amount
 * @property {number} taxAmount - Tax amount
 * @property {number} serviceCharge - Service charge
 * @property {number} deliveryCharge - Delivery charge
 * @property {number} total - Final total
 * @property {string} paymentMethod - Payment method
 * @property {number} amountPaid - Amount paid
 * @property {number} balance - Balance due
 * @property {string} paymentStatus - Payment status
 * @property {string} status - Document status
 * @property {string} branchId - Branch ID
 * @property {string} branchName - Branch name
 * @property {string} staffId - Staff ID who issued
 * @property {string} staffName - Staff name
 * @property {string|null} notes - Receipt notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} issuedAt - Issue timestamp
 * @property {number|null} printedAt - Last print timestamp
 * @property {number} printCount - Number of times printed
 * @property {boolean} isReprint - Whether this is a reprint
 * @property {string|null} originalReceiptId - Original receipt ID if reprint
 * @property {string|null} linkedInvoiceId - Invoice ID if converted to invoice
 * @property {string|null} linkedCreditNoteId - Credit note ID if refunded
 * @property {DocumentActivity[]} activities - Activity history
 */

/**
 * @typedef {Object} ReceiptItem
 * @property {string} id - Item ID
 * @property {string} menuItemId - Menu item ID
 * @property {string} name - Item name
 * @property {number} quantity - Quantity
 * @property {number} unitPrice - Unit price
 * @property {string[]} modifiers - Item modifiers
 * @property {number} taxRate - Tax rate percentage
 * @property {number} taxAmount - Tax amount
 * @property {number} lineTotal - Line total
 * @property {string|null} notes - Item notes
 */

/**
 * Invoice schema
 * @typedef {Object} Invoice
 * @property {string} id - Unique invoice ID
 * @property {string} invoiceNumber - Human-readable invoice number (e.g., INV-2026-0018)
 * @property {string|null} orderId - Linked order ID
 * @property {string|null} linkedReceiptId - Original receipt ID if created from receipt
 * @property {string|null} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} customerPhone - Customer phone
 * @property {string} customerEmail - Customer email
 * @property {string} customerAddress - Customer billing address
 * @property {string|null} customerGstNumber - Customer GST number
 * @property {string} customerState - Customer state for tax
 * @property {InvoiceItem[]} items - Invoice items
 * @property {number} subtotal - Subtotal before discount/tax
 * @property {number} discountAmount - Discount amount
 * @property {number} taxAmount - Tax amount
 * @property {number} serviceCharge - Service charge
 * @property {number} deliveryCharge - Delivery charge
 * @property {number} total - Final total
 * @property {number} amountPaid - Amount paid
 * @property {number} balance - Balance due
 * @property {string} paymentStatus - Payment status
 * @property {string} paymentTerms - Payment terms (NET 7, NET 15, NET 30, etc.)
 * @property {string|null} dueDate - Due date
 * @property {string} status - Document status
 * @property {string} branchId - Branch ID
 * @property {string} branchName - Branch name
 * @property {string} staffId - Staff ID who created
 * @property {string} staffName - Staff name
 * @property {string|null} notes - Invoice notes
 * @property {string|null} footerNote - Footer note
 * @property {number} createdAt - Creation timestamp
 * @property {number} issuedAt - Issue timestamp
 * @property {number|null} dueDateTimestamp - Due date as timestamp
 * @property {number|null} printedAt - Last print timestamp
 * @property {number} printCount - Number of times printed
 * @property {PaymentRecord[]} payments - Payment records
 * @property {DocumentActivity[]} activities - Activity history
 */

/**
 * @typedef {Object} InvoiceItem
 * @property {string} id - Item ID
 * @property {string} menuItemId - Menu item ID
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {number} quantity - Quantity
 * @property {string} unit - Unit (pcs, kg, etc.)
 * @property {number} unitPrice - Unit price
 * @property {number} taxRate - Tax rate percentage
 * @property {number} taxAmount - Tax amount
 * @property {number} lineTotal - Line total
 * @property {string|null} notes - Item notes
 */

/**
 * Payment Receipt schema
 * @typedef {Object} PaymentReceipt
 * @property {string} id - Unique payment receipt ID
 * @property {string} paymentReceiptNumber - Human-readable number (e.g., PMT-2026-0035)
 * @property {string|null} invoiceId - Linked invoice ID
 * @property {string|null} orderId - Linked order ID
 * @property {string|null} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} customerPhone - Customer phone
 * @property {number} amountReceived - Amount received
 * @property {string} paymentMethod - Payment method
 * @property {string} paymentReference - Payment reference
 * @property {number} previousBalance - Previous balance
 * @property {number} remainingBalance - Remaining balance after payment
 * @property {string} status - Document status
 * @property {string} branchId - Branch ID
 * @property {string} branchName - Branch name
 * @property {string} receivedBy - Staff ID who received payment
 * @property {string} receivedByName - Staff name
 * @property {string|null} notes - Payment notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} receivedAt - Payment timestamp
 * @property {number|null} printedAt - Last print timestamp
 * @property {number} printCount - Number of times printed
 * @property {DocumentActivity[]} activities - Activity history
 */

/**
 * Credit Note schema
 * @typedef {Object} CreditNote
 * @property {string} id - Unique credit note ID
 * @property {string} creditNoteNumber - Human-readable number (e.g., CRN-2026-0012)
 * @property {string} originalDocumentId - Original receipt or invoice ID
 * @property {string} originalDocumentType - Original document type
 * @property {string} originalDocumentNumber - Original document number
 * @property {string|null} orderId - Linked order ID
 * @property {string|null} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} customerPhone - Customer phone
 * @property {string} reason - Credit note reason
 * @property {string|null} reasonDescription - Detailed reason description
 * @property {CreditNoteItem[]} items - Credited items
 * @property {number} subtotal - Subtotal
 * @property {number} taxAmount - Tax amount
 * @property {number} total - Total credit amount
 * @property {number} refundAmount - Actual refund amount
 * @property {string} refundMethod - Refund method
 * @property {string|null} refundReference - Refund reference
 * @property {string} status - Document status
 * @property {string} branchId - Branch ID
 * @property {string} branchName - Branch name
 * @property {string} createdBy - Staff ID who created
 * @property {string} createdByName - Staff name
 * @property {string|null} notes - Credit note notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} issuedAt - Issue timestamp
 * @property {number|null} printedAt - Last print timestamp
 * @property {number} printCount - Number of times printed
 * @property {DocumentActivity[]} activities - Activity history
 */

/**
 * @typedef {Object} CreditNoteItem
 * @property {string} id - Item ID
 * @property {string} originalItemId - Original item ID
 * @property {string} name - Item name
 * @property {number} quantity - Quantity credited
 * @property {number} unitPrice - Unit price
 * @property {number} taxRate - Tax rate
 * @property {number} taxAmount - Tax amount
 * @property {number} lineTotal - Line total
 * @property {string|null} notes - Item notes
 */

/**
 * @typedef {Object} PaymentRecord
 * @property {string} id - Payment ID
 * @property {string} paymentMethod - Payment method
 * @property {number} amount - Payment amount
 * @property {string|null} reference - Payment reference
 * @property {number} paidAt - Payment timestamp
 * @property {string|null} paidBy - Staff ID
 * @property {string|null} paidByName - Staff name
 */

/**
 * @typedef {Object} DocumentActivity
 * @property {string} id - Activity ID
 * @property {string} action - Action type (CREATED, PRINTED, REPRINTED, EMAILED, PAID, CORRECTED, VOIDED, CREDITED)
 * @property {string|null} userId - User ID
 * @property {string|null} userName - User name
 * @property {number} timestamp - Activity timestamp
 * @property {string|null} details - Additional details
 */

function devWarn(msg, value) {
  console.warn(`[documentModel] ${msg}`, value ?? '');
}

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function safeStr(val, fallback = '') {
  return val !== null && val !== undefined ? String(val) : fallback;
}

/**
 * Generate document number based on type and date
 */
export function generateDocumentNumber(type, year, sequence) {
  const prefixes = {
    RECEIPT: 'RCP',
    INVOICE: 'INV',
    PAYMENT_RECEIPT: 'PMT',
    CREDIT_NOTE: 'CRN',
    DELIVERY_NOTE: 'DLN',
    PRO_FORMA: 'PRO',
    ESTIMATE: 'EST'
  };
  const prefix = prefixes[type] || 'DOC';
  const paddedSequence = String(sequence).padStart(4, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Create a receipt from order data
 */
export function createReceipt(order, staff, branch, options = {}) {
  const nowTs = now();
  const year = new Date(nowTs).getFullYear();
  
  const receiptItems = (order.items || []).map((item) => ({
    id: generateId(),
    menuItemId: item.menuItemId || item.id,
    name: item.name,
    quantity: safeNum(item.qty),
    unitPrice: safeNum(item.price),
    modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
    taxRate: 18, // Default GST rate - should be configurable
    taxAmount: roundCurrency(safeNum(item.qty) * safeNum(item.price) * 0.18),
    lineTotal: roundCurrency(safeNum(item.qty) * safeNum(item.price)),
    notes: item.notes || null
  }));

  const subtotal = receiptItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = receiptItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const discountAmount = safeNum(order.discountAmount);
  const total = roundCurrency(subtotal + taxAmount - discountAmount);
  const amountPaid = order.paymentStatus === 'PAID' ? total : safeNum(options.amountPaid);
  const balance = roundCurrency(total - amountPaid);

  return {
    id: generateId(),
    receiptNumber: options.receiptNumber || generateDocumentNumber('RECEIPT', year, 1),
    orderId: order.id,
    customerId: order.customerId || null,
    customerName: order.customerName || 'Walk-in Customer',
    customerPhone: order.customerPhone || '',
    customerEmail: order.customerEmail || '',
    tableId: order.tableId || null,
    orderType: determineOrderType(order),
    items: receiptItems,
    subtotal: roundCurrency(subtotal),
    discountAmount,
    taxAmount: roundCurrency(taxAmount),
    serviceCharge: 0,
    deliveryCharge: 0,
    total: roundCurrency(total),
    paymentMethod: order.paymentMethod || 'CASH',
    amountPaid: roundCurrency(amountPaid),
    balance: roundCurrency(balance),
    paymentStatus: determinePaymentStatus(amountPaid, total),
    status: DOCUMENT_STATUS.ISSUED,
    branchId: branch?.id || 'BRANCH-1',
    branchName: branch?.name || 'Main Branch',
    staffId: staff?.id,
    staffName: staff?.name || 'System',
    notes: order.notes || null,
    createdAt: nowTs,
    issuedAt: nowTs,
    printedAt: null,
    printCount: 0,
    isReprint: false,
    originalReceiptId: null,
    linkedInvoiceId: null,
    linkedCreditNoteId: null,
    activities: [{
      id: generateId(),
      action: 'CREATED',
      userId: staff?.id,
      userName: staff?.name || 'System',
      timestamp: nowTs,
      details: `Receipt created from order ${order.id}`
    }]
  };
}

/**
 * Create an invoice
 */
export function createInvoice(data, staff, branch) {
  const nowTs = now();
  const year = new Date(nowTs).getFullYear();

  const invoiceItems = (data.items || []).map((item) => ({
    id: generateId(),
    menuItemId: item.menuItemId || item.id,
    name: item.name,
    description: item.description || '',
    quantity: safeNum(item.quantity),
    unit: item.unit || 'pcs',
    unitPrice: safeNum(item.unitPrice),
    taxRate: safeNum(item.taxRate, 18),
    taxAmount: roundCurrency(safeNum(item.quantity) * safeNum(item.unitPrice) * (safeNum(item.taxRate, 18) / 100)),
    lineTotal: roundCurrency(safeNum(item.quantity) * safeNum(item.unitPrice)),
    notes: item.notes || null
  }));

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const discountAmount = safeNum(data.discountAmount);
  const total = roundCurrency(subtotal + taxAmount + safeNum(data.serviceCharge) + safeNum(data.deliveryCharge) - discountAmount);
  const amountPaid = safeNum(data.amountPaid);
  const balance = roundCurrency(total - amountPaid);

  const dueDate = data.dueDate ? toTimestamp(new Date(data.dueDate)) : null;
  const dueDateTimestamp = dueDate || nowTs + (30 * 24 * 60 * 60 * 1000); // Default 30 days

  return {
    id: generateId(),
    invoiceNumber: data.invoiceNumber || generateDocumentNumber('INVOICE', year, 1),
    orderId: data.orderId || null,
    linkedReceiptId: data.linkedReceiptId || null,
    customerId: data.customerId || null,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerEmail: data.customerEmail || '',
    customerAddress: data.customerAddress || '',
    customerGstNumber: data.customerGstNumber || '',
    customerState: data.customerState || '',
    items: invoiceItems,
    subtotal: roundCurrency(subtotal),
    discountAmount,
    taxAmount: roundCurrency(taxAmount),
    serviceCharge: safeNum(data.serviceCharge),
    deliveryCharge: safeNum(data.deliveryCharge),
    total: roundCurrency(total),
    amountPaid: roundCurrency(amountPaid),
    balance: roundCurrency(balance),
    paymentStatus: determinePaymentStatus(amountPaid, total),
    paymentTerms: data.paymentTerms || 'NET 30',
    dueDate: data.dueDate || null,
    status: DOCUMENT_STATUS.ISSUED,
    branchId: branch?.id || 'BRANCH-1',
    branchName: branch?.name || 'Main Branch',
    staffId: staff?.id,
    staffName: staff?.name || 'System',
    notes: data.notes || null,
    footerNote: data.footerNote || null,
    createdAt: nowTs,
    issuedAt: nowTs,
    dueDateTimestamp,
    printedAt: null,
    printCount: 0,
    payments: data.payments || [],
    activities: [{
      id: generateId(),
      action: 'CREATED',
      userId: staff?.id,
      userName: staff?.name || 'System',
      timestamp: nowTs,
      details: data.linkedReceiptId ? `Invoice created from receipt ${data.linkedReceiptId}` : 'Invoice created'
    }]
  };
}

/**
 * Create a payment receipt
 */
export function createPaymentReceipt(data, staff, branch) {
  const nowTs = now();
  const year = new Date(nowTs).getFullYear();

  return {
    id: generateId(),
    paymentReceiptNumber: data.paymentReceiptNumber || generateDocumentNumber('PAYMENT_RECEIPT', year, 1),
    invoiceId: data.invoiceId || null,
    orderId: data.orderId || null,
    customerId: data.customerId || null,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    amountReceived: safeNum(data.amountReceived),
    paymentMethod: data.paymentMethod || 'CASH',
    paymentReference: data.paymentReference || '',
    previousBalance: safeNum(data.previousBalance),
    remainingBalance: safeNum(data.remainingBalance),
    status: DOCUMENT_STATUS.ISSUED,
    branchId: branch?.id || 'BRANCH-1',
    branchName: branch?.name || 'Main Branch',
    receivedBy: staff?.id,
    receivedByName: staff?.name || 'System',
    notes: data.notes || null,
    createdAt: nowTs,
    receivedAt: nowTs,
    printedAt: null,
    printCount: 0,
    activities: [{
      id: generateId(),
      action: 'CREATED',
      userId: staff?.id,
      userName: staff?.name || 'System',
      timestamp: nowTs,
      details: `Payment of ${data.amountReceived} received via ${data.paymentMethod}`
    }]
  };
}

/**
 * Create a credit note
 */
export function createCreditNote(data, staff, branch) {
  const nowTs = now();
  const year = new Date(nowTs).getFullYear();

  const creditItems = (data.items || []).map((item) => ({
    id: generateId(),
    originalItemId: item.originalItemId || item.id,
    name: item.name,
    quantity: safeNum(item.quantity),
    unitPrice: safeNum(item.unitPrice),
    taxRate: safeNum(item.taxRate, 18),
    taxAmount: roundCurrency(safeNum(item.quantity) * safeNum(item.unitPrice) * (safeNum(item.taxRate, 18) / 100)),
    lineTotal: roundCurrency(safeNum(item.quantity) * safeNum(item.unitPrice)),
    notes: item.notes || null
  }));

  const subtotal = creditItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = creditItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = roundCurrency(subtotal + taxAmount);
  const refundAmount = safeNum(data.refundAmount, total);

  return {
    id: generateId(),
    creditNoteNumber: data.creditNoteNumber || generateDocumentNumber('CREDIT_NOTE', year, 1),
    originalDocumentId: data.originalDocumentId,
    originalDocumentType: data.originalDocumentType,
    originalDocumentNumber: data.originalDocumentNumber,
    orderId: data.orderId || null,
    customerId: data.customerId || null,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    reason: data.reason || CREDIT_NOTE_REASONS.OTHER,
    reasonDescription: data.reasonDescription || '',
    items: creditItems,
    subtotal: roundCurrency(subtotal),
    taxAmount: roundCurrency(taxAmount),
    total: roundCurrency(total),
    refundAmount: roundCurrency(refundAmount),
    refundMethod: data.refundMethod || 'CASH',
    refundReference: data.refundReference || '',
    status: DOCUMENT_STATUS.ISSUED,
    branchId: branch?.id || 'BRANCH-1',
    branchName: branch?.name || 'Main Branch',
    createdBy: staff?.id,
    createdByName: staff?.name || 'System',
    notes: data.notes || null,
    createdAt: nowTs,
    issuedAt: nowTs,
    printedAt: null,
    printCount: 0,
    activities: [{
      id: generateId(),
      action: 'CREATED',
      userId: staff?.id,
      userName: staff?.name || 'System',
      timestamp: nowTs,
      details: `Credit note created for ${data.originalDocumentNumber} (${data.reason})`
    }]
  };
}

/**
 * Normalize receipt data
 */
export function normalizeReceipt(data) {
  if (!data) return null;
  return {
    id: safeStr(data.id),
    receiptNumber: safeStr(data.receiptNumber),
    orderId: safeStr(data.orderId),
    customerId: data.customerId || null,
    customerName: safeStr(data.customerName),
    customerPhone: safeStr(data.customerPhone),
    customerEmail: safeStr(data.customerEmail),
    tableId: data.tableId || null,
    orderType: safeStr(data.orderType),
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: safeNum(data.subtotal),
    discountAmount: safeNum(data.discountAmount),
    taxAmount: safeNum(data.taxAmount),
    serviceCharge: safeNum(data.serviceCharge),
    deliveryCharge: safeNum(data.deliveryCharge),
    total: safeNum(data.total),
    paymentMethod: safeStr(data.paymentMethod),
    amountPaid: safeNum(data.amountPaid),
    balance: safeNum(data.balance),
    paymentStatus: safeStr(data.paymentStatus),
    status: safeStr(data.status),
    branchId: safeStr(data.branchId),
    branchName: safeStr(data.branchName),
    staffId: data.staffId || null,
    staffName: safeStr(data.staffName),
    notes: data.notes || null,
    createdAt: safeNum(data.createdAt, now()),
    issuedAt: safeNum(data.issuedAt, now()),
    printedAt: data.printedAt || null,
    printCount: safeNum(data.printCount),
    isReprint: Boolean(data.isReprint),
    originalReceiptId: data.originalReceiptId || null,
    linkedInvoiceId: data.linkedInvoiceId || null,
    linkedCreditNoteId: data.linkedCreditNoteId || null,
    activities: Array.isArray(data.activities) ? data.activities : []
  };
}

/**
 * Normalize invoice data
 */
export function normalizeInvoice(data) {
  if (!data) return null;
  return {
    id: safeStr(data.id),
    invoiceNumber: safeStr(data.invoiceNumber),
    orderId: data.orderId || null,
    linkedReceiptId: data.linkedReceiptId || null,
    customerId: data.customerId || null,
    customerName: safeStr(data.customerName),
    customerPhone: safeStr(data.customerPhone),
    customerEmail: safeStr(data.customerEmail),
    customerAddress: safeStr(data.customerAddress),
    customerGstNumber: safeStr(data.customerGstNumber),
    customerState: safeStr(data.customerState),
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: safeNum(data.subtotal),
    discountAmount: safeNum(data.discountAmount),
    taxAmount: safeNum(data.taxAmount),
    serviceCharge: safeNum(data.serviceCharge),
    deliveryCharge: safeNum(data.deliveryCharge),
    total: safeNum(data.total),
    amountPaid: safeNum(data.amountPaid),
    balance: safeNum(data.balance),
    paymentStatus: safeStr(data.paymentStatus),
    paymentTerms: safeStr(data.paymentTerms),
    dueDate: data.dueDate || null,
    status: safeStr(data.status),
    branchId: safeStr(data.branchId),
    branchName: safeStr(data.branchName),
    staffId: data.staffId || null,
    staffName: safeStr(data.staffName),
    notes: data.notes || null,
    footerNote: data.footerNote || null,
    createdAt: safeNum(data.createdAt, now()),
    issuedAt: safeNum(data.issuedAt, now()),
    dueDateTimestamp: data.dueDateTimestamp || null,
    printedAt: data.printedAt || null,
    printCount: safeNum(data.printCount),
    payments: Array.isArray(data.payments) ? data.payments : [],
    activities: Array.isArray(data.activities) ? data.activities : []
  };
}

/**
 * Determine order type from order data
 */
function determineOrderType(order) {
  if (order.source === 'DIRECT_DELIVERY' || order.source === 'SWIGGY' || order.source === 'ZOMATO') {
    return 'DELIVERY';
  }
  if (order.tableId) {
    return 'DINE_IN';
  }
  return 'TAKEAWAY';
}

/**
 * Determine payment status from amount paid and total
 */
function determinePaymentStatus(amountPaid, total) {
  if (amountPaid <= 0) return DOCUMENT_PAYMENT_STATUS.UNPAID;
  if (amountPaid >= total) return DOCUMENT_PAYMENT_STATUS.PAID;
  return DOCUMENT_PAYMENT_STATUS.PARTIAL;
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice) {
  if (!invoice.dueDateTimestamp || invoice.paymentStatus === DOCUMENT_PAYMENT_STATUS.PAID) {
    return false;
  }
  return now() > invoice.dueDateTimestamp;
}

/**
 * Update invoice payment status
 */
export function updateInvoicePaymentStatus(invoice) {
  const totalPaid = (invoice.payments || []).reduce((sum, payment) => sum + safeNum(payment.amount), 0);
  const updatedInvoice = { ...invoice };
  updatedInvoice.amountPaid = roundCurrency(totalPaid);
  updatedInvoice.balance = roundCurrency(invoice.total - totalPaid);
  updatedInvoice.paymentStatus = determinePaymentStatus(totalPaid, invoice.total);
  
  if (isInvoiceOverdue(updatedInvoice) && updatedInvoice.paymentStatus !== DOCUMENT_PAYMENT_STATUS.PAID) {
    updatedInvoice.status = DOCUMENT_STATUS.OVERDUE;
  }
  
  return updatedInvoice;
}

/**
 * Add activity to document
 */
export function addDocumentActivity(document, action, user, details = null) {
  const activity = {
    id: generateId(),
    action,
    userId: user?.id,
    userName: user?.name || 'System',
    timestamp: now(),
    details
  };
  
  return {
    ...document,
    activities: [...(document.activities || []), activity]
  };
}

/**
 * Mark document as printed
 */
export function markDocumentAsPrinted(document, user) {
  return {
    ...document,
    printedAt: now(),
    printCount: (document.printCount || 0) + 1,
    activities: addDocumentActivity(document, 'PRINTED', user, 'Document printed').activities
  };
}

/**
 * Validate receipt data
 */
export function validateReceipt(receipt) {
  const errors = [];
  
  if (!receipt.receiptNumber || receipt.receiptNumber.trim() === '') {
    errors.push('Receipt number is required');
  }
  
  if (!receipt.orderId || receipt.orderId.trim() === '') {
    errors.push('Order ID is required');
  }
  
  if (!Array.isArray(receipt.items) || receipt.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  if (receipt.total < 0) {
    errors.push('Total cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate invoice data
 */
export function validateInvoice(invoice) {
  const errors = [];
  
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    errors.push('Invoice number is required');
  }
  
  if (!invoice.customerName || invoice.customerName.trim() === '') {
    errors.push('Customer name is required');
  }
  
  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  if (invoice.total < 0) {
    errors.push('Total cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
