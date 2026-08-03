/**
 * Reservations Today Widget
 * Displays reservations for today
 */

import React, { memo } from 'react';

function ReservationsTodayWidget({ instance, settings }) {
  const [reservations, setReservations] = React.useState([]);

  React.useEffect(() => {
    const fetchReservations = () => {
      const mockReservations = [
        { id: 1, name: 'John Doe', time: '7:00 PM', guests: 4 },
        { id: 2, name: 'Jane Smith', time: '8:00 PM', guests: 2 },
        { id: 3, name: 'Bob Johnson', time: '8:30 PM', guests: 6 }
      ];
      setReservations(mockReservations);
    };

    fetchReservations();
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
        Today's Reservations
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {reservations.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--cafe-text-tertiary)', padding: 20 }}>
            No reservations today
          </div>
        ) : (
          reservations.map((res) => (
            <div key={res.id} style={{ 
              padding: '8px 12px', 
              borderBottom: '1px solid var(--cafe-border-light)',
              fontSize: 13,
              color: 'var(--cafe-text-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{res.name}</span>
                <span style={{ color: 'var(--cafe-accent)' }}>{res.time}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                {res.guests} guests
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(ReservationsTodayWidget);
