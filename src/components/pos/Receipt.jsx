import React from 'react';

export default function Receipt({
  order,
  onClose,
  onPrint,
  onEmail,
  screenSize = 'large',
  darkMode = true
}) {
  if (!order) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: screenSize === 'small' ? '0' : '16px'
    }}>
      <div style={{
        background: darkMode ? '#0a0a0a' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '12px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '400px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            {order.storeName || 'Bakery POS'}
          </div>
          <div style={{ fontSize: '11px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            {order.storeAddress || ''}
          </div>
        </div>

        <div style={{ borderBottom: `1px dashed ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Order #:</span>
            <span>{order.invoiceNumber || order.id?.slice(-6)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Date:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cashier:</span>
            <span>{order.cashierName || 'Staff'}</span>
          </div>
        </div>

        <div style={{ borderBottom: `1px dashed ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '12px', marginBottom: '12px' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.name} x{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Subtotal:</span>
            <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Discount {order.discountPercentage ? `(${order.discountPercentage}%)` : ''}:</span>
              <span>-₹{order.discount?.toFixed(2) || '0.00'}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>GST:</span>
            <span>₹{order.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', paddingTop: '8px', borderTop: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
            <span>TOTAL:</span>
            <span>₹{order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '11px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
          <div>Payment: {order.paymentMethod}</div>
          <div>Status: {order.status}</div>
          {order.tableNumber && <div>Table: {order.tableNumber}</div>}
          {order.diningOption && <div>Type: {order.diningOption.replace('_', ' ')}</div>}
        </div>

        {/* Dynamic Pay-by-QR Code for Table-Side Receipt */}
        <div style={{
          margin: '12px 0',
          padding: '10px',
          border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: darkMode ? '#111' : '#f9fafb'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: darkMode ? '#60a5fa' : '#2563eb', marginBottom: '6px' }}>
            📱 PAY TABLE-SIDE VIA UPI / QR CODE
          </div>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=upi://pay?pa=bakerypos@upi%26pn=BakeryPOS%26am=${order.total || 0}%26cu=INR`}
            alt="Pay by QR"
            style={{ width: '100px', height: '100px', borderRadius: '4px' }}
          />
          <div style={{ fontSize: '9px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>
            Scan with GPay / PhonePe / Paytm to Pay ₹{(order.total || 0).toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPrint}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#4f46e5' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🖨️ Print
          </button>
          <button
            onClick={onEmail}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#059669' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📧 Email
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#222222' : '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
