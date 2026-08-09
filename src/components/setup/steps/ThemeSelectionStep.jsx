import React from 'react';
import { card, btn } from "../../../styles/theme";

export default function ThemeSelectionStep({ settings, onSettingsChange, onNext, onBack, stepIndex, totalSteps, isMobile, isTablet }) {
  const handleThemeSelect = (themeId) => {
    onSettingsChange({ selectedTheme: themeId });
  };

  const themes = [
    { id: 'modern', name: 'Modern', icon: '✨', description: 'Clean, contemporary design with smooth animations' },
    { id: 'classic', name: 'Classic POS', icon: '🖥️', description: 'Traditional POS layout with function keys and keypad' },
    { id: 'fastfood', name: 'Fast Food', icon: '🍔', description: 'Optimized for quick service restaurants' },
    { id: 'cafe', name: 'Cafe', icon: '☕', description: 'Warm, inviting design for coffee shops' },
    { id: 'finedining', name: 'Fine Dining', icon: '🍽️', description: 'Elegant design for upscale restaurants' },
    { id: 'bar', name: 'Bar', icon: '🍸', description: 'Dark theme optimized for bars and pubs' },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Choose Your Theme
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Select a visual theme that matches your cafe's style. You can change this later in Settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(280px, 1fr))", gap: isMobile ? 12 : 16, marginBottom: 32 }}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            style={{
              ...card,
              padding: 24,
              cursor: "pointer",
              border: settings?.selectedTheme === theme.id ? "2px solid var(--cafe-accent)" : "2px solid transparent",
              transition: "all 0.2s ease",
              opacity: settings?.selectedTheme && settings.selectedTheme !== theme.id ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (settings?.selectedTheme !== theme.id) {
                e.currentTarget.style.borderColor = "var(--cafe-border-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (settings?.selectedTheme !== theme.id) {
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{theme.icon}</div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              margin: "0 0 8px"
            }}>
              {theme.name}
            </h3>
            <p style={{
              fontSize: 13,
              color: "var(--cafe-text-secondary)",
              margin: 0,
              lineHeight: 1.4
            }}>
              {theme.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ ...btn("secondary"), fontSize: 14, padding: "12px 24px" }}>
          Back
        </button>
        <button 
          onClick={onNext} 
          style={{ ...btn("primary"), fontSize: 14, padding: "12px 32px" }}
          disabled={!settings?.selectedTheme}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
