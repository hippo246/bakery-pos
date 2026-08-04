// Storage Helper
// Safe localStorage operations that work in both browser and server-side environments

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if get fails
 * @returns {any} Stored value or default
 */
export function safeGetItem(key, defaultValue = null) {
  if (typeof localStorage === 'undefined') {
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return value;
  } catch (error) {
    console.warn(`[StorageHelper] Failed to get item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely get and parse JSON from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if parse fails
 * @returns {any} Parsed value or default
 */
export function safeGetJSON(key, defaultValue = null) {
  if (typeof localStorage === 'undefined') {
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    const parsed = JSON.parse(value);
    return parsed;
  } catch (error) {
    console.warn(`[StorageHelper] Failed to parse JSON for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Whether operation succeeded
 */
export function safeSetItem(key, value) {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[StorageHelper] Failed to set item "${key}":`, error);
    return false;
  }
}

/**
 * Safely set JSON in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {boolean} Whether operation succeeded
 */
export function safeSetJSON(key, value) {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    console.warn(`[StorageHelper] Failed to set JSON for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Whether operation succeeded
 */
export function safeRemoveItem(key) {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[StorageHelper] Failed to remove item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage
 * @returns {boolean} Whether operation succeeded
 */
export function safeClear() {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('[StorageHelper] Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
export function isStorageAvailable() {
  return typeof localStorage !== 'undefined';
}
