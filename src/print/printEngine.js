// CafeOS Print Engine - Centralized Commercial Grade Print System
// All printable documents flow through this unified engine

import { createSecurityAuditLog } from "../domain/auditLogModel.js";
import { getCurrentUserId } from "../utils/authService.js";

// Document Types Registry
export const DOCUMENT_TYPES = {
  RECEIPT: "receipt",
  KITCHEN_TICKET: "kitchen_ticket",
  CUSTOMER_BILL: "customer_bill",
  INVOICE: "invoice",
  CREDIT_NOTE: "credit_note",
  REFUND_RECEIPT: "refund_receipt",
  SHIFT_REPORT: "shift_report",
  STOCK_ADJUSTMENT: "stock_adjustment",
  PURCHASE_ORDER: "purchase_order",
  PRODUCTION_BATCH: "production_batch",
  RESERVATION_SLIP: "reservation_slip",
  STAFF_SHIFT_SUMMARY: "staff_shift_summary"
};

// Paper Sizes
export const PAPER_SIZES = {
  MM58: { width: 58, name: "58mm Thermal", maxWidth: 384 },
  MM80: { width: 80, name: "80mm Thermal", maxWidth: 576 },
  A4: { width: 210, name: "A4", maxWidth: 794 },
  PDF: { width: 210, name: "PDF", maxWidth: 794 }
};

// Print Status
export const PRINT_STATUS = {
  PENDING: "pending",
  PRINTING: "printing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
};

// Print Queue (in-memory, persisted to localStorage)
let printQueue = [];
let printHistory = [];

// Load from localStorage
try {
  const savedQueue = localStorage.getItem("cafeos_print_queue");
  const savedHistory = localStorage.getItem("cafeos_print_history");
  if (savedQueue) printQueue = JSON.parse(savedQueue);
  if (savedHistory) printHistory = JSON.parse(savedHistory);
} catch (e) {
  console.warn("Failed to load print queue/history:", e);
}

// Save to localStorage
const saveQueue = () => {
  try {
    localStorage.setItem("cafeos_print_queue", JSON.stringify(printQueue));
  } catch {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn('[PrintEngine] Failed to save print queue to storage');
  }
};

const saveHistory = () => {
  try {
    localStorage.setItem("cafeos_print_history", JSON.stringify(printHistory));
  } catch {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn('[PrintEngine] Failed to save print history to storage');
  }
};

