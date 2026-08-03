import React from 'react';
// Reusable Tooltip component for help tooltips
import { useState, useCallback, useRef, useEffect } from "react";

export default function Tooltip({ content, position = 'top', children }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  // Stable per-instance id so multiple Tooltips on one page don't collide
  // when wiring aria-describedby.
  const [tooltipId] = useState(() => `tooltip-${Math.random().toString(36).slice(2, 9)}`);

  const toggleTooltip = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const closeTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Hover support with a short open/close delay - a "Tooltip" that only
  // responds to clicks doesn't match how tooltips are expected to behave.
  // The delay on close lets the pointer travel from the trigger into the
  // tooltip body (e.g. to select text) without it vanishing first, and the
  // delay on open avoids flashing a tooltip on every incidental mouse pass.
  const hoverTimeoutRef = useRef(null);
  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);
  const handleMouseEnter = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => setIsVisible(true), 150);
  }, [clearHoverTimeout]);
  const handleMouseLeave = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => setIsVisible(false), 150);
  }, [clearHoverTimeout]);
  useEffect(() => clearHoverTimeout, [clearHoverTimeout]);

  const handleClickOutside = useCallback((event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
        triggerRef.current && !triggerRef.current.contains(event.target)) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isVisible, handleClickOutside]);

  // Escape closes the tooltip and returns focus to the trigger, matching
  // standard disclosure-widget behavior (previously unimplemented).
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeTooltip();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, closeTooltip]);

  const handleTriggerKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTooltip();
    }
  }, [toggleTooltip]);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 1000,
      maxWidth: 280,
      background: '#1f2937',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 13,
      lineHeight: 1.5,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    };

    switch (position) {
      case 'top':
        return { ...baseStyles, bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { ...baseStyles, top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { ...baseStyles, right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { ...baseStyles, left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      default:
        return { ...baseStyles, bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  // Previously this returned a fixed { border: '6px solid transparent' } with
  // no position or color override, so the arrow was invisible in every case.
  const getArrowStyles = () => {
    const base = { position: 'absolute', width: 0, height: 0 };
    switch (position) {
      case 'top':
        return { ...base, bottom: -6, left: '50%', transform: 'translateX(-50%)',
          borderWidth: '6px 6px 0 6px', borderStyle: 'solid',
          borderColor: '#1f2937 transparent transparent transparent' };
      case 'bottom':
        return { ...base, top: -6, left: '50%', transform: 'translateX(-50%)',
          borderWidth: '0 6px 6px 6px', borderStyle: 'solid',
          borderColor: 'transparent transparent #1f2937 transparent' };
      case 'left':
        return { ...base, right: -6, top: '50%', transform: 'translateY(-50%)',
          borderWidth: '6px 0 6px 6px', borderStyle: 'solid',
          borderColor: 'transparent transparent transparent #1f2937' };
      case 'right':
        return { ...base, left: -6, top: '50%', transform: 'translateY(-50%)',
          borderWidth: '6px 6px 6px 0', borderStyle: 'solid',
          borderColor: 'transparent #1f2937 transparent transparent' };
      default:
        return { ...base, bottom: -6, left: '50%', transform: 'translateX(-50%)',
          borderWidth: '6px 6px 0 6px', borderStyle: 'solid',
          borderColor: '#1f2937 transparent transparent transparent' };
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children ? (
        // Custom trigger content, e.g. an icon passed in by the caller.
        // Previously `children` was destructured but never rendered, so any
        // custom trigger a caller passed in silently disappeared.
        <span
          ref={triggerRef}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isVisible}
          aria-describedby={isVisible ? tooltipId : undefined}
          onClick={toggleTooltip}
          onKeyDown={handleTriggerKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'inline-block', cursor: 'pointer' }}
        >
          {children}
        </span>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-label="More information"
          aria-haspopup="true"
          aria-expanded={isVisible}
          aria-describedby={isVisible ? tooltipId : undefined}
          onClick={toggleTooltip}
          onKeyDown={handleTriggerKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--cafe-accent-bg)',
            border: '1px solid var(--cafe-accent)',
            color: 'var(--cafe-accent)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 8,
            padding: 0,
            font: 'inherit',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--cafe-accent)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--cafe-accent-bg)';
            e.currentTarget.style.color = 'var(--cafe-accent)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--cafe-accent-bg)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ?
        </button>
      )}

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ ...getPositionStyles(), animation: 'tooltipFadeIn 0.12s ease-out' }}
        >
          {content}
          <div style={getArrowStyles()} />
        </div>
      )}
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: ${
            position === 'left' ? 'translateY(-50%) translateX(4px)' :
            position === 'right' ? 'translateY(-50%) translateX(-4px)' :
            position === 'bottom' ? 'translateX(-50%) translateY(-4px)' :
            'translateX(-50%) translateY(4px)'
          }; }
          to { opacity: 1; transform: ${
            position === 'left' || position === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
          }; }
        }
      `}</style>
    </div>
  );
}
