import React from 'react';
import { useState, useMemo, useEffect } from "react";
import { card, btn, input, label, pill } from "../../styles/theme";
import {
  getSeedDocuments, DOCUMENT_TYPE_CONFIG, DOCUMENT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG,
  ORDER_TYPE_CONFIG, CREDIT_NOTE_REASON_CONFIG,
  formatDocumentCurrency, formatDocumentDate, formatDocumentDateTime, calculateDocumentStatistics,
  searchDocuments, filterDocumentsByType, filterDocumentsByPaymentStatus, filterDocumentsByDateRange, sortDocuments
} from "../../data/documentConstants";
import { 
  createReceipt, createInvoice, createPaymentReceipt, createCreditNote,
  normalizeReceipt, normalizeInvoice, markDocumentAsPrinted, addDocumentActivity,
  isInvoiceOverdue, updateInvoicePaymentStatus, validateReceipt, validateInvoice
} from "../../domain/documentModel.js";
import { printThermalDocument, printA4Document, exportDocumentAsPDF } from "../../utils/printService.js";
import DestructiveDialog from "../common/DestructiveDialog";

const SAFE_INIT_DOCUMENTS = getSeedDocuments();
const SAFE_DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_CONFIG);
const SAFE_PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_CONFIG);

const genId = () => "DOC-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

