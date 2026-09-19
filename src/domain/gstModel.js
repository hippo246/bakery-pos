// GST Domain Model - Core data structures and validation functions

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { 
  GST_RATES, 
  GSTIN_REGEX, 
  STATE_CODES, 
  INVOICE_TYPES,
  TRANSACTION_TYPES,
  TAX_TYPES,
  EINVOICE_STATUS,
  REPORT_TYPES,
  REPORT_FREQUENCIES
} from '../data/gstConstants.js';

/**
 * GST Invoice schema
 * @typedef {Object} GSTInvoice
 * @property {string} id - Unique invoice identifier
 * @property {string} invoiceNumber - Sequential invoice number (e.g., "INV-2024-001")
 * @property {string} invoiceType - B2B, B2C, B2CL, B2CS, EXPORT
 * @property {string} transactionType - SALE, PURCHASE, DEBIT_NOTE, CREDIT_NOTE, ADVANCE_RECEIPT
 * @property {string} date - Invoice date (ISO string)
 * @property {string|null} customerGSTIN - Customer GSTIN (for B2B)
 * @property {string} customerName - Customer name
 * @property {string} customerState - Customer state code
 * @property {string} supplierGSTIN - Supplier GSTIN (your business GSTIN)
 * @property {string} supplierState - Supplier state code
 * @property {boolean} interstate - Whether transaction is interstate
 * @property {GSTInvoiceItem[]} items - Invoice items
 * @property {number} subtotal - Subtotal before tax
 * @property {number} discountAmount - Discount amount
 * @property {number} taxableAmount - Taxable amount (subtotal - discount)
 * @property {number} cgst - CGST amount
 * @property {number} sgst - SGST amount
 * @property {number} igst - IGST amount
 * @property {number} cess - Cess amount
 * @property {number} totalTax - Total tax amount
 * @property {number} total - Total amount including tax
 * @property {string|null} irn - Invoice Reference Number (for e-invoicing)
 * @property {string} irnStatus - E-invoice status
 * @property {string|null} qrCode - Dynamic QR code data
 * @property {string} orderSource - Order source (WALK_IN, SWIGGY, ZOMATO, etc.)
 * @property {string} branchId - Branch ID for multi-outlet
 * @property {string} createdBy - User who created invoice
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * GST Invoice Item schema
 * @typedef {Object} GSTInvoiceItem
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {string} hsnSac - HSN/SAC code
 * @property {number} quantity - Quantity
 * @property {string} unit - Unit (PCS, KG, LTR, etc.)
 * @property {number} rate - Unit price
 * @property {number} total - Line total (quantity × rate)
 * @property {number} discountAmount - Discount amount for this line
 * @property {number} taxableValue - Taxable value (total - discount)
 * @property {number} taxRate - Tax rate (e.g., 0.18 for 18%)
 * @property {number} cgst - CGST amount
 * @property {number} sgst - SGST amount
 * @property {number} igst - IGST amount
 * @property {number} cess - Cess amount
 */

/**
 * GST Tax Payment schema
 * @typedef {Object} GSTTaxPayment
 * @property {string} id - Unique payment identifier
 * @property {string} period - Tax period (e.g., "2024-01")
 * @property {string} taxType - CGST, SGST, IGST, CESS
 * @property {number} taxCollected - Tax collected from sales
 * @property {number} itcAvailable - ITC available from purchases
 * @property {number} taxPayable - Net tax payable (collected - ITC)
 * @property {number} taxPaid - Tax actually paid
 * @property {string} challanNumber - Challan number
 * @property {string} challanDate - Challan date
 * @property {string} status - PENDING, PAID, OVERDUE
 * @property {number} createdAt - Creation timestamp
 */

