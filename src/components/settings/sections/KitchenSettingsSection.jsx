import React from 'react';
// Kitchen Settings Section - KDS Configuration
// Premium kitchen display settings

import { useState, useCallback } from "react";

export default function KitchenSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    kdsEnabled: settings?.kdsEnabled !== false,
    defaultPrepTime: settings?.defaultPrepTime || 15,
    stationBehaviour: settings?.stationBehaviour || "auto",
    ticketColors: settings?.ticketColors !== false,
    bumpBehaviour: settings?.bumpBehaviour || "all",
    recallBehaviour: settings?.recallBehaviour || "bottom",
    urgentThreshold: settings?.urgentThreshold || 10,
    criticalThreshold: settings?.criticalThreshold || 20,
    audioAlerts: settings?.audioAlerts !== false,
    alertSound: settings?.alertSound || "chime",
    autoAdvance: settings?.autoAdvance || false,
    itemLevelCompletion: settings?.itemLevelCompletion || false,
    preparationTimers: settings?.preparationTimers !== false,
    showPrepTime: settings?.showPrepTime !== false,
    printKitchenTicket: settings?.printKitchenTicket || false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const stationBehaviours = [
    { id: "auto", name: "Auto Assign", description: "Automatically assign to available stations" },
    { id: "manual", name: "Manual Assign", description: "Manually assign to specific stations" },
    { id: "balanced", name: "Balanced", description: "Distribute evenly across stations" }
  ];

  const bumpBehaviours = [
    { id: "all", name: "Bump All", description: "Bump entire order when complete" },
    { id: "item", name: "Bump Item", description: "Bump individual items" },
    { id: "category", name: "Bump Category", description: "Bump by category" }
  ];

  const alertSounds = [
    { id: "chime", name: "Chime" },
    { id: "bell", name: "Bell" },
    { id: "alert", name: "Alert" },
    { id: "none", name: "None" }
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
          Kitchen
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure KDS behavior, station management, and kitchen alerts
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* KDS General */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            KDS General
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
                  checked={formData.kdsEnabled}
                  onChange={(e) => handleChange('kdsEnabled', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Kitchen Display System
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Use digital kitchen displays instead of paper tickets
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoAdvance}
                  onChange={(e) => handleChange('autoAdvance', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Advance Orders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically advance orders to next stage
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.itemLevelCompletion}
                  onChange={(e) => handleChange('itemLevelCompletion', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Item-Level Completion
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow completing individual items instead of entire orders
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.printKitchenTicket}
                  onChange={(e) => handleChange('printKitchenTicket', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Print Kitchen Tickets
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Print paper tickets in addition to KDS display
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Preparation Times */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Preparation Times
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
                  Default Prep Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.defaultPrepTime}
                  onChange={(e) => handleChange('defaultPrepTime', parseInt(e.target.value) || 15)}
                  min="1"
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

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.preparationTimers}
                  onChange={(e) => handleChange('preparationTimers', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Preparation Timers
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display countdown timers on kitchen tickets
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.showPrepTime}
                  onChange={(e) => handleChange('showPrepTime', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Show Prep Time on Orders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Display estimated prep time on order tickets
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Station Behaviour */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Station Behaviour
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stationBehaviours.map(behaviour => (
                <button
                  key={behaviour.id}
                  onClick={() => handleChange('stationBehaviour', behaviour.id)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: formData.stationBehaviour === behaviour.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    border: formData.stationBehaviour === behaviour.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (formData.stationBehaviour !== behaviour.id) {
                      e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.stationBehaviour !== behaviour.id) {
                      e.currentTarget.style.borderColor = "var(--cafe-border)";
                    }
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    {behaviour.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {behaviour.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Behaviour */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Ticket Behaviour
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
                  checked={formData.ticketColors}
                  onChange={(e) => handleChange('ticketColors', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Use Ticket Colors
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Color-code tickets by order type or priority
                  </div>
                </div>
              </label>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Bump Behaviour
                </label>
                <select
                  value={formData.bumpBehaviour}
                  onChange={(e) => handleChange('bumpBehaviour', e.target.value)}
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
                  {bumpBehaviours.map(bh => (
                    <option key={bh.id} value={bh.id}>{bh.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Recall Behaviour
                </label>
                <select
                  value={formData.recallBehaviour}
                  onChange={(e) => handleChange('recallBehaviour', e.target.value)}
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
                  <option value="bottom">Recall to Bottom</option>
                  <option value="top">Recall to Top</option>
                  <option value="original">Recall to Original Position</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Thresholds
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
                  Urgent Threshold (minutes)
                </label>
                <input
                  type="number"
                  value={formData.urgentThreshold}
                  onChange={(e) => handleChange('urgentThreshold', parseInt(e.target.value) || 10)}
                  min="1"
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
                  Orders exceeding this time will be marked as urgent
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Critical Threshold (minutes)
                </label>
                <input
                  type="number"
                  value={formData.criticalThreshold}
                  onChange={(e) => handleChange('criticalThreshold', parseInt(e.target.value) || 20)}
                  min="1"
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
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                  Orders exceeding this time will be marked as critical
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Alerts */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Audio Alerts
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
                  checked={formData.audioAlerts}
                  onChange={(e) => handleChange('audioAlerts', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Audio Alerts
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Play sound for new orders and urgent tickets
                  </div>
                </div>
              </label>

              {formData.audioAlerts && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Alert Sound
                  </label>
                  <select
                    value={formData.alertSound}
                    onChange={(e) => handleChange('alertSound', e.target.value)}
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
                    {alertSounds.map(sound => (
                      <option key={sound.id} value={sound.id}>{sound.name}</option>
                    ))}
                  </select>
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