// Generate unique print job ID
const generatePrintId = () => {
  return `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Core Print Engine Class
class PrintEngine {
  constructor() {
    this.printers = new Map();
    this.defaultPrinter = null;
    this.paperSize = PAPER_SIZES.MM80;
    this.listeners = new Set();
  }

  // Register a printer
  registerPrinter(id, config) {
    this.printers.set(id, {
      id,
      name: config.name || `Printer ${id}`,
      type: config.type || "thermal",
      paperSize: config.paperSize || PAPER_SIZES.MM80,
      status: "online",
      lastUsed: null,
      ...config
    });

    if (!this.defaultPrinter) {
      this.defaultPrinter = id;
    }

    this.notifyListeners("printer_registered", { id, config });
  }

  // Unregister a printer
  unregisterPrinter(id) {
    this.printers.delete(id);
    if (this.defaultPrinter === id) {
      this.defaultPrinter = this.printers.keys().next().value || null;
    }
    this.notifyListeners("printer_unregistered", { id });
  }

  // Get printer by ID
  getPrinter(id) {
    return this.printers.get(id);
  }

  // Get all printers
  getAllPrinters() {
    return Array.from(this.printers.values());
  }

  // Set default printer
  setDefaultPrinter(id) {
    if (this.printers.has(id)) {
      this.defaultPrinter = id;
      this.notifyListeners("default_printer_changed", { id });
    }
  }

  // Set paper size
  setPaperSize(size) {
    this.paperSize = size;
    this.notifyListeners("paper_size_changed", { size });
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  // Validate printer status
  async validatePrinter(printerId) {
    const printer = this.getPrinter(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    // Simulate printer status check
    // In production, this would check actual printer connectivity
    const isOnline = Math.random() > 0.1; // 90% chance online for demo

    printer.status = isOnline ? "online" : "offline";
    printer.lastChecked = new Date().toISOString();

    if (!isOnline) {
      throw new Error(`Printer ${printer.name} is offline`);
    }

    return printer;
  }

  // Add print job to queue
  async addToQueue(document) {
    const printId = generatePrintId();
    const job = {
      id: printId,
      documentType: document.type,
      documentData: document.data,
      template: document.template,
      printerId: document.printerId || this.defaultPrinter,
      paperSize: document.paperSize || this.paperSize,
      copies: document.copies || 1,
      status: PRINT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUserId(),
      priority: document.priority || "normal",
      requiresApproval: document.requiresApproval || false,
      approved: !document.requiresApproval,
      approvedBy: null,
      approvedAt: null,
      retryCount: 0,
      maxRetries: 3
    };

    printQueue.push(job);
    saveQueue();

    this.notifyListeners("job_added", job);

    // Auto-process if approved
    if (job.approved) {
      this.processQueue();
    }

    return job;
  }

  // Process print queue
  async processQueue() {
    const pendingJobs = printQueue.filter(job => 
      job.status === PRINT_STATUS.PENDING && job.approved
    );

    for (const job of pendingJobs) {
      await this.printJob(job.id);
    }
  }

  // Print a specific job
  async printJob(jobId) {
    const jobIndex = printQueue.findIndex(j => j.id === jobId);
    if (jobIndex === -1) {
      throw new Error(`Print job ${jobId} not found`);
    }

    const job = printQueue[jobIndex];

    try {
      // Update status to printing
      job.status = PRINT_STATUS.PRINTING;
      job.startedAt = new Date().toISOString();
      saveQueue();

      // Validate printer
      await this.validatePrinter(job.printerId);

      // Generate document content
      const content = this.generateDocument(job);

      // Send to printer (simulated)
      await this.sendToPrinter(job.printerId, content);

      // Update status to completed
      job.status = PRINT_STATUS.COMPLETED;
      job.completedAt = new Date().toISOString();

      // Add to history
      printHistory.unshift({
        id: job.id,
        documentType: job.documentType,
        printerId: job.printerId,
        copies: job.copies,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        createdBy: job.createdBy,
        duration: job.completedAt - new Date(job.startedAt).getTime()
      });

      // Remove from queue
      printQueue.splice(jobIndex, 1);
      saveQueue();
      saveHistory();

      this.notifyListeners("job_completed", job);

      // Audit log
      createSecurityAuditLog({
        action: "print_completed",
        details: {
          documentType: job.documentType,
          printerId: job.printerId,
          jobId: job.id
        }
      });

      return job;

    } catch (error) {
      // Update status to failed
      job.status = PRINT_STATUS.FAILED;
      job.error = error.message;
      job.failedAt = new Date().toISOString();
      job.retryCount++;

      saveQueue();

      this.notifyListeners("job_failed", job);

      // Auto-retry if under max retries
      if (job.retryCount < job.maxRetries) {
        setTimeout(() => {
          job.status = PRINT_STATUS.PENDING;
          saveQueue();
          this.processQueue();
        }, 2000 * job.retryCount);
      }

      throw error;
    }
  }

  // Generate document content based on type
  generateDocument(job) {
    const { documentType, documentData, template, paperSize } = job;

    switch (documentType) {
      case DOCUMENT_TYPES.RECEIPT:
        return this.generateReceipt(documentData, template, paperSize);
      case DOCUMENT_TYPES.KITCHEN_TICKET:
        return this.generateKitchenTicket(documentData, template, paperSize);
      case DOCUMENT_TYPES.SHIFT_REPORT:
        return this.generateShiftReport(documentData, template, paperSize);
      case DOCUMENT_TYPES.PURCHASE_ORDER:
        return this.generatePurchaseOrder(documentData, template, paperSize);
      case DOCUMENT_TYPES.RESERVATION_SLIP:
        return this.generateReservationSlip(documentData, template, paperSize);
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }
  }

  // Generate receipt content
  generateReceipt(data, template, _paperSize) {
    const { businessInfo, order, items, payments, taxes, totals } = data;

    const content = [];

    // Header
    if (template.showHeader) {
      content.push({
        type: "text",
        align: "center",
        style: "bold",
        size: "large",
        content: businessInfo.name
      });
      content.push({
        type: "text",
        align: "center",
        style: "normal",
        content: businessInfo.address || ""
      });
      content.push({
        type: "text",
        align: "center",
        style: "normal",
        content: businessInfo.phone || ""
      });
      content.push({ type: "line" });
    }

    // Order info
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Order #: ${order.orderNumber}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Date: ${new Date(order.createdAt).toLocaleString()}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Cashier: ${order.cashier || "N/A"}`
    });
    if (template.showTerminal && order.terminalId) {
      content.push({
        type: "text",
        align: "left",
        style: "normal",
        content: `Terminal: ${order.terminalId}`
      });
    }
    if (order.table) {
      content.push({
        type: "text",
        align: "left",
        style: "normal",
        content: `Table: ${order.table}`
      });
    }
    content.push({ type: "line" });

    // Items
    items.forEach(item => {
      content.push({
        type: "text",
        align: "left",
        style: "normal",
        content: `${item.name} x${item.quantity}`
      });
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          content.push({
            type: "text",
            align: "left",
            style: "normal",
            content: `  + ${mod.name}`
          });
        });
      }
      content.push({
        type: "text",
        align: "right",
        style: "normal",
        content: `₹${(item.price * item.quantity).toFixed(2)}`
      });
    });

    content.push({ type: "line" });

    // Totals
    content.push({
      type: "text",
      align: "right",
      style: "normal",
      content: `Subtotal: ₹${totals.subtotal.toFixed(2)}`
    });
    if (taxes && taxes.length > 0) {
      taxes.forEach(tax => {
        content.push({
          type: "text",
          align: "right",
          style: "normal",
          content: `${tax.name}: ₹${tax.amount.toFixed(2)}`
        });
      });
    }
    if (totals.discount > 0) {
      content.push({
        type: "text",
        align: "right",
        style: "normal",
        content: `Discount: -₹${totals.discount.toFixed(2)}`
      });
    }
    content.push({
      type: "text",
      align: "right",
      style: "bold",
      size: "large",
      content: `TOTAL: ₹${totals.total.toFixed(2)}`
    });

    // Payments
    if (payments && payments.length > 0) {
      content.push({ type: "line" });
      payments.forEach(payment => {
        content.push({
          type: "text",
          align: "left",
          style: "normal",
          content: `${payment.method}: ₹${payment.amount.toFixed(2)}`
        });
      });
    }

    // Footer
    if (template.showFooter) {
      content.push({ type: "line" });
      content.push({
        type: "text",
        align: "center",
        style: "normal",
        content: template.footerMessage || "Thank you for your order!"
      });
      if (template.showQR) {
        content.push({
          type: "qr",
          align: "center",
          content: order.orderNumber
        });
      }
      if (template.showTerms) {
        content.push({
          type: "text",
          align: "center",
          style: "normal",
          size: "small",
          content: template.terms || "Terms & Conditions Apply"
        });
      }
    }

    return content;
  }

  // Generate kitchen ticket content
  generateKitchenTicket(data, _template, _paperSize) {
    const { order, items, station, urgency } = data;

    const content = [];

    // Header with urgency
    if (urgency === "high") {
      content.push({
        type: "text",
        align: "center",
        style: "bold",
        size: "large",
        content: "⚠ URGENT ⚠"
      });
    }

    content.push({
      type: "text",
      align: "center",
      style: "bold",
      size: "large",
      content: station.name
    });
    content.push({ type: "line" });

    // Order info
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      size: "large",
      content: `Order #${order.orderNumber}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Table: ${order.table || "Takeaway"}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Time: ${new Date(order.createdAt).toLocaleTimeString()}`
    });

    // Elapsed time
    const elapsed = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: `Elapsed: ${elapsed} min`
    });

    content.push({ type: "line" });

    // Items with large fonts
    items.forEach(item => {
      content.push({
        type: "text",
        align: "left",
        style: "bold",
        size: "large",
        content: `${item.quantity}x ${item.name}`
      });

      // Modifiers
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          content.push({
            type: "text",
            align: "left",
            style: "normal",
            content: `  ${mod.name}`
          });
        });
      }

      // Allergy warnings
      if (item.allergens && item.allergens.length > 0) {
        content.push({
          type: "text",
          align: "left",
          style: "bold",
          content: `ALLERGENS: ${item.allergens.join(", ")}`
        });
      }

      // Item checklist
      content.push({
        type: "checkbox",
        align: "left",
        content: item.name
      });

      content.push({ type: "line" });
    });

    // Reprint watermark
    if (data.isReprint) {
      content.push({
        type: "text",
        align: "center",
        style: "bold",
        content: "*** REPRINT ***"
      });
    }

    return content;
  }

  // Generate shift report content
  generateShiftReport(data, _template, _paperSize) {
    const { shift, summary, _transactions, cashier } = data;

    const content = [];

    // Header
    content.push({
      type: "text",
      align: "center",
      style: "bold",
      size: "large",
      content: "SHIFT REPORT"
    });
    content.push({ type: "line" });

    // Shift info
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Cashier: ${cashier.name}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Shift: ${shift.startTime} - ${shift.endTime}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Date: ${new Date(shift.date).toLocaleDateString()}`
    });
    content.push({ type: "line" });

    // Summary
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: "REVENUE SUMMARY"
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Total Revenue: ₹${summary.totalRevenue.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Cash: ₹${summary.cash.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `UPI: ₹${summary.upi.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Card: ₹${summary.card.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Refunds: ₹${summary.refunds.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Voids: ₹${summary.voids.toFixed(2)}`
    });
    content.push({ type: "line" });

    // Stats
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: "STATISTICS"
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Total Orders: ${summary.totalOrders}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Average Order: ₹${summary.averageOrder.toFixed(2)}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Cancelled Orders: ${summary.cancelledOrders}`
    });
    content.push({ type: "line" });

    // Cash difference
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: `Cash Difference: ₹${summary.cashDifference.toFixed(2)}`
    });

    // Signature line
    content.push({ type: "line" });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: "Manager Signature: _________________"
    });

    return content;
  }

  // Generate purchase order content
  generatePurchaseOrder(data, _template, _paperSize) {
    const { order, supplier, items, businessInfo } = data;

    const content = [];

    // Header
    content.push({
      type: "text",
      align: "center",
      style: "bold",
      size: "large",
      content: "PURCHASE ORDER"
    });
    content.push({ type: "line" });

    // Business info
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: businessInfo.name
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: businessInfo.address || ""
    });
    content.push({ type: "line" });

    // Order info
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `PO #: ${order.poNumber}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Date: ${new Date(order.date).toLocaleDateString()}`
    });
    content.push({ type: "line" });

    // Supplier info
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: "Supplier:"
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: supplier.name
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: supplier.address || ""
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: supplier.phone || ""
    });
    content.push({ type: "line" });

    // Items
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: "Items:"
    });
    items.forEach(item => {
      content.push({
        type: "text",
        align: "left",
        style: "normal",
        content: `${item.name} x${item.quantity}`
      });
      content.push({
        type: "text",
        align: "left",
        style: "normal",
        content: `  Unit: ${item.unit}`
      });
      content.push({
        type: "text",
        align: "right",
        style: "normal",
        content: `₹${(item.price * item.quantity).toFixed(2)}`
      });
    });

    content.push({ type: "line" });

    // Total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    content.push({
      type: "text",
      align: "right",
      style: "bold",
      size: "large",
      content: `Total: ₹${total.toFixed(2)}`
    });

    // Expected delivery
    content.push({ type: "line" });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Expected Delivery: ${new Date(order.expectedDelivery).toLocaleDateString()}`
    });

    // Signature
    content.push({ type: "line" });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: "Authorized Signature: _________________"
    });

    return content;
  }

  // Generate reservation slip content
  generateReservationSlip(data, template, _paperSize) {
    const { reservation, businessInfo } = data;

    const content = [];

    // Header
    content.push({
      type: "text",
      align: "center",
      style: "bold",
      size: "large",
      content: businessInfo.name
    });
    content.push({
      type: "text",
      align: "center",
      style: "normal",
      content: "RESERVATION CONFIRMATION"
    });
    content.push({ type: "line" });

    // Reservation details
    content.push({
      type: "text",
      align: "left",
      style: "bold",
      content: `Guest: ${reservation.guestName}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Date: ${new Date(reservation.date).toLocaleDateString()}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Time: ${reservation.time}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Party Size: ${reservation.partySize}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Table: ${reservation.table || "To be assigned"}`
    });
    content.push({
      type: "text",
      align: "left",
      style: "normal",
      content: `Confirmation #: ${reservation.confirmationNumber}`
    });
    content.push({ type: "line" });

    // QR code
    if (template.showQR) {
      content.push({
        type: "qr",
        align: "center",
        content: reservation.confirmationNumber
      });
    }

    // Footer
    content.push({
      type: "text",
      align: "center",
      style: "normal",
      content: "Please present this confirmation upon arrival"
    });

    return content;
  }

  // Send to printer (simulated)
  async sendToPrinter(printerId, content) {
    const printer = this.getPrinter(printerId);
    
    // Simulate print delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would:
    // 1. Convert content to printer-specific format
    // 2. Send via WebUSB, Web Bluetooth, or network print server
    // 3. Handle printer-specific commands (ESC/POS for thermal, etc.)

    console.log(`Printing to ${printer.name}:`, content);

    return { success: true };
  }

  // Approve a print job (for sensitive documents)
  approveJob(jobId, approverId) {
    const job = printQueue.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Print job ${jobId} not found`);
    }

    job.approved = true;
    job.approvedBy = approverId;
    job.approvedAt = new Date().toISOString();
    saveQueue();

    this.notifyListeners("job_approved", job);

    // Audit log
    createSecurityAuditLog({
      action: "print_approved",
      details: {
        documentType: job.documentType,
        jobId: job.id,
        approver: approverId
      }
    });

    // Process the job
    this.processQueue();

    return job;
  }

  // Cancel a print job
  cancelJob(jobId) {
    const jobIndex = printQueue.findIndex(j => j.id === jobId);
    if (jobIndex === -1) {
      throw new Error(`Print job ${jobId} not found`);
    }

    const job = printQueue[jobIndex];
    job.status = PRINT_STATUS.CANCELLED;
    job.cancelledAt = new Date().toISOString();
    saveQueue();

    printQueue.splice(jobIndex, 1);
    saveQueue();

    this.notifyListeners("job_cancelled", job);

    return job;
  }

  // Retry a failed job
  retryJob(jobId) {
    const job = printQueue.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Print job ${jobId} not found`);
    }

    if (job.status !== PRINT_STATUS.FAILED) {
      throw new Error(`Job ${jobId} is not in failed state`);
    }

    job.status = PRINT_STATUS.PENDING;
    job.retryCount = 0;
    saveQueue();

    this.notifyListeners("job_retried", job);

    this.processQueue();

    return job;
  }

  // Get queue status
  getQueueStatus() {
    return {
      pending: printQueue.filter(j => j.status === PRINT_STATUS.PENDING).length,
      printing: printQueue.filter(j => j.status === PRINT_STATUS.PRINTING).length,
      completed: printHistory.length,
      failed: printQueue.filter(j => j.status === PRINT_STATUS.FAILED).length
    };
  }

  // Get print history
  getHistory(limit = 50) {
    return printHistory.slice(0, limit);
  }

  // Clear history
  clearHistory() {
    printHistory = [];
    saveHistory();
    this.notifyListeners("history_cleared", {});
  }
}

// Singleton instance
const printEngine = new PrintEngine();

// Initialize with default printers
printEngine.registerPrinter("receipt", {
  name: "Receipt Printer",
  type: "thermal",
  paperSize: PAPER_SIZES.MM80
});

printEngine.registerPrinter("kitchen", {
  name: "Kitchen Printer",
  type: "thermal",
  paperSize: PAPER_SIZES.MM80
});

printEngine.registerPrinter("office", {
  name: "Office Printer",
  type: "laser",
  paperSize: PAPER_SIZES.A4
});

export default printEngine;
