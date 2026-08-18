// Purchasing constants and seed data

import { createSupplier, createPurchaseOrder, createSupplierItem } from '../domain/purchasingModel.js';
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

/**
 * Initial seed suppliers
 * PRODUCTION SAFETY: This is demo data, forbidden in production
 */
export const INIT_SUPPLIERS = () => {
  if (!isDatasetAllowed('INIT_SUPPLIERS')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: 'sup-001',
    name: 'Coffee Co',
    category: 'INGREDIENTS',
    active: true,
    preferred: true,
    contactPerson: 'John Smith',
    phone: '+91-9876543210',
    email: 'orders@coffeeco.in',
    address: '123 Industrial Area',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    gstNumber: '29ABCDE1234F1Z5',
    paymentTerms: 'NET 30',
    deliveryDays: 3,
    minimumOrder: 5000,
    deliveryCharge: 0,
    orderCount: 15,
    unpaidBalance: 12500,
    lastOrderDate: '2026-06-20',
    lastDeliveryDate: '2026-06-22'
  },
  {
    id: 'sup-002',
    name: 'Dairy Fresh',
    category: 'DAIRY',
    active: true,
    preferred: true,
    contactPerson: 'Priya Kumar',
    phone: '+91-9876543211',
    email: 'supply@dairyfresh.in',
    address: '456 Dairy Farm Road',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560002',
    country: 'India',
    gstNumber: '29FGHIJ5678K2L6',
    paymentTerms: 'NET 15',
    deliveryDays: 2,
    minimumOrder: 2000,
    deliveryCharge: 100,
    orderCount: 28,
    unpaidBalance: 4500,
    lastOrderDate: '2026-06-21',
    lastDeliveryDate: '2026-06-23'
  },
  {
    id: 'sup-003',
    name: 'Flavor Co',
    category: 'INGREDIENTS',
    active: true,
    preferred: false,
    contactPerson: 'Mike Johnson',
    phone: '+91-9876543212',
    email: 'sales@flavorco.in',
    address: '789 Flavor Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600001',
    country: 'India',
    gstNumber: '33LMNOP9012M3N7',
    paymentTerms: 'NET 30',
    deliveryDays: 5,
    minimumOrder: 3000,
    deliveryCharge: 150,
    orderCount: 8,
    unpaidBalance: 0,
    lastOrderDate: '2026-06-15',
    lastDeliveryDate: '2026-06-20'
  },
  {
    id: 'sup-004',
    name: 'Farm Fresh',
    category: 'BAKERY',
    active: true,
    preferred: false,
    contactPerson: 'Anita Patel',
    phone: '+91-9876543213',
    email: 'orders@farmfresh.in',
    address: '321 Farm Road',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560003',
    country: 'India',
    gstNumber: '29QRSTU3456O4P8',
    paymentTerms: 'NET 7',
    deliveryDays: 1,
    minimumOrder: 1000,
    deliveryCharge: 50,
    orderCount: 22,
    unpaidBalance: 2800,
    lastOrderDate: '2026-06-22',
    lastDeliveryDate: '2026-06-23'
  },
  {
    id: 'sup-005',
    name: 'Packaging Co',
    category: 'SUPPLIES',
    active: true,
    preferred: true,
    contactPerson: 'Rajesh Verma',
    phone: '+91-9876543214',
    email: 'supply@packagingco.in',
    address: '654 Packaging Lane',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    gstNumber: '27VWXYZ7890Q5R9',
    paymentTerms: 'NET 45',
    deliveryDays: 7,
    minimumOrder: 10000,
    deliveryCharge: 500,
    orderCount: 5,
    unpaidBalance: 35000,
    lastOrderDate: '2026-06-10',
    lastDeliveryDate: '2026-06-17'
  },
  {
    id: 'sup-006',
    name: 'Ice Co',
    category: 'INGREDIENTS',
    active: true,
    preferred: false,
    contactPerson: 'Suresh Kumar',
    phone: '+91-9876543215',
    email: 'orders@iceco.in',
    address: '987 Ice Factory Road',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560004',
    country: 'India',
    gstNumber: '29ABCDEF1234G1H2',
    paymentTerms: 'NET 7',
    deliveryDays: 1,
    minimumOrder: 500,
    deliveryCharge: 0,
    orderCount: 30,
    unpaidBalance: 0,
    lastOrderDate: '2026-06-23',
    lastDeliveryDate: '2026-06-23'
  }
];
};

