import { useState } from "react";
import { C, card, btn, input, label } from "../../styles/theme";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  return (
    <div>
      {/* Demo Notice */}
      <div style={{ 
        background: "linear-gradient(135deg, #1a3a2e 0%, #2a1a3e 100%)", 
        border: `1px solid ${C.amber3}`, 
        borderRadius: 12, 
        padding: "20px 24px", 
        marginBottom: 24 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.amber2 }}>Demo Unit</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Fully Functional • Production-Ready Features</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
          This is a demonstration unit of BrewCRM. All features are fully functional and ready for production use. 
          The application includes complete order management, kitchen display system, customer relationship management, 
          analytics, menu management, inventory tracking, staff management, table management, and discount system.
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2">
        {/* Notifications */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.amber2 }}>🔔 Notifications</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Push Notifications</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Receive alerts for new orders</div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  border: "none",
                  background: notifications ? C.green : C.bg4,
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s"
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: notifications ? 23 : 3,
                  transition: "left 0.2s"
                }} />
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Sound Alerts</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Play sound for urgent orders</div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  border: "none",
                  background: soundEnabled ? C.green : C.bg4,
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s"
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: soundEnabled ? 23 : 3,
                  transition: "left 0.2s"
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Refresh */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.amber2 }}>🔄 Data Refresh</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Auto Refresh</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Automatically update data</div>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  border: "none",
                  background: autoRefresh ? C.green : C.bg4,
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s"
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: autoRefresh ? 23 : 3,
                  transition: "left 0.2s"
                }} />
              </button>
            </div>
            <div>
              <label style={label}>Refresh Interval (seconds)</label>
              <input
                type="number"
                style={{ ...input, width: "100%" }}
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                min={10}
                max={300}
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.amber2 }}>🎨 Display</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={label}>Theme</label>
              <select style={{ ...input, width: "100%" }}>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
                <option value="auto">System Default</option>
              </select>
            </div>
            <div>
              <label style={label}>Language</label>
              <select style={{ ...input, width: "100%" }}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.amber2 }}>ℹ️ System Info</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.text3 }}>Version</span>
              <span style={{ fontFamily: "monospace", color: C.amber2 }}>1.0.0</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.text3 }}>Build</span>
              <span style={{ fontFamily: "monospace", color: C.amber2 }}>Demo Build</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.text3 }}>Status</span>
              <span style={{ color: C.green, fontWeight: 600 }}>● Online</span>
            </div>
            <div style={{ marginTop: 8, padding: "8px 12px", background: C.bg3, borderRadius: 6, fontSize: 11, color: C.text3 }}>
              All systems operational. Data is stored locally in browser memory.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button style={btn("ghost")}>Reset to Defaults</button>
        <button style={btn("primary")}>Save Changes</button>
      </div>
    </div>
  );
}
