/**
 * BI Configuration Component
 * Allows owners to configure operational thresholds and business intelligence settings
 */

import React, { useState, useEffect, memo } from 'react';
import businessIntelligenceEngine from './BusinessIntelligenceEngine.js';

function BIConfiguration({ onClose }) {
  const [config, setConfig] = useState(businessIntelligenceEngine.getConfiguration());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(businessIntelligenceEngine.getConfiguration());
  }, []);

  const handleSave = () => {
    businessIntelligenceEngine.updateConfiguration(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaultConfig = businessIntelligenceEngine.getDefaultConfig();
    setConfig(defaultConfig);
  };

  const handleChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
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
        maxWidth: 700,
        width: '90%',
        maxHeight: '85vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              Business Intelligence Configuration
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
              Configure operational thresholds and analytics settings
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'var(--cafe-bg-surface)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--cafe-text-secondary)'
            }}
          >
            Close
          </button>
        </div>

        {/* Kitchen Thresholds */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Kitchen Thresholds
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Max Queue Size
              </label>
              <input
                type="number"
                value={config.kitchen.maxQueueSize}
                onChange={(e) => handleChange('kitchen', 'maxQueueSize', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Target Prep Time (min)
              </label>
              <input
                type="number"
                value={config.kitchen.targetPrepTime}
                onChange={(e) => handleChange('kitchen', 'targetPrepTime', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Critical Prep Time (min)
              </label>
              <input
                type="number"
                value={config.kitchen.criticalPrepTime}
                onChange={(e) => handleChange('kitchen', 'criticalPrepTime', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Station Utilization Warning (%)
              </label>
              <input
                type="number"
                value={config.kitchen.stationUtilizationWarning}
                onChange={(e) => handleChange('kitchen', 'stationUtilizationWarning', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Thresholds */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Table Thresholds
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Target Occupancy Time (min)
              </label>
              <input
                type="number"
                value={config.tables.targetOccupancyTime}
                onChange={(e) => handleChange('tables', 'targetOccupancyTime', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Overstayed Threshold (min)
              </label>
              <input
                type="number"
                value={config.tables.overstayedThreshold}
                onChange={(e) => handleChange('tables', 'overstayedThreshold', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Inventory Thresholds */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Inventory Thresholds
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Critical Level (units)
              </label>
              <input
                type="number"
                value={config.inventory.criticalLevel}
                onChange={(e) => handleChange('inventory', 'criticalLevel', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Low Level (units)
              </label>
              <input
                type="number"
                value={config.inventory.lowLevel}
                onChange={(e) => handleChange('inventory', 'lowLevel', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Reorder Level (units)
              </label>
              <input
                type="number"
                value={config.inventory.reorderLevel}
                onChange={(e) => handleChange('inventory', 'reorderLevel', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Thresholds */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Payment Thresholds
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Failure Rate Warning (%)
              </label>
              <input
                type="number"
                value={config.payments.failureRateWarning}
                onChange={(e) => handleChange('payments', 'failureRateWarning', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Avg Transaction Time Target (s)
              </label>
              <input
                type="number"
                value={config.payments.avgTransactionTimeTarget}
                onChange={(e) => handleChange('payments', 'avgTransactionTimeTarget', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Targets */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Revenue Targets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Daily Target (₹)
              </label>
              <input
                type="number"
                value={config.revenue.dailyTarget}
                onChange={(e) => handleChange('revenue', 'dailyTarget', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Growth Target (%)
              </label>
              <input
                type="number"
                value={config.revenue.growthTarget}
                onChange={(e) => handleChange('revenue', 'growthTarget', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Recommendations Settings */}
        <div style={{ 
          padding: 16, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
            Recommendations Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={config.recommendations.enabled}
                  onChange={(e) => handleChange('recommendations', 'enabled', e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Enable Recommendations
              </label>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Sensitivity
              </label>
              <select
                value={config.recommendations.sensitivity}
                onChange={(e) => handleChange('recommendations', 'sensitivity', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', display: 'block', marginBottom: 4 }}>
                Max Recommendations
              </label>
              <input
                type="number"
                value={config.recommendations.maxRecommendations}
                onChange={(e) => handleChange('recommendations', 'maxRecommendations', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'var(--cafe-bg-card)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 4,
                  color: 'var(--cafe-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              background: 'var(--cafe-bg-surface)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--cafe-text-secondary)'
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: saved ? 'var(--cafe-success)' : 'var(--cafe-accent)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'white',
              fontWeight: 500
            }}
          >
            {saved ? '✓ Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(BIConfiguration);
