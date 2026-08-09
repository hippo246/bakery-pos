import Dialog from "./Dialog";
import { useState, useMemo } from "react";

const SelectionDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  options = [],
  selectedId,
  onSelect,
  searchPlaceholder = "Search...",
  searchable = true,
  loading = false,
  disabled = false,
  emptyMessage = "No options available",
  renderOption,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchStr = typeof option.label === "string" ? option.label.toLowerCase() : "";
      return searchStr.includes(query);
    });
  }, [options, searchQuery, searchable]);

  const handleConfirm = () => {
    if (selectedId && !disabled) {
      onConfirm(selectedId);
    }
  };

  const canConfirm = selectedId && !disabled && !loading;

  const defaultRenderOption = (option) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: "var(--cafe-radius-md)",
        border: `1px solid ${
          option.id === selectedId
            ? "var(--cafe-accent-border)"
            : "var(--cafe-border-light)"
        }`,
        background:
          option.id === selectedId
            ? "var(--cafe-accent-bg)"
            : option.disabled
            ? "var(--cafe-bg-hover)"
            : "var(--cafe-bg-surface)",
        cursor: option.disabled ? "not-allowed" : "pointer",
        opacity: option.disabled ? 0.5 : 1,
        transition: "all 0.15s",
      }}
      onClick={() => !option.disabled && onSelect(option.id)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--cafe-font-sm)",
            fontWeight: 500,
            color: "var(--cafe-text-primary)",
            marginBottom: 2,
          }}
        >
          {option.label}
        </div>
        {option.description && (
          <div
            style={{
              fontSize: "var(--cafe-font-xs)",
              color: "var(--cafe-text-tertiary)",
            }}
          >
            {option.description}
          </div>
        )}
      </div>
      {option.id === selectedId && (
        <span style={{ color: "var(--cafe-accent)", fontSize: 18 }}>✓</span>
      )}
    </div>
  );

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
      {searchable && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--cafe-radius-md)",
              border: "1px solid var(--cafe-border-light)",
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

      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {filteredOptions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "var(--cafe-text-tertiary)",
              fontSize: "var(--cafe-font-sm)",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((option) =>
            renderOption ? renderOption(option, defaultRenderOption) : defaultRenderOption(option)
          )
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
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--cafe-radius-md)",
              border: "none",
              background: loading ? "var(--cafe-text-tertiary)" : "var(--cafe-accent)",
              color: "#fff",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: 600,
              cursor: !canConfirm ? "not-allowed" : "pointer",
              opacity: !canConfirm ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : "Confirm Selection"}
          </button>
        </>
      } />
    </Dialog>
  );
};

export default SelectionDialog;
