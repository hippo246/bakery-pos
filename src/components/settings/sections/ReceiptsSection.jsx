import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function ReceiptsSection({ settings, setSettings, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Receipt Content */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Receipt Content
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Header Text</label>
            <input
              type="text"
              value={settings.receiptHeader || ""}
              onChange={e => setSettings("receiptHeader", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="Welcome to our cafe!"
            />
          </div>
          
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Footer Text</label>
            <input
              type="text"
              value={settings.receiptFooter || "Thank you for visiting!"}
              onChange={e => setSettings("receiptFooter", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="Thank you for visiting!"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Receipt Display Options */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Display Options
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Order Number
              </div>
            </div>
            <PremiumToggle
              value={settings.showOrderNumber}
              onChange={(enabled) => setSettings("showOrderNumber", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Date & Time
              </div>
            </div>
            <PremiumToggle
              value={settings.showDateTime}
              onChange={(enabled) => setSettings("showDateTime", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Cashier
              </div>
            </div>
            <PremiumToggle
              value={settings.showCashier}
              onChange={(enabled) => setSettings("showCashier", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Table
              </div>
            </div>
            <PremiumToggle
              value={settings.showTable}
              onChange={(enabled) => setSettings("showTable", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Customer
              </div>
            </div>
            <PremiumToggle
              value={settings.showCustomer}
              onChange={(enabled) => setSettings("showCustomer", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Payment Method
              </div>
            </div>
            <PremiumToggle
              value={settings.showPaymentMethod}
              onChange={(enabled) => setSettings("showPaymentMethod", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Tax Breakdown
              </div>
            </div>
            <PremiumToggle
              value={settings.showTaxBreakdown}
              onChange={(enabled) => setSettings("showTaxBreakdown", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Item Notes
              </div>
            </div>
            <PremiumToggle
              value={settings.showItemNotes}
              onChange={(enabled) => setSettings("showItemNotes", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show GST Number
              </div>
            </div>
            <PremiumToggle
              value={settings.showGstNumber}
              onChange={(enabled) => setSettings("showGstNumber", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show FSSAI Number
              </div>
            </div>
            <PremiumToggle
              value={settings.showFssaiNumber}
              onChange={(enabled) => setSettings("showFssaiNumber", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show QR Code
              </div>
            </div>
            <PremiumToggle
              value={settings.showQrCode}
              onChange={(enabled) => setSettings("showQrCode", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Show Thank You Message
              </div>
            </div>
            <PremiumToggle
              value={settings.showThankYou}
              onChange={(enabled) => setSettings("showThankYou", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Printer Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Printer Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Printer Type</label>
            <select
              value={settings.printerType || "thermal"}
              onChange={e => setSettings("printerType", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="thermal">Thermal Printer</option>
              <option value="inkjet">Inkjet Printer</option>
              <option value="laser">Laser Printer</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Paper Width (mm)</label>
            <select
              value={settings.paperWidth || 80}
              onChange={e => setSettings("paperWidth", parseInt(e.target.value))}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="58">58mm</option>
              <option value="80">80mm</option>
              <option value="112">112mm</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Number of Copies</label>
            <input
              type="number"
              value={settings.copies || 1}
              onChange={e => setSettings("copies", parseInt(e.target.value) || 1)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="1"
              max="5"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24 }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 4 }}>Auto Cut Paper</label>
              <p style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)",
                margin: 0
              }}>
                Automatically cut after printing
              </p>
            </div>
            <PremiumToggle
              value={settings.autoCut}
              onChange={(enabled) => setSettings("autoCut", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Receipt Preview */}
      <PremiumCard style={{
        background: "var(--cafe-bg-elevated)",
        border: "1px solid var(--cafe-border)"
      }}>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 16,
          marginTop: 0
        }}>
          Receipt Preview
        </h4>
        
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 11,
          color: "#000",
          maxWidth: 320,
          margin: "0 auto"
        }}>
          {settings.receiptHeader && (
            <div style={{ textAlign: "center", marginBottom: 12, fontWeight: "bold" }}>
              {settings.receiptHeader}
            </div>
          )}
          
          <div style={{ textAlign: "center", marginBottom: 12, fontWeight: "bold" }}>
            {settings.cafeName || "My Cafe"}
          </div>
          
          {settings.receiptAddress && (
            <div style={{ textAlign: "center", marginBottom: 8, fontSize: 10 }}>
              {settings.receiptAddress}
            </div>
          )}
          
          {settings.showOrderNumber && (
            <div style={{ marginBottom: 8 }}>
              Order #: ORD-001
            </div>
          )}
          
          {settings.showDateTime && (
            <div style={{ marginBottom: 8 }}>
              {new Date().toLocaleString()}
            </div>
          )}
          
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          
          <div style={{ marginBottom: 8 }}>
            <div>Item 1 x 2</div>
            <div>Item 2 x 1</div>
          </div>
          
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Subtotal</span>
            <span>₹500.00</span>
          </div>
          
          {settings.showTaxBreakdown && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>GST (18%)</span>
              <span>₹90.00</span>
            </div>
          )}
          
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: 8 }}>
            <span>TOTAL</span>
            <span>₹590.00</span>
          </div>
          
          {settings.showPaymentMethod && (
            <div style={{ marginTop: 8 }}>
              Paid via: Cash
            </div>
          )}
          
          {settings.showCashier && (
            <div style={{ marginTop: 4 }}>
              Cashier: Staff
            </div>
          )}
          
          {settings.showTable && (
            <div style={{ marginTop: 4 }}>
              Table: T1
            </div>
          )}
          
          {settings.showGstNumber && settings.gstin && (
            <div style={{ marginTop: 8, fontSize: 10 }}>
              GSTIN: {settings.gstin}
            </div>
          )}
          
          {settings.showFssaiNumber && settings.fssaiNumber && (
            <div style={{ marginTop: 4, fontSize: 10 }}>
              FSSAI: {settings.fssaiNumber}
            </div>
          )}
          
          {settings.showThankYou && (
            <div style={{ textAlign: "center", marginTop: 12, fontWeight: "bold" }}>
              {settings.receiptFooter || "Thank you for visiting!"}
            </div>
          )}
          
          {settings.showQrCode && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <div style={{
                width: 60,
                height: 60,
                background: "#000",
                margin: "0 auto"
              }} />
            </div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
