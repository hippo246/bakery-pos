import React from 'react';
import { useState } from "react";

// ── Permission Dialog Component ───────────────────────────────────────────
export default function PermissionDialog({ 
  isOpen, 
  onClose, 
  onApprove, 
  permission, 
  currentRole,
  reason 
}) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApprove) {
      setIsSubmitting(true);
      onApprove(pin).finally(() => {
        setIsSubmitting(false);
      });
    }
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
        zIndex: 9999,
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 440,
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          animation: "slideUp 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: 24,
          borderBottom: "1px solid var(--cafe-border-light)",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--cafe-danger-bg)",
            border: "1px solid var(--cafe-danger-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24
          }}>
            🔒
          </div>
          <div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              Permission Required
            </div>
            <div style={{
              fontSize: 12,
              color: "var(--cafe-text-tertiary)"
            }}>
              Manager override needed
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Permission Info */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--cafe-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8
            }}>
              Action Requiring Permission
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              {permission}
            </div>
            {reason && (
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-secondary)",
                marginTop: 8
              }}>
                {reason}
              </div>
            )}
          </div>

          {/* Current Role */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{
              fontSize: 12,
              color: "var(--cafe-text-tertiary)"
            }}>
              Current Role:
            </div>
            <div style={{
              padding: "6px 12px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--cafe-text-primary)"
            }}>
              {currentRole}
            </div>
          </div>

          {/* PIN Input */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                marginBottom: 8
              }}>
                Manager PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "var(--cafe-text-primary)",
                  outline: "none",
                  letterSpacing: "4px",
                  textAlign: "center"
                }}
                autoFocus
              />
            </div>

            {/* Actions */}
            <div style={{
              display: "flex",
              gap: 12
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: isSubmitting || pin.length !== 4
                    ? "var(--cafe-bg-surface)"
                    : "var(--cafe-accent)",
                  border: isSubmitting || pin.length !== 4
                    ? "1px solid var(--cafe-border)"
                    : "1px solid var(--cafe-accent)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSubmitting || pin.length !== 4
                    ? "var(--cafe-text-tertiary)"
                    : "#fff",
                  cursor: isSubmitting || pin.length !== 4
                    ? "not-allowed"
                    : "pointer",
                  transition: "all 0.15s"
                }}
              >
                {isSubmitting ? "Verifying..." : "Approve Override"}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
