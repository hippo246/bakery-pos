// GST Reports - GSTR-1, GSTR-3B, GSTR-9 and compliance reports

import { createGSTInvoice, splitTax, isInterstate } from './gstModel.js';
import { 
  INVOICE_TYPES, 
  GSTR1_SECTIONS, 
  TAX_TYPES,
  SAC_CODES,
  HSN_CODES
} from '../data/gstConstants.js';
import { now, toTimestamp, getPeriodStart, getPeriodEnd } from './dates.js';

/**
 * Generate GSTR-1 Sales/Outward Supply Report
 * @param {Array} orders - Array of orders for the period
 * @param {object} business - Business details (GSTIN, state, etc.)
 * @param {string} period - Period (e.g., "2024-01" for January 2024)
 * @returns {object} GSTR-1 report data
 */
export function generateGSTR1Report(orders, business, period) {
  const startDate = getPeriodStart(period);
  const endDate = getPeriodEnd(period);
  
  // Filter orders for the period
  const periodOrders = orders.filter(order => {
    const orderDate = toTimestamp(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // Convert orders to GST invoices
  const invoices = periodOrders.map(order => createGSTInvoice(order, business));

  // Separate by invoice type
  const b2bInvoices = invoices.filter(inv => inv.invoiceType === INVOICE_TYPES.B2B);
  const b2cLargeInvoices = invoices.filter(inv => inv.invoiceType === INVOICE_TYPES.B2CL);
  const b2cSmallInvoices = invoices.filter(inv => inv.invoiceType === INVOICE_TYPES.B2CS);
  const exportInvoices = invoices.filter(inv => 
    inv.invoiceType === INVOICE_TYPES.EXPORT || inv.invoiceType === INVOICE_TYPES.EXPORT_WOP
  );

  // Group by order source
  const salesBySource = {
    dineIn: invoices.filter(inv => inv.orderSource === 'WALK_IN'),
    takeaway: invoices.filter(inv => inv.orderSource === 'WALK_IN' && inv.notes?.toLowerCase().includes('takeaway')),
    delivery: invoices.filter(inv => inv.orderSource === 'DIRECT_DELIVERY'),
    swiggy: invoices.filter(inv => inv.orderSource === 'SWIGGY'),
    zomato: invoices.filter(inv => inv.orderSource === 'ZOMATO'),
    qrOrdering: invoices.filter(inv => inv.orderSource === 'QR_ORDERING')
  };

  // HSN/SAC summary
  const hsnSacSummary = generateHSNSACSummary(invoices);

  // Debit/Credit notes (cancelled/refunded orders)
  const debitCreditNotes = generateDebitCreditNotes(periodOrders);

  // Advance receipts (for catering/event bookings)
  const advanceReceipts = generateAdvanceReceipts(periodOrders);

  return {
    period,
    businessGSTIN: business.gstin,
    businessState: business.state,
    generatedAt: now(),
    
    // GSTR-1 sections
    [GSTR1_SECTIONS.B2B_INVOICES]: {
      invoices: b2bInvoices,
      totalInvoices: b2bInvoices.length,
      totalTaxableValue: b2bInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalIGST: b2bInvoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCGST: b2bInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: b2bInvoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalCess: b2bInvoices.reduce((sum, inv) => sum + inv.cess, 0)
    },
    
    [GSTR1_SECTIONS.B2C_LARGE]: {
      invoices: b2cLargeInvoices,
      totalInvoices: b2cLargeInvoices.length,
      totalTaxableValue: b2cLargeInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalIGST: b2cLargeInvoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCGST: b2cLargeInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: b2cLargeInvoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalCess: b2cLargeInvoices.reduce((sum, inv) => sum + inv.cess, 0)
    },
    
    [GSTR1_SECTIONS.B2C_SMALL]: {
      invoices: b2cSmallInvoices,
      totalInvoices: b2cSmallInvoices.length,
      totalTaxableValue: b2cSmallInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalIGST: b2cSmallInvoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCGST: b2cSmallInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: b2cSmallInvoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalCess: b2cSmallInvoices.reduce((sum, inv) => sum + inv.cess, 0)
    },
    
    [GSTR1_SECTIONS.EXPORTS]: {
      invoices: exportInvoices,
      totalInvoices: exportInvoices.length,
      totalTaxableValue: exportInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalIGST: exportInvoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCGST: exportInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: exportInvoices.reduce((sum, inv) => sum + inv.sgst, 0)
    },
    
    [GSTR1_SECTIONS.HSN_SUMMARY]: hsnSacSummary,
    
    [GSTR1_SECTIONS.CREDIT_DEBIT_NOTES]: debitCreditNotes,
    
    [GSTR1_SECTIONS.ADVANCE_RECEIPTS]: advanceReceipts,
    
    // Additional breakdown by source
    salesBySource,
    
    // Summary
    summary: {
      totalInvoices: invoices.length,
      totalTaxableValue: invoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalTax: invoices.reduce((sum, inv) => sum + inv.totalTax, 0),
      totalIGST: invoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCGST: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalCess: invoices.reduce((sum, inv) => sum + inv.cess, 0),
      totalTurnover: invoices.reduce((sum, inv) => sum + inv.total, 0)
    }
  };
}

/**
 * Generate HSN/SAC summary for GSTR-1
 * @param {Array} invoices - GST invoices
 * @returns {Array} HSN/SAC summary
 */
function generateHSNSACSummary(invoices) {
  const summary = {};
  
  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      const key = item.hsnSac;
      if (!summary[key]) {
        summary[key] = {
          hsnSac: key,
          description: getHSNSACDescription(key),
          uqc: item.unit,
          totalQuantity: 0,
          totalTaxableValue: 0,
          totalIGST: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalCess: 0
        };
      }
      
      summary[key].totalQuantity += item.quantity;
      summary[key].totalTaxableValue += item.taxableValue;
      summary[key].totalIGST += item.igst;
      summary[key].totalCGST += item.cgst;
      summary[key].totalSGST += item.sgst;
      summary[key].totalCess += item.cess;
    });
  });
  
  return Object.values(summary);
}

