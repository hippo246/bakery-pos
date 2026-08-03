import React from 'react';
// Kitchen Stations Step for Setup Wizard
// Configure kitchen stations with colors and ticket routing with premium UX

import { useState, useCallback } from "react";

const STATION_TYPES = [
  { id: 'bar', name: 'Bar', icon: '🍸', color: '#8b5cf6', help: 'For drinks and beverages' },
  { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b', help: 'Main food preparation area' },
  { id: 'dessert', name: 'Dessert', icon: '🍰', color: '#ec4899', help: 'For desserts and sweets' },
  { id: 'packaging', name: 'Packaging', icon: '📦', color: '#10b981', help: 'For takeout and delivery orders' },
  { id: 'custom', name: 'Custom', icon: '⚙️', color: '#6366f1', help: 'Create your own station' }
];

const STATION_PRESETS = [
  { id: 'simple', name: 'Simple', description: 'Kitchen only', stations: ['kitchen'], icon: '👨‍🍳' },
  { id: 'standard', name: 'Standard', description: 'Kitchen + Bar', stations: ['kitchen', 'bar'], icon: '🍸' },
  { id: 'full', name: 'Full Service', description: 'All stations', stations: ['kitchen', 'bar', 'dessert', 'packaging'], icon: '🏪' }
];

export default function KitchenStationsStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [stations, setStations] = useState(() => {
    return settings?.kitchenStations || [
      { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b', enabled: true }
    ];
  });

  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [showHelp, setShowHelp] = useState({});

  const applyPreset = useCallback((presetId) => {
    setSelectedPreset(presetId);
    const preset = STATION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const newStations = preset.stations.map(stationId => {
        const type = STATION_TYPES.find(t => t.id === stationId);
        return {
          id: stationId,
          name: type.name,
          icon: type.icon,
          color: type.color,
          enabled: true
        };
      });
      setStations(newStations);
    }
  }, []);

  const addStation = useCallback((stationType) => {
    const type = STATION_TYPES.find(t => t.id === stationType);
    if (type && !stations.find(s => s.id === stationType)) {
      setStations(prev => [...prev, {
        id: type.id,
        name: type.name,
        icon: type.icon,
        color: type.color,
        enabled: true
      }]);
      setSelectedPreset('custom');
    }
  }, [stations]);

  const removeStation = useCallback((stationId) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    setSelectedPreset('custom');
  }, []);

  const toggleStation = useCallback((stationId) => {
    setStations(prev => prev.map(s => 
      s.id === stationId ? { ...s, enabled: !s.enabled } : s
    ));
  }, []);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      kitchenStations: stations
    };
    localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    onNext(stations);
  }, [stations, settings, onNext]);

  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const renderFieldCard = (title, icon, children, helpText) => (
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
            onClick={() => toggleHelp(title)}
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
      {showHelp[title] && helpText && (
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

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 900, margin: "0 auto" }}>
      {/* Quick Presets Card */}
      {renderFieldCard(
        "Quick Presets",
        "⚡",
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
          {STATION_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              style={{
                padding: "20px",
                border: selectedPreset === preset.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: selectedPreset === preset.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (selectedPreset !== preset.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPreset !== preset.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{preset.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                {preset.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
                {preset.description}
              </div>
            </button>
          ))}
        </div>,
        "Presets help you quickly configure common station layouts. You can customize stations after selecting a preset."
      )}

      {/* Active Stations Card */}
      {renderFieldCard(
        "Active Stations",
        "👨‍🍳",
        <div>
          {stations.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              background: "var(--cafe-bg)",
              border: "1px dashed var(--cafe-border)",
              borderRadius: 12
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
                No stations configured. Add a station or select a preset.
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--cafe-bg)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              overflow: "hidden"
            }}>
              {stations.map((station, idx) => (
                <div
                  key={station.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderBottom: idx < stations.length - 1 ? "1px solid var(--cafe-border-light)" : "none"
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: station.color + '20',
                    border: `2px solid ${station.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26
                  }}>
                    {station.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {station.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                      Ticket routing enabled
                    </div>
                  </div>

                  <button
                    onClick={() => removeStation(station.id)}
                    style={{
                      padding: "10px 14px",
                      background: "var(--cafe-danger-bg)",
                      border: "1px solid var(--cafe-danger-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--cafe-danger)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--cafe-danger)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--cafe-danger-bg)";
                      e.currentTarget.style.color = "var(--cafe-danger)";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>,
        "Active stations receive order tickets. Orders are routed based on menu item assignments."
      )}

      {/* Add Station Card */}
      {renderFieldCard(
        "Add Station",
        "➕",
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)", gap: 12 }}>
          {STATION_TYPES.filter(type => !stations.find(s => s.id === type.id)).map(type => (
            <button
              key={type.id}
              onClick={() => addStation(type.id)}
              style={{
                padding: "20px",
                border: "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: "var(--cafe-bg)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = type.color;
                e.currentTarget.style.background = type.color + '10';
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.background = "var(--cafe-bg)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: type.color + '20',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24
              }}>
                {type.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                {type.name}
              </span>
            </button>
          ))}
          {STATION_TYPES.filter(type => !stations.find(s => s.id === type.id)).length === 0 && (
            <div style={{ 
              gridColumn: "1 / -1", 
              padding: 20, 
              textAlign: "center", 
              color: "var(--cafe-text-tertiary)",
              fontSize: 13 
            }}>
              All stations already added
            </div>
          )}
        </div>,
        "Add additional stations to your kitchen workflow. Each station can have its own ticket display."
      )}

      {/* Ticket Routing Preview Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span>
          Ticket Routing Preview
        </h3>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          color: "#000"
        }}>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
            Orders will be routed to <strong style={{ color: "#000" }}>{stations.filter(s => s.enabled).length} stations</strong>
          </div>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {stations.filter(s => s.enabled).map(station => (
              <div
                key={station.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  background: station.color + '10',
                  border: `1px solid ${station.color}`,
                  borderRadius: 24
                }}
              >
                <span style={{ fontSize: 20 }}>{station.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: station.color }}>
                  {station.name}
                </span>
              </div>
            ))}
            {stations.filter(s => s.enabled).length === 0 && (
              <div style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
                No active stations configured
              </div>
            )}
          </div>
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
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
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
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 69, 19, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
