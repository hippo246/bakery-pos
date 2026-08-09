import React from 'react';
import { card, btn } from "../../../styles/theme";

export default function SelfHealingStep({ settings, onSettingsChange, onNext, onBack, onSkip, stepIndex, totalSteps }) {
  const handleFeatureToggle = (feature) => {
    const currentFeatures = settings?.selfHealingFeatures || [];
    if (currentFeatures.includes(feature)) {
      onSettingsChange({ selfHealingFeatures: currentFeatures.filter(f => f !== feature) });
    } else {
      onSettingsChange({ selfHealingFeatures: [...currentFeatures, feature] });
    }
  };

  const features = [
    { id: 'auto-recovery', name: 'Auto Recovery', icon: '🔄', description: 'Automatically recover from common errors', recommended: true },
    { id: 'health-monitoring', name: 'Health Monitoring', icon: '📊', description: 'Monitor system health in real-time', recommended: true },
    { id: 'circuit-breaker', name: 'Circuit Breaker', icon: '⚡', description: 'Prevent cascading failures', recommended: true },
    { id: 'auto-retry', name: 'Auto Retry', icon: '🔁', description: 'Automatically retry failed operations' },
    { id: 'data-validation', name: 'Data Validation', icon: '✅', description: 'Validate data integrity automatically' },
    { id: 'performance-monitoring', name: 'Performance Monitoring', icon: '📈', description: 'Track performance metrics' },
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
          Self-Healing Configuration
        </h2>
        <p style={{
          fontSize: 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Enable self-healing features to automatically detect and recover from issues.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {features.map((feature) => {
          const isSelected = settings?.selfHealingFeatures?.includes(feature.id);
          return (
            <div
              key={feature.id}
              onClick={() => handleFeatureToggle(feature.id)}
              style={{
                ...card,
                padding: 20,
                cursor: "pointer",
                border: isSelected ? "2px solid var(--cafe-accent)" : "2px solid transparent",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--cafe-border-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div style={{ fontSize: 32 }}>{feature.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    margin: "0 0 4px"
                  }}>
                    {feature.name}
                  </h3>
                  {feature.recommended && (
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
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
              {isSelected && (
                <div style={{ fontSize: 20, color: "var(--cafe-success)" }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 32, background: "var(--cafe-bg-surface)" }}>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          margin: 0,
          lineHeight: 1.5
        }}>
          💡 <strong>Tip:</strong> Self-healing features help maintain system stability. Recommended features are enabled by default for production use.
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
          <button onClick={onNext} style={{ ...btn("primary"), fontSize: 14, padding: "12px 32px" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
