import React from 'react';
import { useState, useMemo, useEffect } from "react";
import { card, btn, input, label, pill } from "../../styles/theme";
import { getSeedExpenses, EXPENSE_CATEGORY_CONFIG, PAYMENT_STATUS_CONFIG, RECURRENCE_CONFIG } from "../../data/expenseConstants";
import { validateExpense, recordPayment, calculateRemainingAmount, isExpenseOverdue, updatePaymentStatus } from "../../domain/expenseModel.js";
import DestructiveDialog from "../common/DestructiveDialog";

const SAFE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_CONFIG);
const SAFE_STATUSES = Object.keys(PAYMENT_STATUS_CONFIG);
const SAFE_RECURRENCE = Object.keys(RECURRENCE_CONFIG);
const SAFE_INIT = getSeedExpenses();

const genId = () => "EXP-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeExpenseRecord = (e) => ({
  ...e,
  id: safeStr(e?.id) || genId(),
  title: safeStr(e?.title).trim() || "Untitled Expense",
  category: SAFE_CATEGORIES.includes(e?.category) ? e.category : "OTHER",
  amount: Math.max(0, toNum(e?.amount, 0)),
  currency: safeStr(e?.currency) || "INR",
  supplier: safeStr(e?.supplier).trim(),
  invoiceNumber: safeStr(e?.invoiceNumber),
  dueDate: e?.dueDate ? new Date(e.dueDate).getTime() : null,
  paymentStatus: SAFE_STATUSES.includes(e?.paymentStatus) ? e.paymentStatus : "UNPAID",
  paidAmount: Math.max(0, toNum(e?.paidAmount, 0)),
  paidAt: e?.paidAt ? new Date(e.paidAt).getTime() : null,
  paymentMethod: e?.paymentMethod || null,
  receiptUrl: safeStr(e?.receiptUrl),
  notes: safeStr(e?.notes),
  recurring: Boolean(e?.recurring),
  recurrencePattern: SAFE_RECURRENCE.includes(e?.recurrencePattern) ? e.recurrencePattern : null,
  createdAt: e?.createdAt ? new Date(e.createdAt).getTime() : Date.now(),
  updatedAt: e?.updatedAt ? new Date(e.updatedAt).getTime() : Date.now(),
});

