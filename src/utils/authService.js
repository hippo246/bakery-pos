// Auth service for CafeOS session management
// Handles login, logout, session persistence, and current user state
// NOTE: This is a localStorage-only implementation for demo/local use
// For production, this should be replaced with proper backend authentication
// Frontend authentication is NOT secure - it can be bypassed by modifying localStorage
// All permission checks are UI-only and NOT authoritative security enforcement

import { normalizeStaff } from '../domain/staffModel.js';
import { normalizeRole } from '../domain/roleModel.js';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../domain/permissionModel.js';

const STORAGE_KEY = 'cafeos_auth_session';
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// ── Session Schema ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AuthSession
 * @property {string} userId - Current user ID
 * @property {string} userName - Current user name
 * @property {string} roleId - Current role ID
 * @property {string} roleType - Current role type
 * @property {string[]} permissions - Current user permissions
 * @property {number} loginTime - Login timestamp
 * @property {number} lastActivity - Last activity timestamp
 * @property {string|null} branchId - Current branch ID (if multi-branch)
 * @property {object} metadata - Additional session metadata
 */

// ── Session Management ─────────────────────────────────────────────────────────

/**
 * Get current session from localStorage
 */
export function getSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    
    // Validate session structure
    if (!session || typeof session !== 'object') {
      clearSession();
      return null;
    }
    
    // Check session timeout
    const now = Date.now();
    const lastActivity = session.lastActivity || session.loginTime || 0;
    if (now - lastActivity > SESSION_TIMEOUT) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.warn('[authService] Failed to parse session:', error);
    clearSession();
    return null;
  }
}

/**
 * Save session to localStorage
 */
function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('[authService] Failed to save session:', error);
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[authService] Failed to clear session:', error);
  }
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity() {
  const session = getSession();
  if (session) {
    session.lastActivity = Date.now();
    saveSession(session);
  }
}

// ── Authentication ────────────────────────────────────────────────────────────

/**
 * Login with staff credentials
 * NOTE: This is a demo implementation. In production, validate against backend.
 */
export function login(staff, role, branchId = null) {
  if (!staff || !role) {
    throw new Error('Staff and role are required for login');
  }
  
  const normalizedStaff = normalizeStaff(staff);
  const normalizedRole = normalizeRole(role);
  
  // Check if staff is active
  if (normalizedStaff.status !== 'active') {
    throw new Error('Staff account is not active');
  }
  
  const now = Date.now();
  const session = {
    userId: normalizedStaff.id,
    userName: normalizedStaff.name,
    roleId: normalizedRole.id,
    roleType: normalizedRole.type,
    permissions: normalizedRole.permissions || [],
    loginTime: now,
    lastActivity: now,
    branchId,
    metadata: {
      staffEmail: normalizedStaff.email,
      staffPhone: normalizedStaff.phone,
    },
  };
  
  saveSession(session);
  return session;
}

/**
 * Logout current user
 */
export function logout() {
  const session = getSession();
  clearSession();
  return session;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return getSession() !== null;
}

// ── Permission Checking ───────────────────────────────────────────────────────

/**
 * Get current user permissions
 */
export function getCurrentPermissions() {
  const session = getSession();
  return session ? session.permissions || [] : [];
}

/**
 * Check if current user has specific permission
 */
export function hasCurrentPermission(permission) {
  const permissions = getCurrentPermissions();
  return hasPermission(permissions, permission);
}

/**
 * Check if current user has any of the required permissions
 */
export function hasAnyCurrentPermission(permissions) {
  const currentPermissions = getCurrentPermissions();
  return hasAnyPermission(currentPermissions, permissions);
}

/**
 * Check if current user has all required permissions
 */
export function hasAllCurrentPermissions(permissions) {
  const currentPermissions = getCurrentPermissions();
  return hasAllPermissions(currentPermissions, permissions);
}

// ── Role Information ─────────────────────────────────────────────────────────

/**
 * Get current user role type
 */
export function getCurrentRoleType() {
  const session = getSession();
  return session ? session.roleType : null;
}

/**
 * Check if current user has specific role type
 */
export function hasRoleType(roleType) {
  return getCurrentRoleType() === roleType;
}

/**
 * Check if current user is owner
 */
export function isOwner() {
  return hasRoleType('OWNER');
}

/**
 * Check if current user is admin
 */
