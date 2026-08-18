// Export Utilities for Analytics & Reports
// Handles CSV, XLSX, PDF, and print exports with proper formatting

import { formatDate } from './dateRangeUtils.js';

// CSV Export Utilities

/**
 * Escape CSV field value according to RFC 4180
 */
const escapeCSVField = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Convert data array to CSV string
 */
export const arrayToCSV = (headers, data) => {
  if (!Array.isArray(headers) || !Array.isArray(data)) return '';
  
  // Header row
  let csv = `${headers.map(escapeCSVField).join(',')  }\n`;
  
  // Data rows
  data.forEach(row => {
    if (!row) return;
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSVField(value);
    });
    csv += `${values.join(',')  }\n`;
  });
  
  return csv;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate CSV filename with date range
 */
export const generateCSVFilename = (reportName, dateRange) => {
  const startDate = formatDate(dateRange?.start, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const endDate = formatDate(dateRange?.end, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  return `CafeOS-${reportName}-${startDate}-to-${endDate}-${timestamp}.csv`;
};

// XLSX Export Utilities (Basic implementation - would need xlsx library for full support)

/**
 * Convert data to XLSX-compatible format
 * Note: Full XLSX support requires a library like xlsx or sheetjs
 * This is a basic implementation that creates a tab-separated values file
 * which can be opened in Excel as a fallback
 */
export const arrayToXLSX = (headers, data) => {
  if (!Array.isArray(headers) || !Array.isArray(data)) return '';
  
  // Header row
  let xlsx = `${headers.join('\t')  }\n`;
  
  // Data rows
  data.forEach(row => {
    if (!row) return;
    const values = headers.map(header => {
      const value = row[header];
      return value === null || value === undefined ? '' : String(value);
    });
    xlsx += `${values.join('\t')  }\n`;
  });
  
  return xlsx;
};

/**
 * Download XLSX file (TSV fallback)
 */
export const downloadXLSX = (xlsxContent, filename) => {
  const blob = new Blob([xlsxContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate XLSX filename
 */
export const generateXLSXFilename = (reportName, dateRange) => {
  const startDate = formatDate(dateRange?.start, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const endDate = formatDate(dateRange?.end, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  return `CafeOS-${reportName}-${startDate}-to-${endDate}-${timestamp}.xlsx`;
};

// PDF Export Utilities (Basic implementation - would need jsPDF or similar library)

/**
 * Generate HTML content for PDF export
 */
export const generatePDFHTML = (title, dateRange, data, businessDetails = null) => {
  const businessName = businessDetails?.name || 'CafeOS';
  const businessAddress = businessDetails?.address || '';
  const businessPhone = businessDetails?.phone || '';
  const businessGST = businessDetails?.gstNumber || '';
  const businessFSSAI = businessDetails?.fssaiNumber || '';
  
  const startDate = formatDate(dateRange?.start, 'long');
  const endDate = formatDate(dateRange?.end, 'long');
  const generatedDate = formatDate(new Date(), 'datetime');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .business-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .business-details {
      font-size: 11px;
      color: #666;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0 10px;
    }
    .report-meta {
      font-size: 11px;
      color: #666;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .numeric {
      text-align: right;
    }
    .totals {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .header { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${businessName}</div>
    <div class="business-details">
      ${businessAddress ? `${businessAddress}<br>` : ''}
      ${businessPhone ? `Phone: ${businessPhone}<br>` : ''}
      ${businessGST ? `GST: ${businessGST}<br>` : ''}
      ${businessFSSAI ? `FSSAI: ${businessFSSAI}` : ''}
    </div>
  </div>
  
  <div class="report-title">${title}</div>
  <div class="report-meta">
    Period: ${startDate} to ${endDate}<br>
    Generated: ${generatedDate}
  </div>
  
  ${data}
  
  <div class="footer">
    Generated by CafeOS Analytics & Reports<br>
    This is an operational summary — verify with your accountant before filing.
  </div>
</body>
</html>
  `;
};

/**
 * Download PDF file (requires print-to-PDF or library)
 */
export const downloadPDF = (htmlContent) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

/**
 * Generate PDF filename
 */
export const generatePDFFilename = (reportName, dateRange) => {
  const startDate = formatDate(dateRange?.start, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const endDate = formatDate(dateRange?.end, 'short').replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  return `CafeOS-${reportName}-${startDate}-to-${endDate}-${timestamp}.pdf`;
};

// Print Utilities

/**
 * Print report with proper styling
 */
export const printReport = (title, dateRange, data, businessDetails = null) => {
  const htmlContent = generatePDFHTML(title, dateRange, data, businessDetails);
  downloadPDF(htmlContent, generatePDFFilename(title, dateRange));
};

/**
 * Add print-specific CSS to document
 */
export const addPrintStyles = () => {
  if (document.getElementById('cafeos-print-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'cafeos-print-styles';
  style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      .cafeos-print-area, .cafeos-print-area * {
        visibility: visible;
      }
      .cafeos-print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      @page {
        margin: 1cm;
      }
    }
  `;
  document.head.appendChild(style);
};

// Report-Specific Export Functions

/**
 * Export sales report to CSV
 */
export const exportSalesReportCSV = (kpis, channels, dateRange, format = 'csv') => {
  const headers = ['Metric', 'Value', 'Change', 'Context'];
  const data = [
    { Metric: 'Gross Sales', Value: kpis.sales.grossSales, Change: '', Context: 'Before refunds/discounts' },
    { Metric: 'Net Sales', Value: kpis.sales.netSales, Change: '', Context: 'After refunds/discounts' },
    { Metric: 'Tax Collected', Value: kpis.sales.taxCollected, Change: '', Context: 'Recorded tax' },
    { Metric: 'Total Collected', Value: kpis.sales.totalCollected, Change: '', Context: 'Successful payments' },
    { Metric: 'Outstanding', Value: kpis.sales.outstanding, Change: '', Context: 'Unpaid balance' },
    { Metric: 'Refunds', Value: kpis.sales.refunds, Change: '', Context: 'Total refunds' },
    { Metric: 'Average Order Value', Value: kpis.sales.averageOrderValue, Change: '', Context: 'Per order' },
  ];
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Sales-Report', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Sales-Report', dateRange));
  }
};

/**
 * Export channel performance to CSV/XLSX
 */
export const exportChannelReportCSV = (channels, dateRange, format = 'csv') => {
  const headers = ['Channel', 'Orders', 'Gross Sales', 'Revenue Share', 'Average Order Value', 'Net Sales'];
  const data = channels.map(ch => ({
    Channel: ch.name,
    Orders: ch.orders,
    'Gross Sales': ch.grossSales,
    'Revenue Share': `${ch.revenueShare.toFixed(1)}%`,
    'Average Order Value': ch.averageOrderValue.toFixed(2),
    'Net Sales': ch.netSales.toFixed(2)
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Channel-Report', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Channel-Report', dateRange));
  }
};

/**
 * Export menu performance to CSV/XLSX
 */
export const exportMenuReportCSV = (items, dateRange, format = 'csv') => {
  const headers = ['Item', 'Category', 'Quantity Sold', 'Gross Sales', 'Average Price', 'Estimated Cost', 'Estimated Gross Profit', 'Estimated Margin'];
  const data = items.map(item => ({
    Item: item.name,
    Category: item.category,
    'Quantity Sold': item.quantitySold,
    'Gross Sales': item.grossSales.toFixed(2),
    'Average Price': item.averagePrice.toFixed(2),
    'Estimated Cost': item.estimatedCost !== null ? item.estimatedCost.toFixed(2) : 'N/A',
    'Estimated Gross Profit': item.estimatedGrossProfit !== null ? item.estimatedGrossProfit.toFixed(2) : 'N/A',
    'Estimated Margin': item.estimatedMargin !== null ? `${item.estimatedMargin.toFixed(1)}%` : 'N/A'
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Menu-Performance', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Menu-Performance', dateRange));
  }
};

/**
 * Export order report to CSV/XLSX
 */
export const exportOrderReportCSV = (orders, dateRange, format = 'csv') => {
  const headers = ['Order ID', 'Date', 'Customer', 'Source', 'Status', 'Amount', 'Payment Method', 'Payment Status'];
  const data = orders.map(order => ({
    'Order ID': order.id,
    Date: formatDate(order.createdAt, 'short'),
    Customer: order.customer?.name || order.customerName || 'Guest',
    Source: order.source,
    Status: order.status,
    Amount: order.total || order.amount,
    'Payment Method': order.paymentMethod,
    'Payment Status': order.payStatus
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Order-Report', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Order-Report', dateRange));
  }
};

/**
 * Export customer report to CSV/XLSX
 */
export const exportCustomerReportCSV = (customers, dateRange, format = 'csv') => {
  const headers = ['Customer', 'Phone', 'Order Count', 'Total Spend', 'Average Order Value', 'Last Order Date'];
  const data = customers.map(customer => ({
    Customer: customer.name,
    Phone: customer.phone,
    'Order Count': customer.orderCount,
    'Total Spend': customer.totalSpend.toFixed(2),
    'Average Order Value': customer.averageOrderValue.toFixed(2),
    'Last Order Date': formatDate(customer.lastOrderDate, 'short')
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Customer-Report', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Customer-Report', dateRange));
  }
};

/**
 * Export payment method report to CSV/XLSX
 */
export const exportPaymentReportCSV = (payments, dateRange, format = 'csv') => {
  const headers = ['Payment Method', 'Transaction Count', 'Amount Collected', 'Share', 'Refunds', 'Net Collected'];
  const data = payments.map(payment => ({
    'Payment Method': payment.name,
    'Transaction Count': payment.transactionCount,
    'Amount Collected': payment.amountCollected.toFixed(2),
    Share: `${payment.share.toFixed(1)}%`,
    Refunds: payment.refunds.toFixed(2),
    'Net Collected': payment.netCollected.toFixed(2)
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Payment-Report', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Payment-Report', dateRange));
  }
};

/**
 * Export staff performance to CSV/XLSX
 */
export const exportStaffReportCSV = (staff, dateRange, format = 'csv') => {
  const headers = ['Staff Name', 'Orders Handled', 'Sales Processed', 'Average Order Value', 'Refunds Processed', 'Voids Processed'];
  const data = staff.map(s => ({
    'Staff Name': s.staffName,
    'Orders Handled': s.ordersHandled,
    'Sales Processed': s.salesProcessed.toFixed(2),
    'Average Order Value': s.averageOrderValue.toFixed(2),
    'Refunds Processed': s.refundsProcessed,
    'Voids Processed': s.voidsProcessed
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Staff-Performance', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Staff-Performance', dateRange));
  }
};

/**
 * Export category performance to CSV/XLSX
 */
export const exportCategoryReportCSV = (categories, dateRange, format = 'csv') => {
  const headers = ['Category', 'Quantity Sold', 'Gross Sales', 'Order Share', 'Average Price', 'Estimated Gross Profit', 'Estimated Margin'];
  const data = categories.map(cat => ({
    Category: cat.category,
    'Quantity Sold': cat.quantitySold,
    'Gross Sales': cat.grossSales.toFixed(2),
    'Order Share': `${cat.orderShare.toFixed(1)}%`,
    'Average Price': cat.averagePrice.toFixed(2),
    'Estimated Gross Profit': cat.estimatedGrossProfit !== null ? cat.estimatedGrossProfit.toFixed(2) : 'N/A',
    'Estimated Margin': cat.estimatedMargin !== null ? `${cat.estimatedMargin.toFixed(1)}%` : 'N/A'
  }));
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename('Category-Performance', dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename('Category-Performance', dateRange));
  }
};

/**
 * Generic export function for any tabular data
 */
export const exportGenericCSV = (data, filename, dateRange, format = 'csv') => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(headers, data);
    downloadXLSX(xlsx, generateXLSXFilename(filename, dateRange));
  } else {
    const csv = arrayToCSV(headers, data);
    downloadCSV(csv, generateCSVFilename(filename, dateRange));
  }
};

/**
 * Export comparison report to CSV
 */
export const exportComparisonReportCSV = (currentKPIs, previousKPIs, comparison, dateRange) => {
  const headers = ['Metric', 'Current Value', 'Previous Value', 'Absolute Change', 'Percentage Change', 'Direction'];
  const data = [
    { 
      Metric: 'Gross Sales', 
      'Current Value': currentKPIs.sales.grossSales, 
      'Previous Value': previousKPIs.sales.grossSales, 
      'Absolute Change': comparison.grossSales?.value || 'N/A', 
      'Percentage Change': comparison.grossSales?.percentage ? `${comparison.grossSales.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.grossSales?.direction || 'N/A'
    },
    { 
      Metric: 'Net Sales', 
      'Current Value': currentKPIs.sales.netSales, 
      'Previous Value': previousKPIs.sales.netSales, 
      'Absolute Change': comparison.netSales?.value || 'N/A', 
      'Percentage Change': comparison.netSales?.percentage ? `${comparison.netSales.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.netSales?.direction || 'N/A'
    },
    { 
      Metric: 'Orders', 
      'Current Value': currentKPIs.orders.total, 
      'Previous Value': previousKPIs.orders.total, 
      'Absolute Change': comparison.orders?.value || 'N/A', 
      'Percentage Change': comparison.orders?.percentage ? `${comparison.orders.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.orders?.direction || 'N/A'
    },
    { 
      Metric: 'Average Order Value', 
      'Current Value': currentKPIs.sales.averageOrderValue, 
      'Previous Value': previousKPIs.sales.averageOrderValue, 
      'Absolute Change': comparison.averageOrderValue?.value || 'N/A', 
      'Percentage Change': comparison.averageOrderValue?.percentage ? `${comparison.averageOrderValue.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.averageOrderValue?.direction || 'N/A'
    },
    { 
      Metric: 'Refunds', 
      'Current Value': currentKPIs.sales.refunds, 
      'Previous Value': previousKPIs.sales.refunds, 
      'Absolute Change': comparison.refunds?.value || 'N/A', 
      'Percentage Change': comparison.refunds?.percentage ? `${comparison.refunds.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.refunds?.direction || 'N/A'
    },
    { 
      Metric: 'Completion Rate', 
      'Current Value': `${currentKPIs.orders.completionRate.toFixed(1)}%`, 
      'Previous Value': `${previousKPIs.orders.completionRate.toFixed(1)}%`, 
      'Absolute Change': comparison.completionRate?.value ? `${comparison.completionRate.value.toFixed(1)}%` : 'N/A', 
      'Percentage Change': comparison.completionRate?.percentage ? `${comparison.completionRate.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.completionRate?.direction || 'N/A'
    },
    { 
      Metric: 'Cancellation Rate', 
      'Current Value': `${currentKPIs.orders.cancellationRate.toFixed(1)}%`, 
      'Previous Value': `${previousKPIs.orders.cancellationRate.toFixed(1)}%`, 
      'Absolute Change': comparison.cancellationRate?.value ? `${comparison.cancellationRate.value.toFixed(1)}%` : 'N/A', 
      'Percentage Change': comparison.cancellationRate?.percentage ? `${comparison.cancellationRate.percentage.toFixed(1)}%` : 'N/A', 
      Direction: comparison.cancellationRate?.direction || 'N/A'
    }
  ];
  
  const csv = arrayToCSV(headers, data);
  downloadCSV(csv, generateCSVFilename('Comparison-Report', dateRange));
};

/**
 * Export full analytics report to CSV/XLSX (all sections)
 */
export const exportFullAnalyticsCSV = (reportData, dateRange, format = 'csv') => {
  const sections = [];
  
  // KPIs section
  sections.push('=== KEY PERFORMANCE INDICATORS ===');
  sections.push(arrayToCSV(['Metric', 'Value'], [
    { Metric: 'Gross Sales', Value: reportData.kpis.sales.grossSales },
    { Metric: 'Net Sales', Value: reportData.kpis.sales.netSales },
    { Metric: 'Tax Collected', Value: reportData.kpis.sales.taxCollected },
    { Metric: 'Total Collected', Value: reportData.kpis.sales.totalCollected },
    { Metric: 'Outstanding', Value: reportData.kpis.sales.outstanding },
    { Metric: 'Refunds', Value: reportData.kpis.sales.refunds },
    { Metric: 'Average Order Value', Value: reportData.kpis.sales.averageOrderValue },
    { Metric: 'Total Orders', Value: reportData.kpis.orders.total },
    { Metric: 'Completed Orders', Value: reportData.kpis.orders.completed },
    { Metric: 'Cancelled Orders', Value: reportData.kpis.orders.cancelled },
    { Metric: 'Completion Rate', Value: `${reportData.kpis.orders.completionRate.toFixed(1)}%` },
    { Metric: 'Cancellation Rate', Value: `${reportData.kpis.orders.cancellationRate.toFixed(1)}%` }
  ]));
  
  // Channel performance section
  sections.push('\n=== CHANNEL PERFORMANCE ===');
  const channelHeaders = ['Channel', 'Orders', 'Gross Sales', 'Revenue Share', 'Average Order Value', 'Net Sales'];
  const channelData = reportData.channels.map(ch => ({
    Channel: ch.name,
    Orders: ch.orders,
    'Gross Sales': ch.grossSales,
    'Revenue Share': `${ch.revenueShare.toFixed(1)}%`,
    'Average Order Value': ch.averageOrderValue.toFixed(2),
    'Net Sales': ch.netSales.toFixed(2)
  }));
  sections.push(arrayToCSV(channelHeaders, channelData));
  
  // Menu performance section
  sections.push('\n=== MENU PERFORMANCE ===');
  const menuHeaders = ['Item', 'Category', 'Quantity Sold', 'Gross Sales', 'Average Price', 'Estimated Cost', 'Estimated Gross Profit', 'Estimated Margin'];
  const menuData = reportData.menuItems.map(item => ({
    Item: item.name,
    Category: item.category,
    'Quantity Sold': item.quantitySold,
    'Gross Sales': item.grossSales.toFixed(2),
    'Average Price': item.averagePrice.toFixed(2),
    'Estimated Cost': item.estimatedCost !== null ? item.estimatedCost.toFixed(2) : 'N/A',
    'Estimated Gross Profit': item.estimatedGrossProfit !== null ? item.estimatedGrossProfit.toFixed(2) : 'N/A',
    'Estimated Margin': item.estimatedMargin !== null ? `${item.estimatedMargin.toFixed(1)}%` : 'N/A'
  }));
  sections.push(arrayToCSV(menuHeaders, menuData));
  
  // Payment methods section
  sections.push('\n=== PAYMENT METHODS ===');
  const paymentHeaders = ['Payment Method', 'Transaction Count', 'Amount Collected', 'Share', 'Refunds', 'Net Collected'];
  const paymentData = reportData.payments.map(payment => ({
    'Payment Method': payment.name,
    'Transaction Count': payment.transactionCount,
    'Amount Collected': payment.amountCollected.toFixed(2),
    Share: `${payment.share.toFixed(1)}%`,
    Refunds: payment.refunds.toFixed(2),
    'Net Collected': payment.netCollected.toFixed(2)
  }));
  sections.push(arrayToCSV(paymentHeaders, paymentData));
  
  const content = sections.join('\n');
  
  if (format === 'xlsx') {
    const xlsx = arrayToXLSX(['Section', 'Content'], [{ Section: 'Full Analytics Report', Content: content }]);
    downloadXLSX(xlsx, generateXLSXFilename('Full-Analytics-Report', dateRange));
  } else {
    downloadCSV(content, generateCSVFilename('Full-Analytics-Report', dateRange));
  }
};

export default {
  // CSV utilities
  escapeCSVField,
  arrayToCSV,
  downloadCSV,
  generateCSVFilename,
  
  // XLSX utilities
  arrayToXLSX,
  downloadXLSX,
  generateXLSXFilename,
  
  // PDF utilities
  generatePDFHTML,
  downloadPDF,
  generatePDFFilename,
  
  // Print utilities
  printReport,
  addPrintStyles,
  
  // Report-specific exports
  exportSalesReportCSV,
  exportChannelReportCSV,
  exportMenuReportCSV,
  exportOrderReportCSV,
  exportCustomerReportCSV,
  exportPaymentReportCSV,
  exportStaffReportCSV,
  exportCategoryReportCSV,
  exportGenericCSV,
  exportComparisonReportCSV,
  exportFullAnalyticsCSV
};
