import React from 'react';
// About Settings Section - Version, License, Credits, and System Information
// Premium about page

import { useState, useCallback } from "react";

export default function AboutSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData] = useState({
    version: "1.0.0",
    buildNumber: "2024.07.26.001",
    databaseVersion: "1.0.0",
    license: "Commercial",
    licenseKey: "CAF-2024-PRO-001"
  });

  const systemInfo = {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    deviceMemory: navigator.deviceMemory || "Unknown",
    cores: navigator.hardwareConcurrency || "Unknown",
    connection: navigator.connection?.effectiveType || "Unknown"
  };

  const credits = [
    { name: "CafeOS Team", role: "Development" },
    { name: "Design Studio", role: "UI/UX Design" },
    { name: "Quality Assurance", role: "Testing" },
    { name: "Customer Success", role: "Support" }
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          About CafeOS
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Version information, license, and system details
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Version Information */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Version Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 24
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32
              }}>
                ☕
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                  CafeOS
                </div>
                <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>
                  Premium Cafe Management System
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Version
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.version}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Build Number
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.buildNumber}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Database Version
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.databaseVersion}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Release Date
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  July 26, 2024
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* License Information */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            License Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  License Type
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.license}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  License Key
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.licenseKey}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Credits
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {credits.map((credit, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: "var(--cafe-bg-surface)",
                    borderRadius: 8
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {credit.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    {credit.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            System Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Platform
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.platform}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Language
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.language}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Screen Resolution
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.screen}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Viewport Size
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.viewport}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Device Memory
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.deviceMemory} GB
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  CPU Cores
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.cores}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Connection Type
                </div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {systemInfo.connection}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Online Status
                </div>
                <div style={{ fontSize: 13, color: systemInfo.onLine ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                  {systemInfo.onLine ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
          © 2024 CafeOS. All rights reserved.
        </div>
        <a
          href="https://cafeos.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: "var(--cafe-accent)",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          cafeos.com
        </a>
      </div>
    </div>
  );
}
