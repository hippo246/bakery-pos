import React from 'react';
// Branch Details Step for Setup Wizard
// Configures branch/location information with premium UX

import { useState, useCallback } from "react";
import Tooltip from "../Tooltip.jsx";

const BRANCH_TYPES = [
  { id: 'main', name: 'Main Branch', icon: '🏢', description: 'Primary business location' },
  { id: 'kiosk', name: 'Kiosk', icon: '🛒', description: 'Self-service kiosk' },
  { id: 'drive_thru', name: 'Drive-Thru', icon: '🚗', description: 'Drive-through service' },
  { id: 'delivery_hub', name: 'Delivery Hub', icon: '📦', description: 'Delivery center' },
  { id: 'satellite', name: 'Satellite', icon: '📍', description: 'Secondary location' }
];

const CAPACITY_RANGES = [
  { id: 'small', name: 'Small (1-20 seats)', min: 1, max: 20 },
  { id: 'medium', name: 'Medium (21-50 seats)', min: 21, max: 50 },
  { id: 'large', name: 'Large (51-100 seats)', min: 51, max: 100 },
  { id: 'xlarge', name: 'Extra Large (100+ seats)', min: 101, max: 999 }
];

export default function BranchDetailsStep({ settings, onNext, onBack, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [formData, setFormData] = useState({
    branchName: settings?.defaultBranch || 'Main Branch',
    branchCode: settings?.branchCode || 'BR001',
    branchType: settings?.branchType || 'main',
    branchAddress: settings?.address || '',
    branchCity: settings?.city || '',
    branchState: settings?.state || '',
    branchPostalCode: settings?.postcode || '',
    branchCountry: settings?.country || 'IN',
    branchPhone: settings?.phone || '',
    branchEmail: settings?.email || '',
    branchManager: settings?.branchManager || '',
    managerPhone: settings?.managerPhone || '',
    managerEmail: settings?.managerEmail || '',
    operatingHours: settings?.operatingHours || '9:00 AM - 9:00 PM',
    capacity: settings?.capacity || 'medium',
    seatingCapacity: settings?.seatingCapacity || 30,
    hasOutdoorSeating: settings?.hasOutdoorSeating || false,
    outdoorCapacity: settings?.outdoorCapacity || 0,
    hasDelivery: settings?.hasDelivery || false,
    hasTakeaway: settings?.hasTakeaway || false,
    hasDineIn: settings?.hasDineIn || true,
    googleMapsLink: settings?.googleMapsLink || '',
    notes: settings?.branchNotes || ''
  });

  const [validation, setValidation] = useState({});
  const [showHelp, setShowHelp] = useState({});

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    if ((field === 'branchPhone' || field === 'managerPhone') && value.length > 0) {
      const phoneRegex = /^[+]?[\d\s-]{10,}$/;
      setValidation(prev => ({
        ...prev,
        [field]: phoneRegex.test(value) ? { status: 'valid', message: 'Valid number' } : { status: 'warning', message: 'Invalid format' }
      }));
    } else if (field === 'branchPhone' || field === 'managerPhone') {
      setValidation(prev => ({ ...prev, [field]: undefined }));
    }
    
    if ((field === 'branchEmail' || field === 'managerEmail') && value.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidation(prev => ({
        ...prev,
        [field]: emailRegex.test(value) ? { status: 'valid', message: 'Valid email' } : { status: 'warning', message: 'Invalid email' }
      }));
    } else if (field === 'branchEmail' || field === 'managerEmail') {
      setValidation(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear the required-field warning as soon as the user starts fixing it
    if ((field === 'branchName' || field === 'branchCode') && value.trim().length > 0) {
      setValidation(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleNext = useCallback(() => {
    // Validate required fields
    const errors = [];
    const fieldValidation = {};
    if (!formData.branchName || formData.branchName.trim() === '') {
      errors.push({ field: 'branchName', message: 'Branch name is required' });
      fieldValidation.branchName = { status: 'warning', message: 'Branch name is required' };
    }
    if (!formData.branchCode || formData.branchCode.trim() === '') {
      errors.push({ field: 'branchCode', message: 'Branch code is required' });
      fieldValidation.branchCode = { status: 'warning', message: 'Branch code is required' };
    }
    
    if (errors.length > 0) {
      setValidation(prev => ({ ...prev, ...fieldValidation }));
      setError({
        title: 'Please fix the following issues',
        message: 'Some required fields are missing or invalid.',
        errors
      });
      return;
    }

    const updatedSettings = {
      ...settings,
      defaultBranch: formData.branchName,
      branchCode: formData.branchCode,
      branchType: formData.branchType,
      address: formData.branchAddress,
      city: formData.branchCity,
      state: formData.branchState,
      postcode: formData.branchPostalCode,
      country: formData.branchCountry,
      phone: formData.branchPhone,
      email: formData.branchEmail,
      branchManager: formData.branchManager,
      managerPhone: formData.managerPhone,
      managerEmail: formData.managerEmail,
      operatingHours: formData.operatingHours,
      capacity: formData.capacity,
      seatingCapacity: formData.seatingCapacity,
      hasOutdoorSeating: formData.hasOutdoorSeating,
      outdoorCapacity: formData.outdoorCapacity,
      hasDelivery: formData.hasDelivery,
      hasTakeaway: formData.hasTakeaway,
      hasDineIn: formData.hasDineIn,
      googleMapsLink: formData.googleMapsLink,
      branchNotes: formData.notes
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // localStorage can fail (private browsing, storage quota, sandboxed iframe);
      // don't block the user's progress on a persistence failure.
      setError({
        title: 'Could not save locally',
        message: 'Your progress will still continue, but settings were not cached on this device.',
        errors: []
      });
    }
    onNext(formData);
  }, [formData, settings, onNext, setError]);

  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const renderValidationIcon = (field) => {
    const v = validation[field];
    if (!v) return null;
    if (v.status === 'valid') return <span style={{ color: '#10b981', marginLeft: 8 }}>✓</span>;
    if (v.status === 'warning') return <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠</span>;
    return null;
  };

  const renderFieldCard = (title, icon, children, helpText) => (
    <div style={{
      background: "var(--cafe-bg-surface)",
      border: "1px solid var(--cafe-border-light)",
      borderRadius: isMobile ? 12 : 16,
      padding: isMobile ? 16 : 24,
      marginBottom: isMobile ? 16 : 20
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: isMobile ? 20 : 24 }}>{icon}</span>
          <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            {title}
          </h3>
        </div>
        {helpText && (
          <button
            onClick={() => toggleHelp(title)}
            style={{
              padding: "6px 10px",
              background: "var(--cafe-accent-bg)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-accent)",
              cursor: "pointer"
            }}
          >
            ?
          </button>
        )}
      </div>
      {showHelp[title] && helpText && (
        <div style={{
          padding: 12,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: "var(--cafe-info)"
        }}>
          {helpText}
        </div>
      )}
      {children}
    </div>
  );

  const renderInput = (label, field, placeholder, type = "text", required = false, helpText, options = {}) => {
    const { tooltip, transform, autoComplete, min, onBlurNormalize } = options;
    const inputId = `branch-${field}`;
    return (
    <div style={{ marginBottom: isMobile ? 12 : 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 6 : 8 }}>
        <label htmlFor={inputId} style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "var(--cafe-text-secondary)", display: "flex", alignItems: "center" }}>
          {label} {required && <span style={{ color: "var(--cafe-danger)" }}>*</span>}
          {tooltip && <Tooltip content={tooltip} position="top" />}
        </label>
        {renderValidationIcon(field)}
      </div>
      <input
        id={inputId}
        type={type}
        min={min}
        autoComplete={autoComplete}
        value={formData[field]}
        onChange={(e) => handleChange(field, transform ? transform(e.target.value) : e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: isMobile ? "12px 14px" : "14px 16px",
          fontSize: isMobile ? 14 : 15,
          border: validation[field]?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
          borderRadius: isMobile ? 8 : 10,
          background: "var(--cafe-bg)",
          color: "var(--cafe-text-primary)",
          outline: "none",
          transition: "all 0.2s ease"
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--cafe-accent)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = validation[field]?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
          e.currentTarget.style.boxShadow = "none";
          if (onBlurNormalize) {
            const normalized = onBlurNormalize(e.target.value);
            if (normalized !== e.target.value) handleChange(field, normalized);
          }
        }}
      />
      {validation[field]?.message && (
        <div style={{ fontSize: 12, color: validation[field].status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
          {validation[field].message}
        </div>
      )}
      {helpText && (
        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 6 }}>
          {helpText}
        </div>
      )}
    </div>
    );
  };

  const selectedCapacityRange = CAPACITY_RANGES.find(r => r.id === formData.capacity);
  const capacityMismatch = selectedCapacityRange && (
    formData.seatingCapacity < selectedCapacityRange.min || formData.seatingCapacity > selectedCapacityRange.max
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Branch Details
        </h3>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)" }}>
          Configure your branch location, contact information, and service options.
        </p>
      </div>

      {/* Branch Identity */}
      {renderFieldCard('Branch Identity', '🏢', (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
            {renderInput('Branch Name', 'branchName', 'e.g., Main Branch', 'text', true, null, {
              tooltip: 'The display name for this branch location. This will appear on receipts, invoices, and internal reports.',
              autoComplete: 'off'
            })}
            {renderInput('Branch Code', 'branchCode', 'e.g., BR001', 'text', true, null, {
              tooltip: 'A unique identifier for this branch. Used for data separation and multi-location management. Cannot be changed easily later.',
              transform: (v) => v.toUpperCase()
            })}
          </div>
          <div>
            <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 10 : 12, display: "block" }}>
              Branch Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 12 }}>
              {BRANCH_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleChange('branchType', type.id)}
                  aria-pressed={formData.branchType === type.id}
                  style={{
                    padding: isMobile ? "12px" : "16px",
                    border: formData.branchType === type.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: isMobile ? 8 : 10,
                    background: formData.branchType === type.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: isMobile ? 18 : 20, marginBottom: isMobile ? 6 : 8 }}>{type.icon}</div>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    {type.name}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-text-secondary)" }}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ))}

      {/* Location Details */}
      {renderFieldCard('Location Details', '📍', (
        <>
          {renderInput('Street Address', 'branchAddress', '123 Main Street', 'text', false, null, { autoComplete: 'street-address' })}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
            {renderInput('City', 'branchCity', 'Mumbai', 'text', false, null, { autoComplete: 'address-level2' })}
            {renderInput('State', 'branchState', 'Maharashtra', 'text', false, null, { autoComplete: 'address-level1' })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16 }}>
            {renderInput('Postal Code', 'branchPostalCode', '400001', 'text', false, null, { autoComplete: 'postal-code' })}
            {renderInput('Country', 'branchCountry', 'India', 'text', false, null, { autoComplete: 'country-name' })}
            {renderInput('Google Maps Link', 'googleMapsLink', 'https://maps.google.com/...', 'url', false, null, {
              onBlurNormalize: (v) => {
                const trimmed = v.trim();
                return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
              }
            })}
          </div>
        </>
      ))}

      {/* Contact Information */}
      {renderFieldCard('Contact Information', '📞', (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
          {renderInput('Branch Phone', 'branchPhone', '+91 9876543210', 'tel', false, null, { autoComplete: 'tel' })}
          {renderInput('Branch Email', 'branchEmail', 'branch@yourcafe.com', 'email', false, null, { autoComplete: 'email' })}
        </div>
      ))}

      {/* Branch Manager */}
      {renderFieldCard('Branch Manager', '👤', (
        <>
          {renderInput('Manager Name', 'branchManager', 'John Doe', 'text', false, null, { autoComplete: 'name' })}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
            {renderInput('Manager Phone', 'managerPhone', '+91 9876543210', 'tel', false, null, { autoComplete: 'tel' })}
            {renderInput('Manager Email', 'managerEmail', 'manager@yourcafe.com', 'email', false, null, { autoComplete: 'email' })}
          </div>
        </>
      ))}

      {/* Operating Hours */}
      {renderFieldCard('Operating Hours', '⏰', (
        renderInput('Standard Hours', 'operatingHours', '9:00 AM - 9:00 PM')
      ))}

      {/* Capacity & Services */}
      {renderFieldCard('Capacity & Services', '🪑', (
        <>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16 }}>
          <div>
            <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 6 : 8, display: "block" }}>
              Capacity Range
            </label>
            <select
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? 14 : 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: isMobile ? 8 : 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            >
              {CAPACITY_RANGES.map(range => (
                <option key={range.id} value={range.id}>{range.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 6 : 8, display: "block" }}>
              Seating Capacity
            </label>
            <input
              type="number"
              min={0}
              value={formData.seatingCapacity}
              onChange={(e) => handleChange('seatingCapacity', parseInt(e.target.value) || 0)}
              placeholder="30"
              style={{
                width: "100%",
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? 14 : 15,
                border: capacityMismatch ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                borderRadius: isMobile ? 8 : 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
            {capacityMismatch && (
              <div style={{ fontSize: isMobile ? 11 : 12, color: "#f59e0b", marginTop: 6 }}>
                Doesn't match the "{selectedCapacityRange.name}" range ({selectedCapacityRange.min}-{selectedCapacityRange.max === 999 ? '100+' : selectedCapacityRange.max})
              </div>
            )}
          </div>
        </div>
        <div style={{ marginBottom: isMobile ? 12 : 16 }}>
          <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 10 : 12, display: "block" }}>
            Service Types
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 10 : 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.hasDineIn}
                onChange={(e) => handleChange('hasDineIn', e.target.checked)}
                style={{ width: isMobile ? 16 : 18, height: isMobile ? 16 : 18 }}
              />
              <span style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-primary)" }}>Dine-In</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.hasTakeaway}
                onChange={(e) => handleChange('hasTakeaway', e.target.checked)}
                style={{ width: isMobile ? 16 : 18, height: isMobile ? 16 : 18 }}
              />
              <span style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-primary)" }}>Takeaway</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.hasDelivery}
                onChange={(e) => handleChange('hasDelivery', e.target.checked)}
                style={{ width: isMobile ? 16 : 18, height: isMobile ? 16 : 18 }}
              />
              <span style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-primary)" }}>Delivery</span>
            </label>
          </div>
        </div>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: isMobile ? 6 : 8 }}>
            <input
              type="checkbox"
              checked={formData.hasOutdoorSeating}
              onChange={(e) => handleChange('hasOutdoorSeating', e.target.checked)}
              style={{ width: isMobile ? 16 : 18, height: isMobile ? 16 : 18 }}
            />
            <span style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-primary)" }}>Has Outdoor Seating</span>
          </label>
          {formData.hasOutdoorSeating && (
            <input
              type="number"
              min={0}
              value={formData.outdoorCapacity}
              onChange={(e) => handleChange('outdoorCapacity', parseInt(e.target.value) || 0)}
              placeholder="10"
              style={{
                width: "100%",
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? 14 : 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: isMobile ? 8 : 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none",
                marginTop: isMobile ? 6 : 8
              }}
            />
          )}
        </div>
        </>
      ))}

      {/* Notes */}
      {renderFieldCard('Additional Notes', '📝', (
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any additional information about this branch..."
          rows={3}
          style={{
            width: "100%",
            padding: isMobile ? "12px 14px" : "14px 16px",
            fontSize: isMobile ? 14 : 15,
            border: "1px solid var(--cafe-border)",
            borderRadius: isMobile ? 8 : 10,
            background: "var(--cafe-bg)",
            color: "var(--cafe-text-primary)",
            outline: "none",
            resize: "vertical"
          }}
        />
      ))}

      {/* Branch Preview */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? 16 : 24,
        marginBottom: isMobile ? 20 : 24
      }}>
        <h4 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: isMobile ? 12 : 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span>
          Branch Preview
        </h4>
        <div style={{
          background: "#fff",
          borderRadius: isMobile ? 10 : 12,
          padding: isMobile ? 16 : 24,
          color: "#000"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16 }}>
            <div style={{
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              borderRadius: isMobile ? 10 : 12,
              background: "var(--cafe-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? 24 : 28,
              color: "#fff"
            }}>
              {BRANCH_TYPES.find(t => t.id === formData.branchType)?.icon || '🏢'}
            </div>
            <div>
              <h4 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {formData.branchName || 'Branch Name'}
              </h4>
              <p style={{ fontSize: 14, color: "#666", margin: "4px 0 0" }}>
                {formData.branchCode || 'BR001'} • {BRANCH_TYPES.find(t => t.id === formData.branchType)?.name || 'Main Branch'}
              </p>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            📍 {formData.branchAddress || 'Address not set'}
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            📞 {formData.branchPhone || 'Phone not set'}
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            ✉️ {formData.branchEmail || 'Email not set'}
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            ⏰ {formData.operatingHours}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {formData.hasDineIn && <span style={{ padding: "4px 12px", background: "#10b98120", color: "#10b981", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Dine-In</span>}
            {formData.hasTakeaway && <span style={{ padding: "4px 12px", background: "#f59e0b20", color: "#f59e0b", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Takeaway</span>}
            {formData.hasDelivery && <span style={{ padding: "4px 12px", background: "#3b82f620", color: "#3b82f6", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Delivery</span>}
            {formData.hasOutdoorSeating && <span style={{ padding: "4px 12px", background: "#8b5cf620", color: "#8b5cf6", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Outdoor: {formData.outdoorCapacity}</span>}
          </div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 12 }}>
            🪑 Capacity: {formData.seatingCapacity} seats
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
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
            transition: "all 0.2s ease"
          }}
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
            transition: "all 0.3s ease"
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
