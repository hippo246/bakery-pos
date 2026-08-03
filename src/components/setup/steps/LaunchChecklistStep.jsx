import React from 'react';
// Launch Checklist Step for Setup Wizard
// Final checklist before going live with premium finish experience

import { useState, useCallback } from "react";

// Animation keyframes
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const scaleIn = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const pulse = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const confetti = `
  @keyframes confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;

const checkmark = `
  @keyframes checkmark {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }
`;

export default function LaunchChecklistStep({ settings, onNext, onBack, onGoLive, isMobile, isLoading }) {
  const [showSuccess, setShowSuccess] = useState(false);

  const checklistItems = [
    { id: 'business', name: 'Business configured', status: settings?.cafeName ? "complete" : "incomplete", required: true, icon: '🏢' },
    { id: 'hours', name: 'Operating hours set', status: settings?.operatingHours ? "complete" : "incomplete", required: true, icon: '🕐' },
    { id: 'tables', name: 'Tables configured', status: settings?.tables && settings.tables.length > 0 ? "complete" : "incomplete", required: true, icon: '🪑' },
    { id: 'kitchen', name: 'Kitchen stations ready', status: settings?.kitchenStations && settings.kitchenStations.length > 0 ? "complete" : "incomplete", required: false, icon: '👨‍🍳' },
    { id: 'payments', name: 'Payment methods enabled', status: (settings?.cashEnabled || settings?.upiEnabled || settings?.cardEnabled) ? "complete" : "incomplete", required: true, icon: '💳' },
    { id: 'taxes', name: 'Taxes configured', status: "complete", required: true, icon: '📋' },
    { id: 'channels', name: 'Order sources enabled', status: (settings?.walkinEnabled || settings?.takeawayEnabled || settings?.deliveryEnabled) ? "complete" : "incomplete", required: false, icon: '📱' },
    { id: 'owner', name: 'Owner account configured', status: settings?.ownerName ? "complete" : "incomplete", required: true, icon: '👤' },
    { id: 'staff', name: 'Staff configured', status: "optional", required: false, icon: '👥' },
    { id: 'menu', name: 'Menu configured', status: "optional", required: false, icon: '📜' },
    { id: 'qr', name: 'QR ordering configured', status: settings?.qrEnabled ? "complete" : "optional", required: false, icon: '📱' },
    { id: 'stock', name: 'Stock configured', status: "optional", required: false, icon: '📦' }
  ];

  const requiredComplete = checklistItems.filter(item => item.required).every(item => item.status === "complete");
  const completedCount = checklistItems.filter(item => item.status === "complete").length;
  const totalCount = checklistItems.length;

  const handleGoLive = useCallback(() => {
    setShowSuccess(true);
    // Mark onboarding as complete
    const updatedSettings = {
      ...settings,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('[LaunchChecklist] Failed to persist settings:', e);
    }
    
    // Auto-redirect after delay
    setTimeout(() => {
      onGoLive();
    }, 3000);
  }, [settings, onGoLive]);

  if (showSuccess) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              background: ["#8B4513", "#A0522D", "#D2691E", "#DEB887", "#F5DEB3"][i % 5],
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: -20,
              animation: `confetti ${2 + Math.random() * 2}s ease-in-out ${i * 0.1}s infinite`
            }}
          />
        ))}

        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          marginBottom: 24,
          animation: "scaleIn 0.6s ease-out, pulse 2s ease-in-out 0.6s infinite",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          position: "relative",
              zIndex: 1
        }}>
          ✨
        </div>
        <h2 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          margin: "0 0 12px",
          textAlign: "center",
          animation: "fadeIn 0.6s ease-out 0.2s both",
          position: "relative",
          zIndex: 1
        }}>
          Your Café is Ready!
        </h2>
        <p style={{
          fontSize: 16,
          color: "rgba(255, 255, 255, 0.8)",
          margin: "0 0 32px",
          textAlign: "center",
          animation: "fadeIn 0.6s ease-out 0.3s both",
          position: "relative",
          zIndex: 1
        }}>
          CafeOS is now configured and ready for service.
        </p>
        
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 32,
          animation: "fadeIn 0.6s ease-out 0.4s both",
          position: "relative",
          zIndex: 1
        }}>
          {checklistItems.filter(item => item.required && item.status === "complete").map((item, index) => (
            <div key={item.id} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              animation: `fadeIn 0.4s ease-out ${0.5 + index * 0.1}s both`
            }}>
              <span style={{ 
                fontSize: 20, 
                color: "#10b981",
                animation: `scaleIn 0.3s ease-out ${0.5 + index * 0.1}s both`
              }}>✓</span>
              <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.9)" }}>{item.icon} {item.name}</span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 13,
          color: "rgba(255, 255, 255, 0.7)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "fadeIn 0.6s ease-out 0.8s both",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite"
          }} />
          Redirecting to Dashboard...
        </div>

        <style>{fadeIn}{scaleIn}{pulse}{confetti}{checkmark}{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "24px 32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 4px"
        }}>
          Ready to Launch
        </h2>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Review your setup before going live
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        {/* Progress Summary */}
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 32
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--cafe-accent)" }}>
                {completedCount}/{totalCount}
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                Setup items complete
              </div>
            </div>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `conic-gradient(var(--cafe-accent) ${(completedCount / totalCount) * 360}deg, var(--cafe-border) 0)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--cafe-bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--cafe-text-primary)"
              }}>
                {Math.round((completedCount / totalCount) * 100)}%
              </div>
            </div>
          </div>
          
          {!requiredComplete && (
            <div style={{
              padding: 12,
              background: "var(--cafe-danger-bg)",
              border: "1px solid var(--cafe-danger-border)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--cafe-danger)"
            }}>
              ⚠️ Complete all required items to launch
            </div>
          )}
        </div>

        {/* Required Items */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Required Items
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {checklistItems.filter(item => item.required).map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: idx < checklistItems.filter(i => i.required).length - 1 ? "1px solid var(--cafe-border-light)" : "none"
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: item.status === "complete" ? "var(--cafe-success-bg)" : "var(--cafe-bg-surface)",
                  border: item.status === "complete" ? "1px solid var(--cafe-success)" : "1px solid var(--cafe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}>
                  {item.status === "complete" ? "✓" : item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {item.name}
                  </div>
                </div>
                <span style={{
                  padding: "4px 12px",
                  background: item.status === "complete" ? "var(--cafe-success-bg)" : "var(--cafe-warning-bg)",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  color: item.status === "complete" ? "var(--cafe-success)" : "var(--cafe-warning)"
                }}>
                  {item.status === "complete" ? "Complete" : "Required"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Items */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Optional Items
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {checklistItems.filter(item => !item.required).map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: idx < checklistItems.filter(i => !i.required).length - 1 ? "1px solid var(--cafe-border-light)" : "none"
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: item.status === "complete" ? "var(--cafe-success-bg)" : "var(--cafe-bg-surface)",
                  border: item.status === "complete" ? "1px solid var(--cafe-success)" : "1px solid var(--cafe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}>
                  {item.status === "complete" ? "✓" : item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {item.name}
                  </div>
                </div>
                <span style={{
                  padding: "4px 12px",
                  background: "var(--cafe-bg-surface)",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  Optional
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        position: isMobile ? "sticky" : "relative",
        bottom: isMobile ? 0 : "auto"
      }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "12px 24px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleGoLive}
          disabled={!requiredComplete || isLoading}
          style={{
            padding: "16px 48px",
            background: requiredComplete ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            cursor: requiredComplete && !isLoading ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            opacity: requiredComplete ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (requiredComplete) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          🚀 Launch CafeOS
        </button>
      </div>
    </div>
  );
}
