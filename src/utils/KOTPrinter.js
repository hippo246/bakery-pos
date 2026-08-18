// KOT Printer
// Generates printable Kitchen Order Tickets for thermal printers

import { KitchenStation, KOTPriority } from '../domain/kotTypes.js';

export class KOTPrinter {
  constructor(config = {}) {
    this.config = {
      printerWidth: 80, // mm (standard thermal printer width)
      fontSize: 12,
      headerFontSize: 16,
      ...config
    };
  }

  /**
   * Generate KOT HTML for printing
   * @param {object} kot - KOT object
   * @param {string} station - Kitchen station (optional, for station-specific printing)
   * @returns {string} HTML for printing
   */
  generateKOTHTML(kot, station = null) {
    // Filter items by station if specified
    const items = station 
      ? kot.items.filter(item => item.station === station)
      : kot.items;

    if (items.length === 0) {
      return null;
    }

    const stationLabel = this.getStationLabel(station || 'General');
    const timestamp = new Date(kot.createdAt).toLocaleString();
    const estimatedReady = new Date(kot.estimatedReadyAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KOT - ${kot.kotId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: ${this.config.printerWidth}mm;
            padding: 5mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
          }
          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          .header .station {
            font-size: 14px;
            font-weight: bold;
            background: #000;
            color: #fff;
            padding: 2mm;
            margin-bottom: 2mm;
          }
          .info {
            margin-bottom: 5mm;
            border-bottom: 1px dashed #000;
            padding-bottom: 3mm;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          .info-label {
            font-weight: bold;
          }
          .priority {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 1mm;
            margin-top: 2mm;
            text-align: center;
          }
          .priority-urgent {
            background: #ff0000;
            color: #fff;
          }
          .priority-high {
            background: #ff6600;
            color: #fff;
          }
          .priority-normal {
            background: #0066ff;
            color: #fff;
          }
          .priority-low {
            background: #666;
            color: #fff;
          }
          .items {
            margin-bottom: 5mm;
          }
          .item {
            margin-bottom: 3mm;
            padding: 2mm;
            border: 1px solid #ccc;
            border-left: 3px solid #000;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          .item-quantity {
            font-size: 16px;
          }
          .item-notes {
            font-size: 10px;
            color: #666;
            margin-top: 1mm;
            font-style: italic;
          }
          .item-modifications {
            font-size: 10px;
            color: #666;
            margin-top: 1mm;
          }
          .footer {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 3mm;
            margin-top: 5mm;
          }
          .timestamp {
            font-size: 10px;
            color: #666;
          }
          @media print {
            body {
              width: 100%;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KITCHEN ORDER TICKET</h1>
          <div class="station">${stationLabel.toUpperCase()}</div>
        </div>

        <div class="info">
          <div class="info-row">
            <span class="info-label">Order #:</span>
            <span>${kot.orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">KOT ID:</span>
            <span>${kot.kotId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer:</span>
            <span>${kot.customer.name}</span>
          </div>
          ${kot.customer.table ? `
          <div class="info-row">
            <span class="info-label">Table:</span>
            <span>${kot.customer.table}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Terminal:</span>
            <span>${kot.terminal}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Staff:</span>
            <span>${kot.staff.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time:</span>
            <span>${timestamp}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Est. Ready:</span>
            <span>${estimatedReady}</span>
          </div>
        </div>

        <div class="priority priority-${kot.priority}">
          ${kot.priority.toUpperCase()}
        </div>

        <div class="items">
          ${items.map(item => `
            <div class="item">
              <div class="item-header">
                <span class="item-quantity">${item.quantity}x</span>
                <span>${item.name}</span>
              </div>
              ${item.notes ? `
              <div class="item-notes">📝 ${item.notes}</div>
              ` : ''}
              ${item.modifications && item.modifications.length > 0 ? `
              <div class="item-modifications">
                ${item.modifications.map(mod => `• ${mod}`).join('<br>')}
              </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        ${kot.notes ? `
        <div style="margin-bottom: 5mm; padding: 2mm; background: #f0f0f0; border: 1px dashed #000;">
          <strong>Order Notes:</strong> ${kot.notes}
        </div>
        ` : ''}

        <div class="footer">
          <div class="timestamp">Printed: ${new Date().toLocaleString()}</div>
          <div style="margin-top: 2mm; font-size: 10px;">Total Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}</div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Print KOT
   * @param {object} kot - KOT object
   * @param {string} station - Kitchen station (optional)
   * @returns {Promise<object>} Print result
   */
  async printKOT(kot, station = null) {
    try {
      const html = this.generateKOTHTML(kot, station);
      
      if (!html) {
        return { success: false, error: 'No items to print for this station' };
      }

      // Create print window
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        return { success: false, error: 'Popup blocked. Please allow popups for printing.' };
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        // Close window after printing (user can cancel if needed)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };

      return { success: true, kotId: kot.kotId, station };
    } catch (error) {
      console.error('Failed to print KOT:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print KOT for all stations
   * @param {object} kot - KOT object
   * @returns {Promise<object>} Print result
   */
  async printKOTForAllStations(kot) {
    const stations = [...new Set(kot.items.map(item => item.station))];
    const results = [];

    for (const station of stations) {
      const result = await this.printKOT(kot, station);
      results.push({ station, ...result });
    }

    return {
      success: results.every(r => r.success),
      results
    };
  }

  /**
   * Generate KOT text for simple printers
   * @param {object} kot - KOT object
   * @param {string} station - Kitchen station (optional)
   * @returns {string} Plain text KOT
   */
  generateKOTText(kot, station = null) {
    const items = station 
      ? kot.items.filter(item => item.station === station)
      : kot.items;

    if (items.length === 0) {
      return null;
    }

    const stationLabel = this.getStationLabel(station || 'General');
    const timestamp = new Date(kot.createdAt).toLocaleString();
    const estimatedReady = new Date(kot.estimatedReadyAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let text = '';
    text += '='.repeat(40) + '\n';
    text += 'KITCHEN ORDER TICKET\n';
    text += '='.repeat(40) + '\n';
    text += stationLabel.toUpperCase() + '\n';
    text += '-'.repeat(40) + '\n';
    text += `Order #: ${kot.orderNumber}\n`;
    text += `KOT ID: ${kot.kotId}\n`;
    text += `Customer: ${kot.customer.name}\n`;
    if (kot.customer.table) {
      text += `Table: ${kot.customer.table}\n`;
    }
    text += `Terminal: ${kot.terminal}\n`;
    text += `Staff: ${kot.staff.name}\n`;
    text += `Time: ${timestamp}\n`;
    text += `Est. Ready: ${estimatedReady}\n`;
    text += '-'.repeat(40) + '\n';
    text += `PRIORITY: ${kot.priority.toUpperCase()}\n`;
    text += '-'.repeat(40) + '\n';

    items.forEach(item => {
      text += `${item.quantity}x ${item.name}\n`;
      if (item.notes) {
        text += `  Note: ${item.notes}\n`;
      }
      if (item.modifications && item.modifications.length > 0) {
        item.modifications.forEach(mod => {
          text += `  - ${mod}\n`;
        });
      }
      text += '\n';
    });

    if (kot.notes) {
      text += '-'.repeat(40) + '\n';
      text += `Order Notes: ${kot.notes}\n`;
    }

    text += '='.repeat(40) + '\n';
    text += `Total Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    text += `Printed: ${new Date().toLocaleString()}\n`;
    text += '='.repeat(40) + '\n';

    return text;
  }

  /**
   * Get station label
   * @param {string} station - Station code
   * @returns {string} Station label
   */
  getStationLabel(station) {
    const labels = {
      [KitchenStation.BAKERY]: 'Bakery',
      [KitchenStation.KITCHEN]: 'Kitchen',
      [KitchenStation.BEVERAGE]: 'Beverage',
      [KitchenStation.DESSERT]: 'Dessert',
      [KitchenStation.GRILL]: 'Grill',
      [KitchenStation.FRYER]: 'Fryer',
      [KitchenStation.COLD]: 'Cold',
      [KitchenStation.GENERAL]: 'General'
    };
    return labels[station] || station;
  }

  /**
   * Print KOT using browser print API
   * @param {string} text - Plain text KOT
   * @returns {Promise<object>} Print result
   */
  async printText(text) {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        return { success: false, error: 'Popup blocked. Please allow popups for printing.' };
      }

      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre;">${text}</pre>`);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };

      return { success: true };
    } catch (error) {
      console.error('Failed to print text:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let kotPrinterInstance = null;

/**
 * Get the singleton KOT printer instance
 * @param {object} config - Configuration
 * @returns {KOTPrinter} KOT printer instance
 */
export function getKOTPrinter(config = {}) {
  if (!kotPrinterInstance) {
    kotPrinterInstance = new KOTPrinter(config);
  }
  return kotPrinterInstance;
}

export default KOTPrinter;
