import React from 'react';
import { useState, useCallback, useMemo } from "react";
import { calculateExpectedCash, calculateCashDifference } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function CashDrawer({ shift, setShift, onCountCash }) {
  const [showCountDialog, setShowCountDialog] = useState(false);
  const [countAmount, setCountAmount] = useState('');
  const isMobile = useIsMobile();

  const expectedCash = useMemo(() => {
    return calculateExpectedCash(shift);
  }, [shift]);

  const cashDifference = useMemo(() => {
    return calculateCashDifference(shift);
  }, [shift]);

  const handleCountCash = useCallback(() => {
    const amount = parseFloat(countAmount);
    if (isNaN(amount) || amount < 0) {
      return;
    }

    const updatedShift = {
      ...shift,
      actualCash: amount
    };
    calculateExpectedCash(updatedShift);
    calculateCashDifference(updatedShift);
    
    setShift(updatedShift);
    onCountCash?.(amount);
    setShowCountDialog(false);
    setCountAmount('');
  }, [countAmount, shift, setShift, onCountCash]);

  const getDifferenceColor = (diff) => {
    if (diff === null) return '#95a5a6';
    if (Math.abs(diff) < 1) return '#27ae60';
    if (Math.abs(diff) < 10) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Cash Drawer
        </div>
        <button
          onClick={() => setShowCountDialog(true)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Count Cash
        </button>
      </div>

      {/* Cash Overview */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '24px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '20px'
        }}>
          Cash Overview
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '20px'
        }}>
          <CashRow label="Opening Float" value={shift.openingFloat} />
          <CashRow label="Cash Sales" value={shift.cashSales} />
          <CashRow label="Cash Refunds" value={shift.cashRefunds} type="negative" />
          <CashRow label="Cash Paid Out" value={shift.cashPaidOut} type="negative" />
          <CashRow label="Cash Received" value={shift.cashReceived} />
          <CashRow label="Expected Cash" value={expectedCash} highlight />
        </div>
      </div>

      {/* Cash Count */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '24px',
        border: shift.actualCash === null ? '1px dashed var(--cafe-border-light)' : '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '20px'
        }}>
          Cash Count
        </div>
        {shift.actualCash === null ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--cafe-text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>💰</div>
            <div style={{ fontSize: '14px' }}>Cash has not been counted yet</div>
            <button
              onClick={() => setShowCountDialog(true)}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'var(--cafe-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--cafe-radius-md)',
                cursor: 'pointer'
              }}
            >
              Count Now
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            <CashRow label="Actual Cash" value={shift.actualCash} highlight />
            <CashRow 
              label="Difference" 
              value={cashDifference} 
              type={cashDifference < 0 ? 'negative' : cashDifference > 0 ? 'positive' : 'neutral'}
              highlight
            />
          </div>
        )}
      </div>

      {/* Visual Reconciliation */}
      {shift.actualCash !== null && (
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '24px',
          border: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '20px'
          }}>
            Visual Reconciliation
          </div>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--cafe-text-secondary)',
                marginBottom: '8px'
              }}>
                Expected
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--cafe-text-primary)'
              }}>
                {formatCurrency(expectedCash)}
              </div>
            </div>
            {!isMobile && (
              <div style={{
                fontSize: '24px',
                color: 'var(--cafe-text-secondary)'
              }}>
                →
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--cafe-text-secondary)',
                marginBottom: '8px'
              }}>
                Actual
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--cafe-text-primary)'
              }}>
                {formatCurrency(shift.actualCash)}
              </div>
            </div>
            {!isMobile && (
              <div style={{
                fontSize: '24px',
                color: 'var(--cafe-text-secondary)'
              }}>
                =
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--cafe-text-secondary)',
                marginBottom: '8px'
              }}>
                Difference
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: getDifferenceColor(cashDifference)
              }}>
                {cashDifference < 0 ? '-' : '+'}{formatCurrency(Math.abs(cashDifference))}
              </div>
            </div>
          </div>
          {Math.abs(cashDifference) > 10 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: 'var(--cafe-radius-md)',
              fontSize: '14px',
              color: '#e74c3c'
            }}>
              ⚠️ Large cash difference detected. Please verify count.
            </div>
          )}
        </div>
      )}

      {/* Count Dialog */}
      {showCountDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--cafe-bg-surface)',
            borderRadius: 'var(--cafe-radius-lg)',
            maxWidth: '400px',
            width: '100%',
            padding: '32px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--cafe-text-primary)',
              margin: '0 0 24px 0'
            }}>
              Count Cash
            </h3>
            <div style={{
              marginBottom: '20px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--cafe-text-primary)',
                marginBottom: '8px'
              }}>
                Actual Cash Amount
              </label>
              <input
                type="number"
                value={countAmount}
                onChange={(e) => setCountAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid var(--cafe-border-light)',
                  borderRadius: 'var(--cafe-radius-md)',
                  background: 'var(--cafe-bg-elevated)',
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowCountDialog(false);
                  setCountAmount('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'var(--cafe-bg-elevated)',
                  color: 'var(--cafe-text-primary)',
                  border: '1px solid var(--cafe-border-light)',
                  borderRadius: 'var(--cafe-radius-md)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCountCash}
                disabled={!countAmount || parseFloat(countAmount) < 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'var(--cafe-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-md)',
                  cursor: !countAmount || parseFloat(countAmount) < 0 ? 'not-allowed' : 'pointer',
                  opacity: !countAmount || parseFloat(countAmount) < 0 ? 0.6 : 1
                }}
              >
                Save Count
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CashRow({ label, value, type = 'neutral', highlight = false }) {
  const getValueColor = (type, value) => {
    if (type === 'negative') return '#e74c3c';
    if (type === 'positive') return '#27ae60';
    return 'var(--cafe-text-primary)';
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      background: highlight ? 'var(--cafe-bg-elevated)' : 'transparent',
      borderRadius: 'var(--cafe-radius-md)'
    }}>
      <span style={{
        fontSize: '14px',
        color: 'var(--cafe-text-secondary)'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '16px',
        fontWeight: highlight ? '700' : '500',
        color: getValueColor(type, value)
      }}>
        {type === 'negative' && value > 0 ? '-' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
}

export default CashDrawer;
