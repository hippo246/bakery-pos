import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { FEATURE_CONFIG, FEATURE_CATEGORIES, isFeatureEnabled, setFeatureEnabled, getCompleteFeatureConfig, setFeatureSetting, getFeatureSetting } from "../../../utils/featureConfig.js";

export default function FeatureManagementSection({ settings, onSettingsChange }) {
  const [featureConfig, setFeatureConfig] = useState({});
  const [activeCategory, setActiveCategory] = useState(FEATURE_CATEGORIES.OPERATIONS);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  useEffect(() => {
    setFeatureConfig(getCompleteFeatureConfig());
  }, []);

  const handleToggleFeature = useCallback((featureId) => {
    const feature = FEATURE_CONFIG[featureId];
    if (!feature || feature.required) return;

    const newEnabled = !featureConfig[featureId]?.enabled;
    setFeatureEnabled(featureId, newEnabled);
    setFeatureConfig(prev => ({
      ...prev,
      [featureId]: { ...prev[featureId], enabled: newEnabled }
    }));
  }, [featureConfig]);

  const handleResetToDefaults = useCallback(() => {
    localStorage.removeItem('cafeos_feature_config');
    setFeatureConfig(getCompleteFeatureConfig());
  }, []);

  const handleOpenSettings = useCallback((featureId) => {
    setSelectedFeature(featureId);
    setShowSettingsPanel(true);
  }, []);

  const handleSettingChange = useCallback((featureId, settingKey, value) => {
    setFeatureSetting(featureId, settingKey, value);
    setFeatureConfig(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        settings: { ...prev[featureId].settings, [settingKey]: value }
      }
    }));
  }, []);

  const enabledCount = Object.values(featureConfig).filter(f => f.enabled).length;
  const totalCount = Object.keys(featureConfig).length;

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          marginBottom: "8px"
        }}>
          Feature Management
        </h2>
        <p style={{
          fontSize: "14px",
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Enable or disable features throughout the application. {enabledCount} of {totalCount} features currently enabled.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        flexWrap: "wrap",
        borderBottom: "1px solid var(--cafe-border)",
        paddingBottom: 16
      }}>
        {Object.values(FEATURE_CATEGORIES).map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              padding: "10px 20px",
              background: activeCategory === category 
                ? "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)"
                : "var(--cafe-bg-surface)",
              border: activeCategory === category ? "none" : "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: activeCategory === category ? "#fff" : "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "capitalize",
              transition: "all 0.2s ease"
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
        marginBottom: 32
      }}>
        {Object.entries(FEATURE_CONFIG)
          .filter(([_, feature]) => feature.category === activeCategory)
          .map(([key, feature]) => {
            const isEnabled = featureConfig[key]?.enabled ?? feature.enabled;
            return (
              <div
                key={key}
                style={{
                  padding: 20,
                  background: "var(--cafe-bg-surface)",
                  borderRadius: 12,
                  border: isEnabled ? "2px solid #8B4513" : "1px solid var(--cafe-border)",
                  cursor: feature.required ? "not-allowed" : "pointer",
                  opacity: feature.required ? 0.7 : 1,
                  transition: "all 0.2s ease"
                }}
                onClick={() => !feature.required && handleToggleFeature(key)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{feature.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--cafe-text-primary)",
                      marginBottom: 4
                    }}>
                      {feature.name}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: "var(--cafe-text-tertiary)",
                      marginBottom: 8
                    }}>
                      {feature.description}
                    </div>
                    {feature.required && (
                      <div style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        background: "rgba(139, 69, 19, 0.1)",
                        color: "#8B4513",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase"
                      }}>
                        Required
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center"
                  }}>
                    {feature.settings && Object.keys(feature.settings).length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenSettings(key); }}
                        style={{
                          padding: "6px 12px",
                          background: "var(--cafe-bg-card)",
                          border: "1px solid var(--cafe-border)",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--cafe-text-secondary)",
                          cursor: "pointer"
                        }}
                      >
                        Settings
                      </button>
                    )}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: isEnabled ? "#8B4513" : "var(--cafe-bg-card)",
                      border: "2px solid var(--cafe-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isEnabled ? "#fff" : "transparent",
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {isEnabled ? "✓" : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && selectedFeature && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "var(--cafe-bg-card)",
            borderRadius: 12,
            padding: 24,
            width: "90%",
            maxWidth: 500,
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--cafe-text-primary)",
                margin: 0
              }}>
                {FEATURE_CONFIG[selectedFeature].name} Settings
              </h3>
              <button
                onClick={() => setShowSettingsPanel(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--cafe-text-tertiary)"
                }}
              >
                ✕
              </button>
            </div>
            {featureConfig[selectedFeature]?.settings && Object.entries(featureConfig[selectedFeature].settings).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  marginBottom: 8
                }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                {typeof value === 'boolean' ? (
                  <button
                    onClick={() => handleSettingChange(selectedFeature, key, !value)}
                    style={{
                      padding: "10px 16px",
                      background: value ? "#8B4513" : "var(--cafe-bg-surface)",
                      border: value ? "none" : "1px solid var(--cafe-border)",
                      borderRadius: 6,
                      color: value ? "#fff" : "var(--cafe-text-secondary)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {value ? "Enabled" : "Disabled"}
                  </button>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleSettingChange(selectedFeature, key, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: 16,
        justifyContent: "flex-end",
        paddingTop: 24,
        borderTop: "1px solid var(--cafe-border)"
      }}>
        <button
          onClick={handleResetToDefaults}
          style={{
            padding: "12px 24px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: "pointer"
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: "rgba(139, 69, 19, 0.05)",
        border: "1px solid rgba(139, 69, 19, 0.2)",
        borderRadius: 8
      }}>
        <div style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          lineHeight: 1.6
        }}>
          <strong style={{ color: "#8B4513" }}>Note:</strong> Disabling a feature will hide it from the navigation and prevent access. Required features cannot be disabled. Changes take effect immediately.
        </div>
      </div>
    </div>
  );
}
