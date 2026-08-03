import React from 'react';
// ── Access Denied Screen Component ───────────────────────────────────────────
export default function AccessDenied({ 
  requiredPermission, 
  requiredRole, 
  reason,
  onBack 
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        background: "var(--cafe-bg)",
        color: "var(--cafe-text-primary)"
      }}
    >
      <div style={{
        maxWidth: 440,
        width: "100%",
        textAlign: "center"
      }}>
        {/* Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "var(--cafe-danger-bg)",
          border: "1px solid var(--cafe-danger-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          margin: "0 auto 24px"
        }}>
          🔒
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          marginBottom: 12,
          letterSpacing: "-0.02em"
        }}>
          Access Restricted
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: "var(--cafe-text-secondary)",
          lineHeight: 1.6,
          marginBottom: 32
        }}>
          You don't have permission to access this resource. Please contact your manager to request the necessary permissions.
        </p>

        {/* Details Card */}
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: "left"
        }}>
          {requiredPermission && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6
              }}>
                Required Permission
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--cafe-text-primary)"
              }}>
                {requiredPermission}
              </div>
            </div>
          )}

          {requiredRole && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6
              }}>
                Required Role
              </div>
              <div style={{
                padding: "6px 12px",
                background: "var(--cafe-accent-bg)",
                border: "1px solid var(--cafe-accent-border)",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--cafe-accent)",
                display: "inline-block"
              }}>
                {requiredRole}
              </div>
            </div>
          )}

          {reason && (
            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6
              }}>
                Reason
              </div>
              <div style={{
                fontSize: 13,
                color: "var(--cafe-text-secondary)"
              }}>
                {reason}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <button
            onClick={onBack}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "var(--cafe-accent)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = "#settings"}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Contact Manager
          </button>
        </div>

        {/* Help Text */}
        <p style={{
          fontSize: 12,
          color: "var(--cafe-text-tertiary)",
          marginTop: 32
        }}>
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
