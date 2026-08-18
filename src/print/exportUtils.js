// CafeOS Export Utilities
// Export documents to PDF, CSV, JSON formats

import pdfGenerator from "./pdfGenerator.js";

// Export Formats
export const EXPORT_FORMATS = {
  PDF: "pdf",
  CSV: "csv",
  JSON: "json",
  HTML: "html"
};

// CSV Generator
class CSVGenerator {
  // Convert data to CSV
  generateCSV(data, options = {}) {
    const { headers = [], delimiter = ",", includeHeaders = true } = options;

    let csv = "";

    // Add headers if requested
    if (includeHeaders && headers.length > 0) {
      csv += `${headers.map(h => this.escapeCSV(h)).join(delimiter)  }\n`;
    }

    // Add data rows
    data.forEach(row => {
      if (Array.isArray(row)) {
        csv += `${row.map(cell => this.escapeCSV(cell)).join(delimiter)  }\n`;
      } else if (typeof row === "object") {
        const values = headers.length > 0 
          ? headers.map(h => row[h] ?? "")
          : Object.values(row);
        csv += `${values.map(cell => this.escapeCSV(cell)).join(delimiter)  }\n`;
      }
    });

    return csv;
  }

  // Escape CSV values
  escapeCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // Download CSV
  downloadCSV(data, filename, options = {}) {
    const csv = this.generateCSV(data, options);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// JSON Generator
class JSONGenerator {
  // Convert data to JSON
  generateJSON(data, options = {}) {
    const { pretty = true, indent = 2 } = options;
    return JSON.stringify(data, null, pretty ? indent : 0);
  }

  // Download JSON
  downloadJSON(data, filename, options = {}) {
    const json = this.generateJSON(data, options);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export Manager
class ExportManager {
  constructor() {
    this.csvGenerator = new CSVGenerator();
    this.jsonGenerator = new JSONGenerator();
  }

  // Export data to specified format
  async export(data, format, filename, options = {}) {
    switch (format) {
      case EXPORT_FORMATS.PDF:
        return await this.exportPDF(data, filename, options);
      case EXPORT_FORMATS.CSV:
        return this.exportCSV(data, filename, options);
      case EXPORT_FORMATS.JSON:
        return this.exportJSON(data, filename, options);
      case EXPORT_FORMATS.HTML:
        return this.exportHTML(data, filename, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Export to PDF
  async exportPDF(document, filename, options = {}) {
    const { paperSize = "A4" } = options;
    return await pdfGenerator.downloadPDF(document, filename, paperSize);
  }

  // Export to CSV
  exportCSV(data, filename, options = {}) {
    this.csvGenerator.downloadCSV(data, filename, options);
    return { success: true };
  }

  // Export to JSON
  exportJSON(data, filename, options = {}) {
    this.jsonGenerator.downloadJSON(data, filename, options);
    return { success: true };
  }

  // Export to HTML
  exportHTML(html, filename, _options = {}) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  }

  // Export order data
  exportOrder(order, format = EXPORT_FORMATS.PDF, options = {}) {
    const filename = `order_${order.orderNumber}_${new Date().toISOString().slice(0, 10)}`;

    switch (format) {
      case EXPORT_FORMATS.CSV:
        return this.exportOrderCSV(order, filename, options);
      case EXPORT_FORMATS.JSON:
        return this.exportOrderJSON(order, filename, options);
      case EXPORT_FORMATS.PDF:
        return this.exportOrderPDF(order, filename, options);
      default:
        throw new Error(`Unsupported format for order export: ${format}`);
    }
  }

  // Export order to CSV
  exportOrderCSV(order, filename, options = {}) {
    const headers = ["Order Number", "Date", "Cashier", "Table", "Items", "Subtotal", "Tax", "Total", "Payment Method"];
    const data = [{
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt).toLocaleString(),
      cashier: order.cashier || "N/A",
      table: order.table || "N/A",
      items: order.items?.map(i => `${i.name} x${i.quantity}`).join(", ") || "",
      subtotal: order.totals?.subtotal || 0,
      tax: order.totals?.tax || 0,
      total: order.totals?.total || 0,
      paymentMethod: order.payments?.map(p => p.method).join(", ") || ""
    }];

    return this.exportCSV(data, filename, { headers, ...options });
  }

  // Export order to JSON
  exportOrderJSON(order, filename, options = {}) {
    return this.exportJSON(order, filename, options);
  }

  // Export order to PDF
  async exportOrderPDF(order, filename, options = {}) {
    const document = {
      type: "receipt",
      data: order
    };
    return await this.exportPDF(document, filename, options);
  }

  // Export shift report
  exportShiftReport(report, format = EXPORT_FORMATS.PDF, options = {}) {
    const filename = `shift_report_${new Date(report.date).toISOString().slice(0, 10)}`;

    switch (format) {
      case EXPORT_FORMATS.CSV:
        return this.exportShiftReportCSV(report, filename, options);
      case EXPORT_FORMATS.JSON:
        return this.exportJSON(report, filename, options);
      case EXPORT_FORMATS.PDF:
        return this.exportShiftReportPDF(report, filename, options);
      default:
        throw new Error(`Unsupported format for shift report export: ${format}`);
    }
  }

  // Export shift report to CSV
  exportShiftReportCSV(report, filename, options = {}) {
    const headers = ["Date", "Cashier", "Total Revenue", "Cash", "UPI", "Card", "Refunds", "Voids", "Total Orders", "Average Order", "Cancelled Orders", "Cash Difference"];
    const data = [{
      date: new Date(report.date).toLocaleDateString(),
      cashier: report.cashier?.name || "N/A",
      totalRevenue: report.summary?.totalRevenue || 0,
      cash: report.summary?.cash || 0,
      upi: report.summary?.upi || 0,
      card: report.summary?.card || 0,
      refunds: report.summary?.refunds || 0,
      voids: report.summary?.voids || 0,
      totalOrders: report.summary?.totalOrders || 0,
      averageOrder: report.summary?.averageOrder || 0,
      cancelledOrders: report.summary?.cancelledOrders || 0,
      cashDifference: report.summary?.cashDifference || 0
    }];

    return this.exportCSV(data, filename, { headers, ...options });
  }

  // Export shift report to PDF
  async exportShiftReportPDF(report, filename, options = {}) {
    const document = {
      type: "shift_report",
      data: report
    };
    return await this.exportPDF(document, filename, options);
  }

  // Export inventory data
  exportInventory(items, format = EXPORT_FORMATS.CSV, options = {}) {
    const filename = `inventory_${new Date().toISOString().slice(0, 10)}`;

    switch (format) {
      case EXPORT_FORMATS.CSV:
        return this.exportInventoryCSV(items, filename, options);
      case EXPORT_FORMATS.JSON:
        return this.exportJSON(items, filename, options);
      default:
        throw new Error(`Unsupported format for inventory export: ${format}`);
    }
  }

  // Export inventory to CSV
  exportInventoryCSV(items, filename, options = {}) {
    const headers = ["Item Name", "SKU", "Category", "Quantity", "Unit", "Cost", "Price", "Stock Status"];
    const data = items.map(item => ({
      name: item.name || "",
      sku: item.sku || "",
      category: item.category || "",
      quantity: item.quantity || 0,
      unit: item.unit || "",
      cost: item.cost || 0,
      price: item.price || 0,
      stockStatus: item.stockStatus || "unknown"
    }));

    return this.exportCSV(data, filename, { headers, ...options });
  }

  // Export purchase order
  exportPurchaseOrder(order, format = EXPORT_FORMATS.PDF, options = {}) {
    const filename = `purchase_order_${order.poNumber}_${new Date().toISOString().slice(0, 10)}`;

    switch (format) {
      case EXPORT_FORMATS.CSV:
        return this.exportPurchaseOrderCSV(order, filename, options);
      case EXPORT_FORMATS.JSON:
        return this.exportJSON(order, filename, options);
      case EXPORT_FORMATS.PDF:
        return this.exportPurchaseOrderPDF(order, filename, options);
      default:
        throw new Error(`Unsupported format for purchase order export: ${format}`);
    }
  }

  // Export purchase order to CSV
  exportPurchaseOrderCSV(order, filename, options = {}) {
    const headers = ["PO Number", "Date", "Supplier", "Item", "Quantity", "Unit", "Price", "Total"];
    const data = order.items?.map(item => ({
      poNumber: order.poNumber,
      date: new Date(order.date).toLocaleDateString(),
      supplier: order.supplier?.name || "",
      item: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      total: item.quantity * item.price
    })) || [];

    return this.exportCSV(data, filename, { headers, ...options });
  }

  // Export purchase order to PDF
  async exportPurchaseOrderPDF(order, filename, options = {}) {
    const document = {
      type: "purchase_order",
      data: order
    };
    return await this.exportPDF(document, filename, options);
  }
}

// Singleton instance
const exportManager = new ExportManager();

export default exportManager;

// Helper functions for common exports
export function exportOrderToCSV(order, filename) {
  return exportManager.exportOrder(order, EXPORT_FORMATS.CSV, {}, filename);
}

export function exportOrderToJSON(order, filename) {
  return exportManager.exportOrder(order, EXPORT_FORMATS.JSON, {}, filename);
}

export function exportOrderToPDF(order, filename) {
  return exportManager.exportOrder(order, EXPORT_FORMATS.PDF, {}, filename);
}

export function exportShiftToCSV(report, filename) {
  return exportManager.exportShiftReport(report, EXPORT_FORMATS.CSV, {}, filename);
}

export function exportShiftToJSON(report, filename) {
  return exportManager.exportShiftReport(report, EXPORT_FORMATS.JSON, {}, filename);
}

export function exportShiftToPDF(report, filename) {
  return exportManager.exportShiftReport(report, EXPORT_FORMATS.PDF, {}, filename);
}

export function exportInventoryToCSV(items, filename) {
  return exportManager.exportInventory(items, EXPORT_FORMATS.CSV, {}, filename);
}

export function exportInventoryToJSON(items, filename) {
  return exportManager.exportInventory(items, EXPORT_FORMATS.JSON, {}, filename);
}
