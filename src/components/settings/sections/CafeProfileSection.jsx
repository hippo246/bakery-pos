import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function CafeProfileSection({ settings, setSettings, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Branding Preview Card */}
      <PremiumCard style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-accent-border)"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* Logo Placeholder */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            background: "var(--cafe-bg-card)",
            border: "2px dashed var(--cafe-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            color: "var(--cafe-text-tertiary)",
            flexShrink: 0
          }}>
            🏢
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 4,
              marginTop: 0
            }}>
              {settings.cafeName || "My Cafe"}
            </h3>
            <p style={{
              fontSize: 12,
              color: "var(--cafe-text-tertiary)",
              margin: 0,
              marginBottom: 12
            }}>
              {settings.receiptAddress || "Add your address to see it here"}
            </p>
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            }}>
              <span style={{
                fontSize: 11,
                padding: "4px 10px",
                background: "var(--cafe-bg-card)",
                borderRadius: 6,
                color: "var(--cafe-text-secondary)",
                border: "1px solid var(--cafe-border-light)"
              }}>
                {settings.currency || "INR"}
              </span>
              <span style={{
                fontSize: 11,
                padding: "4px 10px",
                background: "var(--cafe-bg-card)",
                borderRadius: 6,
                color: "var(--cafe-text-secondary)",
                border: "1px solid var(--cafe-border-light)"
              }}>
                {settings.timezone || "Asia/Kolkata"}
              </span>
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* Basic Information */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Basic Information
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Cafe Name</label>
            <input
              type="text"
              value={settings.cafeName || ""}
              onChange={e => setSettings("cafeName", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="My Cafe"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Legal Business Name</label>
            <input
              type="text"
              value={settings.legalBusinessName || ""}
              onChange={e => setSettings("legalBusinessName", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="Legal name as per registration"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>GST Number</label>
            <input
              type="text"
              value={settings.gstin || ""}
              onChange={e => setSettings("gstin", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="15-digit GSTIN"
              maxLength={15}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>FSSAI Number</label>
            <input
              type="text"
              value={settings.fssaiNumber || ""}
              onChange={e => setSettings("fssaiNumber", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="14-digit FSSAI license"
              maxLength={14}
            />
          </div>
        </div>
      </PremiumCard>

      {/* Contact Information */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Contact Information
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Phone Number</label>
            <input
              type="tel"
              value={settings.receiptPhone || ""}
              onChange={e => setSettings("receiptPhone", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="+91 98765 43210"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              value={settings.receiptEmail || ""}
              onChange={e => setSettings("receiptEmail", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="contact@mycafe.com"
            />
          </div>
          
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Website</label>
            <input
              type="url"
              value={settings.website || ""}
              onChange={e => setSettings("website", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="https://www.mycafe.com"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Address */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Address
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Street Address</label>
            <input
              type="text"
              value={settings.receiptAddress || ""}
              onChange={e => setSettings("receiptAddress", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="123 Main Street, Building A"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>City</label>
            <input
              type="text"
              value={settings.city || ""}
              onChange={e => setSettings("city", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="Mumbai"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>State</label>
            <input
              type="text"
              value={settings.state || ""}
              onChange={e => setSettings("state", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="Maharashtra"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Country</label>
            <input
              type="text"
              value={settings.country || ""}
              onChange={e => setSettings("country", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="India"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Postal Code</label>
            <input
              type="text"
              value={settings.postalCode || ""}
              onChange={e => setSettings("postalCode", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="400001"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Regional Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Regional Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Timezone</label>
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
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Currency</label>
            <select
              value={settings.currency || "INR"}
              onChange={e => setSettings("currency", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
              <option value="AED">د.إ UAE Dirham (AED)</option>
              <option value="SGD">$ Singapore Dollar (SGD)</option>
              <option value="AUD">$ Australian Dollar (AUD)</option>
              <option value="CAD">$ Canadian Dollar (CAD)</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Language</label>
            <select
              value={settings.language || "en"}
              onChange={e => setSettings("language", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
              <option value="es">Español (Spanish)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Date Format</label>
            <select
              value={settings.dateFormat || "DD/MM/YYYY"}
              onChange={e => setSettings("dateFormat", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
