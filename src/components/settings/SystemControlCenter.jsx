import React from 'react';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import PromptDialog from "../common/PromptDialog";
import { SettingsPermissions } from "../../utils/permissionService.js";
import { createSecurityAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import { isCurrentlyDemoMode, getDemoStats, clearDemoData, convertDemoToProduction, exportDemoData } from "../../utils/demoMode.js";
import { isSetupIncomplete, resetSetup } from "../../utils/appMode.js";

// Lazy-loaded section components
const CafeProfileSection = lazy(() => import("./sections/CafeProfileSection.jsx"));
const PaymentsSection = lazy(() => import("./sections/PaymentsSection.jsx"));
const TaxesSection = lazy(() => import("./sections/TaxesSection.jsx"));
const StaffRolesSection = lazy(() => import("./sections/StaffRolesSection.jsx"));
const BusinessSection = lazy(() => import("./sections/BusinessSection.jsx"));
const ReceiptsSection = lazy(() => import("./sections/ReceiptsSection.jsx"));
const TablesSection = lazy(() => import("./sections/TablesSection.jsx"));
const DeliverySection = lazy(() => import("./sections/DeliverySection.jsx"));
const DevicesSection = lazy(() => import("./sections/DevicesSection.jsx"));
const DisplaysSection = lazy(() => import("./sections/DisplaysSection.jsx"));
const NotificationsSection = lazy(() => import("./sections/NotificationsSection.jsx"));
const BusinessHoursSection = lazy(() => import("./sections/BusinessHoursSection.jsx"));
const BackupSection = lazy(() => import("./sections/BackupSection.jsx"));
const SecuritySection = lazy(() => import("./sections/SecuritySection.jsx"));
const AboutSection = lazy(() => import("./sections/AboutSection.jsx"));
const RolesPermissionsSection = lazy(() => import("./sections/RolesPermissionsSection.jsx"));
const CloudStorageConfig = lazy(() => import("./CloudStorageConfig.jsx"));
const CloudOverviewSection = lazy(() => import("./sections/CloudOverviewSection.jsx"));
const MonitoringSection = lazy(() => import("./sections/MonitoringSection.jsx"));
const DiagnosticsSection = lazy(() => import("./sections/DiagnosticsSection.jsx"));
const AdvancedSection = lazy(() => import("./sections/AdvancedSection.jsx"));

// Import existing settings logic from original Settings.jsx
import { loadSettings, saveSettings, DEFAULTS } from "./Settings.jsx";

// ── Premium Navigation Categories ─────────────────────────────────────────────
const NAVIGATION_CATEGORIES = [
  {
    id: "cafe-profile",
    icon: "🏢",
    title: "Cafe Profile",
    description: "Business identity, contact info, and branding",
    keywords: ["cafe", "name", "logo", "address", "phone", "email", "website", "gst", "fssai", "timezone", "currency"]
  },
  {
    id: "business",
    icon: "⚙️",
    title: "Business",
    description: "Operations, numbering, and service defaults",
    keywords: ["business", "type", "invoice", "order", "table", "numbering", "prefix", "service"]
  },
  {
    id: "taxes",
    icon: "📊",
    title: "Taxes",
    description: "GST configuration and tax calculations",
    keywords: ["tax", "gst", "cgst", "sgst", "igst", "inclusive", "exclusive", "round"]
  },
  {
    id: "receipts",
    icon: "🧾",
    title: "Receipts",
    description: "Receipt printing and invoice formatting",
    keywords: ["receipt", "invoice", "print", "logo", "header", "footer", "qr", "thank you"]
  },
  {
    id: "tables",
    icon: "🪑",
    title: "Tables",
    description: "Floor plan and seating configuration",
    keywords: ["table", "seating", "capacity", "area", "cleaning", "buffer"]
  },
  {
    id: "payments",
    icon: "💳",
    title: "Payments",
    description: "Payment methods and processing rules",
    keywords: ["payment", "cash", "upi", "card", "online", "split", "cod"]
  },
  {
    id: "delivery",
    icon: "🚴",
    title: "Delivery",
    description: "Delivery platform integration",
    keywords: ["delivery", "swiggy", "zomato", "qr", "platform"]
  },
  {
    id: "staff-roles",
    icon: "👥",
    title: "Staff Roles",
    description: "Team permissions and access control",
    keywords: ["staff", "role", "permission", "access", "owner", "manager", "cashier"]
  },
  {
    id: "roles-permissions",
    icon: "🔐",
    title: "Roles & Permissions",
    description: "Enterprise access control system",
    keywords: ["role", "permission", "access", "control", "override", "emergency"]
  },
  {
    id: "devices",
    icon: "🖨️",
    title: "Devices",
    description: "Printers, scanners, and hardware",
    keywords: ["device", "printer", "scanner", "drawer", "display", "hardware"]
  },
  {
    id: "displays",
    icon: "📺",
    title: "Displays",
    description: "Customer display hub management",
    keywords: ["display", "hub", "screen", "monitor", "pairing"]
  },
  {
    id: "notifications",
    icon: "🔔",
    title: "Notifications",
    description: "Alerts and notification preferences",
    keywords: ["notification", "alert", "sound", "desktop", "mute", "priority"]
  },
  {
    id: "business-hours",
    icon: "📅",
    title: "Business Hours",
    description: "Operating hours and schedule",
    keywords: ["hours", "schedule", "open", "close", "break", "holiday"]
  },
  {
    id: "backup",
    icon: "💾",
    title: "Backup",
    description: "Data backup and restore",
    keywords: ["backup", "restore", "export", "import", "storage"]
  },
  {
    id: "cloud-storage",
    icon: "☁️",
    title: "Cloud Storage",
    description: "Configure cloud storage providers",
    keywords: ["cloud", "storage", "aws", "s3", "gcs", "azure", "firebase"]
  },
  {
    id: "security",
    icon: "🔒",
    title: "Security",
    description: "Access control and session management",
    keywords: ["security", "logout", "session", "pin", "password", "audit"]
  },
  {
    id: "about",
    icon: "ℹ️",
    title: "About CafeOS",
    description: "System information and support",
    keywords: ["about", "version", "database", "support", "documentation", "health"]
  }
];

// ── Premium UI Components ──────────────────────────────────────────────────────
export const PremiumToggle = ({ value, onChange, disabled, size = "default" }) => {
  const sizes = {
    small: { width: 36, height: 20, thumb: 16 },
    default: { width: 44, height: 24, thumb: 20 },
    large: { width: 52, height: 28, thumb: 24 }
  };
  const { width, height, thumb } = sizes[size];

  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      aria-pressed={value}
      disabled={disabled}
      style={{
        width, height, borderRadius: height / 2, border: "none",
        background: value ? "var(--cafe-success)" : "var(--cafe-bg-surface)",
        boxShadow: value ? `0 0 0 3px var(--cafe-success-bg)` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        width: thumb, height: thumb, borderRadius: "50%",
        background: value ? "#fff" : "var(--cafe-text-tertiary)",
        boxShadow: value
          ? "0 2px 8px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,.2)"
          : "0 1px 3px rgba(0,0,0,.3)",
        position: "absolute", top: (height - thumb) / 2,
        left: value ? width - thumb - 4 : 4,
        transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s, box-shadow 0.2s",
      }} />
    </button>
  );
};

