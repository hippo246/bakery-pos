import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function DisplaysSection({ settings, setSettings, isMobile }) {
  const displays = [
    {
      id: "kitchen_display",
      name: "Kitchen Display",
      type: "KDS",
      station: "Kitchen",
      status: "online",
      lastSeen: "Just now"
    },
    {
      id: "customer_display_1",
      name: "Customer Display 1",
      type: "Order Display",
      station: "Counter",
      status: "online",
      lastSeen: "2 min ago"
    },
    {
      id: "customer_display_2",
      name: "Customer Display 2",
      type: "Order Display",
      station: "Entrance",
      status: "offline",
      lastSeen: "1 hour ago"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "var(--cafe-success)";
      case "offline": return "var(--cafe-danger)";
      case "connecting": return "var(--cafe-warning)";
      default: return "var(--cafe-text-tertiary)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Connected Displays */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Connected Displays
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {displays.map(display => (
            <PremiumCard
              key={display.id}
              hover
              style={{
                padding: 16,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>📺</span>
                  <div>
                    <h4 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--cafe-text-primary)",
                      margin: 0,
                      marginBottom: 2
                    }}>
                      {display.name}
                    </h4>
                    <p style={{
                      fontSize: 10,
                      color: "var(--cafe-text-tertiary)",
                      margin: 0
                    }}>
                      {display.type}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: getStatusColor(display.status),
                    animation: display.status === "online" ? "pulse 2s infinite" : "none"
                  }} />
                  <span style={{
                    fontSize: 10,
                    color: getStatusColor(display.status),
                    fontWeight: 500
                  }}>
                    {display.status}
                  </span>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 12,
                borderTop: "1px solid var(--cafe-border-light)"
              }}>
                <div>
                  <span style={{
                    fontSize: 10,
                    color: "var(--cafe-text-tertiary)"
                  }}>
                    Station: {display.station}
                  </span>
                  <div style={{
                    fontSize: 10,
                    color: "var(--cafe-text-tertiary)",
                    marginTop: 2
                  }}>
                    Last: {display.lastSeen}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{
                    ...input,
                    padding: "4px 10px",
                    fontSize: 10,
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "var(--cafe-text-secondary)"
                  }}>
                    Open
                  </button>
                  <button style={{
                    ...input,
                    padding: "4px 10px",
                    fontSize: 10,
                    background: display.status === "offline" ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    border: display.status === "offline" ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: display.status === "offline" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)"
                  }}>
                    {display.status === "offline" ? "Restart" : "Info"}
                  </button>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </PremiumCard>

      {/* Pair New Display */}
      <PremiumCard style={{
        border: "1px dashed var(--cafe-accent)",
        background: "var(--cafe-accent-bg)"
      }}>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-accent)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Pair New Display
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Display Type</label>
            <select
              value={settings.newDisplayType || "kds"}
              onChange={e => setSettings("newDisplayType", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="kds">Kitchen Display (KDS)</option>
              <option value="customer">Customer Display</option>
              <option value="status">Status Board</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Assign to Station</label>
            <select
              value={settings.newDisplayStation || ""}
              onChange={e => setSettings("newDisplayStation", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="">Select station</option>
              <option value="kitchen">Kitchen</option>
              <option value="counter">Counter</option>
              <option value="entrance">Entrance</option>
              <option value="bar">Bar</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => console.log("Generate pairing code")}
          style={{
            ...input,
            padding: "12px 20px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            marginTop: 16
          }}
        >
          Generate Pairing Code
        </button>
      </PremiumCard>

      {/* Display Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Display Settings
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
                Auto-refresh Displays
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Automatically update display content
              </div>
            </div>
            <PremiumToggle
              value={settings.autoRefreshDisplays !== false}
              onChange={(enabled) => setSettings("autoRefreshDisplays", enabled)}
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
                Show Preparation Times
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Display estimated preparation times on KDS
              </div>
            </div>
            <PremiumToggle
              value={settings.showPrepTimes !== false}
              onChange={(enabled) => setSettings("showPrepTimes", enabled)}
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
                Play sound for new orders on displays
              </div>
            </div>
            <PremiumToggle
              value={settings.displaySoundAlerts !== false}
              onChange={(enabled) => setSettings("displaySoundAlerts", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
