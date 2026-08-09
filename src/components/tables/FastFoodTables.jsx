/**
 * Fast Food Tables Layout
 * 
 * Vibrant touch-friendly table management with fast food styling.
 */

import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../fastfood-pos/FunctionKeyPanel';
import ActionButtons from '../fastfood-pos/ActionButtons';
import TopChrome from '../fastfood-pos/TopChrome';

export default function FastFoodTables(props) {
  const { onNavigate } = props;
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [coversInput, setCoversInput] = useState('');

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit':
        onNavigate?.('dashboard');
        break;
      case 'clear':
        setSelectedTable(null);
        setCoversInput('');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const handleActionClick = useCallback((action) => {
    console.log('Action clicked:', action);
    switch (action) {
      case 'orders':
        onNavigate?.('orders');
        break;
      case 'dashboard':
        onNavigate?.('dashboard');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const actionButtons = [
    { id: 'orders', label: 'ORDERS', style: 'teal' },
    { id: 'dashboard', label: 'DASHBOARD', style: 'red' },
  ];

  const tableStyle = (isSelected, isOccupied) => ({
    width: '120px',
    height: '120px',
    borderRadius: '16px',
    border: '3px solid',
    borderColor: isSelected ? '#ffd700' : isOccupied ? '#e74c3c' : '#27ae60',
    background: isOccupied 
      ? 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
      : 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  });

  const tables = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    name: `T${i + 1}`,
    occupied: [1, 3, 5, 7, 9].includes(i + 1),
    covers: Math.floor(Math.random() * 6) + 1,
  }));

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f5f5f5',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        gap: '12px', 
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Left Panel - Function Keys */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
        }}>
          <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
        </div>

        {/* Center Panel - Tables Grid */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          overflow: 'auto',
        }}>
          <h2 style={{ 
            margin: '0', 
            fontSize: '28px', 
            fontWeight: '800',
            color: '#2d3436',
          }}>
            Floor Plan
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, 120px)',
            gap: '16px',
            padding: '16px',
            background: '#ffffff',
            borderRadius: '16px',
          }}>
            {tables.map((table) => (
              <div
                key={table.id}
                style={tableStyle(selectedTable?.id === table.id, table.occupied)}
                onClick={() => setSelectedTable(table)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#2d3436' }}>
                  {table.name}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>
                  {table.occupied ? `${table.covers} covers` : 'Available'}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Table Info */}
          {selectedTable && (
            <div style={{ 
              background: 'linear-gradient(135deg, #e8f4fd 0%, #d4e9f7 100%)',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #2196f3',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: '#2d3436' }}>
                {selectedTable.name} - {selectedTable.occupied ? 'Occupied' : 'Available'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                  Covers:
                </div>
                <input
                  type="number"
                  value={coversInput}
                  onChange={(e) => setCoversInput(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #2196f3',
                    fontSize: '14px',
                    width: '80px',
                  }}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Actions */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          minWidth: '200px',
        }}>
          <ActionButtons buttons={actionButtons} onButtonClick={handleActionClick} />
        </div>
      </div>
    </div>
  );
}
