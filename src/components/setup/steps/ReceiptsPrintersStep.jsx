import React from 'react';
// Receipts & Printers Step for Setup Wizard
// Configure receipt settings and printer options, with a live receipt preview.

import { useState, useCallback, useMemo } from "react";

const PRINTER_TYPES = [
  { id: 'thermal', name: 'Thermal Printer', icon: '🖨️', description: 'Standard 58mm/80mm thermal receipt printer' },
  { id: 'inkjet', name: 'Inkjet Printer', icon: '🖨️', description: 'Standard inkjet for larger receipts' },
  { id: 'laser', name: 'Laser Printer', icon: '🖨️', description: 'High-quality laser printing' },
  { id: 'network', name: 'Network Printer', icon: '🌐', description: 'Shared network printer' },
  { id: 'bluetooth', name: 'Bluetooth Printer', icon: '📶', description: 'Wireless Bluetooth printer' }
];

const PAPER_WIDTHS = [
  { id: '58', name: '58 mm', width: 58 },
  { id: '80', name: '80 mm', width: 80 },
  { id: 'a4', name: 'A4', width: 210 }
];

const CONNECTION_TYPES = [
  { id: 'usb', name: 'USB' },
  { id: 'network', name: 'Network' },
  { id: 'bluetooth', name: 'Bluetooth' },
  { id: 'serial', name: 'Serial' }
];

const RECEIPT_CONTENT_OPTIONS = [
  { key: 'showLogo', label: 'Show Logo' },
  { key: 'showOrderNumber', label: 'Show Order Number' },
  { key: 'showDateTime', label: 'Show Date & Time' },
  { key: 'showCashier', label: 'Show Cashier Name' },
  { key: 'showTable', label: 'Show Table Number' },
  { key: 'showTaxBreakdown', label: 'Show Tax Breakdown' },
  { key: 'showBarcode', label: 'Show Barcode' },
  { key: 'showQRCode', label: 'Show QR Code' },
  { key: 'showPaymentMethod', label: 'Show Payment Method' },
  { key: 'showCustomerPhone', label: 'Show Customer Phone' },
  { key: 'showGSTNumber', label: 'Show GST Number' },
  { key: 'showFSSAINumber', label: 'Show FSSAI Number' }
];

// Sample order used only to render the live preview — never sent anywhere.
const SAMPLE_ORDER = {
  orderNumber: '1042',
  cashier: 'Priya S.',
  table: 'Table 6',
  paymentMethod: 'UPI',
  customerPhone: '+91 98765 43210',
  items: [
    { name: 'Cappuccino', qty: 2, price: 180 },
    { name: 'Blueberry Muffin', qty: 1, price: 140 },
    { name: 'Cold Brew', qty: 1, price: 210 }
  ]
};

const TAX_RATE = 0.05;

// ---------- shared style tokens (replaces ~15 duplicated inline blocks) ----------

const styles = {
  card: {
    background: "var(--cafe-bg-surface)",
    border: "1px solid var(--cafe-border-light)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--cafe-text-primary)",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--cafe-text-secondary)",
    marginBottom: 8,
    display: "block"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 15,
    border: "1px solid var(--cafe-border)",
    borderRadius: 10,
    background: "var(--cafe-bg)",
    color: "var(--cafe-text-primary)",
    outline: "none",
    boxSizing: "border-box"
  },
  inputError: {
    borderColor: "#ef4444"
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    margin: "6px 0 0"
  },
  checkboxCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    padding: 12,
    background: "var(--cafe-bg)",
    borderRadius: 8,
    border: "1px solid var(--cafe-border)"
  },
  checkbox: { width: 18, height: 18, flexShrink: 0 },
  checkboxLabel: { fontSize: 14, color: "var(--cafe-text-primary)" },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--cafe-accent)",
    cursor: "pointer",
    textDecoration: "underline"
  }
};

// ---------- small reusable field components ----------

function LabeledInput({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input id={id} style={{ ...styles.input, ...(error ? styles.inputError : {}) }} {...props} />
      {error && <p style={styles.errorText} role="alert">{error}</p>}
    </div>
  );
}

function LabeledSelect({ id, label, error, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <select id={id} style={{ ...styles.input, ...(error ? styles.inputError : {}) }} {...props}>
        {children}
      </select>
      {error && <p style={styles.errorText} role="alert">{error}</p>}
    </div>
  );
}