export function isAdmin() {
  return hasRoleType('ADMIN');
}

/**
 * Check if current user is manager or higher
 */
export function isManagerOrHigher() {
  const roleType = getCurrentRoleType();
  if (!roleType) return false;
  const roleLevels = {
    OWNER: 100,
    ADMIN: 90,
    MANAGER: 70,
    STOCK_MANAGER: 60,
    ACCOUNTANT: 60,
    CASHIER: 40,
    WAITER: 40,
    KITCHEN: 40,
    DELIVERY: 40,
    VIEWER: 20,
  };
  const currentLevel = roleLevels[roleType] || 0;
  return currentLevel >= 70;
}

// ── User Information ─────────────────────────────────────────────────────────

/**
 * Get current user ID
 */
export function getCurrentUserId() {
  const session = getSession();
  return session ? session.userId : null;
}

/**
 * Get current user name
 */
export function getCurrentUserName() {
  const session = getSession();
  return session ? session.userName : null;
}

/**
 * Get current branch ID
 */
export function getCurrentBranchId() {
  const session = getSession();
  return session ? session.branchId : null;
}

/**
 * Get session metadata
 */
export function getSessionMetadata() {
  const session = getSession();
  return session ? session.metadata : {};
}

// ── Session Validation ─────────────────────────────────────────────────────

/**
 * Validate current session
 */
export function validateSession() {
  const session = getSession();
  if (!session) return { valid: false, reason: 'No session' };
  
  const now = Date.now();
  const lastActivity = session.lastActivity || session.loginTime || 0;
  const inactiveTime = now - lastActivity;
  
  if (inactiveTime > SESSION_TIMEOUT) {
    clearSession();
    return { valid: false, reason: 'Session expired' };
  }
  
  return { valid: true, inactiveTime };
}

/**
 * Refresh session (update activity timestamp)
 */
export function refreshSession() {
  return updateSessionActivity();
}

// ── Session Info ───────────────────────────────────────────────────────────────

/**
 * Get session information for display
 */
export function getSessionInfo() {
  const session = getSession();
  if (!session) return null;
  
  const loginTime = new Date(session.loginTime);
  const lastActivity = new Date(session.lastActivity);
  const sessionDuration = Date.now() - session.loginTime;
  
  return {
    userName: session.userName,
    roleType: session.roleType,
    loginTime: loginTime.toISOString(),
    lastActivity: lastActivity.toISOString(),
    sessionDuration,
    branchId: session.branchId,
  };
}

// ── Security Helpers ─────────────────────────────────────────────────────────

/**
 * Check if action requires authentication
 */
export function requiresAuth() {
  return true; // All actions require auth in this system
}

/**
 * Get authentication error message
 */
export function getAuthErrorMessage(action) {
  const actionName = action || 'perform this action';
  return `You must be logged in to ${actionName}. Please login and try again.`;
}

/**
 * Get permission denied error message
 */
export function getPermissionDeniedMessage(permission, action) {
  const actionName = action || 'perform this action';
  return `You do not have permission to ${actionName}. Required permission: ${permission}. Contact a manager or owner for access.`;
}

// ── Initialization ───────────────────────────────────────────────────────────

/**
 * Initialize auth service on app load
 */
export function initializeAuth() {
  // Validate existing session
  const validation = validateSession();
  if (!validation.valid) {
    console.log('[authService] Session invalid:', validation.reason);
  }
  
  // Set up activity tracking
  if (typeof window !== 'undefined') {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateSessionActivity, { passive: true });
    });
  }
  
  return validation;
}

// ── Demo Mode Helpers ─────────────────────────────────────────────────────────

/**
 * Create demo session for testing
 * NOTE: Only use in development/demo environments
 */
export function createDemoSession(roleType = 'MANAGER') {
  // Demo sessions are always allowed in browser environments
  // The production check is not applicable for client-side code
  
  const demoStaff = {
    id: 'demo-staff',
    name: 'Demo User',
    role: roleType.toLowerCase(),
    status: 'active',
    email: 'demo@cafeos.com',
    phone: '1234567890',
  };
  
  const demoRole = {
    id: `demo-role-${roleType}`,
    type: roleType,
    name: roleType,
    permissions: [], // Will be filled by role model
  };
  
  return login(demoStaff, demoRole);
}
