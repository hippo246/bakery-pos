/**
 * Staff On Shift Widget
 * Displays currently active staff members
 */

import React, { memo } from 'react';

function StaffOnShiftWidget({ instance, settings }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCount = () => {
      const mockCount = Math.floor(Math.random() * 10) + 3;
      setCount(mockCount);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
        {count}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Staff on Shift
      </div>
    </div>
  );
}

export default memo(StaffOnShiftWidget);