/**
 * GST Report Schedule schema
 * @typedef {Object} GSTReportSchedule
 * @property {string} id - Unique schedule identifier
 * @property {string} reportType - Report type (GSTR1, GSTR3B, etc.)
 * @property {string} frequency - DAILY, WEEKLY, MONTHLY, YEARLY
 * @property {string[]} recipientEmails - Email addresses to send reports to
 * @property {string} branchId - Branch ID (null for all branches)
 * @property {boolean} active - Whether schedule is active
 * @property {string} lastSent - Last sent timestamp
 * @property {string} nextSend - Next scheduled send timestamp
 * @property {object} filters - Additional filters (date range, etc.)
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Vendor GST Validation schema
 * @typedef {Object} VendorGSTValidation
 * @property {string} id - Unique validation identifier
 * @property {string} vendorId - Vendor ID
 * @property {string} vendorName - Vendor name
 * @property {string} gstin - Vendor GSTIN
 * @property {boolean} isValid - Whether GSTIN is valid format
 * @property {boolean} isRegistered - Whether vendor is GST registered
 * @property {string} registrationStatus - Active, Cancelled, Suspended
 * @property {string} lastChecked - Last validation timestamp
 * @property {string} lastFilingPeriod - Last GSTR-1 filing period
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Turnover Tracker schema
 * @typedef {Object} TurnoverTracker
 * @property {string} id - Unique tracker identifier
 * @property {string} branchId - Branch ID
 * @property {string} financialYear - Financial year (e.g., "2024-25")
 * @property {number} currentTurnover - Current year turnover
 * @property {number} registrationThreshold - Registration threshold (₹40L)
 * @property {number} compositionThreshold - Composition threshold (₹1.5Cr)
 * @property {number} einvoiceThreshold - E-invoice threshold (₹5Cr)
 * @property {boolean} nearRegistrationLimit - Alert if near registration limit
 * @property {boolean} nearCompositionLimit - Alert if near composition limit
 * @property {boolean} nearEinvoiceLimit - Alert if near e-invoice limit
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Invoice Sequence Gap schema
 * @typedef {Object} InvoiceSequenceGap
 * @property {string} id - Unique gap identifier
 * @property {string} branchId - Branch ID
 * @property {string} period - Period (e.g., "2024-01")
 * @property {number} expectedNumber - Expected invoice number
 * @property {number|null} actualNumber - Actual invoice number (null if missing)
 * @property {string} gapType - MISSING, DUPLICATE, OUT_OF_SEQUENCE
 * @property {string} status - OPEN, RESOLVED, IGNORED
 * @property {string} notes - Notes about the gap
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Amendment Log schema
 * @typedef {Object} AmendmentLog
 * @property {string} id - Unique log identifier
 * @property {string} invoiceId - Invoice ID that was amended
 * @property {string} invoiceNumber - Invoice number
 * @property {string} amendmentType - RATE_CHANGE, VALUE_CHANGE, DETAILS_CHANGE
 * @property {object} oldValue - Original value
 * @property {object} newValue - New value
 * @property {string} reason - Reason for amendment
 * @property {string} amendedBy - User who made amendment
 * @property {number} amendedAt - Amendment timestamp
 */

// Validation functions

/**
 * Validate GSTIN format
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} True if valid format
 */
export function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

/**
 * Extract state code from GSTIN
 * @param {string} gstin - GSTIN
 * @returns {string|null} State code or null if invalid
 */
export function getStateFromGSTIN(gstin) {
  if (!validateGSTIN(gstin)) return null;
  const stateCode = gstin.substring(0, 2);
  return STATE_CODES[stateCode] ? stateCode : null;
}

/**
 * Check if transaction is interstate based on GSTINs
 * @param {string} supplierState - Supplier state code
 * @param {string} customerState - Customer state code
 * @returns {boolean} True if interstate
 */
export function isInterstate(supplierState, customerState) {
  return supplierState !== customerState;
}

/**
 * Determine invoice type based on transaction details
 * @param {object} params - Transaction parameters
 * @returns {string} Invoice type
 */
export function determineInvoiceType({ hasCustomerGSTIN, interstate, amount }) {
  if (hasCustomerGSTIN) return INVOICE_TYPES.B2B;
  if (interstate && amount >= 250000) return INVOICE_TYPES.B2CL;
  return INVOICE_TYPES.B2CS;
}

/**
 * Calculate tax split based on interstate status
 * @param {number} taxAmount - Total tax amount
 * @param {boolean} interstate - Whether interstate
 * @returns {object} Tax split { cgst, sgst, igst }
 */
export function splitTax(taxAmount, interstate = false) {
  if (interstate) {
    return { cgst: 0, sgst: 0, igst: taxAmount };
  }
  const half = Math.round((taxAmount / 2) * 100) / 100;
  return { cgst: half, sgst: taxAmount - half, igst: 0 };
}

/**
 * Create a GST invoice from order data
 * @param {object} order - Order data
 * @param {object} business - Business details (GSTIN, state, etc.)
 * @returns {GSTInvoice} GST invoice
 */
