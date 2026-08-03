// ── Shift Management System for CafeOS
// Handles opening, active operations, and closing of business shifts

const SHIFTS_KEY = 'cafeos_shifts';
const ACTIVE_SHIFT_KEY = 'cafeos_active_shift';
const SHIFT_EVENTS_KEY = 'cafeos_shift_events';

// ── Manager PIN Storage ───────────────────────────────────────────────────
const MANAGER_PINS_KEY = 'cafeos_manager_pins';

function getManagerPins() {
  try {
    const stored = localStorage.getItem(MANAGER_PINS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function _validateManagerPin(pin) {
  const pins = getManagerPins();
  return Object.values(pins).includes(pin);
}

// ── Permission Override Mock ─────────────────────────────────────────────
// In production, this would integrate with the full permissions system
async function requestPermissionOverride(_module, _action, _context) {
  // For now, return a mock approval
  // In production, this would trigger the PermissionOverride dialog
  return {
    approved: true,
    approvedBy: 'manager_mock',
    reason: null
  };
}

// ── Notification Types ───────────────────────────────────────────────────
export const SHIFT_NOTIFICATIONS = {
  SHIFT_OPENED: 'shift_opened',
  SHIFT_CLOSING_SOON: 'shift_closing_soon',
  LARGE_VARIANCE: 'large_variance',
  FAILED_CLOSE: 'failed_close',
  MANAGER_APPROVAL_NEEDED: 'manager_approval_needed',
  SHIFT_CLOSED: 'shift_closed'
};

// ── Notification Functions ─────────────────────────────────────────────
export function sendShiftNotification(type, data) {
  // In production, this would integrate with the existing notification system
  // For now, we'll dispatch a custom event that can be caught by the notification system
  try {
    const event = new CustomEvent('shift:notification', {
      detail: { type, data, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
    
    // Also store in localStorage for persistence
    const notifications = JSON.parse(localStorage.getItem('cafeos_shift_notifications') || '[]');
    notifications.unshift({
      id: `notif_${Date.now()}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('cafeos_shift_notifications', JSON.stringify(notifications.slice(0, 100)));
  } catch (err) {
    console.error('[ShiftManagement] Failed to send notification:', err);
  }
}

export function getShiftNotifications() {
  try {
    return JSON.parse(localStorage.getItem('cafeos_shift_notifications') || '[]');
  } catch {
    return [];
  }
}

export function markNotificationRead(notificationId) {
  try {
    const notifications = getShiftNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('cafeos_shift_notifications', JSON.stringify(updated));
  } catch (err) {
    console.error('[ShiftManagement] Failed to mark notification as read:', err);
  }
}

// ── Shift Types ─────────────────────────────────────────────────────────────
export const SHIFT_TYPES = [
  { id: 'morning', name: 'Morning', icon: '🌅', hours: '6:00 AM - 2:00 PM' },
  { id: 'afternoon', name: 'Afternoon', icon: '☀️', hours: '2:00 PM - 10:00 PM' },
  { id: 'evening', name: 'Evening', icon: '🌆', hours: '4:00 PM - 12:00 AM' },
  { id: 'night', name: 'Night', icon: '🌙', hours: '10:00 PM - 6:00 AM' }
];

// ── Shift Status ─────────────────────────────────────────────────────────
export const SHIFT_STATUS = {
  DRAFT: 'draft',
  OPENING: 'opening',
  ACTIVE: 'active',
  CLOSING: 'closing',
  CLOSED: 'closed',
  FAILED: 'failed'
};

// ── Event Types ───────────────────────────────────────────────────────────
export const EVENT_TYPES = [
  'shift_opened',
  'shift_closed',
  'cash_adjusted',
  'refund_issued',
  'drawer_opened',
  'large_void',
  'printer_offline',
  'kitchen_delayed',
  'manager_override',
  'inventory_alert',
  'staff_clocked_in',
  'staff_clocked_out',
  'order_completed',
  'payment_received',
  'reservation_arrived'
];

// ── Storage Functions ───────────────────────────────────────────────────
export function getShifts() {
  try {
    const stored = localStorage.getItem(SHIFTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveShifts(shifts) {
  try {
    localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
  } catch (err) {
    console.error('[ShiftManagement] Failed to save shifts:', err);
  }
}

export function getActiveShift() {
  try {
    const stored = localStorage.getItem(ACTIVE_SHIFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setActiveShift(shift) {
  try {
    localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift));
  } catch (err) {
    console.error('[ShiftManagement] Failed to set active shift:', err);
  }
}

export function clearActiveShift() {
  try {
    localStorage.removeItem(ACTIVE_SHIFT_KEY);
  } catch (err) {
    console.error('[ShiftManagement] Failed to clear active shift:', err);
  }
}

export function getShiftEvents(shiftId) {
  try {
    const stored = localStorage.getItem(SHIFT_EVENTS_KEY);
    const allEvents = stored ? JSON.parse(stored) : {};
    return allEvents[shiftId] || [];
  } catch {
    return [];
  }
}

export function saveShiftEvents(shiftId, events) {
  try {
    const stored = localStorage.getItem(SHIFT_EVENTS_KEY) || '{}';
    const allEvents = JSON.parse(stored);
    allEvents[shiftId] = events;
    localStorage.setItem(SHIFT_EVENTS_KEY, JSON.stringify(allEvents));
  } catch (err) {
    console.error('[ShiftManagement] Failed to save shift events:', err);
  }
}

export function addShiftEvent(shiftId, event) {
  const events = getShiftEvents(shiftId);
  events.unshift({
    id: `event_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...event
  });
  saveShiftEvents(shiftId, events);
}

// ── Shift Creation ───────────────────────────────────────────────────────
export function createShift(shiftType, staffId, openingCash) {
  const shift = {
    id: `shift_${Date.now()}`,
    type: shiftType,
    status: SHIFT_STATUS.OPENING,
    startedBy: staffId,
    startedAt: new Date().toISOString(),
    openingCash: openingCash || 0,
    cashDrawer: {
      expected: openingCash || 0,
      actual: openingCash || 0,
      difference: 0
    },
    metrics: {
      orders: 0,
      revenue: 0,
      customers: 0,
      refunds: 0,
      voids: 0,
      averageOrder: 0
    },
    payments: {
      cash: 0,
      card: 0,
      upi: 0,
      online: 0
    },
    staff: [staffId],
    devices: [],
    issues: [],
    completedSteps: [],
    varianceHistory: []
  };
  
  const shifts = getShifts();
  shifts.push(shift);
  saveShifts(shifts);
  setActiveShift(shift);
  addShiftEvent(shift.id, { type: 'shift_opened', details: { shiftType, staffId, openingCash } });
  sendShiftNotification(SHIFT_NOTIFICATIONS.SHIFT_OPENED, { shiftId: shift.id, shiftType, staffId });
  
  return shift;
}

// ── Shift Updates ───────────────────────────────────────────────────────
export function updateShift(shiftId, updates) {
  const shifts = getShifts();
  const index = shifts.findIndex(s => s.id === shiftId);
  if (index !== -1) {
    shifts[index] = { ...shifts[index], ...updates };
    saveShifts(shifts);
    
    const activeShift = getActiveShift();
    if (activeShift?.id === shiftId) {
      setActiveShift(shifts[index]);
    }
    
    return shifts[index];
  }
  return null;
}

export function updateShiftMetrics(shiftId, metrics) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (shift) {
    const updatedMetrics = { ...shift.metrics, ...metrics };
    updatedMetrics.averageOrder = updatedMetrics.orders > 0 
      ? updatedMetrics.revenue / updatedMetrics.orders 
      : 0;
    return updateShift(shiftId, { metrics: updatedMetrics });
  }
  return null;
}

export function updateCashDrawer(shiftId, actualCash, reason) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (shift) {
    const difference = actualCash - shift.cashDrawer.expected;
    const variance = {
      timestamp: new Date().toISOString(),
      expected: shift.cashDrawer.expected,
      actual: actualCash,
      difference,
      reason,
      approvedBy: null
    };
    
    const updatedShift = updateShift(shiftId, {
      cashDrawer: {
        expected: shift.cashDrawer.expected,
        actual: actualCash,
        difference
      },
      varianceHistory: [...shift.varianceHistory, variance]
    });
    
    addShiftEvent(shiftId, { 
      type: 'cash_adjusted', 
      details: { actualCash, difference, reason } 
    });
    
    // Send notification for large variance
    if (Math.abs(difference) > 100) {
      sendShiftNotification(SHIFT_NOTIFICATIONS.LARGE_VARIANCE, {
        shiftId,
        difference,
        reason
      });
    }
    
    return updatedShift;
  }
  return null;
}

// ── Shift Completion ─────────────────────────────────────────────────────
export function closeShift(shiftId, closingData) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (shift) {
    const closedShift = updateShift(shiftId, {
      status: SHIFT_STATUS.CLOSED,
      closedAt: new Date().toISOString(),
      closedBy: closingData.closedBy,
      closingCash: closingData.closingCash,
      closingNotes: closingData.notes,
      finalVariance: closingData.closingCash - shift.cashDrawer.expected
    });
    
    addShiftEvent(shiftId, { 
      type: 'shift_closed', 
      details: closingData 
    });
    
    sendShiftNotification(SHIFT_NOTIFICATIONS.SHIFT_CLOSED, {
      shiftId,
      closedBy: closingData.closedBy,
      finalVariance: closingData.closingCash - shift.cashDrawer.expected
    });
    
    clearActiveShift();
    return closedShift;
  }
  return null;
}

export function failShift(shiftId, reason) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (shift) {
    const failedShift = updateShift(shiftId, {
      status: SHIFT_STATUS.FAILED,
      failedAt: new Date().toISOString(),
      failureReason: reason
    });
    
    addShiftEvent(shiftId, { 
      type: 'shift_failed', 
      details: { reason } 
    });
    
    sendShiftNotification(SHIFT_NOTIFICATIONS.FAILED_CLOSE, {
      shiftId,
      reason
    });
    
    clearActiveShift();
    return failedShift;
  }
  return null;
}

// ── Shift Queries ───────────────────────────────────────────────────────
export function getShiftsByDate(date) {
  const shifts = getShifts();
  const targetDate = new Date(date).toDateString();
  return shifts.filter(s => 
    new Date(s.startedAt).toDateString() === targetDate
  );
}

export function getShiftsByType(shiftType) {
  const shifts = getShifts();
  return shifts.filter(s => s.type === shiftType);
}

export function getShiftHistory(limit = 50) {
  const shifts = getShifts();
  return shifts
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

// ── Shift Validation ───────────────────────────────────────────────────
export function canCloseShift(shiftId) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (!shift) return { canClose: false, issues: ['Shift not found'] };
  
  const issues = [];
  
  if (shift.status !== SHIFT_STATUS.ACTIVE) {
    issues.push('Shift is not active');
  }
  
  if (Math.abs(shift.cashDrawer.difference) > 100) {
    issues.push('Large cash variance requires manager approval');
  }
  
  // In production, check for outstanding tables, pending payments, etc.
  // For now, we'll just check the status
  
  return {
    canClose: issues.length === 0,
    issues
  };
}

// ── Manager Override Functions ─────────────────────────────────────────
export async function requestManagerOverride(shiftId, action, reason) {
  try {
    const result = await requestPermissionOverride(
      'shift_management',
      action,
      { shiftId, reason }
    );
    
    if (result.approved) {
      addShiftEvent(shiftId, {
        type: 'manager_override',
        details: {
          action,
          reason,
          approvedBy: result.approvedBy
        }
      });
      return { approved: true, approvedBy: result.approvedBy };
    }
    
    return { approved: false, reason: result.reason };
  } catch (err) {
    console.error('[ShiftManagement] Manager override request failed:', err);
    return { approved: false, reason: 'Override request failed' };
  }
}

export async function closeShiftWithOverride(shiftId, closingData) {
  const validation = canCloseShift(shiftId);
  
  if (validation.canClose) {
    return closeShift(shiftId, closingData);
  }
  
  // Check if variance requires manager approval
  const shift = getShifts().find(s => s.id === shiftId);
  if (shift && Math.abs(shift.cashDrawer.difference) > 100) {
    const override = await requestManagerOverride(
      shiftId,
      'close_with_variance',
      `Cash variance: ₹${shift.cashDrawer.difference.toFixed(2)}`
    );
    
    if (override.approved) {
      return closeShift(shiftId, {
        ...closingData,
        managerOverride: {
          approvedBy: override.approvedBy,
          variance: shift.cashDrawer.difference
        }
      });
    }
    
    return { success: false, reason: 'Manager approval required for large variance' };
  }
  
  return { success: false, issues: validation.issues };
}

export async function forceCloseShift(shiftId, closingData, reason) {
  const override = await requestManagerOverride(
    shiftId,
    'force_close',
    reason
  );
  
  if (override.approved) {
    const result = closeShift(shiftId, {
      ...closingData,
      forceClosed: true,
      forceCloseReason: reason,
      managerOverride: {
        approvedBy: override.approvedBy
      }
    });
    
    addShiftEvent(shiftId, {
      type: 'shift_closed',
      details: {
        forceClosed: true,
        reason,
        approvedBy: override.approvedBy
      }
    });
    
    return { success: true, shift: result };
  }
  
  return { success: false, reason: 'Manager approval required' };
}

// ── Shift Report Generation ─────────────────────────────────────────────
export function generateShiftReport(shiftId) {
  const shift = getShifts().find(s => s.id === shiftId);
  if (!shift) return null;
  
  const events = getShiftEvents(shiftId);
  
  return {
    shift: {
      id: shift.id,
      type: shift.type,
      status: shift.status,
      startedAt: shift.startedAt,
      endedAt: shift.closedAt || shift.failedAt,
      duration: shift.closedAt 
        ? new Date(shift.closedAt) - new Date(shift.startedAt)
        : Date.now() - new Date(shift.startedAt),
      startedBy: shift.startedBy,
      closedBy: shift.closedBy
    },
    metrics: shift.metrics,
    payments: shift.payments,
    cashDrawer: shift.cashDrawer,
    variance: shift.cashDrawer.difference,
    varianceHistory: shift.varianceHistory,
    staff: shift.staff,
    events: events.slice(0, 100), // Last 100 events
    issues: shift.issues
  };
}

export default {
  SHIFT_TYPES,
  SHIFT_STATUS,
  EVENT_TYPES,
  SHIFT_NOTIFICATIONS,
  getShifts,
  saveShifts,
  getActiveShift,
  setActiveShift,
  clearActiveShift,
  getShiftEvents,
  saveShiftEvents,
  addShiftEvent,
  createShift,
  updateShift,
  updateShiftMetrics,
  updateCashDrawer,
  closeShift,
  failShift,
  getShiftsByDate,
  getShiftsByType,
  getShiftHistory,
  canCloseShift,
  requestManagerOverride,
  closeShiftWithOverride,
  forceCloseShift,
  sendShiftNotification,
  getShiftNotifications,
  markNotificationRead,
  generateShiftReport
};