/**
 * Get description for HSN/SAC code
 * @param {string} code - HSN/SAC code
 * @returns {string} Description
 */
function getHSNSACDescription(code) {
  const descriptions = {
    '9963': 'Restaurant services',
    '996311': 'Outdoor catering',
    '996312': 'Room service in hotels',
    '0901': 'Coffee',
    '0902': 'Tea',
    '1905': 'Baked goods',
    '2106': 'Food preparations',
    '2202': 'Beverages',
    '2009': 'Fruit juices'
  };
  return descriptions[code] || 'Other';
}

/**
 * Generate debit/credit notes register
 * @param {Array} orders - Orders for the period
 * @returns {Array} Debit/credit notes
 */
function generateDebitCreditNotes(orders) {
  const notes = [];
  
  orders.forEach(order => {
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED' || order.status === 'VOIDED') {
      notes.push({
        invoiceNumber: order.id,
        type: order.status === 'REFUNDED' ? 'CREDIT_NOTE' : 'DEBIT_NOTE',
        date: new Date(order.createdAt).toISOString().split('T')[0],
        customerGSTIN: order.customerGSTIN || null,
        customerName: order.customerName,
        taxableValue: -(order.subtotal - (order.discountAmount || 0)),
        igst: 0,
        cgst: -(order.taxAmount || 0) / 2,
        sgst: -(order.taxAmount || 0) / 2,
        cess: 0,
        reason: order.cancelledReason || order.refundReason || 'Order cancelled'
      });
    }
  });
  
  return notes;
}

/**
 * Generate advance receipts register
 * @param {Array} orders - Orders for the period
 * @returns {Array} Advance receipts
 */
function generateAdvanceReceipts(orders) {
  const receipts = [];
  
  orders.forEach(order => {
    if (order.paymentStatus === 'PAID' && order.status === 'NEW') {
      receipts.push({
        receiptNumber: `ADV-${order.id}`,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        customerName: order.customerName,
        amount: order.total,
        gstin: order.customerGSTIN || null,
        notes: 'Advance payment for order'
      });
    }
  });
  
  return receipts;
}

