// Notification Constants and Seed Data
import { createNotification } from '../domain/notificationModel.js';

// Category Configuration
export const NOTIFICATION_CATEGORY_CONFIG = {
  ORDERS: {
    label: 'Orders',
    icon: '📋',
    color: '#5B9BD5',
    bgColor: '#0d1528',
    description: 'Order-related alerts and updates'
  },
  KITCHEN: {
    label: 'Kitchen',
    icon: '👨‍🍳',
    color: '#E8A020',
    bgColor: '#281f00',
    description: 'Kitchen ticket and preparation alerts'
  },
  TABLES: {
    label: 'Tables',
    icon: '🪑',
    color: '#4CAF72',
    bgColor: '#0d2218',
    description: 'Table service and waiter requests'
  },
  RESERVATIONS: {
    label: 'Reservations',
    icon: '📅',
    color: '#9B72CF',
    bgColor: '#1a0d28',
    description: 'Reservation and waitlist alerts'
  },
  DELIVERY: {
    label: 'Delivery',
    icon: '🚚',
    color: '#3DD5C8',
    bgColor: '#001a1a',
    description: 'Delivery and route tracking alerts'
  },
  QR_ORDERING: {
    label: 'QR Ordering',
    icon: '📱',
    color: '#3498db',
    bgColor: '#0d1528',
    description: 'Guest QR order alerts'
  },
  STOCK: {
    label: 'Stock',
    icon: '📦',
    color: '#e74c3c',
    bgColor: '#280d0d',
    description: 'Inventory and stock alerts'
  },
  PURCHASING: {
    label: 'Purchasing',
    icon: '🛒',
    color: '#f39c12',
    bgColor: '#281408',
    description: 'Purchase order and supplier alerts'
  },
  PRODUCTION: {
    label: 'Production',
    icon: '🏭',
    color: '#8b6914',
    bgColor: '#1a1508',
    description: 'Production batch and QC alerts'
  },
  EXPENSES: {
    label: 'Expenses',
    icon: '💰',
    color: '#e67e22',
    bgColor: '#281208',
    description: 'Expense and cost alerts'
  },
  PAYMENTS: {
    label: 'Payments',
    icon: '💳',
    color: '#27ae60',
    bgColor: '#0d2218',
    description: 'Payment and invoice alerts'
  },
  DOCUMENTS: {
    label: 'Documents',
    icon: '📄',
    color: '#7f8c8d',
    bgColor: '#1a1a1a',
    description: 'Receipt and document alerts'
  },
  STAFF: {
    label: 'Staff',
    icon: '👥',
    color: '#16a085',
    bgColor: '#0d1a1a',
    description: 'Staff and shift alerts'
  },
  SECURITY: {
    label: 'Security',
    icon: '🔒',
    color: '#c0392b',
    bgColor: '#280808',
    description: 'Security and access alerts'
  },
  SYSTEM: {
    label: 'System',
    icon: '⚙️',
    color: '#95a5a6',
    bgColor: '#1a1a1a',
    description: 'System and integration alerts'
  }
};

// Priority Configuration
export const NOTIFICATION_PRIORITY_CONFIG = {
  URGENT: {
    label: 'Urgent',
    color: '#e74c3c',
    bgColor: '#fadbd8',
    borderColor: '#e74c3c',
    description: 'Requires immediate attention'
  },
  IMPORTANT: {
    label: 'Important',
    color: '#f39c12',
    bgColor: '#fef5e7',
    borderColor: '#f39c12',
    description: 'Important but not critical'
  },
  NORMAL: {
    label: 'Normal',
    color: '#3498db',
    bgColor: '#d6eaf8',
    borderColor: '#3498db',
    description: 'Standard priority'
  },
  INFORMATIONAL: {
    label: 'Informational',
    color: '#7f8c8d',
    bgColor: '#eaeded',
    borderColor: '#bdc3c7',
    description: 'For information only'
  }
};

// Status Configuration
export const NOTIFICATION_STATUS_CONFIG = {
  NEW: {
    label: 'New',
    color: '#e74c3c',
    bgColor: '#fadbd8',
    description: 'Not yet viewed'
  },
  READ: {
    label: 'Read',
    color: '#3498db',
    bgColor: '#d6eaf8',
    description: 'Viewed but not acted on'
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: '#f39c12',
    bgColor: '#fef5e7',
    description: 'Someone has taken ownership'
  },
  RESOLVED: {
    label: 'Resolved',
    color: '#27ae60',
    bgColor: '#d5f5e3',
    description: 'Issue is resolved'
  },
  DISMISSED: {
    label: 'Dismissed',
    color: '#95a5a6',
    bgColor: '#eaeded',
    description: 'Removed from active view'
  }
};

