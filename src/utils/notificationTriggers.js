// Notification Triggers for Operational Modules
import { createNotification, NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITY } from '../domain/notificationModel.js';

const genId = () => "NOTIF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

// Order notification triggers
export const triggerOrderNotification = (order, type, metadata = {}) => {
  const typeMap = {
    NEW_ORDER: {
      title: `New order #${order.id}`,
      summary: `${order.source} order from ${order.customerName || 'Guest'}`,
      priority: order.source === 'SWIGGY' || order.source === 'ZOMATO' ? 'IMPORTANT' : 'NORMAL'
    },
    ORDER_DELAYED: {
      title: `Order #${order.id} waiting too long`,
      summary: `Order has been in ${order.status} for ${metadata.waitTime} minutes`,
      priority: 'URGENT'
    },
    ORDER_CANCELLED: {
      title: `Order #${order.id} cancelled`,
      summary: `Order cancelled: ${metadata.reason || 'No reason provided'}`,
      priority: 'NORMAL'
    },
    PAYMENT_FAILED: {
      title: `Payment failed for order #${order.id}`,
      summary: `Payment of ${metadata.amount} could not be processed`,
      priority: 'URGENT'
    },
    REFUND_REQUESTED: {
      title: `Refund requested for order #${order.id}`,
      summary: `Customer requested refund of ${metadata.amount}`,
      priority: 'IMPORTANT'
    },
    ITEM_UNAVAILABLE: {
      title: `Item unavailable for order #${order.id}`,
      summary: `${metadata.itemName} is out of stock`,
      priority: 'IMPORTANT'
    },
    ORDER_READY: {
      title: `Order #${order.id} ready`,
      summary: `Order ready for pickup/delivery`,
      priority: 'NORMAL'
    },
    ORDER_NOT_COLLECTED: {
      title: `Order #${order.id} not collected`,
      summary: `Order has been ready for ${metadata.waitTime} minutes`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.ORDERS,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'orders',
    sourceRecordId: order.id,
    sourceRecordType: 'order',
    metadata: {
      orderId: order.id,
      customerName: order.customerName,
      source: order.source,
      amount: order.total,
      ...metadata
    }
  });
};

// Kitchen notification triggers
export const triggerKitchenNotification = (kdsCard, type, metadata = {}) => {
  const typeMap = {
    NEW_TICKET: {
      title: `New ticket at ${kdsCard.station}`,
      summary: `Order #${kdsCard.orderId} - ${kdsCard.items.map(i => i.name).join(', ')}`,
      priority: 'NORMAL'
    },
    TICKET_UNACCEPTED: {
      title: `Unaccepted ticket at ${kdsCard.station}`,
      summary: `Order #${kdsCard.orderId} has not been accepted for ${metadata.waitTime} minutes`,
      priority: 'IMPORTANT'
    },
    PREPARATION_DELAY: {
      title: `Preparation delayed for order #${kdsCard.orderId}`,
      summary: `Ticket has been in preparation for ${metadata.waitTime} minutes`,
      priority: 'URGENT'
    },
    ITEM_UNAVAILABLE: {
      title: `Item unavailable for order #${kdsCard.orderId}`,
      summary: `${metadata.itemName} is out of stock`,
      priority: 'URGENT'
    },
    RECALL_REQUESTED: {
      title: `Recall requested for order #${kdsCard.orderId}`,
      summary: `Customer requested order to be remade`,
      priority: 'URGENT'
    },
    ALLERGY_WARNING: {
      title: `Allergy alert on order #${kdsCard.orderId}`,
      summary: `Customer has ${metadata.allergy} allergy - take extra precautions`,
      priority: 'URGENT'
    },
    TICKET_READY_NOT_SERVED: {
      title: `Ticket ready not served at ${kdsCard.station}`,
      summary: `Order #${kdsCard.orderId} ready for ${metadata.waitTime} minutes`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.KITCHEN,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'kitchen',
    sourceRecordId: kdsCard.id,
    sourceRecordType: 'kds_ticket',
    metadata: {
      kdsId: kdsCard.id,
      orderId: kdsCard.orderId,
      station: kdsCard.station,
      ...metadata
    }
  });
};

