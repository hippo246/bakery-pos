import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function PaymentsSection({ settings, setSettings, isMobile }) {
  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: "💵",
      description: "Physical cash payments",
      enabled: settings.cashEnabled,
      priority: 1
    },
    {
      id: "upi",
      name: "UPI",
      icon: "📱",
      description: "Unified Payments Interface",
      enabled: settings.upiEnabled,
      priority: 2
    },
    {
      id: "card",
      name: "Card",
      icon: "💳",
      description: "Credit/Debit cards",
      enabled: settings.cardEnabled,
      priority: 3
    },
    {
      id: "online",
      name: "Online",
      icon: "🌐",
      description: "Online payment gateways",
      enabled: settings.onlineEnabled,
      priority: 4
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "📦",
      description: "Pay upon delivery",
      enabled: settings.codEnabled,
      priority: 5
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Payment Methods Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 16
      }}>
        {paymentMethods.map(method => (
          <PremiumCard
            key={method.id}
            hover
            style={{
              cursor: "pointer",
              borderColor: method.enabled ? "var(--cafe-accent)" : "var(--cafe-border-light)",
              background: method.enabled ? "var(--cafe-accent-bg)" : "var(--cafe-bg-card)"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{method.icon}</span>
                <div>
                  <h4 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    margin: 0,
                    marginBottom: 2
                  }}>
                    {method.name}
                  </h4>
                  <p style={{
                    fontSize: 11,
                    color: "var(--cafe-text-tertiary)",
                    margin: 0
                  }}>
                    {method.description}
                  </p>
                </div>
              </div>
              <PremiumToggle
                value={method.enabled}
                onChange={(enabled) => {
                  const key = `${method.id}Enabled`;
                  setSettings(key, enabled);
                }}
                size="small"
              />
            </div>
            
            <div style={{
              display: "flex",
              gap: 8,
              fontSize: 10,
              color: "var(--cafe-text-tertiary)"
            }}>
              <span style={{
                padding: "2px 8px",
                background: "var(--cafe-bg-surface)",
                borderRadius: 4,
                border: "1px solid var(--cafe-border-light)"
              }}>
                Priority: {method.priority}
              </span>
              <span style={{
                padding: "2px 8px",
                background: "var(--cafe-bg-surface)",
                borderRadius: 4,
                border: "1px solid var(--cafe-border-light)"
              }}>
                {method.enabled ? "Active" : "Inactive"}
              </span>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Payment Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Payment Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Default Payment Method</label>
            <select
              value={settings.defaultPaymentMethod || "cash"}
              onChange={e => setSettings("defaultPaymentMethod", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Cash Rounding</label>
            <select
              value={settings.cashRounding || "nearest"}
              onChange={e => setSettings("cashRounding", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="nearest">Nearest</option>
              <option value="up">Round Up</option>
              <option value="down">Round Down</option>
              <option value="none">No Rounding</option>
            </select>
          </div>
        </div>
      </PremiumCard>

      {/* Split Payments */}
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
              Enable Split Payments
            </h4>
            <p style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              margin: 0
            }}>
              Allow customers to split bills across multiple payment methods
            </p>
          </div>
          <PremiumToggle
            value={settings.splitPaymentEnabled}
            onChange={(enabled) => setSettings("splitPaymentEnabled", enabled)}
          />
        </div>
      </PremiumCard>

      {/* Partial Payments */}
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
              Allow Partial Payments
            </h4>
            <p style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              margin: 0
            }}>
              Enable customers to pay partial amounts with remaining balance
            </p>
          </div>
          <PremiumToggle
            value={settings.allowPartialPayment}
            onChange={(enabled) => setSettings("allowPartialPayment", enabled)}
          />
        </div>
      </PremiumCard>

      {/* Refund Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Refund Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Refund Permissions</label>
            <select
              value={settings.refundPermissions || "manager"}
              onChange={e => setSettings("refundPermissions", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="owner">Owner Only</option>
              <option value="manager">Manager & Above</option>
              <option value="cashier">All Staff</option>
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24 }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 4 }}>Require Refund Reason</label>
              <p style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)",
                margin: 0
              }}>
                Ask for reason when processing refunds
              </p>
            </div>
            <PremiumToggle
              value={settings.requireRefundReason}
              onChange={(enabled) => setSettings("requireRefundReason", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
