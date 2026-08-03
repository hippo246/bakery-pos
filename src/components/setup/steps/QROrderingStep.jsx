import React from 'react';
// QR Ordering Step for Setup Wizard
// Configure QR ordering with full functionality, order flow integration, and security

import { useState, useCallback } from "react";

export default function QROrderingStep({ settings, onNext, onBack, onSkip, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [formData, setFormData] = useState({
    qrEnabled: settings?.qrEnabled || false,
    guestMenuEnabled: settings?.guestMenuEnabled !== false,
    // QR Code Settings
    qrCodeStyle: settings?.qrCodeStyle || 'standard',
    qrSize: settings?.qrSize || 'medium',
    customBranding: settings?.customBranding || false,
    // Order Flow
    requireTableSelection: settings?.requireTableSelection !== false,
    autoAcceptOrders: settings?.autoAcceptOrders || false,
    orderConfirmationRequired: settings?.orderConfirmationRequired !== false,
    estimatedPrepTime: settings?.estimatedPrepTime || 15,
    // Security
    requireCustomerPhone: settings?.requireCustomerPhone || false,
    requireCustomerName: settings?.requireCustomerName || false,
    orderLimitPerSession: settings?.orderLimitPerSession || 5,
    sessionTimeout: settings?.sessionTimeout || 30,
    // Payment
    allowPrepayment: settings?.allowPrepayment || false,
    paymentOnOrder: settings?.paymentOnOrder || false,
    paymentOnDelivery: settings?.paymentOnDelivery !== false,
    // Notifications
    notifyKitchen: settings?.notifyKitchen !== false,
    notifyStaff: settings?.notifyStaff !== false,
    soundAlert: settings?.soundAlert !== false,
    // Menu Options
    showOutOfStock: settings?.showOutOfStock !== false,
    allowModifications: settings?.allowModifications !== false,
    showItemImages: settings?.showItemImages !== false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Parses a numeric field, falling back only when the input is genuinely
  // empty/invalid (not when the user types 0), and clamps to [min, max] so
  // typed-in values can't exceed the intended range (HTML min/max alone
  // don't block direct typing).
  const handleNumberChange = useCallback((field, rawValue, { min, max, fallback }) => {
    const parsed = parseInt(rawValue, 10);
    const value = Number.isNaN(parsed) ? fallback : Math.min(max, Math.max(min, parsed));
    handleChange(field, value);
  }, [handleChange]);

  const handleNext = useCallback(() => {
    if (formData.qrEnabled && !formData.requireTableSelection) {
      setError({ title: 'Configuration Required', message: 'Table selection is required for QR ordering to work properly.' });
      return;
    }

    if (formData.qrEnabled && !formData.allowPrepayment && !formData.paymentOnOrder && !formData.paymentOnDelivery) {
      setError({ title: 'Configuration Required', message: 'At least one payment option must be enabled for QR ordering.' });
      return;
    }

    const updatedSettings = {
      ...settings,
      ...formData
    };

    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
    }

    onNext(formData);
  }, [formData, settings, onNext, setError]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          QR Ordering Setup
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Enable customers to order directly from their table using QR codes.
        </p>
      </div>

      {/* Main Toggle */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={formData.qrEnabled}
            onChange={(e) => handleChange('qrEnabled', e.target.checked)}
            style={{ width: 24, height: 24 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              Enable QR Ordering
            </div>
            <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
              Allow customers to scan table QR codes to browse menu and place orders
            </div>
          </div>
          <span style={{ fontSize: 32 }}>📱</span>
        </label>
      </div>

      {formData.qrEnabled && (
        <>
          {/* QR Code Settings */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🎨</span>
              QR Code Appearance
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  QR Code Style
                </label>
                <select
                  value={formData.qrCodeStyle}
                  onChange={(e) => handleChange('qrCodeStyle', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none"
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="rounded">Rounded</option>
                  <option value="branded">Branded with Logo</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  QR Code Size
                </label>
                <select
                  value={formData.qrSize}
                  onChange={(e) => handleChange('qrSize', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none"
                  }}
                >
                  <option value="small">Small (150x150)</option>
                  <option value="medium">Medium (250x250)</option>
                  <option value="large">Large (350x350)</option>
                </select>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
              <input
                type="checkbox"
                checked={formData.customBranding}
                onChange={(e) => handleChange('customBranding', e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Add custom branding/logo to QR codes</span>
            </label>
          </div>

          {/* Order Flow */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🔄</span>
              Order Flow
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.requireTableSelection}
                  onChange={(e) => handleChange('requireTableSelection', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Require table selection</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.autoAcceptOrders}
                  onChange={(e) => handleChange('autoAcceptOrders', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Auto-accept orders</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.orderConfirmationRequired}
                  onChange={(e) => handleChange('orderConfirmationRequired', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Require order confirmation</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.guestMenuEnabled}
                  onChange={(e) => handleChange('guestMenuEnabled', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Enable guest menu (view only)</span>
              </label>
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Estimated Prep Time (minutes)
              </label>
              <input
                type="number"
                value={formData.estimatedPrepTime}
                onChange={(e) => handleNumberChange('estimatedPrepTime', e.target.value, { min: 5, max: 60, fallback: 15 })}
                min="5"
                max="60"
                style={{
                  width: "100%",
                  maxWidth: 200,
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Security */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🔒</span>
              Security & Limits
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.requireCustomerPhone}
                  onChange={(e) => handleChange('requireCustomerPhone', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Require customer phone</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.requireCustomerName}
                  onChange={(e) => handleChange('requireCustomerName', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Require customer name</span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Order Limit per Session
                </label>
                <input
                  type="number"
                  value={formData.orderLimitPerSession}
                  onChange={(e) => handleNumberChange('orderLimitPerSession', e.target.value, { min: 1, max: 20, fallback: 5 })}
                  min="1"
                  max="20"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleNumberChange('sessionTimeout', e.target.value, { min: 10, max: 120, fallback: 30 })}
                  min="10"
                  max="120"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    background: "var(--cafe-bg)",
                    color: "var(--cafe-text-primary)",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>💳</span>
              Payment Options
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.allowPrepayment}
                  onChange={(e) => handleChange('allowPrepayment', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Allow prepayment</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.paymentOnOrder}
                  onChange={(e) => handleChange('paymentOnOrder', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Pay on order</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.paymentOnDelivery}
                  onChange={(e) => handleChange('paymentOnDelivery', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Pay on delivery</span>
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🔔</span>
              Notifications
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.notifyKitchen}
                  onChange={(e) => handleChange('notifyKitchen', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Notify kitchen</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.notifyStaff}
                  onChange={(e) => handleChange('notifyStaff', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Notify staff</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.soundAlert}
                  onChange={(e) => handleChange('soundAlert', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Sound alerts</span>
              </label>
            </div>
          </div>

          {/* Menu Options */}
          <div style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span>📋</span>
              Menu Display Options
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.showOutOfStock}
                  onChange={(e) => handleChange('showOutOfStock', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Show out of stock</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.allowModifications}
                  onChange={(e) => handleChange('allowModifications', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Allow modifications</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
                <input
                  type="checkbox"
                  checked={formData.showItemImages}
                  onChange={(e) => handleChange('showItemImages', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Show item images</span>
              </label>
            </div>
          </div>
        </>
      )}

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
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
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
        >
          Skip
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
        >
          Next →
        </button>
      </div>
    </div>
  );
}
