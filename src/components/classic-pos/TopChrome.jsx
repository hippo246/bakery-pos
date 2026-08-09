/**
 * Classic POS Top Chrome Bar
 * 
 * System status header with Terminal ID, toggles, and current item ticker.
 * Dark theme styling for legacy POS interface.
 */

import { useState, useEffect } from 'react';

export default function TopChrome({
  terminalId = 'HQ-PC01',
  speechEnabled = false,
  receiptPrintEnabled = false,
  wholeSaleEnabled = false,
  gstEnabled = true,
  taxExempt = false,
  orderType = 'walk-in',
  onSpeechToggle,
  onReceiptPrintToggle,
  onWholeSaleToggle,
  onGstToggle,
  onTaxExemptToggle,
  onOrderTypeChange,
  currentItem = null,
  customer = null,
  table = null,
  server = null,
  heldOrdersCount = 0,
  onHeldClick,
  // Feature modal toggles
  onSplitBill,
  onOrderQueue,
  onVoidReason,
  onManagerOverride,
  onInventory,
  onWasteTracking,
  onTableMap,
  onReservations,
  onWaitlist,
  onSalesDashboard,
  onAnalytics,
  onDelayedFiring,
  onStaff,
  onShifts,
  onDietary,
  onDeposits,
  onCancelOrder,
}) {
  const [showRazorpayConfig, setShowRazorpayConfig] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreMenu && !event.target.closest('[data-menu-dropdown]')) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);
  const chromeStyle = {
    background: '#1E1E1E',
    borderBottom: '2px solid #333333',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    fontSize: '12px',
    color: '#ffffff',
    height: '45px',
  };

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#cccccc',
  };

  const checkboxStyle = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#0D9488',
  };

  const tickerStyle = {
    background: '#2A2A2A',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={chromeStyle}>
      {/* Terminal ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '700', color: '#0D9488' }}>TERMINAL:</span>
        <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>{terminalId}</span>
      </div>

      <div style={{ width: 1, height: 24, background: '#444444' }} />

      {/* Order Type Selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#888888' }}>ORDER TYPE:</span>
        <button
          onClick={() => onOrderTypeChange?.('walk-in')}
          style={{
            padding: '4px 12px',
            background: orderType === 'walk-in' ? '#0D9488' : '#2A2A2A',
            color: '#ffffff',
            border: orderType === 'walk-in' ? '1px solid #0D9488' : '1px solid #444444',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (orderType !== 'walk-in') {
              e.target.style.background = '#3A3A3A';
            }
          }}
          onMouseLeave={(e) => {
            if (orderType !== 'walk-in') {
              e.target.style.background = '#2A2A2A';
            }
          }}
        >
          WALK-IN
        </button>
        <button
          onClick={() => onOrderTypeChange?.('table')}
          style={{
            padding: '4px 12px',
            background: orderType === 'table' ? '#0D9488' : '#2A2A2A',
            color: '#ffffff',
            border: orderType === 'table' ? '1px solid #0D9488' : '1px solid #444444',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (orderType !== 'table') {
              e.target.style.background = '#3A3A3A';
            }
          }}
          onMouseLeave={(e) => {
            if (orderType !== 'table') {
              e.target.style.background = '#2A2A2A';
            }
          }}
        >
          TABLE
        </button>
      </div>

      <div style={{ width: 1, height: 24, background: '#444444' }} />

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={speechEnabled}
            onChange={(e) => onSpeechToggle?.(e.target.checked)}
            style={checkboxStyle}
          />
          Speech
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={receiptPrintEnabled}
            onChange={(e) => onReceiptPrintToggle?.(e.target.checked)}
            style={checkboxStyle}
          />
          ReceiptPrint
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={wholeSaleEnabled}
            onChange={(e) => onWholeSaleToggle?.(e.target.checked)}
            style={checkboxStyle}
          />
          WholeSale
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={gstEnabled}
            onChange={(e) => onGstToggle?.(e.target.checked)}
            style={checkboxStyle}
          />
          GST
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={taxExempt}
            onChange={(e) => onTaxExemptToggle?.(e.target.checked)}
            style={checkboxStyle}
          />
          Tax Exempt
        </label>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Razorpay config button clicked');
            setShowRazorpayConfig(true);
          }}
          style={{
            padding: '4px 12px',
            background: '#0D9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Razorpay Config
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* More Menu Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          style={{
            padding: '6px 16px',
            background: '#0D9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          MENU ▼
        </button>

        {/* More Menu Dropdown */}
        {showMoreMenu && (
          <div
            data-menu-dropdown
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: '#2A2A2A',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '200px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              <button
                onClick={() => { onSplitBill?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#4A90E2',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Split Bill
              </button>
              <button
                onClick={() => { onOrderQueue?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#9B59B6',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Order Queue
              </button>
              <button
                onClick={() => { onVoidReason?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#E74C3C',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Void Reason
              </button>
              <button
                onClick={() => { onManagerOverride?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#F39C12',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Manager Override
              </button>
              <button
                onClick={() => { onInventory?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#27AE60',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Inventory
              </button>
              <button
                onClick={() => { onWasteTracking?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#16A085',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Waste Tracking
              </button>
              <button
                onClick={() => { onTableMap?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#3498DB',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Table Map
              </button>
              <button
                onClick={() => { onReservations?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#8E44AD',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Reservations
              </button>
              <button
                onClick={() => { onWaitlist?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#D35400',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Waitlist
              </button>
              <button
                onClick={() => { onSalesDashboard?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#1ABC9C',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Sales Dashboard
              </button>
              <button
                onClick={() => { onAnalytics?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#2ECC71',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Analytics
              </button>
              <button
                onClick={() => { onDelayedFiring?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#E67E22',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Delayed Firing
              </button>
              <button
                onClick={() => { onStaff?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#34495E',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Staff
              </button>
              <button
                onClick={() => { onShifts?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#7F8C8D',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Shifts
              </button>
              <button
                onClick={() => { onDietary?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#C0392B',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Dietary
              </button>
              <button
                onClick={() => { onDeposits?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#9B59B6',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Deposits
              </button>
              <button
                onClick={() => { onCancelOrder?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: '#C0392B',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  gridColumn: 'span 2'
                }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 24, background: '#444444' }} />

      {/* Customer & Table Info */}
      <div style={{ ...tickerStyle, marginRight: '8px' }}>
        {customer && <span style={{ marginRight: '12px' }}>CUST: {customer}</span>}
        {table && <span style={{ marginRight: '12px' }}>TABLE: {table}</span>}
        {server && <span style={{ marginRight: '12px' }}>SERVER: {server}</span>}
        {!table && orderType === 'table' && <span style={{ color: '#DC2626' }}>NO TABLE SELECTED</span>}
      </div>

      {/* Held Orders Count */}
      {heldOrdersCount > 0 && (
        <div
          style={{ ...tickerStyle, background: '#DC2626', marginRight: '8px', cursor: 'pointer', userSelect: 'none' }}
          onClick={onHeldClick}
          title="Click to view held orders"
        >
          HELD: {heldOrdersCount}
        </div>
      )}

      {/* Current Item Ticker */}
      {currentItem && (
        <div style={tickerStyle}>
          <span>{currentItem.name} {currentItem.qty} x ₹{currentItem.price} = ₹{currentItem.amount}</span>
        </div>
      )}

      {/* Razorpay Configuration Modal */}
      {showRazorpayConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowRazorpayConfig(false);
        }}>
          <div style={{
            background: '#2A2A2A',
            border: '2px solid #0D9488',
            borderRadius: '8px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 20px',
            }}>
              Razorpay Configuration
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#cccccc',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                API Key
              </label>
              <input
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                placeholder="rzp_test_..."
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1E1E1E',
                  border: '1px solid #444444',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#cccccc',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                API Secret
              </label>
              <input
                type="password"
                value={razorpaySecret}
                onChange={(e) => setRazorpaySecret(e.target.value)}
                placeholder="Enter API secret"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1E1E1E',
                  border: '1px solid #444444',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRazorpayConfig(false)}
                style={{
                  padding: '10px 20px',
                  background: '#444444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!razorpayKey || !razorpayKey.trim()) {
                    alert('Please enter API Key');
                    return;
                  }
                  if (!razorpaySecret || !razorpaySecret.trim()) {
                    alert('Please enter API Secret');
                    return;
                  }
                  
                  try {
                    const existingConfigs = JSON.parse(localStorage.getItem('cafeos_gateway_configs') || '{}');
                    existingConfigs.razorpay = {
                      enabled: true,
                      testMode: true,
                      apiKey: razorpayKey.trim(),
                      apiSecret: razorpaySecret.trim()
                    };
                    localStorage.setItem('cafeos_gateway_configs', JSON.stringify(existingConfigs));
                    console.log('[TopChrome] Razorpay config saved:', existingConfigs.razorpay);
                    setShowRazorpayConfig(false);
                    alert('Razorpay configuration saved successfully!');
                  } catch (error) {
                    console.error('[TopChrome] Failed to save Razorpay config:', error);
                    alert('Failed to save configuration. Please try again.');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#0D9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
