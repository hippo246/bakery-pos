import React from 'react';
import { useState, useCallback } from "react";
import { CASH_DROP_TYPES, addCashDrop } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";

function CashDrops({ shift, setShift, staff, currentUser }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    reason: '',
    requiresApproval: false,
    approvedBy: '',
    approvedByName: ''
  });
  const [errors, setErrors] = useState({});

  const handleAddCashDrop = useCallback((e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    if (formData.requiresApproval && !formData.approvedBy) {
      newErrors.approvedBy = 'Manager approval required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cashDrop = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      reason: formData.reason,
      approvedBy: formData.approvedBy || null,
      approvedByName: formData.approvedByName || null,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'SYSTEM',
      createdByName: currentUser?.name || 'System'
    };

    const updatedShift = addCashDrop({ ...shift }, cashDrop);
    setShift(updatedShift);
    
    setShowAddDialog(false);
    setFormData({
      type: '',
      amount: '',
      reason: '',
      requiresApproval: false,
      approvedBy: '',
      approvedByName: ''
    });
    setErrors({});
  }, [formData, shift, setShift, currentUser]);

  const getTypeIcon = (type) => {
    const icons = {
      'SAFE_DROP': '🔒',
      'BANK_DEPOSIT': '🏦',
      'TRANSFER': '➡️'
    };
    return icons[type] || '💵';
  };

  const totalDropped = shift.cashDrops?.reduce((sum, drop) => sum + drop.amount, 0) || 0;

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Cash Drops
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Add Cash Drop
        </button>
      </div>

      {/* Summary */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '24px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              Total Dropped
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#27ae60'
            }}>
              {formatCurrency(totalDropped)}
            </div>
          </div>
          <div style={{
            fontSize: '48px',
            opacity: 0.2
          }}>
            💰
          </div>
        </div>
      </div>

      {/* Cash Drop List */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '24px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '16px'
        }}>
          Drop History ({shift.cashDrops?.length || 0})
        </div>
        {shift.cashDrops?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--cafe-text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔒</div>
            <div style={{ fontSize: '14px' }}>No cash drops recorded</div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {shift.cashDrops.map((drop, idx) => (
              <CashDropCard
                key={drop.id || idx}
                drop={drop}
                icon={getTypeIcon(drop.type)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
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
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--cafe-bg-surface)',
            borderRadius: 'var(--cafe-radius-lg)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--cafe-text-primary)',
                margin: 0
              }}>
                Add Cash Drop
              </h2>
              <button
                onClick={() => setShowAddDialog(false)}
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

            <form onSubmit={handleAddCashDrop} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--cafe-text-primary)',
                  marginBottom: '8px'
                }}>
                  Drop Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: errors.type ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                    borderRadius: 'var(--cafe-radius-md)',
                    background: 'var(--cafe-bg-elevated)',
                    color: 'var(--cafe-text-primary)'
                  }}
                >
                  <option value="">Select Type</option>
                  {Object.values(CASH_DROP_TYPES).map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
                {errors.type && (
                  <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                    {errors.type}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--cafe-text-primary)',
                  marginBottom: '8px'
                }}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: errors.amount ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                    borderRadius: 'var(--cafe-radius-md)',
                    background: 'var(--cafe-bg-elevated)',
                    color: 'var(--cafe-text-primary)'
                  }}
                />
                {errors.amount && (
                  <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                    {errors.amount}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--cafe-text-primary)',
                  marginBottom: '8px'
                }}>
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe the cash drop..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: errors.reason ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                    borderRadius: 'var(--cafe-radius-md)',
                    background: 'var(--cafe-bg-elevated)',
                    color: 'var(--cafe-text-primary)',
                    resize: 'vertical'
                  }}
                />
                {errors.reason && (
                  <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                    {errors.reason}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                <label htmlFor="requiresApproval" style={{
                  fontSize: '14px',
                  color: 'var(--cafe-text-primary)',
                  cursor: 'pointer'
                }}>
                  Requires Manager Approval
                </label>
              </div>

              {formData.requiresApproval && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--cafe-text-primary)',
                    marginBottom: '8px'
                  }}>
                    Approving Manager *
                  </label>
                  <select
                    value={formData.approvedBy}
                    onChange={(e) => {
                      const manager = staff?.find(s => s.id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        approvedBy: e.target.value,
                        approvedByName: manager?.name || ''
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: errors.approvedBy ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
                      borderRadius: 'var(--cafe-radius-md)',
                      background: 'var(--cafe-bg-elevated)',
                      color: 'var(--cafe-text-primary)'
                    }}
                  >
                    <option value="">Select Manager</option>
                    {(staff || []).filter(s => s.role === 'MANAGER' || s.role === 'SUPERVISOR').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.approvedBy && (
                    <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                      {errors.approvedBy}
                    </div>
                  )}
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'var(--cafe-bg-elevated)',
                    color: 'var(--cafe-text-primary)',
                    border: '1px solid var(--cafe-border-light)',
                    borderRadius: 'var(--cafe-radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'var(--cafe-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--cafe-radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Add Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CashDropCard({ drop, icon }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      padding: '16px',
      border: '1px solid var(--cafe-border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '32px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '4px'
        }}>
          {drop.type.replace('_', ' ')}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)',
          marginBottom: '4px'
        }}>
          {drop.reason}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {drop.approvedByName ? `Approved by ${drop.approvedByName}` : 'No approval required'}
        </div>
      </div>
      <div style={{
        textAlign: 'right'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#27ae60'
        }}>
          {formatCurrency(drop.amount)}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {new Date(drop.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default CashDrops;
