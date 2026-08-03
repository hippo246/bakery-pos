import React from 'react';
import { useMemo } from "react";
import { PAYMENT_TYPES } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function PaymentReconciliation({ shift, onReconcile }) {
  const isMobile = useIsMobile();

  // Calculate reconciliation for each payment type
  const reconciliationData = useMemo(() => {
    if (!shift || !shift.payments) return [];

    return Object.entries(shift.payments).map(([type, data]) => ({
      type: type.replace('_', ' '),
      typeKey: type,
      expected: data.expected || 0,
      actual: data.actual || 0,
      difference: data.difference || 0
    })).filter(item => item.expected > 0 || item.actual > 0);
  }, [shift]);

  const getPaymentIcon = (type) => {
    const icons = {
      'CASH': '💵',
      'UPI': '📱',
      'CARD': '💳',
      'ONLINE': '🌐',
      'GIFT CARD': '🎁',
      'COD': '📦',
      'SPLIT': '🔀'
    };
    return icons[type] || '💳';
  };

  const getDifferenceStatus = (difference) => {
    if (Math.abs(difference) < 0.01) return 'reconciled';
    if (difference > 0) return 'over';
    return 'under';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reconciled': return '#27ae60';
      case 'over': return '#f39c12';
      case 'under': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const totalExpected = reconciliationData.reduce((sum, item) => sum + item.expected, 0);
  const totalActual = reconciliationData.reduce((sum, item) => sum + item.actual, 0);
  const totalDifference = totalActual - totalExpected;

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
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Payment Reconciliation
        </div>
        <button
          onClick={onReconcile}
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
          Reconcile All
        </button>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <SummaryCard
          label="Total Expected"
          value={formatCurrency(totalExpected)}
          color="#3498db"
        />
        <SummaryCard
          label="Total Actual"
          value={formatCurrency(totalActual)}
          color="#27ae60"
        />
        <SummaryCard
          label="Total Difference"
          value={formatCurrency(totalDifference)}
          color={getStatusColor(getDifferenceStatus(totalDifference))}
        />
      </div>

      {/* Payment Type Breakdown */}
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
          marginBottom: '20px'
        }}>
          Payment Type Breakdown
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {reconciliationData.map((item) => (
            <PaymentTypeCard
              key={item.typeKey}
              type={item.type}
              icon={getPaymentIcon(item.type)}
              expected={item.expected}
              actual={item.actual}
              difference={item.difference}
              status={getDifferenceStatus(item.difference)}
              onReconcile={() => onReconcile?.(item.typeKey)}
            />
          ))}
        </div>
      </div>

      {/* Reconciliation Status */}
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
          Reconciliation Status
        </div>
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <StatusBadge
            label="Reconciled"
            count={reconciliationData.filter(i => getDifferenceStatus(i.difference) === 'reconciled').length}
            color="#27ae60"
          />
          <StatusBadge
            label="Over"
            count={reconciliationData.filter(i => getDifferenceStatus(i.difference) === 'over').length}
            color="#f39c12"
          />
          <StatusBadge
            label="Under"
            count={reconciliationData.filter(i => getDifferenceStatus(i.difference) === 'under').length}
            color="#e74c3c"
          />
        </div>
      </div>

      {/* Alerts */}
      {reconciliationData.some(i => Math.abs(i.difference) > 10) && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#856404',
            marginBottom: '8px'
          }}>
            ⚠️ Payment Discrepancies Detected
          </div>
          <div style={{
            fontSize: '14px',
            color: '#856404'
          }}>
            Some payment types have significant differences. Please verify before closing shift.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color
      }}>
        {value}
      </div>
    </div>
  );
}

function PaymentTypeCard({ type, icon, expected, actual, difference, status, onReconcile }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'reconciled': return '#27ae60';
      case 'over': return '#f39c12';
      case 'under': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const hasDiscrepancy = Math.abs(difference) > 0.01;

  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      padding: '16px',
      border: hasDiscrepancy ? '2px solid #f39c12' : '1px solid var(--cafe-border-light)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)'
        }}>
          {type}
        </div>
        <div style={{
          marginLeft: 'auto',
          padding: '4px 8px',
          background: `${getStatusColor(status)}20`,
          color: getStatusColor(status),
          borderRadius: 'var(--cafe-radius-sm)',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {status}
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          Expected
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--cafe-text-primary)'
        }}>
          {formatCurrency(expected)}
        </span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          Actual
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--cafe-text-primary)'
        }}>
          {formatCurrency(actual)}
        </span>
      </div>
      {hasDiscrepancy && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--cafe-border-light)',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            Difference
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: getStatusColor(status)
          }}>
            {difference > 0 ? '+' : ''}{formatCurrency(difference)}
          </span>
        </div>
      )}
      <button
        onClick={onReconcile}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '12px',
          fontWeight: '600',
          background: 'var(--cafe-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--cafe-radius-sm)',
          cursor: 'pointer'
        }}
      >
        Reconcile
      </button>
    </div>
  );
}

function StatusBadge({ label, count, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: `${color}20`,
      borderRadius: 'var(--cafe-radius-md)'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color
      }} />
      <span style={{
        fontSize: '14px',
        fontWeight: '600',
        color
      }}>
        {label}: {count}
      </span>
    </div>
  );
}

export default PaymentReconciliation;
