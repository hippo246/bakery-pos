import React, { useState } from 'react';

export default function SplitBillModal({
  show,
  onClose,
  cart,
  onConfirmSplit,
  screenSize = 'large',
  darkMode = true
}) {
  const [mode, setMode] = useState('equal');
  const [splitCount, setSplitCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState({});

  if (!show) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const perPersonAmount = mode === 'equal' ? (cartTotal / splitCount).toFixed(2) : cartTotal.toFixed(2);

  const handleConfirm = () => {
    onConfirmSplit(mode === 'equal' ? splitCount : customAmounts);
    onClose();
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
        width: screenSize === 'small' ? '100vw' : '450px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937', margin: 0 }}>
            ✂️ Split Bill
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

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : '#374151',
            marginBottom: '12px'
          }}>
            Split Mode
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMode('equal')}
              style={{
                flex: 1,
                padding: '12px',
                background: mode === 'equal' ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                color: mode === 'equal' ? '#ffffff' : (darkMode ? '#8b8b9e' : '#6b7280'),
                border: mode === 'equal' ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Equal Split
            </button>
            <button
              onClick={() => setMode('custom')}
              style={{
                flex: 1,
                padding: '12px',
                background: mode === 'custom' ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                color: mode === 'custom' ? '#ffffff' : (darkMode ? '#8b8b9e' : '#6b7280'),
                border: mode === 'custom' ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Custom Amounts
            </button>
          </div>
        </div>

        {mode === 'equal' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#374151',
              marginBottom: '12px'
            }}>
              Number of People
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  background: darkMode ? '#374151' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <div style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: darkMode ? '#ffffff' : '#1f2937'
              }}>
                {splitCount}
              </div>
              <button
                onClick={() => setSplitCount(splitCount + 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: darkMode ? '#374151' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        <div style={{
          background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginBottom: '4px'
          }}>
            Total Bill
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#1f2937'
          }}>
            ₹{cartTotal.toFixed(2)}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginTop: '8px'
          }}>
            {mode === 'equal' ? `₹${perPersonAmount} per person` : 'Custom split'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
}
