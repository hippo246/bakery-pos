 
 
import React from 'react';
import { useState, useMemo, useEffect, useCallback } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { 
  getSeedSuppliers, getSeedPurchaseOrders, PO_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, RECEIVING_STATUS_CONFIG,
  SUPPLIER_CATEGORY_CONFIG, formatPurchasingCurrency, formatPurchasingDate, formatPurchasingDateTime,
  getDaysUntilExpected, isExpectedToday, calculatePOStatistics, calculateSupplierStatistics, getReorderNeeds
} from "../../data/purchasingConstants";
import { 
  createPurchaseOrder, normalizePurchaseOrder, createSupplier, normalizeSupplier, 
  isPOOverdue, hasUnpaidBalance, updatePOReceivingStatus, validatePurchaseOrder, validateSupplier,
  createGoodsReceipt, createGoodsReceiptLine, createVariance 
} from "../../domain/purchasingModel.js";
import DestructiveDialog from "../common/DestructiveDialog";
import { triggerPurchasingNotification } from "../../utils/notificationTriggers.js";
import { saveNotifications } from "../../utils/notificationService.js";

const SAFE_PO_STATUSES = Object.keys(PO_STATUS_CONFIG);
const SAFE_SUPPLIER_CATEGORIES = Object.keys(SUPPLIER_CATEGORY_CONFIG);
const SAFE_INIT_SUPPLIERS = getSeedSuppliers();
const SAFE_INIT_PURCHASE_ORDERS = getSeedPurchaseOrders();

const genId = () => "PUR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

