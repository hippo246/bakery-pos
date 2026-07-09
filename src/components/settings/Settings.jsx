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
        width: 44, height: 26, borderRadius: 13, border: "none",
        background: value ? C.green : C.bg4,
        boxShadow: value ? `0 0 0 3px ${C.green}22` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.18s, box-shadow 0.18s",
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: value ? "#fff" : C.bg2,
        boxShadow: value
          ? "0 1px 4px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.15)"
          : "0 1px 3px rgba(0,0,0,.35)",
        position: "absolute", top: 3,
        left: value ? 21 : 3, transition: "left 0.18s, background 0.18s, box-shadow 0.18s",
      }} />
    </button>
  );
}

function Row({ label: lbl, sub, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, letterSpacing: "0.01em" }}>{lbl}</div>
        {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({ icon, title, color, children }) {
  const accent = color || C.amber2;
  return (
    <div style={{ ...card(), display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
        paddingBottom: 14, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: 3, height: 18, borderRadius: 2,
          background: accent, flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text1, letterSpacing: "0.02em", textTransform: "uppercase" }}>{title}</span>
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
export default function Settings({ theme, toggleTheme, dataTools }) {
  const [s, setS] = useState(loadSettings);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // ── Data Mode & Backup local state ────────────────────────────────────────
  const [importText, setImportText] = useState("");
  const [dataMsg, setDataMsg] = useState(null); // { type: "success" | "error", text }
  const [snapshot, setSnapshot] = useState(null);

  const refreshSnapshot = useCallback((silent) => {
    if (!dataTools || typeof dataTools.getStorageSnapshot !== "function") return;
    try {
      const snap = dataTools.getStorageSnapshot();
      setSnapshot(snap);
      if (!silent) setDataMsg({ type: "success", text: "Data status refreshed." });
    } catch (e) {
      setDataMsg({ type: "error", text: `Failed to read data status: ${e?.message || e}` });
    }
  }, [dataTools]);

  useEffect(() => {
    if (dataTools && typeof dataTools.getStorageSnapshot === "function") {
      refreshSnapshot(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataTools]);

  function handleExportBackup() {
    if (!dataTools || typeof dataTools.exportLocalData !== "function") return;
    try {
      const raw = dataTools.exportLocalData();
      const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `brewcrm-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDataMsg({ type: "success", text: "Backup downloaded." });
    } catch (e) {
      setDataMsg({ type: "error", text: `Export failed: ${e?.message || e}` });
    }
  }

  function handleImportBackup() {
    if (!dataTools || typeof dataTools.importLocalData !== "function") return;
    if (!importText.trim()) {
      setDataMsg({ type: "error", text: "Paste or load a backup JSON file first." });
      return;
    }
    if (!window.confirm(
      "Importing this backup will REPLACE existing orders, customers, KDS, menu, tables, staff, discounts, delivery, and inventory data for any collection present in the file. This cannot be undone. Continue?"
    )) return;
    try {
      const result = dataTools.importLocalData(importText);
      if (result && result.ok) {
        const importedList = Array.isArray(result.imported) && result.imported.length ? result.imported.join(", ") : "none";
        const skippedList = Array.isArray(result.skipped) && result.skipped.length ? result.skipped.join(", ") : null;
        setDataMsg({
          type: "success",
          text: `Imported: ${importedList}.${skippedList ? ` Skipped (unrecognized): ${skippedList}.` : ""}`
        });
        refreshSnapshot(true);
      } else {
        setDataMsg({ type: "error", text: result?.error || "Import failed." });
      }
    } catch (e) {
      setDataMsg({ type: "error", text: `Import failed: ${e?.message || e}` });
    }
  }

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type && file.type !== "application/json" && !file.name.endsWith(".json")) {
      setDataMsg({ type: "warning", text: "Selected file doesn't look like JSON, attempting to read it anyway." });
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (!text) {
        setDataMsg({ type: "error", text: "Selected file appears to be empty." });
        return;
      }
      setImportText(text);
      setDataMsg({ type: "warning", text: `Loaded "${file.name}" into the textarea. Review it, then click Import Backup.` });
    };
    reader.onerror = () => setDataMsg({ type: "error", text: "Could not read file. Please try again or paste the JSON directly." });
    reader.readAsText(file);
  }

  function handleConvertDemoToLocal() {
    if (!dataTools || typeof dataTools.convertCurrentDemoToLocalData !== "function") return;
    try {
      const result = dataTools.convertCurrentDemoToLocalData();
      if (result && result.ok) {
        setDataMsg({ type: "success", text: result.message || "Demo data saved to local storage." });
      } else {
        setDataMsg({ type: "error", text: result?.error || "Conversion failed." });
      }
      refreshSnapshot(true);
    } catch (e) {
      setDataMsg({ type: "error", text: `Conversion failed: ${e?.message || e}` });
    }
  }

  function handleSeedStarter() {
    if (!dataTools || typeof dataTools.seedLocalStarterData !== "function") return;
    if (!window.confirm("Seed starter menu/tables/inventory for a new unit? This does not add fake orders.")) return;
    try {
      const result = dataTools.seedLocalStarterData();
      if (result && result.ok) {
        setDataMsg({ type: "success", text: `Seeded: ${(result.seeded || []).join(", ")}.` });
      } else {
        setDataMsg({ type: "error", text: result?.error || "Seeding failed." });
      }
      refreshSnapshot(true);
    } catch (e) {
      setDataMsg({ type: "error", text: `Seeding failed: ${e?.message || e}` });
    }
  }

  function handleResetLocalToEmpty() {
    if (!dataTools || typeof dataTools.resetLocalDataToEmpty !== "function") return;
    if (!window.confirm(
      "This will RESET local data to empty: orders, customers, KDS tickets, tables, staff, discounts, delivery orders, and inventory will all be cleared and the menu will reset to its starter state. This cannot be undone. Continue?"
    )) return;
    try {
      const result = dataTools.resetLocalDataToEmpty();
      if (result && result.ok) {
        setDataMsg({ type: "success", text: "Local data reset to empty." });
      } else {
        setDataMsg({ type: "error", text: result?.error || "Reset failed." });
      }
      refreshSnapshot(true);
    } catch (e) {
      setDataMsg({ type: "error", text: `Reset failed: ${e?.message || e}` });
    }
  }

  function handleClearLocalStorage() {
    if (!dataTools || typeof dataTools.clearLocalData !== "function") return;
    if (!window.confirm(
      "This will CLEAR all BrewCRM local storage keys on this device (all collections). This cannot be undone. Continue?"
    )) return;
    try {
      dataTools.clearLocalData();
      setDataMsg({ type: "success", text: "Local storage data cleared." });
      refreshSnapshot(true);
    } catch (e) {
      setDataMsg({ type: "error", text: `Clear failed: ${e?.message || e}` });
    }
  }

  function handleCopyBackup() {
    if (!dataTools || typeof dataTools.exportLocalData !== "function") return;
    try {
      const raw = dataTools.exportLocalData();
      const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text)
          .then(() => setDataMsg({ type: "success", text: "Backup JSON copied to clipboard." }))
          .catch((e) => setDataMsg({ type: "error", text: `Copy failed: ${e?.message || e}. Try Export Backup JSON instead.` }));
      } else {
        setDataMsg({ type: "warning", text: "Clipboard access isn't available here. Use Export Backup JSON instead." });
      }
    } catch (e) {
      setDataMsg({ type: "error", text: `Copy failed: ${e?.message || e}` });
    }
  }

  function handleDownloadStatusReport() {
    if (!dataTools || typeof dataTools.getStorageSnapshot !== "function") return;
    try {
      const snap = dataTools.getStorageSnapshot();
      const report = {
        generatedAt: new Date().toISOString(),
        mode: dataTools.dataMode || (dataTools.isDemoMode ? "demo" : dataTools.isLocalMode ? "local" : "unknown"),
        snapshot: snap
      };
      const text = JSON.stringify(report, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `brewcrm-data-status-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnapshot(snap);
      setDataMsg({ type: "success", text: "Data status report downloaded." });
    } catch (e) {
      setDataMsg({ type: "error", text: `Report download failed: ${e?.message || e}` });
    }
  }

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Demo Notice */}
      <div style={{
        background: C.bannerGradient,
        border: `1px solid ${C.amber3}`, borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: `${C.amber2}18`,
          border: `1px solid ${C.amber3}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>⚡</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.amber2 }}>BrewCRM</span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "2px 7px", borderRadius: 999, background: `${C.amber2}20`, color: C.amber2,
            }}>Demo</span>
          </div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>
            Settings are saved to this browser's local storage.
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Online</span>
        </div>
      </div>

      {/* Subtabs */}
      <div style={{ display: "flex", gap: 4, background: C.bg3, borderRadius: 10, padding: 4, border: `1px solid ${C.border}` }}>
        {[
          { id: "general", label: "⚙️ General" },
          { id: "data", label: "🗄️ Data & Backup" },
          { id: "danger", label: "⚠️ Danger Zone" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "7px 10px", borderRadius: 7, fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
              border: `1.5px solid ${activeTab === tab.id ? (tab.id === "danger" ? C.red : C.amber3) : "transparent"}`,
              background: activeTab === tab.id ? (tab.id === "danger" ? `${C.red}10` : C.amberDim) : "transparent",
              color: activeTab === tab.id ? (tab.id === "danger" ? C.red : C.amber2) : C.text3,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: activeTab === "general" ? "grid" : "none", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }} className="grid-2">

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
              <div style={{ ...label, marginBottom: 6 }}>Alert Sound</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { val: "chime", label: "🎵 Chime" },
                  { val: "bell", label: "🔔 Bell" },
                  { val: "ping", label: "📳 Ping" },
                  { val: "none", label: "🔇 Off" },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => set("orderAlertSound", opt.val)}
                    style={{
                      flex: 1, padding: "6px 4px", borderRadius: 7, fontSize: 11,
                      border: `1px solid ${s.orderAlertSound === opt.val ? C.amber3 : C.border}`,
                      background: s.orderAlertSound === opt.val ? C.amberDim : C.bg3,
                      color: s.orderAlertSound === opt.val ? C.amber2 : C.text3,
                      fontWeight: s.orderAlertSound === opt.val ? 600 : 400,
                      cursor: "pointer", transition: "all 0.12s",
                      whiteSpace: "nowrap",
                    }}
                  >{opt.label}</button>
                ))}
              </div>
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
              <div style={{ ...label, marginBottom: 6 }}>Refresh Interval</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { val: 10, label: "10s" },
                  { val: 30, label: "30s" },
                  { val: 60, label: "1m" },
                  { val: 300, label: "5m" },
                ].map(p => (
                  <button
                    key={p.val}
                    onClick={() => set("refreshInterval", p.val)}
                    style={{
                      flex: 1, padding: "5px 0", borderRadius: 7, fontSize: 11,
                      border: `1px solid ${s.refreshInterval === p.val ? C.amber3 : C.border}`,
                      background: s.refreshInterval === p.val ? C.amberDim : C.bg3,
                      color: s.refreshInterval === p.val ? C.amber2 : C.text3,
                      fontWeight: s.refreshInterval === p.val ? 700 : 400,
                      cursor: "pointer", transition: "all 0.12s", fontFamily: "monospace",
                    }}
                  >{p.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  style={{ ...input, flex: 1, marginTop: 0 }}
                  value={s.refreshInterval}
                  onChange={e => set("refreshInterval", Math.max(10, Math.min(300, Number(e.target.value))))}
                  min={10} max={300}
                />
                <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>seconds</span>
              </div>
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
              {[
                { val: "grid", label: "Grid", icon: "▦" },
                { val: "list", label: "List", icon: "≡" },
                { val: "map", label: "Map", icon: "◫" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set("tableLayout", opt.val)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8,
                    border: `1.5px solid ${s.tableLayout === opt.val ? C.amber3 : C.border}`,
                    background: s.tableLayout === opt.val ? C.amberBg : C.bg3,
                    color: s.tableLayout === opt.val ? C.amber2 : C.text2,
                    fontSize: 12, fontWeight: s.tableLayout === opt.val ? 700 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{opt.icon}</span>
                  <span style={{ fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Divider />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ ...label }}>Receipt Footer</div>
              <span style={{ fontSize: 10, color: s.receiptFooter.length > 60 ? C.red : C.text3, fontFamily: "monospace" }}>
                {s.receiptFooter.length}/80
              </span>
            </div>
            <input
              type="text"
              maxLength={80}
              style={{ ...input, width: "100%", marginTop: 0 }}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ ...label }}>GST / Tax</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <input
                  type="number"
                  style={{ ...input, flex: 1, marginTop: 0 }}
                  value={s.taxRate}
                  onChange={e => set("taxRate", Math.max(0, Math.min(30, Number(e.target.value))))}
                  min={0} max={30} step={0.5}
                />
                <span style={{ fontSize: 12, color: C.text3, flexShrink: 0 }}>%</span>
              </div>
            </div>
            <div>
              <div style={{ ...label }}>Service Charge</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <input
                  type="number"
                  style={{ ...input, flex: 1, marginTop: 0 }}
                  value={s.serviceCharge}
                  onChange={e => set("serviceCharge", Math.max(0, Math.min(30, Number(e.target.value))))}
                  min={0} max={30} step={0.5}
                />
                <span style={{ fontSize: 12, color: C.text3, flexShrink: 0 }}>%</span>
              </div>
            </div>
          </div>
          <div style={{
            padding: "12px 14px", background: C.bg3, borderRadius: 9,
            border: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, color: C.text3, fontWeight: 500, marginBottom: 2 }}>Preview · ₹100 order</div>
              <div style={{ fontSize: 10, color: C.text3 }}>
                +{s.taxRate}% tax · +{s.serviceCharge}% service
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontFamily: "monospace", color: C.amber2, fontWeight: 700, letterSpacing: "-0.02em" }}>
                ₹{(100 * (1 + s.taxRate / 100) * (1 + s.serviceCharge / 100)).toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: C.text3 }}>total billed</div>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section icon="🎨" title="Appearance">
          <div>
            <div style={{ ...label, marginBottom: 8 }}>Theme</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "dark", label: "Dark", icon: "🌙" },
                { id: "light", label: "Light", icon: "☀️" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => theme !== t.id && toggleTheme()}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 9,
                    border: `1.5px solid ${theme === t.id ? C.amber3 : C.border}`,
                    background: theme === t.id ? C.amberDim : C.bg3,
                    color: theme === t.id ? C.amber2 : C.text2,
                    fontSize: 13, fontWeight: theme === t.id ? 700 : 400,
                    cursor: theme === t.id ? "default" : "pointer",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {theme === t.id && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                      padding: "1px 5px", borderRadius: 999, background: `${C.amber2}30`,
                      marginLeft: 2,
                    }}>on</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* System Info */}
        <Section icon="ℹ️" title="System Info">
          <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {[
              ["Version", "1.0.0", true],
              ["Build", "Demo"],
              ["React", "18.x"],
              ["Firebase", "Realtime DB"],
              ["Deployed", "Vercel"],
            ].map(([k, v, isVersion], i) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 12, padding: "8px 12px",
                background: i % 2 === 0 ? C.bg3 : "transparent",
              }}>
                <span style={{ color: C.text3, fontWeight: 500 }}>{k}</span>
                {isVersion ? (
                  <span style={{
                    fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 999,
                    background: `${C.green}18`, color: C.green,
                    border: `1px solid ${C.green}33`,
                  }}>v{v}</span>
                ) : (
                  <span style={{ fontFamily: "monospace", color: C.amber2 }}>{v}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5, paddingTop: 2 }}>
            Settings auto-save locally. Firebase reflects changes in real time.
          </div>
        </Section>

      </div>{/* end General grid */}

      {/* Data & Backup tab */}
      {activeTab === "data" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section icon="🗄️" title="Data Mode & Backup">
          {!dataTools ? (
            <div style={{ fontSize: 12, color: C.text3 }}>Data tools are not available yet.</div>
          ) : (
            <>
              <Row lbl="Data mode" sub={dataTools.isDemoMode ? "Read-only demo, no writes" : dataTools.isLocalMode ? "Writing to this device" : "Unknown"}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  color: dataTools.isDemoMode ? C.amber2 : C.green,
                  background: dataTools.isDemoMode ? `${C.amber2}18` : `${C.green}18`,
                  border: `1px solid ${dataTools.isDemoMode ? C.amber3 : C.green}44`,
                }}>
                  {dataTools.dataMode || (dataTools.isDemoMode ? "demo" : dataTools.isLocalMode ? "local" : "—")}
                </span>
              </Row>

              <Divider />

              {/* Snapshot summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ ...label, marginBottom: 8 }}>Stored Collections</div>
                <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  {snapshot && snapshot.collections ? (
                    Object.entries(snapshot.collections).map(([key, info], i) => (
                      <div key={key} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        fontSize: 12, padding: "7px 12px",
                        background: i % 2 === 0 ? C.bg3 : "transparent",
                      }}>
                        <span style={{ color: C.text3, fontWeight: 500 }}>{key}</span>
                        <span style={{
                          fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                          color: (info?.count ?? 0) > 0 ? C.amber2 : C.text3,
                        }}>{info?.count ?? 0}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: C.text3, padding: "10px 12px" }}>No snapshot loaded yet.</div>
                  )}
                  {snapshot && typeof snapshot.totalApproxBytes === "number" && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: 11, padding: "7px 12px", borderTop: `1px solid ${C.border}`,
                      background: C.bg3,
                    }}>
                      <span style={{ color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total size</span>
                      <span style={{ fontFamily: "monospace", color: C.text2, fontWeight: 700 }}>
                        {(snapshot.totalApproxBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                  {snapshot && snapshot.pendingQueueCount != null && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: 11, padding: "7px 12px", borderTop: `1px solid ${C.border}`,
                    }}>
                      <span style={{ color: C.text3, fontWeight: 500 }}>Pending sync</span>
                      <span style={{ fontFamily: "monospace", color: snapshot.pendingQueueCount > 0 ? C.amber2 : C.text3 }}>
                        {snapshot.pendingQueueCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => refreshSnapshot(false)}
                disabled={typeof dataTools.getStorageSnapshot !== "function"}
                style={{ ...btn("ghost"), width: "100%", opacity: typeof dataTools.getStorageSnapshot === "function" ? 1 : 0.5, fontSize: 12 }}
              >
                Refresh Status
              </button>

              <Divider />

              {/* Export */}
              <button
                onClick={handleExportBackup}
                disabled={typeof dataTools.exportLocalData !== "function"}
                style={{ ...btn("primary"), width: "100%", fontSize: 12, opacity: typeof dataTools.exportLocalData === "function" ? 1 : 0.5 }}
              >
                ↓ Download Backup
              </button>

              <Divider />

              {/* Import */}
              <div>
                <div style={{ ...label, marginBottom: 8 }}>Restore from Backup</div>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4, padding: "14px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px dashed ${C.border2}`, background: C.bg3,
                  transition: "border-color 0.15s",
                }}>
                  <span style={{ fontSize: 18 }}>📂</span>
                  <span style={{ fontSize: 12, color: C.text2, fontWeight: 500 }}>Choose backup file</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>or paste JSON below</span>
                  <input type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
                </label>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Paste backup JSON here…"
                  rows={4}
                  style={{ ...input, width: "100%", marginTop: 8, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
                />
                <button
                  onClick={handleImportBackup}
                  disabled={typeof dataTools.importLocalData !== "function"}
                  style={{ ...btn("ghost"), width: "100%", marginTop: 8, fontSize: 12, opacity: typeof dataTools.importLocalData === "function" ? 1 : 0.5 }}
                >
                  Restore from Backup
                </button>
              </div>

              {dataTools.isDemoMode && (
                <>
                  <Divider />
                  <div>
                    <button
                      onClick={handleConvertDemoToLocal}
                      disabled={typeof dataTools.convertCurrentDemoToLocalData !== "function"}
                      style={{ ...btn("ghost"), width: "100%", fontSize: 12, opacity: typeof dataTools.convertCurrentDemoToLocalData === "function" ? 1 : 0.5 }}
                    >
                      Save Demo as Local Data
                    </button>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 6, lineHeight: 1.5 }}>
                      Saves current demo data into local storage. Restart the app with <code>VITE_BREWCRM_MODE=local</code> to use it as local data.
                    </div>
                  </div>
                </>
              )}

              <Divider />

              {/* Seed starter */}
              <button
                onClick={handleSeedStarter}
                disabled={typeof dataTools.seedLocalStarterData !== "function"}
                style={{ ...btn("ghost"), width: "100%", fontSize: 12, opacity: typeof dataTools.seedLocalStarterData === "function" ? 1 : 0.5 }}
              >
                Populate Starter Data
              </button>

              <Divider />

              {/* Destructive actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={handleResetLocalToEmpty}
                  disabled={typeof dataTools.resetLocalDataToEmpty !== "function"}
                  style={{
                    ...btn("ghost"), width: "100%", fontSize: 12, color: C.red,
                    border: `1px solid ${C.red}33`, background: `${C.red}08`,
                    opacity: typeof dataTools.resetLocalDataToEmpty === "function" ? 1 : 0.5,
                  }}
                >
                  Wipe Local Data
                </button>
                <button
                  onClick={handleClearLocalStorage}
                  disabled={typeof dataTools.clearLocalData !== "function"}
                  style={{
                    ...btn("ghost"), width: "100%", fontSize: 12, color: C.red,
                    border: `1px solid ${C.red}33`, background: `${C.red}08`,
                    opacity: typeof dataTools.clearLocalData === "function" ? 1 : 0.5,
                  }}
                >
                  Clear All Storage
                </button>
              </div>

              {dataMsg && (
                <div style={{
                  padding: "9px 13px", borderRadius: 8, fontSize: 11, marginTop: 2,
                  lineHeight: 1.5,
                  color: dataMsg.type === "error" ? C.red : dataMsg.type === "warning" ? C.amber2 : C.green,
                  background: dataMsg.type === "error" ? `${C.red}0d` : dataMsg.type === "warning" ? `${C.amber2}12` : `${C.green}0d`,
                  border: `1px solid ${dataMsg.type === "error" ? C.red : dataMsg.type === "warning" ? C.amber3 : C.green}33`,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <span style={{ flexShrink: 0 }}>
                    {dataMsg.type === "error" ? "✕" : dataMsg.type === "warning" ? "⚠" : "✓"}
                  </span>
                  <span>{dataMsg.text}</span>
                </div>
              )}
            </>
          )}
        </Section>
      </div>}{/* end Data tab */}

      {/* Danger Zone tab */}
      {activeTab === "danger" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section icon="⚠️" title="Danger Zone" color={C.red}>
          <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
            Resets your local preferences only. Firebase data — orders, customers, menu — stays untouched.
          </div>
          <button
            onClick={handleReset}
            style={{
              ...btn("ghost"), width: "100%", fontSize: 12, color: C.red,
              border: `1px solid ${C.red}33`, background: `${C.red}08`, marginTop: 2,
            }}
          >
            Reset All Settings
          </button>
        </Section>
      </div>}{/* end Danger tab */}

      {/* Save Bar */}
      <div style={{
        display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center",
        padding: "14px 18px", background: C.bg2, borderRadius: 12,
        border: `1.5px solid ${dirty ? C.amber3 : C.border}`,
        boxShadow: dirty ? `0 0 0 3px ${C.amber3}18` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
          {dirty && (
            <>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: C.amber2,
                boxShadow: `0 0 6px ${C.amber2}`,
              }} />
              <span style={{ fontSize: 12, color: C.amber2, fontWeight: 500 }}>Unsaved changes</span>
            </>
          )}
          {saved && !dirty && (
            <>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
              <span style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>Saved</span>
            </>
          )}
        </div>
        <button style={{ ...btn("ghost"), fontSize: 12 }} onClick={handleReset}>Reset to Defaults</button>
        <button
          style={{
            ...btn("primary"), fontSize: 12,
            opacity: dirty ? 1 : 0.45,
            cursor: dirty ? "pointer" : "default",
            transition: "opacity 0.2s",
          }}
          onClick={handleSave}
          disabled={!dirty}
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
