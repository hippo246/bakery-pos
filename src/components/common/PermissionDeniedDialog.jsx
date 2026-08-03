import React from 'react';
import { C, btn, card } from "../../styles/theme";

/**
 * PermissionDeniedDialog - Shows when a user attempts an action without required permission
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {string} props.action - The action that was attempted
 * @param {string} props.requiredPermission - The permission that was required
 * @param {string} props.currentRole - The user's current role
 * @param {string} props.contactMessage - Message about who to contact for access
 */
export default function PermissionDeniedDialog({ 
  open, 
  onClose, 
  action = "perform this action", 
  requiredPermission, 
  currentRole,
  contactMessage 
}) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        ...card(),
        maxWidth: 480,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '2px solid var(--cafe-danger-border)',
        boxShadow: 'var(--cafe-shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--cafe-border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--cafe-radius-md)',
            background: 'var(--cafe-danger-bg)',
            border: '1px solid var(--cafe-danger-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            🔒
          </div>
          <div>
            <div style={{
              fontSize: 'var(--cafe-font-lg)',
              fontWeight: 700,
              color: 'var(--cafe-text-primary)',
              marginBottom: 2,
            }}>
              Access Denied
            </div>
            <div style={{
              fontSize: 'var(--cafe-font-sm)',
              color: 'var(--cafe-text-tertiary)',
            }}>
              Permission Required
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Main Message */}
          <div style={{
            fontSize: 'var(--cafe-font-base)',
            color: 'var(--cafe-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 20,
          }}>
            You do not have permission to <strong>{action}</strong>.
          </div>

          {/* Permission Details */}
          <div style={{
            background: 'var(--cafe-bg-surface)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-md)',
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 'var(--cafe-font-xs)',
              color: 'var(--cafe-text-tertiary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}>
              Required Permission
            </div>
            <div style={{
              fontSize: 'var(--cafe-font-sm)',
              fontFamily: 'monospace',
              color: 'var(--cafe-text-primary)',
              background: 'var(--cafe-bg-card)',
              padding: '8px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              wordBreak: 'break-all',
            }}>
              {requiredPermission || 'Unknown permission'}
            </div>
          </div>

          {/* Current Role */}
          {currentRole && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              padding: 12,
              background: 'var(--cafe-bg-surface)',
              borderRadius: 'var(--cafe-radius-md)',
              border: '1px solid var(--cafe-border-light)',
            }}>
              <div style={{
                fontSize: 'var(--cafe-font-xs)',
                color: 'var(--cafe-text-tertiary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Your Role:
              </div>
              <div style={{
                fontSize: 'var(--cafe-font-sm)',
                color: 'var(--cafe-text-secondary)',
                fontWeight: 500,
              }}>
                {currentRole}
              </div>
            </div>
          )}

          {/* Contact Message */}
          <div style={{
            fontSize: 'var(--cafe-font-sm)',
            color: 'var(--cafe-text-tertiary)',
            lineHeight: 1.5,
            padding: 16,
            background: 'var(--cafe-info-bg)',
            border: '1px solid var(--cafe-info-border)',
            borderRadius: 'var(--cafe-radius-md)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--cafe-info)' }}>
              Need Access?
            </div>
            {contactMessage || 'Contact a manager or owner to request the required permission.'}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--cafe-border-light)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <button
            onClick={onClose}
            style={btn('primary')}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
