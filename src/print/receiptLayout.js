// CafeOS Receipt Layout System
// Handles paper sizes, scaling, margins, and layout rendering

// Layout configurations for each paper size
const LAYOUT_CONFIGS = {
  "58mm": {
    width: 58,
    maxWidth: 384, // pixels at ~96 DPI
    charWidth: 32, // characters per line
    fontSize: {
      small: 10,
      medium: 12,
      large: 14
    },
    margins: {
      top: 8,
      bottom: 8,
      left: 4,
      right: 4
    },
    lineHeight: 1.2
  },
  "80mm": {
    width: 80,
    maxWidth: 576,
    charWidth: 48,
    fontSize: {
      small: 11,
      medium: 13,
      large: 16
    },
    margins: {
      top: 10,
      bottom: 10,
      left: 5,
      right: 5
    },
    lineHeight: 1.3
  },
  "A4": {
    width: 210,
    maxWidth: 794,
    charWidth: 80,
    fontSize: {
      small: 10,
      medium: 12,
      large: 14
    },
    margins: {
      top: 20,
      bottom: 20,
      left: 15,
      right: 15
    },
    lineHeight: 1.4
  }
};

// Spacing configurations
const SPACING_CONFIGS = {
  compact: {
    sectionGap: 8,
    itemGap: 4,
    lineGap: 2
  },
  normal: {
    sectionGap: 12,
    itemGap: 6,
    lineGap: 3
  },
  spacious: {
    sectionGap: 16,
    itemGap: 8,
    lineGap: 4
  }
};

// Text alignment helpers
const ALIGNMENT = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right"
};

// Font styles
const FONT_STYLE = {
  NORMAL: "normal",
  BOLD: "bold",
  ITALIC: "italic"
};

// Font sizes
const FONT_SIZE = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large"
};

// Receipt Layout Renderer
class ReceiptLayout {
  constructor(paperSize = "80mm", spacing = "normal", fontSize = "medium") {
    this.paperSize = paperSize;
    this.spacing = spacing;
    this.fontSize = fontSize;
    this.config = LAYOUT_CONFIGS[paperSize] || LAYOUT_CONFIGS["80mm"];
    this.spacingConfig = SPACING_CONFIGS[spacing] || SPACING_CONFIGS.normal;
    this.content = [];
    this.currentY = 0;
  }

  // Set paper size
  setPaperSize(size) {
    this.paperSize = size;
    this.config = LAYOUT_CONFIGS[size] || LAYOUT_CONFIGS["80mm"];
  }

  // Set spacing
  setSpacing(spacing) {
    this.spacing = spacing;
    this.spacingConfig = SPACING_CONFIGS[spacing] || SPACING_CONFIGS.normal;
  }

  // Set font size
  setFontSize(size) {
    this.fontSize = size;
  }

  // Get effective font size in pixels
  getFontSizePx() {
    return this.config.fontSize[this.fontSize] || this.config.fontSize.medium;
  }

  // Get line height in pixels
  getLineHeight() {
    return this.getFontSizePx() * this.config.lineHeight;
  }

  // Add text content
  addText(text, options = {}) {
    const {
      align = ALIGNMENT.LEFT,
      style = FONT_STYLE.NORMAL,
      size = this.fontSize,
      bold = false
    } = options;

    this.content.push({
      type: "text",
      text,
      align,
      style: bold ? FONT_STYLE.BOLD : style,
      size,
      y: this.currentY
    });

    this.currentY += this.getLineHeight();
  }

  // Add line separator
  addLine() {
    this.content.push({
      type: "line",
      y: this.currentY
    });
    this.currentY += this.spacingConfig.lineGap;
  }

  // Add section gap
  addSectionGap() {
    this.currentY += this.spacingConfig.sectionGap;
  }

  // Add item gap
  addItemGap() {
    this.currentY += this.spacingConfig.itemGap;
  }

  // Add QR code
  addQRCode(data, options = {}) {
    const {
      size = 100,
      align = ALIGNMENT.CENTER
    } = options;

    this.content.push({
      type: "qr",
      data,
      size,
      align,
      y: this.currentY
    });

    this.currentY += size + this.spacingConfig.itemGap;
  }

