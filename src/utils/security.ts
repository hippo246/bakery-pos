// Security utilities for input validation and sanitization

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _warn(msg: string): void {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.warn("[security]", msg);
  }
}

function _isString(v: unknown): v is string {
  return typeof v === "string";
}

/** Coerce any value to string; never throws. */
function _toString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (_isString(v)) return v;
  try { return String(v); } catch { return ""; }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Sanitizes user input to prevent XSS attacks.
 * Accepts any value; always returns a string.
 */
export function sanitizeInput(input: unknown): string {
  const str = _toString(input);
  if (!str) return "";

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates phone number format (Indian format: 10 digits).
 * Safe on null/undefined/non-string input.
 */
export function validatePhoneNumber(phone: unknown): boolean {
  if (!_isString(phone) && phone !== null && phone !== undefined) {
    _warn("validatePhoneNumber: expected string, got " + typeof phone);
  }
  const cleaned = _toString(phone).replace(/\D/g, "");
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validates email format. Safe on null/undefined.
 */
export function validateEmail(email: unknown): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(_toString(email).trim().toLowerCase());
}

/**
 * Validates that a value is not empty after trimming. Safe on any input.
 */
export function validateNotEmpty(value: unknown): boolean {
  return _toString(value).trim().length > 0;
}

/**
 * Validates that a value is a finite positive number. Safe on any input.
 */
export function validatePositiveNumber(value: unknown): boolean {
  const n = Number(value);
  return !Number.isNaN(n) && Number.isFinite(n) && n > 0;
}

/**
 * Sanitizes and validates a name field. Safe on null/undefined.
 */
export function validateName(name: unknown): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(_toString(name).trim());
  const valid = sanitized.length >= 2 && sanitized.length <= 100;
  return { valid, sanitized };
}

/**
 * Validates and sanitizes notes/remarks. Safe on null/undefined.
 * Empty string is allowed; max 1000 chars.
 */
export function validateNotes(notes: unknown): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(_toString(notes).trim());
  const valid = sanitized.length <= 1000;
  return { valid, sanitized };
}

/**
 * Validates menu item price. Safe on any input.
 */
export function validatePrice(price: unknown): boolean {
  const n = Number(price);
  return !Number.isNaN(n) && Number.isFinite(n) && n > 0 && n <= 100000;
}

/**
 * Validates order amount. Safe on any input.
 */
export function validateOrderAmount(amount: unknown): boolean {
  const n = Number(amount);
  return !Number.isNaN(n) && Number.isFinite(n) && n > 0 && n <= 1000000;
}

/**
 * Escapes special characters for safe display. Accepts any value.
 */
export function escapeHtml(unsafe: unknown): string {
  return sanitizeInput(unsafe);
}

/**
 * Validates that a value contains only allowed characters. Safe on any input.
 */
export function validateAlphaNumeric(input: unknown, allowSpaces: boolean = false): boolean {
  const s = _toString(input);
  if (!s) return false;
  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  return pattern.test(s);
}

/**
 * Rate limiter for API calls or sensitive operations.
 * Invalid constructor values fall back to safe defaults.
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[] = [];
  /** Hard cap on stored timestamps to prevent unbounded growth. */
  private static readonly MAX_STORED = 10_000;

  constructor(maxRequests: number, windowMs: number) {
    const mR = Number(maxRequests);
    const wM = Number(windowMs);
    this.maxRequests = Number.isFinite(mR) && mR > 0 ? Math.floor(mR) : 10;
    this.windowMs    = Number.isFinite(wM) && wM > 0 ? wM : 60_000;
    if (this.maxRequests !== mR || this.windowMs !== wM) {
      _warn(`RateLimiter: invalid args (${maxRequests}, ${windowMs}), using (${this.maxRequests}, ${this.windowMs})`);
    }
  }

  canMakeRequest(): boolean {
    try {
      const now = Date.now();
      // Prune expired entries; also guard against future timestamps (clock skew)
      this.requests = this.requests.filter(t => {
        const age = now - t;
        return age >= 0 && age < this.windowMs;
      });
      // Prevent unbounded growth under any circumstance
      if (this.requests.length > RateLimiter.MAX_STORED) {
        this.requests = this.requests.slice(-this.maxRequests);
      }
      if (this.requests.length < this.maxRequests) {
        this.requests.push(now);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.requests = [];
  }

  /** Remaining allowed requests in the current window. */
  remaining(): number {
    const now = Date.now();
    const active = this.requests.filter(t => now - t >= 0 && now - t < this.windowMs).length;
    return Math.max(0, this.maxRequests - active);
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
 * Validates that a value is a parseable date. Safe on any input.
 */
export function validateDate(dateString: unknown): boolean {
  if (!dateString && dateString !== 0) return false;
  try {
    const date = new Date(_toString(dateString));
    return !isNaN(date.getTime());
  } catch { return false; }
}

/**
 * Sanitizes a tag or category name. Safe on null/undefined.
 */
export function validateTag(tag: unknown): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(_toString(tag).trim());
  const valid = sanitized.length >= 2 && sanitized.length <= 50 && validateAlphaNumeric(sanitized, true);
  return { valid, sanitized };
}


// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/** Returns digits-only phone string, preserving leading + if present. */
export function normalizePhone(phone: unknown): string {
  const s = _toString(phone);
  const hasPlus = s.trimStart().startsWith("+");
  const digits = s.replace(/\D/g, "");
  return hasPlus ? "+" + digits : digits;
}

/** Trims and lowercases an email; returns "" on bad input. */
export function normalizeEmail(email: unknown): string {
  return _toString(email).trim().toLowerCase();
}

/** Trims and collapses internal whitespace in a text value. */
export function normalizeText(text: unknown): string {
  return _toString(text).trim().replace(/\s+/g, " ");
}

/** Trims name and title-cases first letter of each word. */
export function normalizeName(name: unknown): string {
  return _toString(name)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Converts a value to a clean, deduped array of non-empty trimmed strings. */
export function normalizeTags(tags: unknown): string[] {
  const arr: unknown[] = Array.isArray(tags) ? tags
    : _isString(tags) ? tags.split(",")
    : [];
  const seen = new Set<string>();
  return arr
    .map(t => sanitizeInput(_toString(t).trim()))
    .filter(t => t.length > 0 && !seen.has(t) && seen.add(t));
}

/** Coerces a value to a finite number; returns fallback on failure. */
export function safeNumber(value: unknown, fallback: number = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// JSON helper
// ---------------------------------------------------------------------------

/**
 * Parses JSON safely; returns fallback on any error.
 * Dev-only warning on parse failure.
 */
export function safeParseJson<T = unknown>(text: unknown, fallback: T): T {
  try {
    return JSON.parse(_toString(text)) as T;
  } catch (e) {
    _warn("safeParseJson: invalid JSON — " + (e instanceof Error ? e.message : String(e)));
    return fallback;
  }
}
