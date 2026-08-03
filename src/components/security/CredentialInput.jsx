// Credential Input Component
// Secure input field with masking, reveal, and validation

import React, { useState } from 'react';
import credentialManager from '../../security/CredentialManager.js';
import { verifyOwnerPassword } from '../../utils/setupSecurity.js';

export default function CredentialInput({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  sensitive = true,
  disabled = false,
  providerId,
  fieldName,
  error,
  onValidationChange
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOwnerVerified, setIsOwnerVerified] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealError, setRevealError] = useState('');

  const handleRevealClick = async () => {
    if (!sensitive) {
      setIsRevealed(!isRevealed);
      return;
    }

    // Check if already verified
    if (isOwnerVerified) {
      setIsRevealed(!isRevealed);
      return;
    }

    // Show verification dialog
    setShowRevealDialog(true);
  };

  const handleVerifyOwner = async () => {
    setRevealError('');
    
    try {
      const isVerified = await verifyOwnerPassword(revealPassword);
      
      if (isVerified) {
        setIsOwnerVerified(true);
        setIsRevealed(true);
        setShowRevealDialog(false);
        setRevealPassword('');
      } else {
        setRevealError('Invalid password. Owner verification failed.');
      }
    } catch (error) {
      setRevealError('Verification failed. Please try again.');
    }
  };

  const handleCancelReveal = () => {
    setShowRevealDialog(false);
    setRevealPassword('');
    setRevealError('');
  };

  const validateField = (value, field) => {
    if (required && !value) {
      return { valid: false, error: 'This field is required' };
    }

    const MIN_KEY_LEN = 16;
    const keyFields = ['accessKey', 'secretKey', 'apiKey'];
    if (field && keyFields.includes(field) && value && value.length < MIN_KEY_LEN) {
      const labels = { accessKey: 'Access key', secretKey: 'Secret key', apiKey: 'API key' };
      return { valid: false, error: `${labels[field]} must be at least ${MIN_KEY_LEN} characters` };
    }

    return { valid: true, error: null };
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // If the field is cleared, revoke the reveal so a new value must be verified again
    if (!newValue && isOwnerVerified) {
      setIsOwnerVerified(false);
      setIsRevealed(false);
    }

    if (onValidationChange) {
      // Always re-validate so parent knows when field is cleared
      onValidationChange(validateField(newValue, fieldName));
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: 'var(--cafe-text-secondary)', 
          marginBottom: 8, 
          display: 'block' 
        }}>
          {label}
          {required && <span style={{ color: 'var(--cafe-danger)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={sensitive && !isRevealed ? 'password' : 'text'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={sensitive ? 'new-password' : 'off'}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 15,
            border: error ? '1px solid var(--cafe-danger)' : '1px solid var(--cafe-border)',
            borderRadius: 8,
            background: 'var(--cafe-bg-surface)',
            color: 'var(--cafe-text-primary)',
            opacity: disabled ? 0.6 : 1
          }}
        />
        
        {sensitive && value && (
          <button
            type="button"
            onClick={handleRevealClick}
            disabled={disabled}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              background: 'var(--cafe-bg-surface)',
              color: 'var(--cafe-text-secondary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {isRevealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          fontSize: 12, 
          color: 'var(--cafe-danger)', 
          marginTop: 4 
        }}>
          {error}
        </div>
      )}

      {/* Owner Verification Dialog */}
      {showRevealDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--cafe-bg-card)',
            border: '1px solid var(--cafe-border)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            width: '90%'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: 18, 
              fontWeight: 600, 
              color: 'var(--cafe-text-primary)' 
            }}>
              Owner Verification Required
            </h3>
            
            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: 14, 
              color: 'var(--cafe-text-secondary)' 
            }}>
              Enter your owner password to reveal this credential.
            </p>

            <input
              type="password"
              value={revealPassword}
              onChange={(e) => setRevealPassword(e.target.value)}
              placeholder="Owner password"
              autoComplete="off"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyOwner();
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                background: 'var(--cafe-bg-surface)',
                color: 'var(--cafe-text-primary)',
                marginBottom: 16
              }}
            />

            {revealError && (
              <div style={{ 
                fontSize: 13, 
                color: 'var(--cafe-danger)', 
                marginBottom: 16 
              }}>
                {revealError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelReveal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOwner}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'var(--cafe-accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
