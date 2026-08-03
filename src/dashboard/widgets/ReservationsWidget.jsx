// Reservations Widget
// Displays reservation status

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function ReservationsWidget({ reservationsData = {}, onClick = null }) {
  const [reservations, setReservations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        total: reservationsData.total || 0,
        checkedIn: reservationsData.checkedIn || 0,
        pending: reservationsData.pending || 0,
        noShow: reservationsData.noShow || 0,
        nextReservation: reservationsData.nextReservation || null
      };
      setReservations(mockData);
    } catch (err) {
      setError('Failed to load reservations');
      console.error('[ReservationsWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [reservationsData]);

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!reservations && !loading && !error) {
    return (
      <BaseWidget
        widgetType="reservations"
        title="Reservations"
        empty={true}
        emptyMessage="No reservations today"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="reservations"
      title="Reservations"
      loading={loading}
      error={error}
      onRefresh={fetchReservations}
      size="medium"
      onClick={onClick}
    >
      {reservations && (
        <div className="space-y-3">
          {/* Total Reservations */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Today</div>
            <div className="text-2xl font-bold text-gray-900">{reservations.total}</div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Checked In</div>
              <div className="text-sm font-bold text-green-600">{reservations.checkedIn}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-sm font-bold text-amber-600">{reservations.pending}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">No Show</div>
              <div className="text-sm font-bold text-red-600">{reservations.noShow}</div>
            </div>
          </div>

          {/* Next Reservation */}
          {reservations.nextReservation && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">Next Reservation</div>
              <div className="text-sm font-medium text-gray-900">
                {reservations.nextReservation.name} - {formatTime(reservations.nextReservation.time)}
              </div>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
