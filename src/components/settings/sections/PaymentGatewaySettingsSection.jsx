/**
 * Payment Gateway Settings Section
 * Configure payment gateway credentials and settings
 */

import React, { useState, useCallback, useEffect } from 'react';
import AlertDialog from '../../common/AlertDialog.jsx';
import { getPaymentGatewayFactory, GatewayType } from '../../../payment/PaymentGatewayFactory.js';
import { getPaymentStorage } from '../../../payment/PaymentGateway.js';

export default function PaymentGatewaySettingsSection({ settings, onUpdate, isMobile }) {
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState({
    razorpay: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: ''
    },
    paytm: {
      enabled: false,
      testMode: true,
      merchantId: '',
      apiKey: '',
      apiSecret: ''
    },
    stripe: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: ''
    },
    phonepe: {
      enabled: false,
      testMode: true,
      merchantId: '',
      apiKey: '',
      apiSecret: ''
    },
    cashfree: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: ''
    },
    primaryGateway: GatewayType.PHONEPE,
    backupGateway: GatewayType.RAZORPAY
  });

  const [gatewayStats, setGatewayStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [saving, setSaving] = useState(false);

  const factory = getPaymentGatewayFactory();
  const paymentStorage = getPaymentStorage();

  useEffect(() => {
    loadGatewayConfigs();
    loadGatewayStats();
    loadPaymentStats();
  }, []);

  const loadGatewayConfigs = () => {
    const configs = factory.gatewayConfig.getAllConfigs();
    
    setFormData(prev => ({
      ...prev,
      razorpay: {
        ...prev.razorpay,
        ...configs.razorpay
      },
      paytm: {
        ...prev.paytm,
        ...configs.paytm
      },
      stripe: {
        ...prev.stripe,
        ...configs.stripe
      },
      phonepe: {
        ...prev.phonepe,
        ...configs.phonepe
      },
      cashfree: {
        ...prev.cashfree,
        ...configs.cashfree
      },
      primaryGateway: factory.primaryGateway || GatewayType.PHONEPE,
      backupGateway: factory.backupGateway || GatewayType.RAZORPAY
    }));
  };

  const loadGatewayStats = () => {
    const stats = factory.getGatewayStats();
    setGatewayStats(stats);
  };

  const loadPaymentStats = () => {
    const stats = paymentStorage.getStatistics();
    setPaymentStats(stats);
  };

  const handleChange = useCallback((gateway, field, value) => {
    setFormData(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    
    try {
      // Configure each gateway
      if (formData.razorpay.enabled) {
        factory.configureGateway(GatewayType.RAZORPAY, {
          enabled: true,
          testMode: formData.razorpay.testMode,
          apiKey: formData.razorpay.apiKey,
          apiSecret: formData.razorpay.apiSecret
        });
      }

      if (formData.paytm.enabled) {
        factory.configureGateway(GatewayType.PAYTM, {
          enabled: true,
          testMode: formData.paytm.testMode,
          merchantId: formData.paytm.merchantId,
          apiKey: formData.paytm.apiKey,
          apiSecret: formData.paytm.apiSecret
        });
      }

      if (formData.stripe.enabled) {
        factory.configureGateway(GatewayType.STRIPE, {
          enabled: true,
          testMode: formData.stripe.testMode,
          apiKey: formData.stripe.apiKey,
          apiSecret: formData.stripe.apiSecret
        });
      }

      if (formData.phonepe.enabled) {
        factory.configureGateway(GatewayType.PHONEPE, {
          enabled: true,
          testMode: formData.phonepe.testMode,
          merchantId: formData.phonepe.merchantId,
          apiKey: formData.phonepe.apiKey,
          apiSecret: formData.phonepe.apiSecret
        });
      }

      if (formData.cashfree.enabled) {
        factory.configureGateway(GatewayType.CASHFREE, {
          enabled: true,
          testMode: formData.cashfree.testMode,
          apiKey: formData.cashfree.apiKey,
          apiSecret: formData.cashfree.apiSecret
        });
      }

      // Set primary and backup gateways
      factory.setPrimaryGateway(formData.primaryGateway);
      factory.setBackupGateway(formData.backupGateway);

      // Reload configs and stats
      loadGatewayConfigs();
      loadGatewayStats();
      
      setAlertDialog({ isOpen: true, title: 'Settings Saved', message: 'Payment gateway settings saved successfully', type: 'success' });
    } catch (error) {
      console.error('[PaymentGatewaySettings] Failed to save:', error);
      setAlertDialog({ isOpen: true, title: 'Save Failed', message: 'Failed to save settings: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleResetStats = () => {
    factory.resetFailureStats();
    loadGatewayStats();
    setAlertDialog({ isOpen: true, title: 'Statistics Reset', message: 'Gateway statistics reset', type: 'info' });
  };

  const handleTestConnection = async (gatewayType) => {
    try {
      const gateway = factory.createGateway(gatewayType, formData[gatewayType]);
      const result = await gateway.initialize();
      
      if (result.success) {
        setAlertDialog({ isOpen: true, title: 'Connection Successful', message: `${gatewayType} connection successful!`, type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Connection Failed', message: `${gatewayType} connection failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Connection Test Failed', message: `Connection test failed: ${error.message}`, type: 'error' });
    }
  };

  const sectionStyle = { marginBottom: 28 };
  const sectionTitleStyle = { fontSize: 12, fontWeight: 700, color: 'var(--cafe-text-secondary)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const cardStyle = { background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 16, padding: 24 };
  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid var(--cafe-border-light)', borderRadius: 12, background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', outline: 'none', transition: 'all 0.2s', marginBottom: 12 };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 8, display: 'block' };
  const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px', background: 'var(--cafe-bg-surface)', borderRadius: 12, border: '1px solid var(--cafe-border-light)', marginBottom: 12 };
  const buttonStyle = { padding: '12px 24px', background: 'var(--cafe-accent)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', cursor: 'pointer', marginRight: 8 };
  const secondaryButtonStyle = { padding: '12px 24px', background: 'var(--cafe-bg-surface)', border: '1px solid var(--cafe-border-light)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-secondary)', cursor: 'pointer', marginRight: 8 };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: isMobile ? '20px' : '28px', borderBottom: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)' }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: 'var(--cafe-text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Payment Gateways</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--cafe-text-secondary)', margin: 0, fontWeight: 500 }}>Configure payment gateway credentials and settings</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '28px' }}>
        {/* Razorpay */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Razorpay</div>
          <div style={cardStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.razorpay.enabled}
                onChange={(e) => handleChange('razorpay', 'enabled', e.target.checked)}
                style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Razorpay</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Best for India - UPI, Cards, Wallets, EMI</div>
              </div>
            </label>

            {formData.razorpay.enabled && (
              <>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.razorpay.testMode}
                    onChange={(e) => handleChange('razorpay', 'testMode', e.target.checked)}
                    style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>API Key</label>
                  <input
                    type="password"
                    value={formData.razorpay.apiKey}
                    onChange={(e) => handleChange('razorpay', 'apiKey', e.target.value)}
                    placeholder="rzp_test_..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Secret</label>
                  <input
                    type="password"
                    value={formData.razorpay.apiSecret}
                    onChange={(e) => handleChange('razorpay', 'apiSecret', e.target.value)}
                    placeholder="Enter API secret"
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={() => handleTestConnection(GatewayType.RAZORPAY)}
                  style={secondaryButtonStyle}
                >
                  Test Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Paytm */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Paytm</div>
          <div style={cardStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.paytm.enabled}
                onChange={(e) => handleChange('paytm', 'enabled', e.target.checked)}
                style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Paytm</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Wallet + UPI support</div>
              </div>
            </label>

            {formData.paytm.enabled && (
              <>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.paytm.testMode}
                    onChange={(e) => handleChange('paytm', 'testMode', e.target.checked)}
                    style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>Merchant ID</label>
                  <input
                    type="text"
                    value={formData.paytm.merchantId}
                    onChange={(e) => handleChange('paytm', 'merchantId', e.target.value)}
                    placeholder="Enter merchant ID"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Key</label>
                  <input
                    type="password"
                    value={formData.paytm.apiKey}
                    onChange={(e) => handleChange('paytm', 'apiKey', e.target.value)}
                    placeholder="Enter API key"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Secret</label>
                  <input
                    type="password"
                    value={formData.paytm.apiSecret}
                    onChange={(e) => handleChange('paytm', 'apiSecret', e.target.value)}
                    placeholder="Enter API secret"
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={() => handleTestConnection(GatewayType.PAYTM)}
                  style={secondaryButtonStyle}
                >
                  Test Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stripe */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Stripe</div>
          <div style={cardStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.stripe.enabled}
                onChange={(e) => handleChange('stripe', 'enabled', e.target.checked)}
                style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Stripe</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>International payments support</div>
              </div>
            </label>

            {formData.stripe.enabled && (
              <>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.stripe.testMode}
                    onChange={(e) => handleChange('stripe', 'testMode', e.target.checked)}
                    style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use test keys for development</div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>Publishable Key</label>
                  <input
                    type="password"
                    value={formData.stripe.apiKey}
                    onChange={(e) => handleChange('stripe', 'apiKey', e.target.value)}
                    placeholder="pk_test_..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secret Key</label>
                  <input
                    type="password"
                    value={formData.stripe.apiSecret}
                    onChange={(e) => handleChange('stripe', 'apiSecret', e.target.value)}
                    placeholder="sk_test_..."
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={() => handleTestConnection(GatewayType.STRIPE)}
                  style={secondaryButtonStyle}
                >
                  Test Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* PhonePe */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>PhonePe</div>
          <div style={cardStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.phonepe.enabled}
                onChange={(e) => handleChange('phonepe', 'enabled', e.target.checked)}
                style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable PhonePe</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Highest UPI success rate (60%+ market share)</div>
              </div>
            </label>

            {formData.phonepe.enabled && (
              <>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.phonepe.testMode}
                    onChange={(e) => handleChange('phonepe', 'testMode', e.target.checked)}
                    style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>Merchant ID</label>
                  <input
                    type="text"
                    value={formData.phonepe.merchantId}
                    onChange={(e) => handleChange('phonepe', 'merchantId', e.target.value)}
                    placeholder="Enter merchant ID"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Key</label>
                  <input
                    type="password"
                    value={formData.phonepe.apiKey}
                    onChange={(e) => handleChange('phonepe', 'apiKey', e.target.value)}
                    placeholder="Enter API key"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Secret</label>
                  <input
                    type="password"
                    value={formData.phonepe.apiSecret}
                    onChange={(e) => handleChange('phonepe', 'apiSecret', e.target.value)}
                    placeholder="Enter API secret"
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={() => handleTestConnection(GatewayType.PHONEPE)}
                  style={secondaryButtonStyle}
                >
                  Test Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cashfree */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Cashfree</div>
          <div style={cardStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.cashfree.enabled}
                onChange={(e) => handleChange('cashfree', 'enabled', e.target.checked)}
                style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Enable Cashfree</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Lower fees, good for recurring payments</div>
              </div>
            </label>

            {formData.cashfree.enabled && (
              <>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.cashfree.testMode}
                    onChange={(e) => handleChange('cashfree', 'testMode', e.target.checked)}
                    style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Test Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Use sandbox environment for testing</div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>API Key</label>
                  <input
                    type="password"
                    value={formData.cashfree.apiKey}
                    onChange={(e) => handleChange('cashfree', 'apiKey', e.target.value)}
                    placeholder="Enter API key"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Secret</label>
                  <input
                    type="password"
                    value={formData.cashfree.apiSecret}
                    onChange={(e) => handleChange('cashfree', 'apiSecret', e.target.value)}
                    placeholder="Enter API secret"
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={() => handleTestConnection(GatewayType.CASHFREE)}
                  style={secondaryButtonStyle}
                >
                  Test Connection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Gateway Selection */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Gateway Selection</div>
          <div style={cardStyle}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Primary Gateway</label>
              <select
                value={formData.primaryGateway}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryGateway: e.target.value }))}
                style={inputStyle}
              >
                <option value={GatewayType.PHONEPE}>PhonePe (UPI - Recommended)</option>
                <option value={GatewayType.RAZORPAY}>Razorpay</option>
                <option value={GatewayType.PAYTM}>Paytm</option>
                <option value={GatewayType.STRIPE}>Stripe</option>
                <option value={GatewayType.CASHFREE}>Cashfree</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Backup Gateway</label>
              <select
                value={formData.backupGateway}
                onChange={(e) => setFormData(prev => ({ ...prev, backupGateway: e.target.value }))}
                style={inputStyle}
              >
                <option value="">None</option>
                <option value={GatewayType.PHONEPE}>PhonePe</option>
                <option value={GatewayType.RAZORPAY}>Razorpay</option>
                <option value={GatewayType.PAYTM}>Paytm</option>
                <option value={GatewayType.STRIPE}>Stripe</option>
                <option value={GatewayType.CASHFREE}>Cashfree</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {gatewayStats && Object.keys(gatewayStats).length > 0 && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Gateway Statistics</div>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                {Object.entries(gatewayStats).map(([gateway, stats]) => (
                  <div key={gateway} style={{ padding: '12px', background: 'var(--cafe-bg-surface)', borderRadius: 12, border: '1px solid var(--cafe-border-light)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 8 }}>{gateway}</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                      Success: {stats.success} | Failed: {stats.failure}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                      Failure Rate: {(stats.failureRate * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleResetStats}
                style={secondaryButtonStyle}
                style={{ marginTop: 12 }}
              >
                Reset Statistics
              </button>
            </div>
          </div>
        )}

        {/* Payment Statistics */}
        {paymentStats && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Payment Statistics</div>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ padding: '12px', background: 'var(--cafe-bg-surface)', borderRadius: 12, border: '1px solid var(--cafe-border-light)' }}>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 4 }}>Total Payments</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>{paymentStats.total}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--cafe-bg-surface)', borderRadius: 12, border: '1px solid var(--cafe-border-light)' }}>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 4 }}>Completed Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2ECC71' }}>₹{paymentStats.completedAmount?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? '20px' : '28px', borderTop: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            background: saving ? '#444' : 'var(--cafe-accent-bg)',
            border: '1px solid var(--cafe-accent)',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--cafe-accent)',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

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
