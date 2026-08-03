import React from 'react';
import { useMemo } from "react";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function ReservationIntelligence({ insights, reservations, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const reservationInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.RESERVATION);
  }, [insights]);

  // Calculate reservation metrics
  const metrics = useMemo(() => {
    if (!reservations || reservations.length === 0) {
      return {
        totalReservations: 0,
        todayReservations: 0,
        unassigned: 0,
        avgPartySize: 0
      };
    }

    const now = new Date();
    const today = now.toDateString();
    
    const todayReservations = reservations.filter(r => {
      const resDate = new Date(r.date);
      return resDate.toDateString() === today;
    });

    const unassigned = todayReservations.filter(r => !r.tableId).length;
    
    const totalPartySize = reservations.reduce((sum, r) => sum + (r.partySize || 2), 0);
    const avgPartySize = reservations.length > 0 ? totalPartySize / reservations.length : 0;

    return {
      totalReservations: reservations.length,
      todayReservations: todayReservations.length,
      unassigned,
      avgPartySize: Math.round(avgPartySize)
    };
  }, [reservations]);

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
          Reservation Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Reservations"
          value={metrics.totalReservations.toString()}
        />
        <MetricCard
          label="Today"
          value={metrics.todayReservations.toString()}
        />
        <MetricCard
          label="Unassigned"
          value={metrics.unassigned.toString()}
          alert={metrics.unassigned > 0}
        />
        <MetricCard
          label="Avg Party Size"
          value={metrics.avgPartySize.toString()}
        />
      </div>

      {/* Upcoming Reservations */}
      {reservations && reservations.length > 0 && (
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
            Upcoming Reservations
          </div>
          <UpcomingReservations reservations={reservations} onAction={onAction} />
        </div>
      )}

      {/* Reservation Insights */}
      {reservationInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {reservationInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📅</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more reservation data before generating insights.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, alert }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: alert ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
      background: alert ? '#fee' : 'var(--cafe-bg-surface)'
    }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: alert ? '#e74c3c' : 'var(--cafe-text-primary)'
      }}>
        {value}
      </div>
    </div>
  );
}

function UpcomingReservations({ reservations, onAction }) {
  const now = new Date();
  const upcoming = useMemo(() => {
    return reservations
      .filter(r => {
        const resDate = new Date(r.date);
        return resDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [reservations]);

  if (upcoming.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--cafe-text-secondary)'
      }}>
        No upcoming reservations
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {upcoming.map(reservation => (
        <div
          key={reservation.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: !reservation.tableId ? '#fff3cd' : 'var(--cafe-bg-elevated)',
            borderRadius: 'var(--cafe-radius-md)',
            border: !reservation.tableId ? '1px solid #ffc107' : '1px solid var(--cafe-border-light)'
          }}
        >
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '4px'
            }}>
              {reservation.customerName || 'Guest'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {new Date(reservation.date).toLocaleString()} • {reservation.partySize || 2} guests
            </div>
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            {!reservation.tableId ? (
              <button
                onClick={() => onAction?.({ type: 'NAVIGATE', target: 'tables' })}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'var(--cafe-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Assign Table
              </button>
            ) : (
              <div style={{
                fontSize: '12px',
                color: '#27ae60',
                fontWeight: '600'
              }}>
                {reservation.tableId}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight, onAction }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#e74c3c';
      case 'HIGH': return '#f39c12';
      case 'MEDIUM': return '#3498db';
      case 'LOW': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{
      padding: '16px',
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-md)',
      border: '1px solid var(--cafe-border-light)',
      borderLeft: `4px solid ${getPriorityColor(insight.priority)}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)'
        }}>
          {insight.title}
        </div>
        {insight.value && (
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: getPriorityColor(insight.priority)
          }}>
            {insight.value}
          </div>
        )}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '12px'
      }}>
        {insight.description}
      </div>
      {insight.actions && insight.actions.length > 0 && (
        <button
          onClick={() => onAction?.(insight.actions[0])}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer'
          }}
        >
          {insight.actions[0].label}
        </button>
      )}
    </div>
  );
}

export default ReservationIntelligence;
