import React from 'react';
// Intelligence Settings Section - AI-powered insights and recommendations
import { useState, useCallback } from "react";

export default function IntelligenceSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    aiEnabled: settings?.aiEnabled !== false,
    demandForecasting: settings?.demandForecasting || false,
    inventoryOptimization: settings?.inventoryOptimization || false,
    staffScheduling: settings?.staffScheduling || false,
    priceOptimization: settings?.priceOptimization || false,
    customerInsights: settings?.customerInsights || false,
    anomalyDetection: settings?.anomalyDetection || false,
    autoRestock: settings?.autoRestock || false,
    predictiveMaintenance: settings?.predictiveMaintenance || false,
    dataRetentionDays: settings?.dataRetentionDays || 90,
    modelAccuracy: settings?.modelAccuracy || 'balanced',
    notificationThreshold: settings?.notificationThreshold || 70
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const intelligenceModules = [
    {
      id: "demandForecasting",
      name: "Demand Forecasting",
      icon: "📈",
      description: "Predict future demand based on historical data",
      enabled: formData.demandForecasting
    },
    {
      id: "inventoryOptimization",
      name: "Inventory Optimization",
      icon: "📦",
      description: "Optimize stock levels and reduce waste",
      enabled: formData.inventoryOptimization
    },
    {
      id: "staffScheduling",
      name: "Staff Scheduling",
      icon: "👥",
      description: "AI-powered shift planning and scheduling",
      enabled: formData.staffScheduling
    },
    {
      id: "priceOptimization",
      name: "Price Optimization",
      icon: "💰",
      description: "Dynamic pricing recommendations",
      enabled: formData.priceOptimization
    },
    {
      id: "customerInsights",
      name: "Customer Insights",
      icon: "🎯",
      description: "Analyze customer behavior and preferences",
      enabled: formData.customerInsights
    },
    {
      id: "anomalyDetection",
      name: "Anomaly Detection",
      icon: "🔍",
      description: "Detect unusual patterns and fraud",
      enabled: formData.anomalyDetection
    },
    {
      id: "autoRestock",
      name: "Auto Restock",
      icon: "🔄",
      description: "Automated inventory replenishment",
      enabled: formData.autoRestock
    },
    {
      id: "predictiveMaintenance",
      name: "Predictive Maintenance",
      icon: "🔧",
      description: "Predict equipment maintenance needs",
      enabled: formData.predictiveMaintenance
    }
  ];

  const enabledCount = intelligenceModules.filter(m => m.enabled).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "28px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--cafe-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Intelligence</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0, fontWeight: 500 }}>AI-powered insights and automation</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        {/* AI Status */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
              <input type="checkbox" checked={formData.aiEnabled} onChange={(e) => handleChange('aiEnabled', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable AI Intelligence</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Activate all AI-powered features and recommendations</div>
              </div>
            </label>
          </div>
        </div>

        {/* Intelligence Modules */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Intelligence Modules</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            {intelligenceModules.map(module => (
              <div key={module.id} style={{ background: "var(--cafe-bg-card)", border: module.enabled ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = module.enabled ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 32 }}>{module.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{module.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>{module.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleChange(module.id, !module.enabled)}
                  disabled={!formData.aiEnabled}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: module.enabled ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    border: module.enabled ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: module.enabled ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                    cursor: formData.aiEnabled ? "pointer" : "not-allowed",
                    opacity: formData.aiEnabled ? 1 : 0.5,
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => { if (formData.aiEnabled) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; } }}
                  onMouseOut={e => { if (formData.aiEnabled) { e.currentTarget.style.borderColor = module.enabled ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'; e.currentTarget.style.background = module.enabled ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)'; e.currentTarget.style.color = module.enabled ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)'; } }}
                >
                  {module.enabled ? "Enabled" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Configuration</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Data Retention (days)</label>
                <input type="number" value={formData.dataRetentionDays} onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value) || 90)} min="30" max="365" disabled={!formData.aiEnabled} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s", opacity: formData.aiEnabled ? 1 : 0.5 }} onFocus={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-accent)'; }} onBlur={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; }} />
              </div>
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Model Accuracy</label>
                <select value={formData.modelAccuracy} onChange={(e) => handleChange('modelAccuracy', e.target.value)} disabled={!formData.aiEnabled} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", cursor: formData.aiEnabled ? "pointer" : "not-allowed", transition: "all 0.2s", opacity: formData.aiEnabled ? 1 : 0.5 }} onFocus={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-accent)'; }} onBlur={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; }}>
                  <option value="fast">Fast (Lower Accuracy)</option>
                  <option value="balanced">Balanced</option>
                  <option value="accurate">Accurate (Slower)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Notification Threshold (%)</label>
                <input type="number" value={formData.notificationThreshold} onChange={(e) => handleChange('notificationThreshold', parseInt(e.target.value) || 70)} min="50" max="100" disabled={!formData.aiEnabled} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s", opacity: formData.aiEnabled ? 1 : 0.5 }} onFocus={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-accent)'; }} onBlur={e => { if (formData.aiEnabled) e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; }} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{ background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 20 }}>🤖</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>AI Intelligence Status</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", fontWeight: 500, marginBottom: 12 }}>
            <strong>{enabledCount}</strong> of {intelligenceModules.length} modules enabled
          </div>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>
            AI features use machine learning to analyze your data and provide actionable insights. Data is processed locally for privacy.
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "28px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Save Changes</button>
      </div>
    </div>
  );
}