export const PremiumCard = ({ children, hover = false, style = {} }) => (
  <div style={{
    ...card(),
    background: "var(--cafe-bg-card)",
    border: "1px solid var(--cafe-border-light)",
    borderRadius: 12,
    padding: 20,
    transition: hover ? "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    ...(hover ? {
      "&:hover": {
        boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)",
        borderColor: "var(--cafe-border)",
        transform: "translateY(-1px)"
      }
    } : {}),
    ...style
  }}>
    {children}
  </div>
);

const NavigationItem = ({ category, isActive, onClick, isMobile }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      padding: isMobile ? "12px 16px" : "16px 20px",
      borderRadius: 10,
      border: "none",
      background: isActive 
        ? "linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-dark) 100%)"
        : "transparent",
      color: isActive ? "#fff" : "var(--cafe-text-secondary)",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: 4,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}
  >
    <span style={{ fontSize: isMobile ? 18 : 20, lineHeight: 1, flexShrink: 0 }}>
      {category.icon}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: isMobile ? 13 : 14,
        fontWeight: isActive ? 600 : 500,
        lineHeight: 1.3,
        marginBottom: 2
      }}>
        {category.title}
      </div>
      <div style={{
        fontSize: isMobile ? 10 : 11,
        opacity: 0.8,
        lineHeight: 1.4,
        display: isMobile ? "none" : "block"
      }}>
        {category.description}
      </div>
    </div>
  </button>
);

