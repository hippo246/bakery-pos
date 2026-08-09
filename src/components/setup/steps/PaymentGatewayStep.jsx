import React from 'react';
import { card, btn } from "../../../styles/theme";

export default function PaymentGatewayStep({ settings, onSettingsChange, onNext, onBack, onSkip, stepIndex, totalSteps }) {
  const handleGatewayChange = (gateway) => {
    onSettingsChange({ paymentGateway: gateway });
  };

  const gateways = [
    { id: 'razorpay', name: 'Razorpay', icon: '💳', description: 'Popular Indian payment gateway with UPI, cards, wallets', recommended: true },
    { id: 'stripe', name: 'Stripe', icon: '🌍', description: 'Global payment gateway with international card support' },
    { id: 'paytm', name: 'Paytm', icon: '📱', description: 'India-focused with UPI, wallet, and QR code payments' },
    { id: 'none', name: 'Cash Only', icon: '💵', description: 'No online payments - cash transactions only' },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Payment Gateway
        </h2>
        <p style={{
          fontSize: 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Choose a payment gateway for online payments. You can configure API keys later in Settings.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            onClick={() => handleGatewayChange(gateway.id)}
            style={{
              ...card,
              padding: 20,
              cursor: "pointer",
              border: settings?.paymentGateway === gateway.id ? "2px solid var(--cafe-accent)" : "2px solid transparent",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 16
            }}
            onMouseEnter={(e) => {
              if (settings?.paymentGateway !== gateway.id) {
                e.currentTarget.style.borderColor = "var(--cafe-border-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (settings?.paymentGateway !== gateway.id) {
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            <div style={{ fontSize: 32 }}>{gateway.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  margin: 0
                }}>
                  {gateway.name}
                </h3>
                {gateway.recommended && (
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    background: "var(--cafe-accent)",
                    color: "#fff",
                    borderRadius: 10,
                    fontWeight: 600
                  }}>
                    Recommended
                  </span>
                )}
              </div>
              <p style={{
                fontSize: 13,
                color: "var(--cafe-text-secondary)",
                margin: "4px 0 0"
              }}>
                {gateway.description}
              </p>
            </div>
            {settings?.paymentGateway === gateway.id && (
              <div style={{ fontSize: 20, color: "var(--cafe-success)" }}>✓</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 32, background: "var(--cafe-bg-surface)" }}>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          margin: 0,
          lineHeight: 1.5
        }}>
          💡 <strong>Tip:</strong> You can add multiple payment gateways and configure API keys in Settings after setup.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ ...btn("secondary"), fontSize: 14, padding: "12px 24px" }}>
          Back
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onSkip} style={{ ...btn("ghost"), fontSize: 14, padding: "12px 24px" }}>
            Skip
          </button>
          <button 
            onClick={onNext} 
            style={{ ...btn("primary"), fontSize: 14, padding: "12px 32px" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
