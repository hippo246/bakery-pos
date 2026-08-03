// CafeOS PDF Generator
// Generate PDF documents from print content

import { renderReceipt } from "./receiptLayout.js";

// PDF Generator Class
class PDFGenerator {
  constructor() {
    this.isGenerating = false;
  }

  // Generate PDF from document content
  async generatePDF(document, paperSize = "A4", _options = {}) {
    this.isGenerating = true;

    try {
      // Render document to HTML
      const layout = renderReceipt(document, paperSize, "normal", "medium");
      const html = layout.toHTML();

      // Create PDF using browser's print functionality
      // In production, this would use a library like jsPDF or html2pdf
      const printWindow = window.open("", "_blank");
      
      if (!printWindow) {
        throw new Error("Failed to open print window. Please allow popups.");
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>CafeOS Document</title>
          <style>
            @page {
              size: ${paperSize === "A4" ? "A4" : paperSize === "80mm" ? "80mm" : "58mm"};
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
            }
            @media print {
              body { margin: 0; }
              no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${html}
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px;">
              Print / Save as PDF
            </button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();

      return { success: true, url: printWindow.location.href };

    } catch (error) {
      console.error("PDF generation failed:", error);
      return { success: false, error: error.message };
    } finally {
      this.isGenerating = false;
    }
  }

  // Download PDF directly
  async downloadPDF(document, filename, paperSize = "A4") {
    this.isGenerating = true;

    try {
      // Render document to HTML
      const layout = renderReceipt(document, paperSize, "normal", "medium");
      const html = layout.toHTML();

      // Create a printable version
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            @page {
              size: ${paperSize === "A4" ? "A4" : paperSize === "80mm" ? "80mm" : "58mm"};
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 10mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([printContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };

    } catch (error) {
      console.error("PDF download failed:", error);
      return { success: false, error: error.message };
    } finally {
      this.isGenerating = false;
    }
  }

  // Generate PDF from HTML string
  async generatePDFFromHTML(html, filename = "document") {
    this.isGenerating = true;

    try {
      const printWindow = window.open("", "_blank");
      
      if (!printWindow) {
        throw new Error("Failed to open print window. Please allow popups.");
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 10mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #000;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${html}
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px;">
              Print / Save as PDF
            </button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();

      return { success: true };

    } catch (error) {
      console.error("PDF generation from HTML failed:", error);
      return { success: false, error: error.message };
    } finally {
      this.isGenerating = false;
    }
  }

  // Check if PDF generation is in progress
  isBusy() {
    return this.isGenerating;
  }
}

// Singleton instance
const pdfGenerator = new PDFGenerator();

export default pdfGenerator;

// Helper function to generate and download PDF
export async function generateAndDownloadPDF(document, filename, paperSize = "A4") {
  return await pdfGenerator.downloadPDF(document, filename, paperSize);
}

// Helper function to generate PDF preview
export async function generatePDFPreview(document, paperSize = "A4") {
  return await pdfGenerator.generatePDF(document, paperSize);
}