/**
 * Generate GSTR-3B Tax Summary Report
 * @param {Array} orders - Sales orders for the period
 * @param {Array} purchases - Purchase orders for the period
 * @param {object} business - Business details
 * @param {string} period - Period (e.g., "2024-01")
 * @returns {object} GSTR-3B report data
 */
export function generateGSTR3BReport(orders, purchases, business, period) {
  const startDate = getPeriodStart(period);
  const endDate = getPeriodEnd(period);
  
  // Filter orders for the period
  const periodOrders = orders.filter(order => {
    const orderDate = toTimestamp(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  const periodPurchases = purchases.filter(purchase => {
    const purchaseDate = toTimestamp(purchase.createdAt);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });

  // Convert orders to GST invoices
  const salesInvoices = periodOrders.map(order => createGSTInvoice(order, business));

  // Calculate outward supplies (sales)
  const outwardSupplies = {
    totalTaxableValue: salesInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
    totalIGST: salesInvoices.reduce((sum, inv) => sum + inv.igst, 0),
    totalCGST: salesInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
    totalSGST: salesInvoices.reduce((sum, inv) => sum + inv.sgst, 0),
    totalCess: salesInvoices.reduce((sum, inv) => sum + inv.cess, 0)
  };

  // Calculate inward supplies (purchases) - eligible for ITC
  const inwardSupplies = {
    totalTaxableValue: periodPurchases.reduce((sum, p) => sum + (p.subtotal || 0), 0),
    totalIGST: periodPurchases.reduce((sum, p) => sum + (p.igst || 0), 0),
    totalCGST: periodPurchases.reduce((sum, p) => sum + (p.cgst || 0), 0),
    totalSGST: periodPurchases.reduce((sum, p) => sum + (p.sgst || 0), 0),
    totalCess: periodPurchases.reduce((sum, p) => sum + (p.cess || 0), 0)
  };

  // Calculate ITC available
  const itcAvailable = {
    igst: inwardSupplies.totalIGST,
    cgst: inwardSupplies.totalCGST,
    sgst: inwardSupplies.totalSGST,
    cess: inwardSupplies.totalCess,
    total: inwardSupplies.totalIGST + inwardSupplies.totalCGST + inwardSupplies.totalSGST + inwardSupplies.totalCess
  };

  // Calculate tax payable (outward - ITC)
  const taxPayable = {
    igst: Math.max(0, outwardSupplies.totalIGST - itcAvailable.igst),
    cgst: Math.max(0, outwardSupplies.totalCGST - itcAvailable.cgst),
    sgst: Math.max(0, outwardSupplies.totalSGST - itcAvailable.sgst),
    cess: Math.max(0, outwardSupplies.totalCess - itcAvailable.cess),
    total: Math.max(0, outwardSupplies.totalIGST - itcAvailable.igst) +
           Math.max(0, outwardSupplies.totalCGST - itcAvailable.cgst) +
           Math.max(0, outwardSupplies.totalSGST - itcAvailable.sgst) +
           Math.max(0, outwardSupplies.totalCess - itcAvailable.cess)
  };

  // Reverse charge liability (purchases from unregistered vendors)
  const reverseCharge = periodPurchases.filter(p => !p.supplierGSTIN).reduce((sum, p) => {
    return sum + (p.taxAmount || 0);
  }, 0);

  return {
    period,
    businessGSTIN: business.gstin,
    businessState: business.state,
    generatedAt: now(),
    
    // Part I: Details of outward supplies
    outwardSupplies,
    
    // Part II: Details of inward supplies liable to reverse charge
    reverseChargeLiability: reverseCharge,
    
    // Part III: Details of ITC
    itcAvailable,
    
    // Part IV: Tax payable
    taxPayable,
    
    // Tax payment challan log (would be populated from actual payments)
    taxPayments: [],
    
    // Interest and late fee (if any)
    interest: 0,
    lateFee: 0,
    
    // Summary
    summary: {
      totalTaxPayable: taxPayable.total + reverseCharge,
      totalTaxPaid: 0,
      balancePayable: taxPayable.total + reverseCharge
    }
  };
}

/**
 * Generate GSTR-9 Annual Return Support
 * @param {Array} gstr1Reports - Array of monthly GSTR-1 reports
 * @param {Array} gstr3bReports - Array of monthly GSTR-3B reports
 * @param {object} business - Business details
 * @param {string} financialYear - Financial year (e.g., "2024-25")
 * @returns {object} GSTR-9 report data
 */
export function generateGSTR9Report(gstr1Reports, gstr3bReports, business, financialYear) {
  // Aggregate monthly data
  const annualGSTR1 = gstr1Reports.reduce((acc, report) => {
    acc.totalTaxableValue += report.summary.totalTaxableValue;
    acc.totalIGST += report.summary.totalIGST;
    acc.totalCGST += report.summary.totalCGST;
    acc.totalSGST += report.summary.totalSGST;
    acc.totalCess += report.summary.totalCess;
    acc.totalTurnover += report.summary.totalTurnover;
    return acc;
  }, { totalTaxableValue: 0, totalIGST: 0, totalCGST: 0, totalSGST: 0, totalCess: 0, totalTurnover: 0 });

  const annualGSTR3B = gstr3bReports.reduce((acc, report) => {
    acc.totalTaxPayable += report.taxPayable.total;
    acc.totalITC += report.itcAvailable.total;
    acc.totalTaxPaid += report.summary.totalTaxPaid || 0;
    return acc;
  }, { totalTaxPayable: 0, totalITC: 0, totalTaxPaid: 0 });

  // Aggregate HSN/SAC summary
  const annualHSNSAC = aggregateAnnualHSNSAC(gstr1Reports);

  // Reconciliation between GSTR-1, GSTR-3B, and books
  const reconciliation = {
    gstr1Turnover: annualGSTR1.totalTurnover,
    gstr3bTurnover: annualGSTR1.totalTaxableValue,
    booksTurnover: annualGSTR1.totalTurnover, // Would come from actual books
    difference: 0,
    notes: []
  };

  return {
    financialYear,
    businessGSTIN: business.gstin,
    businessState: business.state,
    generatedAt: now(),
    
    // Part I: Basic details
    basicDetails: {
      legalName: business.name,
      tradeName: business.tradeName,
      gstin: business.gstin,
      financialYear
    },
    
    // Part II: Turnover based on GSTR-1
    gstr1Turnover: annualGSTR1,
    
    // Part III: Turnover based on GSTR-3B
    gstr3bTurnover: annualGSTR3B,
    
    // Part IV: HSN/SAC wise annual summary
    hsnSacSummary: annualHSNSAC,
    
    // Part V: Reconciliation
    reconciliation,
    
    // Summary
    summary: {
      totalAnnualTurnover: annualGSTR1.totalTurnover,
      totalTaxPaid: annualGSTR3B.totalTaxPaid,
      totalITCClaimed: annualGSTR3B.totalITC,
      netTaxLiability: annualGSTR3B.totalTaxPayable
    }
  };
}

/**
 * Aggregate annual HSN/SAC summary from monthly reports
 * @param {Array} gstr1Reports - Monthly GSTR-1 reports
 * @returns {Array} Annual HSN/SAC summary
 */
function aggregateAnnualHSNSAC(gstr1Reports) {
  const annualSummary = {};
  
  gstr1Reports.forEach(report => {
    report[GSTR1_SECTIONS.HSN_SUMMARY].forEach(item => {
      const key = item.hsnSac;
      if (!annualSummary[key]) {
        annualSummary[key] = {
          hsnSac: key,
          description: item.description,
          uqc: item.uqc,
          totalQuantity: 0,
          totalTaxableValue: 0,
          totalIGST: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalCess: 0
        };
      }
      
      annualSummary[key].totalQuantity += item.totalQuantity;
      annualSummary[key].totalTaxableValue += item.totalTaxableValue;
      annualSummary[key].totalIGST += item.totalIGST;
      annualSummary[key].totalCGST += item.totalCGST;
      annualSummary[key].totalSGST += item.totalSGST;
      annualSummary[key].totalCess += item.totalCess;
    });
  });
  
  return Object.values(annualSummary);
}

/**
 * Generate E-invoice/IRN report
 * @param {Array} invoices - GST invoices
 * @param {number} turnoverThreshold - Turnover threshold for e-invoicing (default ₹5Cr)
 * @returns {object} E-invoice report
 */
export function generateEInvoiceReport(invoices, turnoverThreshold = 50000000) {
  const totalTurnover = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const requiresEInvoice = totalTurnover >= turnoverThreshold;
  
  const report = {
    requiresEInvoice,
    turnoverThreshold,
    currentTurnover: totalTurnover,
    totalInvoices: invoices.length,
    
    generated: invoices.filter(inv => inv.irn && inv.irnStatus === 'GENERATED'),
    pending: invoices.filter(inv => !inv.irn || inv.irnStatus === 'PENDING'),
    failed: invoices.filter(inv => inv.irnStatus === 'FAILED'),
    cancelled: invoices.filter(inv => inv.irnStatus === 'CANCELLED')
  };
  
  report.summary = {
    generated: report.generated.length,
    pending: report.pending.length,
    failed: report.failed.length,
    cancelled: report.cancelled.length,
    successRate: report.generated.length / invoices.length
  };
  
  return report;
}

/**
 * Generate discount/complimentary item tax treatment report
 * @param {Array} orders - Orders for the period
 * @returns {object} Discount analysis report
 */
export function generateDiscountAnalysisReport(orders) {
  const report = {
    totalOrders: orders.length,
    ordersWithDiscount: orders.filter(o => o.discountAmount > 0),
    totalDiscountAmount: orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0),
    totalMRPValue: orders.reduce((sum, o) => sum + o.subtotal, 0),
    totalTaxableValue: orders.reduce((sum, o) => sum + (o.subtotal - (o.discountAmount || 0)), 0),
    taxSavingsFromDiscount: 0
  };
  
  // Calculate tax savings (tax would have been paid on full MRP without discount)
  const avgTaxRate = 0.05; // Assuming 5% GST for restaurants
  report.taxSavingsFromDiscount = report.totalDiscountAmount * avgTaxRate;
  
  // Breakdown by discount type
  report.discountBreakdown = orders.reduce((acc, order) => {
    if (order.discountCode) {
      acc[order.discountCode] = (acc[order.discountCode] || 0) + order.discountAmount;
    }
    return acc;
  }, {});
  
  return report;
}

/**
 * Generate service charge vs GST separation report
 * @param {Array} orders - Orders for the period
 * @returns {object} Service charge report
 */
export function generateServiceChargeReport(orders) {
  const report = {
    totalOrders: orders.length,
    ordersWithServiceCharge: orders.filter(o => o.serviceCharge > 0),
    totalServiceCharge: orders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0),
    totalGST: orders.reduce((sum, o) => sum + (o.taxAmount || 0), 0),
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
  };
  
  // Service charge should NOT be taxed
  report.correctlySeparated = orders.every(o => {
    if (o.serviceCharge > 0) {
      // Service charge should be added after tax calculation
      return o.total === o.subtotal + o.taxAmount + o.serviceCharge - (o.discountAmount || 0);
    }
    return true;
  });
  
  return report;
}

/**
 * Generate multi-outlet/state-wise GSTIN split report
 * @param {Array} orders - Orders from all outlets
 * @param {Array} branches - Branch details with GSTINs
 * @returns {Array} Report by branch/GSTIN
 */
export function generateMultiOutletReport(orders, branches) {
  const branchReports = {};
  
  branches.forEach(branch => {
    const branchOrders = orders.filter(o => o.branchId === branch.id);
    const branchInvoices = branchOrders.map(o => createGSTInvoice(o, branch));
    
    branchReports[branch.gstin] = {
      branchId: branch.id,
      branchName: branch.name,
      gstin: branch.gstin,
      state: branch.state,
      totalOrders: branchOrders.length,
      totalTurnover: branchInvoices.reduce((sum, inv) => sum + inv.total, 0),
      totalTaxableValue: branchInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
      totalCGST: branchInvoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: branchInvoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalIGST: branchInvoices.reduce((sum, inv) => sum + inv.igst, 0)
    };
  });
  
  return Object.values(branchReports);
}

/**
 * Generate vendor GSTIN validation log
 * @param {Array} vendors - Vendor list
 * @returns {Array} Validation results
 */
export function generateVendorValidationLog(vendors) {
  return vendors.map(vendor => ({
    vendorId: vendor.id,
    vendorName: vendor.name,
    gstin: vendor.gstin,
    isValidFormat: vendor.gstin ? /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(vendor.gstin) : false,
    isRegistered: vendor.isRegistered || false,
    registrationStatus: vendor.registrationStatus || 'UNKNOWN',
    lastChecked: vendor.lastChecked || null,
    lastFilingPeriod: vendor.lastFilingPeriod || null,
    itcEligible: vendor.isRegistered && vendor.registrationStatus === 'ACTIVE'
  }));
}

/**
 * Generate turnover threshold tracker
 * @param {Array} orders - Orders for the financial year
 * @param {string} financialYear - Financial year
 * @returns {object} Turnover tracker
 */
export function generateTurnoverTracker(orders, financialYear) {
  const currentTurnover = orders.reduce((sum, o) => sum + o.total, 0);
  
  return {
    financialYear,
    currentTurnover,
    registrationThreshold: 4000000,
    compositionThreshold: 15000000,
    einvoiceThreshold: 50000000,
    
    // Alerts
    nearRegistrationLimit: currentTurnover >= 3500000,
    nearCompositionLimit: currentTurnover >= 13000000,
    nearEinvoiceLimit: currentTurnover >= 45000000,
    
    // Percentages
    registrationPercentage: (currentTurnover / 4000000) * 100,
    compositionPercentage: (currentTurnover / 15000000) * 100,
    einvoicePercentage: (currentTurnover / 50000000) * 100,
    
    // Recommendations
    recommendations: []
  };
}

/**
 * Generate invoice sequence/gap report
 * @param {Array} invoices - Invoices for the period
 * @param {string} period - Period
 * @returns {object} Gap report
 */
export function generateInvoiceSequenceReport(invoices, period) {
  // Extract invoice numbers and sort
  const invoiceNumbers = invoices
    .map(inv => parseInt(inv.invoiceNumber.split('-').pop()))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  const gaps = [];
  const duplicates = [];
  
  // Check for gaps
  for (let i = 1; i < invoiceNumbers.length; i++) {
    const expected = invoiceNumbers[i - 1] + 1;
    const actual = invoiceNumbers[i];
    
    if (actual > expected) {
      for (let j = expected; j < actual; j++) {
        gaps.push({
          expectedNumber: j,
          actualNumber: null,
          gapType: 'MISSING',
          status: 'OPEN'
        });
      }
    }
  }
  
  // Check for duplicates
  const seen = new Set();
  invoiceNumbers.forEach(num => {
    if (seen.has(num)) {
      duplicates.push({
        expectedNumber: num,
        actualNumber: num,
        gapType: 'DUPLICATE',
        status: 'OPEN'
      });
    }
    seen.add(num);
  });
  
  return {
    period,
    totalInvoices: invoices.length,
    gapsFound: gaps.length,
    duplicatesFound: duplicates.length,
    gaps,
    duplicates,
    hasIssues: gaps.length > 0 || duplicates.length > 0
  };
}

/**
 * Generate amendment/rate-change log
 * @param {Array} amendments - Amendment records
 * @param {string} period - Period
 * @returns {object} Amendment log
 */
export function generateAmendmentLog(amendments, period) {
  const periodAmendments = amendments.filter(a => {
    const amendmentDate = new Date(a.amendedAt);
    return amendmentDate.getMonth() + 1 === parseInt(period.split('-')[1]) &&
           amendmentDate.getFullYear() === parseInt(period.split('-')[0]);
  });
  
  return {
    period,
    totalAmendments: periodAmendments.length,
    byType: periodAmendments.reduce((acc, a) => {
      acc[a.amendmentType] = (acc[a.amendmentType] || 0) + 1;
      return acc;
    }, {}),
    amendments: periodAmendments
  };
}
