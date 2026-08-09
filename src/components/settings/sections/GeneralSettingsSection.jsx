import React from 'react';
// General Settings Section - Language, Timezone, Currency, Preferences
// Premium general configuration

import { useState, useCallback } from "react";

export default function GeneralSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    language: settings?.language || "en",
    timezone: settings?.timezone || "Asia/Kolkata",
    currency: settings?.currency || "INR",
    dateFormat: settings?.dateFormat || "DD/MM/YYYY",
    timeFormat: settings?.timeFormat || "24h",
    measurementUnits: settings?.measurementUnits || "metric",
    defaultView: settings?.defaultView || "dashboard",
    autoRefresh: settings?.autoRefresh !== false,
    refreshInterval: settings?.refreshInterval || 30,
    showTips: settings?.showTips !== false,
    compactMode: settings?.compactMode || false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
    { code: "kn", name: "ಕನ್ನಡ" },
    { code: "ml", name: "മലയാളം" }
  ];

  const timezones = [
    { value: "Asia/Kolkata", name: "India (IST)" },
    { value: "Asia/Dubai", name: "Dubai (GST)" },
    { value: "Asia/Singapore", name: "Singapore (SGT)" },
    { value: "Asia/Tokyo", name: "Japan (JST)" },
    { value: "America/New_York", name: "New York (EST)" },
    { value: "Europe/London", name: "London (GMT)" }
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" }
  ];

  const dateFormats = [
    { value: "DD/MM/YYYY", example: "26/07/2024" },
    { value: "MM/DD/YYYY", example: "07/26/2024" },
    { value: "YYYY-MM-DD", example: "2024-07-26" }
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "28px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-surface)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 800,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px",
          letterSpacing: "-0.02em"
        }}>
          General
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0,
          fontWeight: 500
        }}>
          Configure language, timezone, currency, and operational preferences
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        {/* Regional Settings */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            Regional Settings
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.symbol} {curr.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            Date & Time
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Date Format
                </label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                >
                  {dateFormats.map(df => (
                    <option key={df.value} value={df.value}>{df.example}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Time Format
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["12h", "24h"].map(format => (
                    <button
                      key={format}
                      onClick={() => handleChange('timeFormat', format)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: formData.timeFormat === format ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                        border: formData.timeFormat === format ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        color: formData.timeFormat === format ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => { if (formData.timeFormat !== format) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
                      onMouseOut={e => { if (formData.timeFormat !== format) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Measurement Units */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            Measurement Units
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { id: "metric", name: "Metric (kg, L)" },
                { id: "imperial", name: "Imperial (lb, oz)" }
              ].map(unit => (
                <button
                  key={unit.id}
                  onClick={() => handleChange('measurementUnits', unit.id)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: formData.measurementUnits === unit.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    border: formData.measurementUnits === unit.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: formData.measurementUnits === unit.id ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => { if (formData.measurementUnits !== unit.id) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
                  onMouseOut={e => { if (formData.measurementUnits !== unit.id) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
                >
                  {unit.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Preferences */}
        <div>
          <h3 style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            Operational Preferences
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                  Default View
                </label>
                <select
                  value={formData.defaultView}
                  onChange={(e) => handleChange('defaultView', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="pos">POS</option>
                  <option value="orders">Orders</option>
                  <option value="tables">Tables</option>
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input
                  type="checkbox"
                  checked={formData.autoRefresh}
                  onChange={(e) => handleChange('autoRefresh', e.target.checked)}
                  style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Refresh Data
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>
                    Automatically refresh data every {formData.refreshInterval} seconds
                  </div>
                </div>
              </label>

              {formData.autoRefresh && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>
                    Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.refreshInterval}
                    onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value) || 30)}
                    min="10"
                    max="300"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 14,
                      border: "1px solid var(--cafe-border-light)",
                      borderRadius: 12,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
                  />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input
                  type="checkbox"
                  checked={formData.showTips}
                  onChange={(e) => handleChange('showTips', e.target.checked)}
                  style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Tips & Hints
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>
                    Display helpful tips throughout the interface
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input
                  type="checkbox"
                  checked={formData.compactMode}
                  onChange={(e) => handleChange('compactMode', e.target.checked)}
                  style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Compact Mode
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>
                    Use more compact spacing throughout the interface
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "28px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-surface)",
        display: "flex",
        justifyContent: "flex-end"
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent-bg)",
            border: "1px solid var(--cafe-accent)",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--cafe-accent)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--cafe-accent)";
            e.currentTarget.style.color = '#1A1208';
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cafe-accent-bg)";
            e.currentTarget.style.color = "var(--cafe-accent)";
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
