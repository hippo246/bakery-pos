import React from 'react';
// Settings Home - Operational Dashboard
// Premium command center overview

import { useState, useCallback, useMemo } from "react";

export default function SettingsHomeSection({ settings, onNavigate, isMobile }) {
  const [systemStatus, setSystemStatus] = useState({
    version: "1.0.0",
    build: "2024.07.26",
    database: "healthy",
    storage: "45%",
    lastBackup: "2 hours ago",
    lastSync: "5 minutes ago",
    connectedDevices: 3,
    notifications: "active",
    security: "secure"
  });

  const quickActions = useMemo(() => [
    { id: "backup", label: "Create Backup", icon: "💾", description: "Backup all data", action: () => onNavigate("backups") },
    { id: "sync", label: "Sync Data", icon: "🔄", description: "Sync with cloud", action: () => {} },
    { id: "security", label: "Security Check", icon: "🔒", description: "Review security", action: () => onNavigate("security") },
    { id: "support", label: "Get Help", icon: "🛠️", description: "Contact support", action: () => onNavigate("support") }
  ], [onNavigate]);

  const operationalCards = useMemo(() => [
    {
      id: "cafe",
      title: "Cafe Name",
      value: settings?.cafeName || "My Cafe",
      icon: "🏢",
      color: "var(--cafe-accent)",
      status: "active"
    },
    {
      id: "version",
      title: "Current Version",
      value: systemStatus.version,
      icon: "📌",
      color: "#10b981",
      status: "stable"
    },
    {
      id: "backup",
      title: "Last Backup",
      value: systemStatus.lastBackup,
      icon: "💾",
      color: "#3b82f6",
      status: "recent"
    },
    {
      id: "sync",
      title: "Last Sync",
      value: systemStatus.lastSync,
      icon: "🔄",
      color: "#8b5cf6",
      status: "synced"
    },
    {
      id: "database",
      title: "Database Status",
      value: systemStatus.database,
      icon: "🗄️",
      color: "#10b981",
      status: "healthy"
    },
    {
      id: "storage",
      title: "Storage Usage",
      value: systemStatus.storage,
      icon: "📊",
      color: "#f59e0b",
      status: "warning"
    },
    {
      id: "devices",
      title: "Connected Devices",
      value: systemStatus.connectedDevices.toString(),
      icon: "🖨️",
      color: "#3b82f6",
      status: "connected"
    },
    {
      id: "notifications",
      title: "Notifications",
      value: systemStatus.notifications,
      icon: "🔔",
      color: "#10b981",
      status: "active"
    },
    {
      id: "security",
      title: "Security Status",
      value: systemStatus.security,
      icon: "🔒",
      color: "#10b981",
      status: "secure"
    }
  ], [settings, systemStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "healthy":
      case "recent":
      case "synced":
      case "connected":
      case "secure":
      case "stable":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "error":
      case "critical":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h1 style={{
          fontSize: isMobile ? 24 : 28,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Settings Command Center
        </h1>
        <p style={{
          fontSize: isMobile ? 14 : 15,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Overview and quick actions for your cafe configuration
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Operational Status Cards */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            System Status
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16
          }}>
            {operationalCards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: "var(--cafe-bg-card)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${card.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {card.value}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: getStatusColor(card.status),
                  fontWeight: 600
                }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: getStatusColor(card.status)
                  }} />
                  {card.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: 16
          }}>
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                style={{
                  background: "var(--cafe-bg-card)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--cafe-accent-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24
                }}>
                  {action.icon}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Recent Changes
          </h2>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { action: "Payment methods updated", time: "2 hours ago", icon: "💳" },
                { action: "Operating hours changed", time: "5 hours ago", icon: "🕐" },
                { action: "New staff member added", time: "1 day ago", icon: "👤" },
                { action: "Menu items updated", time: "2 days ago", icon: "📖" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px",
                    background: "var(--cafe-bg-surface)",
                    borderRadius: 8
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                      {item.action}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
