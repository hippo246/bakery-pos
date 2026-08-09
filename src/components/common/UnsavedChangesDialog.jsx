import Dialog from "./Dialog";

const UnsavedChangesDialog = ({
  open,
  onClose,
  onDiscard,
  onSave,
  title = "Unsaved Changes",
  description = "You have unsaved changes that will be lost if you close this form.",
  saveLabel = "Save Changes",
  discardLabel = "Discard",
  cancelLabel = "Keep Editing",
  loading = false,
  canSave = true,
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
      <div
        style={{
          padding: "12px 16px",
          background: "var(--cafe-warning-bg)",
          border: "1px solid var(--cafe-warning-border)",
          borderRadius: "var(--cafe-radius-md)",
          marginBottom: 16,
          fontSize: "var(--cafe-font-sm)",
          color: "var(--cafe-text-primary)",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Changes will be lost
          </div>
          <div style={{ lineHeight: 1.5 }}>
            If you discard or close without saving, your changes will be permanently lost.
          </div>
        </div>
      </div>

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
            onClick={onDiscard}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-danger-border)",
              background: loading ? "var(--cafe-text-tertiary)" : "transparent",
              color: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-danger)",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : discardLabel}
          </button>
          {canSave && (
            <button
              onClick={onSave}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "var(--cafe-radius-md)",
                border: "none",
                background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-accent)",
                color: "#fff",
                fontSize: "var(--cafe-font-sm)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : saveLabel}
            </button>
          )}
        </>
      } />
    </Dialog>
  );
};

export default UnsavedChangesDialog;
