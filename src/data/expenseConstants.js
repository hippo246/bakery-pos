// Expense constants and seed data for Cost Control module

import { createExpense } from '../domain/expenseModel.js';
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

/**
 * Initial seed expenses for new installations
 * These represent common cafe expenses
 * PRODUCTION SAFETY: This is demo data, forbidden in production
 */
export const INIT_EXPENSES = () => {
  if (!isDatasetAllowed('INIT_EXPENSES')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: 'EXP-001',
    title: 'Monthly Rent',
    category: 'RENT',
    amount: 45000,
    currency: 'INR',
    supplier: 'Property Management Co.',
    invoiceNumber: 'INV-2024-001',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'MONTHLY',
    notes: 'Main cafe space rent'
  },
  {
    id: 'EXP-002',
    title: 'Electricity Bill',
    category: 'UTILITIES',
    amount: 8500,
    currency: 'INR',
    supplier: 'State Electricity Board',
    invoiceNumber: 'ELEC-2024-06',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'MONTHLY',
    notes: 'June electricity consumption'
  },
  {
    id: 'EXP-003',
    title: 'Coffee Beans Bulk Order',
    category: 'INVENTORY',
    amount: 25000,
    currency: 'INR',
    supplier: 'Premium Coffee Roasters',
    invoiceNumber: 'COF-2024-024',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'PARTIAL',
    paidAmount: 10000,
    paymentMethod: 'BANK_TRANSFER',
    recurring: true,
    recurrencePattern: 'MONTHLY',
    notes: 'Arabica and Robusta blend'
  },
  {
    id: 'EXP-004',
    title: 'Milk & Dairy Supply',
    category: 'INVENTORY',
    amount: 12000,
    currency: 'INR',
    supplier: 'Fresh Dairy Farm',
    invoiceNumber: 'DAIRY-0624',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'PAID',
    paidAmount: 12000,
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: 'UPI',
    recurring: true,
    recurrencePattern: 'WEEKLY',
    notes: 'Weekly milk delivery'
  },
  {
    id: 'EXP-005',
    title: 'Espresso Machine Maintenance',
    category: 'MAINTENANCE',
    amount: 3500,
    currency: 'INR',
    supplier: 'Coffee Equipment Services',
    invoiceNumber: 'MAINT-2024-006',
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'PAID',
    paidAmount: 3500,
    paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: 'CARD',
    recurring: false,
    notes: 'Quarterly service and calibration'
  },
  {
    id: 'EXP-006',
    title: 'Social Media Marketing',
    category: 'MARKETING',
    amount: 8000,
    currency: 'INR',
    supplier: 'Digital Marketing Agency',
    invoiceNumber: 'MKT-2024-Q2',
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'QUARTERLY',
    notes: 'Q2 social media campaign'
  },
  {
    id: 'EXP-007',
    title: 'Staff Uniforms',
    category: 'STAFF',
    amount: 6500,
    currency: 'INR',
    supplier: 'Uniform Solutions',
    invoiceNumber: 'UNI-2024-003',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: false,
    notes: 'New aprons and shirts for 5 staff members'
  },
  {
    id: 'EXP-008',
    title: 'Business Insurance Premium',
    category: 'INSURANCE',
    amount: 18000,
    currency: 'INR',
    supplier: 'Secure Insurance Co.',
    invoiceNumber: 'INS-2024-ANN',
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'YEARLY',
    notes: 'Annual liability insurance'
  },
  {
    id: 'EXP-009',
    title: 'GST Payment',
    category: 'TAXES',
    amount: 12500,
    currency: 'INR',
    supplier: 'GST Portal',
    invoiceNumber: 'GST-Q1-2024',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'OVERDUE',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'QUARTERLY',
    notes: 'Q1 GST payment - overdue'
  },
  {
    id: 'EXP-010',
    title: 'Packaging Materials',
    category: 'INVENTORY',
    amount: 4200,
    currency: 'INR',
    supplier: 'Eco Packaging Ltd',
    invoiceNumber: 'PKG-2024-012',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    recurring: true,
    recurrencePattern: 'MONTHLY',
    notes: 'Cups, lids, and takeaway containers'
  }
];
}

/**
 * Category display names and colors for UI
 */
export const EXPENSE_CATEGORY_CONFIG = {
  RENT: { label: 'Rent & Lease', color: '#e74c3c', icon: '🏢' },
  UTILITIES: { label: 'Utilities', color: '#f39c12', icon: '⚡' },
  INVENTORY: { label: 'Inventory', color: '#27ae60', icon: '📦' },
  EQUIPMENT: { label: 'Equipment', color: '#8e44ad', icon: '☕' },
  MAINTENANCE: { label: 'Maintenance', color: '#e67e22', icon: '🔧' },
  MARKETING: { label: 'Marketing', color: '#3498db', icon: '📢' },
  STAFF: { label: 'Staff Costs', color: '#16a085', icon: '👥' },
  INSURANCE: { label: 'Insurance', color: '#9b59b6', icon: '🛡️' },
  TAXES: { label: 'Taxes', color: '#c0392b', icon: '📋' },
  OTHER: { label: 'Other', color: '#7f8c8d', icon: '📝' }
};

/**
 * Payment status display config
 */
export const PAYMENT_STATUS_CONFIG = {
  UNPAID: { label: 'Unpaid', color: '#e74c3c', bgColor: '#fadbd8' },
  PARTIAL: { label: 'Partial', color: '#f39c12', bgColor: '#fdebd0' },
  PAID: { label: 'Paid', color: '#27ae60', bgColor: '#d5f5e3' },
  OVERDUE: { label: 'Overdue', color: '#c0392b', bgColor: '#fadbd8' }
};

/**
 * Recurrence pattern display config
 */
export const RECURRENCE_CONFIG = {
  WEEKLY: { label: 'Weekly', days: 7 },
  MONTHLY: { label: 'Monthly', days: 30 },
  QUARTERLY: { label: 'Quarterly', days: 90 },
  YEARLY: { label: 'Yearly', days: 365 }
};

/**
 * Get normalized seed expenses
 */
export function getSeedExpenses() {
  try {
    return INIT_EXPENSES().map(exp => createExpense(exp));
  } catch (error) {
    console.warn('[expenseConstants] Demo data not available:', error.message);
    return [];
  }
}