const FloatingActionBar = ({ visible, onSave, onDiscard, onReview, saveStatus }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--cafe-bg-elevated)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: "12px 20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      zIndex: 1000,
      animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingRight: 16,
        borderRight: "1px solid var(--cafe-border-light)"
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--cafe-warning)",
          animation: "pulse 2s infinite"
        }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-primary)" }}>
          Unsaved Changes
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onReview}
          style={{
            ...btn("ghost"),
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8
          }}
        >
          Review
        </button>
        <button
          onClick={onDiscard}
          style={{
            ...btn("ghost"),
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8,
            color: "var(--cafe-danger)",
            borderColor: "var(--cafe-danger-border)"
          }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saveStatus === "saving"}
          style={{
            ...btn("primary"),
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8,
            opacity: saveStatus === "saving" ? 0.7 : 1
          }}
        >
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SystemControlCenter({ theme, toggleTheme, dataTools }) {
  const [s, setS] = useState(loadSettings);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("cafe-profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  // Responsive breakpoint
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Show floating bar when dirty
  useEffect(() => {
    setShowFloatingBar(dirty);
  }, [dirty]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    NAVIGATION_CATEGORIES.forEach(category => {
      if (category.keywords.some(keyword => keyword.includes(query))) {
        results.push(category);
      }
    });

    return results;
  }, [searchQuery]);

  const handleSearchSelect = (category) => {
    setActiveCategory(category.id);
    setSearchQuery("");
  };

  // Settings management (preserving existing logic)
  const set = useCallback((key, value) => {
    setS(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveStatus("unsaved");
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const handleSave = useCallback(() => {
    setSaveStatus("saving");
    saveSettings(s);
    setTimeout(() => {
      setSaveStatus("saved");
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  }, [s]);

  const handleDiscard = useCallback(() => {
    setS(loadSettings());
    setDirty(false);
    setSaveStatus("saved");
    setErrors({});
  }, []);

  const handleResetSection = useCallback(() => {
    // Reset current section to defaults
    const sectionDefaults = {};
    setS(prev => ({ ...prev, ...sectionDefaults }));
    setDirty(true);
    setSaveStatus("unsaved");
  }, []);

  const handleReviewChanges = useCallback(() => {
    // Show review dialog with diff
    console.log("Review changes:", s);
  }, [s]);

  // Demo mode handlers (preserving existing logic)
  const [demoClearDialog, setDemoClearDialog] = useState({ open: false });
  const [demoConvertDialog, setDemoConvertDialog] = useState({ open: false });
  const [demoStats, setDemoStats] = useState({ total: 0, demo: 0, production: 0 });

  useEffect(() => {
    if (dataTools) {
      const stats = getDemoStats(dataTools);
      setDemoStats(stats);
    }
  }, [dataTools]);

  const handleClearDemoData = useCallback(() => {
    const result = clearDemoData(dataTools);
    if (result.ok) {
      setDemoStats({ total: 0, demo: 0, production: 0 });
      const auditLog = createSecurityAuditLog({
        userId: getCurrentUserId(),
        details: { action: 'DEMO_DATA_CLEARED', description: result.message }
      });
      console.log('[SystemControlCenter] Demo data cleared:', auditLog);
    }
  }, [dataTools]);

  const handleConvertToProduction = useCallback(() => {
    const result = convertDemoToProduction(dataTools, { keepSettings: true, keepMenu: false });
    if (result.ok) {
      setDemoStats({ total: 0, demo: 0, production: 0 });
      const auditLog = createSecurityAuditLog({
        userId: getCurrentUserId(),
        details: { action: 'DEMO_TO_PRODUCTION_CONVERTED', description: result.message }
      });
      console.log('[SystemControlCenter] Demo converted to production:', auditLog);
      window.location.reload();
    }
  }, [dataTools]);

  const handleExportDemoData = useCallback(() => {
    const result = exportDemoData(dataTools);
    if (result.ok) {
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafeos_demo_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [dataTools]);

  const lastSaved = useMemo(() => {
    return new Date().toLocaleTimeString();
  }, [saveStatus]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--cafe-bg)",
      color: "var(--cafe-text-primary)",
      fontFamily: "'Sora','Inter',sans-serif",
      overflow: "hidden"
    }}>
      {/* Premium Header */}
      <div style={{
        padding: "24px 32px",
        borderBottom: "1px solid var(--cafe-border)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 4
          }}>
            System Control Center
          </h1>
          <p style={{
            fontSize: 13,
            color: "var(--cafe-text-tertiary)",
            margin: 0
          }}>
            Configure every part of your cafe from one place
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                ...input,
                width: 280,
                padding: "10px 16px 10px 40px",
                fontSize: 13,
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border-light)",
                borderRadius: 10,
                color: "var(--cafe-text-primary)"
              }}
            />
            <span style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "var(--cafe-text-tertiary)"
            }}>
              🔍
            </span>
            
            {/* Search Results Dropdown */}
            {searchQuery && searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 8,
                background: "var(--cafe-bg-elevated)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 100,
                maxHeight: 300,
                overflowY: "auto"
              }}>
                {searchResults.map((category, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchSelect(category)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "transparent",
                      color: "var(--cafe-text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      "&:hover": {
                        background: "var(--cafe-bg-surface)"
                      }
                    }}
                  >
                    <span>{category.icon}</span>
                    <span>{category.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={handleResetSection}
            style={{
              ...btn("ghost"),
              fontSize: 12,
              padding: "10px 16px",
              borderRadius: 10
            }}
          >
            Reset Section
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saveStatus === "saving"}
            style={{
              ...btn("primary"),
              fontSize: 12,
              padding: "10px 20px",
              borderRadius: 10,
              opacity: dirty ? 1 : 0.5
            }}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Last Saved Indicator */}
      {saveStatus === "saved" && !dirty && (
        <div style={{
          padding: "8px 32px",
          background: "var(--cafe-success-bg)",
          borderBottom: "1px solid var(--cafe-success-border)",
          fontSize: 11,
          color: "var(--cafe-success)",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <span>✓</span>
          <span>All changes saved at {lastSaved}</span>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Navigation Panel */}
        <div style={{
          width: isMobile ? 64 : 280,
          background: "var(--cafe-bg-elevated)",
          borderRight: "1px solid var(--cafe-border)",
          padding: isMobile ? "16px 8px" : "24px 16px",
          overflowY: "auto",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAVIGATION_CATEGORIES.map(category => (
              <NavigationItem
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>

        {/* Right Content Panel */}
        <div style={{
          flex: 1,
          padding: isMobile ? "20px" : "32px",
          overflowY: "auto",
          background: "var(--cafe-bg)"
        }}>
          {/* Section Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 8,
              letterSpacing: "-0.01em"
            }}>
              {NAVIGATION_CATEGORIES.find(c => c.id === activeCategory)?.title}
            </h2>
            <p style={{
              fontSize: 13,
              color: "var(--cafe-text-tertiary)",
              margin: 0
            }}>
              {NAVIGATION_CATEGORIES.find(c => c.id === activeCategory)?.description}
            </p>
          </div>

          {/* Section Content */}
          <div style={{ paddingBottom: 100 }}>
          <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading section...</div>}>
            {activeCategory === "cafe-profile" && (
              <CafeProfileSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "business" && (
              <BusinessSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "taxes" && (
              <TaxesSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "receipts" && (
              <ReceiptsSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "tables" && (
              <TablesSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "payments" && (
              <PaymentsSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "delivery" && (
              <DeliverySection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "staff-roles" && (
              <StaffRolesSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "roles-permissions" && (
              <RolesPermissionsSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "devices" && (
              <DevicesSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "displays" && (
              <DisplaysSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "notifications" && (
              <NotificationsSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "business-hours" && (
              <BusinessHoursSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "backup" && (
              <BackupSection settings={s} setSettings={set} isMobile={isMobile} dataTools={dataTools} />
            )}
            
            {activeCategory === "cloud-storage" && (
              <CloudStorageConfig settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "security" && (
              <SecuritySection settings={s} setSettings={set} isMobile={isMobile} />
            )}
            
            {activeCategory === "about" && (
              <AboutSection settings={s} setSettings={set} isMobile={isMobile} />
            )}
          </Suspense>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar
        visible={showFloatingBar}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onReview={handleReviewChanges}
        saveStatus={saveStatus}
      />

      {/* Demo Mode Dialogs */}
      <DestructiveDialog
        open={demoClearDialog.open}
        onClose={() => setDemoClearDialog({ open: false })}
        onConfirm={handleClearDemoData}
        title="Clear Demo Data"
        description="This will remove all demo data from your cafe."
        recordName="Demo Data"
        consequence="All demo records (orders, customers, etc.) will be permanently removed. Production data will be preserved. This cannot be undone."
        confirmLabel="Clear Demo Data"
      />

      <ConfirmDialog
        open={demoConvertDialog.open}
        onClose={() => setDemoConvertDialog({ open: false })}
        onConfirm={handleConvertToProduction}
        title="Convert to Production Mode"
        description="This will clear all demo data and switch to production mode."
        summary="After conversion, you'll need to configure your cafe for real use. Demo data will be removed. Settings will be preserved."
        confirmLabel="Convert to Production"
      />

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
