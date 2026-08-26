/**
 * Browser-Compatible Thermal Printer Utility
 * Uses browser's print dialog with CSS formatting for thermal printers
 * Supports 58mm and 80mm paper widths
 */

export class ThermalPrinterService {
  constructor(settings = {}) {
    this.enabled = settings.enabled || false;
    this.paperWidth = settings.paperWidth || 80; // 58mm or 80mm
  }

  /**
   * Generate receipt HTML for printing
   * @param {Object} order - Order object
   * @param {Object} settings - Store settings
   * @returns {string} HTML string
   */
  generateReceiptHTML(order, settings = {}) {
    const width = this.paperWidth === 58 ? '58mm' : '80mm';

    let itemsHTML = '';
    (order.items || []).forEach(item => {
      const name = item.name || item.itemName || 'Unknown';
      const qty = item.quantity || item.qty || 1;
      const price = item.price || 0;
      const total = price * qty;

      itemsHTML += `
        <tr>
          <td colspan="2">${name} x${qty}</td>
        </tr>
        <tr>
          <td></td>
          <td style="text-align: right;">₹${total.toFixed(2)}</td>
        </tr>
        ${item.specialRequest ? `<tr><td colspan="2" style="font-size: 10px; color: #666;">  (${item.specialRequest})</td></tr>` : ''}
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${order.invoiceNumber || order.id}</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: ${width} auto;
            }
            body {
              width: ${width};
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 20px auto;
            max-width: ${width};
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 16px;
            margin: 0 0 5px 0;
            font-weight: bold;
          }
          .info {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .info p {
            margin: 2px 0;
          }
          .items {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .items table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 2px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .footer p {
            margin: 2px 0;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.storeName || 'Bakery POS'}</h1>
          <p>${settings.storeAddress || ''}</p>
          <p>Phone: ${settings.phone || ''}</p>
        </div>

        <div class="info">
          <p><strong>Invoice #:</strong> ${order.invoiceNumber || order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Table:</strong> ${order.tableName || 'Counter'}</p>
          <p><strong>Customer:</strong> ${order.customerName || 'Walk-in'}</p>
        </div>

        <div class="items">
          <p style="font-weight: bold; margin-bottom: 5px;">ITEMS</p>
          <table>
            ${itemsHTML}
          </table>
        </div>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${(order.subtotal || 0).toFixed(2)}</td>
            </tr>
            ${order.cgst !== undefined && order.sgst !== undefined ? `
              <tr>
                <td>CGST:</td>
                <td style="text-align: right;">₹${(order.cgst || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST:</td>
                <td style="text-align: right;">₹${(order.sgst || 0).toFixed(2)}</td>
              </tr>
            ` : ''}
            ${order.tipAmount > 0 ? `
              <tr>
                <td>Tip:</td>
                <td style="text-align: right;">₹${(order.tipAmount || 0).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>TOTAL:</td>
              <td style="text-align: right;">₹${(order.total || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="info">
          <p><strong>Payment:</strong> ${(order.paymentMethod || 'CASH').toUpperCase()}</p>
          <p><strong>Status:</strong> ${order.paymentStatus || 'PAID'}</p>
          ${settings.gstRegistered && settings.gstin ? `<p><strong>GSTIN:</strong> ${settings.gstin}</p>` : ''}
          ${settings.fssaiLicense ? `<p><strong>FSSAI:</strong> ${settings.fssaiLicense}</p>` : ''}
        </div>

        <div class="footer">
          <p>${settings.customReceiptFooter || 'Thank you for your order!'}</p>
          <p>Powered by Bakery POS</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate kitchen ticket HTML for printing
   * @param {Object} order - Order object
   * @returns {string} HTML string
   */
  generateKitchenTicketHTML(order) {
    const width = this.paperWidth === 58 ? '58mm' : '80mm';

    let itemsHTML = '';
    (order.items || []).forEach(item => {
      const name = item.name || item.itemName || 'Unknown';
      const qty = item.quantity || item.qty || 1;

      itemsHTML += `
        <tr>
          <td colspan="2">${qty}x ${name}</td>
        </tr>
        ${item.specialRequest ? `<tr><td colspan="2" style="font-size: 10px;">  Note: ${item.specialRequest}</td></tr>` : ''}
        ${item.spiceLevel ? `<tr><td colspan="2" style="font-size: 10px;">  Spice: ${'🌶️'.repeat(item.spiceLevel)}</td></tr>` : ''}
        ${item.size ? `<tr><td colspan="2" style="font-size: 10px;">  Size: ${item.size}</td></tr>` : ''}
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kitchen Order - ${order.id}</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: ${width} auto;
            }
            body {
              width: ${width};
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.4;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            margin: 20px auto;
            max-width: ${width};
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            margin: 0;
            font-weight: bold;
          }
          .info {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .info p {
            margin: 2px 0;
          }
          .items {
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .items table {
            width: 100%;
            border-collapse: collapse;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KITCHEN ORDER</h1>
        </div>

        <div class="info">
          <p><strong>Order #:</strong> ${order.id}</p>
          <p><strong>Table:</strong> ${order.tableName || 'Counter'}</p>
          <p><strong>Time:</strong> ${new Date(order.createdAt).toLocaleTimeString()}</p>
        </div>

        <div class="items">
          <p style="font-weight: bold; margin-bottom: 5px;">ITEMS TO PREPARE</p>
          <table>
            ${itemsHTML}
          </table>
        </div>

        <div class="footer">
          <p>*** END OF ORDER ***</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Print a receipt for an order
   * @param {Object} order - Order object
   * @param {Object} settings - Store settings
   */
  async printReceipt(order, settings = {}) {
    if (!this.enabled) {
      console.log('Thermal printing is disabled');
      return false;
    }

    try {
      const html = this.generateReceiptHTML(order, settings);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Please allow popups.');
        return false;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      console.log('Receipt print dialog opened');
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      return false;
    }
  }

  /**
   * Print a kitchen order ticket
   * @param {Object} order - Order object
   */
  async printKitchenTicket(order) {
    if (!this.enabled) {
      console.log('Thermal printing is disabled');
      return false;
    }

    try {
      const html = this.generateKitchenTicketHTML(order);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Please allow popups.');
        return false;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      console.log('Kitchen ticket print dialog opened');
      return true;
    } catch (error) {
      console.error('Error printing kitchen ticket:', error);
      return false;
    }
  }

  /**
   * Test printer connection
   */
  async testConnection() {
    if (!this.enabled) {
      console.log('Thermal printing is disabled');
      return false;
    }

    try {
      const width = this.paperWidth === 58 ? '58mm' : '80mm';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Printer Test</title>
          <style>
            @media print {
              @page { margin: 0; size: ${width} auto; }
              body { width: ${width}; margin: 0; padding: 10px; font-family: 'Courier New', monospace; }
            }
            body { font-family: 'Courier New', monospace; margin: 20px auto; max-width: ${width}; padding: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>PRINTER TEST</h1>
          <p>${new Date().toLocaleString()}</p>
          <hr>
          <p>Test successful!</p>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Please allow popups.');
        return false;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      console.log('Printer test dialog opened');
      return true;
    } catch (error) {
      console.error('Printer test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let printerInstance = null;

/**
 * Get or create printer instance
 * @param {Object} settings - Printer settings
 * @returns {ThermalPrinterService}
 */
export function getPrinterService(settings) {
  if (!printerInstance || printerInstance.paperWidth !== settings.paperWidth) {
    printerInstance = new ThermalPrinterService(settings);
  }
  printerInstance.enabled = settings.enabled;
  return printerInstance;
}
