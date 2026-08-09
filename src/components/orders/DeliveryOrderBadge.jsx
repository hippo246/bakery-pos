/**
 * Delivery Order Badge Component
 * Shows platform badge (Zomato/Swiggy) on delivery orders
 */

import React from 'react';
import { PlatformType } from '../../delivery/DeliveryPlatformAdapter.js';

export default function DeliveryOrderBadge({ platform, orderType, style = {} }) {
  if (!platform && !['SWIGGY', 'ZOMATO'].includes(orderType)) {
    return null;
  }

  const platformType = platform?.toLowerCase() || orderType?.toLowerCase();
  
  const badgeConfig = {
    [PlatformType.ZOMATO]: {
      name: 'Zomato',
      color: '#E23744',
      icon: '🔴',
      bgColor: 'rgba(226, 55, 68, 0.1)',
      borderColor: '#E23744'
    },
    [PlatformType.SWIGGY]: {
      name: 'Swiggy',
      color: '#FC8019',
      icon: '🟠',
      bgColor: 'rgba(252, 128, 25, 0.1)',
      borderColor: '#FC8019'
    }
  };

  const config = badgeConfig[platformType] || badgeConfig[PlatformType.ZOMATO];

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: config.bgColor,
    border: `1px solid ${config.borderColor}`,
    color: config.color,
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...style
  };

  return (
    <div style={badgeStyle}>
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </div>
  );
}
