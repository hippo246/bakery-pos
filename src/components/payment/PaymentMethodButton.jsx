/**
 * PaymentMethodButton
 *
 * A single, reusable payment method button with:
 * - Brand-accurate inline SVG logos for every method
 * - Theme-aware styling via --theme-payment-* CSS variables
 * - Selected state with glow + border highlight
 * - Touch-friendly size with hover/press micro-animations
 *
 * Works on ALL 12 themes automatically.
 */

import React from 'react';

// ─── Brand Logos (inline SVG, no external deps) ──────────────────────────────

const LOGOS = {
  cash: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="2" y="7" width="24" height="14" rx="3" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="4" fill="rgba(255,255,255,0.9)"/>
      <circle cx="5.5" cy="10.5" r="1.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="22.5" cy="17.5" r="1.5" fill="rgba(255,255,255,0.7)"/>
      <text x="14" y="18" textAnchor="middle" fontSize="6" fontWeight="800" fill="#0f766e">₹</text>
    </svg>
  ),

  gpay: (
    <svg width="32" height="18" viewBox="0 0 32 18" fill="none">
      <text x="0" y="14" fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
      </text>
      <text x="0" y="26" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif" fill="rgba(255,255,255,0.9)">Pay</text>
    </svg>
  ),

  phonepay: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="rgba(255,255,255,0.15)"/>
      <path d="M8 6h7a5 5 0 0 1 0 10h-3v6H8V6z" fill="white"/>
      <path d="M12 10h3a1 1 0 0 1 0 2h-3v-2z" fill="#5f259f"/>
    </svg>
  ),

  razorpay: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="6,22 14,4 18,10 12,14 22,14 10,22" fill="white" opacity="0.95"/>
    </svg>
  ),

  upi: (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
      <text x="0" y="15" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif">
        <tspan fill="#FF6B00">U</tspan>
        <tspan fill="#1D9B3A">P</tspan>
        <tspan fill="#0066CC">I</tspan>
      </text>
      <line x1="18" y1="2" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <text x="21" y="12" fontSize="7" fontWeight="600" fontFamily="Arial, sans-serif" fill="rgba(255,255,255,0.85)">INDIA</text>
    </svg>
  ),

  paytm: (
    <svg width="40" height="18" viewBox="0 0 40 18" fill="none">
      <text x="0" y="13" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif" fill="white" letterSpacing="-0.5">Paytm</text>
    </svg>
  ),
};

// ─── Brand Gradients (always visible regardless of theme background) ──────────

const BRAND_GRADIENTS = {
  cash:      'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
  gpay:      'linear-gradient(135deg, #1a73e8 0%, #1558b0 100%)',
  phonepay:  'linear-gradient(135deg, #5f259f 0%, #3b0764 100%)',
  razorpay:  'linear-gradient(135deg, #3395FF 0%, #072654 100%)',
  upi:       'linear-gradient(135deg, #f97316 0%, #b45309 100%)',
  paytm:     'linear-gradient(135deg, #00BAF2 0%, #002970 100%)',
};

const BRAND_SHADOWS = {
  cash:      '0 4px 16px rgba(13,148,136,0.4)',
  gpay:      '0 4px 16px rgba(26,115,232,0.4)',
  phonepay:  '0 4px 16px rgba(95,37,159,0.4)',
  razorpay:  '0 4px 16px rgba(51,149,255,0.4)',
  upi:       '0 4px 16px rgba(249,115,22,0.4)',
  paytm:     '0 4px 16px rgba(0,186,242,0.4)',
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const LABELS = {
  cash:     'Cash',
  gpay:     'GPay',
  phonepay: 'PhonePe',
  razorpay: 'Razorpay',
  upi:      'UPI',
  paytm:    'Paytm',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentMethodButton({
  method,
  selected = false,
  onClick,
  size = 'normal', // 'normal' | 'large' | 'compact'
  showLabel = true,
}) {
  const gradient = BRAND_GRADIENTS[method] || BRAND_GRADIENTS.cash;
  const shadow   = BRAND_SHADOWS[method]   || BRAND_SHADOWS.cash;
  const label    = LABELS[method]          || method;
  const Logo     = LOGOS[method];

  const sizeStyles = {
    compact: { minHeight: '64px', padding: '10px 8px', fontSize: '11px', gap: '6px' },
    normal:  { minHeight: '80px', padding: '14px 10px', fontSize: '12px', gap: '8px' },
    large:   { minHeight: '100px', padding: '18px 14px', fontSize: '13px', gap: '10px' },
  }[size] || { minHeight: '80px', padding: '14px 10px', fontSize: '12px', gap: '8px' };

  const buttonStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeStyles.gap,
    minHeight: sizeStyles.minHeight,
    padding: sizeStyles.padding,
    borderRadius: '14px',
    border: selected
      ? '2px solid var(--theme-payment-selected-border)'
      : '2px solid rgba(255,255,255,0.12)',
    background: gradient,
    cursor: 'pointer',
    boxShadow: selected
      ? `${shadow}, 0 0 0 3px var(--theme-payment-selected-bg)`
      : shadow,
    transform: selected ? 'scale(1.03)' : 'scale(1)',
    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    WebkitTapHighlightColor: 'transparent',
  };

  // Sheen overlay for selected state
  const sheenStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
    borderRadius: '12px 12px 0 0',
    pointerEvents: 'none',
  };

  const labelStyle = {
    fontSize: sizeStyles.fontSize,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: '0.3px',
    lineHeight: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    fontFamily: 'var(--theme-font-family)',
  };

  const selectedBadgeStyle = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '900',
    color: '#059669',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  };

  return (
    <button
      style={buttonStyle}
      onClick={() => onClick?.(method)}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.boxShadow = `${shadow}, 0 8px 24px rgba(0,0,0,0.2)`;
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = shadow;
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = selected ? 'scale(0.99)' : 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = selected ? 'scale(1.03)' : 'scale(1.05) translateY(-2px)';
      }}
      aria-pressed={selected}
      aria-label={`Pay with ${label}`}
    >
      <div style={sheenStyle} />
      {selected && <div style={selectedBadgeStyle}>✓</div>}
      {Logo && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px' }}>{Logo}</div>}
      {showLabel && <span style={labelStyle}>{label}</span>}
    </button>
  );
}
