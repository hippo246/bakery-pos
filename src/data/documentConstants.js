// Document constants, configurations, and seed data for Receipts & Documents module

import { DOCUMENT_TYPES, DOCUMENT_STATUS, DOCUMENT_PAYMENT_STATUS, CREDIT_NOTE_REASONS } from '../domain/documentModel.js';

/**
 * Business details for document headers
 */
export const BUSINESS_DETAILS = {
  legalName: 'Tas Healthy World LLP',
  tradingName: 'Tas Healthy World',
  address: 'Bicholim, Goa, India',
  phone: '+91-832-234-5678',
  email: 'info@tashealthyworld.com',
  website: 'www.tashealthyworld.com',
  gstNumber: '29AAFT12345L1Z1',
  fssaiNumber: '10012345678901',
  currency: '₹',
  currencyCode: 'INR'
};

/**
 * Document type configurations
 */
export const DOCUMENT_TYPE_CONFIG = {
  RECEIPT: {
    label: 'Sales Receipt',
    shortLabel: 'Receipt',
    icon: '🧾',
    color: '#27ae60',
    bgColor: '#e8f8f0',
    description: 'Proof of payment for completed sales'
  },
  INVOICE: {
    label: 'Invoice',
    shortLabel: 'Invoice',
    icon: '📄',
    color: '#2980b9',
    bgColor: '#eaf2f8',
    description: 'Formal bill for customer payment'
  },
  PAYMENT_RECEIPT: {
    label: 'Payment Receipt',
    shortLabel: 'Payment',
    icon: '💳',
    color: '#8e44ad',
    bgColor: '#f4ecf7',
    description: 'Record of payment received'
  },
  CREDIT_NOTE: {
    label: 'Credit Note',
    shortLabel: 'Credit',
    icon: '📝',
    color: '#e67e22',
    bgColor: '#fef5e7',
    description: 'Credit for returns or corrections'
  },
  DELIVERY_NOTE: {
    label: 'Delivery Note',
    shortLabel: 'Delivery',
    icon: '🚚',
    color: '#16a085',
    bgColor: '#e8f8f5',
    description: 'Record of goods delivered'
  }
};

/**
 * Document status configurations
 */
export const DOCUMENT_STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: '#7f8c8d',
    bgColor: '#f4f4f4'
  },
  ISSUED: {
    label: 'Issued',
    color: '#27ae60',
    bgColor: '#e8f8f0'
  },
  PAID: {
    label: 'Paid',
    color: '#27ae60',
    bgColor: '#e8f8f0'
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    color: '#f39c12',
    bgColor: '#fef5e7'
  },
  OVERDUE: {
    label: 'Overdue',
    color: '#e74c3c',
    bgColor: '#fadbd8'
  },
  VOIDED: {
    label: 'Voided',
    color: '#c0392b',
    bgColor: '#f5b7b1'
  },
  CREDITED: {
    label: 'Credited',
    color: '#e67e22',
    bgColor: '#fef5e7'
  }
};

/**
 * Payment status configurations
 */
export const PAYMENT_STATUS_CONFIG = {
  UNPAID: {
    label: 'Unpaid',
    color: '#e74c3c',
    bgColor: '#fadbd8'
  },
  PARTIAL: {
    label: 'Partial',
    color: '#f39c12',
    bgColor: '#fef5e7'
  },
  PAID: {
    label: 'Paid',
    color: '#27ae60',
    bgColor: '#e8f8f0'
  },
  OVERPAID: {
    label: 'Overpaid',
    color: '#8e44ad',
    bgColor: '#f4ecf7'
  },
  REFUNDED: {
    label: 'Refunded',
    color: '#c0392b',
    bgColor: '#f5b7b1'
  }
};

/**
 * Credit note reason configurations
 */
export const CREDIT_NOTE_REASON_CONFIG = {
  RETURN: {
    label: 'Return',
    description: 'Customer returned items'
  },
  OVERCHARGE: {
    label: 'Overcharge',
    description: 'Incorrect charge applied'
  },
  ITEM_UNAVAILABLE: {
    label: 'Item Unavailable',
    description: 'Ordered item not available'
  },
  QUALITY_ISSUE: {
    label: 'Quality Issue',
    description: 'Product quality problem'
  },
  ORDER_CORRECTION: {
    label: 'Order Correction',
    description: 'Order details correction'
  },
  DELIVERY_ISSUE: {
    label: 'Delivery Issue',
    description: 'Delivery-related problem'
  },
  OTHER: {
    label: 'Other',
    description: 'Other reason'
  }
};

/**
 * Payment method configurations
 */
