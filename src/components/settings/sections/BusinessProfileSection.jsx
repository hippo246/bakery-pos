import React from 'react';
// Business Profile Section - Cafe Information with Live Receipt Preview
// Premium operational settings

import { useState, useCallback } from "react";

export default function BusinessProfileSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    cafeName: settings?.cafeName || "",
    legalName: settings?.legalName || "",
    address: settings?.address || "",
    city: settings?.city || "",
    state: settings?.state || "",
    country: settings?.country || "",
    postalCode: settings?.postalCode || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    gstin: settings?.gstin || "",
    fssaiNumber: settings?.fssaiNumber || "",
    website: settings?.website || "",
    instagram: settings?.instagram || "",
    facebook: settings?.facebook || "",
    whatsapp: settings?.whatsapp || ""
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const receiptPreview = {
    businessName: formData.cafeName || "Your Cafe",
    address: formData.address ? formData.address.split('\n')[0] : "",
    phone: formData.phone || "",
    gstin: formData.gstin || "",
    fssai: formData.fssaiNumber || ""
  };

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
          Business Profile
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Manage your cafe's business information and contact details
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
          {/* Form */}
          <div>
            {/* Basic Information */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Basic Information
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Cafe Name *
                  </label>
                  <input
                    type="text"
                    value={formData.cafeName}
                    onChange={(e) => handleChange('cafeName', e.target.value)}
                    placeholder="Enter cafe name"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    placeholder="Enter legal business name"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="City"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="State"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="Country"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="Postal code"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Contact Information
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@cafe.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://yourcafe.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div style={{
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Compliance
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      textTransform: "uppercase"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiNumber}
                    onChange={(e) => handleChange('fssaiNumber', e.target.value)}
                    placeholder="10012345678987"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              margin: "0 0 16px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Receipt Preview
            </h3>
            <div style={{
              background: "#fff",
              border: "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 24,
              fontFamily: "monospace",
              fontSize: 13,
              color: "#333",
              position: "sticky",
              top: 0
            }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {receiptPreview.businessName}
                </div>
                {receiptPreview.address && (
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                    {receiptPreview.address}
                  </div>
                )}
                {receiptPreview.phone && (
                  <div style={{ fontSize: 11, color: "#666" }}>
                    📞 {receiptPreview.phone}
                  </div>
                )}
              </div>
              
              <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Sample Item x 1</span>
                  <span>₹150.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Another Item x 2</span>
                  <span>₹200.00</span>
                </div>
              </div>

              <div style={{ height: 1, background: "#ddd", margin: "12px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
                <span>TOTAL</span>
                <span>₹350.00</span>
              </div>

              {receiptPreview.gstin && (
                <div style={{ marginTop: 16, fontSize: 10, color: "#666", textAlign: "center" }}>
                  GSTIN: {receiptPreview.gstin}
                </div>
              )}
              {receiptPreview.fssai && (
                <div style={{ marginTop: 4, fontSize: 10, color: "#666", textAlign: "center" }}>
                  FSSAI: {receiptPreview.fssai}
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 11, color: "#666", textAlign: "center" }}>
                Thank you for visiting!
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: 16,
              background: "var(--cafe-info-bg)",
              border: "1px solid var(--cafe-info-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--cafe-info)"
            }}>
              <strong>💡 Tip:</strong> This preview shows how your business information will appear on customer receipts. Changes update instantly.
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
        justifyContent: "flex-end"
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
