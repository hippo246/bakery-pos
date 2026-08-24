import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TokenManagement({ orders, setOrders, onNavigate, darkMode = true }) {
  const [displayMode, setDisplayMode] = useState('display'); // 'display' or 'history'
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [selectedToken, setSelectedToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [qrOrders, setQROrders] = useState([]);

  // Poll for QR orders from localStorage
  useEffect(() => {
    const loadQROrders = () => {
      try {
        const storedOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        setQROrders(storedOrders);
      } catch (error) {
        console.error('Error loading QR orders:', error);
      }
    };

    loadQROrders();
    const interval = setInterval(loadQROrders, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Filter orders that have tokens (combine regular orders with QR orders)
  const allOrders = [...orders, ...qrOrders];
  const tokens = allOrders.filter(order => order.token).sort((a, b) => {
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
    if (setOrders) {
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        return updatedOrders;
      });
    }
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
        item.name + (item.isCustom ? ' (Custom)' : ''),
        item.qty || item.quantity || 1,
        `₹${(item.price || 0).toFixed(2)}`,
        `₹${((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 115,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: itemsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });

      // Add notes below the table
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 115;
      token.items.forEach(item => {
        if (item.notes) {
          doc.setFontSize(9);
          doc.setTextColor(item.noteType === 'allergy' ? 220 : 100, item.noteType === 'allergy' ? 38 : 100, item.noteType === 'allergy' ? 38 : 100);
          const notePrefix = item.noteType === 'allergy' ? '⚠️ ALLERGY: ' : '📝 Note: ';
          doc.text(`${notePrefix}${item.notes}`, 20, finalY);
          finalY += 7;
        }
        if (item.baseItemName) {
          doc.setFontSize(8);
          doc.setTextColor(146, 64, 14);
          doc.text(`Base: ${item.baseItemName}`, 20, finalY);
          finalY += 5;
        }
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
      background: darkMode ? '#1a1a2e' : '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: darkMode ? '#14142a' : '#f1f5f9' }}>
        {/* Header */}
        <div style={{
          marginBottom: screenSize === 'small' ? '20px' : '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{
              fontSize: screenSize === 'small' ? '24px' : '32px',
              fontWeight: '700',
              color: darkMode ? '#ffffff' : '#111827',
              margin: 0,
              marginBottom: '4px'
            }}>
              🎫 Token Management
            </h1>
            <p style={{
              fontSize: screenSize === 'small' ? '13px' : '14px',
              color: darkMode ? '#8b8b9e' : '#8b8b9e',
              margin: 0
            }}>
              Manage and track customer tokens
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: screenSize === 'small' ? '12px' : '20px',
          marginBottom: screenSize === 'small' ? '20px' : '28px'
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              ⏳ Pending
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#f59e0b' }}>
              {pendingTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              👨‍🍳 Preparing
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#3b82f6' }}>
              {preparingTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              ✅ Ready
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#10b981' }}>
              {readyTokens}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            padding: screenSize === 'small' ? '16px' : '24px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              📊 Completed Today
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#8b5cf6' }}>
              {completedToday}
            </div>
          </div>
        </div>

        {/* Token Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: screenSize === 'small' ? '16px' : '24px'
        }}>
          {tokens.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '60px 40px',
              textAlign: 'center',
              background: darkMode ? '#252538' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '8px' }}>
                No active tokens
              </div>
              <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>
                Tokens will appear here when orders are placed
              </div>
            </div>
          ) : (
            tokens.map(token => (
              <div
                key={token.id}
                style={{
                  background: darkMode ? '#252538' : '#ffffff',
                  borderRadius: '16px',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                  boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                  padding: screenSize === 'small' ? '20px' : '24px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: token.status === 'PENDING' ? '#fef3c7' : 
                             token.status === 'PREPARING' ? '#dbeafe' : 
                             token.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                  color: token.status === 'PENDING' ? '#92400e' : 
                         token.status === 'PREPARING' ? '#1e40af' : 
                         token.status === 'READY' ? '#065f46' : '#e0e0e0'
                }}>
                  {token.status}
                </div>

                {/* Token Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: screenSize === 'small' ? '16px' : '20px'
                }}>
                  <div style={{
                    width: screenSize === 'small' ? '70px' : '80px',
                    height: screenSize === 'small' ? '70px' : '80px',
                    background: token.status === 'PENDING' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                               token.status === 'PREPARING' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 
                               token.status === 'READY' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                               'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    <span style={{
                      fontSize: screenSize === 'small' ? '20px' : '24px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {token.token}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: screenSize === 'small' ? '12px' : '16px' }}>
                  <div style={{
                    fontSize: screenSize === 'small' ? '14px' : '16px',
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#111827',
                    marginBottom: '4px'
                  }}>
                    {token.customerName || 'Walk-in'}
                  </div>
                  {token.tableNumber && (
                    <div style={{
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      color: darkMode ? '#8b8b9e' : '#8b8b9e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      🪑 Table {token.tableNumber}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div style={{
                  padding: screenSize === 'small' ? '12px' : '16px',
                  background: darkMode ? '#1a1a2e' : '#f9fafb',
                  borderRadius: '12px',
                  marginBottom: screenSize === 'small' ? '12px' : '16px'
                }}>
                  <div style={{
                    fontSize: screenSize === 'small' ? '12px' : '13px',
                    color: darkMode ? '#8b8b9e' : '#8b8b9e',
                    marginBottom: '4px'
                  }}>
                    {token.items?.length || 0} items
                  </div>
                  <div style={{
                    fontSize: screenSize === 'small' ? '18px' : '20px',
                    fontWeight: '700',
                    color: darkMode ? '#ffffff' : '#111827'
                  }}>
                    ₹{token.total?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Time */}
                <div style={{
                  fontSize: screenSize === 'small' ? '11px' : '12px',
                  color: darkMode ? '#8b8b9e' : '#8b8b9e',
                  marginBottom: screenSize === 'small' ? '12px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🕐 {new Date(token.createdAt).toLocaleTimeString()}
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
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintToken(token);
                    }}
                    style={{
                      flex: 1,
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#059669';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#10b981';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    🖨️ Print
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
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '20px',
            maxWidth: '550px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: darkMode ? '#ffffff' : '#111827',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  🎫 Token {selectedToken.token}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: darkMode ? '#8b8b9e' : '#8b8b9e',
                  margin: 0
                }}>
                  {selectedToken.status}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: darkMode ? '#1a1a2e' : '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = darkMode ? '#2d2d48' : '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#f3f4f6'}
              >
                ✕
              </button>
            </div>

            {/* Token Number */}
            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: darkMode ? '#1a1a2e' : '#f3f4f6',
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
                Token Number
              </div>
              <div style={{ fontSize: '42px', fontWeight: '700', color: '#3b82f6' }}>
                {selectedToken.token}
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: selectedToken.status === 'PENDING' ? '#f59e0b' : 
                       selectedToken.status === 'PREPARING' ? '#3b82f6' : 
                       selectedToken.status === 'READY' ? '#10b981' : '#8b5cf6',
                marginTop: '12px',
                padding: '6px 16px',
                borderRadius: '20px',
                background: selectedToken.status === 'PENDING' ? '#fef3c7' : 
                           selectedToken.status === 'PREPARING' ? '#dbeafe' : 
                           selectedToken.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                display: 'inline-block'
              }}>
                {selectedToken.status}
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '6px', fontWeight: '500' }}>
                👤 Customer
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
                {selectedToken.customerName || 'Walk-in'}
              </div>
              {selectedToken.customerPhone && (
                <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>
                  📞 {selectedToken.customerPhone}
                </div>
              )}
            </div>

            {/* Table */}
            {selectedToken.tableNumber && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '6px', fontWeight: '500' }}>
                  🪑 Table
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
                  {selectedToken.tableNumber}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '12px', fontWeight: '500' }}>
                📦 Order Items
              </div>
              {selectedToken.items && selectedToken.items.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '16px',
                    background: darkMode ? '#1a1a2e' : '#f9fafb',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', fontSize: '15px' }}>
                        {item.name}
                        {item.isCustom && (
                          <span style={{ 
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            Custom
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginTop: '4px' }}>
                          📝 {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                      <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
                        {item.qty || item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>
                        ₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              padding: '20px',
              background: darkMode ? '#1a1a2e' : '#f3f4f6',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
                Total
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                ₹{selectedToken.total?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handlePrintToken(selectedToken)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🖨️ Print Token
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: darkMode ? '#2d2d44' : '#e5e7eb',
                  color: darkMode ? '#ffffff' : '#111827',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = darkMode ? '#2d2d44' : '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
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