/**
 * Initial seed purchase orders
 * PRODUCTION SAFETY: This is demo data, forbidden in production
 */
export const INIT_PURCHASE_ORDERS = () => {
  if (!isDatasetAllowed('INIT_PURCHASE_ORDERS')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: 'po-001',
    poNumber: 'PO-20260620-001',
    supplierId: 'sup-001',
    supplierName: 'Coffee Co',
    status: 'SENT',
    paymentStatus: 'UNPAID',
    receivingStatus: 'NOT_RECEIVED',
    orderDate: '2026-06-20',
    expectedDate: '2026-06-23',
    sentDate: '2026-06-20',
    items: [
      {
        id: 'pol-001',
        inventoryItemId: 'inv-001',
        inventoryItemName: 'Coffee Beans (Arabica)',
        supplierItemCode: 'CC-ARAB-001',
        supplierItemName: 'Arabica Premium',
        orderedQuantity: 50,
        unit: 'kg',
        unitPrice: 800,
        taxRate: 18,
        receivedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0
      }
    ],
    subtotal: 40000,
    tax: 7200,
    deliveryCharge: 0,
    otherCharges: 0,
    discount: 0,
    total: 47200,
    paidAmount: 0,
    remainingAmount: 47200,
    paymentTerms: 'NET 30',
    supplierNote: 'Please deliver before 10 AM',
    internalNote: 'Monthly coffee order'
  },
  {
    id: 'po-002',
    poNumber: 'PO-20260621-001',
    supplierId: 'sup-002',
    supplierName: 'Dairy Fresh',
    status: 'CONFIRMED',
    paymentStatus: 'PARTIAL',
    receivingStatus: 'NOT_RECEIVED',
    orderDate: '2026-06-21',
    expectedDate: '2026-06-23',
    sentDate: '2026-06-21',
    confirmedDate: '2026-06-21',
    items: [
      {
        id: 'pol-002',
        inventoryItemId: 'inv-002',
        inventoryItemName: 'Milk (Whole)',
        supplierItemCode: 'DF-MILK-001',
        supplierItemName: 'Whole Milk Premium',
        orderedQuantity: 100,
        unit: 'liters',
        unitPrice: 60,
        taxRate: 12,
        receivedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0
      },
      {
        id: 'pol-003',
        inventoryItemId: 'inv-003',
        inventoryItemName: 'Milk (Oat)',
        supplierItemCode: 'DF-OAT-001',
        supplierItemName: 'Oat Milk Organic',
        orderedQuantity: 50,
        unit: 'liters',
        unitPrice: 120,
        taxRate: 12,
        receivedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0
      }
    ],
    subtotal: 12000,
    tax: 1440,
    deliveryCharge: 100,
    otherCharges: 0,
    discount: 0,
    total: 13540,
    paidAmount: 5000,
    remainingAmount: 8540,
    paymentTerms: 'NET 15',
    supplierNote: 'Fresh delivery required',
    internalNote: 'Weekly dairy order'
  },
  {
    id: 'po-003',
    poNumber: 'PO-20260622-001',
    supplierId: 'sup-004',
    supplierName: 'Farm Fresh',
    status: 'PARTIALLY_RECEIVED',
    paymentStatus: 'UNPAID',
    receivingStatus: 'PARTIALLY_RECEIVED',
    orderDate: '2026-06-22',
    expectedDate: '2026-06-23',
    sentDate: '2026-06-22',
    items: [
      {
        id: 'pol-004',
        inventoryItemId: 'inv-008',
        inventoryItemName: 'Avocados',
        supplierItemCode: 'FF-AVO-001',
        supplierItemName: 'Hass Avocados',
        orderedQuantity: 50,
        unit: 'pieces',
        unitPrice: 40,
        taxRate: 5,
        receivedQuantity: 40,
        damagedQuantity: 2,
        rejectedQuantity: 0
      },
      {
        id: 'pol-005',
        inventoryItemId: 'inv-010',
        inventoryItemName: 'Eggs',
        supplierItemCode: 'FF-EGG-001',
        supplierItemName: 'Farm Fresh Eggs',
        orderedQuantity: 100,
        unit: 'pieces',
        unitPrice: 6,
        taxRate: 5,
        receivedQuantity: 100,
        damagedQuantity: 0,
        rejectedQuantity: 0
      }
    ],
    subtotal: 2600,
    tax: 130,
    deliveryCharge: 50,
    otherCharges: 0,
    discount: 0,
    total: 2780,
    paidAmount: 0,
    remainingAmount: 2780,
    paymentTerms: 'NET 7',
    supplierNote: 'Handle avocados carefully',
    internalNote: 'Fresh produce order'
  },
  {
    id: 'po-004',
    poNumber: 'PO-20260618-001',
    supplierId: 'sup-005',
    supplierName: 'Packaging Co',
    status: 'RECEIVED',
    paymentStatus: 'UNPAID',
    receivingStatus: 'FULLY_RECEIVED',
    orderDate: '2026-06-18',
    expectedDate: '2026-06-25',
    sentDate: '2026-06-18',
    receivedDate: '2026-06-23',
    items: [
      {
        id: 'pol-006',
        inventoryItemId: 'inv-013',
        inventoryItemName: 'Cups (Small)',
        supplierItemCode: 'PC-CUP-S-001',
        supplierItemName: 'Small Paper Cups',
        orderedQuantity: 1000,
        unit: 'pieces',
        unitPrice: 0.5,
        taxRate: 18,
        receivedQuantity: 1000,
        damagedQuantity: 0,
        rejectedQuantity: 0
      },
      {
        id: 'pol-007',
        inventoryItemId: 'inv-014',
        inventoryItemName: 'Cups (Large)',
        supplierItemCode: 'PC-CUP-L-001',
        supplierItemName: 'Large Paper Cups',
        orderedQuantity: 800,
        unit: 'pieces',
        unitPrice: 0.6,
        taxRate: 18,
        receivedQuantity: 800,
        damagedQuantity: 0,
        rejectedQuantity: 0
      }
    ],
    subtotal: 980,
    tax: 176.4,
    deliveryCharge: 500,
    otherCharges: 0,
    discount: 0,
    total: 1656.4,
    paidAmount: 0,
    remainingAmount: 1656.4,
    paymentTerms: 'NET 45',
    supplierNote: 'Bulk order - early delivery appreciated',
    internalNote: 'Packaging stock replenishment'
  },
  {
    id: 'po-005',
    poNumber: 'PO-20260623-001',
    supplierId: 'sup-006',
    supplierName: 'Ice Co',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    receivingStatus: 'NOT_RECEIVED',
    orderDate: '2026-06-23',
    expectedDate: '2026-06-24',
    items: [
      {
        id: 'pol-008',
        inventoryItemId: 'inv-012',
        inventoryItemName: 'Ice Cubes',
        supplierItemCode: 'IC-ICE-001',
        supplierItemName: 'Premium Ice Cubes',
        orderedQuantity: 200,
        unit: 'trays',
        unitPrice: 10,
        taxRate: 18,
        receivedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0
      }
    ],
    subtotal: 2000,
    tax: 360,
    deliveryCharge: 0,
    otherCharges: 0,
    discount: 0,
    total: 2360,
    paidAmount: 0,
    remainingAmount: 2360,
    paymentTerms: 'NET 7',
    supplierNote: '',
    internalNote: 'Draft - pending approval'
  }
];
};

