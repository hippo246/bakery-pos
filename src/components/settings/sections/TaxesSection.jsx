import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function TaxesSection({ settings, setSettings, isMobile }) {
  // Calculate sample tax for preview
  const calculateTax = (amount) => {
    if (!settings.gstEnabled) return { tax: 0, total: amount };
    const rate = settings.taxRate || 18;
    const tax = settings.taxBehavior === "inclusive" 
      ? (amount * rate) / (100 + rate)
      : (amount * rate) / 100;
    const total = settings.taxBehavior === "inclusive" 
      ? amount 
      : amount + tax;
    return { tax, total };
  };

  const sampleAmount = 1000;
  const { tax, total } = calculateTax(sampleAmount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Tax Configuration */}
      <PremiumCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h4 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 4,
              marginTop: 0
            }}>
              Enable GST
            </h4>
            <p style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              margin: 0
            }}>
              Apply Goods and Services Tax to orders
            </p>
          </div>
          <PremiumToggle
            value={settings.gstEnabled}
            onChange={(enabled) => setSettings("gstEnabled", enabled)}
          />
        </div>

        {settings.gstEnabled && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>GST Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate || 18}
                onChange={e => setSettings("taxRate", parseFloat(e.target.value) || 0)}
                style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
                min="0"
                max="100"
                step="0.5"
              />
            </div>
            
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Tax Behavior</label>
              <select
                value={settings.taxBehavior || "inclusive"}
                onChange={e => setSettings("taxBehavior", e.target.value)}
                style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              >
                <option value="inclusive">Inclusive (Tax included in price)</option>
                <option value="exclusive">Exclusive (Tax added to price)</option>
              </select>
            </div>
          </div>
        )}
      </PremiumCard>

      {/* CGST/SGST Split */}
      {settings.gstEnabled && (
        <PremiumCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h4 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-primary)",
                marginBottom: 4,
                marginTop: 0
              }}>
                Split CGST & SGST
              </h4>
              <p style={{
                fontSize: 11,
                color: "var(--cafe-text-tertiary)",
                margin: 0
              }}>
                Show tax as separate CGST and SGST components
              </p>
            </div>
            <PremiumToggle
              value={settings.cgstSgstSplit}
              onChange={(enabled) => setSettings("cgstSgstSplit", enabled)}
            />
          </div>
        </PremiumCard>
      )}

      {/* Service Charge */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Service Charge
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Service Charge Rate (%)</label>
            <input
              type="number"
              value={settings.serviceCharge || 0}
              onChange={e => setSettings("serviceCharge", parseFloat(e.target.value) || 0)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="30"
              step="0.5"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Tax Behavior</label>
            <select
              value={settings.serviceChargeTaxBehavior || "exclusive"}
              onChange={e => setSettings("serviceChargeTaxBehavior", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="inclusive">Inclusive</option>
              <option value="exclusive">Exclusive</option>
            </select>
          </div>
        </div>
      </PremiumCard>

      {/* Invoice Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Invoice Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoicePrefix || "INV"}
              onChange={e => setSettings("invoicePrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="INV"
              maxLength={10}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Financial Year</label>
            <input
              type="text"
              value={settings.financialYear || "2024-2025"}
              onChange={e => setSettings("financialYear", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="2024-2025"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Live Tax Calculator Preview */}
      <PremiumCard style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-card) 100%)",
        border: "1px solid var(--cafe-accent-border)"
      }}>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 16,
          marginTop: 0
        }}>
          Tax Calculator Preview
        </h4>
        
        <div style={{
          background: "var(--cafe-bg-card)",
          borderRadius: 8,
          padding: 16,
          border: "1px solid var(--cafe-border-light)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: "var(--cafe-text-secondary)" }}>Subtotal</span>
            <span style={{ color: "var(--cafe-text-primary)", fontWeight: 500 }}>₹{sampleAmount.toFixed(2)}</span>
          </div>
          
          {settings.gstEnabled && (
            <>
              {settings.cgstSgstSplit ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: "var(--cafe-text-secondary)" }}>CGST ({(settings.taxRate / 2).toFixed(1)}%)</span>
                    <span style={{ color: "var(--cafe-text-primary)", fontWeight: 500 }}>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--cafe-text-secondary)" }}>SGST ({(settings.taxRate / 2).toFixed(1)}%)</span>
                    <span style={{ color: "var(--cafe-text-primary)", fontWeight: 500 }}>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: "var(--cafe-text-secondary)" }}>GST ({settings.taxRate}%)</span>
                  <span style={{ color: "var(--cafe-text-primary)", fontWeight: 500 }}>₹{tax.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          
          {settings.serviceCharge > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: "var(--cafe-text-secondary)" }}>Service Charge ({settings.serviceCharge}%)</span>
              <span style={{ color: "var(--cafe-text-primary)", fontWeight: 500 }}>₹{(sampleAmount * settings.serviceCharge / 100).toFixed(2)}</span>
            </div>
          )}
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid var(--cafe-border)",
            fontSize: 13,
            fontWeight: 600
          }}>
            <span style={{ color: "var(--cafe-text-primary)" }}>Total</span>
            <span style={{ color: "var(--cafe-accent)" }}>₹{total.toFixed(2)}</span>
          </div>
        </div>
        
        <p style={{
          fontSize: 10,
          color: "var(--cafe-text-tertiary)",
          margin: "12px 0 0 0",
          fontStyle: "italic"
        }}>
          * Preview based on ₹{sampleAmount} subtotal
        </p>
      </PremiumCard>
    </div>
  );
}
