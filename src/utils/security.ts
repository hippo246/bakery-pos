// Security utilities for input validation and sanitization

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates phone number format (Indian format: 10 digits)
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a string is not empty after trimming
 */
export function validateNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates that a number is positive
 */
export function validatePositiveNumber(value: number): boolean {
  return value > 0 && isFinite(value);
}

/**
 * Sanitizes and validates a name field
 */
export function validateName(name: string): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(name.trim());
  const valid = sanitized.length >= 2 && sanitized.length <= 100;
  return { valid, sanitized };
}

/**
 * Validates and sanitizes notes/remarks
 */
export function validateNotes(notes: string): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(notes.trim());
  const valid = sanitized.length <= 1000;
  return { valid, sanitized };
}

/**
 * Validates menu item price
 */
export function validatePrice(price: number): boolean {
  return validatePositiveNumber(price) && price <= 100000;
}

/**
 * Validates order amount
 */
export function validateOrderAmount(amount: number): boolean {
  return validatePositiveNumber(amount) && amount <= 1000000;
}

/**
 * Escapes special characters for safe display
 */
export function escapeHtml(unsafe: string): string {
  return sanitizeInput(unsafe);
}

/**
 * Validates that a string contains only allowed characters
 * Useful for IDs, tags, etc.
 */
export function validateAlphaNumeric(input: string, allowSpaces: boolean = false): boolean {
  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  return pattern.test(input);
}

/**
 * Rate limiter for API calls or sensitive operations
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Content Security Policy helper
 * Generates CSP headers for meta tag
 */
export function getCSPMeta(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  
  return directives;
}

/**
 * Validates that a date string is in a valid format
 */
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Sanitizes a tag or category name
 */
export function validateTag(tag: string): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(tag.trim());
  const valid = sanitized.length >= 2 && sanitized.length <= 50 && validateAlphaNumeric(sanitized, true);
  return { valid, sanitized };
}