  // Add barcode
  addBarcode(data, options = {}) {
    const {
      width = 200,
      height = 50,
      align = ALIGNMENT.CENTER
    } = options;

    this.content.push({
      type: "barcode",
      data,
      width,
      height,
      align,
      y: this.currentY
    });

    this.currentY += height + this.spacingConfig.itemGap;
  }

  // Add image
  addImage(src, options = {}) {
    const {
      width = 100,
      height = 100,
      align = ALIGNMENT.CENTER
    } = options;

    this.content.push({
      type: "image",
      src,
      width,
      height,
      align,
      y: this.currentY
    });

    this.currentY += height + this.spacingConfig.itemGap;
  }

  // Add table
  addTable(headers, rows, options = {}) {
    const {
      align = ALIGNMENT.LEFT
    } = options;

    const rowHeight = this.getLineHeight() * 1.5;
    const colWidths = this.calculateColumnWidths(headers.length);

    // Headers
    this.content.push({
      type: "table-header",
      headers,
      colWidths,
      align,
      y: this.currentY
    });
    this.currentY += rowHeight;

    // Rows
    rows.forEach(row => {
      this.content.push({
        type: "table-row",
        cells: row,
        colWidths,
        align,
        y: this.currentY
      });
      this.currentY += rowHeight;
    });

    this.addItemGap();
  }

  // Calculate column widths for tables
  calculateColumnWidths(numCols) {
    const availableWidth = this.config.maxWidth - (this.config.margins.left + this.config.margins.right);
    const colWidth = Math.floor(availableWidth / numCols);
    return Array(numCols).fill(colWidth);
  }

  // Get total height
  getTotalHeight() {
    return this.currentY + this.config.margins.bottom;
  }

  // Check if content fits on page
  fitsOnPage(maxHeight = 2000) {
    return this.getTotalHeight() <= maxHeight;
  }

  // Render to HTML (for preview)
  toHTML() {
    const fontSize = this.getFontSizePx();
    const containerWidth = this.config.maxWidth;
    const margins = this.config.margins;

    let html = `<div style="
      width: ${containerWidth}px;
      font-family: 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${this.config.lineHeight};
      color: #000;
      background: #fff;
      padding: ${margins.top}px ${margins.left}px ${margins.bottom}px ${margins.left}px;
      box-sizing: border-box;
      overflow: hidden;
    ">`;

    this.content.forEach(item => {
      switch (item.type) {
        case "text": {
          const textAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          const fontWeight = item.style === FONT_STYLE.BOLD ? "bold" : "normal";
          const itemFontSize = this.config.fontSize[item.size] || fontSize;
          // Truncate text if it exceeds character width
          const maxChars = this.config.charWidth;
          const truncatedText = item.text.length > maxChars ? item.text.substring(0, maxChars) : item.text;
          html += `<div style="
            text-align: ${textAlign};
            font-weight: ${fontWeight};
            font-size: ${itemFontSize}px;
            margin-bottom: ${this.spacingConfig.lineGap}px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${this.escapeHTML(truncatedText)}</div>`;
          break;
        }

        case "line":
          html += `<div style="
            border-top: 1px dashed #000;
            margin: ${this.spacingConfig.lineGap}px 0;
          "></div>`;
          break;

        case "qr": {
          const qrAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          html += `<div style="text-align: ${qrAlign}; margin: ${this.spacingConfig.itemGap}px 0;">
            <div style="
              width: ${item.size}px;
              height: ${item.size}px;
              background: #f0f0f0;
              display: inline-block;
              border: 1px solid #ccc;
            ">QR: ${item.data}</div>
          </div>`;
          break;
        }

        case "barcode": {
          const barcodeAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          html += `<div style="text-align: ${barcodeAlign}; margin: ${this.spacingConfig.itemGap}px 0;">
            <div style="
              width: ${item.width}px;
              height: ${item.height}px;
              background: repeating-linear-gradient(
                90deg,
                #000,
                #000 2px,
                #fff 2px,
                #fff 4px
              );
              display: inline-block;
            "></div>
            <div style="font-size: 10px; margin-top: 2px;">${item.data}</div>
          </div>`;
          break;
        }

        case "image": {
          const imgAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          html += `<div style="text-align: ${imgAlign}; margin: ${this.spacingConfig.itemGap}px 0;">
            <img src="${item.src}" style="width: ${item.width}px; height: ${item.height}px; object-fit: contain;" />
          </div>`;
          break;
        }

        case "table-header": {
          const headerAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          html += `<div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px;">`;
          item.headers.forEach((header, _i) => {
            html += `<div style="flex: 1; text-align: ${headerAlign}; font-weight: bold; padding: 0 4px;">${this.escapeHTML(header)}</div>`;
          });
          html += `</div>`;
          break;
        }

        case "table-row": {
          const rowAlign = item.align === "center" ? "center" : item.align === "right" ? "right" : "left";
          html += `<div style="display: flex; padding: 2px 0;">`;
          item.cells.forEach((cell, _i) => {
            html += `<div style="flex: 1; text-align: ${rowAlign}; padding: 0 4px;">${this.escapeHTML(cell)}</div>`;
          });
          html += `</div>`;
          break;
        }
      }
    });

    html += "</div>";
    return html;
  }

