import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function TablesSection({ settings, setSettings, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Seating Configuration */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Seating Configuration
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Default Seating Capacity</label>
            <input
              type="number"
              value={settings.defaultSeating || 4}
              onChange={e => setSettings("defaultSeating", parseInt(e.target.value) || 4)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="1"
              max="20"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Maximum Capacity</label>
            <input
              type="number"
              value={settings.maxCapacity || 100}
              onChange={e => setSettings("maxCapacity", parseInt(e.target.value) || 100)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="10"
              max="500"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Reservation Buffer (minutes)</label>
            <input
              type="number"
              value={settings.reservationBuffer || 15}
              onChange={e => setSettings("reservationBuffer", parseInt(e.target.value) || 15)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="60"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Cleaning Timer (minutes)</label>
            <input
              type="number"
              value={settings.cleaningTimer || 10}
              onChange={e => setSettings("cleaningTimer", parseInt(e.target.value) || 10)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="30"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Table Numbering */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Table Numbering
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Table Prefix</label>
            <input
              type="text"
              value={settings.tablePrefix || "T"}
              onChange={e => setSettings("tablePrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="T"
              maxLength={5}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Numbering Format</label>
            <select
              value={settings.tableNumberingFormat || "numeric"}
              onChange={e => setSettings("tableNumberingFormat", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="numeric">Numeric (1, 2, 3...)</option>
              <option value="alpha">Alphanumeric (A1, A2, B1...)</option>
              <option value="roman">Roman (I, II, III...)</option>
            </select>
          </div>
        </div>
      </PremiumCard>

      {/* Service Areas */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Service Areas
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16
        }}>
          {[
            { id: "indoor", name: "Indoor Seating", icon: "🏠" },
            { id: "outdoor", name: "Outdoor Seating", icon: "🌳" },
            { id: "terrace", name: "Terrace", icon: "☀️" },
            { id: "private", name: "Private Dining", icon: "🎉" },
            { id: "bar", name: "Bar Area", icon: "🍺" },
            { id: "delivery", name: "Delivery Pickup", icon: "📦" }
          ].map(area => (
            <div key={area.id} style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: 24 }}>{area.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--cafe-text-primary)"
                }}>
                  {area.name}
                </div>
                <div style={{
                  fontSize: 10,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  0 tables
                </div>
              </div>
              <PremiumToggle
                value={settings[`area_${area.id}_enabled`] || false}
                onChange={(enabled) => setSettings(`area_${area.id}_enabled`, enabled)}
                size="small"
              />
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Table Types */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Default Table Types
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {[
            { id: "2_seater", name: "2-Seater", capacity: 2, icon: "👥" },
            { id: "4_seater", name: "4-Seater", capacity: 4, icon: "👨‍👩‍👧‍👦" },
            { id: "6_seater", name: "6-Seater", capacity: 6, icon: "👨‍👩‍👧‍👦‍👨" },
            { id: "8_seater", name: "8-Seater", capacity: 8, icon: "👨‍👩‍👧‍👦‍👨‍👩" }
          ].map(tableType => (
            <div key={tableType.id} style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>{tableType.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--cafe-text-primary)"
                }}>
                  {tableType.name}
                </div>
                <div style={{
                  fontSize: 10,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  Capacity: {tableType.capacity}
                </div>
              </div>
              <div style={{
                fontSize: 11,
                padding: "4px 8px",
                background: "var(--cafe-bg-card)",
                borderRadius: 4,
                color: "var(--cafe-text-secondary)",
                border: "1px solid var(--cafe-border-light)"
              }}>
                Default
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Table Layout */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Floor Layout
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Default Layout</label>
            <select
              value={settings.tableLayout || "grid"}
              onChange={e => setSettings("tableLayout", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="grid">Grid Layout</option>
              <option value="list">List View</option>
              <option value="map">Floor Map</option>
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24 }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 4 }}>Auto-assign Tables</label>
              <p style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)",
                margin: 0
              }}>
                Automatically assign tables for walk-ins
              </p>
            </div>
            <PremiumToggle
              value={settings.autoAssignTables || false}
              onChange={(enabled) => setSettings("autoAssignTables", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
