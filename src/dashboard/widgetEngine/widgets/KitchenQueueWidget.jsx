/**
 * Kitchen Queue Widget
 * Displays current kitchen orders
 */

import React, { memo } from 'react';

function KitchenQueueWidget({ instance, settings }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)' }}>
        Kitchen Queue
      </div>
      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 8 }}>
        Kitchen orders coming soon
      </div>
    </div>
  );
}

export default memo(KitchenQueueWidget);
