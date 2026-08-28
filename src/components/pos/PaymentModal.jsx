import React from 'react';
import Numpad from './Numpad.jsx';

export default function PaymentModal({
  show,
  onClose,
  paymentMethod,
  onPaymentMethodChange,
  paymentAmount,
  onPaymentAmountChange,
  cartTotal,
  discount,
  tipAmount,
  onTipAmountChange,
  gstRate,
  onGstRateChange,
  onCheckout,
  screenSize = 'large',
  darkMode = true
}) {
  if (!show) return null;

  const cartSubtotal = cartTotal - (cartTotal * discount / 100);
  const taxAmount = (cartSubtotal * gstRate) / 100;
  const finalTotal = cartSubtotal + taxAmount + tipAmount;
  const diff = (parseFloat(paymentAmount) || 0) - finalTotal;

  const handleNumpadPress = (value) => {
    if (value === 'C') {
      onPaymentAmountChange('');
    } else if (value === '⌫') {
      onPaymentAmountChange(prev => prev.length > 1 ? prev.slice(0, -1) : '');
    } else if (value === '.') {
      onPaymentAmountChange(prev => prev.includes('.') ? prev : prev + '.');
    } else {
      onPaymentAmountChange(prev => (!prev || prev === '0') ? value : prev + value);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: screenSize === 'small' ? '0' : '16px'
    }}>
      <div style={{
        background: darkMode ? '#1f2937' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '16px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '500px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        maxHeight: screenSize === 'small' ? '100vh' : '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: screenSize === 'small' ? '18px' : '20px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#1f2937',
            margin: 0
          }}>
            💳 Payment
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '700'
            }}
          >
            ×
          </button>
        </div>

        {/* Order Summary */}
        <div style={{
          background: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            color: darkMode ? '#9ca3af' : '#6b7280'
          }}>
            <span>Subtotal</span>
            <span>₹{cartSubtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: darkMode ? '#f59e0b' : '#d97706'
            }}>
              <span>Discount ({discount}%)</span>
              <span>-₹{(cartSubtotal * discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            color: darkMode ? '#9ca3af' : '#6b7280'
          }}>
            <span>GST ({gstRate}%)</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
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
            borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
            fontSize: '18px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#1f2937'
          }}>
            <span>Total</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : '#374151',
            marginBottom: '12px'
          }}>
            Payment Method
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {['CASH', 'CARD', 'UPI', 'UPI_QR', 'SPLIT'].map(method => (
              <button
                key={method}
                onClick={() => onPaymentMethodChange(method)}
                style={{
                  padding: '12px',
                  background: paymentMethod === method 
                    ? (darkMode ? '#6366f1' : '#6366f1')
                    : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                  color: paymentMethod === method 
                    ? '#ffffff' 
                    : (darkMode ? '#8b8b9e' : '#6b7280'),
                  border: paymentMethod === method 
                    ? 'none' 
                    : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: paymentMethod === method ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {method === 'CASH' && '💵 Cash'}
                {method === 'CARD' && '💳 Card'}
                {method === 'UPI' && '📱 UPI'}
                {method === 'UPI_QR' && '📷 UPI QR'}
                {method === 'SPLIT' && '✂️ Split'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        {paymentMethod !== 'SPLIT' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#374151',
              marginBottom: '12px'
            }}>
              Amount Tendered
            </label>
            <input
              type="text"
              value={paymentAmount}
              onChange={(e) => onPaymentAmountChange(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                color: darkMode ? '#ffffff' : '#1f2937',
                outline: 'none'
              }}
            />
            {diff >= 0 && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(16,185,129,0.1)',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#10b981',
                fontWeight: '600'
              }}>
                Change: ₹{diff.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Numpad */}
        {paymentMethod !== 'SPLIT' && (
          <Numpad
            onKeyPress={handleNumpadPress}
            mode="amount"
            screenSize={screenSize}
            darkMode={darkMode}
          />
        )}

        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          disabled={!paymentAmount || parseFloat(paymentAmount) < finalTotal}
          style={{
            width: '100%',
            padding: '16px',
            background: (!paymentAmount || parseFloat(paymentAmount) < finalTotal)
              ? (darkMode ? '#374151' : '#d1d5db')
              : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: (!paymentAmount || parseFloat(paymentAmount) < finalTotal) ? 'not-allowed' : 'pointer',
            marginTop: '16px',
            transition: 'all 0.2s'
          }}
        >
          Complete Payment
        </button>
      </div>
    </div>
  );
}
