import React from 'react';
// Payment Methods Step for Setup Wizard
// Configure payment methods with toggles and receipt behaviour with premium UX

import { useState, useCallback, useMemo, useId } from "react";
import Tooltip from "../Tooltip.jsx";

const STORAGE_KEY = 'brewcrm_settings_payment';

const PAYMENT_METHODS = [
  { id: 'cash',   name: 'Cash',             icon: '💵', description: 'Physical cash payments',      help: 'Always recommended for small transactions' },
  { id: 'card',   name: 'Card',             icon: '💳', description: 'Credit/Debit card payments',  help: 'Requires card terminal integration' },
  { id: 'upi',    name: 'UPI',              icon: '📱', description: 'QR code-based payments',      help: 'Popular in India for instant transfers' },
  { id: 'online', name: 'Online',           icon: '🌐', description: 'Online payment gateways',     help: 'Razorpay, Stripe, or similar gateways' },
  { id: 'split',  name: 'Split Payment',    icon: '🔀', description: 'Split bills between methods', help: 'Useful for group orders' },
  { id: 'cod',    name: 'Cash on Delivery', icon: '📦', description: 'For delivery orders',         help: 'Only if you offer delivery' },
  { id: 'manual', name: 'Manual Recording', icon: '✏️', description: 'Record payments manually',    help: 'For when systems are down or offline' }
];

// UPI VPA validation: non-empty before and after @, no spaces
const isValidUpiId = (id) => /^[^\s@]+@[^\s@]+$/.test(id.trim());

