/**
 * Kitchen Priority Widget
 * Displays high-priority kitchen orders
 */

import React, { memo } from 'react';

function KitchenPriorityWidget({ instance, settings }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCount = () => {
      const mockCount = Math.floor(Math.random() * 5);
      setCount(mockCount);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: count > 0 ? 'var(--cafe-danger)' : 'var(--cafe-text-tertiary)', fontFamily: 'monospace' }}>
        {count}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Priority Orders
      </div>
    </div>
  );
}

export default memo(KitchenPriorityWidget);