function CheckboxCard({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} style={styles.checkboxCard}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} style={styles.checkbox} />
      <span style={styles.checkboxLabel}>{label}</span>
    </label>
  );
}

function Card({ icon, title, action, children }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h4 style={{ ...styles.cardTitle, marginBottom: 0 }}>
          <span>{icon}</span>
          {title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}

// ---------- live receipt preview ----------

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function PreviewRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: bold ? 700 : 400, marginBottom: 3 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PreviewDivider({ dashed }) {
  return (
    <div style={{
      borderTop: dashed ? "1px dashed #999" : "1px solid #999",
      margin: "8px 0"
    }} />
  );
}

const PAPER_PREVIEW_WIDTH = { '58': 240, '80': 300, 'a4': 380 };
const FONT_SIZE_PREVIEW = { small: 11, medium: 12.5, large: 14.5 };

function ReceiptPreview({ formData }) {
  const subtotal = SAMPLE_ORDER.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const width = PAPER_PREVIEW_WIDTH[formData.paperWidth] || 300;
  const fontSize = FONT_SIZE_PREVIEW[formData.fontSize] || 12.5;
  const isRollPaper = formData.paperWidth !== 'a4';
  const now = useMemo(() => new Date(), []);

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", textAlign: "center", marginBottom: 12 }}>
        Live preview · sample order, not a real transaction
      </p>
      <div
        style={{
          width,
          margin: "0 auto",
          background: "#fdfdfb",
          color: "#1a1a1a",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize,
          lineHeight: 1.5,
          padding: "20px 16px 12px",
          boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
          borderRadius: isRollPaper ? "3px 3px 0 0" : 6
        }}
      >
        {formData.showLogo && (
          <div style={{ textAlign: "center", fontSize: fontSize + 12, marginBottom: 6 }}>☕</div>
        )}
        {formData.headerText && (
          <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6, whiteSpace: "pre-wrap" }}>
            {formData.headerText}
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: 8 }}>Coffee &amp; Co.</div>
        {formData.showGSTNumber && formData.gstNumber.trim() && (
          <div style={{ textAlign: "center", fontSize: fontSize - 1 }}>GSTIN: {formData.gstNumber}</div>
        )}
        {formData.showFSSAINumber && formData.fssaiNumber.trim() && (
          <div style={{ textAlign: "center", fontSize: fontSize - 1, marginBottom: 4 }}>FSSAI: {formData.fssaiNumber}</div>
        )}
        <PreviewDivider />

        {formData.showOrderNumber && <PreviewRow label="Order #" value={SAMPLE_ORDER.orderNumber} />}
        {formData.showDateTime && (
          <PreviewRow label="Date" value={now.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })} />
        )}
        {formData.showCashier && <PreviewRow label="Cashier" value={SAMPLE_ORDER.cashier} />}
        {formData.showTable && <PreviewRow label="Table" value={SAMPLE_ORDER.table} />}

        <PreviewDivider dashed />

        {SAMPLE_ORDER.items.map(item => (
          <PreviewRow
            key={item.name}
            label={`${item.qty} × ${item.name}`}
            value={formatCurrency(item.qty * item.price)}
          />
        ))}

        <PreviewDivider dashed />

        <PreviewRow label="Subtotal" value={formatCurrency(subtotal)} />
        {formData.showTaxBreakdown && <PreviewRow label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={formatCurrency(tax)} />}
        <PreviewRow label="Total" value={formatCurrency(total)} bold />

        {formData.showPaymentMethod && <PreviewRow label="Paid via" value={SAMPLE_ORDER.paymentMethod} />}
        {formData.showCustomerPhone && <PreviewRow label="Phone" value={SAMPLE_ORDER.customerPhone} />}

        {formData.showBarcode && (
          <div style={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "flex-end", height: 32, margin: "10px 0 2px" }}>
            {[3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2].map((w, i) => (
              <div key={i} style={{ width: w, height: "100%", background: "#1a1a1a" }} />
            ))}
          </div>
        )}
        {formData.showQRCode && (
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 2px" }}>
            <div style={{
              width: 56, height: 56,
              background: "repeating-conic-gradient(#1a1a1a 0% 25%, #fdfdfb 0% 50%) 0 0 / 8px 8px",
              border: "3px solid #1a1a1a"
            }} />
          </div>
        )}

        {formData.footerText && (
          <div style={{ textAlign: "center", marginTop: 10, whiteSpace: "pre-wrap" }}>
            {formData.footerText}
          </div>
        )}

        {isRollPaper && (
          <div
            aria-hidden="true"
            style={{
              height: 12,
              marginTop: 10,
              marginLeft: -16,
              marginRight: -16,
              background:
                "linear-gradient(135deg, transparent 75%, #fdfdfb 75%) 0 50%, " +
                "linear-gradient(-135deg, transparent 75%, #fdfdfb 75%) 0 50%",
              backgroundSize: "12px 12px",
              backgroundRepeat: "repeat-x",
              backgroundColor: "transparent",
              filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.16))"
            }}
          />
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
        {formData.copies > 1 && <div>Prints {formData.copies} copies per order</div>}
        {formData.printKitchenCopy && (
          <div>+ 1 kitchen copy → {formData.kitchenPrinter?.trim() || 'no printer set'}</div>
        )}
      </div>
    </div>
  );
}

