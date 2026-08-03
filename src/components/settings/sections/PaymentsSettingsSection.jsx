import React from 'react';
// Payments Settings Section - Payment Methods and Configuration
// Premium payment management

import { useCallback } from "react";

export default function PaymentsSettingsSection({ settings, onUpdate, isMobile }) {
  // Fully controlled — no local state. All reads from settings, all writes via onUpdate.
  const handleChange = useCallback((field, value) => {
    onUpdate({ [field]: value });
  }, [onUpdate]);

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: "💵", description: "Physical cash payments" },
    { id: "upi", name: "UPI", icon: "📱", description: "UPI QR code payments" },
    { id: "card", name: "Card", icon: "💳", description: "Credit/Debit cards" },
    { id: "online", name: "Online", icon: "🌐", description: "Online payment gateways" },
    { id: "split", name: "Split Payment", icon: "🔀", description: "Split bills between methods" },
    { id: "cod", name: "COD", icon: "📦", description: "Cash on delivery" },
    { id: "gift", name: "Gift Card", icon: "🎁", description: "Gift card payments" }
  ];

  const enabledCount = paymentMethods.filter(pm => {
    if (pm.id === "cash") return settings.cashEnabled;
    if (pm.id === "upi") return settings.upiEnabled;
    if (pm.id === "card") return settings.cardEnabled;
    if (pm.id === "online") return settings.onlineEnabled;
    if (pm.id === "split") return settings.splitPaymentEnabled;
    if (pm.id === "cod") return settings.codEnabled;
    if (pm.id === "gift") return settings.giftCardEnabled;
    return false;
  }).length;

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
          Payments
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure payment methods and transaction behavior
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Payment Methods */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Payment Methods
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {paymentMethods.map((method, idx) => (
              <label
                key={method.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: idx < paymentMethods.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--cafe-bg-surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    (method.id === "cash" && settings.cashEnabled) ||
                    (method.id === "upi" && settings.upiEnabled) ||
                    (method.id === "card" && settings.cardEnabled) ||
                    (method.id === "online" && settings.onlineEnabled) ||
                    (method.id === "split" && settings.splitPaymentEnabled) ||
                    (method.id === "cod" && settings.codEnabled) ||
                    (method.id === "gift" && settings.giftCardEnabled)
                  }
                  onChange={(e) => {
                    if (method.id === "cash") handleChange('cashEnabled', e.target.checked);
                    if (method.id === "upi") handleChange('upiEnabled', e.target.checked);
                    if (method.id === "card") handleChange('cardEnabled', e.target.checked);
                    if (method.id === "online") handleChange('onlineEnabled', e.target.checked);
                    if (method.id === "split") handleChange('splitPaymentEnabled', e.target.checked);
                    if (method.id === "cod") handleChange('codEnabled', e.target.checked);
                    if (method.id === "gift") handleChange('giftCardEnabled', e.target.checked);
                  }}
                  style={{ margin: 0, width: 18, height: 18 }}
                />
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
                  {method.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {method.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {method.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--cafe-text-secondary)" }}>
            <strong>{enabledCount}</strong> payment methods enabled
          </div>
        </div>

        {/* Default Payment */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Default Payment Method
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["cash", "upi", "card"].map((method) => (
                <label key={method} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="defaultPayment"
                    value={method}
                    checked={settings.defaultPaymentMethod === method}
                    onChange={(e) => handleChange('defaultPaymentMethod', e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: 14, color: "var(--cafe-text-primary)", textTransform: "capitalize" }}>
                    {method}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Preferences */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Transaction Preferences
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
                  checked={settings.allowPartialPayment}
                  onChange={(e) => handleChange('allowPartialPayment', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Allow Partial Payments
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Customers can pay in multiple installments
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.requirePaymentBeforeCompletion}
                  onChange={(e) => handleChange('requirePaymentBeforeCompletion', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Payment Before Completion
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Orders cannot be completed without payment
                  </div>
                </div>
              </label>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  Cash Rounding
                </div>
                <select
                  value={settings.cashRounding}
                  onChange={(e) => handleChange('cashRounding', e.target.value)}
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
                  <option value="nearest">Round to nearest</option>
                  <option value="up">Always round up</option>
                  <option value="down">Always round down</option>
                  <option value="none">No rounding</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Behaviour */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Receipt Behaviour
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
                  checked={settings.autoPrintReceipt}
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
                  checked={settings.requireSignature}
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
                  checked={settings.enableTips}
                  onChange={(e) => handleChange('enableTips', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Tips
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow customers to add tips
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Refund Behaviour */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Refund Behaviour
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  Refund Permissions
                </div>
                <select
                  value={settings.refundPermissions}
                  onChange={(e) => handleChange('refundPermissions', e.target.value)}
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
                  <option value="anyone">Anyone can refund</option>
                  <option value="manager">Manager only</option>
                  <option value="owner">Owner only</option>
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.requireRefundReason}
                  onChange={(e) => handleChange('requireRefundReason', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Refund Reason
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require reason for all refunds
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — changes auto-save via onUpdate, just show status */}
      <div style={{
        padding: isMobile ? "16px 20px" : "20px 32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
          Changes are saved automatically
        </span>
        {enabledCount === 0 && (
          <span style={{ fontSize: 12, color: "var(--cafe-danger)", fontWeight: 600 }}>
            ⚠️ At least one payment method must be enabled
          </span>
        )}
      </div>
    </div>
  );
}