/**
 * Purchase order status configuration
 */
export const PO_STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: '#95a5a6', bgColor: '#eaeded', icon: '📝' },
  READY_TO_SEND: { label: 'Ready to Send', color: '#f39c12', bgColor: '#fdebd0', icon: '✉️' },
  SENT: { label: 'Sent', color: '#3498db', bgColor: '#d5f5e3', icon: '📤' },
  CONFIRMED: { label: 'Confirmed', color: '#9b59b6', bgColor: '#ebdef0', icon: '✅' },
  PARTIALLY_RECEIVED: { label: 'Partially Received', color: '#e67e22', bgColor: '#fadbd8', icon: '📦' },
  RECEIVED: { label: 'Received', color: '#27ae60', bgColor: '#d5f5e3', icon: '📥' },
  OVERDUE: { label: 'Overdue', color: '#e74c3c', bgColor: '#fadbd8', icon: '⚠️' },
  CANCELLED: { label: 'Cancelled', color: '#7f8c8d', bgColor: '#eaeded', icon: '❌' },
  CLOSED: { label: 'Closed', color: '#34495e', bgColor: '#d5dbdb', icon: '🔒' }
};

/**
 * Payment status configuration
 */
export const PAYMENT_STATUS_CONFIG = {
  UNPAID: { label: 'Unpaid', color: '#e74c3c', bgColor: '#fadbd8' },
  PARTIAL: { label: 'Partial', color: '#f39c12', bgColor: '#fdebd0' },
  PAID: { label: 'Paid', color: '#27ae60', bgColor: '#d5f5e3' }
};

