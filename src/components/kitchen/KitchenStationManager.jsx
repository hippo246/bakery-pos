// Kitchen Station Manager
// Configure and manage kitchen stations for KOT routing

import React, { useState, useEffect } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';

export default function KitchenStationManager() {
  const [stations, setStations] = useState([
    { id: KitchenStation.BAKERY, name: 'Bakery', enabled: true, printer: null },
    { id: KitchenStation.KITCHEN, name: 'Kitchen', enabled: true, printer: null },
    { id: KitchenStation.BEVERAGE, name: 'Beverage', enabled: true, printer: null },
    { id: KitchenStation.DESSERT, name: 'Dessert', enabled: true, printer: null },
    { id: KitchenStation.GRILL, name: 'Grill', enabled: false, printer: null },
    { id: KitchenStation.FRYER, name: 'Fryer', enabled: false, printer: null },
    { id: KitchenStation.COLD, name: 'Cold', enabled: false, printer: null },
    { id: KitchenStation.GENERAL, name: 'General', enabled: true, printer: null }
  ]);

  const [editingStation, setEditingStation] = useState(null);

  const toggleStation = (stationId) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const updateStationPrinter = (stationId, printer) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, printer } : s
    ));
  };

  const saveConfiguration = () => {
    localStorage.setItem('cafeos_kitchen_stations', JSON.stringify(stations));
    alert('Station configuration saved!');
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('cafeos_kitchen_stations');
    if (saved) {
      setStations(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  return (
    <div style={{
      background: '#f9fafb',
      minHeight: '100vh',
      color: '#111827',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '32px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            🍳 Kitchen Station Management
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Configure kitchen stations for KOT routing
          </p>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={saveConfiguration}
            style={{
              padding: '12px 24px',
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Save Configuration
          </button>
          <button
            onClick={loadConfiguration}
            style={{
              padding: '12px 24px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Reload Configuration
          </button>
        </div>

        {/* Stations Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {stations.map(station => (
            <StationCard
              key={station.id}
              station={station}
              onToggle={() => toggleStation(station.id)}
              onUpdatePrinter={(printer) => updateStationPrinter(station.id, printer)}
            />
          ))}
        </div>

        {/* Info */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500', color: '#111827' }}>ℹ️ Information</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Enable stations that are active in your kitchen</li>
            <li>Assign printer names if you have station-specific printers</li>
            <li>Items are automatically routed to stations based on their category</li>
            <li>Disabled stations will not receive KOTs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StationCard({ station, onToggle, onUpdatePrinter }) {
  const [printerInput, setPrinterInput] = useState(station.printer || '');

  const handlePrinterChange = (e) => {
    setPrinterInput(e.target.value);
    onUpdatePrinter(e.target.value);
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: station.enabled ? '2px solid #059669' : '1px solid #e5e7eb',
      opacity: station.enabled ? 1 : 0.6
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: station.enabled ? '#f0fdf4' : '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {getStationIcon(station.id)}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{station.name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{station.id}</div>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          style={{
            padding: '10px 20px',
            background: station.enabled ? '#111827' : '#f9fafb',
            color: station.enabled ? '#ffffff' : '#111827',
            border: station.enabled ? 'none' : '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {station.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
          Printer Name (optional):
        </label>
        <input
          type="text"
          value={printerInput}
          onChange={handlePrinterChange}
          placeholder="e.g., Kitchen Printer 1"
          disabled={!station.enabled}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            opacity: station.enabled ? 1 : 0.5,
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}

function getStationIcon(stationId) {
  const icons = {
    [KitchenStation.BAKERY]: '🥐',
    [KitchenStation.KITCHEN]: '🍳',
    [KitchenStation.BEVERAGE]: '☕',
    [KitchenStation.DESSERT]: '🍰',
    [KitchenStation.GRILL]: '🥩',
    [KitchenStation.FRYER]: '🍟',
    [KitchenStation.COLD]: '🥗',
    [KitchenStation.GENERAL]: '🍽️'
  };
  return icons[stationId] || '🍽️';
}
