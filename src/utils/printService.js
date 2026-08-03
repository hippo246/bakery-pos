// Print service for generating thermal and A4 document layouts

import { BUSINESS_DETAILS, formatDocumentCurrency, formatDocumentDate, formatDocumentDateTime, formatDocumentTime } from '../data/documentConstants.js';

/**
 * Get printer settings from localStorage
 */
function getPrinterSettings() {
  try {
    const settings = localStorage.getItem('brewcrm_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        printerName: parsed.printerName || '',
        printerType: parsed.printerType || 'thermal',
        paperWidth: parsed.paperWidth || 80,
        copies: parsed.copies || 1,
        autoCut: parsed.autoCut || false,
        cashDrawer: parsed.cashDrawer || false
      };
    }
  } catch (e) {
    console.warn('Failed to load printer settings:', e);
  }
  return {
    printerName: '',
    printerType: 'thermal',
    paperWidth: 80,
    copies: 1,
    autoCut: false,
    cashDrawer: false
  };
}

/**
 * Generate thermal receipt HTML (58mm or 80mm)
 */
export function generateThermalReceiptHTML(document, width = '58mm') {
  const is58mm = width === '58mm';
  const charsPerLine = is58mm ? 32 : 48;
  const fontSize = is58mm ? '10px' : '12px';
  const maxWidth = is58mm ? '58mm' : '80mm';
  
  const docType = document.receiptNumber ? 'RECEIPT' : document.invoiceNumber ? 'INVOICE' : document.paymentReceiptNumber ? 'PAYMENT_RECEIPT' : 'CREDIT_NOTE';
  const docNumber = document.receiptNumber || document.invoiceNumber || document.paymentReceiptNumber || document.creditNoteNumber;
  const docLabel = docType === 'RECEIPT' ? 'SALES RECEIPT' : docType === 'INVOICE' ? 'INVOICE' : docType === 'PAYMENT_RECEIPT' ? 'PAYMENT RECEIPT' : 'CREDIT NOTE';
  
  // Truncate text to fit width
  const truncate = (text, maxLen) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
  };
  
  // Right align text
  const right = (text) => {
    const padding = Math.max(0, charsPerLine - text.length);
    return ' '.repeat(padding) + text;
  };
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docLabel} - ${docNumber}</title>
  <style>
    @page {
      size: ${maxWidth} auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      margin: 0;
      padding: 2mm;
      width: ${maxWidth};
      white-space: pre;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .bold { font-weight: bold; }
    .header { font-size: ${is58mm ? '11px' : '14px'}; font-weight: bold; }
    .total { font-size: ${is58mm ? '12px' : '16px'}; font-weight: bold; }
  </style>
</head>
<body>
`;

  // Header
  html += `<div class="center header">${truncate(BUSINESS_DETAILS.tradingName, charsPerLine)}</div>\n`;
  html += `<div class="center">${truncate(BUSINESS_DETAILS.address, charsPerLine)}</div>\n`;
  html += `<div class="center">Ph: ${BUSINESS_DETAILS.phone}</div>\n`;
  html += `<div class="divider"></div>\n`;
  
  // Document info
  html += `<div class="center bold">${docLabel}</div>\n`;
  html += `<div class="center">${docNumber}</div>\n`;
  html += `<div class="center">${formatDocumentDateTime(document.issuedAt || document.createdAt)}</div>\n`;
  html += `<div class="divider"></div>\n`;
  
  // Customer info
  if (document.customerName) {
    html += `<div>${truncate('Customer: ' + document.customerName, charsPerLine)}</div>\n`;
  }
  if (document.customerPhone) {
    html += `<div>${truncate('Phone: ' + document.customerPhone, charsPerLine)}</div>\n`;
  }
  if (document.orderId) {
    html += `<div>Order: ${document.orderId}</div>\n`;
  }
  if (document.tableId) {
    html += `<div>Table: ${document.tableId}</div>\n`;
  }
  if (document.staffName) {
    html += `<div>Waiter: ${document.staffName}</div>\n`;
  }
  html += `<div class="divider"></div>\n`;
  
  // Items
  html += `<div class="bold">ITEMS</div>\n`;
  (document.items || []).forEach(item => {
    const name = truncate(item.name, charsPerLine - 12);
    const qty = item.quantity;
    const price = formatDocumentCurrency(item.unitPrice);
    const total = formatDocumentCurrency(item.lineTotal);
    
    html += `<div>${name}</div>\n`;
    html += `<div>${qty} x ${price} ${right(total)}</div>\n`;
  });
  html += `<div class="divider"></div>\n`;
  
  // Totals
  html += `<div>${right('Subtotal: ' + formatDocumentCurrency(document.subtotal))}</div>\n`;
  if (document.discountAmount > 0) {
    html += `<div>${right('Discount: -' + formatDocumentCurrency(document.discountAmount))}</div>\n`;
  }
  if (document.taxAmount > 0) {
    html += `<div>${right('GST: ' + formatDocumentCurrency(document.taxAmount))}</div>\n`;
  }
  if (document.serviceCharge > 0) {
    html += `<div>${right('Service: ' + formatDocumentCurrency(document.serviceCharge))}</div>\n`;
  }
  if (document.deliveryCharge > 0) {
    html += `<div>${right('Delivery: ' + formatDocumentCurrency(document.deliveryCharge))}</div>\n`;
  }
  html += `<div class="divider"></div>\n`;
  html += `<div class="total">${right('TOTAL: ' + formatDocumentCurrency(document.total))}</div>\n`;
  
  // Payment info
  if (document.paymentMethod) {
    html += `<div class="divider"></div>\n`;
    html += `<div>Payment: ${document.paymentMethod}</div>\n`;
  }
  if (document.amountPaid !== undefined) {
    html += `<div>${right('Paid: ' + formatDocumentCurrency(document.amountPaid))}</div>\n`;
  }
  if (document.balance !== undefined) {
    html += `<div>${right('Balance: ' + formatDocumentCurrency(document.balance))}</div>\n`;
  }
  
  // Footer
  html += `<div class="divider"></div>\n`;
  html += `<div class="center">GST: ${BUSINESS_DETAILS.gstNumber}</div>\n`;
  html += `<div class="center">FSSAI: ${BUSINESS_DETAILS.fssaiNumber}</div>\n`;
  html += `<div class="divider"></div>\n`;
  html += `<div class="center">Thank you for your visit!</div>\n`;
  html += `<div class="center">${BUSINESS_DETAILS.website}</div>\n`;
  
  if (document.printCount > 1) {
    html += `<div class="center">*** REPRINT ***</div>\n`;
  }
  
  html += `
</body>
</html>`;
  
  return html;
}

/**
 * Generate A4 document HTML for receipts and invoices
 */
export function generateA4DocumentHTML(document) {
  const docType = document.receiptNumber ? 'RECEIPT' : document.invoiceNumber ? 'INVOICE' : document.paymentReceiptNumber ? 'PAYMENT_RECEIPT' : 'CREDIT_NOTE';
  const docNumber = document.receiptNumber || document.invoiceNumber || document.paymentReceiptNumber || document.creditNoteNumber;
  const docLabel = docType === 'RECEIPT' ? 'SALES RECEIPT' : docType === 'INVOICE' ? 'INVOICE' : docType === 'PAYMENT_RECEIPT' ? 'PAYMENT RECEIPT' : 'CREDIT NOTE';
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docLabel} - ${docNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 5px 0;
      color: #333;
    }
    .header .doc-number {
      font-size: 18px;
      color: #666;
      margin-top: 5px;
    }
    .business-info {
      font-size: 11px;
      color: #666;
      margin-top: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-section p {
      margin: 5px 0;
      font-size: 13px;
    }
    .status {
      display: inline-block;
      padding: 6px 16px;
      background: #f0f0f0;
      color: #333;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #333;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
      font-size: 13px;
    }
    .items-table .total {
      font-weight: 600;
    }
    .items-table .right {
      text-align: right;
    }
    .totals {
      text-align: right;
      margin-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      gap: 30px;
      margin-bottom: 8px;
    }
    .totals-row .label {
      width: 150px;
      color: #666;
    }
    .totals-row .value {
      width: 120px;
      font-weight: 600;
    }
    .grand-total {
      font-size: 18px;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .business-details {
      margin-top: 40px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
    }
    .business-details p {
      margin: 4px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .reprint {
      color: #e74c3c;
      font-weight: 600;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${docLabel}</h1>
      <div class="doc-number">${docNumber}</div>
      <div style="margin-top: 10px;"><span class="status">${docLabel}</span></div>
      <div class="business-info">
        <p><strong>${BUSINESS_DETAILS.legalName}</strong></p>
        <p>${BUSINESS_DETAILS.address}</p>
        <p>Phone: ${BUSINESS_DETAILS.phone} | Email: ${BUSINESS_DETAILS.email}</p>
        <p>GST: ${BUSINESS_DETAILS.gstNumber} | FSSAI: ${BUSINESS_DETAILS.fssaiNumber}</p>
      </div>
    </div>
    
    <div class="info-grid">
      <div class="info-section">
        <h3>Customer</h3>
        <p><strong>${document.customerName || 'Walk-in Customer'}</strong></p>
        <p>${document.customerPhone || ''}</p>
        <p>${document.customerEmail || ''}</p>
        ${document.customerAddress ? `<p>${document.customerAddress}</p>` : ''}
        ${document.customerGstNumber ? `<p>GST: ${document.customerGstNumber}</p>` : ''}
      </div>
      <div class="info-section">
        <h3>Document Details</h3>
        <p>Date: ${formatDocumentDate(document.issuedAt || document.createdAt)}</p>
        <p>Time: ${formatDocumentTime(document.issuedAt || document.createdAt)}</p>
        ${document.orderId ? `<p>Order: ${document.orderId}</p>` : ''}
        ${document.tableId ? `<p>Table: ${document.tableId}</p>` : ''}
        ${document.staffName ? `<p>Waiter: ${document.staffName}</p>` : ''}
        <p>Branch: ${document.branchName || 'Main Branch'}</p>
        ${document.dueDate ? `<p>Due Date: ${formatDocumentDate(document.dueDate)}</p>` : ''}
        ${document.paymentTerms ? `<p>Terms: ${document.paymentTerms}</p>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
          <th class="right">Price</th>
          <th class="right">Tax</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(document.items || []).map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong>
              ${item.description ? `<br><small>${item.description}</small>` : ''}
              ${item.modifiers && item.modifiers.length > 0 ? `<br><small>${item.modifiers.join(', ')}</small>` : ''}
            </td>
            <td class="right">${item.quantity}</td>
            <td class="right">${formatDocumentCurrency(item.unitPrice)}</td>
            <td class="right">${item.taxRate}%</td>
            <td class="right total">${formatDocumentCurrency(item.lineTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <div class="label">Subtotal:</div>
        <div class="value">${formatDocumentCurrency(document.subtotal)}</div>
      </div>
      ${document.discountAmount > 0 ? `
      <div class="totals-row">
        <div class="label">Discount:</div>
        <div class="value">-${formatDocumentCurrency(document.discountAmount)}</div>
      </div>
      ` : ''}
      <div class="totals-row">
        <div class="label">GST:</div>
        <div class="value">${formatDocumentCurrency(document.taxAmount)}</div>
      </div>
      ${document.serviceCharge > 0 ? `
      <div class="totals-row">
        <div class="label">Service Charge:</div>
        <div class="value">${formatDocumentCurrency(document.serviceCharge)}</div>
      </div>
      ` : ''}
      ${document.deliveryCharge > 0 ? `
      <div class="totals-row">
        <div class="label">Delivery Charge:</div>
        <div class="value">${formatDocumentCurrency(document.deliveryCharge)}</div>
      </div>
      ` : ''}
      <div class="totals-row grand-total">
        <div class="label">Total:</div>
        <div class="value">${formatDocumentCurrency(document.total)}</div>
      </div>
      ${document.amountPaid !== undefined ? `
      <div class="totals-row">
        <div class="label">Amount Paid:</div>
        <div class="value">${formatDocumentCurrency(document.amountPaid)}</div>
      </div>
      ` : ''}
      ${document.balance !== undefined ? `
      <div class="totals-row">
        <div class="label">Balance Due:</div>
        <div class="value" style="color: ${document.balance > 0 ? '#e74c3c' : '#27ae60'}">${formatDocumentCurrency(document.balance)}</div>
      </div>
      ` : ''}
    </div>

    ${document.paymentMethod ? `
    <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;">
      <strong>Payment Method:</strong> ${document.paymentMethod}
      ${document.paymentReference ? `<br><small>Reference: ${document.paymentReference}</small>` : ''}
    </div>
    ` : ''}

    ${document.notes ? `
    <div style="margin-top: 20px; padding: 15px; background: #fff8e1; border-radius: 4px; font-size: 12px;">
      <strong>Notes:</strong> ${document.notes}
    </div>
    ` : ''}

    <div class="business-details">
      <p><strong>${BUSINESS_DETAILS.legalName}</strong></p>
      <p>${BUSINESS_DETAILS.address}</p>
      <p>GST: ${BUSINESS_DETAILS.gstNumber} | FSSAI: ${BUSINESS_DETAILS.fssaiNumber}</p>
      <p>Phone: ${BUSINESS_DETAILS.phone} | Email: ${BUSINESS_DETAILS.email}</p>
      <p>Website: ${BUSINESS_DETAILS.website}</p>
    </div>

    <div class="footer">
      Generated by CafeOS Documents | ${new Date().toLocaleString()}
      ${document.printCount > 1 ? '<br><span class="reprint">*** REPRINT ***</span>' : ''}
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Print document using thermal layout
 */
export function printThermalDocument(document, width = null) {
  const printerSettings = getPrinterSettings();
  const actualWidth = width || (printerSettings.paperWidth === 58 ? '58mm' : '80mm');
  const html = generateThermalReceiptHTML(document, actualWidth);
  
  // Print multiple copies if configured
  const copies = printerSettings.copies || 1;
  for (let i = 0; i < copies; i++) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Print document using A4 layout
 */
export function printA4Document(document) {
  const html = generateA4DocumentHTML(document);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Export document as PDF (using browser print to PDF)
 */
export function exportDocumentAsPDF(document, format = 'A4') {
  if (format === 'A4') {
    printA4Document(document);
  } else {
    const printerSettings = getPrinterSettings();
    const actualWidth = format === '58mm' ? '58mm' : format === '80mm' ? '80mm' : (printerSettings.paperWidth === 58 ? '58mm' : '80mm');
    printThermalDocument(document, actualWidth);
  }
}
