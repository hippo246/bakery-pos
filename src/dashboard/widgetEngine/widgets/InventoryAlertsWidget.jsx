/**
 * Inventory Alerts Widget
 * Displays low stock and out-of-stock items
 */

import React, { memo } from 'react';

function InventoryAlertsWidget({ instance, settings }) {
  const [alerts, setAlerts] = React.useState(0);

  React.useEffect(() => {
    const fetchAlerts = () => {
      const mockAlerts = Math.floor(Math.random() * 10);
      setAlerts(mockAlerts);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: alerts > 0 ? 'var(--cafe-warning)' : 'var(--cafe-success)', fontFamily: 'monospace' }}>
        {alerts}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        Inventory Alerts
      </div>
    </div>
  );
}

export default memo(InventoryAlertsWidget);