export default function Expenses({ expenses: externalExpenses, setExpenses: externalSetExpenses }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  
  const [expenses, setExpenses] = useState(() => safeArr(externalExpenses).length ? safeArr(externalExpenses) : SAFE_INIT);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const defaultCategory = SAFE_CATEGORIES.find(c => c !== "OTHER") || "INVENTORY";
  const [form, setForm] = useState({ 
    title: "", 
    category: defaultCategory, 
    amount: "", 
    currency: "INR",
    supplier: "", 
    invoiceNumber: "",
    dueDate: "",
    paymentStatus: "UNPAID",
    paidAmount: "",
    paymentMethod: "",
    notes: "",
    recurring: false,
    recurrencePattern: ""
  });
  const [formError, setFormError] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "" });
  const [paymentFormError, setPaymentFormError] = useState("");

  const [deleteDialog, setDeleteDialog] = useState({ open: false, title: null, onConfirm: null });

  const handleSetExpenses = externalSetExpenses || setExpenses;

  const filtered = useMemo(() => {
    return expenses.filter(expense => {
      if (!expense) return false;
      const matchesCategory = categoryFilter === "All" || expense.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || expense.paymentStatus === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        expense.title.toLowerCase().includes(q) ||
        (expense.supplier && expense.supplier.toLowerCase().includes(q)) ||
        (expense.invoiceNumber && expense.invoiceNumber.toLowerCase().includes(q));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [expenses, categoryFilter, statusFilter, search]);

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e?.amount || 0), 0);
    const paid = expenses.reduce((sum, e) => sum + (e?.paidAmount || 0), 0);
    const unpaid = expenses.reduce((sum, e) => sum + (calculateRemainingAmount(e) || 0), 0);
    const overdue = expenses.filter(e => isExpenseOverdue(e)).reduce((sum, e) => sum + (calculateRemainingAmount(e) || 0), 0);
    return { total, paid, unpaid, overdue };
  }, [expenses]);

  const handleAdd = () => {
    setEditExpense(null);
    setForm({ 
      title: "", 
      category: defaultCategory, 
      amount: "", 
      currency: "INR",
      supplier: "", 
      invoiceNumber: "",
      dueDate: "",
      paymentStatus: "UNPAID",
      paidAmount: "",
      paymentMethod: "",
      notes: "",
      recurring: false,
      recurrencePattern: ""
    });
    setFormError("");
    setShowModal(true);
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
    setForm({
      title: expense.title || "",
      category: expense.category || defaultCategory,
      amount: expense.amount?.toString() || "",
      currency: expense.currency || "INR",
      supplier: expense.supplier || "",
      invoiceNumber: expense.invoiceNumber || "",
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : "",
      paymentStatus: expense.paymentStatus || "UNPAID",
      paidAmount: expense.paidAmount?.toString() || "",
      paymentMethod: expense.paymentMethod || "",
      notes: expense.notes || "",
      recurring: expense.recurring || false,
      recurrencePattern: expense.recurrencePattern || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = () => {
    const validation = validateExpense(form);
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    const expenseData = {
      ...form,
      amount: toNum(form.amount, 0),
      paidAmount: toNum(form.paidAmount, 0),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      paymentStatus: updatePaymentStatus(form)
    };

    if (editExpense) {
      const updated = expenses.map(e => e.id === editExpense.id ? normalizeExpenseRecord({ ...expenseData, id: editExpense.id }) : e);
      handleSetExpenses(updated);
    } else {
      const newExpense = normalizeExpenseRecord(expenseData);
      handleSetExpenses([newExpense, ...expenses]);
    }

    setShowModal(false);
    setFormError("");
  };

  const handleDelete = (expense) => {
    setDeleteDialog({ 
      open: true, 
      title: expense.title, 
      onConfirm: () => {
        handleSetExpenses(expenses.filter(e => e.id !== expense.id));
        setDeleteDialog({ open: false, title: null, onConfirm: null });
      }
    });
  };

  const handlePayment = (expense) => {
    setEditExpense(expense);
    setPaymentForm({ amount: "", method: "UPI" });
    setPaymentFormError("");
    setShowPaymentModal(true);
  };

  const handleSavePayment = () => {
    const amount = toNum(paymentForm.amount, 0);
    if (amount <= 0) {
      setPaymentFormError("Payment amount must be positive");
      return;
    }

    const remaining = calculateRemainingAmount(editExpense);
    if (amount > remaining) {
      setPaymentFormError(`Payment cannot exceed remaining amount of ₹${remaining}`);
      return;
    }

    const updated = recordPayment(editExpense, amount, paymentForm.method);
    const updatedExpenses = expenses.map(e => e.id === editExpense.id ? normalizeExpenseRecord(updated) : e);
    handleSetExpenses(updatedExpenses);
    setShowPaymentModal(false);
    setPaymentFormError("");
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Cost Control
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Track and manage business expenses, payments, and recurring costs
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ ...card, borderLeft: "4px solid var(--cafe-accent)" }}>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Expenses</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{formatCurrency(summary.total)}</div>
        </div>
        <div style={{ ...card, borderLeft: "4px solid #27ae60" }}>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Paid</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{formatCurrency(summary.paid)}</div>
        </div>
        <div style={{ ...card, borderLeft: "4px solid #e74c3c" }}>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Unpaid</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e74c3c" }}>{formatCurrency(summary.unpaid)}</div>
        </div>
        <div style={{ ...card, borderLeft: "4px solid #c0392b" }}>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Overdue</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#c0392b" }}>{formatCurrency(summary.overdue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={{ ...input, flex: 1, minWidth: 200 }}
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...input, minWidth: 150 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {SAFE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{EXPENSE_CATEGORY_CONFIG[cat].label}</option>
          ))}
        </select>
        <select
          style={{ ...input, minWidth: 150 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          {SAFE_STATUSES.map(status => (
            <option key={status} value={status}>{PAYMENT_STATUS_CONFIG[status].label}</option>
          ))}
        </select>
        <button
          style={{ ...btn("primary") }}
          onClick={handleAdd}
        >
          + Add Expense
        </button>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          style={{ ...btn(viewMode === "cards" ? "primary" : "ghost"), padding: "8px 16px" }}
          onClick={() => setViewMode("cards")}
        >
          Cards
        </button>
        <button
          style={{ ...btn(viewMode === "list" ? "primary" : "ghost"), padding: "8px 16px" }}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
          <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No expenses found</div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>
            {search || categoryFilter !== "All" || statusFilter !== "All" 
              ? "Try adjusting your filters" 
              : "Add your first expense to start tracking costs"}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(expense => {
            const config = EXPENSE_CATEGORY_CONFIG[expense.category] || EXPENSE_CATEGORY_CONFIG.OTHER;
            const statusConfig = PAYMENT_STATUS_CONFIG[expense.paymentStatus];
            const remaining = calculateRemainingAmount(expense);
            const overdue = isExpenseOverdue(expense);

            return (
              <div key={expense.id} style={{ ...card, borderLeft: `4px solid ${config.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{config.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{expense.title}</div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{config.label}</div>
                    </div>
                  </div>
                  <div style={{ 
                    ...pill, 
                    backgroundColor: statusConfig.bgColor, 
                    color: statusConfig.color,
                    fontSize: 11
                  }}>
                    {statusConfig.label}
                  </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                  {formatCurrency(expense.amount)}
                </div>

                <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                  {expense.supplier && <div>Supplier: {expense.supplier}</div>}
                  {expense.invoiceNumber && <div>Invoice: {expense.invoiceNumber}</div>}
                  {expense.dueDate && <div>Due: {formatDate(expense.dueDate)}</div>}
                </div>

                {remaining > 0 && (
                  <div style={{ fontSize: 12, color: overdue ? "#c0392b" : "var(--cafe-text-tertiary)", marginBottom: 12 }}>
                    Remaining: {formatCurrency(remaining)}
                    {overdue && " (Overdue)"}
                  </div>
                )}

                {expense.recurring && (
                  <div style={{ fontSize: 11, color: "var(--cafe-accent)", marginBottom: 12 }}>
                    ↻ Recurring ({RECURRENCE_CONFIG[expense.recurrencePattern]?.label || expense.recurrencePattern})
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  {remaining > 0 && (
                    <button
                      style={{ ...btn("primary"), flex: 1, fontSize: 12, padding: "6px 12px" }}
                      onClick={() => handlePayment(expense)}
                    >
                      Pay
                    </button>
                  )}
                  <button
                    style={{ ...btn("ghost"), fontSize: 12, padding: "6px 12px" }}
                    onClick={() => handleEdit(expense)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ ...btn("ghost"), fontSize: 12, padding: "6px 12px", color: "#e74c3c" }}
                    onClick={() => handleDelete(expense)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Title</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Category</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Amount</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Paid</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Status</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Due Date</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(expense => {
                const config = EXPENSE_CATEGORY_CONFIG[expense.category] || EXPENSE_CATEGORY_CONFIG.OTHER;
                const statusConfig = PAYMENT_STATUS_CONFIG[expense.paymentStatus];
                const remaining = calculateRemainingAmount(expense);

                return (
                  <tr key={expense.id} style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{expense.title}</div>
                      {expense.supplier && <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{expense.supplier}</div>}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ fontSize: 12 }}>{config.icon}</span>
                      <span style={{ fontSize: 12, marginLeft: 4 }}>{config.label}</span>
                    </td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "monospace", color: "#27ae60" }}>
                      {formatCurrency(expense.paidAmount)}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span style={{ 
                        ...pill, 
                        backgroundColor: statusConfig.bgColor, 
                        color: statusConfig.color,
                        fontSize: 10
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontSize: 12 }}>
                      {expense.dueDate ? formatDate(expense.dueDate) : "-"}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        {remaining > 0 && (
                          <button
                            style={{ ...btn("primary"), fontSize: 11, padding: "4px 8px" }}
                            onClick={() => handlePayment(expense)}
                          >
                            Pay
                          </button>
                        )}
                        <button
                          style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px" }}
                          onClick={() => handleEdit(expense)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px", color: "#e74c3c" }}
                          onClick={() => handleDelete(expense)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editExpense ? "Edit Expense" : "Add Expense"}
            </h2>

            {formError && (
              <div style={{ backgroundColor: "#fadbd8", color: "#c0392b", padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={label}>Title *</label>
                <input
                  style={input}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Monthly Rent"
                />
              </div>

              <div>
                <label style={label}>Category</label>
                <select
                  style={input}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {SAFE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{EXPENSE_CATEGORY_CONFIG[cat].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Amount (₹) *</label>
                <input
                  style={input}
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label style={label}>Supplier</label>
                <input
                  style={input}
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Vendor or supplier name"
                />
              </div>

              <div>
                <label style={label}>Invoice Number</label>
                <input
                  style={input}
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  placeholder="INV-2024-001"
                />
              </div>

              <div>
                <label style={label}>Due Date</label>
                <input
                  style={input}
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label style={label}>Payment Method</label>
                <select
                  style={input}
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option value="">Select method</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  id="recurring"
                />
                <label htmlFor="recurring" style={{ fontSize: 14 }}>Recurring Expense</label>
              </div>

              {form.recurring && (
                <div>
                  <label style={label}>Recurrence Pattern</label>
                  <select
                    style={input}
                    value={form.recurrencePattern}
                    onChange={(e) => setForm({ ...form, recurrencePattern: e.target.value })}
                  >
                    {SAFE_RECURRENCE.map(pattern => (
                      <option key={pattern} value={pattern}>{RECURRENCE_CONFIG[pattern].label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={label}>Notes</label>
                <textarea
                  style={{ ...input, resize: "none" }}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={handleSave}
                >
                  {editExpense ? "Update" : "Add"} Expense
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && editExpense && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 400 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Record Payment</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>{editExpense.title}</div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Total: {formatCurrency(editExpense.amount)} | Paid: {formatCurrency(editExpense.paidAmount)} | Remaining: {formatCurrency(calculateRemainingAmount(editExpense))}
              </div>
            </div>

            {paymentFormError && (
              <div style={{ backgroundColor: "#fadbd8", color: "#c0392b", padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                {paymentFormError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={label}>Payment Amount (₹) *</label>
                <input
                  style={input}
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label style={label}>Payment Method</label>
                <select
                  style={input}
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={handleSavePayment}
                >
                  Record Payment
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DestructiveDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, title: null, onConfirm: null })}
        onConfirm={deleteDialog.onConfirm}
        title="Delete Expense"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
        recordName="Expense"
        consequence="This expense will be permanently removed from your records."
        confirmLabel="Delete"
      />
    </div>
  );
}
