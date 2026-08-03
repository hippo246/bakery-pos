import React from 'react';
// Notifications Settings Section - Enable/Disable operational notifications
// Premium notification management

import { useState, useCallback } from "react";

export default function NotificationsSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    // Kitchen
    kitchenNewOrders: settings?.kitchenNewOrders !== false,
    kitchenOrderUpdates: settings?.kitchenOrderUpdates !== false,
    kitchenDelayedOrders: settings?.kitchenDelayedOrders !== false,
    
    // Inventory
    inventoryLowStock: settings?.inventoryLowStock !== false,
    inventoryOutOfStock: settings?.inventoryOutOfStock !== false,
    inventoryExpiryAlerts: settings?.inventoryExpiryAlerts !== false,
    
    // Orders
    ordersNewOrder: settings?.ordersNewOrder !== false,
    ordersOrderCompleted: settings?.ordersOrderCompleted !== false,
    ordersOrderCancelled: settings?.ordersOrderCancelled !== false,
    
    // Staff
    staffShiftReminders: settings?.staffShiftReminders !== false,
    staffScheduleChanges: settings?.staffScheduleChanges !== false,
    
    // Purchasing
    purchasingOrderPlaced: settings?.purchasingOrderPlaced !== false,
    purchasingOrderReceived: settings?.purchasingOrderReceived !== false,
    
    // Production
    productionBatchComplete: settings?.productionBatchComplete !== false,
    productionQualityAlerts: settings?.productionQualityAlerts !== false,
    
    // System
    systemUpdates: settings?.systemUpdates !== false,
    systemBackupComplete: settings?.systemBackupComplete !== false,
    systemErrors: settings?.systemErrors !== false,
    
    // General
    soundEnabled: settings?.soundEnabled !== false,
    desktopNotifications: settings?.desktopNotifications || false,
    emailNotifications: settings?.emailNotifications || false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const notificationCategories = [
    {
      id: "kitchen",
      name: "Kitchen",
      icon: "👨‍🍳",
      description: "Kitchen display and order notifications",
      settings: [
        { id: "kitchenNewOrders", label: "New Orders", description: "Alert when new orders arrive" },
        { id: "kitchenOrderUpdates", label: "Order Updates", description: "Changes to existing orders" },
        { id: "kitchenDelayedOrders", label: "Delayed Orders", description: "Orders taking longer than usual" }
      ]
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: "📦",
      description: "Stock and inventory alerts",
      settings: [
        { id: "inventoryLowStock", label: "Low Stock", description: "Items below threshold" },
        { id: "inventoryOutOfStock", label: "Out of Stock", description: "Items completely depleted" },
        { id: "inventoryExpiryAlerts", label: "Expiry Alerts", description: "Items approaching expiry" }
      ]
    },
    {
      id: "orders",
      name: "Orders",
      icon: "📋",
      description: "Order lifecycle notifications",
      settings: [
        { id: "ordersNewOrder", label: "New Orders", description: "New order placed" },
        { id: "ordersOrderCompleted", label: "Order Completed", description: "Order finished" },
        { id: "ordersOrderCancelled", label: "Order Cancelled", description: "Order cancellation" }
      ]
    },
    {
      id: "staff",
      name: "Staff",
      icon: "👥",
      description: "Staff and schedule notifications",
      settings: [
        { id: "staffShiftReminders", label: "Shift Reminders", description: "Upcoming shift alerts" },
        { id: "staffScheduleChanges", label: "Schedule Changes", description: "Schedule modifications" }
      ]
    },
    {
      id: "purchasing",
      name: "Purchasing",
      icon: "🛒",
      description: "Purchase order notifications",
      settings: [
        { id: "purchasingOrderPlaced", label: "Order Placed", description: "Purchase order sent" },
        { id: "purchasingOrderReceived", label: "Order Received", description: "Purchase order delivered" }
      ]
    },
    {
      id: "production",
      name: "Production",
      icon: "⚙️",
      description: "Production and batch notifications",
      settings: [
        { id: "productionBatchComplete", label: "Batch Complete", description: "Production batch finished" },
        { id: "productionQualityAlerts", label: "Quality Alerts", description: "Quality control issues" }
      ]
    },
    {
      id: "system",
      name: "System",
      icon: "⚡",
      description: "System and maintenance notifications",
      settings: [
        { id: "systemUpdates", label: "System Updates", description: "Software updates available" },
        { id: "systemBackupComplete", label: "Backup Complete", description: "Backup completion status" },
        { id: "systemErrors", label: "System Errors", description: "Error and exception alerts" }
      ]
    }
  ];

  const enabledCount = Object.values(formData).filter(v => v === true).length;

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
          Notifications
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure operational notification preferences
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Notification Categories */}
        <div style={{ marginBottom: 32 }}>
          {notificationCategories.map((category) => (
            <div
              key={category.id}
              style={{
                background: "var(--cafe-bg-card)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--cafe-accent-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}>
                  {category.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {category.description}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {category.settings.map((setting) => (
                  <label
                    key={setting.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={formData[setting.id] || false}
                      onChange={(e) => handleChange(setting.id, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {setting.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                        {setting.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* General Settings */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            General Settings
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
                  checked={formData.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Sound Enabled
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Play sounds for notifications
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.desktopNotifications}
                  onChange={(e) => handleChange('desktopNotifications', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Desktop Notifications
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Show browser desktop notifications
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Email Notifications
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Send critical alerts via email
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
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
          <strong>{enabledCount}</strong> notifications enabled
        </div>
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
