import React from 'react';
// Tax Configuration Step for Setup Wizard
// Configure taxes with live receipt preview with premium UX

import { useState, useCallback } from "react";

export default function TaxConfigurationStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [formData, setFormData] = useState({
    gstRate: settings?.gstRate || 0,
    serviceChargeRate: settings?.serviceChargeRate || 0,
    taxMode: settings?.taxMode || 'inclusive',
    serviceChargeName: settings?.serviceChargeName || 'Service Charge',
    gstEnabled: settings?.gstEnabled !== false,
    serviceChargeEnabled: settings?.serviceChargeEnabled !== false
  });

  const [showHelp, setShowHelp] = useState({});
  const [validation, setValidation] = useState({});

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate rates
    if (field === 'gstRate' || field === 'serviceChargeRate') {
      const rate = parseFloat(value) || 0;
      if (rate < 0 || rate > 30) {
        setValidation(prev => ({ ...prev, [field]: { status: 'warning', message: 'Rate must be 0-30%' } }));
      } else {
        setValidation(prev => ({ ...prev, [field]: { status: 'valid', message: 'Valid' } }));
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      ...formData
    };
    localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    onNext(formData);
  }, [formData, settings, onNext]);

  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const calculateTax = (amount) => {
    let subtotal = amount;
    let gst = 0;
    let serviceCharge = 0;
    let total = amount;

    if (formData.taxMode === 'exclusive') {
      // Tax exclusive: add tax on top
      if (formData.gstEnabled) {
        gst = (amount * formData.gstRate) / 100;
      }
      if (formData.serviceChargeEnabled) {
        serviceCharge = (amount * formData.serviceChargeRate) / 100;
      }
      total = amount + gst + serviceCharge;
    } else {
      // Tax inclusive: tax is included in amount
      if (formData.gstEnabled || formData.serviceChargeEnabled) {
        const totalRate = (formData.gstEnabled ? formData.gstRate : 0) + 
                          (formData.serviceChargeEnabled ? formData.serviceChargeRate : 0);
        const divisor = 1 + (totalRate / 100);
        subtotal = amount / divisor;
        if (formData.gstEnabled) {
          gst = subtotal * (formData.gstRate / 100);
        }
        if (formData.serviceChargeEnabled) {
          serviceCharge = subtotal * (formData.serviceChargeRate / 100);
        }
      }
    }

    return { subtotal, gst, serviceCharge, total };
  };

  const sampleAmount = 500;
  const taxCalculation = calculateTax(sampleAmount);

  const renderFieldCard = (title, icon, children, helpText) => (
    <div style={{
      background: "var(--cafe-bg-surface)",
      border: "1px solid var(--cafe-border-light)",
      borderRadius: 16,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            {title}
          </h3>
        </div>
        {helpText && (
          <button
            onClick={() => toggleHelp(title)}
            style={{
              padding: "6px 10px",
              background: "var(--cafe-accent-bg)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-accent)",
              cursor: "pointer"
            }}
          >
            ?
          </button>
        )}
      </div>
      {showHelp[title] && helpText && (
        <div style={{
          padding: 12,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: "var(--cafe-info)"
        }}>
          {helpText}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 900, margin: "0 auto" }}>
      {/* GST Settings Card */}
      {renderFieldCard(
        "GST Settings",
        "📊",
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, cursor: "pointer", padding: "16px", background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-border)";
            }}
          >
            <input
              type="checkbox"
              checked={formData.gstEnabled}
              onChange={(e) => handleChange('gstEnabled', e.target.checked)}
              style={{ margin: 0, width: 20, height: 20 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Enable GST
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Apply Goods and Services Tax
              </div>
            </div>
          </label>

          {formData.gstEnabled && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                GST Rate (%)
              </label>
              <input
                type="number"
                value={formData.gstRate}
                onChange={(e) => handleChange('gstRate', parseFloat(e.target.value) || 0)}
                min="0"
                max="30"
                step="0.1"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 15,
                  border: validation.gstRate?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = validation.gstRate?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {validation.gstRate?.status === 'warning' && (
                <div style={{ fontSize: 12, color: "var(--cafe-warning)", marginTop: 6 }}>
                  ⚠ {validation.gstRate.message}
                </div>
              )}
            </div>
          )}
        </div>,
        "GST is a tax on goods and services. The rate varies by region. Check your local tax regulations."
      )}

      {/* Service Charge Card */}
      {renderFieldCard(
        "Service Charge",
        "💰",
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, cursor: "pointer", padding: "16px", background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-border)";
            }}
          >
            <input
              type="checkbox"
              checked={formData.serviceChargeEnabled}
              onChange={(e) => handleChange('serviceChargeEnabled', e.target.checked)}
              style={{ margin: 0, width: 20, height: 20 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Enable Service Charge
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Apply additional service charge
              </div>
            </div>
          </label>

          {formData.serviceChargeEnabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Charge Name
                </label>
                <input
                  type="text"
                  value={formData.serviceChargeName}
                  onChange={(e) => handleChange('serviceChargeName', e.target.value)}
                  placeholder="Service Charge"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.serviceChargeRate}
                  onChange={(e) => handleChange('serviceChargeRate', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: validation.serviceChargeRate?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = validation.serviceChargeRate?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {validation.serviceChargeRate?.status === 'warning' && (
                  <div style={{ fontSize: 12, color: "var(--cafe-warning)", marginTop: 6 }}>
                    ⚠ {validation.serviceChargeRate.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>,
        "Service charge is an optional additional fee, often used for table service or large groups."
      )}

      {/* Tax Mode Card */}
      {renderFieldCard(
        "Tax Mode",
        "🔢",
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => handleChange('taxMode', 'inclusive')}
            style={{
              flex: 1,
              padding: "20px",
              border: formData.taxMode === 'inclusive' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 12,
              background: formData.taxMode === 'inclusive' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (formData.taxMode !== 'inclusive') {
                e.currentTarget.style.borderColor = "var(--cafe-accent)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (formData.taxMode !== 'inclusive') {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
              Inclusive
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
              Tax included in prices
            </div>
          </button>
          <button
            onClick={() => handleChange('taxMode', 'exclusive')}
            style={{
              flex: 1,
              padding: "20px",
              border: formData.taxMode === 'exclusive' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 12,
              background: formData.taxMode === 'exclusive' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (formData.taxMode !== 'exclusive') {
                e.currentTarget.style.borderColor = "var(--cafe-accent)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (formData.taxMode !== 'exclusive') {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
              Exclusive
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
              Tax added at checkout
            </div>
          </button>
        </div>,
        "Inclusive: Prices shown include tax. Exclusive: Tax is added to the displayed price at checkout."
      )}

      {/* Receipt Preview Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span>
          Receipt Preview
        </h3>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#333"
        }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {settings?.cafeName || 'Your Cafe'}
            </div>
            <div style={{ fontSize: 11, color: "#666" }}>
              Receipt Preview
            </div>
          </div>
          
          <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Sample Item x 1</span>
              <span>₹{sampleAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {formData.taxMode === 'exclusive' ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <span>₹{taxCalculation.subtotal.toFixed(2)}</span>
                </div>
                {formData.gstEnabled && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>GST ({formData.gstRate}%)</span>
                    <span>₹{taxCalculation.gst.toFixed(2)}</span>
                  </div>
                )}
                {formData.serviceChargeEnabled && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{formData.serviceChargeName} ({formData.serviceChargeRate}%)</span>
                    <span>₹{taxCalculation.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {formData.gstEnabled && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>GST ({formData.gstRate}%)</span>
                    <span>₹{taxCalculation.gst.toFixed(2)}</span>
                  </div>
                )}
                {formData.serviceChargeEnabled && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{formData.serviceChargeName} ({formData.serviceChargeRate}%)</span>
                    <span>₹{taxCalculation.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
            <span>TOTAL</span>
            <span>₹{taxCalculation.total.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: 16, fontSize: 11, color: "#666", textAlign: "center" }}>
            {formData.taxMode === 'inclusive' ? 'Prices include tax' : 'Tax exclusive'}
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
          <strong>💡 Tip:</strong> This preview shows how taxes will appear on customer receipts. Changes update instantly.
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "var(--cafe-accent)";
              e.currentTarget.style.background = "var(--cafe-accent-bg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--cafe-border)";
            e.currentTarget.style.background = "var(--cafe-bg-surface)";
          }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 69, 19, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
