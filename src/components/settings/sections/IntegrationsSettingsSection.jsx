import React from 'react';
// Integrations Settings Section - Placeholder Integrations
import { useState, useCallback } from "react";

export default function IntegrationsSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    paymentProviders: settings?.paymentProviders || {},
    whatsappEnabled: settings?.whatsappEnabled || false,
    whatsappApiKey: settings?.whatsappApiKey || "",
    emailEnabled: settings?.emailEnabled || false,
    emailProvider: settings?.emailProvider || "none",
    accountingEnabled: settings?.accountingEnabled || false,
    accountingProvider: settings?.accountingProvider || "none",
    terminalEnabled: settings?.terminalEnabled || false,
    terminalProvider: settings?.terminalProvider || "none",
    deliveryPlatforms: settings?.deliveryPlatforms || {}
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const integrations = [
    {
      id: "payment",
      name: "Payment Providers",
      icon: "💳",
      description: "Razorpay, Stripe, PhonePe, GPay",
      enabled: false,
      comingSoon: true
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "📱",
      description: "Send order updates via WhatsApp",
      enabled: formData.whatsappEnabled,
      comingSoon: false
    },
    {
      id: "email",
      name: "Email",
      icon: "📧",
      description: "Send receipts and invoices via email",
      enabled: formData.emailEnabled,
      comingSoon: false
    },
    {
      id: "accounting",
      name: "Accounting",
      icon: "📊",
      description: "Sync with Tally, Zoho Books",
      enabled: formData.accountingEnabled,
      comingSoon: true
    },
    {
      id: "terminal",
      name: "Terminal Integrations",
      icon: "🖥️",
      description: "POS terminal integration",
      enabled: formData.terminalEnabled,
      comingSoon: true
    },
    {
      id: "delivery",
      name: "Delivery Platforms",
      icon: "🚴",
      description: "Swiggy, Zomato, Dunzo",
      enabled: false,
      comingSoon: true
    }
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "28px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--cafe-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Integrations</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0, fontWeight: 500 }}>Connect third-party services and platforms</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Integrations</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            {integrations.map(integration => (
              <div key={integration.id} style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24, position: "relative", transition: "all 0.2s" }} onMouseOver={e => { if (!integration.comingSoon) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }} onMouseOut={e => { if (!integration.comingSoon) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
                {integration.comingSoon && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>Coming Soon</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 32 }}>{integration.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{integration.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>{integration.description}</div>
                  </div>
                </div>
                <button
                  disabled={integration.comingSoon}
                  onClick={() => {
                    if (integration.id === "whatsapp") handleChange('whatsappEnabled', !formData.whatsappEnabled);
                    if (integration.id === "email") handleChange('emailEnabled', !formData.emailEnabled);
                    if (integration.id === "accounting") handleChange('accountingEnabled', !formData.accountingEnabled);
                    if (integration.id === "terminal") handleChange('terminalEnabled', !formData.terminalEnabled);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: integration.comingSoon ? "var(--cafe-bg-surface)" : (integration.enabled ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)"),
                    border: integration.comingSoon ? "1px solid var(--cafe-border-light)" : (integration.enabled ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)"),
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: integration.comingSoon ? "var(--cafe-text-tertiary)" : (integration.enabled ? "var(--cafe-accent)" : "var(--cafe-text-secondary)"),
                    cursor: integration.comingSoon ? "not-allowed" : "pointer",
                    opacity: integration.comingSoon ? 0.5 : 1,
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => { if (!integration.comingSoon) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; } }}
                  onMouseOut={e => { if (!integration.comingSoon) { e.currentTarget.style.borderColor = integration.enabled ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'; e.currentTarget.style.background = integration.enabled ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)'; e.currentTarget.style.color = integration.enabled ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)'; } }}
                >
                  {integration.enabled ? "Enabled" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {formData.whatsappEnabled && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>WhatsApp Configuration</h3>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>API Key</label>
                  <input type="password" value={formData.whatsappApiKey} onChange={(e) => handleChange('whatsappApiKey', e.target.value)} placeholder="Enter WhatsApp Business API key" style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.emailEnabled && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Configuration</h3>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Email Provider</label>
                <select value={formData.emailProvider} onChange={(e) => handleChange('emailProvider', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                  <option value="none">Select Provider</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 20 }}>ℹ️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>Integration Status</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", fontWeight: 500 }}>
            Most integrations are currently in development. Contact support for custom integration requests or enterprise solutions.
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "28px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Save Changes</button>
      </div>
    </div>
  );
}
