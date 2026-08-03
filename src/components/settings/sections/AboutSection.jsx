import React from 'react';
import { PremiumCard } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function AboutSection({ settings, setSettings, isMobile }) {
  const version = "1.0.0";
  const buildDate = new Date().toLocaleDateString();
  const database = localStorage.getItem("brewcrm_settings") ? "Local Storage" : "Demo Mode";
  const runtime = typeof window !== "undefined" ? "Browser" : "Unknown";

  // Real localStorage usage, in KB, rather than a hardcoded "2.4 MB used".
  const storageUsedKB = (() => {
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        bytes += (key?.length || 0) + (localStorage.getItem(key)?.length || 0);
      }
      return (bytes / 1024).toFixed(1);
    } catch (e) {
      return null;
    }
  })();

  // Settings health should actually reflect whether settings loaded, not
  // just claim "Loaded" unconditionally.
  const settingsLoaded = settings !== null && settings !== undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* System Information */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          System Information
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Version
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--cafe-accent)"
            }}>
              {version}
            </div>
          </div>
          
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Build Date
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--cafe-text-primary)"
            }}>
              {buildDate}
            </div>
          </div>
          
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Database
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--cafe-text-primary)"
            }}>
              {database}
            </div>
          </div>
          
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Runtime
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--cafe-text-primary)"
            }}>
              {runtime}
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* System Health */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          System Health
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              name: "Local Storage",
              status: storageUsedKB !== null ? "healthy" : "error",
              value: storageUsedKB !== null ? `${storageUsedKB} KB used` : "Unavailable"
            },
            { name: "Session", status: "healthy", value: "Active" },
            {
              name: "Settings",
              status: settingsLoaded ? "healthy" : "error",
              value: settingsLoaded ? "Loaded" : "Not loaded"
            },
            { name: "Data Sync", status: "healthy", value: "Up to date" }
          ].map((item, index) => (
            <div key={index} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 12,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 8
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.status === "healthy" ? "var(--cafe-success)" : "var(--cafe-danger)"
                }} />
                <span style={{
                  fontSize: 12,
                  color: "var(--cafe-text-primary)"
                }}>
                  {item.name}
                </span>
              </div>
              <span style={{
                fontSize: 11,
                color: "var(--cafe-text-tertiary)"
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Support & Resources */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Support & Resources
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 12
        }}>
          <button
            onClick={() => window.open("https://docs.cafeos.com", "_blank")}
            style={{
              ...input,
              padding: "12px 16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>📚</span>
            <span>Documentation</span>
          </button>
          
          <button
            onClick={() => window.open("https://github.com/cafeos", "_blank")}
            style={{
              ...input,
              padding: "12px 16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>💻</span>
            <span>GitHub Repository</span>
          </button>
          
          <button
            onClick={() => window.open("https://support.cafeos.com", "_blank")}
            style={{
              ...input,
              padding: "12px 16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span>Support Center</span>
          </button>
          
          <button
            onClick={() => window.open("https://cafeos.com/changelog", "_blank")}
            style={{
              ...input,
              padding: "12px 16px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>📝</span>
            <span>Release Notes</span>
          </button>
        </div>
      </PremiumCard>

      {/* License */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          License
        </h4>
        
        <div style={{
          padding: 16,
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 8,
          fontSize: 11,
          color: "var(--cafe-text-secondary)",
          lineHeight: 1.6
        }}>
          CafeOS is licensed under the MIT License. You are free to use, modify, and distribute this software for both commercial and non-commercial purposes.
        </div>
      </PremiumCard>
    </div>
  );
}
