import React from 'react';
import { useState } from "react";

// ── Cash Drawer Reconciliation Component ─────────────────────────────────
export default function CashDrawerReconciliation({ shift, onUpdate, isMobile = false }) {
  const [actualCash, setActualCash] = useState(shift?.cashDrawer?.actual || 0);
  const [reason, setReason] = useState("");
  const [showVarianceHistory, setShowVarianceHistory] = useState(false);

  const difference = actualCash - (shift?.cashDrawer?.expected || 0);
  const isVariance = Math.abs(difference) > 0.01;

  const handleSubmit = () => {
    if (onUpdate) {
      onUpdate(actualCash, reason);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: isVariance ? "2px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: 20
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--cafe-text-primary)"
        }}>
          Cash Drawer Reconciliation
        </h3>
        {shift?.varianceHistory && shift.varianceHistory.length > 0 && (
          <button
            onClick={() => setShowVarianceHistory(!showVarianceHistory)}
            style={{
              padding: "8px 16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer"
            }}
          >
            {showVarianceHistory ? "Hide" : "View"} History
          </button>
        )}
      </div>

      {/* Current Status */}
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
            {formatCurrency(shift?.cashDrawer?.expected || 0)}
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
            value={actualCash}
            onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
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
          background: isVariance 
            ? (difference > 0 ? "var(--cafe-success-bg)" : "var(--cafe-danger-bg)")
            : "var(--cafe-success-bg)",
          borderRadius: 8,
          border: isVariance 
            ? (difference > 0 ? "1px solid var(--cafe-success-border)" : "1px solid var(--cafe-danger-border)")
            : "1px solid var(--cafe-success-border)"
        }}>
          <div style={{
            fontSize: 11,
            color: isVariance ? "var(--cafe-text-tertiary)" : "var(--cafe-success)",
            marginBottom: 4
          }}>
            Difference
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: isVariance 
              ? (difference > 0 ? "var(--cafe-success)" : "var(--cafe-danger)")
              : "var(--cafe-success)"
          }}>
            {isVariance 
              ? (difference > 0 ? "+" : "") + formatCurrency(difference)
              : "Balanced"}
          </div>
        </div>
      </div>

      {/* Reason Input */}
      {isVariance && (
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            marginBottom: 8
          }}>
            Reason for Variance
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the difference..."
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          />
        </div>
      )}

      {/* Variance Alert */}
      {isVariance && Math.abs(difference) > 100 && (
        <div style={{
          padding: 12,
          background: "var(--cafe-warning-bg)",
          border: "1px solid var(--cafe-warning-border)",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 12,
          color: "var(--cafe-warning)",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>⚠️</span>
          <span>Large variance requires manager approval</span>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
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
        Update Cash Drawer
      </button>

      {/* Variance History */}
      {showVarianceHistory && shift?.varianceHistory && shift.varianceHistory.length > 0 && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: "var(--cafe-bg-surface)",
          borderRadius: 8,
          border: "1px solid var(--cafe-border)"
        }}>
          <h4 style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 12
          }}>
            Variance History
          </h4>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            {shift.varianceHistory.map((variance, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  background: "var(--cafe-bg-card)",
                  borderRadius: 6,
                  border: "1px solid var(--cafe-border-light)",
                  fontSize: 12
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4
                }}>
                  <span style={{
                    fontWeight: 600,
                    color: variance.difference > 0 ? "var(--cafe-success)" : "var(--cafe-danger)"
                  }}>
                    {variance.difference > 0 ? "+" : ""}{formatCurrency(variance.difference)}
                  </span>
                  <span style={{ color: "var(--cafe-text-tertiary)" }}>
                    {new Date(variance.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: "var(--cafe-text-secondary)" }}>
                  {variance.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
