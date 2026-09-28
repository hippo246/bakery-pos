// Input validation and sanitization utilities

export const validateNumber = (value, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, value: 0 };
  if (num < min) return { valid: false, value: min };
  if (num > max) return { valid: false, value: max };
  return { valid: true, value: num };
};

export const validateInteger = (value, min = 0, max = Infinity) => {
  const num = parseInt(value);
  if (isNaN(num)) return { valid: false, value: 0 };
  if (num < min) return { valid: false, value: min };
  if (num > max) return { valid: false, value: max };
  return { valid: true, value: num };
};

export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .substring(0, 500); // Limit length
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

export const validateAmount = (amount) => {
  return validateNumber(amount, 0, 1000000); // Max ₹1,000,000
};

export const validatePercentage = (percentage) => {
  return validateNumber(percentage, 0, 100);
};

export const validateQuantity = (quantity) => {
  return validateInteger(quantity, 1, 999);
};

export const sanitizeNumber = (input, min = 0, max = Infinity) => {
  const num = parseFloat(input);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Basic email sanitization
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};

export const validateOrderItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  
  // Allow items with just id and name (quantity can be set later)
  return (
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.name === 'string' && item.name.length > 0 &&
    (typeof item.price === 'number' || typeof item.price === 'string') &&
    (typeof item.quantity === 'number' || typeof item.quantity === 'undefined')
  );
};

export const validateCustomer = (customer) => {
  if (!customer || typeof customer !== 'object') return false;
  
  return (
    typeof customer.name === 'string' && customer.name.length > 0 &&
    (typeof customer.email === 'undefined' || sanitizeEmail(customer.email) !== '' || customer.email === '')
  );
};

export const validatePayment = (payment) => {
  if (!payment || typeof payment !== 'object') return false;
  
  return (
    typeof payment.amount === 'number' && payment.amount > 0 &&
    typeof payment.method === 'string' && ['CASH', 'CARD', 'UPI', 'LOYALTY'].includes(payment.method)
  );
};

export const sanitizeInput = (input, type = 'string') => {
  switch (type) {
    case 'string':
      return sanitizeString(input);
    case 'number':
      return sanitizeNumber(input);
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhone(input);
    case 'html':
      return sanitizeHTML(input);
    default:
      return sanitizeString(input);
  }
};
