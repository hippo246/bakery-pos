import React from 'react';
// Delivery Settings Section - Delivery Configuration
// Premium delivery management settings

import { useState, useCallback } from "react";

export default function DeliverySettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    deliveryRadius: settings?.deliveryRadius || 5,
    baseDeliveryCharge: settings?.baseDeliveryCharge || 0,
    freeDeliveryThreshold: settings?.freeDeliveryThreshold || 0,
    freeDeliveryEnabled: settings?.freeDeliveryEnabled || false,
    dispatchBehaviour: settings?.dispatchBehaviour || "auto",
    driverAssignment: settings?.driverAssignment || "auto",
    routeOptimization: settings?.routeOptimization || false,
    estimatedTimeDefault: settings?.estimatedTimeDefault || 30,
    requireProofOfDelivery: settings?.requireProofOfDelivery || false,
    proofOfDeliveryOptions: settings?.proofOfDeliveryOptions || ["signature"],
    statusTiming: settings?.statusTiming || "manual",
    autoAcceptDelivery: settings?.autoAcceptDelivery || false,
    minimumOrderForDelivery: settings?.minimumOrderForDelivery || 0
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const dispatchBehaviours = [
    { id: "auto", name: "Auto Dispatch", description: "Automatically dispatch orders" },
    { id: "manual", name: "Manual Dispatch", description: "Require manual dispatch" },
    { id: "batch", name: "Batch Dispatch", description: "Dispatch in batches" }
  ];

  const driverAssignments = [
    { id: "auto", name: "Auto Assign", description: "Automatically assign nearest driver" },
    { id: "manual", name: "Manual Assign", description: "Manually assign drivers" },
    { id: "rotation", name: "Rotation", description: "Rotate through available drivers" }
  ];

  const statusTimings = [
    { id: "manual", name: "Manual Updates" },
    { id: "auto", name: "Auto Update" },
    { id: "gps", name: "GPS Based" }
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
          Delivery
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure delivery radius, charges, and dispatch rules
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Delivery Zone */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Delivery Zone
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
                  Delivery Radius (km)
                </label>
                <input
                  type="number"
                  value={formData.deliveryRadius}
                  onChange={(e) => handleChange('deliveryRadius', parseFloat(e.target.value) || 5)}
                  min="1"
                  max="50"
                  step="0.5"
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
                  Minimum Order for Delivery (₹)
                </label>
                <input
                  type="number"
                  value={formData.minimumOrderForDelivery}
                  onChange={(e) => handleChange('minimumOrderForDelivery', parseFloat(e.target.value) || 0)}
                  min="0"
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

        {/* Delivery Charges */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Delivery Charges
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
                  Base Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  value={formData.baseDeliveryCharge}
                  onChange={(e) => handleChange('baseDeliveryCharge', parseFloat(e.target.value) || 0)}
                  min="0"
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

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.freeDeliveryEnabled}
                  onChange={(e) => handleChange('freeDeliveryEnabled', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Free Delivery
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Offer free delivery above a threshold
                  </div>
                </div>
              </label>

              {formData.freeDeliveryEnabled && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) => handleChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                    min="0"
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
              )}
            </div>
          </div>
        </div>

        {/* Dispatch Behaviour */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Dispatch Behaviour
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
                  Dispatch Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {dispatchBehaviours.map(behaviour => (
                    <button
                      key={behaviour.id}
                      onClick={() => handleChange('dispatchBehaviour', behaviour.id)}
                      style={{
                        padding: "16px",
                        background: formData.dispatchBehaviour === behaviour.id ? "var(--cafe-accent)" : "var(--cafe-bg-surface)",
                        border: formData.dispatchBehaviour === behaviour.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: formData.dispatchBehaviour === behaviour.id ? "#fff" : "var(--cafe-text-primary)",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>🚚</div>
                      <div>{behaviour.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoAcceptDelivery}
                  onChange={(e) => handleChange('autoAcceptDelivery', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Accept Delivery Orders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically accept delivery orders
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Driver Assignment */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Driver Assignment
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
                  Assignment Mode
                </label>
                <select
                  value={formData.driverAssignment}
                  onChange={(e) => handleChange('driverAssignment', e.target.value)}
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
                  {driverAssignments.map(da => (
                    <option key={da.id} value={da.id}>{da.name}</option>
                  ))}
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.routeOptimization}
                  onChange={(e) => handleChange('routeOptimization', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Route Optimization
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Optimize delivery routes for drivers
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Timing & Status */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Timing & Status
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
                  Default Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimatedTimeDefault}
                  onChange={(e) => handleChange('estimatedTimeDefault', parseInt(e.target.value) || 30)}
                  min="5"
                  max="120"
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
                  Status Update Mode
                </label>
                <select
                  value={formData.statusTiming}
                  onChange={(e) => handleChange('statusTiming', e.target.value)}
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
                  {statusTimings.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Proof of Delivery */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Proof of Delivery
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
                  checked={formData.requireProofOfDelivery}
                  onChange={(e) => handleChange('requireProofOfDelivery', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Proof of Delivery
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Require confirmation when order is delivered
                  </div>
                </div>
              </label>

              {formData.requireProofOfDelivery && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Proof Options
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["signature", "photo", "otp"].map(option => (
                      <label key={option} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.proofOfDeliveryOptions?.includes(option)}
                          onChange={(e) => {
                            const current = formData.proofOfDeliveryOptions || [];
                            if (e.target.checked) {
                              handleChange('proofOfDeliveryOptions', [...current, option]);
                            } else {
                              handleChange('proofOfDeliveryOptions', current.filter(o => o !== option));
                            }
                          }}
                          style={{ margin: 0 }}
                        />
                        <div style={{ fontSize: 14, color: "var(--cafe-text-primary)", textTransform: "capitalize" }}>
                          {option}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