  // Render to plain text (for thermal printers)
  toText() {
    const charWidth = this.config.charWidth;
    let text = "";

    this.content.forEach(item => {
      switch (item.type) {
        case "text": {
          const alignedText = this.alignText(item.text, item.align, charWidth);
          text += `${alignedText  }\n`;
          break;
        }

        case "line":
          text += `${"-".repeat(charWidth)  }\n`;
          break;

        case "qr":
          text += `[QR: ${item.data}]\n`;
          break;

        case "barcode":
          text += `[BARCODE: ${item.data}]\n`;
          break;

        case "table-header": {
          item.headers.forEach((header, _i) => {
            const colWidth = Math.floor(charWidth / item.headers.length);
            text += this.padText(header, colWidth, item.align);
          });
          text += "\n";
          break;
        }

        case "table-row": {
          item.cells.forEach((cell, _i) => {
            const colWidth = Math.floor(charWidth / item.cells.length);
            text += this.padText(cell, colWidth, item.align);
          });
          text += "\n";
          break;
        }
      }
    });

    return text;
  }

  // Align text within character width
  alignText(text, align, width) {
    if (align === ALIGNMENT.CENTER) {
      const padding = Math.floor((width - text.length) / 2);
      return " ".repeat(padding) + text + " ".repeat(width - text.length - padding);
    } else if (align === ALIGNMENT.RIGHT) {
      return " ".repeat(width - text.length) + text;
    }
    return text.padEnd(width);
  }

  // Pad text for table cells
  padText(text, width, align) {
    const truncated = text.length > width ? `${text.substring(0, width - 3)  }...` : text;
    return this.alignText(truncated, align, width);
  }

  // Escape HTML entities
  escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Clear content
  clear() {
    this.content = [];
    this.currentY = 0;
  }

  // Clone layout
  clone() {
    const clone = new ReceiptLayout(this.paperSize, this.spacing, this.fontSize);
    clone.content = [...this.content];
    clone.currentY = this.currentY;
    return clone;
  }
}

// Helper function to create a receipt layout
export function createReceiptLayout(paperSize = "80mm", spacing = "normal", fontSize = "medium") {
  return new ReceiptLayout(paperSize, spacing, fontSize);
}

// Helper function to render receipt from content array
export function renderReceipt(content, paperSize = "80mm", spacing = "normal", fontSize = "medium") {
  const layout = new ReceiptLayout(paperSize, spacing, fontSize);

  content.forEach(item => {
    switch (item.type) {
      case "text":
        layout.addText(item.content, {
          align: item.align,
          style: item.style,
          size: item.size,
          bold: item.style === "bold"
        });
        break;

      case "line":
        layout.addLine();
        break;

      case "qr":
        layout.addQRCode(item.content, {
          size: item.size || 100,
          align: item.align
        });
        break;

      case "barcode":
        layout.addBarcode(item.content, {
          width: item.width || 200,
          height: item.height || 50,
          align: item.align
        });
        break;

      case "image":
        layout.addImage(item.src, {
          width: item.width || 100,
          height: item.height || 100,
          align: item.align
        });
        break;

      case "checkbox":
        layout.addText(`[ ] ${item.content}`, { align: item.align });
        break;
    }
  });

  return layout;
}

// Export constants
export { ALIGNMENT, FONT_STYLE, FONT_SIZE, LAYOUT_CONFIGS, SPACING_CONFIGS };
export default ReceiptLayout;
