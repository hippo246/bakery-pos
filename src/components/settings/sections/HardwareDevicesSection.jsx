import React from 'react';
// Hardware & Devices Settings Section - Printers, Displays, and Peripherals
// Premium device management with connection status

import { useState, useCallback } from "react";

export default function HardwareDevicesSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    receiptPrinters: settings?.receiptPrinters || [],
    kitchenPrinters: settings?.kitchenPrinters || [],
    kitchenDisplays: settings?.kitchenDisplays || [],
    customerDisplays: settings?.customerDisplays || [],
    barcodeScanner: settings?.barcodeScanner || { enabled: false, model: "" },
    cashDrawer: settings?.cashDrawer || { enabled: false, model: "" }
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const deviceStatus = (device) => {
    if (!device || !device.enabled) return { status: "disabled", color: "#6b7280", label: "Disabled" };
    if (device.connected) return { status: "connected", color: "#10b981", label: "Connected" };
    return { status: "disconnected", color: "#f59e0b", label: "Disconnected" };
  };

  const addReceiptPrinter = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      receiptPrinters: [
        ...prev.receiptPrinters,
        { id: Date.now(), name: "New Printer", model: "", connected: false, paperWidth: 80 }
      ]
    }));
  }, []);

  const addKitchenPrinter = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      kitchenPrinters: [
        ...prev.kitchenPrinters,
        { id: Date.now(), name: "New Kitchen Printer", model: "", connected: false, station: "main" }
      ]
    }));
  }, []);

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
          Hardware & Devices
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Manage printers, displays, and connected peripherals
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Receipt Printers */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Receipt Printers
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            {formData.receiptPrinters.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--cafe-text-tertiary)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🖨️</div>
                <div style={{ fontSize: 14 }}>No receipt printers configured</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {formData.receiptPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    style={{
                      padding: 16,
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 16
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>
                      🖨️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {printer.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        {printer.model || "No model specified"} • {printer.paperWidth}mm
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${deviceStatus(printer).color}20`,
                      color: deviceStatus(printer).color
                    }}>
                      {deviceStatus(printer).label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addReceiptPrinter}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                background: "var(--cafe-bg-surface)",
                border: "1px dashed var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              + Add Receipt Printer
            </button>
          </div>
        </div>

        {/* Kitchen Printers */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Kitchen Printers
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            {formData.kitchenPrinters.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--cafe-text-tertiary)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🍳</div>
                <div style={{ fontSize: 14 }}>No kitchen printers configured</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {formData.kitchenPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    style={{
                      padding: 16,
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 16
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>
                      👨‍🍳
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {printer.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        {printer.model || "No model specified"} • {printer.station}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${deviceStatus(printer).color}20`,
                      color: deviceStatus(printer).color
                    }}>
                      {deviceStatus(printer).label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addKitchenPrinter}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                background: "var(--cafe-bg-surface)",
                border: "1px dashed var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              + Add Kitchen Printer
            </button>
          </div>
        </div>

        {/* Kitchen Displays */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Kitchen Displays (KDS)
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            {formData.kitchenDisplays.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--cafe-text-tertiary)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📺</div>
                <div style={{ fontSize: 14 }}>No kitchen displays configured</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {formData.kitchenDisplays.map((display) => (
                  <div
                    key={display.id}
                    style={{
                      padding: 16,
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 16
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>
                      📺
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {display.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        {display.station || "Main Station"}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${deviceStatus(display).color}20`,
                      color: deviceStatus(display).color
                    }}>
                      {deviceStatus(display).label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                background: "var(--cafe-bg-surface)",
                border: "1px dashed var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              + Add Kitchen Display
            </button>
          </div>
        </div>

        {/* Peripherals */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Peripherals
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Barcode Scanner */}
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.barcodeScanner?.enabled || false}
                  onChange={(e) => handleChange('barcodeScanner', { ...formData.barcodeScanner, enabled: e.target.checked })}
                  style={{ margin: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Barcode Scanner
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Enable barcode scanning for quick item lookup
                  </div>
                </div>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${deviceStatus(formData.barcodeScanner).color}20`,
                  color: deviceStatus(formData.barcodeScanner).color
                }}>
                  {deviceStatus(formData.barcodeScanner).label}
                </div>
              </label>

              {/* Cash Drawer */}
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.cashDrawer?.enabled || false}
                  onChange={(e) => handleChange('cashDrawer', { ...formData.cashDrawer, enabled: e.target.checked })}
                  style={{ margin: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Cash Drawer
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Enable cash drawer integration
                  </div>
                </div>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${deviceStatus(formData.cashDrawer).color}20`,
                  color: deviceStatus(formData.cashDrawer).color
                }}>
                  {deviceStatus(formData.cashDrawer).label}
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
        justifyContent: "flex-end"
      }}>
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
