// Date/time utilities

/**
 * Get current timestamp in milliseconds
 * @returns {number} Current timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Convert date string or timestamp to timestamp
 * @param {string|number} date - Date string or timestamp
 * @returns {number} Timestamp in milliseconds
 */
export function toTimestamp(date) {
  if (typeof date === 'number') return date;
  return new Date(date).getTime();
}

/**
 * Format timestamp to ISO string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} ISO date string
 */
export function toISOString(timestamp) {
  return new Date(timestamp).toISOString();
}

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format timestamp to readable time string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format timestamp to date and time string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get minutes elapsed since timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {number} Minutes elapsed
 */
export function getMinutesElapsed(timestamp) {
  return Math.floor((Date.now() - timestamp) / 60000);
}

/**
 * Check if timestamp is within last X minutes
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {number} minutes - Minutes to check
 * @returns {boolean} True if within time window
 */
export function isWithinMinutes(timestamp, minutes) {
  return getMinutesElapsed(timestamp) < minutes;
}

/**
 * Get start of day timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {number} Start of day timestamp
 */
export function getStartOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {number} End of day timestamp
 */
export function getEndOfDay(timestamp) {
  const date = new Date(timestamp);
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
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return date1.toDateString() === date2.toDateString();
}