/**
 * Receiving status configuration
 */
export const RECEIVING_STATUS_CONFIG = {
  NOT_RECEIVED: { label: 'Not Received', color: '#95a5a6', bgColor: '#eaeded' },
  PARTIALLY_RECEIVED: { label: 'Partially Received', color: '#e67e22', bgColor: '#fadbd8' },
  FULLY_RECEIVED: { label: 'Fully Received', color: '#27ae60', bgColor: '#d5f5e3' }
};

/**
 * Variance type configuration
 */
export const VARIANCE_TYPE_CONFIG = {
  SHORT_DELIVERED: { label: 'Short Delivered', icon: '📉', priority: 'high' },
  OVER_DELIVERED: { label: 'Over Delivered', icon: '📈', priority: 'medium' },
  DAMAGED: { label: 'Damaged', icon: '💔', priority: 'high' },
  REJECTED: { label: 'Rejected', icon: '🚫', priority: 'medium' },
  WRONG_ITEM: { label: 'Wrong Item', icon: '❓', priority: 'high' },
  PRICE_MISMATCH: { label: 'Price Mismatch', icon: '💰', priority: 'medium' },
  MISSING_INVOICE: { label: 'Missing Invoice', icon: '📄', priority: 'high' },
  MISSING_DELIVERY_NOTE: { label: 'Missing Delivery Note', icon: '📋', priority: 'low' },
  EXPIRY_TOO_SOON: { label: 'Expiry Too Soon', icon: '⏰', priority: 'high' },
  UNKNOWN_ITEM: { label: 'Unknown Item', icon: '❔', priority: 'medium' }
};

/**
 * Document type configuration
 */
export const DOCUMENT_TYPE_CONFIG = {
  QUOTE: { label: 'Quote', icon: '💬' },
  PO: { label: 'Purchase Order', icon: '📋' },
  INVOICE: { label: 'Invoice', icon: '🧾' },
  DELIVERY_NOTE: { label: 'Delivery Note', icon: '📦' },
  RECEIPT: { label: 'Receipt', icon: '🧾' },
  AGREEMENT: { label: 'Agreement', icon: '📝' },
  PRICE_LIST: { label: 'Price List', icon: '📊' },
  OTHER: { label: 'Other', icon: '📎' }
};

/**
 * Supplier category configuration
 */
export const SUPPLIER_CATEGORY_CONFIG = {
  INGREDIENTS: { label: 'Ingredients', icon: '🌾', color: '#27ae60' },
  DAIRY: { label: 'Dairy', icon: '🥛', color: '#3498db' },
  BAKERY: { label: 'Bakery', icon: '🍞', color: '#e67e22' },
  BEVERAGES: { label: 'Beverages', icon: '🥤', color: '#9b59b6' },
  SUPPLIES: { label: 'Supplies', icon: '📦', color: '#95a5a6' },
  EQUIPMENT: { label: 'Equipment', icon: '⚙️', color: '#7f8c8d' },
  SERVICES: { label: 'Services', icon: '🔧', color: '#f39c12' },
  OTHER: { label: 'Other', icon: '📁', color: '#34495e' }
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
  { value: 'ADVANCE', label: 'Advance Payment' }
];

/**
 * Get normalized seed suppliers
 */
export function getSeedSuppliers() {
  try {
    return INIT_SUPPLIERS().map(supplier => createSupplier(supplier));
  } catch (error) {
    console.warn('[purchasingConstants] Demo data not available:', error.message);
    return [];
  }
}

/**
 * Get normalized seed purchase orders
 */
export function getSeedPurchaseOrders() {
  try {
    return INIT_PURCHASE_ORDERS().map(po => createPurchaseOrder(po));
  } catch (error) {
    console.warn('[purchasingConstants] Demo data not available:', error.message);
    return [];
  }
}

