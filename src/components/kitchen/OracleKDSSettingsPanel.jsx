import React, { useState, useEffect } from 'react';

export function getDefaultOracleSettings() {
  return {
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
      prepButtonMode: 'timeFilter', // 'timeFilter', 'priority', 'preset', 'staff', 'hold', 'zone'
      presetFilters: {
        P1: 'myOrders',
        P2: 'drinksOnly', 
        P3: 'allPending',
        P4: 'urgent',
        P5: 'all'
      },
      priorityLevels: {
        P1: 'urgent',
        P2: 'high',
        P3: 'normal',
        P4: 'low',
        P5: 'deferred'
      },
      staffAssignments: {
        P1: 'cook1',
        P2: 'cook2',
        P3: 'cook3',
        P4: 'cook4',
        P5: 'cook5'
      },
      holdSlots: {
        P1: 'waiting1',
        P2: 'waiting2',
        P3: 'waiting3',
        P4: 'waiting4',
        P5: 'waiting5'
      },
      zoneFilters: {
        P1: 'patio',
        P2: 'bar',
        P3: 'dining',
        P4: 'takeout',
        P5: 'delivery'
      }
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
    },
    information: {
      showAveragePrepTime: true,
      showCurrentTime: true,
      showTableNumbers: true,
      showOrderCounts: true
    }
  };
}

export function loadOracleSettings() {
  try {
    const saved = localStorage.getItem('oracle_kds_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Deep merge with defaults
      return {
        display: { ...getDefaultOracleSettings().display, ...(parsed.display || {}) },
        automation: { ...getDefaultOracleSettings().automation, ...(parsed.automation || {}) },
        buttons: { ...getDefaultOracleSettings().buttons, ...(parsed.buttons || {}) },
        information: { ...getDefaultOracleSettings().information, ...(parsed.information || {}) }
      };
    }
  } catch (error) {
    console.error('Error loading Oracle KDS settings:', error);
  }
  return getDefaultOracleSettings();
}

export function saveOracleSettings(settings) {
  try {
    localStorage.setItem('oracle_kds_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving Oracle KDS settings:', error);
  }
}

