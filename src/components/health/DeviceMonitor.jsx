import React from 'react';
import { useMemo, useState } from "react";
import { checkDeviceHealth, getHealthData } from "../../utils/healthMonitoring.js";
import { HEALTH_STATUS, getHealthStatusColor, DEVICE_TYPES } from "../../domain/healthModel.js";

function DeviceMonitor() {
  const [devices, setDevices] = useState([]);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useMemo(() => {
    const healthData = getHealthData();
    if (healthData?.devices) {
      setDevices(healthData.devices);
    } else {
      setDevices([
        { id: 'printer-1', type: DEVICE_TYPES.RECEIPT_PRINTER, name: 'Main Receipt Printer', connected: true, lastSeen: new Date().toISOString() },
        { id: 'kds-1', type: DEVICE_TYPES.KITCHEN_DISPLAY, name: 'Kitchen Display 1', connected: true, lastSeen: new Date().toISOString() },
        { id: 'scanner-1', type: DEVICE_TYPES.BARCODE_SCANNER, name: 'Barcode Scanner', connected: false, lastSeen: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  }, []);

  const deviceIcons = {
    [DEVICE_TYPES.RECEIPT_PRINTER]: '🖨️',
    [DEVICE_TYPES.KITCHEN_DISPLAY]: '📺',
    [DEVICE_TYPES.CUSTOMER_DISPLAY]: '📱',
    [DEVICE_TYPES.BARCODE_SCANNER]: '🔫',
    [DEVICE_TYPES.CASH_DRAWER]: '💵',
    [DEVICE_TYPES.NETWORK]: '🌐',
    [DEVICE_TYPES.PAYMENT_TERMINAL]: '💳'
  };

  const connectedCount = devices.filter(d => d.connected).length;
  const totalCount = devices.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Device Monitor</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        <MetricCard label="Total Devices" value={totalCount} />
        <MetricCard label="Connected" value={connectedCount} color={connectedCount === totalCount ? '#27ae60' : '#f39c12'} />
        <MetricCard label="Disconnected" value={totalCount - connectedCount} color={totalCount - connectedCount > 0 ? '#e74c3c' : '#27ae60'} />
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Device Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {devices.map(device => (
            <DeviceCard key={device.id} device={device} icon={deviceIcons[device.type] || '🔌'} />
          ))}
        </div>
      </div>

      {totalCount - connectedCount > 0 && (
        <div style={{ background: '#fff3cd', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #f39c12' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>
            🟡 {totalCount - connectedCount} Device(s) Disconnected
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
            Check device connections and ensure all peripherals are properly connected.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: color || 'var(--cafe-text-primary)' }}>{value}</div>
    </div>
  );
}

function DeviceCard({ device, icon }) {
  const isOnline = device.connected;
  const lastSeen = new Date(device.lastSeen);
  const timeSince = Date.now() - lastSeen.getTime();
  const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)', border: isOnline ? '1px solid #27ae60' : '1px solid #e74c3c' }}>
      <div style={{ fontSize: '24px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{device.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{device.type.replace('_', ' ')}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ padding: '4px 12px', background: isOnline ? '#27ae60' : '#e74c3c', color: 'white', borderRadius: 'var(--cafe-radius-sm)', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
          {isOnline ? 'Connected' : 'Offline'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--cafe-text-secondary)' }}>
          {isOnline ? 'Active' : hoursSince > 24 ? `${Math.floor(hoursSince / 24)}d ago` : `${hoursSince}h ago`}
        </div>
      </div>
    </div>
  );
}

export default DeviceMonitor;
