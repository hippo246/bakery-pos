// Expense domain model with schema validation and helper functions

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { roundCurrency } from './money.js';

/**
 * Standard Expense schema
 * @typedef {Object} Expense
 * @property {string} id - Unique expense identifier
 * @property {string} title - Expense title/description
 * @property {string} category - Expense category
 * @property {number} amount - Expense amount
 * @property {string} currency - Currency code (default INR)
 * @property {string} supplier - Supplier/vendor name
 * @property {string|null} invoiceNumber - Invoice number
 * @property {number|null} dueDate - Due date timestamp
 * @property {"UNPAID"|"PARTIAL":"PAID"|"OVERDUE"} paymentStatus - Payment status
 * @property {number} paidAmount - Amount paid so far
 * @property {number|null} paidAt - Payment completion timestamp
 * @property {string|null} paymentMethod - Payment method used
 * @property {string|null} receiptUrl - Receipt/document URL
 * @property {string} notes - Additional notes
 * @property {boolean} recurring - Whether this is a recurring expense
 * @property {string|null} recurrencePattern - Recurrence pattern (weekly, monthly, etc.)
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

// Valid expense categories
export const EXPENSE_CATEGORIES = [
  'RENT',
  'UTILITIES',
  'INVENTORY',
  'EQUIPMENT',
  'MAINTENANCE',
  'MARKETING',
  'STAFF',
  'INSURANCE',
  'TAXES',
  'OTHER'
];

// Valid payment statuses
export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'];

// Valid payment methods
export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'];

// Recurrence patterns
export const RECURRENCE_PATTERNS = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

function devWarn(msg, value) {
  console.warn(`[expenseModel] ${msg}`, value ?? '');
}

/**
 * Clamp a value to a safe number, returning fallback if NaN/non-finite
 */
function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Create a new expense from input data
 * @param {object} input - Expense input data
 * @returns {Expense} New expense object
 */
export function createExpense(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const category = EXPENSE_CATEGORIES.includes(safeInput.category) ? safeInput.category : 'OTHER';
  if (safeInput.category && !EXPENSE_CATEGORIES.includes(safeInput.category)) devWarn('invalid category', safeInput.category);

  const paymentStatus = PAYMENT_STATUSES.includes(safeInput.paymentStatus) ? safeInput.paymentStatus : 'UNPAID';
  const paymentMethod = PAYMENT_METHODS.includes(safeInput.paymentMethod) ? safeInput.paymentMethod : null;

  const amount = safeNum(safeInput.amount, 0);
  const paidAmount = safeNum(safeInput.paidAmount, 0);

  return {
    id: safeInput.id || generateId(),
    title: typeof safeInput.title === 'string' ? safeInput.title.trim() : 'Untitled Expense',
    category,
    amount: roundCurrency(amount),
    currency: safeInput.currency || 'INR',
    supplier: typeof safeInput.supplier === 'string' ? safeInput.supplier.trim() : '',
    invoiceNumber: safeInput.invoiceNumber || null,
    dueDate: safeInput.dueDate ? toTimestamp(safeInput.dueDate) : null,
    paymentStatus,
    paidAmount: roundCurrency(Math.min(paidAmount, amount)),
    paidAt: safeInput.paidAt ? toTimestamp(safeInput.paidAt) : null,
    paymentMethod,
    receiptUrl: safeInput.receiptUrl || null,
    notes: typeof safeInput.notes === 'string' ? safeInput.notes : '',
    recurring: Boolean(safeInput.recurring),
    recurrencePattern: RECURRENCE_PATTERNS.includes(safeInput.recurrencePattern) ? safeInput.recurrencePattern : null,
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now()
  };
}

/**
 * Normalize an expense to ensure it matches the schema
 * @param {object} expense - Expense object to normalize
 * @returns {Expense} Normalized expense
 */
