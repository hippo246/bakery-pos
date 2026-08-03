// Shift Permissions System for CafeOS
// Role-based access control for shift operations

/**
 * Shift roles
 */
export const SHIFT_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  CASHIER: 'CASHIER',
  VIEWER: 'VIEWER'
};

/**
 * Shift permissions
 */
export const SHIFT_PERMISSIONS = {
  // Shift operations
  OPEN_SHIFT: 'OPEN_SHIFT',
  CLOSE_SHIFT: 'CLOSE_SHIFT',
  VIEW_SHIFT: 'VIEW_SHIFT',
  EDIT_SHIFT: 'EDIT_SHIFT',
  DELETE_SHIFT: 'DELETE_SHIFT',
  
  // Cash operations
  COUNT_CASH: 'COUNT_CASH',
  RECONCILE_PAYMENTS: 'RECONCILE_PAYMENTS',
  
  // Paid outs and drops
  ADD_PAID_OUT: 'ADD_PAID_OUT',
  ADD_CASH_DROP: 'ADD_CASH_DROP',
  APPROVE_PAID_OUT: 'APPROVE_PAID_OUT',
  APPROVE_CASH_DROP: 'APPROVE_CASH_DROP',
  
  // Reports
  VIEW_REPORTS: 'VIEW_REPORTS',
  EXPORT_REPORTS: 'EXPORT_REPORTS',
  PRINT_REPORTS: 'PRINT_REPORTS',
  
  // History
  VIEW_HISTORY: 'VIEW_HISTORY',
  VIEW_ALL_SHIFTS: 'VIEW_ALL_SHIFTS',
  
  // Overrides
  MANAGER_OVERRIDE: 'MANAGER_OVERRIDE',
  VOID_SHIFT: 'VOID_SHIFT'
};

/**
 * Role permissions mapping
 */
const ROLE_PERMISSIONS = {
  [SHIFT_ROLES.OWNER]: [
    SHIFT_PERMISSIONS.OPEN_SHIFT,
    SHIFT_PERMISSIONS.CLOSE_SHIFT,
    SHIFT_PERMISSIONS.VIEW_SHIFT,
    SHIFT_PERMISSIONS.EDIT_SHIFT,
    SHIFT_PERMISSIONS.DELETE_SHIFT,
    SHIFT_PERMISSIONS.COUNT_CASH,
    SHIFT_PERMISSIONS.RECONCILE_PAYMENTS,
    SHIFT_PERMISSIONS.ADD_PAID_OUT,
    SHIFT_PERMISSIONS.ADD_CASH_DROP,
    SHIFT_PERMISSIONS.APPROVE_PAID_OUT,
    SHIFT_PERMISSIONS.APPROVE_CASH_DROP,
    SHIFT_PERMISSIONS.VIEW_REPORTS,
    SHIFT_PERMISSIONS.EXPORT_REPORTS,
    SHIFT_PERMISSIONS.PRINT_REPORTS,
    SHIFT_PERMISSIONS.VIEW_HISTORY,
    SHIFT_PERMISSIONS.VIEW_ALL_SHIFTS,
    SHIFT_PERMISSIONS.MANAGER_OVERRIDE,
    SHIFT_PERMISSIONS.VOID_SHIFT
  ],
  [SHIFT_ROLES.MANAGER]: [
    SHIFT_PERMISSIONS.OPEN_SHIFT,
    SHIFT_PERMISSIONS.CLOSE_SHIFT,
    SHIFT_PERMISSIONS.VIEW_SHIFT,
    SHIFT_PERMISSIONS.EDIT_SHIFT,
    SHIFT_PERMISSIONS.COUNT_CASH,
    SHIFT_PERMISSIONS.RECONCILE_PAYMENTS,
    SHIFT_PERMISSIONS.ADD_PAID_OUT,
    SHIFT_PERMISSIONS.ADD_CASH_DROP,
    SHIFT_PERMISSIONS.APPROVE_PAID_OUT,
    SHIFT_PERMISSIONS.APPROVE_CASH_DROP,
    SHIFT_PERMISSIONS.VIEW_REPORTS,
    SHIFT_PERMISSIONS.EXPORT_REPORTS,
    SHIFT_PERMISSIONS.PRINT_REPORTS,
    SHIFT_PERMISSIONS.VIEW_HISTORY,
    SHIFT_PERMISSIONS.VIEW_ALL_SHIFTS,
    SHIFT_PERMISSIONS.MANAGER_OVERRIDE
  ],
  [SHIFT_ROLES.SUPERVISOR]: [
    SHIFT_PERMISSIONS.OPEN_SHIFT,
    SHIFT_PERMISSIONS.CLOSE_SHIFT,
    SHIFT_PERMISSIONS.VIEW_SHIFT,
    SHIFT_PERMISSIONS.COUNT_CASH,
    SHIFT_PERMISSIONS.RECONCILE_PAYMENTS,
    SHIFT_PERMISSIONS.ADD_PAID_OUT,
    SHIFT_PERMISSIONS.ADD_CASH_DROP,
    SHIFT_PERMISSIONS.APPROVE_PAID_OUT,
    SHIFT_PERMISSIONS.APPROVE_CASH_DROP,
    SHIFT_PERMISSIONS.VIEW_REPORTS,
    SHIFT_PERMISSIONS.PRINT_REPORTS,
    SHIFT_PERMISSIONS.VIEW_HISTORY,
    SHIFT_PERMISSIONS.VIEW_ALL_SHIFTS
  ],
  [SHIFT_ROLES.CASHIER]: [
    SHIFT_PERMISSIONS.VIEW_SHIFT,
    SHIFT_PERMISSIONS.COUNT_CASH,
    SHIFT_PERMISSIONS.VIEW_REPORTS,
    SHIFT_PERMISSIONS.VIEW_HISTORY
  ],
  [SHIFT_ROLES.VIEWER]: [
    SHIFT_PERMISSIONS.VIEW_SHIFT,
    SHIFT_PERMISSIONS.VIEW_REPORTS,
    SHIFT_PERMISSIONS.VIEW_HISTORY
  ]
};

