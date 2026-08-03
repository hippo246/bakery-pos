/**
 * Revenue Today Widget
 * Displays today's total revenue
 */

import React, { memo } from 'react';

function RevenueTodayWidget({ instance, settings }) {
  const [revenue, setRevenue] = React.useState(0);

  React.useEffect(() => {
    // Simulate fetching revenue data
    const fetchRevenue = () => {
      // In production, this would fetch from actual data
      const mockRevenue = Math.floor(Math.random() * 50000) + 10000;
      setRevenue(mockRevenue);
    };

    fetchRevenue();
    const interval = setInterval(fetchRevenue, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
        ₹{revenue.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Today's Revenue
      </div>
    </div>
  );
}

export default memo(RevenueTodayWidget);
