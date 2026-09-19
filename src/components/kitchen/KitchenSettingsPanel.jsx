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
    // Validate slider values
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 60) {
      console.warn('Invalid slider value:', value);
      return;
    }
    
    const updated = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: numValue
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveSettings(updated);
  };

  const handleSelectChange = (category, key, value) => {
    // Validate select values
    if (!value || value === '') {
      console.warn('Invalid select value:', value);
      return;
    }
    
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
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: '#000000',
        border: '2px solid #00ff00',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        fontFamily: '"Courier New", monospace'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #00ff00',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#000000',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#00ff00' }}>
              =================================
              KITCHEN SETTINGS
              =================================
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#00ff00', fontSize: '12px' }}>
              &gt; Configure display system features
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={resetToDefaults}
              style={{
                padding: '8px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ RESET ]
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#00ff00',
                color: '#000000',
                border: '1px solid #00ff00',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace'
              }}
            >
              [ CLOSE ]
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ padding: '24px' }}>
          {/* Display Settings */}
          <SettingsSection
            title="DISPLAY SETTINGS"
            icon="[D]"
            settings={localSettings.display}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('display', key)}
            onSliderChange={(key, value) => handleSliderChange('display', key, value)}
            onSelectChange={(key, value) => handleSelectChange('display', key, value)}
          />

          {/* Oracle KDS Toggle */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#001100',
            border: '2px solid #00ff00',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#00ff00',
              marginBottom: '12px',
              borderBottom: '1px solid #00ff00',
              paddingBottom: '8px'
            }}>
              ORACLE KDS MODE
            </div>
            <div style={{
              fontSize: '11px',
              color: '#00ff00',
              marginBottom: '12px',
              lineHeight: '1.4'
            }}>
              Switch to Oracle-style Kitchen Display System - exact replica of professional KDS interface
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const updated = { ...localSettings, oracleKDS: { ...localSettings.oracleKDS, enabled: false } };
                  setLocalSettings(updated);
                  onSettingsChange(updated);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !localSettings.oracleKDS?.enabled ? '#00ff00' : '#000000',
                  color: !localSettings.oracleKDS?.enabled ? '#000000' : '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                STANDARD KITCHEN
              </button>
              <button
                onClick={() => {
                  const updated = { ...localSettings, oracleKDS: { ...localSettings.oracleKDS, enabled: true }, splitKDS: { ...localSettings.splitKDS, enabled: false } };
                  setLocalSettings(updated);
                  onSettingsChange(updated);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: localSettings.oracleKDS?.enabled ? '#00ff00' : '#000000',
                  color: localSettings.oracleKDS?.enabled ? '#000000' : '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                ORACLE KDS
              </button>
            </div>
          </div>

          {/* Split KDS Toggle */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#001100',
            border: '2px solid #00ff00',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#00ff00',
              marginBottom: '12px',
              borderBottom: '1px solid #00ff00',
              paddingBottom: '8px'
            }}>
              SPLIT KDS MODE
            </div>
            <div style={{
              fontSize: '11px',
              color: '#00ff00',
              marginBottom: '12px',
              lineHeight: '1.4'
            }}>
              SplitAbility-style Kitchen Display System - column-based cache organization
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const updated = { ...localSettings, splitKDS: { ...localSettings.splitKDS, enabled: false } };
                  setLocalSettings(updated);
                  onSettingsChange(updated);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !localSettings.splitKDS?.enabled ? '#00ff00' : '#000000',
                  color: !localSettings.splitKDS?.enabled ? '#000000' : '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                DISABLE
              </button>
              <button
                onClick={() => {
                  const updated = { ...localSettings, splitKDS: { ...localSettings.splitKDS, enabled: true }, oracleKDS: { ...localSettings.oracleKDS, enabled: false } };
                  setLocalSettings(updated);
                  onSettingsChange(updated);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: localSettings.splitKDS?.enabled ? '#00ff00' : '#000000',
                  color: localSettings.splitKDS?.enabled ? '#000000' : '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                ENABLE
              </button>
            </div>
          </div>

          {/* Order Management */}
          <SettingsSection
            title="ORDER MANAGEMENT"
            icon="[O]"
            settings={localSettings.orderManagement}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('orderManagement', key)}
            onSliderChange={(key, value) => handleSliderChange('orderManagement', key, value)}
            onSelectChange={(key, value) => handleSelectChange('orderManagement', key, value)}
          />

          {/* Station Settings */}
          <SettingsSection
            title="STATION SETTINGS"
            icon="[S]"
            settings={localSettings.stations}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('stations', key)}
            onSliderChange={(key, value) => handleSliderChange('stations', key, value)}
            onSelectChange={(key, value) => handleSelectChange('stations', key, value)}
          />

          {/* Notifications */}
          <SettingsSection
            title="NOTIFICATIONS"
            icon="[N]"
            settings={localSettings.notifications}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('notifications', key)}
            onSliderChange={(key, value) => handleSliderChange('notifications', key, value)}
            onSelectChange={(key, value) => handleSelectChange('notifications', key, value)}
          />

          {/* Performance */}
          <SettingsSection
            title="PERFORMANCE"
            icon="[P]"
            settings={localSettings.performance}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('performance', key)}
            onSliderChange={(key, value) => handleSliderChange('performance', key, value)}
            onSelectChange={(key, value) => handleSelectChange('performance', key, value)}
          />

          {/* Advanced */}
          <SettingsSection
            title="ADVANCED"
            icon="[A]"
            settings={localSettings.advanced}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('advanced', key)}
            onSliderChange={(key, value) => handleSliderChange('advanced', key, value)}
            onSelectChange={(key, value) => handleSelectChange('advanced', key, value)}
          />

          {/* Oracle KDS */}
          <SettingsSection
            title="ORACLE KDS"
            icon="[O]"
            settings={localSettings.oracleKDS}
            fullSettings={localSettings}
            onToggle={(key) => handleToggle('oracleKDS', key)}
            onSliderChange={(key, value) => handleSliderChange('oracleKDS', key, value)}
            onSelectChange={(key, value) => handleSelectChange('oracleKDS', key, value)}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, settings, fullSettings, onToggle, onSliderChange, onSelectChange }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid #00ff00'
      }}>
        <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: 'bold' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#00ff00' }}>
          {title}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {Object.entries(settings).map(([key, value]) => (
          <SettingItem
            key={key}
            keyName={key}
            value={value}
            onToggle={onToggle}
            onSliderChange={onSliderChange}
            onSelectChange={onSelectChange}
          />
        ))}
      </div>
    </div>
  );
}

