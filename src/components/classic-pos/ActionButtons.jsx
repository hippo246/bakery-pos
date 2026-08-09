/**
 * Classic POS Action Buttons
 *
 * Renders the payment method grid using the shared PaymentMethodSelector.
 * All button styling comes from PaymentMethodButton which uses
 * --theme-payment-* CSS variables, so it works on every theme.
 *
 * API is backward-compatible:
 *   buttons      — array of { id, label, style } (used for selection state only)
 *   onButtonClick — callback(methodId)
 */

import { useState } from 'react';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';

// Map old-style button ids to new unified method ids
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

const DEFAULT_METHODS = ['cash', 'gpay', 'phonepay', 'razorpay', 'upi', 'paytm'];

export default function ActionButtons({ buttons = [], onButtonClick }) {
  const [selected, setSelected] = useState(null);

  // Derive method list from buttons prop (if provided), else show all 6
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
      size="normal"
    />
  );
}
