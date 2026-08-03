import React from 'react';
import Dialog from "./Dialog";

const WarningDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  consequence,
  confirmLabel = "Continue Anyway",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      {warning && (
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            background: "var(--cafe-warning-bg)",
            border: "1px solid var(--cafe-warning-border)",
            borderRadius: "var(--cafe-radius-md)",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div
            style={{
              fontSize: "var(--cafe-font-sm)",
              color: "var(--cafe-text-primary)",
              lineHeight: 1.5,
            }}
          >
            {warning}
          </div>
        </div>
      )}

      {consequence && (
        <div
          style={{
            fontSize: "var(--cafe-font-sm)",
            color: "var(--cafe-text-secondary)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          {consequence}
        </div>
      )}

      <Dialog footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-border-light)",
              background: "transparent",
              color: "var(--cafe-text-secondary)",
              fontSize: "var(--cafe-font-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled || loading}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-warning-border)",
              background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-warning)",
              color: "#1A1208",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: 600,
              cursor: disabled || loading ? "not-allowed" : "pointer",
              opacity: disabled || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </>
      } />
    </Dialog>
  );
};

export default WarningDialog;
