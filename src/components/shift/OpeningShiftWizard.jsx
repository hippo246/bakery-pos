import React from 'react';
import { useState } from "react";
import { SHIFT_TYPES, createShift } from "../../utils/shiftManagement.js";

// ── Opening Shift Wizard Component ───────────────────────────────────────
export default function OpeningShiftWizard({ onComplete, onCancel, isMobile = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [shiftData, setShiftData] = useState({
    shiftType: 'morning',
    staffId: '',
    openingCash: 0,
    printerCheck: false,
    kitchenDisplayCheck: false,
    deviceCheck: false,
    inventoryWarnings: []
  });

  const steps = [
    { id: 1, title: 'Select Shift Type', icon: '📅' },
    { id: 2, title: 'Select Staff', icon: '👥' },
    { id: 3, title: 'Opening Cash', icon: '💰' },
    { id: 4, title: 'Printer Check', icon: '🖨️' },
    { id: 5, title: 'Kitchen Display', icon: '👨‍🍳' },
    { id: 6, title: 'Device Status', icon: '📱' },
    { id: 7, title: 'Inventory Warnings', icon: '📦' }
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
    const shift = createShift(shiftData.shiftType, shiftData.staffId, shiftData.openingCash);
    onComplete(shift);
  };

  const updateShiftData = (key, value) => {
    setShiftData(prev => ({ ...prev, [key]: value }));
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
              Opening Shift
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
            <Step1ShiftType 
              value={shiftData.shiftType}
              onChange={(v) => updateShiftData('shiftType', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 2 && (
            <Step2Staff 
              value={shiftData.staffId}
              onChange={(v) => updateShiftData('staffId', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 3 && (
            <Step3OpeningCash 
              value={shiftData.openingCash}
              onChange={(v) => updateShiftData('openingCash', v)}
              isMobile={isMobile}
            />
          )}
          {currentStep === 4 && (
            <Step4PrinterCheck 
              checked={shiftData.printerCheck}
              onChange={(v) => updateShiftData('printerCheck', v)}
              onNext={handleNext}
              isMobile={isMobile}
            />
          )}
          {currentStep === 5 && (
            <Step5KitchenDisplay 
              checked={shiftData.kitchenDisplayCheck}
              onChange={(v) => updateShiftData('kitchenDisplayCheck', v)}
              onNext={handleNext}
              isMobile={isMobile}
            />
          )}
          {currentStep === 6 && (
            <Step6DeviceStatus 
              checked={shiftData.deviceCheck}
              onChange={(v) => updateShiftData('deviceCheck', v)}
              onNext={handleNext}
              isMobile={isMobile}
            />
          )}
          {currentStep === 7 && (
            <Step7InventoryWarnings 
              warnings={shiftData.inventoryWarnings}
              onChange={(v) => updateShiftData('inventoryWarnings', v)}
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
              Open Shift
            </button>
          ) : (
            <button
              onClick={handleNext}
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
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Components ───────────────────────────────────────────────────────
function Step1ShiftType({ value, onChange, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Select Shift Type
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Choose the shift type for today's operations
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 12
      }}>
        {SHIFT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            style={{
              padding: "16px",
              background: value === type.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
              border: value === type.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8
            }}>
              <span style={{ fontSize: 24 }}>{type.icon}</span>
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)"
                }}>
                  {type.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  {type.hours}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2Staff({ value, onChange, isMobile }) {
  const mockStaff = [
    { id: 'staff_1', name: 'John Smith', role: 'Manager' },
    { id: 'staff_2', name: 'Sarah Johnson', role: 'Cashier' },
    { id: 'staff_3', name: 'Mike Chen', role: 'Kitchen' }
  ];

  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Select Staff
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Choose the staff member opening this shift
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 12
      }}>
        {mockStaff.map(staff => (
          <button
            key={staff.id}
            onClick={() => onChange(staff.id)}
            style={{
              padding: "16px",
              background: value === staff.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
              border: value === staff.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              {staff.name}
            </div>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)"
            }}>
              {staff.role}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3OpeningCash({ value, onChange, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Opening Cash
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Enter the starting cash amount in the drawer
      </p>
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border)",
        borderRadius: 12,
        padding: 20
      }}>
        <label style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--cafe-text-secondary)",
          marginBottom: 8
        }}>
          Amount (₹)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          style={{
            width: "100%",
            padding: "16px",
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 24,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            outline: "none",
            textAlign: "center"
          }}
        />
        <div style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--cafe-text-tertiary)",
          textAlign: "center"
        }}>
          Common amounts: ₹500, ₹1000, ₹2000
        </div>
      </div>
    </div>
  );
}