export const PAYMENT_METHOD_CONFIG = {
  CASH: {
    label: 'Cash',
    icon: '💵'
  },
  UPI: {
    label: 'UPI',
    icon: '📱'
  },
  CARD: {
    label: 'Card',
    icon: '💳'
  },
  SPLIT: {
    label: 'Split',
    icon: '🔀'
  },
  ONLINE: {
    label: 'Online',
    icon: '🌐'
  },
  COD: {
    label: 'COD',
    icon: '📦'
  }
};

/**
 * Order type configurations
 */
export const ORDER_TYPE_CONFIG = {
  DINE_IN: {
    label: 'Dine-in',
    icon: '🍽️'
  },
  TAKEAWAY: {
    label: 'Takeaway',
    icon: '🥡'
  },
  DELIVERY: {
    label: 'Delivery',
    icon: '🚚'
  }
};

/**
 * Printer width configurations
 */
export const PRINTER_WIDTH_CONFIG = {
  '58mm': {
    label: '58mm Thermal',
    width: 58,
    charsPerLine: 32,
    fontSize: 12
  },
  '80mm': {
    label: '80mm Thermal',
    width: 80,
    charsPerLine: 48,
    fontSize: 14
  },
  A4: {
    label: 'A4',
    width: 210,
    charsPerLine: 120,
    fontSize: 12
  }
};

/**
 * Payment terms options
 */
export const PAYMENT_TERMS_OPTIONS = [
  { value: 'NET 7', label: 'Net 7 Days' },
  { value: 'NET 15', label: 'Net 15 Days' },
  { value: 'NET 30', label: 'Net 30 Days' },
  { value: 'NET 45', label: 'Net 45 Days' },
  { value: 'NET 60', label: 'Net 60 Days' },
  { value: 'CASH', label: 'Cash on Delivery' },
  { value: 'IMMEDIATE', label: 'Immediate' }
];

/**
 * Utility functions
 */

/**
 * Format currency for documents
 */
export function formatDocumentCurrency(amount) {
  return `${BUSINESS_DETAILS.currency}${Number(amount).toFixed(2)}`;
}

/**
 * Format date for documents
 */
export function formatDocumentDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format date-time for documents
 */
export function formatDocumentDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time for documents
 */
export function formatDocumentTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate document statistics
 */
export function calculateDocumentStatistics(documents) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const receipts = documents.filter(d => d.receiptNumber);
  const invoices = documents.filter(d => d.invoiceNumber);
  const paymentReceipts = documents.filter(d => d.paymentReceiptNumber);
  const creditNotes = documents.filter(d => d.creditNoteNumber);

  const receiptsToday = receipts.filter(d => d.issuedAt >= todayTimestamp);
  const invoicesToday = invoices.filter(d => d.issuedAt >= todayTimestamp);
  const unpaidInvoices = invoices.filter(d => d.paymentStatus === 'UNPAID' || d.paymentStatus === 'PARTIAL');
  const partiallyPaid = invoices.filter(d => d.paymentStatus === 'PARTIAL');
  const reprintsToday = receipts.filter(d => d.printedAt >= todayTimestamp && d.printCount > 1);

  return {
    receiptsToday: receiptsToday.length,
    invoicesToday: invoicesToday.length,
    unpaidInvoices: unpaidInvoices.length,
    partiallyPaid: partiallyPaid.length,
    reprintsToday: reprintsToday.length,
    creditNotes: creditNotes.length,
    totalReceipts: receipts.length,
    totalInvoices: invoices.length,
    totalRevenue: receipts.reduce((sum, r) => sum + (r.total || 0), 0),
    outstandingBalance: unpaidInvoices.reduce((sum, i) => sum + (i.balance || 0), 0)
  };
}

/**
 * Get documents by customer
 */
export function getDocumentsByCustomer(documents, customerId) {
  return documents.filter(d => d.customerId === customerId);
}

/**
 * Get documents by order
 */
export function getDocumentsByOrder(documents, orderId) {
  return documents.filter(d => d.orderId === orderId);
}

/**
 * Search documents
 */
