import React from 'react';
// Order Sources Step for Setup Wizard
// Configure order channels with enable/disable

import { useState, useCallback } from "react";

const ORDER_SOURCES = [
  { id: 'walkin', name: 'Walk-In', icon: '🚶', description: 'Dine-in customers at the cafe' },
  { id: 'takeaway', name: 'Takeaway', icon: '🥡', description: 'Pickup orders' },
  { id: 'delivery', name: 'Delivery', icon: '🛵', description: 'Home delivery orders' },
  { id: 'swiggy', name: 'Swiggy', icon: '🟠', description: 'Swiggy integration' },
  { id: 'zomato', name: 'Zomato', icon: '🔴', description: 'Zomato integration' },
  { id: 'qr', name: 'QR Ordering', icon: '📱', description: 'Scan-to-order at tables' }
];

export default function OrderSourcesStep({ settings, onNext, onBack, isMobile, isLoading }) {
  const [formData, setFormData] = useState({
    walkinEnabled: settings?.walkinEnabled !== false,
    takeawayEnabled: settings?.takeawayEnabled !== false,
    deliveryEnabled: settings?.deliveryEnabled !== false,
    swiggyEnabled: settings?.swiggyEnabled !== false,
    zomatoEnabled: settings?.zomatoEnabled !== false,
    qrEnabled: settings?.qrEnabled !== false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      ...formData
    };
    localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    onNext(formData);
  }, [formData, settings, onNext]);

  const getEnabledSourcesCount = () => {
    return Object.keys(formData).filter(key => key.endsWith('Enabled') && formData[key]).length;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "24px 32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 4px"
        }}>
          Order Sources
        </h2>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure which order channels your cafe accepts
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        {/* Order Sources */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Enabled Channels
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {ORDER_SOURCES.map((source, idx) => (
              <label
                key={source.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: idx < ORDER_SOURCES.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
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
                  checked={formData[source.id + 'Enabled']}
                  onChange={(e) => handleChange(source.id + 'Enabled', e.target.checked)}
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
                  {source.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {source.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {source.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div style={{
          padding: 16,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--cafe-info)",
          marginBottom: 32
        }}>
          <strong>💡 Note:</strong> Only enabled channels will appear throughout CafeOS. You can enable/disable channels later in Settings.
        </div>

        {/* Summary */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Summary
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
              <strong>{getEnabledSourcesCount()}</strong> channels enabled
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ORDER_SOURCES.filter(s => formData[s.id + 'Enabled']).map(source => (
                <span
                  key={source.id}
                  style={{
                    padding: "6px 12px",
                    background: "var(--cafe-accent-bg)",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--cafe-accent)"
                  }}
                >
                  {source.icon} {source.name}
                </span>
              ))}
              {getEnabledSourcesCount() === 0 && (
                <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                  No channels enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        position: isMobile ? "sticky" : "relative",
        bottom: isMobile ? 0 : "auto"
      }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "12px 24px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleNext}
          disabled={isLoading || getEnabledSourcesCount() === 0}
          style={{
            padding: "12px 32px",
            background: getEnabledSourcesCount() > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading || getEnabledSourcesCount() === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: getEnabledSourcesCount() > 0 ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (getEnabledSourcesCount() > 0) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
