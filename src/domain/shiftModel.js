// Shift Domain Model for CafeOS
// Commercial-grade shift management and end-of-day closing system

/**
 * Shift status constants
 */
export const SHIFT_STATUS = {
  OPEN: 'OPEN',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED',
  VOIDED: 'VOIDED'
};

/**
 * Shift role constants
 */
export const SHIFT_ROLES = {
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  SUPERVISOR: 'SUPERVISOR'
};

/**
 * Payment types for reconciliation
 */
export const PAYMENT_TYPES = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  ONLINE: 'ONLINE',
  GIFT_CARD: 'GIFT_CARD',
  COD: 'COD',
  SPLIT: 'SPLIT'
};

/**
 * Paid out categories
 */
export const PAID_OUT_CATEGORIES = [
  'MILK',
  'VEGETABLES',
  'CLEANING_SUPPLIES',
  'COURIER',
  'MAINTENANCE',
  'PETTY_CASH',
  'STAFF_MEAL',
  'OTHER'
];

/**
 * Cash drop types
 */
export const CASH_DROP_TYPES = {
  SAFE_DROP: 'SAFE_DROP',
  BANK_DEPOSIT: 'BANK_DEPOSIT',
  TRANSFER: 'TRANSFER'
};

/**
 * Issue severity levels
 */
export const ISSUE_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

/**
 * Create a new shift
 */
export function createShift(data) {
  const shift = {
    id: data.id || `SHIFT-${Date.now()}`,
    status: SHIFT_STATUS.OPEN,
    registerId: data.registerId || 'REG-001',
    terminalId: data.terminalId || 'TERM-001',
    
    // Staff assignments
    managerId: data.managerId,
    managerName: data.managerName,
    cashierId: data.cashierId,
    cashierName: data.cashierName,
    
    // Timing
    openedAt: data.openedAt || new Date().toISOString(),
    expectedCloseAt: data.expectedCloseAt,
    closedAt: null,
    
    // Cash drawer
    openingFloat: data.openingFloat || 0,
    closingFloat: null,
    cashSales: 0,
    cashRefunds: 0,
    cashPaidOut: 0,
    cashReceived: 0,
    expectedCash: 0,
    actualCash: null,
    cashDifference: null,
    
    // Sales summary
    grossSales: 0,
    netSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    
    // Payment breakdown
    payments: {
      [PAYMENT_TYPES.CASH]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.UPI]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.CARD]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.ONLINE]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.GIFT_CARD]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.COD]: { expected: 0, actual: 0, difference: 0 },
      [PAYMENT_TYPES.SPLIT]: { expected: 0, actual: 0, difference: 0 }
    },
    
    // Financial adjustments
    refunds: 0,
    voids: 0,
    discounts: 0,
    cancelledOrders: 0,
    
    // Operational metrics
    customersServed: 0,
    kitchenTickets: 0,
    reservations: 0,
    
    // Transactions
    paidOuts: [],
    cashDrops: [],
    timeline: [],
    
    // Issues
    issues: [],
    
    // Notes
    notes: data.notes || '',
    managerNotes: '',
    
    // Validation
    canClose: true,
    closeValidation: {},
    
    // Audit
    createdBy: data.createdBy,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedBy: null,
    updatedAt: null
  };
  
  // Add timeline entry for shift opened
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: shift.openedAt,
    type: 'SHIFT_OPENED',
    description: `Shift opened by ${shift.managerName}`,
    userId: shift.managerId,
    userName: shift.managerName
  });
  
  return shift;
}

/**
 * Normalize shift data
 */
