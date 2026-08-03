/**
 * Revenue Chart Widget
 * Displays revenue trends over time
 */

import React, { memo } from 'react';

function RevenueChartWidget({ instance, settings }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)' }}>
        Revenue Chart
      </div>
      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 8 }}>
        Chart component coming soon
      </div>
    </div>
  );
}

export default memo(RevenueChartWidget);
