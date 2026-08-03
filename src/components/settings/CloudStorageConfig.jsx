import React from 'react';
// Cloud Storage Configuration Component
// Configure and manage cloud storage providers for CafeOS
// Now integrated with Secret Vault for secure credential storage

import { useState, useCallback, useEffect } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import storageEngine from "../../cloud/StorageEngine.js";
import credentialManager from "../../security/CredentialManager.js";
import CredentialInput from "../security/CredentialInput.jsx";
import { createSecurityAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";

// Animation keyframes
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const scaleIn = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
`;

export default function CloudStorageConfig({ settings, setSettings, isMobile }) {
  const [activeProvider, setActiveProvider] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [message, setMessage] = useState({ type: null, text: "" });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [providersInfo, setProvidersInfo] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(isMobile || window.innerWidth < 768);

  useEffect(() => {
    // Handle resize for mobile responsiveness
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialize storage engine
    storageEngine.initialize();
    
    // Load providers info
    const providers = storageEngine.getProvidersInfo();
    setProvidersInfo(providers);
    
    // Load active provider
    const activeInfo = storageEngine.getActiveProviderInfo();
    setActiveProvider(activeInfo?.id || null);
    
    // Load health status for all providers
    loadHealthStatus(providers);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadHealthStatus = async (providerList) => {
    const list = providerList || providersInfo;
    const status = {};
    for (const provider of list) {
      const health = await storageEngine.getProviderHealth(provider.id);
      status[provider.id] = health;
    }
    setHealthStatus(status);
  };

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: "" }), 5000);
  }, []);

  const handleProviderSelect = useCallback(async (providerId) => {
    setSelectedProvider(providerId);
    
    // Load credentials from CredentialManager (masked by default)
    const userId = getCurrentUserId();
    const loadedCredentials = await credentialManager.retrieveCredentials(providerId, false, userId);
    
    if (loadedCredentials.success) {
      setCredentials(loadedCredentials.masked);
    } else {
      setCredentials({});
    }
  }, [providersInfo]);

  const handleCredentialChange = useCallback((field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveCredentials = useCallback(async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    const result = await storageEngine.configureProvider(selectedProvider, credentials, userId);
    
    setIsLoading(false);
    
    if (result.success) {
      showMessage("success", "Provider configured successfully");
      
      // Reload providers info
      const providers = storageEngine.getProvidersInfo();
      setProvidersInfo(providers);
      
      // Reload health status
      await loadHealthStatus();
      
      // Audit log
      const auditLog = await createSecurityAuditLog({
        userId,
        details: {
          action: 'CLOUD_CREDENTIALS_SAVED',
          provider: selectedProvider,
          timestamp: new Date().toISOString()
        }
      });
      console.log('[CloudStorageConfig] Credentials saved:', auditLog);
    } else {
      showMessage("error", result.error || "Failed to configure provider");
    }
  }, [selectedProvider, credentials, showMessage]);

  const handleSetActiveProvider = useCallback(async () => {
    if (!selectedProvider) {
      showMessage("error", "Please select a provider first");
      return;
    }
    
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    const result = await storageEngine.setActiveProvider(selectedProvider, userId);
    
    setIsLoading(false);
    
    if (result.success) {
      setActiveProvider(selectedProvider);
      showMessage("success", "Provider activated successfully");
      
      // Audit log
      const auditLog = await createSecurityAuditLog({
        userId,
        details: {
          action: 'CLOUD_PROVIDER_ACTIVATED',
          provider: selectedProvider,
          timestamp: new Date().toISOString()
        }
      });
      console.log('[CloudStorageConfig] Provider activated:', auditLog);
    } else {
      showMessage("error", result.error || "Failed to activate provider");
    }
  }, [selectedProvider, showMessage]);

  const handleTestConnection = useCallback(async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    
    const result = await storageEngine.testProviderConnection(selectedProvider);
    
    setIsLoading(false);
    
    if (result.success) {
      showMessage("success", "Connection test passed");
      await loadHealthStatus();
    } else {
      showMessage("error", result.error || "Connection test failed");
    }
  }, [selectedProvider, showMessage, loadHealthStatus]);

  const handleDeactivateProvider = useCallback(async () => {
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    const result = await storageEngine.clearActiveProvider(userId);
    
    setIsLoading(false);
    
    if (result.success) {
      setActiveProvider(null);
      showMessage("success", "Provider deactivated successfully");
      
      // Audit log
      const auditLog = await createSecurityAuditLog({
        userId,
        details: {
          action: 'CLOUD_PROVIDER_DEACTIVATED',
          timestamp: new Date().toISOString()
        }
      });
      console.log('[CloudStorageConfig] Provider deactivated:', auditLog);
    } else {
      showMessage("error", result.error || "Failed to deactivate provider");
    }
  }, [showMessage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {message.text && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: message.type === "error" ? "var(--cafe-danger-bg)" : "var(--cafe-success-bg)",
          border: `1px solid ${message.type === "error" ? "var(--cafe-danger-border)" : "var(--cafe-success-border)"}`,
          color: message.type === "error" ? "var(--cafe-danger)" : "var(--cafe-success)",
          fontSize: 13,
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {/* Active Provider Status */}
      <div style={{ ...card, padding: 20, animation: "fadeIn 0.4s ease-out" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
          Active Cloud Provider
        </h3>
        
        {activeProvider ? (
          <div style={{
            padding: 16,
            background: "var(--cafe-success-bg)",
            border: "1px solid var(--cafe-success-border)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "scaleIn 0.3s ease-out 0.1s both"
          }}>
            <span style={{ fontSize: 24 }}>
              {providersInfo.find(p => p.id === activeProvider)?.info?.icon || '☁️'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-success)" }}>
                {providersInfo.find(p => p.id === activeProvider)?.info?.name || 'Unknown Provider'}
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Active and configured
              </div>
            </div>
            <button
              onClick={handleDeactivateProvider}
              disabled={isLoading}
              style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px", background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)", color: "var(--cafe-danger)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              Deactivate
            </button>
          </div>
        ) : (
          <div style={{
            padding: 16,
            background: "var(--cafe-warning-bg)",
            border: "1px solid var(--cafe-warning-border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--cafe-warning)",
            animation: "fadeIn 0.3s ease-out 0.1s both"
          }}>
            No cloud provider is currently active. Configure a provider below to enable cloud storage.
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div style={{ ...card, padding: 20, animation: "fadeIn 0.4s ease-out 0.2s both" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
          Available Cloud Providers
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {providersInfo.map((provider, index) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              disabled={activeProvider && activeProvider !== provider.id}
              style={{
                ...card,
                padding: 16,
                textAlign: "left",
                border: selectedProvider === provider.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                cursor: activeProvider && activeProvider !== provider.id ? "not-allowed" : "pointer",
                opacity: activeProvider && activeProvider !== provider.id ? 0.5 : 1,
                background: selectedProvider === provider.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: `fadeIn 0.3s ease-out ${0.3 + index * 0.05}s both`,
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (!activeProvider || activeProvider === provider.id) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = selectedProvider === provider.id ? "0 8px 16px rgba(139, 69, 19, 0.2)" : "0 4px 12px rgba(0, 0, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onFocus={(e) => {
                if (!activeProvider || activeProvider === provider.id) {
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.2)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{provider.info?.icon || '☁️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {provider.info?.name || 'Unknown Provider'}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                    {provider.info?.type === 'local' ? 'Local browser storage' : 'Cloud storage provider'}
                  </div>
                </div>
                {provider.instance?.connected && (
                  <span style={{ fontSize: 12, color: "var(--cafe-success)" }}>✓</span>
                )}
                {healthStatus[provider.id]?.healthy === false && (
                  <span style={{ fontSize: 12, color: "var(--cafe-danger)" }}>⚠️</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Credential Configuration */}
      {selectedProvider && (
        <div style={{ ...card, padding: 20, animation: "fadeIn 0.4s ease-out 0.3s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: 0 }}>
              Configure {providersInfo.find(p => p.id === selectedProvider)?.info?.name || 'Provider'}
            </h3>
            <button
              onClick={() => setSelectedProvider(null)}
              style={{ ...btn("ghost"), fontSize: 12, padding: "6px 12px" }}
            >
              Close
            </button>
          </div>

          {/* Provider-specific configuration fields */}
          {selectedProvider === 'local' && (
            <div style={{ padding: 12, background: "var(--cafe-info-bg)", border: "1px solid var(--cafe-info-border)", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-info)" }}>
                Local Storage uses browser localStorage. No configuration required.
              </div>
            </div>
          )}

          {selectedProvider === 'aws-s3' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Bucket Name *</label>
                  <input
                    type="text"
                    value={credentials.bucket || ''}
                    onChange={(e) => handleCredentialChange('bucket', e.target.value)}
                    placeholder="e.g., my-cafe-backups"
                    style={{ ...input }}
                  />
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Region *</label>
                  <input
                    type="text"
                    value={credentials.region || ''}
                    onChange={(e) => handleCredentialChange('region', e.target.value)}
                    placeholder="e.g., us-east-1"
                    style={{ ...input }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
                <div>
                  <CredentialInput
                    label="Access Key ID *"
                    value={credentials.accessKey || ''}
                    onChange={(value) => handleCredentialChange('accessKey', value)}
                    placeholder="AWS Access Key ID"
                    required={true}
                    sensitive={true}
                    providerId={selectedProvider}
                    fieldName="accessKey"
                  />
                </div>
                <div>
                  <CredentialInput
                    label="Secret Access Key *"
                    value={credentials.secretKey || ''}
                    onChange={(value) => handleCredentialChange('secretKey', value)}
                    placeholder="AWS Secret Access Key"
                    required={true}
                    sensitive={true}
                    providerId={selectedProvider}
                    fieldName="secretKey"
                  />
                </div>
              </div>
              <div>
                <label style={{ ...label, marginBottom: 6 }}>Prefix (optional)</label>
                <input
                  type="text"
                  value={credentials.prefix || ''}
                  onChange={(e) => handleCredentialChange('prefix', e.target.value)}
                  placeholder="e.g., cafeos"
                  style={{ ...input }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={handleTestConnection}
              disabled={isLoading}
              style={{ ...btn("ghost"), fontSize: 13, padding: "10px 16px", flex: 1 }}
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSaveCredentials}
              disabled={isLoading || selectedProvider === 'local'}
              style={{ ...btn("primary"), fontSize: 13, padding: "10px 16px", flex: 1 }}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Activate button */}
          {providersInfo.find(p => p.id === selectedProvider)?.instance?.connected && (
            <button
              onClick={handleSetActiveProvider}
              disabled={isLoading || activeProvider === selectedProvider}
              style={{ ...btn("primary"), fontSize: 13, padding: "10px 16px", width: "100%", marginTop: 12 }}
            >
              {activeProvider === selectedProvider ? 'Currently Active' : 'Set as Active Provider'}
            </button>
          )}
        </div>
      )}

      {/* Health Status */}
      <div style={{ ...card, padding: 20, animation: "fadeIn 0.4s ease-out 0.4s both" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
          Provider Health Status
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {providersInfo.map(provider => (
            <div key={provider.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, background: "var(--cafe-bg)", borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{provider.info?.icon || '☁️'}</span>
                <span style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>
                  {provider.info?.name || 'Unknown'}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {healthStatus[provider.id]?.healthy ? (
                  <span style={{ fontSize: 11, color: "var(--cafe-success)", background: "var(--cafe-success-bg)", padding: "2px 8px", borderRadius: 4 }}>
                    Healthy ({healthStatus[provider.id]?.latency}ms)
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--cafe-danger)", background: "var(--cafe-danger-bg)", padding: "2px 8px", borderRadius: 4 }}>
                    Unhealthy
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Actions */}
      <div style={{ ...card, padding: 20, border: "1px solid var(--cafe-danger-border)", animation: "fadeIn 0.4s ease-out 0.5s both" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-danger)" }}>
          Security Actions
        </h3>
        
        <p style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
          Clear all cloud storage credentials from the Secret Vault. This action cannot be undone.
        </p>

        <button
          onClick={() => setShowClearConfirm(true)}
          style={{ ...btn("ghost"), fontSize: 13, padding: "10px 16px", background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)", color: "var(--cafe-danger)" }}
        >
          Clear All Credentials
        </button>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{ ...card, padding: 24, maxWidth: 400, width: "90%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-primary)" }}>
              Clear All Credentials?
            </h3>
            <p style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
              This will permanently delete all cloud storage credentials from this device. You will need to reconfigure them to use cloud storage.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{ ...btn("ghost"), fontSize: 13, padding: "10px 16px", flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  // Clear all provider configurations
                  localStorage.removeItem('cafeos_cloud_providers');
                  localStorage.removeItem('cafeos_storage_logs');
                  setActiveProvider(null);
                  setSelectedProvider(null);
                  setCredentials({});
                  showMessage("success", "All cloud storage credentials cleared");
                }}
                style={{ ...btn("primary"), fontSize: 13, padding: "10px 16px", flex: 1, background: "var(--cafe-danger)", border: "1px solid var(--cafe-danger-border)" }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{fadeIn}{scaleIn}</style>
    </div>
  );
}
