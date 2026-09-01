import React, { useState } from 'react';
import Numpad from './Numpad.jsx';

export default function PaymentModal({
  show,
  onClose,
  paymentMethod,
  onPaymentMethodChange,
  paymentAmount = '',
  onPaymentAmountChange,
  cartTotal = 0,
  discount = 0,
  tipAmount = 0,
  onTipAmountChange,
  gstRate = 0,
  onGstRateChange,
  onCheckout,
  screenSize = 'large',
  darkMode = true
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!show) return null;

  const cartSubtotal = cartTotal - (cartTotal * discount / 100);
  const taxAmount = (cartSubtotal * gstRate) / 100;
  const finalTotal = cartSubtotal + taxAmount + tipAmount;
  const diff = (parseFloat(paymentAmount) || 0) - finalTotal;
  const formatMoney = (value) => value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // SPLIT is handled by a separate split-bill flow, so it doesn't need a tendered amount here.
  const isAmountValid = paymentMethod === 'SPLIT' || (!!paymentAmount && parseFloat(paymentAmount) >= finalTotal);

  const handleNumpadPress = (value) => {
    const current = paymentAmount || '';
    if (value === 'C') {
      onPaymentAmountChange('');
    } else if (value === '⌫') {
      onPaymentAmountChange(current.length > 1 ? current.slice(0, -1) : '');
    } else if (value === '.') {
      onPaymentAmountChange(current.includes('.') ? current : current + '.');
    } else {
      const decimalIndex = current.indexOf('.');
      if (decimalIndex !== -1 && current.length - decimalIndex > 2) return;
      onPaymentAmountChange((!current || current === '0') ? value : current + value);
    }
  };

  const handleQuickAmount = (value) => {
    onPaymentAmountChange(value.toFixed(2));
  };

  const handleCheckoutClick = () => {
    if (!isAmountValid || isProcessing) return;
    setIsProcessing(true);
    onCheckout();
  };

  return (
    <div
      style={{
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
    }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        style={{
        background: darkMode ? '#0a0a0a' : '#ffffff',
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
          <h3 id="payment-modal-title" style={{
            fontSize: screenSize === 'small' ? '18px' : '20px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#0a0a0a',
            margin: 0
          }}>
            💳 Payment
          </h3>
          <button
            onClick={onClose}
            aria-label="Close payment dialog"
            style={{
              padding: '8px 12px',
              background: darkMode ? '#111111' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#0a0a0a',
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
            <span>₹{formatMoney(cartSubtotal)}</span>
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
              <span>-₹{formatMoney(cartSubtotal * discount / 100)}</span>
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
            <span>₹{formatMoney(taxAmount)}</span>
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
              <span>₹{formatMoney(tipAmount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
            fontSize: '18px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#0a0a0a'
          }}>
            <span>Total</span>
            <span>₹{formatMoney(finalTotal)}</span>
          </div>
        </div>

        {/* Tip (only rendered if the parent supports editing it here) */}
        {onTipAmountChange && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#111111',
              marginBottom: '12px'
            }}>
              Tip
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0, 5, 10, 15].map(pct => {
                const amt = Math.round((cartSubtotal * pct) / 100 * 100) / 100;
                const isActive = Math.abs(tipAmount - amt) < 0.01;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onTipAmountChange(amt)}
                    aria-pressed={isActive}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      background: isActive ? '#ec4899' : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                      color: isActive ? '#ffffff' : (darkMode ? '#888888' : '#6b7280'),
                      border: isActive ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {pct === 0 ? 'No Tip' : `${pct}%`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GST Rate (only rendered if the parent supports editing it here) */}
        {onGstRateChange && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#111111',
              marginBottom: '12px'
            }}>
              GST Rate
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0, 5, 12, 18].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onGstRateChange(rate)}
                  aria-pressed={gstRate === rate}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    background: gstRate === rate ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                    color: gstRate === rate ? '#ffffff' : (darkMode ? '#888888' : '#6b7280'),
                    border: gstRate === rate ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : '#111111',
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
                aria-pressed={paymentMethod === method}
                style={{
                  padding: '12px',
                  background: paymentMethod === method 
                    ? (darkMode ? '#6366f1' : '#6366f1')
                    : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                  color: paymentMethod === method 
                    ? '#ffffff' 
                    : (darkMode ? '#888888' : '#6b7280'),
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
              color: darkMode ? '#e0e0e0' : '#111111',
              marginBottom: '12px'
            }}>
              Amount Tendered
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px'
            }}>
              {[finalTotal, ...[100, 200, 500, 1000, 2000].filter(v => v >= finalTotal)]
                .slice(0, 4)
                .map((amt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  style={{
                    padding: '6px 12px',
                    background: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                    borderRadius: '999px',
                    color: darkMode ? '#e0e0e0' : '#111111',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {i === 0 ? `Exact ₹${formatMoney(amt)}` : `₹${amt.toLocaleString('en-IN')}`}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={paymentAmount}
              onChange={(e) => onPaymentAmountChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAmountValid) handleCheckoutClick();
              }}
              placeholder="Enter amount"
              aria-label="Amount tendered"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: darkMode ? '#0a0a0a' : '#ffffff',
                border: `1px solid ${darkMode ? '#111111' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                outline: 'none'
              }}
            />
            {paymentAmount && diff >= 0 && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: darkMode ? 'rgba(5,150,105,0.15)' : 'rgba(16,185,129,0.1)',
                borderRadius: '6px',
                fontSize: '14px',
                color: darkMode ? '#34d399' : '#10b981',
                fontWeight: '600'
              }}>
                Change: ₹{formatMoney(diff)}
              </div>
            )}
            {paymentAmount && diff < 0 && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: darkMode ? 'rgba(220,38,38,0.15)' : 'rgba(239,68,68,0.1)',
                borderRadius: '6px',
                fontSize: '14px',
                color: darkMode ? '#f87171' : '#ef4444',
                fontWeight: '600'
              }}>
                Short by ₹{formatMoney(Math.abs(diff))}
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
          onClick={handleCheckoutClick}
          disabled={!isAmountValid || isProcessing}
          style={{
            width: '100%',
            padding: '16px',
            background: (!isAmountValid || isProcessing)
              ? (darkMode ? '#111111' : '#d1d5db')
              : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: (!isAmountValid || isProcessing) ? 'not-allowed' : 'pointer',
            marginTop: '16px',
            transition: 'all 0.2s'
          }}
        >
          {isProcessing ? 'Processing…' : paymentMethod === 'SPLIT' ? 'Continue to Split' : 'Complete Payment'}
        </button>
      </div>
    </div>
  );
}
