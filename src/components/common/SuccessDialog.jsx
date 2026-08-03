import React from 'react';
import Dialog from "./Dialog";

const SuccessDialog = ({
  open,
  onClose,
  title,
  description,
  summary,
  details,
  actionLabel = "Done",
  onAction,
  showIcon = true,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnEscape={true}
      closeOnBackdrop={true}
    >
      {showIcon && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--cafe-success-bg)",
              border: "1px solid var(--cafe-success-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            ✓
          </div>
        </div>
      )}

      {summary && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--cafe-success-bg)",
            border: "1px solid var(--cafe-success-border)",
            borderRadius: "var(--cafe-radius-md)",
            marginBottom: 16,
            fontSize: "var(--ca-font-sm)",
            color: "var(--cafe-text-primary)",
            textAlign: "center",
          }}
        >
          {summary}
        </div>
      )}

      {details && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: "var(--cafe-radius-md)",
            marginBottom: 16,
          }}
        >
          {Array.isArray(details) ? (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-secondary)" }}>
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: "var(--cafe-font-sm", color: "var(--cafe-text-secondary)" }}>
              {details}
            </div>
          )}
        </div>
      )}

      <Dialog footer={
        <button
          onClick={onAction || onClose}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--cafe-radius-md)",
            border: "none",
            background: "var(--cafe-success)",
            color: "#fff",
            fontSize: "var(--cafe-font-sm)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      } />
    </Dialog>
  );
};

export default SuccessDialog;
