/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input before storage and display
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Removes dangerous HTML tags and attributes while preserving safe content
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous HTML tags
  const dangerousTags = [
    '<script', '</script>',
    '<iframe', '</iframe>',
    '<object', '</object>',
    '<embed', '</embed>',
    '<form', '</form>',
    '<input', '</input>',
    '<button', '</button>',
    '<link', '</link>',
    '<meta', '</meta>',
    '<style', '</style>',
    '<img', '</img>',
    '<svg', '</svg>',
    '<onload', '<onerror', '<onclick',
    'javascript:', 'data:', 'vbscript:'
  ];

  let sanitized = input;
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(tag, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove potentially dangerous attributes
  const dangerousAttrs = ['src', 'href', 'data-', 'xlink:href'];
  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized.trim();
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return sanitizeString(String(obj));
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[sanitizeString(key)] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize localStorage data before use
 */
export function getSanitizedLocalStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(key);
    if (data === null) {
      return fallback;
    }

    const parsed = JSON.parse(data);
    
    // Sanitize the parsed data
    if (typeof parsed === 'string') {
      return sanitizeString(parsed);
    } else if (typeof parsed === 'object') {
      return sanitizeObject(parsed);
    } else {
      return parsed;
    }
  } catch (error) {
    console.error(`[Sanitize] Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set localStorage data with sanitization
 */
export function setSanitizedLocalStorage(key, value) {
  try {
    const sanitized = typeof value === 'object' ? sanitizeObject(value) : sanitizeString(String(value));
    localStorage.setItem(key, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.error(`[Sanitize] Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
