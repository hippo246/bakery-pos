import React from 'react';
import Dialog from "./Dialog";

const ConflictDialog = ({
  open,
  onClose,
  title,
  description,
  currentRecord,
  incomingRecord,
  conflictType,
  onResolve,
  loading = false,
}) => {
  const renderRecord = (record, label) => {
    if (!record) return null;
    return (
      <div
        style={{
          padding: "12px 16px",
          background: label === "Current" ? "var(--cafe-bg-surface)" : "var(--cafe-accent-bg)",
          border: label === "Current" ? "1px solid var(--cafe-border-light)" : "1px solid var(--cafe-accent-border)",
          borderRadius: "var(--cafe-radius-md)",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: "var(--cafe-font-xs)",
            fontWeight: 600,
            color: label === "Current" ? "var(--cafe-text-tertiary)" : "var(--cafe-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        {Object.entries(record).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--cafe-font-sm)",
              marginBottom: 4,
            }}
          >
            <span style={{ color: "var(--cafe-text-tertiary)" }}>{key}:</span>
            <span style={{ fontWeight: 500, color: "var(--cafe-text-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getResolutionOptions = () => {
    switch (conflictType) {
      case "duplicate":
        return [
          { label: "Merge Records", value: "merge", primary: true },
          { label: "Keep Separate", value: "keep", primary: false },
        ];
      case "overlap":
        return [
          { label: "Replace Existing", value: "replace", primary: true },
          { label: "Keep Existing", value: "keep", primary: false },
        ];
      case "assignment":
        return [
          { label: "Reassign", value: "reassign", primary: true },
          { label: "Keep Current", value: "keep", primary: false },
        ];
      default:
        return [
          { label: "Continue Anyway", value: "continue", primary: true },
          { label: "Cancel", value: "cancel", primary: false },
        ];
    }
  };

  const options = getResolutionOptions();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div style={{ marginBottom: 16 }}>
        {renderRecord(currentRecord, "Current")}
        {renderRecord(incomingRecord, "Incoming")}
      </div>

      <Dialog footer={
        <>
          <button
            onClick={() => onResolve("cancel")}
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
            Cancel
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onResolve(option.value)}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "var(--cafe-radius-md)",
                border: option.primary
                  ? "1px solid var(--cafe-accent-border)"
                  : "1px solid var(--cafe-border-light)",
                background: loading
                  ? "var(--cafe-text-tertiary)"
                  : option.primary
                  ? "var(--cafe-accent)"
                  : "transparent",
                color: option.primary ? "#fff" : "var(--cafe-text-secondary)",
                fontSize: "var(--cafe-font-sm)",
                fontWeight: option.primary ? 600 : 400,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Processing..." : option.label}
            </button>
          ))}
        </>
      } />
    </Dialog>
  );
};

export default ConflictDialog;
