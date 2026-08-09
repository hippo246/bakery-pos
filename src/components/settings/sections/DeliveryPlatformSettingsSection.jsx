/**
 * Delivery Platform Settings Section
 * Configure Zomato and Swiggy delivery platform credentials and settings
 */

import React, { useState, useCallback, useEffect } from 'react';
import AlertDialog from '../../common/AlertDialog.jsx';
import { getDeliveryPlatformFactory, PlatformType } from '../../../delivery/DeliveryPlatformFactory.js';
import { getDeliveryOrderStorage } from '../../../delivery/DeliveryPlatformAdapter.js';
import { getWebhookHandler } from '../../../delivery/WebhookHandler.js';

export default function DeliveryPlatformSettingsSection({ settings, onUpdate, isMobile }) {
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState({
    zomato: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: '',
      webhookSecret: '',
      restaurantId: '',
      partnerId: '',
      commissionRate: 0.20
    },
    swiggy: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: '',
      webhookSecret: '',
      restaurantId: '',
      partnerId: '',
      storeId: '',
      commissionRate: 0.22
    }
  });

  const [platformStats, setPlatformStats] = useState(null);
  const [deliveryStats, setDeliveryStats] = useState(null);
  const [webhookStats, setWebhookStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);

  const factory = getDeliveryPlatformFactory();
  const storage = getDeliveryOrderStorage();
  const webhookHandler = getWebhookHandler();

  useEffect(() => {
    loadPlatformConfigs();
    loadPlatformStats();
    loadDeliveryStats();
    loadWebhookStats();
  }, []);

  const loadPlatformConfigs = () => {
    const configs = factory.platformConfig.getAllConfigs();
    
    setFormData(prev => ({
      ...prev,
      zomato: {
        ...prev.zomato,
        ...configs.zomato
      },
      swiggy: {
        ...prev.swiggy,
        ...configs.swiggy
      }
    }));
  };

  const loadPlatformStats = () => {
    const stats = factory.getPlatformStatistics();
    setPlatformStats(stats);
  };

  const loadDeliveryStats = () => {
    const stats = storage.getStatistics();
    setDeliveryStats(stats);
  };

  const loadWebhookStats = () => {
    const stats = webhookHandler.getWebhookStatistics();
    setWebhookStats(stats);
  };

  const handleChange = useCallback((platform, field, value) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    
    try {
      // Configure Zomato
      if (formData.zomato.enabled) {
        await factory.configurePlatform(PlatformType.ZOMATO, {
          enabled: true,
          testMode: formData.zomato.testMode,
          apiKey: formData.zomato.apiKey,
          apiSecret: formData.zomato.apiSecret,
          webhookSecret: formData.zomato.webhookSecret,
          restaurantId: formData.zomato.restaurantId,
          partnerId: formData.zomato.partnerId,
          commissionRate: formData.zomato.commissionRate
        });
      } else {
        factory.disablePlatform(PlatformType.ZOMATO);
      }

      // Configure Swiggy
      if (formData.swiggy.enabled) {
        await factory.configurePlatform(PlatformType.SWIGGY, {
          enabled: true,
          testMode: formData.swiggy.testMode,
          apiKey: formData.swiggy.apiKey,
          apiSecret: formData.swiggy.apiSecret,
          webhookSecret: formData.swiggy.webhookSecret,
          restaurantId: formData.swiggy.restaurantId,
          partnerId: formData.swiggy.partnerId,
          storeId: formData.swiggy.storeId,
          commissionRate: formData.swiggy.commissionRate
        });
      } else {
        factory.disablePlatform(PlatformType.SWIGGY);
      }

      // Reload configs and stats
      loadPlatformConfigs();
      loadPlatformStats();
      
      setAlertDialog({ isOpen: true, title: 'Settings Saved', message: 'Delivery platform settings saved successfully', type: 'success' });
    } catch (error) {
      console.error('[DeliveryPlatformSettings] Failed to save:', error);
      setAlertDialog({ isOpen: true, title: 'Save Failed', message: 'Failed to save settings: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleTestConnection = useCallback(async (platform) => {
    setTesting(platform);
    
    try {
      const result = await webhookHandler.testWebhookConnection(platform);
      
      if (result.success) {
        setAlertDialog({ isOpen: true, title: 'Connection Successful', message: `${platform} webhook connection test successful`, type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Connection Failed', message: `${platform} webhook connection test failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Connection Test Failed', message: `Connection test failed: ${error.message}`, type: 'error' });
    } finally {
      setTesting(null);
    }
  }, []);

  const handleGetWebhookInstructions = useCallback((platform) => {
    const instructions = webhookHandler.getWebhookSetupInstructions(platform);
    
    if (instructions) {
      setAlertDialog({ isOpen: true, title: 'Webhook Setup', message: `Webhook Setup for ${instructions.platform}:\n\nEndpoint: ${instructions.endpoint}\nSecret: ${instructions.secret}\nEvents: ${instructions.events.join(', ')}\n\nSetup Steps:\n${instructions.setupSteps.join('\n')}`, type: 'info' });
    }
  }, []);

  // Styles
  const sectionStyle = {
    marginBottom: '24px'
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--cafe-text-primary)',
    marginBottom: '12px'
  };

  const cardStyle = {
    backgroundColor: 'var(--cafe-surface-secondary)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid var(--cafe-border)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--cafe-text-secondary)',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--cafe-border)',
    backgroundColor: 'var(--cafe-surface-primary)',
    color: 'var(--cafe-text-primary)',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '12px',
    cursor: 'pointer'
  };

  const primaryButtonStyle = {
    backgroundColor: 'var(--cafe-accent)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px'
  };

  const secondaryButtonStyle = {
    backgroundColor: 'var(--cafe-surface-tertiary)',
    color: 'var(--cafe-text-primary)',
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid var(--cafe-border)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '8px'
  };

  const statCardStyle = {
    backgroundColor: 'var(--cafe-surface-tertiary)',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px'
  };

  const statLabelStyle = {
    fontSize: '12px',
    color: 'var(--cafe-text-tertiary)',
    marginBottom: '4px'
  };

  const statValueStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--cafe-text-primary)'
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '0' }}>
      {/* Zomato */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Zomato</div>
        <div style={cardStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={formData.zomato.enabled}
              onChange={(e) => handleChange('zomato', 'enabled', e.target.checked)}
              style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Zomato Integration</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Receive orders from Zomato platform</div>
            </div>
          </label>

          {formData.zomato.enabled && (
            <>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={formData.zomato.testMode}
                  onChange={(e) => handleChange('zomato', 'testMode', e.target.checked)}
                  style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                </div>
              </label>

              <div>
                <label style={labelStyle}>Restaurant ID</label>
                <input
                  type="text"
                  value={formData.zomato.restaurantId}
                  onChange={(e) => handleChange('zomato', 'restaurantId', e.target.value)}
                  placeholder="Enter Zomato Restaurant ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Partner ID</label>
                <input
                  type="text"
                  value={formData.zomato.partnerId}
                  onChange={(e) => handleChange('zomato', 'partnerId', e.target.value)}
                  placeholder="Enter Zomato Partner ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>API Key</label>
                <input
                  type="password"
                  value={formData.zomato.apiKey}
                  onChange={(e) => handleChange('zomato', 'apiKey', e.target.value)}
                  placeholder="Enter API key"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>API Secret</label>
                <input
                  type="password"
                  value={formData.zomato.apiSecret}
                  onChange={(e) => handleChange('zomato', 'apiSecret', e.target.value)}
                  placeholder="Enter API secret"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Webhook Secret</label>
                <input
                  type="password"
                  value={formData.zomato.webhookSecret}
                  onChange={(e) => handleChange('zomato', 'webhookSecret', e.target.value)}
                  placeholder="Enter webhook secret"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Commission Rate (%)</label>
                <input
                  type="number"
                  value={formData.zomato.commissionRate * 100}
                  onChange={(e) => handleChange('zomato', 'commissionRate', e.target.value / 100)}
                  placeholder="20"
                  min="0"
                  max="100"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={() => handleTestConnection(PlatformType.ZOMATO)}
                disabled={testing === PlatformType.ZOMATO}
                style={secondaryButtonStyle}
              >
                {testing === PlatformType.ZOMATO ? 'Testing...' : 'Test Webhook Connection'}
              </button>

              <button
                onClick={() => handleGetWebhookInstructions(PlatformType.ZOMATO)}
                style={secondaryButtonStyle}
              >
                Get Webhook Setup Instructions
              </button>
            </>
          )}
        </div>
      </div>

      {/* Swiggy */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Swiggy</div>
        <div style={cardStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={formData.swiggy.enabled}
              onChange={(e) => handleChange('swiggy', 'enabled', e.target.checked)}
              style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Swiggy Integration</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Receive orders from Swiggy platform</div>
            </div>
          </label>

          {formData.swiggy.enabled && (
            <>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={formData.swiggy.testMode}
                  onChange={(e) => handleChange('swiggy', 'testMode', e.target.checked)}
                  style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                </div>
              </label>

              <div>
                <label style={labelStyle}>Restaurant ID</label>
                <input
                  type="text"
                  value={formData.swiggy.restaurantId}
                  onChange={(e) => handleChange('swiggy', 'restaurantId', e.target.value)}
                  placeholder="Enter Swiggy Restaurant ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Partner ID</label>
                <input
                  type="text"
                  value={formData.swiggy.partnerId}
                  onChange={(e) => handleChange('swiggy', 'partnerId', e.target.value)}
                  placeholder="Enter Swiggy Partner ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Store ID</label>
                <input
                  type="text"
                  value={formData.swiggy.storeId}
                  onChange={(e) => handleChange('swiggy', 'storeId', e.target.value)}
                  placeholder="Enter Swiggy Store ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>API Key</label>
                <input
                  type="password"
                  value={formData.swiggy.apiKey}
                  onChange={(e) => handleChange('swiggy', 'apiKey', e.target.value)}
                  placeholder="Enter API key"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>API Secret</label>
                <input
                  type="password"
                  value={formData.swiggy.apiSecret}
                  onChange={(e) => handleChange('swiggy', 'apiSecret', e.target.value)}
                  placeholder="Enter API secret"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Webhook Secret</label>
                <input
                  type="password"
                  value={formData.swiggy.webhookSecret}
                  onChange={(e) => handleChange('swiggy', 'webhookSecret', e.target.value)}
                  placeholder="Enter webhook secret"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Commission Rate (%)</label>
                <input
                  type="number"
                  value={formData.swiggy.commissionRate * 100}
                  onChange={(e) => handleChange('swiggy', 'commissionRate', e.target.value / 100)}
                  placeholder="22"
                  min="0"
                  max="100"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={() => handleTestConnection(PlatformType.SWIGGY)}
                disabled={testing === PlatformType.SWIGGY}
                style={secondaryButtonStyle}
              >
                {testing === PlatformType.SWIGGY ? 'Testing...' : 'Test Webhook Connection'}
              </button>

              <button
                onClick={() => handleGetWebhookInstructions(PlatformType.SWIGGY)}
                style={secondaryButtonStyle}
              >
                Get Webhook Setup Instructions
              </button>
            </>
          )}
        </div>
      </div>

      {/* Platform Statistics */}
      {platformStats && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Platform Statistics</div>
          <div style={cardStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Zomato Status</div>
              <div style={statValueStyle}>
                {platformStats.zomato?.enabled ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Swiggy Status</div>
              <div style={statValueStyle}>
                {platformStats.swiggy?.enabled ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Order Statistics */}
      {deliveryStats && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Delivery Order Statistics</div>
          <div style={cardStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Orders</div>
              <div style={statValueStyle}>{deliveryStats.total}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Revenue</div>
              <div style={statValueStyle}>₹{deliveryStats.totalRevenue.toFixed(2)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Commission</div>
              <div style={statValueStyle}>₹{deliveryStats.totalCommission.toFixed(2)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Net Revenue</div>
              <div style={statValueStyle}>₹{deliveryStats.netRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Statistics */}
      {webhookStats && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Webhook Statistics</div>
          <div style={cardStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Webhooks</div>
              <div style={statValueStyle}>{webhookStats.total}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Success Rate</div>
              <div style={statValueStyle}>
                {webhookStats.total > 0 
                  ? ((webhookStats.byStatus.success / webhookStats.total) * 100).toFixed(1) + '%'
                  : '0%'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={primaryButtonStyle}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
