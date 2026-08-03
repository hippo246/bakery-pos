import React from 'react';
// Branding Section - Logo, Theme, and Colors with Instant Preview
// Premium visual settings

import { useState, useCallback } from "react";

export default function BrandingSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    logo: settings?.logo || "",
    receiptLogo: settings?.receiptLogo || "",
    primaryAccent: settings?.primaryAccent || "#6366f1",
    secondaryAccent: settings?.secondaryAccent || "#8b5cf6",
    theme: settings?.theme || "dark"
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [handleChange]);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const themes = [
    { id: "dark", name: "Dark", preview: "#1a1a2e" },
    { id: "light", name: "Light", preview: "#f8f9fa" },
    { id: "warm", name: "Warm", preview: "#2d2a2e" },
    { id: "cool", name: "Cool", preview: "#1e293b" }
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
          Branding
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Customize your cafe's visual identity and theme
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
          {/* Form */}
          <div>
            {/* Logo Upload */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Logo
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    App Logo
                  </label>
                  <div style={{
                    border: "2px dashed var(--cafe-border)",
                    borderRadius: 12,
                    padding: 32,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    e.currentTarget.style.background = "var(--cafe-accent-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-border)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: "none" }}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" style={{ cursor: "pointer" }}>
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8 }} />
                      ) : (
                        <div>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>☕</div>
                          <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                            Click to upload logo
                          </div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                            PNG, JPG up to 2MB
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Receipt Logo
                  </label>
                  <div style={{
                    border: "2px dashed var(--cafe-border)",
                    borderRadius: 12,
                    padding: 32,
                    textAlign: "center",
                    cursor: "pointer"
                  }}>
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                        Click to upload receipt logo
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                        PNG, JPG (monochrome recommended)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Accent Colors
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Primary Accent
                  </label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input
                      type="color"
                      value={formData.primaryAccent}
                      onChange={(e) => handleChange('primaryAccent', e.target.value)}
                      style={{
                        width: 48,
                        height: 48,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        padding: 2
                      }}
                    />
                    <input
                      type="text"
                      value={formData.primaryAccent}
                      onChange={(e) => handleChange('primaryAccent', e.target.value)}
                      placeholder="#6366f1"
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Secondary Accent
                  </label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input
                      type="color"
                      value={formData.secondaryAccent}
                      onChange={(e) => handleChange('secondaryAccent', e.target.value)}
                      style={{
                        width: 48,
                        height: 48,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        padding: 2
                      }}
                    />
                    <input
                      type="text"
                      value={formData.secondaryAccent}
                      onChange={(e) => handleChange('secondaryAccent', e.target.value)}
                      placeholder="#8b5cf6"
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Theme
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleChange('theme', theme.id)}
                    style={{
                      padding: 16,
                      border: formData.theme === theme.id 
                        ? "2px solid var(--cafe-accent)" 
                        : "1px solid var(--cafe-border)",
                      borderRadius: 12,
                      background: "var(--cafe-bg-surface)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    }}
                    onMouseLeave={(e) => {
                      if (formData.theme !== theme.id) {
                        e.currentTarget.style.borderColor = "var(--cafe-border)";
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: theme.preview,
                        border: "1px solid var(--cafe-border)"
                      }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {theme.name}
                      </div>
                    </div>
                    {formData.theme === theme.id && (
                      <div style={{ fontSize: 11, color: "var(--cafe-accent)", fontWeight: 600 }}>
                        ✓ Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              margin: "0 0 16px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Live Preview
            </h3>
            <div style={{
              background: formData.theme === "light" ? "#f8f9fa" : "#1a1a2e",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              position: "sticky",
              top: 0
            }}>
              {/* Preview Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }} />
                  ) : (
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: formData.primaryAccent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      color: "#fff"
                    }}>
                      ☕
                    </div>
                  )}
                  <div>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 700, 
                      color: formData.theme === "light" ? "#1a1a2e" : "#fff" 
                    }}>
                      {settings?.cafeName || "Your Cafe"}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: formData.theme === "light" ? "#6b7280" : "#9ca3af" 
                    }}>
                      Premium Cafe Experience
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  style={{
                    padding: "14px 20px",
                    background: formData.primaryAccent,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Primary Action
                </button>
                <button
                  style={{
                    padding: "14px 20px",
                    background: "transparent",
                    border: `1px solid ${formData.primaryAccent}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: formData.primaryAccent,
                    cursor: "pointer"
                  }}
                >
                  Secondary Action
                </button>
                <div style={{
                  padding: "16px",
                  background: `${formData.secondaryAccent}20`,
                  border: `1px solid ${formData.secondaryAccent}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: formData.theme === "light" ? "#1a1a2e" : "#fff"
                }}>
                  This is how your accent colors will appear throughout the interface.
                </div>
              </div>

              {/* Preview Card */}
              <div style={{
                marginTop: 24,
                padding: 20,
                background: formData.theme === "light" ? "#fff" : "#2d2a2e",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: formData.theme === "light" ? "#1a1a2e" : "#fff",
                  marginBottom: 8 
                }}>
                  Sample Card
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: formData.theme === "light" ? "#6b7280" : "#9ca3af" 
                }}>
                  This demonstrates how cards and text will look with your selected theme.
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: 16,
              background: "var(--cafe-info-bg)",
              border: "1px solid var(--cafe-info-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--cafe-info)"
            }}>
              <strong>💡 Tip:</strong> Preview updates instantly as you make changes. Theme affects the entire application interface.
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