// Seed Notifications
export const getSeedNotifications = () => [
  // Order Notifications
  createNotification({
    category: 'ORDERS',
    type: 'ORDER_DELAYED',
    title: 'Order #184 waiting too long',
    summary: 'Order has been waiting for kitchen acceptance for 7 minutes',
    priority: 'URGENT',
    sourceModule: 'orders',
    sourceRecordId: 'ORD-184',
    sourceRecordType: 'order',
    metadata: {
      orderId: 'ORD-184',
      customerName: 'Rohan Mehta',
      waitTime: 7,
      threshold: 5
    }
  }),
  createNotification({
    category: 'ORDERS',
    type: 'NEW_ORDER',
    title: 'New guest order awaiting approval',
    summary: 'QR order from Table 3 requires approval',
    priority: 'IMPORTANT',
    sourceModule: 'qr',
    sourceRecordId: 'ORD-185',
    sourceRecordType: 'order',
    metadata: {
      orderId: 'ORD-185',
      tableId: 'TABLE-003',
      customerName: 'Guest',
      amount: 340
    }
  }),
  
  // Kitchen Notifications
  createNotification({
    category: 'KITCHEN',
    type: 'ALLERGY_WARNING',
    title: 'Allergy alert on Order #183',
    summary: 'Customer has nut allergy - take extra precautions',
    priority: 'URGENT',
    sourceModule: 'kitchen',
    sourceRecordId: 'KDS-183',
    sourceRecordType: 'kds_ticket',
    metadata: {
      kdsId: 'KDS-183',
      orderId: 'ORD-183',
      allergy: 'nuts',
      items: ['Matcha Latte', 'Avocado Toast']
    }
  }),
  createNotification({
    category: 'KITCHEN',
    type: 'TICKET_UNACCEPTED',
    title: 'Unaccepted ticket at Bar station',
    summary: 'Order #186 has not been accepted for 3 minutes',
    priority: 'IMPORTANT',
    sourceModule: 'kitchen',
    sourceRecordId: 'KDS-186',
    sourceRecordType: 'kds_ticket',
    metadata: {
      kdsId: 'KDS-186',
      station: 'Bar',
      waitTime: 3
    }
  }),
  
  // Table Notifications
  createNotification({
    category: 'TABLES',
    type: 'WAITER_CALL',
    title: 'Waiter call from Table 6',
    summary: 'Customer requested assistance',
    priority: 'URGENT',
    sourceModule: 'tables',
    sourceRecordId: 'TABLE-006',
    sourceRecordType: 'table',
    metadata: {
      tableId: 'TABLE-006',
      callType: 'ASSISTANCE',
      time: Date.now() - 2 * 60 * 1000
    }
  }),
  createNotification({
    category: 'TABLES',
    type: 'BILL_REQUESTED',
    title: 'Bill requested at Table 4',
    summary: 'Customer ready to pay',
    priority: 'NORMAL',
    sourceModule: 'tables',
    sourceRecordId: 'TABLE-004',
    sourceRecordType: 'table',
    metadata: {
      tableId: 'TABLE-004',
      orderId: 'ORD-182'
    }
  }),
  
  // Stock Notifications
  createNotification({
    category: 'STOCK',
    type: 'LOW_STOCK',
    title: 'Oat milk below reorder level',
    summary: 'Current: 2L, Reorder at: 5L',
    priority: 'IMPORTANT',
    sourceModule: 'inventory',
    sourceRecordId: 'INV-045',
    sourceRecordType: 'inventory_item',
    metadata: {
      itemId: 'INV-045',
      itemName: 'Oat Milk',
      currentQuantity: 2,
      unit: 'L',
      reorderLevel: 5
    }
  }),
  createNotification({
    category: 'STOCK',
    type: 'OUT_OF_STOCK',
    title: 'Croissants out of stock',
    summary: 'No croissants available - 86\'d',
    priority: 'URGENT',
    sourceModule: 'inventory',
    sourceRecordId: 'INV-012',
    sourceRecordType: 'inventory_item',
    metadata: {
      itemId: 'INV-012',
      itemName: 'Croissant',
      currentQuantity: 0,
      unit: 'pcs'
    }
  }),
  
  // Purchasing Notifications
  createNotification({
    category: 'PURCHASING',
    type: 'PO_OVERDUE',
    title: 'Purchase order PO-20260724-004 overdue',
    summary: 'Expected delivery was yesterday',
    priority: 'URGENT',
    sourceModule: 'purchasing',
    sourceRecordId: 'PO-20260724-004',
    sourceRecordType: 'purchase_order',
    metadata: {
      poNumber: 'PO-20260724-004',
      supplierName: 'Fresh Dairy Co.',
      expectedDate: Date.now() - 24 * 60 * 60 * 1000,
      items: ['Oat Milk', 'Almond Milk']
    }
  }),
  
  // Production Notifications
  createNotification({
    category: 'PRODUCTION',
    type: 'QC_FAILED',
    title: 'Batch BATCH-20260724-003 failed QC',
    summary: 'Quality control rejected - output below standards',
    priority: 'URGENT',
    sourceModule: 'production',
    sourceRecordId: 'BATCH-20260724-003',
    sourceRecordType: 'production_batch',
    metadata: {
      batchId: 'BATCH-20260724-003',
      productName: 'Cold Brew Concentrate',
      qcGrade: 'FAILED',
      reason: 'Inconsistent flavor profile'
    }
  }),
  
  // Delivery Notifications
  createNotification({
    category: 'DELIVERY',
    type: 'GPS_STALE',
    title: 'Driver location not updating',
    summary: 'Driver location has not updated for 18 minutes',
    priority: 'IMPORTANT',
    sourceModule: 'delivery',
    sourceRecordId: 'DRV-007',
    sourceRecordType: 'driver',
    metadata: {
      driverId: 'DRV-007',
      driverName: 'Amit Kumar',
      lastUpdate: Date.now() - 18 * 60 * 1000,
      activeDeliveries: 3
    }
  }),
  
  // Payment Notifications
  createNotification({
    category: 'PAYMENTS',
    type: 'SUPPLIER_INVOICE_UNPAID',
    title: 'Supplier invoice overdue',
    summary: 'Invoice INV-20260715-002 from Coffee Beans Ltd is 9 days overdue',
    priority: 'IMPORTANT',
    sourceModule: 'purchasing',
    sourceRecordId: 'INV-20260715-002',
    sourceRecordType: 'invoice',
    metadata: {
      invoiceNumber: 'INV-20260715-002',
      supplierName: 'Coffee Beans Ltd',
      amount: 12500,
      dueDate: Date.now() - 9 * 24 * 60 * 60 * 1000
    }
  }),
  
  // Staff Notifications
  createNotification({
    category: 'STAFF',
    type: 'STAFF_LATE',
    title: 'Staff member late for shift',
    summary: 'Priya Sharma is 15 minutes late for morning shift',
    priority: 'NORMAL',
    sourceModule: 'staff',
    sourceRecordId: 'STAFF-003',
    sourceRecordType: 'staff_shift',
    metadata: {
      staffId: 'STAFF-003',
      staffName: 'Priya Sharma',
      shiftStart: Date.now() - 15 * 60 * 1000,
      scheduledStart: Date.now()
   }
  }),
  
  // System Notifications
  createNotification({
    category: 'SYSTEM',
    type: 'REALTIME_DISCONNECTED',
    title: 'Realtime connection lost',
    summary: 'Attempting to reconnect to server',
    priority: 'IMPORTANT',
    sourceModule: 'system',
    sourceRecordId: 'SYSTEM-001',
    sourceRecordType: 'system_event',
    metadata: {
      disconnectedAt: Date.now() - 30 * 1000,
      reconnectAttempts: 3
    }
  })
];

