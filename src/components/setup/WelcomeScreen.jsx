import React from 'react';
// Premium Welcome Screen for CafeOS
// Modern landing experience with premium design

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import { setAppMode, startSetup, APP_MODES, getSetupState, getSetupProgress } from "../../utils/appMode.js";
import { createSecurityAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import { FEATURE_CONFIG, FEATURE_CATEGORIES, initializeFeatureConfig } from "../../utils/featureConfig.js";
import ClientOnboarding from "./ClientOnboarding.jsx";
import RemoteAssistance from "../remote/RemoteAssistance.jsx";

// Animation keyframes
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const slideIn = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const scaleIn = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const pulse = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export default function WelcomeScreen({ onDemoMode, onSetupStart, onRestoreBackup }) {
  const [isMobile, setIsMobile] = useState(false);
  const [hasPartialSetup, setHasPartialSetup] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [showClientOnboarding, setShowClientOnboarding] = useState(false);
  const [showRemoteAssistance, setShowRemoteAssistance] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFeatureConfig, setShowFeatureConfig] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [activeCategory, setActiveCategory] = useState(FEATURE_CATEGORIES.OPERATIONS);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for partial setup on mount. Previously this checked
  // `progress > 0 && hasPartialSetup` - but hasPartialSetup starts false and
  // nothing ever set it to true before this ran, so the condition could
  // never be true and setupProgress/hasPartialSetup were never actually
  // populated from the saved setup state.
  useEffect(() => {
    const setupState = getSetupState();
    const progress = getSetupProgress();

    if (setupState.currentStep && setupState.currentStep !== 'complete' && progress > 0) {
      startTransition(() => {
        setSetupProgress(progress);
        setHasPartialSetup(true);
      });
    }
    // Intentionally not opening showResumeDialog here - per the original
    // intent, we let the user choose from the welcome options first, and
    // only offer to resume once they click "Begin Setup" (see handleSetupCafe).
  }, []);

  const demoTimeoutRef = useRef(null);
  const devMenuRef = useRef(null);
  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    };
  }, []);

  const handleTryDemo = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    demoTimeoutRef.current = setTimeout(() => {
      setAppMode(APP_MODES.DEMO);
      
      const auditLog = createSecurityAuditLog({
        userId: getCurrentUserId(),
        details: {
          action: 'DEMO_MODE_SELECTED',
          description: 'User selected demo mode on first launch'
        }
      });
      console.log('[WelcomeScreen] Demo mode selected:', auditLog);

      if (onDemoMode) onDemoMode();
    }, 500);
  }, [onDemoMode, isLoading]);

  const handleRestoreBackup = useCallback(() => {
    const auditLog = createSecurityAuditLog({
      userId: getCurrentUserId(),
      details: {
        action: 'RESTORE_SELECTED',
        description: 'User selected restore from backup on first launch'
      }
    });
    console.log('[WelcomeScreen] Restore selected:', auditLog);

    if (onRestoreBackup) onRestoreBackup();
  }, [onRestoreBackup]);

  const handleContactSupport = useCallback(() => {
    const auditLog = createSecurityAuditLog({
      userId: getCurrentUserId(),
      details: {
        action: 'CONTACT_SUPPORT',
        description: 'User selected contact support option'
      }
    });
    console.log('[WelcomeScreen] Contact support selected:', auditLog);
    
    // Open email client with support email
    window.location.href = 'mailto:support@cafeos.com?subject=CafeOS%20Support%20Request';
  }, []);

  const handleContinueSetup = useCallback(() => {
    setShowResumeDialog(false);
    setAppMode(APP_MODES.SETUP);
    if (onSetupStart) onSetupStart();
  }, [onSetupStart]);

  // Escape closes whichever dismissible overlay is currently open. None of
  // these had a keyboard dismissal path before.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showRemoteAssistance) setShowRemoteAssistance(false);
      else if (showClientOnboarding) setShowClientOnboarding(false);
      else if (showDevMenu) setShowDevMenu(false);
      else if (showLearnModal) setShowLearnModal(false);
      else if (showFeatureConfig) setShowFeatureConfig(false);
      // showResumeDialog is intentionally excluded - it asks the user to
      // make an explicit choice (continue vs. start fresh) rather than
      // being a dismissible informational overlay.
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRemoteAssistance, showClientOnboarding, showDevMenu, showLearnModal, showFeatureConfig]);

  useEffect(() => {
    if (!showDevMenu) return;
    const handleClickOutside = (e) => {
      if (devMenuRef.current && !devMenuRef.current.contains(e.target)) {
        setShowDevMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDevMenu]);

  // Initialize selected features on mount
  useEffect(() => {
    const initialFeatures = {};
    Object.entries(FEATURE_CONFIG).forEach(([key, feature]) => {
      initialFeatures[key] = feature.enabled;
    });
    startTransition(() => {
      setSelectedFeatures(initialFeatures);
    });
  }, []);

  const toggleFeature = useCallback((featureId) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  }, []);

  const handleStartFresh = useCallback(() => {
    setShowResumeDialog(false);
    setShowFeatureConfig(true);
    // The user explicitly chose to discard prior progress - reflect that
    // locally so the "Resume Setup (X% done)" hint doesn't keep showing
    // stale progress if they back out before finishing the fresh setup.
    setHasPartialSetup(false);
    setSetupProgress(0);
  }, []);

  const handleSetupWithFeatures = useCallback(() => {
    // Save feature configuration
    const featureConfig = {};
    Object.entries(selectedFeatures).forEach(([key, enabled]) => {
      featureConfig[key] = { enabled };
    });
    initializeFeatureConfig(featureConfig);
    
    setAppMode(APP_MODES.SETUP);
    startSetup();
    if (onSetupStart) onSetupStart();
  }, [selectedFeatures, onSetupStart]);

  const handleSetupCafe = useCallback(() => {
    // Previously this always jumped straight into feature config, so a
    // returning user with saved progress had no way to resume - the
    // "Resume Setup?" dialog below was built but never actually triggered.
    if (hasPartialSetup) {
      setShowResumeDialog(true);
    } else {
      setShowFeatureConfig(true);
    }
  }, [hasPartialSetup]);

  if (showFeatureConfig) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background decorations */}
        <div style={{
          position: "absolute",
          top: "20%",
          right: "15%",
          width: 300,
          height: 300,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          filter: "blur(80px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "25%",
          left: "10%",
          width: 200,
          height: 200,
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />

        <div style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1000,
          width: "90%",
          maxHeight: "90vh",
          background: "var(--cafe-bg-card)",
          borderRadius: 20,
          padding: 40,
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)",
          overflow: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h2 style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--cafe-text-primary)",
                margin: "0 0 8px"
              }}>
                Configure Your Features
              </h2>
              <p style={{
                fontSize: 15,
                color: "var(--cafe-text-secondary)",
                margin: 0
              }}>
                Select which features to enable. You can change these later in Settings.
              </p>
            </div>
            <button
              onClick={() => setShowFeatureConfig(false)}
              style={{
                padding: "12px 16px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Back
            </button>
          </div>

          {/* Category Tabs */}
          <div role="tablist" aria-label="Feature categories" style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap"
          }}>
            {Object.values(FEATURE_CATEGORIES).map(category => (
              <button
                key={category}
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: "10px 20px",
                  background: activeCategory === category 
                    ? "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)"
                    : "var(--cafe-bg-surface)",
                  border: activeCategory === category ? "none" : "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  color: activeCategory === category ? "#fff" : "var(--cafe-text-secondary)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "capitalize"
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          {FEATURE_CONFIG && Object.values(FEATURE_CONFIG).filter(f => f.category === activeCategory).length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: "var(--cafe-text-tertiary)",
              fontSize: 14,
              marginBottom: 32
            }}>
              No features in this category yet.
            </div>
          ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 32
          }}>
            {Object.entries(FEATURE_CONFIG)
              .filter(([/* key */,  feature]) => feature.category === activeCategory)
              .map(([key, feature]) => (
                <div
                  key={key}
                  role="checkbox"
                  aria-checked={!!selectedFeatures[key]}
                  aria-disabled={feature.required}
                  aria-label={feature.required ? `${feature.name} (required, always enabled)` : feature.name}
                  tabIndex={feature.required ? -1 : 0}
                  style={{
                    padding: 20,
                    background: "var(--cafe-bg-surface)",
                    borderRadius: 12,
                    border: selectedFeatures[key] ? "2px solid #8B4513" : "1px solid var(--cafe-border)",
                    cursor: feature.required ? "not-allowed" : "pointer",
                    opacity: feature.required ? 0.7 : 1,
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => !feature.required && toggleFeature(key)}
                  onKeyDown={(e) => {
                    if (!feature.required && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      toggleFeature(key);
                    }
                  }}
                  onFocus={(e) => {
                    if (!feature.required) {
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.3)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 28 }}>{feature.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--cafe-text-primary)",
                        marginBottom: 4
                      }}>
                        {feature.name}
                      </div>
                      {feature.required && (
                        <div style={{
                          fontSize: 12,
                          color: "#8B4513",
                          fontWeight: 600
                        }}>
                          Required
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: selectedFeatures[key] ? "#8B4513" : "var(--cafe-bg-card)",
                      border: "2px solid var(--cafe-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: selectedFeatures[key] ? "#fff" : "transparent",
                      fontSize: 14,
                      fontWeight: 700
                    }}>
                      {selectedFeatures[key] ? "✓" : ""}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowFeatureConfig(false)}
              style={{
                padding: "16px 32px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSetupWithFeatures}
              style={{
                padding: "16px 32px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Continue Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background decorations */}
        <div style={{
          position: "absolute",
          top: "20%",
          right: "15%",
          width: 300,
          height: 300,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          filter: "blur(80px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "25%",
          left: "10%",
          width: 200,
          height: 200,
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        
        {/* Loading content */}
        <div style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center"
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 40,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            ☕
          </div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.9)",
            margin: "0 0 8px",
            letterSpacing: "0.5px"
          }}>
            {isLoading ? "Preparing your workspace..." : "Welcome to CafeOS"}
          </h2>
          <p style={{
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.6)",
            margin: 0
          }}>
            {isLoading ? "Just a moment" : "Initializing premium experience"}
          </p>
        </div>

        <style>{fadeIn}{slideIn}{scaleIn}{pulse}{shimmer}</style>
      </div>
    );
  }

  if (showResumeDialog) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}>
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 20,
          padding: 40,
          maxWidth: 500,
          width: "90%",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 32
          }}>
            🔄
          </div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            margin: "0 0 12px",
            textAlign: "center"
          }}>
            Resume Setup?
          </h2>
          <p style={{
            fontSize: 15,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 28px",
            textAlign: "center",
            lineHeight: 1.6
          }}>
            You have a partially completed setup ({setupProgress}% done). Would you like to continue where you left off, or start fresh?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleContinueSetup}
              style={{
                padding: "18px 28px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(139, 69, 19, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Continue Setup
            </button>
            <button
              onClick={handleStartFresh}
              style={{
                padding: "18px 28px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8B4513";
                e.currentTarget.style.background = "rgba(139, 69, 19, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.background = "var(--cafe-bg-surface)";
              }}
            >
              Start Fresh
            </button>
            <button
              onClick={handleRestoreBackup}
              style={{
                padding: "16px 28px",
                background: "transparent",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                cursor: "pointer"
              }}
            >
              Restore from Backup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showLearnModal) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}>
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 20,
          padding: 40,
          maxWidth: 600,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)"
        }}>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            margin: "0 0 8px"
          }}>
            What You'll Configure
          </h2>
          <p style={{
            fontSize: 15,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 28px",
            lineHeight: 1.6
          }}>
            Setup takes 5–10 minutes and covers these essential areas:
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🏢", title: "Business Details", desc: "Cafe name, address, contact information" },
              { icon: "💳", title: "Payments", desc: "Payment methods, cash settings, tips" },
              { icon: "📊", title: "Taxes", desc: "Tax rates, tax categories, exemptions" },
              { icon: "📋", title: "Menu", desc: "Items, categories, prices, modifiers" },
              { icon: "🪑", title: "Tables", desc: "Floor plan, table numbers, seating" },
              { icon: "👥", title: "Staff", desc: "Team members, roles, permissions" },
              { icon: "👨‍🍳", title: "Kitchen", desc: "KDS setup, printer configuration" },
              { icon: "📦", title: "Inventory", desc: "Stock items, suppliers, low stock alerts" }
            ].map((item, index) => (
              <div key={index} style={{
                display: "flex",
                gap: 16,
                padding: 16,
                background: "var(--cafe-bg-surface)",
                borderRadius: 12,
                border: "1px solid var(--cafe-border-light)"
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "rgba(139, 69, 19, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    marginBottom: 4
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: "var(--cafe-text-secondary)"
                  }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowLearnModal(false)}
            style={{
              marginTop: 28,
              padding: "16px 32px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8B4513";
              e.currentTarget.style.background = "rgba(139, 69, 19, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-border)";
              e.currentTarget.style.background = "var(--cafe-bg-surface)";
            }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
        color: "var(--cafe-text)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background decorations */}
        <div style={{
          position: "absolute",
          top: "15%",
          right: "10%",
          width: 200,
          height: 200,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "5%",
          width: 150,
          height: 150,
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "50%",
          filter: "blur(50px)"
        }} />

        {/* Mobile Header */}
        <div style={{
          padding: "40px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 36,
            border: "1px solid rgba(255, 255, 255, 0.15)"
          }}>
            ☕
          </div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
            lineHeight: 1.2
          }}>
            Welcome to CafeOS
          </h1>
          <p style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.8)",
            margin: 0,
            lineHeight: 1.6
          }}>
            Let's prepare your cafe in just a few minutes.
          </p>
        </div>

        {/* Mobile Options */}
        <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>
          <button
            onClick={handleSetupCafe}
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 8px"
            }}>
              Begin Setup
            </h3>
            <p style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              lineHeight: 1.5
            }}>
              {hasPartialSetup
                ? `Resume your setup - ${setupProgress}% complete`
                : "Configure your cafe for production"}
            </p>
          </button>

          <button
            onClick={handleTryDemo}
            disabled={isLoading}
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              textAlign: "left",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              if (isLoading) return;
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 8px"
            }}>
              Try Demo
            </h3>
            <p style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              lineHeight: 1.5
            }}>
              Explore with sample data
            </p>
          </button>

          <button
            onClick={handleRestoreBackup}
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 8px"
            }}>
              Restore Backup
            </h3>
            <p style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              lineHeight: 1.5
            }}>
              Import existing configuration
            </p>
          </button>

          {/* Trust indicators */}
          <div style={{
            padding: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            {[
              "✓ Your data stays on this device",
              "✓ Setup automatically saves progress",
              "✓ You can change everything later"
            ].map((item, index) => (
              <div key={index} style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: index < 2 ? 8 : 0
              }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Footer */}
        <div style={{
          padding: "20px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.5)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
          zIndex: 1
        }}>
          <p style={{ margin: 0 }}>
            CafeOS v1.0.0 • Build 2024.07.27
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
      color: "var(--cafe-text)",
      display: "flex",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background decorations */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "20%",
        width: 400,
        height: 400,
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "50%",
        filter: "blur(100px)"
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%",
        left: "10%",
        width: 300,
        height: 300,
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "50%",
        filter: "blur(80px)"
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        background: "rgba(255, 255, 255, 0.01)",
        borderRadius: "50%",
        filter: "blur(120px)"
      }} />

      {/* Left Panel - Hero (45%) */}
      <div style={{
        width: "45%",
        padding: "80px 60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          fontSize: 48,
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
        }}>
          ☕
        </div>

        {/* Hero Text */}
        <h1 style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#fff",
          margin: "0 0 20px",
          letterSpacing: "-1.5px",
          lineHeight: 1.1
        }}>
          Welcome to CafeOS
        </h1>

        <p style={{
          fontSize: 18,
          color: "rgba(255, 255, 255, 0.85)",
          margin: "0 0 56px",
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          Let's prepare your cafe in just a few minutes.
        </p>

        {/* Setup Overview */}
        <div style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: 32,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          marginBottom: 40,
          animation: "fadeIn 0.6s ease-out 0.3s both"
        }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.7)",
            margin: "0 0 20px",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}>
            You'll Configure
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🏢", label: "Business Details" },
              { icon: "💳", label: "Payments" },
              { icon: "📊", label: "Taxes" },
              { icon: "🍽️", label: "Menu" },
              { icon: "🪑", label: "Tables" },
              { icon: "👥", label: "Staff" },
              { icon: "👨‍🍳", label: "Kitchen" },
              { icon: "📦", label: "Inventory" }
            ].map((item, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: 15,
                animation: `slideIn 0.4s ease-out ${0.4 + index * 0.05}s both`
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Setup */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: 15
        }}>
          <span style={{ fontSize: 20 }}>⏱️</span>
          <span>Estimated time: 5–10 minutes</span>
        </div>
      </div>

      {/* Right Panel - Actions (55%) */}
      <div style={{
        width: "55%",
        padding: "80px 60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ maxWidth: 560, width: "100%", margin: "0 auto" }}>
          {/* Primary Action */}
          <button
            onClick={handleSetupCafe}
            aria-label={hasPartialSetup ? `Resume your setup, ${setupProgress}% complete` : "Begin setting up your cafe"}
            style={{
              width: "100%",
              padding: "36px 48px",
              background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
              border: "none",
              borderRadius: 16,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 8px 32px rgba(139, 69, 19, 0.3)",
              outline: "none",
              animation: "scaleIn 0.6s ease-out 0.2s both",
              position: "relative",
              overflow: "hidden",
              marginBottom: 24
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(139, 69, 19, 0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(139, 69, 19, 0.3)";
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(139, 69, 19, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(139, 69, 19, 0.3)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(-1px) scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
            }}
          >
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              position: "relative",
              zIndex: 1
            }}>
              {hasPartialSetup ? `Resume Setup (${setupProgress}% done)` : "Begin Setup"}
            </div>
            {hasPartialSetup && (
              <div style={{
                marginTop: 14,
                height: 6,
                background: "rgba(255, 255, 255, 0.25)",
                borderRadius: 3,
                overflow: "hidden",
                position: "relative",
                zIndex: 1
              }}>
                <div style={{
                  width: `${setupProgress}%`,
                  height: "100%",
                  background: "#fff",
                  borderRadius: 3,
                  transition: "width 0.5s ease"
                }} />
              </div>
            )}
          </button>

          {/* Secondary Action */}
          <button
            onClick={() => setShowLearnModal(true)}
            aria-label="Learn what you'll configure during setup"
            style={{
              width: "100%",
              padding: "20px 28px",
              background: "transparent",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              marginTop: 24,
              outline: "none",
              animation: "fadeIn 0.6s ease-out 0.3s both"
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.8)",
              textDecoration: "underline",
              textDecorationColor: "rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease"
            }}>
              Learn What You'll Configure
            </div>
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "32px 0"
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
            <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
          </div>

          {/* Alternative Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleTryDemo}
              disabled={isLoading}
              aria-label="Try demo mode with sample data"
              style={{
                padding: "20px 24px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                textAlign: "left",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                outline: "none",
                animation: "fadeIn 0.6s ease-out 0.4s both"
              }}
              onFocus={(e) => {
                if (isLoading) return;
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
              onMouseEnter={(e) => {
                if (isLoading) return;
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateX(2px) scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateX(4px) scale(1)";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0
              }}>
                🎮
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 4
                }}>
                  Try Demo Mode
                </div>
                <div style={{
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.7)"
                }}>
                  Explore with sample data
                </div>
              </div>
              <span aria-hidden="true" style={{ fontSize: 18, color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }}>→</span>
            </button>

            <button
              onClick={handleRestoreBackup}
              aria-label="Restore existing backup"
              style={{
                padding: "20px 24px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                outline: "none",
                animation: "fadeIn 0.6s ease-out 0.5s both"
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateX(2px) scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateX(4px) scale(1)";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0
              }}>
                📥
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 4
                }}>
                  Restore Backup
                </div>
                <div style={{
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.7)"
                }}>
                  Import existing configuration
                </div>
              </div>
              <span aria-hidden="true" style={{ fontSize: 18, color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }}>→</span>
            </button>

            <button
              onClick={handleContactSupport}
              aria-label="Contact support for help"
              style={{
                padding: "20px 24px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                outline: "none",
                animation: "fadeIn 0.6s ease-out 0.6s both"
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateX(2px) scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateX(4px) scale(1)";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0
              }}>
                💬
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 4
                }}>
                  Contact Support
                </div>
                <div style={{
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.7)"
                }}>
                  Get help from our team
                </div>
              </div>
              <span aria-hidden="true" style={{ fontSize: 18, color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }}>→</span>
            </button>
          </div>

          {/* Trust Section */}
          <div style={{
            marginTop: 40,
            padding: 24,
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            {[
              "✓ Your data stays on this device",
              "✓ Setup automatically saves progress",
              "✓ You can change everything later",
              "✓ Nothing is final until you finish"
            ].map((item, index) => (
              <div key={index} style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.85)",
                marginBottom: index < 3 ? 10 : 0,
                lineHeight: 1.5
              }}>
                {item}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.4)",
            textAlign: "center"
          }}>
            <p style={{ margin: "0 0 4px" }}>
              CafeOS v1.0.0 • Build 2024.07.27
            </p>
            <p style={{ margin: 0 }}>
              © 2024 CafeOS. All rights reserved.
            </p>
            {/* Developer Access - Hidden */}
            <div ref={devMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowDevMenu(!showDevMenu)}
                style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)";
                }}
              >
                Dev Tools
              </button>
              
              {showDevMenu && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 8,
                  background: "rgba(0, 0, 0, 0.9)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: 8,
                  minWidth: 180,
                  zIndex: 1001
                }}>
                  <button
                    onClick={() => {
                      setShowDevMenu(false);
                      setShowClientOnboarding(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    🚀 Client Onboarding
                  </button>
                  <button
                    onClick={() => {
                      setShowDevMenu(false);
                      setShowRemoteAssistance(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    🔗 Remote Assistance
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Tools Modal */}
      {showClientOnboarding && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            width: "90%",
            maxWidth: 800,
            maxHeight: "90vh",
            background: "var(--cafe-bg)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <ClientOnboarding
              onComplete={() => {
                setShowClientOnboarding(false);
                if (onSetupStart) onSetupStart();
              }}
              onCancel={() => setShowClientOnboarding(false)}
            />
          </div>
        </div>
      )}

      {showRemoteAssistance && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            width: "90%",
            maxWidth: 600,
            maxHeight: "90vh",
            background: "var(--cafe-bg)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <RemoteAssistance
              onCancel={() => setShowRemoteAssistance(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


