/**
 * PaymentMethodSelector
 *
 * Renders a grid of PaymentMethodButton components.
 * This is the single shared selector used by:
 *   - PaymentModal (checkout flow)
 *   - classic-pos/ActionButtons
 *   - fastfood-pos/ActionButtons
 *
 * Props:
 *   methods   — array of method ids to display (default: all 6)
 *   selected  — currently selected method id
 *   onSelect  — callback(methodId)
 *   columns   — grid columns (default: 3)
 *   size      — 'compact' | 'normal' | 'large' (default: 'normal')
 *   showLabel — whether to show text label under the logo (default: true)
 */

import React from 'react';
import PaymentMethodButton from './PaymentMethodButton';

export const ALL_METHODS = ['cash', 'gpay', 'phonepay', 'razorpay', 'upi', 'paytm'];

export default function PaymentMethodSelector({
  methods = ALL_METHODS,
  selected,
  onSelect,
  columns,
  size = 'normal',
  showLabel = true,
}) {
  // Default column count: 3 for ≥4 methods, 2 for fewer
  const cols = columns ?? (methods.length >= 4 ? 3 : 2);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: size === 'compact' ? '8px' : size === 'large' ? '14px' : '10px',
  };

  return (
    <div style={gridStyle} role="group" aria-label="Select payment method">
      {methods.map((method) => (
        <PaymentMethodButton
          key={method}
          method={method}
          selected={selected === method}
          onClick={onSelect}
          size={size}
          showLabel={showLabel}
        />
      ))}
    </div>
  );
}
