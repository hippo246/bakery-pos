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
  onEditPrice,
}) {
  const [showRazorpayConfig, setShowRazorpayConfig] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');

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
    background: 'var(--cafe-bg-elevated)',
    borderBottom: '1px solid var(--cafe-border)',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    fontSize: '12px',
    color: 'var(--cafe-text-primary)',
    height: '45px',
  };

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    color: 'var(--cafe-text-secondary)',
  };

  const checkboxStyle = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: 'var(--cafe-accent)',
  };

  const tickerStyle = {
    background: 'var(--cafe-bg-surface)',
    padding: '6px 12px',
    borderRadius: 'var(--cafe-radius-sm)',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--cafe-text-primary)',
    whiteSpace: 'nowrap',
    border: '1px solid var(--cafe-border-light)',
  };

  return (
    <div style={chromeStyle}>
      {/* Terminal ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '700', color: 'var(--cafe-accent)' }}>TERMINAL:</span>
        <span style={{ fontWeight: '700', color: 'var(--cafe-text-primary)', fontSize: '13px' }}>{terminalId}</span>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--cafe-border)' }} />

      {/* Order Type Selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--cafe-text-tertiary)' }}>ORDER TYPE:</span>
        <button
          onClick={() => onOrderTypeChange?.('walk-in')}
          style={{
            padding: '4px 12px',
            background: orderType === 'walk-in' ? 'var(--cafe-accent)' : 'var(--cafe-bg-surface)',
            color: orderType === 'walk-in' ? '#fff' : 'var(--cafe-text-secondary)',
            border: orderType === 'walk-in' ? '1px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
            borderRadius: 'var(--cafe-radius-sm)',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (orderType !== 'walk-in') {
              e.target.style.background = 'var(--cafe-bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (orderType !== 'walk-in') {
              e.target.style.background = 'var(--cafe-bg-surface)';
            }
          }}
        >
          WALK-IN
        </button>
        <button
          onClick={() => onOrderTypeChange?.('table')}
          style={{
            padding: '4px 12px',
            background: orderType === 'table' ? 'var(--cafe-accent)' : 'var(--cafe-bg-surface)',
            color: orderType === 'table' ? '#fff' : 'var(--cafe-text-secondary)',
            border: orderType === 'table' ? '1px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
            borderRadius: 'var(--cafe-radius-sm)',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (orderType !== 'table') {
              e.target.style.background = 'var(--cafe-bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (orderType !== 'table') {
              e.target.style.background = 'var(--cafe-bg-surface)';
            }
          }}
        >
          TABLE
        </button>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--cafe-border)' }} />

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
            onEditPrice?.();
          }}
          style={{
            padding: '6px 12px',
            background: 'var(--cafe-info)',
            color: '#FFF',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            marginLeft: '8px',
          }}
        >
          Edit Price
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Razorpay config button clicked');
            setShowRazorpayConfig(true);
          }}
          style={{
            padding: '4px 12px',
            background: 'var(--cafe-success)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
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
            background: 'var(--cafe-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
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
              background: 'var(--cafe-bg-card)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 'var(--cafe-radius-md)',
              padding: '8px',
              minWidth: '200px',
              zIndex: 1000,
              boxShadow: 'var(--cafe-shadow-lg)'
            }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              <button
                onClick={() => { onSplitBill?.(); setShowMoreMenu(false); }}
                style={{
                  padding: '8px',
                  background: 'var(--cafe-info)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-purple)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-danger)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-warning)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-success)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-1)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-info)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-purple)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-2)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-3)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-success)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-4)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-5)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--classic-pos-menu-btn-6)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-danger)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-purple)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  background: 'var(--cafe-danger)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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

      <div style={{ width: 1, height: 24, background: 'var(--cafe-border)' }} />

      {/* Customer & Table Info */}
      <div style={{ ...tickerStyle, marginRight: '8px' }}>
        {customer && <span style={{ marginRight: '12px' }}>CUST: {customer}</span>}
        {table && <span style={{ marginRight: '12px' }}>TABLE: {table}</span>}
        {server && <span style={{ marginRight: '12px' }}>SERVER: {server}</span>}
        {!table && orderType === 'table' && <span style={{ color: 'var(--cafe-danger)' }}>NO TABLE SELECTED</span>}
      </div>

      {/* Held Orders Count */}
      {heldOrdersCount > 0 && (
        <div
          style={{ ...tickerStyle, background: 'var(--cafe-danger-bg)', color: 'var(--cafe-danger)', border: '1px solid var(--cafe-danger-border)', marginRight: '8px', cursor: 'pointer', userSelect: 'none' }}
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
          background: 'rgba(0, 0, 0, 0.6)',
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
            background: 'var(--cafe-bg-card)',
            border: '1px solid var(--cafe-border)',
            borderRadius: 'var(--cafe-radius-lg)',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: 'var(--cafe-shadow-lg)',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}>
            <h3 style={{
              color: 'var(--cafe-text-primary)',
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 20px',
            }}>
              Razorpay Configuration
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: 'var(--cafe-text-secondary)',
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
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 'var(--cafe-radius-sm)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
            
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRazorpayConfig(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-secondary)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 'var(--cafe-radius-sm)',
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
                  
                  try {
                    const existingConfigs = JSON.parse(localStorage.getItem('cafeos_gateway_configs') || '{}');
                    existingConfigs.razorpay = {
                      enabled: true,
                      testMode: true,
                      apiKey: razorpayKey.trim()
                    };
                    localStorage.setItem('cafeos_gateway_configs', JSON.stringify(existingConfigs));
                    setShowRazorpayConfig(false);
                    alert('Razorpay configuration saved successfully!');
                  } catch (error) {
                    console.error('[TopChrome] Failed to save Razorpay config:', error);
                    alert('Failed to save configuration. Please try again.');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--cafe-success)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
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
