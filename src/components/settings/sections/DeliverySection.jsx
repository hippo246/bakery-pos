import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function DeliverySection({ settings, setSettings, isMobile }) {
  const deliveryPlatforms = [
    {
      id: "swiggy",
      name: "Swiggy",
      icon: "🟠",
      description: "India's largest food delivery platform",
      enabled: settings.swiggyEnabled || false,
      platformId: settings.swiggyPlatformId || ""
    },
    {
      id: "zomato",
      name: "Zomato",
      icon: "🔴",
      description: "Food delivery and restaurant discovery",
      enabled: settings.zomatoEnabled || false,
      platformId: settings.zomatoPlatformId || ""
    },
    {
      id: "direct",
      name: "Direct Delivery",
      icon: "📦",
      description: "In-house delivery fleet",
      enabled: settings.directDeliveryEnabled || false,
      platformId: ""
    },
    {
      id: "qr",
      name: "QR Ordering",
      icon: "📱",
      description: "Self-service ordering at tables",
      enabled: settings.qrOrderingEnabled || false,
      platformId: ""
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Delivery Platforms */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Delivery Platforms
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {deliveryPlatforms.map(platform => (
            <PremiumCard
              key={platform.id}
              hover
              style={{
                cursor: "pointer",
                borderColor: platform.enabled ? "var(--cafe-accent)" : "var(--cafe-border-light)",
                background: platform.enabled ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                padding: 16
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{platform.icon}</span>
                  <div>
                    <h4 style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--cafe-text-primary)",
                      margin: 0,
                      marginBottom: 2
                    }}>
                      {platform.name}
                    </h4>
                    <p style={{
                      fontSize: 11,
                      color: "var(--cafe-text-tertiary)",
                      margin: 0
                    }}>
                      {platform.description}
                    </p>
                  </div>
                </div>
                <PremiumToggle
                  value={platform.enabled}
                  onChange={(enabled) => {
                    const key = `${platform.id}Enabled`;
                    setSettings(key, enabled);
                  }}
                  size="small"
                />
              </div>
              
              {platform.enabled && platform.platformId !== undefined && (
                <div>
                  <label style={{ ...label, fontSize: 11, marginBottom: 4 }}>Platform ID</label>
                  <input
                    type="text"
                    value={platform.platformId}
                    onChange={e => setSettings(`${platform.id}PlatformId`, e.target.value)}
                    style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", fontSize: 11, padding: "6px 10px" }}
                    placeholder="Enter platform ID"
                  />
                </div>
              )}
            </PremiumCard>
          ))}
        </div>
      </PremiumCard>

      {/* Delivery Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Delivery Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Minimum Order Value (₹)</label>
            <input
              type="number"
              value={settings.minimumOrder || 200}
              onChange={e => setSettings("minimumOrder", parseFloat(e.target.value) || 200)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              step="10"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Base Delivery Fee (₹)</label>
            <input
              type="number"
              value={settings.baseDeliveryFee || 40}
              onChange={e => setSettings("baseDeliveryFee", parseFloat(e.target.value) || 40)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              step="5"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Free Delivery Threshold (₹)</label>
            <input
              type="number"
              value={settings.freeDeliveryThreshold || 500}
              onChange={e => setSettings("freeDeliveryThreshold", parseFloat(e.target.value) || 500)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              step="10"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Max Delivery Radius (km)</label>
            <input
              type="number"
              value={settings.maxDeliveryRadius || 5}
              onChange={e => setSettings("maxDeliveryRadius", parseFloat(e.target.value) || 5)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="1"
              max="20"
              step="0.5"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Default Preparation Time (min)</label>
            <input
              type="number"
              value={settings.defaultPrepTime || 30}
              onChange={e => setSettings("defaultPrepTime", parseInt(e.target.value) || 30)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="5"
              max="120"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Order Management */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Order Management
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
                Auto Accept Orders
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Automatically accept incoming delivery orders
              </div>
            </div>
            <PremiumToggle
              value={settings.autoAcceptOrders || false}
              onChange={(enabled) => setSettings("autoAcceptOrders", enabled)}
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
                Require OTP for Delivery
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Ask customer for OTP on order completion
              </div>
            </div>
            <PremiumToggle
              value={settings.otpRequired || false}
              onChange={(enabled) => setSettings("otpRequired", enabled)}
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
                Proof of Delivery
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Require photo or signature on delivery
              </div>
            </div>
            <PremiumToggle
              value={settings.proofOfDeliveryRequired || false}
              onChange={(enabled) => setSettings("proofOfDeliveryRequired", enabled)}
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
                Cash on Delivery
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Allow cash payment on delivery
              </div>
            </div>
            <PremiumToggle
              value={settings.codEnabled || true}
              onChange={(enabled) => setSettings("codEnabled", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Preparation Offset */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Platform-Specific Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Swiggy Prep Offset (min)</label>
            <input
              type="number"
              value={settings.swiggyPrepOffset || 0}
              onChange={e => setSettings("swiggyPrepOffset", parseInt(e.target.value) || 0)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="30"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Zomato Prep Offset (min)</label>
            <input
              type="number"
              value={settings.zomatoPrepOffset || 0}
              onChange={e => setSettings("zomatoPrepOffset", parseInt(e.target.value) || 0)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="30"
            />
          </div>
        </div>
        
        <p style={{
          fontSize: 10,
          color: "var(--cafe-text-tertiary)",
          marginTop: 12,
          marginBottom: 0,
          fontStyle: "italic"
        }}>
          * Preparation offset adds extra time to estimated delivery times shown to customers
        </p>
      </PremiumCard>
    </div>
  );
}
