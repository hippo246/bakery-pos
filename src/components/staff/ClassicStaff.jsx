import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../classic-pos/FunctionKeyPanel';
import TopChrome from '../classic-pos/TopChrome';
import ActionButtons from '../classic-pos/ActionButtons';
import NumericKeypad from '../classic-pos/NumericKeypad';

export default function ClassicStaff({ staff = [], setStaff, onNavigate }) {
  const [customerName, setCustomerName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pinInput, setPinInput] = useState('');

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit': onNavigate?.('dashboard'); break;
      case 'orders': onNavigate?.('orders'); break;
    }
  }, [onNavigate]);

  const handleActionClick = useCallback((actionId) => {
    console.log('Staff action:', actionId, selectedStaff);
    if (!selectedStaff || !setStaff) return;

    switch (actionId) {
      case 'clock_in':
        setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, status: 'active' } : s));
        break;
      case 'clock_out':
        setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, status: 'inactive' } : s));
        break;
      case 'break':
        setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, status: 'on_break' } : s));
        break;
    }
  }, [selectedStaff, setStaff]);

  const handleStaffClick = useCallback((staffMember) => {
    setSelectedStaff(staffMember);
    setPinInput('');
  }, []);

  const mockStaff = staff.length > 0 ? staff : [
    { id: 1, name: 'John Doe', role: 'Manager', status: 'active' },
    { id: 2, name: 'Jane Smith', role: 'Server', status: 'inactive' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      <div style={{ padding: '8px', background: '#e8e8e8', borderBottom: '1px solid #d0d0d0' }}>
        <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {mockStaff.map((s) => (
              <div
                key={s.id}
                onClick={() => handleStaffClick(s)}
                style={{
                  width: '200px',
                  height: '120px',
                  background: selectedStaff?.id === s.id ? '#8B0000' : '#2d2d2d',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: selectedStaff?.id === s.id ? '2px solid #ffd700' : '1px solid #e0e0e0',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>{s.name}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffd700', marginBottom: '8px' }}>{s.role}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.status === 'active' ? '#22c55e' : s.status === 'inactive' ? '#94a3b8' : '#f59e0b' }} />
                  <div style={{ fontSize: '11px', color: '#ffffff', textTransform: 'uppercase' }}>{s.status.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '320px', padding: '16px', background: '#e8e8e8', borderLeft: '1px solid #d0d0d0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedStaff && (
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #d0d0d0' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '8px' }}>{selectedStaff.name}</div>
              <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>{selectedStaff.role}</div>
              <div style={{ fontSize: '12px', color: selectedStaff.status === 'active' ? '#22c55e' : '#666666' }}>Status: {selectedStaff.status.toUpperCase()}</div>
            </div>
          )}

          <NumericKeypad onValueChange={(val) => console.log('PIN:', val)} />

          <ActionButtons
            buttons={[
              { id: 'clock_in', label: 'CLOCK IN', style: 'teal' },
              { id: 'clock_out', label: 'CLOCK OUT', style: 'red' },
              { id: 'break', label: 'BREAK', style: 'purple' },
            ]}
            onButtonClick={handleActionClick}
          />
        </div>
      </div>
    </div>
  );
}
