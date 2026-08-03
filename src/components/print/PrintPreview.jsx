import React from 'react';
// CafeOS Print Preview Component
// Live preview for all printable documents with PDF download and test print

import { useState, useCallback, useEffect, useRef } from "react";
import { renderReceipt } from "../../print/receiptLayout.js";
import printEngine from "../../print/printEngine.js";

export default function PrintPreview({ document, documentType, onClose, onPrint, onDownload, isMobile }) {
  const [previewHTML, setPreviewHTML] = useState("");
  const [paperSize, setPaperSize] = useState("80mm");
  const [scale, setScale] = useState(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (document) {
      generatePreview();
    }
  }, [document, paperSize]);

  // Keyboard shortcut to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const generatePreview = useCallback(() => {
    if (!document) return;

    try {
      const layout = renderReceipt(document, paperSize, "normal", "medium");
      const html = layout.toHTML();
      setPreviewHTML(html);
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  }, [document, paperSize]);

  const handlePrint = useCallback(async () => {
    try {
      await printEngine.addToQueue({
        type: documentType,
        data: document,
        paperSize: paperSize
      });
      onPrint?.();
    } catch (error) {
      console.error("Print failed:", error);
    }
  }, [document, documentType, paperSize, onPrint]);

  const handleDownloadPDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    try {
      // Generate PDF from preview HTML
      // In production, this would use a library like jsPDF or html2pdf
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Preview</title>
            <style>
              body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${previewHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      onDownload?.();
    } catch (error) {
      console.error("PDF download failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [previewHTML, onDownload]);

  const handleTestPrint = useCallback(() => {
    window.print();
  }, []);

  const handleScaleChange = useCallback((newScale) => {
    setScale(newScale);
  }, []);

  const paperSizes = [
    { value: "58mm", label: "58mm", width: 200 },
    { value: "80mm", label: "80mm", width: 280 },
    { value: "A4", label: "A4", width: 400 }
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "var(--cafe-bg)",
        borderRadius: 16,
        width: isMobile ? "95%" : "90%",
        maxWidth: 1200,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--cafe-border-light)",
          background: "var(--cafe-bg-elevated)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              margin: 0
            }}>
              Print Preview
            </h2>
            <p style={{
              fontSize: isMobile ? 11 : 12,
              color: "var(--cafe-text-tertiary)",
              margin: "4px 0 0"
            }}>
              {documentType?.replace("_", " ").toUpperCase() || "Document"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              fontSize: 18,
              border: "none",
              background: "transparent",
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              borderRadius: 8
            }}
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--cafe-border-light)",
          background: "var(--cafe-bg-surface)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          {/* Paper Size Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Paper:</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                border: "1px solid var(--cafe-border)",
                borderRadius: 6,
                background: "var(--cafe-bg-card)",
                color: "var(--cafe-text-primary)"
              }}
            >
              {paperSizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          {/* Scale Control */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Zoom:</label>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => handleScaleChange(Math.max(0.5, scale - 0.1))}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  background: "var(--cafe-bg-card)",
                  color: "var(--cafe-text-primary)",
                  cursor: "pointer"
                }}
              >
                -
              </button>
              <span style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "var(--cafe-bg-card)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 6,
                color: "var(--cafe-text-primary)",
                minWidth: 50,
                textAlign: "center"
              }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => handleScaleChange(Math.min(2, scale + 0.1))}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  background: "var(--cafe-bg-card)",
                  color: "var(--cafe-text-primary)",
                  cursor: "pointer"
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={handleTestPrint}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                background: "var(--cafe-bg-card)",
                color: "var(--cafe-text-primary)",
                cursor: "pointer"
              }}
            >
              Test Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                border: "1px solid var(--cafe-accent)",
                borderRadius: 8,
                background: "var(--cafe-accent)",
                color: "white",
                cursor: isGeneratingPDF ? "not-allowed" : "pointer",
                opacity: isGeneratingPDF ? 0.6 : 1
              }}
            >
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                border: "1px solid var(--cafe-success)",
                borderRadius: 8,
                background: "var(--cafe-success)",
                color: "white",
                cursor: "pointer"
              }}
            >
              Print
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
          background: "var(--cafe-bg-surface)",
          display: "flex",
          justifyContent: "center"
        }}>
          <div
            ref={previewRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease"
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: previewHTML }}
              style={{
                background: "white",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                maxWidth: paperSizes.find(s => s.value === paperSize)?.width || 280
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--cafe-border-light)",
          background: "var(--cafe-bg-elevated)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--cafe-text-tertiary)"
        }}>
          <span>Preview rendered at {paperSize} paper size</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
