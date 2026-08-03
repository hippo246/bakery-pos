/**
 * Completed Orders Widget
 * Displays orders completed today
 */

import React, { memo } from 'react';

function CompletedOrdersWidget({ instance, settings }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCount = () => {
      const mockCount = Math.floor(Math.random() * 50) + 20;
      setCount(mockCount);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
        {count}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Completed Today
      </div>
    </div>
  );
}

export default memo(CompletedOrdersWidget);
