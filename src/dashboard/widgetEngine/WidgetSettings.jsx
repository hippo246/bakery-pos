/**
 * Widget Settings
 * Modal for configuring widget settings
 */

import React, { useState, memo } from 'react';
import widgetRegistry from './WidgetTypes.js';

function WidgetSettings({ instance, widgetDef, onClose, onSave }) {
  const [settings, setSettings] = useState(instance.settings || {});

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(instance.id, settings);
    }
    onClose();
  };

  const handleReset = () => {
    setSettings({});
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--cafe-bg-card)',
        border: '1px solid var(--cafe-border)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 500,
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{widgetDef.icon}</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-primary)', margin: 0 }}>
                {widgetDef.name} Settings
              </h2>
              <p style={{ fontSize: 13, color: 'var(--cafe-text-secondary)', margin: '4px 0 0' }}>
                Configure widget behavior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--cafe-text-secondary)',
              borderRadius: 8
            }}
          >
            ✕
          </button>
        </div>

        {/* Settings Form */}
        <div style={{ marginBottom: 20 }}>
          {/* Refresh Interval */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 500, 
              color: 'var(--cafe-text-primary)',
              marginBottom: 8
            }}>
              Refresh Interval
            </label>
            <select
              value={settings.refreshInterval || widgetDef.defaultRefreshInterval}
              onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--cafe-bg-surface)',
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--cafe-text-primary)',
                outline: 'none'
              }}
            >
              <option value={0}>Never</option>
              <option value={60000}>1 minute</option>
              <option value={30000}>30 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={5000}>5 seconds</option>
            </select>
          </div>

          {/* Display Mode */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 500, 
              color: 'var(--cafe-text-primary)',
              marginBottom: 8
            }}>
              Display Mode
            </label>
            <select
              value={settings.displayMode || 'normal'}
              onChange={(e) => handleChange('displayMode', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--cafe-bg-surface)',
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--cafe-text-primary)',
                outline: 'none'
              }}
            >
              <option value="normal">Normal</option>
              <option value="compact">Compact</option>
              <option value="expanded">Expanded</option>
            </select>
          </div>

          {/* Show Alerts */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              fontSize: 13, 
              fontWeight: 500, 
              color: 'var(--cafe-text-primary)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.showAlerts !== false}
                onChange={(e) => handleChange('showAlerts', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show Alerts
            </label>
            <p style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 4, marginLeft: 20 }}>
              Display alert notifications for this widget
            </p>
          </div>

          {/* Alert Threshold */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 500, 
              color: 'var(--cafe-text-primary)',
              marginBottom: 8
            }}>
              Alert Threshold
            </label>
            <input
              type="number"
              value={settings.alertThreshold || ''}
              onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value) || 0)}
              placeholder="Enter threshold value"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--cafe-bg-surface)',
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--cafe-text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--cafe-text-secondary)',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--cafe-bg-surface)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--cafe-text-secondary)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: 'var(--cafe-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(WidgetSettings);