/**
 * Check if user has permission
 */
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole, permissions) {
  if (!userRole || !permissions || permissions.length === 0) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole, permissions) {
  if (!userRole || !permissions || permissions.length === 0) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Check if user can open a shift
 */
export function canOpenShift(user, _registerId) {
  if (!user) return false;
  
  // Owner and Manager can always open shifts
  if (user.role === SHIFT_ROLES.OWNER || user.role === SHIFT_ROLES.MANAGER) {
    return true;
  }
  
  // Supervisor can open shifts if assigned
  if (user.role === SHIFT_ROLES.SUPERVISOR) {
    return hasPermission(user.role, SHIFT_PERMISSIONS.OPEN_SHIFT);
  }
  
  return false;
}

/**
 * Check if user can close a shift
 */
export function canCloseShift(user, shift) {
  if (!user || !shift) return false;
  
  // Owner can always close
  if (user.role === SHIFT_ROLES.OWNER) {
    return true;
  }
  
  // Manager can close if they are the shift manager or have override
  if (user.role === SHIFT_ROLES.MANAGER) {
    return shift.managerId === user.id || hasPermission(user.role, SHIFT_PERMISSIONS.MANAGER_OVERRIDE);
  }
  
  // Supervisor can close if they are the shift manager
  if (user.role === SHIFT_ROLES.SUPERVISOR) {
    return shift.managerId === user.id && hasPermission(user.role, SHIFT_PERMISSIONS.CLOSE_SHIFT);
  }
  
  return false;
}

/**
 * Check if user can approve paid outs
 */
export function canApprovePaidOut(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.APPROVE_PAID_OUT);
}

/**
 * Check if user can approve cash drops
 */
export function canApproveCashDrop(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.APPROVE_CASH_DROP);
}

/**
 * Check if user can view shift reports
 */
export function canViewReports(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.VIEW_REPORTS);
}

/**
 * Check if user can export reports
 */
export function canExportReports(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.EXPORT_REPORTS);
}

/**
 * Check if user can view all shifts (not just their own)
 */
export function canViewAllShifts(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.VIEW_ALL_SHIFTS);
}

/**
 * Check if user can perform manager override
 */
export function canOverride(user) {
  if (!user) return false;
  
  return hasPermission(user.role, SHIFT_PERMISSIONS.MANAGER_OVERRIDE);
}

/**
 * Get user's shift permissions
 */
export function getUserPermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if action requires approval
 */
export function requiresApproval(user, action) {
  if (!user) return true;
  
  const approvalRequiredActions = [
    SHIFT_PERMISSIONS.ADD_PAID_OUT,
    SHIFT_PERMISSIONS.ADD_CASH_DROP
  ];
  
  // Managers and above don't need approval for most actions
  if (user.role === SHIFT_ROLES.OWNER || user.role === SHIFT_ROLES.MANAGER) {
    return false;
  }
  
  // Supervisors need approval for paid outs and cash drops
  if (user.role === SHIFT_ROLES.SUPERVISOR) {
    return approvalRequiredActions.includes(action);
  }
  
  // Cashiers always need approval
  return true;
}

/**
 * Filter shifts based on user permissions
 */
export function filterShiftsByPermission(shifts, user) {
  if (!shifts || !user) return [];
  
  // Owners and Managers can see all shifts
  if (canViewAllShifts(user)) {
    return shifts;
  }
  
  // Others can only see shifts they're involved in
  return shifts.filter(shift => 
    shift.managerId === user.id || 
    shift.cashierId === user.id
  );
}

/**
 * Get available managers for approval
 */
export function getAvailableApprovers(staff) {
  if (!staff) return [];
  
  return staff.filter(s => 
    s.role === SHIFT_ROLES.MANAGER || 
    s.role === SHIFT_ROLES.SUPERVISOR ||
    s.role === SHIFT_ROLES.OWNER
  );
}

export default {
  SHIFT_ROLES,
  SHIFT_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canOpenShift,
  canCloseShift,
  canApprovePaidOut,
  canApproveCashDrop,
  canViewReports,
  canExportReports,
  canViewAllShifts,
  canOverride,
  getUserPermissions,
  requiresApproval,
  filterShiftsByPermission,
  getAvailableApprovers
};
