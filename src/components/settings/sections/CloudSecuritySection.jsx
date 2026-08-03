// Cloud Security Section
// Cloud-specific security settings and policies

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import credentialManager from '../../../security/CredentialManager.js';
import { createSecurityAuditLog } from '../../../domain/auditLogModel.js';
import { getCurrentUserId } from '../../../utils/authService.js';

export default function CloudSecuritySection({ isMobile }) {
  const [securityConfig, setSecurityConfig] = useState({
    credentialRotationReminder: 90, // days
    sessionTimeout: 30, // minutes
    ownerVerification: true,
    auditLogging: true,
    encryptionEnabled: true,
    secretVaultStatus: 'secure',
    supportAccess: false,
    cloudAccessRules: {
      ipWhitelist: [],
      allowedRegions: ['*']
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [storedCredentialCount, setStoredCredentialCount] = useState(0);

  useEffect(() => {
    loadSecurityConfig();
    loadStoredCredentialCount();
  }, []);

  const loadStoredCredentialCount = async () => {
    try {
      // listProvidersWithCredentials may be async (the vault's other reads
      // all are); awaiting here is safe even if it turns out to be sync.
      const providers = await credentialManager.listProvidersWithCredentials();
      setStoredCredentialCount(providers?.length || 0);
    } catch (error) {
      console.error('Failed to load stored credential count:', error);
    }
  };

  const loadSecurityConfig = () => {
    try {
      const saved = localStorage.getItem('cafeos_cloud_security_config');
      if (saved) {
        setSecurityConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_cloud_security_config', JSON.stringify(securityConfig));
      
      // Audit log
      const userId = getCurrentUserId();
      await createSecurityAuditLog({
        action: 'CLOUD_SECURITY_CONFIG_UPDATED',
        details: `Cloud security configuration updated: rotation=${securityConfig.credentialRotationReminder} days, verification=${securityConfig.ownerVerification}`,
        userId,
        category: 'CLOUD_SETTINGS'
      });
      
      showMessage('success', 'Security configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
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

      {/* Secret Vault Status */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Secret Vault Status
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Encryption</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-success)' }}>
              AES-GCM 256-bit
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Vault Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-success)' }}>
              Secure
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Stored Credentials</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {storedCredentialCount}
            </div>
          </div>
        </div>
      </div>

      {/* Credential Management */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Credential Management
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Credential Rotation Reminder (days)</label>
            <input
              type="number"
              value={securityConfig.credentialRotationReminder}
              onChange={(e) => setSecurityConfig({ ...securityConfig, credentialRotationReminder: parseInt(e.target.value) })}
              style={{ ...input }}
              min={30}
              max={365}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Owner Verification</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Require owner verification for credential operations</div>
            </div>
            <input
              type="checkbox"
              checked={securityConfig.ownerVerification}
              onChange={(e) => setSecurityConfig({ ...securityConfig, ownerVerification: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Session Security */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Session Security
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Session Timeout (minutes)</label>
            <input
              type="number"
              value={securityConfig.sessionTimeout}
              onChange={(e) => setSecurityConfig({ ...securityConfig, sessionTimeout: parseInt(e.target.value) })}
              style={{ ...input }}
              min={5}
              max={120}
            />
          </div>
        </div>
      </div>

      {/* Audit Logging */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Audit Logging
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Audit Logging</div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Log all credential and cloud operations</div>
          </div>
          <input
            type="checkbox"
            checked={securityConfig.auditLogging}
            onChange={(e) => setSecurityConfig({ ...securityConfig, auditLogging: e.target.checked })}
            style={{ width: 20, height: 20 }}
          />
        </div>
      </div>

      {/* Encryption Status */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Encryption Status
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Encryption Enabled</div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>All credentials are encrypted at rest</div>
          </div>
          <input
            type="checkbox"
            checked={securityConfig.encryptionEnabled}
            onChange={(e) => setSecurityConfig({ ...securityConfig, encryptionEnabled: e.target.checked })}
            style={{ width: 20, height: 20 }}
            disabled
          />
        </div>
      </div>

      {/* Support Access */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Support Access
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Allow Support Access</div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Grant temporary access to support team</div>
          </div>
          <input
            type="checkbox"
            checked={securityConfig.supportAccess}
            onChange={(e) => setSecurityConfig({ ...securityConfig, supportAccess: e.target.checked })}
            style={{ width: 20, height: 20 }}
          />
        </div>
      </div>

      {/* Save Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <button
          onClick={handleSaveConfig}
          disabled={isLoading}
          style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px' }}
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
