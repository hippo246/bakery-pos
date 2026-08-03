// Advanced Section
// Expert configuration and developer diagnostics

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import { validateAdvancedConfig } from '../../../utils/cloudSettingsValidation.js';
import { createSecurityAuditLog } from '../../../domain/auditLogModel.js';
import { getCurrentUserId } from '../../../utils/authService.js';
import healthScheduler from '../../../health/HealthScheduler.js';
import healthEngine from '../../../health/HealthEngine.js';
import { HealthCheckIntervals } from '../../../health/HealthTypes.js';
import diagnosticsEngine from '../../../diagnostics/DiagnosticsEngine.js';

export default function AdvancedSection({ isMobile }) {
  const [advancedConfig, setAdvancedConfig] = useState({
    cache: {
      enabled: true,
      maxSize: 100, // MB
      ttl: 300 // seconds
    },
    timeouts: {
      connection: 30, // seconds
      upload: 300, // seconds
      download: 300, // seconds
      healthCheck: 10 // seconds
    },
    retry: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1 // seconds
    },
    limits: {
      maxConnections: 10,
      maxUploadSize: 104857600, // 100MB
      maxConcurrentUploads: 3
    },
    developer: {
      debugMode: false,
      verboseLogging: false,
      enableDiagnostics: true
    },
    healthCheck: {
      enabled: true,
      interval: 60, // seconds
      cacheTTL: 30, // seconds
      sensitivity: 'normal' // low, normal, high
    },
    diagnostics: {
      enabled: true,
      predictionSensitivity: 'normal', // low, normal, high
      incidentRetentionDays: 90,
      diagnosticsRetentionDays: 30,
      recommendationBehavior: 'suggest', // suggest, auto, disabled
      enablePredictions: true,
      enableRootCauseAnalysis: true,
      enablePerformanceTracking: true,
      enableTrendAnalysis: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    loadAdvancedConfig();
  }, []);

  const loadAdvancedConfig = () => {
    try {
      const saved = localStorage.getItem('cafeos_advanced_config');
      if (saved) {
        setAdvancedConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load advanced config:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    // Validate before saving
    const validation = validateAdvancedConfig(advancedConfig);
    if (!validation.valid) {
      showMessage('error', validation.error);
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_advanced_config', JSON.stringify(advancedConfig));
      
      // Apply health check settings
      if (advancedConfig.healthCheck) {
        healthEngine.setCacheTTL(advancedConfig.healthCheck.cacheTTL * 1000);
        
        if (advancedConfig.healthCheck.enabled) {
          healthScheduler.start();
          healthScheduler.setDefaultInterval(advancedConfig.healthCheck.interval * 1000);
        } else {
          healthScheduler.stop();
        }
      }
      
      // Apply diagnostics settings
      if (advancedConfig.diagnostics) {
        await diagnosticsEngine.updateConfiguration({
          predictionSensitivity: advancedConfig.diagnostics.predictionSensitivity,
          incidentRetentionDays: advancedConfig.diagnostics.incidentRetentionDays,
          diagnosticsRetentionDays: advancedConfig.diagnostics.diagnosticsRetentionDays,
          recommendationBehavior: advancedConfig.diagnostics.recommendationBehavior,
          enablePredictions: advancedConfig.diagnostics.enablePredictions,
          enableRootCauseAnalysis: advancedConfig.diagnostics.enableRootCauseAnalysis,
          enablePerformanceTracking: advancedConfig.diagnostics.enablePerformanceTracking,
          enableTrendAnalysis: advancedConfig.diagnostics.enableTrendAnalysis
        });
      }
      
      // Audit log
      const userId = getCurrentUserId();
      await createSecurityAuditLog({
        action: 'ADVANCED_CONFIG_UPDATED',
        details: `Advanced configuration updated: cache=${advancedConfig.cache.enabled}, timeouts=${JSON.stringify(advancedConfig.timeouts)}, healthCheck=${JSON.stringify(advancedConfig.healthCheck)}`,
        userId,
        category: 'CLOUD_SETTINGS'
      });
      
      showMessage('success', 'Advanced configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setAdvancedConfig({
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 300
      },
      timeouts: {
        connection: 30,
        upload: 300,
        download: 300,
        healthCheck: 10
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1
      },
      limits: {
        maxConnections: 10,
        maxUploadSize: 104857600,
        maxConcurrentUploads: 3
      },
      developer: {
        debugMode: false,
        verboseLogging: false,
        enableDiagnostics: true
      }
    });
    showMessage('success', 'Configuration reset to defaults');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: message.type === 'error' ? 'var(--cafe-danger-bg)' : 'var(--cafe-success-bg)',
          border: `1px solid ${message.type === 'error' ? 'var(--cafe-danger-border)' : 'var(--cafe-success-border)'}`,
          color: message.type === 'error' ? 'var(--cafe-danger)' : 'var(--cafe-success)',
          fontSize: 13,
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {/* Warning Banner */}
      <div style={{ 
        padding: 16, 
        background: 'var(--cafe-warning-bg)', 
        border: '1px solid var(--cafe-warning-border)', 
        borderRadius: 8 
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-warning)', marginBottom: 4 }}>
          ⚠️ Expert Configuration
        </div>
        <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
          These settings are for advanced users only. Incorrect values may affect system performance and stability.
        </div>
      </div>

      {/* Cache Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Cache Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Cache</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Cache cloud responses locally</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.cache.enabled}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                cache: { ...advancedConfig.cache, enabled: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Cache Size Limit (MB)</label>
            <input
              type="number"
              value={advancedConfig.cache.maxSize}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                cache: { ...advancedConfig.cache, maxSize: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={10}
              max={1000}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Cache TTL (seconds)</label>
            <input
              type="number"
              value={advancedConfig.cache.ttl}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                cache: { ...advancedConfig.cache, ttl: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={60}
              max={3600}
            />
          </div>
        </div>
      </div>

      {/* Timeout Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Timeout Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Connection Timeout (seconds)</label>
            <input
              type="number"
              value={advancedConfig.timeouts.connection}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                timeouts: { ...advancedConfig.timeouts, connection: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={10}
              max={120}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Upload Timeout (seconds)</label>
            <input
              type="number"
              value={advancedConfig.timeouts.upload}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                timeouts: { ...advancedConfig.timeouts, upload: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={60}
              max={600}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Download Timeout (seconds)</label>
            <input
              type="number"
              value={advancedConfig.timeouts.download}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                timeouts: { ...advancedConfig.timeouts, download: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={60}
              max={600}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Health Check Timeout (seconds)</label>
            <input
              type="number"
              value={advancedConfig.timeouts.healthCheck}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                timeouts: { ...advancedConfig.timeouts, healthCheck: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={5}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Retry Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Retry Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Max Retry Attempts</label>
            <input
              type="number"
              value={advancedConfig.retry.maxAttempts}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                retry: { ...advancedConfig.retry, maxAttempts: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={1}
              max={10}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Backoff Multiplier</label>
            <input
              type="number"
              value={advancedConfig.retry.backoffMultiplier}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                retry: { ...advancedConfig.retry, backoffMultiplier: parseFloat(e.target.value) }
              })}
              style={{ ...input }}
              min={1}
              max={5}
              step={0.5}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Initial Delay (seconds)</label>
            <input
              type="number"
              value={advancedConfig.retry.initialDelay}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                retry: { ...advancedConfig.retry, initialDelay: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={1}
              max={10}
            />
          </div>
        </div>
      </div>

      {/* Limits Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Limits Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Max Connections</label>
            <input
              type="number"
              value={advancedConfig.limits.maxConnections}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                limits: { ...advancedConfig.limits, maxConnections: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={1}
              max={50}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Max Upload Size (bytes)</label>
            <input
              type="number"
              value={advancedConfig.limits.maxUploadSize}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                limits: { ...advancedConfig.limits, maxUploadSize: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={1048576}
              max={1073741824}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Max Concurrent Uploads</label>
            <input
              type="number"
              value={advancedConfig.limits.maxConcurrentUploads}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                limits: { ...advancedConfig.limits, maxConcurrentUploads: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={1}
              max={10}
            />
          </div>
        </div>
      </div>

      {/* Developer Diagnostics */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Developer Diagnostics
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Debug Mode</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Enable debug logging</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.developer.debugMode}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                developer: { ...advancedConfig.developer, debugMode: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Verbose Logging</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Enable detailed logging</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.developer.verboseLogging}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                developer: { ...advancedConfig.developer, verboseLogging: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Diagnostics</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Collect diagnostic information</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.developer.enableDiagnostics}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                developer: { ...advancedConfig.developer, enableDiagnostics: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Health Check Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Health Check Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Health Checks</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Enable automatic health monitoring</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.healthCheck.enabled}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                healthCheck: { ...advancedConfig.healthCheck, enabled: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Health Check Interval (seconds)</label>
            <input
              type="number"
              value={advancedConfig.healthCheck.interval}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                healthCheck: { ...advancedConfig.healthCheck, interval: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={30}
              max={900}
            />
            <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
              Recommended: 60 seconds (normal), 30 seconds (fast), 300 seconds (slow)
            </div>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Cache TTL (seconds)</label>
            <input
              type="number"
              value={advancedConfig.healthCheck.cacheTTL}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                healthCheck: { ...advancedConfig.healthCheck, cacheTTL: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={10}
              max={300}
            />
            <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
              How long to cache health check results
            </div>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Monitoring Sensitivity</label>
            <select
              value={advancedConfig.healthCheck.sensitivity}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                healthCheck: { ...advancedConfig.healthCheck, sensitivity: e.target.value }
              })}
              style={{ ...input }}
            >
              <option value="low">Low - Fewer alerts, less noise</option>
              <option value="normal">Normal - Balanced alerting</option>
              <option value="high">High - More alerts, early detection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnostics Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Diagnostics Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Diagnostics</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Enable advanced diagnostics and monitoring</div>
            </div>
            <input
              type="checkbox"
              checked={advancedConfig.diagnostics.enabled}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                diagnostics: { ...advancedConfig.diagnostics, enabled: e.target.checked }
              })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Prediction Sensitivity</label>
            <select
              value={advancedConfig.diagnostics.predictionSensitivity}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                diagnostics: { ...advancedConfig.diagnostics, predictionSensitivity: e.target.value }
              })}
              style={{ ...input }}
            >
              <option value="low">Low - Fewer predictions, less noise</option>
              <option value="normal">Normal - Balanced predictions</option>
              <option value="high">High - More predictions, early detection</option>
            </select>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Incident Retention (days)</label>
            <input
              type="number"
              value={advancedConfig.diagnostics.incidentRetentionDays}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                diagnostics: { ...advancedConfig.diagnostics, incidentRetentionDays: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={7}
              max={365}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Diagnostics Retention (days)</label>
            <input
              type="number"
              value={advancedConfig.diagnostics.diagnosticsRetentionDays}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                diagnostics: { ...advancedConfig.diagnostics, diagnosticsRetentionDays: parseInt(e.target.value) }
              })}
              style={{ ...input }}
              min={7}
              max={90}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Recommendation Behavior</label>
            <select
              value={advancedConfig.diagnostics.recommendationBehavior}
              onChange={(e) => setAdvancedConfig({ 
                ...advancedConfig, 
                diagnostics: { ...advancedConfig.diagnostics, recommendationBehavior: e.target.value }
              })}
              style={{ ...input }}
            >
              <option value="suggest">Suggest - Show recommendations only</option>
              <option value="auto">Auto - Automatically implement safe recommendations</option>
              <option value="disabled">Disabled - No recommendations</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Predictions</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Predictive warnings for potential issues</div>
              </div>
              <input
                type="checkbox"
                checked={advancedConfig.diagnostics.enablePredictions}
                onChange={(e) => setAdvancedConfig({ 
                  ...advancedConfig, 
                  diagnostics: { ...advancedConfig.diagnostics, enablePredictions: e.target.checked }
                })}
                style={{ width: 20, height: 20 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Root Cause Analysis</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Automatic root cause determination</div>
              </div>
              <input
                type="checkbox"
                checked={advancedConfig.diagnostics.enableRootCauseAnalysis}
                onChange={(e) => setAdvancedConfig({ 
                  ...advancedConfig, 
                  diagnostics: { ...advancedConfig.diagnostics, enableRootCauseAnalysis: e.target.checked }
                })}
                style={{ width: 20, height: 20 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Performance Tracking</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Track performance metrics over time</div>
              </div>
              <input
                type="checkbox"
                checked={advancedConfig.diagnostics.enablePerformanceTracking}
                onChange={(e) => setAdvancedConfig({ 
                  ...advancedConfig, 
                  diagnostics: { ...advancedConfig.diagnostics, enablePerformanceTracking: e.target.checked }
                })}
                style={{ width: 20, height: 20 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Trend Analysis</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Analyze trends in health and performance</div>
              </div>
              <input
                type="checkbox"
                checked={advancedConfig.diagnostics.enableTrendAnalysis}
                onChange={(e) => setAdvancedConfig({ 
                  ...advancedConfig, 
                  diagnostics: { ...advancedConfig.diagnostics, enableTrendAnalysis: e.target.checked }
                })}
                style={{ width: 20, height: 20 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px', flex: 1 }}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            onClick={handleResetDefaults}
            style={{ ...btn('ghost'), fontSize: 13, padding: '10px 20px', flex: 1 }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
