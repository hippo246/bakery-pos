import React from 'react';
// CafeOS Receipt Builder - Live Visual Receipt Designer
// Premium component for configuring receipt templates

import { useState, useCallback, useEffect } from "react";

const DEFAULT_TEMPLATE = {
  showHeader: true,
  showFooter: true,
  showQR: true,
  showTerms: true,
  headerMessage: "",
  footerMessage: "Thank you for your order!",
  terms: "Terms & Conditions Apply\nNo returns after 7 days\nGST included where applicable",
  showLogo: true,
  logoPosition: "center",
  showBusinessInfo: true,
  showGST: true,
  showFSSAI: false,
  fssaiNumber: "",
  showOrderNumber: true,
  showCashier: true,
  showTable: true,
  showTimestamp: true,
  showModifiers: true,
  showDiscounts: true,
  showTaxes: true,
  showPaymentBreakdown: true,
  showTransactionRef: true,
  showBarcode: false,
  spacing: "normal", // compact, normal, spacious
  paperSize: "80mm",
  fontSize: "medium" // small, medium, large
};

export default function ReceiptBuilder({ template, onChange, onPreview, isMobile }) {
  const [localTemplate, setLocalTemplate] = useState(template || DEFAULT_TEMPLATE);
  const [activeTab, setActiveTab] = useState("header");

  useEffect(() => {
    if (template) {
      setLocalTemplate(template);
    }
  }, [template]);

  const handleChange = useCallback((key, value) => {
    const updated = { ...localTemplate, [key]: value };
    setLocalTemplate(updated);
    onChange?.(updated);
  }, [localTemplate, onChange]);

  const handleReset = useCallback(() => {
    setLocalTemplate(DEFAULT_TEMPLATE);
    onChange?.(DEFAULT_TEMPLATE);
  }, [onChange]);

  const tabs = [
    { id: "header", label: "Header", icon: "📄" },
    { id: "content", label: "Content", icon: "📝" },
    { id: "footer", label: "Footer", icon: "🔚" },
    { id: "layout", label: "Layout", icon: "📐" },
    { id: "branding", label: "Branding", icon: "🎨" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? 18 : 20,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            margin: 0
          }}>
            Receipt Builder
          </h2>
          <p style={{
            fontSize: isMobile ? 11 : 12,
            color: "var(--cafe-text-tertiary)",
            margin: "4px 0 0"
          }}>
            Customize your receipt template with live preview
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              padding: isMobile ? "8px 12px" : "10px 16px",
              fontSize: isMobile ? 12 : 13,
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              background: "var(--cafe-bg-surface)",
              color: "var(--cafe-text-primary)",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Reset
          </button>
          <button
            onClick={() => onPreview?.(localTemplate)}
            style={{
              padding: isMobile ? "8px 12px" : "10px 16px",
              fontSize: isMobile ? 12 : 13,
              border: "1px solid var(--cafe-accent)",
              borderRadius: 8,
              background: "var(--cafe-accent)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        padding: "0 20px",
        borderBottom: "1px solid var(--cafe-border-light)"
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              border: "none",
              background: "transparent",
              color: activeTab === tab.id ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--cafe-accent)" : "2px solid transparent",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {activeTab === "header" && (
          <HeaderSettings template={localTemplate} onChange={handleChange} isMobile={isMobile} />
        )}
        {activeTab === "content" && (
          <ContentSettings template={localTemplate} onChange={handleChange} isMobile={isMobile} />
        )}
        {activeTab === "footer" && (
          <FooterSettings template={localTemplate} onChange={handleChange} isMobile={isMobile} />
        )}
        {activeTab === "layout" && (
          <LayoutSettings template={localTemplate} onChange={handleChange} isMobile={isMobile} />
        )}
        {activeTab === "branding" && (
          <BrandingSettings template={localTemplate} onChange={handleChange} isMobile={isMobile} />
        )}
      </div>
    </div>
  );
}

// Header Settings Component
function HeaderSettings({ template, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Header Options">
        <Toggle
          label="Show Header"
          checked={template.showHeader}
          onChange={(v) => onChange("showHeader", v)}
        />
        <Toggle
          label="Show Logo"
          checked={template.showLogo}
          onChange={(v) => onChange("showLogo", v)}
        />
        <Toggle
          label="Show Business Info"
          checked={template.showBusinessInfo}
          onChange={(v) => onChange("showBusinessInfo", v)}
        />
      </Section>

      <Section title="Logo Position">
        <RadioGroup
          value={template.logoPosition}
          onChange={(v) => onChange("logoPosition", v)}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" }
          ]}
        />
      </Section>

      <Section title="Custom Header Message">
        <TextArea
          value={template.headerMessage}
          onChange={(v) => onChange("headerMessage", v)}
          placeholder="Enter custom header message..."
          rows={3}
        />
      </Section>

      <Section title="Compliance">
        <Toggle
          label="Show GST Number"
          checked={template.showGST}
          onChange={(v) => onChange("showGST", v)}
        />
        <Toggle
          label="Show FSSAI License"
          checked={template.showFSSAI}
          onChange={(v) => onChange("showFSSAI", v)}
        />
        {template.showFSSAI && (
          <Input
            label="FSSAI Number"
            value={template.fssaiNumber}
            onChange={(v) => onChange("fssaiNumber", v)}
            placeholder="Enter FSSAI license number"
          />
        )}
      </Section>
    </div>
  );
}

