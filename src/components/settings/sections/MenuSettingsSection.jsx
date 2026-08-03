import React from 'react';
// Menu Settings Section - Menu Defaults and Configuration
// Premium menu management settings

import { useState, useCallback } from "react";

export default function MenuSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    defaultCategories: settings?.defaultCategories || ["Beverages", "Food", "Desserts"],
    popularThreshold: settings?.popularThreshold || 10,
    enable86Status: settings?.enable86Status !== false,
    eightySixBehaviour: settings?.eightySixBehaviour || "hide",
    priceDisplay: settings?.priceDisplay || "inclusive",
    showCostMargin: settings?.showCostMargin || false,
    showPrepTime: settings?.showPrepTime || false,
    requireCategory: settings?.requireCategory !== false,
    showDietaryTags: settings?.showDietaryTags !== false,
    showAllergens: settings?.showAllergens !== false,
    enableVariants: settings?.enableVariants !== false,
    enableModifiers: settings?.enableModifiers !== false,
    defaultTaxBehavior: settings?.defaultTaxBehavior || "inclusive",
    stationRouting: settings?.stationRouting || "auto",
    modifierDefaults: settings?.modifierDefaults || "required",
    allergenPreferences: settings?.allergenPreferences || "highlight"
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const priceDisplays = [
    { id: "inclusive", name: "Tax Inclusive" },
    { id: "exclusive", name: "Tax Exclusive" },
    { id: "both", name: "Show Both" }
  ];

  const eightySixBehaviours = [
    { id: "hide", name: "Hide Item" },
    { id: "gray", name: "Gray Out" },
    { id: "badge", name: "Show Badge" }
  ];

  const stationRoutings = [
    { id: "auto", name: "Auto Route" },
    { id: "manual", name: "Manual Route" },
    { id: "category", name: "By Category" }
  ];

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
          Menu
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure menu defaults, pricing, and display preferences
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Menu Defaults */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Menu Defaults
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Popular Threshold (orders)
                </label>
                <input
                  type="number"
                  value={formData.popularThreshold}
                  onChange={(e) => handleChange('popularThreshold', parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)"
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                  Items with this many orders will be marked as popular
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireCategory}
                  onChange={(e) => handleChange('requireCategory', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Category
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    All menu items must belong to a category
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 86 Status */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            86 Status (Out of Stock)
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
                  checked={formData.enable86Status}
                  onChange={(e) => handleChange('enable86Status', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable 86 Status
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow marking items as out of stock
                  </div>
                </div>
              </label>

              {formData.enable86Status && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    86 Behaviour
                  </label>
                  <select
                    value={formData.eightySixBehaviour}
                    onChange={(e) => handleChange('eightySixBehaviour', e.target.value)}
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
                    {eightySixBehaviours.map(bh => (
                      <option key={bh.id} value={bh.id}>{bh.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Pricing
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Price Display
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {priceDisplays.map(pd => (
                    <button
                      key={pd.id}
                      onClick={() => handleChange('priceDisplay', pd.id)}
                      style={{
                        padding: "12px",
                        background: formData.priceDisplay === pd.id ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                        border: formData.priceDisplay === pd.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: formData.priceDisplay === pd.id ? "#fff" : "var(--cafe-text-primary)",
                        cursor: "pointer"
                      }}
                    >
                      {pd.name}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showCostMargin}
                  onChange={(e) => handleChange('showCostMargin', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Cost Margin
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display cost and margin information (admin only)
                  </div>
                </div>
              </label>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Default Tax Behavior
                </label>
                <select
                  value={formData.defaultTaxBehavior}
                  onChange={(e) => handleChange('defaultTaxBehavior', e.target.value)}
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
                  <option value="inclusive">Tax Inclusive</option>
                  <option value="exclusive">Tax Exclusive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Display Options
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
                  checked={formData.showPrepTime}
                  onChange={(e) => handleChange('showPrepTime', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Prep Time
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display preparation time on menu items
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showDietaryTags}
                  onChange={(e) => handleChange('showDietaryTags', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Dietary Tags
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display vegetarian, vegan, and other dietary tags
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showAllergens}
                  onChange={(e) => handleChange('showAllergens', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Allergens
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display allergen information on menu items
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Variants & Modifiers */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Variants & Modifiers
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
                  checked={formData.enableVariants}
                  onChange={(e) => handleChange('enableVariants', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Variants
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow item variants (size, flavor, etc.)
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.enableModifiers}
                  onChange={(e) => handleChange('enableModifiers', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Modifiers
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow item modifiers (extras, substitutions)
                  </div>
                </div>
              </label>

              {formData.enableModifiers && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Modifier Defaults
                  </label>
                  <select
                    value={formData.modifierDefaults}
                    onChange={(e) => handleChange('modifierDefaults', e.target.value)}
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
                    <option value="required">Required Selection</option>
                    <option value="optional">Optional Selection</option>
                    <option value="none">No Default</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Station Routing */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Station Routing
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Default Station Routing
              </label>
              <select
                value={formData.stationRouting}
                onChange={(e) => handleChange('stationRouting', e.target.value)}
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
                {stationRoutings.map(sr => (
                  <option key={sr.id} value={sr.id}>{sr.name}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                How menu items are routed to kitchen stations
              </div>
            </div>
          </div>
        </div>

        {/* Allergen Preferences */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Allergen Preferences
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Allergen Display
              </label>
              <select
                value={formData.allergenPreferences}
                onChange={(e) => handleChange('allergenPreferences', e.target.value)}
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
                <option value="highlight">Highlight Allergens</option>
                <option value="warning">Show Warning</option>
                <option value="hidden">Hidden (Admin Only)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "flex-end"
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
