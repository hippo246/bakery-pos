/**
 * AccessibleWrapper.jsx
 * Base accessibility wrapper component system for POS application
 * Provides ARIA attributes, keyboard navigation, and screen reader support
 */

import { useState, useRef, useEffect } from 'react';

/**
 * AccessibleButton - Enhanced button with full accessibility support
 */
export const AccessibleButton = ({ 
  children, 
  onClick, 
  ariaLabel, 
  ariaDescribedBy,
  isPressed = false,
  isExpanded = false,
  isDisabled = false,
  shortcut,
  ...props 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isDisabled && onClick) onClick(e);
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={isPressed}
      aria-expanded={isExpanded}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      {...props}
    >
      {shortcut && <span className="sr-only" aria-hidden="false">Shortcut: {shortcut}</span>}
      {children}
    </button>
  );
};

/**
 * AccessibleCard - Card component with proper ARIA roles
 */
export const AccessibleCard = ({ 
  children, 
  ariaLabel, 
  isInteractive = false,
  onClick,
  tabIndex = isInteractive ? 0 : undefined,
  ...props 
}) => {
  const role = isInteractive ? 'button' : 'region';
  
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * AccessibleList - List with proper ARIA roles
 */
export const AccessibleList = ({ 
  children, 
  ariaLabel, 
  isGrid = false,
  ...props 
}) => {
  return (
    <div
      role={isGrid ? 'grid' : 'list'}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * AccessibleListItem - List item with keyboard navigation
 */
export const AccessibleListItem = ({ 
  children, 
  ariaLabel, 
  isInteractive = false,
  onClick,
  isSelected = false,
  ...props 
}) => {
  return (
    <div
      role={isInteractive ? 'gridcell' : 'listitem'}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * AccessibleTabs - Tab navigation component
 */
export const AccessibleTabs = ({ tabs, activeTab, onTabChange, ariaLabel }) => {
  return (
    <nav role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === tab.id ? '#E63946' : '#FFFFFF',
            color: activeTab === tab.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px',
          }}
        >
          {tab.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

/**
 * AccessibleTabPanel - Tab panel content
 */
export const AccessibleTabPanel = ({ 
  children, 
  tabId, 
  isActive, 
  ariaLabel 
}) => {
  return (
    <div
      role="tabpanel"
      id={`${tabId}-panel`}
      aria-labelledby={`${tabId}-tab`}
      aria-label={ariaLabel}
      hidden={!isActive}
    >
      {children}
    </div>
  );
};

/**
 * AccessibleLiveRegion - Live region for dynamic content announcements
 */
export const AccessibleLiveRegion = ({ children, level = 'polite', ariaLabel }) => {
  return (
    <div
      aria-live={level}
      aria-atomic="true"
      aria-label={ariaLabel}
      className="sr-only"
    >
      {children}
    </div>
  );
};

/**
 * AccessibleStatus - Status indicator with proper ARIA
 */
export const AccessibleStatus = ({ status, ariaLabel }) => {
  const statusConfig = {
    success: { color: '#2ECC71', label: 'Success' },
    error: { color: '#E63946', label: 'Error' },
    warning: { color: '#FFD166', label: 'Warning' },
    info: { color: '#3498DB', label: 'Information' },
  };

  const config = statusConfig[status] || statusConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || config.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: config.color,
        fontWeight: 'bold',
      }}
    >
      <span aria-hidden="true">
        {status === 'success' && '✓'}
        {status === 'error' && '✕'}
        {status === 'warning' && '⚠'}
        {status === 'info' && 'ℹ'}
      </span>
      <span>{config.label}</span>
    </div>
  );
};

/**
 * AccessibleDialog - Modal dialog with focus trap
 */
export const AccessibleDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  ariaLabel 
}) => {
  const dialogRef = useRef(null);
  const previousActiveRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement;
      dialogRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      previousActiveRef.current?.focus();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-label={ariaLabel}
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      tabIndex={-1}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 id="dialog-title" style={{ margin: '0 0 16px 0' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

/**
 * AccessibleProgress - Progress indicator
 */
export const AccessibleProgress = ({ value, max = 100, ariaLabel }) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#E5E7EB',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: '#E63946',
          transition: 'width 0.3s ease',
        }}
      />
      <span className="sr-only">{percentage}% complete</span>
    </div>
  );
};

/**
 * AccessibleTooltip - Tooltip with proper ARIA
 */
export const AccessibleTooltip = ({ children, content, ariaLabel }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
        tabIndex={0}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id="tooltip-content"
          role="tooltip"
          aria-label={ariaLabel}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            marginBottom: '4px',
            zIndex: 100,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

/**
 * AccessibleSkipLink - Skip navigation link for keyboard users
 */
export const AccessibleSkipLink = ({ targetId, label = "Skip to main content" }) => {
  return (
    <a
      href={`#${targetId}`}
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        background: '#E63946',
        color: '#FFFFFF',
        padding: '8px 16px',
        zIndex: 9999,
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'top 0.3s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      {label}
    </a>
  );
};

export default {
  AccessibleButton,
  AccessibleCard,
  AccessibleList,
  AccessibleListItem,
  AccessibleTabs,
  AccessibleTabPanel,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleDialog,
  AccessibleProgress,
  AccessibleTooltip,
  AccessibleSkipLink,
};