export function searchDocuments(documents, query) {
  if (!query || query.trim() === '') return documents;
  const lowerQuery = query.toLowerCase();
  
  return documents.filter(doc => {
    const number = doc.receiptNumber || doc.invoiceNumber || doc.paymentReceiptNumber || doc.creditNoteNumber || '';
    const customerName = doc.customerName || '';
    const customerPhone = doc.customerPhone || '';
    const orderId = doc.orderId || '';
    const notes = doc.notes || '';
    
    return (
      number.toLowerCase().includes(lowerQuery) ||
      customerName.toLowerCase().includes(lowerQuery) ||
      customerPhone.includes(lowerQuery) ||
      orderId.toLowerCase().includes(lowerQuery) ||
      notes.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Filter documents by type
 */
export function filterDocumentsByType(documents, type) {
  switch (type) {
    case 'RECEIPT':
      return documents.filter(d => d.receiptNumber);
    case 'INVOICE':
      return documents.filter(d => d.invoiceNumber);
    case 'PAYMENT_RECEIPT':
      return documents.filter(d => d.paymentReceiptNumber);
    case 'CREDIT_NOTE':
      return documents.filter(d => d.creditNoteNumber);
    default:
      return documents;
  }
}

/**
 * Filter documents by payment status
 */
export function filterDocumentsByPaymentStatus(documents, status) {
  return documents.filter(d => d.paymentStatus === status);
}

/**
 * Filter documents by date range
 */
export function filterDocumentsByDateRange(documents, startDate, endDate) {
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
  
  return documents.filter(d => {
    const docDate = d.issuedAt || d.createdAt || d.receivedAt || 0;
    return docDate >= start && docDate <= end;
  });
}

/**
 * Sort documents
 */
export function sortDocuments(documents, sortBy) {
  const sorted = [...documents];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => (b.issuedAt || b.createdAt || 0) - (a.issuedAt || a.createdAt || 0));
    case 'oldest':
      return sorted.sort((a, b) => (a.issuedAt || a.createdAt || 0) - (b.issuedAt || b.createdAt || 0));
    case 'highest_value':
      return sorted.sort((a, b) => (b.total || 0) - (a.total || 0));
    case 'lowest_value':
      return sorted.sort((a, b) => (a.total || 0) - (b.total || 0));
    case 'recently_printed':
      return sorted.sort((a, b) => (b.printedAt || 0) - (a.printedAt || 0));
    case 'recently_updated':
      return sorted.sort((a, b) => {
        const aTime = Math.max(a.issuedAt || 0, a.printedAt || 0, a.createdAt || 0);
        const bTime = Math.max(b.issuedAt || 0, b.printedAt || 0, b.createdAt || 0);
        return bTime - aTime;
      });
    case 'unpaid_first':
      return sorted.sort((a, b) => {
        const aUnpaid = a.paymentStatus === 'UNPAID' ? 0 : 1;
        const bUnpaid = b.paymentStatus === 'UNPAID' ? 0 : 1;
        if (aUnpaid !== bUnpaid) return aUnpaid - bUnpaid;
        return (b.issuedAt || 0) - (a.issuedAt || 0);
      });
    case 'document_number':
      return sorted.sort((a, b) => {
        const aNum = a.receiptNumber || a.invoiceNumber || a.paymentReceiptNumber || a.creditNoteNumber || '';
        const bNum = b.receiptNumber || b.invoiceNumber || b.paymentReceiptNumber || b.creditNoteNumber || '';
        return aNum.localeCompare(bNum);
      });
    case 'customer':
      return sorted.sort((a, b) => {
        const aName = a.customerName || '';
        const bName = b.customerName || '';
        return aName.localeCompare(bName);
      });
    default:
      return sorted;
  }
}

/**
 * Generate seed receipts
 */
export function getSeedReceipts() {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  
  return [
    {
      id: 'RCP-001',
      receiptNumber: `RCP-${year}-0001`,
      orderId: 'ORD-001',
      customerId: 'c1',
      customerName: 'Rohan Mehta',
      customerPhone: '9876543210',
      customerEmail: 'rohan@email.com',
      tableId: null,
      orderType: 'TAKEAWAY',
      items: [
        {
          id: 'RI-001',
          menuItemId: 'm2',
          name: 'Cappuccino',
          quantity: 2,
          unitPrice: 120,
          modifiers: [],
          taxRate: 18,
          taxAmount: 43.20,
          lineTotal: 240
        },
        {
          id: 'RI-002',
          menuItemId: 'm5',
          name: 'Croissant',
          quantity: 1,
          unitPrice: 90,
          modifiers: [],
          taxRate: 18,
          taxAmount: 16.20,
          lineTotal: 90
        }
      ],
      subtotal: 330,
      discountAmount: 0,
      taxAmount: 59.40,
      serviceCharge: 0,
      deliveryCharge: 0,
      total: 389.40,
      paymentMethod: 'UPI',
      amountPaid: 389.40,
      balance: 0,
      paymentStatus: 'PAID',
      status: 'ISSUED',
      branchId: 'BRANCH-1',
      branchName: 'Main Branch',
      staffId: 'STAFF-001',
      staffName: 'System',
      notes: null,
      createdAt: now - (2 * 60 * 60 * 1000),
      issuedAt: now - (2 * 60 * 60 * 1000),
      printedAt: now - (2 * 60 * 60 * 1000),
      printCount: 1,
      isReprint: false,
      originalReceiptId: null,
      linkedInvoiceId: null,
      linkedCreditNoteId: null,
      activities: [
        {
          id: 'ACT-001',
          action: 'CREATED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (2 * 60 * 60 * 1000),
          details: 'Receipt created from order ORD-001'
        },
        {
          id: 'ACT-002',
          action: 'PRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (2 * 60 * 60 * 1000),
          details: 'Document printed'
        }
      ]
    },
    {
      id: 'RCP-002',
      receiptNumber: `RCP-${year}-0002`,
      orderId: 'ORD-002',
      customerId: 'c2',
      customerName: 'Priya Sharma',
      customerPhone: '8765432109',
      customerEmail: 'priya@email.com',
      tableId: 'T-3',
      orderType: 'DINE_IN',
      items: [
        {
          id: 'RI-003',
          menuItemId: 'm4',
          name: 'Matcha Latte',
          quantity: 1,
          unitPrice: 160,
          modifiers: [],
          taxRate: 18,
          taxAmount: 28.80,
          lineTotal: 160
        },
        {
          id: 'RI-004',
          menuItemId: 'm6',
          name: 'Avocado Toast',
          quantity: 1,
          unitPrice: 180,
          modifiers: [],
          taxRate: 18,
          taxAmount: 32.40,
          lineTotal: 180
        }
      ],
      subtotal: 340,
      discountAmount: 0,
      taxAmount: 61.20,
      serviceCharge: 0,
      deliveryCharge: 0,
      total: 401.20,
      paymentMethod: 'CARD',
      amountPaid: 401.20,
      balance: 0,
      paymentStatus: 'PAID',
      status: 'ISSUED',
      branchId: 'BRANCH-1',
      branchName: 'Main Branch',
      staffId: 'STAFF-001',
      staffName: 'System',
      notes: 'Extra napkins requested',
      createdAt: now - (5 * 60 * 60 * 1000),
      issuedAt: now - (5 * 60 * 60 * 1000),
      printedAt: now - (5 * 60 * 60 * 1000),
      printCount: 2,
      isReprint: false,
      originalReceiptId: null,
      linkedInvoiceId: null,
      linkedCreditNoteId: null,
      activities: [
        {
          id: 'ACT-003',
          action: 'CREATED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (5 * 60 * 60 * 1000),
          details: 'Receipt created from order ORD-002'
        },
        {
          id: 'ACT-004',
          action: 'PRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (5 * 60 * 60 * 1000),
          details: 'Document printed'
        },
        {
          id: 'ACT-005',
          action: 'REPRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (4 * 60 * 60 * 1000),
          details: 'Document reprinted'
        }
      ]
    }
  ];
}

/**
 * Generate seed invoices
 */
export function getSeedInvoices() {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  
  return [
    {
      id: 'INV-001',
      invoiceNumber: `INV-${year}-0001`,
      orderId: null,
      linkedReceiptId: null,
      customerId: 'c3',
      customerName: 'Vikram Desai',
      customerPhone: '7654321098',
      customerEmail: 'vikram@email.com',
      customerAddress: '123 Main Street, Panaji, Goa 403001',
      customerGstNumber: '29ABCDE1234F1Z5',
      customerState: 'Goa',
      items: [
        {
          id: 'II-001',
          menuItemId: 'm1',
          name: 'Espresso',
          description: 'Double shot, intense & smooth',
          quantity: 10,
          unit: 'cups',
          unitPrice: 80,
          taxRate: 18,
          taxAmount: 144,
          lineTotal: 800
        },
        {
          id: 'II-002',
          menuItemId: 'm2',
          name: 'Cappuccino',
          description: 'Espresso with steamed milk foam',
          quantity: 5,
          unit: 'cups',
          unitPrice: 120,
          taxRate: 18,
          taxAmount: 108,
          lineTotal: 600
        }
      ],
      subtotal: 1400,
      discountAmount: 0,
      taxAmount: 252,
      serviceCharge: 0,
      deliveryCharge: 0,
      total: 1652,
      amountPaid: 0,
      balance: 1652,
      paymentStatus: 'UNPAID',
      paymentTerms: 'NET 15',
      dueDate: new Date(now + (15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: 'ISSUED',
      branchId: 'BRANCH-1',
      branchName: 'Main Branch',
      staffId: 'STAFF-001',
      staffName: 'System',
      notes: 'Monthly coffee supply',
      footerNote: 'Thank you for your business!',
      createdAt: now - (10 * 24 * 60 * 60 * 1000),
      issuedAt: now - (10 * 24 * 60 * 60 * 1000),
      dueDateTimestamp: now - (10 * 24 * 60 * 60 * 1000) + (15 * 24 * 60 * 60 * 1000),
      printedAt: now - (10 * 24 * 60 * 60 * 1000),
      printCount: 1,
      payments: [],
      activities: [
        {
          id: 'ACT-006',
          action: 'CREATED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (10 * 24 * 60 * 60 * 1000),
          details: 'Invoice created'
        },
        {
          id: 'ACT-007',
          action: 'PRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (10 * 24 * 60 * 60 * 1000),
          details: 'Document printed'
        }
      ]
    }
  ];
}

/**
 * Generate seed payment receipts
 */
export function getSeedPaymentReceipts() {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  
  return [
    {
      id: 'PMT-001',
      paymentReceiptNumber: `PMT-${year}-0001`,
      invoiceId: 'INV-001',
      orderId: null,
      customerId: 'c3',
      customerName: 'Vikram Desai',
      customerPhone: '7654321098',
      amountReceived: 500,
      paymentMethod: 'UPI',
      paymentReference: 'UPI123456789',
      previousBalance: 1652,
      remainingBalance: 1152,
      status: 'ISSUED',
      branchId: 'BRANCH-1',
      branchName: 'Main Branch',
      receivedBy: 'STAFF-001',
      receivedByName: 'System',
      notes: 'Partial payment',
      createdAt: now - (5 * 24 * 60 * 60 * 1000),
      receivedAt: now - (5 * 24 * 60 * 60 * 1000),
      printedAt: now - (5 * 24 * 60 * 60 * 1000),
      printCount: 1,
      activities: [
        {
          id: 'ACT-008',
          action: 'CREATED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (5 * 24 * 60 * 60 * 1000),
          details: 'Payment of 500 received via UPI'
        },
        {
          id: 'ACT-009',
          action: 'PRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (5 * 24 * 60 * 60 * 1000),
          details: 'Document printed'
        }
      ]
    }
  ];
}

/**
 * Generate seed credit notes
 */
export function getSeedCreditNotes() {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  
  return [
    {
      id: 'CRN-001',
      creditNoteNumber: `CRN-${year}-0001`,
      originalDocumentId: 'RCP-001',
      originalDocumentType: 'RECEIPT',
      originalDocumentNumber: `RCP-${year}-0001`,
      orderId: 'ORD-001',
      customerId: 'c1',
      customerName: 'Rohan Mehta',
      customerPhone: '9876543210',
      reason: 'QUALITY_ISSUE',
      reasonDescription: 'Croissant was stale',
      items: [
        {
          id: 'CI-001',
          originalItemId: 'RI-002',
          name: 'Croissant',
          quantity: 1,
          unitPrice: 90,
          taxRate: 18,
          taxAmount: 16.20,
          lineTotal: 90,
          notes: 'Returned item'
        }
      ],
      subtotal: 90,
      taxAmount: 16.20,
      total: 106.20,
      refundAmount: 106.20,
      refundMethod: 'CASH',
      refundReference: 'REF-001',
      status: 'ISSUED',
      branchId: 'BRANCH-1',
      branchName: 'Main Branch',
      createdBy: 'STAFF-001',
      createdByName: 'System',
      notes: 'Customer complaint resolved',
      createdAt: now - (1 * 24 * 60 * 60 * 1000),
      issuedAt: now - (1 * 24 * 60 * 60 * 1000),
      printedAt: now - (1 * 24 * 60 * 60 * 1000),
      printCount: 1,
      activities: [
        {
          id: 'ACT-010',
          action: 'CREATED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (1 * 24 * 60 * 60 * 1000),
          details: 'Credit note created for RCP-2026-0001 (QUALITY_ISSUE)'
        },
        {
          id: 'ACT-011',
          action: 'PRINTED',
          userId: 'STAFF-001',
          userName: 'System',
          timestamp: now - (1 * 24 * 60 * 60 * 1000),
          details: 'Document printed'
        }
      ]
    }
  ];
}

/**
 * Get all seed documents
 */
export function getSeedDocuments() {
  return [
    ...getSeedReceipts(),
    ...getSeedInvoices(),
    ...getSeedPaymentReceipts(),
    ...getSeedCreditNotes()
  ];
}