export function normalizeExpense(expense) {
  if (!expense || typeof expense !== 'object') return null;

  const category = EXPENSE_CATEGORIES.includes(expense.category) ? expense.category : 'OTHER';
  const paymentStatus = PAYMENT_STATUSES.includes(expense.paymentStatus) ? expense.paymentStatus : 'UNPAID';
  const paymentMethod = PAYMENT_METHODS.includes(expense.paymentMethod) ? expense.paymentMethod : null;

  const amount = safeNum(expense.amount, 0);
  const paidAmount = safeNum(expense.paidAmount, 0);

  const createdAt = toTimestamp(expense.createdAt ?? now());
  const updatedAt = toTimestamp(expense.updatedAt ?? now());

  return {
    id: expense.id || generateId(),
    title: typeof expense.title === 'string' ? expense.title.trim() : 'Untitled Expense',
    category,
    amount: roundCurrency(amount),
    currency: expense.currency || 'INR',
    supplier: typeof expense.supplier === 'string' ? expense.supplier.trim() : '',
    invoiceNumber: expense.invoiceNumber || null,
    dueDate: expense.dueDate ? toTimestamp(expense.dueDate) : null,
    paymentStatus,
    paidAmount: roundCurrency(Math.min(paidAmount, amount)),
    paidAt: expense.paidAt ? toTimestamp(expense.paidAt) : null,
    paymentMethod,
    receiptUrl: expense.receiptUrl || null,
    notes: typeof expense.notes === 'string' ? expense.notes : '',
    recurring: Boolean(expense.recurring),
    recurrencePattern: RECURRENCE_PATTERNS.includes(expense.recurrencePattern) ? expense.recurrencePattern : null,
    createdAt,
    updatedAt
  };
}

/**
 * Validate expense data
 * @param {object} expense - Expense to validate
 * @returns {{ valid: boolean, message: string|null }}
 */
export function validateExpense(expense) {
  if (!expense || typeof expense !== 'object') {
    return { valid: false, message: 'Expense must be an object' };
  }

  if (!expense.title || typeof expense.title !== 'string' || expense.title.trim().length === 0) {
    return { valid: false, message: 'Title is required' };
  }

  if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
    return { valid: false, message: 'Amount must be a positive number' };
  }

  if (expense.paidAmount && (Number.isFinite(expense.paidAmount) && expense.paidAmount > expense.amount)) {
    return { valid: false, message: 'Paid amount cannot exceed total amount' };
  }

  return { valid: true, message: null };
}

/**
 * Calculate remaining amount to pay
 * @param {Expense} expense - Expense object
 * @returns {number} Remaining amount
 */
export function calculateRemainingAmount(expense) {
  if (!expense) return 0;
  const amount = safeNum(expense.amount, 0);
  const paidAmount = safeNum(expense.paidAmount, 0);
  return roundCurrency(Math.max(0, amount - paidAmount));
}

/**
 * Check if expense is overdue
 * @param {Expense} expense - Expense object
 * @returns {boolean} True if overdue
 */
export function isExpenseOverdue(expense) {
  if (!expense || !expense.dueDate || expense.paymentStatus === 'PAID') return false;
  return expense.dueDate < now();
}

/**
 * Update payment status based on paid amount
 * @param {Expense} expense - Expense object
 * @returns {string} Updated payment status
 */
export function updatePaymentStatus(expense) {
  if (!expense) return 'UNPAID';

  const remaining = calculateRemainingAmount(expense);

  if (remaining === 0) return 'PAID';
  if (expense.paidAmount > 0) return 'PARTIAL';
  if (isExpenseOverdue(expense)) return 'OVERDUE';
  return 'UNPAID';
}

/**
 * Record a payment on an expense
 * @param {Expense} expense - Expense object
 * @param {number} amount - Payment amount
 * @param {string} method - Payment method
 * @returns {Expense} Updated expense
 */
export function recordPayment(expense, amount, method) {
  const paymentAmount = safeNum(amount, 0);
  const paymentMethod = PAYMENT_METHODS.includes(method) ? method : null;

  const newPaidAmount = roundCurrency(safeNum(expense.paidAmount, 0) + paymentAmount);
  const totalAmount = safeNum(expense.amount, 0);

  const updatedExpense = {
    ...expense,
    paidAmount: roundCurrency(Math.min(newPaidAmount, totalAmount)),
    paymentMethod: paymentMethod || expense.paymentMethod,
    updatedAt: now()
  };

  if (newPaidAmount >= totalAmount) {
    updatedExpense.paidAt = now();
    updatedExpense.paymentStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    updatedExpense.paymentStatus = 'PARTIAL';
  }

  return updatedExpense;
}