export default function PaymentMethodsStep({ settings, onNext, onBack, isMobile, isLoading, error, setError }) {
  const cardId = useId();

  const [formData, setFormData] = useState({
    cashEnabled:          settings?.cashEnabled !== false,
    cardEnabled:          settings?.cardEnabled !== false,
    upiEnabled:           settings?.upiEnabled !== false,
    onlineEnabled:        settings?.onlineEnabled !== false,
    splitEnabled:         settings?.splitEnabled !== false,
    codEnabled:           settings?.codEnabled !== false,
    manualEnabled:        settings?.manualEnabled !== false,
    defaultPayment:       settings?.defaultPayment || 'cash',
    tipsEnabled:          settings?.tipsEnabled !== false,
    autoPrintReceipt:     settings?.autoPrintReceipt !== false,
    signatureRequired:    settings?.signatureRequired || false,
    cashMinAmount:        settings?.cashMinAmount ?? 0,
    cardMinAmount:        settings?.cardMinAmount ?? 10,
    upiMinAmount:         settings?.upiMinAmount ?? 1,
    onlineMinAmount:      settings?.onlineMinAmount ?? 10,
    cardSurcharge:        settings?.cardSurcharge ?? 0,
    requireCardPin:       settings?.requireCardPin || false,
    upiId:                settings?.upiId || '',
    onlineGateway:        settings?.onlineGateway || 'razorpay',
    allowPartialPayments: settings?.allowPartialPayments || false,
    maxSplitMethods:      settings?.maxSplitMethods || 3
  });

  // Use stable IDs for help toggles instead of title strings
  const [showHelp, setShowHelp] = useState({});
  const [validation, setValidation] = useState({});

  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      if (field.endsWith('Enabled') && value === false) {
        const otherEnabled = Object.keys(prev).some(
          key => key.endsWith('Enabled') && key !== field && prev[key]
        );
        if (!otherEnabled) {
          setValidation(v => ({
            ...v,
            paymentMethods: { status: 'warning', message: 'At least one payment method must stay enabled' }
          }));
          return prev;
        }
      }

      const next = { ...prev, [field]: value };

      if (field.endsWith('Enabled') && !value && prev.defaultPayment === field.slice(0, -'Enabled'.length)) {
        const fallback = PAYMENT_METHODS.find(m => next[m.id + 'Enabled'] && m.id !== prev.defaultPayment);
        if (fallback) next.defaultPayment = fallback.id;
      }

      return next;
    });

    if (field.endsWith('Enabled')) {
      setValidation(v => ({ ...v, paymentMethods: null }));
    }
  }, []);

  const handleNext = useCallback(() => {
    const enabledMethods = Object.keys(formData).filter(key => key.endsWith('Enabled') && formData[key]);
    if (enabledMethods.length === 0) {
      setError({ title: 'No Payment Methods', message: 'Please enable at least one payment method to continue.' });
      return;
    }

    // Warn on invalid UPI ID if UPI is enabled
    if (formData.upiEnabled && formData.upiId.trim() && !isValidUpiId(formData.upiId)) {
      setError({ title: 'Invalid UPI ID', message: 'Please enter a valid UPI ID (e.g. yourname@bank) before continuing.' });
      return;
    }

    // Merge: keep any non-overlapping parent settings keys, formData wins on conflicts
    const updatedSettings = { ...settings, ...formData };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist payment settings to localStorage:', e);
    }

    onNext(formData);
  }, [formData, settings, onNext, setError]);

  const toggleHelp = useCallback((id) => {
    setShowHelp(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const enabledMethodsCount = useMemo(
    () => Object.keys(formData).filter(key => key.endsWith('Enabled') && formData[key]).length,
    [formData]
  );

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--cafe-border)",
    borderRadius: 8,
    background: "var(--cafe-bg-surface)",
    color: "var(--cafe-text-primary)",
    outline: "none"
  };

  const checkboxRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    padding: "10px 12px",
    border: "1px solid var(--cafe-border)",
    borderRadius: 8,
    background: "var(--cafe-bg-surface)",
    height: 42,
    boxSizing: "border-box"
  };

  const renderFieldCard = (id, title, icon, children, helpText) => (
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
            onClick={() => toggleHelp(id)}
            aria-label={`${showHelp[id] ? 'Hide' : 'Show'} help for ${title}`}
            aria-expanded={!!showHelp[id]}
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
      {showHelp[id] && helpText && (
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

  // Display any parent-passed error at the top
  const parentError = error && (
    <div style={{
      marginBottom: 16,
      padding: "12px 16px",
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: 10,
      fontSize: 13,
      color: "#b91c1c"
    }}>
      <strong>{error.title}: </strong>{error.message}
    </div>
  );

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 900, margin: "0 auto" }}>
      {parentError}

      {/* Payment Methods Card */}
      {renderFieldCard(
        "accepted-methods",
        "Accepted Methods",
        "💳",
        <>
          <div style={{
            background: "var(--cafe-bg)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {PAYMENT_METHODS.map((method, idx) => {
              const isEnabled = formData[method.id + 'Enabled'];
              const isLastEnabled = isEnabled && enabledMethodsCount === 1;
              return (
                <label
                  key={method.id}
                  title={isLastEnabled ? 'At least one payment method must stay enabled' : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderBottom: idx < PAYMENT_METHODS.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                    cursor: isLastEnabled ? "not-allowed" : "pointer",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isLastEnabled) e.currentTarget.style.background = "var(--cafe-bg-surface)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleChange(method.id + 'Enabled', e.target.checked)}
                    disabled={isLastEnabled}
                    style={{ margin: 0, width: 18, height: 18, cursor: isLastEnabled ? "not-allowed" : "pointer" }}
                  />
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: isEnabled ? "var(--cafe-accent)" : "var(--cafe-accent-bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, opacity: isLastEnabled ? 0.7 : 1, transition: "all 0.2s ease"
                  }}>
                    {method.icon}
                  </div>
                  <div style={{ flex: 1, opacity: isLastEnabled ? 0.7 : 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{method.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{method.description}</div>
                  </div>
                  {isEnabled && <span style={{ fontSize: 16, color: "#10b981" }}>✓</span>}
                </label>
              );
            })}
          </div>
          {validation.paymentMethods?.status === 'warning' && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#fef3c7", border: "1px solid #f59e0b",
              borderRadius: 8, fontSize: 12, color: "#92400e"
            }}>
              ⚠️ {validation.paymentMethods.message}
            </div>
          )}
        </>,
        "Select all payment methods your cafe accepts. You can change these later in Settings."
      )}

      {/* Default Payment Card */}
      {renderFieldCard(
        "default-method",
        "Default Method",
        "⭐",
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
          {PAYMENT_METHODS.filter(m => formData[m.id + 'Enabled']).map(method => (
            <button
              key={method.id}
              onClick={() => handleChange('defaultPayment', method.id)}
              style={{
                padding: 16,
                border: formData.defaultPayment === method.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: formData.defaultPayment === method.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (formData.defaultPayment !== method.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (formData.defaultPayment !== method.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: 22 }}>{method.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{method.name}</span>
              {formData.defaultPayment === method.id && (
                <span style={{ marginLeft: "auto", fontSize: 16, color: "var(--cafe-accent)" }}>✓</span>
              )}
            </button>
          ))}
          {enabledMethodsCount === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 20, textAlign: "center", color: "var(--cafe-text-tertiary)", fontSize: 13 }}>
              Enable payment methods above to set default
            </div>
          )}
        </div>,
        "The default payment method is pre-selected for new orders."
      )}

      {/* Advanced Settings Card */}
      {renderFieldCard(
        "advanced-settings",
        "Advanced Settings",
        "⚙️",
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Minimum Amounts — 2-col so inputs have breathing room */}
          <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>💰</span> Minimum Amounts (₹)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { label: "Cash",   field: "cashMinAmount",   value: formData.cashMinAmount },
                { label: "Card",   field: "cardMinAmount",   value: formData.cardMinAmount },
                { label: "UPI",    field: "upiMinAmount",    value: formData.upiMinAmount },
                { label: "Online", field: "onlineMinAmount", value: formData.onlineMinAmount },
              ].map(({ label, field, value }) => (
                <div key={field}>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(field, Math.max(0, parseFloat(e.target.value) || 0))}
                    onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                    min="0"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card Settings — surcharge + PIN side by side */}
          <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>💳</span> Card Settings
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, alignItems: "end" }}>
              <div>
                <label htmlFor={`${cardId}-surcharge`} style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>Surcharge (%)</label>
                <input
                  id={`${cardId}-surcharge`}
                  type="number"
                  value={formData.cardSurcharge}
                  onChange={(e) => handleChange('cardSurcharge', Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                  onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                  min="0" max="10" step="0.1"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={formData.requireCardPin}
                    onChange={(e) => handleChange('requireCardPin', e.target.checked)}
                    style={{ width: 16, height: 16, margin: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>Require PIN</span>
                </label>
              </div>
            </div>
          </div>

          {/* UPI Settings */}
          {formData.upiEnabled && (
            <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                <span style={{ fontSize: 15 }}>📱</span> UPI Settings
              </div>
              <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>UPI ID / VPA</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="yourname@bank"
                style={{
                  ...inputStyle,
                  borderColor: formData.upiId.trim() && !isValidUpiId(formData.upiId) ? "#f59e0b" : "var(--cafe-border)"
                }}
              />
              {formData.upiId.trim() && !isValidUpiId(formData.upiId) && (
                <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                  UPI ID must be in the format yourname@bank (no spaces)
                </div>
              )}
            </div>
          )}

          {/* Online Gateway */}
          {formData.onlineEnabled && (
            <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                <span style={{ fontSize: 15 }}>🌐</span> Online Gateway
              </div>
              <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>Payment Provider</label>
              <select
                value={formData.onlineGateway}
                onChange={(e) => handleChange('onlineGateway', e.target.value)}
                style={inputStyle}
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="custom">Custom Gateway</option>
              </select>
            </div>
          )}

          {/* Split Payment Settings */}
          {formData.splitEnabled && (
            <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                <span style={{ fontSize: 15 }}>🔀</span> Split Payment Settings
                <Tooltip content="Allow customers to split their bill across multiple payment methods. Useful for group orders." position="top" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={formData.allowPartialPayments}
                      onChange={(e) => handleChange('allowPartialPayments', e.target.checked)}
                      style={{ width: 16, height: 16, margin: 0 }}
                    />
                    <span style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>Allow Partial Payments</span>
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    Max Split Methods
                    <Tooltip content="Maximum number of different payment methods allowed for a single transaction (2–5)." position="top" />
                  </label>
                  <input
                    type="number"
                    value={formData.maxSplitMethods}
                    onChange={(e) => handleChange('maxSplitMethods', Math.min(5, Math.max(2, parseInt(e.target.value) || 3)))}
                    onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                    min="2" max="5"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Manual Recording Notice */}
          {formData.manualEnabled && (
            <div style={{ padding: 16, background: "#fef3c7", borderRadius: 10, border: "1px solid #f59e0b" }}>
              <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
                <strong>⚠️ Manual Recording Mode:</strong> This allows you to record payments when payment systems are offline or unavailable. All transactions will be marked as "manually recorded" and should be reconciled later.
              </div>
            </div>
          )}
        </div>,
        "Fine-tune payment behavior with minimum amounts, surcharges, and method-specific settings."
      )}

      {/* Receipt Settings Card */}
      {renderFieldCard(
        "receipt-settings",
        "Receipt Settings",
        "🧾",
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { field: "tipsEnabled",       label: "Enable Tips",        desc: "Allow customers to add tips on payment" },
            { field: "autoPrintReceipt",  label: "Auto-print Receipts", desc: "Automatically print receipt after payment" },
            { field: "signatureRequired", label: "Require Signature",  desc: "Require customer signature for card payments" },
          ].map(({ field, label, desc }) => (
            <label key={field} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: 16, background: "var(--cafe-bg)", borderRadius: 10, border: "1px solid var(--cafe-border)" }}>
              <input
                type="checkbox"
                checked={formData[field]}
                onChange={(e) => handleChange(field, e.target.checked)}
                style={{ margin: 0, width: 18, height: 18 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{desc}</div>
              </div>
            </label>
          ))}
        </div>,
        "Configure how receipts are handled and printed after payments."
      )}

      {/* Live Preview Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span> Payment Preview
        </h3>
        <div style={{ background: "var(--cafe-bg)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20, color: "var(--cafe-text-primary)" }}>
          <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
            <strong style={{ color: "var(--cafe-text-primary)" }}>{enabledMethodsCount}</strong> payment method(s) enabled
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {PAYMENT_METHODS.filter(m => formData[m.id + 'Enabled']).map(method => (
              <span key={method.id} style={{
                padding: "8px 14px", background: "var(--cafe-accent-bg)", borderRadius: 20,
                fontSize: 12, fontWeight: 600, color: "var(--cafe-accent)", border: "1px solid var(--cafe-accent)"
              }}>
                {method.icon} {method.name}
              </span>
            ))}
          </div>
          {enabledMethodsCount > 0 && (
            <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", paddingTop: 16, borderTop: "1px solid var(--cafe-border)" }}>
              Default: <strong style={{ color: "var(--cafe-text-primary)" }}>
                {PAYMENT_METHODS.find(m => m.id === formData.defaultPayment)?.name || 'Not set'}
              </strong>
            </div>
          )}
          {enabledMethodsCount === 0 && (
            <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", fontStyle: "italic" }}>
              No payment methods configured
            </div>
          )}
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
            borderRadius: 10, fontSize: 15, fontWeight: 600,
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
          disabled={isLoading || enabledMethodsCount === 0}
          style={{
            padding: "14px 32px",
            background: enabledMethodsCount > 0 ? "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)" : "var(--cafe-text-tertiary)",
            border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
            color: "#fff",
            cursor: isLoading || enabledMethodsCount === 0 ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: enabledMethodsCount > 0 ? 1 : 0.5,
            display: "flex", alignItems: "center", gap: 8
          }}
          onMouseEnter={(e) => {
            if (enabledMethodsCount > 0 && !isLoading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 69, 19, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {isLoading && (
            <span style={{
              width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.7s linear infinite"
            }} />
          )}
          Next →
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