export function createGSTInvoice(order, business) {
  const customerGSTIN = order.customerGSTIN || null;
  const customerState = order.customerState || business.state;
  const supplierState = business.state;
  const interstate = isInterstate(supplierState, customerState);
  
  const invoiceType = determineInvoiceType({
    hasCustomerGSTIN: !!customerGSTIN,
    interstate,
    amount: order.total
  });

  const items = order.items.map(item => ({
    id: generateId(),
    name: item.name,
    hsnSac: item.hsnSac || '9963', // Default to restaurant service SAC
    quantity: item.qty,
    unit: 'PCS',
    rate: item.price,
    total: item.qty * item.price,
    discountAmount: 0,
    taxableValue: item.qty * item.price,
    taxRate: order.taxRate || 0.05,
    ...splitTax((item.qty * item.price) * (order.taxRate || 0.05), interstate)
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = order.discountAmount || 0;
  const taxableAmount = subtotal - discountAmount;
  const totalTax = items.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const total = taxableAmount + totalTax;

  return {
    id: generateId(),
    invoiceNumber: generateInvoiceNumber(business.branchId),
    invoiceType,
    transactionType: TRANSACTION_TYPES.SALE,
    date: new Date(order.createdAt || now()).toISOString().split('T')[0],
    customerGSTIN,
    customerName: order.customerName || 'Guest',
    customerState,
    supplierGSTIN: business.gstin,
    supplierState,
    interstate,
    items,
    subtotal,
    discountAmount,
    taxableAmount,
    cgst: interstate ? 0 : totalTax / 2,
    sgst: interstate ? 0 : totalTax / 2,
    igst: interstate ? totalTax : 0,
    cess: 0,
    totalTax,
    total,
    irn: null,
    irnStatus: EINVOICE_STATUS.PENDING,
    qrCode: null,
    orderSource: order.source,
    branchId: business.branchId,
    createdBy: order.staffId,
    createdAt: now(),
    updatedAt: now()
  };
}

/**
 * Generate sequential invoice number
 * @param {string} branchId - Branch ID
 * @returns {string} Invoice number
 */
export function generateInvoiceNumber(branchId = 'MAIN') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `INV-${branchId}-${year}${month}-${timestamp}`;
}

/**
 * Create GST tax payment record
 * @param {object} data - Tax payment data
 * @returns {GSTTaxPayment} Tax payment record
 */
export function createGSTTaxPayment(data) {
  return {
    id: generateId(),
    period: data.period,
    taxType: data.taxType,
    taxCollected: data.taxCollected || 0,
    itcAvailable: data.itcAvailable || 0,
    taxPayable: Math.max(0, (data.taxCollected || 0) - (data.itcAvailable || 0)),
    taxPaid: data.taxPaid || 0,
    challanNumber: data.challanNumber || null,
    challanDate: data.challanDate || null,
    status: data.status || 'PENDING',
    createdAt: now()
  };
}

/**
 * Create GST report schedule
 * @param {object} data - Schedule data
 * @returns {GSTReportSchedule} Report schedule
 */
export function createGSTReportSchedule(data) {
  const now = new Date();
  let nextSend = new Date(now);
  
  // Calculate next send time based on frequency
  switch (data.frequency) {
    case REPORT_FREQUENCIES.DAILY:
      nextSend.setDate(nextSend.getDate() + 1);
      break;
    case REPORT_FREQUENCIES.WEEKLY:
      nextSend.setDate(nextSend.getDate() + 7);
      break;
    case REPORT_FREQUENCIES.MONTHLY:
      nextSend.setMonth(nextSend.getMonth() + 1);
      break;
    case REPORT_FREQUENCIES.YEARLY:
      nextSend.setFullYear(nextSend.getFullYear() + 1);
      break;
  }

  return {
    id: generateId(),
    reportType: data.reportType,
    frequency: data.frequency,
    recipientEmails: Array.isArray(data.recipientEmails) ? data.recipientEmails : [],
    branchId: data.branchId || null,
    active: data.active !== false,
    lastSent: null,
    nextSend: nextSend.toISOString(),
    filters: data.filters || {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Create vendor GST validation record
 * @param {object} data - Validation data
 * @returns {VendorGSTValidation} Validation record
 */
export function createVendorGSTValidation(data) {
  return {
    id: generateId(),
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    gstin: data.gstin,
    isValid: validateGSTIN(data.gstin),
    isRegistered: data.isRegistered || false,
    registrationStatus: data.registrationStatus || 'UNKNOWN',
    lastChecked: now(),
    lastFilingPeriod: data.lastFilingPeriod || null,
    createdAt: now()
  };
}

/**
 * Create turnover tracker
 * @param {object} data - Tracker data
 * @returns {TurnoverTracker} Turnover tracker
 */
export function createTurnoverTracker(data) {
  const currentTurnover = data.currentTurnover || 0;
  
  return {
    id: generateId(),
    branchId: data.branchId,
    // financialYear: data.financialYear,
    currentTurnover,
    registrationThreshold: 4000000,
    compositionThreshold: 15000000,
    einvoiceThreshold: 50000000,
    nearRegistrationLimit: currentTurnover >= 3500000, // Alert at 87.5%
    nearCompositionLimit: currentTurnover >= 13000000, // Alert at 86.7%
    nearEinvoiceLimit: currentTurnover >= 45000000, // Alert at 90%
    updatedAt: now()
  };
}

/**
 * Create invoice sequence gap record
 * @param {object} data - Gap data
 * @returns {InvoiceSequenceGap} Gap record
 */
export function createInvoiceSequenceGap(data) {
  return {
    id: generateId(),
    branchId: data.branchId,
    period: data.period,
    expectedNumber: data.expectedNumber,
    actualNumber: data.actualNumber || null,
    gapType: data.gapType,
    status: 'OPEN',
    notes: data.notes || '',
    createdAt: now()
  };
}

/**
 * Create amendment log
 * @param {object} data - Amendment data
 * @returns {AmendmentLog} Amendment log
 */
export function createAmendmentLog(data) {
  return {
    id: generateId(),
    invoiceId: data.invoiceId,
    invoiceNumber: data.invoiceNumber,
    amendmentType: data.amendmentType,
    oldValue: data.oldValue,
    newValue: data.newValue,
    reason: data.reason,
    amendedBy: data.amendedBy,
    amendedAt: now()
  };
}
