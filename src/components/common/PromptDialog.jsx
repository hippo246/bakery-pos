import Dialog from "./Dialog";

const PromptDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  multiline = false,
  maxLength,
  helperText,
  error,
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
}) => {
  const canConfirm = required ? value && value.trim().length > 0 : !disabled;

  const characterCount = maxLength && value ? `${value.length}/${maxLength}` : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
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
          {label}
          {required && <span style={{ color: "var(--cafe-danger)" }}> *</span>}
        </label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            maxLength={maxLength}
            style={{
              width: "100%",
              minHeight: 120,
              padding: "12px 14px",
              borderRadius: "var(--cafe-radius-md)",
              border: error ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-border-light)",
              background: "var(--cafe-bg-surface)",
              color: "var(--cafe-text-primary)",
              fontSize: "var(--cafe-font-sm)",
              outline: "none",
              resize: "vertical",
              opacity: loading ? 0.6 : 1,
            }}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            maxLength={maxLength}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--cafe-radius-md)",
              border: error ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-border-light)",
              background: "var(--cafe-bg-surface)",
              color: "var(--cafe-text-primary)",
              fontSize: "var(--cafe-font-sm)",
              outline: "none",
              opacity: loading ? 0.6 : 1,
            }}
            autoFocus
          />
        )}
        {(helperText || characterCount) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            {helperText && (
              <div
                style={{
                  fontSize: "var(--cafe-font-xs)",
                  color: "var(--cafe-text-tertiary)",
                }}
              >
                {helperText}
              </div>
            )}
            {characterCount && (
              <div
                style={{
                  fontSize: "var(--cafe-font-xs)",
                  color: maxLength && value.length > maxLength * 0.9
                    ? "var(--cafe-warning)"
                    : "var(--cafe-text-tertiary)",
                }}
              >
                {characterCount}
              </div>
            )}
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: 6,
              fontSize: "var(--cafe-font-xs)",
              color: "var(--cafe-danger)",
            }}
          >
            {error}
          </div>
        )}
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
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "none",
              background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-accent)",
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

export default PromptDialog;
