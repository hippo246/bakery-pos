import React from 'react';
// Receipts & Printing Settings Section - Receipt Layout and Routing
// Premium receipt and printing configuration

import { useState, useCallback } from "react";

export default function ReceiptsPrintingSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    receiptLayout: settings?.receiptLayout || "standard",
    showHeader: settings?.showHeader !== false,
    showFooter: settings?.showFooter !== false,
    showQRCode: settings?.showQRCode || false,
    showOrderNumber: settings?.showOrderNumber !== false,
    showDateTime: settings?.showDateTime !== false,
    showCashier: settings?.showCashier !== false,
    showTable: settings?.showTable !== false,
    showCustomer: settings?.showCustomer || false,
    showPaymentMethod: settings?.showPaymentMethod !== false,
    showTaxBreakdown: settings?.showTaxBreakdown !== false,
    taxDisplay: settings?.taxDisplay || "summary",
    receiptPrinter: settings?.receiptPrinter || "default",
    kitchenPrinterRouting: settings?.kitchenPrinterRouting || "auto",
    autoPrintReceipt: settings?.autoPrintReceipt || false,
    printKitchenTicket: settings?.printKitchenTicket || false,
    requireSignature: settings?.requireSignature || false,
    enableTips: settings?.enableTips || false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const receiptLayouts = [
    { id: "standard", name: "Standard", description: "Classic receipt layout" },
    { id: "compact", name: "Compact", description: "Minimal information" },
    { id: "detailed", name: "Detailed", description: "Full item details" }
  ];

  const taxDisplays = [
    { id: "summary", name: "Summary Only" },
    { id: "breakdown", name: "Full Breakdown" },
    { id: "none", name: "No Tax Display" }
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Receipts & Printing
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure receipt layout, printer routing, and printing behavior
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Receipt Layout */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Receipt Layout
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Receipt Template
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {receiptLayouts.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => handleChange('receiptLayout', layout.id)}
                      style={{
                        padding: "16px",
                        background: formData.receiptLayout === layout.id ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                        border: formData.receiptLayout === layout.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: formData.receiptLayout === layout.id ? "#fff" : "var(--cafe-text-primary)",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>🧾</div>
                      <div>{layout.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.showHeader}
                    onChange={(e) => handleChange('showHeader', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Show Header
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.showFooter}
                    onChange={(e) => handleChange('showFooter', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Show Footer
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.showQRCode}
                    onChange={(e) => handleChange('showQRCode', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Show QR Code
                    </div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.showTaxBreakdown}
                    onChange={(e) => handleChange('showTaxBreakdown', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Show Tax Breakdown
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Information */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Receipt Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showOrderNumber}
                  onChange={(e) => handleChange('showOrderNumber', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Order Number
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showDateTime}
                  onChange={(e) => handleChange('showDateTime', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Date & Time
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showCashier}
                  onChange={(e) => handleChange('showCashier', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Cashier Name
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showTable}
                  onChange={(e) => handleChange('showTable', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Table Number
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showCustomer}
                  onChange={(e) => handleChange('showCustomer', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Customer Name
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showPaymentMethod}
                  onChange={(e) => handleChange('showPaymentMethod', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Payment Method
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Tax Display */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Tax Display
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Tax Information Display
              </label>
              <select
                value={formData.taxDisplay}
                onChange={(e) => handleChange('taxDisplay', e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  background: "var(--cafe-bg-surface)",
                  color: "var(--cafe-text-primary)"
                }}
              >
                {taxDisplays.map(td => (
                  <option key={td.id} value={td.id}>{td.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Printer Assignment */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Printer Assignment
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Default Receipt Printer
                </label>
                <select
                  value={formData.receiptPrinter}
                  onChange={(e) => handleChange('receiptPrinter', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)"
                  }}
                >
                  <option value="default">Default System Printer</option>
                  <option value="thermal1">Thermal Printer 1</option>
                  <option value="thermal2">Thermal Printer 2</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Kitchen Printer Routing
                </label>
                <select
                  value={formData.kitchenPrinterRouting}
                  onChange={(e) => handleChange('kitchenPrinterRouting', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)"
                  }}
                >
                  <option value="auto">Auto Route by Category</option>
                  <option value="manual">Manual Assignment</option>
                  <option value="all">Print to All Kitchen Printers</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Printing Behavior */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Printing Behavior
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoPrintReceipt}
                  onChange={(e) => handleChange('autoPrintReceipt', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Print Receipt
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically print receipt after payment
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.printKitchenTicket}
                  onChange={(e) => handleChange('printKitchenTicket', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Print Kitchen Ticket
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Print kitchen ticket with every order
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireSignature}
                  onChange={(e) => handleChange('requireSignature', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Signature
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require customer signature for card payments
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.enableTips}
                  onChange={(e) => handleChange('enableTips', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Tips
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow customers to add tips on receipt
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <button
          style={{
            padding: "12px 24px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: "pointer"
          }}
        >
          Test Print
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
