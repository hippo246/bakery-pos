import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function NotificationsSection({ settings, setSettings, isMobile }) {
  const notificationCategories = [
    {
      id: "orders",
      name: "Orders",
      icon: "📋",
      description: "New orders, order updates, cancellations"
    },
    {
      id: "kitchen",
      name: "Kitchen",
      icon: "👨‍🍳",
      description: "KDS tickets, preparation times, delays"
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: "📦",
      description: "Low stock alerts, stock updates"
    },
    {
      id: "purchasing",
      name: "Purchasing",
      icon: "🛒",
      description: "Purchase orders, supplier updates"
    },
    {
      id: "production",
      name: "Production",
      icon: "🏭",
      description: "Batch completion, production alerts"
    },
    {
      id: "reservations",
      name: "Reservations",
      icon: "📅",
      description: "New bookings, reminders, no-shows"
    },
    {
      id: "staff",
      name: "Staff",
      icon: "👥",
      description: "Shift changes, staff requests"
    },
    {
      id: "system",
      name: "System",
      icon: "⚙️",
      description: "Updates, errors, maintenance"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Notification Categories */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Notification Categories
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {notificationCategories.map(category => (
            <PremiumCard
              key={category.id}
              style={{
                padding: 16,
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border-light)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{category.icon}</span>
                <div>
                  <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    margin: 0,
                    marginBottom: 2
                  }}>
                    {category.name}
                  </h4>
                  <p style={{
                    fontSize: 10,
                    color: "var(--cafe-text-tertiary)",
                    margin: 0
                  }}>
                    {category.description}
                  </p>
                </div>
              </div>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                fontSize: 10
              }}>
                <div style={{ textAlign: "center" }}>
                  <PremiumToggle
                    value={settings[`${category.id}_desktop`] !== false}
                    onChange={(enabled) => setSettings(`${category.id}_desktop`, enabled)}
                    size="small"
                  />
                  <div style={{ marginTop: 4, color: "var(--cafe-text-tertiary)" }}>Desktop</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <PremiumToggle
                    value={settings[`${category.id}_sound`] !== false}
                    onChange={(enabled) => setSettings(`${category.id}_sound`, enabled)}
                    size="small"
                  />
                  <div style={{ marginTop: 4, color: "var(--cafe-text-tertiary)" }}>Sound</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <PremiumToggle
                    value={settings[`${category.id}_critical`] || false}
                    onChange={(enabled) => setSettings(`${category.id}_critical`, enabled)}
                    size="small"
                  />
                  <div style={{ marginTop: 4, color: "var(--cafe-text-tertiary)" }}>Critical</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <PremiumToggle
                    value={settings[`${category.id}_mute`] || false}
                    onChange={(enabled) => setSettings(`${category.id}_mute`, enabled)}
                    size="small"
                  />
                  <div style={{ marginTop: 4, color: "var(--cafe-text-tertiary)" }}>Mute</div>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </PremiumCard>

      {/* Global Notification Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Global Settings
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Enable Notifications
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Master switch for all notifications
              </div>
            </div>
            <PremiumToggle
              value={settings.notifications !== false}
              onChange={(enabled) => setSettings("notifications", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Sound Alerts
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Play sound for notifications
              </div>
            </div>
            <PremiumToggle
              value={settings.soundEnabled !== false}
              onChange={(enabled) => setSettings("soundEnabled", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Auto Refresh
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Automatically refresh data
              </div>
            </div>
            <PremiumToggle
              value={settings.autoRefresh !== false}
              onChange={(enabled) => setSettings("autoRefresh", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Sound Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Sound Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Order Alert Sound</label>
            <select
              value={settings.orderAlertSound || "chime"}
              onChange={e => setSettings("orderAlertSound", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="chime">Chime</option>
              <option value="bell">Bell</option>
              <option value="ding">Ding</option>
              <option value="notification">Notification</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Refresh Interval (seconds)</label>
            <input
              type="number"
              value={settings.refreshInterval || 30}
              onChange={e => setSettings("refreshInterval", parseInt(e.target.value) || 30)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="10"
              max="300"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Low Stock Alert */}
      <PremiumCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 4,
              marginTop: 0
            }}>
              Low Stock Alerts
            </h4>
            <p style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              margin: 0
            }}>
              Notify when items fall below minimum stock level
            </p>
          </div>
          <PremiumToggle
            value={settings.lowStockAlert !== false}
            onChange={(enabled) => setSettings("lowStockAlert", enabled)}
          />
        </div>
      </PremiumCard>
    </div>
  );
}