// Notification Settings Defaults
export const DEFAULT_NOTIFICATION_SETTINGS = {
  categories: {
    ORDERS: { enabled: true, sound: true, push: false },
    KITCHEN: { enabled: true, sound: true, push: false },
    TABLES: { enabled: true, sound: true, push: false },
    RESERVATIONS: { enabled: true, sound: false, push: false },
    DELIVERY: { enabled: true, sound: true, push: false },
    QR_ORDERING: { enabled: true, sound: true, push: false },
    STOCK: { enabled: true, sound: false, push: false },
    PURCHASING: { enabled: true, sound: false, push: false },
    PRODUCTION: { enabled: true, sound: false, push: false },
    EXPENSES: { enabled: true, sound: false, push: false },
    PAYMENTS: { enabled: true, sound: false, push: false },
    DOCUMENTS: { enabled: false, sound: false, push: false },
    STAFF: { enabled: true, sound: false, push: false },
    SECURITY: { enabled: true, sound: true, push: false },
    SYSTEM: { enabled: true, sound: false, push: false }
  },
  sound: {
    enabled: true,
    urgentOnly: false,
    volume: 0.7
  },
  browser: {
    enabled: false,
    permission: 'default'
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    suppressSound: true,
    suppressBrowser: true
  },
  display: {
    assignedToMeOnly: false,
    showInformational: true,
    autoMarkRead: true
  }
};

// Alert Thresholds
export const ALERT_THRESHOLDS = {
  kitchen: {
    unacceptedWarning: 3, // minutes
    preparationDelay: 10, // minutes
    stationOverload: 5 // tickets
  },
  orders: {
    delayedWarning: 5, // minutes
    unattendedGuestOrder: 3, // minutes
    readyNotCollected: 15 // minutes
  },
  delivery: {
    staleGpsThreshold: 15, // minutes
    delayedDelivery: 20, // minutes
  },
  stock: {
    lowStockThreshold: 0.2, // 20% of reorder level
    expiryWarningDays: 7
  },
  reservations: {
    arrivalWarning: 15, // minutes
    lateThreshold: 10 // minutes
  },
  waiter: {
    escalationTime: 5 // minutes
  }
};

// Format notification timestamp
export const formatNotificationTimestamp = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Get category config safely
export const getCategoryConfig = (category) => {
  return NOTIFICATION_CATEGORY_CONFIG[category] || NOTIFICATION_CATEGORY_CONFIG.SYSTEM;
};

// Get priority config safely
export const getPriorityConfig = (priority) => {
  return NOTIFICATION_PRIORITY_CONFIG[priority] || NOTIFICATION_PRIORITY_CONFIG.NORMAL;
};

// Get status config safely
export const getStatusConfig = (status) => {
  return NOTIFICATION_STATUS_CONFIG[status] || NOTIFICATION_STATUS_CONFIG.NEW;
};
