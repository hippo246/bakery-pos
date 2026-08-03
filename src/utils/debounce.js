/**
 * Debounce utility function
 * Delays function execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility function
 * Ensures function is called at most once every wait milliseconds
 * 
 * @param {Function} func - Function to throttle
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Throttled function
 */
export function throttle(func, wait = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}
