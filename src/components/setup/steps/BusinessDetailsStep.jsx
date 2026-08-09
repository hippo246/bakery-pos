import React from 'react';
// Premium Business Setup Wizard
// Multi-step guided workflow for business configuration

import { useState, useCallback, useEffect, useRef } from "react";

const BUSINESS_TYPES = [
  { id: 'coffee_shop', name: 'Coffee Shop', icon: '☕' },
  { id: 'cafe', name: 'Cafe', icon: '🏪' },
  { id: 'bakery', name: 'Bakery', icon: '🥐' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'bubble_tea', name: 'Bubble Tea', icon: '🧋' },
  { id: 'custom', name: 'Custom', icon: '✨' }
];

const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' },
  { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', timezone: 'Europe/London', dateFormat: 'DD/MM/YYYY' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'د.إ', timezone: 'Asia/Dubai', dateFormat: 'DD/MM/YYYY' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$', timezone: 'Australia/Sydney', dateFormat: 'DD/MM/YYYY' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$', timezone: 'America/Toronto', dateFormat: 'YYYY-MM-DD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$', timezone: 'Asia/Singapore', dateFormat: 'DD/MM/YYYY' },
  { code: 'EU', name: 'European Union', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Paris', dateFormat: 'DD/MM/YYYY' },
  { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥', timezone: 'Asia/Tokyo', dateFormat: 'YYYY/MM/DD' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', currencySymbol: 'RM', timezone: 'Asia/Kuala_Lumpur', dateFormat: 'DD/MM/YYYY' }
];

const TIMEZONES = [
  { id: 'Asia/Kolkata', name: 'India (IST)', offset: '+5:30' },
  { id: 'America/New_York', name: 'Eastern Time (ET)', offset: '-5:00' },
  { id: 'America/Chicago', name: 'Central Time (CT)', offset: '-6:00' },
  { id: 'America/Denver', name: 'Mountain Time (MT)', offset: '-7:00' },
  { id: 'America/Los_Angeles', name: 'Pacific Time (PT)', offset: '-8:00' },
  { id: 'Europe/London', name: 'London (GMT)', offset: '+0:00' },
  { id: 'Europe/Paris', name: 'Central European (CET)', offset: '+1:00' },
  { id: 'Asia/Dubai', name: 'Dubai (GST)', offset: '+4:00' },
  { id: 'Asia/Singapore', name: 'Singapore (SGT)', offset: '+8:00' },
  { id: 'Asia/Tokyo', name: 'Japan (JST)', offset: '+9:00' },
  { id: 'Australia/Sydney', name: 'Sydney (AEDT)', offset: '+11:00' },
  { id: 'Asia/Kuala_Lumpur', name: 'Kuala Lumpur (MYT)', offset: '+8:00' }
];

const TAX_MODES = [
  { id: 'inclusive', name: 'Inclusive', description: 'Tax included in prices' },
  { id: 'exclusive', name: 'Exclusive', description: 'Tax added at checkout' }
];

// Loose but real per-country postal/zip code formats, used for inline validation
// and to give the postal code field a sensible example placeholder.
const POSTAL_CODE_PATTERNS = {
  IN: { regex: /^[1-9][0-9]{5}$/, example: '400001' },
  US: { regex: /^\d{5}(-\d{4})?$/, example: '10001' },
  GB: { regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/, example: 'SW1A 1AA' },
  AE: { regex: null, example: '' }, // UAE has no standard postal code system
  AU: { regex: /^\d{4}$/, example: '2000' },
  CA: { regex: /^[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d$/, example: 'M5V 2T6' },
  SG: { regex: /^\d{6}$/, example: '049483' },
  EU: { regex: null, example: '' }, // varies by member state
  JP: { regex: /^\d{3}-?\d{4}$/, example: '100-0001' },
  MY: { regex: /^\d{5}$/, example: '50450' }
};

const URL_REGEX = /^https?:\/\/[^\s]+\.[^\s]+$/i;

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Purple', value: '#8b5cf6' }
];

const inputStyle = (isMobile) => ({
  width: "100%",
  padding: isMobile ? "12px 16px" : "16px 20px",
  fontSize: isMobile ? 14 : 15,
  border: "1px solid var(--cafe-border)",
  borderRadius: isMobile ? 8 : 12,
  background: "var(--cafe-bg-surface)",
  color: "var(--cafe-text-primary)",
  outline: "none"
});

const labelStyle = (isMobile) => ({ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 6 : 8, display: "block" });

const smallInputStyle = (isMobile) => ({
  width: "100%",
  padding: isMobile ? "10px 14px" : "14px 16px",
  fontSize: isMobile ? 13 : 14,
  border: "1px solid var(--cafe-border)",
  borderRadius: isMobile ? 6 : 10,
  background: "var(--cafe-bg-surface)",
  color: "var(--cafe-text-primary)",
  outline: "none"
});

const smallLabelStyle = (isMobile) => ({ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "var(--cafe-text-tertiary)", marginBottom: isMobile ? 4 : 6, display: "block" });

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, matches the "up to 2MB" hint shown to users

export default function BusinessDetailsStep({ settings, onNext, onBack, stepIndex, totalSteps, isMobile, isLoading, error, setError }) {
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [formData, setFormData] = useState({
    // Business Identity
    cafeName: settings?.cafeName || '',
    legalName: settings?.legalName || '',
    tagline: settings?.tagline || '',
    businessType: settings?.businessType || 'cafe',
    logo: settings?.logo || null,
    
    // Location
    address: settings?.address || '',
    city: settings?.city || '',
    state: settings?.state || '',
    country: settings?.country || 'IN',
    postalCode: settings?.postcode || '',
    googleMapsLink: settings?.googleMapsLink || '',
    timezone: settings?.timezone || 'Asia/Kolkata',
    currency: settings?.currency || 'INR',
    currencySymbol: settings?.currencySymbol || '₹',
    language: settings?.language || 'en',
    
    // Legal
    gstin: settings?.gstin || '',
    fssaiNumber: settings?.fssaiNumber || '',
    businessRegistration: settings?.businessRegistration || '',
    taxMode: settings?.taxMode || 'inclusive',
    
    // Contact
    phone: settings?.phone || '',
    email: settings?.email || '',
    website: settings?.website || '',
    instagram: settings?.instagram || '',
    facebook: settings?.facebook || '',
    whatsapp: settings?.whatsapp || '',
    
    // Branding
    accentColor: settings?.accentColor || '#6366f1',
    receiptStyle: settings?.receiptStyle || 'modern',
    theme: settings?.theme || 'light'
  });

  const [validation, setValidation] = useState({});
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  const SUB_STEPS = [
    { id: 'identity', name: 'Business Identity', icon: '🏢' },
    { id: 'location', name: 'Location', icon: '📍' },
    { id: 'legal', name: 'Legal Information', icon: '📋' },
    { id: 'contact', name: 'Contact Details', icon: '📞' },
    { id: 'branding', name: 'Branding', icon: '🎨' }
  ];

  // Auto-complete currency/timezone when the user changes country.
  // Skip on first mount so previously saved settings (which may have
  // custom currency/timezone) aren't silently overwritten on load.
  // Also skip re-applying a field the user has manually edited since the
  // last auto-fill, so picking a country twice doesn't wipe out a
  // deliberate override (e.g. IST timezone with USD pricing).
  const isFirstRender = useRef(true);
  const lastAutoAppliedRef = useRef({
    currency: formData.currency,
    currencySymbol: formData.currencySymbol,
    timezone: formData.timezone
  });
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const countryData = COUNTRIES.find(c => c.code === formData.country);
    if (!countryData) return;

    const currencyUntouched = formData.currency === lastAutoAppliedRef.current.currency;
    const timezoneUntouched = formData.timezone === lastAutoAppliedRef.current.timezone;
    if (!currencyUntouched && !timezoneUntouched) return; // both customized, leave as-is

    setFormData(prev => ({
      ...prev,
      ...(currencyUntouched ? { currency: countryData.currency, currencySymbol: countryData.currencySymbol } : {}),
      ...(timezoneUntouched ? { timezone: countryData.timezone } : {})
    }));

    lastAutoAppliedRef.current = {
      currency: currencyUntouched ? countryData.currency : formData.currency,
      currencySymbol: currencyUntouched ? countryData.currencySymbol : formData.currencySymbol,
      timezone: timezoneUntouched ? countryData.timezone : formData.timezone
    };
  }, [formData.country]);

  // Real-time validation
  useEffect(() => {
    const newValidation = {};
    
    // Cafe name validation
    if (formData.cafeName.length > 0) {
      if (formData.cafeName.length < 2) {
        newValidation.cafeName = { status: 'warning', message: 'Too short' };
      } else {
        newValidation.cafeName = { status: 'valid', message: 'Looks good' };
      }
    }
    
    // Phone validation
    if (formData.phone.length > 0) {
      const phoneRegex = /^[+]?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newValidation.phone = { status: 'warning', message: 'Invalid format' };
      } else {
        newValidation.phone = { status: 'valid', message: 'Valid number' };
      }
    }
    
    // Email validation
    if (formData.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newValidation.email = { status: 'warning', message: 'Invalid email' };
      } else {
        newValidation.email = { status: 'valid', message: 'Valid email' };
      }
    }
    
    // GSTIN validation
    if (formData.gstin.length > 0) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin)) {
        newValidation.gstin = { status: 'warning', message: 'Invalid GSTIN format' };
      } else {
        newValidation.gstin = { status: 'valid', message: 'Valid GSTIN' };
      }
    }

    // Postal code validation (format depends on the selected country)
    if (formData.postalCode.length > 0) {
      const pattern = POSTAL_CODE_PATTERNS[formData.country];
      if (pattern?.regex) {
        newValidation.postalCode = pattern.regex.test(formData.postalCode.trim())
          ? { status: 'valid', message: 'Valid postal code' }
          : { status: 'warning', message: `Expected format like ${pattern.example}` };
      }
      // Countries without a standard format (e.g. AE, EU) are left unvalidated.
    }

    // Website URL validation
    if (formData.website.length > 0) {
      newValidation.website = URL_REGEX.test(formData.website.trim())
        ? { status: 'valid', message: 'Valid URL' }
        : { status: 'warning', message: 'Should start with https://' };
    }

    // Google Maps link validation
    if (formData.googleMapsLink.length > 0) {
      newValidation.googleMapsLink = URL_REGEX.test(formData.googleMapsLink.trim())
        ? { status: 'valid', message: 'Valid link' }
        : { status: 'warning', message: 'Should start with https://' };
    }
    
    setValidation(newValidation);
  }, [formData]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError?.(null);
  }, [error, setError]);

  // Validates only the required fields relevant to the sub-step currently on screen.
  const validateCurrentSubStep = useCallback(() => {
    if (currentSubStep === 0 && formData.cafeName.trim().length < 2) {
      return 'Cafe name is required (at least 2 characters).';
    }
    if (currentSubStep === 3 && formData.phone.trim().length > 0) {
      const phoneRegex = /^[+]?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        return 'Please enter a valid phone number.';
      }
    }
    if (currentSubStep === 3 && formData.phone.trim().length === 0) {
      return 'Phone number is required.';
    }
    return null;
  }, [currentSubStep, formData.cafeName, formData.phone]);

  const handleComplete = useCallback(() => {
    const updatedSettings = {
      ...settings,
      cafeName: formData.cafeName,
      legalName: formData.legalName,
      tagline: formData.tagline,
      businessType: formData.businessType,
      logo: formData.logo,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      postcode: formData.postalCode,
      googleMapsLink: formData.googleMapsLink,
      timezone: formData.timezone,
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
      language: formData.language,
      gstin: formData.gstin,
      fssaiNumber: formData.fssaiNumber,
      businessRegistration: formData.businessRegistration,
      taxMode: formData.taxMode,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      instagram: formData.instagram,
      facebook: formData.facebook,
      whatsapp: formData.whatsapp,
      accentColor: formData.accentColor,
      receiptStyle: formData.receiptStyle,
      theme: formData.theme
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // localStorage can fail (private browsing, storage quota, sandboxed iframe);
      // don't block the user's progress on a persistence failure.
      setError?.('Could not save settings locally, but your progress will still continue.');
    }
    onNext(formData);
  }, [formData, settings, onNext, setError]);

  const handleNextSubStep = useCallback(() => {
    const validationError = validateCurrentSubStep();
    if (validationError) {
      setError?.(validationError);
      return;
    }
    setError?.(null);
    if (currentSubStep < SUB_STEPS.length - 1) {
      setCurrentSubStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentSubStep, validateCurrentSubStep, handleComplete, setError]);

  const handleBackSubStep = useCallback(() => {
    setError?.(null);
    if (currentSubStep > 0) {
      setCurrentSubStep(prev => prev - 1);
    }
  }, [currentSubStep, setError]);

  const handleQuickSetup = useCallback(() => {
    // Auto-fill with sample data for quick setup
    setFormData(prev => ({
      ...prev,
      cafeName: 'My Cafe',
      legalName: 'My Cafe Pvt Ltd',
      tagline: 'Your daily dose of happiness',
      businessType: 'cafe',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      postalCode: '400001',
      phone: '+91 9876543210',
      email: 'contact@mycafe.com',
      taxMode: 'inclusive',
      accentColor: '#6366f1',
      receiptStyle: 'modern',
      theme: 'light'
    }));
    setShowQuickSetup(false);
  }, []);

  const handleSkipOptional = useCallback(() => {
    // Skip optional fields and proceed
    handleComplete();
  }, [handleComplete]);

  const getSubStepProgress = () => {
    return Math.round(((currentSubStep + 1) / SUB_STEPS.length) * 100);
  };

  const getEstimatedTime = () => {
    const remainingSteps = SUB_STEPS.length - currentSubStep - 1;
    return `${remainingSteps * 0.5} min`;
  };

  const renderValidationIcon = (field) => {
    const v = validation[field];
    if (!v) return null;
    if (v.status === 'valid') return <span style={{ color: '#10b981', marginLeft: 8 }}>✓</span>;
    if (v.status === 'warning') return <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠</span>;
    return null;
  };

  const renderSubStep = () => {
    switch (currentSubStep) {
      case 0: return renderBusinessIdentity();
      case 1: return renderLocation();
      case 2: return renderLegal();
      case 3: return renderContact();
      case 4: return renderBranding();
      default: return renderBusinessIdentity();
    }
  };

  const renderBusinessIdentity = () => (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
        Business Identity
      </h3>
      <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 24 : 32 }}>
        Enter your cafe's basic information. This will appear on receipts and customer communications.
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
        <div>
          <label htmlFor="biz-cafeName" style={labelStyle(isMobile)}>
            Cafe Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
          </label>
          <input
            id="biz-cafeName"
            type="text"
            autoComplete="organization"
            value={formData.cafeName}
            onChange={(e) => handleChange('cafeName', e.target.value)}
            placeholder="e.g., Sunrise Cafe"
            style={inputStyle(isMobile)}
          />
          <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
            {validation.cafeName?.message}
            {renderValidationIcon('cafeName')}
          </div>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Legal Name (Optional)
          </label>
          <input
            type="text"
            value={formData.legalName}
            onChange={(e) => handleChange('legalName', e.target.value)}
            placeholder="e.g., Sunrise Cafe Pvt Ltd"
            style={inputStyle(isMobile)}
          />
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Tagline (Optional)
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => handleChange('tagline', e.target.value)}
            placeholder="e.g., Your daily dose of happiness"
            style={inputStyle(isMobile)}
          />
        </div>

        <div>
          <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 10 : 12, display: "block" }}>
            Business Type
          </label>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(140px, 1fr))", gap: isMobile ? 10 : 12 }}>
            {BUSINESS_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleChange('businessType', type.id)}
                aria-pressed={formData.businessType === type.id}
                style={{
                  padding: isMobile ? "12px" : "16px",
                  border: formData.businessType === type.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                  borderRadius: isMobile ? 8 : 12,
                  background: formData.businessType === type.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: isMobile ? 6 : 8,
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: isMobile ? 20 : 24 }}>{type.icon}</span>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "var(--cafe-text-secondary)" }}>{type.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocation = () => {
    const postalPattern = POSTAL_CODE_PATTERNS[formData.country];
    return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
        Location Details
      </h3>
      <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 24 : 32 }}>
        Enter your cafe's address and regional settings for accurate operations.
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
        <div>
          <label htmlFor="loc-address" style={labelStyle(isMobile)}>
            Street Address
          </label>
          <input
            id="loc-address"
            type="text"
            autoComplete="street-address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main Street"
            style={inputStyle(isMobile)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
          <div>
            <label htmlFor="loc-city" style={labelStyle(isMobile)}>
              City
            </label>
            <input
              id="loc-city"
              type="text"
              autoComplete="address-level2"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Mumbai"
              style={inputStyle(isMobile)}
            />
          </div>
          <div>
            <label htmlFor="loc-state" style={labelStyle(isMobile)}>
              State
            </label>
            <input
              id="loc-state"
              type="text"
              autoComplete="address-level1"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="Maharashtra"
              style={inputStyle(isMobile)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
          <div>
            <label htmlFor="loc-country" style={labelStyle(isMobile)}>
              Country
            </label>
            <select
              id="loc-country"
              autoComplete="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              style={inputStyle(isMobile)}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loc-postal" style={labelStyle(isMobile)}>
              Postal Code
            </label>
            <input
              id="loc-postal"
              type="text"
              autoComplete="postal-code"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder={postalPattern?.example || '400001'}
              style={inputStyle(isMobile)}
            />
            {validation.postalCode && (
              <div style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", marginTop: 8, display: "flex", alignItems: "center" }}>
                {validation.postalCode.message}
                {renderValidationIcon('postalCode')}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="loc-maps" style={labelStyle(isMobile)}>
            Google Maps Link (Optional)
          </label>
          <input
            id="loc-maps"
            type="url"
            value={formData.googleMapsLink}
            onChange={(e) => handleChange('googleMapsLink', e.target.value)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !/^https?:\/\//i.test(v)) {
                handleChange('googleMapsLink', `https://${v}`);
              }
            }}
            placeholder="https://maps.google.com/..."
            style={inputStyle(isMobile)}
          />
          {validation.googleMapsLink && (
            <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
              {validation.googleMapsLink.message}
              {renderValidationIcon('googleMapsLink')}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
          <div>
            <label htmlFor="loc-currency" style={labelStyle(isMobile)}>
              Currency
            </label>
            <select
              id="loc-currency"
              value={formData.currency}
              onChange={(e) => {
                const selectedCountry = COUNTRIES.find(c => c.currency === e.target.value);
                handleChange('currency', e.target.value);
                if (selectedCountry) {
                  handleChange('currencySymbol', selectedCountry.currencySymbol);
                }
              }}
              style={inputStyle(isMobile)}
            >
              {COUNTRIES.map(country => (
                <option key={country.currency} value={country.currency}>
                  {country.currency} ({country.currencySymbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loc-timezone" style={labelStyle(isMobile)}>
              Timezone
            </label>
            <select
              id="loc-timezone"
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              style={inputStyle(isMobile)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.id} value={tz.id}>
                  {tz.name} ({tz.offset})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderLegal = () => (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
        Legal Information
      </h3>
      <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 24 : 32 }}>
        These details are used for tax compliance and invoicing. All fields are optional.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 20 : 24 }}>
        <div>
          <label htmlFor="legal-gstin" style={labelStyle(isMobile)}>
            GST Number (Optional)
          </label>
          <input
            id="legal-gstin"
            type="text"
            value={formData.gstin}
            onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
            placeholder="29ABCDE1234F1Z5"
            maxLength={15}
            style={inputStyle(isMobile)}
          />
          <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
            Required for GST-registered businesses in India
            {renderValidationIcon('gstin')}
          </div>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            FSSAI License (Optional)
          </label>
          <input
            type="text"
            value={formData.fssaiNumber}
            onChange={(e) => handleChange('fssaiNumber', e.target.value)}
            placeholder="10012345678987"
            style={inputStyle(isMobile)}
          />
          <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8 }}>
            Required for food businesses in India
          </div>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Business Registration (Optional)
          </label>
          <input
            type="text"
            value={formData.businessRegistration}
            onChange={(e) => handleChange('businessRegistration', e.target.value)}
            placeholder="Company registration number"
            style={inputStyle(isMobile)}
          />
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Tax Mode
          </label>
          <div style={{ display: "flex", gap: isMobile ? 10 : 12 }}>
            {TAX_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => handleChange('taxMode', mode.id)}
                aria-pressed={formData.taxMode === mode.id}
                style={{
                  flex: 1,
                  padding: isMobile ? "12px" : "16px",
                  border: formData.taxMode === mode.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                  borderRadius: isMobile ? 8 : 12,
                  background: formData.taxMode === mode.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                  {mode.name}
                </div>
                <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-text-secondary)" }}>
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        padding: isMobile ? 16 : 20,
        background: "var(--cafe-info-bg)",
        border: "1px solid var(--cafe-info-border)",
        borderRadius: isMobile ? 8 : 12,
        fontSize: isMobile ? 13 : 14,
        color: "var(--cafe-info)",
        marginTop: isMobile ? 20 : 24
      }}>
        <strong>💡 Tip:</strong> You can update these details later in Settings &gt; Business Information.
      </div>
    </div>
  );

  const renderContact = () => (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
        Contact Details
      </h3>
      <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 24 : 32 }}>
        Enter your contact information for customer support and communications.
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
        <div>
          <label htmlFor="contact-phone" style={labelStyle(isMobile)}>
            Phone Number <span style={{ color: "var(--cafe-danger)" }}>*</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+91 9876543210"
            style={inputStyle(isMobile)}
          />
          <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
            Used for order notifications and customer support
            {renderValidationIcon('phone')}
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" style={labelStyle(isMobile)}>
            Email Address (Optional)
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@yourcafe.com"
            style={inputStyle(isMobile)}
          />
          <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
            For receipts and marketing
            {renderValidationIcon('email')}
          </div>
        </div>

        <div>
          <label htmlFor="contact-website" style={labelStyle(isMobile)}>
            Website (Optional)
          </label>
          <input
            id="contact-website"
            type="url"
            autoComplete="url"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !/^https?:\/\//i.test(v)) {
                handleChange('website', `https://${v}`);
              }
            }}
            placeholder="https://yourcafe.com"
            style={inputStyle(isMobile)}
          />
          {validation.website && (
            <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 6 : 8, display: "flex", alignItems: "center" }}>
              {validation.website.message}
              {renderValidationIcon('website')}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 10 : 12, display: "block" }}>
            Social Media (Optional)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16 }}>
            <div>
              <label style={smallLabelStyle(isMobile)}>
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="@yourcafe"
                style={smallInputStyle(isMobile)}
              />
            </div>
            <div>
              <label style={smallLabelStyle(isMobile)}>
                Facebook
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                placeholder="Your Cafe"
                style={smallInputStyle(isMobile)}
              />
            </div>
            <div>
              <label style={smallLabelStyle(isMobile)}>
                WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+91..."
                style={smallInputStyle(isMobile)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranding = () => (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px" : 0 }}>
      <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
        Branding
      </h3>
      <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", marginBottom: isMobile ? 24 : 32 }}>
        Customize how your cafe looks to customers with colors, themes, and logos.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 20 : 24 }}>
        <div>
          <label style={labelStyle(isMobile)}>
            Upload Logo
          </label>
          <div style={{
            border: "2px dashed var(--cafe-border)",
            borderRadius: isMobile ? 8 : 12,
            padding: isMobile ? 24 : 40,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: "var(--cafe-bg-surface)"
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (!file.type.startsWith('image/')) {
                setError?.('Please upload an image file (PNG or JPG).');
                return;
              }
              if (file.size > MAX_LOGO_SIZE_BYTES) {
                setError?.('Logo must be smaller than 2MB.');
                return;
              }
              setError?.(null);
              const reader = new FileReader();
              reader.onload = (e) => handleChange('logo', e.target.result);
              reader.onerror = () => setError?.('Could not read the selected file. Please try again.');
              reader.readAsDataURL(file);
            };
            input.click();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--cafe-accent)";
            e.currentTarget.style.background = "var(--cafe-accent-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--cafe-border)";
            e.currentTarget.style.background = "var(--cafe-bg-surface)";
          }}
          >
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" style={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100, objectFit: "cover", borderRadius: isMobile ? 8 : 12, margin: "0 auto" }} />
            ) : (
              <div>
                <div style={{ fontSize: isMobile ? 28 : 36, marginBottom: isMobile ? 8 : 12 }}>📤</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)" }}>
                  Click to upload logo
                </div>
                <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-text-tertiary)", marginTop: isMobile ? 4 : 6 }}>
                  PNG, JPG up to 2MB
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Accent Color
          </label>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 12 }}>
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => handleChange('accentColor', color.value)}
                aria-label={color.name}
                aria-pressed={formData.accentColor === color.value}
                title={color.name}
                style={{
                  padding: isMobile ? "16px" : "20px",
                  border: formData.accentColor === color.value ? "3px solid var(--cafe-accent)" : "2px solid var(--cafe-border)",
                  borderRadius: isMobile ? 8 : 12,
                  background: color.value,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: formData.accentColor === color.value ? `0 0 0 4px ${color.value}40` : "none"
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Receipt Style
          </label>
          <select
            value={formData.receiptStyle}
            onChange={(e) => handleChange('receiptStyle', e.target.value)}
            style={inputStyle(isMobile)}
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div>
          <label style={labelStyle(isMobile)}>
            Theme
          </label>
          <div style={{ display: "flex", gap: isMobile ? 10 : 12 }}>
            <button
              onClick={() => handleChange('theme', 'light')}
              aria-pressed={formData.theme === 'light'}
              style={{
                flex: 1,
                padding: isMobile ? "12px" : "16px",
                border: formData.theme === 'light' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: formData.theme === 'light' ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => handleChange('theme', 'dark')}
              aria-pressed={formData.theme === 'dark'}
              style={{
                flex: 1,
                padding: "16px",
                border: formData.theme === 'dark' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: formData.theme === 'dark' ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      {/* Branding Preview */}
      <div style={{
        marginTop: 32,
        background: "var(--cafe-bg-card)",
        border: "1px solid var(--cafe-border)",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Receipt Preview
        </h4>
        <div style={{
          background: formData.theme === 'dark' ? "#1a1a2e" : "#fff",
          padding: 24,
          borderRadius: 12,
          border: `1px solid ${formData.accentColor}20`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 10, background: formData.accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                ☕
              </div>
            )}
            <div>
              <h5 style={{ fontSize: 18, fontWeight: 700, color: formData.theme === 'dark' ? "#fff" : "#1a1a2e", margin: 0 }}>
                {formData.cafeName || 'Your Cafe'}
              </h5>
              <p style={{ fontSize: 13, color: formData.theme === 'dark' ? "#888" : "#666", margin: "4px 0 0" }}>
                {formData.tagline || 'Your tagline'}
              </p>
            </div>
          </div>
          <div style={{ height: 1, background: formData.accentColor, margin: "20px 0", opacity: 0.3 }} />
          <div style={{ fontSize: 14, color: formData.theme === 'dark' ? "#888" : "#666" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span>Item 1</span>
              <span style={{ color: formData.accentColor, fontWeight: 600 }}>{formData.currencySymbol || '₹'}120</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total</span>
              <span style={{ color: formData.accentColor, fontWeight: 700 }}>{formData.currencySymbol || '₹'}120</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sub-step Progress */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {SUB_STEPS.map((step, idx) => (
              <div
                key={step.id}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: idx === currentSubStep 
                    ? "var(--cafe-accent)" 
                    : idx < currentSubStep 
                      ? "#10b981" 
                      : "var(--cafe-bg-surface)",
                  border: idx === currentSubStep 
                    ? "2px solid var(--cafe-accent)" 
                    : "1px solid var(--cafe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: idx < currentSubStep 
                    ? "#fff" 
                    : idx === currentSubStep 
                      ? "#fff" 
                      : "var(--cafe-text-tertiary)",
                  fontWeight: 600,
                  cursor: idx < currentSubStep ? "pointer" : "default"
                }}
                onClick={() => idx < currentSubStep && setCurrentSubStep(idx)}
              >
                {idx < currentSubStep ? "✓" : idx + 1}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              {SUB_STEPS[currentSubStep].name}
            </div>
            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
              Step {currentSubStep + 1} of {SUB_STEPS.length}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
              PROGRESS · {getEstimatedTime()} LEFT
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)" }}>
              {getSubStepProgress()}%
            </div>
          </div>
          <button
            onClick={handleQuickSetup}
            style={{
              padding: "8px 16px",
              background: "var(--cafe-accent)",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Quick Setup
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        {error && (
          <div
            role="alert"
            style={{
              maxWidth: 800,
              margin: "0 auto 24px",
              padding: "14px 18px",
              background: "var(--cafe-danger-bg, #fef2f2)",
              border: "1px solid var(--cafe-danger, #ef4444)",
              borderRadius: 12,
              fontSize: 14,
              color: "var(--cafe-danger, #ef4444)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
        {renderSubStep()}
      </div>

      {/* Navigation */}
      <div style={{
        padding: "20px 24px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        position: isMobile ? "sticky" : "relative",
        bottom: isMobile ? 0 : "auto"
      }}>
        {currentSubStep > 0 && (
          <button
            onClick={handleBackSubStep}
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
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleSkipOptional}
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
          Skip Optional
        </button>
        <button
          onClick={handleNextSubStep}
          disabled={isLoading}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
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
          {currentSubStep === SUB_STEPS.length - 1 ? 'Complete' : 'Continue →'}
        </button>
      </div>

      {/* Quick Setup Dialog */}
      {showQuickSetup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-text-primary)", margin: "0 0 16px" }}>
              Quick Setup
            </h3>
            <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Choose how you'd like to proceed
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={handleSkipOptional}
                style={{
                  padding: "14px 20px",
                  background: "var(--cafe-accent-bg)",
                  border: "1px solid var(--cafe-accent)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-accent)",
                  cursor: "pointer"
                }}
              >
                Skip Optional Fields
              </button>
              <button
                onClick={() => setShowQuickSetup(false)}
                style={{
                  padding: "14px 20px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer"
                }}
              >
                Continue Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