export default function PurchasingDesk({ 
  suppliers: externalSuppliers, setSuppliers: externalSetSuppliers,
  purchaseOrders: externalPurchaseOrders, setPurchaseOrders: externalSetPurchaseOrders,
  inventory, expenses, setExpenses, notifications, setNotifications
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [suppliers, setSuppliers] = useState(() => safeArr(externalSuppliers).length ? safeArr(externalSuppliers) : SAFE_INIT_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState(() => safeArr(externalPurchaseOrders).length ? safeArr(externalPurchaseOrders) : SAFE_INIT_PURCHASE_ORDERS);
  const [viewMode, setViewMode] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, label: null, onConfirm: null });
  const [receivingForm, setReceivingForm] = useState({});
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState("ALL");

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e) => { if (e.key === "Escape") { setShowModal(false); setFormError(""); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);


  const handleSetSuppliers = externalSetSuppliers || setSuppliers;
  const handleSetPurchaseOrders = externalSetPurchaseOrders || setPurchaseOrders;

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

  const poStats = useMemo(() => calculatePOStatistics(purchaseOrders), [purchaseOrders]);
  const supplierStats = useMemo(() => calculateSupplierStatistics(suppliers, purchaseOrders), [suppliers, purchaseOrders]);
  const safeInventory = useMemo(() => safeArr(inventory), [inventory]);
  const reorderNeeds = useMemo(() => getReorderNeeds(safeInventory), [safeInventory]);

  // Extra derived stats, computed locally so they don't depend on fields the stats helpers may not expose
  const avgOrderValue = useMemo(() => {
    const withTotal = purchaseOrders.filter(po => po && toNum(po.total) > 0);
    if (!withTotal.length) return 0;
    return withTotal.reduce((sum, po) => sum + toNum(po.total), 0) / withTotal.length;
  }, [purchaseOrders]);

  const onTimeDeliveryRate = useMemo(() => {
    const received = purchaseOrders.filter(po => po && po.receivingStatus === 'FULLY_RECEIVED' && po.expectedDate);
    if (!received.length) return null;
    const onTime = received.filter(po => !isPOOverdue({ ...po, receivingStatus: 'NOT_RECEIVED' }));
    return Math.round((onTime.length / received.length) * 100);
  }, [purchaseOrders]);

  const topSupplierBySpend = useMemo(() => {
    const spendById = {};
    purchaseOrders.forEach(po => {
      if (!po || !po.supplierId) return;
      spendById[po.supplierId] = (spendById[po.supplierId] || 0) + toNum(po.total);
    });
    const topId = Object.keys(spendById).sort((a, b) => spendById[b] - spendById[a])[0];
    if (!topId) return null;
    const supplier = suppliers.find(s => s.id === topId);
    return supplier ? { name: supplier.name, spend: spendById[topId] } : null;
  }, [purchaseOrders, suppliers]);

  const getReorderUrgency = useCallback((item) => {
    const pct = item.reorderLevel > 0 ? item.currentQuantity / item.reorderLevel : (item.currentQuantity <= 0 ? 0 : 1);
    if (pct <= 0) return { level: 3, color: "#e74c3c", bg: "#fadbd8", label: "Critical" };
    if (pct <= 0.25) return { level: 2, color: "#e67e22", bg: "#fdebd0", label: "Urgent" };
    return { level: 1, color: "#f39c12", bg: "#fef9e7", label: "Low" };
  }, []);

  const sortedReorderNeeds = useMemo(() => {
    return [...reorderNeeds].sort((a, b) => getReorderUrgency(b).level - getReorderUrgency(a).level);
  }, [reorderNeeds, getReorderUrgency]);

  const reorderUrgencyCounts = useMemo(() => {
    const counts = { Critical: 0, Urgent: 0, Low: 0 };
    reorderNeeds.forEach(item => { counts[getReorderUrgency(item).label]++; });
    return counts;
  }, [reorderNeeds, getReorderUrgency]);

  const [reorderUrgencyFilter, setReorderUrgencyFilter] = useState("ALL");
  const displayedReorderNeeds = useMemo(() => {
    if (reorderUrgencyFilter === "ALL") return sortedReorderNeeds;
    return sortedReorderNeeds.filter(item => getReorderUrgency(item).label === reorderUrgencyFilter);
  }, [sortedReorderNeeds, reorderUrgencyFilter, getReorderUrgency]);

  const filteredPOs = useMemo(() => {
    let result = [...purchaseOrders];
    if (poStatusFilter !== "ALL") result = result.filter(po => po.status === poStatusFilter);
    if (poSearch.trim()) {
      const q = poSearch.trim().toLowerCase();
      result = result.filter(po =>
        (po.poNumber || "").toLowerCase().includes(q) ||
        (po.supplierName || "").toLowerCase().includes(q) ||
        (po.notes || "").toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (b.orderDate || 0) - (a.orderDate || 0));
  }, [purchaseOrders, poSearch, poStatusFilter]);

  const filteredSuppliers = useMemo(() => {
    let result = suppliers.filter(s => s.active !== false);
    if (supplierCategoryFilter !== "ALL") result = result.filter(s => s.category === supplierCategoryFilter);
    if (supplierSearch.trim()) {
      const q = supplierSearch.trim().toLowerCase();
      result = result.filter(s =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.contactPerson || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (!!b.preferred !== !!a.preferred) return (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0);
      return (b.lastOrderDate || 0) - (a.lastOrderDate || 0);
    });
  }, [suppliers, supplierSearch, supplierCategoryFilter]);

  // Check for overdue POs and expected deliveries periodically
  const notifiedTodayRef = React.useRef({});
  useEffect(() => {
    const runCheck = () => {
      const todayKey = new Date().toISOString().split('T')[0];
      if (notifiedTodayRef.current._day !== todayKey) {
        notifiedTodayRef.current = { _day: todayKey };
      }
      purchaseOrders.forEach(po => {
        if (!po) return;

        // Check for overdue POs (once per PO per day)
        const overdueKey = `overdue:${po.id}`;
        if (isPOOverdue(po) && !notifiedTodayRef.current[overdueKey]) {
          notifiedTodayRef.current[overdueKey] = true;
          const notif = triggerPurchasingNotification(po, 'PO_OVERDUE', {
            expectedDate: po.expectedDate,
            poNumber: po.poNumber
          });
          addNotification(notif);
        }

        // Check for deliveries expected today (once per PO per day)
        const expectedKey = `expected:${po.id}`;
        if (isExpectedToday(po) && !notifiedTodayRef.current[expectedKey]) {
          notifiedTodayRef.current[expectedKey] = true;
          const supplier = suppliers.find(s => s.id === po.supplierId);
          const notif = triggerPurchasingNotification(po, 'SUPPLIER_DELIVERY_EXPECTED', {
            supplierName: supplier?.name || 'Unknown supplier'
          });
          addNotification(notif);
        }
      });
    };
    runCheck();
    const interval = setInterval(runCheck, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [purchaseOrders, suppliers, addNotification]);

  const closeModal = () => { setShowModal(false); setFormError(""); };

  const handleAddPO = () => {
    setSelectedPO(null);
    setForm({
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      paymentTerms: 'NET 30',
      deliveryTerms: '',
      items: [],
      supplierNote: '',
      internalNote: ''
    });
    setFormError("");
    setModalType('addpo');
    setShowModal(true);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setForm({
      name: '',
      category: 'INGREDIENTS',
      active: true,
      preferred: false,
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      gstNumber: '',
      paymentTerms: 'NET 30',
      deliveryDays: 7,
      minimumOrder: 0,
      deliveryCharge: 0,
      notes: '',
      internalNote: ''
    });
    setFormError("");
    setModalType('addsupplier');
    setShowModal(true);
  };

  const handleViewPO = (po) => {
    setSelectedPO(po);
    setModalType('podetail');
    setShowModal(true);
  };

  const handlePrintPO = (po) => {
    const printWindow = window.open('', '_blank');
    const statusConfig = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
    const paymentConfig = PAYMENT_STATUS_CONFIG[po.paymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
    const receivingConfig = RECEIVING_STATUS_CONFIG[po.receivingStatus] || RECEIVING_STATUS_CONFIG.NOT_RECEIVED;
    const poItems = safeArr(po.items);
    const poSupplier = suppliers.find(s => s.id === po.supplierId);
    const totalOrdered = poItems.reduce((s, i) => s + (i.orderedQuantity || 0), 0);
    const totalReceived = poItems.reduce((s, i) => s + (i.receivedQuantity || 0), 0);
    const supplierAddress = poSupplier ? [poSupplier.address, poSupplier.city, poSupplier.state, poSupplier.postalCode, poSupplier.country].filter(Boolean).join(', ') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order - ${po.poNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 850px; margin: 0 auto; color: #222; }
          .brand-bar { height: 6px; background: linear-gradient(90deg, #6b4226, #a9744f); border-radius: 3px; margin-bottom: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.03em; }
          .header .po-number { font-size: 16px; color: #666; margin-top: 6px; font-family: monospace; }
          .header-right { text-align: right; }
          .header-right .print-date { font-size: 11px; color: #999; margin-top: 6px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 24px; }
          .info-section { padding: 14px; background: #fafafa; border-radius: 6px; border: 1px solid #eee; }
          .info-section h3 { margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
          .info-section p { margin: 4px 0; font-size: 13px; }
          .info-section .supplier-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
          .status { display: inline-block; padding: 4px 12px; background: ${statusConfig.bgColor}; color: ${statusConfig.color}; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .status-row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
          .pill { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .items-table th { background: #333; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
          .items-table th.num, .items-table td.num { text-align: right; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .items-table tr:nth-child(even) td { background: #fafafa; }
          .items-table .total { font-weight: 600; }
          .items-table .row-num { color: #aaa; font-size: 11px; }
          .item-note { font-size: 11px; color: #888; font-style: italic; margin-top: 2px; }
          .received-tag { font-size: 10px; color: #27ae60; font-weight: 600; }
          .totals { text-align: right; margin-top: 20px; }
          .totals-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 8px; }
          .totals-row .label { width: 150px; color: #666; }
          .totals-row .value { width: 120px; font-weight: 600; }
          .grand-total { font-size: 19px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .notes { margin-top: 24px; padding: 16px 20px; background: #f9f9f9; border-radius: 6px; border-left: 4px solid #a9744f; }
          .notes h3 { margin: 0 0 10px 0; font-size: 13px; }
          .notes p { margin: 5px 0; font-size: 13px; color: #555; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
          .signature-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } .brand-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="brand-bar"></div>
        <div class="header">
          <div>
            <h1>PURCHASE ORDER</h1>
            <div class="po-number">${po.poNumber}</div>
          </div>
          <div class="header-right">
            <span class="status">${statusConfig.label}</span>
            <div class="print-date">Printed ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Supplier</h3>
            <div class="supplier-name">${po.supplierName}</div>
            ${poSupplier?.contactPerson ? `<p>Attn: ${poSupplier.contactPerson}</p>` : ''}
            ${poSupplier?.phone ? `<p>Phone: ${poSupplier.phone}</p>` : ''}
            ${poSupplier?.email ? `<p>Email: ${poSupplier.email}</p>` : ''}
            ${supplierAddress ? `<p>${supplierAddress}</p>` : ''}
            ${poSupplier?.gstNumber ? `<p>GSTIN: ${poSupplier.gstNumber}</p>` : ''}
          </div>
          <div class="info-section">
            <h3>Order Details</h3>
            <p>Order Date: ${formatPurchasingDate(po.orderDate)}</p>
            <p>Expected Delivery: ${formatPurchasingDate(po.expectedDate)}</p>
            <p>Payment Terms: ${po.paymentTerms || '—'}</p>
            ${po.deliveryTerms ? `<p>Delivery Terms: ${po.deliveryTerms}</p>` : ''}
            <div class="status-row">
              <span class="pill" style="background:${paymentConfig.bgColor}; color:${paymentConfig.color};">${paymentConfig.label}</span>
              <span class="pill" style="background:${receivingConfig.bgColor}; color:${receivingConfig.color};">${receivingConfig.label}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th class="num">Ordered</th>
              <th class="num">Received</th>
              <th>Unit</th>
              <th class="num">Price</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${poItems.map((item, idx) => `
              <tr>
                <td class="row-num">${idx + 1}</td>
                <td>
                  ${item.inventoryItemName || '—'}
                  ${item.notes ? `<div class="item-note">${item.notes}</div>` : ''}
                </td>
                <td class="num">${item.orderedQuantity ?? 0}</td>
                <td class="num">${(item.receivedQuantity || 0)}${(item.receivedQuantity || 0) >= (item.orderedQuantity || 0) && (item.orderedQuantity || 0) > 0 ? ' <span class="received-tag">✓</span>' : ''}</td>
                <td>${item.unit || ''}</td>
                <td class="num">${formatPurchasingCurrency(item.unitPrice)}</td>
                <td class="num total">${formatPurchasingCurrency(item.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${totalOrdered > 0 ? `
        <div style="font-size: 12px; color: #666; margin-top: -12px; margin-bottom: 20px;">
          ${poItems.length} line item${poItems.length !== 1 ? 's' : ''} · ${totalReceived}/${totalOrdered} units received so far
        </div>
        ` : ''}

        <div class="totals">
          <div class="totals-row">
            <div class="label">Subtotal:</div>
            <div class="value">${formatPurchasingCurrency(po.subtotal)}</div>
          </div>
          <div class="totals-row">
            <div class="label">Tax:</div>
            <div class="value">${formatPurchasingCurrency(po.tax)}</div>
          </div>
          <div class="totals-row">
            <div class="label">Delivery:</div>
            <div class="value">${formatPurchasingCurrency(po.deliveryCharge)}</div>
          </div>
          <div class="totals-row">
            <div class="label">Discount:</div>
            <div class="value">-${formatPurchasingCurrency(po.discount)}</div>
          </div>
          <div class="totals-row grand-total">
            <div class="label">Total:</div>
            <div class="value">${formatPurchasingCurrency(po.total)}</div>
          </div>
        </div>

        ${po.supplierNote || po.internalNote ? `
        <div class="notes">
          <h3>Notes</h3>
          ${po.supplierNote ? `<p><strong>To Supplier:</strong> ${po.supplierNote}</p>` : ''}
          ${po.internalNote ? `<p><strong>Internal:</strong> ${po.internalNote}</p>` : ''}
        </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-line">Authorized By / Date</div>
          <div class="signature-line">Received By / Date</div>
        </div>

        <div class="footer">
          Generated by BrewCRM Purchasing Desk | ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'Status', 'Order Date', 'Expected Date', 'Total', 'Payment Status', 'Receiving Status'];
    const rows = filteredPOs.map(po => [
      po.poNumber,
      po.supplierName,
      po.status,
      formatPurchasingDate(po.orderDate),
      formatPurchasingDate(po.expectedDate),
      po.total,
      po.paymentStatus,
      po.receivingStatus
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportSuppliersCSV = () => {
    const headers = ['Name', 'Category', 'Contact Person', 'Phone', 'Email', 'Payment Terms', 'GST Number', 'Preferred', 'Active'];
    const rows = filteredSuppliers.map(s => [
      s.name, s.category, s.contactPerson, s.phone, s.email, s.paymentTerms, s.gstNumber,
      s.preferred ? 'Yes' : 'No', s.active !== false ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${safeStr(cell)}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrintGoodsReceipt = (receipt) => {
    const printWindow = window.open('', '_blank');
    const receiptLines = safeArr(receipt.lines);
    const receiptSupplier = suppliers.find(s => s.id === receipt.supplierId) || suppliers.find(s => s.name === receipt.supplierName);
    const supplierAddress = receiptSupplier ? [receiptSupplier.address, receiptSupplier.city, receiptSupplier.state, receiptSupplier.postalCode, receiptSupplier.country].filter(Boolean).join(', ') : '';
    const hasVarianceData = receiptLines.some(l => l.expectedPrice != null && l.actualPrice != null && toNum(l.expectedPrice) !== toNum(l.actualPrice));
    const totalDamaged = receiptLines.reduce((sum, l) => sum + toNum(l.damagedQuantity), 0);
    const totalRejected = receiptLines.reduce((sum, l) => sum + toNum(l.rejectedQuantity), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Goods Receipt - ${receipt.receiptNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 850px; margin: 0 auto; color: #222; }
          .brand-bar { height: 6px; background: linear-gradient(90deg, #6b4226, #a9744f); border-radius: 3px; margin-bottom: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.03em; }
          .header .receipt-number { font-size: 16px; color: #666; margin-top: 6px; font-family: monospace; }
          .header-right { text-align: right; }
          .header-right .print-date { font-size: 11px; color: #999; margin-top: 6px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 24px; }
          .info-section { padding: 14px; background: #fafafa; border-radius: 6px; border: 1px solid #eee; }
          .info-section h3 { margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
          .info-section p { margin: 4px 0; font-size: 13px; }
          .info-section .supplier-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .items-table th { background: #333; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
          .items-table th.num, .items-table td.num { text-align: right; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .items-table tr:nth-child(even) td { background: #fafafa; }
          .items-table .accepted { color: #27ae60; font-weight: 600; }
          .items-table .damaged { color: #e67e22; }
          .items-table .rejected { color: #e74c3c; }
          .item-note { font-size: 11px; color: #888; font-style: italic; margin-top: 2px; }
          .price-variance { font-size: 10px; margin-top: 2px; font-weight: 600; }
          .price-variance.up { color: #e74c3c; }
          .price-variance.down { color: #27ae60; }
          .flags-row { display: flex; gap: 16px; margin: -10px 0 20px 0; font-size: 12px; }
          .flag-chip { padding: 4px 10px; border-radius: 4px; font-weight: 600; }
          .totals { text-align: right; margin-top: 20px; }
          .totals-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 8px; }
          .totals-row .label { width: 150px; color: #666; }
          .totals-row .value { width: 120px; font-weight: 600; }
          .grand-total { font-size: 17px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .notes { margin-top: 24px; padding: 16px 20px; background: #f9f9f9; border-radius: 6px; border-left: 4px solid #a9744f; }
          .notes h3 { margin: 0 0 10px 0; font-size: 13px; }
          .notes p { margin: 5px 0; font-size: 13px; color: #555; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
          .signature-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } .brand-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="brand-bar"></div>
        <div class="header">
          <div>
            <h1>GOODS RECEIPT</h1>
            <div class="receipt-number">${receipt.receiptNumber}</div>
          </div>
          <div class="header-right">
            <div class="print-date">Printed ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Supplier</h3>
            <div class="supplier-name">${receipt.supplierName}</div>
            ${receiptSupplier?.contactPerson ? `<p>Attn: ${receiptSupplier.contactPerson}</p>` : ''}
            ${receiptSupplier?.phone ? `<p>Phone: ${receiptSupplier.phone}</p>` : ''}
            ${receiptSupplier?.email ? `<p>Email: ${receiptSupplier.email}</p>` : ''}
            ${supplierAddress ? `<p>${supplierAddress}</p>` : ''}
            <p>PO Reference: ${receipt.poNumber}</p>
          </div>
          <div class="info-section">
            <h3>Receipt Details</h3>
            <p>Received Date: ${formatPurchasingDate(receipt.receivedDate)}</p>
            <p>Delivery Note: ${receipt.deliveryNoteNumber || 'N/A'}</p>
            <p>Invoice: ${receipt.invoiceNumber || 'N/A'}</p>
            ${receipt.invoiceTotal ? `<p>Invoice Total: ${formatPurchasingCurrency(receipt.invoiceTotal)}</p>` : ''}
          </div>
        </div>

        ${(totalDamaged > 0 || totalRejected > 0) ? `
        <div class="flags-row">
          ${totalDamaged > 0 ? `<span class="flag-chip" style="background:#fdf0e3; color:#e67e22;">⚠ ${totalDamaged} damaged</span>` : ''}
          ${totalRejected > 0 ? `<span class="flag-chip" style="background:#fadbd8; color:#e74c3c;">✕ ${totalRejected} rejected</span>` : ''}
        </div>
        ` : ''}

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="num">Ordered</th>
              <th class="num">Received</th>
              <th class="num">Damaged</th>
              <th class="num">Rejected</th>
              <th class="num">Accepted</th>
              <th>Unit</th>
              ${hasVarianceData ? '<th class="num">Price</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${receiptLines.map(line => {
              const expected = toNum(line.expectedPrice);
              const actual = toNum(line.actualPrice);
              const priceDiff = actual - expected;
              return `
              <tr>
                <td>
                  ${line.inventoryItemName || '—'}
                  ${line.note ? `<div class="item-note">${line.note}</div>` : ''}
                </td>
                <td class="num">${line.orderedQuantity ?? 0}</td>
                <td class="num">${line.receivedQuantity ?? 0}</td>
                <td class="num damaged">${toNum(line.damagedQuantity) || '—'}</td>
                <td class="num rejected">${toNum(line.rejectedQuantity) || '—'}</td>
                <td class="num accepted">${line.acceptedQuantity ?? 0}</td>
                <td>${line.unit || ''}</td>
                ${hasVarianceData ? `
                <td class="num">
                  ${formatPurchasingCurrency(actual)}
                  ${priceDiff !== 0 ? `<div class="price-variance ${priceDiff > 0 ? 'up' : 'down'}">${priceDiff > 0 ? '▲' : '▼'} ${formatPurchasingCurrency(Math.abs(priceDiff))} vs expected</div>` : ''}
                </td>
                ` : ''}
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <div class="label">Total Items Received:</div>
            <div class="value">${receiptLines.reduce((sum, l) => sum + toNum(l.receivedQuantity), 0)}</div>
          </div>
          <div class="totals-row grand-total">
            <div class="label">Total Accepted:</div>
            <div class="value">${receiptLines.reduce((sum, l) => sum + toNum(l.acceptedQuantity), 0)}</div>
          </div>
          ${receipt.invoiceTotal ? `
          <div class="totals-row">
            <div class="label">Invoice Total:</div>
            <div class="value">${formatPurchasingCurrency(receipt.invoiceTotal)}</div>
          </div>
          ` : ''}
        </div>

        ${receipt.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${receipt.notes}</p>
        </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-line">Received By / Date</div>
          <div class="signature-line">Checked By / Date</div>
        </div>

        <div class="footer">
          Generated by BrewCRM Purchasing Desk | ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleReceiveGoods = (po) => {
    setSelectedPO(po);
    setReceivingForm({
      receivedDate: new Date().toISOString().split('T')[0],
      deliveryNoteNumber: '',
      invoiceNumber: '',
      invoiceTotal: po.total,
      notes: '',
      lines: safeArr(po.items).map(item => ({
        purchaseOrderLineId: item.id,
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItemName,
        orderedQuantity: item.orderedQuantity,
        previouslyReceived: item.receivedQuantity,
        receivedQuantity: item.orderedQuantity - item.receivedQuantity,
        damagedQuantity: 0,
        rejectedQuantity: 0,
        unit: item.unit,
        expectedPrice: item.unitPrice,
        actualPrice: item.unitPrice,
        note: ''
      }))
    });
    setFormError("");
    setModalType('receiving');
    setShowModal(true);
  };

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setModalType('supplierdetail');
    setShowModal(true);
  };

  const handleDeletePO = (po) => {
    setDeleteDialog({
      open: true,
      label: po.poNumber,
      onConfirm: () => {
        handleSetPurchaseOrders(purchaseOrders.filter(p => p.id !== po.id));
        setDeleteDialog({ open: false, label: null, onConfirm: null });
      }
    });
  };

  const handleDeleteSupplier = (supplier) => {
    const hasOpenOrders = purchaseOrders.some(po => po.supplierId === supplier.id && !['RECEIVED', 'CANCELLED', 'CLOSED'].includes(po.status));
    if (hasOpenOrders) {
      setFormError("Cannot delete supplier with open purchase orders");
      return;
    }
    setDeleteDialog({
      open: true,
      label: supplier.name,
      onConfirm: () => {
        handleSetSuppliers(suppliers.filter(s => s.id !== supplier.id));
        setDeleteDialog({ open: false, label: null, onConfirm: null });
      }
    });
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Purchasing Desk
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Create supplier orders, receive stock, and track purchasing costs
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Needs Ordering", value: reorderNeeds.length, color: "#e74c3c", action: () => setViewMode("reorder") },
          { label: "Draft Orders", value: poStats.draftOrders, color: "#95a5a6", action: () => { setViewMode("orders"); setPoStatusFilter("DRAFT"); } },
          { label: "Awaiting Supplier", value: poStats.sentOrders + poStats.confirmedOrders, color: "#3498db", action: () => { setViewMode("orders"); setPoStatusFilter("SENT"); } },
          { label: "Expected Today", value: poStats.expectedToday, color: "#27ae60", action: () => setViewMode("orders") },
          { label: "Partially Received", value: poStats.partiallyReceived, color: "#f39c12", action: () => { setViewMode("orders"); setPoStatusFilter("ALL"); } },
          { label: "Late Deliveries", value: poStats.overdueOrders, color: "#e67e22", action: () => { setViewMode("orders"); setPoStatusFilter("ALL"); } },
          { label: "Unpaid Bills", value: formatPurchasingCurrency(poStats.unpaidAmount), color: "#9b59b6", action: () => setViewMode("orders") },
          { label: "Spend This Month", value: formatPurchasingCurrency(poStats.totalValue), color: "var(--cafe-accent)", action: () => setViewMode("orders") },
          { label: "Avg Order Value", value: formatPurchasingCurrency(avgOrderValue), color: "#16a085", action: () => setViewMode("orders") },
          { label: "On-Time Delivery", value: onTimeDeliveryRate === null ? "—" : `${onTimeDeliveryRate}%`, color: onTimeDeliveryRate === null ? "#95a5a6" : onTimeDeliveryRate >= 80 ? "#27ae60" : onTimeDeliveryRate >= 50 ? "#f39c12" : "#e74c3c", action: () => setViewMode("orders") },
        ].map(({ label: statLabel, value, color, action }) => (
          <div
            key={statLabel}
            onClick={action}
            style={{ ...card, borderLeft: `4px solid ${color}`, cursor: "pointer", transition: "opacity 0.15s", userSelect: "none" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>{statLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)", paddingBottom: 12 }}>
        <button
          style={{ ...btn(viewMode === "overview" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "overview" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("overview")}
        >
          Overview
        </button>
        <button
          style={{ ...btn(viewMode === "orders" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "orders" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("orders")}
        >
          Purchase Orders
        </button>
        <button
          style={{ ...btn(viewMode === "suppliers" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "suppliers" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("suppliers")}
        >
          Suppliers
        </button>
        <button
          style={{ ...btn(viewMode === "reorder" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "reorder" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("reorder")}
        >
          Reorder Needs
        </button>
      </div>

      {viewMode === "overview" && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16 }}>Purchasing Overview</h2>

            {topSupplierBySpend && (
              <div style={{ ...card, marginBottom: 16, borderLeft: "4px solid #16a085", backgroundColor: "#eafaf5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#16a085" }}>
                  🏆 Top supplier by spend: <strong>{topSupplierBySpend.name}</strong>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#16a085" }}>{formatPurchasingCurrency(topSupplierBySpend.spend)}</div>
              </div>
            )}

            {(() => {
              const overduePOs = purchaseOrders.filter(po => isPOOverdue(po));
              if (overduePOs.length === 0) return null;
              return (
                <div style={{ ...card, marginBottom: 16, borderLeft: "4px solid #e67e22", backgroundColor: "#fef6ed" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e67e22" }}>
                      🚨 {overduePOs.length} overdue delivery{overduePOs.length !== 1 ? "s" : ""}
                    </div>
                    <button onClick={() => { setViewMode("orders"); setPoStatusFilter("ALL"); }} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px", color: "#e67e22" }}>View Orders →</button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {overduePOs.slice(0, 4).map(po => (
                      <span key={po.id} onClick={() => handleViewPO(po)} style={{ ...pill, backgroundColor: "#fdebd0", color: "#e67e22", fontSize: 11, cursor: "pointer" }}>
                        {po.poNumber} · {po.supplierName}
                      </span>
                    ))}
                    {overduePOs.length > 4 && <span style={{ ...pill, backgroundColor: "#fdebd0", color: "#e67e22", fontSize: 11 }}>+{overduePOs.length - 4} more</span>}
                  </div>
                </div>
              );
            })()}

            {reorderNeeds.length > 0 && (
              <div style={{ ...card, marginBottom: 16, borderLeft: "4px solid #e74c3c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e74c3c" }}>
                    ⚠️ {reorderNeeds.length} items below reorder level
                  </div>
                  <button onClick={() => setViewMode("reorder")} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px", color: "#e74c3c" }}>View All →</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {sortedReorderNeeds.slice(0, 6).map(item => {
                    const urgency = getReorderUrgency(item);
                    return (
                    <div key={item.inventoryItemId} style={{ padding: 12, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 4, borderLeft: `3px solid ${urgency.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{item.inventoryItemName}</div>
                        <span style={{ ...pill, backgroundColor: urgency.bg, color: urgency.color, fontSize: 9, padding: "2px 6px" }}>{urgency.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)", marginTop: 4 }}>
                        Current: {item.currentQuantity} {item.unit} | Reorder at: {item.reorderLevel} {item.unit}
                      </div>
                      <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>
                        Shortage: {item.shortage} {item.unit}
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Recent Purchase Orders</div>
                  <button onClick={() => setViewMode("orders")} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px" }}>View All →</button>
                </div>
                {filteredPOs.slice(0, 5).map(po => {
                  const statusConfig = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
                  return (
                    <div key={po.id} onClick={() => handleViewPO(po)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--cafe-border-light)", cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{po.poNumber}</div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)" }}>{po.supplierName}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ ...pill, backgroundColor: statusConfig.bgColor, color: statusConfig.color, fontSize: 10 }}>
                          {statusConfig.label}
                        </span>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>{formatPurchasingCurrency(po.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Active Suppliers</div>
                  <button onClick={() => setViewMode("suppliers")} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 8px" }}>View All →</button>
                </div>
                {filteredSuppliers.slice(0, 5).map(supplier => {
                  const categoryConfig = SUPPLIER_CATEGORY_CONFIG[supplier.category] || SUPPLIER_CATEGORY_CONFIG.OTHER;
                  return (
                    <div key={supplier.id} onClick={() => handleViewSupplier(supplier)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--cafe-border-light)", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{categoryConfig.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{supplier.name}</div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)" }}>{supplier.contactPerson}</div>
                        </div>
                      </div>
                      {supplier.preferred && (
                        <span style={{ ...pill, backgroundColor: "#d5f5e3", color: "#27ae60", fontSize: 10 }}>Preferred</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "orders" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Purchase Orders</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btn("ghost") }} onClick={handleExportCSV}>Export CSV</button>
              <button style={{ ...btn("primary") }} onClick={handleAddPO}>+ New PO</button>
            </div>
          </div>

          {/* Search + status filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              style={{ ...input, minWidth: 200, flex: 1 }}
              placeholder="Search by PO number, supplier…"
              value={poSearch}
              onChange={e => setPoSearch(e.target.value)}
            />
            {[
              { key: "ALL", label: `All (${purchaseOrders.length})` },
              { key: "DRAFT", label: PO_STATUS_CONFIG.DRAFT?.label || "Draft" },
              { key: "SENT", label: PO_STATUS_CONFIG.SENT?.label || "Sent" },
              { key: "CONFIRMED", label: PO_STATUS_CONFIG.CONFIRMED?.label || "Confirmed" },
              { key: "RECEIVED", label: PO_STATUS_CONFIG.RECEIVED?.label || "Received" },
              { key: "CANCELLED", label: PO_STATUS_CONFIG.CANCELLED?.label || "Cancelled" },
            ].map(({ key, label: filterLabel }) => (
              <button
                key={key}
                onClick={() => setPoStatusFilter(key)}
                style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${poStatusFilter === key ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                  background: poStatusFilter === key ? "var(--cafe-accent-bg)" : "transparent",
                  color: poStatusFilter === key ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >{filterLabel}</button>
            ))}
          </div>

          {filteredPOs.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No purchase orders yet</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>Create your first purchase order to track supplier orders</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
              {filteredPOs.map(po => {
                const statusConfig = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
                const paymentConfig = PAYMENT_STATUS_CONFIG[po.paymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
                const receivingConfig = RECEIVING_STATUS_CONFIG[po.receivingStatus] || RECEIVING_STATUS_CONFIG.NOT_RECEIVED;
                const isOverdue = isPOOverdue(po);
                const daysUntil = getDaysUntilExpected(po.expectedDate);

                const poItems = safeArr(po.items);
                const totalOrdered = poItems.reduce((sum, item) => sum + (item.orderedQuantity || 0), 0);
                const totalReceived = poItems.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
                const remaining = totalOrdered - totalReceived;
                const daysSinceOrdered = po.orderDate ? Math.floor((Date.now() - new Date(po.orderDate).getTime()) / 86400000) : null;
                const itemPreview = poItems.slice(0, 2).map(i => i.inventoryItemName).filter(Boolean).join(", ");
                const itemPreviewExtra = poItems.length > 2 ? ` +${poItems.length - 2} more` : "";

                return (
                  <div key={po.id} style={{ ...card, borderLeft: `4px solid ${isOverdue ? '#e74c3c' : statusConfig.color}` }}>
                    <div onClick={() => handleViewPO(po)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{po.poNumber}</div>
                        <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>{po.supplierName}</div>
                      </div>
                      <div style={{ ...pill, backgroundColor: statusConfig.bgColor, color: statusConfig.color, fontSize: 11 }}>
                        {statusConfig.label}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
                      <div>Order Date: {formatPurchasingDate(po.orderDate)} {daysSinceOrdered !== null && daysSinceOrdered >= 0 && <span style={{ color: "var(--cafe-text-tertiary)" }}>({daysSinceOrdered === 0 ? "today" : `${daysSinceOrdered}d ago`})</span>}</div>
                      <div>Expected: {formatPurchasingDate(po.expectedDate)} {daysUntil !== null && daysUntil >= 0 && `(${daysUntil}d)`}</div>
                      {isOverdue && <div style={{ color: "#e74c3c" }}>⚠️ Overdue</div>}
                    </div>

                    {itemPreview && (
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 8, fontStyle: "italic" }}>
                        {itemPreview}{itemPreviewExtra}
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>{poItems.length} item{poItems.length !== 1 ? "s" : ""}</span>
                        <span style={{ color: totalOrdered > 0 && totalReceived === totalOrdered ? "#27ae60" : "var(--cafe-text-secondary)" }}>
                          {totalReceived}/{totalOrdered} {poItems[0]?.unit || "units"} received
                        </span>
                      </div>
                      {totalOrdered > 0 && (
                        <div style={{ height: 4, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (totalReceived / totalOrdered) * 100)}%`, backgroundColor: totalReceived === totalOrdered ? "#27ae60" : "#3498db", borderRadius: 2, transition: "width 0.3s ease" }} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(po.total)}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ ...pill, backgroundColor: paymentConfig.bgColor, color: paymentConfig.color, fontSize: 10 }}>{paymentConfig.label}</span>
                        <span style={{ ...pill, backgroundColor: receivingConfig.bgColor, color: receivingConfig.color, fontSize: 10 }}>{receivingConfig.label}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handleViewPO(po)}>View</button>
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handlePrintPO(po)}>Print</button>
                      {po.status === 'DRAFT' && (
                        <button style={{ ...btn("primary"), fontSize: 11, padding: "6px 12px" }} onClick={() => {
                          const sentPO = { ...po, status: 'SENT' };
                          const updatedPOs = purchaseOrders.map(p => p.id === po.id ? sentPO : p);
                          handleSetPurchaseOrders(updatedPOs);
                          const notif = triggerPurchasingNotification(sentPO, 'PO_SENT', { supplierName: po.supplierName });
                          addNotification(notif);
                        }}>Send</button>
                      )}
                      {po.receivingStatus !== 'FULLY_RECEIVED' && (
                        <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handleReceiveGoods(po)}>Receive</button>
                      )}
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px", color: "#e74c3c" }} onClick={() => handleDeletePO(po)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "suppliers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Suppliers <span style={{ fontSize: 13, fontWeight: 400, color: "var(--cafe-text-tertiary)" }}>({filteredSuppliers.length})</span></h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btn("ghost") }} onClick={handleExportSuppliersCSV}>Export CSV</button>
              <button style={{ ...btn("primary") }} onClick={handleAddSupplier}>+ Add Supplier</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              style={{ ...input, minWidth: 200, flex: 1 }}
              placeholder="Search by name, contact, phone, email…"
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
            />
            {["ALL", ...SAFE_SUPPLIER_CATEGORIES].map(cat => {
              const cfg = SUPPLIER_CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSupplierCategoryFilter(cat)}
                  style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${supplierCategoryFilter === cat ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                    background: supplierCategoryFilter === cat ? "var(--cafe-accent-bg)" : "transparent",
                    color: supplierCategoryFilter === cat ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >{cat === "ALL" ? `All (${suppliers.filter(s => s.active !== false).length})` : `${cfg?.icon || ""} ${cfg?.label || cat}`}</button>
              );
            })}
          </div>

          {filteredSuppliers.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No suppliers yet</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>Add suppliers to track your purchasing relationships</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filteredSuppliers.map(supplier => {
                const categoryConfig = SUPPLIER_CATEGORY_CONFIG[supplier.category] || SUPPLIER_CATEGORY_CONFIG.OTHER;
                const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id);
                const openPOs = supplierPOs.filter(po => !['RECEIVED', 'CANCELLED', 'CLOSED'].includes(po.status));

                return (
                  <div key={supplier.id} style={{ ...card, borderLeft: `4px solid ${categoryConfig.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{categoryConfig.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{supplier.name}</div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{categoryConfig.label}</div>
                        </div>
                      </div>
                      {supplier.preferred && (
                        <span style={{ ...pill, backgroundColor: "#d5f5e3", color: "#27ae60", fontSize: 10 }}>Preferred</span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
                      <div>{supplier.contactPerson}</div>
                      <div>{supplier.phone}</div>
                      <div>{supplier.email}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                      <div style={{ textAlign: "center", padding: "6px 4px", backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)" }}>Open</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: openPOs.length > 0 ? "#f39c12" : "var(--cafe-text-primary)" }}>{openPOs.length}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "6px 4px", backgroundColor: (supplier.unpaidBalance || 0) > 0 ? "#fef5fb" : "var(--cafe-bg-secondary)", borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)" }}>Unpaid</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: (supplier.unpaidBalance || 0) > 0 ? "#9b59b6" : "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(supplier.unpaidBalance || 0)}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "6px 4px", backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)" }}>Total Spend</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(supplierPOs.reduce((s, po) => s + (po.total || 0), 0))}</div>
                      </div>
                    </div>
                    {supplier.lastOrderDate && <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Last order: {formatPurchasingDate(supplier.lastOrderDate)}</div>}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => handleViewSupplier(supplier)}>View</button>
                      <button style={{ ...btn("primary"), fontSize: 11, padding: "6px 12px" }} onClick={() => {
                        setSelectedSupplier(supplier);
                        setForm({
                          supplierId: supplier.id,
                          orderDate: new Date().toISOString().split('T')[0],
                          expectedDate: '',
                          paymentTerms: supplier.paymentTerms || 'NET 30',
                          deliveryTerms: '',
                          items: [],
                          supplierNote: '',
                          internalNote: ''
                        });
                        setFormError("");
                        setModalType('addpo');
                        setShowModal(true);
                      }}>New Order</button>
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => {
                        setSelectedSupplier(supplier);
                        setForm({
                          name: supplier.name,
                          category: supplier.category,
                          active: supplier.active,
                          preferred: supplier.preferred,
                          contactPerson: supplier.contactPerson,
                          phone: supplier.phone,
                          email: supplier.email,
                          address: supplier.address,
                          city: supplier.city,
                          state: supplier.state,
                          postalCode: supplier.postalCode,
                          country: supplier.country,
                          gstNumber: supplier.gstNumber,
                          paymentTerms: supplier.paymentTerms,
                          deliveryDays: supplier.deliveryDays,
                          minimumOrder: supplier.minimumOrder,
                          deliveryCharge: supplier.deliveryCharge,
                          notes: supplier.notes,
                          internalNote: supplier.internalNote
                        });
                        setFormError("");
                        setModalType('addsupplier');
                        setShowModal(true);
                      }}>Edit</button>
                      <button style={{ ...btn("ghost"), fontSize: 11, padding: "6px 12px", color: "#e74c3c" }} onClick={() => handleDeleteSupplier(supplier)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "reorder" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Reorder Needs</h2>
          </div>

          {reorderNeeds.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>Stock levels are healthy</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>All items are above their reorder points</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: `All (${reorderNeeds.length})`, color: "var(--cafe-text-secondary)" },
                  { key: "Critical", label: `🔴 Critical (${reorderUrgencyCounts.Critical})`, color: "#e74c3c" },
                  { key: "Urgent", label: `🟠 Urgent (${reorderUrgencyCounts.Urgent})`, color: "#e67e22" },
                  { key: "Low", label: `🟡 Low (${reorderUrgencyCounts.Low})`, color: "#f39c12" },
                ].filter(f => f.key === "ALL" || reorderUrgencyCounts[f.key] > 0).map(({ key, label: filterLabel, color }) => (
                  <button
                    key={key}
                    onClick={() => setReorderUrgencyFilter(key)}
                    style={{
                      padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${reorderUrgencyFilter === key ? color : "var(--cafe-border-light)"}`,
                      background: reorderUrgencyFilter === key ? color + "22" : "transparent",
                      color: reorderUrgencyFilter === key ? color : "var(--cafe-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >{filterLabel}</button>
                ))}
              </div>

            <div style={{ ...card, padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Item</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Current</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Reorder Level</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Shortage</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Supplier</th>
                    <th style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedReorderNeeds.map(item => {
                    const urgency = getReorderUrgency(item);
                    return (
                    <tr key={item.inventoryItemId} style={{ borderBottom: "1px solid var(--cafe-border-light)", backgroundColor: urgency.bg + "33" }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...pill, backgroundColor: urgency.bg, color: urgency.color, fontSize: 9, padding: "2px 6px" }}>{urgency.label}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{item.inventoryItemName}</div>
                            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{item.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: item.currentQuantity === 0 ? "#e74c3c" : "var(--cafe-text-primary)", fontWeight: item.currentQuantity === 0 ? 700 : 400 }}>{item.currentQuantity}</td>
                      <td style={{ padding: 12, fontSize: 13 }}>{item.reorderLevel}</td>
                      <td style={{ padding: 12, fontSize: 13, color: urgency.color, fontWeight: 700 }}>{item.shortage}</td>
                      <td style={{ padding: 12, fontSize: 13 }}>{item.supplier || <span style={{ color: "var(--cafe-text-tertiary)" }}>Not assigned</span>}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>
                        <button style={{ ...btn("primary"), fontSize: 11, padding: "4px 8px" }} onClick={() => {
                          const supplier = suppliers.find(s => s.id === item.supplierId);
                          setSelectedSupplier(supplier);
                          setForm({
                            supplierId: supplier?.id || '',
                            orderDate: new Date().toISOString().split('T')[0],
                            expectedDate: '',
                            paymentTerms: supplier?.paymentTerms || 'NET 30',
                            deliveryTerms: '',
                            items: [{
                              inventoryItemId: item.inventoryItemId,
                              inventoryItemName: item.inventoryItemName,
                              orderedQuantity: item.shortage,
                              unit: item.unit,
                              unitPrice: 0,
                              taxRate: 18
                            }],
                            supplierNote: '',
                            internalNote: ''
                          });
                          setFormError("");
                          setModalType('addpo');
                          setShowModal(true);
                        }}>Add to PO</button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      )}

      {showModal && modalType === 'addsupplier' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {selectedSupplier ? "Edit Supplier" : "Add Supplier"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Supplier Name *</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Coffee Co"
                />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { key: "preferred", label: "⭐ Mark as Preferred", desc: "Preferred suppliers appear first" },
                  { key: "active", label: "✅ Active", desc: "Inactive suppliers are hidden" },
                ].map(({ key, label: toggleLabel, desc }) => (
                  <div
                    key={key}
                    onClick={() => setForm({ ...form, [key]: !form[key] })}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: form[key] ? "var(--cafe-accent-bg)" : "var(--cafe-bg-secondary)", border: `1px solid ${form[key] ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, borderRadius: 8, cursor: "pointer", flex: 1 }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${form[key] ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`, backgroundColor: form[key] ? "var(--cafe-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {form[key] && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: form[key] ? "var(--cafe-accent)" : "var(--cafe-text-primary)" }}>{toggleLabel}</div>
                      <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Category</label>
                  <select
                    style={{ ...input, width: "100%" }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="INGREDIENTS">Ingredients</option>
                    <option value="DAIRY">Dairy</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="BEVERAGES">Beverages</option>
                    <option value="SUPPLIES">Supplies</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="SERVICES">Services</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Contact Person</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Phone</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g., +91-9876543210"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    style={{ ...input, width: "100%" }}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g., orders@supplier.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Address</label>
                <input
                  type="text"
                  style={{ ...input, width: "100%" }}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>State</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Postal Code</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>GST Number</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    placeholder="GST/Tax number"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Payment Terms</label>
                  <select
                    style={{ ...input, width: "100%" }}
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  >
                    <option value="NET 7">Net 7 Days</option>
                    <option value="NET 15">Net 15 Days</option>
                    <option value="NET 30">Net 30 Days</option>
                    <option value="NET 45">Net 45 Days</option>
                    <option value="NET 60">Net 60 Days</option>
                    <option value="CASH">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Delivery Days</label>
                  <input
                    type="number"
                    style={{ ...input, width: "100%" }}
                    value={form.deliveryDays}
                    onChange={(e) => setForm({ ...form, deliveryDays: Number(e.target.value) })}
                    placeholder="Expected delivery days"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Minimum Order</label>
                  <input
                    type="number"
                    style={{ ...input, width: "100%" }}
                    value={form.minimumOrder}
                    onChange={(e) => setForm({ ...form, minimumOrder: Number(e.target.value) })}
                    placeholder="Minimum order amount"
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Operational notes..."
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Internal Note</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.internalNote}
                  onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
                  placeholder="Internal notes..."
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
                    if (!form.name || form.name.trim().length === 0) {
                      setFormError("Supplier name is required");
                      return;
                    }
                    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                      setFormError("Please enter a valid email address");
                      return;
                    }
                    if (form.gstNumber && form.gstNumber.trim() && !/^[0-9A-Z]{15}$/.test(form.gstNumber.trim().toUpperCase())) {
                      setFormError("GST number should be 15 characters (letters and digits)");
                      return;
                    }
                    if (form.minimumOrder < 0 || form.deliveryCharge < 0) {
                      setFormError("Minimum order and delivery charge cannot be negative");
                      return;
                    }

                    if (selectedSupplier) {
                      const updatedSupplier = { ...selectedSupplier, ...form };
                      handleSetSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? updatedSupplier : s));
                    } else {
                      const newSupplier = createSupplier(form);
                      handleSetSuppliers([...suppliers, newSupplier]);
                    }
                    closeModal();
                  }}
                >
                  {selectedSupplier ? "Update" : "Add"} Supplier
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'addpo' && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {selectedPO ? "Edit Purchase Order" : "New Purchase Order"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Supplier *</label>
                <select
                  style={{ ...input, width: "100%" }}
                  value={form.supplierId}
                  onChange={(e) => {
                    const sup = suppliers.find(s => s.id === e.target.value);
                    const autoExpected = sup?.deliveryDays
                      ? new Date(Date.now() + sup.deliveryDays * 86400000).toISOString().split('T')[0]
                      : form.expectedDate;
                    setForm({ ...form, supplierId: e.target.value, paymentTerms: sup?.paymentTerms || form.paymentTerms, expectedDate: autoExpected });
                  }}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.filter(s => s.active !== false).map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
                {form.supplierId && (() => {
                  const sup = suppliers.find(s => s.id === form.supplierId);
                  if (!sup) return null;
                  return (
                    <div style={{ marginTop: 8, padding: "8px 12px", backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, fontSize: 12, color: "var(--cafe-text-secondary)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {sup.contactPerson && <span>👤 {sup.contactPerson}</span>}
                      {sup.phone && <span>📞 {sup.phone}</span>}
                      {sup.paymentTerms && <span>💳 {sup.paymentTerms}</span>}
                      {sup.deliveryDays && <span>🚚 {sup.deliveryDays}d delivery</span>}
                      {sup.minimumOrder > 0 && <span>Min: {formatPurchasingCurrency(sup.minimumOrder)}</span>}
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Order Date</label>
                  <input
                    type="date"
                    style={{ ...input, width: "100%" }}
                    value={form.orderDate}
                    onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    style={{ ...input, width: "100%" }}
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Payment Terms</label>
                  <select
                    style={{ ...input, width: "100%" }}
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  >
                    <option value="NET 7">Net 7 Days</option>
                    <option value="NET 15">Net 15 Days</option>
                    <option value="NET 30">Net 30 Days</option>
                    <option value="NET 45">Net 45 Days</option>
                    <option value="NET 60">Net 60 Days</option>
                    <option value="CASH">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Delivery Terms</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={form.deliveryTerms}
                    onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
                    placeholder="e.g., FOB, EXW"
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Items</label>
                <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                  {form.items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 16, color: "var(--cafe-text-tertiary)" }}>
                      No items added yet
                    </div>
                  ) : (
                    form.items.map((item, idx) => {
                      const isDuplicate = item.inventoryItemId && form.items.some((other, otherIdx) => otherIdx !== idx && other.inventoryItemId === item.inventoryItemId);
                      const isInvalid = !item.inventoryItemId || !(toNum(item.orderedQuantity) > 0);
                      const rowIssue = isDuplicate ? "Duplicate item — quantities won't combine automatically" : isInvalid ? "Select an item and enter a quantity" : null;
                      return (
                      <div key={idx}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr) auto", gap: 8, alignItems: "center", marginBottom: rowIssue ? 4 : 8, paddingBottom: rowIssue ? 4 : 8, borderBottom: "1px solid var(--cafe-border-light)", ...(rowIssue ? { backgroundColor: "#fdf2f2", borderRadius: 4, padding: 4 } : {}) }}>
                        <div>
                          <select
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={item.inventoryItemId}
                            onChange={(e) => {
                              const newItems = [...form.items];
                              const invItem = safeInventory.find(i => i.id === e.target.value);
                              newItems[idx] = { ...item, inventoryItemId: e.target.value, inventoryItemName: invItem?.name || '', unit: invItem?.unit || 'pcs', unitPrice: invItem?.cost || 0 };
                              setForm({ ...form, items: newItems });
                            }}
                          >
                            <option value="">Select Item</option>
                            {safeInventory.map(inv => (
                              <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={item.orderedQuantity}
                            onChange={(e) => {
                              const newItems = [...form.items];
                              newItems[idx] = { ...item, orderedQuantity: Number(e.target.value) };
                              setForm({ ...form, items: newItems });
                            }}
                            placeholder="Qty"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...form.items];
                              newItems[idx] = { ...item, unitPrice: Number(e.target.value) };
                              setForm({ ...form, items: newItems });
                            }}
                            placeholder="Price"
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)" }}>
                          {formatPurchasingCurrency(item.orderedQuantity * item.unitPrice)}
                        </div>
                        <button
                          style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 11, color: "#e74c3c" }}
                          onClick={() => {
                            const newItems = form.items.filter((_, i) => i !== idx);
                            setForm({ ...form, items: newItems });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      {rowIssue && <div style={{ fontSize: 10, color: "#e74c3c", marginBottom: 8, marginTop: -2 }}>⚠ {rowIssue}</div>}
                      </div>
                    );})
                  )}
                  <button
                    style={{ ...btn("ghost"), width: "100%", marginTop: 8 }}
                    onClick={() => {
                      setForm({ ...form, items: [...form.items, { inventoryItemId: '', inventoryItemName: '', orderedQuantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18 }] });
                    }}
                  >
                    + Add Item
                  </button>
                  {form.items.length > 0 && (() => {
                    const subtotal = form.items.reduce((s, it) => s + (toNum(it.orderedQuantity) * toNum(it.unitPrice)), 0);
                    const tax = form.items.reduce((s, it) => s + (toNum(it.orderedQuantity) * toNum(it.unitPrice) * toNum(it.taxRate, 0) / 100), 0);
                    const sup = suppliers.find(s => s.id === form.supplierId);
                    const delivery = toNum(sup?.deliveryCharge, 0);
                    const total = subtotal + tax + delivery;
                    const belowMinimum = sup?.minimumOrder > 0 && subtotal < sup.minimumOrder;
                    return (
                      <>
                      {belowMinimum && (
                        <div style={{ marginTop: 10, padding: "8px 12px", backgroundColor: "#fef9e7", color: "#b7791f", borderRadius: 6, fontSize: 12 }}>
                          ⚠ Below {sup.name}'s minimum order of {formatPurchasingCurrency(sup.minimumOrder)} (currently {formatPurchasingCurrency(subtotal)})
                        </div>
                      )}
                      <div style={{ marginTop: 10, padding: "10px 12px", backgroundColor: "var(--cafe-bg-primary)", borderRadius: 6, borderTop: "1px solid var(--cafe-border-light)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                          <span>Subtotal</span><span>{formatPurchasingCurrency(subtotal)}</span>
                        </div>
                        {tax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                          <span>Tax</span><span>{formatPurchasingCurrency(tax)}</span>
                        </div>}
                        {delivery > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                          <span>Delivery</span><span>{formatPurchasingCurrency(delivery)}</span>
                        </div>}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", borderTop: "1px solid var(--cafe-border-light)", paddingTop: 6, marginTop: 4 }}>
                          <span>Estimated Total</span><span>{formatPurchasingCurrency(total)}</span>
                        </div>
                      </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Supplier Note</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.supplierNote}
                  onChange={(e) => setForm({ ...form, supplierNote: e.target.value })}
                  placeholder="Note to supplier..."
                />
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Internal Note</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={form.internalNote}
                  onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
                  placeholder="Internal note..."
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
                    if (!form.supplierId) {
                      setFormError("Please select a supplier");
                      return;
                    }
                    if (form.items.length === 0) {
                      setFormError("Please add at least one item");
                      return;
                    }
                    const validItems = form.items.filter(item => item.inventoryItemId && item.orderedQuantity > 0);
                    if (validItems.length === 0) {
                      setFormError("Please complete all item fields");
                      return;
                    }
                    const hasNegativePrice = form.items.some(item => toNum(item.unitPrice) < 0);
                    if (hasNegativePrice) {
                      setFormError("Item prices cannot be negative");
                      return;
                    }

                    const newPO = createPurchaseOrder({
                      supplierId: form.supplierId,
                      supplierName: suppliers.find(s => s.id === form.supplierId)?.name || '',
                      orderDate: form.orderDate,
                      expectedDate: form.expectedDate,
                      paymentTerms: form.paymentTerms,
                      deliveryTerms: form.deliveryTerms,
                      items: validItems,
                      supplierNote: form.supplierNote,
                      internalNote: form.internalNote
                    });

                    handleSetPurchaseOrders([...purchaseOrders, newPO]);
                    closeModal();
                  }}
                >
                  {selectedPO ? "Update" : "Create"} Purchase Order
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'receiving' && selectedPO && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "90%" : 700, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Receive Goods - {selectedPO.poNumber}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Received Date</label>
                  <input
                    type="date"
                    style={{ ...input, width: "100%" }}
                    value={receivingForm.receivedDate}
                    onChange={(e) => setReceivingForm({ ...receivingForm, receivedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Delivery Note Number</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={receivingForm.deliveryNoteNumber}
                    onChange={(e) => setReceivingForm({ ...receivingForm, deliveryNoteNumber: e.target.value })}
                    placeholder="Delivery note #"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Invoice Number</label>
                  <input
                    type="text"
                    style={{ ...input, width: "100%" }}
                    value={receivingForm.invoiceNumber}
                    onChange={(e) => setReceivingForm({ ...receivingForm, invoiceNumber: e.target.value })}
                    placeholder="Invoice #"
                  />
                </div>
                <div>
                  <label style={{ ...label, display: "block", marginBottom: 4 }}>Invoice Total</label>
                  <input
                    type="number"
                    style={{ ...input, width: "100%" }}
                    value={receivingForm.invoiceTotal}
                    onChange={(e) => setReceivingForm({ ...receivingForm, invoiceTotal: Number(e.target.value) })}
                    placeholder="Invoice total"
                  />
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Items</label>
                <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-secondary)" }}>
                  {receivingForm.lines.map((line, idx) => {
                    const remaining = line.orderedQuantity - line.previouslyReceived;
                    const accepted = toNum(line.receivedQuantity) - toNum(line.damagedQuantity) - toNum(line.rejectedQuantity);
                    const overReceived = toNum(line.receivedQuantity) > remaining;
                    const priceDiff = toNum(line.actualPrice) - toNum(line.expectedPrice);
                    return (
                    <div key={idx} style={{ padding: 12, backgroundColor: "var(--cafe-bg-primary)", borderRadius: 4, marginBottom: 8, ...(overReceived || accepted < 0 ? { border: "1px solid #e74c3c" } : {}) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{line.inventoryItemName}</div>
                        {remaining > 0 && (
                          <button
                            style={{ ...btn("ghost"), fontSize: 10, padding: "3px 8px" }}
                            onClick={() => {
                              const newLines = [...receivingForm.lines];
                              newLines[idx] = { ...line, receivedQuantity: remaining, damagedQuantity: 0, rejectedQuantity: 0 };
                              setReceivingForm({ ...receivingForm, lines: newLines });
                            }}
                          >
                            Fill remaining ({remaining})
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Ordered</label>
                          <div style={{ fontSize: 13 }}>{line.orderedQuantity} {line.unit}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Previously Received</label>
                          <div style={{ fontSize: 13 }}>{line.previouslyReceived} {line.unit}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Remaining</label>
                          <div style={{ fontSize: 13 }}>{remaining} {line.unit}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Expected Price</label>
                          <div style={{ fontSize: 13 }}>{formatPurchasingCurrency(line.expectedPrice)}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 8 }}>
                        <div>
                          <label style={{ ...label, fontSize: 11 }}>Received</label>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12, ...(overReceived ? { borderColor: "#e74c3c" } : {}) }}
                            value={line.receivedQuantity}
                            onChange={(e) => {
                              const newLines = [...receivingForm.lines];
                              newLines[idx] = { ...line, receivedQuantity: Number(e.target.value) };
                              setReceivingForm({ ...receivingForm, lines: newLines });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ ...label, fontSize: 11 }}>Damaged</label>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={line.damagedQuantity}
                            onChange={(e) => {
                              const newLines = [...receivingForm.lines];
                              newLines[idx] = { ...line, damagedQuantity: Number(e.target.value) };
                              setReceivingForm({ ...receivingForm, lines: newLines });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ ...label, fontSize: 11 }}>Rejected</label>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={line.rejectedQuantity}
                            onChange={(e) => {
                              const newLines = [...receivingForm.lines];
                              newLines[idx] = { ...line, rejectedQuantity: Number(e.target.value) };
                              setReceivingForm({ ...receivingForm, lines: newLines });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ ...label, fontSize: 11 }}>Actual Price</label>
                          <input
                            type="number"
                            min="0"
                            style={{ ...input, width: "100%", fontSize: 12 }}
                            value={line.actualPrice}
                            onChange={(e) => {
                              const newLines = [...receivingForm.lines];
                              newLines[idx] = { ...line, actualPrice: Number(e.target.value) };
                              setReceivingForm({ ...receivingForm, lines: newLines });
                            }}
                          />
                          {priceDiff !== 0 && (
                            <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600, color: priceDiff > 0 ? "#e74c3c" : "#27ae60" }}>
                              {priceDiff > 0 ? '▲' : '▼'} {formatPurchasingCurrency(Math.abs(priceDiff))} vs expected
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: accepted < 0 ? "#e74c3c" : "var(--cafe-text-secondary)" }}>
                        Accepted: {accepted} {line.unit}{accepted < 0 ? " — damaged + rejected exceeds received" : ""}
                        {overReceived && <span style={{ color: "#e74c3c", marginLeft: 8 }}>⚠ Exceeds remaining quantity ({remaining})</span>}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", display: "block", marginBottom: 2 }}>Note</label>
                        <input
                          type="text"
                          style={{ ...input, width: "100%", fontSize: 12 }}
                          value={line.note}
                          onChange={(e) => {
                            const newLines = [...receivingForm.lines];
                            newLines[idx] = { ...line, note: e.target.value };
                            setReceivingForm({ ...receivingForm, lines: newLines });
                          }}
                          placeholder="e.g. packaging damaged, short delivery..."
                        />
                      </div>
                    </div>
                  );})}
                </div>
              </div>

              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea
                  style={{ ...input, width: "100%", minHeight: 60 }}
                  value={receivingForm.notes}
                  onChange={(e) => setReceivingForm({ ...receivingForm, notes: e.target.value })}
                  placeholder="Receiving notes..."
                />
              </div>

              {(() => {
                const linesWithActivity = receivingForm.lines.filter(l => toNum(l.receivedQuantity) > 0 || toNum(l.damagedQuantity) > 0 || toNum(l.rejectedQuantity) > 0);
                if (linesWithActivity.length === 0) return null;
                const totalAccepted = linesWithActivity.reduce((s, l) => s + (toNum(l.receivedQuantity) - toNum(l.damagedQuantity) - toNum(l.rejectedQuantity)), 0);
                const totalValue = linesWithActivity.reduce((s, l) => s + (toNum(l.receivedQuantity) - toNum(l.damagedQuantity) - toNum(l.rejectedQuantity)) * toNum(l.actualPrice), 0);
                return (
                  <div style={{ padding: "10px 12px", backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, fontSize: 12, color: "var(--cafe-text-secondary)", display: "flex", justifyContent: "space-between" }}>
                    <span>{linesWithActivity.length} line{linesWithActivity.length !== 1 ? 's' : ''} · {totalAccepted} unit{totalAccepted !== 1 ? 's' : ''} accepted</span>
                    <span style={{ fontWeight: 600, color: "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(totalValue)}</span>
                  </div>
                );
              })()}

              {formError && (
                <div style={{ padding: 12, backgroundColor: "#fadbd8", color: "#e74c3c", borderRadius: 4, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{ ...btn("primary"), flex: 1 }}
                  onClick={() => {
                    const validLines = receivingForm.lines.filter(line => line.receivedQuantity > 0 || line.damagedQuantity > 0 || line.rejectedQuantity > 0);
                    if (validLines.length === 0) {
                      setFormError("Please record at least one item as received, damaged, or rejected");
                      return;
                    }

                    const receiptLines = validLines.map(line => createGoodsReceiptLine({
                      purchaseOrderLineId: line.purchaseOrderLineId,
                      inventoryItemId: line.inventoryItemId,
                      inventoryItemName: line.inventoryItemName,
                      orderedQuantity: line.orderedQuantity,
                      previouslyReceived: line.previouslyReceived,
                      receivedQuantity: line.receivedQuantity,
                      damagedQuantity: line.damagedQuantity,
                      rejectedQuantity: line.rejectedQuantity,
                      unit: line.unit,
                      expectedPrice: line.expectedPrice,
                      actualPrice: line.actualPrice,
                      note: line.note
                    }));

                    const receipt = createGoodsReceipt({
                      purchaseOrderId: selectedPO.id,
                      poNumber: selectedPO.poNumber,
                      supplierId: selectedPO.supplierId,
                      supplierName: selectedPO.supplierName,
                      receivedDate: receivingForm.receivedDate,
                      deliveryNoteNumber: receivingForm.deliveryNoteNumber,
                      invoiceNumber: receivingForm.invoiceNumber,
                      invoiceTotal: receivingForm.invoiceTotal,
                      notes: receivingForm.notes,
                      lines: receiptLines
                    });

                    const updatedPO = { ...selectedPO, receipts: [...(selectedPO.receipts || []), receipt] };
                    
                    const updatedItems = safeArr(selectedPO.items).map(item => {
                      const line = receiptLines.find(l => l.purchaseOrderLineId === item.id);
                      if (line) {
                        return {
                          ...item,
                          receivedQuantity: item.receivedQuantity + line.acceptedQuantity,
                          damagedQuantity: item.damagedQuantity + line.damagedQuantity,
                          rejectedQuantity: item.rejectedQuantity + line.rejectedQuantity
                        };
                      }
                      return item;
                    });

                    const updatedPOWithItems = updatePOReceivingStatus({ ...updatedPO, items: updatedItems });
                    
                    const updatedPOs = purchaseOrders.map(po => po.id === selectedPO.id ? updatedPOWithItems : po);
                    handleSetPurchaseOrders(updatedPOs);

                    handlePrintGoodsReceipt(receipt);
                    
                  }}
                >
                  Complete Receiving
                </button>
                <button
                  style={{ ...btn("ghost"), flex: 1 }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'podetail' && selectedPO && (() => {
        const statusCfg = PO_STATUS_CONFIG[selectedPO.status] || PO_STATUS_CONFIG.DRAFT;
        const paymentCfg = PAYMENT_STATUS_CONFIG[selectedPO.paymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
        const receivingCfg = RECEIVING_STATUS_CONFIG[selectedPO.receivingStatus] || RECEIVING_STATUS_CONFIG.NOT_RECEIVED;
        const selectedPOItems = safeArr(selectedPO.items);
        const totalOrdered = selectedPOItems.reduce((s, i) => s + (i.orderedQuantity || 0), 0);
        const totalReceived = selectedPOItems.reduce((s, i) => s + (i.receivedQuantity || 0), 0);
        const isOverdue = isPOOverdue(selectedPO);
        return (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ ...card, width: isMobile ? "95%" : 640, maxHeight: "92vh", overflowY: "auto" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedPO.poNumber}</h2>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginTop: 2 }}>{selectedPO.supplierName}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ ...pill, backgroundColor: statusCfg.bgColor, color: statusCfg.color, fontSize: 11 }}>{statusCfg.label}</span>
                  {isOverdue && <span style={{ ...pill, backgroundColor: "#fadbd8", color: "#e74c3c", fontSize: 11 }}>⚠️ Overdue</span>}
                </div>
              </div>

              {/* Dates + Terms */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16, padding: 12, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Order Date</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500 }}>{formatPurchasingDate(selectedPO.orderDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Expected Date</div>
                  <div style={{ fontSize: 13, color: isOverdue ? "#e74c3c" : "var(--cafe-text-primary)", fontWeight: 500 }}>{formatPurchasingDate(selectedPO.expectedDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Payment Terms</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{selectedPO.paymentTerms || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Delivery Terms</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{selectedPO.deliveryTerms || "—"}</div>
                </div>
              </div>

              {/* Financials */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: "center", padding: 12, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(selectedPO.total)}</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, backgroundColor: paymentCfg.bgColor || "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Payment</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: paymentCfg.color }}>{paymentCfg.label}</div>
                  {selectedPO.amountPaid > 0 && <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Paid: {formatPurchasingCurrency(selectedPO.amountPaid)}</div>}
                </div>
                <div style={{ textAlign: "center", padding: 12, backgroundColor: receivingCfg.bgColor || "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Receiving</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: receivingCfg.color }}>{receivingCfg.label}</div>
                  {totalOrdered > 0 && <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{totalReceived}/{totalOrdered} units</div>}
                </div>
              </div>

              {/* Receiving Progress */}
              {totalOrdered > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                    <span>Receiving Progress</span>
                    <span>{Math.round((totalReceived / totalOrdered) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (totalReceived / totalOrdered) * 100)}%`, backgroundColor: totalReceived === totalOrdered ? "#27ae60" : "#3498db", borderRadius: 3 }} />
                  </div>
                </div>
              )}

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Items ({selectedPOItems.length})</div>
                {selectedPOItems.map(item => {
                  const itemReceived = item.receivedQuantity || 0;
                  const itemOrdered = item.orderedQuantity || 0;
                  return (
                    <div key={item.id} style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.inventoryItemName}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatPurchasingCurrency(item.lineTotal)}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)" }}>
                          {itemOrdered} {item.unit} × {formatPurchasingCurrency(item.unitPrice)}
                        </div>
                        <div style={{ fontSize: 11, color: itemReceived === itemOrdered ? "#27ae60" : "var(--cafe-text-tertiary)" }}>
                          Received: {itemReceived}/{itemOrdered}
                          {item.damagedQuantity > 0 && <span style={{ color: "#e67e22", marginLeft: 6 }}>Damaged: {item.damagedQuantity}</span>}
                          {item.rejectedQuantity > 0 && <span style={{ color: "#e74c3c", marginLeft: 6 }}>Rejected: {item.rejectedQuantity}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals breakdown */}
              <div style={{ padding: 12, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 16 }}>
                {selectedPO.subtotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                    <span>Subtotal</span><span>{formatPurchasingCurrency(selectedPO.subtotal)}</span>
                  </div>
                )}
                {selectedPO.tax > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                    <span>Tax</span><span>{formatPurchasingCurrency(selectedPO.tax)}</span>
                  </div>
                )}
                {selectedPO.deliveryCharge > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                    <span>Delivery</span><span>{formatPurchasingCurrency(selectedPO.deliveryCharge)}</span>
                  </div>
                )}
                {selectedPO.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#27ae60", marginBottom: 4 }}>
                    <span>Discount</span><span>−{formatPurchasingCurrency(selectedPO.discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", borderTop: "1px solid var(--cafe-border-light)", paddingTop: 8, marginTop: 4 }}>
                  <span>Total</span><span>{formatPurchasingCurrency(selectedPO.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {(selectedPO.supplierNote || selectedPO.internalNote) && (
                <div style={{ marginBottom: 16 }}>
                  {selectedPO.supplierNote && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Supplier Note</div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{selectedPO.supplierNote}</div>
                    </div>
                  )}
                  {selectedPO.internalNote && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Internal Note</div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{selectedPO.internalNote}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Receipts history */}
              {safeArr(selectedPO.receipts).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Goods Receipts ({selectedPO.receipts.length})</div>
                  {selectedPO.receipts.map((receipt, idx) => (
                    <div key={idx} style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{receipt.receiptNumber}</div>
                        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{formatPurchasingDate(receipt.receivedDate)}</div>
                      </div>
                      {receipt.invoiceNumber && <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)", marginTop: 2 }}>Invoice: {receipt.invoiceNumber}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => { handlePrintPO(selectedPO); }}>🖨 Print PO</button>
                {selectedPO.receivingStatus !== 'FULLY_RECEIVED' && (
                  <button style={{ ...btn("primary"), flex: 1 }} onClick={() => { closeModal(); setTimeout(() => handleReceiveGoods(selectedPO), 50); }}>Receive Goods</button>
                )}
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showModal && modalType === 'supplierdetail' && selectedSupplier && (() => {
        const categoryConfig = SUPPLIER_CATEGORY_CONFIG[selectedSupplier.category] || SUPPLIER_CATEGORY_CONFIG.OTHER;
        const supplierPOs = purchaseOrders.filter(po => po.supplierId === selectedSupplier.id);
        const openPOs = supplierPOs.filter(po => !['RECEIVED', 'CANCELLED', 'CLOSED'].includes(po.status));
        const recentPOs = supplierPOs.slice(0, 5).sort((a, b) => (b.orderDate || 0) - (a.orderDate || 0));
        const totalSpend = supplierPOs.reduce((s, po) => s + (po.total || 0), 0);
        const supplierReceived = supplierPOs.filter(po => po.receivingStatus === 'FULLY_RECEIVED' && po.expectedDate);
        const supplierOnTime = supplierReceived.filter(po => !isPOOverdue({ ...po, receivingStatus: 'NOT_RECEIVED' }));
        const supplierOnTimeRate = supplierReceived.length ? Math.round((supplierOnTime.length / supplierReceived.length) * 100) : null;
        return (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ ...card, width: isMobile ? "95%" : 540, maxHeight: "92vh", overflowY: "auto" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{categoryConfig.icon}</span>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedSupplier.name}</h2>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>{categoryConfig.label}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {selectedSupplier.preferred && <span style={{ ...pill, backgroundColor: "#d5f5e3", color: "#27ae60", fontSize: 11 }}>⭐ Preferred</span>}
                  <span style={{ ...pill, backgroundColor: selectedSupplier.active !== false ? "#d5f5e3" : "#fadbd8", color: selectedSupplier.active !== false ? "#27ae60" : "#e74c3c", fontSize: 11 }}>{selectedSupplier.active !== false ? "Active" : "Inactive"}</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                <div style={{ textAlign: "center", padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Total Orders</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{supplierPOs.length}</div>
                </div>
                <div style={{ textAlign: "center", padding: 10, backgroundColor: openPOs.length > 0 ? "#fef9e7" : "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Open Orders</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: openPOs.length > 0 ? "#f39c12" : "var(--cafe-text-primary)" }}>{openPOs.length}</div>
                </div>
                <div style={{ textAlign: "center", padding: 10, backgroundColor: (selectedSupplier.unpaidBalance || 0) > 0 ? "#fef5fb" : "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Unpaid Balance</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: (selectedSupplier.unpaidBalance || 0) > 0 ? "#9b59b6" : "var(--cafe-text-primary)" }}>{formatPurchasingCurrency(selectedSupplier.unpaidBalance || 0)}</div>
                </div>
                <div style={{ textAlign: "center", padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>On-Time</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: supplierOnTimeRate === null ? "var(--cafe-text-primary)" : supplierOnTimeRate >= 80 ? "#27ae60" : supplierOnTimeRate >= 50 ? "#f39c12" : "#e74c3c" }}>{supplierOnTimeRate === null ? "—" : `${supplierOnTimeRate}%`}</div>
                </div>
              </div>

              {/* Contact info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                  {selectedSupplier.contactPerson && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Contact Person</div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500, marginTop: 2 }}>{selectedSupplier.contactPerson}</div>
                    </div>
                  )}
                  {selectedSupplier.phone && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Phone</div>
                      <a href={`tel:${selectedSupplier.phone}`} style={{ fontSize: 13, color: "var(--cafe-accent)", fontWeight: 500, marginTop: 2, display: "block", textDecoration: "none" }}>{selectedSupplier.phone}</a>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Email</div>
                      <a href={`mailto:${selectedSupplier.email}`} style={{ fontSize: 13, color: "var(--cafe-accent)", fontWeight: 500, marginTop: 2, display: "block", textDecoration: "none" }}>{selectedSupplier.email}</a>
                    </div>
                  )}
                  {selectedSupplier.gstNumber && (
                    <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>GST Number</div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500, marginTop: 2, fontFamily: "monospace" }}>{selectedSupplier.gstNumber}</div>
                    </div>
                  )}
                </div>
                {(selectedSupplier.address || selectedSupplier.city) && (
                  <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Address</div>
                    <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>
                      {[selectedSupplier.address, selectedSupplier.city, selectedSupplier.state, selectedSupplier.postalCode, selectedSupplier.country].filter(Boolean).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Terms</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Payment Terms</div>
                    <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500, marginTop: 2 }}>{selectedSupplier.paymentTerms || "—"}</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Delivery Days</div>
                    <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500, marginTop: 2 }}>{selectedSupplier.deliveryDays ? `${selectedSupplier.deliveryDays}d` : "—"}</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>Min. Order</div>
                    <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 500, marginTop: 2 }}>{selectedSupplier.minimumOrder > 0 ? formatPurchasingCurrency(selectedSupplier.minimumOrder) : "—"}</div>
                  </div>
                </div>
              </div>

              {/* Recent POs */}
              {recentPOs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recent Orders · Total Spend: {formatPurchasingCurrency(totalSpend)}
                  </div>
                  {recentPOs.map(po => {
                    const poCfg = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
                    return (
                      <div key={po.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{po.poNumber}</div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatPurchasingDate(po.orderDate)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ ...pill, backgroundColor: poCfg.bgColor, color: poCfg.color, fontSize: 10, marginBottom: 2 }}>{poCfg.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{formatPurchasingCurrency(po.total)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Notes */}
              {selectedSupplier.notes && (
                <div style={{ padding: 10, backgroundColor: "var(--cafe-bg-secondary)", borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Notes</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>{selectedSupplier.notes}</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btn("primary"), flex: 1 }} onClick={() => {
                  closeModal();
                  setTimeout(() => {
                    setSelectedSupplier(selectedSupplier);
                    setForm({ supplierId: selectedSupplier.id, orderDate: new Date().toISOString().split('T')[0], expectedDate: '', paymentTerms: selectedSupplier.paymentTerms || 'NET 30', deliveryTerms: '', items: [], supplierNote: '', internalNote: '' });
                    setFormError("");
                    setModalType('addpo');
                    setShowModal(true);
                  }, 50);
                }}>New Order</button>
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {deleteDialog.open && (
        <DestructiveDialog
          isOpen={deleteDialog.open}
          title={`Delete ${deleteDialog.label}?`}
          message="This action cannot be undone."
          onConfirm={deleteDialog.onConfirm}
          onCancel={() => setDeleteDialog({ open: false, label: null, onConfirm: null })}
        />
      )}
    </div>
  );
}