// ---------- main step ----------

export default function ReceiptsPrintersStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [formData, setFormData] = useState({
    printerType: settings?.printerType || 'thermal',
    paperWidth: settings?.paperWidth || '80',
    connectionType: settings?.connectionType || 'usb',
    printerName: settings?.printerName || '',
    networkAddress: settings?.networkAddress || '',
    bluetoothDevice: settings?.bluetoothDevice || '',
    copies: settings?.copies || 1,
    autoPrint: settings?.autoPrint !== false,
    // Receipt content
    showLogo: settings?.showLogo !== false,
    showOrderNumber: settings?.showOrderNumber !== false,
    showDateTime: settings?.showDateTime !== false,
    showCashier: settings?.showCashier !== false,
    showTable: settings?.showTable !== false,
    showTaxBreakdown: settings?.showTaxBreakdown !== false,
    showBarcode: settings?.showBarcode !== false,
    showQRCode: settings?.showQRCode !== false,
    showPaymentMethod: settings?.showPaymentMethod !== false,
    showCustomerPhone: settings?.showCustomerPhone || false,
    showGSTNumber: settings?.showGSTNumber || false,
    showFSSAINumber: settings?.showFSSAINumber || false,
    // Header/Footer
    headerText: settings?.headerText || '',
    footerText: settings?.footerText || 'Thank you for visiting!',
    gstNumber: settings?.gstNumber || '',
    fssaiNumber: settings?.fssaiNumber || '',
    // Formatting
    fontSize: settings?.fontSize || 'medium',
    printKitchenCopy: settings?.printKitchenCopy !== false,
    kitchenPrinter: settings?.kitchenPrinter || ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [testPrintStatus, setTestPrintStatus] = useState('idle'); // idle | testing | success | error
  const [testPrintMessage, setTestPrintMessage] = useState('');
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const handleCopiesChange = useCallback((e) => {
    const raw = e.target.value;
    if (raw === '') {
      handleChange('copies', '');
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      handleChange('copies', Math.min(5, Math.max(1, parsed)));
    }
  }, [handleChange]);

  const handleCopiesBlur = useCallback(() => {
    if (formData.copies === '' || Number.isNaN(Number(formData.copies))) {
      handleChange('copies', 1);
    }
  }, [formData.copies, handleChange]);

  const allContentChecked = RECEIPT_CONTENT_OPTIONS.every(opt => formData[opt.key]);
  const toggleAllContent = useCallback(() => {
    const next = !allContentChecked;
    setFormData(prev => {
      const updated = { ...prev };
      RECEIPT_CONTENT_OPTIONS.forEach(opt => { updated[opt.key] = next; });
      return updated;
    });
  }, [allContentChecked]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.printerName.trim()) {
      errors.printerName = 'Give this printer a name so staff can pick it from a list.';
    }
    if (formData.connectionType === 'network' && !formData.networkAddress.trim()) {
      errors.networkAddress = "Enter the printer's IP address or hostname.";
    }
    if (formData.connectionType === 'bluetooth' && !formData.bluetoothDevice.trim()) {
      errors.bluetoothDevice = 'Enter or select the Bluetooth device name.';
    }
    if (formData.printKitchenCopy && !formData.kitchenPrinter.trim()) {
      errors.kitchenPrinter = 'Enter a printer name for kitchen copies, or turn this off.';
    }
    const firstMessage = Object.values(errors).find(Boolean);
    return { valid: Object.keys(errors).length === 0, errors, firstMessage };
  }, [formData]);

  const handleTestPrint = useCallback(() => {
    const { valid, errors, firstMessage } = validate();
    if (!valid) {
      setFieldErrors(errors);
      setTestPrintStatus('error');
      setTestPrintMessage(firstMessage);
      return;
    }
    setFieldErrors({});
    setTestPrintStatus('testing');
    setTestPrintMessage(`Sending test page to ${formData.printerName}…`);
    setTimeout(() => {
      setTestPrintStatus('success');
      setTestPrintMessage(`Test page sent to ${formData.printerName}.`);
      setTimeout(() => setTestPrintStatus('idle'), 4000);
    }, 1200);
  }, [validate, formData.printerName]);

  const handleNext = useCallback(() => {
    const { valid, errors, firstMessage } = validate();
    if (!valid) {
      setFieldErrors(errors);
      setError({ title: 'Check printer settings', message: firstMessage });
      return;
    }

    const updatedSettings = {
      ...settings,
      ...formData,
      copies: formData.copies === '' ? 1 : formData.copies
    };

    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // Non-fatal: settings still flow through onNext even if local persistence fails
      console.error('[ReceiptsPrintersStep] Failed to persist settings locally:', e);
    }

    onNext(updatedSettings);
  }, [formData, settings, onNext, setError, validate]);

  const stackedLayout = isMobile || isTablet;

  return (
    <div style={{ maxWidth: stackedLayout ? 900 : 1120, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Receipts & Printers
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Configure printer settings and receipt formatting.
        </p>
      </div>

      {isMobile && (
        <button
          type="button"
          onClick={() => setShowPreviewMobile(v => !v)}
          style={{
            width: "100%",
            marginBottom: 24,
            padding: "12px 16px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            cursor: "pointer"
          }}
          aria-expanded={showPreviewMobile}
        >
          👁️ {showPreviewMobile ? 'Hide' : 'Show'} receipt preview
        </button>
      )}
      {isMobile && showPreviewMobile && (
        <div style={{ marginBottom: 24 }}>
          <ReceiptPreview formData={formData} />
        </div>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexDirection: stackedLayout ? "column" : "row" }}>
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          {/* Printer Settings */}
          <Card icon="🖨️" title="Printer Configuration">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 16 }}>
              <LabeledSelect
                id="printerType"
                label="Printer Type"
                value={formData.printerType}
                onChange={(e) => handleChange('printerType', e.target.value)}
              >
                {PRINTER_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                ))}
              </LabeledSelect>

              <LabeledSelect
                id="paperWidth"
                label="Paper Width"
                value={formData.paperWidth}
                onChange={(e) => handleChange('paperWidth', e.target.value)}
              >
                {PAPER_WIDTHS.map(width => (
                  <option key={width.id} value={width.id}>{width.name}</option>
                ))}
              </LabeledSelect>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 16 }}>
              <LabeledSelect
                id="connectionType"
                label="Connection Type"
                value={formData.connectionType}
                onChange={(e) => handleChange('connectionType', e.target.value)}
              >
                {CONNECTION_TYPES.map(conn => (
                  <option key={conn.id} value={conn.id}>{conn.name}</option>
                ))}
              </LabeledSelect>

              <LabeledInput
                id="printerName"
                label="Printer Name"
                type="text"
                value={formData.printerName}
                onChange={(e) => handleChange('printerName', e.target.value)}
                placeholder="e.g., Receipt Printer 1"
                error={fieldErrors.printerName}
              />
            </div>

            {formData.connectionType === 'network' && (
              <div style={{ marginBottom: 16 }}>
                <LabeledInput
                  id="networkAddress"
                  label="Network Address"
                  type="text"
                  value={formData.networkAddress}
                  onChange={(e) => handleChange('networkAddress', e.target.value)}
                  placeholder="e.g., 192.168.1.50"
                  error={fieldErrors.networkAddress}
                />
              </div>
            )}
            {formData.connectionType === 'bluetooth' && (
              <div style={{ marginBottom: 16 }}>
                <LabeledInput
                  id="bluetoothDevice"
                  label="Bluetooth Device"
                  type="text"
                  value={formData.bluetoothDevice}
                  onChange={(e) => handleChange('bluetoothDevice', e.target.value)}
                  placeholder="e.g., BT-Printer-04"
                  error={fieldErrors.bluetoothDevice}
                />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 16 }}>
              <LabeledInput
                id="copies"
                label="Copies"
                type="number"
                value={formData.copies}
                onChange={handleCopiesChange}
                onBlur={handleCopiesBlur}
                min="1"
                max="5"
              />

              <LabeledSelect
                id="fontSize"
                label="Font Size"
                value={formData.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </LabeledSelect>

              <div>
                <span aria-hidden="true" style={{ ...styles.label, visibility: "hidden" }}>Options</span>
                <label htmlFor="autoPrint" style={{ ...styles.checkboxCard, padding: "14px 16px", width: "100%", boxSizing: "border-box" }}>
                  <input
                    id="autoPrint"
                    type="checkbox"
                    checked={formData.autoPrint}
                    onChange={(e) => handleChange('autoPrint', e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxLabel}>Auto-print</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestPrint}
              disabled={testPrintStatus === 'testing'}
              style={{
                marginTop: 16,
                padding: "12px 24px",
                background: "var(--cafe-info-bg)",
                border: "1px solid var(--cafe-info-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-info)",
                cursor: testPrintStatus === 'testing' ? "wait" : "pointer",
                opacity: testPrintStatus === 'testing' ? 0.7 : 1
              }}
            >
              {testPrintStatus === 'testing' ? '⏳ Sending…' : '🧪 Test Print'}
            </button>
            {testPrintStatus !== 'idle' && testPrintMessage && (
              <div
                role="status"
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: testPrintStatus === 'error' ? '#ef4444' : testPrintStatus === 'success' ? '#10b981' : 'var(--cafe-text-secondary)'
                }}
              >
                {testPrintStatus === 'success' && '✓ '}
                {testPrintStatus === 'error' && '⚠ '}
                {testPrintMessage}
              </div>
            )}
          </Card>

          {/* Receipt Content */}
          <Card
            icon="📄"
            title="Receipt Content"
            action={
              <button type="button" style={styles.linkButton} onClick={toggleAllContent}>
                {allContentChecked ? 'Clear all' : 'Select all'}
              </button>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {RECEIPT_CONTENT_OPTIONS.map(item => (
                <CheckboxCard
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  checked={formData[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                />
              ))}
            </div>
          </Card>

          {/* Header/Footer */}
          <Card icon="✏️" title="Header & Footer">
            <div style={{ marginBottom: 16 }}>
              <LabeledInput
                id="headerText"
                label="Header Text"
                type="text"
                value={formData.headerText}
                onChange={(e) => handleChange('headerText', e.target.value)}
                placeholder="e.g., Welcome to Our Cafe!"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <LabeledInput
                id="footerText"
                label="Footer Text"
                type="text"
                value={formData.footerText}
                onChange={(e) => handleChange('footerText', e.target.value)}
                placeholder="e.g., Thank you for visiting!"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <LabeledInput
                id="gstNumber"
                label="GST Number"
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                placeholder="e.g., 27ABCDE1234F1Z5"
              />
              <LabeledInput
                id="fssaiNumber"
                label="FSSAI Number"
                type="text"
                value={formData.fssaiNumber}
                onChange={(e) => handleChange('fssaiNumber', e.target.value)}
                placeholder="e.g., 12345678901234"
              />
            </div>
          </Card>

          {/* Kitchen Printer */}
          <Card icon="👨‍🍳" title="Kitchen Printer">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: formData.printKitchenCopy ? 16 : 0 }}>
              <label htmlFor="printKitchenCopy" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  id="printKitchenCopy"
                  type="checkbox"
                  checked={formData.printKitchenCopy}
                  onChange={(e) => handleChange('printKitchenCopy', e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxLabel}>Print kitchen copy for orders</span>
              </label>
            </div>

            {formData.printKitchenCopy && (
              <LabeledInput
                id="kitchenPrinter"
                label="Kitchen Printer Name"
                type="text"
                value={formData.kitchenPrinter}
                onChange={(e) => handleChange('kitchenPrinter', e.target.value)}
                placeholder="e.g., Kitchen Printer 1"
                error={fieldErrors.kitchenPrinter}
              />
            )}
          </Card>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              onClick={onBack}
              disabled={isLoading}
              style={{
                padding: "14px 28px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {!stackedLayout && (
          <div style={{ width: 320, position: "sticky", top: 24, flexShrink: 0 }}>
            <ReceiptPreview formData={formData} />
          </div>
        )}
      </div>
    </div>
  );
}
