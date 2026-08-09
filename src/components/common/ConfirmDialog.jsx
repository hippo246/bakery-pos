import Dialog from "./Dialog";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  summary,
  confirmLabel = "Confirm",
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
      footer={
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
              border: "none",
              background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-accent)",
              color: "#fff",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: 600,
              cursor: disabled || loading ? "not-allowed" : "pointer",
              opacity: disabled || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </>
      }
    >
      {summary && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: "var(--cafe-radius-md)",
            fontSize: "var(--cafe-font-sm)",
            color: "var(--cafe-text-secondary)",
            marginBottom: 16,
          }}
        >
          {summary}
        </div>
      )}
    </Dialog>
  );
};

export default ConfirmDialog;
