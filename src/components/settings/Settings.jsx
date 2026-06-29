import { useState, useEffect, useCallback } from "react";
import { C, card, btn, input, label } from "../../styles/theme";

// ── Persistence helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = "brewcrm_settings";

const DEFAULTS = {
  notifications: true,
  soundEnabled: true,
  autoRefresh: true,
  refreshInterval: 30,
  language: "en",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  tableLayout: "grid",
  lowStockAlert: true,
  orderAlertSound: "chime",
  kdsAutoAdvance: false,
  taxRate: 5,
  serviceCharge: 10,
  receiptFooter: "Thank you for visiting!",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      aria-pressed={value}
      style={{
        width: 48, height: 28, borderRadius: 14, border: "none",
        background: value ? C.green : C.bg4,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: C.bg2,
        border: `1px solid ${C.border2}`,
        boxShadow: "0 1px 3px rgba(0,0,0,.35)",
        position: "absolute", top: 3,
        left: value ? 23 : 3, transition: "left 0.2s",
      }} />
    </button>
  );
}

function Row({ label: lbl, sub, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{lbl}</div>
        {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({ icon, title, color, children }) {
  return (
    <div style={{ ...card(), display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: color || C.amber2, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span><span>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Settings({ theme, toggleTheme }) {
  const [s, setS] = useState(loadSettings);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = useCallback((key, val) => {
    setS(prev => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  }, []);

  // Auto-save to localStorage on change (debounced feel via dirty flag)
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => { saveSettings(s); }, 400);
    return () => clearTimeout(t);
  }, [s, dirty]);

  function handleSave() {
    saveSettings(s);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!window.confirm("Reset all settings to defaults?")) return;
    setS({ ...DEFAULTS });
    saveSettings({ ...DEFAULTS });
    setDirty(false);
    setSaved(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Demo Notice */}
      <div style={{
        background: C.bannerGradient,
        border: `1px solid ${C.amber3}`, borderRadius: 12, padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.amber2 }}>BrewCRM · Demo Unit</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 4, lineHeight: 1.6 }}>
            Fully functional production-ready build. Settings are persisted to your browser's local storage.
          </div>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Status</div>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>● Online</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }} className="grid-2">

        {/* Notifications */}
        <Section icon="🔔" title="Notifications">
          <Row lbl="Push Notifications" sub="Alerts for new and updated orders">
            <Toggle value={s.notifications} onChange={v => set("notifications", v)} />
          </Row>
          <Divider />
          <Row lbl="Sound Alerts" sub="Audio cue for incoming orders">
            <Toggle value={s.soundEnabled} onChange={v => set("soundEnabled", v)} />
          </Row>
          {s.soundEnabled && (
            <div>
              <div style={{ ...label }}>Alert Sound</div>
              <select
                style={{ ...input, width: "100%", marginTop: 4 }}
                value={s.orderAlertSound}
                onChange={e => set("orderAlertSound", e.target.value)}
              >
                <option value="chime">Chime</option>
                <option value="bell">Bell</option>
                <option value="ping">Ping</option>
                <option value="none">None</option>
              </select>
            </div>
          )}
          <Divider />
          <Row lbl="Low Stock Alerts" sub="Notify when inventory runs low">
            <Toggle value={s.lowStockAlert} onChange={v => set("lowStockAlert", v)} />
          </Row>
        </Section>

        {/* Data & Display */}
        <Section icon="🔄" title="Data & Display">
          <Row lbl="Auto Refresh" sub="Keep data up-to-date automatically">
            <Toggle value={s.autoRefresh} onChange={v => set("autoRefresh", v)} />
          </Row>
          {s.autoRefresh && (
            <div>
              <div style={{ ...label }}>Refresh Interval (seconds)</div>
              <input
                type="number"
                style={{ ...input, width: "100%", marginTop: 4 }}
                value={s.refreshInterval}
                onChange={e => set("refreshInterval", Math.max(10, Math.min(300, Number(e.target.value))))}
                min={10} max={300}
              />
            </div>
          )}
          <Divider />
          <div>
            <div style={{ ...label }}>Language</div>
            <select style={{ ...input, width: "100%", marginTop: 4 }} value={s.language} onChange={e => set("language", e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <div style={{ ...label }}>Date Format</div>
            <select style={{ ...input, width: "100%", marginTop: 4 }} value={s.dateFormat} onChange={e => set("dateFormat", e.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </Section>

        {/* Kitchen & Orders */}
        <Section icon="🍳" title="Kitchen & Orders">
          <Row lbl="KDS Auto-Advance" sub="Auto-bump orders when timer expires">
            <Toggle value={s.kdsAutoAdvance} onChange={v => set("kdsAutoAdvance", v)} />
          </Row>
          <Divider />
          <div>
            <div style={{ ...label }}>Default Table Layout</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["grid", "list", "map"].map(opt => (
                <button
                  key={opt}
                  onClick={() => set("tableLayout", opt)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${s.tableLayout === opt ? C.amber3 : C.border}`,
                    background: s.tableLayout === opt ? C.amberBg : C.bg3,
                    color: s.tableLayout === opt ? C.amber2 : C.text2,
                    fontSize: 12, fontWeight: s.tableLayout === opt ? 600 : 400,
                    cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                  }}
                >{opt}</button>
              ))}
            </div>
          </div>
          <Divider />
          <div>
            <div style={{ ...label }}>Receipt Footer</div>
            <input
              type="text"
              style={{ ...input, width: "100%", marginTop: 4 }}
              value={s.receiptFooter}
              onChange={e => set("receiptFooter", e.target.value)}
              placeholder="e.g. Thank you for visiting!"
            />
          </div>
        </Section>

        {/* Billing */}
        <Section icon="💳" title="Billing & Tax">
          <div>
            <div style={{ ...label }}>Currency</div>
            <select style={{ ...input, width: "100%", marginTop: 4 }} value={s.currency} onChange={e => set("currency", e.target.value)}>
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
            </select>
          </div>
          <Divider />
          <div>
            <div style={{ ...label }}>GST / Tax Rate (%)</div>
            <input
              type="number"
              style={{ ...input, width: "100%", marginTop: 4 }}
              value={s.taxRate}
              onChange={e => set("taxRate", Math.max(0, Math.min(30, Number(e.target.value))))}
              min={0} max={30} step={0.5}
            />
          </div>
          <div>
            <div style={{ ...label }}>Service Charge (%)</div>
            <input
              type="number"
              style={{ ...input, width: "100%", marginTop: 4 }}
              value={s.serviceCharge}
              onChange={e => set("serviceCharge", Math.max(0, Math.min(30, Number(e.target.value))))}
              min={0} max={30} step={0.5}
            />
          </div>
          <div style={{
            padding: "10px 12px", background: C.bg3, borderRadius: 8,
            fontSize: 12, color: C.text2, display: "flex", justifyContent: "space-between",
          }}>
            <span>Total on ₹100 order</span>
            <span style={{ fontFamily: "monospace", color: C.amber2, fontWeight: 600 }}>
              ₹{(100 * (1 + s.taxRate / 100) * (1 + s.serviceCharge / 100)).toFixed(2)}
            </span>
          </div>
        </Section>

        {/* Appearance */}
        <Section icon="🎨" title="Appearance">
          <Row lbl="Theme" sub={theme === "dark" ? "Dark mode is active" : "Light mode is active"}>
            <button
              onClick={toggleTheme}
              style={{
                ...btn("ghost"),
                padding: "8px 16px",
                fontSize: 12,
                display: "flex", alignItems: "center", gap: 8,
                border: `1px solid ${C.border2}`,
              }}
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
              <span style={{ fontSize: 10, color: C.text3 }}>Switch</span>
            </button>
          </Row>
          <Divider />
          <div style={{ display: "flex", gap: 8 }}>
            {["dark", "light"].map(t => (
              <button
                key={t}
                onClick={() => theme !== t && toggleTheme()}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8,
                  border: `1px solid ${theme === t ? C.amber3 : C.border}`,
                  background: theme === t ? C.amberDim : C.bg3,
                  color: theme === t ? C.amber2 : C.text2,
                  fontSize: 12, fontWeight: theme === t ? 700 : 400,
                  cursor: theme === t ? "default" : "pointer",
                  transition: "all 0.15s", textTransform: "capitalize",
                }}
              >
                {t === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            ))}
          </div>
        </Section>

        {/* System Info */}
        <Section icon="ℹ️" title="System Info">
          {[
            ["Version", "1.0.0"],
            ["Build", "Demo Build"],
            ["React", "18.x"],
            ["Firebase", "Realtime DB"],
            ["Deployed", "Vercel"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.text3 }}>{k}</span>
              <span style={{ fontFamily: "monospace", color: C.amber2 }}>{v}</span>
            </div>
          ))}
          <Divider />
          <div style={{ padding: "8px 12px", background: C.bg3, borderRadius: 6, fontSize: 11, color: C.text3 }}>
            Settings are auto-saved to localStorage. Firebase sync reflects changes in real time.
          </div>
        </Section>

        {/* Danger Zone */}
        <Section icon="⚠️" title="Danger Zone" color={C.red}>
          <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
            Resetting clears all local preferences. Firebase data (orders, customers, menu) is not affected.
          </div>
          <button
            onClick={handleReset}
            style={{
              ...btn("ghost"), width: "100%", color: C.red,
              border: `1px solid ${C.red}40`, marginTop: 4,
            }}
          >
            Reset All Settings to Defaults
          </button>
        </Section>

      </div>

      {/* Save Bar */}
      <div style={{
        display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center",
        padding: "16px 20px", background: C.bg2, borderRadius: 12,
        border: `1px solid ${dirty ? C.amber3 : C.border}`,
        transition: "border-color 0.2s",
      }}>
        {dirty && (
          <span style={{ fontSize: 12, color: C.amber2, marginRight: "auto" }}>
            ● Unsaved changes
          </span>
        )}
        {saved && !dirty && (
          <span style={{ fontSize: 12, color: C.green, marginRight: "auto" }}>
            ✓ Settings saved
          </span>
        )}
        <button style={btn("ghost")} onClick={handleReset}>Reset to Defaults</button>
        <button
          style={{ ...btn("primary"), opacity: dirty ? 1 : 0.5, cursor: dirty ? "pointer" : "default" }}
          onClick={handleSave}
          disabled={!dirty}
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
