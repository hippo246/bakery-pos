import React from 'react';
import { useState, useEffect, useCallback } from "react";
import SettingsLayout from "./SettingsLayout";
import SettingsHomeSection from "./sections/SettingsHomeSection";
import GeneralSettingsSection from "./sections/GeneralSettingsSection";
import BusinessProfileSection from "./sections/BusinessProfileSection";
import PaymentsSettingsSection from "./sections/PaymentsSettingsSection";
import PaymentGatewaySettingsSection from "./sections/PaymentGatewaySettingsSection";
import TaxesSettingsSection from "./sections/TaxesSettingsSection";
import OrdersSettingsSection from "./sections/OrdersSettingsSection";
import OperatingHoursSettingsSection from "./sections/OperatingHoursSettingsSection";
import KitchenSettingsSection from "./sections/KitchenSettingsSection";
import MenuSettingsSection from "./sections/MenuSettingsSection";
import ReceiptsPrintingSettingsSection from "./sections/ReceiptsPrintingSettingsSection";
import DeliverySettingsSection from "./sections/DeliverySettingsSection";
import ReservationsSettingsSection from "./sections/ReservationsSettingsSection";
import NotificationsSettingsSection from "./sections/NotificationsSettingsSection";
import SecuritySettingsSection from "./sections/SecuritySettingsSection";
import SupportSettingsSection from "./sections/SupportSettingsSection";
import AboutSettingsSection from "./sections/AboutSettingsSection";
import DataBackupsSettingsSection from "./sections/DataBackupsSettingsSection";
import AdvancedSettingsSection from "./sections/AdvancedSettingsSection";
import DangerZoneSettingsSection from "./sections/DangerZoneSettingsSection";
import ThemeSettingsSection from "./sections/ThemeSettingsSection";
import TerminalSettingsSection from "./sections/TerminalSettingsSection";
import { useMobile } from '../../hooks/useMobile.js';

// Default settings
export const DEFAULTS = {
  cafeName: "My Cafe",
  timezone: "Asia/Kolkata",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  language: "en",
  notifications: true,
  soundEnabled: true,
  defaultOrderType: "dine_in",
  kdsEnabled: true,
  gstEnabled: true,
  taxRate: 18,
  deliveryEnabled: false,
  reservationsEnabled: false,
  theme: "light"
};

// Load settings from localStorage
export function loadSettings() {
  try {
    const stored = localStorage.getItem('brewcrm_settings');
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return { ...DEFAULTS };
  }
}

// Save settings to localStorage
export function saveSettings(settings) {
  try {
    localStorage.setItem('brewcrm_settings', JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

// Main Settings component
export default function Settings({ theme, toggleTheme, dataTools }) {
  const [settings, setSettings] = useState(() => loadSettings());
  const [activeSection, setActiveSection] = useState('home');
  const { isMobile } = useMobile();
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save settings when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (saveStatus === 'saved') return;
      
      setSaveStatus('saving');
      const success = saveSettings(settings);
      if (success) {
        setSaveStatus('saved');
        setLastSaved(new Date().toISOString());
      } else {
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings, saveStatus]);

  // Handle setting changes
  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaveStatus('unsaved');
  }, []);

  // Handle section change
  const handleSectionChange = useCallback((sectionKey) => {
    setActiveSection(sectionKey);
  }, []);

  // Common props for all sections
  const sectionProps = {
    settings,
    onSettingChange: handleSettingChange,
    isMobile,
    saveStatus,
    lastSaved
  };

  // Render the appropriate section
  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <SettingsHomeSection {...sectionProps} onNavigate={handleSectionChange} />;
      case 'general':
        return <GeneralSettingsSection {...sectionProps} />;
      case 'business':
        return <BusinessProfileSection {...sectionProps} />;
      case 'payments':
        return <PaymentsSettingsSection {...sectionProps} />;
      case 'payment-gateways':
        return <PaymentGatewaySettingsSection {...sectionProps} />;
      case 'taxes':
        return <TaxesSettingsSection {...sectionProps} />;
      case 'orders':
        return <OrdersSettingsSection {...sectionProps} />;
      case 'hours':
        return <OperatingHoursSettingsSection {...sectionProps} />;
      case 'kitchen':
        return <KitchenSettingsSection {...sectionProps} />;
      case 'menu':
        return <MenuSettingsSection {...sectionProps} />;
      case 'receipts':
        return <ReceiptsPrintingSettingsSection {...sectionProps} />;
      case 'delivery':
        return <DeliverySettingsSection {...sectionProps} />;
      case 'reservations':
        return <ReservationsSettingsSection {...sectionProps} />;
      case 'notifications':
        return <NotificationsSettingsSection {...sectionProps} />;
      case 'security':
        return <SecuritySettingsSection {...sectionProps} />;
      case 'backups':
        return <DataBackupsSettingsSection {...sectionProps} />;
      case 'support':
        return <SupportSettingsSection {...sectionProps} />;
      case 'advanced':
        return <AdvancedSettingsSection {...sectionProps} />;
      case 'danger':
        return <DangerZoneSettingsSection {...sectionProps} />;
      case 'about':
        return <AboutSettingsSection {...sectionProps} />;
      case 'theme':
        return <ThemeSettingsSection {...sectionProps} />;
      case 'terminals':
        return <TerminalSettingsSection {...sectionProps} />;
      default:
        return <SettingsHomeSection {...sectionProps} onNavigate={handleSectionChange} />;
    }
  };

  // Save status indicator
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saved':
        return <span style={{ color: "var(--cafe-success)", fontSize: 12, fontWeight: 600 }}>✓ Saved</span>;
      case 'saving':
        return <span style={{ color: "var(--cafe-warning)", fontSize: 12, fontWeight: 600 }}>⏳ Saving...</span>;
      case 'error':
        return <span style={{ color: "var(--cafe-danger)", fontSize: 12, fontWeight: 600 }}>✗ Error</span>;
      default:
        return <span style={{ color: "var(--cafe-text-tertiary)", fontSize: 12, fontWeight: 600 }}>● Unsaved</span>;
    }
  };

  return (
    <SettingsLayout
      activeCategory={activeSection}
      onCategoryChange={handleSectionChange}
      isMobile={isMobile}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--cafe-bg)'
      }}>
        {/* Header with save status */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          background: 'var(--cafe-bg-surface)',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em" }}>
              Settings
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: "var(--cafe-text-secondary)", fontWeight: 500 }}>
              Configure your cafe system
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SaveStatusIndicator />
            {lastSaved && (
              <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={toggleTheme}
              style={{
                padding: '10px 18px',
                background: 'var(--cafe-bg-hover)',
                color: "var(--cafe-text-secondary)",
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '28px',
          background: 'var(--cafe-bg)'
        }}>
          {renderSection()}
        </div>
      </div>
    </SettingsLayout>
  );
}
