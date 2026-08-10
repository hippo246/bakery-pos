import { useState } from 'react';

export default function FunctionKeyPanel({ onKeyPress }) {
  const [activeTab, setActiveTab] = useState('MENU');

  const menuButtons = [
    { key: 'F1', label: 'SEARCH', action: 'search' },
    { key: 'F2', label: 'HOLD', action: 'hold' },
    { key: 'F3', label: 'RECALL', action: 'recall' },
    { key: 'F4', label: 'CLEAR', action: 'clear' },
    { key: 'F5', label: 'CHECKOUT', action: 'checkout' },
    { key: 'F6', label: 'DISCOUNT', action: 'discount' },
    { key: 'F7', label: 'CUSTOMER', action: 'customer' },
    { key: 'F8', label: 'TABLE', action: 'table' },
    { key: 'F9', label: 'SETTLEMENT', action: 'settlement' },
  ];

  const moreButtons = [
    { key: '', label: 'SPLIT BILL', action: 'splitBill' },
    { key: '', label: 'ORDER QUEUE', action: 'orderSequence' },
    { key: '', label: 'VOID REASON', action: 'voidReason' },
    { key: '', label: 'MGR OVERRIDE', action: 'managerOverride' },
    { key: '', label: 'INVENTORY', action: 'inventory' },
    { key: '', label: 'WASTE TRACK', action: 'waste_tracking' },
    { key: '', label: 'TABLE MAP', action: 'table_map' },
    { key: '', label: 'RESERVATIONS', action: 'reservations' },
    { key: '', label: 'WAITLIST', action: 'waitlist' },
    { key: '', label: 'SALES DASH', action: 'sales_dashboard' },
    { key: '', label: 'ANALYTICS', action: 'analytics' },
    { key: '', label: 'DELAYED FIRE', action: 'delayed_firing' },
    { key: '', label: 'STAFF', action: 'staff_management' },
    { key: '', label: 'SHIFTS', action: 'shift_management' },
    { key: '', label: 'DIETARY', action: 'dietary_options' },
    { key: '', label: 'DEPOSITS', action: 'split_payment' },
    { key: '', label: 'CANCEL ORD', action: 'order_cancellation' },
  ];

  const buttons = activeTab === 'MENU' ? menuButtons : moreButtons;

  const handleButtonClick = (button) => {
    console.log('Button clicked:', button);
    if (onKeyPress) {
      try {
        onKeyPress(button.key, button.action);
      } catch (error) {
        console.error('Error handling button click:', error);
      }
    } else {
      console.error('onKeyPress handler not provided');
    }
  };

  const buttonStyle = {
    width: '100%',
    height: '85px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--classic-pos-func-btn-bg)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    transition: 'all 0.15s ease',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  };

  const getTabStyle = (tab) => ({
    padding: '10px 28px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    background: activeTab === tab ? 'var(--classic-pos-func-tab-active)' : 'var(--classic-pos-func-tab-inactive)',
    color: activeTab === tab ? '#ffffff' : 'var(--classic-pos-name-color)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    marginRight: '4px',
    boxShadow: activeTab === tab ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
  });

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: activeTab === 'MENU' ? 'repeat(3, 85px)' : 'repeat(6, 70px)',
    gap: '6px',
    padding: '8px',
    background: 'var(--classic-pos-func-grid-bg)',
    borderRadius: '0 8px 8px 8px',
    maxHeight: activeTab === 'MENU' ? 'auto' : '450px',
    overflowY: 'auto',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', gap: '4px', paddingLeft: '8px' }}>
        <button
          style={getTabStyle('MENU')}
          onClick={() => setActiveTab('MENU')}
        >
          MENU
        </button>
        <button
          style={getTabStyle('MORE')}
          onClick={() => setActiveTab('MORE')}
        >
          MORE
        </button>
      </div>

      <div style={gridStyle}>
        {buttons.map((button, index) => (
          <button
            key={index}
            style={buttonStyle}
            onClick={() => handleButtonClick(button)}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--classic-pos-func-btn-bg-hover)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--classic-pos-func-btn-bg)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
          >
            {button.key && <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: '600' }}>{button.key}</span>}
            <span style={{ lineHeight: '1.2' }}>{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
