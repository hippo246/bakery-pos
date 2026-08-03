/**
 * Active Orders Widget
 * Displays currently active orders
 */

import React, { memo } from 'react';

function ActiveOrdersWidget({ instance, settings }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCount = () => {
      const mockCount = Math.floor(Math.random() * 20) + 5;
      setCount(mockCount);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
        {count}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Active Orders
      </div>
    </div>
  );
}

export default memo(ActiveOrdersWidget);
