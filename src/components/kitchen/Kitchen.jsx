import React, { useState } from 'react';
import KitchenDisplaySystem from './KitchenDisplaySystem';
import KitchenStationManager from './KitchenStationManager';

export default function Kitchen({ onNavigate, orders = [] }) {
  const [view, setView] = useState('kds'); // 'kds' or 'stations'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{
                color: '#111827',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                👨‍🍳 Kitchen
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                Manage kitchen orders and stations
              </div>
            </div>
            
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setView('kds')}
                style={{
                  padding: '10px 20px',
                  background: view === 'kds' ? '#111827' : '#ffffff',
                  color: view === 'kds' ? '#ffffff' : '#111827',
                  border: view === 'kds' ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                KDS Display
              </button>
              <button
                onClick={() => setView('stations')}
                style={{
                  padding: '10px 20px',
                  background: view === 'stations' ? '#111827' : '#ffffff',
                  color: view === 'stations' ? '#ffffff' : '#111827',
                  border: view === 'stations' ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Station Config
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'kds' ? (
          <KitchenDisplaySystem />
        ) : (
          <KitchenStationManager />
        )}
      </div>
    </div>
  );
}
