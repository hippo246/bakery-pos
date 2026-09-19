// Date/time utilities

// ── Internal safe helpers ────────────────────────────────────────────────────

function devWarn(...args) {
  console.warn('[dates]', ...args);
}

function isValidTimestamp(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function safeTimestamp(value, fallback = Date.now()) {
  if (value instanceof Date) {
    const t = value.getTime();
    if (Number.isFinite(t)) return t;
    devWarn('invalid Date object', value);
    return fallback;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const t = new Date(value).getTime();
    if (Number.isFinite(t)) return t;
    devWarn('invalid date string', value);
    return fallback;
  }
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return n;
  if (value != null) devWarn('invalid timestamp', value);
  return fallback;
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Get current timestamp in milliseconds
 * @returns {number} Current timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Convert date string or timestamp to timestamp.
 * Always returns a number; returns Date.now() for null/undefined input.
 * @param {string|number|Date|null|undefined} date
 * @returns {number} Timestamp in milliseconds
 */
export function toTimestamp(date) {
  if (date == null) return Date.now();
  return safeTimestamp(date, Date.now());
}

/**
 * Format timestamp to ISO string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} ISO date string
 */
export function toISOString(timestamp) {
  try {
    const t = safeTimestamp(timestamp, Date.now());
    return new Date(t).toISOString();
  } catch {
    return '';
  }
}

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  if (!isValidTimestamp(timestamp)) return '—';
  try {
    return new Date(Number(timestamp)).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

/**
 * Format timestamp to readable time string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  if (!isValidTimestamp(timestamp)) return '—';
  try {
    return new Date(Number(timestamp)).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

/**
 * Format timestamp to date and time string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(timestamp) {
  if (!isValidTimestamp(timestamp)) return '—';
  try {
    return new Date(Number(timestamp)).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

/**
 * Get minutes elapsed since timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {number} Minutes elapsed
 */
export function getMinutesElapsed(timestamp) {
  if (!isValidTimestamp(timestamp)) return 0;
  const diff = Date.now() - Number(timestamp);
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.floor(diff / 60000);
}

/**
 * Check if timestamp is within last X minutes
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {number} minutes - Minutes to check
 * @returns {boolean} True if within time window
 */
export function isWithinMinutes(timestamp, minutes) {
  if (!isValidTimestamp(timestamp)) return false;
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return false;
  return getMinutesElapsed(timestamp) < m;
}

/**
 * Get start of day timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {number} Start of day timestamp
 */
export function getStartOfDay(timestamp) {
  const t = isValidTimestamp(timestamp) ? Number(timestamp) : Date.now();
  const date = new Date(t);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getEndOfDay(timestamp) {
  const t = isValidTimestamp(timestamp) ? Number(timestamp) : Date.now();
  const date = new Date(t);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Check if two timestamps are on the same day
 * @param {number} timestamp1 - First timestamp
 * @param {number} timestamp2 - Second timestamp
 * @returns {boolean} True if same day
 */
export function isSameDay(timestamp1, timestamp2) {
  if (!isValidTimestamp(timestamp1) || !isValidTimestamp(timestamp2)) return false;
  try {
    return new Date(Number(timestamp1)).toDateString() === new Date(Number(timestamp2)).toDateString();
  } catch {
    return false;
  }
}

/**
 * Check if a timestamp falls within the last N days (isToday = isWithinDays(ts, 1))
 */
export function isToday(timestamp) {
  return isValidTimestamp(timestamp) && isSameDay(Number(timestamp), Date.now());
}

/**
 * Check if a timestamp is within a range [start, end] (inclusive)
 */
export function isWithinRange(timestamp, start, end) {
  const t = Number(timestamp);
  const s = Number(start);
  const e = Number(end);
  if (!Number.isFinite(t) || !Number.isFinite(s) || !Number.isFinite(e)) return false;
  return t >= s && t <= e;
}

/**
 * Get the number of whole days between two timestamps (absolute)
 */
export function daysBetween(a, b) {
  const ta = Number(a);
  const tb = Number(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
  return Math.floor(Math.abs(ta - tb) / 86400000);
}

/**
 * Exported alias for isValidTimestamp — useful for callers that validate before formatting
 */
export function isValidDateValue(value) {
  return isValidTimestamp(value);
}

/**
 * Get start of period timestamp from period string (e.g., "2024-01" for January 2024)
 * @param {string} period - Period string in format "YYYY-MM"
 * @returns {number} Start of period timestamp
 */
export function getPeriodStart(period) {
  try {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.getTime();
  } catch {
    return getStartOfDay(Date.now());
  }
}

/**
 * Get end of period timestamp from period string (e.g., "2024-01" for January 2024)
 * @param {string} period - Period string in format "YYYY-MM"
 * @returns {number} End of period timestamp
 */
export function getPeriodEnd(period) {
  try {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month, 0); // Last day of the month
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  } catch {
    return getEndOfDay(Date.now());
  }
}
