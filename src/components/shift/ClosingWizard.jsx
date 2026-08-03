import React from 'react';
import { useState, useCallback } from "react";
import { validateShiftForClosing, closeShift, calculateExpectedCash, calculateCashDifference } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";

function ClosingWizard({ shift, setShift, context, currentUser, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    actualCash: null,
    managerNotes: '',
    confirmClose: false
  });
  const [validation, setValidation] = useState(null);

  const totalSteps = 6;

  const handleNext = useCallback(() => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  const handleCloseShift = useCallback(() => {
    if (!formData.confirmClose) {
      return;
    }

    const closeData = {
      closedAt: new Date().toISOString(),
      closingFloat: formData.actualCash,
      actualCash: formData.actualCash,
      managerNotes: formData.managerNotes,
      closedBy: currentUser?.id || 'SYSTEM',
      closedByName: currentUser?.name || 'System'
    };

    const updatedShift = closeShift({ ...shift }, closeData);
    setShift(updatedShift);
    onComplete?.(updatedShift);
    onClose();
  }, [formData, shift, setShift, currentUser, onComplete, onClose]);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
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
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--cafe-text-primary)',
              margin: 0
            }}>
              Close Shift
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--cafe-text-secondary)',
              margin: '4px 0 0 0'
            }}>
              Step {step} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--cafe-text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            gap: '4px'
          }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '4px',
                  background: idx + 1 <= step ? 'var(--cafe-primary)' : 'var(--cafe-border-light)',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <Step1ReviewSales shift={shift} onNext={handleNext} />
        )}
        {step === 2 && (
          <Step2CountCash 
            shift={shift} 
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step3VerifyPayments shift={shift} onNext={handleNext} onBack={handleBack} />
        )}
        {step === 4 && (
          <Step4PaidOutsDrops shift={shift} onNext={handleNext} onBack={handleBack} />
        )}
        {step === 5 && (
          <Step5Issues 
            shift={shift} 
            context={context}
            validation={validation}
            setValidation={setValidation}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 6 && (
          <Step6Confirm 
            shift={shift}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
            onClose={handleCloseShift}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}

function Step1ReviewSales({ shift, onNext }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Review Sales
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          <StatBox label="Gross Sales" value={formatCurrency(shift.grossSales)} />
          <StatBox label="Net Sales" value={formatCurrency(shift.netSales)} />
          <StatBox label="Orders" value={shift.orderCount} />
          <StatBox label="Avg Order" value={formatCurrency(shift.averageOrderValue)} />
        </div>
      </div>

      <div style={{
        background: 'var(--cafe-bg-elevated)',
        borderRadius: 'var(--cafe-radius-md)',
        padding: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '12px'
        }}>
          Adjustments
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Discounts</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
              {formatCurrency(shift.discounts)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Voids</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
              {formatCurrency(shift.voids)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Refunds</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
              {formatCurrency(shift.refunds)}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          background: 'var(--cafe-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--cafe-radius-md)',
          cursor: 'pointer',
          alignSelf: 'flex-end'
        }}
      >
        Next
      </button>
    </div>
  );
}

function Step2CountCash({ shift, formData, setFormData, onNext, onBack }) {
  const expectedCash = calculateExpectedCash(shift);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Count Cash
        </h3>
        <div style={{
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>Expected Cash</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
              {formatCurrency(expectedCash)}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            Opening Float + Cash Sales - Cash Refunds - Paid Outs
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            Actual Cash Count *
          </label>
          <input
            type="number"
            value={formData.actualCash || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, actualCash: parseFloat(e.target.value) || null }))}
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

        {formData.actualCash !== null && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: Math.abs(formData.actualCash - expectedCash) < 10 ? '#d4edda' : '#fff3cd',
            border: Math.abs(formData.actualCash - expectedCash) < 10 ? '1px solid #c3e6cb' : '1px solid #ffc107',
            borderRadius: 'var(--cafe-radius-md)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: Math.abs(formData.actualCash - expectedCash) < 10 ? '#155724' : '#856404'
            }}>
              Difference: {formatCurrency(formData.actualCash - expectedCash)}
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={formData.actualCash === null}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: formData.actualCash === null ? 'not-allowed' : 'pointer',
            opacity: formData.actualCash === null ? 0.6 : 1
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step3VerifyPayments({ shift, onNext, onBack }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Verify Payments
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {Object.entries(shift.payments || {}).map(([type, data]) => (
            <div
              key={type}
              style={{
                background: 'var(--cafe-bg-elevated)',
                borderRadius: 'var(--cafe-radius-md)',
                padding: '12px'
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '4px' }}>
                {type.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                {formatCurrency(data.expected)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step4PaidOutsDrops({ shift, onNext, onBack }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Paid Outs & Cash Drops
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            Paid Outs ({shift.paidOuts?.length || 0})
          </div>
          {shift.paidOuts?.length === 0 ? (
            <div style={{
              padding: '12px',
              background: 'var(--cafe-bg-elevated)',
              borderRadius: 'var(--cafe-radius-md)',
              fontSize: '14px',
              color: 'var(--cafe-text-secondary)'
            }}>
              No paid outs recorded
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {shift.paidOuts.map((po, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  background: 'var(--cafe-bg-elevated)',
                  borderRadius: 'var(--cafe-radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{po.category.replace('_', ' ')}</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(po.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            Cash Drops ({shift.cashDrops?.length || 0})
          </div>
          {shift.cashDrops?.length === 0 ? (
            <div style={{
              padding: '12px',
              background: 'var(--cafe-bg-elevated)',
              borderRadius: 'var(--cafe-radius-md)',
              fontSize: '14px',
              color: 'var(--cafe-text-secondary)'
            }}>
              No cash drops recorded
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {shift.cashDrops.map((cd, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  background: 'var(--cafe-bg-elevated)',
                  borderRadius: 'var(--cafe-radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{cd.type.replace('_', ' ')}</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(cd.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step5Issues({ shift, context, validation, setValidation, onNext, onBack }) {
  const validationResult = validation || validateShiftForClosing(shift, context);

  if (!validation) {
    setValidation(validationResult);
  }

  const canClose = validationResult.canClose;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Issues Check
        </h3>

        {!canClose && validationResult.issues.length > 0 && (
          <div style={{
            background: '#fee',
            border: '1px solid #e74c3c',
            borderRadius: 'var(--cafe-radius-md)',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#e74c3c',
              marginBottom: '8px'
            }}>
              🚨 Cannot Close Shift
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#e74c3c'
            }}>
              {validationResult.issues.map((issue, idx) => (
                <li key={idx}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: 'var(--cafe-radius-md)',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#856404',
              marginBottom: '8px'
            }}>
              ⚠️ Warnings
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#856404'
            }}>
              {validationResult.warnings.map((warning, idx) => (
                <li key={idx}>{warning.message}</li>
              ))}
            </ul>
          </div>
        )}

        {canClose && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #28a745',
            borderRadius: 'var(--cafe-radius-md)',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#155724'
            }}>
              ✅ Ready to Close
            </div>
            <div style={{
              fontSize: '14px',
              color: '#155724',
              marginTop: '4px'
            }}>
              All checks passed. You can proceed to close the shift.
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canClose}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: canClose ? 'var(--cafe-primary)' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: canClose ? 'pointer' : 'not-allowed',
            opacity: canClose ? 1 : 0.6
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step6Confirm({ shift, formData, setFormData, validation, onClose, onBack }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: '0 0 16px 0'
        }}>
          Final Confirmation
        </h3>

        <div style={{
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Net Sales</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                {formatCurrency(shift.netSales)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Cash Count</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                {formatCurrency(formData.actualCash)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Orders</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                {shift.orderCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>Duration</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                {Math.floor((new Date() - new Date(shift.openedAt)) / 60000)}m
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            Manager Notes
          </label>
          <textarea
            value={formData.managerNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, managerNotes: e.target.value }))}
            placeholder="Any notes for this shift..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-md)',
              background: 'var(--cafe-bg-elevated)',
              color: 'var(--cafe-text-primary)',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <input
            type="checkbox"
            id="confirmClose"
            checked={formData.confirmClose}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmClose: e.target.checked }))}
            style={{
              width: '18px',
              height: '18px'
            }}
          />
          <label htmlFor="confirmClose" style={{
            fontSize: '14px',
            color: '#856404',
            cursor: 'pointer'
          }}>
            I confirm that all information is correct and I want to close this shift.
          </label>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={onClose}
          disabled={!formData.confirmClose}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            background: !formData.confirmClose ? '#95a5a6' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: !formData.confirmClose ? 'not-allowed' : 'pointer',
            opacity: !formData.confirmClose ? 0.6 : 1
          }}
        >
          Close Shift
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      padding: '16px'
    }}>
      <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

export default ClosingWizard;
