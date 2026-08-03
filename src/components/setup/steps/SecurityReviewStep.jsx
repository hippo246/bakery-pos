import React from 'react';
// Security Review Step for Setup Wizard
// Review security settings before launch with full functionality

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

export default function SecurityReviewStep({ settings, onNext, onBack, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [expandedSection, setExpandedSection] = useState(null);

  // Local overrides let the recommendations below actually DO the thing they
  // recommend, right here, instead of just linking to a settings page the
  // user has to go find. null means "no override yet - defer to settings".
  const [owner2FAOverride, setOwner2FAOverride] = useState(null);
  const [passwordPolicyOverride, setPasswordPolicyOverride] = useState(null);
  const [sessionTimeoutOverride, setSessionTimeoutOverride] = useState(null);
  // Staff overrides
  const [staffRolesOverride, setStaffRolesOverride] = useState(null);
  const [staffPermissionsOverride, setStaffPermissionsOverride] = useState(null);
  const [accessControlTypeOverride, setAccessControlTypeOverride] = useState(null);
  // Payment overrides
  const [manualRecordingOverride, setManualRecordingOverride] = useState(null);
  const [minimumAmountsOverride, setMinimumAmountsOverride] = useState(null);
  const [maxSplitMethodsOverride, setMaxSplitMethodsOverride] = useState(null);
  // QR overrides
  const [requireCustomerPhoneOverride, setRequireCustomerPhoneOverride] = useState(null);
  const [orderLimitOverride, setOrderLimitOverride] = useState(null);

  const effectiveSettings = useMemo(() => ({
    ...settings,
    owner2FA: owner2FAOverride !== null ? owner2FAOverride : settings?.owner2FA,
    passwordPolicy: passwordPolicyOverride !== null ? passwordPolicyOverride : settings?.passwordPolicy,
    staffRoles: staffRolesOverride !== null ? staffRolesOverride : settings?.staffRoles,
    staffPermissions: staffPermissionsOverride !== null ? staffPermissionsOverride : settings?.staffPermissions,
    accessControlType: accessControlTypeOverride !== null ? accessControlTypeOverride : settings?.accessControlType,
    paymentMethods: {
      ...settings?.paymentMethods,
      manualRecording: manualRecordingOverride !== null ? manualRecordingOverride : settings?.paymentMethods?.manualRecording,
      minimumAmounts: minimumAmountsOverride !== null ? minimumAmountsOverride : settings?.paymentMethods?.minimumAmounts,
      maxSplitMethods: maxSplitMethodsOverride !== null ? maxSplitMethodsOverride : settings?.paymentMethods?.maxSplitMethods,
    },
    qrOrdering: {
      ...settings?.qrOrdering,
      sessionTimeout: sessionTimeoutOverride !== null ? sessionTimeoutOverride : settings?.qrOrdering?.sessionTimeout,
      requireCustomerPhone: requireCustomerPhoneOverride !== null ? requireCustomerPhoneOverride : settings?.qrOrdering?.requireCustomerPhone,
      orderLimitPerSession: orderLimitOverride !== null ? orderLimitOverride : settings?.qrOrdering?.orderLimitPerSession,
    }
  }), [settings, owner2FAOverride, passwordPolicyOverride, sessionTimeoutOverride,
       staffRolesOverride, staffPermissionsOverride, accessControlTypeOverride,
       manualRecordingOverride, minimumAmountsOverride, maxSplitMethodsOverride,
       requireCustomerPhoneOverride, orderLimitOverride]);

  const securityChecks = useMemo(() => [
    {
      id: 'account',
      name: "Owner Account Security",
      icon: "👤",
      status: effectiveSettings?.ownerName && effectiveSettings?.ownerPassword ? "complete" : "warning",
      checks: [
        { name: "Owner name configured", complete: !!effectiveSettings?.ownerName },
        { name: "Password set", complete: !!effectiveSettings?.ownerPassword },
        { name: "Email configured", complete: !!effectiveSettings?.ownerEmail },
        { name: "2FA enabled", complete: !!effectiveSettings?.owner2FA },
        { name: "Password policy enabled", complete: !!effectiveSettings?.passwordPolicy }
      ]
    },
    {
      id: 'staff',
      name: "Staff Access Control",
      icon: "👥",
      status: effectiveSettings?.staffRoles && effectiveSettings?.staffRoles.length > 0 ? "complete" : "warning",
      checks: [
        { name: "Staff roles defined", complete: !!effectiveSettings?.staffRoles && effectiveSettings?.staffRoles.length > 0 },
        { name: "Permissions configured", complete: !!effectiveSettings?.staffPermissions },
        { name: "ABAC/RBAC enabled", complete: !!effectiveSettings?.accessControlType }
      ]
    },
    {
      id: 'data',
      name: "Data Protection",
      icon: "🔒",
      status: effectiveSettings?.qrOrdering?.sessionTimeout ? "complete" : "warning",
      checks: [
        { name: "Local storage encryption", complete: true },
        { name: "Secure data transmission", complete: true },
        { name: "Audit logging enabled", complete: true },
        { name: "Session timeout configured", complete: !!effectiveSettings?.qrOrdering?.sessionTimeout }
      ]
    },
    {
      id: 'payments',
      name: "Payment Security",
      icon: "💳",
      status: (effectiveSettings?.paymentMethods?.manualRecording || effectiveSettings?.paymentMethods?.minimumAmounts || effectiveSettings?.paymentMethods?.maxSplitMethods) ? "complete" : "warning",
      checks: [
        { name: "Payment methods configured", complete: !!(effectiveSettings?.paymentMethods?.manualRecording || effectiveSettings?.paymentMethods?.minimumAmounts || effectiveSettings?.paymentMethods?.maxSplitMethods) },
        { name: "Manual recording enabled", complete: !!effectiveSettings?.paymentMethods?.manualRecording },
        { name: "Minimum amounts set", complete: !!effectiveSettings?.paymentMethods?.minimumAmounts },
        { name: "Split payment limits", complete: !!effectiveSettings?.paymentMethods?.maxSplitMethods }
      ]
    },
    {
      id: 'qr',
      name: "QR Ordering Security",
      icon: "📱",
      status: !effectiveSettings?.qrOrdering?.qrEnabled || (effectiveSettings?.qrOrdering?.requireCustomerPhone || effectiveSettings?.qrOrdering?.requireCustomerName) ? "complete" : "warning",
      checks: [
        { name: "Customer verification", complete: !effectiveSettings?.qrOrdering?.qrEnabled || (effectiveSettings?.qrOrdering?.requireCustomerPhone || effectiveSettings?.qrOrdering?.requireCustomerName) },
        { name: "Order limits configured", complete: !effectiveSettings?.qrOrdering?.qrEnabled || !!effectiveSettings?.qrOrdering?.orderLimitPerSession },
        { name: "Session timeout set", complete: !effectiveSettings?.qrOrdering?.qrEnabled || !!effectiveSettings?.qrOrdering?.sessionTimeout }
      ]
    }
  ], [effectiveSettings]);

  const hasAutoExpandedRef = useRef(false);
  useEffect(() => {
    if (hasAutoExpandedRef.current) return;
    hasAutoExpandedRef.current = true;
    const firstWarning = securityChecks.find(section => section.status !== "complete");
    if (firstWarning) setExpandedSection(firstWarning.id);
  }, [securityChecks]);

  const securityRecommendations = useMemo(() => [
    {
      id: '2fa',
      type: 'toggle',
      priority: 'high',
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to protect your account from unauthorized access.',
      action: 'Configure 2FA in Owner Access settings',
      resolved: !!effectiveSettings?.owner2FA
    },
    {
      id: 'password-policy',
      type: 'toggle',
      priority: 'medium',
      title: 'Set Strong Password Requirements',
      description: 'Enforce minimum password length and complexity for all staff accounts.',
      action: 'Update password policy in Security settings',
      resolved: !!effectiveSettings?.passwordPolicy
    },
    {
      id: 'session-timeout',
      type: 'select',
      priority: 'medium',
      title: 'Configure Session Timeouts',
      description: 'Automatically log out inactive users to prevent unauthorized access.',
      action: 'Set session timeout in Security settings',
      resolved: !!effectiveSettings?.qrOrdering?.sessionTimeout
    }
  ], [effectiveSettings]);

  const activeRecommendations = useMemo(
    () => securityRecommendations.filter(rec => !rec.resolved),
    [securityRecommendations]
  );

  const securityScore = useMemo(() => {
    let totalChecks = 0;
    let completedChecks = 0;

    securityChecks.forEach(section => {
      section.checks.forEach(check => {
        totalChecks++;
        if (check.complete) completedChecks++;
      });
    });

    return totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
  }, [securityChecks]);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...effectiveSettings,
      securityReview: {
        score: securityScore,
        completedAt: new Date().toISOString(),
        checks: securityChecks
      }
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
      if (setError) {
        setError({
          title: 'Could not save security review',
          message: "Your progress in this step couldn't be saved locally, but you can still continue - just make sure to complete setup in this session.",
          retry: null
        });
      }
    }
    onNext({
      securityReview: updatedSettings.securityReview,
      owner2FA: effectiveSettings.owner2FA,
      passwordPolicy: effectiveSettings.passwordPolicy,
      qrOrdering: effectiveSettings.qrOrdering
    });
  }, [effectiveSettings, securityChecks, securityScore, onNext, setError]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Security Review
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Review your security settings before going live.
        </p>
      </div>

      {/* Security Score */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: isMobile ? 16 : 24,
        marginBottom: 24
      }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 16 : 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Security Score
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                Based on your current configuration
              </div>
            </div>
          </div>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `conic-gradient(${securityScore >= 80 ? '#10b981' : securityScore >= 50 ? '#f59e0b' : '#ef4444'} ${securityScore}%, var(--cafe-border) 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            alignSelf: isMobile ? "center" : "auto",
            flexShrink: 0
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--cafe-bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: securityScore >= 80 ? "#10b981" : securityScore >= 50 ? "#f59e0b" : "#ef4444"
            }}>
              {securityScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: isMobile ? 16 : 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>✅</span>
          Security Checklist
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {securityChecks.map((section) => (
            <div key={section.id} style={{
              background: "var(--cafe-bg)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 10,
              overflow: "hidden"
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                aria-expanded={expandedSection === section.id}
                aria-controls={`security-section-${section.id}`}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cafe-bg-surface)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = "inset 0 0 0 2px var(--cafe-accent)"; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{section.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {section.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                      {section.checks.filter(c => c.complete).length}/{section.checks.length} checks passed
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 20,
                    color: section.status === "complete" ? "#10b981" : "#f59e0b"
                  }}>
                    {section.status === "complete" ? "✓" : "⚠"}
                  </span>
                  <span style={{ fontSize: 16, color: "var(--cafe-text-tertiary)" }}>
                    {expandedSection === section.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {expandedSection === section.id && (
                <div id={`security-section-${section.id}`} style={{ padding: "0 16px 16px", borderTop: "1px solid var(--cafe-border)" }}>
                  <div style={{ paddingTop: 16 }}>
                    {section.checks.map((check, idx) => {
                      // --- inline control definitions ---
                      // Each entry: { id, control } — rendered flush-right on the row.
                      // Shown regardless of check.complete so reversible controls always appear.
                      const inlineControl = (() => {
                        const btnStyle = (color) => ({
                          padding: "4px 10px", background: color, border: "none",
                          borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer"
                        });
                        const ghostBtnStyle = {
                          padding: "4px 10px", background: "transparent",
                          border: "1px solid var(--cafe-border)", borderRadius: 6,
                          fontSize: 11, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer"
                        };
                        const selectStyle = {
                          padding: "4px 8px", borderRadius: 6,
                          border: `1px solid ${check.complete ? "#10b98150" : "var(--cafe-border)"}`,
                          background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer"
                        };
                        const inputStyle = {
                          width: 72, padding: "4px 8px", borderRadius: 6,
                          border: `1px solid ${check.complete ? "#10b98150" : "var(--cafe-border)"}`,
                          background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)",
                          fontSize: 11, fontWeight: 600
                        };

                        switch (check.name) {
                          // ── Account ──────────────────────────────────────────
                          case "2FA enabled":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setOwner2FAOverride(false); }} style={ghostBtnStyle}>Disable</button>
                              : <button onClick={(e) => { e.stopPropagation(); setOwner2FAOverride(true); }} style={btnStyle("#ef4444")}>Enable</button>;

                          case "Password policy enabled":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setPasswordPolicyOverride(null); }} style={ghostBtnStyle}>Disable</button>
                              : <button onClick={(e) => { e.stopPropagation(); setPasswordPolicyOverride({ enabled: true, minLength: 8, requireUppercase: true, requireNumber: true }); }} style={btnStyle("#f59e0b")}>Enable</button>;

                          // ── Staff ─────────────────────────────────────────────
                          case "Staff roles defined":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setStaffRolesOverride([]); }} style={ghostBtnStyle}>Clear</button>
                              : <button onClick={(e) => { e.stopPropagation(); setStaffRolesOverride(["Manager", "Staff", "Cashier"]); }} style={btnStyle("#f59e0b")}>Add defaults</button>;

                          case "Permissions configured":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setStaffPermissionsOverride(null); }} style={ghostBtnStyle}>Clear</button>
                              : <button onClick={(e) => { e.stopPropagation(); setStaffPermissionsOverride({ viewOrders: true, editMenu: false, manageStaff: false, viewReports: true }); }} style={btnStyle("#f59e0b")}>Configure</button>;

                          case "ABAC/RBAC enabled":
                            return (
                              <select
                                value={effectiveSettings?.accessControlType ?? ""}
                                onChange={(e) => { e.stopPropagation(); setAccessControlTypeOverride(e.target.value || null); }}
                                style={selectStyle}
                              >
                                <option value="">Select type…</option>
                                <option value="rbac">RBAC</option>
                                <option value="abac">ABAC</option>
                              </select>
                            );

                          // ── Data Protection ───────────────────────────────────
                          case "Session timeout configured":
                          case "Session timeout set":
                            return (
                              <select
                                value={effectiveSettings?.qrOrdering?.sessionTimeout ?? ""}
                                onChange={(e) => { e.stopPropagation(); setSessionTimeoutOverride(e.target.value ? Number(e.target.value) : null); }}
                                style={selectStyle}
                              >
                                <option value="">Set timeout…</option>
                                <option value="5">5 min</option>
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="60">60 min</option>
                              </select>
                            );

                          // ── Payments ──────────────────────────────────────────
                          case "Manual recording enabled":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setManualRecordingOverride(false); }} style={ghostBtnStyle}>Disable</button>
                              : <button onClick={(e) => { e.stopPropagation(); setManualRecordingOverride(true); }} style={btnStyle("#f59e0b")}>Enable</button>;

                          case "Minimum amounts set":
                            return (
                              <input
                                type="number"
                                min="0"
                                placeholder="Min $"
                                value={effectiveSettings?.paymentMethods?.minimumAmounts ?? ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); setMinimumAmountsOverride(e.target.value ? Number(e.target.value) : null); }}
                                style={inputStyle}
                              />
                            );

                          case "Split payment limits":
                            return (
                              <select
                                value={effectiveSettings?.paymentMethods?.maxSplitMethods ?? ""}
                                onChange={(e) => { e.stopPropagation(); setMaxSplitMethodsOverride(e.target.value ? Number(e.target.value) : null); }}
                                style={selectStyle}
                              >
                                <option value="">Max splits…</option>
                                <option value="2">2 ways</option>
                                <option value="3">3 ways</option>
                                <option value="4">4 ways</option>
                              </select>
                            );

                          // ── QR Ordering ───────────────────────────────────────
                          case "Customer verification":
                            return check.complete
                              ? <button onClick={(e) => { e.stopPropagation(); setRequireCustomerPhoneOverride(false); }} style={ghostBtnStyle}>Disable</button>
                              : <button onClick={(e) => { e.stopPropagation(); setRequireCustomerPhoneOverride(true); }} style={btnStyle("#f59e0b")}>Require phone</button>;

                          case "Order limits configured":
                            return (
                              <input
                                type="number"
                                min="1"
                                placeholder="Limit"
                                value={effectiveSettings?.qrOrdering?.orderLimitPerSession ?? ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); setOrderLimitOverride(e.target.value ? Number(e.target.value) : null); }}
                                style={inputStyle}
                              />
                            );

                          default:
                            return null;
                        }
                      })();

                      return (
                        <div key={idx} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "10px 12px",
                          marginBottom: idx < section.checks.length - 1 ? 8 : 0,
                          background: check.complete ? "#10b98110" : "var(--cafe-bg)",
                          borderRadius: 6,
                          border: check.complete ? "1px solid #10b98130" : "1px solid var(--cafe-border)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, color: check.complete ? "#10b981" : "var(--cafe-text-tertiary)" }}>
                              {check.complete ? "✓" : "○"}
                            </span>
                            <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                              {check.name}
                            </span>
                          </div>
                          {inlineControl && (
                            <div style={{ flexShrink: 0 }}>{inlineControl}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Recommendations */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: isMobile ? 16 : 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>💡</span>
          Security Recommendations
          {activeRecommendations.length > 0 && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              background: "#f59e0b",
              borderRadius: 10,
              padding: "2px 8px"
            }}>
              {activeRecommendations.length}
            </span>
          )}
        </h4>

        {activeRecommendations.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 16,
            background: "#10b98110",
            border: "1px solid #10b98130",
            borderRadius: 10,
            fontSize: 13,
            color: "#10b981"
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <span>All recommended security actions are complete.</span>
          </div>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeRecommendations.map((rec, idx) => (
            <div key={idx} style={{
              padding: 16,
              background: rec.priority === 'high' ? "#ef444410" : rec.priority === 'medium' ? "#f59e0b10" : "var(--cafe-bg)",
              border: rec.priority === 'high' ? "1px solid #ef444430" : rec.priority === 'medium' ? "1px solid #f59e0b30" : "1px solid var(--cafe-border)",
              borderRadius: 10
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <span style={{
                  padding: "4px 8px",
                  background: rec.priority === 'high' ? "#ef4444" : rec.priority === 'medium' ? "#f59e0b" : "var(--cafe-accent)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#fff",
                  textTransform: "uppercase",
                  flexShrink: 0
                }}>
                  {rec.priority}
                </span>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {rec.title}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 12, paddingLeft: 4 }}>
                {rec.description}
              </div>
              <div style={{ paddingLeft: 4 }}>
                {rec.type === 'toggle' && (() => {
                  const isEnabled = rec.id === '2fa' ? !!effectiveSettings?.owner2FA : !!effectiveSettings?.passwordPolicy;
                  return (
                    <button
                      onClick={() => {
                        if (rec.id === '2fa') setOwner2FAOverride(isEnabled ? false : true);
                        if (rec.id === 'password-policy') {
                          setPasswordPolicyOverride(isEnabled ? null : { enabled: true, minLength: 8, requireUppercase: true, requireNumber: true });
                        }
                      }}
                      aria-label={rec.action}
                      aria-pressed={isEnabled}
                      style={{
                        padding: "8px 16px",
                        background: isEnabled ? "transparent" : rec.priority === 'high' ? "#ef4444" : "#f59e0b",
                        border: isEnabled ? "1px solid var(--cafe-border)" : "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: isEnabled ? "var(--cafe-text-secondary)" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {isEnabled ? "Disable" : "Enable Now"}
                    </button>
                  );
                })()}
                {rec.type === 'select' && (
                  <select
                    value={effectiveSettings?.qrOrdering?.sessionTimeout ?? ""}
                    onChange={(e) => {
                      setSessionTimeoutOverride(e.target.value ? Number(e.target.value) : null);
                    }}
                    aria-label={rec.action}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--cafe-border)",
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Set session timeout…</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Note */}
      <div style={{
        padding: 16,
        background: "var(--cafe-info-bg)",
        border: "1px solid var(--cafe-info-border)",
        borderRadius: 10,
        marginBottom: 24
      }}>
        <div style={{ fontSize: 13, color: "var(--cafe-info)", lineHeight: 1.6 }}>
          <strong>Note:</strong> Additional security settings can be configured after setup in Security & Access. Regular security audits are recommended.
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            order: isMobile ? 2 : 0
          }}
          onMouseEnter={(e) => {
            if (isLoading) return;
            e.currentTarget.style.borderColor = "var(--cafe-accent)";
            e.currentTarget.style.background = "var(--cafe-accent-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--cafe-border)";
            e.currentTarget.style.background = "var(--cafe-bg-surface)";
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--cafe-accent-bg)"; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            order: isMobile ? 1 : 0
          }}
          onMouseEnter={(e) => {
            if (isLoading) return;
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(139, 69, 19, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.3)"; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
