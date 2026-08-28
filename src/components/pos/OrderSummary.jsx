import React from 'react';

export default function OrderSummary({
  cart,
  discount,
  gstRate,
  gstEnabled,
  tipAmount,
  screenSize = 'large',
  darkMode = true
}) {
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (cartSubtotal * discount) / 100;
  const taxableAmount = cartSubtotal - discountAmount;
  const taxAmount = gstEnabled ? (taxableAmount * gstRate) / 100 : 0;
  const total = taxableAmount + taxAmount + tipAmount;

  return (
    <div style={{
      background: darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: darkMode ? '#e0e0e0' : '#374151',
        marginBottom: '4px'
      }}>
        Order Summary
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: darkMode ? '#9ca3af' : '#6b7280'
      }}>
        <span>Subtotal</span>
        <span>₹{cartSubtotal.toFixed(2)}</span>
      </div>

      {discount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: darkMode ? '#f59e0b' : '#d97706'
        }}>
          <span>Discount ({discount}%)</span>
          <span>-₹{discountAmount.toFixed(2)}</span>
        </div>
      )}

      {gstEnabled && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: darkMode ? '#9ca3af' : '#6b7280'
        }}>
          <span>GST ({gstRate}%)</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
      )}

      {tipAmount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: darkMode ? '#ec4899' : '#db2777'
        }}>
          <span>Tip</span>
          <span>₹{tipAmount.toFixed(2)}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '12px',
        marginTop: '4px',
        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
        fontSize: screenSize === 'small' ? '18px' : '20px',
        fontWeight: '700',
        color: darkMode ? '#ffffff' : '#1f2937'
      }}>
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
