import { useEffect, useRef } from "react";

const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  danger = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
}) => {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      // Focus the dialog after a short delay to ensure it's rendered
      setTimeout(() => {
        if (dialogRef.current) {
          dialogRef.current.focus();
          // Focus first interactive element
          const firstInput = dialogRef.current.querySelector('input, button, textarea, select');
          if (firstInput) firstInput.focus();
        }
      }, 50);
    } else if (previousActiveElement.current) {
      // Return focus to triggering element
      previousActiveElement.current.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    sm: { width: "min(360px,90vw)" },
    md: { width: "min(480px,90vw)" },
    lg: { width: "min(600px,90vw)" },
    xl: { width: "min(800px,90vw)" },
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          background: "var(--cafe-bg-card)",
          border: danger ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-border-light)",
          borderRadius: "var(--cafe-radius-lg)",
          padding: 24,
          ...sizeStyles[size],
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--cafe-shadow-xl)",
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid var(--cafe-border-light)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div
                style={{
                  fontSize: "var(--cafe-font-lg)",
                  fontWeight: 700,
                  color: danger ? "var(--cafe-danger)" : "var(--cafe-text-primary)",
                  marginBottom: 4,
                }}
              >
                {title}
              </div>
            )}
            {description && (
              <div
                style={{
                  fontSize: "var(--cafe-font-sm)",
                  color: "var(--cafe-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </div>
            )}
          </div>
          {showClose && (
            <button
              onClick={onClose}
              style={{
                padding: "6px 10px",
                borderRadius: "var(--cafe-radius-sm)",
                border: "1px solid var(--cafe-border-light)",
                background: "var(--cafe-bg-surface)",
                color: "var(--cafe-text-tertiary)",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
                marginLeft: 12,
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ marginBottom: 20 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              paddingTop: 16,
              borderTop: "1px solid var(--cafe-border-light)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dialog;
