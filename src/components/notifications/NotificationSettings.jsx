import React from 'react';
import { useState, useEffect } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { 
  NOTIFICATION_CATEGORY_CONFIG,
  DEFAULT_NOTIFICATION_SETTINGS
} from "../../data/notificationConstants.js";

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const safeBool = (v) => Boolean(v);

// Merge a possibly-partial settings object over the defaults so missing
// sections (e.g. settings loaded from an older schema) don't crash the form
const mergeWithDefaults = (partial) => {
  const base = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
  const src = partial || {};
  return {
    ...base,
    ...src,
    categories: { ...base.categories, ...(src.categories || {}) },
    sound: { ...base.sound, ...(src.sound || {}) },
    browser: { ...base.browser, ...(src.browser || {}) },
    quietHours: { ...base.quietHours, ...(src.quietHours || {}) },
    display: { ...base.display, ...(src.display || {}) }
  };
};

export default function NotificationSettings({ 
  settings: externalSettings,
  setSettings: externalSetSettings,
  onSave
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const [settings, setSettings] = useState(() => mergeWithDefaults(externalSettings));

  // If the caller swaps in different settings after mount (e.g. loaded async,
  // or opened for a different user), keep the form in sync instead of
  // silently editing stale data.
  useEffect(() => {
    if (externalSettings) {
      setSettings(mergeWithDefaults(externalSettings));
    }
  }, [externalSettings]);

  const [browserPermission, setBrowserPermission] = useState('default');
  const [justSaved, setJustSaved] = useState(false);

  // Check browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permission
  const handleRequestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === "granted") {
        setSettings(prev => ({
          ...prev,
          browser: { ...prev.browser, enabled: true, permission }
        }));
      }
    }
  };

  // Update category setting
  const updateCategorySetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [key]: value
        }
      }
    }));
  };

  // Update sound setting
  const updateSoundSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      sound: {
        ...prev.sound,
        [key]: value
      }
    }));
  };

  // Update browser setting
  const updateBrowserSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      browser: {
        ...prev.browser,
        [key]: value
      }
    }));
  };

  // Update quiet hours setting
  const updateQuietHoursSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  // Update display setting
  const updateDisplaySetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  // Handle save
  const handleSave = () => {
    if (typeof externalSetSettings === 'function') {
      externalSetSettings(settings);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    if (typeof onSave === 'function') {
      onSave(settings);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (typeof window !== "undefined" && !window.confirm("Reset all notification settings to their defaults? This can't be undone.")) {
      return;
    }
    setSettings(mergeWithDefaults(null));
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 900, margin: "0 auto" }}>
      <style>{`@keyframes cafeos-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Notification Settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Configure how you receive operational alerts and updates
        </p>
      </div>

      {/* Category Settings */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--cafe-border-light)" }}>
          Category Preferences
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(NOTIFICATION_CATEGORY_CONFIG).map(([key, config]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", transition: "background-color 0.15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--cafe-accent-dim)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--cafe-bg-surface)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{config.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{config.label}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{config.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.categories[key]?.enabled ?? true}
                    onChange={(e) => updateCategorySetting(key, 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={settings.categories[key]?.sound ?? false}
                    onChange={(e) => updateCategorySetting(key, 'sound', e.target.checked)}
                  />
                  Sound
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sound Settings */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--cafe-border-light)" }}>
          Sound Settings
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.sound.enabled}
              onChange={(e) => updateSoundSetting('enabled', e.target.checked)}
            />
            Enable notification sounds
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.sound.urgentOnly}
              onChange={(e) => updateSoundSetting('urgentOnly', e.target.checked)}
            />
            Sound for urgent alerts only
          </label>
          <div>
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.sound.volume}
              onChange={(e) => updateSoundSetting('volume', parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--cafe-accent)" }}
            />
            <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
              {Math.round(settings.sound.volume * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Browser Notifications */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--cafe-border-light)" }}>
          Browser Notifications
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {typeof window !== "undefined" && "Notification" in window ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    Permission Status
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {browserPermission === 'granted' ? '✓ Granted' : 
                     browserPermission === 'denied' ? '✗ Denied' : 
                     'Not requested'}
                  </div>
                </div>
                {browserPermission === 'default' && (
                  <button style={{ ...btn("primary"), fontSize: 12, padding: "6px 12px" }} onClick={handleRequestBrowserPermission}>
                    Request Permission
                  </button>
                )}
              </div>
              {browserPermission === 'granted' && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer", padding: "12px", backgroundColor: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
                  <input
                    type="checkbox"
                    checked={settings.browser.enabled}
                    onChange={(e) => updateBrowserSetting('enabled', e.target.checked)}
                  />
                  Enable browser notifications
                </label>
              )}
              {browserPermission === 'denied' && (
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", padding: 12, backgroundColor: "#fadbd8", borderRadius: "var(--cafe-radius-sm)" }}>
                  Browser notifications are blocked. Enable them in your browser settings to receive alerts.
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", padding: 12, backgroundColor: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
              Browser notifications are not supported in this browser.
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--cafe-border-light)" }}>
          Quiet Hours
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.quietHours.enabled}
              onChange={(e) => updateQuietHoursSetting('enabled', e.target.checked)}
            />
            Enable quiet hours
          </label>
          {settings.quietHours.enabled && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12, padding: 12, backgroundColor: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)" }}>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>Start Time</label>
                <input
                  type="time"
                  style={{ ...input, width: "100%" }}
                  value={settings.quietHours.start}
                  onChange={(e) => updateQuietHoursSetting('start', e.target.value)}
                />
              </div>
              <div>
                <label style={{ ...label, display: "block", marginBottom: 4 }}>End Time</label>
                <input
                  type="time"
                  style={{ ...input, width: "100%" }}
                  value={settings.quietHours.end}
                  onChange={(e) => updateQuietHoursSetting('end', e.target.value)}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.quietHours.suppressSound}
                  onChange={(e) => updateQuietHoursSetting('suppressSound', e.target.checked)}
                />
                Suppress sound
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.quietHours.suppressBrowser}
                  onChange={(e) => updateQuietHoursSetting('suppressBrowser', e.target.checked)}
                />
                Suppress browser notifications
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Display Settings */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--cafe-border-light)" }}>
          Display Settings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.display.assignedToMeOnly}
              onChange={(e) => updateDisplaySetting('assignedToMeOnly', e.target.checked)}
            />
            Show only notifications assigned to me
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.display.showInformational}
              onChange={(e) => updateDisplaySetting('showInformational', e.target.checked)}
            />
            Show informational updates in inbox
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--cafe-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.display.autoMarkRead}
              onChange={(e) => updateDisplaySetting('autoMarkRead', e.target.checked)}
            />
            Automatically mark as read when opened
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
        {justSaved && (
          <span style={{ fontSize: 13, color: "var(--cafe-accent)", fontWeight: 600, animation: "cafeos-fade-in 0.2s ease-out" }}>
            ✓ Saved
          </span>
        )}
        <button style={{ ...btn("ghost") }} onClick={handleReset}>
          Reset to Defaults
        </button>
        <button style={{ ...btn("primary") }} onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