// Table notification triggers
export const triggerTableNotification = (table, type, metadata = {}) => {
  const typeMap = {
    WAITER_CALL: {
      title: `Waiter call from ${table.name}`,
      summary: `Customer requested ${metadata.callType || 'assistance'}`,
      priority: 'URGENT'
    },
    BILL_REQUESTED: {
      title: `Bill requested at ${table.name}`,
      summary: `Customer ready to pay`,
      priority: 'NORMAL'
    },
    TABLE_NEEDS_CLEARING: {
      title: `Table ${table.name} needs clearing`,
      summary: `Table is empty but not cleared`,
      priority: 'NORMAL'
    },
    GUEST_SESSION_WAITING: {
      title: `Guest waiting at ${table.name}`,
      summary: `Guest has been seated but not attended`,
      priority: 'IMPORTANT'
    },
    ORDER_ASSISTANCE: {
      title: `Order assistance requested at ${table.name}`,
      summary: `Customer needs help with ordering`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.TABLES,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'tables',
    sourceRecordId: table.id,
    sourceRecordType: 'table',
    metadata: {
      tableId: table.id,
      tableName: table.name,
      ...metadata
    }
  });
};

// Stock notification triggers
export const triggerStockNotification = (item, type, metadata = {}) => {
  const typeMap = {
    LOW_STOCK: {
      title: `${item.name} below reorder level`,
      summary: `Current: ${metadata.currentQuantity} ${metadata.unit}, Reorder at: ${metadata.reorderLevel} ${metadata.unit}`,
      priority: 'IMPORTANT'
    },
    OUT_OF_STOCK: {
      title: `${item.name} out of stock`,
      summary: `No ${item.name} available - 86'd`,
      priority: 'URGENT'
    },
    BELOW_REORDER_LEVEL: {
      title: `${item.name} below reorder level`,
      summary: `Current stock is below reorder threshold`,
      priority: 'IMPORTANT'
    },
    EXPIRY_APPROACHING: {
      title: `${item.name} expiring soon`,
      summary: `Expires on ${metadata.expiryDate}`,
      priority: 'IMPORTANT'
    },
    EXPIRED: {
      title: `${item.name} expired`,
      summary: `Expired on ${metadata.expiryDate}`,
      priority: 'URGENT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.STOCK,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'inventory',
    sourceRecordId: item.id,
    sourceRecordType: 'inventory_item',
    metadata: {
      itemId: item.id,
      itemName: item.name,
      ...metadata
    }
  });
};

// Purchasing notification triggers
export const triggerPurchasingNotification = (record, type, metadata = {}) => {
  const typeMap = {
    PO_OVERDUE: {
      title: `Purchase order ${record.poNumber} overdue`,
      summary: `Expected delivery was ${metadata.expectedDate}`,
      priority: 'URGENT'
    },
    SUPPLIER_DELIVERY_EXPECTED: {
      title: `Supplier delivery expected`,
      summary: `${metadata.supplierName} delivery expected today`,
      priority: 'NORMAL'
    },
    PARTIALLY_RECEIVED: {
      title: `PO ${record.poNumber} partially received`,
      summary: `Only ${metadata.receivedQuantity} of ${metadata.totalQuantity} received`,
      priority: 'IMPORTANT'
    },
    DAMAGED_GOODS: {
      title: `Damaged goods received`,
      summary: `${metadata.itemName} received damaged`,
      priority: 'IMPORTANT'
    },
    INVOICE_MISMATCH: {
      title: `Invoice mismatch for ${record.poNumber}`,
      summary: `Invoice amount does not match PO`,
      priority: 'IMPORTANT'
    },
    SUPPLIER_BILL_DUE: {
      title: `Supplier bill overdue`,
      summary: `Invoice ${record.invoiceNumber} from ${metadata.supplierName} is overdue`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.PURCHASING,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'purchasing',
    sourceRecordId: record.id,
    sourceRecordType: record.type || 'purchase_order',
    metadata: {
      ...metadata
    }
  });
};