/**
 * Format currency for purchasing
 */
export function formatPurchasingCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for purchasing
 */
export function formatPurchasingDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format date time for purchasing
 */
export function formatPurchasingDateTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Calculate days until expected delivery
 */
export function getDaysUntilExpected(expectedDate) {
  if (!expectedDate) return null;
  const expected = new Date(expectedDate);
  const now = new Date();
  const diffTime = expected - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if delivery is expected today
 */
export function isExpectedToday(expectedDate) {
  if (!expectedDate) return false;
  const expected = new Date(expectedDate);
  const today = new Date();
  return expected.toDateString() === today.toDateString();
}

/**
 * Get supplier item price history
 */
export function getSupplierItemPriceHistory(supplierItem) {
  if (!supplierItem) return [];
  const history = [];
  if (supplierItem.previousPrice) {
    history.push({
      price: supplierItem.previousPrice,
      date: supplierItem.lastPurchasedDate,
      isCurrent: false
    });
  }
  if (supplierItem.currentPrice) {
    history.push({
      price: supplierItem.currentPrice,
      date: new Date().toISOString(),
      isCurrent: true
    });
  }
  return history;
}

/**
 * Calculate purchase order summary statistics
 */
export function calculatePOStatistics(purchaseOrders) {
  if (!Array.isArray(purchaseOrders)) {
    return {
      totalOrders: 0,
      draftOrders: 0,
      sentOrders: 0,
      confirmedOrders: 0,
      partiallyReceived: 0,
      receivedOrders: 0,
      overdueOrders: 0,
      totalValue: 0,
      unpaidAmount: 0,
      expectedToday: 0
    };
  }

  const now = new Date();
  const today = now.toDateString();

  return {
    totalOrders: purchaseOrders.length,
    draftOrders: purchaseOrders.filter(po => po.status === 'DRAFT').length,
    sentOrders: purchaseOrders.filter(po => po.status === 'SENT').length,
    confirmedOrders: purchaseOrders.filter(po => po.status === 'CONFIRMED').length,
    partiallyReceived: purchaseOrders.filter(po => po.status === 'PARTIALLY_RECEIVED').length,
    receivedOrders: purchaseOrders.filter(po => po.status === 'RECEIVED').length,
    overdueOrders: purchaseOrders.filter(po => {
      if (!po.expectedDate) return false;
      const expected = new Date(po.expectedDate);
      return expected < now && !['RECEIVED', 'CANCELLED', 'CLOSED'].includes(po.status);
    }).length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0),
    unpaidAmount: purchaseOrders.reduce((sum, po) => sum + (po.remainingAmount || 0), 0),
    expectedToday: purchaseOrders.filter(po => {
      if (!po.expectedDate) return false;
      const expected = new Date(po.expectedDate);
      return expected.toDateString() === today && !['RECEIVED', 'CANCELLED', 'CLOSED'].includes(po.status);
    }).length
  };
}

/**
 * Calculate supplier statistics
 */
export function calculateSupplierStatistics(suppliers, purchaseOrders) {
  if (!Array.isArray(suppliers)) {
    return {
      totalSuppliers: 0,
      activeSuppliers: 0,
      preferredSuppliers: 0,
      totalUnpaid: 0
    };
  }

  const supplierUnpaid = suppliers.reduce((sum, supplier) => sum + (supplier.unpaidBalance || 0), 0);

  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.active).length,
    preferredSuppliers: suppliers.filter(s => s.preferred).length,
    totalUnpaid: supplierUnpaid
  };
}

/**
 * Get reorder needs from inventory
 */
export function getReorderNeeds(inventory) {
  if (!Array.isArray(inventory)) return [];

  return inventory
    .filter(item => {
      if (!item || typeof item !== 'object') return false;
      const currentQty = item.quantity || 0;
      const minStock = item.minStock || 10;
      return currentQty <= minStock;
    })
    .map(item => ({
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      currentQuantity: item.quantity || 0,
      reorderLevel: item.minStock || 10,
      unit: item.unit || 'pcs',
      supplier: item.supplier || '',
      lastCost: item.cost || 0,
      shortage: Math.max(0, (item.minStock || 10) - (item.quantity || 0)),
      lastRestock: item.lastRestock || null
    }))
    .sort((a, b) => b.shortage - a.shortage);
}