// Content Settings Component
function ContentSettings({ template, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Order Information">
        <Toggle
          label="Show Order Number"
          checked={template.showOrderNumber}
          onChange={(v) => onChange("showOrderNumber", v)}
        />
        <Toggle
          label="Show Cashier Name"
          checked={template.showCashier}
          onChange={(v) => onChange("showCashier", v)}
        />
        <Toggle
          label="Show Table Number"
          checked={template.showTable}
          onChange={(v) => onChange("showTable", v)}
        />
        <Toggle
          label="Show Timestamp"
          checked={template.showTimestamp}
          onChange={(v) => onChange("showTimestamp", v)}
        />
      </Section>

      <Section title="Item Details">
        <Toggle
          label="Show Modifiers"
          checked={template.showModifiers}
          onChange={(v) => onChange("showModifiers", v)}
        />
        <Toggle
          label="Show Discounts"
          checked={template.showDiscounts}
          onChange={(v) => onChange("showDiscounts", v)}
        />
        <Toggle
          label="Show Taxes"
          checked={template.showTaxes}
          onChange={(v) => onChange("showTaxes", v)}
        />
      </Section>

      <Section title="Payment Information">
        <Toggle
          label="Show Payment Breakdown"
          checked={template.showPaymentBreakdown}
          onChange={(v) => onChange("showPaymentBreakdown", v)}
        />
        <Toggle
          label="Show Transaction Reference"
          checked={template.showTransactionRef}
          onChange={(v) => onChange("showTransactionRef", v)}
        />
        <Toggle
          label="Show Barcode"
          checked={template.showBarcode}
          onChange={(v) => onChange("showBarcode", v)}
        />
      </Section>
    </div>
  );
}

// Footer Settings Component
function FooterSettings({ template, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Footer Options">
        <Toggle
          label="Show Footer"
          checked={template.showFooter}
          onChange={(v) => onChange("showFooter", v)}
        />
        <Toggle
          label="Show QR Code"
          checked={template.showQR}
          onChange={(v) => onChange("showQR", v)}
        />
        <Toggle
          label="Show Terms"
          checked={template.showTerms}
          onChange={(v) => onChange("showTerms", v)}
        />
      </Section>

      <Section title="Footer Message">
        <TextArea
          value={template.footerMessage}
          onChange={(v) => onChange("footerMessage", v)}
          placeholder="Enter footer message..."
          rows={2}
        />
      </Section>

      <Section title="Terms & Conditions">
        <TextArea
          value={template.terms}
          onChange={(v) => onChange("terms", v)}
          placeholder="Enter terms and conditions..."
          rows={4}
        />
      </Section>
    </div>
  );
}

// Layout Settings Component
function LayoutSettings({ template, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Paper Size">
        <RadioGroup
          value={template.paperSize}
          onChange={(v) => onChange("paperSize", v)}
          options={[
            { value: "58mm", label: "58mm Thermal" },
            { value: "80mm", label: "80mm Thermal" },
            { value: "A4", label: "A4" }
          ]}
        />
      </Section>

      <Section title="Font Size">
        <RadioGroup
          value={template.fontSize}
          onChange={(v) => onChange("fontSize", v)}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" }
          ]}
        />
      </Section>

      <Section title="Spacing">
        <RadioGroup
          value={template.spacing}
          onChange={(v) => onChange("spacing", v)}
          options={[
            { value: "compact", label: "Compact" },
            { value: "normal", label: "Normal" },
            { value: "spacious", label: "Spacious" }
          ]}
        />
      </Section>
    </div>
  );
}

// Branding Settings Component
function BrandingSettings({ template, onChange, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Logo Upload">
        <div style={{
          padding: "24px",
          border: "2px dashed var(--cafe-border)",
          borderRadius: 12,
          background: "var(--cafe-bg-surface)",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
          <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
            Click to upload logo
          </div>
          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
            PNG, JPG up to 2MB
          </div>
        </div>
      </Section>

      <Section title="Color Scheme">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ColorPicker label="Primary Color" value="#000000" onChange={() => {}} />
          <ColorPicker label="Accent Color" value="#6366f1" onChange={() => {}} />
          <ColorPicker label="Text Color" value="#1f2937" onChange={() => {}} />
        </div>
      </Section>

      <Section title="Typography">
        <Select
          label="Font Family"
          value="monospace"
          onChange={() => {}}
          options={[
            { value: "monospace", label: "Monospace (Thermal)" },
            { value: "sans-serif", label: "Sans Serif" },
            { value: "serif", label: "Serif" }
          ]}
        />
      </Section>
    </div>
  );
}

// UI Components
function Section({ title, children }) {
  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: 16
    }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--cafe-text-primary)",
        margin: "0 0 16px"
      }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? "var(--cafe-accent)" : "var(--cafe-border)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s"
        }}
      >
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          transition: "all 0.2s"
        }} />
      </button>
    </div>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            border: `1px solid ${value === option.value ? "var(--cafe-accent)" : "var(--cafe-border)"}`,
            borderRadius: 8,
            background: value === option.value ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
            color: value === option.value ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "10px 12px",
          fontSize: 13,
          border: "1px solid var(--cafe-border)",
          borderRadius: 8,
          background: "var(--cafe-bg-surface)",
          color: "var(--cafe-text-primary)"
        }}
      />
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        padding: "10px 12px",
        fontSize: 13,
        border: "1px solid var(--cafe-border)",
        borderRadius: 8,
        background: "var(--cafe-bg-surface)",
        color: "var(--cafe-text-primary)",
        resize: "vertical",
        fontFamily: "inherit"
      }}
    />
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: value,
          border: "1px solid var(--cafe-border)"
        }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 32, cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          fontSize: 13,
          border: "1px solid var(--cafe-border)",
          borderRadius: 8,
          background: "var(--cafe-bg-surface)",
          color: "var(--cafe-text-primary)"
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