// Production notification triggers
export const triggerProductionNotification = (batch, type, metadata = {}) => {
  const typeMap = {
    BATCH_AWAITING_QC: {
      title: `Batch ${batch.id} awaiting QC`,
      summary: `${batch.productName} ready for quality control`,
      priority: 'NORMAL'
    },
    QC_FAILED: {
      title: `Batch ${batch.id} failed QC`,
      summary: `Quality control rejected - ${metadata.reason}`,
      priority: 'URGENT'
    },
    OUTPUT_BELOW_PLAN: {
      title: `Batch ${batch.id} output below plan`,
      summary: `Produced ${metadata.actualOutput} vs planned ${metadata.plannedOutput}`,
      priority: 'IMPORTANT'
    },
    WASTAGE_HIGH: {
      title: `High wastage in ${batch.productName}`,
      summary: `Wastage: ${metadata.wastagePercentage}%`,
      priority: 'IMPORTANT'
    },
    BATCH_EXPIRING_SOON: {
      title: `Batch ${batch.id} expiring soon`,
      summary: `Expires on ${metadata.expiryDate}`,
      priority: 'IMPORTANT'
    },
    TRACEABILITY_INCOMPLETE: {
      title: `Traceability incomplete for batch ${batch.id}`,
      summary: `Missing ingredient tracking data`,
      priority: 'IMPORTANT'
    },
    OVERALLOCATED: {
      title: `Overallocated for ${batch.productName}`,
      summary: `Batch quantity exceeds demand`,
      priority: 'NORMAL'
    },
    REPLACEMENT_RECORDED: {
      title: `Replacement recorded for batch ${batch.id}`,
      summary: `${metadata.itemName} replaced`,
      priority: 'NORMAL'
    },
    BATCH_MISSING_OPERATOR: {
      title: `Batch ${batch.id} missing operator`,
      summary: `No operator assigned to this batch`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.PRODUCTION,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'production',
    sourceRecordId: batch.id,
    sourceRecordType: 'production_batch',
    metadata: {
      batchId: batch.id,
      productName: batch.productName,
      ...metadata
    }
  });
};

// Staff notification triggers
export const triggerStaffNotification = (staffMember, type, metadata = {}) => {
  const typeMap = {
    SHIFT_STARTING_SOON: {
      title: `Shift starting soon`,
      summary: `${staffMember.name}'s shift starts in ${metadata.minutesUntil} minutes`,
      priority: 'NORMAL'
    },
    STAFF_LATE: {
      title: `Staff member late for shift`,
      summary: `${staffMember.name} is ${metadata.minutesLate} minutes late`,
      priority: 'NORMAL'
    },
    MISSED_CLOCK_IN: {
      title: `Missed clock-in`,
      summary: `${staffMember.name} did not clock in`,
      priority: 'IMPORTANT'
    },
    MISSED_CLOCK_OUT: {
      title: `Missed clock-out`,
      summary: `${staffMember.name} did not clock out`,
      priority: 'IMPORTANT'
    },
    OVERTIME_THRESHOLD: {
      title: `Overtime threshold reached`,
      summary: `${staffMember.name} has worked ${metadata.overtimeHours} overtime hours`,
      priority: 'IMPORTANT'
    },
    BREAK_OVERDUE: {
      title: `Break overdue`,
      summary: `${staffMember.name} break overdue by ${metadata.minutesOverdue} minutes`,
      priority: 'NORMAL'
    },
    SHIFT_CONFLICT: {
      title: `Shift conflict detected`,
      summary: `${staffMember.name} has overlapping shifts`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.STAFF,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'staff',
    sourceRecordId: staffMember.id,
    sourceRecordType: 'staff_shift',
    metadata: {
      staffId: staffMember.id,
      staffName: staffMember.name,
      ...metadata
    }
  });
};

// System notification triggers
export const triggerSystemNotification = (type, metadata = {}) => {
  const typeMap = {
    EXPORT_FAILED: {
      title: 'Export failed',
      summary: `Could not export ${metadata.exportType}`,
      priority: 'IMPORTANT'
    },
    PRINTER_UNAVAILABLE: {
      title: 'Printer unavailable',
      summary: `Printer ${metadata.printerId} is not responding`,
      priority: 'IMPORTANT'
    },
    STORAGE_QUOTA_WARNING: {
      title: 'Storage quota warning',
      summary: `Storage usage at ${metadata.percentage}%`,
      priority: 'IMPORTANT'
    },
    REALTIME_DISCONNECTED: {
      title: 'Realtime connection lost',
      summary: 'Attempting to reconnect to server',
      priority: 'IMPORTANT'
    },
    INTEGRATION_UNAVAILABLE: {
      title: 'Integration unavailable',
      summary: `${metadata.integrationName} service is down`,
      priority: 'IMPORTANT'
    }
  };

  const config = typeMap[type];
  if (!config) return null;

  return createNotification({
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    type: type,
    title: config.title,
    summary: config.summary,
    priority: NOTIFICATION_PRIORITY[config.priority],
    sourceModule: 'system',
    sourceRecordId: genId(),
    sourceRecordType: 'system_event',
    metadata
  });
};
