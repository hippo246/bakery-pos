import Dialog from "./Dialog";

const DestructiveDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  recordName,
  consequence,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
  requireTypedConfirmation = false,
  confirmationText = "",
  onConfirmationTextChange,
}) => {
  const canConfirm = requireTypedConfirmation
    ? confirmationText === recordName
    : !disabled;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      danger={true}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      {recordName && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--cafe-danger-bg)",
            border: "1px solid var(--cafe-danger-border)",
            borderRadius: "var(--cafe-radius-md)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: "var(--cafe-font-xs)",
              color: "var(--cafe-danger)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Record
          </div>
          <div
            style={{
              fontSize: "var(--cafe-font-base)",
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
            }}
          >
            {recordName}
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

      {requireTypedConfirmation && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: "var(--cafe-font-xs)",
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Type "{recordName}" to confirm
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => onConfirmationTextChange(e.target.value)}
            placeholder={`Type "${recordName}"`}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-danger-border)",
              background: "var(--cafe-bg-surface)",
              color: "var(--cafe-text-primary)",
              fontSize: "var(--cafe-font-sm)",
              outline: "none",
              opacity: loading ? 0.6 : 1,
            }}
            autoFocus
          />
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
            disabled={!canConfirm || loading}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-danger-border)",
              background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-danger)",
              color: "#fff",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: 600,
              cursor: !canConfirm || loading ? "not-allowed" : "pointer",
              opacity: !canConfirm || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </>
      } />
    </Dialog>
  );
};

export default DestructiveDialog;
