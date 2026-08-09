/**
 * Fast Food POS Action Buttons
 *
 * Renders the payment method grid using the shared PaymentMethodSelector.
 * Uses 'large' size for the fast-food large-touch-target layout.
 * All styling is theme-aware via --theme-payment-* CSS variables.
 *
 * API is backward-compatible:
 *   buttons       — array of { id, label, style } (used for selection state / subset only)
 *   onButtonClick — callback(methodId)
 */

import React, { useState } from 'react';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';

const BUTTON_ID_MAP = {
  cash:      'cash',
  gpay:      'gpay',
  phonepay:  'phonepay',
  phonePay:  'phonepay',
  razorpay:  'razorpay',
  upi:       'upi',
  paytm:     'paytm',
  other:     'cash',
};

const DEFAULT_METHODS = ['cash', 'gpay', 'phonepay', 'upi'];

export default function ActionButtons({ buttons = [], onButtonClick }) {
  const [selected, setSelected] = useState(null);

  const methods = buttons.length > 0
    ? buttons.map((b) => BUTTON_ID_MAP[b.id] || b.id).filter(Boolean)
    : DEFAULT_METHODS;

  const handleSelect = (methodId) => {
    setSelected(methodId);
    onButtonClick?.(methodId);
  };

  return (
    <PaymentMethodSelector
      methods={methods}
      selected={selected}
      onSelect={handleSelect}
      size="large"
      columns={2}
    />
  );
}
