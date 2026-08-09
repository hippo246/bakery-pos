/**
 * Classic Tables - Classic POS Theme
 * 
 * Modern flat/gradient touchscreen POS skin for Tables with:
 * - Top function key panel (maroon gradient tiles, MENU/MORE tabs)
 * - Top chrome bar (license info, customer name, terminal ID, checkboxes)
 * - Dark tile grid for tables (table number bold white, status as colored dot)
 * - Action buttons (OPEN TABLE, MERGE, TRANSFER) in gradient maroon tile style
 */

import React, { useState, useMemo, useCallback } from 'react';
import FunctionKeyPanel from '../classic-pos/FunctionKeyPanel';
import TopChrome from '../classic-pos/TopChrome';
import ActionButtons from '../classic-pos/ActionButtons';
import NumericKeypad from '../classic-pos/NumericKeypad';

export default function ClassicTables({
  tables = [],
  setTables,
  orders = [],
  onNavigate,
}) {
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [coversInput, setCoversInput] = useState('');

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit': onNavigate?.('dashboard'); break;
      case 'orders': onNavigate?.('orders'); break;
      case 'reports': onNavigate?.('analytics'); break;
    }
  }, [onNavigate]);

  const handleTableClick = useCallback((table) => {
    setSelectedTable(table);
  }, []);

  const handleActionClick = useCallback((actionId) => {
    console.log('Table action:', actionId, selectedTable);
    switch (actionId) {
      case 'open_table':
        if (selectedTable && setTables) {
          setTables(prev => prev.map(t => 
            t.id === selectedTable.id ? { ...t, status: 'occupied' } : t
          ));
          onNavigate?.('orders');
        }
        break;
      case 'merge':
        console.log('Merge table:', selectedTable);
        break;
      case 'transfer':
        console.log('Transfer table:', selectedTable);
        break;
      case 'clear':
        if (selectedTable && setTables) {
          setTables(prev => prev.map(t => 
            t.id === selectedTable.id ? { ...t, status: 'available' } : t
          ));
        }
        break;
    }
  }, [selectedTable, setTables, onNavigate]);

  const handleCoversChange = useCallback((value) => {
    setCoversInput(value);
  }, []);

  // Status colors for table indicators
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'occupied': return '#ef4444';
      case 'reserved': return '#f59e0b';
      case 'cleaning': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  // Dark tile style for tables (matches ProductGrid)
  const tableTileStyle = (isSelected) => ({
    width: '150px',
    height: '150px',
    borderRadius: '8px',
    border: isSelected ? '2px solid #ffd700' : '1px solid #e0e0e0',
    background: '#2d2d2d',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    gap: '8px',
    position: 'relative',
  });

  const tableNumberStyle = {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
  };

  const tableStatusStyle = (status) => ({
    fontSize: '11px',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    textAlign: 'center',
  });

  const statusDotStyle = (status) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: getStatusColor(status),
    position: 'absolute',
    top: '8px',
    right: '8px',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      {/* Function Key Panel */}
      <div style={{ padding: '8px', background: '#e8e8e8', borderBottom: '1px solid #d0d0d0' }}>
        <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side - Table Grid */}
        <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Floor Plan
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, 150px)', 
            gap: '12px',
          }}>
            {tables.map((table, index) => (
              <div
                key={table.id || index}
                style={tableTileStyle(selectedTable?.id === table.id)}
                onClick={() => handleTableClick(table)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3d3d3d';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2d2d2d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={statusDotStyle(table.status)} />
                <div style={tableNumberStyle}>{table.number}</div>
                <div style={tableStatusStyle(table.status)}>{table.status}</div>
                {table.capacity && (
                  <div style={{ fontSize: '10px', color: '#aaaaaa' }}>
                    {table.capacity} seats
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Details + Actions */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', background: '#e8e8e8', borderLeft: '1px solid #d0d0d0' }}>
          
          {/* Selected Table Details */}
          {selectedTable ? (
            <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Table Details
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666666' }}>Table Number:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginLeft: '8px' }}>
                  {selectedTable.number}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666666' }}>Status:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: getStatusColor(selectedTable.status), marginLeft: '8px', textTransform: 'uppercase' }}>
                  {selectedTable.status}
                </span>
              </div>
              {selectedTable.capacity && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Capacity:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#000000', marginLeft: '8px' }}>
                    {selectedTable.capacity} seats
                  </span>
                </div>
              )}
              {selectedTable.area && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Area:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#000000', marginLeft: '8px' }}>
                    {selectedTable.area}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '8px', textAlign: 'center', color: '#666666' }}>
              Select a table to view details
            </div>
          )}

          {/* Covers Input with Numeric Keypad */}
          <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Covers (Pax)
            </div>
            <input
              type="text"
              value={coversInput}
              onChange={(e) => setCoversInput(e.target.value)}
              placeholder="Enter number of guests"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d0d0d0', fontSize: '14px', marginBottom: '12px' }}
            />
            <NumericKeypad onValueChange={handleCoversChange} />
          </div>

          {/* Action Buttons */}
          <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Actions
            </div>
            <ActionButtons
              buttons={[
                { id: 'open_table', label: 'OPEN TABLE', style: 'teal' },
                { id: 'merge', label: 'MERGE', style: 'purple' },
                { id: 'transfer', label: 'TRANSFER', style: 'red' },
                { id: 'clear', label: 'CLEAR', style: 'black' },
              ]}
              onButtonClick={handleActionClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
