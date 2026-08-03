import React from 'react';
// Welcome Step for Setup Wizard
// Introduction to the setup process

import { card, btn } from "../../../styles/theme";

export default function WelcomeStep({ onNext, stepIndex: _stepIndex, totalSteps: _totalSteps }) {
  return (
    <div style={{ padding: "32px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "var(--cafe-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 40
        }}>
          🏪
        </div>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 16px"
        }}>
          Let's Set Up Your Cafe
        </h2>
        <p style={{
          fontSize: 16,
          color: "var(--cafe-text-secondary)",
          margin: 0,
          lineHeight: 1.6,
          maxWidth: 500,
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          We'll guide you through configuring CafeOS for your business. This should take about 10-15 minutes.
        </p>
      </div>

      <div style={{ ...card, padding: 24, marginBottom: 24 }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--cafe-text-secondary)",
          margin: "0 0 16px"
        }}>
          What We'll Set Up
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Business details</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Branch configuration</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Owner/admin access</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Staff & roles</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Menu basics</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Payment methods</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Receipts & printers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>QR ordering</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Stock basics</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--cafe-success)" }}>✓</span>
            <span style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>Security review</span>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 24, marginBottom: 32 }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--cafe-text-secondary)",
          margin: "0 0 16px"
        }}>
          Tips for a Smooth Setup
        </h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>Have your business registration details ready (GST, FSSAI if applicable)</li>
          <li style={{ marginBottom: 8 }}>Know your cafe's address and contact information</li>
          <li style={{ marginBottom: 8 }}>Decide on your initial menu items and pricing</li>
          <li style={{ marginBottom: 8 }}>Have your printer model information if you have one</li>
          <li>Optional steps can be skipped and completed later</li>
        </ul>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onNext} style={{ ...btn("primary"), fontSize: 14, padding: "12px 32px" }}>
          Get Started
        </button>
      </div>
    </div>
  );
}
