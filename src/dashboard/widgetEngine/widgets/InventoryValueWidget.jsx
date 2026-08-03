/**
 * Inventory Value Widget
 * Displays total inventory value
 */

import React, { memo } from 'react';

function InventoryValueWidget({ instance, settings }) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const fetchValue = () => {
      const mockValue = Math.floor(Math.random() * 500000) + 100000;
      setValue(mockValue);
    };

    fetchValue();
    const interval = setInterval(fetchValue, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
        ₹{value.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Inventory Value
      </div>
    </div>
  );
}

export default memo(InventoryValueWidget);
