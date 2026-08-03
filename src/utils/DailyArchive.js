/**
 * DailyArchive.js
 * Manages automatic daily archiving of completed orders.
 * Archives are stored in localStorage as cafeos_archive_YYYY-MM-DD
 * and referenced from a cafeos_archive_index key.
 */

const ARCHIVE_PREFIX = 'cafeos_archive_';
const ARCHIVE_INDEX_KEY = 'cafeos_archive_index';
const LAST_ACTIVE_DATE_KEY = 'cafeos_last_active_date';

/**
 * Get today's date string in YYYY-MM-DD format (local timezone).
 */
export function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get the last recorded active date.
 */
export function getLastActiveDate() {
  return localStorage.getItem(LAST_ACTIVE_DATE_KEY) || null;
}

/**
 * Update the last active date to today.
 */
export function markTodayAsActive() {
  localStorage.setItem(LAST_ACTIVE_DATE_KEY, getTodayDateStr());
}

/**
 * Archive a set of orders for a specific date.
 * Only archives COMPLETED and CANCELLED orders (active orders would be lost otherwise).
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array} orders - The full orders array
 */
export function archiveDay(dateStr, orders) {
  if (!dateStr || !Array.isArray(orders)) return;

  const ordersToArchive = orders.filter(o =>
    o.status === 'COMPLETED' || o.status === 'CANCELLED'
  );

  if (ordersToArchive.length === 0) return;

  const key = ARCHIVE_PREFIX + dateStr;

  // Merge with any existing archive for this date (in case of multiple partial saves)
  let existing = [];
  try {
    const saved = localStorage.getItem(key);
    if (saved) existing = JSON.parse(saved);
  } catch { existing = []; }

  // De-duplicate by order ID
  const existingIds = new Set(existing.map(o => o.id));
  const merged = [...existing, ...ordersToArchive.filter(o => !existingIds.has(o.id))];

  try {
    localStorage.setItem(key, JSON.stringify(merged));
    _updateArchiveIndex(dateStr);
  } catch (e) {
    console.error('[DailyArchive] Failed to save archive for', dateStr, e);
  }
}

/**
 * Get all archived day date strings, sorted newest first.
 * @returns {string[]} Array of YYYY-MM-DD strings
 */
export function getArchivedDays() {
  try {
    const index = localStorage.getItem(ARCHIVE_INDEX_KEY);
    if (!index) return [];
    const parsed = JSON.parse(index);
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.localeCompare(a))
      : [];
  } catch {
    return [];
  }
}

/**
 * Get archived orders for a specific date.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Array} Array of order objects
 */
export function getArchivedOrders(dateStr) {
  try {
    const raw = localStorage.getItem(ARCHIVE_PREFIX + dateStr);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Calculate summary stats from an array of orders (for analytics display).
 */
export function summarizeOrders(orders) {
  const completed = orders.filter(o => o.status === 'COMPLETED');
  const cancelled = orders.filter(o => o.status === 'CANCELLED');
  const revenue = completed.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Payment method breakdown
  const paymentBreakdown = {};
  completed.forEach(o => {
    // Multi-method split payments
    if (Array.isArray(o.paymentBreakdown) && o.paymentBreakdown.length > 0) {
      o.paymentBreakdown.forEach(p => {
        const m = p.method || 'OTHER';
        paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (Number(p.amount) || 0);
      });
    } else {
      const m = o.paymentMethod || 'OTHER';
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (Number(o.total) || 0);
    }
  });

  return {
    totalOrders: orders.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    totalRevenue: revenue,
    avgOrderValue: completed.length > 0 ? revenue / completed.length : 0,
    paymentBreakdown,
  };
}

/**
 * Check if the app day has rolled over and archiving is needed.
 * Returns the date that needs archiving, or null if no action needed.
 * @returns {string|null} Date string YYYY-MM-DD that needs archiving, or null
 */
export function checkDayRollover() {
  const lastActive = getLastActiveDate();
  const today = getTodayDateStr();
  if (!lastActive || lastActive === today) return null;
  return lastActive; // the previous day that needs archiving
}

function _updateArchiveIndex(dateStr) {
  try {
    const existing = getArchivedDays();
    if (!existing.includes(dateStr)) {
      existing.push(dateStr);
      localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify(existing));
    }
  } catch { /* ignore */ }
}

export default {
  getTodayDateStr,
  getLastActiveDate,
  markTodayAsActive,
  archiveDay,
  getArchivedDays,
  getArchivedOrders,
  summarizeOrders,
  checkDayRollover,
};
