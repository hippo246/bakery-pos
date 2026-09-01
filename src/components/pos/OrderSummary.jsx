import React from 'react';

export default function OrderSummary({
  cart = [],
  discount = 0,
  gstRate = 0,
  gstEnabled,
  tipAmount = 0,
  screenSize = 'large',
  darkMode = true
}) {
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = Math.min(cartSubtotal, (cartSubtotal * discount) / 100);
  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const cgstAmount = gstEnabled ? (taxableAmount * gstRate) / 200 : 0;
  const sgstAmount = cgstAmount;
  const taxAmount = cgstAmount + sgstAmount;
  const total = taxableAmount + taxAmount + tipAmount;
  const roundedTotal = Math.round(total);
  const roundOffAmount = roundedTotal - total;
  const formatMoney = (value) => value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        color: darkMode ? '#e0e0e0' : '#111111',
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
        <span>Subtotal {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}</span>
        <span>₹{formatMoney(cartSubtotal)}</span>
      </div>

      {discount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: darkMode ? '#f59e0b' : '#d97706'
        }}>
          <span>Discount ({discount}%)</span>
          <span title={`You saved ₹${formatMoney(discountAmount)}`}>-₹{formatMoney(discountAmount)}</span>
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
          <span>₹{formatMoney(taxAmount)}</span>
        </div>
      )}

      {gstEnabled && taxAmount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: darkMode ? '#6b7280' : '#9ca3af',
          paddingLeft: '8px'
        }}>
          <span>CGST {(gstRate / 2).toFixed(1)}% + SGST {(gstRate / 2).toFixed(1)}%</span>
          <span>₹{formatMoney(cgstAmount)} + ₹{formatMoney(sgstAmount)}</span>
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
          <span>₹{formatMoney(tipAmount)}</span>
        </div>
      )}

      {Math.abs(roundOffAmount) >= 0.005 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: darkMode ? '#9ca3af' : '#6b7280'
        }}>
          <span>Round Off</span>
          <span>{roundOffAmount >= 0 ? '+' : '-'}₹{formatMoney(Math.abs(roundOffAmount))}</span>
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        title={Math.abs(roundOffAmount) >= 0.005 ? `Before rounding: ₹${formatMoney(total)}` : undefined}
        style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '12px',
        marginTop: '4px',
        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
        fontSize: screenSize === 'small' ? '18px' : '20px',
        fontWeight: '700',
        color: darkMode ? '#ffffff' : '#0a0a0a'
      }}>
        <span>Total</span>
        <span>₹{formatMoney(roundedTotal)}</span>
      </div>
    </div>
  );
}
