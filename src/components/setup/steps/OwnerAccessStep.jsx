import React from 'react';
// Owner/Admin Access Step for Setup Wizard
// Ensures safe owner/admin account exists with premium UX

import { useState, useCallback, useRef, useMemo } from "react";
import Tooltip from "../Tooltip.jsx";

export default function OwnerAccessStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [formData, setFormData] = useState({
    ownerName: settings?.ownerName || '',
    ownerEmail: settings?.ownerEmail || '',
    ownerPhone: settings?.ownerPhone || '',
    username: settings?.ownerUsername || '',
    password: settings?.ownerPassword || '',
    confirmPassword: '',
    ownerRole: 'Owner',
    loginEnabled: true,
    enableTwoFactor: false,
    securityQuestion: '',
    securityAnswer: ''
  });

  const [validation, setValidation] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fieldRefs = useRef({});

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change
    if (field === 'ownerName') {
      if (value.trim().length < 2) {
        setValidation(prev => ({ ...prev, ownerName: { status: 'warning', message: 'Name must be at least 2 characters' } }));
      } else {
        setValidation(prev => ({ ...prev, ownerName: { status: 'valid', message: 'Valid' } }));
      }
    }
    
    if (field === 'ownerEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.length > 0 && !emailRegex.test(value)) {
        setValidation(prev => ({ ...prev, ownerEmail: { status: 'warning', message: 'Invalid email format' } }));
      } else if (value.length > 0) {
        setValidation(prev => ({ ...prev, ownerEmail: { status: 'valid', message: 'Valid email' } }));
      }
    }
    
    if (field === 'ownerPhone') {
      const phoneRegex = /^[+]?[\d\s-]{10,}$/;
      if (value.length > 0 && !phoneRegex.test(value)) {
        setValidation(prev => ({ ...prev, ownerPhone: { status: 'warning', message: 'Invalid phone format' } }));
      } else if (value.length > 0) {
        setValidation(prev => ({ ...prev, ownerPhone: { status: 'valid', message: 'Valid phone' } }));
      }
    }
    
    if (field === 'username') {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (value.length > 0 && value.length < 3) {
        setValidation(prev => ({ ...prev, username: { status: 'warning', message: 'Username must be at least 3 characters' } }));
      } else if (value.length > 0 && !usernameRegex.test(value)) {
        setValidation(prev => ({ ...prev, username: { status: 'warning', message: 'Only letters, numbers, and underscores allowed' } }));
      } else if (value.length > 0) {
        setValidation(prev => ({ ...prev, username: { status: 'valid', message: 'Valid username' } }));
      }
    }
    
    if (field === 'password') {
      const strength = getPasswordStrength(value);
      setValidation(prev => ({ ...prev, password: { status: strength.status, message: strength.message, strength: strength.level } }));
      
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setValidation(prev => ({ ...prev, confirmPassword: { status: 'warning', message: 'Passwords do not match' } }));
        } else {
          setValidation(prev => ({ ...prev, confirmPassword: { status: 'valid', message: 'Passwords match' } }));
        }
      }
    }
    
    if (field === 'confirmPassword') {
      if (value !== formData.password) {
        setValidation(prev => ({ ...prev, confirmPassword: { status: 'warning', message: 'Passwords do not match' } }));
      } else if (value.length > 0) {
        setValidation(prev => ({ ...prev, confirmPassword: { status: 'valid', message: 'Passwords match' } }));
      }
    }
  }, [formData.password, formData.confirmPassword]);

  const getPasswordStrength = (password) => {
    if (!password || password.length < 8) {
      return { status: 'warning', message: 'Too weak (min 8 characters)', level: 0 };
    }
    if (password.length < 10) {
      return { status: 'valid', message: 'Weak', level: 1 };
    }
    if (password.length < 12) {
      return { status: 'valid', message: 'Medium', level: 2 };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasUpper && hasLower && hasNumber && hasSpecial) {
      return { status: 'valid', message: 'Strong', level: 4 };
    }
    return { status: 'valid', message: 'Good', level: 3 };
  };

  const completion = useMemo(() => {
    const required = [
      formData.ownerName.trim().length >= 2,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim()),
      formData.username.trim().length >= 3,
      formData.password.length >= 8,
      formData.password.length > 0 && formData.password === formData.confirmPassword,
      !formData.enableTwoFactor || (formData.securityQuestion && formData.securityAnswer.trim() !== '')
    ];
    const done = required.filter(Boolean).length;
    return Math.round((done / required.length) * 100);
  }, [formData.ownerName, formData.ownerEmail, formData.username, formData.password, formData.confirmPassword, formData.enableTwoFactor, formData.securityQuestion, formData.securityAnswer]);

  const handleNext = useCallback(() => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!formData.ownerName || formData.ownerName.trim() === '') {
      errors.push({ field: 'ownerName', message: 'Owner name is required' });
    } else if (formData.ownerName.trim().length < 2) {
      errors.push({ field: 'ownerName', message: 'Name must be at least 2 characters' });
    }
    if (!formData.ownerEmail || formData.ownerEmail.trim() === '') {
      errors.push({ field: 'ownerEmail', message: 'Email is required' });
    } else if (!emailRegex.test(formData.ownerEmail.trim())) {
      errors.push({ field: 'ownerEmail', message: 'Enter a valid email address' });
    }
    if (formData.ownerPhone && formData.ownerPhone.trim() !== '' && !phoneRegex.test(formData.ownerPhone.trim())) {
      errors.push({ field: 'ownerPhone', message: 'Enter a valid phone number' });
    }
    if (!formData.username || formData.username.trim() === '') {
      errors.push({ field: 'username', message: 'Username is required' });
    } else if (formData.username.trim().length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    } else if (!usernameRegex.test(formData.username.trim())) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }
    if (!formData.password || formData.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }
    if (formData.password !== formData.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }
    if (formData.enableTwoFactor && (!formData.securityQuestion || formData.securityAnswer.trim() === '')) {
      errors.push({ field: 'securityAnswer', message: 'Select a security question and provide an answer when 2FA is enabled' });
    }

    if (errors.length > 0) {
      setError({
        title: 'Please fix the following issues',
        message: 'Some required fields are missing or invalid.',
        errors
      });
      const firstField = fieldRefs.current[errors[0].field];
      if (firstField) {
        firstField.focus({ preventScroll: true });
        firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const normalized = {
      ...formData,
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim().toLowerCase(),
      username: formData.username.trim()
    };

    // NOTE: password/securityAnswer are deliberately left out of the localStorage
    // cache below — localStorage is plaintext and readable by any script or
    // browser extension on the page. The real password still goes to onNext()
    // so the caller can send it straight to the server (to be hashed there),
    // it just shouldn't linger in local storage.
    const updatedSettings = {
      ...settings,
      ownerName: normalized.ownerName,
      ownerEmail: normalized.ownerEmail,
      ownerPhone: normalized.ownerPhone,
      ownerUsername: normalized.username,
      ownerRole: normalized.ownerRole,
      loginEnabled: normalized.loginEnabled,
      enableTwoFactor: normalized.enableTwoFactor,
      securityQuestion: normalized.securityQuestion
    };
    localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    onNext(normalized);
  }, [formData, settings, onNext, setError]);

  return (
    <div
      className="owner-access-step"
      style={{ maxWidth: 900, margin: "0 auto" }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
          e.preventDefault();
          handleNext();
        }
      }}
    >
      <style>{`
        .owner-access-step input,
        .owner-access-step select,
        .owner-access-step textarea {
          box-sizing: border-box;
        }
        .owner-access-step [style*="grid-template-columns"] > div {
          min-width: 0;
        }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Owner/Admin Account Setup
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
          Create your primary administrator account with full access to all features.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--cafe-border-light)", overflow: "hidden" }}>
            <div style={{
              width: `${completion}%`,
              height: "100%",
              borderRadius: 3,
              background: completion === 100 ? "#10b981" : "var(--cafe-accent)",
              transition: "width 0.3s ease"
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-tertiary)", whiteSpace: "nowrap" }}>
            {completion}% complete
          </span>
        </div>
      </div>

      {/* Owner Information */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            Owner Information
          </h4>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
          <div>
            <label htmlFor="owner-name" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Full Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
            </label>
            <input
              id="owner-name"
              ref={(el) => { fieldRefs.current.ownerName = el; }}
              type="text"
              value={formData.ownerName}
              onChange={(e) => handleChange('ownerName', e.target.value)}
              placeholder="e.g., John Doe"
              autoComplete="name"
              aria-invalid={validation.ownerName?.status === 'warning'}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: validation.ownerName?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
            {validation.ownerName?.message && (
              <div style={{ fontSize: 12, color: validation.ownerName.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
                {validation.ownerName.message}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="owner-email" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Email <span style={{ color: "var(--cafe-danger)" }}>*</span>
            </label>
            <input
              id="owner-email"
              ref={(el) => { fieldRefs.current.ownerEmail = el; }}
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => handleChange('ownerEmail', e.target.value)}
              placeholder="owner@yourcafe.com"
              autoComplete="email"
              aria-invalid={validation.ownerEmail?.status === 'warning'}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: validation.ownerEmail?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
            {validation.ownerEmail?.message && (
              <div style={{ fontSize: 12, color: validation.ownerEmail.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
                {validation.ownerEmail.message}
              </div>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="owner-phone" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
            Phone Number
          </label>
          <input
            id="owner-phone"
            ref={(el) => { fieldRefs.current.ownerPhone = el; }}
            type="tel"
            value={formData.ownerPhone}
            onChange={(e) => handleChange('ownerPhone', e.target.value)}
            placeholder="+91 9876543210"
            autoComplete="tel"
            aria-invalid={validation.ownerPhone?.status === 'warning'}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              border: validation.ownerPhone?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              background: "var(--cafe-bg)",
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          />
          {validation.ownerPhone?.message && (
            <div style={{ fontSize: 12, color: validation.ownerPhone.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
              {validation.ownerPhone.message}
            </div>
          )}
        </div>
      </div>

      {/* Login Credentials */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            Login Credentials
          </h4>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="owner-username" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center" }}>
            Username <span style={{ color: "var(--cafe-danger)" }}>*</span>
            <Tooltip content="Your unique login username. Must be at least 3 characters and can only contain letters, numbers, and underscores." position="top" />
          </label>
          <input
            id="owner-username"
            ref={(el) => { fieldRefs.current.username = el; }}
            type="text"
            autoComplete="username"
            aria-invalid={validation.username?.status === 'warning'}
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="e.g., johndoe"
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              border: validation.username?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              background: "var(--cafe-bg)",
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          />
          {validation.username?.message && (
            <div style={{ fontSize: 12, color: validation.username.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
              {validation.username.message}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          <div>
            <label htmlFor="owner-password" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center" }}>
              Password <span style={{ color: "var(--cafe-danger)" }}>*</span>
              <Tooltip content="Must be at least 8 characters with uppercase, lowercase, numbers, and special characters for maximum security." position="top" />
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="owner-password"
                ref={(el) => { fieldRefs.current.password = el; }}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password"
                autoComplete="new-password"
                aria-invalid={validation.password?.status === 'warning'}
                style={{
                  width: "100%",
                  padding: "14px 40px 14px 16px",
                  fontSize: 15,
                  border: validation.password?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "var(--cafe-text-tertiary)"
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validation.password?.message && (
              <div style={{ fontSize: 12, color: validation.password.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
                {validation.password.message}
              </div>
            )}
            {validation.password?.strength !== undefined && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: level <= validation.password.strength 
                          ? ['#ef4444', '#f59e0b', '#fbbf24', '#34d399', '#10b981'][level]
                          : 'var(--cafe-border)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="owner-confirm-password" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Confirm Password <span style={{ color: "var(--cafe-danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="owner-confirm-password"
                ref={(el) => { fieldRefs.current.confirmPassword = el; }}
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                aria-invalid={validation.confirmPassword?.status === 'warning'}
                style={{
                  width: "100%",
                  padding: "14px 68px 14px 16px",
                  fontSize: 15,
                  border: validation.confirmPassword?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
              {validation.confirmPassword?.status === 'valid' && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 44,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#10b981",
                    fontSize: 16,
                    pointerEvents: "none"
                  }}
                >
                  ✓
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "var(--cafe-text-tertiary)"
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validation.confirmPassword?.message && (
              <div style={{ fontSize: 12, color: validation.confirmPassword.status === 'valid' ? "#10b981" : "#f59e0b", marginTop: 6 }}>
                {validation.confirmPassword.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Options */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            Security Options
          </h4>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "16px", background: "var(--cafe-bg)", borderRadius: 10, border: "1px solid var(--cafe-border)" }}>
            <input
              type="checkbox"
              checked={formData.loginEnabled}
              onChange={(e) => handleChange('loginEnabled', e.target.checked)}
              style={{ width: 20, height: 20 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Enable Login for This Account
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Turn off to create the account without allowing sign-in yet
              </div>
            </div>
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "16px", background: "var(--cafe-bg)", borderRadius: 10, border: "1px solid var(--cafe-border)" }}>
            <input
              type="checkbox"
              checked={formData.enableTwoFactor}
              onChange={(e) => handleChange('enableTwoFactor', e.target.checked)}
              style={{ width: 20, height: 20 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Enable Two-Factor Authentication (2FA)
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Add an extra layer of security to your account
              </div>
            </div>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          <div>
            <label htmlFor="owner-security-question" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Security Question {formData.enableTwoFactor && <span style={{ color: "var(--cafe-danger)" }}>*</span>}
            </label>
            <select
              id="owner-security-question"
              value={formData.securityQuestion}
              onChange={(e) => handleChange('securityQuestion', e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            >
              <option value="">Select a question</option>
              <option value="pet">What was the name of your first pet?</option>
              <option value="school">What was the name of your first school?</option>
              <option value="city">In what city were you born?</option>
              <option value="mother">What is your mother's maiden name?</option>
            </select>
          </div>
          <div>
            <label htmlFor="owner-security-answer" style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Security Answer {formData.enableTwoFactor && <span style={{ color: "var(--cafe-danger)" }}>*</span>}
            </label>
            <input
              id="owner-security-answer"
              ref={(el) => { fieldRefs.current.securityAnswer = el; }}
              type="text"
              autoComplete="off"
              value={formData.securityAnswer}
              onChange={(e) => handleChange('securityAnswer', e.target.value)}
              placeholder="Your answer"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>👑</span>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            Account Role
          </h4>
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
            Select Role
          </label>
          <select
            value={formData.ownerRole}
            onChange={(e) => handleChange('ownerRole', e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              border: "1px solid var(--cafe-border)",
              borderRadius: 10,
              background: "var(--cafe-bg)",
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          >
            <option value="Owner">Owner - Full access to everything</option>
            <option value="Manager">Manager - Full operational access</option>
          </select>
        </div>
      </div>

      {/* Account Preview */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span>
          Account Preview
        </h4>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          color: "#000"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "var(--cafe-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#fff"
            }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {formData.ownerName || 'Owner Name'}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                {formData.ownerEmail || 'email@example.com'}
              </div>
              <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>
                @{formData.username || 'username'}
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              padding: "8px 14px",
              background: formData.loginEnabled ? "#10b98120" : "#f59e0b20",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: formData.loginEnabled ? "#10b981" : "#f59e0b",
              border: `1px solid ${formData.loginEnabled ? "#10b98140" : "#f59e0b40"}`
            }}>
              {formData.loginEnabled ? '✓ Login Enabled' : '⚠ Login Disabled'}
            </span>
            <span style={{
              padding: "8px 14px",
              background: "var(--cafe-accent-bg)",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-accent)",
              border: "1px solid var(--cafe-accent)"
            }}>
              {formData.ownerRole}
            </span>
            {formData.enableTwoFactor && (
              <span style={{
                padding: "8px 14px",
                background: "#3b82f620",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: "#3b82f6",
                border: "1px solid #3b82f640"
              }}>
                🔒 2FA Enabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          type="button"
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
          type="button"
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
          {isLoading ? 'Saving…' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
