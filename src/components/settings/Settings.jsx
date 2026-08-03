import React from 'react';
import { useState, useEffect, useCallback } from "react";
import SettingsLayout from "./SettingsLayout";
import SettingsHomeSection from "./sections/SettingsHomeSection";
import GeneralSettingsSection from "./sections/GeneralSettingsSection";
import BusinessProfileSection from "./sections/BusinessProfileSection";
import PaymentsSettingsSection from "./sections/PaymentsSettingsSection";
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
      default:
        return <SettingsHomeSection {...sectionProps} onNavigate={handleSectionChange} />;
    }
  };

  // Save status indicator
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saved':
        return <span style={{ color: '#198754', fontSize: '12px' }}>✓ Saved</span>;
      case 'saving':
        return <span style={{ color: '#ffc107', fontSize: '12px' }}>⏳ Saving...</span>;
      case 'error':
        return <span style={{ color: '#dc3545', fontSize: '12px' }}>✗ Error</span>;
      default:
        return <span style={{ color: '#6c757d', fontSize: '12px' }}>● Unsaved</span>;
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
        background: '#f8f9fa'
      }}>
        {/* Header with save status */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #dee2e6'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#212529' }}>
              Settings
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6c757d' }}>
              Configure your cafe system
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SaveStatusIndicator />
            {lastSaved && (
              <span style={{ fontSize: '12px', color: '#6c757d' }}>
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: '#f8f9fa'
        }}>
          {renderSection()}
        </div>
      </div>
    </SettingsLayout>
  );
}
