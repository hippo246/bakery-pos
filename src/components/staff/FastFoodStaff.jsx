/**
 * Fast Food Staff Layout
 * 
 * Vibrant touch-friendly staff management with fast food styling.
 */

import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../fastfood-pos/FunctionKeyPanel';
import ActionButtons from '../fastfood-pos/ActionButtons';
import TopChrome from '../fastfood-pos/TopChrome';

export default function FastFoodStaff(props) {
  const { onNavigate } = props;
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pinInput, setPinInput] = useState('');

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit':
        onNavigate?.('dashboard');
        break;
      case 'clear':
        setSelectedStaff(null);
        setPinInput('');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const handleActionClick = useCallback((action) => {
    console.log('Action clicked:', action);
    switch (action) {
      case 'dashboard':
        onNavigate?.('dashboard');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const actionButtons = [
    { id: 'dashboard', label: 'DASHBOARD', style: 'teal' },
  ];

  const mockStaff = [
    { id: 1, name: 'John Smith', role: 'Manager', status: 'online' },
    { id: 2, name: 'Sarah Johnson', role: 'Server', status: 'online' },
    { id: 3, name: 'Mike Williams', role: 'Cook', status: 'break' },
    { id: 4, name: 'Emily Davis', role: 'Server', status: 'offline' },
    { id: 5, name: 'Chris Brown', role: 'Cook', status: 'online' },
    { id: 6, name: 'Lisa Wilson', role: 'Server', status: 'online' },
  ];

  const staffCardStyle = (isSelected, status) => ({
    padding: '16px',
    borderRadius: '12px',
    border: '3px solid',
    borderColor: isSelected ? '#ffd700' : status === 'online' ? '#27ae60' : status === 'break' ? '#f39c12' : '#e74c3c',
    background: status === 'online'
      ? 'linear-gradient(135deg, #d5f4e6 0%, #b8e6d0 100%)'
      : status === 'break'
      ? 'linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%)'
      : 'linear-gradient(135deg, #fadbd8 0%, #f5b7b1 100%)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f5f5f5',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName=""
        onCustomerNameChange={() => {}}
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

        {/* Center Panel - Staff Grid */}
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
            Staff Management
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {mockStaff.map((staff) => (
              <div
                key={staff.id}
                style={staffCardStyle(selectedStaff?.id === staff.id, staff.status)}
                onClick={() => setSelectedStaff(staff)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#2d3436', marginBottom: '4px' }}>
                  {staff.name}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                  {staff.role}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: staff.status === 'online' ? '#27ae60' : staff.status === 'break' ? '#f39c12' : '#e74c3c',
                  textTransform: 'uppercase',
                }}>
                  {staff.status}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Staff Info */}
          {selectedStaff && (
            <div style={{ 
              background: 'linear-gradient(135deg, #e8f4fd 0%, #d4e9f7 100%)',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #2196f3',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: '#2d3436' }}>
                {selectedStaff.name} - {selectedStaff.role}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                  PIN:
                </div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #2196f3',
                    fontSize: '14px',
                    width: '120px',
                  }}
                  placeholder="****"
                  maxLength="4"
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
