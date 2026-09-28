// CSRF protection utilities

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

// Generate a random CSRF token
const generateCSRFToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Get or create CSRF token
export const getCSRFToken = () => {
  let token = localStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCSRFToken();
    localStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
};

// Refresh CSRF token (call after login/logout)
export const refreshCSRFToken = () => {
  const token = generateCSRFToken();
  localStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

// Validate CSRF token for critical operations
export const validateCSRFToken = (providedToken) => {
  const storedToken = getCSRFToken();
  return providedToken === storedToken;
};

// Add CSRF token to request headers
export const addCSRFToHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
};

// Check if operation should require CSRF validation
export const requiresCSRFValidation = (operation) => {
  const criticalOperations = [
    'payment',
    'refund',
    'order_complete',
    'inventory_update',
    'customer_update',
    'staff_update',
    'settings_update'
  ];
  return criticalOperations.includes(operation);
};
