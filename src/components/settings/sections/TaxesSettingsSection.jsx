import React from 'react';
// Taxes Settings Section - GST and Service Charge with Live Receipt Preview
// Premium tax configuration

import { useState, useCallback } from "react";

export default function TaxesSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    gstEnabled: settings?.gstEnabled !== false,
    gstin: settings?.gstin || "",
    taxLabel: settings?.taxLabel || "GST",
    taxRate: settings?.taxRate || 18,
    taxBehavior: settings?.taxBehavior || "inclusive",
    cgstSgstSplit: settings?.cgstSgstSplit !== false,
    serviceCharge: settings?.serviceCharge || 0,
    serviceChargeTaxBehavior: settings?.serviceChargeTaxBehavior || "exclusive",
    fssaiNumber: settings?.fssaiNumber || "",
    invoicePrefix: settings?.invoicePrefix || "INV",
    financialYear: settings?.financialYear || "2024-2025"
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const calculateTax = (subtotal) => {
    const gstAmount = formData.gstEnabled ? (subtotal * formData.taxRate / 100) : 0;
    const serviceChargeAmount = subtotal * formData.serviceCharge / 100;
    const total = subtotal + gstAmount + serviceChargeAmount;
    
    return {
      subtotal,
      gstAmount,
      serviceChargeAmount,
      total
    };
  };

  const sampleOrder = calculateTax(500);

  const receiptPreview = {
    businessName: settings?.cafeName || "Your Cafe",
    gstin: formData.gstin,
    fssai: formData.fssaiNumber,
    taxLabel: formData.taxLabel,
    taxRate: formData.taxRate,
    taxBehavior: formData.taxBehavior,
    serviceCharge: formData.serviceCharge,
    serviceChargeTaxBehavior: formData.serviceChargeTaxBehavior,
    cgstSgstSplit: formData.cgstSgstSplit
  };

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
          Taxes
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure GST, service charge, and tax compliance
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
          {/* Form */}
          <div>
            {/* GST Configuration */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                GST Configuration
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.gstEnabled}
                    onChange={(e) => handleChange('gstEnabled', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Enable GST
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                      Apply GST to all taxable items
                    </div>
                  </div>
                </label>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Tax Label
                  </label>
                  <input
                    type="text"
                    value={formData.taxLabel}
                    onChange={(e) => handleChange('taxLabel', e.target.value)}
                    placeholder="GST"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.5"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Tax Behavior
                  </label>
                  <select
                    value={formData.taxBehavior}
                    onChange={(e) => handleChange('taxBehavior', e.target.value)}
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
                    <option value="inclusive">Inclusive (tax included in price)</option>
                    <option value="exclusive">Exclusive (tax added to price)</option>
                  </select>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.cgstSgstSplit}
                    onChange={(e) => handleChange('cgstSgstSplit', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      Split CGST/SGST
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                      Show CGST and SGST separately on receipts
                    </div>
                  </div>
                </label>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      textTransform: "uppercase"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Service Charge */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Service Charge
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Service Charge Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.serviceCharge}
                    onChange={(e) => handleChange('serviceCharge', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="30"
                    step="0.5"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Service Charge Tax Behavior
                  </label>
                  <select
                    value={formData.serviceChargeTaxBehavior}
                    onChange={(e) => handleChange('serviceChargeTaxBehavior', e.target.value)}
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
                    <option value="exclusive">Exclusive (taxable)</option>
                    <option value="inclusive">Inclusive (non-taxable)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Compliance
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiNumber}
                    onChange={(e) => handleChange('fssaiNumber', e.target.value)}
                    placeholder="10012345678987"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                      placeholder="INV"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      Financial Year
                    </label>
                    <input
                      type="text"
                      value={formData.financialYear}
                      onChange={(e) => handleChange('financialYear', e.target.value)}
                      placeholder="2024-2025"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              margin: "0 0 16px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Receipt Preview
            </h3>
            <div style={{
              background: "#fff",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              fontFamily: "monospace",
              fontSize: 13,
              color: "#333",
              position: "sticky",
              top: 0
            }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {receiptPreview.businessName}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  Sample Order Receipt
                </div>
              </div>
              
              <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Sample Item x 1</span>
                  <span>₹250.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Another Item x 1</span>
                  <span>₹250.00</span>
                </div>
              </div>

              <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Subtotal</span>
                <span>₹{sampleOrder.subtotal.toFixed(2)}</span>
              </div>

              {receiptPreview.serviceCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Service Charge ({receiptPreview.serviceCharge}%)</span>
                  <span>₹{sampleOrder.serviceChargeAmount.toFixed(2)}</span>
                </div>
              )}

              {receiptPreview.gstEnabled && (
                <>
                  {receiptPreview.cgstSgstSplit ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>CGST ({receiptPreview.taxRate / 2}%)</span>
                        <span>₹{(sampleOrder.gstAmount / 2).toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>SGST ({receiptPreview.taxRate / 2}%)</span>
                        <span>₹{(sampleOrder.gstAmount / 2).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{receiptPreview.taxLabel} ({receiptPreview.taxRate}%)</span>
                      <span>₹{sampleOrder.gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
                <span>TOTAL</span>
                <span>₹{sampleOrder.total.toFixed(2)}</span>
              </div>

              {receiptPreview.gstin && (
                <div style={{ marginTop: 16, fontSize: 10, color: "#666", textAlign: "center" }}>
                  GSTIN: {receiptPreview.gstin}
                </div>
              )}
              {receiptPreview.fssai && (
                <div style={{ marginTop: 4, fontSize: 10, color: "#666", textAlign: "center" }}>
                  FSSAI: {receiptPreview.fssai}
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 11, color: "#666", textAlign: "center" }}>
                Thank you for visiting!
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: 16,
              background: "var(--cafe-info-bg)",
              border: "1px solid var(--cafe-info-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--cafe-info)"
            }}>
              <strong>💡 Tip:</strong> This preview shows how taxes will appear on customer receipts. Changes update instantly.
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
