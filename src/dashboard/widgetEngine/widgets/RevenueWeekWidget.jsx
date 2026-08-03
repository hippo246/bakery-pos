/**
 * Revenue Week Widget
 * Displays weekly revenue
 */

import React, { memo } from 'react';

function RevenueWeekWidget({ instance, settings }) {
  const [revenue, setRevenue] = React.useState(0);

  React.useEffect(() => {
    const fetchRevenue = () => {
      const mockRevenue = Math.floor(Math.random() * 300000) + 50000;
      setRevenue(mockRevenue);
    };

    fetchRevenue();
    const interval = setInterval(fetchRevenue, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
        ₹{revenue.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Weekly Revenue
      </div>
    </div>
  );
}

export default memo(RevenueWeekWidget);
