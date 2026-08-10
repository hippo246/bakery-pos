import React from 'react';
// CafeOS Mobile Print Preview & Share
// Mobile-optimized preview with share functionality

import { useState, useCallback } from "react";
import { renderReceipt } from "../../print/receiptLayout.js";
import exportManager from "../../print/exportUtils.js";
import DOMPurify from 'dompurify';

export default function MobilePrintPreview({ document, documentType, onClose, onPrint, isMobile }) {
  const [previewHTML, setPreviewHTML] = useState("");
  const [paperSize, setPaperSize] = useState("80mm");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const generatePreview = useCallback(() => {
    if (!document) return;

    try {
      const layout = renderReceipt(document, paperSize, "normal", "medium");
      const html = layout.toHTML();
      const sanitizedHTML = DOMPurify.sanitize(html);
      setPreviewHTML(sanitizedHTML);
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  }, [document, paperSize]);

  const handleShare = useCallback(async (format) => {
    try {
      const filename = `${documentType}_${Date.now()}`;
      await exportManager.export(document, format, filename);
      setShareMenuOpen(false);
    } catch (error) {
      console.error("Share failed:", error);
    }
  }, [document, documentType]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        const filename = `${documentType}_${Date.now()}`;
        const result = await exportManager.export(document, "html", filename);
        
        // Create a file for sharing
        const blob = new Blob([previewHTML], { type: "text/html" });
        const file = new File([blob], `${filename}.html`, { type: "text/html" });

        await navigator.share({
          title: documentType,
          text: `CafeOS ${documentType}`,
          files: [file]
        });
      } catch (error) {
        console.error("Native share failed:", error);
      }
    } else {
      // Fallback to share menu
      setShareMenuOpen(true);
    }
  }, [document, documentType, previewHTML]);

  const handlePrint = useCallback(() => {
    onPrint?.();
  }, [onPrint]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "var(--cafe-bg)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 12px",
            fontSize: 16,
            border: "none",
            background: "transparent",
            color: "var(--cafe-text-secondary)",
            cursor: "pointer"
          }}
        >
          ←
        </button>
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            margin: 0
          }}>
            Preview
          </h2>
          <p style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)",
            margin: "2px 0 0"
          }}>
            {documentType?.replace("_", " ").toUpperCase()}
          </p>
        </div>
        <button
          onClick={() => setShareMenuOpen(!shareMenuOpen)}
          style={{
            padding: "8px 12px",
            fontSize: 16,
            border: "none",
            background: "transparent",
            color: "var(--cafe-text-secondary)",
            cursor: "pointer"
          }}
        >
          ⋯
        </button>
      </div>

      {/* Share Menu */}
      {shareMenuOpen && (
        <div style={{
          position: "absolute",
          top: 60,
          right: 16,
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 8,
          zIndex: 1001,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
        }}>
          <ShareOption
            label="Share via..."
            icon="📤"
            onClick={handleNativeShare}
          />
          <ShareOption
            label="Download PDF"
            icon="📄"
            onClick={() => handleShare("pdf")}
          />
          <ShareOption
            label="Download CSV"
            icon="📊"
            onClick={() => handleShare("csv")}
          />
          <ShareOption
            label="Download JSON"
            icon="📋"
            onClick={() => handleShare("json")}
          />
        </div>
      )}

      {/* Paper Size Selector */}
      <div style={{
        padding: "12px 16px",
        background: "var(--cafe-bg-surface)",
        borderBottom: "1px solid var(--cafe-border-light)",
        display: "flex",
        gap: 8,
        overflowX: "auto"
      }}>
        {["58mm", "80mm", "A4"].map(size => (
          <button
            key={size}
            onClick={() => setPaperSize(size)}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              border: `1px solid ${paperSize === size ? "var(--cafe-accent)" : "var(--cafe-border)"}`,
              borderRadius: 8,
              background: paperSize === size ? "var(--cafe-accent)" : "var(--cafe-bg-card)",
              color: paperSize === size ? "white" : "var(--cafe-text-secondary)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Preview Area */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: 16,
        background: "var(--cafe-bg-surface)",
        display: "flex",
        justifyContent: "center"
      }}>
        <div
          dangerouslySetInnerHTML={{ __html: previewHTML }}
          style={{
            background: "white",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            maxWidth: paperSize === "A4" ? "100%" : paperSize === "80mm" ? "280px" : "200px",
            width: "100%"
          }}
        />
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        gap: 12
      }}>
        <button
          onClick={handleNativeShare}
          style={{
            flex: 1,
            padding: "14px",
            fontSize: 14,
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            background: "var(--cafe-bg-card)",
            color: "var(--cafe-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          📤 Share
        </button>
        <button
          onClick={handlePrint}
          style={{
            flex: 1,
            padding: "14px",
            fontSize: 14,
            border: "1px solid var(--cafe-accent)",
            borderRadius: 12,
            background: "var(--cafe-accent)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          🖨️ Print
        </button>
      </div>
    </div>
  );
}

// Share Option Component
function ShareOption({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 16px",
        fontSize: 13,
        border: "none",
        background: "transparent",
        color: "var(--cafe-text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 8,
        transition: "background 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--cafe-bg-surface)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
