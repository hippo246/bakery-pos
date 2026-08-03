/**
 * Health Status Widget
 * Displays overall system health status
 */

import React, { memo } from 'react';

function HealthStatusWidget({ instance, settings }) {
  const [health, setHealth] = React.useState('healthy');

  React.useEffect(() => {
    const fetchHealth = () => {
      const statuses = ['healthy', 'warning', 'critical'];
      const mockHealth = statuses[Math.floor(Math.random() * statuses.length)];
      setHealth(mockHealth);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthColors = {
    healthy: 'var(--cafe-success)',
    warning: 'var(--cafe-warning)',
    critical: 'var(--cafe-danger)'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
      <div style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        color: healthColors[health], 
        textTransform: 'capitalize',
        fontFamily: 'monospace'
      }}>
        {health}
      </div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginTop: 8 }}>
        System Health
      </div>
    </div>
  );
}

export default memo(HealthStatusWidget);
