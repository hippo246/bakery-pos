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

  const customTotal = Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const customRemaining = (cartTotal - customTotal);
  const customIsValid = Math.abs(customRemaining) < 0.01;

  const handleCustomAmountChange = (personIndex, value) => {
    setCustomAmounts(prev => ({ ...prev, [personIndex]: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const canConfirm = mode === 'equal' ? splitCount >= 2 : customIsValid;

  const handleConfirm = () => {
    if (!canConfirm) return;
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
    }}
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="split-bill-title"
        style={{
        background: darkMode ? '#0a0a0a' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '16px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '450px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 id="split-bill-title" style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', margin: 0 }}>
            ✂️ Split Bill
          </h3>
          <button
            onClick={onClose}
            aria-label="Close split bill dialog"
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

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : '#111111',
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
                color: mode === 'equal' ? '#ffffff' : (darkMode ? '#888888' : '#6b7280'),
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
                color: mode === 'custom' ? '#ffffff' : (darkMode ? '#888888' : '#6b7280'),
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
              color: darkMode ? '#e0e0e0' : '#111111',
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
                  background: darkMode ? '#111111' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
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
                color: darkMode ? '#ffffff' : '#0a0a0a'
              }}>
                {splitCount}
              </div>
              <button
                onClick={() => setSplitCount(splitCount + 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: darkMode ? '#111111' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
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

        {mode === 'custom' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#111111'
              }}>
                Amount Per Person
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                  aria-label="Remove person"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: darkMode ? '#111111' : '#f3f4f6',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '13px', color: darkMode ? '#e0e0e0' : '#111111', minWidth: '16px', textAlign: 'center' }}>
                  {splitCount}
                </span>
                <button
                  onClick={() => setSplitCount(splitCount + 1)}
                  aria-label="Add person"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: darkMode ? '#111111' : '#f3f4f6',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: splitCount }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label
                    htmlFor={`person-amount-${i}`}
                    style={{
                      fontSize: '13px',
                      color: darkMode ? '#888888' : '#6b7280',
                      width: '64px',
                      flexShrink: 0
                    }}
                  >
                    Person {i + 1}
                  </label>
                  <input
                    id={`person-amount-${i}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={customAmounts[i] ?? ''}
                    onChange={(e) => handleCustomAmountChange(i, e.target.value)}
                    placeholder="0.00"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: customIsValid ? '#10b981' : '#ef4444'
            }}>
              {customIsValid
                ? 'Amounts match the total ✓'
                : customRemaining > 0
                  ? `₹${customRemaining.toFixed(2)} remaining to allocate`
                  : `₹${Math.abs(customRemaining).toFixed(2)} over the total`}
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
            color: darkMode ? '#888888' : '#6b7280',
            marginBottom: '4px'
          }}>
            Total Bill
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#0a0a0a'
          }}>
            ₹{cartTotal.toFixed(2)}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888888' : '#6b7280',
            marginTop: '8px'
          }}>
            {mode === 'equal'
              ? `₹${perPersonAmount} per person`
              : customIsValid
                ? `Split across ${splitCount} ${splitCount === 1 ? 'person' : 'people'}`
                : `₹${customTotal.toFixed(2)} allocated so far`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#111111' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#0a0a0a',
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
            disabled={!canConfirm}
            style={{
              flex: 1,
              padding: '12px',
              background: canConfirm ? '#6366f1' : (darkMode ? '#111111' : '#e5e7eb'),
              color: canConfirm ? '#ffffff' : (darkMode ? '#888888' : '#9ca3af'),
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
}
