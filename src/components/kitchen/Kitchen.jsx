import React, { useState, useEffect } from 'react';
import KitchenDisplaySystem from './KitchenDisplaySystem';

export default function Kitchen({ onNavigate, orders = [] }) {
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('rotate', handleResize);
  }, []);

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
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              👨‍🍳 Kitchen
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Manage kitchen orders
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
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
        <KitchenDisplaySystem screenSize={screenSize} />
      </div>
    </div>
  );
}
