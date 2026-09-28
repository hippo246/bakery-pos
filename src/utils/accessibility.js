// Accessibility utilities for WCAG compliance

export const generateAriaLabel = (prefix, item) => {
  if (!item) return prefix;
  return `${prefix}: ${item.name || item}`;
};

export const getKeyboardNavigationProps = (index, total) => ({
  tabIndex: 0,
  'aria-posinset': index + 1,
  'aria-setsize': total,
  onKeyDown: (e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        // Focus previous item
        break;
      case 'ArrowDown':
        e.preventDefault();
        // Focus next item
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Activate item
        break;
    }
  }
});

export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const getFocusableElements = (container) => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ];
  
  return Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
};

export const trapFocus = (container) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
};
