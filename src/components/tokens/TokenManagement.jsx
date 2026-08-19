import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TokenManagement({ orders, onNavigate }) {
  const [displayMode, setDisplayMode] = useState('display'); // 'display' or 'history'
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [selectedToken, setSelectedToken] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter orders that have tokens
  const tokens = orders.filter(order => order.token).sort((a, b) => {
    // Sort by token number (extract numeric part)
    const aNum = parseInt(a.token.replace('T-', ''));
    const bNum = parseInt(b.token.replace('T-', ''));
    return aNum - bNum;
  });

  // Statistics
  const pendingTokens = tokens.filter(t => t.status === 'PENDING').length;
  const preparingTokens = tokens.filter(t => t.status === 'PREPARING').length;
  const readyTokens = tokens.filter(t => t.status === 'READY').length;
  const completedToday = tokens.filter(t => t.status === 'COMPLETED' && new Date(t.createdAt).toDateString() === new Date().toDateString()).length;

  const updateOrderStatus = (orderId, newStatus) => {
    // This would need to be passed in as a prop or handled through a state management system
    console.log('Update order status:', orderId, newStatus);
  };

  const handleViewToken = (token) => {
    setSelectedToken(token);
    setShowModal(true);
  };

  const handlePrintToken = (token) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('🥐 BakeryPOS', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('TOKEN RECEIPT', 105, 30, { align: 'center' });
    
    // Token Info
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text(token.token, 105, 50, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Status: ${token.status}`, 105, 60, { align: 'center' });
    
    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 70, 190, 70);
    
    // Customer Info
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Customer: ${token.customerName || 'Walk-in'}`, 20, 85);
    doc.text(`Date: ${new Date(token.createdAt).toLocaleString()}`, 20, 95);
    if (token.tableNumber) {
      doc.text(`Table: ${token.tableNumber}`, 20, 105);
    }
    
    // Order Items
    if (token.items && token.items.length > 0) {
      const itemsData = token.items.map(item => [
        item.name,
        item.qty || 1,
        `₹${(item.price || 0).toFixed(2)}`,
        `₹${((item.price || 0) * (item.qty || 1)).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 115,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: itemsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });
    }
    
    // Total
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 115;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ₹${(token.total || 0).toFixed(2)}`, 105, finalY, { align: 'center' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your order!', 105, finalY + 20, { align: 'center' });
    
    doc.save(`token_${token.token}.pdf`);
  };

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
              Token Display
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Active order tokens
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('orders')}
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
      <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: '#f9fafb' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'flex',
          gap: screenSize === 'small' ? '12px' : '16px',
          marginBottom: screenSize === 'small' ? '16px' : '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: screenSize === 'small' ? '150px' : '200px',
            background: '#ffffff',
            padding: screenSize === 'small' ? '16px' : '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#6b7280', marginBottom: '8px' }}>
              Pending
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#f59e0b' }}>
              {pendingTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: screenSize === 'small' ? '150px' : '200px',
            background: '#ffffff',
            padding: screenSize === 'small' ? '16px' : '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#6b7280', marginBottom: '8px' }}>
              Preparing
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#3b82f6' }}>
              {preparingTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: screenSize === 'small' ? '150px' : '200px',
            background: '#ffffff',
            padding: screenSize === 'small' ? '16px' : '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#6b7280', marginBottom: '8px' }}>
              Ready
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#10b981' }}>
              {readyTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: screenSize === 'small' ? '150px' : '200px',
            background: '#ffffff',
            padding: screenSize === 'small' ? '16px' : '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#6b7280', marginBottom: '8px' }}>
              Completed Today
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#8b5cf6' }}>
              {completedToday}
            </div>
          </div>
        </div>

        {/* Token Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: screenSize === 'small' ? '16px' : '20px'
        }}>
          {tokens.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              No active tokens
            </div>
          ) : (
            tokens.map(token => (
              <div
                key={token.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: screenSize === 'small' ? '16px' : '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Token Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: screenSize === 'small' ? '12px' : '16px'
                }}>
                  <div style={{
                    width: screenSize === 'small' ? '50px' : '60px',
                    height: screenSize === 'small' ? '50px' : '60px',
                    background: token.status === 'PENDING' ? '#fef3c7' : token.status === 'PREPARING' ? '#dbeafe' : token.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: screenSize === 'small' ? '20px' : '24px',
                    fontWeight: '700',
                    color: token.status === 'PENDING' ? '#92400e' : token.status === 'PREPARING' ? '#1e40af' : token.status === 'READY' ? '#065f46' : '#374151'
                  }}>
                    {token.token}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: screenSize === 'small' ? '11px' : '12px',
                    fontWeight: '600',
                    background: token.status === 'PENDING' ? '#fef3c7' : token.status === 'PREPARING' ? '#dbeafe' : token.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                    color: token.status === 'PENDING' ? '#92400e' : token.status === 'PREPARING' ? '#1e40af' : token.status === 'READY' ? '#065f46' : '#374151'
                  }}>
                    {token.status}
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: screenSize === 'small' ? '12px' : '16px' }}>
                  <div style={{
                    fontSize: screenSize === 'small' ? '14px' : '15px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    {token.customerName || 'Walk-in'}
                  </div>
                  {token.tableNumber && (
                    <div style={{
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      color: '#6b7280'
                    }}>
                      Table: {token.tableNumber}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div style={{
                  padding: screenSize === 'small' ? '10px' : '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: screenSize === 'small' ? '12px' : '16px'
                }}>
                  <div style={{
                    fontSize: screenSize === 'small' ? '12px' : '13px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {token.items?.length || 0} items
                  </div>
                  <div style={{
                    fontSize: screenSize === 'small' ? '16px' : '18px',
                    fontWeight: '700',
                    color: '#111827'
                  }}>
                    ₹{token.total?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Time */}
                <div style={{
                  fontSize: screenSize === 'small' ? '11px' : '12px',
                  color: '#6b7280',
                  marginBottom: screenSize === 'small' ? '12px' : '16px'
                }}>
                  {new Date(token.createdAt).toLocaleTimeString()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewToken(token);
                    }}
                    style={{
                      flex: 1,
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintToken(token);
                    }}
                    style={{
                      flex: 1,
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#059669'}
                    onMouseLeave={(e) => e.target.style.background = '#10b981'}
                  >
                    Print
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Token Detail Modal */}
      {showModal && selectedToken && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Token Details
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {selectedToken.token}
              </div>
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block',
                background: selectedToken.status === 'PENDING' ? '#fef3c7' : selectedToken.status === 'PREPARING' ? '#dbeafe' : selectedToken.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                color: selectedToken.status === 'PENDING' ? '#92400e' : selectedToken.status === 'PREPARING' ? '#1e40af' : selectedToken.status === 'READY' ? '#065f46' : '#374151'
              }}>
                {selectedToken.status}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Customer
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {selectedToken.customerName || 'Walk-in'}
              </div>
            </div>

            {selectedToken.tableNumber && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Table
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  {selectedToken.tableNumber}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Order Time
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {new Date(selectedToken.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Order Items
              </div>
              {selectedToken.items && selectedToken.items.length > 0 ? (
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
                  {selectedToken.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: index < selectedToken.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Qty: {item.qty || 1} × ₹{(item.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        ₹{((item.price || 0) * (item.qty || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  No items
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                Total
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                ₹{(selectedToken.total || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handlePrintToken(selectedToken)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
