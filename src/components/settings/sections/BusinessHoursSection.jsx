import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function BusinessHoursSection({ settings, setSettings, isMobile }) {
  const days = [
    { id: "monday", name: "Monday", short: "Mon" },
    { id: "tuesday", name: "Tuesday", short: "Tue" },
    { id: "wednesday", name: "Wednesday", short: "Wed" },
    { id: "thursday", name: "Thursday", short: "Thu" },
    { id: "friday", name: "Friday", short: "Fri" },
    { id: "saturday", name: "Saturday", short: "Sat" },
    { id: "sunday", name: "Sunday", short: "Sun" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Weekly Schedule */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Weekly Schedule
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {days.map(day => (
            <div key={day.id} style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 16
            }}>
              <div style={{
                width: 100,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--cafe-text-primary)"
              }}>
                {day.name}
              </div>
              
              <PremiumToggle
                value={settings[`${day.id}_enabled`] !== false}
                onChange={(enabled) => setSettings(`${day.id}_enabled`, enabled)}
                size="small"
              />
              
              <div style={{ flex: 1, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...label, fontSize: 10, marginBottom: 4 }}>Open</label>
                  <input
                    type="time"
                    value={settings[`${day.id}_open`] || "09:00"}
                    onChange={e => setSettings(`${day.id}_open`, e.target.value)}
                    disabled={settings[`${day.id}_enabled`] === false}
                    style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", fontSize: 11, padding: "6px 10px" }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ ...label, fontSize: 10, marginBottom: 4 }}>Close</label>
                  <input
                    type="time"
                    value={settings[`${day.id}_close`] || "22:00"}
                    onChange={e => setSettings(`${day.id}_close`, e.target.value)}
                    disabled={settings[`${day.id}_enabled`] === false}
                    style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", fontSize: 11, padding: "6px 10px" }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ ...label, fontSize: 10, marginBottom: 4 }}>Break Start</label>
                  <input
                    type="time"
                    value={settings[`${day.id}_breakStart`] || ""}
                    onChange={e => setSettings(`${day.id}_breakStart`, e.target.value)}
                    disabled={settings[`${day.id}_enabled`] === false}
                    style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", fontSize: 11, padding: "6px 10px" }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ ...label, fontSize: 10, marginBottom: 4 }}>Break End</label>
                  <input
                    type="time"
                    value={settings[`${day.id}_breakEnd`] || ""}
                    onChange={e => setSettings(`${day.id}_breakEnd`, e.target.value)}
                    disabled={settings[`${day.id}_enabled`] === false}
                    style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", fontSize: 11, padding: "6px 10px" }}
                  />
                </div>
              </div>
              
              <div style={{
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500,
                background: settings[`${day.id}_holiday`] ? "var(--cafe-danger-bg)" : "var(--cafe-bg-card)",
                color: settings[`${day.id}_holiday`] ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)",
                border: settings[`${day.id}_holiday`] ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-border-light)",
                cursor: "pointer"
              }}
              onClick={() => setSettings(`${day.id}_holiday`, !settings[`${day.id}_holiday`])}
              >
                {settings[`${day.id}_holiday`] ? "Holiday" : "Regular"}
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Special Hours */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Special Hours
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>24/7 Mode</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PremiumToggle
                value={settings.is24x7 || false}
                onChange={(enabled) => setSettings("is24x7", enabled)}
              />
              <span style={{
                fontSize: 11,
                color: "var(--cafe-text-tertiary)"
              }}>
                Open all day, every day
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Holiday Support</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PremiumToggle
                value={settings.holidaySupport || false}
                onChange={(enabled) => setSettings("holidaySupport", enabled)}
              />
              <span style={{
                fontSize: 11,
                color: "var(--cafe-text-tertiary)"
              }}>
                Allow holiday overrides
              </span>
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* Timezone */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Timezone Settings
        </h4>
        
        <div>
          <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Business Timezone</label>
          <select
            value={settings.timezone || "Asia/Kolkata"}
            onChange={e => setSettings("timezone", e.target.value)}
            style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
        </div>
      </PremiumCard>
    </div>
  );
}
