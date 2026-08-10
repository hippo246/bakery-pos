/**
 * Accessibility Utilities
 * Helper functions for ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate ARIA label for buttons with icons
 */
export function getAriaLabel(icon, action, context = '') {
  const baseLabel = `${action} ${icon}`;
  return context ? `${baseLabel} ${context}` : baseLabel;
}

/**
 * Generate ARIA label for navigation items
 */
export function getNavAriaLabel(label, isActive) {
  return isActive ? `${label}, current page` : label;
}

/**
 * Handle keyboard navigation for custom components
 */
export function handleKeyboardNavigation(event, actions) {
  const { onEnter, onSpace, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight } = actions;

  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter(event);
      }
      break;
    case ' ':
      if (onSpace) {
        event.preventDefault();
        onSpace(event);
      }
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape(event);
      }
      break;
    case 'ArrowUp':
      if (onArrowUp) {
        event.preventDefault();
        onArrowUp(event);
      }
      break;
    case 'ArrowDown':
      if (onArrowDown) {
        event.preventDefault();
        onArrowDown(event);
      }
      break;
    case 'ArrowLeft':
      if (onArrowLeft) {
        event.preventDefault();
        onArrowLeft(event);
      }
      break;
    case 'ArrowRight':
      if (onArrowRight) {
        event.preventDefault();
        onArrowRight(event);
      }
      break;
  }
}

/**
 * Generate ARIA attributes for modal dialogs
 */
export function getModalAriaProps(title, description = '') {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title.replace(/\s+/g, '-').toLowerCase(),
    'aria-describedby': description ? description.replace(/\s+/g, '-').toLowerCase() : undefined,
  };
}

/**
 * Generate ARIA attributes for form inputs
 */
export function getInputAriaProps(label, error = '', required = false) {
  const props = {
    'aria-label': label,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required ? 'true' : 'false',
  };

  if (error) {
    props['aria-describedby'] = `${label.replace(/\s+/g, '-').toLowerCase()}-error`;
  }

  return props;
}

/**
 * Generate ARIA attributes for tables
 */
export function getTableAriaProps(caption = '') {
  return {
    role: 'table',
    'aria-label': caption || 'Data table',
  };
}

/**
 * Generate ARIA attributes for progress indicators
 */
export function getProgressAriaProps(value, max = 100, label = 'Progress') {
  return {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': label,
    'aria-valuetext': `${Math.round((value / max) * 100)}% complete`,
  };
}

/**
 * Announce screen reader messages
 */
export function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate ARIA attributes for expandable/collapsible elements
 */
export function getExpandableAriaProps(isExpanded, label) {
  return {
    'aria-expanded': isExpanded ? 'true' : 'false',
    'aria-controls': `${label.replace(/\s+/g, '-').toLowerCase()}-content`,
    'aria-label': isExpanded ? `Collapse ${label}` : `Expand ${label}`,
  };
}

/**
 * Generate ARIA attributes for tabs
 */
export function getTabAriaProps(label, isSelected, panelId) {
  return {
    role: 'tab',
    'aria-selected': isSelected ? 'true' : 'false',
    'aria-controls': panelId,
    'aria-label': label,
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * Generate ARIA attributes for tab panels
 */
export function getTabPanelAriaProps(label, tabId) {
  return {
    role: 'tabpanel',
    'aria-labelledby': tabId,
    'aria-label': `${label} panel`,
    tabIndex: 0,
  };
}

/**
 * Generate ARIA attributes for tooltips
 */
export function getTooltipAriaProps(content) {
  return {
    'aria-label': content,
    'aria-describedby': undefined,
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply focus styles for keyboard navigation
 */
export function applyFocusStyles(element) {
  if (!element) return;

  element.style.outline = '2px solid #22C55E';
  element.style.outlineOffset = '2px';
}

/**
 * Remove focus styles
 */
export function removeFocusStyles(element) {
  if (!element) return;

  element.style.outline = '';
  element.style.outlineOffset = '';
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(container) {
  if (!container) return;

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  container.addEventListener('keydown', (e) => {
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
  });
}

/**
 * Generate ARIA live region for dynamic content updates
 */
export function createLiveRegion() {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  document.body.appendChild(liveRegion);
  return liveRegion;
}
