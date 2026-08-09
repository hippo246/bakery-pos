import React from 'react';
import { useState } from "react";
import AlertDialog from "../common/AlertDialog.jsx";
import { closeShift, canCloseShift } from "../../utils/shiftManagement.js";

// ── Closing Shift Wizard Component ───────────────────────────────────────
export default function ClosingShiftWizard({ shift, onComplete, onCancel, isMobile = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [closingData, setClosingData] = useState({
    outstandingTables: 0,
    pendingPayments: 0,
    kitchenTickets: 0,
    reservations: 0,
    closingCash: shift?.cashDrawer?.actual || 0,
    notes: ""
  });

  const steps = [
    { id: 1, title: 'Outstanding Tables', icon: '🪑' },
    { id: 2, title: 'Pending Payments', icon: '💳' },
    { id: 3, title: 'Kitchen Tickets', icon: '👨‍🍳' },
    { id: 4, title: 'Reservations', icon: '📅' },
    { id: 5, title: 'Cash Reconciliation', icon: '💰' },
    { id: 6, title: 'Inventory Warnings', icon: '📦' },
    { id: 7, title: 'Shift Summary', icon: '📊' },
    { id: 8, title: 'Close Shift', icon: '🏁' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const validation = canCloseShift(shift.id);
    if (!validation.canClose) {
      setAlertDialog({ isOpen: true, title: 'Cannot Close Shift', message: validation.issues.join('\n'), type: 'error' });
      return;
    }

    closeShift(shift.id, {
      closedBy: 'current_user',
      closingCash: closingData.closingCash,
      notes: closingData.notes
    });
    onComplete();
  };

  const updateClosingData = (key, value) => {
    setClosingData(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    // Check if there are critical issues that prevent proceeding
    if (currentStep === 1 && closingData.outstandingTables > 0) return false;
    if (currentStep === 2 && closingData.pendingPayments > 0) return false;
    if (currentStep === 3 && closingData.kitchenTickets > 0) return false;
    return true;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: 20,
          borderBottom: "1px solid var(--cafe-border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              Closing Shift
            </h2>
            <p style={{
              fontSize: 12,
              color: "var(--cafe-text-tertiary)"
            }}>
              Step {currentStep} of {steps.length}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 12px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--cafe-border-light)"
        }}>
          <div style={{
            display: "flex",
            gap: 8
          }}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: index + 1 <= currentStep 
                    ? "var(--cafe-accent)" 
                    : "var(--cafe-border-light)",
                  transition: "background 0.3s"
                }}
              />
            ))}
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12
          }}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: index + 1 <= currentStep 
                    ? "var(--cafe-accent)" 
                    : "var(--cafe-text-tertiary)",
                  fontWeight: index + 1 === currentStep ? 600 : 400
                }}
              >
                <span style={{ fontSize: 14 }}>{step.icon}</span>
                {isMobile ? step.title.split(' ')[0] : step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 20
        }}>
          {currentStep === 1 && (
            <Step1OutstandingTables 
              count={closingData.outstandingTables}
              onChange={(v) => updateClosingData('outstandingTables', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 2 && (
            <Step2PendingPayments 
              count={closingData.pendingPayments}
              onChange={(v) => updateClosingData('pendingPayments', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 3 && (
            <Step3KitchenTickets 
              count={closingData.kitchenTickets}
              onChange={(v) => updateClosingData('kitchenTickets', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 4 && (
            <Step4Reservations 
              count={closingData.reservations}
              onChange={(v) => updateClosingData('reservations', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 5 && (
            <Step5CashReconciliation 
              shift={shift}
              value={closingData.closingCash}
              onChange={(v) => updateClosingData('closingCash', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 6 && (
            <Step6InventoryWarnings isMobile={isMobile} />
          )}
          {currentStep === 7 && (
            <Step7ShiftSummary 
              shift={shift}
              closingData={closingData}
              isMobile={isMobile}
            />
          )}
          {currentStep === 8 && (
            <Step8CloseShift 
              shift={shift}
              closingData={closingData}
              onSubmit={handleSubmit}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 20,
          borderTop: "1px solid var(--cafe-border-light)",
          display: "flex",
          gap: 12,
          justifyContent: "space-between"
        }}>
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              padding: "12px 24px",
              background: "var(--cafe-bg-surface)",
              border: currentStep === 1 ? "1px solid var(--cafe-border-light)" : "1px solid var(--cafe-border)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: currentStep === 1 ? "var(--cafe-text-tertiary)" : "var(--cafe-text-secondary)",
              cursor: currentStep === 1 ? "not-allowed" : "pointer"
            }}
          >
            Back
          </button>
          {currentStep === steps.length ? (
            <button
              onClick={handleSubmit}
              style={{
                padding: "12px 24px",
                background: "var(--cafe-accent)",
                border: "1px solid var(--cafe-accent)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Close Shift
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                padding: "12px 24px",
                background: canProceed() ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                border: canProceed() ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: canProceed() ? "#fff" : "var(--cafe-text-tertiary)",
                cursor: canProceed() ? "pointer" : "not-allowed"
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Components ───────────────────────────────────────────────────────
function Step1OutstandingTables({ count, onChange, isMobile }) {
  const mockTables = count > 0 ? [
    { id: 1, name: 'Table 1', amount: 450 },
    { id: 2, name: 'Table 3', amount: 320 }
  ] : [];

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Outstanding Tables
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        All tables must be cleared before closing
      </p>
      {mockTables.length > 0 ? (
        <div style={{
          padding: 16,
          background: "var(--cafe-danger-bg)",
          border: "1px solid var(--cafe-danger-border)",
          borderRadius: 12,
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-danger)",
            marginBottom: 12
          }}>
            {mockTables.length} tables still occupied
          </div>
          {mockTables.map(table => (
            <div
              key={table.id}
              style={{
                padding: 12,
                background: "var(--cafe-bg-card)",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span style={{ color: "var(--cafe-text-primary)" }}>{table.name}</span>
              <span style={{ color: "var(--cafe-text-secondary)" }}>₹{table.amount}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 40,
          textAlign: "center",
          background: "var(--cafe-success-bg)",
          border: "1px solid var(--cafe-success-border)",
          borderRadius: 12
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>✓</div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-success)"
          }}>
            All tables cleared
          </div>
        </div>
      )}
    </div>
  );
}

function Step2PendingPayments({ count, onChange, isMobile }) {
  const mockPayments = count > 0 ? [
    { id: 1, table: 'Table 2', amount: 180, method: 'UPI' }
  ] : [];

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Pending Payments
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        All payments must be completed
      </p>
      {mockPayments.length > 0 ? (
        <div style={{
          padding: 16,
          background: "var(--cafe-warning-bg)",
          border: "1px solid var(--cafe-warning-border)",
          borderRadius: 12
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-warning)",
            marginBottom: 12
          }}>
            {mockPayments.length} pending payments
          </div>
          {mockPayments.map(payment => (
            <div
              key={payment.id}
              style={{
                padding: 12,
                background: "var(--cafe-bg-card)",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span style={{ color: "var(--cafe-text-primary)" }}>{payment.table}</span>
              <span style={{ color: "var(--cafe-text-secondary)" }}>₹{payment.amount} ({payment.method})</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 40,
          textAlign: "center",
          background: "var(--cafe-success-bg)",
          border: "1px solid var(--cafe-success-border)",
          borderRadius: 12
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>✓</div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-success)"
          }}>
            All payments completed
          </div>
        </div>
      )}
    </div>
  );
}

function Step3KitchenTickets({ count, onChange, isMobile }) {
  const mockTickets = count > 0 ? [
    { id: 1, order: '#1234', items: 3, time: '5 min ago' }
  ] : [];

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Kitchen Tickets
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        All kitchen tickets must be completed
      </p>
      {mockTickets.length > 0 ? (
        <div style={{
          padding: 16,
          background: "var(--cafe-warning-bg)",
          border: "1px solid var(--cafe-warning-border)",
          borderRadius: 12
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-warning)",
            marginBottom: 12
          }}>
            {mockTickets.length} open tickets
          </div>
          {mockTickets.map(ticket => (
            <div
              key={ticket.id}
              style={{
                padding: 12,
                background: "var(--cafe-bg-card)",
                borderRadius: 8,
                marginBottom: 8
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4
              }}>
                <span style={{ color: "var(--cafe-text-primary)", fontWeight: 600 }}>{ticket.order}</span>
                <span style={{ color: "var(--cafe-text-tertiary)" }}>{ticket.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                {ticket.items} items
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 40,
          textAlign: "center",
          background: "var(--cafe-success-bg)",
          border: "1px solid var(--cafe-success-border)",
          borderRadius: 12
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>✓</div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-success)"
          }}>
            Kitchen clear
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Reservations({ count, onChange, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Reservations
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Check for upcoming reservations
      </p>
      <div style={{
        padding: 40,
        textAlign: "center",
        background: "var(--cafe-success-bg)",
        border: "1px solid var(--cafe-success-border)",
        borderRadius: 12
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>✓</div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-success)"
        }}>
          No pending reservations
        </div>
      </div>
    </div>
  );
}

function Step5CashReconciliation({ shift, value, onChange, isMobile }) {
  const difference = value - (shift?.cashDrawer?.expected || 0);

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Cash Reconciliation
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Count and enter the actual cash in drawer
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 20
      }}>
        <div style={{
          padding: 16,
          background: "var(--cafe-bg-surface)",
          borderRadius: 8,
          border: "1px solid var(--cafe-border)"
        }}>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 4
          }}>
            Expected
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--cafe-text-primary)"
          }}>
            ₹{(shift?.cashDrawer?.expected || 0).toFixed(2)}
          </div>
        </div>
        <div style={{
          padding: 16,
          background: "var(--cafe-bg-surface)",
          borderRadius: 8,
          border: "1px solid var(--cafe-border)"
        }}>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 4
          }}>
            Actual
          </div>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            style={{
              width: "100%",
              padding: "8px",
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 6,
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          />
        </div>
        <div style={{
          padding: 16,
          background: difference !== 0 
            ? (difference > 0 ? "var(--cafe-success-bg)" : "var(--cafe-danger-bg)")
            : "var(--cafe-success-bg)",
          borderRadius: 8,
          border: difference !== 0 
            ? (difference > 0 ? "1px solid var(--cafe-success-border)" : "1px solid var(--cafe-danger-border)")
            : "1px solid var(--cafe-success-border)"
        }}>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 4
          }}>
            Difference
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: difference !== 0 
              ? (difference > 0 ? "var(--cafe-success)" : "var(--cafe-danger)")
              : "var(--cafe-success)"
          }}>
            {difference !== 0 
              ? (difference > 0 ? "+" : "") + "₹" + difference.toFixed(2)
              : "Balanced"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step6InventoryWarnings({ isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Inventory Warnings
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Review any inventory issues
      </p>
      <div style={{
        padding: 40,
        textAlign: "center",
        background: "var(--cafe-success-bg)",
        border: "1px solid var(--cafe-success-border)",
        borderRadius: 12
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>✓</div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-success)"
        }}>
          No inventory warnings
        </div>
      </div>
    </div>
  );
}

function Step7ShiftSummary({ shift, closingData, isMobile }) {
  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Shift Summary
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Review shift details before closing
      </p>
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border)",
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 16
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 4
            }}>
              Orders
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cafe-text-primary)"
            }}>
              {shift?.metrics.orders || 0}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 4
            }}>
              Revenue
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cafe-success)"
            }}>
              {formatCurrency(shift?.metrics.revenue || 0)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 4
            }}>
              Refunds
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cafe-warning)"
            }}>
              {shift?.metrics.refunds || 0}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 4
            }}>
              Voids
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cafe-danger)"
            }}>
              {shift?.metrics.voids || 0}
            </div>
          </div>
        </div>
        <div style={{
          padding: 12,
          background: "var(--cafe-bg-card)",
          borderRadius: 8,
          border: "1px solid var(--cafe-border-light)"
        }}>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 4
          }}>
            Cash Variance
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: Math.abs(closingData.closingCash - (shift?.cashDrawer?.expected || 0)) > 0.01
              ? "var(--cafe-warning)"
              : "var(--cafe-success)"
          }}>
            {Math.abs(closingData.closingCash - (shift?.cashDrawer?.expected || 0)) > 0.01
              ? (closingData.closingCash - (shift?.cashDrawer?.expected || 0) > 0 ? "+" : "") + formatCurrency(closingData.closingCash - (shift?.cashDrawer?.expected || 0))
              : "Balanced"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step8CloseShift({ shift, closingData, onSubmit, isMobile }) {
  const [notes, setNotes] = useState("");

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Close Shift
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Add any notes and confirm to close the shift
      </p>
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--cafe-text-secondary)",
          marginBottom: 8
        }}>
          Closing Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any issues, notes, or observations..."
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--cafe-text-primary)",
            outline: "none",
            resize: "vertical"
          }}
        />
      </div>
      <button
        onClick={() => onSubmit()}
        style={{
          width: "100%",
          padding: "16px 24px",
          background: "var(--cafe-accent)",
          border: "1px solid var(--cafe-accent)",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Confirm & Close Shift
      </button>
    </div>
  );
}
