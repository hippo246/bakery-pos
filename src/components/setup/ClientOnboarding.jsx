import React from 'react';
// Client Onboarding Component for CafeOS
// Quick client setup using pre-built business templates

import { useState, useCallback, useEffect, useRef } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { BUSINESS_TEMPLATES, getAllTemplates, applyTemplate, validateTemplate } from "../../utils/clientTemplates.js";
import { createRemoteSessionAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import storageEngine from "../../cloud/StorageEngine.js";

// Animation keyframes
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const scaleIn = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export default function ClientOnboarding({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    businessName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [generatedConfig, setGeneratedConfig] = useState(null);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [cloudProvider, setCloudProvider] = useState(null);
  const [cloudCredentials, setCloudCredentials] = useState({});
  const [configureCloud, setConfigureCloud] = useState(false);
  const [showAwsSecrets, setShowAwsSecrets] = useState({ accessKey: false, secretKey: false });
  const [providersInfo, setProvidersInfo] = useState([]);
  const [providersError, setProvidersError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const messageTimeoutRef = useRef(null);

  // Initialize storage engine and load providers
  useEffect(() => {
    let cancelled = false;
    storageEngine.initialize()
      .then(() => {
        if (cancelled) return;
        const providers = storageEngine.getProvidersInfo();
        setProvidersInfo(providers);
      })
      .catch((err) => {
        // Previously this promise had no .catch - a failed initialize() call
        // was an unhandled rejection and silently left the provider list
        // empty with no indication anything went wrong.
        if (cancelled) return;
        console.error('[ClientOnboarding] Failed to initialize storage engine:', err);
        setProvidersError('Could not load cloud storage providers. You can still finish setup and configure cloud storage later.');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  const showMessage = useCallback((type, text) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setMessage({ type, text });
    messageTimeoutRef.current = setTimeout(() => setMessage({ type: null, text: "" }), 5000);
  }, []);

  const handleTemplateSelect = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    setStep(2);
  }, []);

  const handleClientInfoChange = useCallback((field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateConfig = useCallback(() => {
    if (!selectedTemplate) {
      showMessage("error", "Please select a template");
      return;
    }

    if (!clientInfo.businessName.trim()) {
      showMessage("error", "Business name is required");
      return;
    }

    try {
      const validation = validateTemplate(selectedTemplate);
      if (!validation.valid) {
        showMessage("error", `Template validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      const config = applyTemplate(selectedTemplate, clientInfo);
      setGeneratedConfig(config);
      setStep(3);

      // Audit log
      const auditLog = createRemoteSessionAuditLog({
        userId: getCurrentUserId(),
        action: 'CLIENT_CONFIG_GENERATED',
        details: {
          templateId: selectedTemplate,
          businessName: clientInfo.businessName,
          timestamp: new Date().toISOString()
        }
      });
      console.log('[ClientOnboarding] Configuration generated:', auditLog);

      showMessage("success", "Configuration generated successfully");
    } catch (err) {
      showMessage("error", `Failed to generate configuration: ${err.message}`);
    }
  }, [selectedTemplate, clientInfo, showMessage]);

  const handleDownloadConfig = useCallback(() => {
    if (!generatedConfig) return;

    const safeName = clientInfo.businessName.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'client';
    const filename = `CafeOS-Config-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
    const content = JSON.stringify(generatedConfig, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage("success", `Configuration downloaded: ${filename}`);
  }, [generatedConfig, clientInfo.businessName, showMessage]);

  const handleApplyConfig = useCallback(async () => {
    if (!generatedConfig || isApplying) return;

    // Previously a missing/incomplete cloud credential would only surface as
    // an opaque error (or not at all) from storageEngine.configureProvider.
    // Validate the fields the form itself marks as required before we try.
    if (configureCloud) {
      if (!cloudProvider) {
        showMessage("error", "Please select a cloud provider, or uncheck cloud storage configuration");
        return;
      }
      if (cloudProvider === 'aws-s3') {
        const missing = ['bucket', 'region', 'accessKey', 'secretKey'].filter(
          key => !String(cloudCredentials[key] || '').trim()
        );
        if (missing.length > 0) {
          showMessage("error", `Please fill in all required AWS S3 fields: ${missing.join(', ')}`);
          return;
        }
      }
    }

    setIsApplying(true);
    try {
      // Apply all settings to localStorage
      Object.keys(generatedConfig.settings).forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(generatedConfig.settings[key]));
        } catch (e) {
          console.warn(`Failed to apply setting ${key}:`, e);
        }
      });

      // Apply cloud storage configuration if provided
      if (configureCloud && cloudProvider && cloudCredentials) {
        await storageEngine.initialize();
        const userId = getCurrentUserId();
        const result = await storageEngine.configureProvider(cloudProvider, cloudCredentials, userId);

        if (!result.success) {
          // Previously a failed result was silently ignored here - the user
          // was told "Configuration applied successfully" even though their
          // cloud storage was never actually connected.
          showMessage("error", `Local settings were applied, but cloud storage setup failed: ${result.error || 'Unknown error'}. You can configure cloud storage later from Settings.`);
          return;
        }

        await storageEngine.setActiveProvider(cloudProvider, userId);
      }

      // Audit log
      const auditLog = createRemoteSessionAuditLog({
        userId: getCurrentUserId(),
        action: 'CLIENT_CONFIG_APPLIED',
        details: {
          templateId: selectedTemplate,
          businessName: clientInfo.businessName,
          settingsCount: Object.keys(generatedConfig.settings).length,
          cloudConfigured: configureCloud,
          cloudProvider: cloudProvider,
          timestamp: new Date().toISOString()
        }
      });
      console.log('[ClientOnboarding] Configuration applied:', auditLog);

      showMessage("success", "Configuration applied successfully");

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      showMessage("error", `Failed to apply configuration: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  }, [generatedConfig, isApplying, selectedTemplate, clientInfo.businessName, configureCloud, cloudProvider, cloudCredentials, showMessage, onComplete]);

  const templates = getAllTemplates();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--cafe-bg)", color: "var(--cafe-text)", fontFamily: "'Sora','Inter',sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--cafe-border)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--cafe-text-primary)" }}>
            Client Onboarding
          </h2>
          <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: "4px 0 0" }}>
            Quick setup using pre-built business templates
          </p>
        </div>
        <button onClick={onCancel} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px" }}>
          Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "16px 24px", background: "var(--cafe-bg-elevated)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
            Step {step} of 3: {step === 1 ? "Select Business Type" : step === 2 ? "Business Information" : "Review & Apply"}
          </span>
          <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
            {Math.round((step / 3) * 100)}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: s <= step ? "var(--cafe-accent)" : "var(--cafe-border-light)",
                transition: "background 0.3s ease"
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {message.text && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 24,
            background: message.type === "error" ? "var(--cafe-danger-bg)" : "var(--cafe-success-bg)",
            border: `1px solid ${message.type === "error" ? "var(--cafe-danger-border)" : "var(--cafe-success-border)"}`,
            color: message.type === "error" ? "var(--cafe-danger)" : "var(--cafe-success)",
            fontSize: 13,
            fontWeight: 500
          }}>
            <span aria-hidden="true">{message.type === "error" ? "⚠️" : "✓"}</span>
            <span style={{ flex: 1 }}>{message.text}</span>
            <button
              onClick={() => {
                if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
                setMessage({ type: null, text: "" });
              }}
              aria-label="Dismiss message"
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
                opacity: 0.7
              }}
            >
              ×
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ maxWidth: 900 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Select Business Type
            </h3>
            <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 24 }}>
              Choose a template that matches your business type. This will pre-configure settings, menus, and workflows.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  style={{
                    ...card,
                    padding: 24,
                    textAlign: "left",
                    border: "1px solid var(--cafe-border-light)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: "var(--cafe-bg-surface)",
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-border-light)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1)";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-border-light)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{template.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)" }}>
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 600 }}>
            <button onClick={() => setStep(1)} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px", marginBottom: 16 }}>
              ← Back
            </button>
            
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Business Information
            </h3>
            <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 24 }}>
              Enter your business details to customize the template.
            </p>

            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>{BUSINESS_TEMPLATES[selectedTemplate]?.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {BUSINESS_TEMPLATES[selectedTemplate]?.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Template selected
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, marginBottom: 8 }}>Business Name <span style={{ color: "var(--cafe-danger)" }}>*</span></label>
                <input
                  type="text"
                  value={clientInfo.businessName}
                  onChange={(e) => handleClientInfoChange('businessName', e.target.value)}
                  placeholder="e.g., The Coffee House"
                  aria-required="true"
                  style={{ ...input }}
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 8 }}>Tagline</label>
                <input
                  type="text"
                  value={clientInfo.tagline}
                  onChange={(e) => handleClientInfoChange('tagline', e.target.value)}
                  placeholder="e.g., Quality Coffee & More"
                  style={{ ...input }}
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 8 }}>Phone Number</label>
                <input
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                  placeholder="e.g., +1 234 567 8900"
                  autoComplete="tel"
                  style={{ ...input }}
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => handleClientInfoChange('email', e.target.value)}
                  placeholder="e.g., contact@example.com"
                  autoComplete="email"
                  style={{ ...input }}
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 8 }}>Address</label>
                <input
                  type="text"
                  value={clientInfo.address}
                  onChange={(e) => handleClientInfoChange('address', e.target.value)}
                  placeholder="Street address"
                  style={{ ...input }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 8 }}>City</label>
                  <input
                    type="text"
                    value={clientInfo.city}
                    onChange={(e) => handleClientInfoChange('city', e.target.value)}
                    placeholder="City"
                    style={{ ...input }}
                  />
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 8 }}>State</label>
                  <input
                    type="text"
                    value={clientInfo.state}
                    onChange={(e) => handleClientInfoChange('state', e.target.value)}
                    placeholder="State"
                    style={{ ...input }}
                  />
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 8 }}>Postal Code</label>
                  <input
                    type="text"
                    value={clientInfo.postalCode}
                    onChange={(e) => handleClientInfoChange('postalCode', e.target.value)}
                    placeholder="Code"
                    style={{ ...input }}
                  />
                </div>
              </div>
            </div>

            {/* Cloud Storage Configuration - moved above the Generate button;
                it previously rendered below it, so a user could click
                "Generate Configuration" and move on without ever seeing
                these fields even though they'd already been checked. */}
            <div style={{ marginTop: 24 }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border-light)",
                borderRadius: 8,
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={configureCloud}
                  onChange={(e) => setConfigureCloud(e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                  Configure cloud storage for backups and exports
                </div>
              </label>

              {providersError && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--cafe-danger)", display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span aria-hidden="true">⚠️</span>
                  <span>{providersError}</span>
                </div>
              )}

              {configureCloud && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ ...label, marginBottom: 8 }}>Select Cloud Provider</label>
                    <select
                      value={cloudProvider || ''}
                      onChange={(e) => setCloudProvider(e.target.value)}
                      style={{ ...input }}
                    >
                      <option value="">Select provider...</option>
                      {providersInfo.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.info?.icon || '☁️'} {provider.info?.name || 'Unknown Provider'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {cloudProvider === 'local' && (
                    <div style={{ ...card, padding: 16, marginTop: 12, background: "var(--cafe-info-bg)", border: "1px solid var(--cafe-info-border)" }}>
                      <div style={{ fontSize: 12, color: "var(--cafe-info)" }}>
                        Local Storage uses browser localStorage. No configuration required.
                      </div>
                    </div>
                  )}

                  {cloudProvider === 'aws-s3' && (
                    <div style={{ ...card, padding: 16, marginTop: 12 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                        AWS S3 Credentials
                      </h4>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ ...label, marginBottom: 6 }}>Bucket Name <span style={{ color: "var(--cafe-danger)" }}>*</span></label>
                        <input
                          type="text"
                          value={cloudCredentials.bucket || ''}
                          onChange={(e) => setCloudCredentials(prev => ({ ...prev, bucket: e.target.value }))}
                          placeholder="e.g., my-cafe-backups"
                          autoComplete="off"
                          aria-required="true"
                          style={{ ...input }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ ...label, marginBottom: 6 }}>Region <span style={{ color: "var(--cafe-danger)" }}>*</span></label>
                        <input
                          type="text"
                          value={cloudCredentials.region || ''}
                          onChange={(e) => setCloudCredentials(prev => ({ ...prev, region: e.target.value }))}
                          placeholder="e.g., us-east-1"
                          autoComplete="off"
                          aria-required="true"
                          style={{ ...input }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ ...label, marginBottom: 6 }}>Access Key ID <span style={{ color: "var(--cafe-danger)" }}>*</span></label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showAwsSecrets.accessKey ? "text" : "password"}
                            value={cloudCredentials.accessKey || ''}
                            onChange={(e) => setCloudCredentials(prev => ({ ...prev, accessKey: e.target.value }))}
                            placeholder="AWS Access Key ID"
                            autoComplete="new-password"
                            aria-required="true"
                            style={{ ...input, paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAwsSecrets(prev => ({ ...prev, accessKey: !prev.accessKey }))}
                            aria-label={showAwsSecrets.accessKey ? "Hide access key" : "Show access key"}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "var(--cafe-text-tertiary)",
                              padding: 4
                            }}
                          >
                            {showAwsSecrets.accessKey ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ ...label, marginBottom: 6 }}>Secret Access Key <span style={{ color: "var(--cafe-danger)" }}>*</span></label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showAwsSecrets.secretKey ? "text" : "password"}
                            value={cloudCredentials.secretKey || ''}
                            onChange={(e) => setCloudCredentials(prev => ({ ...prev, secretKey: e.target.value }))}
                            placeholder="AWS Secret Access Key"
                            autoComplete="new-password"
                            aria-required="true"
                            style={{ ...input, paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAwsSecrets(prev => ({ ...prev, secretKey: !prev.secretKey }))}
                            aria-label={showAwsSecrets.secretKey ? "Hide secret key" : "Show secret key"}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "var(--cafe-text-tertiary)",
                              padding: 4
                            }}
                          >
                            {showAwsSecrets.secretKey ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{ ...label, marginBottom: 6 }}>Prefix (optional)</label>
                        <input
                          type="text"
                          value={cloudCredentials.prefix || ''}
                          onChange={(e) => setCloudCredentials(prev => ({ ...prev, prefix: e.target.value }))}
                          placeholder="e.g., cafeos"
                          autoComplete="off"
                          style={{ ...input }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button onClick={handleGenerateConfig} style={{ ...btn("primary"), fontSize: 14, padding: "12px 24px" }}>
                Generate Configuration →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 800, animation: "fadeIn 0.5s ease-out" }}>
            <button onClick={() => setStep(2)} style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px", marginBottom: 16 }}>
              ← Back
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Configuration Ready
            </h3>
            <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 24 }}>
              Your configuration has been generated. You can download it for backup or apply it directly.
            </p>

            <div style={{ ...card, padding: 24, marginBottom: 16, animation: "scaleIn 0.5s ease-out 0.1s both" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Business Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {generatedConfig?.settings?.cafeos_business_details?.cafeName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Template</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
                    {generatedConfig?.templateName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Settings Configured</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {Object.keys(generatedConfig?.settings || {}).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Collections</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {Object.keys(generatedConfig?.collections || {}).length}
                  </div>
                </div>
              </div>

              <div style={{ padding: 12, background: "var(--cafe-success-bg)", border: "1px solid var(--cafe-success-border)", borderRadius: 8, fontSize: 12, color: "var(--cafe-success)" }}>
                <strong>✓ Ready to deploy:</strong> This configuration includes all settings, operating hours, payment methods, tax configuration, kitchen stations, tables, staff roles, and menu categories.
              </div>
            </div>

            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Included Settings
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.keys(generatedConfig?.settings || {}).map(key => (
                  <span
                    key={key}
                    style={{
                      padding: "4px 8px",
                      background: "var(--cafe-bg)",
                      border: "1px solid var(--cafe-border-light)",
                      borderRadius: 4,
                      fontSize: 11,
                      color: "var(--cafe-text-secondary)"
                    }}
                  >
                    {key.replace(/cafeos_/g, '').replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleDownloadConfig} disabled={isApplying} style={{ ...btn("ghost"), fontSize: 14, padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", opacity: isApplying ? 0.6 : 1, cursor: isApplying ? "not-allowed" : "pointer" }}>
                📥 Download Configuration
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(generatedConfig, null, 2));
                    showMessage("success", "Configuration copied to clipboard");
                  } catch (err) {
                    showMessage("error", "Could not copy to clipboard");
                  }
                }}
                disabled={isApplying}
                style={{ ...btn("ghost"), fontSize: 14, padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", opacity: isApplying ? 0.6 : 1, cursor: isApplying ? "not-allowed" : "pointer" }}
              >
                📋 Copy JSON
              </button>
              <button onClick={handleApplyConfig} disabled={isApplying} style={{ ...btn("primary"), fontSize: 14, padding: "12px 24px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", opacity: isApplying ? 0.7 : 1, cursor: isApplying ? "not-allowed" : "pointer" }}>
                {isApplying ? "Applying…" : "✓ Apply Configuration"}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{fadeIn}{scaleIn}{shimmer}</style>
    </div>
  );
}
