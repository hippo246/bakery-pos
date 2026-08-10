/**
 * Fast Food POS — Top Chrome Bar
 *
 * Dark premium header: order counter, table/token display,
 * customer name input, terminal badge, toggle pills, live clock.
 */

import React, { useState, useEffect } from 'react';

export default function TopChrome({
  licenseInfo      = 'CafeOS',
  version          = 'v2.0',
  customerName     = '',
  onCustomerNameChange,
  terminalId       = 'HQ-PC01',
  speechEnabled    = false,
  receiptPrintEnabled = false,
  wholeSaleEnabled = false,
  onSpeechToggle,
  onReceiptPrintToggle,
  onWholeSaleToggle,
  orderCount       = 0,
}) {
  const [time, setTime] = useState(new Date());
  const [showRazorpayConfig, setShowRazorpayConfig] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const Toggle = ({ label, checked, onChange, color = '#10b981' }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange?.(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? color : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s',
          border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 17 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>
        {label}
      </span>
    </label>
  );

  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      borderBottom: '1px solid var(--cafe-border)',
      padding: '0 20px',
      height: 54,
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexShrink: 0,
      boxShadow: 'var(--cafe-shadow-sm)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--cafe-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: 'var(--cafe-shadow-glow)',
        }}>🍔</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cafe-text-primary)', letterSpacing: 1, lineHeight: 1 }}>
            {licenseInfo}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)', letterSpacing: 0.5 }}>{version}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: 'var(--cafe-border)' }} />

      {/* Order counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{
          background: 'var(--cafe-accent)', color: '#fff', borderRadius: 'var(--cafe-radius-sm)',
          fontSize: 10, fontWeight: 800, padding: '2px 8px', letterSpacing: 0.5,
        }}>ORDERS</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--cafe-text-primary)', minWidth: 30, textAlign: 'center' }}>
          {orderCount}
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: 'var(--cafe-border)' }} />

      {/* Terminal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cafe-success)', boxShadow: '0 0 6px var(--cafe-success)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cafe-text-tertiary)' }}>Terminal</span>
        <span style={{
          fontSize: 11, fontWeight: 800, color: 'var(--cafe-text-primary)',
          background: 'var(--cafe-bg-surface)', padding: '3px 8px', borderRadius: 'var(--cafe-radius-sm)',
          border: '1px solid var(--cafe-border-light)',
        }}>{terminalId}</span>
      </div>

      <div style={{ width: 1, height: 30, background: 'var(--cafe-border)' }} />

      {/* Customer name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cafe-text-tertiary)', whiteSpace: 'nowrap' }}>
          👤 Customer
        </span>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange?.(e.target.value)}
          placeholder="Name / Token"
          style={{
            padding: '5px 12px',
            background: 'var(--cafe-bg-surface)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-sm)', color: 'var(--cafe-text-primary)', fontSize: 13, fontWeight: 600,
            width: 150, outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--cafe-accent)'; e.target.style.boxShadow = '0 0 0 2px var(--cafe-accent-bg)'; }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--cafe-border-light)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Toggle label="Speech"  checked={speechEnabled}      onChange={onSpeechToggle}      color="var(--cafe-info)" />
        <Toggle label="Receipt" checked={receiptPrintEnabled} onChange={onReceiptPrintToggle} color="var(--cafe-success)" />
        <Toggle label="Wholesale" checked={wholeSaleEnabled}  onChange={onWholeSaleToggle}   color="var(--cafe-warning)" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Razorpay config button clicked');
            setShowRazorpayConfig(true);
          }}
          style={{
            padding: '6px 14px',
            background: 'var(--cafe-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: 'var(--cafe-shadow-glow)',
          }}
        >
          Razorpay Config
        </button>
      </div>

      <div style={{ width: 1, height: 30, background: 'var(--cafe-border)' }} />

      {/* Clock */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cafe-text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}>
          {fmt(time)}
        </div>
        <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)', letterSpacing: 0.5 }}>
          {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

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
            padding: '28px',
            width: '420px',
            maxWidth: '90%',
            boxShadow: 'var(--cafe-shadow-lg)',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}>
            <h3 style={{
              color: 'var(--cafe-text-primary)',
              fontSize: '20px',
              fontWeight: '800',
              margin: '0 0 24px',
              letterSpacing: 0.5,
            }}>
              Razorpay Configuration
            </h3>
            
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                color: 'var(--cafe-text-secondary)',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '8px',
                letterSpacing: 0.5,
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
                  padding: '12px',
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 'var(--cafe-radius-sm)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--cafe-accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--cafe-border)'}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: 'var(--cafe-text-secondary)',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '8px',
                letterSpacing: 0.5,
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
                  padding: '12px',
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 'var(--cafe-radius-sm)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--cafe-accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--cafe-border)'}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRazorpayConfig(false)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-secondary)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 'var(--cafe-radius-sm)',
                  fontSize: '13px',
                  fontWeight: '700',
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
                  padding: '12px 24px',
                  background: 'var(--cafe-accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-sm)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: 'var(--cafe-shadow-glow)',
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