export default function Documents({ 
  documents: externalDocuments, setDocuments: externalSetDocuments,
  orders, customers, staff 
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [documents, setDocuments] = useState(() => safeArr(externalDocuments).length ? safeArr(externalDocuments) : SAFE_INIT_DOCUMENTS);
  const [viewMode, setViewMode] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, label: null, onConfirm: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Sync viewMode tabs with filterType so clicking a tab actually filters the list
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    const typeMap = { all: "all", receipts: "receipt", invoices: "invoice", payments: "payment", credits: "credit" };
    setFilterType(typeMap[mode] || "all");
  };

  const handleSetDocuments = externalSetDocuments || setDocuments;

  const docStats = useMemo(() => calculateDocumentStatistics(documents), [documents]);

  const filteredDocuments = useMemo(() => {
    let result = documents;
    
    if (searchQuery.trim()) {
      result = searchDocuments(result, searchQuery);
    }
    
    if (filterType !== "all") {
      result = filterDocumentsByType(result, filterType);
    }
    
    if (filterPaymentStatus !== "all") {
      result = filterDocumentsByPaymentStatus(result, filterPaymentStatus);
    }
    
    result = sortDocuments(result, sortBy);
    
    return result;
  }, [documents, searchQuery, filterType, filterPaymentStatus, sortBy]);

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setModalType('detail');
    setShowModal(true);
  };

  const handlePrintDocument = doc => {
    if (doc.receiptNumber) {
      printThermalDocument(doc, '58mm');
    } else {
      printA4Document(doc);
    }
  };

  const handleExportPDF = doc => {
    try {
      exportDocumentAsPDF(doc);
    } catch (_e) {
      // fallback to print dialog
      handlePrintDocument(doc);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Number', 'Order', 'Customer', 'Date', 'Total', 'Paid', 'Balance', 'Payment Status', 'Branch'];
    const rows = filteredDocuments.map(doc => [
      doc.receiptNumber ? 'Receipt' : doc.invoiceNumber ? 'Invoice' : doc.paymentReceiptNumber ? 'Payment' : 'Credit',
      doc.receiptNumber || doc.invoiceNumber || doc.paymentReceiptNumber || doc.creditNoteNumber,
      doc.orderId || '',
      doc.customerName || '',
      formatDocumentDate(doc.issuedAt || doc.createdAt),
      doc.total,
      doc.amountPaid || 0,
      doc.balance || 0,
      doc.paymentStatus || '',
      doc.branchName || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `documents-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getDocumentType = (doc) => {
    if (doc.receiptNumber) return 'RECEIPT';
    if (doc.invoiceNumber) return 'INVOICE';
    if (doc.paymentReceiptNumber) return 'PAYMENT_RECEIPT';
    if (doc.creditNoteNumber) return 'CREDIT_NOTE';
    return 'UNKNOWN';
  };

  const getDocumentNumber = (doc) => {
    return doc.receiptNumber || doc.invoiceNumber || doc.paymentReceiptNumber || doc.creditNoteNumber || 'N/A';
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Receipts & Documents
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 20 }}>
          Create, print, and review customer receipts, invoices, and payment records
        </p>

        {/* Stat Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-accent)" }}>{docStats.receiptsToday}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Receipts Today</span>
          </div>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#2980b9" }}>{docStats.invoicesToday}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Invoices Today</span>
          </div>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#e74c3c" }}>{docStats.unpaidInvoices}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Unpaid Invoices</span>
          </div>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#f39c12" }}>{docStats.partiallyPaid}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Partially Paid</span>
          </div>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#8e44ad" }}>{docStats.reprintsToday}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Reprints Today</span>
          </div>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#e67e22" }}>{docStats.creditNotes}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>Credit Notes</span>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button
              style={{ ...btn("primary") }}
              onClick={() => setShowNewMenu(!showNewMenu)}
            >
              + New
            </button>
            {showNewMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, backgroundColor: "var(--cafe-bg-primary)", border: "1px solid var(--cafe-border)", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, minWidth: 200 }}>
                <div style={{ padding: 4 }}>
                  <button
                    style={{ ...btn("ghost"), width: "100%", textAlign: "left", fontSize: 13 }}
                    onClick={() => { setModalType('receipt'); setShowModal(true); setShowNewMenu(false); }}
                  >
                    🧾 Sales Receipt
                  </button>
                  <button
                    style={{ ...btn("ghost"), width: "100%", textAlign: "left", fontSize: 13 }}
                    onClick={() => { setModalType('invoice'); setShowModal(true); setShowNewMenu(false); }}
                  >
                    📄 Invoice
                  </button>
                  <button
                    style={{ ...btn("ghost"), width: "100%", textAlign: "left", fontSize: 13 }}
                    onClick={() => { setModalType('payment'); setShowModal(true); setShowNewMenu(false); }}
                  >
                    💳 Payment Receipt
                  </button>
                  <button
                    style={{ ...btn("ghost"), width: "100%", textAlign: "left", fontSize: 13 }}
                    onClick={() => { setModalType('credit'); setShowModal(true); setShowNewMenu(false); }}
                  >
                    📝 Credit Note
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            style={{ ...input, flex: 1, minWidth: 200 }}
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            style={{ ...input }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="RECEIPT">Receipts</option>
            <option value="INVOICE">Invoices</option>
            <option value="PAYMENT_RECEIPT">Payment Receipts</option>
            <option value="CREDIT_NOTE">Credit Notes</option>
          </select>
          <select
            style={{ ...input }}
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>
          <select
            style={{ ...input }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_value">Highest Value</option>
            <option value="lowest_value">Lowest Value</option>
            <option value="unpaid_first">Unpaid First</option>
          </select>
          <button
            style={{ ...btn("ghost") }}
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--cafe-border)", marginBottom: 24 }}>
        <button
          style={{ ...btn(viewMode === "all" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "all" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => handleViewModeChange("all")}
        >
          All Documents
        </button>
        <button
          style={{ ...btn(viewMode === "receipts" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "receipts" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => handleViewModeChange("receipts")}
        >
          Receipts
        </button>
        <button
          style={{ ...btn(viewMode === "invoices" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "invoices" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => handleViewModeChange("invoices")}
        >
          Invoices
        </button>
        <button
          style={{ ...btn(viewMode === "payments" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "payments" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => handleViewModeChange("payments")}
        >
          Payment Receipts
        </button>
        <button
          style={{ ...btn(viewMode === "credits" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "credits" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => handleViewModeChange("credits")}
        >
          Credit Notes
        </button>
      </div>

      {/* Document Register */}
      {filteredDocuments.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No documents found</div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>
            {searchQuery ? "Try adjusting your search or filters" : "Create your first document to get started"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {filteredDocuments.map(doc => {
            const docType = getDocumentType(doc);
            const typeConfig = DOCUMENT_TYPE_CONFIG[docType] || DOCUMENT_TYPE_CONFIG.RECEIPT;
            const paymentConfig = PAYMENT_STATUS_CONFIG[doc.paymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
            const docNumber = getDocumentNumber(doc);
            
            return (
              <div key={doc.id} style={{ ...card, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{typeConfig.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{typeConfig.shortLabel}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)" }}>{docNumber}</div>
                  </div>
                  <span style={{ ...pill, backgroundColor: typeConfig.bgColor, color: typeConfig.color, fontSize: 10 }}>
                    {typeConfig.label}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                    {doc.customerName || 'Walk-in Customer'}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                    {doc.orderId ? `Order: ${doc.orderId}` : ''}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {formatDocumentCurrency(doc.total)}
                  </div>
                  <span style={{ ...pill, backgroundColor: paymentConfig.bgColor, color: paymentConfig.color, fontSize: 10 }}>
                    {paymentConfig.label}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 12 }}>
                  {formatDocumentDate(doc.issuedAt || doc.createdAt)} • {doc.branchName || 'Main Branch'}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handleViewDocument(doc)}>
                    View
                  </button>
                  <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handlePrintDocument(doc)}>
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Detail Modal */}
      {showModal && modalType === 'detail' && selectedDocument && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 700, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {getDocumentNumber(selectedDocument)}
              </h2>
              <button style={{ ...btn("ghost"), fontSize: 18, padding: "4px 8px" }} onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Document Type</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {DOCUMENT_TYPE_CONFIG[getDocumentType(selectedDocument)]?.label || 'Document'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {DOCUMENT_STATUS_CONFIG[selectedDocument.status]?.label || selectedDocument.status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {selectedDocument.customerName || 'Walk-in Customer'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {formatDocumentDate(selectedDocument.issuedAt || selectedDocument.createdAt)}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Items</div>
                <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                  {(selectedDocument.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: idx < (selectedDocument.items.length - 1) ? "1px solid var(--cafe-border-light)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                          Qty: {item.quantity} × {formatDocumentCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {formatDocumentCurrency(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Subtotal</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {formatDocumentCurrency(selectedDocument.subtotal)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Tax</div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    {formatDocumentCurrency(selectedDocument.taxAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)" }}>
                    {formatDocumentCurrency(selectedDocument.total)}
                  </div>
                </div>
                {selectedDocument.amountPaid !== undefined && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Paid</div>
                    <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                      {formatDocumentCurrency(selectedDocument.amountPaid)}
                    </div>
                  </div>
                )}
                {selectedDocument.balance !== undefined && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Balance</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: selectedDocument.balance > 0 ? "#e74c3c" : "#27ae60" }}>
                      {formatDocumentCurrency(selectedDocument.balance)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button style={{ ...btn("primary"), flex: 1 }} onClick={() => handlePrintDocument(selectedDocument)}>
                  Print
                </button>
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Destructive Dialog */}
      {deleteDialog.open && (
        <DestructiveDialog
          title="Delete Document"
          message={`Are you sure you want to delete ${deleteDialog.label}? This action cannot be undone.`}
          onConfirm={() => {
            if (deleteDialog.onConfirm) deleteDialog.onConfirm();
            setDeleteDialog({ open: false, label: null, onConfirm: null });
          }}
          onCancel={() => setDeleteDialog({ open: false, label: null, onConfirm: null })}
        />
      )}

      {/* New Receipt Modal */}
      {showModal && modalType === 'receipt' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Sales Receipt</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Select Order</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.orderId || ''}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                >
                  <option value="">Select an order...</option>
                  {(orders || []).filter(o => o.status === 'COMPLETED' || o.status === 'READY').map(order => (
                    <option key={order.id} value={order.id}>
                      {order.id} - {order.customerName || 'Walk-in'} - {formatDocumentCurrency(order.total)}
                    </option>
                  ))}
                </select>
              </div>

              {form.orderId && (() => {
                const selectedOrder = orders?.find(o => o.id === form.orderId);
                if (!selectedOrder) return null;
                
                return (
                  <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Order Details</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Customer: {selectedOrder.customerName || 'Walk-in'}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Total: {formatDocumentCurrency(selectedOrder.total)}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Payment: {selectedOrder.paymentMethod || 'CASH'}</div>
                    <div style={{ fontSize: 13 }}>Items: {(selectedOrder.items || []).map(i => `${i.name} × ${i.qty}`).join(', ')}</div>
                  </div>
                );
              })()}

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer Name</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.customerName || ''}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer Phone</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.customerPhone || ''}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Receipt notes..."
                />
              </div>

              {formError && (
                <div style={{ padding: 12, backgroundColor: "#fadbd8", color: "#e74c3c", borderRadius: 4, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={() => {
                    if (!form.orderId) {
                      setFormError("Please select an order");
                      return;
                    }

                    const selectedOrder = orders?.find(o => o.id === form.orderId);
                    if (!selectedOrder) {
                      setFormError("Order not found");
                      return;
                    }

                    const branch = { id: 'BRANCH-1', name: 'Main Branch' };
                    const staffMember = staff?.[0] || { id: 'STAFF-001', name: 'System' };
                    
                    const newReceipt = createReceipt(selectedOrder, staffMember, branch, {
                      receiptNumber: form.receiptNumber,
                      customerName: form.customerName || selectedOrder.customerName,
                      customerPhone: form.customerPhone || selectedOrder.customerPhone,
                      notes: form.notes
                    });

                    handleSetDocuments([...documents, newReceipt]);
                    setShowModal(false);
                    setFormError("");
                    setForm({});
                  }}
                >
                  Create Receipt
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => { setShowModal(false); setForm({}); setFormError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showModal && modalType === 'invoice' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 700, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Invoice</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer Name *</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.customerName || ''}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer Phone</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.customerPhone || ''}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer Email</label>
                  <input
                    type="email"
                    style={{ ...input, width: "100%" }}
                    value={form.customerEmail || ''}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Customer GST Number</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.customerGstNumber || ''}
                    onChange={(e) => setForm({ ...form, customerGstNumber: e.target.value })}
                    placeholder="GST number"
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Billing Address</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.customerAddress || ''}
                  onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  placeholder="Billing address"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Issue Date</label>
                  <input
                    type="date"
                    style={{ ...input, width: "100%" }}
                    value={form.issueDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    style={{ ...input, width: "100%" }}
                    value={form.dueDate || ''}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Payment Terms</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.paymentTerms || 'NET 30'}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                >
                  <option value="NET 7">Net 7 Days</option>
                  <option value="NET 15">Net 15 Days</option>
                  <option value="NET 30">Net 30 Days</option>
                  <option value="NET 45">Net 45 Days</option>
                  <option value="NET 60">Net 60 Days</option>
                  <option value="CASH">Cash on Delivery</option>
                  <option value="IMMEDIATE">Immediate</option>
                </select>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Invoice notes..."
                />
              </div>

              {formError && (
                <div style={{ padding: 12, backgroundColor: "#fadbd8", color: "#e74c3c", borderRadius: 4, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={() => {
                    if (!form.customerName || form.customerName.trim() === '') {
                      setFormError("Customer name is required");
                      return;
                    }

                    const branch = { id: 'BRANCH-1', name: 'Main Branch' };
                    const staffMember = staff?.[0] || { id: 'STAFF-001', name: 'System' };

                    const newInvoice = createInvoice({
                      customerName: form.customerName,
                      customerPhone: form.customerPhone || '',
                      customerEmail: form.customerEmail || '',
                      customerAddress: form.customerAddress || '',
                      customerGstNumber: form.customerGstNumber || '',
                      customerState: 'Goa',
                      issueDate: form.issueDate,
                      dueDate: form.dueDate,
                      paymentTerms: form.paymentTerms || 'NET 30',
                      notes: form.notes,
                      items: [],
                      subtotal: 0,
                      taxAmount: 0,
                      serviceCharge: 0,
                      deliveryCharge: 0,
                      discountAmount: 0,
                      total: 0,
                      amountPaid: 0
                    }, staffMember, branch);

                    handleSetDocuments([...documents, newInvoice]);
                    setShowModal(false);
                    setFormError("");
                    setForm({});
                  }}
                >
                  Create Invoice
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => { setShowModal(false); setForm({}); setFormError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showModal && modalType === 'payment' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Payment Receipt</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Select Invoice</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.invoiceId || ''}
                  onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                >
                  <option value="">Select an invoice...</option>
                  {documents.filter(d => d.invoiceNumber && (d.paymentStatus === 'UNPAID' || d.paymentStatus === 'PARTIAL')).map(invoice => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.customerName} - Balance: {formatDocumentCurrency(invoice.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {form.invoiceId && (() => {
                const selectedInvoice = documents.find(d => d.id === form.invoiceId);
                if (!selectedInvoice) return null;
                
                return (
                  <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Invoice Details</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Customer: {selectedInvoice.customerName}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Invoice Total: {formatDocumentCurrency(selectedInvoice.total)}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Amount Paid: {formatDocumentCurrency(selectedInvoice.amountPaid)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Balance Due: {formatDocumentCurrency(selectedInvoice.balance)}</div>
                  </div>
                );
              })()}

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Amount Received *</label>
                <input
                  type="number"
                  style={{ ...input, width: "100%" }}
                  value={form.amountReceived || ''}
                  onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })}
                  placeholder="Amount received"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Payment Method</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.paymentMethod || 'CASH'}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Payment Reference</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.paymentReference || ''}
                  onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                  placeholder="Transaction reference"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Payment notes..."
                />
              </div>

              {formError && (
                <div style={{ padding: 12, backgroundColor: "#fadbd8", color: "#e74c3c", borderRadius: 4, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={() => {
                    if (!form.invoiceId) {
                      setFormError("Please select an invoice");
                      return;
                    }
                    if (!form.amountReceived || form.amountReceived <= 0) {
                      setFormError("Please enter a valid amount");
                      return;
                    }

                    const selectedInvoice = documents.find(d => d.id === form.invoiceId);
                    if (!selectedInvoice) {
                      setFormError("Invoice not found");
                      return;
                    }

                    if (form.amountReceived > selectedInvoice.balance) {
                      setFormError("Amount cannot exceed balance due");
                      return;
                    }

                    const branch = { id: 'BRANCH-1', name: 'Main Branch' };
                    const staffMember = staff?.[0] || { id: 'STAFF-001', name: 'System' };

                    const newPaymentReceipt = createPaymentReceipt({
                      invoiceId: form.invoiceId,
                      customerId: selectedInvoice.customerId,
                      customerName: selectedInvoice.customerName,
                      customerPhone: selectedInvoice.customerPhone,
                      amountReceived: form.amountReceived,
                      paymentMethod: form.paymentMethod || 'CASH',
                      paymentReference: form.paymentReference,
                      previousBalance: selectedInvoice.balance,
                      remainingBalance: selectedInvoice.balance - form.amountReceived,
                      notes: form.notes
                    }, staffMember, branch);

                    handleSetDocuments([...documents, newPaymentReceipt]);
                    setShowModal(false);
                    setFormError("");
                    setForm({});
                  }}
                >
                  Create Payment Receipt
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => { setShowModal(false); setForm({}); setFormError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {showModal && modalType === 'credit' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 700, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Credit Note</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Select Original Document</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.originalDocumentId || ''}
                  onChange={(e) => {
                    const selectedDoc = documents.find(d => d.id === e.target.value);
                    setForm({ 
                      ...form, 
                      originalDocumentId: e.target.value,
                      originalDocumentType: selectedDoc?.receiptNumber ? 'RECEIPT' : selectedDoc?.invoiceNumber ? 'INVOICE' : 'UNKNOWN',
                      originalDocumentNumber: selectedDoc?.receiptNumber || selectedDoc?.invoiceNumber || '',
                      customerId: selectedDoc?.customerId,
                      customerName: selectedDoc?.customerName,
                      customerPhone: selectedDoc?.customerPhone,
                      orderId: selectedDoc?.orderId
                    });
                  }}
                >
                  <option value="">Select a document...</option>
                  {documents.filter(d => d.receiptNumber || d.invoiceNumber).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.receiptNumber || doc.invoiceNumber} - {doc.customerName} - {formatDocumentCurrency(doc.total)}
                    </option>
                  ))}
                </select>
              </div>

              {form.originalDocumentId && (() => {
                const selectedDoc = documents.find(d => d.id === form.originalDocumentId);
                if (!selectedDoc) return null;
                
                return (
                  <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Original Document</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Type: {selectedDoc.receiptNumber ? 'Receipt' : 'Invoice'}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Number: {selectedDoc.receiptNumber || selectedDoc.invoiceNumber}</div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>Customer: {selectedDoc.customerName}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Total: {formatDocumentCurrency(selectedDoc.total)}</div>
                  </div>
                );
              })()}

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Credit Amount *</label>
                <input
                  type="number"
                  style={{ ...input, width: "100%" }}
                  value={form.refundAmount || ''}
                  onChange={(e) => setForm({ ...form, refundAmount: Number(e.target.value) })}
                  placeholder="Credit amount"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Reason *</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.reason || 'OTHER'}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                >
                  <option value="RETURN">Return</option>
                  <option value="OVERCHARGE">Overcharge</option>
                  <option value="ITEM_UNAVAILABLE">Item Unavailable</option>
                  <option value="QUALITY_ISSUE">Quality Issue</option>
                  <option value="ORDER_CORRECTION">Order Correction</option>
                  <option value="DELIVERY_ISSUE">Delivery Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Reason Description</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.reasonDescription || ''}
                  onChange={(e) => setForm({ ...form, reasonDescription: e.target.value })}
                  placeholder="Detailed reason..."
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Refund Method</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.refundMethod || 'CASH'}
                  onChange={(e) => setForm({ ...form, refundMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Refund Reference</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.refundReference || ''}
                  onChange={(e) => setForm({ ...form, refundReference: e.target.value })}
                  placeholder="Refund reference"
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Credit note notes..."
                />
              </div>

              {formError && (
                <div style={{ padding: 12, backgroundColor: "#fadbd8", color: "#e74c3c", borderRadius: 4, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={() => {
                    if (!form.originalDocumentId) {
                      setFormError("Please select an original document");
                      return;
                    }
                    if (!form.refundAmount || form.refundAmount <= 0) {
                      setFormError("Please enter a valid credit amount");
                      return;
                    }

                    const selectedDoc = documents.find(d => d.id === form.originalDocumentId);
                    if (!selectedDoc) {
                      setFormError("Document not found");
                      return;
                    }

                    if (form.refundAmount > selectedDoc.total) {
                      setFormError("Credit amount cannot exceed original document total");
                      return;
                    }

                    const branch = { id: 'BRANCH-1', name: 'Main Branch' };
                    const staffMember = staff?.[0] || { id: 'STAFF-001', name: 'System' };

                    const newCreditNote = createCreditNote({
                      originalDocumentId: form.originalDocumentId,
                      originalDocumentType: form.originalDocumentType,
                      originalDocumentNumber: form.originalDocumentNumber,
                      orderId: form.orderId,
                      customerId: form.customerId,
                      customerName: form.customerName,
                      customerPhone: form.customerPhone,
                      reason: form.reason,
                      reasonDescription: form.reasonDescription,
                      refundAmount: form.refundAmount,
                      refundMethod: form.refundMethod || 'CASH',
                      refundReference: form.refundReference,
                      notes: form.notes,
                      items: []
                    }, staffMember, branch);

                    handleSetDocuments([...documents, newCreditNote]);
                    setShowModal(false);
                    setFormError("");
                    setForm({});
                  }}
                >
                  Create Credit Note
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => { setShowModal(false); setForm({}); setFormError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
