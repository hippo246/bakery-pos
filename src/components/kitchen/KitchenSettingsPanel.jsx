// Kitchen Settings Panel
// Comprehensive settings control for all kitchen display system features

import React, { useState, useEffect } from 'react';

export default function KitchenSettingsPanel({ onClose, settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings || getDefaultSettings());

  useEffect(() => {
    setLocalSettings(settings || getDefaultSettings());
  }, [settings]);

  const handleToggle = (category, key) => {
    const updated = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: !localSettings[category][key]
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveSettings(updated);
  };

  const handleSliderChange = (category, key, value) => {
    const updated = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveSettings(updated);
  };

  const handleSelectChange = (category, key, value) => {
    const updated = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveSettings(updated);
  };

  const resetToDefaults = () => {
    const defaults = getDefaultSettings();
    setLocalSettings(defaults);
    onSettingsChange(defaults);
    saveSettings(defaults);
  };

  const saveSettings = (settingsToSave) => {
    localStorage.setItem('kitchen_settings', JSON.stringify(settingsToSave));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: localSettings.display?.darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: localSettings.display?.darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: localSettings.display?.darkMode ? '1px solid #334155' : 'none'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: localSettings.display?.darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: localSettings.display?.darkMode ? '#1e293b' : '#ffffff',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: localSettings.display?.darkMode ? '#f8fafc' : '#111827' }}>
              ⚙️ Kitchen Settings
            </h2>
            <p style={{ margin: '4px 0 0 0', color: localSettings.display?.darkMode ? '#94a3b8' : '#6b7280', fontSize: '14px' }}>
              Configure all kitchen display system features
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={resetToDefaults}
              style={{
                padding: '10px 20px',
                background: localSettings.display?.darkMode ? '#334155' : '#f9fafb',
                color: localSettings.display?.darkMode ? '#f1f5f9' : '#111827',
                border: localSettings.display?.darkMode ? '1px solid #475569' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reset Defaults
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: localSettings.display?.darkMode ? '#3b82f6' : '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ padding: '32px' }}>
          {/* Display Settings */}
          <SettingsSection
            title="Display Settings"
            icon="🖥️"
            settings={localSettings.display}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('display', key)}
            onSliderChange={(key, value) => handleSliderChange('display', key, value)}
            onSelectChange={(key, value) => handleSelectChange('display', key, value)}
          />

          {/* Order Management */}
          <SettingsSection
            title="Order Management"
            icon="📋"
            settings={localSettings.orderManagement}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('orderManagement', key)}
            onSliderChange={(key, value) => handleSliderChange('orderManagement', key, value)}
            onSelectChange={(key, value) => handleSelectChange('orderManagement', key, value)}
          />

          {/* Station Settings */}
          <SettingsSection
            title="Station Settings"
            icon="🍳"
            settings={localSettings.stations}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('stations', key)}
            onSliderChange={(key, value) => handleSliderChange('stations', key, value)}
            onSelectChange={(key, value) => handleSelectChange('stations', key, value)}
          />

          {/* Notifications */}
          <SettingsSection
            title="Notifications & Alerts"
            icon="🔔"
            settings={localSettings.notifications}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('notifications', key)}
            onSliderChange={(key, value) => handleSliderChange('notifications', key, value)}
            onSelectChange={(key, value) => handleSelectChange('notifications', key, value)}
          />

          {/* Performance */}
          <SettingsSection
            title="Performance & Analytics"
            icon="📊"
            settings={localSettings.performance}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('performance', key)}
            onSliderChange={(key, value) => handleSliderChange('performance', key, value)}
            onSelectChange={(key, value) => handleSelectChange('performance', key, value)}
          />

          {/* Advanced */}
          <SettingsSection
            title="Advanced Settings"
            icon="🔧"
            settings={localSettings.advanced}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('advanced', key)}
            onSliderChange={(key, value) => handleSliderChange('advanced', key, value)}
            onSelectChange={(key, value) => handleSelectChange('advanced', key, value)}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, settings, fullSettings, onToggle, onSliderChange, onSelectChange }) {
  // Get dark mode from the full settings object
  const isDarkMode = fullSettings?.display?.darkMode !== false; // Default to true if not set
  
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: isDarkMode ? '2px solid #334155' : '2px solid #f3f4f6'
      }}>
        <span style={{ fontSize: '28px' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#111827' }}>
          {title}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {Object.entries(settings).map(([key, value]) => (
          <SettingItem
            key={key}
            keyName={key}
            value={value}
            onToggle={onToggle}
            onSliderChange={onSliderChange}
            onSelectChange={onSelectChange}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
}

function SettingItem({ keyName, value, onToggle, onSliderChange, onSelectChange, isDarkMode }) {
  const label = formatLabel(keyName);
  const description = getDescription(keyName);

  if (typeof value === 'boolean') {
    return (
      <div style={{
        padding: '16px',
        background: isDarkMode ? '#334155' : '#f9fafb',
        borderRadius: '12px',
        border: isDarkMode ? '1px solid #475569' : '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#111827', marginBottom: '4px' }}>
              {label}
            </div>
            {description && (
              <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', lineHeight: '1.4' }}>
                {description}
              </div>
            )}
          </div>
          <ToggleSwitch
            isOn={value}
            onToggle={() => onToggle(keyName)}
          />
        </div>
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div style={{
        padding: '16px',
        background: isDarkMode ? '#334155' : '#f9fafb',
        borderRadius: '12px',
        border: isDarkMode ? '1px solid #475569' : '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#111827', marginBottom: '8px' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '12px', lineHeight: '1.4' }}>
            {description}
          </div>
        )}
        <input
          type="range"
          min="1"
          max="60"
          value={value}
          onChange={(e) => onSliderChange(keyName, parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', marginTop: '4px' }}>
          {value} {keyName.includes('seconds') || keyName.includes('interval') ? 'seconds' : keyName.includes('minutes') ? 'minutes' : ''}
        </div>
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div style={{
        padding: '16px',
        background: isDarkMode ? '#334155' : '#f9fafb',
        borderRadius: '12px',
        border: isDarkMode ? '1px solid #475569' : '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#111827', marginBottom: '8px' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '12px', lineHeight: '1.4' }}>
            {description}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onSelectChange(keyName, e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: isDarkMode ? '1px solid #475569' : '1px solid #d1d5db',
            fontSize: '14px',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f8fafc' : '#111827'
          }}
        >
          {getOptions(keyName).map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}

function ToggleSwitch({ isOn, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '48px',
        height: '28px',
        borderRadius: '14px',
        background: isOn ? '#10b981' : '#d1d5db',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        padding: 0
      }}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#ffffff',
        position: 'absolute',
        top: '2px',
        left: isOn ? '22px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }} />
    </button>
  );
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function getDescription(key) {
  const descriptions = {
    // Display
    expoMode: 'Show consolidated view of all stations on one screen',
    condensedView: 'Collapse ticket info into compact view for more tickets on screen',
    darkMode: 'Use dark theme for low-light environments',
    ticketZoom: 'Scale ticket size for better visibility',
    paginationEnabled: 'Enable pagination for large numbers of tickets',
    
    // Order Management
    orderChannelConsolidation: 'Show all on-premise and third-party orders in one place',
    courseBasedSeparation: 'Separate each course into individual tickets',
    automatedFiring: 'Auto-fire orders based on preparation time',
    moveReadyToFront: 'Auto-move completed tickets to front of queue',
    previewTickets: 'Show upcoming items as they are added before firing',
    paymentStatus: 'Display whether order was paid or unpaid',
    
    // Stations
    itemLevelRouting: 'Route specific items to specific stations',
    loadBalancing: 'Divide tickets between multiple station devices',
    assemblyLines: 'Create sequences of prep stations for items',
    
    // Notifications
    soundAlerts: 'Play sound alerts for new orders',
    speechAnnouncements: 'Voice announcements for new orders',
    smsAlerts: 'Send SMS notifications when orders are ready',
    inAppAlerts: 'Send in-app notifications to servers',
    urgencyIndicators: 'Show visual urgency indicators for aging orders',
    
    // Performance
    prepTimeTracking: 'Track and report preparation times',
    bottleneckDetection: 'Detect and highlight kitchen bottlenecks',
    performanceMetrics: 'Show performance analytics dashboard',
    allDayCounts: 'Show condensed count of items across all orders',
    
    // Advanced
    offlineMode: 'Continue operations without internet connection',
    bumpBarSupport: 'Enable programmable bump bar controls',
    runnerTicketPrinting: 'Print runner tickets directly from KDS',
    viewingRecipes: 'Show recipes on KDS for menu items',
    timestamps: 'Track when order received, started, and finished',
    autoRefresh: 'Automatically refresh order data',
    smartPriority: 'Use AI-based priority calculation'
  };
  return descriptions[key];
}

function getOptions(key) {
  const optionsMap = {
    ticketLayout: [
      { value: 'grid', label: 'Grid Layout' },
      { value: 'list', label: 'List Layout' },
      { value: 'compact', label: 'Compact Layout' }
    ],
    sortOrder: [
      { value: 'time', label: 'By Time' },
      { value: 'priority', label: 'By Priority' },
      { value: 'station', label: 'By Station' },
      { value: 'category', label: 'By Category' }
    ],
    refreshInterval: [
      { value: '3', label: '3 seconds' },
      { value: '5', label: '5 seconds' },
      { value: '10', label: '10 seconds' },
      { value: '30', label: '30 seconds' }
    ]
  };
  return optionsMap[key] || [];
}

export function getDefaultSettings() {
  return {
    display: {
      expoMode: false,
      darkMode: true,
      ticketZoom: 100,
      ticketLayout: 'grid',
      sortOrder: 'time'
    },
    orderManagement: {
      orderChannelConsolidation: true,
      courseBasedSeparation: false,
      automatedFiring: false,
      moveReadyToFront: true,
      previewTickets: false,
      paymentStatus: true,
      timestamps: true,
      pagination: true,
      condensedView: false,
      runnerTicketPrinting: false,
      smsAlerts: false
    },
    stations: {
      itemLevelRouting: true,
      loadBalancing: false,
      assemblyLines: false
    },
    notifications: {
      soundAlerts: true,
      speechAnnouncements: true,
      inAppAlerts: false,
      urgencyIndicators: true
    },
    performance: {
      prepTimeTracking: true,
      bottleneckDetection: true,
      performanceMetrics: true,
      allDayCounts: false
    },
    advanced: {
      offlineMode: false,
      bumpBarSupport: false,
      viewingRecipes: true,
      autoRefresh: true,
      refreshInterval: 5,
      smartPriority: true,
      fireDelayMinutes: 5,
      itemsPerPage: 12
    }
  };
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem('kitchen_settings');
    if (saved) {
      return { ...getDefaultSettings(), ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return getDefaultSettings();
}