export default function OracleKDSSettingsPanel({ settings, onSettingsChange, darkMode = true }) {
  const defaultSettings = getDefaultOracleSettings();
  const [localSettings, setLocalSettings] = useState({ ...defaultSettings, ...settings });

  useEffect(() => {
    setLocalSettings({ ...defaultSettings, ...settings });
  }, [settings]);

  const handleToggle = (category, key) => {
    const updated = {
      ...localSettings,
      [category]: {
        ...(localSettings[category] || {}),
        [key]: !localSettings[category]?.[key]
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveOracleSettings(updated);
  };

  const handleSelectChange = (category, key, value) => {
    const updated = {
      ...localSettings,
      [category]: {
        ...(localSettings[category] || {}),
        [key]: value
      }
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
    saveOracleSettings(updated);
  };

  return (
    <div style={{
      padding: '24px',
      background: '#000000',
      color: '#00ff00',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'auto',
      border: '2px solid #00ff00',
      borderRadius: '8px'
    }}>
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #00ff00', paddingBottom: '12px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff00', marginBottom: '8px' }}>
          ORACLE KDS SETTINGS
        </div>
        <div style={{ fontSize: '14px', color: '#00ff00', opacity: 0.8 }}>
          Configure Oracle-style Kitchen Display System
        </div>
      </div>

      {/* Display Settings */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff00', marginBottom: '16px' }}>
          DISPLAY SETTINGS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Font Size:</span>
            <select
              value={localSettings.display.fontSize}
              onChange={(e) => handleSelectChange('display', 'fontSize', e.target.value)}
              style={{
                padding: '10px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Timers</span>
            <button
              onClick={() => handleToggle('display', 'showTimers')}
              style={{
                padding: '12px 24px',
                background: localSettings.display.showTimers ? '#00ff00' : '#000000',
                color: localSettings.display.showTimers ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.display.showTimers ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Aging</span>
            <button
              onClick={() => handleToggle('display', 'showAging')}
              style={{
                padding: '12px 24px',
                background: localSettings.display.showAging ? '#00ff00' : '#000000',
                color: localSettings.display.showAging ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.display.showAging ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Compact Mode</span>
            <button
              onClick={() => handleToggle('display', 'compactMode')}
              style={{
                padding: '12px 24px',
                background: localSettings.display.compactMode ? '#00ff00' : '#000000',
                color: localSettings.display.compactMode ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.display.compactMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Highlight Selected</span>
            <button
              onClick={() => handleToggle('display', 'highlightSelected')}
              style={{
                padding: '12px 24px',
                background: localSettings.display.highlightSelected ? '#00ff00' : '#000000',
                color: localSettings.display.highlightSelected ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.display.highlightSelected ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Automation Settings */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff00', marginBottom: '16px' }}>
          AUTOMATION SETTINGS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Auto Move Completed</span>
            <button
              onClick={() => handleToggle('automation', 'autoMoveCompleted')}
              style={{
                padding: '12px 24px',
                background: localSettings.automation.autoMoveCompleted ? '#00ff00' : '#000000',
                color: localSettings.automation.autoMoveCompleted ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.automation.autoMoveCompleted ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Auto Select Next</span>
            <button
              onClick={() => handleToggle('automation', 'autoSelectNext')}
              style={{
                padding: '12px 24px',
                background: localSettings.automation.autoSelectNext ? '#00ff00' : '#000000',
                color: localSettings.automation.autoSelectNext ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.automation.autoSelectNext ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Sound Alerts</span>
            <button
              onClick={() => handleToggle('automation', 'soundAlerts')}
              style={{
                padding: '12px 24px',
                background: localSettings.automation.soundAlerts ? '#00ff00' : '#000000',
                color: localSettings.automation.soundAlerts ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.automation.soundAlerts ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Average Prep Calculation</span>
            <button
              onClick={() => handleToggle('automation', 'averagePrepCalculation')}
              style={{
                padding: '12px 24px',
                background: localSettings.automation.averagePrepCalculation ? '#00ff00' : '#000000',
                color: localSettings.automation.averagePrepCalculation ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.automation.averagePrepCalculation ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Button Settings */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff00', marginBottom: '16px' }}>
          BUTTON SETTINGS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show DONE Button</span>
            <button
              onClick={() => handleToggle('buttons', 'showDone')}
              style={{
                padding: '12px 24px',
                background: localSettings.buttons?.showDone ? '#00ff00' : '#000000',
                color: localSettings.buttons?.showDone ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.buttons?.showDone ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Recall Button</span>
            <button
              onClick={() => handleToggle('buttons', 'showRecall')}
              style={{
                padding: '12px 24px',
                background: localSettings.buttons?.showRecall ? '#00ff00' : '#000000',
                color: localSettings.buttons?.showRecall ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.buttons?.showRecall ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show View Button</span>
            <button
              onClick={() => handleToggle('buttons', 'showView')}
              style={{
                padding: '12px 24px',
                background: localSettings.buttons?.showView ? '#00ff00' : '#000000',
                color: localSettings.buttons?.showView ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.buttons?.showView ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Move Button</span>
            <button
              onClick={() => handleToggle('buttons', 'showMove')}
              style={{
                padding: '12px 24px',
                background: localSettings.buttons?.showMove ? '#00ff00' : '#000000',
                color: localSettings.buttons?.showMove ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.buttons?.showMove ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Cancel Button</span>
            <button
              onClick={() => handleToggle('buttons', 'showCancel')}
              style={{
                padding: '12px 24px',
                background: localSettings.buttons?.showCancel ? '#00ff00' : '#000000',
                color: localSettings.buttons?.showCancel ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.buttons?.showCancel ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
              Prep Button Mode:
            </div>
            <select
              value={localSettings.buttons?.prepButtonMode || 'timeFilter'}
              onChange={(e) => handleSelectChange('buttons', 'prepButtonMode', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              <option value="timeFilter">Time Filter (P1 = 1min, P5 = 5min)</option>
              <option value="priority">Priority Levels (P1 = Urgent, P5 = Low)</option>
              <option value="preset">Preset Filters (Custom saved views)</option>
              <option value="staff">Staff Assignment (Load balancing)</option>
              <option value="hold">Hold Slots (Parking tickets)</option>
              <option value="zone">Zone Filters (Patio, Bar, Dining, etc.)</option>
            </select>
            <div style={{ fontSize: '11px', color: '#00ff00', opacity: 0.7, marginTop: '8px' }}>
              Choose what the P buttons control in your kitchen workflow
            </div>
          </div>

          <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
              Prep Button Labels (comma-separated):
            </div>
            <input
              type="text"
              value={localSettings.buttons?.prepButtons?.join(',') || 'P1,P2,P3,P4,P5'}
              onChange={(e) => {
                const buttons = e.target.value.split(',').map(b => b.trim()).filter(b => b);
                handleSelectChange('buttons', 'prepButtons', buttons);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#000000',
                color: '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
              placeholder="P1,P2,P3,P4,P5"
            />
            <div style={{ fontSize: '11px', color: '#00ff00', opacity: 0.7, marginTop: '8px' }}>
              Customize button labels (e.g., "1m,3m,5m" or "LOW,MED,HIGH")
            </div>
          </div>

          {/* Mode-specific configuration */}
          {localSettings.buttons?.prepButtonMode === 'preset' && (
            <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
                Preset Filter Configuration:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSettings.buttons?.prepButtons?.map((button, index) => (
                  <div key={button} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff00', minWidth: '40px', fontWeight: 'bold' }}>{button}:</span>
                    <select
                      value={localSettings.buttons.presetFilters?.[button] || 'all'}
                      onChange={(e) => {
                        const updated = {
                          ...localSettings.buttons.presetFilters,
                          [button]: e.target.value
                        };
                        handleSelectChange('buttons', 'presetFilters', updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="all">All Orders</option>
                      <option value="myOrders">My Orders Only</option>
                      <option value="drinksOnly">Drinks Only</option>
                      <option value="allPending">All Pending</option>
                      <option value="urgent">Urgent Orders</option>
                      <option value="today">Today's Orders</option>
                      <option value="week">This Week</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localSettings.buttons?.prepButtonMode === 'priority' && (
            <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
                Priority Level Configuration:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSettings.buttons?.prepButtons?.map((button, index) => (
                  <div key={button} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff00', minWidth: '40px', fontWeight: 'bold' }}>{button}:</span>
                    <select
                      value={localSettings.buttons.priorityLevels?.[button] || 'normal'}
                      onChange={(e) => {
                        const updated = {
                          ...localSettings.buttons.priorityLevels,
                          [button]: e.target.value
                        };
                        handleSelectChange('buttons', 'priorityLevels', updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="urgent">Urgent (VIP, allergies)</option>
                      <option value="high">High Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="low">Low Priority</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localSettings.buttons?.prepButtonMode === 'staff' && (
            <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
                Staff Assignment Configuration:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSettings.buttons?.prepButtons?.map((button, index) => (
                  <div key={button} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff00', minWidth: '40px', fontWeight: 'bold' }}>{button}:</span>
                    <input
                      type="text"
                      value={localSettings.buttons.staffAssignments?.[button] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...localSettings.buttons.staffAssignments,
                          [button]: e.target.value
                        };
                        handleSelectChange('buttons', 'staffAssignments', updated);
                      }}
                      placeholder="Cook name or station"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#00ff00', opacity: 0.7, marginTop: '8px' }}>
                Assign each button to a cook or station for load balancing
              </div>
            </div>
          )}

          {localSettings.buttons?.prepButtonMode === 'hold' && (
            <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
                Hold Slot Configuration:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSettings.buttons?.prepButtons?.map((button, index) => (
                  <div key={button} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff00', minWidth: '40px', fontWeight: 'bold' }}>{button}:</span>
                    <input
                      type="text"
                      value={localSettings.buttons.holdSlots?.[button] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...localSettings.buttons.holdSlots,
                          [button]: e.target.value
                        };
                        handleSelectChange('buttons', 'holdSlots', updated);
                      }}
                      placeholder="Hold reason (e.g., missing item)"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#00ff00', opacity: 0.7, marginTop: '8px' }}>
                Hold slots for parking tickets while waiting (missing items, customer not seated)
              </div>
            </div>
          )}

          {localSettings.buttons?.prepButtonMode === 'zone' && (
            <div style={{ padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500', marginBottom: '12px' }}>
                Zone Filter Configuration:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSettings.buttons?.prepButtons?.map((button, index) => (
                  <div key={button} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff00', minWidth: '40px', fontWeight: 'bold' }}>{button}:</span>
                    <select
                      value={localSettings.buttons.zoneFilters?.[button] || 'all'}
                      onChange={(e) => {
                        const updated = {
                          ...localSettings.buttons.zoneFilters,
                          [button]: e.target.value
                        };
                        handleSelectChange('buttons', 'zoneFilters', updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#000000',
                        color: '#00ff00',
                        border: '1px solid #00ff00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="all">All Zones</option>
                      <option value="patio">Patio</option>
                      <option value="bar">Bar</option>
                      <option value="dining">Dining Room</option>
                      <option value="takeout">Takeout</option>
                      <option value="delivery">Delivery</option>
                      <option value="driveThru">Drive Thru</option>
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#00ff00', opacity: 0.7, marginTop: '8px' }}>
                Filter orders by where they need to go (location-based filtering)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Settings */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff00', marginBottom: '16px' }}>
          COLUMN DISPLAY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Order Number</span>
            <button
              onClick={() => handleToggle('columns', 'showOrderNumber')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showOrderNumber ? '#00ff00' : '#000000',
                color: localSettings.columns?.showOrderNumber ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showOrderNumber ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Table Number</span>
            <button
              onClick={() => handleToggle('columns', 'showTable')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showTable ? '#00ff00' : '#000000',
                color: localSettings.columns?.showTable ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showTable ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Time</span>
            <button
              onClick={() => handleToggle('columns', 'showTime')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showTime ? '#00ff00' : '#000000',
                color: localSettings.columns?.showTime ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showTime ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Items</span>
            <button
              onClick={() => handleToggle('columns', 'showItems')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showItems ? '#00ff00' : '#000000',
                color: localSettings.columns?.showItems ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showItems ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Status</span>
            <button
              onClick={() => handleToggle('columns', 'showStatus')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showStatus ? '#00ff00' : '#000000',
                color: localSettings.columns?.showStatus ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showStatus ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Prep Time</span>
            <button
              onClick={() => handleToggle('columns', 'showPrepTime')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showPrepTime ? '#00ff00' : '#000000',
                color: localSettings.columns?.showPrepTime ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showPrepTime ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Customer Name</span>
            <button
              onClick={() => handleToggle('columns', 'showCustomer')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showCustomer ? '#00ff00' : '#000000',
                color: localSettings.columns?.showCustomer ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showCustomer ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Notes</span>
            <button
              onClick={() => handleToggle('columns', 'showNotes')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showNotes ? '#00ff00' : '#000000',
                color: localSettings.columns?.showNotes ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showNotes ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Order Age</span>
            <button
              onClick={() => handleToggle('columns', 'showAge')}
              style={{
                padding: '12px 24px',
                background: localSettings.columns?.showAge ? '#00ff00' : '#000000',
                color: localSettings.columns?.showAge ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.columns?.showAge ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Information Settings */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff00', marginBottom: '16px' }}>
          INFORMATION DISPLAY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Average Prep Time</span>
            <button
              onClick={() => handleToggle('information', 'showAveragePrepTime')}
              style={{
                padding: '12px 24px',
                background: localSettings.information?.showAveragePrepTime ? '#00ff00' : '#000000',
                color: localSettings.information?.showAveragePrepTime ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.information?.showAveragePrepTime ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Current Time</span>
            <button
              onClick={() => handleToggle('information', 'showCurrentTime')}
              style={{
                padding: '12px 24px',
                background: localSettings.information?.showCurrentTime ? '#00ff00' : '#000000',
                color: localSettings.information?.showCurrentTime ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.information?.showCurrentTime ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Table Numbers</span>
            <button
              onClick={() => handleToggle('information', 'showTableNumbers')}
              style={{
                padding: '12px 24px',
                background: localSettings.information?.showTableNumbers ? '#00ff00' : '#000000',
                color: localSettings.information?.showTableNumbers ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.information?.showTableNumbers ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#001a00', border: '1px solid #00ff00', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#00ff00', fontWeight: '500' }}>Show Order Counts</span>
            <button
              onClick={() => handleToggle('information', 'showOrderCounts')}
              style={{
                padding: '12px 24px',
                background: localSettings.information?.showOrderCounts ? '#00ff00' : '#000000',
                color: localSettings.information?.showOrderCounts ? '#000000' : '#00ff00',
                border: '2px solid #00ff00',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'all 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {localSettings.information?.showOrderCounts ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={() => {
            const defaults = getDefaultOracleSettings();
            setLocalSettings(defaults);
            onSettingsChange(defaults);
            saveOracleSettings(defaults);
          }}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)',
            color: '#ffffff',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            textShadow: '0 1px 1px rgba(0,0,0,0.3)'
          }}
          onMouseOver={(e) => e.target.style.background = 'linear-gradient(180deg, #ff6666 0%, #ff4444 100%)'}
          onMouseOut={(e) => e.target.style.background = 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)'}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          RESET TO DEFAULTS
        </button>
      </div>
    </div>
  );
}