export function normalizeShift(shift) {
  if (!shift || typeof shift !== 'object') {
    throw new Error('Invalid shift: must be an object');
  }
  
  // Required fields
  if (!shift.id) {
    throw new Error('Invalid shift: missing id');
  }
  if (!shift.registerId) {
    throw new Error('Invalid shift: missing registerId');
  }
  
  // Validate status
  if (!Object.values(SHIFT_STATUS).includes(shift.status)) {
    throw new Error(`Invalid shift status: ${shift.status}`);
  }
  
  // Ensure payments object exists
  if (!shift.payments || typeof shift.payments !== 'object') {
    shift.payments = {};
    Object.values(PAYMENT_TYPES).forEach(type => {
      shift.payments[type] = { expected: 0, actual: 0, difference: 0 };
    });
  }
  
  // Ensure arrays exist
  shift.paidOuts = shift.paidOuts || [];
  shift.cashDrops = shift.cashDrops || [];
  shift.timeline = shift.timeline || [];
  shift.issues = shift.issues || [];
  
  return shift;
}

/**
 * Update shift with order data
 */
export function updateShiftWithOrder(shift, order) {
  if (!shift || !order) return shift;
  
  // Update sales
  shift.grossSales += order.total || 0;
  shift.netSales += (order.total || 0) - (order.discountAmount || 0);
  shift.orderCount += 1;
  shift.averageOrderValue = shift.netSales / shift.orderCount;
  
  // Update payment breakdown
  if (order.paymentMethod) {
    const paymentType = order.paymentMethod.toLowerCase();
    if (shift.payments[paymentType]) {
      shift.payments[paymentType].expected += order.amountPaid || order.total || 0;
    }
  }
  
  // Update cash sales
  if (order.paymentMethod === PAYMENT_TYPES.CASH) {
    shift.cashSales += order.amountPaid || order.total || 0;
  }
  
  // Update customers
  if (order.customerId) {
    shift.customersServed += 1;
  }
  
  // Add timeline entry for significant orders
  if (order.total > 1000) {
    shift.timeline.push({
      id: `TL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'LARGE_ORDER',
      description: `Large order: ₹${order.total}`,
      orderId: order.id,
      userId: order.staffId,
      userName: order.staffName
    });
  }
  
  shift.updatedAt = new Date().toISOString();
  return shift;
}

/**
 * Update shift with refund
 */
export function updateShiftWithRefund(shift, refund) {
  if (!shift || !refund) return shift;
  
  shift.refunds += refund.amount || 0;
  
  if (refund.paymentMethod === PAYMENT_TYPES.CASH) {
    shift.cashRefunds += refund.amount || 0;
  }
  
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'REFUND',
    description: `Refund: ₹${refund.amount}`,
    orderId: refund.orderId,
    userId: refund.userId,
    userName: refund.userName
  });
  
  shift.updatedAt = new Date().toISOString();
  return shift;
}

/**
 * Update shift with void
 */
export function updateShiftWithVoid(shift, voidData) {
  if (!shift || !voidData) return shift;
  
  shift.voids += voidData.amount || 0;
  
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'VOID',
    description: `Void: ₹${voidData.amount}`,
    orderId: voidData.orderId,
    userId: voidData.userId,
    userName: voidData.userName,
    reason: voidData.reason
  });
  
  shift.updatedAt = new Date().toISOString();
  return shift;
}

/**
 * Add paid out expense
 */
export function addPaidOut(shift, paidOut) {
  if (!shift || !paidOut) return shift;
  
  const paidOutRecord = {
    id: paidOut.id || `PO-${Date.now()}`,
    category: paidOut.category,
    amount: paidOut.amount,
    reason: paidOut.reason,
    approvedBy: paidOut.approvedBy,
    approvedByName: paidOut.approvedByName,
    createdAt: paidOut.createdAt || new Date().toISOString(),
    createdBy: paidOut.createdBy
  };
  
  shift.cashPaidOut += paidOut.amount;
  shift.paidOuts.push(paidOutRecord);
  
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: paidOutRecord.createdAt,
    type: 'PAID_OUT',
    description: `Paid out: ₹${paidOut.amount} - ${paidOut.category}`,
    paidOutId: paidOutRecord.id,
    userId: paidOut.createdBy,
    userName: paidOut.createdByName
  });
  
  shift.updatedAt = new Date().toISOString();
  return shift;
}

/**
 * Add cash drop
 */
export function addCashDrop(shift, cashDrop) {
  if (!shift || !cashDrop) return shift;
  
  const cashDropRecord = {
    id: cashDrop.id || `CD-${Date.now()}`,
    type: cashDrop.type,
    amount: cashDrop.amount,
    reason: cashDrop.reason,
    approvedBy: cashDrop.approvedBy,
    approvedByName: cashDrop.approvedByName,
    createdAt: cashDrop.createdAt || new Date().toISOString(),
    createdBy: cashDrop.createdBy
  };
  
  shift.cashDrops.push(cashDropRecord);
  
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: cashDropRecord.createdAt,
    type: 'CASH_DROP',
    description: `Cash drop: ₹${cashDrop.amount} - ${cashDrop.type}`,
    cashDropId: cashDropRecord.id,
    userId: cashDrop.createdBy,
    userName: cashDrop.createdByName
  });
  
  shift.updatedAt = new Date().toISOString();
  return shift;
}

/**
 * Calculate expected cash
 */
export function calculateExpectedCash(shift) {
  if (!shift) return 0;
  
  const expected = shift.openingFloat + shift.cashSales - shift.cashRefunds - shift.cashPaidOut;
  shift.expectedCash = expected;
  return expected;
}

/**
 * Calculate cash difference
 */
export function calculateCashDifference(shift) {
  if (!shift || shift.actualCash === null) return null;
  
  const difference = shift.actualCash - shift.expectedCash;
  shift.cashDifference = difference;
  return difference;
}

/**
 * Validate shift for closing
 */
export function validateShiftForClosing(shift, context) {
  if (!shift) return { canClose: false, issues: ['Shift not found'] };
  
  const issues = [];
  const warnings = [];
  
  // Check for open orders
  if (context.openOrders && context.openOrders.length > 0) {
    issues.push({
      type: 'OPEN_ORDERS',
      severity: ISSUE_SEVERITY.CRITICAL,
      message: `${context.openOrders.length} open orders`,
      count: context.openOrders.length
    });
  }
  
  // Check for open tables
  if (context.openTables && context.openTables.length > 0) {
    issues.push({
      type: 'OPEN_TABLES',
      severity: ISSUE_SEVERITY.HIGH,
      message: `${context.openTables.length} open tables`,
      count: context.openTables.length
    });
  }
  
  // Check for unfinished kitchen tickets
  if (context.unfinishedTickets && context.unfinishedTickets.length > 0) {
    issues.push({
      type: 'UNFINISHED_TICKETS',
      severity: ISSUE_SEVERITY.HIGH,
      message: `${context.unfinishedTickets.length} unfinished kitchen tickets`,
      count: context.unfinishedTickets.length
    });
  }
  
  // Check for pending refunds
  if (context.pendingRefunds && context.pendingRefunds.length > 0) {
    issues.push({
      type: 'PENDING_REFUNDS',
      severity: ISSUE_SEVERITY.HIGH,
      message: `${context.pendingRefunds.length} pending refunds`,
      count: context.pendingRefunds.length
    });
  }
  
  // Check for unreconciled cash
  if (shift.actualCash === null) {
    issues.push({
      type: 'CASH_NOT_COUNTED',
      severity: ISSUE_SEVERITY.CRITICAL,
      message: 'Cash has not been counted'
    });
  } else if (Math.abs(shift.cashDifference) > 10) {
    issues.push({
      type: 'CASH_MISMATCH',
      severity: ISSUE_SEVERITY.HIGH,
      message: `Cash difference: ₹${shift.cashDifference}`,
      amount: shift.cashDifference
    });
  } else if (Math.abs(shift.cashDifference) > 0) {
    warnings.push({
      type: 'CASH_MISMATCH',
      severity: ISSUE_SEVERITY.MEDIUM,
      message: `Cash difference: ₹${shift.cashDifference}`,
      amount: shift.cashDifference
    });
  }
  
  // Check for payment reconciliation
  Object.entries(shift.payments).forEach(([type, data]) => {
    if (Math.abs(data.difference) > 1) {
      warnings.push({
        type: 'PAYMENT_MISMATCH',
        severity: ISSUE_SEVERITY.MEDIUM,
        message: `${type} difference: ₹${data.difference}`,
        paymentType: type,
        amount: data.difference
      });
    }
  });
  
  shift.issues = [...issues, ...warnings];
  shift.canClose = issues.length === 0;
  shift.closeValidation = { issues, warnings };
  
  return { canClose: shift.canClose, issues, warnings };
}

/**
 * Close shift
 */
export function closeShift(shift, closeData) {
  if (!shift) return shift;
  
  shift.status = SHIFT_STATUS.CLOSED;
  shift.closedAt = closeData.closedAt || new Date().toISOString();
  shift.closingFloat = closeData.closingFloat;
  shift.actualCash = closeData.actualCash;
  shift.managerNotes = closeData.managerNotes || '';
  shift.updatedBy = closeData.closedBy;
  shift.updatedAt = shift.closedAt;
  
  // Calculate final cash difference
  calculateExpectedCash(shift);
  calculateCashDifference(shift);
  
  // Add timeline entry
  shift.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: shift.closedAt,
    type: 'SHIFT_CLOSED',
    description: `Shift closed by ${closeData.closedByName}`,
    userId: closeData.closedBy,
    userName: closeData.closedByName
  });
  
  return shift;
}

/**
 * Get shift duration in minutes
 */
export function getShiftDuration(shift) {
  if (!shift || !shift.openedAt) return 0;
  
  const opened = new Date(shift.openedAt);
  const closed = shift.closedAt ? new Date(shift.closedAt) : new Date();
  return Math.floor((closed - opened) / 60000); // Convert to minutes
}

/**
 * Format shift duration
 */
export function formatShiftDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get shift health score
 */
export function getShiftHealthScore(shift) {
  if (!shift) return 0;
  
  let score = 100;
  
  // Deduct for cash mismatch
  if (shift.cashDifference !== null) {
    score -= Math.min(Math.abs(shift.cashDifference) / 10, 100);
  }
  
  // Deduct for voids
  score -= shift.voids / 10;
  
  // Deduct for refunds
  score -= shift.refunds / 20;
  
  // Deduct for issues
  score -= shift.issues.filter(i => i.severity === ISSUE_SEVERITY.CRITICAL).length * 20;
  score -= shift.issues.filter(i => i.severity === ISSUE_SEVERITY.HIGH).length * 10;
  score -= shift.issues.filter(i => i.severity === ISSUE_SEVERITY.MEDIUM).length * 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get active shift for register
 */
export function getActiveShift(shifts, registerId) {
  if (!shifts || !registerId) return null;
  return shifts.find(s => 
    s.registerId === registerId && 
    (s.status === SHIFT_STATUS.OPEN || s.status === SHIFT_STATUS.CLOSING)
  );
}

/**
 * Check if register has active shift
 */
export function hasActiveShift(shifts, registerId) {
  return getActiveShift(shifts, registerId) !== null;
}

export default {
  SHIFT_STATUS,
  SHIFT_ROLES,
  PAYMENT_TYPES,
  PAID_OUT_CATEGORIES,
  CASH_DROP_TYPES,
  ISSUE_SEVERITY,
  createShift,
  normalizeShift,
  updateShiftWithOrder,
  updateShiftWithRefund,
  updateShiftWithVoid,
  addPaidOut,
  addCashDrop,
  calculateExpectedCash,
  calculateCashDifference,
  validateShiftForClosing,
  closeShift,
  getShiftDuration,
  formatShiftDuration,
  getShiftHealthScore,
  getActiveShift,
  hasActiveShift
};
