import React from 'react';
import { useState, useCallback } from "react";
import { createShift, hasActiveShift, SHIFT_ROLES } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function OpenShiftDialog({ 
  shifts, 
  setShifts, 
  staff, 
  registers, 
  terminals,
  onClose,
  onSuccess 
}) {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    registerId: 'REG-001',
    terminalId: 'TERM-001',
    managerId: '',
    cashierId: '',
    openingFloat: 0,
    expectedCloseAt: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.managerId) {
      newErrors.managerId = 'Manager is required';
    }

    if (!formData.cashierId) {
      newErrors.cashierId = 'Cashier is required';
    }

    if (formData.openingFloat < 0) {
      newErrors.openingFloat = 'Opening float cannot be negative';
    }

    // Check if register already has active shift
    if (hasActiveShift(shifts, formData.registerId)) {
      newErrors.registerId = 'This register already has an active shift';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, shifts]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const manager = staff?.find(s => s.id === formData.managerId);
      const cashier = staff?.find(s => s.id === formData.cashierId);

      const newShift = createShift({
        registerId: formData.registerId,
        terminalId: formData.terminalId,
        managerId: formData.managerId,
        managerName: manager?.name || 'Unknown',
        cashierId: formData.cashierId,
        cashierName: cashier?.name || 'Unknown',
        openingFloat: formData.openingFloat,
        expectedCloseAt: formData.expectedCloseAt || null,
        notes: formData.notes,
        createdBy: formData.managerId,
        createdAt: new Date().toISOString()
      });

      setShifts(prev => [...prev, newShift]);
      onSuccess?.(newShift);
      onClose();
    } catch (error) {
      console.error('Failed to open shift:', error);
      setErrors({ submit: 'Failed to open shift. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, staff, setShifts, onSuccess, onClose]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

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
      zIndex: 1000,
      padding: isMobile ? '0' : '20px'
    }}>
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: isMobile ? '0' : 'var(--cafe-radius-lg)',
        maxWidth: '500px',
        width: '100%',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : '90vh',
        overflowY: 'auto',
        padding: isMobile ? '24px 20px' : '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            margin: 0
          }}>
            Open Shift
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--cafe-text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Register Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Register *
            </label>
            <select
              value={formData.registerId}
              onChange={(e) => handleChange('registerId', e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: errors.registerId ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            >
              {(registers || ['REG-001', 'REG-002', 'REG-003']).map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
            {errors.registerId && (
              <div style={{
                fontSize: '12px',
                color: '#e74c3c',
                marginTop: '4px'
              }}>
                {errors.registerId}
              </div>
            )}
          </div>

          {/* Terminal Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Terminal
            </label>
            <select
              value={formData.terminalId}
              onChange={(e) => handleChange('terminalId', e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            >
              {(terminals || ['TERM-001', 'TERM-002']).map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>

          {/* Manager Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Manager *
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => handleChange('managerId', e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: errors.managerId ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            >
              <option value="">Select Manager</option>
              {(staff || []).filter(s => s.role === SHIFT_ROLES.MANAGER || s.role === SHIFT_ROLES.SUPERVISOR).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.managerId && (
              <div style={{
                fontSize: '12px',
                color: '#e74c3c',
                marginTop: '4px'
              }}>
                {errors.managerId}
              </div>
            )}
          </div>

          {/* Cashier Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Cashier *
            </label>
            <select
              value={formData.cashierId}
              onChange={(e) => handleChange('cashierId', e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: errors.cashierId ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            >
              <option value="">Select Cashier</option>
              {(staff || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.cashierId && (
              <div style={{
                fontSize: '12px',
                color: '#e74c3c',
                marginTop: '4px'
              }}>
                {errors.cashierId}
              </div>
            )}
          </div>

          {/* Opening Float */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Opening Float
            </label>
            <input
              type="number"
              value={formData.openingFloat}
              onChange={(e) => handleChange('openingFloat', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
              min="0"
              step="0.01"
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: errors.openingFloat ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            />
            {errors.openingFloat && (
              <div style={{
                fontSize: '12px',
                color: '#e74c3c',
                marginTop: '4px'
              }}>
                {errors.openingFloat}
              </div>
            )}
          </div>

          {/* Expected Close Time */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Expected Closing Time
            </label>
            <input
              type="datetime-local"
              value={formData.expectedCloseAt}
              onChange={(e) => handleChange('expectedCloseAt', e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)'
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '8px'
            }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isSubmitting}
              placeholder="Any notes for this shift..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div style={{
              padding: '12px',
              background: '#fee',
              border: '1px solid #e74c3c',
              borderRadius: 'var(--cafe-radius-md)',
              fontSize: '14px',
              color: '#e74c3c'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'var(--cafe-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--cafe-radius-md)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Opening...' : 'Open Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OpenShiftDialog;
