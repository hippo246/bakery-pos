import React from 'react';
import { card, btn } from "../../../styles/theme";

export default function DeliveryIntegrationStep({ settings, onSettingsChange, onNext, onBack, onSkip, stepIndex, totalSteps }) {
  const handlePlatformToggle = (platform) => {
    const currentPlatforms = settings?.deliveryPlatforms || [];
    if (currentPlatforms.includes(platform)) {
      onSettingsChange({ deliveryPlatforms: currentPlatforms.filter(p => p !== platform) });
    } else {
      onSettingsChange({ deliveryPlatforms: [...currentPlatforms, platform] });
    }
  };

  const platforms = [
    { id: 'swiggy', name: 'Swiggy', icon: '🍕', description: 'India\'s largest food delivery platform' },
    { id: 'zomato', name: 'Zomato', icon: '🥡', description: 'Popular food delivery and discovery platform' },
    { id: 'uber-eats', name: 'Uber Eats', icon: '🚗', description: 'Global food delivery service' },
    { id: 'own-delivery', name: 'Own Delivery', icon: '🛵', description: 'Manage your own delivery fleet' },
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
          Delivery Integration
        </h2>
        <p style={{
          fontSize: 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Select delivery platforms you want to integrate. API credentials can be configured later in Settings.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {platforms.map((platform) => {
          const isSelected = settings?.deliveryPlatforms?.includes(platform.id);
          return (
            <div
              key={platform.id}
              onClick={() => handlePlatformToggle(platform.id)}
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
              <div style={{ fontSize: 32 }}>{platform.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  margin: "0 0 4px"
                }}>
                  {platform.name}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "var(--cafe-text-secondary)",
                  margin: 0
                }}>
                  {platform.description}
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
          💡 <strong>Tip:</strong> Integration requires API credentials from each platform. You can set these up in Settings after completing setup.
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
