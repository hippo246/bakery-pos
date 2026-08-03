import React from 'react';
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  SHIFT_STATUS, 
  getShiftDuration, 
  formatShiftDuration, 
  getShiftHealthScore,
  getActiveShift 
} from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";

function ShiftDashboard({ 
  shifts, 
  setShifts, 
  orders, 
  tables, 
  kdsCards, 
  staff,
  onOpenShift,
  onCloseShift,
  onViewHistory 
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  const [selectedRegister, setSelectedRegister] = useState('REG-001');
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Get current shift for selected register
  const currentShift = useMemo(() => {
    return getActiveShift(shifts, selectedRegister);
  }, [shifts, selectedRegister]);

  // Calculate live metrics
  const liveMetrics = useMemo(() => {
    if (!currentShift) return null;

    const shiftOrders = orders?.filter(o => {
      const orderTime = new Date(o.createdAt);
      const shiftStart = new Date(currentShift.openedAt);
      return orderTime >= shiftStart;
    }) || [];

    const openOrders = shiftOrders.filter(o => 
      !['COMPLETED', 'CANCELLED'].includes(o.status)
    );

    const openTables = tables?.filter(t => t.occupied) || [];
    const unfinishedTickets = kdsCards?.filter(k => !k.completed) || [];

    return {
      openOrders: openOrders.length,
      openTables: openTables.length,
      unfinishedTickets: unfinishedTickets.length,
      totalOrders: shiftOrders.length
    };
  }, [currentShift, orders, tables, kdsCards]);

  // Get shift health
  const healthScore = useMemo(() => {
    return currentShift ? getShiftHealthScore(currentShift) : 0;
  }, [currentShift]);

  // Get shift duration
  const duration = useMemo(() => {
    return currentShift ? getShiftDuration(currentShift) : 0;
  }, [currentShift]);

  const handleOpenShift = () => {
    setShowOpenDialog(true);
  };

  const handleCloseShift = () => {
    if (currentShift) {
      setShowCloseDialog(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SHIFT_STATUS.OPEN:
        return '#27ae60';
      case SHIFT_STATUS.CLOSING:
        return '#f39c12';
      case SHIFT_STATUS.CLOSED:
        return '#7f8c8d';
      default:
        return '#95a5a6';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  if (!currentShift) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '40px',
        gap: '24px'
      }}>
        <div style={{
          fontSize: '64px',
          opacity: 0.3
        }}>📋</div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          margin: 0
        }}>
          No Active Shift
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'var(--cafe-text-secondary)',
          textAlign: 'center',
          maxWidth: '400px',
          margin: 0
        }}>
          Open a shift to begin tracking sales, cash drawer, and operational metrics.
        </p>
        <button
          onClick={handleOpenShift}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Open Shift
        </button>
      </div>
    );
  }

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
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            margin: 0
          }}>
            Shift Dashboard
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--cafe-text-secondary)',
            margin: '4px 0 0 0'
          }}>
            {currentShift.id} • {currentShift.registerId}
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onViewHistory}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              background: 'var(--cafe-bg-elevated)',
              color: 'var(--cafe-text-primary)',
              border: '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-md)',
              cursor: 'pointer'
            }}
          >
            History
          </button>
          <button
            onClick={handleCloseShift}
            disabled={currentShift.status === SHIFT_STATUS.CLOSING}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              background: currentShift.status === SHIFT_STATUS.CLOSING 
                ? 'var(--cafe-bg-elevated)' 
                : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--cafe-radius-md)',
              cursor: currentShift.status === SHIFT_STATUS.CLOSING ? 'not-allowed' : 'pointer',
              opacity: currentShift.status === SHIFT_STATUS.CLOSING ? 0.6 : 1
            }}
          >
            {currentShift.status === SHIFT_STATUS.CLOSING ? 'Closing...' : 'Close Shift'}
          </button>
        </div>
      </div>

      {/* Current Shift Card */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '24px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '24px'
        }}>
          {/* Status */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Status
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: `${getStatusColor(currentShift.status)}20`,
              color: getStatusColor(currentShift.status),
              borderRadius: 'var(--cafe-radius-sm)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(currentShift.status),
                animation: currentShift.status === SHIFT_STATUS.OPEN ? 'pulse 2s infinite' : 'none'
              }} />
              {currentShift.status}
            </div>
          </div>

          {/* Manager */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Manager
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--cafe-text-primary)'
            }}>
              {currentShift.managerName}
            </div>
          </div>

          {/* Cashier */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Cashier
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--cafe-text-primary)'
            }}>
              {currentShift.cashierName}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Duration
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--cafe-text-primary)'
            }}>
              {formatShiftDuration(duration)}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--cafe-border-light)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {/* Opened At */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Opened At
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--cafe-text-primary)'
            }}>
              {new Date(currentShift.openedAt).toLocaleString()}
            </div>
          </div>

          {/* Expected Closing */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Expected Closing
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--cafe-text-primary)'
            }}>
              {currentShift.expectedCloseAt 
                ? new Date(currentShift.expectedCloseAt).toLocaleString()
                : 'Not set'}
            </div>
          </div>

          {/* Shift Health */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--cafe-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Shift Health
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '8px',
                background: 'var(--cafe-bg-elevated)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${healthScore}%`,
                  height: '100%',
                  background: getHealthColor(healthScore),
                  transition: 'width 0.3s'
                }} />
              </div>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: getHealthColor(healthScore)
              }}>
                {healthScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      {liveMetrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <MetricCard
            label="Open Orders"
            value={liveMetrics.openOrders}
            color="#e74c3c"
          />
          <MetricCard
            label="Open Tables"
            value={liveMetrics.openTables}
            color="#f39c12"
          />
          <MetricCard
            label="Unfinished Tickets"
            value={liveMetrics.unfinishedTickets}
            color="#9b59b6"
          />
          <MetricCard
            label="Total Orders"
            value={liveMetrics.totalOrders}
            color="#27ae60"
          />
        </div>
      )}

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
gap: '16px'
      }}>
        <StatCard
          label="Gross Sales"
          value={formatCurrency(currentShift.grossSales)}
          icon="💰"
        />
        <StatCard
          label="Net Sales"
          value={formatCurrency(currentShift.netSales)}
          icon="📊"
        />
        <StatCard
          label="Avg Order"
          value={formatCurrency(currentShift.averageOrderValue)}
          icon="📈"
        />
      </div>

      {/* Outstanding Tasks */}
      {currentShift.issues && currentShift.issues.length > 0 && (
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
            marginBottom: '12px'
          }}>
            ⚠️ Outstanding Tasks ({currentShift.issues.length})
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '14px',
            color: '#856404'
          }}>
            {currentShift.issues.map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color
      }}>
        {value}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
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
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--cafe-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default ShiftDashboard;