function Step4PrinterCheck({ checked, onChange, onNext, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Printer Check
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Verify that the receipt printer is working correctly
      </p>
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border)",
        borderRadius: 12,
        padding: 20,
        textAlign: "center"
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>🖨️</div>
        <button
          onClick={() => {
            // Simulate print test
            alert("Printing test receipt...");
            onChange(true);
            setTimeout(onNext, 500);
          }}
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
          Print Test Receipt
        </button>
        {checked && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--cafe-success)",
            fontWeight: 600
          }}>
            ✓ Printer verified
          </div>
        )}
      </div>
    </div>
  );
}

function Step5KitchenDisplay({ checked, onChange, onNext, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Kitchen Display Status
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Verify that the kitchen display system is online
      </p>
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border)",
        borderRadius: 12,
        padding: 20,
        textAlign: "center"
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>👨‍🍳</div>
        <div style={{
          padding: "12px",
          background: "var(--cafe-success-bg)",
          border: "1px solid var(--cafe-success-border)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--cafe-success)",
          fontWeight: 600,
          marginBottom: 12
        }}>
          Kitchen Display Online
        </div>
        <button
          onClick={() => {
            onChange(true);
            onNext();
          }}
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
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}

function Step6DeviceStatus({ checked, onChange, onNext, isMobile }) {
  return (
    <div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        marginBottom: 8
      }}>
        Device Status
      </h3>
      <p style={{
        fontSize: 13,
        color: "var(--cafe-text-tertiary)",
        marginBottom: 20
      }}>
        Check all connected devices
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 12
      }}>
        {[
          { name: 'Cash Terminal', status: 'online', icon: '💻' },
          { name: 'Kitchen Printer', status: 'online', icon: '🖨️' },
          { name: 'Kitchen Display', status: 'online', icon: '📺' },
          { name: 'Customer Display', status: 'online', icon: '📱' }
        ].map(device => (
          <div
            key={device.name}
            style={{
              padding: "16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <span style={{ fontSize: 24 }}>{device.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}>
                {device.name}
              </div>
              <div style={{
                fontSize: 11,
                color: "var(--cafe-success)"
              }}>
                ● {device.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          onChange(true);
          onNext();
        }}
        style={{
          width: "100%",
          marginTop: 20,
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
        All Devices Verified
      </button>
    </div>
  );
}

function Step7InventoryWarnings({ warnings, onChange, isMobile }) {
  const mockWarnings = [
    { item: 'Coffee Beans', level: 'low', threshold: 2 },
    { item: 'Milk', level: 'critical', threshold: 1 }
  ];

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
        Review any inventory alerts before opening
      </p>
      {mockWarnings.length > 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          {mockWarnings.map((warning, index) => (
            <div
              key={index}
              style={{
                padding: "16px",
                background: warning.level === 'critical' 
                  ? "var(--cafe-danger-bg)" 
                  : "var(--cafe-warning-bg)",
                border: warning.level === 'critical' 
                  ? "1px solid var(--cafe-danger-border)" 
                  : "1px solid var(--cafe-warning-border)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <span style={{ fontSize: 24 }}>
                {warning.level === 'critical' ? '⚠️' : '📦'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)"
                }}>
                  {warning.item}
                </div>
                <div style={{
                  fontSize: 11,
                  color: warning.level === 'critical' 
                    ? "var(--cafe-danger)" 
                    : "var(--cafe-warning)"
                }}>
                  {warning.level.toUpperCase()} - {warning.threshold} units remaining
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 40,
          textAlign: "center",
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border)",
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
      )}
    </div>
  );
}