function SettingItem({ keyName, value, onToggle, onSliderChange, onSelectChange }) {
  const label = formatLabel(keyName);
  const description = getDescription(keyName);

  if (typeof value === 'boolean') {
    return (
      <div style={{
        padding: '12px',
        background: '#000000',
        border: '1px solid #00ff00',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '4px' }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: '10px', color: '#00ff00', lineHeight: '1.4', opacity: 0.7 }}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={() => onToggle(keyName)}
          style={{
            padding: '4px 12px',
            background: value ? '#00ff00' : '#000000',
            color: value ? '#000000' : '#00ff00',
            border: '1px solid #00ff00',
            borderRadius: '0px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Courier New", monospace'
          }}
        >
          {value ? 'ON' : 'OFF'}
        </button>
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div style={{
        padding: '12px',
        background: '#000000',
        border: '1px solid #00ff00'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '10px', color: '#00ff00', marginBottom: '12px', lineHeight: '1.4', opacity: 0.7 }}>
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
        <div style={{ fontSize: '10px', color: '#00ff00', marginTop: '4px' }}>
          {value} {keyName.includes('seconds') || keyName.includes('interval') ? 'seconds' : keyName.includes('minutes') ? 'minutes' : ''}
        </div>
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div style={{
        padding: '12px',
        background: '#000000',
        border: '1px solid #00ff00'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '10px', color: '#00ff00', marginBottom: '12px', lineHeight: '1.4', opacity: 0.7 }}>
            {description}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onSelectChange(keyName, e.target.value)}
          style={{
            width: '100%',
            padding: '6px 12px',
            borderRadius: '0px',
            border: '1px solid #00ff00',
            fontSize: '12px',
            background: '#000000',
            color: '#00ff00',
            fontFamily: '"Courier New", monospace'
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
    ticketLayout: 'Choose ticket layout style (modern, professional, minimal, condensed, list, expo)',
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
    ],
    ticketLayout: [
      { value: 'modern', label: 'Modern (Default)' },
      { value: 'professional', label: 'Professional KDS' },
      { value: 'minimal', label: 'Minimal Clean' },
      { value: 'condensed', label: 'Condensed' },
      { value: 'list', label: 'List View' },
      { value: 'expo', label: 'Expo View' }
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
      ticketLayout: 'professional',
      useOracleKDS: false,
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
    },
    oracleKDS: {
      enabled: false,
      display: {
        fontSize: 'medium',
        showTimers: true,
        showAging: true,
        compactMode: false,
        highlightSelected: true
      },
      automation: {
        autoMoveCompleted: true,
        autoSelectNext: false,
        soundAlerts: true,
        averagePrepCalculation: true
      },
      buttons: {
        showDone: true,
        showRecall: true,
        showView: true,
        showMove: true,
        showCancel: true,
        prepButtons: ['P1', 'P2', 'P3', 'P4', 'P5'],
        prepButtonMode: 'timeFilter'
      },
      columns: {
        showOrderNumber: true,
        showTable: true,
        showTime: true,
        showItems: true,
        showStatus: true,
        showPrepTime: true,
        showCustomer: false,
        showNotes: true,
        showAge: true
      }
    },
    splitKDS: {
      enabled: false,
      display: {
        columnCount: 4,
        showTimestamps: true,
        showItemCount: true,
        compactMode: false
      }
    }
  };
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem('kitchen_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Deep merge with defaults to ensure all required properties exist
      return {
        display: { ...getDefaultSettings().display, ...(parsed.display || {}) },
        orderManagement: { ...getDefaultSettings().orderManagement, ...(parsed.orderManagement || {}) },
        stations: { ...getDefaultSettings().stations, ...(parsed.stations || {}) },
        notifications: { ...getDefaultSettings().notifications, ...(parsed.notifications || {}) },
        performance: { ...getDefaultSettings().performance, ...(parsed.performance || {}) },
        advanced: { ...getDefaultSettings().advanced, ...(parsed.advanced || {}) }
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return getDefaultSettings();
}
