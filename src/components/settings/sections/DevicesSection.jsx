import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function DevicesSection({ settings, setSettings, isMobile }) {
  const devices = [
    {
      id: "receipt_printer",
      name: "Receipt Printer",
      icon: "🖨️",
      status: "online",
      lastConnected: "Just now",
      model: settings.receiptPrinterModel || "Not configured"
    },
    {
      id: "kitchen_printer",
      name: "Kitchen Printer",
      icon: "🖨️",
      status: "online",
      lastConnected: "2 min ago",
      model: settings.kitchenPrinterModel || "Not configured"
    },
    {
      id: "cash_drawer",
      name: "Cash Drawer",
      icon: "💼",
      status: "offline",
      lastConnected: "1 hour ago",
      model: settings.cashDrawerModel || "Not configured"
    },
    {
      id: "barcode_scanner",
      name: "Barcode Scanner",
      icon: "📷",
      status: "online",
      lastConnected: "5 min ago",
      model: settings.barcodeScannerModel || "Not configured"
    },
    {
      id: "customer_display",
      name: "Customer Display",
      icon: "📺",
      status: "online",
      lastConnected: "Just now",
      model: settings.customerDisplayModel || "Not configured"
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
      {/* Connected Devices */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Connected Devices
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {devices.map(device => (
            <PremiumCard
              key={device.id}
              hover
              style={{
                padding: 16,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{device.icon}</span>
                  <div>
                    <h4 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--cafe-text-primary)",
                      margin: 0,
                      marginBottom: 2
                    }}>
                      {device.name}
                    </h4>
                    <p style={{
                      fontSize: 10,
                      color: "var(--cafe-text-tertiary)",
                      margin: 0
                    }}>
                      {device.model}
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
                    background: getStatusColor(device.status),
                    animation: device.status === "online" ? "pulse 2s infinite" : "none"
                  }} />
                  <span style={{
                    fontSize: 10,
                    color: getStatusColor(device.status),
                    fontWeight: 500
                  }}>
                    {device.status}
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
                <span style={{
                  fontSize: 10,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  Last: {device.lastConnected}
                </span>
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
                    Test
                  </button>
                  <button style={{
                    ...input,
                    padding: "4px 10px",
                    fontSize: 10,
                    background: device.status === "offline" ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                    border: device.status === "offline" ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: device.status === "offline" ? "var(--cafe-accent)" : "var(--cafe-text-secondary)"
                  }}>
                    {device.status === "offline" ? "Reconnect" : "Info"}
                  </button>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </PremiumCard>

      {/* Printer Configuration */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Printer Configuration
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Receipt Printer Model</label>
            <select
              value={settings.receiptPrinterModel || ""}
              onChange={e => setSettings("receiptPrinterModel", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="">Select printer</option>
              <option value="epson_tm_t82">Epson TM-T82</option>
              <option value="epson_tm_t88">Epson TM-T88</option>
              <option value="star_mc_print3">Star MC-Print3</option>
              <option value="pos_58">POS-58</option>
              <option value="pos_80">POS-80</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Kitchen Printer Model</label>
            <select
              value={settings.kitchenPrinterModel || ""}
              onChange={e => setSettings("kitchenPrinterModel", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="">Select printer</option>
              <option value="epson_tm_t82">Epson TM-T82</option>
              <option value="epson_tm_t88">Epson TM-T88</option>
              <option value="star_mc_print3">Star MC-Print3</option>
              <option value="pos_58">POS-58</option>
              <option value="pos_80">POS-80</option>
            </select>
          </div>
        </div>
      </PremiumCard>

      {/* Cash Drawer Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Cash Drawer Settings
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Cash Drawer Model</label>
            <select
              value={settings.cashDrawerModel || ""}
              onChange={e => setSettings("cashDrawerModel", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="">Select drawer</option>
              <option value="apg_vasario">APG Vasario</option>
              <option value="mmf_280">MMF 280</option>
              <option value="star_scd222">Star SCD222</option>
              <option value="generic">Generic USB</option>
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24 }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 4 }}>Auto-open on Payment</label>
              <p style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)",
                margin: 0
              }}>
                Automatically open drawer on cash payment
              </p>
            </div>
            <PremiumToggle
              value={settings.autoOpenCashDrawer || false}
              onChange={(enabled) => setSettings("autoOpenCashDrawer", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Add New Device */}
      <PremiumCard style={{
        border: "1px dashed var(--cafe-border)",
        background: "var(--cafe-bg-surface)",
        cursor: "pointer"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 20
        }}>
          <span style={{ fontSize: 24 }}>➕</span>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cafe-text-secondary)"
          }}>
            Add New Device
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
