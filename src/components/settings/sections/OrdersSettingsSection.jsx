import React from 'react';
// Orders Settings Section - Order Configuration
// Premium order management settings

import { useState, useCallback } from "react";

export default function OrdersSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    orderNumberFormat: settings?.orderNumberFormat || "ORD-{YYYY}{MM}{DD}-{seq}",
    orderNumberPrefix: settings?.orderNumberPrefix || "ORD",
    orderNumberSequence: settings?.orderNumberSequence || 1,
    defaultOrderType: settings?.defaultOrderType || "dine_in",
    autoAccept: settings?.autoAccept || false,
    autoComplete: settings?.autoComplete || false,
    autoPrint: settings?.autoPrint || false,
    kitchenDelayThreshold: settings?.kitchenDelayThreshold || 15,
    requireVoidReason: settings?.requireVoidReason !== false,
    requireCancellationReason: settings?.requireCancellationReason !== false,
    allowSplitBills: settings?.allowSplitBills !== false,
    splitBillDefault: settings?.splitBillDefault || "equal",
    allowTableTransfer: settings?.allowTableTransfer !== false,
    allowItemNotes: settings?.allowItemNotes !== false,
    allowOrderNotes: settings?.allowOrderNotes !== false,
    requireCustomerName: settings?.requireCustomerName || false,
    requirePhoneForDelivery: settings?.requirePhoneForDelivery !== false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const orderTypes = [
    { id: "dine_in", name: "Dine In", icon: "🍽️" },
    { id: "takeaway", name: "Takeaway", icon: "🥡" },
    { id: "delivery", name: "Delivery", icon: "🚴" }
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
          Orders
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure order numbering, defaults, and processing rules
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Order Numbering */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Order Numbering
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
                  Order Number Format
                </label>
                <input
                  type="text"
                  value={formData.orderNumberFormat}
                  onChange={(e) => handleChange('orderNumberFormat', e.target.value)}
                  placeholder="ORD-{YYYY}{MM}{DD}-{seq}"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)",
                    fontFamily: "monospace"
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                  Variables: {YYYY}, {MM}, {DD}, {seq}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumberPrefix}
                    onChange={(e) => handleChange('orderNumberPrefix', e.target.value)}
                    placeholder="ORD"
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
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Starting Sequence
                  </label>
                  <input
                    type="number"
                    value={formData.orderNumberSequence}
                    onChange={(e) => handleChange('orderNumberSequence', parseInt(e.target.value) || 1)}
                    min="1"
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Defaults */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Order Defaults
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
                  Default Order Type
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {orderTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleChange('defaultOrderType', type.id)}
                      style={{
                        padding: "16px",
                        background: formData.defaultOrderType === type.id ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                        border: formData.defaultOrderType === type.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: formData.defaultOrderType === type.id ? "#fff" : "var(--cafe-text-primary)",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{type.icon}</div>
                      <div>{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoAccept}
                  onChange={(e) => handleChange('autoAccept', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Accept Orders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically accept new orders without confirmation
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoComplete}
                  onChange={(e) => handleChange('autoComplete', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Complete Orders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically complete orders after payment
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoPrint}
                  onChange={(e) => handleChange('autoPrint', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Print Receipts
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically print receipt after payment
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Kitchen Rules */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Kitchen Rules
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
                  Kitchen Delay Threshold (minutes)
                </label>
                <input
                  type="number"
                  value={formData.kitchenDelayThreshold}
                  onChange={(e) => handleChange('kitchenDelayThreshold', parseInt(e.target.value) || 15)}
                  min="5"
                  max="60"
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
                  Orders taking longer than this will be flagged as delayed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Void & Cancellation Rules */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Void & Cancellation Rules
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
                  checked={formData.requireVoidReason}
                  onChange={(e) => handleChange('requireVoidReason', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Void Reason
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require reason when voiding items
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireCancellationReason}
                  onChange={(e) => handleChange('requireCancellationReason', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Cancellation Reason
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require reason when cancelling orders
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Split Bill Rules */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Split Bill Rules
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
                  checked={formData.allowSplitBills}
                  onChange={(e) => handleChange('allowSplitBills', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Allow Split Bills
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow splitting bills between customers
                  </div>
                </div>
              </label>

              {formData.allowSplitBills && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Default Split Method
                  </label>
                  <select
                    value={formData.splitBillDefault}
                    onChange={(e) => handleChange('splitBillDefault', e.target.value)}
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
                    <option value="equal">Equal Split</option>
                    <option value="percentage">Percentage Split</option>
                    <option value="custom">Custom Split</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Rules */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Additional Rules
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
                  checked={formData.allowTableTransfer}
                  onChange={(e) => handleChange('allowTableTransfer', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Allow Table Transfer
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow moving orders between tables
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.allowItemNotes}
                  onChange={(e) => handleChange('allowItemNotes', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Allow Item Notes
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow adding notes to individual items
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.allowOrderNotes}
                  onChange={(e) => handleChange('allowOrderNotes', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Allow Order Notes
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow adding notes to entire orders
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireCustomerName}
                  onChange={(e) => handleChange('requireCustomerName', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Customer Name
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require customer name for all orders
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requirePhoneForDelivery}
                  onChange={(e) => handleChange('requirePhoneForDelivery', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Phone for Delivery
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require phone number for delivery orders
                  </div>
                </div>
              </label>
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
